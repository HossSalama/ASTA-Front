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
    HiOutlineEye,
    HiOutlineTag,
} from 'react-icons/hi2'
import {
    apiGetAdminTicketTypes,
    apiCreateTicketType,
    apiUpdateTicketType,
    apiToggleTicketTypeStatus,
    apiDeleteTicketType,
} from '@/services/TicketService'
import {
    TicketPriority,
    type TicketTypeResponse,
    type CreateTicketTypeRequest,
    type UpdateTicketTypeRequest,
} from '@/@types/ticket'

interface StatusOption {
    value: boolean | null
    label: string
}

interface PriorityOption {
    value: TicketPriority
    label: string
}

interface FormErrors {
    nameAr?: string
    nameEn?: string
    priority?: string
}

const TicketTypesManagement = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Status filter options
    const statusOptions: StatusOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('adminTicketTypes.allStatuses', 'جميع الحالات'),
            },
            {
                value: true,
                label: t('adminTicketTypes.active', 'النشطة فقط'),
            },
            {
                value: false,
                label: t('adminTicketTypes.inactive', 'غير النشطة فقط'),
            },
        ],
        [t],
    )

    // Priority options
    const priorityOptions: PriorityOption[] = useMemo(
        () => [
            {
                value: TicketPriority.Low,
                label: t('ticket.priority.low', 'منخفضة (Low)'),
            },
            {
                value: TicketPriority.Medium,
                label: t('ticket.priority.medium', 'متوسطة (Medium)'),
            },
            {
                value: TicketPriority.High,
                label: t('ticket.priority.high', 'مرتفعة (High)'),
            },
            {
                value: TicketPriority.Critical,
                label: t('ticket.priority.critical', 'حرجة (Critical)'),
            },
        ],
        [t],
    )

    // Data state
    const [ticketTypes, setTicketTypes] = useState<TicketTypeResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Filters
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<boolean | null>(null)

    // Create / Edit Modal State
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [editingType, setEditingType] = useState<TicketTypeResponse | null>(
        null,
    )
    const [nameAr, setNameAr] = useState<string>('')
    const [nameEn, setNameEn] = useState<string>('')
    const [priority, setPriority] = useState<TicketPriority>(
        TicketPriority.Medium,
    )
    const [isActive, setIsActive] = useState<boolean>(true)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false)
    const [modalApiError, setModalApiError] = useState<string>('')

    // Delete Modal State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deletingType, setDeletingType] = useState<TicketTypeResponse | null>(
        null,
    )
    const [deleting, setDeleting] = useState<boolean>(false)

    // Switcher Toggling State
    const [togglingId, setTogglingId] = useState<number | null>(null)

    // Fetch Ticket Types
    const fetchTicketTypes = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetAdminTicketTypes({
                searchTerm: searchTerm.trim() || undefined,
                isActive: statusFilter !== null ? statusFilter : undefined,
            })
            if (res?.status && res.data) {
                // If backend returns array directly or inside data
                const items = Array.isArray(res.data) ? res.data : []
                setTicketTypes(items)
            } else {
                setTicketTypes([])
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('adminTicketTypes.failedFetch', 'فشل جلب أنواع التذاكر.'),
            )
            setTicketTypes([])
        } finally {
            setLoading(false)
        }
    }, [searchTerm, statusFilter, t])

    useEffect(() => {
        fetchTicketTypes()
    }, [fetchTicketTypes])

    // Filter locally if search / status applied
    const filteredTypes = useMemo(() => {
        return ticketTypes.filter((item) => {
            const matchesSearch =
                !searchTerm.trim() ||
                item.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
            const matchesStatus =
                statusFilter === null || item.isActive === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [ticketTypes, searchTerm, statusFilter])

    // Modal Controls
    const openCreateModal = () => {
        setEditingType(null)
        setNameAr('')
        setNameEn('')
        setPriority(TicketPriority.Medium)
        setIsActive(true)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const openEditModal = (item: TicketTypeResponse) => {
        setEditingType(item)
        setNameAr(item.nameAr)
        setNameEn(item.nameEn)
        setPriority(item.priority)
        setIsActive(item.isActive)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditingType(null)
        setNameAr('')
        setNameEn('')
        setPriority(TicketPriority.Medium)
        setIsActive(true)
        setFormErrors({})
        setModalApiError('')
    }

    // Form Validation
    const validateForm = (): boolean => {
        const errors: FormErrors = {}
        let isValid = true

        if (!nameAr.trim()) {
            errors.nameAr = t(
                'adminTicketTypes.nameArRequired',
                'يرجى إدخال الاسم باللغة العربية',
            )
            isValid = false
        } else if (nameAr.trim().length > 100) {
            errors.nameAr = t(
                'adminTicketTypes.nameArMaxLength',
                'الاسم بالعربية يجب ألا يتجاوز 100 حرف',
            )
            isValid = false
        }

        if (!nameEn.trim()) {
            errors.nameEn = t(
                'adminTicketTypes.nameEnRequired',
                'يرجى إدخال الاسم باللغة الإنجليزية',
            )
            isValid = false
        } else if (nameEn.trim().length > 100) {
            errors.nameEn = t(
                'adminTicketTypes.nameEnMaxLength',
                'الاسم بالإنجليزية يجب ألا يتجاوز 100 حرف',
            )
            isValid = false
        }

        if (!priority) {
            errors.priority = t(
                'adminTicketTypes.priorityRequired',
                'يرجى تحديد الأولوية الافتراضية',
            )
            isValid = false
        }

        setFormErrors(errors)
        return isValid
    }

    // Form Submit
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setModalSubmitting(true)
        setModalApiError('')
        setErrorMsg('')
        setSuccessMsg('')

        try {
            if (editingType) {
                const payload: UpdateTicketTypeRequest = {
                    nameAr: nameAr.trim(),
                    nameEn: nameEn.trim(),
                    priority,
                    isActive,
                }
                const res = await apiUpdateTicketType(editingType.id, payload)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'adminTicketTypes.updateSuccess',
                                'تم تحديث نوع التذكرة بنجاح.',
                            ),
                    )
                    closeModal()
                    fetchTicketTypes()
                } else {
                    setModalApiError(
                        res?.message ||
                            t(
                                'adminTicketTypes.failedUpdate',
                                'فشل تحديث نوع التذكرة.',
                            ),
                    )
                }
            } else {
                const payload: CreateTicketTypeRequest = {
                    nameAr: nameAr.trim(),
                    nameEn: nameEn.trim(),
                    priority,
                    isActive,
                }
                const res = await apiCreateTicketType(payload)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'adminTicketTypes.createSuccess',
                                'تم إنشاء نوع التذكرة بنجاح.',
                            ),
                    )
                    closeModal()
                    fetchTicketTypes()
                } else {
                    setModalApiError(
                        res?.message ||
                            t(
                                'adminTicketTypes.failedCreate',
                                'فشل إنشاء نوع التذكرة.',
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
                        'adminTicketTypes.failedCreate',
                        'حدث خطأ أثناء حفظ البيانات.',
                    ),
            )
        } finally {
            setModalSubmitting(false)
        }
    }

    // Toggle Status
    const handleToggleStatus = useCallback(
        async (typeItem: TicketTypeResponse) => {
            setTogglingId(typeItem.id)
            setErrorMsg('')
            setSuccessMsg('')

            try {
                const res = await apiToggleTicketTypeStatus(typeItem.id)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'adminTicketTypes.toggleSuccess',
                                'تم تغيير حالة نوع التذكرة بنجاح.',
                            ),
                    )
                    fetchTicketTypes()
                } else {
                    setErrorMsg(
                        res?.message ||
                            t(
                                'adminTicketTypes.failedToggle',
                                'فشل تغيير حالة نوع التذكرة.',
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
                        t('adminTicketTypes.failedToggle', 'فشلت العملية.'),
                )
            } finally {
                setTogglingId(null)
            }
        },
        [fetchTicketTypes, t],
    )

    // Delete Ticket Type
    const handleDeleteClick = (item: TicketTypeResponse) => {
        setDeletingType(item)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!deletingType) return
        setDeleting(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const res = await apiDeleteTicketType(deletingType.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'adminTicketTypes.deleteSuccess',
                            'تم حذف نوع التذكرة بنجاح.',
                        ),
                )
                setDeleteDialogOpen(false)
                setDeletingType(null)
                fetchTicketTypes()
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'adminTicketTypes.failedDelete',
                            'فشل حذف نوع التذكرة.',
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
                    t('adminTicketTypes.failedDelete', 'فشل حذف نوع التذكرة.'),
            )
            setDeleteDialogOpen(false)
        } finally {
            setDeleting(false)
        }
    }

    // Priority Badge Helper
    const renderPriorityBadge = useCallback(
        (p: TicketPriority) => {
            switch (p) {
                case TicketPriority.Low:
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {t('ticket.priority.low', 'منخفضة')}
                        </span>
                    )
                case TicketPriority.Medium:
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                            {t('ticket.priority.medium', 'متوسطة')}
                        </span>
                    )
                case TicketPriority.High:
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                            {t('ticket.priority.high', 'مرتفعة')}
                        </span>
                    )
                case TicketPriority.Critical:
                    return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                            {t('ticket.priority.critical', 'حرجة')}
                        </span>
                    )
                default:
                    return null
            }
        },
        [t],
    )

    // Status Badge Helper
    const renderStatusBadge = useCallback(
        (active: boolean) => {
            if (active) {
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                        {t('adminTicketTypes.active', 'نشط')}
                    </span>
                )
            }
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-gray-400" />
                    {t('adminTicketTypes.inactive', 'غير نشط')}
                </span>
            )
        },
        [t],
    )

    // Table Columns
    const columns: ColumnDef<TicketTypeResponse>[] = useMemo(
        () => [
            {
                header: () => t('adminTicketTypes.nameAr', 'الاسم بالعربية'),
                accessorKey: 'nameAr',
                size: 200,
                cell: (props) => (
                    <div className="flex items-center gap-2">
                        <HiOutlineTag className="text-gray-400 text-base" />
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                            {props.row.original.nameAr}
                        </span>
                    </div>
                ),
            },
            {
                header: () => t('adminTicketTypes.nameEn', 'الاسم بالإنجليزية'),
                accessorKey: 'nameEn',
                size: 200,
                cell: (props) => (
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm dir-ltr">
                        {props.row.original.nameEn}
                    </span>
                ),
            },
            {
                header: () =>
                    t('adminTicketTypes.priority', 'الأولوية الافتراضية'),
                accessorKey: 'priority',
                size: 150,
                cell: (props) =>
                    renderPriorityBadge(props.row.original.priority),
            },
            {
                header: () => t('adminTicketTypes.status', 'الحالة'),
                accessorKey: 'isActive',
                size: 120,
                cell: (props) => renderStatusBadge(props.row.original.isActive),
            },
            {
                header: () => t('common.createdAt', 'تاريخ الإنشاء'),
                accessorKey: 'createdAt',
                size: 150,
                cell: (props) => (
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 dir-ltr">
                        {dayjs(props.row.original.createdAt).format(
                            'YYYY/MM/DD',
                        )}
                    </span>
                ),
            },
            {
                header: () => t('common.actions', 'إجراءات'),
                id: 'action',
                size: 160,
                cell: (props) => {
                    const row = props.row.original
                    const isToggling = togglingId === row.id
                    return (
                        <div className="flex items-center gap-2">
                            <Tooltip
                                title={t(
                                    'adminTicketTypes.toggleStatus',
                                    'تبديل الحالة',
                                )}
                            >
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Switcher
                                        checked={row.isActive}
                                        isLoading={isToggling}
                                        onChange={() => handleToggleStatus(row)}
                                    />
                                </div>
                            </Tooltip>
                            <Tooltip
                                title={t(
                                    'adminTicketTypes.detailsTitle',
                                    'عرض التفاصيل',
                                )}
                            >
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        navigate(
                                            `/admin/ticket-types/${row.id}`,
                                        )
                                    }}
                                >
                                    <HiOutlineEye className="text-lg" />
                                </button>
                            </Tooltip>
                            <Tooltip
                                title={t(
                                    'adminTicketTypes.editTicketType',
                                    'تعديل',
                                )}
                            >
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openEditModal(row)
                                    }}
                                >
                                    <HiOutlinePencil className="text-lg" />
                                </button>
                            </Tooltip>
                            <Tooltip title={t('common.delete', 'حذف')}>
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteClick(row)
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
            renderPriorityBadge,
            renderStatusBadge,
            togglingId,
            handleToggleStatus,
            navigate,
        ],
    )

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {t('adminTicketTypes.title', 'إدارة أنواع التذاكر')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t(
                            'adminTicketTypes.description',
                            'إنشاء وتعديل أنواع التذاكر وتحديد الأولويات الافتراضية وتبديل حالتها.',
                        )}
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={openCreateModal}
                >
                    {t('adminTicketTypes.addTicketType', 'إضافة نوع تذكرة')}
                </Button>
            </div>

            {/* Notifications */}
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:w-80">
                        <Input
                            placeholder={t(
                                'adminTicketTypes.searchPlaceholder',
                                'البحث بالاسم العربي أو الإنجليزي...',
                            )}
                            value={searchTerm}
                            prefix={
                                <HiOutlineMagnifyingGlass className="text-lg text-gray-400" />
                            }
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select<StatusOption>
                            placeholder={t(
                                'adminTickets.filterStatus',
                                'تصفية حسب الحالة',
                            )}
                            options={statusOptions}
                            value={
                                statusOptions.find(
                                    (o) => o.value === statusFilter,
                                ) || statusOptions[0]
                            }
                            onChange={(opt) =>
                                setStatusFilter(opt ? opt.value : null)
                            }
                        />
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={filteredTypes}
                    loading={loading}
                    onRowClick={(row) =>
                        navigate(`/admin/ticket-types/${row.id}`)
                    }
                />
            </Card>

            {/* Create / Edit Modal */}
            <Dialog
                isOpen={modalOpen}
                onClose={closeModal}
                onRequestClose={closeModal}
                width={560}
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {editingType
                            ? t(
                                  'adminTicketTypes.editTicketType',
                                  'تعديل نوع التذكرة',
                              )
                            : t(
                                  'adminTicketTypes.createTicketType',
                                  'إنشاء نوع تذكرة جديد',
                              )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {editingType
                            ? t(
                                  'adminTicketTypes.editSubtitle',
                                  'تحديث الاسم بالعربية والإنجليزية والأولوية لنوع التذكرة.',
                              )
                            : t(
                                  'adminTicketTypes.createSubtitle',
                                  'أدخل بيانات نوع تذكرة الدعم الفني الجديد.',
                              )}
                    </p>

                    {modalApiError && (
                        <Alert
                            type="danger"
                            className="mb-4"
                            onClose={() => setModalApiError('')}
                        >
                            {modalApiError}
                        </Alert>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('adminTicketTypes.nameAr', 'الاسم بالعربية')}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder={t(
                                    'adminTicketTypes.nameArPlaceholder',
                                    'مثال: استفسار مالي ومحاسبي',
                                )}
                                value={nameAr}
                                invalid={!!formErrors.nameAr}
                                onChange={(e) => {
                                    setNameAr(e.target.value)
                                    if (formErrors.nameAr) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            nameAr: undefined,
                                        }))
                                    }
                                }}
                            />
                            {formErrors.nameAr && (
                                <span className="text-xs text-red-500 mt-1 block">
                                    {formErrors.nameAr}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t(
                                    'adminTicketTypes.nameEn',
                                    'الاسم بالإنجليزية',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder={t(
                                    'adminTicketTypes.nameEnPlaceholder',
                                    'Example: Financial & Billing Inquiry',
                                )}
                                value={nameEn}
                                invalid={!!formErrors.nameEn}
                                onChange={(e) => {
                                    setNameEn(e.target.value)
                                    if (formErrors.nameEn) {
                                        setFormErrors((prev) => ({
                                            ...prev,
                                            nameEn: undefined,
                                        }))
                                    }
                                }}
                            />
                            {formErrors.nameEn && (
                                <span className="text-xs text-red-500 mt-1 block">
                                    {formErrors.nameEn}
                                </span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t(
                                    'adminTicketTypes.priority',
                                    'الأولوية الافتراضية',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Select<PriorityOption>
                                options={priorityOptions}
                                value={
                                    priorityOptions.find(
                                        (o) => o.value === priority,
                                    ) || priorityOptions[1]
                                }
                                onChange={(opt) => {
                                    if (opt) setPriority(opt.value)
                                }}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-100 dark:border-gray-800">
                            <div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                    {t(
                                        'adminTicketTypes.isActiveLabel',
                                        'تفعيل نوع التذكرة',
                                    )}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {t(
                                        'adminTicketTypes.isActiveHelp',
                                        'الأنواع النشطة فقط تظهر للعملاء في نموذج طلب الدعم.',
                                    )}
                                </span>
                            </div>
                            <Switcher
                                checked={isActive}
                                onChange={(val) => setIsActive(val)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                type="button"
                                variant="plain"
                                onClick={closeModal}
                                disabled={modalSubmitting}
                            >
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={modalSubmitting}
                            >
                                {t('common.save', 'حفظ')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                type="danger"
                title={t(
                    'adminTicketTypes.deleteConfirmTitle',
                    'حذف نوع التذكرة',
                )}
                confirmButtonColor="red-600"
                onClose={() => setDeleteDialogOpen(false)}
                onRequestClose={() => setDeleteDialogOpen(false)}
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                loading={deleting}
            >
                <p>
                    {t(
                        'adminTicketTypes.deleteConfirmMsg',
                        'هل أنت متأكد من رغبتك في حذف هذا النوع من التذاكر؟',
                    )}{' '}
                    <strong className="text-gray-900 dark:text-gray-100">
                        {deletingType?.nameAr} ({deletingType?.nameEn})
                    </strong>
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default TicketTypesManagement
