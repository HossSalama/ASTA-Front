import { useState, useEffect, useId, ChangeEvent } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import Alert from '@/components/ui/Alert'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlinePhoto,
    HiOutlineXMark,
    HiOutlineCreditCard,
} from 'react-icons/hi2'
import {
    apiCreatePaymentMethod,
    apiUpdatePaymentMethod,
} from '@/services/PaymentService'
import type { PaymentMethodResponse } from '@/@types/payment'

interface PaymentMethodDialogProps {
    isOpen: boolean
    onClose: () => void
    paymentMethod: PaymentMethodResponse | null // null for Create
    onSuccess: () => void
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const PaymentMethodDialog = ({
    isOpen,
    onClose,
    paymentMethod,
    onSuccess,
}: PaymentMethodDialogProps) => {
    const { t } = useTranslation()
    const isEdit = Boolean(paymentMethod)
    const logoInputId = useId()

    // Form fields
    const [nameAr, setNameAr] = useState<string>('')
    const [nameEn, setNameEn] = useState<string>('')
    const [accountNumber, setAccountNumber] = useState<string>('')
    const [instructionsAr, setInstructionsAr] = useState<string>('')
    const [instructionsEn, setInstructionsEn] = useState<string>('')
    const [isActive, setIsActive] = useState<boolean>(true)

    // Logo state
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    // Submitting state
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')

    useEffect(() => {
        if (isOpen) {
            setErrorMsg('')
            if (paymentMethod) {
                setNameAr(paymentMethod.nameAr || '')
                setNameEn(paymentMethod.nameEn || '')
                setAccountNumber(paymentMethod.accountNumber || '')
                setInstructionsAr(paymentMethod.instructionsAr || '')
                setInstructionsEn(paymentMethod.instructionsEn || '')
                setIsActive(paymentMethod.isActive)
                setLogoPreview(paymentMethod.logoUrl || null)
            } else {
                setNameAr('')
                setNameEn('')
                setAccountNumber('')
                setInstructionsAr('')
                setInstructionsEn('')
                setIsActive(true)
                setLogoPreview(null)
            }
            setLogoFile(null)
        } else {
            if (logoPreview && !paymentMethod?.logoUrl) {
                URL.revokeObjectURL(logoPreview)
            }
            setLogoFile(null)
            setLogoPreview(null)
        }
    }, [isOpen, paymentMethod])

    const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setErrorMsg(
                t(
                    'payment.invalidFileType',
                    'Invalid file format. Allowed formats: JPG, JPEG, PNG, WEBP.',
                ),
            )
            return
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setErrorMsg(
                t(
                    'adminPaymentMethods.logoHelp',
                    'Logo image (JPG, PNG, WebP) max 5MB.',
                ),
            )
            return
        }

        setErrorMsg('')
        setLogoFile(file)
        const url = URL.createObjectURL(file)
        setLogoPreview(url)
    }

    const handleRemoveLogo = () => {
        if (logoPreview && !paymentMethod?.logoUrl) {
            URL.revokeObjectURL(logoPreview)
        }
        setLogoFile(null)
        setLogoPreview(null)
    }

    const handleSubmit = async () => {
        if (!nameAr.trim()) {
            setErrorMsg(
                t(
                    'adminPaymentMethods.nameArRequired',
                    'Please enter Arabic name',
                ),
            )
            return
        }
        if (!nameEn.trim()) {
            setErrorMsg(
                t(
                    'adminPaymentMethods.nameEnRequired',
                    'Please enter English name',
                ),
            )
            return
        }
        if (!accountNumber.trim()) {
            setErrorMsg(
                t(
                    'adminPaymentMethods.accountNumberRequired',
                    'Please enter account number',
                ),
            )
            return
        }
        if (!instructionsAr.trim()) {
            setErrorMsg(
                t(
                    'adminPaymentMethods.instructionsArRequired',
                    'Please enter Arabic instructions',
                ),
            )
            return
        }
        if (!instructionsEn.trim()) {
            setErrorMsg(
                t(
                    'adminPaymentMethods.instructionsEnRequired',
                    'Please enter English instructions',
                ),
            )
            return
        }

        setSubmitting(true)
        setErrorMsg('')

        const formData = new FormData()
        formData.append('nameAr', nameAr.trim())
        formData.append('nameEn', nameEn.trim())
        formData.append('accountNumber', accountNumber.trim())
        formData.append('instructionsAr', instructionsAr.trim())
        formData.append('instructionsEn', instructionsEn.trim())
        formData.append('isActive', String(isActive))
        if (logoFile) {
            formData.append('logo', logoFile)
        }

        try {
            if (isEdit && paymentMethod) {
                await apiUpdatePaymentMethod(paymentMethod.id, formData)
            } else {
                await apiCreatePaymentMethod(formData)
            }
            onSuccess()
            onClose()
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    (isEdit
                        ? t(
                              'adminPaymentMethods.failedUpdate',
                              'Failed to update payment method.',
                          )
                        : t(
                              'adminPaymentMethods.failedCreate',
                              'Failed to create payment method.',
                          )),
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            closable={!submitting}
            width={640}
            contentClassName="p-0 overflow-hidden bg-surface text-text-primary rounded-2xl border border-border shadow-2xl"
        >
            {/* Header */}
            <div className="p-6 border-b border-border bg-surface-alt/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0">
                        <HiOutlineCreditCard />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">
                            {isEdit
                                ? t(
                                      'adminPaymentMethods.editTitle',
                                      'Edit Payment Method',
                                  )
                                : t(
                                      'adminPaymentMethods.createTitle',
                                      'Create Payment Method',
                                  )}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
                {errorMsg && (
                    <Alert
                        type="danger"
                        showIcon
                        closable
                        onClose={() => setErrorMsg('')}
                    >
                        {errorMsg}
                    </Alert>
                )}

                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
                            <span>
                                {t('adminPaymentMethods.nameAr', 'Arabic Name')}
                            </span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            value={nameAr}
                            onChange={(e) => setNameAr(e.target.value)}
                            placeholder={t(
                                'adminPaymentMethods.nameArPlaceholder',
                                'e.g., فودافون كاش',
                            )}
                            maxLength={200}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
                            <span>
                                {t(
                                    'adminPaymentMethods.nameEn',
                                    'English Name',
                                )}
                            </span>
                            <span className="text-rose-500">*</span>
                        </label>
                        <Input
                            value={nameEn}
                            onChange={(e) => setNameEn(e.target.value)}
                            placeholder={t(
                                'adminPaymentMethods.nameEnPlaceholder',
                                'e.g., Vodafone Cash',
                            )}
                            maxLength={200}
                        />
                    </div>
                </div>

                {/* Account Number */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
                        <span>
                            {t(
                                'adminPaymentMethods.accountNumber',
                                'Account / Wallet Number',
                            )}
                        </span>
                        <span className="text-rose-500">*</span>
                    </label>
                    <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder={t(
                            'adminPaymentMethods.accountNumberPlaceholder',
                            'e.g., 01012345678 or IBAN',
                        )}
                        maxLength={100}
                    />
                </div>

                {/* Instructions AR */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
                        <span>
                            {t(
                                'adminPaymentMethods.instructionsAr',
                                'Instructions (Arabic)',
                            )}
                        </span>
                        <span className="text-rose-500">*</span>
                    </label>
                    <Input
                        textArea
                        rows={3}
                        value={instructionsAr}
                        onChange={(e) => setInstructionsAr(e.target.value)}
                        placeholder={t(
                            'adminPaymentMethods.instructionsArPlaceholder',
                            'Step-by-step instructions in Arabic...',
                        )}
                        maxLength={2000}
                    />
                </div>

                {/* Instructions EN */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
                        <span>
                            {t(
                                'adminPaymentMethods.instructionsEn',
                                'Instructions (English)',
                            )}
                        </span>
                        <span className="text-rose-500">*</span>
                    </label>
                    <Input
                        textArea
                        rows={3}
                        value={instructionsEn}
                        onChange={(e) => setInstructionsEn(e.target.value)}
                        placeholder={t(
                            'adminPaymentMethods.instructionsEnPlaceholder',
                            'Step-by-step instructions in English...',
                        )}
                        maxLength={2000}
                    />
                </div>

                {/* Logo Upload */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-primary">
                        {t('adminPaymentMethods.logo', 'Payment Method Logo')}
                    </label>

                    {logoPreview ? (
                        <div className="flex items-center gap-4 p-3 rounded-xl border border-border bg-surface-alt/40">
                            <img
                                src={logoPreview}
                                alt="Logo Preview"
                                className="h-12 w-12 object-contain rounded border border-border bg-white"
                            />
                            <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-text-primary block truncate">
                                    {logoFile?.name || 'Current Logo'}
                                </span>
                                {logoFile && (
                                    <span className="text-[11px] text-text-secondary">
                                        {(logoFile.size / (1024 * 1024)).toFixed(
                                            2,
                                        )}{' '}
                                        MB
                                    </span>
                                )}
                            </div>
                            <Button
                                size="xs"
                                variant="plain"
                                icon={<HiOutlineXMark className="text-base text-rose-500" />}
                                onClick={handleRemoveLogo}
                                disabled={submitting}
                            />
                        </div>
                    ) : (
                        <div>
                            <input
                                type="file"
                                id={logoInputId}
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                            <label
                                htmlFor={logoInputId}
                                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer bg-surface-alt/20 hover:bg-surface-alt/40 transition-colors text-xs font-semibold text-text-secondary"
                            >
                                <HiOutlinePhoto className="text-lg text-primary" />
                                <span>
                                    {t(
                                        'adminPaymentMethods.logoHelp',
                                        'Upload logo image (max 5MB)',
                                    )}
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Is Active Switcher */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-alt/20">
                    <div>
                        <span className="text-xs font-bold text-text-primary block">
                            {t('adminPaymentMethods.isActive', 'Active Status')}
                        </span>
                        <span className="text-[11px] text-text-secondary">
                            {t(
                                'adminPaymentMethods.isActiveHelp',
                                'Only active payment methods will be displayed to students.',
                            )}
                        </span>
                    </div>
                    <Switcher
                        checked={isActive}
                        onChange={(checked) => setIsActive(checked)}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface flex items-center justify-end gap-3">
                <Button
                    variant="default"
                    onClick={onClose}
                    disabled={submitting}
                >
                    {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                    variant="solid"
                    loading={submitting}
                    onClick={handleSubmit}
                >
                    {isEdit
                        ? t('common.saveChanges', 'Save Changes')
                        : t('common.save', 'Save')}
                </Button>
            </div>
        </Dialog>
    )
}

export default PaymentMethodDialog
