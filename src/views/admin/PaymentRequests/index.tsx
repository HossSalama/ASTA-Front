import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Tooltip from '@/components/ui/Tooltip'
import Pagination from '@/components/ui/Pagination'
import Tag from '@/components/ui/Tag'
import Spinner from '@/components/ui/Spinner'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineMagnifyingGlass,
    HiOutlineReceiptPercent,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineArrowPath,
    HiOutlineInboxStack,
    HiOutlineAcademicCap,
    HiOutlineUser,
} from 'react-icons/hi2'
import { apiGetAdminPaymentRequests } from '@/services/PaymentService'
import type {
    AdminPaymentRequestListItem,
    GetAdminPaymentRequestsParams,
    PaymentRequestStatus,
} from '@/@types/payment'
import { formatPrice } from '@/utils/catalog'
import { useLocaleStore } from '@/store/localeStore'

interface StatusOption {
    value: PaymentRequestStatus | null
    label: string
}

const AdminPaymentRequestsQueue = () => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'

    // Filter states
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<PaymentRequestStatus | null>(
        null,
    )
    const [fromDate, setFromDate] = useState<string>('')
    const [toDate, setToDate] = useState<string>('')

    // Data states
    const [requests, setRequests] = useState<AdminPaymentRequestListItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')

    // Pagination
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)

    const statusOptions: StatusOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('adminPaymentRequests.allStatuses', 'All Statuses'),
            },
            {
                value: 'New',
                label: t('payment.status.new', 'New'),
            },
            {
                value: 'Pending',
                label: t('payment.status.pending', 'Under Review'),
            },
            {
                value: 'Approved',
                label: t('payment.status.approved', 'Approved'),
            },
            {
                value: 'Rejected',
                label: t('payment.status.rejected', 'Rejected'),
            },
        ],
        [t],
    )

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetAdminPaymentRequestsParams = {
                pageNumber,
                pageSize,
                sortBy: 'createdAt',
                sortOrder: 'desc',
            }

            if (statusFilter !== null) {
                params.status = statusFilter
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }
            if (fromDate) {
                params.fromDate = fromDate
            }
            if (toDate) {
                params.toDate = toDate
            }

            const res = await apiGetAdminPaymentRequests(params)
            if (res && res.data) {
                setRequests(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setRequests([])
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
                    t(
                        'adminPaymentRequests.fetchFailed',
                        'Failed to fetch payment requests.',
                    ),
            )
            setRequests([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, statusFilter, searchTerm, fromDate, toDate, t])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setPageNumber(1)
        fetchRequests()
    }

    const renderStatusTag = (status: PaymentRequestStatus) => {
        switch (status) {
            case 'New':
                return (
                    <Tag className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold gap-1">
                        <HiOutlineClock className="text-xs" />
                        <span>{t('payment.status.new', 'New')}</span>
                    </Tag>
                )
            case 'Pending':
                return (
                    <Tag className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold gap-1">
                        <HiOutlineClock className="text-xs" />
                        <span>{t('payment.status.pending', 'Under Review')}</span>
                    </Tag>
                )
            case 'Approved':
                return (
                    <Tag className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold gap-1">
                        <HiOutlineCheckCircle className="text-xs" />
                        <span>{t('payment.status.approved', 'Approved')}</span>
                    </Tag>
                )
            case 'Rejected':
                return (
                    <Tag className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold gap-1">
                        <HiOutlineXCircle className="text-xs" />
                        <span>{t('payment.status.rejected', 'Rejected')}</span>
                    </Tag>
                )
            default:
                return <Tag>{status}</Tag>
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                        <HiOutlineReceiptPercent />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">
                            {t(
                                'adminPaymentRequests.title',
                                'Payment Requests Review',
                            )}
                        </h1>
                        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                            {t(
                                'adminPaymentRequests.description',
                                'Review manual payments, verify receipts against bank statements, and approve or reject enrollments.',
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Tooltip title={t('common.retry', 'Refresh')}>
                        <Button
                            variant="default"
                            size="sm"
                            icon={<HiOutlineArrowPath />}
                            loading={loading}
                            onClick={() => fetchRequests()}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Filter Bar */}
            <Card className="border border-border shadow-sm p-4">
                <form
                    onSubmit={handleSearchSubmit}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                    {/* Search */}
                    <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                            {t('common.search', 'Search')}
                        </label>
                        <Input
                            prefix={<HiOutlineMagnifyingGlass className="text-base" />}
                            placeholder={t(
                                'adminPaymentRequests.searchPlaceholder',
                                'Student name, email, sender...',
                            )}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                            {t('adminPaymentRequests.filterStatus', 'Status')}
                        </label>
                        <Select<StatusOption>
                            options={statusOptions}
                            value={statusOptions.find(
                                (opt) => opt.value === statusFilter,
                            )}
                            onChange={(option) => {
                                setStatusFilter(option?.value ?? null)
                                setPageNumber(1)
                            }}
                            placeholder={t(
                                'adminPaymentRequests.allStatuses',
                                'All Statuses',
                            )}
                            isClearable={false}
                        />
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                            {t('common.dateFrom', 'From Date')}
                        </label>
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value)
                                setPageNumber(1)
                            }}
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                            {t('common.dateTo', 'To Date')}
                        </label>
                        <Input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value)
                                setPageNumber(1)
                            }}
                        />
                    </div>
                </form>
            </Card>

            {/* Alerts */}
            {errorMsg && (
                <Alert
                    type="danger"
                    showIcon
                    closable
                    onClose={() => setErrorMsg('')}
                >
                    {errorMsg}
                </Alert>
            )}

            {/* Main Queue Table */}
            <Card className="border border-border shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <Spinner size={36} />
                        <span className="text-xs text-text-secondary">
                            {t('common.loading', 'Loading...')}
                        </span>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-alt text-text-muted flex items-center justify-center text-3xl">
                            <HiOutlineInboxStack />
                        </div>
                        <h3 className="text-base font-bold text-text-primary">
                            {t('common.noDataFound', 'No payment requests found.')}
                        </h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] text-start text-sm">
                            <thead className="bg-surface-alt/50 border-b border-border text-xs uppercase font-semibold text-text-secondary">
                                <tr>
                                    <th className="px-5 py-3.5 text-start">
                                        {t('adminPaymentRequests.student', 'Student')}
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t('adminPaymentRequests.course', 'Course')}
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t('adminPaymentRequests.amount', 'Amount')}
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t('adminPaymentRequests.method', 'Method')}
                                    </th>
                                    <th className="px-5 py-3.5 text-start">
                                        {t(
                                            'adminPaymentRequests.senderAccount',
                                            'Sender Account',
                                        )}
                                    </th>
                                    <th className="px-5 py-3.5 text-center">
                                        {t('adminPaymentRequests.status', 'Status')}
                                    </th>
                                    <th className="px-5 py-3.5 text-end">
                                        {t('adminPaymentRequests.date', 'Date')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {requests.map((req) => (
                                    <tr
                                        key={req.id}
                                        onClick={() =>
                                            navigate(
                                                `/admin/payment-requests/${req.id}`,
                                            )
                                        }
                                        className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 font-bold text-text-primary group-hover:text-primary transition-colors">
                                                    <HiOutlineUser className="text-text-muted group-hover:text-primary transition-colors" />
                                                    <span>{req.studentName}</span>
                                                </div>
                                                <span className="text-xs text-text-secondary block">
                                                    {req.studentEmail}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 max-w-xs">
                                            <div className="flex items-center gap-1.5">
                                                <HiOutlineAcademicCap className="text-primary shrink-0" />
                                                <span className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                                                    {req.courseName || req.courseTitle || '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="font-bold text-primary text-sm whitespace-nowrap">
                                                {formatPrice(req.amount, lang)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <span className="text-xs font-semibold text-text-primary">
                                                {(isRtl
                                                    ? req.paymentMethodNameAr
                                                    : req.paymentMethodNameEn) ||
                                                    req.paymentMethodNameAr ||
                                                    req.paymentMethodNameEn ||
                                                    req.paymentMethodName ||
                                                    '—'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className="font-mono text-xs font-bold text-text-primary select-all"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {req.senderAccount}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center whitespace-nowrap">
                                            {renderStatusTag(req.status)}
                                        </td>
                                        <td className="px-5 py-4 text-xs text-text-secondary whitespace-nowrap text-end">
                                            {dayjs(req.createdAt).format(
                                                'YYYY-MM-DD HH:mm',
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalCount > pageSize && (
                    <div className="p-4 border-t border-border flex justify-center sm:justify-end">
                        <Pagination
                            currentPage={pageNumber}
                            total={totalCount}
                            pageSize={pageSize}
                            onChange={(page) => setPageNumber(page)}
                        />
                    </div>
                )}
            </Card>
        </div>
    )
}

export default AdminPaymentRequestsQueue
