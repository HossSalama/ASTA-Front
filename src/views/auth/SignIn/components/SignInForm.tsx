import { useState } from 'react'
import Button from '@/components/ui/Button'
import ActionLink from '@/components/shared/ActionLink'
import { useAuth } from '@/auth'
import useTranslation from '@/utils/hooks/useTranslation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import { HiOutlineDevicePhoneMobile, HiOutlineLockClosed } from 'react-icons/hi2'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'

import { IDENTIFIER_PHONE_REGEX } from '@/constants/validation.constant'

interface SignInFormProps extends CommonProps {
    disableSubmit?: boolean
    forgetPasswordUrl?: string
    setMessage?: (message: string) => void
}

type SignInFormSchema = {
    email: string
    password: string
}

const validationSchema: ZodType<SignInFormSchema> = z.object({
    email: z
        .string({ required_error: 'auth.pleaseEnterEmailOrMobile' })
        .trim()
        .min(1, { message: 'auth.pleaseEnterEmailOrMobile' })
        .refine(
            (val) =>
                z.string().email().safeParse(val).success ||
                IDENTIFIER_PHONE_REGEX.test(val),
            { message: 'auth.pleaseEnterValidEmailOrMobile' },
        ),
    password: z
        .string({ required_error: 'auth.pleaseEnterPassword' })
        .min(1, { message: 'auth.pleaseEnterPassword' }),
})

const PasswordWithXxxIcon = () => (
    <div className="flex flex-col items-center justify-center text-slate-400 min-w-[20px] select-none">
        <HiOutlineLockClosed className="text-[17px]" />
        <span className="text-[7px] font-mono font-bold tracking-tighter -mt-1 text-slate-400">xxx</span>
    </div>
)

const SignInForm = (props: SignInFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const { t } = useTranslation()

    const { disableSubmit = false, className, setMessage, forgetPasswordUrl = '/forgot-password' } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<SignInFormSchema>({
        defaultValues: {
            email: '',
            password: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const { signIn } = useAuth()

    const onSignIn = async (values: SignInFormSchema) => {
        const { email, password } = values

        if (!disableSubmit) {
            setSubmitting(true)
            const result = await signIn({ identifier: email, password })
            if (result?.status === 'failed') {
                setMessage?.(result.message)
            }
        }
        setSubmitting(false)
    }

    return (
        <div className={className}>
            <form onSubmit={handleSubmit(onSignIn)}>
                {/* Mobile Number or Email Field */}
                <div className="mb-5">
                    <div className={`flex items-center border-b ${errors.email ? 'border-error' : 'border-border focus-within:border-primary'} py-2.5 transition-colors`}>
                        <div className="me-3 flex-shrink-0 text-text-muted text-xl">
                            <HiOutlineDevicePhoneMobile />
                        </div>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="text"
                                    placeholder={t('auth.mobileOrEmail', 'Mobile Number or Email')}
                                    autoComplete="off"
                                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-text-primary placeholder:text-text-muted text-sm p-0"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                    {errors.email?.message && (
                        <span className="text-xs text-error mt-1 block">{t(errors.email.message, errors.email.message)}</span>
                    )}
                </div>

                {/* Password Field */}
                <div className="mb-2">
                    <div className={`flex items-center border-b ${errors.password ? 'border-error' : 'border-border focus-within:border-primary'} py-2.5 transition-colors`}>
                        <div className="me-3 flex-shrink-0">
                            <PasswordWithXxxIcon />
                        </div>
                        <Controller
                            name="password"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('auth.password', 'Password')}
                                    autoComplete="off"
                                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-text-primary placeholder:text-text-muted text-sm p-0"
                                    {...field}
                                />
                            )}
                        />
                        <button
                            type="button"
                            className="ms-2 text-text-muted hover:text-text-primary focus:outline-none"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <HiOutlineEyeOff className="text-lg" /> : <HiOutlineEye className="text-lg" />}
                        </button>
                    </div>
                    {errors.password?.message && (
                        <span className="text-xs text-error mt-1 block">{t(errors.password.message, errors.password.message)}</span>
                    )}
                </div>

                {/* Forget Password Link */}
                <div className="flex justify-end mb-8 mt-2">
                    <ActionLink
                        to={forgetPasswordUrl}
                        className="text-xs font-semibold text-text-secondary hover:text-primary"
                        themeColor={false}
                    >
                        {t('auth.forgetPassword', 'Forget Password?')}
                    </ActionLink>
                </div>

                {/* Login Button */}
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold py-3 rounded-lg shadow-md transition-all border-none hover:border-none focus:border-none"
                >
                    {isSubmitting
                        ? t('common.loading', 'Signing in...')
                        : t('auth.loginButton', 'Login')}
                </Button>
            </form>
        </div>
    )
}

export default SignInForm

