import Alert from '@/components/ui/Alert'
import SignUpForm from './components/SignUpForm'
import ActionLink from '@/components/shared/ActionLink'
import useTimeOutMessage from '@/utils/hooks/useTimeOutMessage'
import useTranslation from '@/utils/hooks/useTranslation'

import signupIllustration from '@/assets/icons/signup-illustration.svg'

type SignUpProps = {
    disableSubmit?: boolean
    signInUrl?: string
}

export const SignUpBase = ({
    signInUrl = '/sign-in',
    disableSubmit,
}: SignUpProps) => {
    const [message, setMessage] = useTimeOutMessage()
    const { t } = useTranslation()

    return (
        <div className="w-full max-w-5xl mx-auto">


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Illustration: Placed directly on the background without container box */}
                <div className="lg:col-span-5 flex justify-center items-center py-2 lg:py-6">
                    <img
                        src={signupIllustration}
                        alt="Sign Up"
                        className="h-56 sm:h-64 lg:h-80 xl:h-96 w-auto object-contain hover:scale-105 transition-transform duration-300 max-w-full drop-shadow-md"
                    />
                </div>

                {/* Form Column */}
                <div className="lg:col-span-7 flex flex-col justify-center px-2 sm:px-6">
                    {/* Title & Subtitle */}
                    <div className="mb-6 text-start">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary mb-2">
                            {t('auth.signUpTitle', 'Sign Up')}
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-text-secondary">
                            {t('auth.newHereDetails', 'New Here? Create Your Account')}
                        </p>
                    </div>

                    {message && (
                        <Alert showIcon className="mb-4" type="danger">
                            <span className="break-all">{message}</span>
                        </Alert>
                    )}

                    <SignUpForm disableSubmit={disableSubmit} setMessage={setMessage} />

                    <div className="mt-6 text-center lg:text-start">
                        <span className="text-text-secondary text-sm font-medium">{t('auth.alreadyHaveAccount', 'Already Have An Account?')}{' '}</span>
                        <ActionLink
                            to={signInUrl}
                            className="text-secondary font-bold text-sm underline decoration-secondary decoration-2 underline-offset-4 hover:opacity-80"
                            themeColor={false}
                        >
                            {t('auth.logInNow', 'Log In Now')}
                        </ActionLink>
                    </div>
                </div>
            </div>
        </div>
    )
}

const SignUp = () => {
    return <SignUpBase />
}

export default SignUp

