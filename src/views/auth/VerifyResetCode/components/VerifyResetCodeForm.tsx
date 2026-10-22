import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import OtpInput from '@/components/shared/OtpInput'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiVerifyResetCode } from '@/services/AuthService'
import useTranslation from '@/utils/hooks/useTranslation'
import { useNavigate } from 'react-router-dom'
import { OTP_REGEX } from '@/constants/validation.constant'
import { extractApiErrorMessage } from '@/utils/apiError'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'

interface VerifyResetCodeFormProps extends CommonProps {
    email: string
    setMessage?: (message: string) => void
}

type ResetCodeFormSchema = {
    code: string
}

const OTP_LENGTH = 6

const validationSchema: ZodType<ResetCodeFormSchema> = z.object({
    code: z
        .string()
        .trim()
        .min(OTP_LENGTH, { message: 'auth.enterSixDigitCode' })
        .regex(OTP_REGEX, { message: 'auth.otpDigitsOnly' }),
})

const VerifyResetCodeForm = (props: VerifyResetCodeFormProps) => {
    const { email, className, setMessage } = props
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [shake, setShake] = useState<boolean>(false)
    const { t } = useTranslation()
    const navigate = useNavigate()
    const autoSubmittedRef = useRef<string>('')

    const {
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        watch,
    } = useForm<ResetCodeFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            code: '',
        },
    })

    const codeValue = watch('code')
    const isCodeComplete = Boolean(codeValue && codeValue.trim().length === OTP_LENGTH)

    const onVerifyCode = async (values: ResetCodeFormSchema) => {
        const cleanEmail = email.trim()
        const cleanCode = values.code.trim()

        if (!cleanEmail) {
            setMessage?.('Target email address is missing. Please start from Forgot Password.')
            return
        }

        setSubmitting(true)
        setShake(false)
        setMessage?.('')

        try {
            const resp = await apiVerifyResetCode({
                email: cleanEmail,
                code: cleanCode,
            })

            if (resp && resp.status && resp.data?.resetToken) {
                const resetToken = resp.data.resetToken
                setSubmitting(false)
                // Navigate to Screen 3 (Reset Password) with transient state
                navigate('/reset-password', {
                    state: {
                        resetToken,
                        email: cleanEmail,
                    },
                })
            } else {
                const errorMsg = extractApiErrorMessage(
                    resp,
                    t('auth.invalidCode', 'Invalid verification code.'),
                )
                setMessage?.(errorMsg)
                setShake(true)
                setValue('code', '')
                autoSubmittedRef.current = ''
                setTimeout(() => {
                    setShake(false)
                }, 500)
                setSubmitting(false)
            }
        } catch (errors: unknown) {
            const errorMsg = extractApiErrorMessage(
                errors,
                t('auth.invalidCode', 'Invalid verification code.'),
            )

            setMessage?.(errorMsg)
            setShake(true)
            setValue('code', '')
            autoSubmittedRef.current = ''
            setTimeout(() => {
                setShake(false)
            }, 500)
            setSubmitting(false)
        }
    }

    // Auto-submit when all 6 digits are typed
    useEffect(() => {
        if (
            codeValue &&
            codeValue.length === OTP_LENGTH &&
            !isSubmitting &&
            autoSubmittedRef.current !== codeValue
        ) {
            autoSubmittedRef.current = codeValue
            handleSubmit(onVerifyCode)()
        }
    }, [codeValue, isSubmitting])

    return (
        <div className={`w-full ${className || ''}`}>
            <Form onSubmit={handleSubmit(onVerifyCode)}>
                <FormItem
                    invalid={Boolean(errors.code)}
                    errorMessage={errors.code?.message}
                    className="mb-4"
                >
                    <Controller
                        name="code"
                        control={control}
                        render={({ field }) => (
                            <OtpInput
                                placeholder=""
                                className="justify-center lg:justify-start gap-2 sm:gap-3 my-2"
                                inputClass="w-10 sm:w-12 md:w-14 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                                length={OTP_LENGTH}
                                disabled={isSubmitting}
                                shake={shake}
                                invalid={Boolean(errors.code) || shake}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Submit Button */}
                <Button
                    block
                    loading={isSubmitting}
                    disabled={isSubmitting || !isCodeComplete}
                    variant="solid"
                    type="submit"
                    className="w-full h-12 bg-primary hover:bg-primary-hover active:bg-primary-active text-white font-bold py-3 sm:py-3.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-base sm:text-lg border-none focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting
                        ? t('auth.verifying', 'Verifying...')
                        : t('auth.verifyButton', 'Verify')}
                </Button>
            </Form>
        </div>
    )
}

export default VerifyResetCodeForm
