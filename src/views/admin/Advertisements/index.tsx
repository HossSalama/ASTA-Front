import { useEffect, useState, useCallback, useMemo } from 'react'
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
    HiOutlineCloudArrowUp,
    HiOutlinePhoto,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineBookOpen,
} from 'react-icons/hi2'
import {
    apiGetPaginatedAdvertisements,
    apiCreateAdvertisement,
    apiUpdateAdvertisement,
    apiDeleteAdvertisement,
    apiToggleAdvertisementStatus,
    apiUploadAdvertisementImage,
} from '@/services/AdvertisementAdminService'
import { apiGetPaginatedCourses } from '@/services/CourseAdminService'
import {
    AdvertisementTargetType,
    AdvertisementResponse,
    CreateAdvertisementDto,
    UpdateAdvertisementDto,
    GetPaginatedAdvertisementsQueryParams,
    AdminCourseSummaryResponse,
} from '@/@types/adminManagement'

interface TargetTypeOption {
    value: AdvertisementTargetType | null
    label: string
}

interface StatusOption {
    value: boolean | null
    label: string
}

interface CourseOption {
    value: number
    label: string
}

interface FormErrors {
    file?: string
    targetType?: string
    courseId?: string
    externalUrl?: string
}

const AdvertisementsList = () => {
    const { t } = useTranslation()

    // Options
    const targetTypeOptions: TargetTypeOption[] = useMemo(
        () => [
            { value: null, label: t('advertisementManagement.targetType', 'كل أنواع التوجيه') },
            { value: AdvertisementTargetType.None, label: t('advertisementManagement.none', 'ثابت (بدون إجراء)') },
            { value: AdvertisementTargetType.Course, label: t('advertisementManagement.course', 'دورة تدريبية') },
            { value: AdvertisementTargetType.ExternalUrl, label: t('advertisementManagement.externalUrl', 'رابط خارجي') },
        ],
        [t],
    )

    const statusOptions: StatusOption[] = useMemo(
        () => [
            { value: null, label: t('instructorManagement.allStatuses', 'جميع الحالات') },
            { value: true, label: t('instructorManagement.activeOnly', 'النشطة فقط') },
            { value: false, label: t('instructorManagement.inactiveOnly', 'غير النشطة فقط') },
        ],
        [t],
    )

    // Data state
    const [ads, setAds] = useState<AdvertisementResponse[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Course dropdown options for ad target creation
    const [courseOptions, setCourseOptions] = useState<CourseOption[]>([])

    // Pagination & Filters
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(10)
    const [totalCount, setTotalCount] = useState<number>(0)
    const [searchTerm, setSearchTerm] = useState<string>('')
    const [targetTypeFilter, setTargetTypeFilter] = useState<AdvertisementTargetType | null>(null)
    const [statusFilter, setStatusFilter] = useState<boolean | null>(null)

    // Create / Edit Modal State
    const [modalOpen, setModalOpen] = useState<boolean>(false)
    const [editingAd, setEditingAd] = useState<AdvertisementResponse | null>(null)
    const [adFile, setAdFile] = useState<File | null>(null)
    const [targetType, setTargetType] = useState<AdvertisementTargetType>(AdvertisementTargetType.None)
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
    const [externalUrl, setExternalUrl] = useState<string>('')
    const [isActive, setIsActive] = useState<boolean>(true)
    const [startAt, setStartAt] = useState<string>('')
    const [endAt, setEndAt] = useState<string>('')
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false)
    const [modalApiError, setModalApiError] = useState<string>('')

    // Image Upload Modal State (for replacing image of an existing ad)
    const [imageModalOpen, setImageModalOpen] = useState<boolean>(false)
    const [targetAdForImage, setTargetAdForImage] = useState<AdvertisementResponse | null>(null)
    const [replaceFile, setReplaceFile] = useState<File | null>(null)
    const [imageUploading, setImageUploading] = useState<boolean>(false)
    const [imageUploadProgress, setImageUploadProgress] = useState<number>(0)

    // Delete Confirmation State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
    const [deletingAd, setDeletingAd] = useState<AdvertisementResponse | null>(null)
    const [deleting, setDeleting] = useState<boolean>(false)

    // Toggling state
    const [togglingId, setTogglingId] = useState<number | null>(null)

    // Fetch Course options for form selection
    useEffect(() => {
        const loadCourses = async () => {
            try {
                const res = await apiGetPaginatedCourses({ pageNumber: 1, pageSize: 50 })
                if (res?.status && res.data) {
                    const courseItems: AdminCourseSummaryResponse[] = Array.isArray(res.data)
                        ? res.data
                        : (res.data.items || [])
                    const opts: CourseOption[] = courseItems.map((c: AdminCourseSummaryResponse) => ({
                        value: c.id,
                        label: c.name,
                    }))
                    setCourseOptions(opts)
                }
            } catch {
                // Ignore course list fetch errors
            }
        }
        loadCourses()
    }, [t])

    // Fetch Advertisements
    const fetchAds = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const params: GetPaginatedAdvertisementsQueryParams = {
                pageNumber,
                pageSize,
            }
            if (searchTerm.trim()) {
                params.searchTerm = searchTerm.trim()
            }
            if (targetTypeFilter !== null) {
                params.targetType = targetTypeFilter
            }
            if (statusFilter !== null) {
                params.isActive = statusFilter
            }

            const res = await apiGetPaginatedAdvertisements(params)
            if (res?.status && res.data) {
                setAds(res.data.items || [])
                setTotalCount(res.data.totalCount || 0)
            } else {
                setAds([])
                setTotalCount(0)
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'فشل جلب الإعلانات.'),
            )
            setAds([])
        } finally {
            setLoading(false)
        }
    }, [pageNumber, pageSize, searchTerm, targetTypeFilter, statusFilter, t])

    useEffect(() => {
        fetchAds()
    }, [fetchAds])

    // Filter Handlers
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value)
        setPageNumber(1)
    }

    // Modal Control Functions
    const openCreateModal = () => {
        setEditingAd(null)
        setAdFile(null)
        setTargetType(AdvertisementTargetType.None)
        setSelectedCourseId(null)
        setExternalUrl('')
        setIsActive(true)
        setStartAt('')
        setEndAt('')
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const openEditModal = (ad: AdvertisementResponse) => {
        setEditingAd(ad)
        setAdFile(null)
        setTargetType(ad.targetType)
        setSelectedCourseId(ad.courseId || null)
        setExternalUrl(ad.externalUrl || '')
        setIsActive(ad.isActive)
        setStartAt(ad.startAt ? dayjs(ad.startAt).format('YYYY-MM-DDTHH:mm') : '')
        setEndAt(ad.endAt ? dayjs(ad.endAt).format('YYYY-MM-DDTHH:mm') : '')
        setFormErrors({})
        setModalApiError('')
        setModalOpen(true)
    }

    const closeModal = () => {
        setModalOpen(false)
        setEditingAd(null)
        setAdFile(null)
        setFormErrors({})
        setModalApiError('')
    }

    // Validation
    const validateForm = (): boolean => {
        const errors: FormErrors = {}
        let isValid = true

        if (!editingAd && !adFile) {
            errors.file = t('advertisementManagement.fileRequired', 'يرجى اختيار صورة الإعلان.')
            isValid = false
        }

        if (targetType === AdvertisementTargetType.Course && !selectedCourseId) {
            errors.courseId = t('advertisementManagement.courseRequired', 'يرجى اختيار الدورة المرتبطة الإجبارية.')
            isValid = false
        }

        if (targetType === AdvertisementTargetType.ExternalUrl && !externalUrl.trim()) {
            errors.externalUrl = t('advertisementManagement.urlRequired', 'يرجى إدخال الرابط الخارجي الإجباري.')
            isValid = false
        }

        setFormErrors(errors)
        return isValid
    }

    // Submit Create or Edit
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setModalSubmitting(true)
        setModalApiError('')
        setErrorMsg('')
        setSuccessMsg('')

        try {
            if (editingAd) {
                // Update Metadata
                const payload: UpdateAdvertisementDto = {
                    targetType,
                    courseId: targetType === AdvertisementTargetType.Course ? selectedCourseId : null,
                    externalUrl: targetType === AdvertisementTargetType.ExternalUrl ? externalUrl.trim() : null,
                    isActive,
                    startAt: startAt ? new Date(startAt).toISOString() : null,
                    endAt: endAt ? new Date(endAt).toISOString() : null,
                }
                const res = await apiUpdateAdvertisement(editingAd.id, payload)
                if (res?.status) {
                    setSuccessMsg(res.message || t('advertisementManagement.updateSuccess', 'تم تحديث الإعلان بنجاح.'))
                    closeModal()
                    fetchAds()
                } else {
                    setModalApiError(res?.message || t('common.operationFailed', 'فشلت العملية.'))
                }
            } else {
                // Create
                const dto: CreateAdvertisementDto = {
                    file: adFile,
                    targetType,
                    courseId: targetType === AdvertisementTargetType.Course ? selectedCourseId : null,
                    externalUrl: targetType === AdvertisementTargetType.ExternalUrl ? externalUrl.trim() : null,
                    isActive,
                    startAt: startAt ? new Date(startAt).toISOString() : null,
                    endAt: endAt ? new Date(endAt).toISOString() : null,
                }
                const res = await apiCreateAdvertisement(dto)
                if (res?.status) {
                    setSuccessMsg(res.message || t('advertisementManagement.createSuccess', 'تم إنشاء الإعلان بنجاح.'))
                    closeModal()
                    fetchAds()
                } else {
                    setModalApiError(res?.message || t('common.operationFailed', 'فشلت العملية.'))
                }
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setModalApiError(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'حدث خطأ أثناء الحفظ.'))
        } finally {
            setModalSubmitting(false)
        }
    }

    // Toggle Active Status
    const handleToggleStatus = useCallback(
        async (ad: AdvertisementResponse) => {
            setTogglingId(ad.id)
            setErrorMsg('')
            setSuccessMsg('')
            try {
                const res = await apiToggleAdvertisementStatus(ad.id)
                if (res?.status) {
                    setSuccessMsg(res.message || t('advertisementManagement.toggleSuccess', 'تم تغيير حالة تفعيل الإعلان بنجاح.'))
                    fetchAds()
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشل التبديل.'))
                }
            } catch (err: unknown) {
                const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
                setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
            } finally {
                setTogglingId(null)
            }
        },
        [fetchAds, t],
    )

    // Delete Advertisement
    const openDeleteDialog = (ad: AdvertisementResponse) => {
        setDeletingAd(ad)
        setDeleteDialogOpen(true)
    }

    const closeDeleteDialog = () => {
        setDeletingAd(null)
        setDeleteDialogOpen(false)
    }

    const handleDeleteAd = async () => {
        if (!deletingAd) return
        setDeleting(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiDeleteAdvertisement(deletingAd.id)
            if (res?.status) {
                setSuccessMsg(res.message || t('advertisementManagement.deleteSuccess', 'تم حذف الإعلان بنجاح.'))
                closeDeleteDialog()
                fetchAds()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل الحذف.'))
                closeDeleteDialog()
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشل الحذف.'))
            closeDeleteDialog()
        } finally {
            setDeleting(false)
        }
    }

    // Replace Image Modal
    const openImageModal = (ad: AdvertisementResponse) => {
        setTargetAdForImage(ad)
        setReplaceFile(null)
        setImageUploadProgress(0)
        setImageModalOpen(true)
    }

    const closeImageModal = () => {
        setTargetAdForImage(null)
        setReplaceFile(null)
        setImageUploadProgress(0)
        setImageModalOpen(false)
    }

    const handleReplaceImage = async () => {
        if (!targetAdForImage || !replaceFile) return
        setImageUploading(true)
        setImageUploadProgress(0)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiUploadAdvertisementImage(targetAdForImage.id, replaceFile, (percent) => {
                setImageUploadProgress(percent)
            })
            if (res?.status) {
                setSuccessMsg(res.message || t('advertisementManagement.imageSuccess', 'تم تحديث صورة الإعلان بنجاح.'))
                closeImageModal()
                fetchAds()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل تحديث الصورة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشل تحديث الصورة.'))
        } finally {
            setImageUploading(false)
        }
    }

    // Target Type Badge Render
    const renderTargetBadge = (type: AdvertisementTargetType, courseName?: string | null, externalUrl?: string | null) => {
        switch (type) {
            case AdvertisementTargetType.Course:
                return (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-200">
                        <HiOutlineBookOpen className="text-sm shrink-0" />
                        <span className="truncate max-w-xs">{courseName || t('advertisementManagement.course', 'دورة تدريبية')}</span>
                    </div>
                )
            case AdvertisementTargetType.ExternalUrl:
                return (
                    <a
                        href={externalUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-md border border-sky-200 hover:underline"
                    >
                        <HiOutlineArrowTopRightOnSquare className="text-sm shrink-0" />
                        <span className="truncate max-w-[180px] dir-ltr inline-block">{externalUrl}</span>
                    </a>
                )
            case AdvertisementTargetType.None:
            default:
                return (
                    <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md">
                        {t('advertisementManagement.none', 'ثابت (بدون إجراء)')}
                    </span>
                )
        }
    }

    // Status Badge
    const renderStatusBadge = useCallback(
        (active: boolean) => {
            if (active) {
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {t('instructorManagement.active', 'نشط')}
                    </span>
                )
            }
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                    {t('instructorManagement.inactive', 'غير نشط')}
                </span>
            )
        },
        [t],
    )

    // Table Columns
    const columns: ColumnDef<AdvertisementResponse>[] = useMemo(
        () => [
            {
                header: () => t('advertisementManagement.image', 'صورة الإعلان'),
                accessorKey: 'imageUrl',
                enableSorting: false,
                size: 140,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex justify-center w-full">
                            <Avatar
                                shape="round"
                                src={row.imageUrl || undefined}
                                icon={<HiOutlinePhoto />}
                                size={54}
                                className="border border-gray-200 dark:border-gray-700 object-cover shadow-2xs"
                            />
                        </div>
                    )
                },
            },
            {
                header: () => t('advertisementManagement.targetType', 'نوع التوجيه'),
                accessorKey: 'targetType',
                enableSorting: false,
                size: 220,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex justify-center w-full">
                            {renderTargetBadge(row.targetType, row.courseName, row.externalUrl)}
                        </div>
                    )
                },
            },
            {
                header: () => t('advertisementManagement.isActive', 'الحالة'),
                accessorKey: 'isActive',
                enableSorting: false,
                size: 130,
                cell: (props) => (
                    <div className="flex justify-center w-full">
                        {renderStatusBadge(props.row.original.isActive)}
                    </div>
                ),
            },
            {
                header: () => t('advertisementManagement.startAt', 'تاريخ البدء / الانتهاء'),
                accessorKey: 'startAt',
                enableSorting: false,
                size: 180,
                cell: (props) => {
                    const row = props.row.original
                    return (
                        <div className="flex flex-col items-center justify-center w-full text-xs space-y-0.5">
                            <span className="text-gray-700 dark:text-gray-300 dir-ltr font-medium">
                                Start: {row.startAt ? dayjs(row.startAt).format('YYYY/MM/DD') : '-'}
                            </span>
                            <span className="text-gray-400 dir-ltr font-medium">
                                End: {row.endAt ? dayjs(row.endAt).format('YYYY/MM/DD') : '-'}
                            </span>
                        </div>
                    )
                },
            },
            {
                header: () => t('common.actions', 'إجراءات'),
                id: 'action',
                enableSorting: false,
                size: 160,
                cell: (props) => {
                    const row = props.row.original
                    const isToggling = togglingId === row.id
                    return (
                        <div className="flex items-center justify-center gap-2 w-full">
                            <Tooltip title={t('advertisementManagement.changeImage', 'تغيير صورة الإعلان')}>
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-all focus:outline-none"
                                    onClick={() => openImageModal(row)}
                                >
                                    <HiOutlineCloudArrowUp className="text-lg" />
                                </button>
                            </Tooltip>
                            <Tooltip title={t('advertisementManagement.isActive', 'تبديل الحالة')}>
                                <div className="flex items-center">
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
                                    onClick={() => openEditModal(row)}
                                >
                                    <HiOutlinePencil className="text-lg" />
                                </button>
                            </Tooltip>
                            <Tooltip title={t('common.delete', 'حذف')}>
                                <button
                                    type="button"
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all focus:outline-none"
                                    onClick={() => openDeleteDialog(row)}
                                >
                                    <HiOutlineTrash className="text-lg" />
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
                        {t('advertisementManagement.title', 'إدارة الإعلانات والبنرات')}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {t('advertisementManagement.description', 'إدارة البنرات الإعلانية، ونوع التوجيه، والحملات المجدولة.')}
                    </p>
                </div>
                <Button variant="solid" icon={<HiOutlinePlus />} onClick={openCreateModal}>
                    {t('advertisementManagement.addAdvertisement', 'إضافة إعلان جديد')}
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <Input
                            placeholder={t('advertisementManagement.searchPlaceholder', 'البحث باسم الدورة أو الرابط...')}
                            value={searchTerm}
                            prefix={<HiOutlineMagnifyingGlass className="text-lg text-gray-400" />}
                            onChange={handleSearch}
                        />
                    </div>
                    <div>
                        <Select<TargetTypeOption>
                            placeholder={t('advertisementManagement.targetType', 'نوع التوجيه')}
                            options={targetTypeOptions}
                            value={targetTypeOptions.find((o) => o.value === targetTypeFilter) || targetTypeOptions[0]}
                            onChange={(opt) => {
                                setTargetTypeFilter(opt ? opt.value : null)
                                setPageNumber(1)
                            }}
                        />
                    </div>
                    <div>
                        <Select<StatusOption>
                            placeholder={t('instructorManagement.filterByStatus', 'تصفية حسب الحالة')}
                            options={statusOptions}
                            value={statusOptions.find((o) => o.value === statusFilter) || statusOptions[0]}
                            onChange={(opt) => {
                                setStatusFilter(opt ? opt.value : null)
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
                    data={ads}
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
                ) : ads.length === 0 ? (
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                        <p className="text-center text-gray-400 text-sm py-10">
                            {t('common.noDataFound', 'لا توجد بيانات للعرض')}
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {ads.map((ad) => (
                            <Card key={ad.id} className="shadow-xs border border-gray-100 dark:border-gray-800">
                                <div className="flex items-start gap-3">
                                    <Avatar
                                        shape="round"
                                        src={ad.imageUrl || undefined}
                                        icon={<HiOutlinePhoto />}
                                        size={56}
                                        className="border border-gray-200 dark:border-gray-700 object-cover shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                {renderTargetBadge(ad.targetType, ad.courseName, ad.externalUrl)}
                                            </div>
                                            <div className="shrink-0">{renderStatusBadge(ad.isActive)}</div>
                                        </div>

                                        {(ad.startAt || ad.endAt) && (
                                            <div className="flex flex-col text-[11px] text-gray-500 dark:text-gray-400 mt-2 space-y-0.5 dir-ltr">
                                                <span>Start: {ad.startAt ? dayjs(ad.startAt).format('YYYY/MM/DD') : '-'}</span>
                                                <span>End: {ad.endAt ? dayjs(ad.endAt).format('YYYY/MM/DD') : '-'}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2">
                                                <Switcher
                                                    checked={ad.isActive}
                                                    isLoading={togglingId === ad.id}
                                                    onChange={() => handleToggleStatus(ad)}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/40 transition-all"
                                                    onClick={() => openImageModal(ad)}
                                                >
                                                    <HiOutlineCloudArrowUp className="text-lg" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-all"
                                                    onClick={() => openEditModal(ad)}
                                                >
                                                    <HiOutlinePencil className="text-lg" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/40 transition-all"
                                                    onClick={() => openDeleteDialog(ad)}
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
            <Dialog isOpen={modalOpen} onClose={closeModal} onRequestClose={closeModal} width={560}>
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {editingAd
                            ? t('advertisementManagement.editAdvertisement', 'تعديل بيانات الإعلان')
                            : t('advertisementManagement.createAdvertisement', 'إنشاء إعلان جديد')}
                    </h3>

                    {modalApiError && (
                        <Alert type="danger" className="mb-4" onClose={() => setModalApiError('')}>
                            {modalApiError}
                        </Alert>
                    )}

                    <form onSubmit={handleFormSubmit} className="space-y-5">
                        {/* File Upload (Required on Create) */}
                        {!editingAd && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('advertisementManagement.image', 'صورة الإعلان')} <span className="text-red-500">*</span>
                                </label>
                                <Upload
                                    draggable
                                    uploadLimit={1}
                                    accept="image/*"
                                    onChange={(files) => {
                                        setAdFile(files[0] || null)
                                        if (formErrors.file) setFormErrors((prev) => ({ ...prev, file: undefined }))
                                    }}
                                    showList={true}
                                >
                                    <div className="my-2 text-center">
                                         <HiOutlineCloudArrowUp className="text-3xl mx-auto text-indigo-500 mb-2" />
                                         <p className="text-xs font-semibold text-gray-600">
                                             {t(
                                                 'advertisementManagement.dragDropAdImage',
                                                 'انقر أو اسحب صورة الإعلان هنا',
                                             )}
                                         </p>
                                    </div>
                                </Upload>
                                {formErrors.file && (
                                    <span className="text-xs text-red-500 mt-1 block">{formErrors.file}</span>
                                )}
                            </div>
                        )}

                        {/* Target Type Select */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('advertisementManagement.targetType', 'نوع التوجيه عند النقر')} <span className="text-red-500">*</span>
                            </label>
                            <Select<TargetTypeOption>
                                options={targetTypeOptions.filter((o) => o.value !== null) as TargetTypeOption[]}
                                value={targetTypeOptions.find((o) => o.value === targetType)}
                                onChange={(opt) => {
                                    if (opt && opt.value !== null) {
                                        setTargetType(opt.value)
                                        setFormErrors({})
                                    }
                                }}
                            />
                        </div>

                        {/* Conditional Field: Course Selection if TargetType = 2 (Course) */}
                        {targetType === AdvertisementTargetType.Course && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('advertisementManagement.courseSelection', 'اختر الدورة المرتبطة')} <span className="text-red-500">*</span>
                                </label>
                                <Select<CourseOption>
                                    placeholder={t(
                                        'advertisementManagement.selectCoursePlaceholder',
                                        'اختر الدورة...',
                                    )}
                                    options={courseOptions}
                                    value={courseOptions.find((c) => c.value === selectedCourseId) || null}
                                    onChange={(opt) => {
                                        setSelectedCourseId(opt ? opt.value : null)
                                        if (formErrors.courseId) setFormErrors((prev) => ({ ...prev, courseId: undefined }))
                                    }}
                                />
                                {formErrors.courseId && (
                                    <span className="text-xs text-red-500 mt-1 block">{formErrors.courseId}</span>
                                )}
                            </div>
                        )}

                        {/* Conditional Field: External URL if TargetType = 3 (ExternalUrl) */}
                        {targetType === AdvertisementTargetType.ExternalUrl && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('advertisementManagement.urlInput', 'الرابط الخارجي')} <span className="text-red-500">*</span>
                                </label>
                                <Input
                                    type="url"
                                    placeholder="https://example.com/promo"
                                    value={externalUrl}
                                    invalid={!!formErrors.externalUrl}
                                    onChange={(e) => {
                                        setExternalUrl(e.target.value)
                                        if (formErrors.externalUrl) setFormErrors((prev) => ({ ...prev, externalUrl: undefined }))
                                    }}
                                />
                                {formErrors.externalUrl && (
                                    <span className="text-xs text-red-500 mt-1 block">{formErrors.externalUrl}</span>
                                )}
                            </div>
                        )}

                        {/* Campaign Start / End Dates */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    {t('advertisementManagement.startAt', 'تاريخ البدء (اختياري)')}
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={startAt}
                                    onChange={(e) => setStartAt(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    {t('advertisementManagement.endAt', 'تاريخ الانتهاء (اختياري)')}
                                </label>
                                <Input
                                    type="datetime-local"
                                    value={endAt}
                                    onChange={(e) => setEndAt(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Active Switcher */}
                        <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                {t('advertisementManagement.isActive', 'تفعيل الإعلان')}
                            </span>
                            <Switcher checked={isActive} onChange={(checked) => setIsActive(checked)} />
                        </div>

                        <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant="plain" onClick={closeModal} disabled={modalSubmitting}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button type="submit" variant="solid" loading={modalSubmitting}>
                                {editingAd
                                    ? t('common.save', 'حفظ التغييرات')
                                    : t('advertisementManagement.createAdvertisement', 'إنشاء الإعلان')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

            {/* Replace Image Modal */}
            <Dialog isOpen={imageModalOpen} onClose={closeImageModal} width={480}>
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold mb-4">{t('advertisementManagement.changeImage', 'تغيير صورة الإعلان')}</h3>
                    <div className="mb-6">
                        <Upload
                            draggable
                            uploadLimit={1}
                            accept="image/*"
                            onChange={(files) => setReplaceFile(files[0] || null)}
                            showList={true}
                        >
                            <div className="my-2 text-center">
                                <HiOutlineCloudArrowUp className="text-3xl mx-auto text-indigo-500 mb-2" />
                                <p className="text-xs font-semibold text-gray-600">
                                    {t(
                                        'advertisementManagement.selectNewAdImage',
                                        'اختر صورة جديدة للإعلان',
                                    )}
                                </p>
                            </div>
                        </Upload>
                        {imageUploading && imageUploadProgress > 0 && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{t('common.uploadingFile', 'جاري رفع الملف...')}</span>
                                    <span>{imageUploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                    <div
                                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                                        style={{ width: `${imageUploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="plain" onClick={closeImageModal} disabled={imageUploading}>
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button variant="solid" disabled={!replaceFile} loading={imageUploading} onClick={handleReplaceImage}>
                            {t('common.save', 'حفظ الصورة')}
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
                onConfirm={handleDeleteAd}
                type="danger"
                title={t('advertisementManagement.confirmDeleteTitle', 'تأكيد حذف الإعلان')}
                confirmButtonProps={{ loading: deleting }}
            >
                <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t('advertisementManagement.confirmDeleteMsg', 'هل أنت متأكد من حذف هذا الإعلان؟')}
                </p>
            </ConfirmDialog>
        </div>
    )
}

export default AdvertisementsList
