import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import {
    TbCircleCheckFilled,
    TbPlayerPlay,
    TbAward,
    TbInfinity,
    TbCheck,
    TbX,
    TbBook,
    TbClock,
} from 'react-icons/tb'
import useTranslation from '@/utils/hooks/useTranslation'
import { formatDuration } from '@/utils/catalog'
import type {
    CourseSectionItemDto,
    AdminCourseContentItemDto,
} from '@/@types/courseContent'
import type { CourseSectionItem } from '@/@types/publicCatalog'
import CourseThumbnail from '@/components/shared/catalog/CourseThumbnail'

type AnyContentItem =
    | CourseSectionItemDto
    | AdminCourseContentItemDto
    | CourseSectionItem

interface EnrollmentSuccessModalProps {
    isOpen: boolean
    onClose: () => void
    courseTitle?: string
    courseThumbnail?: string
    courseDuration?: number
    lessonsCount?: number
    targetItem?: AnyContentItem | null
    onStartLearning: () => void
}

export const EnrollmentSuccessModal = ({
    isOpen,
    onClose,
    courseTitle,
    courseThumbnail,
    courseDuration,
    lessonsCount,
    targetItem,
    onStartLearning,
}: EnrollmentSuccessModalProps) => {
    const { t, i18n } = useTranslation()
    const isRtl = i18n.language === 'ar'

    return (
        <Dialog
            closable={false}
            isOpen={isOpen}
            onClose={onClose}
            width={520}
            contentClassName="p-0 overflow-hidden bg-surface text-text-primary rounded-2xl border border-border shadow-2xl"
        >
            {/* Top Close Button */}
            <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close', 'Close')}
                className="absolute top-4 end-4 z-10 rounded-full p-2 text-text-muted hover:bg-surface-alt hover:text-text-primary transition"
            >
                <TbX className="text-xl" />
            </button>

            {/* Celebration Header Section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent px-6 pt-8 pb-5 text-center">
                {/* Decorative background circle */}
                <div
                    className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"
                    aria-hidden="true"
                />

                {/* Animated / styled Icon Badge */}
                <div className="relative inline-flex items-center justify-center mb-4">
                    <div className="w-18 h-18 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/5 dark:ring-emerald-500/10 shadow-lg">
                        <TbCircleCheckFilled className="text-4xl" />
                    </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                    {t('course.enrollSuccessModalTitle', 'Enrolled Successfully! 🎉')}
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-text-secondary max-w-sm mx-auto leading-relaxed">
                    {t(
                        'course.enrollSuccessModalSubtitle',
                        'Congratulations! You have successfully enrolled in this course. You now have full access to all lessons, resources, and progress tracking.',
                    )}
                </p>
            </div>

            {/* Content Body */}
            <div className="p-6 pt-1 space-y-4">
                {/* Course Card Preview */}
                <div className="rounded-xl border border-border bg-surface-alt/40 p-3.5 flex items-center gap-3.5 shadow-xs">
                    {courseThumbnail ? (
                        <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                            <CourseThumbnail
                                course={{
                                    name: courseTitle || '',
                                    thumbnailUrl: courseThumbnail || null,
                                }}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <TbBook className="text-2xl" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-text-primary truncate">
                            {courseTitle}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                            {typeof lessonsCount === 'number' && (
                                <span className="flex items-center gap-1">
                                    <TbBook className="text-xs" />
                                    {lessonsCount}{' '}
                                    {t('course.lessons', 'Lessons')}
                                </span>
                            )}
                            {Boolean(courseDuration) && (
                                <span className="flex items-center gap-1">
                                    <TbClock className="text-xs" />
                                    {formatDuration(
                                        courseDuration as number,
                                        i18n.language,
                                    )}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Target Lesson Banner (if user enrolled from a specific lesson) */}
                {targetItem && (
                    <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
                        <TbPlayerPlay className="text-base shrink-0 text-blue-600 dark:text-blue-400" />
                        <span className="truncate">
                            {t(
                                'course.enrollSuccessTargetLesson',
                                {
                                    defaultValue: 'Starting lesson: {{lesson}}',
                                    lesson: targetItem.title,
                                },
                            )}
                        </span>
                    </div>
                )}

                {/* Perks Checklist */}
                <div className="rounded-xl bg-surface border border-border/70 p-3.5 space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs">
                            <TbCheck />
                        </span>
                        <span>{t('course.enrollSuccessPerk1', 'Full lifetime access to all lessons & materials')}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs">
                            <TbInfinity />
                        </span>
                        <span>{t('course.enrollSuccessPerk2', 'Automatic progress tracking & last lesson save')}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-text-secondary">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 text-xs">
                            <TbAward />
                        </span>
                        <span>{t('course.enrollSuccessPerk3', 'Certificate of completion upon finishing')}</span>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 border-t border-border bg-surface-alt/20 px-6 py-4">
                <Button
                    variant="plain"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={onClose}
                >
                    {t('course.enrollSuccessClose', 'Stay on Page')}
                </Button>
                <Button
                    variant="solid"
                    size="sm"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500 border-none"
                    icon={<TbPlayerPlay />}
                    onClick={onStartLearning}
                >
                    {targetItem
                        ? t('course.enrollSuccessGoToLesson', 'Go to Selected Lesson')
                        : t('course.enrollSuccessStartLearning', 'Start Learning Now')}
                </Button>
            </div>
        </Dialog>
    )
}

export default EnrollmentSuccessModal
