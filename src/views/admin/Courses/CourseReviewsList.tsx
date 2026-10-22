import { useEffect, useState, useCallback, useMemo } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Avatar from '@/components/ui/Avatar'
import Tooltip from '@/components/ui/Tooltip'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineMagnifyingGlass,
    HiOutlineTrash,
    HiOutlineUser,
    HiOutlineStar,
} from 'react-icons/hi2'
import {
    apiGetCourseReviews,
    apiDeleteCourseReview,
} from '@/services/CourseReviewAdminService'
import type {
    CourseReviewResponse,
    GetCourseReviewsQueryParams,
} from '@/@types/adminManagement'

type SortByType = 'date' | 'createdat' | 'rating'

interface SortOption {
    value: SortByType
    label: string
}

interface OrderOption {
    value: 'asc' | 'desc'
    label: string
}

interface CourseReviewsListProps {
    courseId: number
}

const CourseReviewsList = ({ courseId }: CourseReviewsListProps) => {
    const { t } = useTranslation()

    // Data state
    const [reviews, setReviews] = useState<CourseReviewResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Pagination & Filters
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [sortBy, setSortBy] = useState<SortByType>('date')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deletingReview, setDeletingReview] = useState<CourseReviewResponse | null>(null)
    const [deleting, setDeleting] = useState<boolean>(false)

    // Filter Options
    const sortByOptions: SortOption[] = useMemo(
        () => [
            { value: 'date', label: t('courseReviewManagement.sortByDate', 'التاريخ') },
            { value: 'rating', label: t('courseReviewManagement.sortByRating', 'التقييم') },
        ],
        [t],
    )

    const sortOrderOptions: OrderOption[] = useMemo(
        () => [
            { value: 'desc', label: t('courseReviewManagement.desc', 'تنازلي') },
            { value: 'asc', label: t('courseReviewManagement.asc', 'تصاعدي') },
        ],
        [t],
    )

    // Fetch Reviews
    const fetchReviews = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetCourseReviewsQueryParams = {
                pageNumber,
                pageSize,
                sortBy,
                sortOrder,
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }

            const res = await apiGetCourseReviews(courseId, params)
            if (res?.status && res.data) {
                setReviews(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setReviews([])
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
                    t('common.operationFailed', 'فشل جلب التقييمات.'),
            )
            setReviews([])
        } finally {
            setLoading(false)
        }
    }, [courseId, pageNumber, pageSize, searchTerm, sortBy, sortOrder, t])

    useEffect(() => {
        fetchReviews()
    }, [fetchReviews])

    // Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setPageNumber(1)
    }

    // Delete Review
    const openDeleteDialog = (review: CourseReviewResponse) => {
        setDeletingReview(review)
        setDeleteDialogOpen(true)
    }

    const closeDeleteDialog = () => {
        setDeletingReview(null)
        setDeleteDialogOpen(false)
    }

    const handleDeleteReview = async () => {
        if (!deletingReview) return
        setDeleting(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const res = await apiDeleteCourseReview(deletingReview.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message || t('courseReviewManagement.deleteSuccess', 'تم حذف التقييم بنجاح.'),
                )
                closeDeleteDialog()
                fetchReviews()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل حذف التقييم.'))
                closeDeleteDialog()
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'فشل حذف التقييم.'),
            )
            closeDeleteDialog()
        } finally {
            setDeleting(false)
        }
    }

    // Stars rating renderer
    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <HiOutlineStar
                        key={star}
                        className={`text-sm ${
                            star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                    />
                ))}
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1.5 dir-ltr">
                    ({rating})
                </span>
            </div>
        )
    }

    // Table Columns
    const columns: ColumnDef<CourseReviewResponse>[] = useMemo(
        () => [
            {
                header: () => t('courseReviewManagement.user', 'المستخدم'),
                accessorKey: 'userName',
                enableSorting: false,
                size: 200,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-3 w-full">
                            <Avatar
                                shape="circle"
                                src={row.userImage || undefined}
                                icon={<HiOutlineUser />}
                                size={36}
                                className="border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                            <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                                {row.userName}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: () => t('courseReviewManagement.rating', 'التقييم'),
                accessorKey: 'rating',
                enableSorting: false,
                size: 140,
                cell: (props) => (
                    <div className="flex justify-center w-full">
                        {renderStars(props.row.original.rating)}
                    </div>
                ),
            },
            {
                header: () => t('courseReviewManagement.comment', 'التعليق'),
                accessorKey: 'comment',
                enableSorting: false,
                size: 300,
                cell: (props) => (
                    <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {props.row.original.comment || '-'}
                    </p>
                ),
            },
            {
                header: () => t('courseReviewManagement.date', 'التاريخ'),
                accessorKey: 'createdAt',
                enableSorting: false,
                size: 140,
                cell: (props) => {
                    const date = props.row.original.createdAt
                    if (!date) return <div className="text-center text-gray-400 text-xs">-</div>
                    return (
                        <div className="flex flex-col items-center justify-center w-full">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 dir-ltr">
                                {dayjs(date).format('YYYY/MM/DD')}
                            </span>
                            <span className="text-[11px] text-gray-400 dir-ltr">
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
                size: 100,
                cell: (props) => (
                    <div className="flex justify-center w-full">
                        <Tooltip title={t('courseReviewManagement.deleteReview', 'حذف التقييم')}>
                            <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all focus:outline-none"
                                onClick={() => openDeleteDialog(props.row.original)}
                            >
                                <HiOutlineTrash className="text-lg" />
                            </button>
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [t],
    )

    return (
        <div className="flex flex-col gap-4 w-full">
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
                    <div>
                        <Input
                            placeholder={t('common.search', 'البحث باسم المستخدم أو التعليق...')}
                            value={searchTerm}
                            prefix={<HiOutlineMagnifyingGlass className="text-lg text-gray-400" />}
                            onChange={handleSearch}
                        />
                    </div>
                    <div>
                        <Select<SortOption>
                            placeholder={t('courseReviewManagement.sortBy', 'ترتيب حسب')}
                            options={sortByOptions}
                            value={sortByOptions.find((o) => o.value === sortBy) || sortByOptions[0]}
                            onChange={(opt) => {
                                setSortBy(opt ? opt.value : 'date')
                                setPageNumber(1)
                            }}
                        />
                    </div>
                    <div>
                        <Select<OrderOption>
                            placeholder={t('courseReviewManagement.sortOrder', 'اتجاه الترتيب')}
                            options={sortOrderOptions}
                            value={sortOrderOptions.find((o) => o.value === sortOrder) || sortOrderOptions[0]}
                            onChange={(opt) => {
                                setSortOrder(opt ? opt.value : 'desc')
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
                    data={reviews}
                    loading={loading}
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
                ) : reviews.length === 0 ? (
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                        <p className="text-center text-gray-400 text-sm py-10">
                            {t('common.noDataFound', 'لا توجد بيانات للعرض')}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {reviews.map((rev) => (
                            <Card key={rev.id} className="shadow-xs border border-gray-100 dark:border-gray-800">
                                <div className="flex items-start gap-3">
                                    <Avatar
                                        shape="circle"
                                        src={rev.userImage || undefined}
                                        icon={<HiOutlineUser />}
                                        size={40}
                                        className="border border-gray-200 dark:border-gray-700 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                                {rev.userName}
                                            </p>
                                            <div className="shrink-0">{renderStars(rev.rating)}</div>
                                        </div>

                                        {rev.comment && (
                                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                                                {rev.comment}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-400">
                                            <span>
                                                {rev.createdAt ? dayjs(rev.createdAt).format('YYYY/MM/DD hh:mm A') : '-'}
                                            </span>
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all"
                                                onClick={() => openDeleteDialog(rev)}
                                            >
                                                <HiOutlineTrash className="text-base" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                        {/* Mobile Pagination */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t('common.total', 'المجموع')}: {totalCount}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pageNumber <= 1}
                                    onClick={() => setPageNumber(pageNumber - 1)}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {t('common.prev', 'السابق')}
                                </button>
                                <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                    {pageNumber} / {Math.ceil(totalCount / pageSize) || 1}
                                </span>
                                <button
                                    type="button"
                                    disabled={pageNumber >= Math.ceil(totalCount / pageSize)}
                                    onClick={() => setPageNumber(pageNumber + 1)}
                                    className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {t('common.next', 'التالي')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Review Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={closeDeleteDialog}
                onRequestClose={closeDeleteDialog}
                onCancel={closeDeleteDialog}
                onConfirm={handleDeleteReview}
                type="danger"
                title={t('courseReviewManagement.confirmDeleteTitle', 'تأكيد حذف التقييم')}
                confirmButtonProps={{ loading: deleting }}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('courseReviewManagement.confirmDeleteMsg', 'هل أنت متأكد من رغبتك في حذف هذا التقييم؟')}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default CourseReviewsList
