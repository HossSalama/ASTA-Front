import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Avatar from '@/components/ui/Avatar'
import Loading from '@/components/shared/Loading'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowRight,
    HiOutlineUser,
    HiOutlineBookOpen,
    HiOutlineCalendar,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
} from 'react-icons/hi2'
import { apiGetInstructorById } from '@/services/InstructorAdminService'
import type { InstructorDetailResponse } from '@/@types/adminManagement'

const InstructorDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()

    const [instructor, setInstructor] = useState<InstructorDetailResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')

    const fetchDetails = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetInstructorById(Number(id))
            if (res?.status && res.data) {
                setInstructor(res.data)
            } else {
                setErrorMsg(res?.message || t('courseCategoryManagement.failedFetchDetails', 'فشل جلب التفاصيل.'))
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('courseCategoryManagement.failedFetchDetails', 'فشل جلب التفاصيل.'),
            )
        } finally {
            setLoading(false)
        }
    }, [id, t])

    useEffect(() => {
        fetchDetails()
    }, [fetchDetails])

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loading loading={true} />
            </div>
        )
    }

    if (errorMsg || !instructor) {
        return (
            <div className="p-4">
                <Alert type="danger" className="mb-4">
                    {errorMsg || t('common.operationFailed', 'لم يتم العثور على التفاصيل.')}
                </Alert>
                <Link to="/admin/instructors">
                    <Button icon={<HiOutlineArrowRight />}>
                        {t('userManagement.backToUsersList', 'العودة إلى قائمة المحاضرين')}
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full p-4">
            {/* Header & Back Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/admin/instructors">
                        <Button shape="circle" variant="plain" icon={<HiOutlineArrowRight className="text-xl" />} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {t('instructorManagement.instructorDetails', 'تفاصيل المحاضر')}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Profile Overview Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-2">
                    <Avatar
                        shape="circle"
                        src={instructor.profileImageUrl || undefined}
                        icon={<HiOutlineUser />}
                        size={110}
                        className="border-2 border-indigo-500/20 shadow-md shrink-0"
                    />

                    <div className="flex-1 text-center md:text-right space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {instructor.name}
                            </h3>
                            <div>
                                {instructor.isActive ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <HiOutlineCheckCircle className="text-emerald-500" />
                                        {t('instructorManagement.active', 'نشط')}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                        <HiOutlineXCircle className="text-gray-400" />
                                        {t('instructorManagement.inactive', 'غير نشط')}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                {t('instructorManagement.bio', 'السيرة الذاتية')}
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {instructor.bio || '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Metadata & Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats */}
                <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl shrink-0">
                            <HiOutlineBookOpen />
                        </div>
                        <div>
                            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 block">
                                {instructor.courseCount || 0}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t('instructorManagement.courseCount', 'عدد الدورات المرتبطة')}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Audit Created */}
                <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center text-2xl shrink-0">
                            <HiOutlineCalendar />
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">
                                {t('courseCategoryManagement.createdBy', 'تم الإنشاء بواسطة')}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">
                                {instructor.createdBy ? `${instructor.createdBy.firstName} ${instructor.createdBy.lastName}` : '-'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium dir-ltr inline-block">
                                {instructor.createdAt ? dayjs(instructor.createdAt).format('YYYY/MM/DD hh:mm A') : '-'}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Audit Updated */}
                <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0">
                            <HiOutlineCalendar />
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">
                                {t('courseCategoryManagement.updatedBy', 'تم التحديث بواسطة')}
                            </span>
                            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 block">
                                {instructor.updatedBy ? `${instructor.updatedBy.firstName} ${instructor.updatedBy.lastName}` : '-'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-medium dir-ltr inline-block">
                                {instructor.updatedAt ? dayjs(instructor.updatedAt).format('YYYY/MM/DD hh:mm A') : '-'}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Deletion Audit If Applicable */}
            {instructor.isDeleted && (
                <Alert type="danger">
                    <div className="flex flex-col gap-1 text-sm">
                        <span className="font-bold">حساب محذوف (Soft Deleted)</span>
                        <span>تاريخ الحذف: {instructor.deletedAt ? dayjs(instructor.deletedAt).format('YYYY/MM/DD hh:mm A') : '-'}</span>
                        {instructor.deletedBy && (
                            <span>بواسطة: {instructor.deletedBy.firstName} {instructor.deletedBy.lastName}</span>
                        )}
                    </div>
                </Alert>
            )}

            {/* Assigned Courses List */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                    {t('instructorManagement.assignedCourses', 'الدورات التدريبية المرتبطة بالمحاضر')}
                </h3>

                {instructor.courses && instructor.courses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {instructor.courses.map((course) => (
                            <Link
                                key={course.id}
                                to={`/admin/courses/${course.id}`}
                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all bg-gray-50/50 dark:bg-gray-800/50"
                            >
                                <Avatar
                                    shape="round"
                                    src={course.thumbnailUrl || undefined}
                                    icon={<HiOutlineBookOpen />}
                                    size={48}
                                    className="shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate">
                                        {course.name}
                                    </h4>
                                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                        عرض التفاصيل &rarr;
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">
                        {t('instructorManagement.noAssignedCourses', 'لا توجد دورات مرتبطة بهذا المحاضر حالياً.')}
                    </p>
                )}
            </Card>
        </div>
    )
}

export default InstructorDetails
