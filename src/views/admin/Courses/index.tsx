import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Tooltip from '@/components/ui/Tooltip'
import Avatar from '@/components/ui/Avatar'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineBookOpen,
    HiOutlineStar,
} from 'react-icons/hi2'
import {
    apiGetPaginatedCourses,
    apiDeleteCourse,
    apiUpdateCourseStatus,
} from '@/services/CourseAdminService'
import { apiGetAdminCourseCategories } from '@/services/CourseCategoryService'
import { apiGetPaginatedInstructors } from '@/services/InstructorAdminService'
import {
    CourseStatus,
    AdminCourseSummaryResponse,
    GetPaginatedCoursesQueryParams,
} from '@/@types/adminManagement'
import type { CourseCategoryResponse } from '@/@types/courseCategory'
import type { InstructorResponse } from '@/@types/adminManagement'
import { isLiveCourse } from '@/@types/courseContent'

interface StatusOption {
    value: CourseStatus | null
    label: string
}

interface OptionType {
    value: number | null
    label: string
}

const CoursesList = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Status filter options
    const statusOptions: StatusOption[] = useMemo(
        () => [
            { value: null, label: t('courseManagement.filterByStatus', 'كل الحالات') },
            { value: CourseStatus.Draft, label: t('courseManagement.draft', 'مسودة') },
            { value: CourseStatus.Published, label: t('courseManagement.published', 'منشور') },
            { value: CourseStatus.Archived, label: t('courseManagement.archived', 'مؤرشف') },
        ],
        [t],
    )

    // Data state
    const [courses, setCourses] = useState<AdminCourseSummaryResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Categories & Instructors for filters
    const [categoryOptions, setCategoryOptions] = useState<OptionType[]>([])
    const [instructorOptions, setInstructorOptions] = useState<OptionType[]>([])

    // Pagination & Filters
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [statusFilter, setStatusFilter] = useState<CourseStatus | null>(null)
    const [categoryFilter, setCategoryFilter] = useState<number | null>(null)
    const [instructorFilter, setInstructorFilter] = useState<number | null>(null)
    const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'Recorded' | 'Live' | null>(null)

    // Status Change Modal State
    const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false)
    const [targetCourseForStatus, setTargetCourseForStatus] = useState<AdminCourseSummaryResponse | null>(null)
    const [selectedNewStatus, setSelectedNewStatus] = useState<CourseStatus>(CourseStatus.Draft)
    const [statusUpdating, setStatusUpdating] = useState<boolean>(false)

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deletingCourse, setDeletingCourse] = useState<AdminCourseSummaryResponse | null>(null)
    const [deleting, setDeleting] = useState<boolean>(false)

    // Fetch Filter Options (Categories & Instructors)
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const catRes = await apiGetAdminCourseCategories({ pageNumber: 1, pageSize: 50 })
                if (catRes?.status && catRes.data) {
                    const catItems: CourseCategoryResponse[] = Array.isArray(catRes.data)
                        ? catRes.data
                        : (catRes.data.items || [])
                    const options: OptionType[] = [
                        { value: null, label: t('courseManagement.filterByCategory', 'كل التصنيفات') },
                        ...catItems.map((cat: CourseCategoryResponse) => ({
                            value: cat.id,
                            label: cat.nameAr || cat.nameEn,
                        })),
                    ]
                    setCategoryOptions(options)
                }

                const instRes = await apiGetPaginatedInstructors({ pageNumber: 1, pageSize: 50 })
                if (instRes?.status && instRes.data) {
                    const instItems: InstructorResponse[] = Array.isArray(instRes.data)
                        ? instRes.data
                        : (instRes.data.items || [])
                    const options: OptionType[] = [
                        { value: null, label: t('courseManagement.filterByInstructor', 'كل المحاضرين') },
                        ...instItems.map((inst: InstructorResponse) => ({
                            value: inst.id,
                            label: inst.name,
                        })),
                    ]
                    setInstructorOptions(options)
                }
            } catch (e) {
                // Ignore silent filter load errors
            }
        }
        loadFilterOptions()
    }, [t])

    // Fetch Courses
    const fetchCourses = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetPaginatedCoursesQueryParams = {
                pageNumber,
                pageSize,
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }
            if (statusFilter !== null) {
                params.status = statusFilter
            }
            if (categoryFilter !== null) {
                params.categoryId = categoryFilter
            }
            if (instructorFilter !== null) {
                params.instructorId = instructorFilter
            }
            if (deliveryTypeFilter !== null) {
                params.deliveryType = deliveryTypeFilter
            }

            const res = await apiGetPaginatedCourses(params)
            if (res?.status && res.data) {
                setCourses(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setCourses([])
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
                    t('courseManagement.failedFetch', 'فشل جلب قائمة الدورات.'),
            )
            setCourses([])
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, searchTerm, statusFilter, categoryFilter, instructorFilter, deliveryTypeFilter, t])

    useEffect(() => {
        fetchCourses()
    }, [fetchCourses])

    // Handlers for Filters
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setPageNumber(1)
    }

    const handleStatusFilterChange = (option: StatusOption | null) => {
        setStatusFilter(option ? option.value : null)
        setPageNumber(1)
    }

    const handleCategoryFilterChange = (option: OptionType | null) => {
        setCategoryFilter(option ? option.value : null)
        setPageNumber(1)
    }

    const handleInstructorFilterChange = (option: OptionType | null) => {
        setInstructorFilter(option ? option.value : null)
        setPageNumber(1)
    }

    const handleDeliveryTypeFilterChange = (
        option: { value: 'Recorded' | 'Live' | null; label: string } | null,
    ) => {
        setDeliveryTypeFilter(option ? option.value : null)
        setPageNumber(1)
    }

    // Status Modal Controls
    const openStatusModal = (course: AdminCourseSummaryResponse) => {
        setTargetCourseForStatus(course)
        setSelectedNewStatus(course.status)
        setStatusModalOpen(true)
    }

    const closeStatusModal = () => {
        setTargetCourseForStatus(null)
        setStatusModalOpen(false)
    }

    const handleUpdateStatus = async () => {
        if (!targetCourseForStatus) return
        setStatusUpdating(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const res = await apiUpdateCourseStatus(targetCourseForStatus.id, { status: selectedNewStatus })
            if (res?.status) {
                setSuccessMsg(
                    res.message || t('courseManagement.statusUpdateSuccess', 'تم تغيير حالة النشر بنجاح.'),
                )
                closeStatusModal()
                fetchCourses()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشلت العملية.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'فشلت العملية.'),
            )
        } finally {
            setStatusUpdating(false)
        }
    }

    // Delete Course
    const openDeleteDialog = (course: AdminCourseSummaryResponse) => {
        setDeletingCourse(course)
        setDeleteDialogOpen(true)
    }

    const closeDeleteDialog = () => {
        setDeletingCourse(null)
        setDeleteDialogOpen(false)
    }

    const handleDeleteCourse = async () => {
        if (!deletingCourse) return
        setDeleting(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const res = await apiDeleteCourse(deletingCourse.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message || t('courseManagement.deleteSuccess', 'تم حذف الدورة بنجاح.'),
                )
                closeDeleteDialog()
                fetchCourses()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل حذف الدورة.'))
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
                    t('common.operationFailed', 'فشل حذف الدورة.'),
            )
            closeDeleteDialog()
        } finally {
            setDeleting(false)
        }
    }

    // Render Course Status Badge
    const renderStatusBadge = useCallback(
        (status: CourseStatus) => {
            switch (status) {
                case CourseStatus.Published:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {t('courseManagement.published', 'منشور')}
                        </span>
                    )
                case CourseStatus.Archived:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            {t('courseManagement.archived', 'مؤرشف')}
                        </span>
                    )
                case CourseStatus.Draft:
                default:
                    return (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            {t('courseManagement.draft', 'مسودة')}
                        </span>
                    )
            }
        },
        [t],
    )

    // Columns Configuration
    const columns: ColumnDef<AdminCourseSummaryResponse>[] = useMemo(
        () => [
            {
                header: () => t('courseManagement.name', 'اسم الدورة'),
                accessorKey: 'name',
                enableSorting: false,
                size: 260,
                cell: (props) => {
                    const row = props.row.original
                    const isLive = isLiveCourse(row.deliveryType)
                    return (
                        <div className="flex items-center gap-3 w-full">
                            <Avatar
                                shape="round"
                                src={row.thumbnailUrl || undefined}
                                icon={<HiOutlineBookOpen />}
                                size={44}
                                className="border border-gray-200 dark:border-gray-700 shrink-0"
                            />
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                        {row.name}
                                    </span>
                                    {isLive && (
                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                            {t('courseManagement.liveCourseBadge', 'مباشر')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 truncate max-w-xs">
                                    <span>
                                        {row.category ? (row.category.nameAr || row.category.nameEn) : '-'}
                                    </span>
                                    {isLive && row.startDate && (
                                        <span className="text-[11px] text-red-600 dark:text-red-400 font-medium">
                                            • {new Date(row.startDate).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: () => t('courseManagement.instructor', 'المحاضر'),
                accessorKey: 'instructor',
                enableSorting: false,
                size: 160,
                cell: (props) => (
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {props.row.original.instructor?.name || '-'}
                    </span>
                ),
            },
            {
                header: () => t('courseManagement.price', 'السعر'),
                accessorKey: 'price',
                enableSorting: false,
                size: 110,
                cell: (props) => (
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 dir-ltr inline-block">
                        ${props.row.original.price}
                    </span>
                ),
            },
            {
                header: () => t('courseManagement.rating', 'التقييم'),
                accessorKey: 'averageRating',
                enableSorting: false,
                size: 120,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center justify-center gap-1">
                            <HiOutlineStar className="text-amber-400 text-sm" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {row.averageRating ? row.averageRating.toFixed(1) : '0.0'}
                            </span>
                            <span className="text-[11px] text-gray-400">
                                ({row.ratingCount || 0})
                            </span>
                        </div>
                    )
                },
            },
            {
                header: () => t('courseManagement.status', 'الحالة'),
                accessorKey: 'status',
                enableSorting: false,
                size: 120,
                cell: (props) => (
                    <div
                        className="flex justify-center w-full cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation()
                            openStatusModal(props.row.original)
                        }}
                    >
                        {renderStatusBadge(props.row.original.status)}
                    </div>
                ),
            },
            {
                header: () => t('courseManagement.actions', 'إجراءات'),
                id: 'action',
                enableSorting: false,
                size: 140,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center justify-center gap-2 w-full">
                            <Tooltip title={t('courseManagement.changeStatus', 'تغيير الحالة')}>
                                <button
                                    type="button"
                                    className="px-2 py-1 text-xs rounded font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openStatusModal(row)
                                    }}
                                >
                                    {t('courseManagement.changeStatus', 'الحالة')}
                                </button>
                            </Tooltip>
                            <Tooltip title={t('common.edit', 'تعديل')}>
                                <Link
                                    to={`/admin/courses/${row.id}/edit`}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all focus:outline-none"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <HiOutlinePencil className="text-lg" />
                                </Link>
                            </Tooltip>
                            <Tooltip title={t('common.delete', 'حذف')}>
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
        [t, renderStatusBadge],
    )

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {t('courseManagement.title', 'إدارة الدورات التدريبية')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t('courseManagement.description', 'إنشاء وتعديل ونشر وأرشفة الدورات، وإدارة المتطلبات والوظائف المستهدفة والصور.')}
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={() => navigate('/admin/courses/create')}
                >
                    {t('courseManagement.addCourse', 'إضافة دورة جديدة')}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <Input
                            placeholder={t('courseManagement.searchPlaceholder', 'البحث باسم الدورة...')}
                            value={searchTerm}
                            prefix={<HiOutlineMagnifyingGlass className="text-lg text-gray-400" />}
                            onChange={handleSearch}
                        />
                    </div>
                    <div>
                        <Select<StatusOption>
                            placeholder={t('courseManagement.filterByStatus', 'تصفية حسب الحالة')}
                            options={statusOptions}
                            value={statusOptions.find((o) => o.value === statusFilter) || statusOptions[0]}
                            onChange={handleStatusFilterChange}
                        />
                    </div>
                    <div>
                        <Select<OptionType>
                            placeholder={t('courseManagement.filterByCategory', 'كل التصنيفات')}
                            options={categoryOptions}
                            value={categoryOptions.find((o) => o.value === categoryFilter) || categoryOptions[0]}
                            onChange={handleCategoryFilterChange}
                        />
                    </div>
                    <div>
                        <Select<OptionType>
                            placeholder={t('courseManagement.filterByInstructor', 'كل المحاضرين')}
                            options={instructorOptions}
                            value={instructorOptions.find((o) => o.value === instructorFilter) || instructorOptions[0]}
                            onChange={handleInstructorFilterChange}
                        />
                    </div>
                    <div>
                        <Select<{ value: 'Recorded' | 'Live' | null; label: string }>
                            placeholder={t('courseManagement.filterByDeliveryType', 'نوع التسليم')}
                            options={[
                                { value: null, label: t('courseManagement.allDeliveryTypes', 'كل الأنواع') },
                                { value: 'Recorded', label: t('courseManagement.recorded', 'مسجّل') },
                                { value: 'Live', label: t('courseManagement.live', 'مباشر') },
                            ]}
                            value={
                                deliveryTypeFilter === 'Recorded'
                                    ? { value: 'Recorded', label: t('courseManagement.recorded', 'مسجّل') }
                                    : deliveryTypeFilter === 'Live'
                                      ? { value: 'Live', label: t('courseManagement.live', 'مباشر') }
                                      : { value: null, label: t('courseManagement.allDeliveryTypes', 'كل الأنواع') }
                            }
                            onChange={handleDeliveryTypeFilterChange}
                        />
                    </div>
                </div>
            </Card>

            {/* Desktop: Data Table */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden hidden md:block">
                <DataTable
                    columns={columns}
                    data={courses}
                    loading={loading}
                    onRowClick={(row) => navigate(`/admin/courses/${row.id}`)}
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
                ) : courses.length === 0 ? (
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                        <p className="text-center text-gray-400 text-sm py-10">
                            {t('common.noDataFound', 'لا توجد بيانات للعرض')}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {courses.map((course) => (
                            <Card
                                key={course.id}
                                className="shadow-xs border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all"
                                onClick={() => navigate(`/admin/courses/${course.id}`)}
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar
                                        shape="round"
                                        src={course.thumbnailUrl || undefined}
                                        icon={<HiOutlineBookOpen />}
                                        size={52}
                                        className="border border-gray-200 dark:border-gray-700 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                                    {course.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {course.category ? (course.category.nameAr || course.category.nameEn) : '-'}
                                                </p>
                                                {course.instructor && (
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                                                        {course.instructor.name}
                                                    </p>
                                                )}
                                            </div>
                                            <div
                                                className="shrink-0 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openStatusModal(course)
                                                }}
                                            >
                                                {renderStatusBadge(course.status)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="font-bold text-indigo-600 dark:text-indigo-400 dir-ltr">
                                                ${course.price}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <HiOutlineStar className="text-amber-400 text-sm" />
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                    {course.averageRating ? course.averageRating.toFixed(1) : '0.0'}
                                                </span>
                                                <span className="text-[11px] text-gray-400">
                                                    ({course.ratingCount || 0})
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <button
                                                type="button"
                                                className="px-2.5 py-1 text-xs rounded font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors mr-auto"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openStatusModal(course)
                                                }}
                                            >
                                                {t('courseManagement.changeStatus', 'الحالة')}
                                            </button>
                                            <Link
                                                to={`/admin/courses/${course.id}/edit`}
                                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <HiOutlinePencil className="text-lg" />
                                            </Link>
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openDeleteDialog(course)
                                                }}
                                            >
                                                <HiOutlineTrash className="text-lg" />
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

            {/* Update Status Modal */}
            <Dialog
                isOpen={statusModalOpen}
                onClose={closeStatusModal}
                onRequestClose={closeStatusModal}
                width={440}
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {t('courseManagement.changeStatus', 'تغيير حالة نشر الدورة')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {targetCourseForStatus?.name}
                    </p>

                    <div className="space-y-3 mb-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            اختر الحالة الجديدة:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                className={`p-3 rounded-lg border text-xs font-bold transition-all ${
                                    selectedNewStatus === CourseStatus.Draft
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:text-gray-400'
                                }`}
                                onClick={() => setSelectedNewStatus(CourseStatus.Draft)}
                            >
                                {t('courseManagement.draft', 'مسودة')}
                            </button>
                            <button
                                type="button"
                                className={`p-3 rounded-lg border text-xs font-bold transition-all ${
                                    selectedNewStatus === CourseStatus.Published
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:text-gray-400'
                                }`}
                                onClick={() => setSelectedNewStatus(CourseStatus.Published)}
                            >
                                {t('courseManagement.published', 'منشور')}
                            </button>
                            <button
                                type="button"
                                className={`p-3 rounded-lg border text-xs font-bold transition-all ${
                                    selectedNewStatus === CourseStatus.Archived
                                        ? 'border-amber-600 bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-600 dark:text-gray-400'
                                }`}
                                onClick={() => setSelectedNewStatus(CourseStatus.Archived)}
                            >
                                {t('courseManagement.archived', 'مؤرشف')}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Button type="button" variant="plain" onClick={closeStatusModal} disabled={statusUpdating}>
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button type="button" variant="solid" loading={statusUpdating} onClick={handleUpdateStatus}>
                            {t('common.save', 'حفظ التغييرات')}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={closeDeleteDialog}
                onRequestClose={closeDeleteDialog}
                onCancel={closeDeleteDialog}
                onConfirm={handleDeleteCourse}
                type="danger"
                title={t('courseManagement.confirmDeleteTitle', 'تأكيد حذف الدورة')}
                confirmButtonProps={{ loading: deleting }}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t(
                        'courseManagement.confirmDeleteMsg',
                        `هل أنت متأكد من حذف الدورة "${deletingCourse?.name}"؟ ستؤدي هذه العملية لحذف الوظائف المستهدفة والمتطلبات والآراء المرتبطة بها.`,
                        { name: deletingCourse?.name },
                    )}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default CoursesList
