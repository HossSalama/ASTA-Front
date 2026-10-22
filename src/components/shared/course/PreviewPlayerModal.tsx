import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import {
    TbPlayerPlay,
    TbFileText,
    TbX,
    TbSchool,
} from 'react-icons/tb'
import useTranslation from '@/utils/hooks/useTranslation'
import { ContentType } from '@/@types/courseContent'
import type { CourseSectionItemDto } from '@/@types/courseContent'
import VideoPlayer from './VideoPlayer'
import FileResourceViewer from './FileResourceViewer'

interface PreviewPlayerModalProps {
    isOpen: boolean
    onClose: () => void
    item: CourseSectionItemDto | null
    courseId?: number
    courseName?: string
    onEnroll?: () => void
}

export const PreviewPlayerModal = ({
    isOpen,
    onClose,
    item,
    courseId,
    courseName,
    onEnroll,
}: PreviewPlayerModalProps) => {
    const { t } = useTranslation()

    if (!item) return null

    const isVideo =
        item.type === 'Video' ||
        item.type === ContentType.Video ||
        String(item.type) === '1'

    return (
        <Dialog
            closable={false}
            isOpen={isOpen}
            onClose={onClose}
            width={850}
            contentClassName="p-0 overflow-hidden bg-neutral-950 text-white rounded-2xl border border-white/10 shadow-2xl"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-neutral-900">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isVideo
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-purple-500/20 text-purple-400'
                        }`}
                    >
                        {isVideo ? (
                            <TbPlayerPlay className="text-xl" />
                        ) : (
                            <TbFileText className="text-xl" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                {t('curriculum.preview', 'Free Preview')}
                            </span>
                            {courseName && (
                                <span className="text-xs text-white/50 truncate hidden sm:inline">
                                    {courseName}
                                </span>
                            )}
                        </div>
                        <h3 className="text-sm sm:text-base font-semibold text-white truncate mt-0.5">
                            {item.title}
                        </h3>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
                >
                    <TbX className="text-xl" />
                </button>
            </div>

            {/* Body */}
            <div className="bg-black">
                {isVideo ? (
                    <VideoPlayer
                        contentId={item.id}
                        title={item.title}
                        duration={item.duration}
                        courseId={courseId}
                        autoPlay={true}
                    />
                ) : (
                    <FileResourceViewer
                        contentId={item.id}
                        title={item.title}
                        courseId={courseId}
                    />
                )}
            </div>

            {/* Footer with Enrollment CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 bg-neutral-900 px-5 py-3.5">
                <p className="text-xs text-white/60 text-center sm:text-start">
                    {t(
                        'learning.previewBanner',
                        'Enjoying this preview? Enrol in the full course to unlock all lessons and resources.',
                    )}
                </p>
                {onEnroll && (
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="solid"
                            size="sm"
                            icon={<TbSchool />}
                            onClick={() => {
                                onClose()
                                onEnroll()
                            }}
                        >
                            {t('course.enroll', 'Enrol in Course')}
                        </Button>
                    </div>
                )}
            </div>
        </Dialog>
    )
}

export default PreviewPlayerModal
