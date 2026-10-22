import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Tooltip from '@/components/ui/Tooltip'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlinePlayCircle,
    HiOutlineDocumentText,
    HiOutlineClock,
    HiOutlineEye,
    HiOutlineLockClosed,
    HiOutlineChevronDown,
    HiOutlineChevronUp,
    HiOutlineFolderOpen,
    HiOutlineVideoCamera,
    HiOutlineArrowDownTray,
    HiOutlineAcademicCap,
    HiOutlineCalendar,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineMapPin,
} from 'react-icons/hi2'
import dayjs from 'dayjs'
import SectionModal from './SectionModal'
import CreateVideoModal from './CreateVideoModal'
import CreateFileModal from './CreateFileModal'
import CreateQuizModal from './CreateQuizModal'
import EditQuizModal from './EditQuizModal'
import LiveSessionModal from './LiveSessionModal'
import ContentMediaModal from './ContentMediaModal'
import AdminQuizModal from './AdminQuizModal'
import { getQuizIdFromMapping } from '@/services/QuizService'
import {
    apiDeleteSection,
    apiDeleteCourseContent,
    apiToggleContentPreview,
} from '@/services/CourseContentService'
import {
    ContentType,
    ContentItemStatus,
    CourseDeliveryType,
    SectionResponse,
    AdminCourseContentItemDto,
    CourseContentItemResponse,
    AdminCourseSectionDto,
    isLiveCourseType,
    isOnlineDeliveryMode,
    isOfflineDeliveryMode,
    isLiveSessionItem,
} from '@/@types/courseContent'
import {
    formatCourseDuration,
    formatVideoTimestamp,
} from '@/utils/formatDuration'

interface CourseCurriculumProps {
    courseId: number
    deliveryType?: CourseDeliveryType | string | number
    sections?: (AdminCourseSectionDto | SectionResponse)[]
    onRefresh: () => void
    onNotify?: (msg: string, type?: 'success' | 'danger') => void
}

const CourseCurriculum = ({
    courseId,
    deliveryType,
    sections = [],
    onRefresh,
    onNotify,
}: CourseCurriculumProps) => {
    const { t, i18n } = useTranslation()

    // Accordion expand/collapse state: stores open section IDs
    const [openSectionIds, setOpenSectionIds] = useState<number[]>(() =>
        sections.map((s) => s.id),
    )

    // Modals state
    const [sectionModalOpen, setSectionModalOpen] = useState<boolean>(false)
    const [sectionToEdit, setSectionToEdit] = useState<SectionResponse | null>(null)

    // Video Modal state
    const [videoModalOpen, setVideoModalOpen] = useState<boolean>(false)
    const [targetVideoSectionId, setTargetVideoSectionId] = useState<number | null>(null)
    const [videoToEdit, setVideoToEdit] = useState<CourseContentItemResponse | AdminCourseContentItemDto | null>(null)

    // File Modal state
    const [fileModalOpen, setFileModalOpen] = useState<boolean>(false)
    const [targetFileSectionId, setTargetFileSectionId] = useState<number | null>(null)
    const [fileToEdit, setFileToEdit] = useState<CourseContentItemResponse | AdminCourseContentItemDto | null>(null)

    // Edit Quiz Modal state
    const [editQuizModalOpen, setEditQuizModalOpen] = useState<boolean>(false)
    const [quizToEdit, setQuizToEdit] = useState<CourseContentItemResponse | AdminCourseContentItemDto | null>(null)

    // Live Session Modal state
    const isLiveCourse = isLiveCourseType(deliveryType, sections)
    const [liveSessionModalOpen, setLiveSessionModalOpen] = useState<boolean>(false)
    const [targetLiveSectionId, setTargetLiveSectionId] = useState<number | null>(null)
    const [liveSessionToEdit, setLiveSessionToEdit] = useState<CourseContentItemResponse | AdminCourseContentItemDto | null>(null)

    const handleOpenAddLiveSession = (secId: number) => {
        setTargetLiveSectionId(secId)
        setLiveSessionToEdit(null)
        setLiveSessionModalOpen(true)
    }

    const [mediaModalOpen, setMediaModalOpen] = useState<boolean>(false)
    const [mediaItem, setMediaItem] = useState<CourseContentItemResponse | null>(null)

    // Quiz Management Modal state (for existing quiz)
    const [quizModalOpen, setQuizModalOpen] = useState<boolean>(false)
    const [quizContentId, setQuizContentId] = useState<number | null>(null)
    const [quizId, setQuizId] = useState<number | null>(null)
    const [quizContentTitle, setQuizContentTitle] = useState<string>('')

    // Quiz Creation Modal state (for new quiz)
    const [createQuizModalOpen, setCreateQuizModalOpen] = useState<boolean>(false)
    const [targetQuizSectionId, setTargetQuizSectionId] = useState<number | null>(null)

    const handleOpenQuizModal = (item: CourseContentItemResponse | AdminCourseContentItemDto) => {
        const mappedId = getQuizIdFromMapping(item.id)
        setQuizContentId(item.id)
        setQuizId(item.quizId || mappedId || null)
        setQuizContentTitle(item.title)
        setQuizModalOpen(true)
    }

    // Deletion dialog states
    const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState<boolean>(false)
    const [sectionToDelete, setSectionToDelete] = useState<SectionResponse | null>(null)
    const [deletingSection, setDeletingSection] = useState<boolean>(false)

    const [deleteContentDialogOpen, setDeleteContentDialogOpen] = useState<boolean>(false)
    const [contentToDelete, setContentToDelete] = useState<CourseContentItemResponse | null>(null)
    const [deletingContent, setDeletingContent] = useState<boolean>(false)

    // Toggle Preview loading state map
    const [togglingPreviewId, setTogglingPreviewId] = useState<number | null>(null)

    // Helper to safely get content items for a section
    const getSectionItems = (
        section: AdminCourseSectionDto | SectionResponse,
    ): (AdminCourseContentItemDto | CourseContentItemResponse)[] => {
        if (section.items && Array.isArray(section.items)) {
            return section.items
        }
        const legacy = section as SectionResponse
        return legacy.contents || legacy.courseContents || []
    }

    // Stats calculations
    const stats = useMemo(() => {
        let totalVideos = 0
        let totalFiles = 0
        let totalLiveSessions = 0
        let totalDurationSeconds = 0

        sections.forEach((sec) => {
            const items = getSectionItems(sec)
            items.forEach((item) => {
                const isItemLive =
                    item.type === ContentType.LiveSession ||
                    item.type === 'LiveSession' ||
                    String(item.type) === '4'
                const isItemVideo =
                    !isItemLive &&
                    (item.type === ContentType.Video ||
                        item.type === 'Video' ||
                        String(item.type) === '1')
                const isItemFile =
                    !isItemLive &&
                    (item.type === ContentType.File ||
                        item.type === 'File' ||
                        String(item.type) === '2')

                if (isItemVideo) {
                    totalVideos++
                    if (item.status === ContentItemStatus.Published && item.duration) {
                        totalDurationSeconds += item.duration
                    }
                } else if (isItemFile) {
                    totalFiles++
                } else if (isItemLive) {
                    totalLiveSessions++
                }
            })
        })

        const totalHours = (totalDurationSeconds / 3600).toFixed(1)

        return {
            sectionsCount: sections.length,
            totalVideos,
            totalFiles,
            totalLiveSessions,
            totalDurationSeconds,
            totalHours,
        }
    }, [sections])

    // Accordion toggle helpers
    const toggleSection = (id: number) => {
        setOpenSectionIds((prev) =>
            prev.includes(id) ? prev.filter((secId) => secId !== id) : [...prev, id],
        )
    }

    const expandAll = () => {
        setOpenSectionIds(sections.map((s) => s.id))
    }

    const collapseAll = () => {
        setOpenSectionIds([])
    }

    // Section CRUD Actions
    const handleOpenAddSection = () => {
        setSectionToEdit(null)
        setSectionModalOpen(true)
    }

    const handleOpenEditSection = (section: SectionResponse) => {
        setSectionToEdit(section)
        setSectionModalOpen(true)
    }

    const handleConfirmDeleteSection = async () => {
        if (!sectionToDelete) return
        setDeletingSection(true)
        try {
            const res = await apiDeleteSection(sectionToDelete.id)
            if (res?.isSuccess || res?.status) {
                onNotify?.(res.message || t('courseManagement.sectionDeleteSuccess', 'تم حذف القسم بنجاح.'), 'success')
                setDeleteSectionDialogOpen(false)
                setSectionToDelete(null)
                onRefresh()
            } else {
                onNotify?.(res?.message || t('common.operationFailed', 'فشل حذف القسم.'), 'danger')
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            onNotify?.(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'), 'danger')
        } finally {
            setDeletingSection(false)
        }
    }

    // Content Item CRUD Actions
    const handleOpenAddVideo = (secId: number) => {
        setTargetVideoSectionId(secId)
        setVideoToEdit(null)
        setVideoModalOpen(true)
    }

    const handleOpenAddFile = (secId: number) => {
        setTargetFileSectionId(secId)
        setFileToEdit(null)
        setFileModalOpen(true)
    }

    const handleOpenAddQuiz = (secId: number) => {
        setTargetQuizSectionId(secId)
        setCreateQuizModalOpen(true)
    }

    const handleOpenEditContent = (
        item: CourseContentItemResponse | AdminCourseContentItemDto,
        secId: number,
    ) => {
        const itemTypeNum = Number(item.type)
        if (
            itemTypeNum === ContentType.LiveSession ||
            item.type === 'LiveSession' ||
            String(item.type) === '4'
        ) {
            setTargetLiveSectionId(secId)
            setLiveSessionToEdit(item)
            setLiveSessionModalOpen(true)
        } else if (
            itemTypeNum === ContentType.Quiz ||
            item.type === 'Quiz' ||
            String(item.type) === '3'
        ) {
            setQuizToEdit(item)
            setEditQuizModalOpen(true)
        } else if (
            itemTypeNum === ContentType.File ||
            item.type === 'File' ||
            String(item.type) === '2'
        ) {
            setTargetFileSectionId(secId)
            setFileToEdit(item)
            setFileModalOpen(true)
        } else {
            setTargetVideoSectionId(secId)
            setVideoToEdit(item)
            setVideoModalOpen(true)
        }
    }

    const handleConfirmDeleteContent = async () => {
        if (!contentToDelete) return
        setDeletingContent(true)
        try {
            const res = await apiDeleteCourseContent(contentToDelete.id)
            if (res?.isSuccess || res?.status) {
                onNotify?.(res.message || t('courseManagement.contentDeleteSuccess', 'تم حذف المحتوى بنجاح.'), 'success')
                setDeleteContentDialogOpen(false)
                setContentToDelete(null)
                onRefresh()
            } else {
                onNotify?.(res?.message || t('common.operationFailed', 'فشل حذف المحتوى.'), 'danger')
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            onNotify?.(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'), 'danger')
        } finally {
            setDeletingContent(false)
        }
    }

    // Toggle Preview Status
    const handleTogglePreview = async (item: CourseContentItemResponse) => {
        setTogglingPreviewId(item.id)
        try {
            const res = await apiToggleContentPreview(item.id)
            if (res?.isSuccess || res?.status) {
                onNotify?.(t('courseManagement.previewToggled', 'تم تحديث حالة المعاينة.'), 'success')
                onRefresh()
            } else {
                onNotify?.(res?.message || t('common.operationFailed', 'فشل تغيير حالة المعاينة.'), 'danger')
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            onNotify?.(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'), 'danger')
        } finally {
            setTogglingPreviewId(null)
        }
    }

    // Play / Access Media
    const handleOpenMedia = (item: CourseContentItemResponse) => {
        setMediaItem(item)
        setMediaModalOpen(true)
    }

    const renderStatusBadge = (status: ContentItemStatus) => {
        switch (status) {
            case ContentItemStatus.Published:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t('courseManagement.published', 'منشور')}
                    </span>
                )
            case ContentItemStatus.Archived:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t('courseManagement.archived', 'مؤرشف')}
                    </span>
                )
            case ContentItemStatus.Draft:
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        {t('courseManagement.draft', 'مسودة')}
                    </span>
                )
        }
    }

    return (
        <div className="space-y-6">
            {/* Header & Stats Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs">
                <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <HiOutlineFolderOpen className="text-lg" />
                        </div>
                        <div>
                            <span className="text-gray-400 block">{t('courseManagement.totalSections', 'الأقسام')}</span>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                                {stats.sectionsCount}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <HiOutlineVideoCamera className="text-lg" />
                        </div>
                        <div>
                            <span className="text-gray-400 block">{t('courseManagement.totalLessons', 'الدروس المرئية')}</span>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                                {stats.totalVideos}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <HiOutlineDocumentText className="text-lg" />
                        </div>
                        <div>
                            <span className="text-gray-400 block">{t('courseManagement.totalFiles', 'الملفات')}</span>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                                {stats.totalFiles}
                            </span>
                        </div>
                    </div>

                    {(isLiveCourse || stats.totalLiveSessions > 0) && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <HiOutlineVideoCamera className="text-lg" />
                            </div>
                            <div>
                                <span className="text-gray-400 block">{t('courseManagement.totalLiveSessions', 'الجلسات المباشرة')}</span>
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-100">
                                    {stats.totalLiveSessions}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                            <HiOutlineClock className="text-lg" />
                        </div>
                        <div>
                            <span className="text-gray-400 block">{t('courseManagement.totalCurriculumDuration', 'إجمالي المدة')}</span>
                            <span className="font-bold text-sm text-gray-800 dark:text-gray-100 dir-ltr inline-block">
                                {formatCourseDuration(
                                    stats.totalDurationSeconds,
                                    i18n?.language === 'en' ? 'en' : 'ar',
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto">
                    {sections.length > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                            <Button
                                size="xs"
                                variant="plain"
                                onClick={expandAll}
                            >
                                {t('courseManagement.expandAll', 'توسيع الكل')}
                            </Button>
                            <span className="text-gray-300">|</span>
                            <Button
                                size="xs"
                                variant="plain"
                                onClick={collapseAll}
                            >
                                {t('courseManagement.collapseAll', 'طي الكل')}
                            </Button>
                        </div>
                    )}

                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={handleOpenAddSection}
                    >
                        {t('courseManagement.addSection', 'إضافة قسم جديد')}
                    </Button>
                </div>
            </div>

            {/* Empty State when no sections */}
            {sections.length === 0 && (
                <Card className="border border-dashed border-gray-200 dark:border-gray-700 text-center py-12">
                    <HiOutlineFolderOpen className="text-6xl mx-auto text-indigo-400 mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {t('courseManagement.noSectionsYet', 'لا توجد أقسام في هذه الدورة بعد')}
                    </h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                        {t('courseManagement.noSectionsDesc', 'ابدأ بتنظيم الدورة التدريبية من خلال إضافة الأقسام والفصول، ثم قم برفع الدروس المرئية والموارد داخل كل قسم.')}
                    </p>
                    <Button
                        variant="solid"
                        icon={<HiOutlinePlus />}
                        onClick={handleOpenAddSection}
                    >
                        {t('courseManagement.addFirstSection', 'إضافة القسم الأول')}
                    </Button>
                </Card>
            )}

            {/* Sections Accordion List */}
            {sections.length > 0 && (
                <div className="space-y-4">
                    {sections.map((section, index) => {
                        const isOpen = openSectionIds.includes(section.id)
                        const items = getSectionItems(section)
                        const videoCount = items.filter((i) => i.type === ContentType.Video).length
                        const fileCount = items.filter((i) => i.type === ContentType.File).length
                        const liveCount = items.filter(
                            (i) => i.type === ContentType.LiveSession || i.type === 'LiveSession' || String(i.type) === '4'
                        ).length

                        return (
                            <div
                                key={section.id}
                                className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs overflow-hidden transition-all"
                            >
                                {/* Section Header */}
                                <div
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 cursor-pointer select-none transition-colors ${
                                        isOpen
                                            ? 'bg-gray-50/80 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800'
                                            : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
                                    }`}
                                    onClick={() => toggleSection(section.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                                    {section.title}
                                                </h4>
                                                <span className="text-[11px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full font-medium">
                                                    {items.length} {t('courseManagement.items', 'عناصر')}
                                                    {videoCount > 0 && ` • ${videoCount} ${t('courseManagement.videos', 'فيديو')}`}
                                                    {fileCount > 0 && ` • ${fileCount} ${t('courseManagement.files', 'ملف')}`}
                                                    {liveCount > 0 && ` • ${liveCount} ${t('courseManagement.liveSessions', 'جلسة مباشرة')}`}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div
                                        className="flex items-center gap-1.5 self-end sm:self-auto"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {/* Distinct Add Content Buttons */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {isLiveCourse && (
                                                <Button
                                                    size="xs"
                                                    variant="twoTone"
                                                    className="text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300"
                                                    icon={<HiOutlineVideoCamera className="text-sm" />}
                                                    onClick={() => handleOpenAddLiveSession(section.id)}
                                                >
                                                    <span className="text-[11px] font-bold">{t('courseManagement.addLiveSessionBtn', '+ جلسة مباشرة')}</span>
                                                </Button>
                                            )}

                                            <Button
                                                size="xs"
                                                variant="twoTone"
                                                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300"
                                                icon={<HiOutlinePlayCircle className="text-sm" />}
                                                onClick={() => handleOpenAddVideo(section.id)}
                                            >
                                                <span className="text-[11px] font-bold">{t('courseManagement.addVideoBtn', '+ فيديو')}</span>
                                            </Button>

                                            <Button
                                                size="xs"
                                                variant="twoTone"
                                                className="text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
                                                icon={<HiOutlineDocumentText className="text-sm" />}
                                                onClick={() => handleOpenAddFile(section.id)}
                                            >
                                                <span className="text-[11px] font-bold">{t('courseManagement.addFileBtn', '+ ملف')}</span>
                                            </Button>

                                            <Button
                                                size="xs"
                                                variant="twoTone"
                                                className="text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                                                icon={<HiOutlineAcademicCap className="text-sm" />}
                                                onClick={() => handleOpenAddQuiz(section.id)}
                                            >
                                                <span className="text-[11px] font-bold">{t('courseManagement.addQuizBtn', '+ كويز')}</span>
                                            </Button>
                                        </div>

                                        <Tooltip title={t('courseManagement.editSectionTitle', 'تعديل عنوان القسم')}>
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                icon={<HiOutlinePencil className="text-base text-gray-500 hover:text-indigo-600" />}
                                                onClick={() => handleOpenEditSection(section)}
                                            />
                                        </Tooltip>

                                        <Tooltip title={t('courseManagement.deleteSectionTitle', 'حذف القسم ومحتوياته')}>
                                            <Button
                                                size="xs"
                                                variant="plain"
                                                icon={<HiOutlineTrash className="text-base text-gray-400 hover:text-red-600" />}
                                                onClick={() => {
                                                    setSectionToDelete(section)
                                                    setDeleteSectionDialogOpen(true)
                                                }}
                                            />
                                        </Tooltip>

                                        <button
                                            type="button"
                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                            onClick={() => toggleSection(section.id)}
                                        >
                                            {isOpen ? (
                                                <HiOutlineChevronUp className="text-lg" />
                                            ) : (
                                                <HiOutlineChevronDown className="text-lg" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Section Body: Content Items */}
                                {isOpen && (
                                    <div className="p-4 bg-gray-50/30 dark:bg-gray-900/40">
                                        {items.length === 0 ? (
                                            <div className="py-6 px-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-850">
                                                <p className="text-xs text-gray-500 mb-3">
                                                    {t('courseManagement.noContentInSection', 'لا يوجد محتوى في هذا القسم حتى الآن.')}
                                                </p>
                                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                                    {isLiveCourse && (
                                                        <Button
                                                            size="xs"
                                                            variant="solid"
                                                            className="bg-rose-600 hover:bg-rose-700 text-white"
                                                            icon={<HiOutlineVideoCamera />}
                                                            onClick={() => handleOpenAddLiveSession(section.id)}
                                                        >
                                                            {t('courseManagement.addLiveSessionBtn', '+ جلسة مباشرة')}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="xs"
                                                        variant="solid"
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        icon={<HiOutlinePlayCircle />}
                                                        onClick={() => handleOpenAddVideo(section.id)}
                                                    >
                                                        {t('courseManagement.addVideoLesson', 'إضافة درس فيديو')}
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="solid"
                                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                                        icon={<HiOutlineDocumentText />}
                                                        onClick={() => handleOpenAddFile(section.id)}
                                                    >
                                                        {t('courseManagement.addResourceFile', 'إضافة ملف مرفق')}
                                                    </Button>
                                                    <Button
                                                        size="xs"
                                                        variant="solid"
                                                        className="bg-amber-600 hover:bg-amber-700 text-white"
                                                        icon={<HiOutlineAcademicCap />}
                                                        onClick={() => handleOpenAddQuiz(section.id)}
                                                    >
                                                        {t('courseManagement.addQuizContent', 'إضافة اختبار / كويز')}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-2.5">
                                                {items.map((item, itemIdx) => {
                                                    const isLive =
                                                        item.type === ContentType.LiveSession ||
                                                        item.type === 'LiveSession' ||
                                                        String(item.type) === '4'
                                                    const isQuiz =
                                                        !isLive &&
                                                        (item.type === ContentType.Quiz ||
                                                            item.type === 'Quiz' ||
                                                            String(item.type) === '3')
                                                    const isVideo =
                                                        !isLive &&
                                                        !isQuiz &&
                                                        (item.type === ContentType.Video ||
                                                            item.type === 'Video' ||
                                                            String(item.type) === '1')

                                                    return (
                                                        <div
                                                            key={item.id}
                                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 shadow-2xs hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all"
                                                        >
                                                            {/* Left info */}
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div
                                                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                                        isLive
                                                                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                                                                            : isQuiz
                                                                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                                                                              : isVideo
                                                                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                                                                                : 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                                                                    }`}
                                                                >
                                                                    {isLive ? (
                                                                        <HiOutlineVideoCamera className="text-xl" />
                                                                    ) : isQuiz ? (
                                                                        <HiOutlineAcademicCap className="text-xl" />
                                                                    ) : isVideo ? (
                                                                        <HiOutlinePlayCircle className="text-xl" />
                                                                    ) : (
                                                                        <HiOutlineDocumentText className="text-xl" />
                                                                    )}
                                                                </div>

                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-xs text-gray-400 font-semibold">
                                                                            {itemIdx + 1}.
                                                                        </span>
                                                                        <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                                                            {item.title}
                                                                        </h5>
                                                                    </div>

                                                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 flex-wrap">
                                                                        {isLive && (
                                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                                <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                                                                                    <span className="relative flex h-2 w-2">
                                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                                                    </span>
                                                                                    {t('liveSessions.liveSession', 'جلسة مباشرة')}
                                                                                </span>
                                                                                {item.liveSession?.scheduledStartTime && (
                                                                                    <span className="flex items-center gap-1 text-gray-500">
                                                                                        <HiOutlineCalendar className="text-xs text-gray-400" />
                                                                                        {dayjs(item.liveSession.scheduledStartTime).format('DD/MM/YYYY hh:mm A')}
                                                                                    </span>
                                                                                )}
                                                                                {item.liveSession?.deliveryMode !== undefined && (
                                                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium">
                                                                                        {isOnlineDeliveryMode(item.liveSession.deliveryMode)
                                                                                            ? t('liveSessions.online', 'أونلاين')
                                                                                            : t('liveSessions.offline', 'حضوري')}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {isVideo && (
                                                                            <span className="flex items-center gap-1 dir-ltr">
                                                                                <HiOutlineClock className="text-xs text-gray-400" />
                                                                                {formatVideoTimestamp(item.duration)}
                                                                            </span>
                                                                        )}
                                                                        {isQuiz && (
                                                                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                                                {t('quiz.assessmentItem', 'اختبار وتقييم')}
                                                                            </span>
                                                                        )}
                                                                        {!isLive && !isVideo && !isQuiz && (
                                                                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                                                                                {t('courseManagement.downloadableResource', 'مورد قابل للتحميل')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Right badges & actions */}
                                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                                                                {/* Free Preview badge */}
                                                                {item.isPreview ? (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                        <HiOutlineEye className="text-xs" />
                                                                        {t('courseManagement.freePreviewBadge', 'معاينة مجانية')}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                                                                        <HiOutlineLockClosed className="text-xs" />
                                                                        {t('courseManagement.enrolledOnlyBadge', 'خاص بالمشتركين')}
                                                                    </span>
                                                                )}

                                                                {/* Status badge */}
                                                                {renderStatusBadge(item.status)}

                                                                {/* Action Buttons */}
                                                                <div className="flex items-center gap-1 border-r border-gray-100 dark:border-gray-700 pr-2 mr-1">
                                                                    {isLive ? (
                                                                        isOfflineDeliveryMode(item.liveSession?.deliveryMode) ? (
                                                                            item.liveSession?.locationUrl ? (
                                                                                <Tooltip title={t('liveSessions.openLocationMap', 'فتح موقع الحضور على الخريطة')}>
                                                                                    <Button
                                                                                        size="xs"
                                                                                        variant="plain"
                                                                                        icon={<HiOutlineMapPin className="text-lg text-rose-600 hover:scale-110 transition-transform" />}
                                                                                        onClick={() => window.open(item.liveSession?.locationUrl || '', '_blank')}
                                                                                    />
                                                                                </Tooltip>
                                                                            ) : null
                                                                        ) : item.liveSession?.meetingUrl ? (
                                                                            <Tooltip title={t('liveSessions.joinMeeting', 'رابط الاجتماع')}>
                                                                                <Button
                                                                                    size="xs"
                                                                                    variant="plain"
                                                                                    icon={<HiOutlineArrowTopRightOnSquare className="text-lg text-rose-600 hover:scale-110 transition-transform" />}
                                                                                    onClick={() => window.open(item.liveSession?.meetingUrl || '', '_blank')}
                                                                                />
                                                                            </Tooltip>
                                                                        ) : null
                                                                    ) : isQuiz ? (
                                                                        <Tooltip title={t('quiz.manageQuizBtn', 'إدارة أسئلة وخيارات الاختبار')}>
                                                                            <Button
                                                                                size="xs"
                                                                                variant="twoTone"
                                                                                icon={<HiOutlineAcademicCap className="text-amber-600 dark:text-amber-400 text-sm" />}
                                                                                onClick={() => handleOpenQuizModal(item)}
                                                                            >
                                                                                <span className="hidden sm:inline ms-1">{t('quiz.questions', 'الأسئلة')}</span>
                                                                            </Button>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        /* Play / Access test */
                                                                        <Tooltip
                                                                            title={
                                                                                isVideo
                                                                                    ? t('courseManagement.playVideo', 'تشغيل ومعاينة الفيديو')
                                                                                    : t('courseManagement.downloadFile', 'تحميل الملف')
                                                                            }
                                                                        >
                                                                            <Button
                                                                                size="xs"
                                                                                variant="plain"
                                                                                icon={
                                                                                    isVideo ? (
                                                                                        <HiOutlinePlayCircle className="text-lg text-blue-600 hover:scale-110 transition-transform" />
                                                                                    ) : (
                                                                                        <HiOutlineArrowDownTray className="text-lg text-purple-600 hover:scale-110 transition-transform" />
                                                                                    )
                                                                                }
                                                                                onClick={() => handleOpenMedia(item)}
                                                                            />
                                                                        </Tooltip>
                                                                    )}

                                                                    {/* Quick toggle preview */}
                                                                    <Tooltip
                                                                        title={
                                                                            item.isPreview
                                                                                ? t('courseManagement.makeLocked', 'قفل المحتوى للمشتركين فقط')
                                                                                : t('courseManagement.makeFreePreview', 'جعله متاحاً للمعاينة المجانية')
                                                                        }
                                                                    >
                                                                        <Button
                                                                            size="xs"
                                                                            variant="plain"
                                                                            loading={togglingPreviewId === item.id}
                                                                            icon={
                                                                                item.isPreview ? (
                                                                                    <HiOutlineLockClosed className="text-base text-gray-400 hover:text-amber-600" />
                                                                                ) : (
                                                                                    <HiOutlineEye className="text-base text-gray-400 hover:text-emerald-600" />
                                                                                )
                                                                            }
                                                                            onClick={() => handleTogglePreview(item)}
                                                                        />
                                                                    </Tooltip>

                                                                    {/* Edit content */}
                                                                    <Tooltip title={t('courseManagement.editContent', 'تعديل الدرس')}>
                                                                        <Button
                                                                            size="xs"
                                                                            variant="plain"
                                                                            icon={<HiOutlinePencil className="text-base text-gray-400 hover:text-indigo-600" />}
                                                                            onClick={() => handleOpenEditContent(item, section.id)}
                                                                        />
                                                                    </Tooltip>

                                                                    {/* Delete content */}
                                                                    <Tooltip title={t('courseManagement.deleteContent', 'حذف الدرس')}>
                                                                        <Button
                                                                            size="xs"
                                                                            variant="plain"
                                                                            icon={<HiOutlineTrash className="text-base text-gray-400 hover:text-red-600" />}
                                                                            onClick={() => {
                                                                                setContentToDelete(item)
                                                                                setDeleteContentDialogOpen(true)
                                                                            }}
                                                                        />
                                                                    </Tooltip>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Bottom Quick-Add Actions */}
                                            <div className="flex items-center justify-center sm:justify-start gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800/80 flex-wrap">
                                                <span className="text-[11px] text-gray-400 font-medium">
                                                    {t('courseManagement.quickAddPrompt', 'إضافة سريعة:')}
                                                </span>
                                                {isLiveCourse && (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors"
                                                        onClick={() => handleOpenAddLiveSession(section.id)}
                                                    >
                                                        <HiOutlineVideoCamera className="text-sm" />
                                                        <span>{t('courseManagement.addLiveSessionBtn', '+ جلسة مباشرة')}</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 transition-colors"
                                                    onClick={() => handleOpenAddVideo(section.id)}
                                                >
                                                    <HiOutlinePlayCircle className="text-sm" />
                                                    <span>{t('courseManagement.addVideoBtn', '+ فيديو')}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 transition-colors"
                                                    onClick={() => handleOpenAddFile(section.id)}
                                                >
                                                    <HiOutlineDocumentText className="text-sm" />
                                                    <span>{t('courseManagement.addFileBtn', '+ ملف')}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition-colors"
                                                    onClick={() => handleOpenAddQuiz(section.id)}
                                                >
                                                    <HiOutlineAcademicCap className="text-sm" />
                                                    <span>{t('courseManagement.addQuizBtn', '+ كويز')}</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modals & Dialogs */}
            <SectionModal
                isOpen={sectionModalOpen}
                courseId={courseId}
                sectionToEdit={sectionToEdit}
                onClose={() => setSectionModalOpen(false)}
                onSuccess={(msg) => {
                    onNotify?.(msg || t('courseManagement.sectionSuccess', 'تم تنفيذ العملية بنجاح.'), 'success')
                    onRefresh()
                }}
            />

            {targetVideoSectionId !== null && (
                <CreateVideoModal
                    isOpen={videoModalOpen}
                    sectionId={targetVideoSectionId}
                    itemToEdit={videoToEdit}
                    onClose={() => {
                        setVideoModalOpen(false)
                        setTargetVideoSectionId(null)
                        setVideoToEdit(null)
                    }}
                    onSuccess={(msg) => {
                        onNotify?.(msg || t('courseManagement.contentSuccess', 'تم تنفيذ العملية بنجاح.'), 'success')
                        onRefresh()
                    }}
                />
            )}

            {targetFileSectionId !== null && (
                <CreateFileModal
                    isOpen={fileModalOpen}
                    sectionId={targetFileSectionId}
                    itemToEdit={fileToEdit}
                    onClose={() => {
                        setFileModalOpen(false)
                        setTargetFileSectionId(null)
                        setFileToEdit(null)
                    }}
                    onSuccess={(msg) => {
                        onNotify?.(msg || t('courseManagement.contentSuccess', 'تم تنفيذ العملية بنجاح.'), 'success')
                        onRefresh()
                    }}
                />
            )}

            {createQuizModalOpen && targetQuizSectionId !== null && (
                <CreateQuizModal
                    isOpen={createQuizModalOpen}
                    sectionId={targetQuizSectionId}
                    onClose={() => {
                        setCreateQuizModalOpen(false)
                        setTargetQuizSectionId(null)
                    }}
                    onSuccess={(msg) => {
                        onNotify?.(msg || t('quiz.createSuccess', 'تم إنشاء الاختبار بنجاح'), 'success')
                        onRefresh()
                    }}
                />
            )}

            {editQuizModalOpen && quizToEdit && (
                <EditQuizModal
                    isOpen={editQuizModalOpen}
                    itemToEdit={quizToEdit}
                    onClose={() => {
                        setEditQuizModalOpen(false)
                        setQuizToEdit(null)
                    }}
                    onSuccess={(msg) => {
                        onNotify?.(msg || t('quiz.updateSuccess', 'تم تحديث بيانات الاختبار بنجاح.'), 'success')
                        onRefresh()
                    }}
                    onManageQuestions={(item) => {
                        handleOpenQuizModal(item)
                    }}
                />
            )}

            <ContentMediaModal
                isOpen={mediaModalOpen}
                item={mediaItem}
                onClose={() => {
                    setMediaModalOpen(false)
                    setMediaItem(null)
                }}
            />

            {quizModalOpen && quizContentId !== null && (
                <AdminQuizModal
                    isOpen={quizModalOpen}
                    contentId={quizContentId}
                    quizId={quizId}
                    initialTitle={quizContentTitle}
                    onClose={() => {
                        setQuizModalOpen(false)
                        setQuizContentId(null)
                        setQuizId(null)
                    }}
                    onSuccess={(msg) => {
                        onNotify?.(msg || t('quiz.quizUpdatedSuccess', 'تم تحديث الاختبار بنجاح'), 'success')
                        onRefresh()
                    }}
                />
            )}

            {targetLiveSectionId !== null && (
                <LiveSessionModal
                    isOpen={liveSessionModalOpen}
                    sectionId={targetLiveSectionId}
                    itemToEdit={liveSessionToEdit}
                    onClose={() => {
                        setLiveSessionModalOpen(false)
                        setTargetLiveSectionId(null)
                        setLiveSessionToEdit(null)
                    }}
                    onSuccess={(msg) => {
                        onNotify?.(msg || t('liveSessions.success', 'تم تنفيذ العملية بنجاح.'), 'success')
                        onRefresh()
                    }}
                />
            )}

            {/* Delete Section Confirm Dialog */}
            <ConfirmDialog
                isOpen={deleteSectionDialogOpen}
                type="danger"
                title={t('courseManagement.confirmDeleteSectionTitle', 'تأكيد حذف القسم')}
                confirmText={t('common.delete', 'حذف')}
                cancelText={t('common.cancel', 'إلغاء')}
                confirmButtonProps={{
                    loading: deletingSection,
                    customColorClass: () => 'bg-red-600 hover:bg-red-700 text-white',
                }}
                onClose={() => {
                    setDeleteSectionDialogOpen(false)
                    setSectionToDelete(null)
                }}
                onCancel={() => {
                    setDeleteSectionDialogOpen(false)
                    setSectionToDelete(null)
                }}
                onConfirm={handleConfirmDeleteSection}
            >
                <div className="space-y-2">
                    <p>
                        {t(
                            'courseManagement.confirmDeleteSectionMessage',
                            'هل أنت متأكد من رغبتك في حذف القسم "{title}"؟',
                            { title: sectionToDelete?.title || '' },
                        )}
                    </p>
                    <p className="text-xs text-red-600 font-semibold">
                        {t(
                            'courseManagement.deleteSectionCascadeWarning',
                            'تنبيه: سيتم حذف جميع الدروس والملفات التابعة لهذا القسم تلقائياً، وسيتم خصم مدد الفيديوهات المنشورة من إجمالي مدة الدورة.',
                        )}
                    </p>
                </div>
            </ConfirmDialog>

            {/* Delete Content Item Confirm Dialog */}
            <ConfirmDialog
                isOpen={deleteContentDialogOpen}
                type="danger"
                title={t('courseManagement.confirmDeleteContentTitle', 'تأكيد حذف المحتوى')}
                confirmText={t('common.delete', 'حذف')}
                cancelText={t('common.cancel', 'إلغاء')}
                confirmButtonProps={{
                    loading: deletingContent,
                    customColorClass: () => 'bg-red-600 hover:bg-red-700 text-white',
                }}
                onClose={() => {
                    setDeleteContentDialogOpen(false)
                    setContentToDelete(null)
                }}
                onCancel={() => {
                    setDeleteContentDialogOpen(false)
                    setContentToDelete(null)
                }}
                onConfirm={handleConfirmDeleteContent}
            >
                <div className="space-y-2">
                    <p>
                        {t(
                            'courseManagement.confirmDeleteContentMessage',
                            'هل أنت متأكد من رغبتك في حذف "{title}"؟',
                            { title: contentToDelete?.title || '' },
                        )}
                    </p>
                    {contentToDelete?.type === ContentType.Video &&
                        contentToDelete.status === ContentItemStatus.Published && (
                            <p className="text-xs text-amber-600">
                                {t(
                                    'courseManagement.deleteVideoDurationDeductNote',
                                    'ملاحظة: سيتم خصم مدة هذا الفيديو المنشور من إجمالي مدة الدورة تلقائياً.',
                                )}
                            </p>
                        )}
                </div>
            </ConfirmDialog>
        </div>
    )
}

export default CourseCurriculum
