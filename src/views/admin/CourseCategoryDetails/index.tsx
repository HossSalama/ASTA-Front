import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineCalendar,
    HiOutlineClock,
    HiOutlineLanguage,
    HiOutlineUser,
    HiOutlinePencil,
} from 'react-icons/hi2'
import {
    apiGetCourseCategoryById,
    apiUpdateCourseCategory,
    apiToggleCourseCategoryStatus,
} from '@/services/CourseCategoryService'
import type { CourseCategoryDetailResponse } from '@/@types/courseCategory'
import { useLocaleStore } from '@/store/localeStore'

interface FormErrors {
    nameAr?: string
    nameEn?: string
}

const CourseCategoryDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'

    const [category, setCategory] =
        useState<CourseCategoryDetailResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [toggling, setToggling] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
    const [nameAr, setNameAr] = useState<string>('')
    const [nameEn, setNameEn] = useState<string>('')
    const [formErrors, setFormErrors] = useState<FormErrors>({})
    const [modalSubmitting, setModalSubmitting] = useState<boolean>(false)
    const [modalApiError, setModalApiError] = useState<string>('')

    // Fetch Details
    const fetchCategoryDetails = useCallback(() => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        apiGetCourseCategoryById(Number(id))
            .then((res) => {
                if (res?.status && res.data) {
                    setCategory(res.data)
                } else {
                    setErrorMsg(
                        res?.message ||
                            t(
                                'courseCategoryManagement.failedFetchDetails',
                                'فشل جلب تفاصيل التصنيف.',
                            ),
                    )
                }
            })
            .catch((err: unknown) => {
                const errorObj = err as {
                    response?: { data?: { message?: string } }
                    message?: string
                }
                setErrorMsg(
                    errorObj?.response?.data?.message ||
                        errorObj.message ||
                        t(
                            'courseCategoryManagement.failedFetchDetails',
                            'فشل جلب تفاصيل التصنيف.',
                        ),
                )
            })
            .finally(() => {
                setLoading(false)
            })
    }, [id, t])

    useEffect(() => {
        fetchCategoryDetails()
    }, [fetchCategoryDetails])

    // Toggle Status
    const handleToggleStatus = async () => {
        if (!category) return
        setToggling(true)
        setSuccessMsg('')
        setErrorMsg('')
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
                fetchCategoryDetails()
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
                    t('courseCategoryManagement.failedToggle', 'فشلت العملية.'),
            )
        } finally {
            setToggling(false)
        }
    }

    // Open Edit Modal
    const openEditModal = () => {
        if (!category) return
        setNameAr(category.nameAr)
        setNameEn(category.nameEn)
        setFormErrors({})
        setModalApiError('')
        setEditModalOpen(true)
    }

    // Submit Edit Form
    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!category) return

        const errors: FormErrors = {}
        if (!nameAr.trim()) {
            errors.nameAr = t(
                'courseCategoryManagement.nameArRequired',
                'الاسم بالعربية مطلوب',
            )
        }
        if (!nameEn.trim()) {
            errors.nameEn = t(
                'courseCategoryManagement.nameEnRequired',
                'الاسم بالإنجليزية مطلوب',
            )
        }
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        setModalSubmitting(true)
        setModalApiError('')
        setFormErrors({})

        try {
            const res = await apiUpdateCourseCategory(category.id, {
                nameAr: nameAr.trim(),
                nameEn: nameEn.trim(),
            })

            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'courseCategoryManagement.updateSuccess',
                            'تم تحديث التصنيف بنجاح.',
                        ),
                )
                setEditModalOpen(false)
                fetchCategoryDetails()
            } else {
                setModalApiError(
                    res?.message ||
                        t(
                            'courseCategoryManagement.failedUpdate',
                            'فشل تحديث التصنيف.',
                        ),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setModalApiError(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('courseCategoryManagement.failedUpdate', 'فشلت العملية.'),
            )
        } finally {
            setModalSubmitting(false)
        }
    }

    const BackIcon = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    const renderStatusBadge = (active: boolean) => {
        if (active) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 shadow-2xs">
                    <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                    {t('courseCategoryManagement.active', 'نشط')}
                </span>
            )
        }
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full shrink-0 bg-gray-400" />
                {t('courseCategoryManagement.inactive', 'غير نشط')}
            </span>
        )
    }

    if (loading && !category) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="40px" />
            </div>
        )
    }

    if (errorMsg && !category) {
        return (
            <div className="w-full p-4 flex flex-col gap-4 text-start">
                <div>
                    <Link to="/admin/course-categories">
                        <Button size="sm" icon={<BackIcon />}>
                            {t(
                                'courseCategoryManagement.backToList',
                                'العودة إلى تصنيفات الدورات',
                            )}
                        </Button>
                    </Link>
                </div>
                <Alert type="danger">{errorMsg}</Alert>
            </div>
        )
    }

    if (!category) return <></>

    return (
        <div className="w-full p-4 flex flex-col gap-6 text-start">
            {/* Feedback Alerts */}
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

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/admin/course-categories">
                        <Button size="sm" variant="default" icon={<BackIcon />} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {category.nameAr}
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400 dir-ltr text-right block font-medium">
                            {category.nameEn}
                        </span>
                    </div>
                </div>

                {/* Actions: Edit Button + Status Switcher & Badge */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-100 dark:border-gray-700">
                        <Switcher
                            checked={category.isActive}
                            isLoading={toggling}
                            onChange={handleToggleStatus}
                        />
                        {renderStatusBadge(category.isActive)}
                    </div>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlinePencil />}
                        onClick={openEditModal}
                    >
                        {t('courseCategoryManagement.editCategory', 'تعديل التصنيف')}
                    </Button>
                </div>
            </div>

            {/* Main Content Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <div className="pb-6 mb-6 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {t(
                                'courseCategoryManagement.categoryDetails',
                                'تفاصيل تصنيف الدورة',
                            )}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {t(
                                'courseCategoryManagement.detailsSubtitle',
                                'الأسماء والبيانات التفصيلية لتصنيف الدورة التدريبية.',
                            )}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Arabic Name */}
                    <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <HiOutlineLanguage className="text-xl" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('courseCategoryManagement.nameAr', 'الاسم بالعربية')}
                            </span>
                            <span className="text-base font-bold text-gray-800 dark:text-gray-100">
                                {category.nameAr}
                            </span>
                        </div>
                    </div>

                    {/* English Name */}
                    <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <HiOutlineLanguage className="text-xl" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('courseCategoryManagement.nameEn', 'الاسم بالإنجليزية')}
                            </span>
                            <span className="text-base font-bold text-gray-800 dark:text-gray-100 dir-ltr text-right block">
                                {category.nameEn}
                            </span>
                        </div>
                    </div>

                    {/* Created At */}
                    <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <HiOutlineCalendar className="text-xl" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('courseCategoryManagement.createdAt', 'تاريخ الإنشاء')}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 dir-ltr inline-block">
                                {category.createdAt
                                    ? dayjs(category.createdAt).format('YYYY/MM/DD - hh:mm A')
                                    : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Updated At */}
                    <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <HiOutlineClock className="text-xl" />
                        </div>
                        <div>
                            <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                {t('courseCategoryManagement.updatedAt', 'تاريخ التحديث')}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 dir-ltr inline-block">
                                {category.updatedAt
                                    ? dayjs(category.updatedAt).format('YYYY/MM/DD - hh:mm A')
                                    : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Created By Audit User */}
                    {category.createdBy && (
                        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                                <HiOutlineUser className="text-xl" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                    {t('courseCategoryManagement.createdBy', 'تم الإنشاء بواسطة')}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {category.createdBy.firstName} {category.createdBy.lastName}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Updated By Audit User */}
                    {category.updatedBy && (
                        <div className="flex items-center gap-3.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                                <HiOutlineUser className="text-xl" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block mb-0.5 font-medium">
                                    {t('courseCategoryManagement.updatedBy', 'تم التحديث بواسطة')}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {category.updatedBy.firstName} {category.updatedBy.lastName}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Edit Category Dialog */}
            <Dialog
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                onRequestClose={() => setEditModalOpen(false)}
            >
                <div className="p-4 text-start">
                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                        {t('courseCategoryManagement.editCategory', 'تعديل التصنيف')}
                    </h4>

                    {modalApiError && (
                        <Alert type="danger" className="mb-4">
                            {modalApiError}
                        </Alert>
                    )}

                    <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                        {/* Name Arabic */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('courseCategoryManagement.nameAr', 'الاسم بالعربية')}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={nameAr}
                                maxLength={100}
                                placeholder={t(
                                    'courseCategoryManagement.nameArPlaceholder',
                                    'أدخل الاسم بالعربية',
                                )}
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

                        {/* Name English */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t(
                                    'courseCategoryManagement.nameEn',
                                    'الاسم بالإنجليزية',
                                )}{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                value={nameEn}
                                maxLength={100}
                                placeholder={t(
                                    'courseCategoryManagement.nameEnPlaceholder',
                                    'أدخل الاسم بالإنجليزية',
                                )}
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

                        {/* Modal Footer Actions */}
                        <div className="flex justify-end items-center gap-3 mt-4">
                            <Button
                                type="button"
                                variant="default"
                                onClick={() => setEditModalOpen(false)}
                            >
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={modalSubmitting}
                            >
                                {t('common.save', 'حفظ التغييرات')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>
        </div>
    )
}

export default CourseCategoryDetails
