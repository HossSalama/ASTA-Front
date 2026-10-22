import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import PasswordInput from '@/components/shared/PasswordInput'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    apiChangePassword,
    apiChangePhone,
    apiChangeEmail,
    apiResendChangeEmailOtp,
    apiVerifyChangeEmail,
    apiGetMe,
} from '@/services/UserService'
import { useLocaleStore } from '@/store/localeStore'
import { useThemeStore } from '@/store/themeStore'
import { useSessionUser } from '@/store/authStore'
import { extractApiErrorMessage } from '@/utils/apiError'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    HiOutlineKey,
    HiOutlinePhone,
    HiOutlineEnvelope,
    HiOutlineCog6Tooth,
    HiChevronLeft,
    HiChevronRight,
    HiOutlineArrowPath,
} from 'react-icons/hi2'

// Password complexity regex: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_COMPLEXITY_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()[\]{}\-_+=~|:;"'<>,./?]).{8,}$/

// Phone validation regex: E.164 / general international phone
const PHONE_NUMBER_REGEX = /^\+?[0-9\s-]+$/

// Validation schemas matching backend constraints
const passwordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(8, 'New password must be at least 8 characters long')
            .regex(
                PASSWORD_COMPLEXITY_REGEX,
                'Password must contain uppercase, lowercase, digit, and special character',
            ),
        confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
        message: 'The new password must be different from the current password',
        path: ['newPassword'],
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

type PasswordSchemaType = z.infer<typeof passwordSchema>

const phoneSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPhoneNumber: z
        .string()
        .min(1, 'Phone number is required')
        .regex(PHONE_NUMBER_REGEX, 'Please enter a valid phone number'),
})

type PhoneSchemaType = z.infer<typeof phoneSchema>

const emailSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newEmail: z.string().email('Please enter a valid email address'),
})

type EmailSchemaType = z.infer<typeof emailSchema>

const verifyEmailOtpSchema = z.object({
    otp: z
        .string()
        .length(6, 'Verification code must be 6 digits')
        .regex(/^\d+$/, 'Verification code must contain digits only'),
})

type VerifyEmailOtpSchemaType = z.infer<typeof verifyEmailOtpSchema>

const UserSettings = () => {
    const { t } = useTranslation()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const direction = useThemeStore((state) => state.direction)
    const isRtl = currentLang === 'ar' || direction === 'rtl'
    const sessionUser = useSessionUser((state) => state.user)
    const setUser = useSessionUser((state) => state.setUser)

    // Modals state
    const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false)
    const [phoneModalOpen, setPhoneModalOpen] = useState<boolean>(false)
    const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false)

    // Email step (1: initiate, 2: verify OTP)
    const [emailStep, setEmailStep] = useState<number>(1)
    const [pendingNewEmail, setPendingNewEmail] = useState<string>('')
    const [resendCooldown, setResendCooldown] = useState<number>(0)
    const [resendingOtp, setResendingOtp] = useState<boolean>(false)

    // Feedback messages & loading states
    const [passwordSuccess, setPasswordSuccess] = useState<string>('')
    const [passwordError, setPasswordError] = useState<string>('')
    const [updatingPassword, setUpdatingPassword] = useState<boolean>(false)

    const [phoneSuccess, setPhoneSuccess] = useState<string>('')
    const [phoneError, setPhoneError] = useState<string>('')
    const [updatingPhone, setUpdatingPhone] = useState<boolean>(false)

    const [emailSuccess, setEmailSuccess] = useState<string>('')
    const [emailError, setEmailError] = useState<string>('')
    const [updatingEmail, setUpdatingEmail] = useState<boolean>(false)

    // Password Form
    const {
        handleSubmit: handlePasswordSubmit,
        control: passwordControl,
        reset: resetPasswordForm,
        formState: { errors: passwordErrors },
    } = useForm<PasswordSchemaType>({
        resolver: zodResolver(passwordSchema),
    })

    // Phone Form
    const {
        handleSubmit: handlePhoneSubmit,
        control: phoneControl,
        reset: resetPhoneForm,
        formState: { errors: phoneErrors },
    } = useForm<PhoneSchemaType>({
        resolver: zodResolver(phoneSchema),
    })

    // Email Form
    const {
        handleSubmit: handleEmailSubmit,
        control: emailControl,
        reset: resetEmailForm,
        formState: { errors: emailErrors },
    } = useForm<EmailSchemaType>({
        resolver: zodResolver(emailSchema),
    })

    // Email OTP Form
    const {
        handleSubmit: handleOtpSubmit,
        control: otpControl,
        reset: resetOtpForm,
        formState: { errors: otpErrors },
    } = useForm<VerifyEmailOtpSchemaType>({
        resolver: zodResolver(verifyEmailOtpSchema),
    })

    // 60-second OTP cooldown timer countdown effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
            }, 1000)
        }
        return () => {
            if (interval) clearInterval(interval)
        }
    }, [resendCooldown])

    const refreshUserProfile = async () => {
        try {
            const res = await apiGetMe()
            if (res?.data?.user) {
                const u = res.data.user
                setUser({
                    id: u.id || undefined,
                    userId: u.id || undefined,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    email: u.email,
                    phoneNumber: u.phoneNumber,
                    status: u.status,
                    profileImageUrl: u.profileImageUrl,
                    avatar: u.profileImageUrl,
                })
            }
        } catch {
            // Silently continue
        }
    }

    const onPasswordSubmit = async (data: PasswordSchemaType) => {
        setUpdatingPassword(true)
        setPasswordSuccess('')
        setPasswordError('')
        try {
            const res = await apiChangePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            })
            if (res?.status) {
                setPasswordSuccess(
                    res.message ||
                        t(
                            'profile.passwordChangeSuccess',
                            'تم تغيير كلمة المرور بنجاح.',
                        ),
                )
                resetPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                })
                setTimeout(() => {
                    setPasswordModalOpen(false)
                    setPasswordSuccess('')
                }, 1500)
            } else {
                setPasswordError(
                    extractApiErrorMessage(
                        res,
                        t(
                            'profile.passwordChangeFailed',
                            'فشل تغيير كلمة المرور.',
                        ),
                    ),
                )
            }
        } catch (err: unknown) {
            setPasswordError(
                extractApiErrorMessage(
                    err,
                    t(
                        'profile.passwordChangeFailed',
                        'فشل تغيير كلمة المرور.',
                    ),
                ),
            )
        } finally {
            setUpdatingPassword(false)
        }
    }

    const onPhoneSubmit = async (data: PhoneSchemaType) => {
        setUpdatingPhone(true)
        setPhoneSuccess('')
        setPhoneError('')
        try {
            const res = await apiChangePhone({
                currentPassword: data.currentPassword,
                newPhoneNumber: data.newPhoneNumber,
            })
            if (res?.status) {
                setPhoneSuccess(
                    res.message ||
                        t(
                            'profile.phoneChangeSuccess',
                            'تم تغيير رقم الهاتف بنجاح.',
                        ),
                )
                setUser({ phoneNumber: data.newPhoneNumber })
                refreshUserProfile()
                resetPhoneForm({ currentPassword: '', newPhoneNumber: '' })
                setTimeout(() => {
                    setPhoneModalOpen(false)
                    setPhoneSuccess('')
                }, 1500)
            } else {
                setPhoneError(
                    extractApiErrorMessage(
                        res,
                        t('profile.phoneChangeFailed', 'فشل تغيير رقم الهاتف.'),
                    ),
                )
            }
        } catch (err: unknown) {
            setPhoneError(
                extractApiErrorMessage(
                    err,
                    t('profile.phoneChangeFailed', 'فشل تغيير رقم الهاتف.'),
                ),
            )
        } finally {
            setUpdatingPhone(false)
        }
    }

    const onEmailSubmit = async (data: EmailSchemaType) => {
        if (
            sessionUser.email &&
            data.newEmail.trim().toLowerCase() ===
                sessionUser.email.trim().toLowerCase()
        ) {
            setEmailError(
                t(
                    'profile.newEmailSameAsCurrent',
                    'يجب أن يكون البريد الإلكتروني الجديد مختلفًا عن بريدك الحالي.',
                ),
            )
            return
        }

        setUpdatingEmail(true)
        setEmailSuccess('')
        setEmailError('')
        try {
            const res = await apiChangeEmail({
                currentPassword: data.currentPassword,
                newEmail: data.newEmail,
            })
            if (res?.status) {
                setPendingNewEmail(data.newEmail)
                setEmailSuccess(
                    res.message ||
                        t(
                            'profile.emailOtpSent',
                            'تم إرسال رمز التحقق إلى بريدك الجديد.',
                        ),
                )
                setEmailStep(2)
                setResendCooldown(60)
            } else {
                setEmailError(
                    extractApiErrorMessage(
                        res,
                        t(
                            'profile.emailChangeFailed',
                            'فشل بدء تغيير البريد الإلكتروني.',
                        ),
                    ),
                )
            }
        } catch (err: unknown) {
            setEmailError(
                extractApiErrorMessage(
                    err,
                    t(
                        'profile.emailChangeFailed',
                        'فشل بدء تغيير البريد الإلكتروني.',
                    ),
                ),
            )
        } finally {
            setUpdatingEmail(false)
        }
    }

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || resendingOtp) return
        setResendingOtp(true)
        setEmailError('')
        setEmailSuccess('')
        try {
            const res = await apiResendChangeEmailOtp()
            if (res?.status) {
                setEmailSuccess(
                    res.message ||
                        t(
                            'profile.emailOtpResent',
                            'تمت إعادة إرسال رمز التحقق إلى بريدك الإلكتروني الجديد.',
                        ),
                )
                setResendCooldown(60)
            } else {
                setEmailError(
                    extractApiErrorMessage(
                        res,
                        t('auth.resendFailed', 'فشل إعادة إرسال رمز التحقق.'),
                    ),
                )
            }
        } catch (err: unknown) {
            setEmailError(
                extractApiErrorMessage(
                    err,
                    t('auth.resendFailed', 'فشل إعادة إرسال رمز التحقق.'),
                ),
            )
        } finally {
            setResendingOtp(false)
        }
    }

    const onVerifyEmailOtpSubmit = async (data: VerifyEmailOtpSchemaType) => {
        setUpdatingEmail(true)
        setEmailSuccess('')
        setEmailError('')
        try {
            const res = await apiVerifyChangeEmail({
                newEmail: pendingNewEmail,
                otp: data.otp,
            })
            if (res?.status) {
                setEmailSuccess(
                    res.message ||
                        t(
                            'profile.emailVerifySuccess',
                            'تم تحديث البريد الإلكتروني بنجاح.',
                        ),
                )
                setUser({ email: pendingNewEmail })
                refreshUserProfile()
                resetEmailForm()
                resetOtpForm()
                setTimeout(() => {
                    setEmailModalOpen(false)
                    setEmailStep(1)
                    setPendingNewEmail('')
                    setResendCooldown(0)
                    setEmailSuccess('')
                }, 1500)
            } else {
                setEmailError(
                    extractApiErrorMessage(
                        res,
                        t('profile.emailVerifyFailed', 'رمز التحقق غير صحيح.'),
                    ),
                )
            }
        } catch (err: unknown) {
            setEmailError(
                extractApiErrorMessage(
                    err,
                    t(
                        'profile.emailVerifyFailed',
                        'فشل تأكيد البريد الإلكتروني.',
                    ),
                ),
            )
        } finally {
            setUpdatingEmail(false)
        }
    }

    const ChevronIcon = isRtl ? HiChevronLeft : HiChevronRight

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            <div className="mb-2 text-center sm:text-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center justify-center sm:justify-start gap-2">
                    <HiOutlineCog6Tooth className="text-primary dark:text-primary-soft text-2xl" />
                    {t('common.accountSettings', 'إعدادات الحساب')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('settings.description', 'إدارة كلمة المرور والهاتف والبريد الإلكتروني وتأمين حسابك الشخصي')}
                </p>
            </div>

            <Card className="shadow-sm border border-gray-100 dark:border-gray-800 rounded-3xl p-6 bg-white dark:bg-gray-900">
                <div className="flex flex-col gap-4">
                    {/* Option 1: Change Password */}
                    <div
                        className="group flex items-center justify-between p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 rounded-2xl bg-gray-50/50 hover:bg-primary-subtle/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 transition-all duration-200 cursor-pointer shadow-xs"
                        onClick={() => {
                            setPasswordSuccess('')
                            setPasswordError('')
                            setPasswordModalOpen(true)
                        }}
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-11 h-11 rounded-xl bg-primary-soft text-primary dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center text-xl transition-transform group-hover:scale-105">
                                <HiOutlineKey />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                                    {t('settings.password', 'كلمة المرور')}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">
                                    {t('settings.changePasswordSub', 'غيّر كلمة المرور لحماية حسابك')}
                                </span>
                            </div>
                        </div>
                        <ChevronIcon className="text-primary dark:text-gray-300 text-lg transition-transform group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1" />
                    </div>

                    {/* Option 2: Change Phone Number */}
                    <div
                        className="group flex items-center justify-between p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 rounded-2xl bg-gray-50/50 hover:bg-primary-subtle/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 transition-all duration-200 cursor-pointer shadow-xs"
                        onClick={() => {
                            setPhoneSuccess('')
                            setPhoneError('')
                            setPhoneModalOpen(true)
                        }}
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center text-xl transition-transform group-hover:scale-105">
                                <HiOutlinePhone />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                                    {t('settings.phoneNumber', 'رقم الهاتف')}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">
                                    {t('settings.changePhoneSub', 'غيّر رقم الهاتف المرتبط بحسابك')}
                                </span>
                            </div>
                        </div>
                        <ChevronIcon className="text-blue-600 dark:text-gray-300 text-lg transition-transform group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1" />
                    </div>

                    {/* Option 3: Change Email */}
                    <div
                        className="group flex items-center justify-between p-4 sm:p-5 border border-gray-200/80 dark:border-gray-800 rounded-2xl bg-gray-50/50 hover:bg-primary-subtle/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/80 transition-all duration-200 cursor-pointer shadow-xs"
                        onClick={() => {
                            setEmailSuccess('')
                            setEmailError('')
                            setEmailStep(1)
                            setEmailModalOpen(true)
                        }}
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center text-xl transition-transform group-hover:scale-105">
                                <HiOutlineEnvelope />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                                    {t('settings.emailAddress', 'البريد الإلكتروني')}
                                </span>
                                <span className="text-xs text-gray-400 font-normal">
                                    {t('settings.changeEmailSub', 'غيّر بريدك الإلكتروني المرتبط بحسابك')}
                                </span>
                            </div>
                        </div>
                        <ChevronIcon className="text-purple-600 dark:text-gray-300 text-lg transition-transform group-hover:rtl:-translate-x-1 group-hover:ltr:translate-x-1" />
                    </div>
                </div>
            </Card>

            {/* Change Password Dialog */}
            <Dialog
                isOpen={passwordModalOpen}
                width={500}
                onClose={() => setPasswordModalOpen(false)}
                onRequestClose={() => setPasswordModalOpen(false)}
            >
                <div className="p-2">
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center text-xl">
                            <HiOutlineKey />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {t('profile.changePassword', 'تغيير كلمة المرور')}
                        </h4>
                    </div>

                    {passwordSuccess && <Alert type="success" className="mb-4">{passwordSuccess}</Alert>}
                    {passwordError && <Alert type="danger" className="mb-4">{passwordError}</Alert>}

                    <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('profile.currentPassword', 'كلمة المرور الحالية')}
                            </label>
                            <Controller
                                name="currentPassword"
                                control={passwordControl}
                                render={({ field }) => (
                                    <PasswordInput {...field} placeholder={t('profile.currentPassword', 'كلمة المرور الحالية')} />
                                )}
                            />
                            {passwordErrors.currentPassword && (
                                <span className="text-xs text-red-500 mt-1 block">{passwordErrors.currentPassword.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('profile.newPassword', 'كلمة المرور الجديدة')}
                            </label>
                            <Controller
                                name="newPassword"
                                control={passwordControl}
                                render={({ field }) => (
                                    <PasswordInput {...field} placeholder={t('profile.newPassword', 'كلمة المرور الجديدة')} />
                                )}
                            />
                            {passwordErrors.newPassword && (
                                <span className="text-xs text-red-500 mt-1 block">{passwordErrors.newPassword.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('profile.confirmNewPassword', 'تأكيد كلمة المرور الجديدة')}
                            </label>
                            <Controller
                                name="confirmPassword"
                                control={passwordControl}
                                render={({ field }) => (
                                    <PasswordInput {...field} placeholder={t('profile.confirmNewPassword', 'تأكيد كلمة المرور الجديدة')} />
                                )}
                            />
                            {passwordErrors.confirmPassword && (
                                <span className="text-xs text-red-500 mt-1 block">{passwordErrors.confirmPassword.message}</span>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant="plain" onClick={() => setPasswordModalOpen(false)}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button variant="solid" type="submit" loading={updatingPassword} className="px-6">
                                {t('profile.saveChanges', 'حفظ التغييرات')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

            {/* Change Phone Dialog */}
            <Dialog
                isOpen={phoneModalOpen}
                width={500}
                onClose={() => setPhoneModalOpen(false)}
                onRequestClose={() => setPhoneModalOpen(false)}
            >
                <div className="p-2">
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center text-xl">
                            <HiOutlinePhone />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {t('profile.changePhone', 'تغيير رقم الهاتف')}
                        </h4>
                    </div>

                    {phoneSuccess && <Alert type="success" className="mb-4">{phoneSuccess}</Alert>}
                    {phoneError && <Alert type="danger" className="mb-4">{phoneError}</Alert>}

                    <form className="flex flex-col gap-4" onSubmit={handlePhoneSubmit(onPhoneSubmit)}>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('profile.currentPassword', 'كلمة المرور الحالية')}
                            </label>
                            <Controller
                                name="currentPassword"
                                control={phoneControl}
                                render={({ field }) => (
                                    <PasswordInput {...field} placeholder={t('profile.currentPassword', 'كلمة المرور الحالية')} />
                                )}
                            />
                            {phoneErrors.currentPassword && (
                                <span className="text-xs text-red-500 mt-1 block">{phoneErrors.currentPassword.message}</span>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('profile.newPhoneNumber', 'رقم الهاتف الجديد')}
                            </label>
                            <Controller
                                name="newPhoneNumber"
                                control={phoneControl}
                                render={({ field }) => (
                                    <Input {...field} placeholder="+201012345678" prefix={<HiOutlinePhone className="text-gray-400" />} />
                                )}
                            />
                            {phoneErrors.newPhoneNumber && (
                                <span className="text-xs text-red-500 mt-1 block">{phoneErrors.newPhoneNumber.message}</span>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <Button type="button" variant="plain" onClick={() => setPhoneModalOpen(false)}>
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button variant="solid" type="submit" loading={updatingPhone} className="px-6">
                                {t('profile.saveChanges', 'حفظ التغييرات')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

            {/* Change Email Dialog */}
            <Dialog
                isOpen={emailModalOpen}
                width={500}
                onClose={() => setEmailModalOpen(false)}
                onRequestClose={() => setEmailModalOpen(false)}
            >
                <div className="p-2">
                    <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 dark:bg-gray-700 dark:text-gray-100 flex items-center justify-center text-xl">
                            <HiOutlineEnvelope />
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {t('profile.changeEmail', 'تغيير البريد الإلكتروني')}
                        </h4>
                    </div>

                    {emailSuccess && <Alert type="success" className="mb-4">{emailSuccess}</Alert>}
                    {emailError && <Alert type="danger" className="mb-4">{emailError}</Alert>}

                    {emailStep === 1 ? (
                        <form className="flex flex-col gap-4" onSubmit={handleEmailSubmit(onEmailSubmit)}>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('profile.currentPassword', 'كلمة المرور الحالية')}
                                </label>
                                <Controller
                                    name="currentPassword"
                                    control={emailControl}
                                    render={({ field }) => (
                                        <PasswordInput {...field} placeholder={t('profile.currentPassword', 'كلمة المرور الحالية')} />
                                    )}
                                />
                                {emailErrors.currentPassword && (
                                    <span className="text-xs text-red-500 mt-1 block">{emailErrors.currentPassword.message}</span>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('profile.newEmail', 'البريد الإلكتروني الجديد')}
                                </label>
                                <Controller
                                    name="newEmail"
                                    control={emailControl}
                                    render={({ field }) => (
                                        <Input type="email" {...field} placeholder="new.email@example.com" prefix={<HiOutlineEnvelope className="text-gray-400" />} />
                                    )}
                                />
                                {emailErrors.newEmail && (
                                    <span className="text-xs text-red-500 mt-1 block">{emailErrors.newEmail.message}</span>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="plain" onClick={() => setEmailModalOpen(false)}>
                                    {t('common.cancel', 'إلغاء')}
                                </Button>
                                <Button variant="solid" type="submit" loading={updatingEmail} className="px-6">
                                    {t('profile.sendOtp', 'إرسال رمز التحقق')}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form className="flex flex-col gap-4" onSubmit={handleOtpSubmit(onVerifyEmailOtpSubmit)}>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t('profile.enterEmailOtpInstructions', 'أدخل رمز التحقق المكون من 6 أرقام المرسل إلى')}{' '}
                                <strong className="text-gray-900 dark:text-gray-100 font-mono dir-ltr inline-block">{pendingNewEmail}</strong>
                            </p>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('auth.otp', 'رمز التحقق (OTP)')}
                                </label>
                                <Controller
                                    name="otp"
                                    control={otpControl}
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            placeholder="123456"
                                            maxLength={6}
                                            autoComplete="one-time-code"
                                            className="text-center tracking-widest font-mono text-xl font-bold"
                                        />
                                    )}
                                />
                                {otpErrors.otp && (
                                    <span className="text-xs text-red-500 mt-1 block">{otpErrors.otp.message}</span>
                                )}
                            </div>

                            {/* Resend OTP with 60s cooldown timer */}
                            <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-gray-800">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('auth.didntGetCode', 'لم يصلك الرمز؟')}
                                </span>
                                <Button
                                    type="button"
                                    variant="plain"
                                    size="sm"
                                    disabled={resendCooldown > 0 || resendingOtp}
                                    loading={resendingOtp}
                                    icon={<HiOutlineArrowPath className={resendingOtp ? 'animate-spin' : ''} />}
                                    className="text-xs text-primary dark:text-primary-soft font-semibold"
                                    onClick={handleResendOtp}
                                >
                                    {resendCooldown > 0
                                        ? `${t('auth.resendIt', 'إعادة إرسال')} (${resendCooldown}s)`
                                        : t('auth.resendIt', 'إعادة إرسال')}
                                </Button>
                            </div>

                            <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <Button type="button" variant="plain" onClick={() => setEmailStep(1)}>
                                    {t('common.back', 'رجوع')}
                                </Button>
                                <Button variant="solid" type="submit" loading={updatingEmail} className="px-6">
                                    {t('profile.verifyAndSave', 'تأكيد الحفظ')}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </Dialog>
        </div>
    )
}

export default UserSettings
