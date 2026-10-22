import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineChevronDown,
    HiOutlineListBullet,
    HiOutlineCheckCircle,
    HiOutlinePlay,
    HiOutlineDocumentText,
    HiOutlineArrowLeft,
    HiOutlineXMark,
    HiOutlineClock,
    HiOutlineLockClosed,
    HiOutlineSparkles,
    HiOutlineAcademicCap,
    HiOutlineSun,
    HiOutlineMoon,
    HiOutlineVideoCamera,
} from 'react-icons/hi2'
import dayjs from 'dayjs'
import useDarkMode from '@/utils/hooks/useDarkMode'
import { useCourseProgress } from '@/utils/hooks/useCourseProgress'
import { useEnrollmentStore, progressPercent } from '@/store/enrollmentStore'
import useAuth from '@/auth/useAuth'
import { ContentType, isLiveSessionItem } from '@/@types/courseContent'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Progress from '@/components/ui/Progress'
import StateView from '@/components/shared/catalog/StateView'
import classNames from 'classnames'
import useTranslation from '@/utils/hooks/useTranslation'
import { formatVideoTimestamp, formatDuration } from '@/utils/catalog'
import type {
    AdminCourseSectionDto,
    AdminCourseContentItemDto,
} from '@/@types/courseContent'
import type {
    CourseSection,
    CourseSectionItem,
} from '@/@types/publicCatalog'
import type {
    CourseProgressSectionDto,
    CourseProgressSectionItemDto,
} from '@/@types/courseProgress'
import VideoPlayer from '@/components/shared/course/VideoPlayer'
import FileResourceViewer from '@/components/shared/course/FileResourceViewer'
import QuizPlayer from '@/components/shared/course/QuizPlayer'
import LiveSessionViewer from '@/components/shared/course/LiveSessionViewer'
import ContentAccessGate from '@/components/shared/course/ContentAccessGate'
import CourseReviewModal from '@/components/shared/course/CourseReviewModal'
import { resolveContinueLearningTarget } from '@/utils/courseProgressHelpers'

type AnyContentItem =
    | CourseSectionItem
    | AdminCourseContentItemDto
    | CourseProgressSectionItemDto
type AnySection =
    | CourseSection
    | AdminCourseSectionDto
    | CourseProgressSectionDto

/**
 * Immersive Course Learning Environment.
 * Fully integrates backend Course Progress Tracking, Video Playback Resumption,
 * Continue Learning Bookmark, and Automated Certificate Unlocking.
 */
const LearningPlayer = () => {
    const { id } = useParams<{ id: string }>()
    const courseId = Number(id)
    const { authenticated } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'
    const [isDark, setIsDark] = useDarkMode()

    // Authoritative course progress outline (the only source of truth in the learning player)
    const {
        courseProgress,
        isLoading,
        error,
        mutate: mutateProgress,
    } = useCourseProgress(courseId)

    const course = courseProgress

    const enrollments = useEnrollmentStore((state) => state.enrollments)
    const setLastItem = useEnrollmentStore((state) => state.setLastItem)
    const setTotalItems = useEnrollmentStore((state) => state.setTotalItems)

    const [activeLessonId, setActiveLessonId] = useState<number | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [completedItemsMap, setCompletedItemsMap] = useState<
        Record<number, boolean>
    >({})
    const [courseProgressPercent, setCourseProgressPercent] = useState<number>(0)
    const [celebrationOpen, setCelebrationOpen] = useState<boolean>(false)
    const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false)
    const [reviewBannerDismissed, setReviewBannerDismissed] = useState<boolean>(false)
    const [expandedSectionIds, setExpandedSectionIds] = useState<number[]>([])
    const [hasInitializedSections, setHasInitializedSections] = useState(false)

    const restoredRef = useRef(false)
    const hasCelebratedRef = useRef(false)

    const enrollment = courseId ? enrollments[courseId] : undefined
    const isEnrolled = Boolean(course)

    // Flatten all published lessons in curriculum order
    const allLessons = useMemo(() => {
        if (!course?.sections) {
            return [] as AnyContentItem[]
        }
        return course.sections.flatMap(
            (section: any) => (section.items || []) as AnyContentItem[],
        )
    }, [course])

    const totalLessons = allLessons.length

    // Required lessons count for completion percentage (LiveSession items are excluded per doc Section 1)
    const requiredLessons = useMemo(() => {
        return allLessons.filter((item) => !isLiveSessionItem(item.type))
    }, [allLessons])

    const totalRequiredCount =
        courseProgress?.totalContents ?? requiredLessons.length

    // Synchronize completion states and overall course progress from backend
    useEffect(() => {
        if (courseProgress?.sections) {
            const map: Record<number, boolean> = {}
            courseProgress.sections.forEach((s) => {
                s.items?.forEach((item) => {
                    if (item.isCompleted) {
                        map[item.id] = true
                    }
                })
            })
            setCompletedItemsMap((prev) => ({ ...prev, ...map }))
        }

        if (courseProgress?.progressPercentage !== undefined) {
            setCourseProgressPercent(courseProgress.progressPercentage)
        }
    }, [courseProgress])

    // Expand all sections by default on initial load
    useEffect(() => {
        if (
            course?.sections &&
            course.sections.length > 0 &&
            !hasInitializedSections
        ) {
            setExpandedSectionIds(course.sections.map((s) => s.id))
            setHasInitializedSections(true)
        }
    }, [course?.sections, hasInitializedSections])

    // Ensure the section containing the active lesson is always expanded
    useEffect(() => {
        if (activeLessonId && course?.sections) {
            const activeSection = course.sections.find((s) =>
                s.items?.some((item: any) => item.id === activeLessonId),
            )
            if (activeSection) {
                setExpandedSectionIds((prev) =>
                    prev.includes(activeSection.id)
                        ? prev
                        : [...prev, activeSection.id],
                )
            }
        }
    }, [activeLessonId, course?.sections])

    const toggleSection = useCallback((sectionId: number) => {
        setExpandedSectionIds((prev) =>
            prev.includes(sectionId)
                ? prev.filter((id) => id !== sectionId)
                : [...prev, sectionId],
        )
    }, [])

    const allSectionIds = useMemo(
        () => (course?.sections || []).map((s) => s.id),
        [course?.sections],
    )

    const allExpanded = useMemo(
        () =>
            allSectionIds.length > 0 &&
            allSectionIds.every((id) => expandedSectionIds.includes(id)),
        [allSectionIds, expandedSectionIds],
    )

    const toggleAllSections = useCallback(() => {
        if (allExpanded) {
            setExpandedSectionIds([])
        } else {
            setExpandedSectionIds(allSectionIds)
        }
    }, [allExpanded, allSectionIds])

    // Continue Learning Bookmark Resolution:
    // 1. URL query param ?item={id}
    // 2. Authoritative backend courseProgress.lastContentId
    // 3. Client store enrollment.lastItemId fallback
    // 4. First published lesson in curriculum
    useEffect(() => {
        if (totalLessons === 0) return

        const queryItemId = searchParams.get('item')
        if (queryItemId) {
            const parsed = Number(queryItemId)
            if (allLessons.some((l) => l.id === parsed)) {
                setActiveLessonId(parsed)
                restoredRef.current = true
                return
            }
        }

        if (!restoredRef.current) {
            restoredRef.current = true

            let resumeId: number | undefined
            if (courseProgress) {
                const target = resolveContinueLearningTarget(courseProgress)
                if (target && allLessons.some((l) => l.id === target.targetItemId)) {
                    resumeId = target.targetItemId
                }
            }

            if (!resumeId) {
                resumeId =
                    enrollment?.lastItemId &&
                    allLessons.some((l) => l.id === enrollment.lastItemId)
                        ? enrollment.lastItemId
                        : allLessons[0].id
            }

            setActiveLessonId(resumeId)
        }
    }, [
        allLessons,
        totalLessons,
        searchParams,
        courseProgress,
        enrollment,
    ])

    // Synchronize total items with enrollment store (excluding LiveSessions per doc Section 1)
    useEffect(() => {
        if (isEnrolled && totalRequiredCount > 0) {
            setTotalItems(courseId, totalRequiredCount)
        }
    }, [isEnrolled, totalRequiredCount, courseId, setTotalItems])

    // Save last visited lesson to local store
    useEffect(() => {
        if (isEnrolled && activeLessonId) {
            setLastItem(courseId, activeLessonId)
        }
    }, [isEnrolled, activeLessonId, courseId, setLastItem])

    const activeIndex = allLessons.findIndex(
        (lesson) => lesson.id === activeLessonId,
    )
    const activeLesson = activeIndex >= 0 ? allLessons[activeIndex] : undefined

    // Navigation helper
    const goToLesson = useCallback(
        (lesson: AnyContentItem) => {
            setActiveLessonId(lesson.id)
            setSearchParams({ item: String(lesson.id) })
        },
        [setSearchParams],
    )

    const goToIndex = useCallback(
        (index: number) => {
            const lesson = allLessons[index]
            if (lesson) {
                goToLesson(lesson)
            }
        },
        [allLessons, goToLesson],
    )

    // Keyboard navigation (Arrow keys for prev / next lesson)
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement | null
            if (
                target &&
                ['INPUT', 'TEXTAREA', 'SELECT', 'VIDEO'].includes(
                    target.tagName,
                )
            ) {
                return
            }
            if (event.key === 'ArrowRight') {
                goToIndex(isRtl ? activeIndex - 1 : activeIndex + 1)
            }
            if (event.key === 'ArrowLeft') {
                goToIndex(isRtl ? activeIndex + 1 : activeIndex - 1)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [activeIndex, goToIndex, isRtl])

    // Check completion status of a lesson
    const isCompleted = useCallback(
        (lessonId: number) => {
            return Boolean(
                completedItemsMap[lessonId] ||
                    enrollment?.completedItemIds.includes(lessonId),
            )
        },
        [completedItemsMap, enrollment],
    )

    // Local completion & progress synchronizer helper
    const markCompletedLocally = useCallback(
        (lessonId: number, newCourseProgress?: number | null) => {
            setCompletedItemsMap((prev) => ({ ...prev, [lessonId]: true }))

            if (isEnrolled) {
                useEnrollmentStore
                    .getState()
                    .markItemComplete(courseId, lessonId, totalRequiredCount)
            }

            if (newCourseProgress !== null && newCourseProgress !== undefined) {
                setCourseProgressPercent(newCourseProgress)
                if (newCourseProgress >= 100.0 && !hasCelebratedRef.current) {
                    hasCelebratedRef.current = true
                    setCelebrationOpen(true)
                }
            }

            if (isEnrolled) {
                mutateProgress()
            }
        },
        [courseId, isEnrolled, totalRequiredCount, mutateProgress],
    )

    // Overall course progress percentage
    const currentProgress = isEnrolled
        ? courseProgressPercent > 0
            ? Math.round(courseProgressPercent * 100) / 100
            : progressPercent(enrollment, totalRequiredCount)
        : 0

    const courseFinished =
        currentProgress >= 100.0 || Boolean(enrollment?.completedAt)

    // Trigger celebration when course reaches 100%
    useEffect(() => {
        if (courseFinished && !hasCelebratedRef.current) {
            hasCelebratedRef.current = true
            setCelebrationOpen(true)
        }
    }, [courseFinished])

    const completedContentsCount = useMemo(() => {
        if (
            courseProgress?.completedContents !== undefined &&
            courseProgress.completedContents !== null
        ) {
            return courseProgress.completedContents
        }
        return requiredLessons.filter((l) => isCompleted(l.id)).length
    }, [courseProgress?.completedContents, requiredLessons, isCompleted])

    if (isLoading) {
        return (
            <StateView
                tone="empty"
                title={t('learning.loading', 'Loading course…')}
            />
        )
    }

    if (error || !course) {
        const status = (error as any)?.response?.status
        if (status === 401 || !authenticated) {
            return (
                <StateView
                    tone="error"
                    title={
                        isRtl
                            ? 'يجب تسجيل الدخول'
                            : t('learning.loginRequired', 'Login Required')
                    }
                    description={
                        isRtl
                            ? 'يرجى تسجيل الدخول للوصول إلى بيئة التعلم الخاصة بهذه الدورة.'
                            : t(
                                  'learning.loginRequiredDesc',
                                  'Please sign in to access your course learning environment.',
                              )
                    }
                    action={{
                        label: isRtl
                            ? 'تسجيل الدخول'
                            : t('auth.signIn', 'Sign In'),
                        to: `/sign-in?redirectUrl=/learn/${courseId}`,
                    }}
                />
            )
        }

        const errorMessage = (error as any)?.response?.data?.message || ''
        const isNotEnrolled =
            status === 403 ||
            (status === 404 &&
                (errorMessage.toLowerCase().includes('enrollment') ||
                    !errorMessage.toLowerCase().includes('course not found')))

        if (isNotEnrolled) {
            return (
                <StateView
                    tone="error"
                    title={
                        isRtl
                            ? 'التسجيل في الدورة مطلوب'
                            : t('learning.enrollmentRequired', 'Enrollment Required')
                    }
                    description={
                        isRtl
                            ? 'يجب أن تكون مسجلاً في هذه الدورة للوصول إلى المحتوى والدروس التعليمية.'
                            : t(
                                  'learning.enrollmentRequiredDesc',
                                  'You must be enrolled in this course to access the classroom.',
                              )
                    }
                    action={{
                        label: isRtl
                            ? 'عرض تفاصيل الدورة والتسجيل'
                            : t('learning.viewCourse', 'View Course Details'),
                        to: `/courses/${courseId}`,
                    }}
                />
            )
        }

        return (
            <StateView
                tone="error"
                title={t('learning.error', 'Course not found')}
                description={t(
                    'learning.errorDesc',
                    'This course is unavailable or no longer published.',
                )}
                action={{
                    label: t('learning.browse', 'Browse courses'),
                    to: '/courses',
                }}
            />
        )
    }

    if (totalLessons === 0) {
        return (
            <StateView
                tone="empty"
                title={t('learning.noContentTitle', 'No lessons published yet')}
                description={t(
                    'learning.noContentDesc',
                    'The instructor has not published any lessons for this course yet.',
                )}
                action={{
                    label: t('learning.viewCourse', 'View course'),
                    to: `/courses/${courseId}`,
                }}
            />
        )
    }

    const isCurrentLessonAccessible =
        isEnrolled || Boolean(activeLesson?.isPreview)

    const isLiveSession = isLiveSessionItem(activeLesson?.type)

    const isVideo =
        !isLiveSession &&
        (activeLesson?.type === ContentType.Video ||
            activeLesson?.type === 'Video' ||
            String(activeLesson?.type) === '1')

    const isQuiz =
        !isLiveSession &&
        (activeLesson?.type === ContentType.Quiz ||
            activeLesson?.type === 'Quiz' ||
            String(activeLesson?.type) === '3')

    const activeLessonPos = (activeLesson as any)?.lastPositionSeconds ?? 0

    const PrevIcon = isRtl ? HiOutlineChevronRight : HiOutlineChevronLeft
    const NextIcon = isRtl ? HiOutlineChevronLeft : HiOutlineChevronRight

    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-text-primary font-sans">
            {/* Header */}
            <header className="z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <Link
                        to={`/courses/${courseId}`}
                        aria-label={t('learning.backToCourse', 'Back to course')}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-alt hover:text-text-primary"
                    >
                        <HiOutlineArrowLeft
                            className={classNames('text-xl', isRtl && 'rotate-180')}
                        />
                    </Link>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-text-primary">
                            {course.name}
                        </p>
                        <p className="truncate text-xs text-text-muted">
                            {t('learning.lessonOf', 'Lesson')}{' '}
                            {activeIndex + 1}/{totalLessons}
                            {activeLesson ? ` · ${activeLesson.title}` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Progress indicator for enrolled users (Header displays percentage and completed/total counts per doc Section 4) */}
                    {isEnrolled && (
                        <div className="hidden items-center gap-2.5 md:flex">
                            <Progress
                                size="sm"
                                percent={currentProgress}
                                showInfo={false}
                                className="w-28"
                            />
                            <span className="text-xs font-semibold tabular-nums text-text-secondary">
                                {currentProgress}%
                                {totalRequiredCount > 0 && (
                                    <span className="ms-1 font-normal text-text-muted">
                                        ({completedContentsCount}/{totalRequiredCount})
                                    </span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Dark / Light Theme Toggle Button */}
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label={
                            isDark
                                ? t('theme.lightMode', 'Switch to Light Mode')
                                : t('theme.darkMode', 'Switch to Dark Mode')
                        }
                        title={
                            isDark
                                ? t('theme.lightMode', 'Light Mode')
                                : t('theme.darkMode', 'Dark Mode')
                        }
                        icon={
                            isDark ? (
                                <HiOutlineSun className="text-amber-400 text-lg transition-transform hover:rotate-45" />
                            ) : (
                                <HiOutlineMoon className="text-text-secondary text-lg transition-transform hover:-rotate-12" />
                            )
                        }
                        className="border border-border bg-surface hover:bg-surface-alt text-text-primary shadow-xs"
                        onClick={() => setIsDark(isDark ? 'light' : 'dark')}
                    />

                    {/* Curriculum Sidebar Toggle Button */}
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineListBullet />}
                        aria-expanded={sidebarOpen}
                        aria-controls="course-curriculum"
                        className="border border-border bg-surface hover:bg-surface-alt text-text-primary shadow-xs"
                        onClick={() => setSidebarOpen((open) => !open)}
                    >
                        <span className="hidden sm:inline">
                            {t('learning.curriculum', 'Curriculum')}
                        </span>
                    </Button>
                </div>
            </header>

            {/* Main Area */}
            <div className="relative flex flex-1 overflow-hidden">
                {/* Learning Player / Content Workspace */}
                <main
                    className={classNames(
                        'flex flex-1 flex-col overflow-y-auto transition-[padding] duration-200',
                        sidebarOpen && 'lg:pe-[380px]',
                    )}
                >
                    {/* Modern Sleek Lesson Header Bar */}
                    <div className="w-full bg-surface border-b border-border/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
                        {/* Course Complete Celebration Banner */}
                        {courseFinished && isEnrolled && (
                            <div className="mb-3 flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <HiOutlineSparkles className="text-xl text-emerald-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                                            {t(
                                                'learning.courseComplete',
                                                'Congratulations! You finished every lesson in this course.',
                                            )}
                                        </p>
                                        <p className="text-xs text-emerald-700/80 dark:text-emerald-300/70">
                                            {t(
                                                'learning.certificateReadyHint',
                                                'Your official certificate of completion is issued and ready.',
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <Link to="/certificates">
                                    <Button
                                        size="xs"
                                        variant="solid"
                                        icon={<HiOutlineAcademicCap />}
                                    >
                                        {t(
                                            'learning.viewCertificate',
                                            'View Certificate',
                                        )}
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Review Prompt Banner per doc Section 6.2 */}
                        {courseProgress &&
                            courseFinished &&
                            isEnrolled &&
                            !reviewBannerDismissed && (
                                <div className="mb-3 flex flex-col gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
                                    <div className="flex items-center gap-2.5">
                                        <HiOutlineSparkles className="text-lg text-amber-500 shrink-0" />
                                        <p className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200">
                                            {courseProgress.isReviewed
                                                ? t(
                                                      'learning.reviewEditPrompt',
                                                      'You have reviewed this course. Want to update your feedback?',
                                                  )
                                                : t(
                                                      'learning.reviewPrompt',
                                                      'Enjoying this course? Share your experience with other students!',
                                                  )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            size="xs"
                                            variant="solid"
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                            onClick={() => setReviewModalOpen(true)}
                                        >
                                            {courseProgress.isReviewed
                                                ? t('learning.editReview', 'Edit My Review')
                                                : t('learning.leaveReview', 'Leave a Review')}
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="plain"
                                            className="text-text-muted hover:text-text-primary"
                                            onClick={() => setReviewBannerDismissed(true)}
                                        >
                                            {t('common.dismiss', isRtl ? 'تجاهل' : 'Dismiss')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                        <div className="min-w-0">
                            {/* Metadata badges row */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                {/* Content Type Pill Badge */}
                                <span
                                    className={classNames(
                                        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-xs border',
                                        isVideo &&
                                            'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
                                        isQuiz &&
                                            'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
                                        isLiveSession &&
                                            'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
                                        !isVideo &&
                                            !isQuiz &&
                                            !isLiveSession &&
                                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
                                    )}
                                >
                                    {isVideo && <HiOutlinePlay className="text-xs shrink-0" />}
                                    {isQuiz && <HiOutlineAcademicCap className="text-xs shrink-0" />}
                                    {isLiveSession && <HiOutlineVideoCamera className="text-xs shrink-0" />}
                                    {!isVideo && !isQuiz && !isLiveSession && (
                                        <HiOutlineDocumentText className="text-xs shrink-0" />
                                    )}
                                    <span>
                                        {isLiveSession
                                            ? t('liveSessions.liveSession', 'جلسة مباشرة')
                                            : isQuiz
                                              ? t('quiz.assessment', 'اختبار تقييمي')
                                              : isVideo
                                                ? isRtl
                                                    ? 'درس فيديو'
                                                    : 'Video Lesson'
                                                : isRtl
                                                  ? 'ملف مورد'
                                                  : 'Resource File'}
                                    </span>
                                </span>

                                {/* Duration Badge */}
                                {Boolean(activeLesson?.duration) && (
                                    <span className="inline-flex items-center gap-1 text-xs text-text-muted font-mono dir-ltr bg-surface-alt border border-border px-2 py-0.5 rounded-full">
                                        <HiOutlineClock className="text-xs" />
                                        <span>
                                            {formatVideoTimestamp(
                                                activeLesson?.duration,
                                            )}
                                        </span>
                                    </span>
                                )}
                            </div>

                            {/* Main Lesson Title */}
                            <h1 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight truncate">
                                {activeLesson?.title}
                            </h1>
                        </div>
                    </div>

                    {/* Media Display Container */}
                    {isVideo && (
                        <div className="w-full bg-black border-b border-border shadow-md">
                            {activeLesson && isCurrentLessonAccessible ? (
                                <VideoPlayer
                                    key={activeLesson.id}
                                    contentId={activeLesson.id}
                                    title={activeLesson.title}
                                    duration={activeLesson.duration}
                                    courseId={courseId}
                                    autoPlay={true}
                                    initialPositionSeconds={activeLessonPos}
                                    isAlreadyCompleted={isCompleted(
                                        activeLesson.id,
                                    )}
                                    isEnrolled={isEnrolled}
                                    onEnded={() => {
                                        if (isEnrolled) {
                                            markCompletedLocally(activeLesson.id)
                                        }
                                    }}
                                    onLessonCompleted={(contentId, newProg) => {
                                        markCompletedLocally(contentId, newProg)
                                    }}
                                    onCourseProgressUpdated={(newPercentage) => {
                                        setCourseProgressPercent(newPercentage)
                                        if (isEnrolled) {
                                            mutateProgress()
                                        }
                                    }}
                                    onCourseFinished={() => {
                                        setCelebrationOpen(true)
                                    }}
                                />
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center bg-surface p-8">
                                    <ContentAccessGate
                                        errorCode="FORBIDDEN"
                                        errorMessage={t(
                                            'learning.enrollmentRequiredDesc',
                                            'You must be enrolled in this course to access this lesson.',
                                        )}
                                        courseId={courseId}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {isQuiz && (
                        <div className="w-full bg-background border-b border-border">
                            {activeLesson && isCurrentLessonAccessible ? (
                                <QuizPlayer
                                    key={activeLesson.id}
                                    contentId={activeLesson.id}
                                    courseId={courseId}
                                    title={activeLesson.title}
                                    hideTitle={true}
                                    onQuizCompleted={(result) => {
                                        if (isEnrolled && activeLessonId) {
                                            const newProg =
                                                'courseProgressPercentage' in result
                                                    ? result.courseProgressPercentage
                                                    : undefined
                                            markCompletedLocally(
                                                activeLessonId,
                                                newProg,
                                            )
                                        }
                                    }}
                                    onNextLesson={() => {
                                        if (activeIndex < totalLessons - 1) {
                                            goToIndex(activeIndex + 1)
                                        }
                                    }}
                                    hasNextLesson={activeIndex < totalLessons - 1}
                                />
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center bg-surface p-8">
                                    <ContentAccessGate
                                        errorCode="FORBIDDEN"
                                        errorMessage={t(
                                            'learning.enrollmentRequiredDesc',
                                            'You must be enrolled in this course to access this lesson.',
                                        )}
                                        courseId={courseId}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {isLiveSession && (
                        <div className="w-full bg-background border-b border-border py-6 px-4">
                            {activeLesson && isCurrentLessonAccessible ? (
                                <div className="p-4 sm:p-8 max-w-4xl mx-auto">
                                    <LiveSessionViewer
                                        key={activeLesson.id}
                                        contentId={activeLesson.id}
                                        title={activeLesson.title}
                                        courseId={courseId}
                                        initialLiveSession={(activeLesson as any).liveSession}
                                        isEnrolled={isEnrolled}
                                        hideTitle={true}
                                    />
                                </div>
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center bg-surface p-8">
                                    <ContentAccessGate
                                        errorCode="FORBIDDEN"
                                        errorMessage={t(
                                            'learning.enrollmentRequiredDesc',
                                            'You must be enrolled in this course to access this lesson.',
                                        )}
                                        courseId={courseId}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {!isLiveSession && !isVideo && !isQuiz && (
                        <div className="w-full bg-background border-b border-border py-6 px-4">
                            {activeLesson && isCurrentLessonAccessible ? (
                                <div className="p-4 sm:p-8 max-w-4xl mx-auto">
                                    <FileResourceViewer
                                        key={activeLesson.id}
                                        contentId={activeLesson.id}
                                        title={activeLesson.title}
                                        courseId={courseId}
                                        hideTitle={true}
                                        onFileCompleted={(contentId, newProg) => {
                                            if (isEnrolled) {
                                                markCompletedLocally(
                                                    contentId,
                                                    newProg,
                                                )
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center bg-surface p-8">
                                    <ContentAccessGate
                                        errorCode="FORBIDDEN"
                                        errorMessage={t(
                                            'learning.enrollmentRequiredDesc',
                                            'You must be enrolled in this course to access this lesson.',
                                        )}
                                        courseId={courseId}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Actions Bar */}
                    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <Button
                                variant="plain"
                                className="border border-border bg-surface hover:bg-surface-alt text-text-primary shadow-xs"
                                disabled={activeIndex <= 0}
                                icon={<PrevIcon />}
                                onClick={() => goToIndex(activeIndex - 1)}
                            >
                                {t('learning.previous', 'Previous')}
                            </Button>

                            {!isEnrolled && (
                                <Link to={`/courses/${courseId}`}>
                                    <Button variant="solid">
                                        {t('course.enroll', 'Enrol in Course')}
                                    </Button>
                                </Link>
                            )}

                            <Button
                                variant="plain"
                                className="border border-border bg-surface hover:bg-surface-alt text-text-primary shadow-xs"
                                disabled={activeIndex >= totalLessons - 1}
                                icon={<NextIcon />}
                                onClick={() => goToIndex(activeIndex + 1)}
                            >
                                {t('learning.next', 'Next')}
                            </Button>
                        </div>
                    </div>
                </main>

                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <button
                        type="button"
                        aria-label={t('learning.closeCurriculum', 'Close curriculum')}
                        className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Curriculum Sidebar */}
                <aside
                    id="course-curriculum"
                    hidden={!sidebarOpen}
                    aria-label={t('learning.courseContent', 'Course content')}
                    className="fixed inset-y-16 end-0 z-40 w-full overflow-y-auto border-s border-border bg-surface shadow-2xl sm:w-[380px] lg:absolute lg:inset-y-0"
                >
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-5 py-4">
                        <div>
                            <h2 className="text-sm font-bold text-text-primary">
                                {t('learning.courseContent', 'Course Content')}
                            </h2>
                            <p className="text-xs text-text-muted mt-0.5">
                                {isEnrolled
                                    ? `${completedContentsCount}/${totalRequiredCount} ${t('learning.lessonsDone', 'lessons complete')}`
                                    : `${totalLessons} ${t('course.lessons', 'Lessons')}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {allSectionIds.length > 1 && (
                                <button
                                    type="button"
                                    onClick={toggleAllSections}
                                    className="text-xs font-semibold text-primary hover:text-primary-deep transition-colors px-2 py-1 rounded hover:bg-primary/10"
                                >
                                    {allExpanded
                                        ? t('learning.collapseAll', 'Collapse all')
                                        : t('learning.expandAll', 'Expand all')}
                                </button>
                            )}
                            <button
                                type="button"
                                aria-label={t('learning.closeCurriculum', 'Close curriculum')}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-surface-alt hover:text-text-primary lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <HiOutlineXMark className="text-lg" />
                            </button>
                        </div>
                    </div>

                    {course.sections?.map(
                        (section: AnySection, sIdx: number) => {
                            const sectionItems = section.items || []
                            const isExpanded = expandedSectionIds.includes(
                                section.id,
                            )
                            const sectionTotalDuration = sectionItems.reduce(
                                (acc, item) => acc + (item.duration || 0),
                                0,
                            )
                            const sectionCompletedCount = sectionItems.filter(
                                (item) => isCompleted(item.id),
                            ).length
                            const isSectionCompleted =
                                sectionItems.length > 0 &&
                                sectionCompletedCount === sectionItems.length
                            const hasActiveLesson = sectionItems.some(
                                (item) => item.id === activeLessonId,
                            )

                            return (
                                <section
                                    key={section.id}
                                    className="border-b border-border transition-colors"
                                >
                                    <button
                                        type="button"
                                        aria-expanded={isExpanded}
                                        aria-controls={`section-${section.id}`}
                                        onClick={() => toggleSection(section.id)}
                                        className={classNames(
                                            'group flex w-full items-center gap-3 px-4 py-3 text-start transition-all cursor-pointer select-none',
                                            'bg-surface-alt/75 hover:bg-surface-alt dark:bg-surface-alt/50 dark:hover:bg-surface-alt/80',
                                            hasActiveLesson
                                                ? 'border-s-4 border-s-primary'
                                                : 'border-s-4 border-s-transparent',
                                        )}
                                    >
                                        {/* Section Number Badge - isolated from bidi */}
                                        <span
                                            className={classNames(
                                                'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-all',
                                                hasActiveLesson
                                                    ? 'bg-primary text-white shadow-xs'
                                                    : isSectionCompleted
                                                      ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 font-semibold'
                                                      : 'bg-surface border border-border text-text-secondary group-hover:border-primary/40 group-hover:text-primary',
                                            )}
                                        >
                                            {sIdx + 1}
                                        </span>

                                        {/* Title & Metadata */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="block truncate text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                                                    {section.title}
                                                </h3>
                                                {isSectionCompleted && (
                                                    <HiOutlineCheckCircle
                                                        className="shrink-0 text-emerald-500 text-sm"
                                                        title={t(
                                                            'learning.sectionCompleted',
                                                            'Section completed',
                                                        )}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted flex-wrap">
                                                <span>
                                                    {t(
                                                        'curriculum.lessonCount',
                                                        {
                                                            defaultValue:
                                                                '{{count}} lessons',
                                                            count: sectionItems.length,
                                                        },
                                                    )}
                                                </span>
                                                {sectionTotalDuration > 0 && (
                                                    <>
                                                        <span className="text-border dark:text-gray-600">
                                                            •
                                                        </span>
                                                        <span className="dir-ltr font-mono text-[11px]">
                                                            {formatDuration(
                                                                sectionTotalDuration,
                                                                i18n.language,
                                                            )}
                                                        </span>
                                                    </>
                                                )}
                                                {isEnrolled &&
                                                    sectionItems.length > 0 && (
                                                        <>
                                                            <span className="text-border dark:text-gray-600">
                                                                •
                                                            </span>
                                                            <span
                                                                className={classNames(
                                                                    'text-[11px]',
                                                                    isSectionCompleted
                                                                        ? 'font-medium text-emerald-600 dark:text-emerald-400'
                                                                        : 'text-text-muted',
                                                                )}
                                                            >
                                                                {t(
                                                                    'curriculum.doneOf',
                                                                    {
                                                                        defaultValue:
                                                                            '{{done}}/{{total}} done',
                                                                        done: sectionCompletedCount,
                                                                        total: sectionItems.length,
                                                                    },
                                                                )}
                                                            </span>
                                                        </>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Chevron Toggle */}
                                        <div className="shrink-0 text-text-muted group-hover:text-text-primary transition-colors ms-1">
                                            <HiOutlineChevronDown
                                                className={classNames(
                                                    'text-base transition-transform duration-200',
                                                    isExpanded && 'rotate-180',
                                                )}
                                            />
                                        </div>
                                    </button>

                                    {/* Lessons List */}
                                    {isExpanded && (
                                        <ul
                                            id={`section-${section.id}`}
                                            className="divide-y divide-border/60 bg-surface"
                                        >
                                            {sectionItems.length === 0 ? (
                                                <li className="px-5 py-3 text-xs text-text-muted text-center italic">
                                                    {t(
                                                        'curriculum.emptySection',
                                                        'No lessons published in this section yet.',
                                                    )}
                                                </li>
                                            ) : (
                                                sectionItems.map((lesson) => {
                                                    const isActive =
                                                        activeLessonId ===
                                                        lesson.id
                                                    const done = isCompleted(
                                                        lesson.id,
                                                    )
                                                    const isLive =
                                                        isLiveSessionItem(
                                                            lesson.type,
                                                        )
                                                    const isQuizItem =
                                                        !isLive &&
                                                        (lesson.type ===
                                                            ContentType.Quiz ||
                                                            lesson.type ===
                                                                'Quiz' ||
                                                            String(
                                                                lesson.type,
                                                            ) === '3')
                                                    const isDoc =
                                                        !isLive &&
                                                        (lesson.type ===
                                                            ContentType.File ||
                                                            lesson.type ===
                                                                'File' ||
                                                            lesson.type ===
                                                                'Document' ||
                                                            String(
                                                                lesson.type,
                                                            ) === '2')
                                                    const accessible =
                                                        isEnrolled ||
                                                        Boolean(lesson.isPreview)

                                                    return (
                                                        <li key={lesson.id}>
                                                            <button
                                                                type="button"
                                                                aria-current={
                                                                    isActive
                                                                        ? 'true'
                                                                        : undefined
                                                                }
                                                                onClick={() => {
                                                                    goToLesson(
                                                                        lesson,
                                                                    )
                                                                    if (
                                                                        window.innerWidth <
                                                                        1024
                                                                    ) {
                                                                        setSidebarOpen(
                                                                            false,
                                                                        )
                                                                    }
                                                                }}
                                                                className={classNames(
                                                                    'flex w-full items-start gap-3 ps-6 pe-4 py-3 text-start transition-all cursor-pointer',
                                                                    isActive
                                                                        ? 'bg-primary/10 border-s-4 border-primary text-primary font-semibold dark:bg-primary/20 dark:text-white'
                                                                        : 'border-s-4 border-s-transparent hover:bg-surface-alt text-text-secondary hover:text-text-primary',
                                                                    !accessible &&
                                                                        'opacity-65',
                                                                )}
                                                            >
                                                                {isLive ? (
                                                                    <HiOutlineVideoCamera className="mt-0.5 shrink-0 text-lg text-rose-500" />
                                                                ) : done ? (
                                                                    <HiOutlineCheckCircle className="mt-0.5 shrink-0 text-lg text-emerald-500" />
                                                                ) : !accessible ? (
                                                                    <HiOutlineLockClosed className="mt-0.5 shrink-0 text-base text-text-muted" />
                                                                ) : isQuizItem ? (
                                                                    <HiOutlineAcademicCap className="mt-0.5 shrink-0 text-lg text-amber-500" />
                                                                ) : isDoc ? (
                                                                    <HiOutlineDocumentText className="mt-0.5 shrink-0 text-lg text-purple-500" />
                                                                ) : (
                                                                    <HiOutlinePlay className="mt-0.5 shrink-0 text-lg text-blue-500" />
                                                                )}
                                                                <span className="min-w-0 flex-1">
                                                                    <span className="block text-sm font-medium leading-snug">
                                                                        {lesson.title}
                                                                    </span>
                                                                    <span className="flex items-center gap-2 mt-1 text-xs text-text-muted flex-wrap">
                                                                        {isLive && (
                                                                            <span className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                                                                                <span className="relative flex h-1.5 w-1.5">
                                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                                                                </span>
                                                                                {t(
                                                                                    'liveSessions.liveBadge',
                                                                                    'مباشر',
                                                                                )}
                                                                                {(
                                                                                    lesson as any
                                                                                )
                                                                                    .liveSession
                                                                                    ?.scheduledStartTime && (
                                                                                    <span className="text-text-muted font-normal ms-1">
                                                                                        {dayjs(
                                                                                            (
                                                                                                lesson as any
                                                                                            )
                                                                                                .liveSession
                                                                                                .scheduledStartTime,
                                                                                        ).format(
                                                                                            'DD/MM/YYYY',
                                                                                        )}
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                        {Boolean(
                                                                            lesson.duration,
                                                                        ) && (
                                                                            <span className="flex items-center gap-1 dir-ltr font-mono">
                                                                                <span>
                                                                                    {formatVideoTimestamp(
                                                                                        lesson.duration,
                                                                                    )}
                                                                                </span>
                                                                                <HiOutlineClock className="text-xs" />
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    {/* Partial progress bar for videos per doc Section 4 */}
                                                                    {!done &&
                                                                        !isLive &&
                                                                        (lesson.type ===
                                                                            ContentType.Video ||
                                                                            lesson.type ===
                                                                                'Video' ||
                                                                            String(
                                                                                lesson.type,
                                                                            ) ===
                                                                                '1') &&
                                                                        ((lesson as any)
                                                                            .progressPercentage ??
                                                                            0) >
                                                                            0 && (
                                                                            <div className="mt-2 w-full max-w-[140px]">
                                                                                <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                                                                                    <div
                                                                                        className="h-full rounded-full bg-primary transition-all duration-300"
                                                                                        style={{
                                                                                            width: `${Math.min(
                                                                                                100,
                                                                                                Math.round(
                                                                                                    (
                                                                                                        lesson as any
                                                                                                    )
                                                                                                        .progressPercentage,
                                                                                                ),
                                                                                            )}%`,
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                </span>
                                                            </button>
                                                        </li>
                                                    )
                                                })
                                            )}
                                        </ul>
                                    )}
                                </section>
                            )
                        },
                    )}
                </aside>
            </div>

            {/* Course Completion Celebratory Dialog */}
            <Dialog
                isOpen={celebrationOpen}
                onClose={() => setCelebrationOpen(false)}
                width={480}
            >
                <div className="flex flex-col items-center text-center p-6 sm:p-8">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-3xl mb-4 shadow-sm">
                        <HiOutlineSparkles />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                        {t('learning.celebrationTitle', 'Course Completed! 🎉')}
                    </h3>
                    <p className="text-sm text-text-secondary mb-6 max-w-sm">
                        {t(
                            'learning.celebrationDesc',
                            'Congratulations! You have finished all required lessons and earned your official certificate of completion.',
                        )}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                        <Link to="/certificates" className="w-full">
                            <Button
                                variant="solid"
                                className="w-full"
                                icon={<HiOutlineAcademicCap />}
                            >
                                {t('learning.viewCertificate', 'View Certificate')}
                            </Button>
                        </Link>
                        <Button
                            variant="plain"
                            className="w-full border border-border text-text-secondary hover:text-text-primary"
                            onClick={() => setCelebrationOpen(false)}
                        >
                            {t('common.close', 'Close')}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Course Review Dialog per doc Section 6.2 */}
            <CourseReviewModal
                isOpen={reviewModalOpen}
                onClose={() => setReviewModalOpen(false)}
                courseId={courseId}
                courseName={course?.name}
                isEdit={Boolean(courseProgress?.isReviewed)}
                onSuccess={() => {
                    mutateProgress()
                }}
            />
        </div>
    )
}

export default LearningPlayer
