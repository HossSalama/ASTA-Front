import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Upload from '@/components/ui/Upload'
import Alert from '@/components/ui/Alert'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlineCloudArrowUp,
    HiOutlineDocumentText,
    HiOutlineLockClosed,
    HiOutlineEye,
} from 'react-icons/hi2'
import {
    apiCreateCourseContent,
    apiUpdateCourseContent,
} from '@/services/CourseContentService'
import { uploadCourseMediaFile, StorageCategory } from '@/services/StorageService'
import {
    ContentType,
    ContentItemStatus,
    CourseContentItemResponse,
    AdminCourseContentItemDto,
} from '@/@types/courseContent'

export interface CreateFileModalProps {
    isOpen: boolean
    onClose: () => void
    sectionId: number
    itemToEdit?: AdminCourseContentItemDto | CourseContentItemResponse | null
    onSuccess: (message?: string) => void
}

export const CreateFileModal = ({
    isOpen,
    onClose,
    sectionId,
    itemToEdit,
    onSuccess,
}: CreateFileModalProps) => {
    const { t } = useTranslation()
    const isEdit = Boolean(itemToEdit)

    // Form fields
    const [title, setTitle] = useState<string>('')
    const [isPreview, setIsPreview] = useState<boolean>(false)
    const [status, setStatus] = useState<ContentItemStatus>(ContentItemStatus.Published)
    const [existingFileId, setExistingFileId] = useState<string>('')

    // Upload & submission state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setTitle(itemToEdit.title || '')
                setIsPreview(Boolean(itemToEdit.isPreview))
                setStatus(itemToEdit.status || ContentItemStatus.Published)
                setExistingFileId(itemToEdit.fileId || '')
            } else {
                setTitle('')
                setIsPreview(false)
                setStatus(ContentItemStatus.Published)
                setExistingFileId('')
            }
            setSelectedFile(null)
            setUploadProgress(0)
            setErrorMsg('')
        }
    }, [isOpen, itemToEdit])

    const handleFileChange = (files: File[]) => {
        const file = files[0] || null
        setSelectedFile(file)
        setErrorMsg('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')

        const trimmedTitle = title.trim()
        if (!trimmedTitle) {
            setErrorMsg(t('courseManagement.fileTitleRequired', 'عنوان الملف المرفق مطلوب.'))
            return
        }

        if (trimmedTitle.length > 500) {
            setErrorMsg(t('courseManagement.contentTitleTooLong', 'يجب ألا يتجاوز العنوان 500 حرف.'))
            return
        }

        if (!isEdit && !selectedFile) {
            setErrorMsg(t('courseManagement.contentFileRequired', 'يرجى اختيار ملف لرفعه.'))
            return
        }

        setSubmitting(true)

        try {
            let finalFileId = existingFileId

            // Upload directly to Cloudflare R2
            if (selectedFile) {
                setUploading(true)
                setUploadProgress(0)

                const uploadRes = await uploadCourseMediaFile({
                    file: selectedFile,
                    category: StorageCategory.CourseResource,
                    targetType: 'CourseContent',
                    targetId: isEdit && itemToEdit ? String(itemToEdit.id) : null,
                    onProgress: (percent) => setUploadProgress(percent),
                })

                finalFileId = uploadRes.objectKey
                setUploading(false)
            }

            if (!finalFileId) {
                setErrorMsg(t('courseManagement.fileUploadFailed', 'فشل الحصول على معرّف التخزين للملف.'))
                setSubmitting(false)
                return
            }

            if (isEdit && itemToEdit) {
                const res = await apiUpdateCourseContent(itemToEdit.id, {
                    title: trimmedTitle,
                    fileId: finalFileId,
                    duration: null,
                    isPreview,
                    status,
                })

                if (res?.isSuccess || res?.status) {
                    onSuccess(res.message || t('courseManagement.contentUpdateSuccess', 'تم تحديث الملف المرفق بنجاح.'))
                    onClose()
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشلت العملية.'))
                }
            } else {
                const res = await apiCreateCourseContent({
                    sectionId,
                    title: trimmedTitle,
                    type: ContentType.File,
                    fileId: finalFileId,
                    duration: null,
                    isPreview,
                    status,
                })

                if (res?.isSuccess || res?.status) {
                    onSuccess(res.message || t('courseManagement.fileCreateSuccess', 'تم إضافة الملف المرفق بنجاح.'))
                    onClose()
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشلت العملية.'))
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
                    t('common.operationFailed', 'فشلت العملية.'),
            )
        } finally {
            setUploading(false)
            setSubmitting(false)
        }
    }

    const isBusy = submitting || uploading

    return (
        <Dialog isOpen={isOpen} width={620} onClose={onClose}>
            <div className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <HiOutlineDocumentText className="text-xl" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {isEdit
                                ? t('courseManagement.editResourceFile', 'تعديل الملف المرفق')
                                : t('courseManagement.addResourceFile', 'إضافة ملف مرفق جديد')}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('courseManagement.fileResourceSubtitle', 'ارفع الملف التعليمي أو المستند وحدد حالة النشر')}
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <Alert type="danger" className="mb-4">
                        {errorMsg}
                    </Alert>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* File Title */}
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                            {t('courseManagement.fileTitleLabel', 'عنوان الملف المرفق')}{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder={t(
                                'courseManagement.fileTitlePlaceholder',
                                'مثال: ملخص وملاحظات المحاضرة (PDF)',
                            )}
                            value={title}
                            maxLength={500}
                            disabled={isBusy}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* File Upload Zone */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('courseManagement.attachmentFile', 'الملف المرفق')}{' '}
                                {!isEdit && <span className="text-red-500">*</span>}
                            </label>
                            {isEdit && existingFileId && !selectedFile && (
                                <span className="text-[11px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                    {t('courseManagement.fileAttached', 'يوجد ملف مرفوع حالياً')}
                                </span>
                            )}
                        </div>

                        <Upload
                            draggable
                            uploadLimit={1}
                            fileList={selectedFile ? [selectedFile] : []}
                            accept=".pdf,.zip,.rar,.7z,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
                            showList={true}
                            disabled={isBusy}
                            onChange={handleFileChange}
                            onFileRemove={() => setSelectedFile(null)}
                        >
                            <div className="py-4 text-center">
                                <HiOutlineCloudArrowUp className="text-3xl mx-auto text-purple-500 mb-1.5" />
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t(
                                        'courseManagement.dropFilePrompt',
                                        'اسحب وأفلت الملف هنا أو اضغط للاختيار (حتى 500MB)',
                                    )}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    PDF, ZIP, RAR, Word, PowerPoint, Excel
                                </p>
                            </div>
                        </Upload>

                        {/* Upload Progress Bar */}
                        {uploading && (
                            <div className="mt-3 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900">
                                <div className="flex justify-between text-xs text-purple-700 dark:text-purple-300 font-semibold mb-1">
                                    <span>
                                        {t('courseManagement.uploadingDirectToR2', 'جاري رفع الملف...')}
                                    </span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full transition-all duration-200"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Status & Access Rows */}
                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {/* Status Select */}
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                                {t('courseManagement.status', 'حالة النشر')}
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                        status === ContentItemStatus.Draft
                                            ? 'border-gray-500 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                                    onClick={() => setStatus(ContentItemStatus.Draft)}
                                >
                                    {t('courseManagement.draft', 'مسودة')}
                                </button>
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                        status === ContentItemStatus.Published
                                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                                    onClick={() => setStatus(ContentItemStatus.Published)}
                                >
                                    {t('courseManagement.published', 'منشور')}
                                </button>
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    className={`py-2 px-2 rounded-lg text-xs font-bold border transition-colors ${
                                        status === ContentItemStatus.Archived
                                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                                    onClick={() => setStatus(ContentItemStatus.Archived)}
                                >
                                    {t('courseManagement.archived', 'مؤرشف')}
                                </button>
                            </div>
                        </div>

                        {/* Free Preview / Access Selection */}
                        <div>
                            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                                {t('courseManagement.accessPermission', 'صلاحية الوصول')}
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                                        !isPreview
                                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                                    onClick={() => setIsPreview(false)}
                                >
                                    <HiOutlineLockClosed className="text-base shrink-0" />
                                    <span>{t('courseManagement.previewEnrolledOnly', 'خاص بالمشتركين')}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                                        isPreview
                                            ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                                    onClick={() => setIsPreview(true)}
                                >
                                    <HiOutlineEye className="text-base shrink-0" />
                                    <span>{t('courseManagement.freePreviewBadge', 'معاينة مجانية')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            type="button"
                            variant="plain"
                            disabled={isBusy}
                            onClick={onClose}
                        >
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isBusy}
                            disabled={
                                isBusy ||
                                !title.trim() ||
                                (!isEdit && !selectedFile)
                            }
                        >
                            {isEdit
                                ? t('common.saveChanges', 'حفظ التعديلات')
                                : t('courseManagement.addResourceFileBtn', 'إضافة الملف المرفق')}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default CreateFileModal
