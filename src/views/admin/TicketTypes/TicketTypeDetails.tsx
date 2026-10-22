import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Switcher from '@/components/ui/Switcher'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineTag,
    HiOutlineTicket,
    HiOutlineClock,
    HiOutlineCalendar,
} from 'react-icons/hi2'
import {
    apiGetAdminTicketTypeById,
    apiUpdateTicketType,
    apiToggleTicketTypeStatus,
    apiDeleteTicketType,
} from '@/services/TicketService'
import {
    TicketPriority,
    type TicketTypeDetailResponse,
    type UpdateTicketTypeRequest,
} from '@/@types/ticket'
import { useLocaleStore } from '@/store/localeStore'

interface PriorityOption {
    value: TicketPriority
    label: string
}

interface FormErrors {
    nameAr?: string
    nameEn?: string
    priority?: string
}

const TicketTypeDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'
    const BackArrow = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    // Data State
    const [ticketType, setTicketType] =
        useState<TicketTypeDetailResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [toggling, setToggling] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
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
    const [deleting, setDeleting] = useState<boolean>(false)

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

    // Fetch Details
    const fetchDetails = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetAdminTicketTypeById(Number(id))
            if (res?.status && res.data) {
                setTicketType(res.data)
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'adminTicketTypes.failedFetch',
                            'فشل جلب تفاصيل نوع التذكرة.',
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
                        'adminTicketTypes.failedFetch',
                        'فشل جلب تفاصيل نوع التذكرة.',
                    ),
            )
        } finally {
            setLoading(false)
        }
    }, [id, t])

    useEffect(() => {
        fetchDetails()
    }, [fetchDetails])

    // Open Edit Modal
    const openEditModal = () => {
        if (!ticketType) return
        setNameAr(ticketType.nameAr)
        setNameEn(ticketType.nameEn)
        setPriority(ticketType.priority)
        setIsActive(ticketType.isActive)
        setFormErrors({})
        setModalApiError('')
        setEditModalOpen(true)
    }

    // Toggle Status
    const handleToggleStatus = async () => {
        if (!ticketType) return
        setToggling(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiToggleTicketTypeStatus(ticketType.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'adminTicketTypes.toggleSuccess',
                            'تم تغيير حالة نوع التذكرة بنجاح.',
                        ),
                )
                fetchDetails()
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
            setToggling(false)
        }
    }

    // Edit Submit
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ticketType) return

        const errors: FormErrors = {}
        if (!nameAr.trim()) {
            errors.nameAr = t(
                'adminTicketTypes.nameArRequired',
                'يرجى إدخال الاسم باللغة العربية',
            )
        }
        if (!nameEn.trim()) {
            errors.nameEn = t(
                'adminTicketTypes.nameEnRequired',
                'يرجى إدخال الاسم باللغة الإنجليزية',
            )
        }

        setFormErrors(errors)
        if (Object.keys(errors).length > 0) return

        setModalSubmitting(true)
        setModalApiError('')
        try {
            const payload: UpdateTicketTypeRequest = {
                nameAr: nameAr.trim(),
                nameEn: nameEn.trim(),
                priority,
                isActive,
            }
            const res = await apiUpdateTicketType(ticketType.id, payload)
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'adminTicketTypes.updateSuccess',
                            'تم تحديث نوع التذكرة بنجاح.',
                        ),
                )
                setEditModalOpen(false)
                fetchDetails()
            } else {
                setModalApiError(
                    res?.message ||
                        t(
                            'adminTicketTypes.failedUpdate',
                            'فشل تحديث نوع التذكرة.',
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
                    t(
                        'adminTicketTypes.failedUpdate',
                        'حدث خطأ أثناء حفظ البيانات.',
                    ),
            )
        } finally {
            setModalSubmitting(false)
        }
    }

    // Delete Ticket Type
    const confirmDelete = async () => {
        if (!ticketType) return
        setDeleting(true)
        setErrorMsg('')
        try {
            const res = await apiDeleteTicketType(ticketType.id)
            if (res?.status) {
                navigate('/admin/ticket-types')
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
    const renderPriorityBadge = (p: TicketPriority) => {
        switch (p) {
            case TicketPriority.Low:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {t('ticket.priority.low', 'منخفضة (Low)')}
                    </span>
                )
            case TicketPriority.Medium:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        {t('ticket.priority.medium', 'متوسطة (Medium)')}
                    </span>
                )
            case TicketPriority.High:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                        {t('ticket.priority.high', 'مرتفعة (High)')}
                    </span>
                )
            case TicketPriority.Critical:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                        {t('ticket.priority.critical', 'حرجة (Critical)')}
                    </span>
                )
            default:
                return null
        }
    }

    // Status Badge Helper
    const renderStatusBadge = (active: boolean) => {
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
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size={40} />
            </div>
        )
    }

    if (!ticketType) {
        return (
            <div className="max-w-4xl mx-auto p-4 space-y-4">
                <Button
                    variant="plain"
                    icon={<BackArrow />}
                    onClick={() => navigate('/admin/ticket-types')}
                >
                    {t('common.back', 'رجوع')}
                </Button>
                <Alert type="danger">
                    {errorMsg ||
                        t(
                            'adminTicketTypes.failedFetch',
                            'فشل جلب تفاصيل نوع التذكرة.',
                        )}
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full p-4 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/ticket-types')}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-lg transition-colors cursor-pointer"
                        title={t('common.back', 'رجوع')}
                    >
                        <BackArrow />
                    </button>
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {ticketType.nameAr}
                            </h2>
                            {renderStatusBadge(ticketType.isActive)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 dir-ltr text-left">
                            {ticketType.nameEn}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        icon={<HiOutlinePencil />}
                        onClick={openEditModal}
                    >
                        {t('common.edit', 'تعديل')}
                    </Button>
                    <Button
                        variant="plain"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        icon={<HiOutlineTrash />}
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        {t('common.delete', 'حذف')}
                    </Button>
                </div>
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

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Details Card (2 cols) */}
                <Card className="md:col-span-2 shadow-xs border border-gray-100 dark:border-gray-800">
                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        <HiOutlineTag className="text-primary text-lg" />
                        {t(
                            'adminTicketTypes.detailsTitle',
                            'بيانات نوع التذكرة',
                        )}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t('adminTicketTypes.nameAr', 'الاسم بالعربية')}
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 mt-1 block">
                                {ticketType.nameAr}
                            </span>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t(
                                    'adminTicketTypes.nameEn',
                                    'الاسم بالإنجليزية',
                                )}
                            </span>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-1 block dir-ltr">
                                {ticketType.nameEn}
                            </span>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t(
                                    'adminTicketTypes.priority',
                                    'الأولوية الافتراضية',
                                )}
                            </span>
                            <div className="mt-1.5">
                                {renderPriorityBadge(ticketType.priority)}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t('adminTicketTypes.status', 'حالة التفعيل')}
                            </span>
                            <div className="flex items-center gap-3 mt-1.5">
                                <Switcher
                                    checked={ticketType.isActive}
                                    isLoading={toggling}
                                    onChange={handleToggleStatus}
                                />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {ticketType.isActive
                                        ? t('adminTicketTypes.active', 'نشط')
                                        : t(
                                              'adminTicketTypes.inactive',
                                              'غير نشط',
                                          )}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Associated Tickets Statistics Card */}
                <Card className="shadow-xs border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <HiOutlineTicket className="text-primary text-lg" />
                            {t(
                                'adminTicketTypes.associatedTickets',
                                'التذاكر المرتبطة',
                            )}
                        </h4>

                        <div className="text-center py-6">
                            <span className="text-5xl font-extrabold text-primary block">
                                {ticketType.associatedTicketsCount}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-2 block font-medium">
                                {t(
                                    'adminTicketTypes.associatedCount',
                                    'تذكرة مرتبطة بهذا النوع',
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                        <Button
                            variant="default"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                                navigate(
                                    `/admin/tickets?ticketTypeId=${ticketType.id}`,
                                )
                            }
                        >
                            {t('adminTickets.title', 'عرض التذاكر المرتبطة')}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Audit Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                    <HiOutlineClock className="text-primary text-lg" />
                    {t('adminTickets.auditInfo', 'سجل التدقيق')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center text-lg shrink-0">
                            <HiOutlineCalendar />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block font-medium">
                                {t('common.createdAt', 'تاريخ الإنشاء')}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 dir-ltr">
                                {dayjs(ticketType.createdAt).format(
                                    'YYYY/MM/DD hh:mm A',
                                )}
                            </span>
                        </div>
                    </div>

                    {ticketType.updatedAt && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-lg shrink-0">
                                <HiOutlineClock />
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block font-medium">
                                    {t('common.updatedAt', 'تاريخ آخر تحديث')}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 dir-ltr">
                                    {dayjs(ticketType.updatedAt).format(
                                        'YYYY/MM/DD hh:mm A',
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Edit Dialog */}
            <Dialog
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onRequestClose={() => setEditModalOpen(false)}
                width={560}
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {t(
                            'adminTicketTypes.editTicketType',
                            'تعديل نوع التذكرة',
                        )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {t(
                            'adminTicketTypes.editSubtitle',
                            'تحديث الاسم بالعربية والإنجليزية والأولوية لنوع التذكرة.',
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

                    <form onSubmit={handleEditSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('adminTicketTypes.nameAr', 'الاسم بالعربية')}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={nameAr}
                                invalid={!!formErrors.nameAr}
                                onChange={(e) => setNameAr(e.target.value)}
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
                                value={nameEn}
                                invalid={!!formErrors.nameEn}
                                onChange={(e) => setNameEn(e.target.value)}
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
                                onClick={() => setEditModalOpen(false)}
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

            {/* Delete Dialog */}
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
                        {ticketType.nameAr} ({ticketType.nameEn})
                    </strong>
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default TicketTypeDetails
