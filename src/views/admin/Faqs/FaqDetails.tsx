import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineLanguage,
    HiOutlineUser,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2'
import {
    apiGetFaqById,
    apiUpdateFaq,
    apiToggleFaqStatus,
    apiDeleteFaq,
} from '@/services/FaqService'
import type { AdminFAQDetail, UpdateFAQPayload } from '@/@types/faq'
import { useLocaleStore } from '@/store/localeStore'

interface FormErrors {
    questionAr?: string
    questionEn?: string
    answerAr?: string
    answerEn?: string
}

const FaqDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'

    const [faq, setFaq] = useState<AdminFAQDetail | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [toggling, setToggling] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
    const [questionAr, setQuestionAr] = useState<string>('')
    const [questionEn, setQuestionEn] = useState<string>('')
    const [answerAr, setAnswerAr] = useState<string>('')
    const [answerEn, setAnswerEn] = useState<string>('')
    const [isActive, setIsActive] = useState<boolean>(true)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false)
    const [modalApiError, setModalApiError] = useState<string>('')

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deleting, setDeleting] = useState<boolean>(false)

    // Fetch Details
    const fetchFaqDetails = useCallback(() => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        apiGetFaqById(Number(id))
            .then((res) => {
                if (res?.status && res.data) {
                    setFaq(res.data)
                } else {
                    setErrorMsg(
                        res?.message ||
                            t(
                                'faqManagement.failedFetchDetails',
                                'فشل جلب تفاصيل السؤال الشائع.',
                            ),
                    )
                }
            })
            .catch((err: unknown) => {
                const errorObj = err as {
                    response?: { data?: { message?: string } }
                    message?: string
                }
                setErrorMsg(
                    errorObj?.response?.data?.message ||
                        errorObj.message ||
                        t(
                            'faqManagement.failedFetchDetails',
                            'فشل جلب تفاصيل السؤال الشائع.',
                        ),
                )
            })
            .finally(() => {
                setLoading(false)
            })
    }, [id, t])

    useEffect(() => {
        fetchFaqDetails()
    }, [fetchFaqDetails])

    // Toggle Status
    const handleToggleStatus = async () => {
        if (!faq) return
        setToggling(true)
        setSuccessMsg('')
        setErrorMsg('')
        try {
            const res = await apiToggleFaqStatus(faq.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'faqManagement.toggleSuccess',
                            'تم تغيير حالة السؤال الشائع بنجاح.',
                        ),
                )
                fetchFaqDetails()
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'faqManagement.failedToggle',
                            'فشل تغيير حالة السؤال الشائع.',
                        ),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('faqManagement.failedToggle', 'فشلت العملية.'),
            )
        } finally {
            setToggling(false)
        }
    }

    // Open Edit Modal
    const openEditModal = () => {
        if (!faq) return
        setQuestionAr(faq.questionAr)
        setQuestionEn(faq.questionEn)
        setAnswerAr(faq.answerAr)
        setAnswerEn(faq.answerEn)
        setIsActive(faq.isActive)
        setFormErrors({})
        setModalApiError('')
        setEditModalOpen(true)
    }

    // Submit Edit Form
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!faq) return

        const errors: FormErrors = {}
        let isValid = true

        if (!questionAr.trim()) {
            errors.questionAr = t(
                'faqManagement.questionArRequired',
                'نص السؤال باللغة العربية مطلوب.',
            )
            isValid = false
        } else if (questionAr.trim().length > 1000) {
            errors.questionAr = t(
                'faqManagement.questionArMaxLength',
                'نص السؤال بالعربية يجب ألا يتجاوز 1000 حرف.',
            )
            isValid = false
        }

        if (!questionEn.trim()) {
            errors.questionEn = t(
                'faqManagement.questionEnRequired',
                'نص السؤال باللغة الإنجليزية مطلوب.',
            )
            isValid = false
        } else if (questionEn.trim().length > 1000) {
            errors.questionEn = t(
                'faqManagement.questionEnMaxLength',
                'نص السؤال بالإنجليزية يجب ألا يتجاوز 1000 حرف.',
            )
            isValid = false
        }

        if (!answerAr.trim()) {
            errors.answerAr = t(
                'faqManagement.answerArRequired',
                'نص الإجابة باللغة العربية مطلوب.',
            )
            isValid = false
        }

        if (!answerEn.trim()) {
            errors.answerEn = t(
                'faqManagement.answerEnRequired',
                'نص الإجابة باللغة الإنجليزية مطلوب.',
            )
            isValid = false
        }

        if (!isValid) {
            setFormErrors(errors)
            return
        }

        setModalSubmitting(true)
        setModalApiError('')
        setFormErrors({})

        try {
            const payload: UpdateFAQPayload = {
                questionAr: questionAr.trim(),
                questionEn: questionEn.trim(),
                answerAr: answerAr.trim(),
                answerEn: answerEn.trim(),
                isActive,
            }
            const res = await apiUpdateFaq(faq.id, payload)

            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'faqManagement.updateSuccess',
                            'تم تحديث السؤال الشائع بنجاح.',
                        ),
                )
                setEditModalOpen(false)
                fetchFaqDetails()
            } else {
                setModalApiError(
                    res?.message ||
                        t(
                            'faqManagement.failedUpdate',
                            'فشل تحديث السؤال الشائع.',
                        ),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setModalApiError(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('faqManagement.failedUpdate', 'فشلت العملية.'),
            )
        } finally {
            setModalSubmitting(false)
        }
    }

    // Delete FAQ
    const handleDeleteFaq = async () => {
        if (!faq) return
        setDeleting(true)
        setErrorMsg('')
        try {
            const res = await apiDeleteFaq(faq.id)
            if (res?.status) {
                setDeleteDialogOpen(false)
                navigate('/admin/faqs')
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'faqManagement.failedDelete',
                            'فشل حذف السؤال الشائع.',
                        ),
                )
                setDeleteDialogOpen(false)
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('faqManagement.failedDelete', 'فشل حذف السؤال الشائع.'),
            )
            setDeleteDialogOpen(false)
        } finally {
            setDeleting(false)
        }
    }

    const BackIcon = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    const renderStatusBadge = (active: boolean) => {
        if (active) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 shadow-2xs">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                    {t('faqManagement.active', 'نشط')}
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full shrink-0 bg-gray-400" />
                {t('faqManagement.inactive', 'غير نشط')}
            </span>
        )
    }

    if (loading && !faq) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="40px" />
            </div>
        )
    }

    if (errorMsg && !faq) {
        return (
            <div className="w-full p-4 flex flex-col gap-4 text-start">
                <div>
                    <Link to="/admin/faqs">
                        <Button size="sm" icon={<BackIcon />}>
                            {t('common.back', 'العودة إلى الأسئلة الشائعة')}
                        </Button>
                    </Link>
                </div>
                <Alert type="danger">{errorMsg}</Alert>
            </div>
        )
    }

    if (!faq) return <></>

    return (
        <div className="w-full p-4 flex flex-col gap-6 text-start">
            {/* Feedback Alerts */}
            {successMsg && (
                <Alert type="success" onClose={() => setSuccessMsg('')}>
                    {successMsg}
                </Alert>
            )}
            {errorMsg && (
                <Alert type="danger" onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/admin/faqs">
                        <Button size="sm" variant="default" icon={<BackIcon />} />
                    </Link>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 line-clamp-1 flex items-center gap-2">
                            <HiOutlineQuestionMarkCircle className="text-primary shrink-0 text-2xl" />
                            <span>{faq.questionAr}</span>
                        </h2>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dir-ltr text-right block font-medium mt-0.5 line-clamp-1">
                            {faq.questionEn}
                        </span>
                    </div>
                </div>

                {/* Actions: Status Switcher + Edit Button + Delete Button */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                        <Switcher
                            checked={faq.isActive}
                            isLoading={toggling}
                            onChange={handleToggleStatus}
                        />
                        {renderStatusBadge(faq.isActive)}
                    </div>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlinePencil />}
                        onClick={openEditModal}
                    >
                        {t('common.edit', 'تعديل')}
                    </Button>
                    <Button
                        size="sm"
                        variant="default"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 border-red-200 dark:border-red-800/50"
                        icon={<HiOutlineTrash />}
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        {t('common.delete', 'حذف')}
                    </Button>
                </div>
            </div>

            {/* Main Content: Arabic & English Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Arabic Content Card */}
                <Card className="shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <HiOutlineLanguage className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                                        {t('faqManagement.questionAr', 'المحتوى باللغة العربية')}
                                    </h3>
                                    <span className="text-xs text-gray-400 font-medium">
                                        Arabic Version
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                    {t('faqManagement.questionAr', 'السؤال')}
                                </span>
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                    {faq.questionAr}
                                </h4>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                    {t('faqManagement.answerAr', 'الإجابة')}
                                </span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {faq.answerAr}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* English Content Card */}
                <Card className="shadow-xs border border-gray-100 dark:border-gray-800 dir-ltr text-left flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                    <HiOutlineLanguage className="text-xl" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                                        {t('faqManagement.questionEn', 'English Content')}
                                    </h3>
                                    <span className="text-xs text-gray-400 font-medium">
                                        English Version
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                                    Question
                                </span>
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
                                    {faq.questionEn}
                                </h4>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                                    Answer
                                </span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                    {faq.answerEn}
                                </p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Audit & Tracking Information Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <div className="pb-4 mb-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-base font-bold text-gray-800 dark:text-gray-100">
                        {t('faqManagement.auditInfo', 'بيانات التتبع والتدقيق')}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        معلومات الإنشاء والتعديل والمستخدمين المعنيين.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Created By */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <HiOutlineUser className="text-xl" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('faqManagement.createdBy', 'تم الإنشاء بواسطة')}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate block">
                                {faq.createdBy
                                    ? `${faq.createdBy.firstName} ${faq.createdBy.lastName}`
                                    : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Created At */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <HiOutlineCalendar className="text-xl" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('faqManagement.createdAt', 'تاريخ الإنشاء')}
                            </span>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 dir-ltr inline-block truncate">
                                {faq.createdAt
                                    ? dayjs(faq.createdAt).format('YYYY/MM/DD hh:mm A')
                                    : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Updated By */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <HiOutlineClock className="text-xl" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('faqManagement.updatedBy', 'تم التعديل بواسطة')}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate block">
                                {faq.updatedBy
                                    ? `${faq.updatedBy.firstName} ${faq.updatedBy.lastName}`
                                    : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Updated At */}
                    <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <HiOutlineCalendar className="text-xl" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('faqManagement.updatedAt', 'تاريخ آخر تعديل')}
                            </span>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 dir-ltr inline-block truncate">
                                {faq.updatedAt
                                    ? dayjs(faq.updatedAt).format('YYYY/MM/DD hh:mm A')
                                    : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Edit FAQ Dialog */}
            <Dialog
                isOpen={editModalOpen}
                width={700}
                onClose={() => setEditModalOpen(false)}
                onRequestClose={() => setEditModalOpen(false)}
            >
                <div className="p-2 text-start">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {t('faqManagement.editFaq', 'تعديل السؤال الشائع')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {t(
                            'faqManagement.description',
                            'إدارة الأسئلة الشائعة باللغتين العربية والإنجليزية.',
                        )}
                    </p>

                    {modalApiError && (
                        <div className="mb-4">
                            <Alert
                                type="danger"
                                onClose={() => setModalApiError('')}
                            >
                                {modalApiError}
                            </Alert>
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleEditSubmit}>
                        {/* Arabic Question */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('faqManagement.questionAr', 'السؤال بالعربية')} <span className="text-red-500">*</span>
                                </label>
                                <span className="text-xs text-gray-400">
                                    {questionAr.length}/1000
                                </span>
                            </div>
                            <Input
                                invalid={!!formErrors.questionAr}
                                maxLength={1000}
                                placeholder={t(
                                    'faqManagement.questionArPlaceholder',
                                    'أدخل نص السؤال باللغة العربية...',
                                )}
                                value={questionAr}
                                onChange={(e) => setQuestionAr(e.target.value)}
                            />
                            {formErrors.questionAr && (
                                <p className="text-xs text-red-500 mt-1">
                                    {formErrors.questionAr}
                                </p>
                            )}
                        </div>

                        {/* Arabic Answer */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('faqManagement.answerAr', 'الإجابة بالعربية')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                textArea
                                invalid={!!formErrors.answerAr}
                                placeholder={t(
                                    'faqManagement.answerArPlaceholder',
                                    'أدخل الإجابة المفصلة باللغة العربية...',
                                )}
                                rows={3}
                                value={answerAr}
                                onChange={(e) => setAnswerAr(e.target.value)}
                            />
                            {formErrors.answerAr && (
                                <p className="text-xs text-red-500 mt-1">
                                    {formErrors.answerAr}
                                </p>
                            )}
                        </div>

                        {/* English Question */}
                        <div className="dir-ltr">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    {t('faqManagement.questionEn', 'English Question')} <span className="text-red-500">*</span>
                                </label>
                                <span className="text-xs text-gray-400">
                                    {questionEn.length}/1000
                                </span>
                            </div>
                            <Input
                                invalid={!!formErrors.questionEn}
                                maxLength={1000}
                                placeholder={t(
                                    'faqManagement.questionEnPlaceholder',
                                    'Enter question in English...',
                                )}
                                value={questionEn}
                                onChange={(e) => setQuestionEn(e.target.value)}
                            />
                            {formErrors.questionEn && (
                                <p className="text-xs text-red-500 mt-1">
                                    {formErrors.questionEn}
                                </p>
                            )}
                        </div>

                        {/* English Answer */}
                        <div className="dir-ltr">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('faqManagement.answerEn', 'English Answer')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                textArea
                                invalid={!!formErrors.answerEn}
                                placeholder={t(
                                    'faqManagement.answerEnPlaceholder',
                                    'Enter detailed answer in English...',
                                )}
                                rows={3}
                                value={answerEn}
                                onChange={(e) => setAnswerEn(e.target.value)}
                            />
                            {formErrors.answerEn && (
                                <p className="text-xs text-red-500 mt-1">
                                    {formErrors.answerEn}
                                </p>
                            )}
                        </div>

                        {/* Active Status Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                            <div>
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                    {t('faqManagement.status', 'الحالة')}
                                </label>
                                <span className="text-xs text-gray-400">
                                    {isActive
                                        ? t('faqManagement.active', 'نشط (يظهر للعامة)')
                                        : t('faqManagement.inactive', 'غير نشط (مخفي)')}
                                </span>
                            </div>
                            <Switcher
                                checked={isActive}
                                onChange={(val) => setIsActive(val)}
                            />
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                disabled={modalSubmitting}
                                type="button"
                                variant="plain"
                                onClick={() => setEditModalOpen(false)}
                            >
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                loading={modalSubmitting}
                                type="submit"
                                variant="solid"
                            >
                                {t('common.saveChanges', 'حفظ التعديلات')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

            {/* Soft Delete Confirmation Dialog */}
            <ConfirmDialog
                confirmButtonColor="red-600"
                isOpen={deleteDialogOpen}
                loading={deleting}
                title={t('faqManagement.confirmDeleteTitle', 'تأكيد حذف السؤال الشائع')}
                type="danger"
                onCancel={() => setDeleteDialogOpen(false)}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteFaq}
                onRequestClose={() => setDeleteDialogOpen(false)}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t(
                        'faqManagement.confirmDeleteMsg',
                        'هل أنت متأكد من رغبتك في حذف هذا السؤال الشائع؟',
                    )}
                </p>
                {faq && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {faq.questionAr}
                        </p>
                        <p className="text-xs text-gray-500 dir-ltr mt-1">
                            {faq.questionEn}
                        </p>
                    </div>
                )}
            </ConfirmDialog>
        </div>
    )
}

export default FaqDetails
