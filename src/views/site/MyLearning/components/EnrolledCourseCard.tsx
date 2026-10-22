import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineCheckCircle,
    HiOutlinePlay,
    HiOutlineAcademicCap,
    HiOutlineDocumentText,
    HiOutlineVideoCamera,
    HiOutlineClock,
    HiOutlineSparkles,
    HiOutlineStar,
} from 'react-icons/hi2'
import Button from '@/components/ui/Button'
import Progress from '@/components/ui/Progress'
import { TbHourglass } from 'react-icons/tb'
import CourseThumbnail from '@/components/shared/catalog/CourseThumbnail'
import CourseReviewModal from '@/components/shared/course/CourseReviewModal'
import { useCourseProgress } from '@/utils/hooks/useCourseProgress'
import {
    resolveContinueLearningTarget,
    formatDuration,
    formatCourseDuration,
} from '@/utils/courseProgressHelpers'
import { progressPercent } from '@/store/enrollmentStore'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import dayjs from 'dayjs'
import type { EnrollmentRecord } from '@/store/enrollmentStore'
import type { EnrolledCourseSummary } from '@/@types/courseProgress'

interface EnrolledCourseCardProps {
    course: EnrolledCourseSummary
    record: EnrollmentRecord
}

const EnrolledCourseCard = ({ course, record }: EnrolledCourseCardProps) => {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'
    const [outlineOpen, setOutlineOpen] = useState(false)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)

    // Load authoritative course progress and curriculum outline only when enrolled
    const { courseProgress, mutate } = useCourseProgress(
        course.id,
        Boolean(course.isEnrolled),
    )

    // Resolve authoritative continue learning bookmark
    const continueTarget = useMemo(() => {
        if (courseProgress) {
            return resolveContinueLearningTarget(courseProgress)
        }
        return null
    }, [courseProgress])

    const continueUrl = continueTarget
        ? `/learn/${course.id}?item=${continueTarget.targetItemId}`
        : `/learn/${course.id}`

    // Progress percentage calculation
    const percent = useMemo(() => {
        if (
            courseProgress?.progressPercentage !== undefined &&
            courseProgress.progressPercentage !== null
        ) {
            return Math.round(courseProgress.progressPercentage * 100) / 100
        }
        if (
            course.progressPercentage !== undefined &&
            course.progressPercentage !== null
        ) {
            return Math.round(course.progressPercentage * 100) / 100
        }
        return progressPercent(record)
    }, [courseProgress?.progressPercentage, course.progressPercentage, record])

    const isDone = percent >= 100.0 || Boolean(record.completedAt)

    const completedCount = courseProgress?.completedContents ?? null
    const totalCount =
        courseProgress?.totalContents ?? course.contentsCount ?? null

    const showReviewPrompt =
        Boolean(courseProgress) &&
        isDone &&
        !courseProgress?.isReviewed

    const sections = courseProgress?.sections || []
    const categoryName = courseProgress?.category?.name || course.category?.name
    const deliveryType = course.deliveryType || courseProgress?.deliveryType
    const isLive = deliveryType === 'Live'
    const isInPerson = deliveryType === 'InPerson'

    return (
        <li className="rounded-2xl border border-border bg-surface transition-shadow hover:shadow-xs overflow-hidden">
            {/* Main Course Summary Info Row */}
            <div className="p-4 sm:p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Thumbnail */}
                    <div className="w-full shrink-0 sm:w-44 md:w-48">
                        <CourseThumbnail course={course} />
                    </div>

                    {/* Middle Info & Progress */}
                    <div className="min-w-0 flex-1">
                        {/* Badges row */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                            {categoryName && (
                                <span className="inline-flex items-center rounded-md bg-surface-alt px-2.5 py-0.5 text-xs font-medium text-text-secondary border border-border">
                                    {categoryName}
                                </span>
                            )}
                            <span
                                className={classNames(
                                    'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border',
                                    isLive
                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
                                        : isInPerson
                                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-800/60'
                                          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
                                )}
                            >
                                {isLive
                                    ? t('courses.deliveryLive', 'Live')
                                    : isInPerson
                                      ? t('courses.deliveryInPerson', 'In-Person')
                                      : t('courses.deliveryRecorded', 'Recorded')}
                            </span>
                            {!course.isEnrolled ? (
                                <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                                    <TbHourglass className="text-xs shrink-0" />
                                    <span>{t('myLearning.underReview', 'Under Review')}</span>
                                </span>
                            ) : isDone ? (
                                <span className="inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                    <span>✓</span>
                                    <span>{t('myLearning.completed', 'Completed')}</span>
                                </span>
                            ) : null}
                        </div>

                        {/* Course Name */}
                        <Link
                            to={`/courses/${course.id}`}
                            className="block text-base sm:text-lg font-bold text-text-primary hover:text-primary transition-colors line-clamp-1"
                        >
                            {course.name}
                        </Link>

                        {/* Duration & Lessons Count */}
                        <div className="flex items-center text-xs text-text-muted gap-3 mt-1.5 flex-wrap">
                            {course.duration > 0 && (
                                <span className="inline-flex items-center gap-1">
                                    <HiOutlineClock className="text-xs shrink-0" />
                                    <span>{formatCourseDuration(course.duration, isRtl)}</span>
                                </span>
                            )}
                            {(course.contentsCount > 0 || (totalCount !== null && totalCount > 0)) && (
                                <span className="inline-flex items-center gap-1">
                                    <HiOutlinePlay className="text-xs shrink-0" />
                                    <span>
                                        {course.contentsCount || totalCount} {t('course.lessons', 'Lessons')}
                                    </span>
                                </span>
                            )}
                        </div>

                        {/* Progress bar or Pending Payment Notice */}
                        {course.isEnrolled ? (
                            <div className="mt-3 flex flex-col gap-1.5 sm:max-w-md">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-text-primary tabular-nums">
                                        {percent}%{' '}
                                        <span className="font-normal text-text-muted">
                                            {isDone
                                                ? t('myLearning.completed', 'Completed')
                                                : t('myLearning.inProgress', 'In progress')}
                                        </span>
                                    </span>
                                    {totalCount !== null && totalCount > 0 && (
                                        <span className="text-text-muted tabular-nums">
                                            {completedCount !== null
                                                ? `${completedCount}/${totalCount}`
                                                : `${totalCount}`}{' '}
                                            {t('course.lessons', 'Lessons')}
                                        </span>
                                    )}
                                </div>
                                <Progress
                                    size="sm"
                                    showInfo={false}
                                    percent={percent}
                                    customColorClass={
                                        isDone ? 'bg-emerald-500' : 'bg-primary'
                                    }
                                />
                            </div>
                        ) : (
                            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200 sm:max-w-md">
                                <p className="flex items-start gap-2">
                                    <TbHourglass className="shrink-0 text-amber-600 dark:text-amber-400 text-sm mt-0.5" />
                                    <span className="leading-relaxed">
                                        {t(
                                            'myLearning.pendingNotice',
                                            'Your payment receipt is being verified by the administration. Course access will unlock once approved.',
                                        )}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                        {course.isEnrolled ? (
                            <div className="flex items-center gap-2">
                                <Link to={continueUrl}>
                                    <Button
                                        size="sm"
                                        variant="solid"
                                        className="shadow-2xs font-semibold"
                                    >
                                        {isDone
                                            ? t('myLearning.review', 'Review')
                                            : percent > 0
                                              ? t('myLearning.continueLearning', 'Continue Learning')
                                              : t('myLearning.start', 'Start Learning')}
                                    </Button>
                                </Link>

                                {isDone && (
                                    <Link to="/certificates">
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            icon={<HiOutlineSparkles className="text-amber-500" />}
                                            className="border border-border text-text-primary"
                                        >
                                            {t('myLearning.certificate', 'Certificate')}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <Link to="/user/payment-requests">
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="border border-border text-text-primary hover:bg-surface-alt font-medium shadow-2xs"
                                >
                                    {t('myLearning.checkPaymentStatus', 'Check Payment Status')}
                                </Button>
                            </Link>
                        )}

                        {/* Outline Toggle Button - Only when enrolled */}
                        {course.isEnrolled && sections.length > 0 && (
                            <button
                                type="button"
                                aria-expanded={outlineOpen}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-deep transition-colors py-1 cursor-pointer"
                                onClick={() => setOutlineOpen((open) => !open)}
                            >
                                <span>
                                    {outlineOpen
                                        ? t('myLearning.hideOutline', 'Hide Outline')
                                        : t('myLearning.showOutline', 'View Outline')}
                                </span>
                                {outlineOpen ? (
                                    <HiOutlineChevronUp className="text-sm" />
                                ) : (
                                    <HiOutlineChevronDown className="text-sm" />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Review prompt banner - Only when enrolled */}
            {course.isEnrolled && showReviewPrompt && (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-500/20 bg-amber-500/10 px-4 py-2.5 sm:px-6">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200">
                        <HiOutlineStar className="text-base text-amber-500 shrink-0" />
                        <span>
                            {t(
                                'myLearning.reviewPrompt',
                                'Enjoying this course? Share your feedback with other students!',
                            )}
                        </span>
                    </div>
                    <Button
                        size="xs"
                        variant="solid"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => setReviewModalOpen(true)}
                    >
                        {t('myLearning.leaveReview', 'Leave a Review')}
                    </Button>
                </div>
            )}

            {/* Expandable Curriculum Outline Accordion per doc Section 8.3 */}
            {course.isEnrolled && outlineOpen && sections.length > 0 && (
                <div className="border-t border-border bg-surface-alt/40 p-4 sm:p-6 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-text-primary">
                            {t('myLearning.curriculum', 'Course Curriculum Outline')}
                        </h4>
                        <span className="text-xs text-text-muted">
                            {sections.length} {t('course.sections', 'Sections')}
                        </span>
                    </div>

                    <div className="space-y-4">
                        {sections.map((section, sIdx) => {
                            const sectionItems = section.items || []
                            const completedItemsCount = sectionItems.filter(
                                (item) => item.isCompleted === true,
                            ).length
                            const isSectionDone =
                                sectionItems.length > 0 &&
                                completedItemsCount === sectionItems.length

                            return (
                                <div
                                    key={section.id}
                                    className="rounded-xl border border-border bg-surface overflow-hidden shadow-2xs"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between bg-surface-alt/60 px-4 py-2.5 border-b border-border">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold bg-surface border border-border text-text-secondary">
                                                {sIdx + 1}
                                            </span>
                                            <span className="truncate text-xs sm:text-sm font-bold text-text-primary">
                                                {section.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-muted shrink-0">
                                            <span>
                                                {completedItemsCount}/{sectionItems.length}
                                            </span>
                                            {isSectionDone && (
                                                <HiOutlineCheckCircle className="text-emerald-500 text-sm" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Section Items */}
                                    <ul className="divide-y divide-border/60">
                                        {sectionItems.map((item) => {
                                            const isItemDone = item.isCompleted === true
                                            const isLiveSession = item.type === 'LiveSession'
                                            const isVideo = item.type === 'Video'
                                            const isQuiz = item.type === 'Quiz'
                                            const isFile = item.type === 'File'

                                            return (
                                                <li key={item.id}>
                                                    <Link
                                                        to={`/learn/${course.id}?item=${item.id}`}
                                                        className="group flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-surface-alt/70 text-start"
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            {/* Item Type Icon */}
                                                            {isLiveSession ? (
                                                                <HiOutlineVideoCamera className="text-base text-rose-500 shrink-0" />
                                                            ) : isItemDone ? (
                                                                <HiOutlineCheckCircle className="text-base text-emerald-500 shrink-0" />
                                                            ) : isQuiz ? (
                                                                <HiOutlineAcademicCap className="text-base text-amber-500 shrink-0" />
                                                            ) : isFile ? (
                                                                <HiOutlineDocumentText className="text-base text-emerald-600 shrink-0" />
                                                            ) : (
                                                                <HiOutlinePlay className="text-base text-blue-500 shrink-0" />
                                                            )}

                                                            <span className="truncate text-xs sm:text-sm font-medium text-text-secondary group-hover:text-primary transition-colors">
                                                                {item.title}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-3 shrink-0 text-xs text-text-muted">
                                                            {/* Live Session Schedule */}
                                                            {isLiveSession && item.liveSession?.scheduledStartTime && (
                                                                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
                                                                    {dayjs(
                                                                        item.liveSession.scheduledStartTime,
                                                                    ).format('DD/MM/YYYY HH:mm')}
                                                                </span>
                                                            )}

                                                            {/* In-progress mini bar for video */}
                                                            {!isItemDone &&
                                                                isVideo &&
                                                                (item.progressPercentage || 0) > 0 && (
                                                                    <span className="text-[11px] font-semibold text-amber-600 tabular-nums">
                                                                        {Math.round(
                                                                            item.progressPercentage,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                )}

                                                            {/* Video Duration */}
                                                            {Boolean(item.duration) && (
                                                                <span className="inline-flex items-center gap-1 font-mono text-[11px] dir-ltr">
                                                                    <HiOutlineClock className="text-xs" />
                                                                    <span>
                                                                        {formatDuration(
                                                                            item.duration,
                                                                        )}
                                                                    </span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Review Dialog */}
            <CourseReviewModal
                courseId={course.id}
                courseName={course.name}
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                onSuccess={() => {
                    mutate()
                }}
            />
        </li>
    )
}

export default EnrolledCourseCard
