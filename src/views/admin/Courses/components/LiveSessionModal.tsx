import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import DatePicker from '@/components/ui/DatePicker'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlineVideoCamera,
    HiOutlineMapPin,
    HiOutlineGlobeAlt,
    HiOutlineClock,
    HiOutlineLockClosed,
    HiOutlineEye,
} from 'react-icons/hi2'
import {
    apiCreateCourseContent,
    apiUpdateCourseContent,
    apiDeleteCourseContent,
} from '@/services/CourseContentService'
import {
    apiCreateLiveSession,
    apiGetLiveSessionByContentId,
    apiUpdateLiveSession,
} from '@/services/LiveSessionService'
import {
    ContentType,
    ContentItemStatus,
    LiveSessionDeliveryMode,
    CourseContentItemResponse,
    AdminCourseContentItemDto,
    isOfflineDeliveryMode,
} from '@/@types/courseContent'

export interface LiveSessionModalProps {
    isOpen: boolean
    onClose: () => void
    sectionId: number
    itemToEdit?: AdminCourseContentItemDto | CourseContentItemResponse | null
    onSuccess: (message?: string) => void
}

export const LiveSessionModal = ({
    isOpen,
    onClose,
    sectionId,
    itemToEdit,
    onSuccess,
}: LiveSessionModalProps) => {
    const { t } = useTranslation()
    const isEdit = Boolean(itemToEdit)

    // Form fields
    const [title, setTitle] = useState<string>('')
    const [isPreview, setIsPreview] = useState<boolean>(false)
    const [status, setStatus] = useState<ContentItemStatus>(
        ContentItemStatus.Published,
    )
    const [scheduledStartTime, setScheduledStartTime] = useState<Date | null>(
        null,
    )
    const [deliveryMode, setDeliveryMode] =
        useState<LiveSessionDeliveryMode>('Online')
    const [meetingUrl, setMeetingUrl] = useState<string>('')
    const [location, setLocation] = useState<string>('')
    const [locationUrl, setLocationUrl] = useState<string>('')

    // Original start time to detect changes during edit
    const [originalStartTime, setOriginalStartTime] = useState<string | null>(
        null,
    )

    // Component states
    const [loadingDetails, setLoadingDetails] = useState<boolean>(false)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({})

    useEffect(() => {
        if (!isOpen) return

        setErrorMsg('')
        setFormErrors({})

        if (itemToEdit) {
            setTitle(itemToEdit.title || '')
            setIsPreview(Boolean(itemToEdit.isPreview))
            setStatus(itemToEdit.status || ContentItemStatus.Published)

            // If liveSession is already attached to itemToEdit
            if (itemToEdit.liveSession) {
                const s = itemToEdit.liveSession
                setDeliveryMode(
                    isOfflineDeliveryMode(s.deliveryMode) ? 'InPerson' : 'Online',
                )
                setMeetingUrl(s.meetingUrl || '')
                setLocation(s.location || '')
                setLocationUrl(s.locationUrl || '')
                if (s.scheduledStartTime) {
                    setScheduledStartTime(new Date(s.scheduledStartTime))
                    setOriginalStartTime(s.scheduledStartTime)
                } else {
                    setScheduledStartTime(null)
                    setOriginalStartTime(null)
                }
            } else {
                // Fetch from satellite endpoint
                setLoadingDetails(true)
                apiGetLiveSessionByContentId(itemToEdit.id)
                    .then((res) => {
                        if (res?.status && res.data) {
                            const data = res.data
                            setDeliveryMode(
                                isOfflineDeliveryMode(data.deliveryMode)
                                    ? 'InPerson'
                                    : 'Online',
                            )
                            setMeetingUrl(data.meetingUrl || '')
                            setLocation(data.location || '')
                            setLocationUrl(data.locationUrl || '')
                            if (data.scheduledStartTime) {
                                setScheduledStartTime(
                                    new Date(data.scheduledStartTime),
                                )
                                setOriginalStartTime(data.scheduledStartTime)
                            }
                        }
                    })
                    .catch(() => {
                        // Satellite record might not exist or failed to load
                    })
                    .finally(() => {
                        setLoadingDetails(false)
                    })
            }
        } else {
            setTitle('')
            setIsPreview(false)
            setStatus(ContentItemStatus.Published)
            setScheduledStartTime(null)
            setOriginalStartTime(null)
            setDeliveryMode('Online')
            setMeetingUrl('')
            setLocation('')
            setLocationUrl('')
            setLoadingDetails(false)
        }
    }, [isOpen, itemToEdit])

    const isValidUrl = (url?: string | null) =>
        url ? /^https?:\/\/.+/i.test(url.trim()) : false

    const validate = (): boolean => {
        const errors: Record<string, string> = {}
        const trimmedTitle = title.trim()

        if (!trimmedTitle) {
            errors.title = t(
                'courseManagement.liveSessionTitleRequired',
                'عنوان الجلسة المباشرة مطلوب.',
            )
        } else if (trimmedTitle.length > 500) {
            errors.title = t(
                'courseManagement.contentTitleTooLong',
                'يجب ألا يتجاوز العنوان 500 حرف.',
            )
        }

        if (!scheduledStartTime) {
            errors.scheduledStartTime = t(
                'courseManagement.sessionStartTimeRequired',
                'موعد وتوقيت الجلسة مطلوب.',
            )
        } else {
            const timeVal = new Date(scheduledStartTime).getTime()
            const isChanged =
                !originalStartTime ||
                new Date(originalStartTime).getTime() !== timeVal
            if (isChanged && timeVal <= Date.now()) {
                errors.scheduledStartTime = t(
                    'courseManagement.sessionStartTimeMustBeFuture',
                    'يجب أن يكون موعد الجلسة المباشرة في المستقبل.',
                )
            }
        }

        if (deliveryMode === 'Online') {
            if (!meetingUrl.trim()) {
                errors.meetingUrl = t(
                    'courseManagement.meetingUrlRequired',
                    'رابط الاجتماع مطلوب للجلسات عبر الإنترنت (Zoom, Google Meet, Teams...).',
                )
            } else if (!isValidUrl(meetingUrl)) {
                errors.meetingUrl = t(
                    'courseManagement.meetingUrlInvalid',
                    'رابط الاجتماع يجب أن يبدأ بـ http:// أو https://',
                )
            }
        } else if (deliveryMode === 'InPerson') {
            if (!location.trim()) {
                errors.location = t(
                    'courseManagement.locationRequired',
                    'الموقع الجغرافي أو القاعة التدريبية مطلوب للجلسات الحضورية.',
                )
            }
            if (locationUrl.trim() && !isValidUrl(locationUrl)) {
                errors.locationUrl = t(
                    'courseManagement.locationUrlInvalid',
                    'رابط الخريطة يجب أن يبدأ بـ http:// أو https://',
                )
            }
        }

        setFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')

        if (!validate()) return

        setSubmitting(true)

        try {
            const isoScheduledTime = scheduledStartTime
                ? new Date(scheduledStartTime).toISOString()
                : null

            if (isEdit && itemToEdit) {
                // 1. Update Content Item
                const updateContentRes = await apiUpdateCourseContent(
                    itemToEdit.id,
                    {
                        title: title.trim(),
                        isPreview,
                        status,
                        fileId: null,
                        duration: null,
                    },
                )

                if (!updateContentRes?.isSuccess && !updateContentRes?.status) {
                    throw new Error(
                        updateContentRes?.message ||
                            t(
                                'common.operationFailed',
                                'فشل تحديث بيانات المحتوى.',
                            ),
                    )
                }

                // 2. Update Live Session Satellite
                const updateSessionRes = await apiUpdateLiveSession(
                    itemToEdit.id,
                    {
                        scheduledStartTime: isoScheduledTime,
                        deliveryMode,
                        meetingUrl:
                            deliveryMode === 'Online'
                                ? meetingUrl.trim()
                                : null,
                        location:
                            deliveryMode === 'InPerson' ? location.trim() : null,
                        locationUrl:
                            deliveryMode === 'InPerson' && locationUrl.trim()
                                ? locationUrl.trim()
                                : null,
                    },
                )

                if (!updateSessionRes?.isSuccess && !updateSessionRes?.status) {
                    throw new Error(
                        updateSessionRes?.message ||
                            t(
                                'common.operationFailed',
                                'فشل تحديث بيانات الجلسة المباشرة.',
                            ),
                    )
                }

                onSuccess(
                    updateSessionRes.message ||
                        t(
                            'courseManagement.liveSessionUpdateSuccess',
                            'تم تحديث الجلسة المباشرة بنجاح.',
                        ),
                )
                onClose()
            } else {
                // Step 1: Create Content Item of type LiveSession (4)
                const contentRes = await apiCreateCourseContent({
                    sectionId,
                    title: title.trim(),
                    type: ContentType.LiveSession,
                    fileId: null,
                    duration: null,
                    isPreview,
                    status,
                })

                if (!contentRes?.status || !contentRes.data) {
                    throw new Error(
                        contentRes?.message ||
                            t(
                                'common.operationFailed',
                                'فشل إنشاء عنصر الجلسة المباشرة.',
                            ),
                    )
                }

                const createdContentId = contentRes.data

                // Step 2: Attach Live Session Satellite Record
                try {
                    const sessionRes = await apiCreateLiveSession({
                        contentId: createdContentId,
                        scheduledStartTime: isoScheduledTime!,
                        deliveryMode,
                        meetingUrl:
                            deliveryMode === 'Online'
                                ? meetingUrl.trim()
                                : null,
                        location:
                            deliveryMode === 'InPerson' ? location.trim() : null,
                        locationUrl:
                            deliveryMode === 'InPerson' && locationUrl.trim()
                                ? locationUrl.trim()
                                : null,
                    })

                    if (!sessionRes?.status) {
                        throw new Error(
                            sessionRes?.message ||
                                t(
                                    'common.operationFailed',
                                    'فشل إرفاق بيانات جدول الجلسة المباشرة.',
                                ),
                        )
                    }

                    onSuccess(
                        sessionRes.message ||
                            t(
                                'courseManagement.liveSessionCreateSuccess',
                                'تم إنشاء الجلسة المباشرة وجدولتها بنجاح.',
                            ),
                    )
                    onClose()
                } catch (satelliteErr: unknown) {
                    // Rollback: auto-delete orphaned content item
                    try {
                        await apiDeleteCourseContent(createdContentId)
                    } catch {
                        // ignore rollback error
                    }
                    throw satelliteErr
                }
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'حدث خطأ أثناء حفظ الجلسة.'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            width={640}
            className="max-h-[90vh] overflow-y-auto"
        >
            <div className="p-2 sm:p-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
                        <HiOutlineVideoCamera />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {isEdit
                                ? t(
                                      'courseManagement.editLiveSession',
                                      'تعديل الجلسة المباشرة',
                                  )
                                : t(
                                      'courseManagement.addLiveSession',
                                      'إضافة جلسة تفاعلية مباشرة (Live Session)',
                                  )}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {t(
                                'courseManagement.liveSessionDesc',
                                'جدولة محاضرة مباشرة أو ورشة عمل حضورية مع الطلاب.',
                            )}
                        </p>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <Alert type="danger" className="mt-4">
                        {errorMsg}
                    </Alert>
                )}

                {loadingDetails ? (
                    <div className="py-12 text-center text-sm text-gray-500">
                        {t(
                            'common.loading',
                            'جاري تحميل تفاصيل الجلسة المباشرة...',
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 pt-4">
                        {/* Session Title */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t(
                                    'courseManagement.sessionTitle',
                                    'عنوان الجلسة المباشرة',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="مثال: ورشة تدريبية تفاعلية: بنية الحاويات و Docker Compose"
                                value={title}
                                invalid={!!formErrors.title}
                                onChange={(e) => {
                                    setTitle(e.target.value)
                                    if (formErrors.title) {
                                        setFormErrors((p) => ({
                                            ...p,
                                            title: undefined,
                                        }))
                                    }
                                }}
                            />
                            {formErrors.title && (
                                <span className="text-xs text-red-500 mt-1 block">
                                    {formErrors.title}
                                </span>
                            )}
                        </div>

                        {/* Scheduled Date & Time */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t(
                                    'courseManagement.scheduledStartTime',
                                    'موعد وتوقيت انطلاق الجلسة',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <DatePicker.DateTimepicker
                                placeholder="اختر موعد وتوقيت الجلسة..."
                                value={scheduledStartTime}
                                onChange={(val) => {
                                    setScheduledStartTime(val)
                                    if (formErrors.scheduledStartTime) {
                                        setFormErrors((p) => ({
                                            ...p,
                                            scheduledStartTime: undefined,
                                        }))
                                    }
                                }}
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                {t(
                                    'courseManagement.scheduledStartTimeHint',
                                    'حدد التوقيت بدقة. سيتم تحويل الموعد آلياً إلى توقيت UTC عند الحفظ.',
                                )}
                            </p>
                            {formErrors.scheduledStartTime && (
                                <span className="text-xs text-red-500 mt-1 block">
                                    {formErrors.scheduledStartTime}
                                </span>
                            )}
                        </div>

                        {/* Delivery Mode (Online vs Offline) */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t(
                                    'courseManagement.sessionDeliveryMode',
                                    'طريقة الحضور / نمط الجلسة',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                                        deliveryMode === 'Online'
                                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700 shadow-xs'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                    onClick={() => {
                                        setDeliveryMode('Online')
                                        if (formErrors.meetingUrl) {
                                            setFormErrors((p) => ({
                                                ...p,
                                                meetingUrl: undefined,
                                            }))
                                        }
                                    }}
                                >
                                    <HiOutlineGlobeAlt className="text-lg" />
                                    <span>
                                        {t(
                                            'courseManagement.modeOnline',
                                            'أونلاين (عبر الإنترنت)',
                                        )}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                                        deliveryMode === 'InPerson'
                                            ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-700 shadow-xs'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                                    onClick={() => {
                                        setDeliveryMode('InPerson')
                                        if (formErrors.location) {
                                            setFormErrors((p) => ({
                                                ...p,
                                                location: undefined,
                                            }))
                                        }
                                    }}
                                >
                                    <HiOutlineMapPin className="text-lg" />
                                    <span>
                                        {t(
                                            'courseManagement.modeOffline',
                                            'حضوري (قاعة / مقر)',
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Online Session Fields */}
                        {deliveryMode === 'Online' && (
                            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        {t(
                                            'courseManagement.meetingUrl',
                                            'رابط الاجتماع المباشر',
                                        )}{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="url"
                                        placeholder="https://meet.google.com/xyz-qwer-abc أو رابط Zoom / Teams"
                                        value={meetingUrl}
                                        invalid={!!formErrors.meetingUrl}
                                        onChange={(e) => {
                                            setMeetingUrl(e.target.value)
                                            if (formErrors.meetingUrl) {
                                                setFormErrors((p) => ({
                                                    ...p,
                                                    meetingUrl: undefined,
                                                }))
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">
                                        {t(
                                            'courseManagement.meetingUrlRedactedNote',
                                            '🔒 يتم حجب هذا الرابط تلقائياً عن الزوار غير المسجلين إلا في حال تفعيل "معاينة مجانية".',
                                        )}
                                    </p>
                                    {formErrors.meetingUrl && (
                                        <span className="text-xs text-red-500 mt-1 block">
                                            {formErrors.meetingUrl}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Offline Session Fields */}
                        {deliveryMode === 'InPerson' && (
                            <div className="p-4 rounded-xl border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        {t(
                                            'courseManagement.locationName',
                                            'العنوان والمقر التدريبي',
                                        )}{' '}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder="مثال: الفرع الرئيسي - المبنى B - القاعة الذكية 402"
                                        value={location}
                                        invalid={!!formErrors.location}
                                        onChange={(e) => {
                                            setLocation(e.target.value)
                                            if (formErrors.location) {
                                                setFormErrors((p) => ({
                                                    ...p,
                                                    location: undefined,
                                                }))
                                            }
                                        }}
                                    />
                                    {formErrors.location && (
                                        <span className="text-xs text-red-500 mt-1 block">
                                            {formErrors.location}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                        {t(
                                            'courseManagement.locationUrl',
                                            'رابط خرائط جوجل (اختياري)',
                                        )}
                                    </label>
                                    <Input
                                        type="url"
                                        placeholder="https://maps.google.com/?q=..."
                                        value={locationUrl}
                                        invalid={!!formErrors.locationUrl}
                                        onChange={(e) => {
                                            setLocationUrl(e.target.value)
                                            if (formErrors.locationUrl) {
                                                setFormErrors((p) => ({
                                                    ...p,
                                                    locationUrl: undefined,
                                                }))
                                            }
                                        }}
                                    />
                                    {formErrors.locationUrl && (
                                        <span className="text-xs text-red-500 mt-1 block">
                                            {formErrors.locationUrl}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Status & Preview Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                            {/* Publication Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t(
                                        'courseManagement.contentStatus',
                                        'حالة النشر',
                                    )}
                                </label>
                                <select
                                    className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={status}
                                    onChange={(e) =>
                                        setStatus(
                                            Number(
                                                e.target.value,
                                            ) as ContentItemStatus,
                                        )
                                    }
                                >
                                    <option value={ContentItemStatus.Published}>
                                        {t(
                                            'courseManagement.published',
                                            'منشور',
                                        )}
                                    </option>
                                    <option value={ContentItemStatus.Draft}>
                                        {t('courseManagement.draft', 'مسودة')}
                                    </option>
                                    <option value={ContentItemStatus.Archived}>
                                        {t(
                                            'courseManagement.archived',
                                            'مؤرشف',
                                        )}
                                    </option>
                                </select>
                            </div>

                            {/* Free Preview Toggle */}
                            <div className="flex flex-col justify-center">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t(
                                        'courseManagement.previewSetting',
                                        'إمكانية المعاينة المجانية',
                                    )}
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={isPreview}
                                        onChange={(e) =>
                                            setIsPreview(e.target.checked)
                                        }
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                                        {t(
                                            'courseManagement.allowFreePreviewSession',
                                            'إتاحة رابط الجلسة مجاناً للزوار دون اشتراك',
                                        )}
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                type="button"
                                variant="plain"
                                disabled={submitting}
                                onClick={onClose}
                            >
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                loading={submitting}
                            >
                                {isEdit
                                    ? t('common.save', 'حفظ التعديلات')
                                    : t(
                                          'courseManagement.createLiveSessionBtn',
                                          'جدولة الجلسة المباشرة',
                                      )}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Dialog>
    )
}

export default LiveSessionModal
