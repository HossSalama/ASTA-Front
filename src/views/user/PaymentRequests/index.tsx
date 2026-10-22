import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Tooltip from '@/components/ui/Tooltip'
import Pagination from '@/components/ui/Pagination'
import Tag from '@/components/ui/Tag'
import Spinner from '@/components/ui/Spinner'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineCreditCard,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineArrowPath,
    HiOutlineEye,
    HiOutlineInboxStack,
    HiOutlineAcademicCap,
} from 'react-icons/hi2'
import { apiGetMyPaymentRequests } from '@/services/PaymentService'
import type {
    MyPaymentRequestListItem,
    GetMyPaymentRequestsParams,
    PaymentRequestStatus,
} from '@/@types/payment'
import { formatPrice } from '@/utils/catalog'
import { useLocaleStore } from '@/store/localeStore'

interface StatusFilterOption {
    value: PaymentRequestStatus | null
    label: string
}

const UserPaymentRequestsList = () => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'

    // Data states
    const [requests, setRequests] = useState<MyPaymentRequestListItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')

    // Pagination & Filters
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [statusFilter, setStatusFilter] = useState<PaymentRequestStatus | null>(
        null,
    )

    // Status filter options
    const statusOptions: StatusFilterOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('userPaymentRequests.allStatuses', 'All Statuses'),
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

    // Fetch User Payment Requests
    const fetchRequests = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetMyPaymentRequestsParams = {
                pageNumber,
                pageSize,
            }
            if (statusFilter !== null) {
                params.status = statusFilter
            }

            const res = await apiGetMyPaymentRequests(params)
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
                        'userPaymentRequests.fetchFailed',
                        'Failed to fetch payment requests.',
                    ),
            )
            setRequests([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, statusFilter, t])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    // Status Badge Helper
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
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-2xl shrink-0">
                            <HiOutlineCreditCard />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-text-primary">
                                {t(
                                    'userPaymentRequests.title',
                                    'My Payment Requests',
                                )}
                            </h1>
                            <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                                {t(
                                    'userPaymentRequests.description',
                                    'Track the status of your manual payments and course enrollments.',
                                )}
                            </p>
                        </div>
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

            {/* Filters */}
            <Card className="border border-border shadow-sm p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="w-full sm:w-64">
                        <label className="text-xs font-semibold text-text-secondary mb-1.5 block">
                            {t('userPaymentRequests.status', 'Status')}
                        </label>
                        <Select<StatusFilterOption>
                            options={statusOptions}
                            value={statusOptions.find(
                                (opt) => opt.value === statusFilter,
                            )}
                            onChange={(option) => {
                                setStatusFilter(option?.value ?? null)
                                setPageNumber(1)
                            }}
                            placeholder={t(
                                'userPaymentRequests.allStatuses',
                                'All Statuses',
                            )}
                            isClearable={false}
                        />
                    </div>
                </div>
            </Card>

            {/* Error message */}
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

            {/* Main Content */}
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
                            {t(
                                'userPaymentRequests.noRequests',
                                'You have no payment requests yet.',
                            )}
                        </h3>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {requests.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 sm:p-5 hover:bg-surface-alt/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                                <div className="space-y-2 min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        {renderStatusTag(item.status)}
                                        <span className="text-xs font-mono text-text-muted">
                                            #{item.id}
                                        </span>
                                        <span className="text-xs text-text-muted">
                                            {dayjs(item.createdAt).format(
                                                'YYYY-MM-DD HH:mm',
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <HiOutlineAcademicCap className="text-primary text-lg shrink-0" />
                                        <h3 className="text-base font-bold text-text-primary hover:text-primary transition-colors line-clamp-1">
                                            {item.courseName || item.courseTitle || '—'}
                                        </h3>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-text-secondary">
                                        <div>
                                            <span className="text-text-muted">
                                                {t(
                                                    'userPaymentRequests.amount',
                                                    'Amount',
                                                )}
                                                :{' '}
                                            </span>
                                            <span className="font-bold text-text-primary">
                                                {formatPrice(item.amount, lang)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-text-muted">
                                                {t(
                                                    'userPaymentRequests.paymentMethod',
                                                    'Payment Method',
                                                )}
                                                :{' '}
                                            </span>
                                            <span className="font-semibold text-text-primary">
                                                {(isRtl
                                                    ? item.paymentMethodNameAr
                                                    : item.paymentMethodNameEn) ||
                                                    item.paymentMethodName ||
                                                    item.paymentMethodNameAr ||
                                                    item.paymentMethodNameEn ||
                                                    '—'}
                                            </span>
                                        </div>
                                    </div>

                                    {item.status === 'Rejected' &&
                                        item.rejectionReason && (
                                            <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                                                <span className="font-bold">
                                                    {t(
                                                        'userPaymentRequests.rejectionReason',
                                                        'Rejection Reason',
                                                    )}
                                                    :{' '}
                                                </span>
                                                <span>{item.rejectionReason}</span>
                                            </div>
                                        )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        icon={<HiOutlineEye />}
                                        onClick={() =>
                                            navigate(
                                                `/user/payment-requests/${item.id}`,
                                            )
                                        }
                                    >
                                        {t(
                                            'userPaymentRequests.viewDetails',
                                            'View Details',
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
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

export default UserPaymentRequestsList
