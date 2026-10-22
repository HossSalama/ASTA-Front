import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import {
    TbLock,
    TbPlayerPlay,
    TbFileText,
    TbClock,
    TbSchool,
    TbX,
    TbSparkles,
} from 'react-icons/tb'
import useTranslation from '@/utils/hooks/useTranslation'
import { formatPrice, formatVideoTimestamp } from '@/utils/catalog'
import { ContentType } from '@/@types/courseContent'
import type {
    CourseSectionItemDto,
    AdminCourseContentItemDto,
} from '@/@types/courseContent'
import type { CourseSectionItem } from '@/@types/publicCatalog'
import classNames from 'classnames'

type AnyContentItem =
    | CourseSectionItemDto
    | AdminCourseContentItemDto
    | CourseSectionItem

interface LockedContentModalProps {
    isOpen: boolean
    onClose: () => void
    item: AnyContentItem | null
    courseTitle?: string
    coursePrice?: number
    onEnroll: () => void
    enrolling?: boolean
}

export const LockedContentModal = ({
    isOpen,
    onClose,
    item,
    courseTitle,
    coursePrice,
    onEnroll,
    enrolling = false,
}: LockedContentModalProps) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language

    if (!item) return null

    const isVideo =
        item.type === ContentType.Video ||
        item.type === 'Video' ||
        String(item.type) === '1'

    return (
        <Dialog
            closable={false}
            isOpen={isOpen}
            onClose={onClose}
            width={480}
            contentClassName="p-0 overflow-hidden bg-surface text-text-primary rounded-2xl border border-border shadow-2xl"
        >
            {/* Header */}
            <div className="relative p-6 pb-4 border-b border-border bg-surface-alt/40">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={t('common.close', 'Close')}
                    className="absolute top-4 end-4 rounded-full p-2 text-text-muted hover:bg-surface-alt hover:text-text-primary transition"
                >
                    <TbX className="text-xl" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                        <TbLock className="text-2xl" />
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5 pe-6">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md">
                                {t('course.lockedContentModalBadge', 'Enrolled Only')}
                            </span>
                            {courseTitle && (
                                <span className="text-xs text-text-muted truncate max-w-[200px]">
                                    {courseTitle}
                                </span>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mt-1 leading-snug">
                            {t('course.lockedContentModalTitle', 'Locked Content')}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
                {/* Selected Lesson Card */}
                <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
                    <div
                        className={classNames(
                            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                            isVideo
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                                : 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
                        )}
                    >
                        {isVideo ? (
                            <TbPlayerPlay className="text-xl" />
                        ) : (
                            <TbFileText className="text-xl" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-text-muted">
                            {isVideo
                                ? t('courseManagement.videoLesson', 'Video Lesson')
                                : t('courseManagement.resourceFile', 'Resource File')}
                        </p>
                        <h4 className="text-sm font-semibold text-text-primary truncate mt-0.5">
                            {item.title}
                        </h4>
                        {Boolean(item.duration) && (
                            <p className="text-xs text-text-muted font-mono dir-ltr mt-0.5 flex items-center gap-1">
                                <TbClock className="text-xs" />
                                {formatVideoTimestamp(item.duration)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Explanatory Message */}
                <p className="text-sm text-text-secondary leading-relaxed">
                    {t(
                        'course.lockedContentModalDesc',
                        'This lesson is locked and accessible only to enrolled students. Enroll now to unlock all lessons and learning resources.',
                    )}
                </p>

                {/* Highlights / Price banner */}
                <div className="rounded-xl bg-primary-subtle/30 dark:bg-primary-subtle/10 border border-primary/20 p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <TbSparkles className="text-primary text-lg shrink-0" />
                        <span className="text-xs font-medium text-text-secondary line-clamp-2">
                            {t('course.afterEnrol', 'Lifetime access · Learn at your own pace · Certificate on completion')}
                        </span>
                    </div>
                    {typeof coursePrice !== 'undefined' && (
                        <span className="text-sm font-bold text-text-primary shrink-0 ms-2">
                            {formatPrice(coursePrice, lang)}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-border bg-surface-alt/20 px-6 py-4">
                <Button
                    variant="plain"
                    size="sm"
                    disabled={enrolling}
                    onClick={onClose}
                >
                    {t('course.lockedContentModalCancel', 'Cancel')}
                </Button>
                <Button
                    variant="solid"
                    size="sm"
                    loading={enrolling}
                    icon={<TbSchool />}
                    onClick={onEnroll}
                >
                    {t('course.lockedContentEnrollBtn', 'Enroll in Course Now')}
                </Button>
            </div>
        </Dialog>
    )
}

export default LockedContentModal
