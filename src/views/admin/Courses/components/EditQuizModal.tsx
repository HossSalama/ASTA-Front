import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlineAcademicCap,
    HiOutlineLockClosed,
    HiOutlineEye,
    HiOutlinePencilSquare,
} from 'react-icons/hi2'
import { apiUpdateCourseContent } from '@/services/CourseContentService'
import {
    ContentItemStatus,
    CourseContentItemResponse,
    AdminCourseContentItemDto,
} from '@/@types/courseContent'

export interface EditQuizModalProps {
    isOpen: boolean
    onClose: () => void
    itemToEdit: AdminCourseContentItemDto | CourseContentItemResponse | null
    onSuccess: (message?: string) => void
    onManageQuestions?: (item: AdminCourseContentItemDto | CourseContentItemResponse) => void
}

export const EditQuizModal = ({
    isOpen,
    onClose,
    itemToEdit,
    onSuccess,
    onManageQuestions,
}: EditQuizModalProps) => {
    const { t } = useTranslation()

    // Form fields
    const [title, setTitle] = useState<string>('')
    const [isPreview, setIsPreview] = useState<boolean>(false)
    const [status, setStatus] = useState<ContentItemStatus>(ContentItemStatus.Published)

    // Submission state
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')

    useEffect(() => {
        if (isOpen && itemToEdit) {
            setTitle(itemToEdit.title || '')
            setIsPreview(Boolean(itemToEdit.isPreview))
            setStatus(itemToEdit.status || ContentItemStatus.Published)
            setErrorMsg('')
        }
    }, [isOpen, itemToEdit])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!itemToEdit) return

        setErrorMsg('')
        const trimmedTitle = title.trim()
        if (!trimmedTitle) {
            setErrorMsg(t('quiz.quizTitleRequired', 'عنوان الاختبار مطلوب.'))
            return
        }

        if (trimmedTitle.length > 500) {
            setErrorMsg(t('courseManagement.contentTitleTooLong', 'يجب ألا يتجاوز العنوان 500 حرف.'))
            return
        }

        setSubmitting(true)

        try {
            const res = await apiUpdateCourseContent(itemToEdit.id, {
                title: trimmedTitle,
                fileId: null,
                duration: null,
                isPreview,
                status,
            })

            if (res?.isSuccess || res?.status) {
                onSuccess(res.message || t('quiz.updateSuccess', 'تم تحديث بيانات الاختبار بنجاح.'))
                onClose()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشلت العملية.'))
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
            setSubmitting(false)
        }
    }

    if (!itemToEdit) return null

    return (
        <Dialog isOpen={isOpen} width={600} onClose={onClose}>
            <div className="p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <HiOutlineAcademicCap className="text-xl" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {t('quiz.editQuizSettings', 'تعديل إعدادات الاختبار')}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t('quiz.editQuizSubtitle', 'تعديل عنوان الاختبار وحالة النشر وصلاحية الوصول')}
                        </p>
                    </div>
                </div>

                {errorMsg && (
                    <Alert type="danger" className="mb-4">
                        {errorMsg}
                    </Alert>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    {/* Quiz Title */}
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                            {t('quiz.quizTitleLabel', 'عنوان الاختبار والتقييم')}{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder={t(
                                'quiz.quizTitlePlaceholder',
                                'مثال: اختبار نهاية الوحدة الأولى',
                            )}
                            value={title}
                            maxLength={500}
                            disabled={submitting}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Manage questions banner button */}
                    {onManageQuestions && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                            <div className="flex items-center gap-2">
                                <HiOutlinePencilSquare className="text-amber-600 dark:text-amber-400 text-lg" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {t('quiz.manageQuestionsNotice', 'هل تريد تعديل أسئلة وخيارات الاختبار؟')}
                                </span>
                            </div>
                            <Button
                                type="button"
                                size="xs"
                                variant="twoTone"
                                className="text-amber-700 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/60"
                                onClick={() => {
                                    onClose()
                                    onManageQuestions(itemToEdit)
                                }}
                            >
                                {t('quiz.goToQuestions', 'إدارة الأسئلة')}
                            </Button>
                        </div>
                    )}

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
                                    disabled={submitting}
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
                                    disabled={submitting}
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
                                    disabled={submitting}
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
                                    disabled={submitting}
                                    className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${
                                        !isPreview
                                            ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 shadow-xs'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40'
                                    }`}
                                    onClick={() => setIsPreview(false)}
                                >
                                    <HiOutlineLockClosed className="text-base shrink-0" />
                                    <span>{t('courseManagement.previewEnrolledOnly', 'خاص بالمشتركين')}</span>
                                </button>
                                <button
                                    type="button"
                                    disabled={submitting}
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
                            disabled={submitting}
                            onClick={onClose}
                        >
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={submitting}
                            disabled={submitting || !title.trim()}
                        >
                            {t('common.saveChanges', 'حفظ التعديلات')}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default EditQuizModal
