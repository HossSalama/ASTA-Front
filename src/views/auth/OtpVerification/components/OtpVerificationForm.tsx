import { useState, useEffect, useRef } from 'react'
import Button from '@/components/ui/Button'
import { FormItem, Form } from '@/components/ui/Form'
import OtpInput from '@/components/shared/OtpInput'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/auth'
import useTranslation from '@/utils/hooks/useTranslation'
import { OTP_REGEX } from '@/constants/validation.constant'
import type { ZodType } from 'zod'
import type { CommonProps } from '@/@types/common'

interface OtpVerificationFormProps extends CommonProps {
    email: string
    setOtpVerified?: (message: string) => void
    setMessage?: (message: string) => void
}

type OtpFormSchema = {
    otp: string
}

const OTP_LENGTH = 6

const validationSchema: ZodType<OtpFormSchema> = z.object({
    otp: z
        .string()
        .trim()
        .min(OTP_LENGTH, { message: 'auth.enterSixDigitCode' })
        .regex(OTP_REGEX, { message: 'auth.otpDigitsOnly' }),
})

const OtpVerificationForm = (props: OtpVerificationFormProps) => {
    const { email, className, setMessage, setOtpVerified } = props
    const [isSubmitting, setSubmitting] = useState<boolean>(false)
    const [shake, setShake] = useState<boolean>(false)
    const { verifyEmail } = useAuth()
    const { t } = useTranslation()
    const autoSubmittedRef = useRef<string>('')

    const {
        handleSubmit,
        formState: { errors },
        control,
        setValue,
        watch,
    } = useForm<OtpFormSchema>({
        resolver: zodResolver(validationSchema),
        defaultValues: {
            otp: '',
        },
    })

    const otpValue = watch('otp')
    const isOtpComplete = Boolean(otpValue && otpValue.trim().length === OTP_LENGTH)

    const onOtpSend = async (values: OtpFormSchema) => {
        const { otp } = values
        if (!email) {
            setMessage?.('Email is missing. Please try registering again.')
            return
        }

        setSubmitting(true)
        setShake(false)
        const result = await verifyEmail({ email, otp })
        if (result?.status === 'failed') {
            setMessage?.(result.message || 'Invalid OTP code')
            setShake(true)
            setValue('otp', '')
            autoSubmittedRef.current = ''
            setTimeout(() => {
                setShake(false)
            }, 500)
        } else {
            setOtpVerified?.(result.message || 'Email verified successfully!')
        }
        setSubmitting(false)
    }

    // Auto-submit when all 6 digits are typed
    useEffect(() => {
        if (
            otpValue &&
            otpValue.length === OTP_LENGTH &&
            !isSubmitting &&
            autoSubmittedRef.current !== otpValue
        ) {
            autoSubmittedRef.current = otpValue
            handleSubmit(onOtpSend)()
        }
    }, [otpValue, isSubmitting])

    return (
        <div className={`w-full ${className || ''}`}>
            <Form onSubmit={handleSubmit(onOtpSend)}>
                <FormItem
                    invalid={Boolean(errors.otp)}
                    errorMessage={errors.otp?.message}
                    className="mb-4"
                >
                    <Controller
                        name="otp"
                        control={control}
                        render={({ field }) => (
                            <OtpInput
                                placeholder=""
                                className="justify-center lg:justify-start gap-2 sm:gap-3 my-2"
                                inputClass="w-10 sm:w-12 md:w-14 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg border border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all"
                                length={OTP_LENGTH}
                                disabled={isSubmitting}
                                shake={shake}
                                invalid={Boolean(errors.otp) || shake}
                                {...field}
                            />
                        )}
                    />
                </FormItem>

                {/* Submit Button */}
                <Button
                    block
                    loading={isSubmitting}
                    disabled={isSubmitting || !isOtpComplete}
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

export default OtpVerificationForm
