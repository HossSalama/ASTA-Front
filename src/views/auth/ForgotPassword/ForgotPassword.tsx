import Alert from '@/components/ui/Alert'
import ActionLink from '@/components/shared/ActionLink'
import ForgotPasswordForm from './components/ForgotPasswordForm'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import useTranslation from '@/utils/hooks/useTranslation'
import { useNavigate } from 'react-router-dom'
import LanguageSelector from '@/components/template/LanguageSelector'

import passwordIcon from '@/assets/icons/password.svg'

type ForgotPasswordProps = {
    signInUrl?: string
}

export const ForgotPasswordBase = ({
    signInUrl = '/sign-in',
}: ForgotPasswordProps) => {
    const [message, setMessage] = useTimeOutMessage()
    const { t } = useTranslation()
    const navigate = useNavigate()

    const handleSuccess = (email: string) => {
        navigate(`/verify-reset-code?email=${encodeURIComponent(email)}`, {
            state: { email },
        })
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-6">
            {/* Header with Language Selector */}
            <div className="flex items-center justify-end mb-6 lg:mb-8">
                <LanguageSelector />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* 3D Password Illustration */}
                <div className="lg:col-span-5 flex justify-center items-center py-2 lg:py-6">
                    <img
                        src={passwordIcon}
                        alt="Forget Password"
                        className="h-52 sm:h-64 lg:h-80 xl:h-96 w-auto object-contain hover:scale-105 transition-transform duration-300 max-w-full drop-shadow-md select-none"
                    />
                </div>

                {/* Form & Content Column */}
                <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6">
                    {/* Title & Subtitle */}
                    <div className="mb-6 text-center lg:text-start">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2">
                            {t('auth.forgetPassword', 'Forget Password ?')}
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-text-secondary">
                            {t('auth.enterEmailToReset', 'No worries! Enter your email to reset your password')}
                        </p>
                    </div>

                    {message && (
                        <Alert showIcon className="mb-4" type="danger">
                            <span className="break-all">{message}</span>
                        </Alert>
                    )}

                    <ForgotPasswordForm
                        setMessage={setMessage}
                        onSuccess={handleSuccess}
                        className="w-full"
                    />

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

const ForgotPassword = () => {
    return <ForgotPasswordBase />
}

export default ForgotPassword
