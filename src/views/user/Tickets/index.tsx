import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Tooltip from '@/components/ui/Tooltip'
import Pagination from '@/components/ui/Pagination'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlinePlus,
    HiOutlineTicket,
    HiOutlinePaperClip,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineArrowPath,
    HiOutlineEye,
    HiOutlineInboxStack,
} from 'react-icons/hi2'
import { apiGetMyTickets } from '@/services/TicketService'
import {
    TicketStatus,
    type UserTicketListItemResponse,
    type GetUserTicketsParams,
} from '@/@types/ticket'

interface StatusFilterOption {
    value: TicketStatus | null
    label: string
}

const UserTicketsList = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Data states
    const [tickets, setTickets] = useState<UserTicketListItemResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')

    // Pagination & Filters
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null)

    // Status filter options
    const statusOptions: StatusFilterOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('userTickets.allStatuses', 'جميع الحالات'),
            },
            {
                value: TicketStatus.New,
                label: t('ticket.status.new', 'جديدة'),
            },
            {
                value: TicketStatus.InProgress,
                label: t('ticket.status.inProgress', 'قيد المعالجة'),
            },
            {
                value: TicketStatus.Closed,
                label: t('ticket.status.closed', 'مغلقة'),
            },
        ],
        [t],
    )

    // Fetch User Tickets
    const fetchTickets = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetUserTicketsParams = {
                pageNumber,
                pageSize,
            }
            if (statusFilter !== null) {
                params.status = statusFilter
            }

            const res = await apiGetMyTickets(params)
            if (res?.status && res.data) {
                setTickets(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setTickets([])
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
                        'common.operationFailed',
                        'فشلت العملية. يرجى المحاولة مرة أخرى.',
                    ),
            )
            setTickets([])
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, statusFilter, t])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    // Status Badge Helper
    const renderStatusBadge = (status: TicketStatus) => {
        switch (status) {
            case TicketStatus.New:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-sky-500 animate-pulse" />
                        {t('ticket.status.new', 'جديدة')}
                    </span>
                )
            case TicketStatus.InProgress:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">
                        <HiOutlineArrowPath className="w-3 h-3 shrink-0 text-amber-600 dark:text-amber-400" />
                        {t('ticket.status.inProgress', 'قيد المعالجة')}
                    </span>
                )
            case TicketStatus.Closed:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                        <HiOutlineCheckCircle className="w-3 h-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        {t('ticket.status.closed', 'مغلقة')}
                    </span>
                )
            default:
                return null
        }
    }

    return (
        <div className="flex flex-col gap-6 w-full p-4 max-w-7xl mx-auto">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent dark:from-blue-950/30 dark:via-indigo-950/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center text-2xl shrink-0">
                        <HiOutlineTicket />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {t('userTickets.title', 'تذاكر الدعم الفني')}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                            {t(
                                'userTickets.subtitle',
                                'متابعة طلبات واستفسارات الدعم الفني، مراجعة ردود الإدارة، وتقييم جودة الخدمة.',
                            )}
                        </p>
                    </div>
                </div>
                <Button
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={() => navigate('/support')}
                >
                    {t('userTickets.createTicket', 'إنشاء تذكرة جديدة')}
                </Button>
            </div>

            {/* Error Notification */}
            {errorMsg && (
                <Alert type="danger" onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {/* Filters Bar */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Status Tabs/Select */}
                    <div className="hidden sm:flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                        {statusOptions.map((opt) => {
                            const isSelected = statusFilter === opt.value
                            return (
                                <button
                                    key={String(opt.value)}
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter(opt.value)
                                        setPageNumber(1)
                                    }}
                                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                                        isSelected
                                            ? 'bg-primary text-white shadow-sm shadow-primary/20'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            )
                        })}
                    </div>

                    <div className="w-full sm:hidden">
                        <Select<StatusFilterOption>
                            options={statusOptions}
                            value={
                                statusOptions.find(
                                    (o) => o.value === statusFilter,
                                ) || statusOptions[0]
                            }
                            onChange={(opt) => {
                                setStatusFilter(opt ? opt.value : null)
                                setPageNumber(1)
                            }}
                        />
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {t('common.total', 'الإجمالي')}: {totalCount}
                    </div>
                </div>
            </Card>

            {/* Content List */}
            {loading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : tickets.length === 0 ? (
                <Card className="shadow-xs border border-gray-100 dark:border-gray-800 py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center text-3xl mx-auto mb-4">
                        <HiOutlineInboxStack />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                        {t(
                            'userTickets.emptyTickets',
                            'لم تقم بإنشاء أي تذاكر دعم فني حتى الآن.',
                        )}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mt-2">
                        {t(
                            'userTickets.emptyTicketsDesc',
                            'إذا واجهتك أي مشكلة أو كان لديك استفسار، يمكنك إنشاء تذكرة دعم وسيتولى فريقنا الرد عليك.',
                        )}
                    </p>
                    <div className="mt-6">
                        <Button
                            variant="solid"
                            icon={<HiOutlinePlus />}
                            onClick={() => navigate('/support')}
                        >
                            {t('userTickets.createTicket', 'إنشاء تذكرة جديدة')}
                        </Button>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {tickets.map((ticket) => (
                        <Card
                            key={ticket.id}
                            className="shadow-xs border border-gray-100 dark:border-gray-800 hover:border-primary/40 dark:hover:border-primary/40 transition-all cursor-pointer group"
                            onClick={() =>
                                navigate(`/user/tickets/${ticket.id}`)
                            }
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                {/* Left / Main details */}
                                <div className="space-y-2 flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 dir-ltr">
                                            {ticket.ticketNumber}
                                        </span>
                                        <span className="text-sm font-semibold text-primary dark:text-primary-mild">
                                            {ticket.ticketTypeName}
                                        </span>
                                        {renderStatusBadge(ticket.status)}
                                        {ticket.hasAttachment && (
                                            <Tooltip
                                                title={t(
                                                    'userTickets.hasAttachment',
                                                    'يوجد مرفق',
                                                )}
                                            >
                                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/80 px-2 py-0.5 rounded border border-gray-200/60 dark:border-gray-700">
                                                    <HiOutlinePaperClip className="text-sm" />
                                                    {t(
                                                        'userTickets.attachment',
                                                        'مرفق',
                                                    )}
                                                </span>
                                            </Tooltip>
                                        )}
                                    </div>

                                    {ticket.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                            {ticket.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 pt-1">
                                        <span className="flex items-center gap-1">
                                            <HiOutlineClock className="text-sm" />
                                            {t(
                                                'userTickets.createdAt',
                                                'تاريخ الإنشاء',
                                            )}
                                            :{' '}
                                            <span className="dir-ltr font-medium text-gray-600 dark:text-gray-400">
                                                {dayjs(ticket.createdAt).format(
                                                    'YYYY/MM/DD hh:mm A',
                                                )}
                                            </span>
                                        </span>
                                        {ticket.closedAt && (
                                            <span className="flex items-center gap-1">
                                                <HiOutlineCheckCircle className="text-sm text-emerald-500" />
                                                {t(
                                                    'userTickets.closedAt',
                                                    'تاريخ الإغلاق',
                                                )}
                                                :{' '}
                                                <span className="dir-ltr font-medium text-gray-600 dark:text-gray-400">
                                                    {dayjs(
                                                        ticket.closedAt,
                                                    ).format(
                                                        'YYYY/MM/DD hh:mm A',
                                                    )}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Right / Action button */}
                                <div className="flex items-center justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-800">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        icon={<HiOutlineEye />}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            navigate(
                                                `/user/tickets/${ticket.id}`,
                                            )
                                        }}
                                    >
                                        {t(
                                            'userTickets.viewDetails',
                                            'عرض التفاصيل',
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {/* Pagination */}
                    {totalCount > pageSize && (
                        <div className="flex justify-center items-center pt-4">
                            <Pagination
                                total={totalCount}
                                currentPage={pageNumber}
                                pageSize={pageSize}
                                onChange={(page) => setPageNumber(page)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UserTicketsList
