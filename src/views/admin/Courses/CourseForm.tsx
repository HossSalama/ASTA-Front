import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Alert from '@/components/ui/Alert'
import Loading from '@/components/shared/Loading'
import useTranslation from '@/utils/hooks/useTranslation'
import { HiOutlineArrowRight } from 'react-icons/hi2'
import {
    apiCreateCourse,
    apiGetCourseById,
    apiUpdateCourse,
} from '@/services/CourseAdminService'
import { apiGetAdminCourseCategories } from '@/services/CourseCategoryService'
import { apiGetPaginatedInstructors } from '@/services/InstructorAdminService'
import DatePicker from '@/components/ui/DatePicker'
import type { CreateCourseDto, UpdateCourseDto, InstructorResponse } from '@/@types/adminManagement'
import type { CourseCategoryResponse } from '@/@types/courseCategory'
import type { CourseDeliveryType } from '@/@types/courseContent'
import { isLiveCourse, getCourseStartDate } from '@/@types/courseContent'

interface SelectOption {
    value: number
    label: string
}

interface FormErrors {
    categoryId?: string
    instructorId?: string
    name?: string
    shortDescription?: string
    description?: string
    price?: string
    language?: string
    deliveryType?: string
    startDate?: string
}

const CourseForm = () => {
    const { id } = useParams<{ id: string }>()
    const isEditMode = Boolean(id)
    const navigate = useNavigate()
    const { t } = useTranslation()

    // Form fields
    const [categoryId, setCategoryId] = useState<number | null>(null)
    const [instructorId, setInstructorId] = useState<number | null>(null)
    const [name, setName] = useState<string>('')
    const [shortDescription, setShortDescription] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [price, setPrice] = useState<number | string>('')
    const [language, setLanguage] = useState<string>('Arabic')
    const [deliveryType, setDeliveryType] = useState<CourseDeliveryType>('Recorded')
    const [startDate, setStartDate] = useState<Date | null>(null)

    // Dropdown Options
    const [categories, setCategories] = useState<SelectOption[]>([])
    const [instructors, setInstructors] = useState<SelectOption[]>([])

    // States
    const [loadingData, setLoadingData] = useState<boolean>(true)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [formErrors, setFormErrors] = useState<FormErrors>({})

    // Helper functions to fetch categories & instructors with search
    const fetchCategoryOptions = useCallback(async (search?: string) => {
        try {
            const catRes = await apiGetAdminCourseCategories({
                pageNumber: 1,
                pageSize: 50,
                ...(search ? { searchTerm: search } : {}),
            })
            if (catRes?.status && catRes.data) {
                const catList: CourseCategoryResponse[] = Array.isArray(catRes.data)
                    ? catRes.data
                    : (catRes.data.items || [])
                const catOptions: SelectOption[] = catList.map((cat: CourseCategoryResponse) => ({
                    value: cat.id,
                    label: cat.nameAr ? `${cat.nameAr} (${cat.nameEn})` : cat.nameEn,
                }))
                setCategories(catOptions)
            }
        } catch (e) {
            // Ignore
        }
    }, [t])

    const fetchInstructorOptions = useCallback(async (search?: string) => {
        try {
            const instRes = await apiGetPaginatedInstructors({
                pageNumber: 1,
                pageSize: 50,
                ...(search ? { searchTerm: search } : {}),
            })
            if (instRes?.status && instRes.data) {
                const instList: InstructorResponse[] = Array.isArray(instRes.data)
                    ? instRes.data
                    : (instRes.data.items || [])
                const instOptions: SelectOption[] = instList.map((inst: InstructorResponse) => ({
                    value: inst.id,
                    label: inst.name,
                }))
                setInstructors(instOptions)
            }
        } catch (e) {
            // Ignore
        }
    }, [t])

    // Fetch initial options and course details if editing
    const initData = useCallback(async () => {
        setLoadingData(true)
        setErrorMsg('')
        try {
            await Promise.all([
                fetchCategoryOptions(),
                fetchInstructorOptions(),
            ])

            // Load Course if editing
            if (isEditMode && id) {
                const courseRes = await apiGetCourseById(Number(id))
                if ((courseRes?.isSuccess || courseRes?.status) && courseRes.data) {
                    const data = courseRes.data
                    setName(data.name)
                    setShortDescription(data.shortDescription)
                    setDescription(data.description || '')
                    setPrice(data.price)
                    setLanguage(data.language)
                    if (data.category) setCategoryId(data.category.id)
                    if (data.instructor) setInstructorId(data.instructor.id)
                    if (isLiveCourse(data.deliveryType, data.sections)) {
                        setDeliveryType('Live')
                        const effectiveStartDate = getCourseStartDate(data)
                        if (effectiveStartDate) {
                            setStartDate(new Date(effectiveStartDate))
                        }
                    } else {
                        setDeliveryType('Recorded')
                    }
                } else {
                    setErrorMsg(courseRes?.message || t('common.operationFailed', 'فشل جلب بيانات الدورة.'))
                }
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'حدث خطأ أثناء تحميل البيانات.'),
            )
        } finally {
            setLoadingData(false)
        }
    }, [id, isEditMode, t, fetchCategoryOptions, fetchInstructorOptions])

    useEffect(() => {
        initData()
    }, [initData])

    // Form Validation
    const validateForm = (): boolean => {
        const errors: FormErrors = {}
        let isValid = true

        if (!categoryId) {
            errors.categoryId = t('courseCategoryManagement.categoryRequired', 'يرجى اختيار التصنيف.')
            isValid = false
        }
        if (!instructorId) {
            errors.instructorId = t('instructorManagement.instructorRequired', 'يرجى اختيار المحاضر.')
            isValid = false
        }
        if (!name.trim()) {
            errors.name = t('courseManagement.nameRequired', 'يرجى إدخال اسم الدورة.')
            isValid = false
        }
        if (!shortDescription.trim()) {
            errors.shortDescription = t('courseManagement.shortDescRequired', 'يرجى إدخال الوصف المختصر.')
            isValid = false
        }
        if (!description.trim()) {
            errors.description = t('courseManagement.descRequired', 'يرجى إدخال الوصف التفصيلي.')
            isValid = false
        }
        if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
            errors.price = t('courseManagement.priceInvalid', 'يرجى إدخال سعر صحيح.')
            isValid = false
        }
        if (!language.trim()) {
            errors.language = t('courseManagement.languageRequired', 'يرجى إدخال لغة الدورة.')
            isValid = false
        }
        if (!deliveryType) {
            errors.deliveryType = t('courseManagement.deliveryTypeRequired', 'يرجى تحديد نوع تقديم الدورة.')
            isValid = false
        }
        if (deliveryType === 'Live') {
            if (!startDate) {
                errors.startDate = t('courseManagement.startDateRequired', 'تاريخ ووقت بدء الدورة مطلوب للدورات المباشرة.')
                isValid = false
            } else if (new Date(startDate).getTime() <= Date.now()) {
                errors.startDate = t('courseManagement.startDateMustBeFuture', 'يجب أن يكون تاريخ بدء الدورة في المستقبل.')
                isValid = false
            }
        }

        setFormErrors(errors)
        return isValid
    }

    // Submit Handler
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setSubmitting(true)
        setErrorMsg('')

        try {
            if (isEditMode && id) {
                const payload: UpdateCourseDto = {
                    categoryId: Number(categoryId),
                    instructorId: Number(instructorId),
                    name: name.trim(),
                    shortDescription: shortDescription.trim(),
                    description: description.trim(),
                    price: Number(price),
                    language: language.trim(),
                    startDate: deliveryType === 'Live' && startDate ? new Date(startDate).toISOString() : null,
                }
                const res = await apiUpdateCourse(Number(id), payload)
                if (res?.isSuccess || res?.status) {
                    navigate(`/admin/courses/${id}`)
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشل تحديث الدورة.'))
                }
            } else {
                const payload: CreateCourseDto = {
                    categoryId: Number(categoryId),
                    instructorId: Number(instructorId),
                    name: name.trim(),
                    shortDescription: shortDescription.trim(),
                    description: description.trim(),
                    price: Number(price),
                    language: language.trim(),
                    deliveryType,
                    startDate: deliveryType === 'Live' && startDate ? new Date(startDate).toISOString() : null,
                }
                const res = await apiCreateCourse(payload)
                if ((res?.isSuccess || res?.status) && res.data) {
                    // Redirect to detail view of newly created course (which starts in Draft)
                    navigate(`/admin/courses/${res.data.id}`)
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشل إنشاء الدورة.'))
                }
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'حدث خطأ أثناء تنفيذ العملية.'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    if (loadingData) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loading loading={true} />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3">
                <Link to="/admin/courses">
                    <Button shape="circle" variant="plain" icon={<HiOutlineArrowRight className="text-xl" />} />
                </Link>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {isEditMode
                            ? t('courseManagement.editCourse', 'تعديل بيانات الدورة')
                            : t('courseManagement.createCourse', 'إنشاء دورة تدريبية جديدة')}
                    </h2>
                    <p className="text-gray-500 text-xs mt-0.5">
                        {!isEditMode && 'تنويه: يتم إنشاء كافة الدورات الجديدة تلقائياً في حالة (مسودة)'}
                    </p>
                </div>
            </div>

            {/* Error Notification */}
            {errorMsg && (
                <Alert type="danger" onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {/* Form Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Select */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('courseManagement.category', 'التصنيف')} <span className="text-red-500">*</span>
                            </label>
                            <Select<SelectOption>
                                isSearchable
                                placeholder="اختر التصنيف..."
                                options={categories}
                                value={categories.find((c) => c.value === categoryId) || null}
                                onInputChange={(val) => {
                                    if (val) fetchCategoryOptions(val)
                                }}
                                onChange={(opt) => {
                                    setCategoryId(opt ? opt.value : null)
                                    if (formErrors.categoryId) setFormErrors((prev) => ({ ...prev, categoryId: undefined }))
                                }}
                            />
                            {formErrors.categoryId && (
                                <span className="text-xs text-red-500 mt-1 block">{formErrors.categoryId}</span>
                            )}
                        </div>

                        {/* Instructor Select */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('courseManagement.instructor', 'المحاضر')} <span className="text-red-500">*</span>
                            </label>
                            <Select<SelectOption>
                                isSearchable
                                placeholder="اختر المحاضر..."
                                options={instructors}
                                value={instructors.find((i) => i.value === instructorId) || null}
                                onInputChange={(val) => {
                                    if (val) fetchInstructorOptions(val)
                                }}
                                onChange={(opt) => {
                                    setInstructorId(opt ? opt.value : null)
                                    if (formErrors.instructorId) setFormErrors((prev) => ({ ...prev, instructorId: undefined }))
                                }}
                            />
                            {formErrors.instructorId && (
                                <span className="text-xs text-red-500 mt-1 block">{formErrors.instructorId}</span>
                            )}
                        </div>
                    </div>

                    {/* Delivery Type & Start Date */}
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('courseManagement.deliveryType', 'نوع تقديم الدورة')} <span className="text-red-500">*</span>
                            </label>
                            {isEditMode ? (
                                <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                                        deliveryType === 'Live'
                                            ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300'
                                    }`}>
                                        {deliveryType === 'Live' ? '🔴 دورة بث مباشر (Live)' : '📁 دورة مسجلة (Recorded)'}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {t('courseManagement.deliveryTypeImmutableHint', '(نوع الدورة ثابت ولا يمكن تغييره بعد الإنشاء)')}
                                    </span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <label
                                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            deliveryType === 'Recorded'
                                                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="deliveryType"
                                            value="Recorded"
                                            checked={deliveryType === 'Recorded'}
                                            onChange={() => {
                                                setDeliveryType('Recorded')
                                                setStartDate(null)
                                                if (formErrors.deliveryType) setFormErrors((p) => ({ ...p, deliveryType: undefined }))
                                                if (formErrors.startDate) setFormErrors((p) => ({ ...p, startDate: undefined }))
                                            }}
                                            className="mt-1"
                                        />
                                        <div>
                                            <span className="text-sm font-bold text-gray-800 dark:text-gray-100 block">
                                                📁 دورة مسجلة (Recorded)
                                            </span>
                                            <span className="text-xs text-gray-500 block mt-0.5">
                                                دورة ذاتية التعلم تحتوي على فيديوهات مسجلة، ملفات وكويزات.
                                            </span>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                                            deliveryType === 'Live'
                                                ? 'border-red-600 bg-red-50/60 dark:bg-red-950/40 shadow-xs'
                                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="deliveryType"
                                            value="Live"
                                            checked={deliveryType === 'Live'}
                                            onChange={() => {
                                                setDeliveryType('Live')
                                                if (formErrors.deliveryType) setFormErrors((p) => ({ ...p, deliveryType: undefined }))
                                            }}
                                            className="mt-1"
                                        />
                                        <div>
                                            <span className="text-sm font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                                🔴 دورة تفاعلية مباشرة (Live)
                                            </span>
                                            <span className="text-xs text-gray-500 block mt-0.5">
                                                دورة تفاعلية تتضمن جلسات ولقاءات مباشرة (أونلاين أو حضورية) وموعد بدء محدد.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            )}
                            {formErrors.deliveryType && (
                                <span className="text-xs text-red-500 mt-1 block">{formErrors.deliveryType}</span>
                            )}
                        </div>

                        {/* Start Date Picker (Only for Live Courses) */}
                        {deliveryType === 'Live' && (
                            <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('courseManagement.startDate', 'تاريخ وتوقيت بدء الدورة')} <span className="text-red-500">*</span>
                                </label>
                                <div className="max-w-md">
                                    <DatePicker.DateTimepicker
                                        placeholder="اختر تاريخ وتوقيت البدء..."
                                        value={startDate}
                                        onChange={(val) => {
                                            setStartDate(val)
                                            if (formErrors.startDate) setFormErrors((p) => ({ ...p, startDate: undefined }))
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {t('courseManagement.startDateHint', 'يجب أن يكون التاريخ والوقت في المستقبل. سيتم تحويل التوقيت تلقائياً إلى توقيت UTC.')}
                                </p>
                                {formErrors.startDate && (
                                    <span className="text-xs text-red-500 mt-1 block">{formErrors.startDate}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Course Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('courseManagement.name', 'اسم الدورة التدريبية')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="text"
                            placeholder="مثال: تطوير تطبيقات الويب باستخدام React & .NET"
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

                    {/* Short Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('courseManagement.shortDescription', 'الوصف المختصر')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            textArea
                            rows={2}
                            placeholder="نبذة موجزة تظهر في قائمة الدورات..."
                            value={shortDescription}
                            invalid={!!formErrors.shortDescription}
                            onChange={(e) => {
                                setShortDescription(e.target.value)
                                if (formErrors.shortDescription) setFormErrors((prev) => ({ ...prev, shortDescription: undefined }))
                            }}
                        />
                        {formErrors.shortDescription && (
                            <span className="text-xs text-red-500 mt-1 block">{formErrors.shortDescription}</span>
                        )}
                    </div>

                    {/* Full Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                            {t('courseManagement.description', 'الوصف التفصيلي للدورة')} <span className="text-red-500">*</span>
                        </label>
                        <Input
                            textArea
                            rows={5}
                            placeholder="شرح كامل للمحاور والمواضيع المغطاة..."
                            value={description}
                            invalid={!!formErrors.description}
                            onChange={(e) => {
                                setDescription(e.target.value)
                                if (formErrors.description) setFormErrors((prev) => ({ ...prev, description: undefined }))
                            }}
                        />
                        {formErrors.description && (
                            <span className="text-xs text-red-500 mt-1 block">{formErrors.description}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Price */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('courseManagement.price', 'السعر ($)')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="299.99"
                                value={price}
                                invalid={!!formErrors.price}
                                onChange={(e) => {
                                    setPrice(e.target.value)
                                    if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: undefined }))
                                }}
                            />
                            {formErrors.price && (
                                <span className="text-xs text-red-500 mt-1 block">{formErrors.price}</span>
                            )}
                        </div>

                        {/* Language */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('courseManagement.language', 'اللغة')} <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="text"
                                placeholder="Arabic / English"
                                value={language}
                                invalid={!!formErrors.language}
                                onChange={(e) => {
                                    setLanguage(e.target.value)
                                    if (formErrors.language) setFormErrors((prev) => ({ ...prev, language: undefined }))
                                }}
                            />
                            {formErrors.language && (
                                <span className="text-xs text-red-500 mt-1 block">{formErrors.language}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <Link to="/admin/courses">
                            <Button type="button" variant="plain" disabled={submitting}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                        </Link>
                        <Button type="submit" variant="solid" loading={submitting}>
                            {isEditMode
                                ? t('common.save', 'حفظ التغييرات')
                                : t('courseManagement.createCourse', 'إنشاء دورة جديدة')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

export default CourseForm
