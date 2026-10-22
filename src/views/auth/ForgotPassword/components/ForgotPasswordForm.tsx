import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import { apiForgotPassword } from '@/services/AuthService'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'
import useTranslation from '@/utils/hooks/useTranslation'
import { extractApiErrorMessage } from '@/utils/apiError'
import atIcon from '@/assets/icons/at-11.svg'

interface ForgotPasswordFormProps extends CommonProps {
    setMessage?: (message: string) => void
    onSuccess?: (email: string) => void
}

type ForgotPasswordFormSchema = {
    email: string
}

const validationSchema: ZodType<ForgotPasswordFormSchema> = z.object({
    email: z
        .string()
        .min(1, { message: 'Email is required' })
        .email({ message: 'Please enter a valid email address' }),
})

const ForgotPasswordForm = (props: ForgotPasswordFormProps) => {
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const { t } = useTranslation()
    const navigate = useNavigate()

    const { className, setMessage, onSuccess } = props

    const {
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<ForgotPasswordFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            email: '',
        },
    })

    const onForgotPassword = async (values: ForgotPasswordFormSchema) => {
        const cleanEmail = values.email.trim()

        try {
            setSubmitting(true)
            setMessage?.('')
            const resp = await apiForgotPassword({ email: cleanEmail })
            if (resp && resp.status) {
                setSubmitting(false)
                if (onSuccess) {
                    onSuccess(cleanEmail)
                } else {
                    navigate(`/verify-reset-code?email=${encodeURIComponent(cleanEmail)}`, {
                        state: { email: cleanEmail },
                    })
                }
            } else {
                setMessage?.(
                    extractApiErrorMessage(
                        resp,
                        t('auth.operationFailed', 'Failed to request password reset code.'),
                    ),
                )
                setSubmitting(false)
            }
        } catch (errors: unknown) {
            setMessage?.(
                extractApiErrorMessage(
                    errors,
                    t('auth.operationFailed', 'Some error occurred!'),
                ),
            )
            setSubmitting(false)
        }
    }

    return (
        <div className={className}>
            <Form className="w-full" onSubmit={handleSubmit(onForgotPassword)}>
                <FormItem
                    invalid={Boolean(errors.email)}
                    errorMessage={errors.email?.message}
                    className="mb-6 w-full"
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                type="email"
                                placeholder={t('auth.email', 'Email')}
                                autoComplete="off"
                                prefix={
                                    <img
                                        src={atIcon}
                                        alt="at"
                                        className="w-5 h-5 opacity-70"
                                    />
                                }
                                className="h-12 bg-surface border-border text-text-primary text-base"
                                {...field}
                            />
                        )}
                    />
                </FormItem>
                <Button
                    block
                    loading={isSubmitting}
                    variant="solid"
                    type="submit"
                    className="h-12 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-none w-full cursor-pointer"
                >
                    {isSubmitting
                        ? t('common.loading', 'Submitting...')
                        : t('auth.submit', 'Submit')}
                </Button>
            </Form>
        </div>
    )
}

export default ForgotPasswordForm
