import { useEffect, useState, useCallback, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Avatar from '@/components/ui/Avatar'
import Alert from '@/components/ui/Alert'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { Link, useNavigate } from 'react-router-dom'
import { apiGetUsers, apiDeleteUser } from '@/services/UserService'
import useTranslation from '@/utils/hooks/useTranslation'
import Tooltip from '@/components/ui/Tooltip'
import {
    HiOutlineMagnifyingGlass,
    HiOutlineUserPlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineUser,
} from 'react-icons/hi2'
import type { UserInfoResponse, PaginatedResult, UserQueryFilter } from '@/@types/user'

const UsersList = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const statusOptions = [
        { value: 0, label: t('userManagement.allStatuses', 'كل الحالات') },
        { value: 1, label: t('userManagement.pendingEmailVerification', 'في انتظار تأكيد البريد الإلكتروني') },
        { value: 2, label: t('userManagement.pendingIdentityVerification', 'في انتظار التحقق من الهوية') },
        { value: 3, label: t('userManagement.pendingApproval', 'في انتظار الموافقة') },
        { value: 4, label: t('userManagement.active', 'نشط') },
        { value: 5, label: t('userManagement.rejected', 'مرفوض') },
        { value: 6, label: t('userManagement.suspended', 'معلق') },
        { value: 7, label: t('userManagement.locked', 'مقفل') },
    ]

    const renderStatusBadge = useCallback(
        (status: number) => {
            const config = (() => {
                switch (status) {
                    case 1:
                        return {
                            dotClass: 'bg-amber-500',
                            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
                            label: t('userManagement.pendingEmail', 'في انتظار تأكيد البريد'),
                        }
                    case 2:
                        return {
                            dotClass: 'bg-blue-500',
                            badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
                            label: t('userManagement.pendingID', 'في انتظار التحقق من الهوية'),
                        }
                    case 3:
                        return {
                            dotClass: 'bg-purple-500',
                            badgeClass: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
                            label: t('userManagement.pendingReview', 'في انتظار المراجعة'),
                        }
                    case 4:
                        return {
                            dotClass: 'bg-emerald-500',
                            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
                            label: t('userManagement.active', 'نشط'),
                        }
                    case 5:
                        return {
                            dotClass: 'bg-rose-500',
                            badgeClass: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
                            label: t('userManagement.rejected', 'مرفوض'),
                        }
                    case 6:
                        return {
                            dotClass: 'bg-red-600',
                            badgeClass: 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50',
                            label: t('userManagement.suspended', 'معلق'),
                        }
                    case 7:
                        return {
                            dotClass: 'bg-gray-500',
                            badgeClass: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
                            label: t('userManagement.locked', 'مقفل'),
                        }
                    default:
                        return {
                            dotClass: 'bg-gray-400',
                            badgeClass: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800',
                            label: t('userManagement.unknown', 'غير معروف'),
                        }
                }
            })()

            return (
                <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badgeClass} transition-colors shadow-2xs`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`} />
                        {config.label}
                    </span>
                </div>
            )
        },
        [t]
    )

    const [users, setUsers] = useState<UserInfoResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Query params
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<number>(0)

    // Delete/Toggle Dialog
    const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
    const [selectedUser, setSelectedUser] = useState<UserInfoResponse | null>(null)
    const [deleting, setDeleting] = useState<boolean>(false)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: UserQueryFilter = {
                pageNumber,
                pageSize,
            }
            if (searchTerm.trim()) {
                params.fullName = searchTerm.trim()
            }
            if (statusFilter > 0) {
                params.status = statusFilter
            }

            const res = await apiGetUsers(params)
            if (res?.data) {
                const paginated: PaginatedResult<UserInfoResponse> = res.data
                setUsers(paginated.items || [])
                setTotalCount(paginated.totalCount || 0)
            } else {
                setUsers([])
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('userManagement.failedFetchUsers', 'فشل جلب المستخدمين.'))
            setUsers([])
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, searchTerm, statusFilter, t])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setPageNumber(1)
    }

    const handleStatusChange = (option: { value: number; label: string } | null) => {
        setStatusFilter(option ? option.value : 0)
        setPageNumber(1)
    }

    const openDeleteDialog = (user: UserInfoResponse) => {
        setSelectedUser(user)
        setDeleteModalOpen(true)
    }

    const confirmDeleteToggle = async () => {
        if (!selectedUser) return
        setDeleting(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiDeleteUser(selectedUser.id)
            if (res?.status) {
                setSuccessMsg(res.message || t('userManagement.statusUpdated', 'تم تحديث حالة المستخدم بنجاح.'))
                setDeleteModalOpen(false)
                setSelectedUser(null)
                fetchUsers()
            } else {
                setErrorMsg(res?.message || t('userManagement.failedToggleStatus', 'فشل تبديل حالة المستخدم.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('userManagement.operationFailed', 'فشلت العملية.'))
        } finally {
            setDeleting(false)
        }
    }

    const columns: ColumnDef<UserInfoResponse>[] = useMemo(
        () => [
            {
                header: () => t('userManagement.user', 'المستخدم'),
                accessorKey: 'firstName',
                enableSorting: false,
                size: 220,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar
                                shape="circle"
                                src={row.imageUrl || undefined}
                                icon={<HiOutlineUser />}
                            />
                            <div>
                                <span className="font-semibold text-gray-800 text-sm block">
                                    {row.firstName} {row.lastName}
                                </span>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: () => t('userManagement.email', 'البريد الإلكتروني'),
                accessorKey: 'email',
                enableSorting: false,
                size: 260,
                cell: (props) => props.row.original.email || '-',
            },
            {
                header: () => t('userManagement.phone', 'الهاتف'),
                accessorKey: 'phoneNumber',
                enableSorting: false,
                size: 150,
                cell: (props) => props.row.original.phoneNumber || '-',
            },
            {
                header: () => t('userManagement.roles', 'الأدوار'),
                accessorKey: 'roles',
                enableSorting: false,
                size: 140,
                cell: (props) => (props.row.original.roles || []).join(', ') || t('userManagement.user', 'المستخدم'),
            },
            {
                header: () => t('userManagement.status', 'الحالة'),
                accessorKey: 'status',
                enableSorting: false,
                size: 150,
                cell: (props) => renderStatusBadge(props.row.original.status),
            },
            {
                header: () => t('userManagement.actions', 'إجراءات'),
                id: 'action',
                enableSorting: false,
                size: 120,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                            <Tooltip title={t('userManagement.editUser', 'تعديل البيانات')}>
                                <Link
                                    to={`/admin/users/${row.id}/edit`}
                                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all duration-200 hover:scale-110 focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <HiOutlinePencil className="text-xl" />
                                </Link>
                            </Tooltip>
                            <Tooltip title={t('userManagement.deleteUser', 'حذف المستخدم')}>
                                <button
                                    type="button"
                                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 dark:text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-all duration-200 hover:scale-110 focus:outline-none"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openDeleteDialog(row)
                                    }}
                                >
                                    <HiOutlineTrash className="text-xl" />
                                </button>
                            </Tooltip>
                        </div>
                    )
                },
            },
        ],
        [t, renderStatusBadge]
    )

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{t('userManagement.title', 'إدارة المستخدمين')}</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {t('userManagement.description', 'عرض المستخدمين والبحث والتصفية والتعديل وتبديل الحالة النشطة لحسابات المستخدمين.')}
                    </p>
                </div>
                <Link to="/admin/users/create">
                    <Button variant="solid" icon={<HiOutlineUserPlus />}>
                        {t('userManagement.createUser', 'إنشاء مستخدم')}
                    </Button>
                </Link>
            </div>

            {/* Notifications */}
            {successMsg && <Alert type="success" onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}
            {errorMsg && <Alert type="danger" onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

            {/* Filters Bar */}
            <Card className="shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:w-80">
                        <Input
                            placeholder={t('userManagement.searchPlaceholder', 'البحث بالاسم الكامل أو البريد الإلكتروني...')}
                            value={searchTerm}
                            prefix={<HiOutlineMagnifyingGlass className="text-lg text-gray-400" />}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select
                            placeholder={t('userManagement.filterByStatus', 'تصفية حسب الحالة')}
                            options={statusOptions}
                            value={statusOptions.find((o) => o.value === statusFilter)}
                            onChange={handleStatusChange}
                        />
                    </div>
                </div>
            </Card>

            {/* Desktop: Data Table */}
            <Card className="shadow-sm border border-gray-100 overflow-hidden hidden md:block">
                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
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
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <Card className="shadow-sm border border-gray-100">
                        <p className="text-center text-gray-400 text-sm py-10">
                            {t('common.noDataFound', 'لا توجد بيانات للعرض')}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {users.map((user) => (
                            <Card
                                key={user.id}
                                className="shadow-sm border border-gray-100 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar
                                        shape="circle"
                                        src={user.imageUrl || undefined}
                                        icon={<HiOutlineUser />}
                                        size={48}
                                        className="shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                                    {user.firstName} {user.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                                {user.phoneNumber && (
                                                    <p className="text-xs text-gray-400 mt-0.5 dir-ltr">{user.phoneNumber}</p>
                                                )}
                                            </div>
                                            <div className="shrink-0">{renderStatusBadge(user.status)}</div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <span className="text-xs text-gray-400">
                                                {(user.roles || []).join(', ') || t('userManagement.user', 'مستخدم')}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <Link
                                                    to={`/admin/users/${user.id}/edit`}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <HiOutlinePencil className="text-lg" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        openDeleteDialog(user)
                                                    }}
                                                >
                                                    <HiOutlineTrash className="text-lg" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
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
                                    onClick={() => setPageNumber(pageNumber - 1)}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    {t('common.prev', 'السابق')}
                                </button>
                                <span className="text-xs text-gray-600 font-medium">
                                    {pageNumber} / {Math.ceil(totalCount / pageSize) || 1}
                                </span>
                                <button
                                    type="button"
                                    disabled={pageNumber >= Math.ceil(totalCount / pageSize)}
                                    onClick={() => setPageNumber(pageNumber + 1)}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                                >
                                    {t('common.next', 'التالي')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Status Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteModalOpen}
                type="danger"
                title={t('userManagement.toggleUserStatus', 'تبديل حالة المستخدم')}
                confirmText={t('userManagement.confirmToggle', 'تأكيد التبديل')}
                confirmButtonProps={{ loading: deleting, color: 'red-600' }}
                onClose={() => setDeleteModalOpen(false)}
                onCancel={() => setDeleteModalOpen(false)}
                onConfirm={confirmDeleteToggle}
            >
                <p className="text-sm text-gray-600">
                    {t('userManagement.toggleConfirmation', 'هل أنت متأكد من رغبتك في تبديل الحالة النشطة لحساب {name} ({email})؟', {
                        name: `${selectedUser?.firstName} ${selectedUser?.lastName}`,
                        email: selectedUser?.email,
                    })}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default UsersList
