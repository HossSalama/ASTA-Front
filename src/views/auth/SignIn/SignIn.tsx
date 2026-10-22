import Alert from '@/components/ui/Alert'
import SignInForm from './components/SignInForm'
import ActionLink from '@/components/shared/ActionLink'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import useTranslation from '@/utils/hooks/useTranslation'

import loginIllustration from '@/assets/icons/login-illustration.svg'

type SignInProps = {
    signUpUrl?: string
    forgetPasswordUrl?: string
    disableSubmit?: boolean
}

export const SignInBase = ({
    signUpUrl = '/sign-up',
    forgetPasswordUrl = '/forgot-password',
    disableSubmit,
}: SignInProps) => {
    const [message, setMessage] = useTimeOutMessage()
    const { t } = useTranslation()

    return (
        <div className="w-full max-w-5xl mx-auto">


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Illustration: Placed directly on the background without container box */}
                <div className="lg:col-span-5 flex justify-center items-center py-2 lg:py-6">
                    <img
                        src={loginIllustration}
                        alt="Log In"
                        className="h-56 sm:h-64 lg:h-80 xl:h-96 w-auto object-contain hover:scale-105 transition-transform duration-300 max-w-full drop-shadow-md"
                    />
                </div>

                {/* Form Column */}
                <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6">
                    {/* Title & Subtitle */}
                    <div className="mb-6 text-start">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2">
                            {t('auth.logIn', 'Log In')}
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-text-secondary">
                            {t('auth.welcomeBackDetails', 'Welcome Back! Please Enter Your Details')}
                        </p>
                    </div>

                    {message && (
                        <Alert showIcon className="mb-4" type="danger">
                            <span className="break-all">{message}</span>
                        </Alert>
                    )}

                    <SignInForm
                        disableSubmit={disableSubmit}
                        setMessage={setMessage}
                        forgetPasswordUrl={forgetPasswordUrl}
                    />

                    <div className="mt-6 text-center lg:text-start">
                        <span className="text-text-secondary text-sm font-medium">{t('auth.dontHaveAccount', "Don't Have An Account?")}{' '}</span>
                        <ActionLink
                            to={signUpUrl}
                            className="text-secondary font-bold text-sm underline decoration-secondary decoration-2 underline-offset-4 hover:opacity-80"
                            themeColor={false}
                        >
                            {t('auth.signUpNow', 'Sign Up Now')}
                        </ActionLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

const SignIn = () => {
    return <SignInBase />
}

export default SignIn

