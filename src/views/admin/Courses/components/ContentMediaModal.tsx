import { useEffect, useState, useCallback } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Loading from '@/components/shared/Loading'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlineArrowDownTray,
    HiOutlinePlayCircle,
    HiOutlineDocumentText,
    HiOutlineArrowPath,
} from 'react-icons/hi2'
import { apiGetCourseContentAccess } from '@/services/CourseContentService'
import {
    ContentType,
    CourseContentItemResponse,
    AdminCourseContentItemDto,
    ContentAccessDelivery,
} from '@/@types/courseContent'

interface ContentMediaModalProps {
    isOpen: boolean
    onClose: () => void
    item: AdminCourseContentItemDto | CourseContentItemResponse | null
}

const ContentMediaModal = ({ isOpen, onClose, item }: ContentMediaModalProps) => {
    const { t } = useTranslation()
    const [loading, setLoading] = useState<boolean>(false)
    const [delivery, setDelivery] = useState<ContentAccessDelivery | null>(null)
    const [errorMsg, setErrorMsg] = useState<string>('')

    const fetchAccess = useCallback(async () => {
        if (!item?.id) return
        setLoading(true)
        setErrorMsg('')
        setDelivery(null)
        try {
            const res = await apiGetCourseContentAccess(item.id)
            if ((res?.isSuccess || res?.status) && res.data?.delivery) {
                setDelivery(res.data.delivery)
            } else {
                setErrorMsg(res?.message || t('courseManagement.mediaAccessFailed', 'تعذر الوصول لمحتوى الوسائط.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('courseManagement.mediaAccessFailed', 'تعذر الوصول لمحتوى الوسائط.'),
            )
        } finally {
            setLoading(false)
        }
    }, [item?.id, t])

    useEffect(() => {
        if (isOpen && item) {
            fetchAccess()
        } else {
            setDelivery(null)
            setErrorMsg('')
        }
    }, [isOpen, item, fetchAccess])

    const isVideo = item?.type === ContentType.Video

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={750}>
            <div className="p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <div className="flex items-center gap-3">
                        {isVideo ? (
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
                                <HiOutlinePlayCircle className="text-2xl" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600">
                                <HiOutlineDocumentText className="text-2xl" />
                            </div>
                        )}
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                                {item?.title}
                            </h3>
                        </div>
                    </div>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <Loading loading={true} />
                        <p className="text-xs text-gray-500">
                            {t('courseManagement.generatingSignedUrl', 'جاري إنشاء رابط وصول آمن وموقّع...')}
                        </p>
                    </div>
                )}

                {errorMsg && (
                    <div className="py-4 space-y-3">
                        <Alert type="danger">{errorMsg}</Alert>
                        <div className="flex justify-center">
                            <Button
                                size="sm"
                                icon={<HiOutlineArrowPath />}
                                onClick={fetchAccess}
                            >
                                {t('common.retry', 'إعادة المحاولة')}
                            </Button>
                        </div>
                    </div>
                )}

                {!loading && delivery?.url && (
                    <div className="space-y-4">
                        {isVideo ? (
                            <div className="relative rounded-xl overflow-hidden bg-black aspect-video shadow-lg">
                                <video
                                    src={delivery.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain"
                                    controlsList="nodownload"
                                />
                            </div>
                        ) : (
                            <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40 text-center space-y-4">
                                <HiOutlineDocumentText className="text-5xl mx-auto text-purple-500" />
                                <div>
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100">
                                        {item?.title}
                                    </h4>
                                </div>
                                <a
                                    href={delivery.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="inline-block"
                                >
                                    <Button
                                        variant="solid"
                                        icon={<HiOutlineArrowDownTray />}
                                    >
                                        {t('common.downloadFile', 'تحميل الملف')}
                                    </Button>
                                </a>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
                    <Button variant="plain" onClick={onClose}>
                        {t('common.close', 'إغلاق')}
                    </Button>
                </div>
            </div>
        </Dialog>
    )
}

export default ContentMediaModal
