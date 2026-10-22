import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Alert from '@/components/ui/Alert'
import OtpVerificationForm from './components/OtpVerificationForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import useTranslation from '@/utils/hooks/useTranslation'
import { apiResendOtp } from '@/services/AuthService'
import { useSessionUser } from '@/store/authStore'
import { HiOutlineArrowLeft } from 'react-icons/hi2'
import LanguageSelector from '@/components/template/LanguageSelector'
import { extractApiErrorMessage } from '@/utils/apiError'
import verifyEmailSvg from '@/assets/icons/verfiy-email.svg'

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export const OtpVerificationBase = () => {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const { t } = useTranslation()
    const storedUserEmail = useSessionUser((state) => state.user.email)
    const email = searchParams.get('email') || storedUserEmail || ''

    const [otpVerified, setOtpVerified] = useTimeOutMessage()
    const [otpResend, setOtpResend] = useTimeOutMessage()
    const [message, setMessage] = useTimeOutMessage()

    const [timer, setTimer] = useState<number>(60)
    const [isResending, setIsResending] = useState<boolean>(false)

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate('/sign-in')
        }
    }

    useEffect(() => {
        if (timer <= 0) return
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(interval)
    }, [timer])

    const handleResendOtp = async () => {
        if (timer > 0 || isResending) return
        if (!email) {
            setMessage(t('auth.emailMissing', 'Target email address missing.'))
            return
        }

        setIsResending(true)
        setMessage('')
        setOtpResend('')
        try {
            const resp = await apiResendOtp({ email })
            if (resp && resp.status) {
                setOtpResend(
                    resp.message ||
                    t('auth.newCodeSent', 'A new verification code has been sent to your email.'),
                )
                setTimer(60)
            } else {
                setMessage(
                    extractApiErrorMessage(
                        resp,
                        t('auth.resendFailed', 'Failed to resend OTP.'),
                    ),
                )
            }
        } catch (err: unknown) {
            setMessage(
                extractApiErrorMessage(
                    err,
                    t('auth.resendFailed', 'Unable to resend OTP at this time.'),
                ),
            )
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6">
            {/* Header: Back Button & Language Selector */}
            <div className="flex items-center justify-between mb-6 lg:mb-8">
                <button
                    type="button"
                    onClick={handleBack}
                    className="p-2 -ms-2 text-text-primary hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center gap-1 font-semibold text-sm"
                    aria-label="Back"
                >
                    <HiOutlineArrowLeft className="text-xl sm:text-2xl rtl:rotate-180" />
                </button>
                <LanguageSelector />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* 3D Smartphone Illustration Column */}
                <div className="lg:col-span-5 flex justify-center items-center py-2 lg:py-6">
                    <img
                        src={verifyEmailSvg}
                        alt="Verify Email"
                        className="h-52 sm:h-64 lg:h-80 xl:h-96 w-auto object-contain hover:scale-105 transition-transform duration-300 max-w-full drop-shadow-md select-none"
                    />
                </div>

                {/* Form & Content Column */}
                <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6">
                    {/* Header Title & Subtitle */}
                    <div className="mb-6 text-center lg:text-start">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2">
                            {t('auth.enterCode', 'Enter Code')}
                        </h1>
                        <p className="text-xs sm:text-sm lg:text-base font-medium text-text-secondary">
                            {t('auth.codeSentSubtitle', 'We have sent a 6-digit code to your email')}
                            {email ? (
                                <>
                                    :{' '}
                                    <span className="font-bold text-primary dark:text-primary-lighter dir-ltr inline-block">
                                        {email}
                                    </span>
                                </>
                            ) : null}
                        </p>
                    </div>

                    {/* Alert Notifications */}
                    {message && (
                        <Alert showIcon className="mb-4" type="danger">
                            <span className="break-all">{message}</span>
                        </Alert>
                    )}
                    {otpResend && (
                        <Alert showIcon className="mb-4" type="info">
                            <span className="break-all">{otpResend}</span>
                        </Alert>
                    )}
                    {otpVerified && (
                        <Alert showIcon className="mb-4" type="success">
                            <span className="break-all">{otpVerified}</span>
                        </Alert>
                    )}

                    {/* OTP Form Component */}
                    <OtpVerificationForm
                        email={email}
                        setMessage={setMessage}
                        setOtpVerified={setOtpVerified}
                    />

                    {/* Footer: Resend Code Section */}
                    <div className="mt-6 text-center lg:text-start">
                        <span className="text-text-secondary text-sm font-medium">
                            {t('auth.didntGetCode', "Didn't Get The Code on Your Email?")}{' '}
                        </span>
                        <button
                            type="button"
                            disabled={timer > 0 || isResending}
                            onClick={handleResendOtp}
                            className="text-secondary font-bold text-sm underline decoration-secondary decoration-2 underline-offset-4 hover:opacity-80 transition-opacity disabled:opacity-70 disabled:no-underline disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isResending
                                ? t('common.loading', 'Sending...')
                                : timer > 0
                                ? `${t('auth.resendIt', 'Resend it')} (${formatTime(timer)})`
                                : t('auth.resendIt', 'Resend it')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

const OtpVerification = () => {
    return <OtpVerificationBase />
}

export default OtpVerification
