import { useState, useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import useTranslation from '@/utils/hooks/useTranslation'
import { apiCreateSection, apiUpdateSection } from '@/services/CourseContentService'
import type { SectionResponse, AdminCourseSectionDto } from '@/@types/courseContent'

interface SectionModalProps {
    isOpen: boolean
    onClose: () => void
    courseId: number
    sectionToEdit?: AdminCourseSectionDto | SectionResponse | null
    onSuccess: (message?: string) => void
}

const SectionModal = ({
    isOpen,
    onClose,
    courseId,
    sectionToEdit,
    onSuccess,
}: SectionModalProps) => {
    const { t } = useTranslation()
    const isEdit = Boolean(sectionToEdit)

    const [title, setTitle] = useState<string>('')
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            setTitle(sectionToEdit?.title || '')
            setErrorMsg('')
        }
    }, [isOpen, sectionToEdit])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmedTitle = title.trim()

        if (!trimmedTitle) {
            setErrorMsg(t('courseManagement.sectionTitleRequired', 'عنوان القسم مطلوب.'))
            return
        }

        if (trimmedTitle.length > 300) {
            setErrorMsg(t('courseManagement.sectionTitleTooLong', 'يجب ألا يتجاوز عنوان القسم 300 حرف.'))
            return
        }

        setSubmitting(true)
        setErrorMsg('')

        try {
            if (isEdit && sectionToEdit) {
                const res = await apiUpdateSection(sectionToEdit.id, {
                    title: trimmedTitle,
                })
                if (res?.isSuccess || res?.status) {
                    onSuccess(res.message || t('courseManagement.sectionUpdateSuccess', 'تم تحديث القسم بنجاح.'))
                    onClose()
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشلت العملية.'))
                }
            } else {
                const res = await apiCreateSection({
                    courseId,
                    title: trimmedTitle,
                })
                if (res?.isSuccess || res?.status) {
                    onSuccess(res.message || t('courseManagement.sectionCreateSuccess', 'تم إنشاء القسم بنجاح.'))
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
            setSubmitting(false)
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} width={500}>
            <div className="p-4 sm:p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    {isEdit
                        ? t('courseManagement.editSection', 'تعديل عنوان القسم')
                        : t('courseManagement.addSection', 'إضافة قسم جديد للدورة')}
                </h3>

                {errorMsg && (
                    <Alert type="danger" className="mb-4">
                        {errorMsg}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">
                            {t('courseManagement.sectionTitle', 'عنوان القسم')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder={t('courseManagement.sectionTitlePlaceholder', 'مثال: الفصل الأول: مقدمة وأساسيات...')}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={300}
                            autoFocus
                        />
                        <span className="text-[11px] text-gray-400 mt-1 inline-block">
                            {title.length}/300 {t('common.characters', 'حرف')}
                        </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            type="button"
                            variant="plain"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={submitting}
                            disabled={!title.trim()}
                        >
                            {isEdit
                                ? t('common.saveChanges', 'حفظ التعديلات')
                                : t('courseManagement.createSection', 'إنشاء القسم')}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default SectionModal
