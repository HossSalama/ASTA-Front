import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Avatar from '@/components/ui/Avatar'
import Upload from '@/components/ui/Upload'
import Tabs from '@/components/ui/Tabs'
import Loading from '@/components/shared/Loading'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowRight,
    HiOutlineBookOpen,
    HiOutlinePlus,
    HiOutlineTrash,
    HiOutlineStar,
    HiOutlineCloudArrowUp,
    HiOutlineBriefcase,
    HiOutlineClipboardDocumentCheck,
    HiOutlineChatBubbleLeftRight,
    HiOutlineQueueList,
} from 'react-icons/hi2'
import {
    apiGetCourseById,
    apiUpdateCourseStatus,
    apiUploadCourseThumbnail,
    apiDeleteCourseThumbnail,
    apiAddTargetJob,
    apiRemoveTargetJob,
    apiAddRequirement,
    apiRemoveRequirement,
} from '@/services/CourseAdminService'
import {
    CourseStatus,
    CourseDetailResponse,
    TargetJobDto,
    RequirementDto,
} from '@/@types/adminManagement'
import CourseReviewsList from './CourseReviewsList'
import CourseCurriculum from './components/CourseCurriculum'
import { formatCourseDuration } from '@/utils/formatDuration'
import { isLiveCourse, getCourseStartDate } from '@/@types/courseContent'

const { TabNav, TabList, TabContent } = Tabs

const CourseDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()

    const [course, setCourse] = useState<CourseDetailResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Status modal
    const [statusModalOpen, setStatusModalOpen] = useState<boolean>(false)
    const [selectedStatus, setSelectedStatus] = useState<CourseStatus>(CourseStatus.Draft)
    const [statusUpdating, setStatusUpdating] = useState<boolean>(false)

    // Thumbnail modal
    const [thumbModalOpen, setThumbModalOpen] = useState<boolean>(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [thumbUploading, setThumbUploading] = useState<boolean>(false)
    const [uploadProgress, setUploadProgress] = useState<number>(0)

    // Target Jobs Add modal
    const [jobModalOpen, setJobModalOpen] = useState<boolean>(false)
    const [jobTitle, setJobTitle] = useState<string>('')
    const [jobSubmitting, setJobSubmitting] = useState<boolean>(false)

    // Requirement Add modal
    const [reqModalOpen, setReqModalOpen] = useState<boolean>(false)
    const [reqDesc, setReqDesc] = useState<string>('')
    const [reqSubmitting, setReqSubmitting] = useState<boolean>(false)

    const fetchDetails = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetCourseById(Number(id))
            if ((res?.isSuccess || res?.status) && res.data) {
                setCourse(res.data)
                setSelectedStatus(res.data.status)
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل جلب تفاصيل الدورة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'فشل جلب تفاصيل الدورة.'),
            )
        } finally {
            setLoading(false)
        }
    }, [id, t])

    useEffect(() => {
        fetchDetails()
    }, [fetchDetails])

    // Update Publication Status
    const handleUpdateStatus = async () => {
        if (!course) return
        setStatusUpdating(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiUpdateCourseStatus(course.id, { status: selectedStatus })
            if ((res?.isSuccess || res?.status) && res.data) {
                setSuccessMsg(res.message || t('courseManagement.statusUpdateSuccess', 'تم تحديث حالة الدورة بنجاح.'))
                setStatusModalOpen(false)
                fetchDetails()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل تحديث الحالة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        } finally {
            setStatusUpdating(false)
        }
    }

    // Thumbnail Upload & Delete
    const handleUploadThumbnail = async () => {
        if (!course || !selectedFile) return
        setThumbUploading(true)
        setUploadProgress(0)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiUploadCourseThumbnail(course.id, selectedFile, (percent) => {
                setUploadProgress(percent)
            })
            if (res?.status) {
                setSuccessMsg(res.message || t('courseManagement.thumbnailSuccess', 'تم رفع الصورة المصغرة بنجاح.'))
                setThumbModalOpen(false)
                setSelectedFile(null)
                setUploadProgress(0)
                fetchDetails()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل رفع الصورة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        } finally {
            setThumbUploading(false)
        }
    }

    const handleDeleteThumbnail = async () => {
        if (!course) return
        setThumbUploading(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiDeleteCourseThumbnail(course.id)
            if (res?.isSuccess || res?.status) {
                setSuccessMsg(res.message || t('courseManagement.thumbnailSuccess', 'تم حذف الصورة المصغرة بنجاح.'))
                setThumbModalOpen(false)
                fetchDetails()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل حذف الصورة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        } finally {
            setThumbUploading(false)
        }
    }

    // Target Jobs Add & Remove
    const handleAddJob = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!course || !jobTitle.trim()) return
        setJobSubmitting(true)
        setErrorMsg('')
        try {
            const res = await apiAddTargetJob(course.id, { title: jobTitle.trim() })
            if (res?.isSuccess || res?.status) {
                setSuccessMsg(res.message || t('courseManagement.targetJobSuccess', 'تمت إضافة الوظيفة المستهدفة.'))
                setJobModalOpen(false)
                setJobTitle('')
                fetchDetails()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشلت إضافة الوظيفة.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        } finally {
            setJobSubmitting(false)
        }
    }

    const handleRemoveJob = async (jobId: number) => {
        if (!course) return
        setErrorMsg('')
        try {
            const res = await apiRemoveTargetJob(course.id, jobId)
            if (res?.isSuccess || res?.status) {
                setSuccessMsg(res.message || t('common.operationFailed', 'تم الحذف بنجاح.'))
                fetchDetails()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل الحذف.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        }
    }

    // Requirements Add & Remove
    const handleAddRequirement = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!course || !reqDesc.trim()) return
        setReqSubmitting(true)
        setErrorMsg('')
        try {
            const res = await apiAddRequirement(course.id, { description: reqDesc.trim() })
            if (res?.isSuccess || res?.status) {
                setSuccessMsg(res.message || t('courseManagement.requirementSuccess', 'تمت إضافة المتطلب السابق.'))
                setReqModalOpen(false)
                setReqDesc('')
                fetchDetails()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشلت إضافة المتطلب.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        } finally {
            setReqSubmitting(false)
        }
    }

    const handleRemoveRequirement = async (reqId: number) => {
        if (!course) return
        setErrorMsg('')
        try {
            const res = await apiRemoveRequirement(course.id, reqId)
            if (res?.isSuccess || res?.status) {
                setSuccessMsg(res.message || t('common.operationFailed', 'تم الحذف بنجاح.'))
                fetchDetails()
            } else {
                setErrorMsg(res?.message || t('common.operationFailed', 'فشل الحذف.'))
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        }
    }

    const renderStatusBadge = (status: CourseStatus) => {
        switch (status) {
            case CourseStatus.Published:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {t('courseManagement.published', 'منشور')}
                    </span>
                )
            case CourseStatus.Archived:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        {t('courseManagement.archived', 'مؤرشف')}
                    </span>
                )
            case CourseStatus.Draft:
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                        {t('courseManagement.draft', 'مسودة')}
                    </span>
                )
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loading loading={true} />
            </div>
        )
    }

    if (errorMsg || !course) {
        return (
            <div className="p-4">
                <Alert type="danger" className="mb-4">
                    {errorMsg || t('common.operationFailed', 'لم يتم العثور على التفاصيل.')}
                </Alert>
                <Link to="/admin/courses">
                    <Button icon={<HiOutlineArrowRight />}>
                        {t('userManagement.backToUsersList', 'العودة إلى قائمة الدورات')}
                    </Button>
                </Link>
            </div>
        )
    }

    const isLive = isLiveCourse(course.deliveryType, course.sections)
    const liveStartDate = getCourseStartDate(course)

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/admin/courses">
                        <Button shape="circle" variant="plain" icon={<HiOutlineArrowRight className="text-xl" />} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {course.name}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="twoTone"
                        onClick={() => setStatusModalOpen(true)}
                    >
                        {t('courseManagement.changeStatus', 'تغيير حالة النشر')}
                    </Button>
                    <Link to={`/admin/courses/${course.id}/edit`}>
                        <Button variant="solid">
                            {t('common.edit', 'تعديل الدورة')}
                        </Button>
                    </Link>
                </div>
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

            {/* Course Header Overview Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-2">
                    <div className="relative group shrink-0">
                        <Avatar
                            shape="round"
                            src={course.thumbnailUrl || undefined}
                            icon={<HiOutlineBookOpen />}
                            size={120}
                            className="border-2 border-indigo-500/20 shadow-md object-cover"
                        />
                        <button
                            type="button"
                            className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setThumbModalOpen(true)}
                        >
                            <HiOutlineCloudArrowUp className="text-2xl" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-3 text-center md:text-right">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-md">
                                        {course.category ? (course.category.nameAr || course.category.nameEn) : 'بدون تصنيف'}
                                    </span>
                                    {isLive ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                                            {t('courseManagement.liveCourseBadge', 'دورة بث مباشر (Live)')}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                            {t('courseManagement.recordedCourseBadge', 'دورة مسجلة (Recorded)')}
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                                    {course.name}
                                </h3>
                            </div>
                            <div>{renderStatusBadge(course.status)}</div>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            {course.shortDescription}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 pt-2 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2">
                                {course.instructor?.profileImageUrl && (
                                    <Avatar
                                        shape="circle"
                                        size={22}
                                        src={course.instructor.profileImageUrl}
                                        className="border border-gray-200"
                                    />
                                )}
                                <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {t('courseManagement.instructor', 'المحاضر')}:{' '}
                                    </span>
                                    <span>{course.instructor?.name || '-'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {t('courseManagement.price', 'السعر')}:{' '}
                                </span>
                                <span className="font-bold text-indigo-600 dir-ltr inline-block">${course.price}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {t('courseManagement.duration', 'المدة')}:{' '}
                                </span>
                                <span className="dir-ltr inline-block">
                                    {formatCourseDuration(
                                        course.duration,
                                        i18n?.language === 'en' ? 'en' : 'ar',
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {t('courseManagement.language', 'اللغة')}:{' '}
                                </span>
                                <span>{course.language}</span>
                            </div>
                            {isLive && liveStartDate && (
                                <div>
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {t('courseManagement.startDate', 'تاريخ البدء')}:{' '}
                                    </span>
                                    <span className="font-bold text-red-600 dark:text-red-400 dir-ltr inline-block">
                                        {dayjs(liveStartDate).format('YYYY-MM-DD hh:mm A')}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-1">
                                <HiOutlineStar className="text-amber-400 text-sm fill-amber-400" />
                                <span className="font-bold text-gray-800 dark:text-gray-100">{course.averageRating?.toFixed(1) || '0.0'}</span>
                                <span>({course.ratingCount || 0} {t('course.reviewsCount', 'تقييم')})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Audit & Management Tabs */}
            <Tabs defaultValue="curriculum">
                <div className="overflow-x-auto">
                    <TabList className="whitespace-nowrap">
                    <TabNav value="curriculum" icon={<HiOutlineQueueList />}>
                        {t('courseManagement.curriculum', 'محتوى الدورة والمنهاج')} ({course.sections?.length || 0})
                    </TabNav>
                    <TabNav value="overview" icon={<HiOutlineBookOpen />}>
                        {t('courseManagement.courseDetails', 'الوصف والتفاصيل')}
                    </TabNav>
                    <TabNav value="targetJobs" icon={<HiOutlineBriefcase />}>
                        {t('courseManagement.targetJobs', 'الوظائف المستهدفة')} ({course.targetJobs?.length || 0})
                    </TabNav>
                    <TabNav value="requirements" icon={<HiOutlineClipboardDocumentCheck />}>
                        {t('courseManagement.requirements', 'المتطلبات السابقة')} ({course.requirements?.length || 0})
                    </TabNav>
                    <TabNav value="reviews" icon={<HiOutlineChatBubbleLeftRight />}>
                        {t('courseManagement.reviews', 'تقييمات وآراء الطلاب')}
                    </TabNav>
                    </TabList>
                </div>

                <div className="pt-6">
                    {/* Tab 0: Curriculum (Course Content & Sections) */}
                    <TabContent value="curriculum">
                        <CourseCurriculum
                            courseId={course.id}
                            deliveryType={isLive ? 'Live' : 'Recorded'}
                            sections={course.sections || []}
                            onRefresh={fetchDetails}
                            onNotify={(msg, type) => {
                                if (type === 'danger') {
                                    setErrorMsg(msg)
                                } else {
                                    setSuccessMsg(msg)
                                }
                            }}
                        />
                    </TabContent>

                    {/* Tab 1: Overview */}
                    <TabContent value="overview">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 shadow-xs border border-gray-100 dark:border-gray-800">
                                <h4 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-3">
                                    {t('courseManagement.description', 'الوصف التفصيلي للدورة')}
                                </h4>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {course.description || '-'}
                                </p>
                            </Card>

                            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
                                <h4 className="text-base font-bold text-gray-800 dark:text-gray-100 border-b pb-2">
                                    {t('courseManagement.auditLog', 'سجل البيانات والتدقيق (Audit)')}
                                </h4>
                                <div className="text-xs space-y-3 text-gray-600 dark:text-gray-300">
                                    <div>
                                        <span className="font-semibold block text-gray-400">
                                            {t('courseManagement.createdAt', 'تاريخ الإنشاء:')}
                                        </span>
                                        <span className="dir-ltr inline-block">{course.createdAt ? dayjs(course.createdAt).format('YYYY/MM/DD hh:mm A') : '-'}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold block text-gray-400">
                                            {t('courseManagement.createdBy', 'تم الإنشاء بواسطة:')}
                                        </span>
                                        <span>{course.createdBy ? `${course.createdBy.firstName} ${course.createdBy.lastName}` : '-'}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold block text-gray-400">
                                            {t('courseManagement.lastUpdated', 'آخر تحديث:')}
                                        </span>
                                        <span className="dir-ltr inline-block">{course.updatedAt ? dayjs(course.updatedAt).format('YYYY/MM/DD hh:mm A') : '-'}</span>
                                    </div>
                                    <div>
                                        <span className="font-semibold block text-gray-400">
                                            {t('courseManagement.updatedBy', 'تم التحديث بواسطة:')}
                                        </span>
                                        <span>{course.updatedBy ? `${course.updatedBy.firstName} ${course.updatedBy.lastName}` : '-'}</span>
                                    </div>
                                    {course.thumbnailFileId && (
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                                            <span className="font-semibold block text-gray-400">
                                                {t('courseManagement.objectKey', 'معرّف ملف الغلاف (Object Key):')}
                                            </span>
                                            <code className="text-[11px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 dir-ltr inline-block break-all mt-1">
                                                {course.thumbnailFileId}
                                            </code>
                                        </div>
                                    )}
                                    {course.isDeleted && (
                                        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400">
                                            <span className="font-bold block">
                                                {t('courseManagement.deletedNote', 'ملاحظة: هذه الدورة محذوفة')}
                                            </span>
                                            {course.deletedAt && (
                                                <span className="block text-[11px]">
                                                    {t('courseManagement.deletedAt', 'تاريخ الحذف:')} {dayjs(course.deletedAt).format('YYYY/MM/DD hh:mm A')}
                                                </span>
                                            )}
                                            {course.deletedBy && (
                                                <span className="block text-[11px]">
                                                    {t('courseManagement.by', 'بواسطة:')} {course.deletedBy.firstName} {course.deletedBy.lastName}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </TabContent>

                    {/* Tab 2: Target Jobs */}
                    <TabContent value="targetJobs">
                        <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {t('courseManagement.targetJobs', 'قائمة الوظائف المستهدفة')}
                                </h4>
                                <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setJobModalOpen(true)}>
                                    {t('courseManagement.addTargetJob', 'إضافة وظيفة')}
                                </Button>
                            </div>

                            {course.targetJobs && course.targetJobs.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {course.targetJobs.map((job: TargetJobDto) => (
                                        <div
                                            key={job.id}
                                            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <HiOutlineBriefcase className="text-indigo-500 text-lg" />
                                                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                                                    {job.title}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                onClick={() => handleRemoveJob(job.id)}
                                            >
                                                <HiOutlineTrash className="text-lg" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 py-6 text-center">
                                    لا توجد وظائف مستهدفة مضافة بعد.
                                </p>
                            )}
                        </Card>
                    </TabContent>

                    {/* Tab 3: Requirements */}
                    <TabContent value="requirements">
                        <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {t('courseManagement.requirements', 'المتطلبات السابقة للدورة')}
                                </h4>
                                <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={() => setReqModalOpen(true)}>
                                    {t('courseManagement.addRequirement', 'إضافة متطلب')}
                                </Button>
                            </div>

                            {course.requirements && course.requirements.length > 0 ? (
                                <div className="space-y-3">
                                    {course.requirements.map((req: RequirementDto) => (
                                        <div
                                            key={req.id}
                                            className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <HiOutlineClipboardDocumentCheck className="text-emerald-500 text-lg" />
                                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                                    {req.description}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-gray-400 hover:text-red-600 transition-colors"
                                                onClick={() => handleRemoveRequirement(req.id)}
                                            >
                                                <HiOutlineTrash className="text-lg" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 py-6 text-center">
                                    لا توجد متطلبات سابقة مضافة بعد.
                                </p>
                            )}
                        </Card>
                    </TabContent>

                    {/* Tab 4: Reviews */}
                    <TabContent value="reviews">
                        <CourseReviewsList courseId={course.id} />
                    </TabContent>
                </div>
            </Tabs>

            {/* Status Change Modal */}
            <Dialog isOpen={statusModalOpen} onClose={() => setStatusModalOpen(false)} width={440}>
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold mb-4">{t('courseManagement.changeStatus', 'تغيير حالة النشر')}</h3>
                    <div className="grid grid-cols-3 gap-2 mb-6">
                        <button
                            type="button"
                            className={`p-3 rounded-lg border text-xs font-bold ${
                                selectedStatus === CourseStatus.Draft ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedStatus(CourseStatus.Draft)}
                        >
                            {t('courseManagement.draft', 'مسودة')}
                        </button>
                        <button
                            type="button"
                            className={`p-3 rounded-lg border text-xs font-bold ${
                                selectedStatus === CourseStatus.Published ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedStatus(CourseStatus.Published)}
                        >
                            {t('courseManagement.published', 'منشور')}
                        </button>
                        <button
                            type="button"
                            className={`p-3 rounded-lg border text-xs font-bold ${
                                selectedStatus === CourseStatus.Archived ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-gray-200'
                            }`}
                            onClick={() => setSelectedStatus(CourseStatus.Archived)}
                        >
                            {t('courseManagement.archived', 'مؤرشف')}
                        </button>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="plain" onClick={() => setStatusModalOpen(false)} disabled={statusUpdating}>
                            {t('common.cancel', 'إلغاء')}
                        </Button>
                        <Button variant="solid" loading={statusUpdating} onClick={handleUpdateStatus}>
                            {t('common.save', 'حفظ')}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Thumbnail Modal */}
            <Dialog isOpen={thumbModalOpen} onClose={() => setThumbModalOpen(false)} width={480}>
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold mb-4">{t('courseManagement.uploadThumbnail', 'الصورة المصغرة للدورة')}</h3>
                    <div className="mb-6">
                        <Upload
                            draggable
                            uploadLimit={1}
                            accept="image/*"
                            onChange={(files) => setSelectedFile(files[0] || null)}
                            showList={true}
                        >
                            <div className="my-2 text-center">
                                <HiOutlineCloudArrowUp className="text-3xl mx-auto text-indigo-500 mb-2" />
                                <p className="text-xs font-semibold text-gray-600">
                                    {t(
                                        'courseManagement.chooseThumbnail',
                                        'اختر صورة مصغرة للدورة',
                                    )}
                                </p>
                            </div>
                        </Upload>
                        {thumbUploading && uploadProgress > 0 && (
                            <div className="mt-3">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>{t('common.uploadingFile', 'جاري رفع الملف...')}</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                                    <div
                                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-200"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t">
                        {course.thumbnailUrl ? (
                            <Button
                                variant="plain"
                                customColorClass={() => 'text-red-600'}
                                loading={thumbUploading}
                                onClick={handleDeleteThumbnail}
                            >
                                {t('courseManagement.deleteThumbnail', 'حذف الصورة')}
                            </Button>
                        ) : <div />}
                        <div className="flex gap-2">
                            <Button variant="plain" onClick={() => setThumbModalOpen(false)} disabled={thumbUploading}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button variant="solid" disabled={!selectedFile} loading={thumbUploading} onClick={handleUploadThumbnail}>
                                {t('courseManagement.uploadThumbnail', 'رفع الصورة')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* Target Job Add Modal */}
            <Dialog isOpen={jobModalOpen} onClose={() => setJobModalOpen(false)} width={480}>
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold mb-4">{t('courseManagement.addTargetJob', 'إضافة وظيفة مستهدفة')}</h3>
                    <form onSubmit={handleAddJob} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">
                                {t('courseManagement.targetJobTitle', 'عنوان الوظيفة')}
                            </label>
                            <Input
                                type="text"
                                placeholder={t(
                                    'courseManagement.targetJobPlaceholder',
                                    'مثال: مطور تطبيقات Full-Stack',
                                )}
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="plain" onClick={() => setJobModalOpen(false)} disabled={jobSubmitting}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button type="submit" variant="solid" loading={jobSubmitting} disabled={!jobTitle.trim()}>
                                {t('common.save', 'إضافة')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

            {/* Requirement Add Modal */}
            <Dialog isOpen={reqModalOpen} onClose={() => setReqModalOpen(false)} width={480}>
                <div className="p-4 sm:p-6">
                    <h3 className="text-xl font-bold mb-4">{t('courseManagement.addRequirement', 'إضافة متطلب سابق')}</h3>
                    <form onSubmit={handleAddRequirement} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1.5">
                                {t('courseManagement.requirementDescription', 'وصف المتطلب')}
                            </label>
                            <Input
                                textArea
                                rows={3}
                                placeholder={t(
                                    'courseManagement.requirementPlaceholder',
                                    'مثال: معرفة مسبقة بأساسيات برمجة C# و SQL',
                                )}
                                value={reqDesc}
                                onChange={(e) => setReqDesc(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="plain" onClick={() => setReqModalOpen(false)} disabled={reqSubmitting}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button type="submit" variant="solid" loading={reqSubmitting} disabled={!reqDesc.trim()}>
                                {t('common.save', 'إضافة')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>
        </div>
    )
}

export default CourseDetails
