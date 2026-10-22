import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Switcher from '@/components/ui/Switcher'
import Tooltip from '@/components/ui/Tooltip'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlinePencil,
} from 'react-icons/hi2'
import {
    apiGetAdminCourseCategories,
    apiCreateCourseCategory,
    apiUpdateCourseCategory,
    apiToggleCourseCategoryStatus,
} from '@/services/CourseCategoryService'
import type {
    CourseCategoryResponse,
    GetPaginatedCourseCategoriesQueryParams,
    CreateCourseCategoryRequest,
    UpdateCourseCategoryRequest,
} from '@/@types/courseCategory'

interface StatusOption {
    value: boolean | null
    label: string
}

interface FormErrors {
    nameAr?: string
    nameEn?: string
}

const CourseCategories = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Status filter options
    const statusOptions: StatusOption[] = useMemo(
        () => [
            {
                value: null,
                label: t(
                    'courseCategoryManagement.allStatuses',
                    'جميع الحالات',
                ),
            },
            {
                value: true,
                label: t(
                    'courseCategoryManagement.activeOnly',
                    'النشطة فقط',
                ),
            },
            {
                value: false,
                label: t(
                    'courseCategoryManagement.inactiveOnly',
                    'غير النشطة فقط',
                ),
            },
        ],
        [t],
    )

    // Data state
    const [categories, setCategories] = useState<CourseCategoryResponse[]>([])
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
    const [editingCategory, setEditingCategory] =
        useState<CourseCategoryResponse | null>(null)
    const [nameAr, setNameAr] = useState<string>('')
    const [nameEn, setNameEn] = useState<string>('')
    const [isActive, setIsActive] = useState<boolean>(true)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false)
    const [modalApiError, setModalApiError] = useState<string>('')

    // Switcher Toggling State
    const [togglingId, setTogglingId] = useState<number | null>(null)

    // Fetch Categories
    const fetchCategories = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetPaginatedCourseCategoriesQueryParams = {
                pageNumber,
                pageSize,
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }
            if (statusFilter !== null) {
                params.isActive = statusFilter
            }

            const res = await apiGetAdminCourseCategories(params)
            if (res?.status && res.data) {
                setCategories(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setCategories([])
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
                        'courseCategoryManagement.failedFetch',
                        'فشل جلب تصنيفات الدورات.',
                    ),
            )
            setCategories([])
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, searchTerm, statusFilter, t])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    // Handlers for Filters
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
        setEditingCategory(null)
        setNameAr('')
        setNameEn('')
        setIsActive(true)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const openEditModal = (category: CourseCategoryResponse) => {
        setEditingCategory(category)
        setNameAr(category.nameAr)
        setNameEn(category.nameEn)
        setIsActive(category.isActive)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditingCategory(null)
        setNameAr('')
        setNameEn('')
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
                'courseCategoryManagement.nameArRequired',
                'يرجى إدخال الاسم باللغة العربية',
            )
            isValid = false
        } else if (nameAr.trim().length > 100) {
            errors.nameAr = t(
                'courseCategoryManagement.nameArMaxLength',
                'الاسم بالعربية يجب ألا يتجاوز 100 حرف',
            )
            isValid = false
        }

        if (!nameEn.trim()) {
            errors.nameEn = t(
                'courseCategoryManagement.nameEnRequired',
                'يرجى إدخال الاسم باللغة الإنجليزية',
            )
            isValid = false
        } else if (nameEn.trim().length > 100) {
            errors.nameEn = t(
                'courseCategoryManagement.nameEnMaxLength',
                'الاسم بالإنجليزية يجب ألا يتجاوز 100 حرف',
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
            if (editingCategory) {
                // Edit existing category
                const payload: UpdateCourseCategoryRequest = {
                    nameAr: nameAr.trim(),
                    nameEn: nameEn.trim(),
                }
                const res = await apiUpdateCourseCategory(
                    editingCategory.id,
                    payload,
                )
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'courseCategoryManagement.updateSuccess',
                                'تم تحديث تصنيف الدورة بنجاح.',
                            ),
                    )
                    closeModal()
                    fetchCategories()
                } else {
                    setModalApiError(
                        res?.message ||
                            t(
                                'courseCategoryManagement.failedUpdate',
                                'فشل تحديث التصنيف.',
                            ),
                    )
                }
            } else {
                // Create new category
                const payload: CreateCourseCategoryRequest = {
                    nameAr: nameAr.trim(),
                    nameEn: nameEn.trim(),
                    isActive,
                }
                const res = await apiCreateCourseCategory(payload)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'courseCategoryManagement.createSuccess',
                                'تم إنشاء تصنيف الدورة بنجاح.',
                            ),
                    )
                    closeModal()
                    fetchCategories()
                } else {
                    setModalApiError(
                        res?.message ||
                            t(
                                'courseCategoryManagement.failedCreate',
                                'فشل إنشاء التصنيف.',
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
                        'courseCategoryManagement.failedCreate',
                        'حدث خطأ أثناء حفظ البيانات.',
                    ),
            )
        } finally {
            setModalSubmitting(false)
        }
    }

    // Toggle Status Direct Switch Handler
    const handleToggleStatus = useCallback(
        async (category: CourseCategoryResponse) => {
            setTogglingId(category.id)
            setErrorMsg('')
            setSuccessMsg('')

            try {
                const res = await apiToggleCourseCategoryStatus(category.id)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t(
                                'courseCategoryManagement.toggleSuccess',
                                'تم تغيير حالة التصنيف بنجاح.',
                            ),
                    )
                    fetchCategories()
                } else {
                    setErrorMsg(
                        res?.message ||
                            t(
                                'courseCategoryManagement.failedToggle',
                                'فشل تغيير حالة التصنيف.',
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
                            'courseCategoryManagement.failedToggle',
                            'فشلت العملية.',
                        ),
                )
            } finally {
                setTogglingId(null)
            }
        },
        [fetchCategories, t],
    )

    // Render Status Badge Component
    const renderStatusBadge = useCallback(
        (active: boolean) => {
            if (active) {
                return (
                    <div className="flex justify-center w-full">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 transition-colors shadow-2xs">
                            <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                            {t('courseCategoryManagement.active', 'نشط')}
                        </span>
                    </div>
                )
            }
            return (
                <div className="flex justify-center w-full">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 transition-colors shadow-2xs">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-gray-400" />
                        {t('courseCategoryManagement.inactive', 'غير نشط')}
                    </span>
                </div>
            )
        },
        [t],
    )

    // Table Columns Configuration
    const columns: ColumnDef<CourseCategoryResponse>[] = useMemo(
        () => [
            {
                header: () =>
                    t('courseCategoryManagement.nameAr', 'الاسم بالعربية'),
                accessorKey: 'nameAr',
                enableSorting: false,
                size: 220,
                meta: { align: 'start' },
                cell: (props) => (
                    <div className="flex items-center justify-start text-start w-full px-3">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                            {props.row.original.nameAr}
                        </span>
                    </div>
                ),
            },
            {
                header: () =>
                    t('courseCategoryManagement.nameEn', 'الاسم بالإنجليزية'),
                accessorKey: 'nameEn',
                enableSorting: false,
                size: 220,
                meta: { align: 'start' },
                cell: (props) => (
                    <div className="flex items-center justify-start text-start w-full px-3">
                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm dir-ltr">
                            {props.row.original.nameEn}
                        </span>
                    </div>
                ),
            },
            {
                header: () => t('courseCategoryManagement.status', 'الحالة'),
                accessorKey: 'isActive',
                enableSorting: false,
                size: 140,
                cell: (props) => renderStatusBadge(props.row.original.isActive),
            },
            {
                header: () =>
                    t('courseCategoryManagement.createdAt', 'تاريخ الإنشاء'),
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
                header: () => t('courseCategoryManagement.actions', 'إجراءات'),
                id: 'action',
                enableSorting: false,
                size: 120,
                cell: (props) => {
                    const row = props.row.original
                    const isToggling = togglingId === row.id
                    return (
                        <div className="flex items-center justify-center gap-3 w-full">
                            <Tooltip
                                title={t(
                                    'courseCategoryManagement.toggleStatus',
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
                                    'courseCategoryManagement.editCategory',
                                    'تعديل التصنيف',
                                )}
                            >
                                <button
                                    type="button"
                                    className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all duration-200 hover:scale-110 focus:outline-none"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openEditModal(row)
                                    }}
                                >
                                    <HiOutlinePencil className="text-xl" />
                                </button>
                            </Tooltip>
                        </div>
                    )
                },
            },
        ],
        [t, renderStatusBadge, togglingId, handleToggleStatus],
    )

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {t(
                            'courseCategoryManagement.title',
                            'إدارة تصنيفات الدورات',
                        )}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t(
                            'courseCategoryManagement.description',
                            'عرض، إيجاد، تصفية، إنشاء، تعديل، وتبديل حالة تصنيفات الدورات التدريبية.',
                        )}
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={openCreateModal}
                >
                    {t(
                        'courseCategoryManagement.addCategory',
                        'إضافة تصنيف جديد',
                    )}
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
                                'courseCategoryManagement.searchPlaceholder',
                                'البحث بالاسم العربي أو الإنجليزي...',
                            )}
                            value={searchTerm}
                            prefix={
                                <HiOutlineMagnifyingGlass className="text-lg text-gray-400" />
                            }
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select<StatusOption>
                            placeholder={t(
                                'courseCategoryManagement.filterByStatus',
                                'تصفية حسب الحالة',
                            )}
                            options={statusOptions}
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

            {/* Desktop: Data Table Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden hidden md:block">
                <DataTable
                    columns={columns}
                    data={categories}
                    loading={loading}
                    onRowClick={(row) =>
                        navigate(`/admin/course-categories/${row.id}`)
                    }
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
                ) : categories.length === 0 ? (
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                        <p className="text-center text-gray-400 text-sm py-10">
                            {t('common.noDataFound', 'لا توجد بيانات للعرض')}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {categories.map((cat) => (
                            <Card
                                key={cat.id}
                                className="shadow-xs border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all"
                                onClick={() => navigate(`/admin/course-categories/${cat.id}`)}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                            {cat.nameAr}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 dir-ltr text-right">
                                            {cat.nameEn}
                                        </p>
                                    </div>
                                    <div className="shrink-0">{renderStatusBadge(cat.isActive)}</div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Switcher
                                            checked={cat.isActive}
                                            isLoading={togglingId === cat.id}
                                            onChange={() => handleToggleStatus(cat)}
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                openEditModal(cat)
                                            }}
                                        >
                                            <HiOutlinePencil className="text-lg" />
                                        </button>
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

            {/* Create / Edit Category Modal */}
            <Dialog
                isOpen={modalOpen}
                onClose={closeModal}
                onRequestClose={closeModal}
                width={560}
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {editingCategory
                            ? t(
                                  'courseCategoryManagement.editCategory',
                                  'تعديل التصنيف',
                              )
                            : t(
                                  'courseCategoryManagement.createCategory',
                                  'إنشاء تصنيف',
                              )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {editingCategory
                            ? t(
                                  'courseCategoryManagement.editSubtitle',
                                  'تحديث الاسم بالعربية والإنجليزية لتصنيف الدورة.',
                              )
                            : t(
                                  'courseCategoryManagement.createSubtitle',
                                  'أدخل بيانات تصنيف الدورة التدريبية الجديد.',
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
                                {t(
                                    'courseCategoryManagement.nameAr',
                                    'الاسم بالعربية',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder={t(
                                    'courseCategoryManagement.nameArPlaceholder',
                                    'مثال: تطوير الويب',
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
                                    'courseCategoryManagement.nameEn',
                                    'الاسم بالإنجليزية',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder={t(
                                    'courseCategoryManagement.nameEnPlaceholder',
                                    'Example: Web Development',
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

                        {!editingCategory && (
                            <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-100 dark:border-gray-800">
                                <div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                        {t(
                                            'courseCategoryManagement.isActiveLabel',
                                            'تفعيل التصنيف',
                                        )}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {isActive
                                            ? t(
                                                  'courseCategoryManagement.active',
                                                  'نشط',
                                              )
                                            : t(
                                                  'courseCategoryManagement.inactive',
                                                  'غير نشط',
                                              )}
                                    </span>
                                </div>
                                <Switcher
                                    checked={isActive}
                                    onChange={(checked) => setIsActive(checked)}
                                />
                            </div>
                        )}

                        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
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
                                {editingCategory
                                    ? t('common.save', 'حفظ التغييرات')
                                    : t(
                                          'courseCategoryManagement.createCategory',
                                          'إنشاء تصنيف',
                                      )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

        </div>
    )
}

export default CourseCategories
