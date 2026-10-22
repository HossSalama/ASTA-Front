import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    TbClock,
    TbHourglass,
    TbWorld,
    TbBook,
    TbCalendar,
    TbPointFilled,
} from 'react-icons/tb'
import Container from '@/components/shared/Container'
import Breadcrumbs from '@/components/shared/catalog/Breadcrumbs'
import Rating from '@/components/shared/catalog/Rating'
import SaveCourseButton from '@/components/shared/catalog/SaveCourseButton'
import CourseThumbnail from '@/components/shared/catalog/CourseThumbnail'
import CourseCard from '@/components/shared/catalog/CourseCard'
import CourseReviews from '@/components/shared/catalog/CourseReviews'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useAuth } from '@/auth'
import { apiEnrollInCourse } from '@/services/CatalogService'
import Curriculum, {
    flattenItems,
} from '@/components/shared/catalog/Curriculum'
import StateView, {
    CatalogErrorState,
} from '@/components/shared/catalog/StateView'
import PreviewPlayerModal from '@/components/shared/course/PreviewPlayerModal'
import LockedContentModal from '@/components/shared/course/LockedContentModal'
import EnrollmentSuccessModal from '@/components/shared/course/EnrollmentSuccessModal'
import PaymentRequestModal from '@/components/shared/course/PaymentRequestModal'
import { useCatalogCourse, useCatalogCourses } from '@/utils/hooks/useCatalog'
import { useCourseProgress } from '@/utils/hooks/useCourseProgress'
import { resolveContinueLearningTarget } from '@/utils/courseProgressHelpers'
import {
    useEnrollment,
    useEnrollmentStore,
    progressPercent,
} from '@/store/enrollmentStore'
import {
    categoryHref,
    formatCount,
    formatDate,
    formatDuration,
    formatPrice,
    instructorHref,
    localizedName,
} from '@/utils/catalog'
import {
    CourseSectionItemDto,
    AdminCourseContentItemDto,
    isLiveCourse,
    getCourseStartDate,
} from '@/@types/courseContent'

const CourseDetailsSkeleton = () => (
    <Container className="py-10">
        <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded bg-surface-alt" />
            <div className="h-9 w-3/4 rounded bg-surface-alt" />
            <div className="h-4 w-2/3 rounded bg-surface-alt" />
            <div className="h-64 rounded-lg bg-surface-alt" />
        </div>
    </Container>
)

const Fact = ({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof TbClock
    label: string
    value: string
}) => (
    <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 shrink-0 text-text-muted" aria-hidden="true" />
        <div>
            <dt className="text-xs text-text-secondary">{label}</dt>
            <dd className="text-sm font-semibold text-text-primary">{value}</dd>
        </div>
    </div>
)

const CourseDetails = () => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const navigate = useNavigate()
    const { courseId } = useParams<{ courseId: string }>()
    const id = Number(courseId)

    const { course, isLoading, error, mutate } = useCatalogCourse(
        Number.isFinite(id) ? id : undefined,
    )
    const { authenticated } = useAuth()
    const enrollment = useEnrollment(id)
    const enroll = useEnrollmentStore((state) => state.enroll)

    const isEnrolled =
        authenticated && (Boolean(course?.isEnrolled) || Boolean(enrollment))

    const { courseProgress } = useCourseProgress(
        isEnrolled && Number.isFinite(id) ? id : undefined,
    )

    const sections = useMemo(
        () => (Array.isArray(course?.sections) ? course.sections : []),
        [course?.sections],
    )
    const items = useMemo(() => flattenItems(sections), [sections])

    const progress =
        courseProgress?.progressPercentage !== undefined &&
        courseProgress.progressPercentage !== null
            ? Math.round(courseProgress.progressPercentage * 100) / 100
            : progressPercent(enrollment, items.length)

    const completedItemIds = useMemo(() => {
        if (courseProgress?.sections) {
            const ids: number[] = []
            courseProgress.sections.forEach((s) => {
                s.items?.forEach((item) => {
                    if (item.isCompleted) {
                        ids.push(item.id)
                    }
                })
            })
            return ids
        }
        return enrollment?.completedItemIds || []
    }, [courseProgress?.sections, enrollment?.completedItemIds])

    const requirements = useMemo(
        () => (Array.isArray(course?.requirements) ? course.requirements : []),
        [course?.requirements],
    )
    const targetJobs = useMemo(
        () => (Array.isArray(course?.targetJobs) ? course.targetJobs : []),
        [course?.targetJobs],
    )

    const { courses: related } = useCatalogCourses(
        course?.category?.id
            ? {
                  pageNumber: 1,
                  pageSize: 4,
                  categoryId: course.category.id,
              }
            : undefined,
    )

    const relatedCourses = useMemo(
        () =>
            (Array.isArray(related) ? related : []).filter(
                (item) => item.id !== course?.id,
            ),
        [related, course?.id],
    )

    const [enrolling, setEnrolling] = useState(false)

    // Preview Player Modal State
    const [previewModalOpen, setPreviewModalOpen] = useState(false)
    const [previewItem, setPreviewItem] = useState<CourseSectionItemDto | null>(
        null,
    )

    // Locked Content Modal State
    const [lockedModalOpen, setLockedModalOpen] = useState(false)
    const [selectedLockedItem, setSelectedLockedItem] = useState<
        CourseSectionItemDto | AdminCourseContentItemDto | null
    >(null)

    // Enrollment Success Modal State
    const [successModalOpen, setSuccessModalOpen] = useState(false)
    const [enrolledTargetItem, setEnrolledTargetItem] = useState<
        CourseSectionItemDto | AdminCourseContentItemDto | null
    >(null)

    // Payment Request Modal State
    const [paymentModalOpen, setPaymentModalOpen] = useState(false)

    if (error) {
        return (
            <Container className="py-16">
                <CatalogErrorState onRetry={() => void mutate()} />
            </Container>
        )
    }

    if (isLoading) {
        return <CourseDetailsSkeleton />
    }

    if (!course) {
        return (
            <Container className="py-16">
                <StateView
                    tone="noResults"
                    title={t('course.missingTitle', 'This course is unavailable')}
                    description={t(
                        'course.missingBody',
                        'It may have been unpublished or the link is out of date.',
                    )}
                    action={{
                        label: t('course.browseAll', 'Browse all courses'),
                        to: '/courses',
                    }}
                />
            </Container>
        )
    }

    const hasActivePaymentRequest =
        authenticated && Boolean(course.hasActivePaymentRequest)
    const category = localizedName(course.category, lang)
    const courseIsLive = isLiveCourse(course.deliveryType, course.sections)
    const liveStartDate = getCourseStartDate(course)

    const startAction = async (
        targetItem?: CourseSectionItemDto | AdminCourseContentItemDto | null,
    ) => {
        if (isEnrolled) {
            let destItemId = targetItem?.id
            if (!destItemId && courseProgress) {
                const target = resolveContinueLearningTarget(courseProgress)
                destItemId = target?.targetItemId
            }
            navigate(
                destItemId
                    ? `/learn/${course.id}?item=${destItemId}`
                    : `/learn/${course.id}`,
            )
            return
        }

        if (!authenticated) {
            navigate(`/sign-in?redirectUrl=/courses/${course.id}`)
            return
        }

        // Paid courses require manual payment submission
        if (course.price && course.price > 0) {
            setLockedModalOpen(false)
            setPreviewModalOpen(false)
            setPaymentModalOpen(true)
            return
        }

        setEnrolling(true)
        try {
            const res = await apiEnrollInCourse(course.id)
            if (res && !res.status) {
                throw new Error(
                    res.message ||
                        t('course.enrollError', 'Failed to enroll in course.'),
                )
            }
            enroll(course.id)
            await mutate()
            setLockedModalOpen(false)
            setPreviewModalOpen(false)
            setEnrolledTargetItem(targetItem || null)
            setSuccessModalOpen(true)
        } catch (err: unknown) {
            const apiError = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            const msg =
                apiError?.response?.data?.message ||
                apiError?.message ||
                t('course.enrollError', 'Failed to enroll in course.')
            toast.push(
                <Notification type="danger" title={t('common.error', 'Error')}>
                    {msg}
                </Notification>,
            )
        } finally {
            setEnrolling(false)
        }
    }

    const handleCurriculumItemSelect = (
        item: CourseSectionItemDto | AdminCourseContentItemDto,
    ) => {
        if (isEnrolled) {
            navigate(`/learn/${course.id}?item=${item.id}`)
            return
        }

        if (item.isPreview) {
            setPreviewItem(item as CourseSectionItemDto)
            setPreviewModalOpen(true)
            return
        }

        // Open locked content modal to allow user to decide whether to enroll
        setSelectedLockedItem(item)
        setLockedModalOpen(true)
    }

    const enrollPanel = (
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="space-y-4 p-5">
                {isEnrolled ? (
                    <div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-text-primary">
                                {t('course.yourProgress', 'Your progress')}
                            </span>
                            <span className="text-text-secondary">
                                {progress}%
                            </span>
                        </div>
                        <div
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={t('course.yourProgress', 'Your progress')}
                            className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-alt"
                        >
                            <div
                                className="h-full rounded-full bg-success transition-[width]"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-2xl font-bold tracking-tight text-text-primary">
                        {formatPrice(course.price, lang)}
                    </p>
                )}

                {/* Payment Review in Progress badge — shown when a payment request is pending */}
                {!isEnrolled && hasActivePaymentRequest && (
                    <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                        <TbHourglass className="text-base shrink-0" aria-hidden="true" />
                        {t(
                            'course.paymentPending',
                            'Payment review in progress',
                        )}
                    </div>
                )}

                <button
                    type="button"
                    disabled={enrolling || hasActivePaymentRequest}
                    className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-neutral transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                    onClick={() => void startAction()}
                >
                    {enrolling
                        ? t('course.enrolling', 'Enrolling…')
                        : isEnrolled
                          ? progress > 0
                              ? t('course.continue', 'Continue learning')
                              : t('course.startLearning', 'Start learning')
                          : hasActivePaymentRequest
                            ? t('course.paymentUnderReview', 'Payment under review')
                            : t('course.enroll', 'Enrol in this course')}
                </button>

                <SaveCourseButton
                    courseId={course.id}
                    variant="inline"
                    className="w-full"
                />

                <dl className="space-y-3 border-t border-border pt-4">
                    <Fact
                        icon={TbBook}
                        label={t('course.lessons', 'Lessons')}
                        value={String(items.length)}
                    />
                    <Fact
                        icon={TbClock}
                        label={t('course.duration', 'Duration')}
                        value={formatDuration(course.duration, lang)}
                    />
                    <Fact
                        icon={TbWorld}
                        label={t('course.language', 'Language')}
                        value={course.language || '—'}
                    />
                    {courseIsLive && liveStartDate && (
                        <Fact
                            icon={TbCalendar}
                            label={t('liveSessions.startDate', 'تاريخ البدء')}
                            value={formatDate(liveStartDate, lang) || '—'}
                        />
                    )}
                    <Fact
                        icon={TbCalendar}
                        label={t('course.lastUpdated', 'Last updated')}
                        value={
                            formatDate(course.updatedAt || course.createdAt, lang) ||
                            '—'
                        }
                    />
                </dl>
            </div>
        </div>
    )

    return (
        <>
            {/* Hero — two-column layout with course info + thumbnail */}
            <div className="border-b border-border bg-background-secondary">
                <Container className="py-8 lg:py-14">
                    <Breadcrumbs
                        items={[
                            { label: t('site.nav.home', 'Home'), to: '/' },
                            {
                                label: t('site.nav.courses', 'Courses'),
                                to: '/courses',
                            },
                            ...(course.category && course.category.id
                                ? [
                                      {
                                          label: category || String(course.category.id),
                                          to: categoryHref(course.category.id),
                                      },
                                  ]
                                : []),
                            { label: course.name },
                        ]}
                    />

                    <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-12">
                        {/* Text content */}
                        <div className="min-w-0 flex-1 lg:pe-4">
                            <div className="flex items-center gap-2 flex-wrap">
                                {course.category && course.category.id && category && (
                                    <Link
                                        to={categoryHref(course.category.id)}
                                        className="inline-block rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition-colors hover:border-primary hover:bg-primary-subtle"
                                    >
                                        {category}
                                    </Link>
                                )}
                                {courseIsLive && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                        </span>
                                        {t('liveSessions.liveCourse', 'دورة تدريبية مباشرة')}
                                    </span>
                                )}
                            </div>
                            <h1
                                dir="auto"
                                className="mt-3 text-3xl font-bold leading-tight tracking-tight text-text-primary lg:text-[2.75rem] lg:leading-[1.15]"
                            >
                                {course.name}
                            </h1>
                            <p
                                dir="auto"
                                className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary"
                            >
                                {course.shortDescription}
                            </p>

                            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
                                {course.instructor && (
                                    <Link
                                        to={instructorHref(
                                            course.instructorId ||
                                                course.instructor.id ||
                                                0,
                                        )}
                                        dir="auto"
                                        className="font-semibold text-text-primary underline-offset-4 hover:text-primary hover:underline"
                                    >
                                        {course.instructor.name}
                                    </Link>
                                )}
                                {course.ratingCount > 0 && (
                                    <>
                                        <TbPointFilled
                                            className="text-text-muted"
                                            aria-hidden="true"
                                        />
                                        <span className="inline-flex items-center gap-1.5">
                                            <Rating
                                                value={course.averageRating}
                                                count={course.ratingCount}
                                                showCount={false}
                                                className=""
                                            />
                                            <span>
                                                (
                                                {formatCount(
                                                    course.ratingCount,
                                                    lang,
                                                )}
                                                )
                                            </span>
                                        </span>
                                    </>
                                )}
                                <TbPointFilled
                                    className="text-text-muted"
                                    aria-hidden="true"
                                />
                                <span>{formatDuration(course.duration, lang)}</span>
                            </div>
                        </div>

                        {/* Thumbnail image */}
                        <div className="w-full shrink-0 lg:w-[420px] xl:w-[480px]">
                            <CourseThumbnail
                                eager
                                course={course}
                                className="rounded-xl border border-border shadow-sm"
                            />
                        </div>
                    </div>
                </Container>
            </div>

            <Container className="py-8 lg:py-12">
                <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-12">
                    <div className="min-w-0 space-y-12">
                        {sections.length > 0 && (
                            <section aria-labelledby="curriculum-heading">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h2
                                        id="curriculum-heading"
                                        className="text-xl font-bold tracking-tight text-text-primary"
                                    >
                                        {t('course.curriculum', 'Curriculum')}
                                    </h2>
                                    <p className="text-sm text-text-secondary">
                                        {t('course.curriculumMeta', {
                                            defaultValue:
                                                '{{sections}} sections · {{lessons}} lessons · {{duration}}',
                                            sections: sections.length,
                                            lessons: items.length,
                                            duration: formatDuration(
                                                course.duration,
                                                lang,
                                            ),
                                        })}
                                    </p>
                                </div>
                                <Curriculum
                                    className="mt-4"
                                    sections={sections}
                                    unlocked={isEnrolled}
                                    completedItemIds={completedItemIds}
                                    onSelectItem={handleCurriculumItemSelect}
                                />
                            </section>
                        )}

                        {course.description && (
                            <section aria-labelledby="about-heading">
                                <h2
                                    id="about-heading"
                                    className="text-xl font-bold tracking-tight text-text-primary"
                                >
                                    {t('course.about', 'About this course')}
                                </h2>
                                <div className="mt-3 whitespace-pre-line text-[0.95rem] leading-7 text-text-secondary">
                                    {course.description}
                                </div>
                            </section>
                        )}

                        {requirements.length > 0 && (
                            <section aria-labelledby="requirements-heading">
                                <h2
                                    id="requirements-heading"
                                    className="text-xl font-bold tracking-tight text-text-primary"
                                >
                                    {t('course.requirements', 'Requirements')}
                                </h2>
                                <ul className="mt-3 space-y-2">
                                    {requirements.map((requirement) => (
                                        <li
                                            key={requirement.id}
                                            className="flex items-start gap-2.5 text-sm text-text-secondary"
                                        >
                                            <TbPointFilled
                                                className="mt-1.5 shrink-0 text-xs text-text-muted"
                                                aria-hidden="true"
                                            />
                                            {requirement.description}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {targetJobs.length > 0 && (
                            <section aria-labelledby="target-jobs-heading">
                                <h2
                                    id="target-jobs-heading"
                                    className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-text-primary"
                                >
                                    <span
                                        className="inline-block h-5 w-[3px] rounded-full bg-primary"
                                        aria-hidden="true"
                                    />
                                    {t('course.targetJobs', 'Targeted jobs')}
                                </h2>
                                <ul className="mt-3 flex flex-wrap gap-2">
                                    {targetJobs.map((job) => (
                                        <li
                                            key={job.id}
                                            dir="auto"
                                            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-secondary"
                                        >
                                            {job.title}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        <CourseReviews
                            courseId={course.id}
                            averageRating={course.averageRating}
                            ratingCount={course.ratingCount}
                            ratingBreakdown={course.ratingBreakdown}
                            isEnrolled={isEnrolled}
                            onReviewChange={() => void mutate()}
                        />

                        {course.instructor && (
                            <section
                                aria-labelledby="instructor-heading"
                                className="border-t border-border pt-8"
                            >
                                <h2
                                    id="instructor-heading"
                                    className="text-xl font-bold tracking-tight text-text-primary"
                                >
                                    {t('course.instructor', 'Instructor')}
                                </h2>
                                <div className="mt-4 flex items-start gap-4">
                                    {course.instructor.profileImageUrl ? (
                                        <img
                                            src={
                                                course.instructor
                                                    .profileImageUrl
                                             }
                                            alt=""
                                            loading="lazy"
                                            className="h-16 w-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <span
                                            aria-hidden="true"
                                            className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-alt text-lg font-bold text-text-secondary"
                                        >
                                            {(course.instructor.name || '?').charAt(0)}
                                        </span>
                                    )}
                                    <div>
                                        <Link
                                            to={instructorHref(
                                                course.instructorId ||
                                                    course.instructor.id ||
                                                    0,
                                            )}
                                            className="text-base font-bold text-text-primary underline-offset-4 hover:text-primary hover:underline"
                                        >
                                            {course.instructor.name}
                                        </Link>
                                        <p className="mt-1 text-sm text-text-secondary">
                                            {t(
                                                'course.instructorLink',
                                                'View full profile and other courses',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="mt-8 lg:sticky lg:top-24 lg:mt-0">
                        {enrollPanel}
                    </aside>
                </div>

                {relatedCourses.length > 0 && (
                    <section
                        aria-labelledby="related-heading"
                        className="mt-16 border-t border-border pt-10"
                    >
                        <h2
                            id="related-heading"
                            className="text-xl font-bold tracking-tight text-text-primary"
                        >
                            {t('course.related', 'More in this category')}
                        </h2>
                        <ul className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedCourses.slice(0, 3).map((item) => (
                                <li key={item.id} className="flex">
                                    <CourseCard
                                        course={item}
                                        className="w-full"
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </Container>

            {/* Preview Player Modal for visitors */}
            <PreviewPlayerModal
                courseId={course.id}
                courseName={course.name}
                isOpen={previewModalOpen}
                item={previewItem}
                onClose={() => {
                    setPreviewModalOpen(false)
                    setPreviewItem(null)
                }}
                onEnroll={() => void startAction(previewItem)}
            />

            {/* Locked Content Confirmation Modal */}
            <LockedContentModal
                isOpen={lockedModalOpen}
                item={selectedLockedItem}
                courseTitle={course.name}
                coursePrice={course.price}
                enrolling={enrolling}
                onClose={() => {
                    setLockedModalOpen(false)
                    setSelectedLockedItem(null)
                }}
                onEnroll={() => void startAction(selectedLockedItem)}
            />

            {/* Enrollment Success Celebration Modal */}
            <EnrollmentSuccessModal
                isOpen={successModalOpen}
                courseTitle={course.name}
                courseThumbnail={course.thumbnailUrl || undefined}
                courseDuration={course.duration}
                lessonsCount={items.length}
                targetItem={enrolledTargetItem}
                onClose={() => {
                    setSuccessModalOpen(false)
                    setEnrolledTargetItem(null)
                }}
                onStartLearning={() => {
                    setSuccessModalOpen(false)
                    const targetId = enrolledTargetItem?.id
                    setEnrolledTargetItem(null)
                    navigate(
                        targetId
                            ? `/learn/${course.id}?item=${targetId}`
                            : `/learn/${course.id}`,
                    )
                }}
            />

            {/* Payment Request Modal for Paid Courses */}
            <PaymentRequestModal
                course={{
                    id: course.id,
                    name: course.name,
                    price: course.price,
                }}
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
            />
        </>
    )
}

export default CourseDetails
