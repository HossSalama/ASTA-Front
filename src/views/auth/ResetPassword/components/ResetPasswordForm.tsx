import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import PasswordInput from '@/components/shared/PasswordInput'
import toast from '@/components/ui/toast'
import Notification from '@/components/ui/Notification'
import { useAuth } from '@/auth'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import useTranslation from '@/utils/hooks/useTranslation'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'

import { PASSWORD_REGEX } from '@/constants/validation.constant'
import { extractApiErrorMessage } from '@/utils/apiError'

interface ResetPasswordFormProps extends CommonProps {
    resetToken: string
    resetComplete: boolean
    setResetComplete?: (complete: boolean) => void
    setMessage?: (message: string) => void
    setIsTokenExpired?: (expired: boolean) => void
}

type ResetPasswordFormSchema = {
    newPassword: string
    confirmPassword: string
}

const validationSchema: ZodType<ResetPasswordFormSchema> = z
    .object({
        newPassword: z
            .string({ required_error: 'auth.passwordRequired' })
            .min(8, { message: 'auth.passwordMinLength' })
            .regex(PASSWORD_REGEX, {
                message: 'auth.passwordComplexity',
            }),
        confirmPassword: z
            .string({ required_error: 'auth.confirmPasswordRequired' })
            .min(1, { message: 'auth.confirmPasswordRequired' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

const ResetPasswordForm = (props: ResetPasswordFormProps) => {
    const navigate = useNavigate()
    const { resetPassword } = useAuth()
    const { t } = useTranslation()
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const {
        resetToken,
        className,
        setMessage,
        setResetComplete,
        setIsTokenExpired,
        resetComplete,
        children,
    } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ResetPasswordFormSchema>({
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
        resolver: zodResolver(validationSchema),
    })

    const onResetPassword = async (values: ResetPasswordFormSchema) => {
        const { newPassword } = values

        if (!resetToken) {
            setMessage?.(t('auth.noResetToken', 'Reset session expired or token missing.'))
            setIsTokenExpired?.(true)
            return
        }

        try {
            setSubmitting(true)
            setMessage?.('')
            const result = await resetPassword({
                resetToken,
                newPassword,
            })

            if (result.status === 'success') {
                toast.push(
                    <Notification title={t('auth.success', 'Success')} type="success">
                        {t('auth.passwordResetSuccessToast', 'Password reset successfully! Logging you in...')}
                    </Notification>,
                    {
                        placement: 'top-center',
                    },
                )
                setResetComplete?.(true)
            } else {
                const errorMsg = result.message || t('auth.passwordResetFailed', 'Failed to reset password.')
                setMessage?.(errorMsg)
                if (
                    errorMsg.toLowerCase().includes('expired') ||
                    errorMsg.toLowerCase().includes('invalid token') ||
                    errorMsg.toLowerCase().includes('token')
                ) {
                    setIsTokenExpired?.(true)
                }
            }
        } catch (errors: unknown) {
            const errorMsg = extractApiErrorMessage(
                errors,
                t('auth.passwordResetFailed', 'Failed to reset password.'),
            )

            setMessage?.(errorMsg)
            if (
                errorMsg.toLowerCase().includes('expired') ||
                errorMsg.toLowerCase().includes('invalid token') ||
                errorMsg.toLowerCase().includes('token')
            ) {
                setIsTokenExpired?.(true)
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            {!resetComplete ? (
                <Form onSubmit={handleSubmit(onResetPassword)}>
                    <FormItem
                        label={t('auth.newPassword', 'New Password')}
                        invalid={Boolean(errors.newPassword)}
                        errorMessage={errors.newPassword?.message}
                        className="mb-4"
                    >
                        <Controller
                            name="newPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="off"
                                    placeholder="••••••••••••"
                                    className="h-12 bg-surface border-border text-text-primary text-base"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <FormItem
                        label={t('auth.confirmPassword', 'Confirm Password')}
                        invalid={Boolean(errors.confirmPassword)}
                        errorMessage={errors.confirmPassword?.message}
                        className="mb-6"
                    >
                        <Controller
                            name="confirmPassword"
                            control={control}
                            render={({ field }) => (
                                <PasswordInput
                                    autoComplete="off"
                                    placeholder={t('auth.confirmPassword', 'Confirm Password')}
                                    className="h-12 bg-surface border-border text-text-primary text-base"
                                    {...field}
                                />
                            )}
                        />
                    </FormItem>
                    <Button
                        block
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        variant="solid"
                        type="submit"
                        className="h-12 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-none w-full cursor-pointer"
                    >
                        {isSubmitting
                            ? t('common.loading', 'Submitting...')
                            : t('auth.resetPassword', 'Reset Password')}
                    </Button>
                </Form>
            ) : (
                <>{children}</>
            )}
        </div>
    )
}

export default ResetPasswordForm
