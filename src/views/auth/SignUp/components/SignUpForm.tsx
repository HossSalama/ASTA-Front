import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useAuth } from '@/auth'
import useTranslation from '@/utils/hooks/useTranslation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import { HiOutlineUser, HiOutlineDevicePhoneMobile, HiOutlineAtSymbol, HiOutlineLockClosed } from 'react-icons/hi2'
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi'

import { PASSWORD_REGEX, PHONE_NUMBER_REGEX } from '@/constants/validation.constant'

interface SignUpFormProps extends CommonProps {
    disableSubmit?: boolean
    setMessage?: (message: string) => void
}

type SignUpFormSchema = {
    firstName: string
    lastName: string
    mobileNumber: string
    email: string
    password: string
}

const validationSchema: ZodType<SignUpFormSchema> = z.object({
    firstName: z
        .string({ required_error: 'auth.pleaseEnterFirstName' })
        .trim()
        .min(1, { message: 'auth.pleaseEnterFirstName' })
        .max(50, { message: 'auth.nameTooLong' }),
    lastName: z
        .string({ required_error: 'auth.pleaseEnterLastName' })
        .trim()
        .min(1, { message: 'auth.pleaseEnterLastName' })
        .max(50, { message: 'auth.nameTooLong' }),
    mobileNumber: z
        .string({ required_error: 'auth.pleaseEnterMobileNumber' })
        .trim()
        .min(1, { message: 'auth.pleaseEnterMobileNumber' })
        .regex(PHONE_NUMBER_REGEX, { message: 'auth.invalidMobileNumber' }),
    email: z
        .string({ required_error: 'auth.pleaseEnterEmail' })
        .trim()
        .email({ message: 'auth.invalidEmail' }),
    password: z
        .string({ required_error: 'auth.passwordRequired' })
        .min(8, { message: 'auth.passwordMinLength' })
        .regex(PASSWORD_REGEX, { message: 'auth.passwordComplexity' }),
})

const PasswordWithXxxIcon = () => (
    <div className="flex flex-col items-center justify-center text-slate-400 min-w-[20px] select-none">
        <HiOutlineLockClosed className="text-[17px]" />
        <span className="text-[7px] font-mono font-bold tracking-tighter -mt-1 text-slate-400">xxx</span>
    </div>
)

const SignUpForm = (props: SignUpFormProps) => {
    const { disableSubmit = false, className, setMessage } = props

    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [showPassword, setShowPassword] = useState<boolean>(false)
    const { t } = useTranslation()

    const { signUp } = useAuth()

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<SignUpFormSchema>({
        resolver: zodResolver(validationSchema),
    })

    const navigate = useNavigate()

    const onSignUp = async (values: SignUpFormSchema) => {
        const { firstName, lastName, password, email, mobileNumber } = values

        if (!disableSubmit) {
            setSubmitting(true)
            const result = await signUp({
                firstName,
                lastName,
                phoneNumber: mobileNumber,
                email,
                password,
            })

            if (result?.status === 'failed') {
                setMessage?.(result.message)
            } else {
                navigate(`/verify-email?email=${encodeURIComponent(email)}`)
            }

            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            <form onSubmit={handleSubmit(onSignUp)}>
                {/* Row 1: First Name & Last Name with User Icon */}
                <div className="mb-5">
                    <div className="flex items-center">
                        <div className="me-3 flex-shrink-0 text-text-muted text-xl pb-1">
                            <HiOutlineUser />
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full">
                            {/* First Name Field */}
                            <div className={`border-b ${errors.firstName ? 'border-error' : 'border-border focus-within:border-primary'} py-2.5 transition-colors`}>
                                <Controller
                                    name="firstName"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            placeholder={t('auth.firstName', 'First Name')}
                                            autoComplete="off"
                                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-text-primary placeholder:text-text-muted text-sm p-0"
                                            {...field}
                                        />
                                    )}
                                />
                            </div>

                            {/* Last Name Field */}
                            <div className={`border-b ${errors.lastName ? 'border-error' : 'border-border focus-within:border-primary'} py-2.5 transition-colors`}>
                                <Controller
                                    name="lastName"
                                    control={control}
                                    render={({ field }) => (
                                        <input
                                            type="text"
                                            placeholder={t('auth.lastName', 'Last Name')}
                                            autoComplete="off"
                                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-text-primary placeholder:text-text-muted text-sm p-0"
                                            {...field}
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                    {(errors.firstName?.message || errors.lastName?.message) && (
                        <span className="text-xs text-error mt-1 block ms-8">
                            {errors.firstName?.message ? t(errors.firstName.message, errors.firstName.message) : t(errors.lastName?.message || '', errors.lastName?.message || '')}
                        </span>
                    )}
                </div>

                {/* Row 2: Mobile Number Field */}
                <div className="mb-5">
                    <div className={`flex items-center border-b ${errors.mobileNumber ? 'border-error' : 'border-border focus-within:border-primary'} py-2.5 transition-colors`}>
                        <div className="me-3 flex-shrink-0 text-text-muted text-xl">
                            <HiOutlineDevicePhoneMobile />
                        </div>
                        <Controller
                            name="mobileNumber"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="text"
                                    placeholder={t('auth.mobileNumber', 'Mobile Number')}
                                    autoComplete="off"
                                    className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-text-primary placeholder:text-text-muted text-sm p-0"
                                    {...field}
                                />
                            )}
                        />
                    </div>
                    {errors.mobileNumber?.message && (
                        <span className="text-xs text-error mt-1 block">{t(errors.mobileNumber.message, errors.mobileNumber.message)}</span>
                    )}
                </div>

                {/* Row 3: Email Field */}
                <div className="mb-5">
                    <div className={`flex items-center border-b ${errors.email ? 'border-error' : 'border-border focus-within:border-primary'} py-2.5 transition-colors`}>
                        <div className="me-3 flex-shrink-0 text-text-muted text-xl">
                            <HiOutlineAtSymbol />
                        </div>
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <input
                                    type="email"
                                    placeholder={t('auth.email', 'Email')}
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

                {/* Row 4: Password Field */}
                <div className="mb-8">
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

                {/* Next Button */}
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold py-3 rounded-lg shadow-md transition-all border-none hover:border-none focus:border-none"
                >
                    {isSubmitting
                        ? t('auth.creatingAccount', 'Creating Account...')
                        : t('auth.next', 'Next')}
                </Button>
            </form>
        </div>
    )
}

export default SignUpForm

