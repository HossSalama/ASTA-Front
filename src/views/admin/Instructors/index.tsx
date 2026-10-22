import { useEffect, useState, useCallback, useMemo, ChangeEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Switcher from '@/components/ui/Switcher'
import Tooltip from '@/components/ui/Tooltip'
import Avatar from '@/components/ui/Avatar'
import Upload from '@/components/ui/Upload'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineMagnifyingGlass,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineUser,
    HiOutlineCloudArrowUp,
    HiOutlineCamera,
} from 'react-icons/hi2'
import {
    apiGetPaginatedInstructors,
    apiCreateInstructor,
    apiUpdateInstructor,
    apiDeleteInstructor,
    apiUploadInstructorProfileImage,
    apiDeleteInstructorProfileImage,
    apiToggleInstructorStatus,
} from '@/services/InstructorAdminService'
import type {
    InstructorResponse,
    GetPaginatedInstructorsQueryParams,
    CreateInstructorDto,
    UpdateInstructorDto,
} from '@/@types/adminManagement'

interface StatusOption {
    value: boolean | null
    label: string
}

interface FormErrors {
    name?: string
    bio?: string
}

const InstructorsList = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    // Status filter options
    const statusOptions: StatusOption[] = useMemo(
        () => [
            {
                value: null,
                label: t('instructorManagement.allStatuses', 'جميع الحالات'),
            },
            {
                value: true,
                label: t('instructorManagement.activeOnly', 'النشطة فقط'),
            },
            {
                value: false,
                label: t('instructorManagement.inactiveOnly', 'غير النشطة فقط'),
            },
        ],
        [t],
    )

    // Data state
    const [instructors, setInstructors] = useState<InstructorResponse[]>([])
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
    const [editingInstructor, setEditingInstructor] = useState<InstructorResponse | null>(null)
    const [name, setName] = useState<string>('')
    const [bio, setBio] = useState<string>('')
    const [isActive, setIsActive] = useState<boolean>(true)
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false)
    const [modalApiError, setModalApiError] = useState<string>('')

    // Image Upload Modal State
    const [imageModalOpen, setImageModalOpen] = useState<boolean>(false)
    const [targetInstructorForImage, setTargetInstructorForImage] = useState<InstructorResponse | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [imageUploading, setImageUploading] = useState<boolean>(false)

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deletingInstructor, setDeletingInstructor] = useState<InstructorResponse | null>(null)
    const [deleting, setDeleting] = useState<boolean>(false)

    // Switcher Toggling State
    const [togglingId, setTogglingId] = useState<number | null>(null)

    // Fetch Instructors
    const fetchInstructors = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetPaginatedInstructorsQueryParams = {
                pageNumber,
                pageSize,
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }
            if (statusFilter !== null) {
                params.isActive = statusFilter
            }

            const res = await apiGetPaginatedInstructors(params)
            if (res?.status && res.data) {
                setInstructors(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setInstructors([])
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
                    t('instructorManagement.failedFetch', 'فشل جلب قائمة المحاضرين.'),
            )
            setInstructors([])
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, searchTerm, statusFilter, t])

    useEffect(() => {
        fetchInstructors()
    }, [fetchInstructors])

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
        setEditingInstructor(null)
        setName('')
        setBio('')
        setIsActive(true)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const openEditModal = (instructor: InstructorResponse) => {
        setEditingInstructor(instructor)
        setName(instructor.name)
        setBio(instructor.bio)
        setIsActive(instructor.isActive)
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditingInstructor(null)
        setName('')
        setBio('')
        setIsActive(true)
        setFormErrors({})
        setModalApiError('')
    }

    // Validation
    const validateForm = (): boolean => {
        const errors: FormErrors = {}
        let isValid = true

        if (!name.trim()) {
            errors.name = t('instructorManagement.nameRequired', 'اسم المحاضر مطلوب.')
            isValid = false
        }
        if (!bio.trim()) {
            errors.bio = t('instructorManagement.bioRequired', 'السيرة الذاتية مطلوبة.')
            isValid = false
        }

        setFormErrors(errors)
        return isValid
    }

    // Submit Create / Edit
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setModalSubmitting(true)
        setModalApiError('')
        setErrorMsg('')
        setSuccessMsg('')

        try {
            if (editingInstructor) {
                const payload: UpdateInstructorDto = {
                    name: name.trim(),
                    bio: bio.trim(),
                }
                const res = await apiUpdateInstructor(editingInstructor.id, payload)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t('instructorManagement.updateSuccess', 'تم تحديث بيانات المحاضر بنجاح.'),
                    )
                    closeModal()
                    fetchInstructors()
                } else {
                    setModalApiError(res?.message || t('common.operationFailed', 'فشلت العملية.'))
                }
            } else {
                const payload: CreateInstructorDto = {
                    name: name.trim(),
                    bio: bio.trim(),
                    isActive,
                }
                const res = await apiCreateInstructor(payload)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t('instructorManagement.createSuccess', 'تم إنشاء المحاضر بنجاح.'),
                    )
                    closeModal()
                    fetchInstructors()
                } else {
                    setModalApiError(res?.message || t('common.operationFailed', 'فشلت العملية.'))
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
                    t('common.operationFailed', 'حدث خطأ أثناء حفظ البيانات.'),
            )
        } finally {
            setModalSubmitting(false)
        }
    }

    // Toggle Status Direct Switch
    const handleToggleStatus = useCallback(
        async (instructor: InstructorResponse) => {
            setTogglingId(instructor.id)
            setErrorMsg('')
            setSuccessMsg('')

            try {
                const res = await apiToggleInstructorStatus(instructor.id)
                if (res?.status) {
                    setSuccessMsg(
                        res.message ||
                            t('instructorManagement.toggleSuccess', 'تم تغيير حالة المحاضر بنجاح.'),
                    )
                    fetchInstructors()
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشل تغيير حالة المحاضر.'))
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
                setTogglingId(null)
            }
        },
        [fetchInstructors, t],
    )

    // Delete Instructor
    const openDeleteDialog = (instructor: InstructorResponse) => {
        setDeletingInstructor(instructor)
        setDeleteDialogOpen(true)
    }

    const closeDeleteDialog = () => {
        setDeletingInstructor(null)
        setDeleteDialogOpen(false)
    }

    const handleDeleteInstructor = async () => {
        if (!deletingInstructor) return
        setDeleting(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const res = await apiDeleteInstructor(deletingInstructor.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message || t('instructorManagement.deleteSuccess', 'تم حذف المحاضر بنجاح.'),
                )
                closeDeleteDialog()
                fetchInstructors()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل حذف المحاضر.'))
                closeDeleteDialog()
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            // Display backend message directly (e.g. "Cannot delete instructor with assigned courses.")
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('instructorManagement.cannotDeleteWithCourses', 'لا يمكن حذف محاضر لديه دورات تدريبية مرتبطة به.'),
            )
            closeDeleteDialog()
        } finally {
            setDeleting(false)
        }
    }

    // Image Upload Modal
    const openImageModal = (instructor: InstructorResponse) => {
        setTargetInstructorForImage(instructor)
        setSelectedFile(null)
        setImageModalOpen(true)
    }

    const closeImageModal = () => {
        setTargetInstructorForImage(null)
        setSelectedFile(null)
        setImageModalOpen(false)
    }

    const handleUploadImage = async () => {
        if (!targetInstructorForImage || !selectedFile) return
        setImageUploading(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const res = await apiUploadInstructorProfileImage(targetInstructorForImage.id, selectedFile)
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t('instructorManagement.imageUploadSuccess', 'تم رفع الصورة الشخصية بنجاح.'),
                )
                closeImageModal()
                fetchInstructors()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل رفع الصورة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'فشل رفع الصورة.'),
            )
        } finally {
            setImageUploading(false)
        }
    }

    const handleDeleteImage = async () => {
        if (!targetInstructorForImage) return
        setImageUploading(true)
        setErrorMsg('')
        setSuccessMsg('')

        try {
            const res = await apiDeleteInstructorProfileImage(targetInstructorForImage.id)
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t('instructorManagement.imageDeleteSuccess', 'تم حذف الصورة الشخصية بنجاح.'),
                )
                closeImageModal()
                fetchInstructors()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل حذف الصورة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'فشل حذف الصورة.'),
            )
        } finally {
            setImageUploading(false)
        }
    }

    // Status Badge
    const renderStatusBadge = useCallback(
        (active: boolean) => {
            if (active) {
                return (
                    <div className="flex justify-center w-full">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 transition-colors shadow-2xs">
                            <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                            {t('instructorManagement.active', 'نشط')}
                        </span>
                    </div>
                )
            }
            return (
                <div className="flex justify-center w-full">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 transition-colors shadow-2xs">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-gray-400" />
                        {t('instructorManagement.inactive', 'غير نشط')}
                    </span>
                </div>
            )
        },
        [t],
    )

    // Table Columns
    const columns: ColumnDef<InstructorResponse>[] = useMemo(
        () => [
            {
                header: () => t('instructorManagement.name', 'اسم المحاضر'),
                accessorKey: 'name',
                enableSorting: false,
                size: 240,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex items-center gap-3 w-full">
                            <Tooltip title={t('instructorManagement.profileImage', 'تغيير الصورة الشخصية')}>
                                <div
                                    className="relative group shrink-0 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        openImageModal(row)
                                    }}
                                >
                                    <Avatar
                                        shape="circle"
                                        src={row.profileImageUrl || undefined}
                                        icon={<HiOutlineUser />}
                                        size={42}
                                        className="border border-gray-200 dark:border-gray-700 shrink-0"
                                    />
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <HiOutlineCamera className="text-base" />
                                    </div>
                                </div>
                            </Tooltip>
                            <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                    {row.name}
                                </span>
                                <span className="text-xs text-gray-500 truncate max-w-xs">
                                    {row.bio || '-'}
                                </span>
                            </div>
                        </div>
                    )
                },
            },
            {
                header: () => t('instructorManagement.courseCount', 'عدد الدورات'),
                accessorKey: 'courseCount',
                enableSorting: false,
                size: 130,
                cell: (props) => (
                    <div className="flex justify-center w-full">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            {props.row.original.courseCount || 0}
                        </span>
                    </div>
                ),
            },
            {
                header: () => t('instructorManagement.status', 'الحالة'),
                accessorKey: 'isActive',
                enableSorting: false,
                size: 130,
                cell: (props) => renderStatusBadge(props.row.original.isActive),
            },
            {
                header: () => t('instructorManagement.createdAt', 'تاريخ الإنشاء'),
                accessorKey: 'createdAt',
                enableSorting: false,
                size: 150,
                cell: (props) => {
                    const date = props.row.original.createdAt
                    if (!date) return <div className="text-center text-gray-400 text-xs">-</div>
                    return (
                        <div className="flex flex-col items-center justify-center w-full">
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 dir-ltr inline-block">
                                {dayjs(date).format('YYYY/MM/DD')}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: () => t('instructorManagement.actions', 'إجراءات'),
                id: 'action',
                enableSorting: false,
                size: 140,
                cell: (props) => {
                    const row = props.row.original
                    const isToggling = togglingId === row.id
                    return (
                        <div className="flex items-center justify-center gap-2 w-full">
                            <Tooltip title={t('instructorManagement.status', 'تبديل الحالة')}>
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
                            <Tooltip title={t('common.edit', 'تعديل')}>
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all focus:outline-none"
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
        [t, renderStatusBadge, togglingId, handleToggleStatus, openImageModal],
    )

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {t('instructorManagement.title', 'إدارة المحاضرين')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t('instructorManagement.description', 'إدارة بيانات وسير المحاضرين، الصور الشخصية، تفعيل وتجميد الحسابات.')}
                    </p>
                </div>
                <Button
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={openCreateModal}
                >
                    {t('instructorManagement.addInstructor', 'إضافة محاضر جديد')}
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="w-full md:w-80">
                        <Input
                            placeholder={t('instructorManagement.searchPlaceholder', 'البحث باسم المحاضر...')}
                            value={searchTerm}
                            prefix={<HiOutlineMagnifyingGlass className="text-lg text-gray-400" />}
                            onChange={handleSearch}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <Select<StatusOption>
                            placeholder={t('instructorManagement.filterByStatus', 'تصفية حسب الحالة')}
                            options={statusOptions}
                            value={statusOptions.find((o) => o.value === statusFilter) || statusOptions[0]}
                            onChange={handleStatusFilterChange}
                        />
                    </div>
                </div>
            </Card>

            {/* Desktop: Data Table */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden hidden md:block">
                <DataTable
                    columns={columns}
                    data={instructors}
                    loading={loading}
                    onRowClick={(row) => navigate(`/admin/instructors/${row.id}`)}
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
                ) : instructors.length === 0 ? (
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                        <p className="text-center text-gray-400 text-sm py-10">
                            {t('common.noDataFound', 'لا توجد بيانات للعرض')}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {instructors.map((inst) => (
                            <Card
                                key={inst.id}
                                className="shadow-xs border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-sky-300 dark:hover:border-sky-800 transition-all"
                                onClick={() => navigate(`/admin/instructors/${inst.id}`)}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="relative group shrink-0 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            openImageModal(inst)
                                        }}
                                    >
                                        <Avatar
                                            shape="circle"
                                            src={inst.profileImageUrl || undefined}
                                            icon={<HiOutlineUser />}
                                            size={48}
                                            className="border border-gray-200 dark:border-gray-700 shrink-0"
                                        />
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            <HiOutlineCamera className="text-sm" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                                                    {inst.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                    {inst.bio || '-'}
                                                </p>
                                            </div>
                                            <div className="shrink-0">{renderStatusBadge(inst.isActive)}</div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-2 text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {t('instructorManagement.courseCount', 'عدد الدورات')}:{' '}
                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                                    {inst.courseCount || 0}
                                                </span>
                                            </span>
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Switcher
                                                    checked={inst.isActive}
                                                    isLoading={togglingId === inst.id}
                                                    onChange={() => handleToggleStatus(inst)}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openEditModal(inst)
                                                }}
                                            >
                                                <HiOutlinePencil className="text-lg" />
                                            </button>
                                            <button
                                                type="button"
                                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    openDeleteDialog(inst)
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

            {/* Create / Edit Modal */}
            <Dialog
                isOpen={modalOpen}
                onClose={closeModal}
                onRequestClose={closeModal}
                width={560}
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {editingInstructor
                            ? t('instructorManagement.editInstructor', 'تعديل بيانات المحاضر')
                            : t('instructorManagement.createInstructor', 'إنشاء محاضر')}
                    </h3>

                    {modalApiError && (
                        <Alert type="danger" className="mb-4" onClose={() => setModalApiError('')}>
                            {modalApiError}
                        </Alert>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('instructorManagement.name', 'اسم المحاضر')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder={t(
                                    'instructorManagement.namePlaceholder',
                                    'مثال: د. أحمد حسان',
                                )}
                                value={name}
                                invalid={!!formErrors.name}
                                onChange={(e) => {
                                    setName(e.target.value)
                                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }))
                                }}
                            />
                            {formErrors.name && (
                                <span className="text-xs text-red-500 mt-1 block">{formErrors.name}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('instructorManagement.bio', 'السيرة الذاتية')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                textArea
                                rows={4}
                                placeholder={t(
                                    'instructorManagement.bioPlaceholder',
                                    'أدخل نبذة عن الخبرات والشهادات...',
                                )}
                                value={bio}
                                invalid={!!formErrors.bio}
                                onChange={(e) => {
                                    setBio(e.target.value)
                                    if (formErrors.bio) setFormErrors((prev) => ({ ...prev, bio: undefined }))
                                }}
                            />
                            {formErrors.bio && (
                                <span className="text-xs text-red-500 mt-1 block">{formErrors.bio}</span>
                            )}
                        </div>

                        {!editingInstructor && (
                            <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-100 dark:border-gray-800">
                                <div>
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                                        {t('instructorManagement.active', 'تفعيل الحساب')}
                                    </span>
                                </div>
                                <Switcher
                                    checked={isActive}
                                    onChange={(checked) => setIsActive(checked)}
                                />
                            </div>
                        )}

                        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant="plain" onClick={closeModal} disabled={modalSubmitting}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button type="submit" variant="solid" loading={modalSubmitting}>
                                {editingInstructor
                                    ? t('common.save', 'حفظ التغييرات')
                                    : t('instructorManagement.createInstructor', 'إنشاء محاضر')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

            {/* Profile Image Modal */}
            <Dialog
                isOpen={imageModalOpen}
                onClose={closeImageModal}
                onRequestClose={closeImageModal}
                width={480}
            >
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {t('instructorManagement.profileImage', 'الصورة الشخصية للمحاضر')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {targetInstructorForImage?.name}
                    </p>

                    <div className="flex flex-col items-center gap-4 mb-6">
                        <Avatar
                            shape="circle"
                            src={targetInstructorForImage?.profileImageUrl || undefined}
                            icon={<HiOutlineUser />}
                            size={96}
                            className="border-2 border-indigo-500/20 shadow-md"
                        />

                        <div className="w-full">
                            <Upload
                                draggable
                                uploadLimit={1}
                                accept="image/*"
                                onChange={(files) => setSelectedFile(files[0] || null)}
                                showList={true}
                            >
                                <div className="my-2 text-center">
                                    <div className="text-3xl mb-2 flex justify-center text-indigo-500">
                                        <HiOutlineCloudArrowUp />
                                    </div>
                                    <p className="font-semibold text-xs text-gray-600 dark:text-gray-300">
                                        {t('profile.chooseImage', 'اختر صورة لرفعها')}
                                    </p>
                                </div>
                            </Upload>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
                        {targetInstructorForImage?.profileImageUrl ? (
                            <Button
                                type="button"
                                variant="plain"
                                customColorClass={() => 'text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30'}
                                loading={imageUploading}
                                onClick={handleDeleteImage}
                            >
                                {t('instructorManagement.deleteImage', 'حذف الصورة الحالية')}
                            </Button>
                        ) : <div />}

                        <div className="flex gap-2">
                            <Button type="button" variant="plain" onClick={closeImageModal} disabled={imageUploading}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                type="button"
                                variant="solid"
                                disabled={!selectedFile}
                                loading={imageUploading}
                                onClick={handleUploadImage}
                            >
                                {t('instructorManagement.uploadImage', 'رفع الصورة')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* Confirm Delete Dialog */}
            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={closeDeleteDialog}
                onRequestClose={closeDeleteDialog}
                onCancel={closeDeleteDialog}
                onConfirm={handleDeleteInstructor}
                type="danger"
                title={t('instructorManagement.confirmDeleteTitle', 'تأكيد حذف المحاضر')}
                confirmButtonProps={{ loading: deleting }}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t(
                        'instructorManagement.confirmDeleteMsg',
                        `هل أنت متأكد من رغبتك في حذف المحاضر "${deletingInstructor?.name}"؟`,
                        { name: deletingInstructor?.name },
                    )}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default InstructorsList
