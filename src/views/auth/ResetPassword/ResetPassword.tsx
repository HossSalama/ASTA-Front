import { useState } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import ActionLink from '@/components/shared/ActionLink'
import ResetPasswordForm from './components/ResetPasswordForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import useTranslation from '@/utils/hooks/useTranslation'
import LanguageSelector from '@/components/template/LanguageSelector'
import passwordIcon from '@/assets/icons/password.svg'
import { HiOutlineCheckCircle, HiOutlineExclamationTriangle } from 'react-icons/hi2'

type ResetPasswordProps = {
    signInUrl?: string
}

export const ResetPasswordBase = ({
    signInUrl = '/sign-in',
}: ResetPasswordProps) => {
    const [searchParams] = useSearchParams()
    const location = useLocation()
    const navigate = useNavigate()
    const { t } = useTranslation()

    const stateToken = (location.state as { resetToken?: string })?.resetToken
    const resetToken = searchParams.get('resetToken') || searchParams.get('token') || stateToken || ''

    const [resetComplete, setResetComplete] = useState(false)
    const [isTokenExpired, setIsTokenExpired] = useState(false)
    const [message, setMessage] = useTimeOutMessage()

    const handleContinueToSignIn = () => {
        navigate(signInUrl)
    }

    const handleBackToForgotPassword = () => {
        navigate('/forgot-password')
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6">
            {/* Header: Language Selector */}
            <div className="flex items-center justify-end mb-6 lg:mb-8">
                <LanguageSelector />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* 3D Password Illustration */}
                <div className="lg:col-span-5 flex justify-center items-center py-2 lg:py-6">
                    <img
                        src={passwordIcon}
                        alt="Reset Password"
                        className="h-52 sm:h-64 lg:h-80 xl:h-96 w-auto object-contain hover:scale-105 transition-transform duration-300 max-w-full drop-shadow-md select-none"
                    />
                </div>

                {/* Form & Content Column */}
                <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6">
                    {/* Header Title & Subtitle */}
                    <div className="mb-6 text-center lg:text-start">
                        {resetComplete ? (
                            <>
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-3">
                                    <HiOutlineCheckCircle className="text-3xl" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2">
                                    {t('auth.passwordResetSuccessTitle', 'Reset Complete!')}
                                </h1>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-text-secondary">
                                    {t(
                                        'auth.passwordResetSuccessSubtitle',
                                        'Your password has been successfully reset. You can now log in with your new password.',
                                    )}
                                </p>
                            </>
                        ) : !resetToken || isTokenExpired ? (
                            <>
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-3">
                                    <HiOutlineExclamationTriangle className="text-3xl" />
                                </div>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2">
                                    {t('auth.sessionExpiredTitle', 'Reset Session Expired')}
                                </h1>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-text-secondary">
                                    {t(
                                        'auth.resetTokenExpired',
                                        'Your reset session has expired or token is invalid. Please request a new verification code.',
                                    )}
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2">
                                    {t('auth.setNewPassword', 'Set New Password')}
                                </h1>
                                <p className="text-xs sm:text-sm lg:text-base font-medium text-text-secondary">
                                    {t(
                                        'auth.setNewPasswordSubtitle',
                                        'Your new password must contain uppercase, lowercase, digit, and special character.',
                                    )}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Alert Notifications */}
                    {message && (
                        <Alert showIcon className="mb-4" type="danger">
                            <span className="break-all">{message}</span>
                        </Alert>
                    )}

                    {!resetToken || isTokenExpired ? (
                        <div className="flex flex-col items-center lg:items-start gap-4">
                            <Button
                                block
                                variant="solid"
                                type="button"
                                className="h-12 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-none w-full cursor-pointer"
                                onClick={handleBackToForgotPassword}
                            >
                                {t('auth.requestNewCode', 'Request New Code')}
                            </Button>
                        </div>
                    ) : (
                        <ResetPasswordForm
                            resetToken={resetToken}
                            resetComplete={resetComplete}
                            setMessage={setMessage}
                            setResetComplete={setResetComplete}
                            setIsTokenExpired={setIsTokenExpired}
                            className="w-full"
                        >
                            <Button
                                block
                                variant="solid"
                                type="button"
                                className="h-12 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-none w-full cursor-pointer"
                                onClick={handleContinueToSignIn}
                            >
                                {t('auth.backToSignIn', 'Back to Sign In')}
                            </Button>
                        </ResetPasswordForm>
                    )}

                    <div className="mt-6 text-center lg:text-start">
                        <span className="text-text-secondary text-sm font-medium">
                            {t('auth.backTo', 'Back to')}{' '}
                        </span>
                        <ActionLink
                            to={signInUrl}
                            className="text-secondary font-bold text-sm underline decoration-secondary decoration-2 underline-offset-4 hover:opacity-80"
                            themeColor={false}
                        >
                            {t('auth.signIn', 'Sign in')}
                        </ActionLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

const ResetPassword = () => {
    return <ResetPasswordBase />
}

export default ResetPassword
