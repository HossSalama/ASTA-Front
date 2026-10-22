import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { apiGetUserById } from '@/services/UserService'
import { apiGetAccessUrl } from '@/services/StorageService'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlinePencilSquare,
    HiOutlineUser,
    HiOutlineDocumentText,
    HiOutlineEnvelope,
    HiOutlinePhone,
    HiOutlineGlobeAlt,
} from 'react-icons/hi2'
import type { UserFullInfoResponse } from '@/@types/user'
import { useLocaleStore } from '@/store/localeStore'

const UserDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'

    const [user, setUser] = useState<UserFullInfoResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [docLoading, setDocLoading] = useState<boolean>(false)

    const handleViewDocument = async () => {
        if (!user?.filesUrl) return
        setDocLoading(true)
        try {
            if (user.filesUrl.startsWith('http://') || user.filesUrl.startsWith('https://')) {
                window.open(user.filesUrl, '_blank')
            } else {
                const res = await apiGetAccessUrl(user.filesUrl)
                if (res?.status && res.data?.accessUrl) {
                    window.open(res.data.accessUrl, '_blank')
                } else {
                    setErrorMsg(res?.message || t('common.operationFailed', 'فشلت العملية.'))
                }
            }
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
            setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('common.operationFailed', 'فشلت العملية.'))
        } finally {
            setDocLoading(false)
        }
    }

    const renderStatusBadge = (status: number) => {
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
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badgeClass} transition-colors shadow-2xs`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass}`} />
                {config.label}
            </span>
        )
    }

    useEffect(() => {
        if (!id) return
        setLoading(true)
        apiGetUserById(id)
            .then((res) => {
                if (res?.data) {
                    setUser(res.data)
                } else {
                    setErrorMsg(t('userManagement.userNotFound', 'لم يتم العثور على تفاصيل المستخدم.'))
                }
            })
            .catch((err: unknown) => {
                const errorObj = err as { response?: { data?: { message?: string } }; message?: string }
                setErrorMsg(errorObj?.response?.data?.message || errorObj.message || t('userManagement.failedLoadDetails', 'فشل تحميل تفاصيل المستخدم.'))
            })
            .finally(() => {
                setLoading(false)
            })
    }, [id, t])

    const BackIcon = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="40px" />
            </div>
        )
    }

    if (errorMsg || !user) {
        return (
            <div className="w-full p-4 flex flex-col gap-4 text-start">
                <Link to="/admin/users">
                    <Button size="sm" icon={<BackIcon />}>
                        {t('userManagement.backToUsersList', 'العودة إلى قائمة المستخدمين')}
                    </Button>
                </Link>
                <Alert type="danger">{errorMsg || t('userManagement.userNotFound', 'لم يتم العثور على المستخدم')}</Alert>
            </div>
        )
    }

    return (
        <div className="w-full p-4 flex flex-col gap-6 text-start">
            {/* Action Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <Link to="/admin/users">
                        <Button size="sm" variant="default" icon={<BackIcon />} />
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                            {user.firstName} {user.lastName}
                        </h2>
                    </div>
                </div>
                <Link to={`/admin/users/${user.id}/edit`}>
                    <Button variant="solid" icon={<HiOutlinePencilSquare />}>
                        {t('userManagement.editUser', 'تعديل البيانات')}
                    </Button>
                </Link>
            </div>

            {/* Profile Summary Header Card */}
            <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-start w-full sm:w-auto">
                        <Avatar
                            size={80}
                            shape="circle"
                            src={user.imageUrl || undefined}
                            icon={<HiOutlineUser className="text-3xl" />}
                            className="border-2 border-gray-100 dark:border-gray-700 shadow-sm shrink-0"
                        />
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 dir-ltr inline-block">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                                    {(user.roles || []).join(', ') || t('userManagement.user', 'مستخدم')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>{renderStatusBadge(user.status)}</div>
                </div>
            </Card>

            {/* Detailed Grid Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
                    <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-4 text-start">
                        {t('userManagement.contactInfo', 'معلومات الاتصال والتحقق')}
                    </h4>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-start">
                            <HiOutlineEnvelope className="text-xl text-gray-400 shrink-0" />
                            <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                                    {t('userManagement.email', 'البريد الإلكتروني')}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 dir-ltr inline-block">
                                    {user.email || '-'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-start">
                            <HiOutlinePhone className="text-xl text-gray-400 shrink-0" />
                            <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                                    {t('userManagement.phone', 'رقم الهاتف')}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 dir-ltr inline-block">
                                    {user.phoneNumber || '-'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-start">
                            <HiOutlineGlobeAlt className="text-xl text-gray-400 shrink-0" />
                            <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">
                                    {t('userManagement.nationality', 'الجنسية')}
                                </span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    {user.nationality || t('userManagement.notSpecified', 'غير محدد')}
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Identity Document Inspection Card */}
    <Card className="shadow-sm border border-gray-100 dark:border-gray-800">
        <h4 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-4 text-start">
            {t('userManagement.verificationDocuments', 'وثائق التحقق')}
        </h4>
        {user.filesUrl ? (
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl gap-3 text-center">
                <HiOutlineDocumentText className="text-5xl text-primary" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('userManagement.idFileAttached', 'تم إرفاق ملف التحقق من الهوية')}
                </span>
                <Button
                    block
                    variant="twoTone"
                    loading={docLoading}
                    icon={<HiOutlineDocumentText />}
                    onClick={handleViewDocument}
                >
                    {t('userManagement.viewIdFile', 'عرض وثيقة الهوية')}
                </Button>
            </div>
        ) : (
                        <div className="flex flex-col items-center justify-center p-8 border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center text-gray-400">
                            <HiOutlineDocumentText className="text-4xl mb-2" />
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {t('userManagement.noIdFileUploaded', 'لم يتم رفع وثيقة الهوية')}
                            </span>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}

export default UserDetails
