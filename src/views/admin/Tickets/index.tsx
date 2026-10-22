import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Tooltip from '@/components/ui/Tooltip'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineMagnifyingGlass,
    HiOutlineEye,
    HiOutlinePaperClip,
    HiOutlineTicket,
    HiOutlineArrowPath,
    HiOutlineCheckCircle,
} from 'react-icons/hi2'
import {
    apiGetAdminTickets,
    apiGetAdminTicketTypes,
} from '@/services/TicketService'
import {
    TicketStatus,
    TicketPriority,
    type AdminTicketListItemResponse,
    type GetAdminTicketsParams,
    type TicketTypeResponse,
} from '@/@types/ticket'
import { useLocaleStore } from '@/store/localeStore'

interface StatusOption {
    value: TicketStatus | null
    label: string
}

interface PriorityOption {
    value: TicketPriority | null
    label: string
}

interface TypeOption {
    value: number | null
    label: string
}

const TicketsManagement = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'

    // Query param preset
    const initialTypeId = searchParams.get('ticketTypeId')
        ? Number(searchParams.get('ticketTypeId'))
        : null

    // Filter states
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<TicketStatus | null>(null)
    const [priorityFilter, setPriorityFilter] = useState<TicketPriority | null>(
        null,
    )
    const [typeFilter, setTypeFilter] = useState<number | null>(initialTypeId)
    const [sortBy, setSortBy] = useState<string>('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Data states
    const [tickets, setTickets] = useState<AdminTicketListItemResponse[]>([])
    const [ticketTypes, setTicketTypes] = useState<TicketTypeResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')

    // Pagination
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)

    // Options
    const statusOptions: StatusOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('adminTickets.allStatuses', 'جميع الحالات'),
            },
            {
                value: TicketStatus.New,
                label: t('ticket.status.new', 'جديدة (New)'),
            },
            {
                value: TicketStatus.InProgress,
                label: t(
                    'ticket.status.inProgress',
                    'قيد المعالجة (In Progress)',
                ),
            },
            {
                value: TicketStatus.Closed,
                label: t('ticket.status.closed', 'مغلقة (Closed)'),
            },
        ],
        [t],
    )

    const priorityOptions: PriorityOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('adminTickets.allPriorities', 'جميع الأولويات'),
            },
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

    const typeOptions: TypeOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('adminTickets.allTypes', 'جميع الأنواع'),
            },
            ...ticketTypes.map((typeItem) => ({
                value: typeItem.id,
                label: isRtl
                    ? typeItem.nameAr
                    : typeItem.nameEn || typeItem.nameAr,
            })),
        ],
        [ticketTypes, isRtl, t],
    )

    // Fetch Ticket Types for filter dropdown
    useEffect(() => {
        apiGetAdminTicketTypes()
            .then((res) => {
                if (res?.status && res.data) {
                    setTicketTypes(Array.isArray(res.data) ? res.data : [])
                }
            })
            .catch(() => setTicketTypes([]))
    }, [])

    // Fetch Admin Tickets
    const fetchTickets = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetAdminTicketsParams = {
                pageNumber,
                pageSize,
                sortBy,
                sortOrder,
            }
            if (searchTerm.trim()) params.searchTerm = searchTerm.trim()
            if (statusFilter !== null) params.status = statusFilter
            if (priorityFilter !== null) params.priority = priorityFilter
            if (typeFilter !== null) params.ticketTypeId = typeFilter

            const res = await apiGetAdminTickets(params)
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
                    t('adminTickets.fetchFailed', 'فشل جلب بيانات التذاكر.'),
            )
            setTickets([])
        } finally {
            setLoading(false)
        }
    }, [
        pageNumber,
        pageSize,
        searchTerm,
        statusFilter,
        priorityFilter,
        typeFilter,
        sortBy,
        sortOrder,
        t,
    ])

    useEffect(() => {
        fetchTickets()
    }, [fetchTickets])

    // Priority Badge
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

    // Status Badge
    const renderStatusBadge = useCallback(
        (status: TicketStatus) => {
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
        },
        [t],
    )

    // Columns Configuration
    const columns: ColumnDef<AdminTicketListItemResponse>[] = useMemo(
        () => [
            {
                header: () => t('adminTickets.ticketNumber', 'رقم التذكرة'),
                accessorKey: 'ticketNumber',
                size: 190,
                cell: (props) => (
                    <div className="flex items-center gap-2">
                        <HiOutlineTicket className="text-gray-400 text-base shrink-0" />
                        <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 dir-ltr">
                            {props.row.original.ticketNumber}
                        </span>
                        {props.row.original.hasAttachment && (
                            <Tooltip
                                title={t(
                                    'userTickets.hasAttachment',
                                    'يوجد مرفق',
                                )}
                            >
                                <span className="text-gray-400 hover:text-primary">
                                    <HiOutlinePaperClip className="text-sm" />
                                </span>
                            </Tooltip>
                        )}
                    </div>
                ),
            },
            {
                header: () => t('adminTickets.user', 'العميل'),
                accessorKey: 'userName',
                size: 200,
                cell: (props) => (
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                            {props.row.original.userName}
                        </span>
                        {props.row.original.userEmail && (
                            <span className="text-xs text-gray-400 dir-ltr text-start">
                                {props.row.original.userEmail}
                            </span>
                        )}
                    </div>
                ),
            },
            {
                header: () => t('adminTickets.type', 'نوع التذكرة'),
                accessorKey: 'ticketTypeNameAr',
                size: 180,
                cell: (props) => (
                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                        {isRtl
                            ? props.row.original.ticketTypeNameAr
                            : props.row.original.ticketTypeNameEn ||
                              props.row.original.ticketTypeNameAr}
                    </span>
                ),
            },
            {
                header: () => t('adminTickets.priority', 'الأولوية'),
                accessorKey: 'priority',
                size: 120,
                cell: (props) =>
                    renderPriorityBadge(props.row.original.priority),
            },
            {
                header: () => t('adminTickets.status', 'الحالة'),
                accessorKey: 'status',
                size: 140,
                cell: (props) => renderStatusBadge(props.row.original.status),
            },
            {
                header: () => t('adminTickets.date', 'تاريخ الإنشاء'),
                accessorKey: 'createdAt',
                size: 150,
                cell: (props) => (
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 dir-ltr">
                            {dayjs(props.row.original.createdAt).format(
                                'YYYY/MM/DD',
                            )}
                        </span>
                        <span className="text-[11px] text-gray-400 dir-ltr">
                            {dayjs(props.row.original.createdAt).format(
                                'hh:mm A',
                            )}
                        </span>
                    </div>
                ),
            },
        ],
        [t, isRtl, renderPriorityBadge, renderStatusBadge],
    )

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {t('adminTickets.title', 'إدارة تذاكر الدعم الفني')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                    {t(
                        'adminTickets.description',
                        'استعراض، بحث، تصفية، تحديث حالات التذاكر، وإغلاقها بالردود الرسمية.',
                    )}
                </p>
            </div>

            {/* Error Notification */}
            {errorMsg && (
                <Alert type="danger" onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {/* Filters Bar */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div>
                        <Input
                            placeholder={t(
                                'adminTickets.searchPlaceholder',
                                'بحث برقم التذكرة، العميل، البريد...',
                            )}
                            value={searchTerm}
                            prefix={
                                <HiOutlineMagnifyingGlass className="text-lg text-gray-400" />
                            }
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setPageNumber(1)
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
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
                            onChange={(opt) => {
                                setStatusFilter(opt ? opt.value : null)
                                setPageNumber(1)
                            }}
                        />
                    </div>

                    {/* Priority Filter */}
                    <div>
                        <Select<PriorityOption>
                            placeholder={t(
                                'adminTickets.filterPriority',
                                'تصفية حسب الأولوية',
                            )}
                            options={priorityOptions}
                            value={
                                priorityOptions.find(
                                    (o) => o.value === priorityFilter,
                                ) || priorityOptions[0]
                            }
                            onChange={(opt) => {
                                setPriorityFilter(opt ? opt.value : null)
                                setPageNumber(1)
                            }}
                        />
                    </div>

                    {/* Ticket Type Filter */}
                    <div>
                        <Select<TypeOption>
                            placeholder={t(
                                'adminTickets.filterType',
                                'تصفية حسب نوع التذكرة',
                            )}
                            options={typeOptions}
                            value={
                                typeOptions.find(
                                    (o) => o.value === typeFilter,
                                ) || typeOptions[0]
                            }
                            onChange={(opt) => {
                                setTypeFilter(opt ? opt.value : null)
                                setPageNumber(1)
                            }}
                        />
                    </div>
                </div>
            </Card>

            {/* Desktop: Data Table */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden hidden md:block">
                <DataTable
                    columns={columns}
                    data={tickets}
                    loading={loading}
                    onRowClick={(row) => navigate(`/admin/tickets/${row.id}`)}
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

            {/* Mobile: Card List */}
            <div className="md:hidden">
                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tickets.length === 0 ? (
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800 text-center py-10">
                        <p className="text-gray-400 text-sm">
                            {t('common.noDataFound', 'لا توجد بيانات')}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {tickets.map((ticket) => (
                            <Card
                                key={ticket.id}
                                className="shadow-xs border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-primary/40 transition-all"
                                onClick={() =>
                                    navigate(`/admin/tickets/${ticket.id}`)
                                }
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100 dir-ltr">
                                            {ticket.ticketNumber}
                                        </span>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                                            {ticket.userName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {isRtl
                                                ? ticket.ticketTypeNameAr
                                                : ticket.ticketTypeNameEn}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        {renderStatusBadge(ticket.status)}
                                        {renderPriorityBadge(ticket.priority)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                                    <span className="dir-ltr">
                                        {dayjs(ticket.createdAt).format(
                                            'YYYY/MM/DD hh:mm A',
                                        )}
                                    </span>
                                    <Button
                                        size="xs"
                                        variant="default"
                                        icon={<HiOutlineEye />}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            navigate(
                                                `/admin/tickets/${ticket.id}`,
                                            )
                                        }}
                                    >
                                        {t('adminTickets.actions', 'عرض')}
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {/* Mobile Pagination */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-gray-500">
                                {t('common.total', 'المجموع')}: {totalCount}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pageNumber <= 1}
                                    onClick={() =>
                                        setPageNumber(pageNumber - 1)
                                    }
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                                >
                                    {t('common.prev', 'السابق')}
                                </button>
                                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                    {pageNumber} /{' '}
                                    {Math.ceil(totalCount / pageSize) || 1}
                                </span>
                                <button
                                    type="button"
                                    disabled={
                                        pageNumber >=
                                        Math.ceil(totalCount / pageSize)
                                    }
                                    onClick={() =>
                                        setPageNumber(pageNumber + 1)
                                    }
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                                >
                                    {t('common.next', 'التالي')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default TicketsManagement
