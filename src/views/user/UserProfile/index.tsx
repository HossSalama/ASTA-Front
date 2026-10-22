import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Avatar from '@/components/ui/Avatar'
import Dialog from '@/components/ui/Dialog'
import Spinner from '@/components/ui/Spinner'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    apiGetMe,
    apiChangeProfileImage,
} from '@/services/UserService'
import { useSessionUser } from '@/store/authStore'
import { useLocaleStore } from '@/store/localeStore'
import { useThemeStore } from '@/store/themeStore'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
    HiOutlineUser,
    HiOutlineCamera,
    HiOutlineAcademicCap,
    HiOutlineDocumentText,
    HiOutlineCreditCard,
    HiOutlineQuestionMarkCircle,
    HiChevronRight,
    HiChevronLeft,
    HiOutlineEnvelope,
    HiOutlinePhone,
} from 'react-icons/hi2'
import type { UserProfileDto } from '@/@types/user'

const ALLOWED_IMAGE_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'bmp', 'tiff', 'tif', 'avif']
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const UserProfile = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const direction = useThemeStore((state) => state.direction)
    const isRtl = currentLang === 'ar' || direction === 'rtl'

    const sessionUser = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)

    const [profile, setProfile] = useState<UserProfileDto | null>(null)
    const [loading, setLoading] = useState<boolean>(true)

    // Feature modal state
    const [infoModalTitle, setInfoModalTitle] = useState<string>('')
    const [infoModalOpen, setInfoModalOpen] = useState<boolean>(false)

    // Hidden file input reference for direct avatar click
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Avatar feedback messages & loading
    const [avatarSuccess, setAvatarSuccess] = useState<string>('')
    const [avatarError, setAvatarError] = useState<string>('')
    const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false)

    // Avatar preview
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)


    const fetchUserProfile = async () => {
        setLoading(true)
        try {
            const res = await apiGetMe()
            if (res?.data?.user) {
                const userData = res.data.user
                setProfile(userData)
            }
        } catch {
            // Handled by interceptor
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUserProfile()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Direct Avatar file selection and instant upload
    const handleAvatarSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]

            // Client-side file extension validation
            const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
            if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
                setAvatarError(
                    t(
                        'profile.invalidImageFormat',
                        'يرجى اختيار ملف صورة صالح (.jpg, .png, .webp, إلخ).',
                    ),
                )
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
                return
            }

            // Client-side file size validation (5 MB)
            if (file.size > MAX_IMAGE_SIZE_BYTES) {
                setAvatarError(
                    t(
                        'profile.imageTooLarge',
                        'حجم الصورة كبير جداً. الحد الأقصى المسموح هو 5 ميجابايت.',
                    ),
                )
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
                return
            }

            const objectUrl = URL.createObjectURL(file)
            setPreviewUrl(objectUrl)
            setAvatarError('')
            setAvatarSuccess('')
            setUploadingAvatar(true)

            try {
                const res = await apiChangeProfileImage(file)
                if (res?.status && res?.data?.profileImageUrl) {
                    setAvatarSuccess(
                        res.message ||
                            t(
                            'profile.imageUpdateSuccess',
                            'تم تحديث الصورة الشخصية بنجاح.',
                        ),
                    )
                    setUser({
                        profileImageUrl: res.data.profileImageUrl,
                        avatar: res.data.profileImageUrl,
                    })
                    fetchUserProfile()
                } else {
                    setAvatarError(
                        extractApiErrorMessage(
                            res,
                            t(
                                'profile.imageUpdateFailed',
                                'فشل رفع الصورة الشخصية.',
                            ),
                        ),
                    )
                }
            } catch (err: unknown) {
                setAvatarError(
                    extractApiErrorMessage(
                        err,
                        t(
                            'profile.imageUpdateFailed',
                            'فشل رفع الصورة الشخصية.',
                        ),
                    ),
                )
            } finally {
                setUploadingAvatar(false)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }
        }
    }

    const openFeatureModal = (title: string) => {
        setInfoModalTitle(title)
        setInfoModalOpen(true)
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-[50vh]">
                <Spinner size="40px" />
            </div>
        )
    }

    const displayUser = profile || sessionUser
    const ChevronIcon = isRtl ? HiChevronLeft : HiChevronRight


    return (
        <div className="w-full max-w-6xl mx-auto py-2 sm:py-6 px-2 sm:px-4">
            {/* Hidden File Input for Avatar Direct Upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarSelect}
            />

            {/* ======================================================== */}
            {/* DESKTOP & TABLET LAYOUT (visible on md: / lg: screens)   */}
            {/* ======================================================== */}
            <div className="hidden md:flex md:flex-col gap-6 w-full">
                {/* Top Desktop Profile Header Banner Card */}
                <Card className="w-full border border-sky-100/90 dark:border-gray-800 shadow-sm rounded-3xl p-6 sm:p-8 bg-white dark:bg-gray-900">
                    {/* Avatar Upload Feedback Alerts */}
                    {avatarSuccess && (
                        <Alert type="success" className="mb-4">
                            {avatarSuccess}
                        </Alert>
                    )}
                    {avatarError && (
                        <Alert type="danger" className="mb-4">
                            {avatarError}
                        </Alert>
                    )}

                    <div className="flex flex-row items-center justify-between gap-6">
                        {/* User Info Section */}
                        <div className="flex flex-row items-center gap-5">
                            {/* Clickable Avatar Container with Hover Camera Badge */}
                            <div
                                className="relative group cursor-pointer shrink-0"
                                title={t(
                                    'profile.clickToChangePicture',
                                    'Click to change profile picture',
                                )}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Avatar
                                    size={96}
                                    shape="circle"
                                    src={
                                        previewUrl ||
                                        displayUser.profileImageUrl ||
                                        sessionUser.avatar ||
                                        undefined
                                    }
                                    icon={
                                        <HiOutlineUser className="text-4xl" />
                                    }
                                    className="border-2 border-gray-100 dark:border-gray-700 shadow-md group-hover:brightness-90 transition-all"
                                />

                                {/* Dark Hover Overlay with Camera Icon */}
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    {uploadingAvatar ? (
                                        <Spinner
                                            size="24px"
                                            className="text-white"
                                        />
                                    ) : (
                                        <HiOutlineCamera className="text-2xl" />
                                    )}
                                </div>

                                {/* Floating Camera Badge Icon */}
                                <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-neutral rounded-full shadow-md border-2 border-white dark:border-gray-800 text-xs">
                                    {uploadingAvatar ? (
                                        <Spinner
                                            size="14px"
                                            className="text-white"
                                        />
                                    ) : (
                                        <HiOutlineCamera />
                                    )}
                                </div>
                            </div>

                            {/* Name & Email & Phone */}
                            <div className="flex flex-col gap-1.5 items-start">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                    {displayUser.firstName} {displayUser.lastName}
                                </h2>

                                <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500 dark:text-gray-400">
                                    {displayUser.email && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <HiOutlineEnvelope className="text-base text-gray-400 dark:text-gray-500 shrink-0" />
                                            <span>{displayUser.email}</span>
                                        </span>
                                    )}
                                    {displayUser.phoneNumber && (
                                        <span className="inline-flex items-center gap-1.5">
                                            <HiOutlinePhone className="text-base text-gray-400 dark:text-gray-500 shrink-0" />
                                            <span dir="ltr">{displayUser.phoneNumber}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Desktop Features Cards Grid (2 columns on md/lg) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                    {/* Item 1: Certificates */}
                    <Card
                        className="group border border-gray-100/90 dark:border-gray-800 shadow-sm hover:shadow-md rounded-3xl p-5 bg-white dark:bg-gray-900 transition-all cursor-pointer hover:border-orange-200 dark:hover:border-orange-900/50"
                        onClick={() =>
                            openFeatureModal(
                                t('profile.certificates', 'Certificates'),
                            )
                        }
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                                    <HiOutlineAcademicCap />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.certificates', 'Certificates')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg transition-transform group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1" />
                        </div>
                    </Card>

                    {/* Item 2: Invoices */}
                    <Card
                        className="group border border-gray-100/90 dark:border-gray-800 shadow-sm hover:shadow-md rounded-3xl p-5 bg-white dark:bg-gray-900 transition-all cursor-pointer hover:border-orange-200 dark:hover:border-orange-900/50"
                        onClick={() =>
                            openFeatureModal(
                                t('profile.invoices', 'Invoices'),
                            )
                        }
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                                    <HiOutlineDocumentText />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.invoices', 'Invoices')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg transition-transform group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1" />
                        </div>
                    </Card>

                    {/* Item 3: Payment Method */}
                    <Card
                        className="group border border-gray-100/90 dark:border-gray-800 shadow-sm hover:shadow-md rounded-3xl p-5 bg-white dark:bg-gray-900 transition-all cursor-pointer hover:border-orange-200 dark:hover:border-orange-900/50"
                        onClick={() => navigate('/user/payment-requests')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                                    <HiOutlineCreditCard />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.paymentMethod', 'Payment Method')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg transition-transform group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1" />
                        </div>
                    </Card>

                    {/* Item 4: Help Center */}
                    <Card
                        className="group border border-gray-100/90 dark:border-gray-800 shadow-sm hover:shadow-md rounded-3xl p-5 bg-white dark:bg-gray-900 transition-all cursor-pointer hover:border-orange-200 dark:hover:border-orange-900/50"
                        onClick={() =>
                            openFeatureModal(
                                t('profile.helpCenter', 'Help Center'),
                            )
                        }
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                                    <HiOutlineQuestionMarkCircle />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.helpCenter', 'Help Center')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg transition-transform group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1" />
                        </div>
                    </Card>

                </div>
            </div>

            {/* ======================================================== */}
            {/* MOBILE LAYOUT (visible ONLY on screens < md)               */}
            {/* ======================================================== */}
            <div className="block md:hidden w-full max-w-md mx-auto">
                {/* Profile Main Mobile Card */}
                <Card className="w-full border border-sky-100/90 dark:border-gray-800 shadow-sm rounded-[32px] p-5 sm:p-7 bg-white dark:bg-gray-900">
                    {/* Avatar Upload Feedback Alerts */}
                    {avatarSuccess && (
                        <Alert type="success" className="mb-4">
                            {avatarSuccess}
                        </Alert>
                    )}
                    {avatarError && (
                        <Alert type="danger" className="mb-4">
                            {avatarError}
                        </Alert>
                    )}

                    {/* Header Top Profile Section Box */}
                    <div className="border border-sky-100 dark:border-gray-800 rounded-[24px] p-6 flex flex-col items-center text-center bg-white dark:bg-gray-900 shadow-2xs mb-6">
                        {/* Clickable Avatar Container with Hover Camera Badge */}
                        <div
                            className="relative group cursor-pointer inline-block mb-3.5"
                            title={t(
                                'profile.clickToChangePicture',
                                'Click to change profile picture',
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Avatar
                                size={104}
                                shape="circle"
                                src={
                                    previewUrl ||
                                    displayUser.profileImageUrl ||
                                    sessionUser.avatar ||
                                    undefined
                                }
                                icon={
                                    <HiOutlineUser className="text-4xl" />
                                }
                                className="border-2 border-gray-100 dark:border-gray-700 shadow-sm group-hover:brightness-90 transition-all"
                            />

                            {/* Dark Hover Overlay with Camera Icon */}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploadingAvatar ? (
                                    <Spinner
                                        size="24px"
                                        className="text-white"
                                    />
                                ) : (
                                    <HiOutlineCamera className="text-2xl" />
                                )}
                            </div>

                            {/* Floating Camera Badge Icon */}
                            <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-neutral rounded-full shadow-md border-2 border-white dark:border-gray-800 text-xs">
                                {uploadingAvatar ? (
                                    <Spinner
                                        size="14px"
                                        className="text-white"
                                    />
                                ) : (
                                    <HiOutlineCamera />
                                )}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight mb-1">
                            {displayUser.firstName} {displayUser.lastName}
                        </h3>

                        <div className="flex flex-col items-center gap-1 mb-2 text-sm text-gray-500 dark:text-gray-400">
                            {displayUser.email && (
                                <div className="flex items-center gap-1.5">
                                    <HiOutlineEnvelope className="text-sm text-gray-400 dark:text-gray-500 shrink-0" />
                                    <span>{displayUser.email}</span>
                                </div>
                            )}
                            {displayUser.phoneNumber && (
                                <div className="flex items-center gap-1.5">
                                    <HiOutlinePhone className="text-sm text-gray-400 dark:text-gray-500 shrink-0" />
                                    <span dir="ltr">{displayUser.phoneNumber}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Navigation Menu Options List */}
                    <div className="flex flex-col">
                        {/* Item 1: Certificates */}
                        <div
                            className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all cursor-pointer border-b border-gray-100 dark:border-gray-800"
                            onClick={() =>
                                openFeatureModal(
                                    t('profile.certificates', 'Certificates'),
                                )
                            }
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0">
                                    <HiOutlineAcademicCap />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.certificates', 'Certificates')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg" />
                        </div>

                        {/* Item 2: Invoices */}
                        <div
                            className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all cursor-pointer border-b border-gray-100 dark:border-gray-800"
                            onClick={() =>
                                openFeatureModal(
                                    t('profile.invoices', 'Invoices'),
                                )
                            }
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0">
                                    <HiOutlineDocumentText />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.invoices', 'Invoices')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg" />
                        </div>

                        {/* Item 3: Payment Method */}
                        <div
                            className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all cursor-pointer border-b border-gray-100 dark:border-gray-800"
                            onClick={() => navigate('/user/payment-requests')}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0">
                                    <HiOutlineCreditCard />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.paymentMethod', 'Payment Method')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg" />
                        </div>

                        {/* Item 4: Help Center */}
                        <div
                            className="flex items-center justify-between py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all cursor-pointer"
                            onClick={() =>
                                openFeatureModal(
                                    t('profile.helpCenter', 'Help Center'),
                                )
                            }
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 flex items-center justify-center text-xl shrink-0">
                                    <HiOutlineQuestionMarkCircle />
                                </div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 text-base">
                                    {t('profile.helpCenter', 'Help Center')}
                                </span>
                            </div>
                            <ChevronIcon className="text-orange-500 text-lg" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Feature Information Modal */}
            <Dialog
                isOpen={infoModalOpen}
                onClose={() => setInfoModalOpen(false)}
                onRequestClose={() => setInfoModalOpen(false)}
            >
                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {infoModalTitle}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    {t(
                        'profile.underDevelopment',
                        'This section is currently under development. Stay tuned for updates!',
                    )}
                </p>
                <div className="flex justify-end">
                    <Button
                        variant="solid"
                        onClick={() => setInfoModalOpen(false)}
                    >
                        {t('profile.close', 'إغلاق')}
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default UserProfile
