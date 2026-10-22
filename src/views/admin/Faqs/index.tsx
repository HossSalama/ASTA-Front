import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Switcher from '@/components/ui/Switcher'
import Tooltip from '@/components/ui/Tooltip'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineQuestionMarkCircle,
} from 'react-icons/hi2'
import {
    apiGetAdminFaqs,
    apiCreateFaq,
    apiUpdateFaq,
    apiToggleFaqStatus,
    apiDeleteFaq,
} from '@/services/FaqService'
import type {
    AdminFAQSummary,
    GetAdminFaqsParams,
    CreateFAQPayload,
    UpdateFAQPayload,
} from '@/@types/faq'

interface StatusOption {
    value: boolean | null
    label: string
}

interface FormErrors {
    questionAr?: string
    questionEn?: string
    answerAr?: string
    answerEn?: string
}

const FaqsManagement = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Status filter options
    const statusOptions: StatusOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('faqManagement.allStatuses', 'جميع الحالات'),
            },
            {
                value: true,
                label: t('faqManagement.activeOnly', 'النشطة فقط'),
            },
            {
                value: false,
                label: t('faqManagement.inactiveOnly', 'غير النشطة فقط'),
            },
        ],
        [t],
    )

    // Data state
    const [faqs, setFaqs] = useState<AdminFAQSummary[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Pagination & Filters
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<boolean | null>(null)

    // Create / Edit Modal State
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [editingFaq, setEditingFaq] = useState<AdminFAQSummary | null>(null)
    const [questionAr, setQuestionAr] = useState<string>('')
    const [questionEn, setQuestionEn] = useState<string>('')
    const [answerAr, setAnswerAr] = useState<string>('')
    const [answerEn, setAnswerEn] = useState<string>('')
    const [isActive, setIsActive] = useState<boolean>(true)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false)
    const [modalApiError, setModalApiError] = useState<string>('')

    // Delete Confirmation Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deletingFaq, setDeletingFaq] = useState<AdminFAQSummary | null>(null)
    const [deleting, setDeleting] = useState<boolean>(false)

    // Switcher Toggling State
    const [togglingId, setTogglingId] = useState<number | null>(null)

    // Fetch FAQs
    const fetchFaqs = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetAdminFaqsParams = {
                pageNumber,
                pageSize,
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }
            if (statusFilter !== null) {
                params.isActive = statusFilter
            }

            const res = await apiGetAdminFaqs(params)
            if (res?.status && res.data) {
                setFaqs(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setFaqs([])
                setTotalCount(0)
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('faqManagement.failedFetch', 'فشل جلب قائمة الأسئلة الشائعة.'),
            )
            setFaqs([])
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, searchTerm, statusFilter, t])

    useEffect(() => {
        fetchFaqs()
    }, [fetchFaqs])

    // Filter Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setPageNumber(1)
    }

    const handleStatusFilterChange = (option: StatusOption | null) => {
        setStatusFilter(option ? option.value : null)
        setPageNumber(1)
    }

    // Modal Control Functions
    const openCreateModal = () => {
        setEditingFaq(null)
        setQuestionAr('')
        setQuestionEn('')
        setAnswerAr('')
        setAnswerEn('')
        setIsActive(true)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const openEditModal = useCallback((faq: AdminFAQSummary) => {
        setEditingFaq(faq)
        setQuestionAr(faq.questionAr)
        setQuestionEn(faq.questionEn)
        setAnswerAr(faq.answerAr)
        setAnswerEn(faq.answerEn)
        setIsActive(faq.isActive)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }, [])

    const closeModal = () => {
        setModalOpen(false)
        setEditingFaq(null)
        setQuestionAr('')
        setQuestionEn('')
        setAnswerAr('')
        setAnswerEn('')
        setIsActive(true)
        setFormErrors({})
        setModalApiError('')
    }

    // Form Validation
    const validateForm = (): boolean => {
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

        setFormErrors(errors)
        return isValid
    }

    // Submit Create or Edit Form
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setModalSubmitting(true)
        setModalApiError('')
        setErrorMsg('')
        setSuccessMsg('')

        try {
            if (editingFaq) {
                const payload: UpdateFAQPayload = {
                    questionAr: questionAr.trim(),
                    questionEn: questionEn.trim(),
                    answerAr: answerAr.trim(),
                    answerEn: answerEn.trim(),
                    isActive,
                }
                const res = await apiUpdateFaq(editingFaq.id, payload)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'faqManagement.updateSuccess',
                                'تم تحديث السؤال الشائع بنجاح.',
                            ),
                    )
                    closeModal()
                    fetchFaqs()
                } else {
                    setModalApiError(
                        res?.message ||
                            t(
                                'faqManagement.failedUpdate',
                                'فشل تحديث السؤال الشائع.',
                            ),
                    )
                }
            } else {
                const payload: CreateFAQPayload = {
                    questionAr: questionAr.trim(),
                    questionEn: questionEn.trim(),
                    answerAr: answerAr.trim(),
                    answerEn: answerEn.trim(),
                    isActive,
                }
                const res = await apiCreateFaq(payload)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'faqManagement.createSuccess',
                                'تم إنشاء السؤال الشائع بنجاح.',
                            ),
                    )
                    closeModal()
                    fetchFaqs()
                } else {
                    setModalApiError(
                        res?.message ||
                            t(
                                'faqManagement.failedCreate',
                                'فشل إنشاء السؤال الشائع.',
                            ),
                    )
                }
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setModalApiError(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t(
                        'faqManagement.failedCreate',
                        'حدث خطأ أثناء حفظ البيانات.',
                    ),
            )
        } finally {
            setModalSubmitting(false)
        }
    }

    // Toggle Status
    const handleToggleStatus = useCallback(
        async (faq: AdminFAQSummary) => {
            setTogglingId(faq.id)
            setErrorMsg('')
            setSuccessMsg('')

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
                    fetchFaqs()
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
                        t(
                            'faqManagement.failedToggle',
                            'فشلت العملية.',
                        ),
                )
            } finally {
                setTogglingId(null)
            }
        },
        [fetchFaqs, t],
    )

    // Delete Soft Deletion Handler
    const openDeleteDialog = useCallback((faq: AdminFAQSummary) => {
        setDeletingFaq(faq)
        setDeleteDialogOpen(true)
    }, [])

    const handleDeleteConfirm = async () => {
        if (!deletingFaq) return
        setDeleting(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiDeleteFaq(deletingFaq.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'faqManagement.deleteSuccess',
                            'تم حذف السؤال الشائع بنجاح.',
                        ),
                )
                setDeleteDialogOpen(false)
                setDeletingFaq(null)
                fetchFaqs()
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'faqManagement.failedDelete',
                            'فشل حذف السؤال الشائع.',
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
                    t(
                        'faqManagement.failedDelete',
                        'فشل حذف السؤال الشائع.',
                    ),
            )
        } finally {
            setDeleting(false)
        }
    }

    // Render Status Badge Component
    const renderStatusBadge = useCallback(
        (active: boolean) => {
            if (active) {
                return (
                    <div className="flex justify-center w-full">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 transition-colors shadow-2xs">
                            <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                            {t('faqManagement.active', 'نشط')}
                        </span>
                    </div>
                )
            }
            return (
                <div className="flex justify-center w-full">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 transition-colors shadow-2xs">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-gray-400" />
                        {t('faqManagement.inactive', 'غير نشط')}
                    </span>
                </div>
            )
        },
        [t],
    )

    // Table Columns Configuration
    const columns: ColumnDef<AdminFAQSummary>[] = useMemo(
        () => [
            {
                header: () =>
                    t('faqManagement.questionAr', 'السؤال بالعربية'),
                accessorKey: 'questionAr',
                enableSorting: false,
                size: 260,
                meta: { align: 'start' },
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex flex-col items-start justify-start text-start w-full px-3 py-1">
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm line-clamp-2">
                                {row.questionAr}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {row.answerAr}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: () =>
                    t('faqManagement.questionEn', 'السؤال بالإنجليزية'),
                accessorKey: 'questionEn',
                enableSorting: false,
                size: 260,
                meta: { align: 'start' },
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex flex-col items-start justify-start text-start w-full px-3 py-1 dir-ltr">
                            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm line-clamp-2">
                                {row.questionEn}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                {row.answerEn}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: () => t('faqManagement.status', 'الحالة'),
                accessorKey: 'isActive',
                enableSorting: false,
                size: 130,
                cell: (props) => renderStatusBadge(props.row.original.isActive),
            },
            {
                header: () =>
                    t('faqManagement.createdAt', 'تاريخ الإنشاء'),
                accessorKey: 'createdAt',
                enableSorting: false,
                size: 160,
                cell: (props) => {
                    const date = props.row.original.createdAt
                    if (!date) return <div className="flex justify-center w-full text-gray-400 text-xs">-</div>
                    return (
                        <div className="flex flex-col items-center justify-center w-full">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 dir-ltr inline-block">
                                {dayjs(date).format('YYYY/MM/DD')}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium dir-ltr inline-block mt-0.5">
                                {dayjs(date).format('hh:mm A')}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: () => t('common.actions', 'إجراءات'),
                id: 'action',
                enableSorting: false,
                size: 130,
                cell: (props) => {
                    const row = props.row.original
                    const isToggling = togglingId === row.id
                    return (
                        <div className="flex items-center justify-center gap-2 w-full">
                            <Tooltip
                                title={t(
                                    'faqManagement.toggleStatus',
                                    'تبديل الحالة',
                                )}
                            >
                                <div
                                    className="flex items-center"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Switcher
                                        checked={row.isActive}
                                        isLoading={isToggling}
                                        onChange={() => handleToggleStatus(row)}
                                    />
                                </div>
                            </Tooltip>
                            <Tooltip
                                title={t(
                                    'common.edit',
                                    'تعديل',
                                )}
                            >
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all focus:outline-none"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openEditModal(row)
                                    }}
                                >
                                    <HiOutlinePencil className="text-lg" />
                                </button>
                            </Tooltip>
                            <Tooltip
                                title={t(
                                    'common.delete',
                                    'حذف',
                                )}
                            >
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all focus:outline-none"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openDeleteDialog(row)
                                    }}
                                >
                                    <HiOutlineTrash className="text-lg" />
                                </button>
                            </Tooltip>
                        </div>
                    )
                },
            },
        ],
        [
            t,
            renderStatusBadge,
            togglingId,
            handleToggleStatus,
            openEditModal,
            openDeleteDialog,
        ],
    )

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <HiOutlineQuestionMarkCircle className="text-primary text-2xl" />
                        {t('faqManagement.title', 'إدارة الأسئلة الشائعة')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t(
                            'faqManagement.description',
                            'إضافة، تعديل، تبديل حالة الظهور، وإدارة الأسئلة الشائعة باللغتين العربية والإنجليزية.',
                        )}
                    </p>
                </div>
                <Button
                    icon={<HiOutlinePlus />}
                    variant="solid"
                    onClick={openCreateModal}
                >
                    {t('faqManagement.addFaq', 'إضافة سؤال جديد')}
                </Button>
            </div>

            {/* Global Alerts */}
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

            {/* Filters Bar */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                        <Input
                            placeholder={t(
                                'faqManagement.searchPlaceholder',
                                'البحث في نص السؤال أو الإجابة...',
                            )}
                            prefix={
                                <HiOutlineMagnifyingGlass className="text-lg text-gray-400" />
                            }
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>
                    <div>
                        <Select<StatusOption>
                            options={statusOptions}
                            placeholder={t(
                                'faqManagement.filterByStatus',
                                'تصفية حسب الحالة',
                            )}
                            value={
                                statusOptions.find(
                                    (o) => o.value === statusFilter,
                                ) || statusOptions[0]
                            }
                            onChange={handleStatusFilterChange}
                        />
                    </div>
                </div>
            </Card>

            {/* FAQs Data Table */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
                <DataTable<AdminFAQSummary>
                    columns={columns}
                    data={faqs}
                    loading={loading}
                    onRowClick={(row) => navigate(`/admin/faqs/${row.id}`)}
                    pagingData={{
                        total: totalCount,
                        pageIndex: pageNumber,
                        pageSize: pageSize,
                    }}
                    onPaginationChange={(page) => setPageNumber(page)}
                    onSelectChange={(size) => {
                        setPageSize(size)
                        setPageNumber(1)
                    }}
                />
            </Card>

            {/* Create / Edit FAQ Modal */}
            <Dialog
                isOpen={modalOpen}
                width={700}
                onClose={closeModal}
                onRequestClose={closeModal}
            >
                <div className="p-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {editingFaq
                            ? t('faqManagement.editFaq', 'تعديل السؤال الشائع')
                            : t('faqManagement.createFaq', 'إنشاء سؤال شائع')}
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

                    <form className="space-y-4" onSubmit={handleFormSubmit}>
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
                                onClick={closeModal}
                            >
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                loading={modalSubmitting}
                                type="submit"
                                variant="solid"
                            >
                                {editingFaq
                                    ? t('common.saveChanges', 'حفظ التعديلات')
                                    : t('faqManagement.createFaq', 'إنشاء السؤال')}
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
                onConfirm={handleDeleteConfirm}
                onRequestClose={() => setDeleteDialogOpen(false)}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t(
                        'faqManagement.confirmDeleteMsg',
                        'هل أنت متأكد من رغبتك في حذف هذا السؤال الشائع؟',
                    )}
                </p>
                {deletingFaq && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {deletingFaq.questionAr}
                        </p>
                        <p className="text-xs text-gray-500 dir-ltr mt-1">
                            {deletingFaq.questionEn}
                        </p>
                    </div>
                )}
            </ConfirmDialog>
        </div>
    )
}

export default FaqsManagement
