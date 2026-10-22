import { useState, useEffect, useId, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    HiOutlineCreditCard,
    HiOutlineDocumentArrowUp,
    HiOutlineClipboardDocument,
    HiOutlineCheck,
    HiOutlineCheckCircle,
    HiOutlineXMark,
    HiOutlineInformationCircle,
    HiOutlineDocumentText,
    HiOutlinePhoto,
    HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2'
import {
    apiGetPublicPaymentMethods,
    apiSubmitPaymentRequest,
} from '@/services/PaymentService'
import type { PaymentMethodPublicResponse } from '@/@types/payment'
import { formatPrice } from '@/utils/catalog'

interface PaymentRequestModalProps {
    isOpen: boolean
    onClose: () => void
    course: {
        id: number
        name: string
        price?: number
    }
    onSuccess?: () => void
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]

const PaymentRequestModal = ({
    isOpen,
    onClose,
    course,
    onSuccess,
}: PaymentRequestModalProps) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const navigate = useNavigate()
    const fileInputId = useId()

    // Data States
    const [methods, setMethods] = useState<PaymentMethodPublicResponse[]>([])
    const [loadingMethods, setLoadingMethods] = useState<boolean>(false)
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null)

    // Form States
    const [senderAccount, setSenderAccount] = useState<string>('')
    const [notes, setNotes] = useState<string>('')
    const [proofFile, setProofFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)

    // Action States
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [isSuccess, setIsSuccess] = useState<boolean>(false)
    const [copied, setCopied] = useState<boolean>(false)

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsSuccess(false)
            setErrorMsg('')
            setSenderAccount('')
            setNotes('')
            setProofFile(null)
            setFilePreview(null)
            setCopied(false)
            fetchMethods()
        } else {
            if (filePreview) {
                URL.revokeObjectURL(filePreview)
                setFilePreview(null)
            }
        }
    }, [isOpen])

    const fetchMethods = async () => {
        setLoadingMethods(true)
        try {
            const res = await apiGetPublicPaymentMethods()
            if (res && res.data && Array.isArray(res.data)) {
                setMethods(res.data)
                if (res.data.length > 0) {
                    setSelectedMethodId(res.data[0].id)
                }
            } else {
                setMethods([])
            }
        } catch {
            setMethods([])
        } finally {
            setLoadingMethods(false)
        }
    }

    const selectedMethod = methods.find((m) => m.id === selectedMethodId)

    const handleCopyAccount = () => {
        if (!selectedMethod?.accountNumber) return
        navigator.clipboard.writeText(selectedMethod.accountNumber)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
    }

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!ALLOWED_TYPES.includes(file.type)) {
            setErrorMsg(
                t(
                    'payment.invalidFileType',
                    'Invalid file format. Allowed formats: JPG, JPEG, PNG, WEBP, PDF.',
                ),
            )
            return
        }

        if (file.size > MAX_FILE_SIZE) {
            setErrorMsg(
                t(
                    'payment.fileSizeExceeded',
                    'File size exceeds the 20MB limit.',
                ),
            )
            return
        }

        setErrorMsg('')
        setProofFile(file)

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file)
            setFilePreview(url)
        } else {
            setFilePreview(null)
        }
    }

    const handleRemoveFile = () => {
        if (filePreview) {
            URL.revokeObjectURL(filePreview)
        }
        setProofFile(null)
        setFilePreview(null)
    }

    const handleSubmit = async () => {
        if (!selectedMethodId) {
            setErrorMsg(
                t('payment.selectMethod', 'Please select a payment method.'),
            )
            return
        }

        if (!senderAccount.trim()) {
            setErrorMsg(
                t(
                    'payment.senderAccountRequired',
                    'Please enter sender account details.',
                ),
            )
            return
        }

        if (!proofFile) {
            setErrorMsg(
                t(
                    'payment.proofFileRequired',
                    'Please attach transfer receipt photo or PDF.',
                ),
            )
            return
        }

        setSubmitting(true)
        setErrorMsg('')

        const formData = new FormData()
        formData.append('courseId', String(course.id))
        formData.append('paymentMethodId', String(selectedMethodId))
        formData.append('senderAccount', senderAccount.trim())
        if (notes.trim()) {
            formData.append('notes', notes.trim())
        }
        formData.append('proofFile', proofFile)

        try {
            const res = await apiSubmitPaymentRequest(formData)
            if (res && (res.status || res.isSuccess)) {
                setIsSuccess(true)
                if (onSuccess) {
                    onSuccess()
                }
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'payment.errors.submitFailed',
                            'Failed to submit payment request. Please try again.',
                        ),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: {
                    data?: {
                        message?: string
                        errorCode?: string
                    }
                }
                message?: string
            }
            const apiError = errorObj?.response?.data
            if (apiError?.errorCode === 'PaymentRequest.ActiveRequestExists') {
                setErrorMsg(
                    t(
                        'payment.errors.activeRequestExists',
                        'You already have an active payment request pending review for this course.',
                    ),
                )
            } else if (apiError?.errorCode === 'Enrollment.AlreadyEnrolled') {
                setErrorMsg(
                    t(
                        'payment.errors.alreadyEnrolled',
                        'You are already enrolled in this course.',
                    ),
                )
            } else if (apiError?.errorCode === 'PaymentRequest.CourseIsFree') {
                setErrorMsg(
                    t(
                        'payment.errors.courseIsFree',
                        'This course is free, you can enroll directly without a payment request.',
                    ),
                )
            } else {
                setErrorMsg(
                    apiError?.message ||
                        errorObj.message ||
                        t(
                            'payment.errors.submitFailed',
                            'Failed to submit payment request. Please try again.',
                        ),
                )
            }
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
            <div className="relative p-6 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold">
                            <HiOutlineCreditCard className="text-sm" />
                            <span>{t('payment.title', 'Course Enrollment & Payment')}</span>
                        </div>
                        <h2 className="text-xl font-bold text-text-primary">
                            {course.name}
                        </h2>
                    </div>
                    {typeof course.price === 'number' && (
                        <div className="text-end shrink-0">
                            <span className="text-xs text-text-secondary block">
                                {t('userPaymentRequests.amount', 'Amount')}
                            </span>
                            <span className="text-xl font-black text-primary">
                                {formatPrice(course.price, lang)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
                {isSuccess ? (
                    <div className="py-8 text-center space-y-5">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-3xl shadow-sm border border-emerald-200 dark:border-emerald-800">
                            <HiOutlineCheckCircle />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-text-primary">
                                {t(
                                    'payment.successTitle',
                                    'Payment Request Submitted! 🎉',
                                )}
                            </h3>
                            <p className="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
                                {t(
                                    'payment.successMessage',
                                    'Your payment receipt has been received. Our team will review it and activate your enrollment shortly.',
                                )}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                            <Button
                                variant="solid"
                                icon={<HiOutlineArrowTopRightOnSquare />}
                                onClick={() => {
                                    onClose()
                                    navigate('/user/payment-requests')
                                }}
                            >
                                {t('payment.viewMyRequests', 'View My Requests')}
                            </Button>
                            <Button variant="default" onClick={onClose}>
                                {t('payment.continueBrowsing', 'Back to Course')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
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

                        {loadingMethods ? (
                            <div className="py-12 flex flex-col items-center justify-center gap-3">
                                <Spinner size={32} />
                                <span className="text-xs text-text-secondary">
                                    {t('common.loading', 'Loading...')}
                                </span>
                            </div>
                        ) : methods.length === 0 ? (
                            <div className="py-8 text-center space-y-3">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center text-2xl">
                                    <HiOutlineInformationCircle />
                                </div>
                                <p className="text-sm text-text-secondary">
                                    {t(
                                        'payment.noMethodsAvailable',
                                        'No active payment methods are currently available. Please contact support.',
                                    )}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Step 1: Payment Method Selection */}
                                <div className="space-y-3">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                                        1. {t('payment.selectMethod', 'Select Payment Method')}
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {methods.map((method) => {
                                            const isSelected =
                                                method.id === selectedMethodId
                                            return (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMethodId(method.id)
                                                        setErrorMsg('')
                                                    }}
                                                    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20 shadow-sm'
                                                            : 'border-border bg-surface hover:border-text-secondary/40 hover:bg-surface-alt/40'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <div className="absolute top-2 end-2 w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[10px]">
                                                            <HiOutlineCheck />
                                                        </div>
                                                    )}
                                                    {method.logoUrl ? (
                                                        <img
                                                            src={method.logoUrl}
                                                            alt={method.name}
                                                            className="h-10 w-10 object-contain mb-2 rounded"
                                                        />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-lg bg-surface-alt flex items-center justify-center text-xl text-text-muted mb-2">
                                                            <HiOutlineCreditCard />
                                                        </div>
                                                    )}
                                                    <span className="text-xs font-semibold line-clamp-1">
                                                        {method.name}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Active Method Instructions & Account Card */}
                                {selectedMethod && (
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-primary/15">
                                            <div>
                                                <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block">
                                                    {t('payment.accountNumber', 'Account / Wallet Number')}
                                                </span>
                                                <span className="text-base sm:text-lg font-mono font-bold text-text-primary select-all">
                                                    {selectedMethod.accountNumber}
                                                </span>
                                            </div>
                                            <Button
                                                size="xs"
                                                variant="default"
                                                icon={
                                                    copied ? (
                                                        <HiOutlineCheck className="text-emerald-500" />
                                                    ) : (
                                                        <HiOutlineClipboardDocument />
                                                    )
                                                }
                                                onClick={handleCopyAccount}
                                                className="shrink-0"
                                            >
                                                {copied
                                                    ? t('payment.accountCopied', 'Copied')
                                                    : t('payment.copyAccountNumber', 'Copy Number')}
                                            </Button>
                                        </div>
                                        {selectedMethod.instructions && (
                                            <div className="text-xs text-text-secondary leading-relaxed space-y-1">
                                                <span className="font-bold text-text-primary block">
                                                    {t('payment.instructions', 'Instructions')}:
                                                </span>
                                                <p className="whitespace-pre-line">
                                                    {selectedMethod.instructions}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Step 2: Transfer Details & Proof Upload */}
                                <div className="space-y-4 pt-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                                        2. {t('payment.transferDetails', 'Transfer Details')}
                                    </label>

                                    {/* Sender Account */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
                                            <span>
                                                {t(
                                                    'payment.senderAccount',
                                                    'Sender Account Number, Wallet, or Name',
                                                )}
                                            </span>
                                            <span className="text-rose-500">*</span>
                                        </label>
                                        <Input
                                            value={senderAccount}
                                            onChange={(e) => setSenderAccount(e.target.value)}
                                            placeholder={t(
                                                'payment.senderAccountPlaceholder',
                                                'e.g., 01012345678 or Account Holder Name',
                                            )}
                                            maxLength={100}
                                        />
                                        <span className="text-[11px] text-text-secondary">
                                            {t(
                                                'payment.senderAccountHelp',
                                                'Enter the number or name used for the transfer so it can be verified on bank statements.',
                                            )}
                                        </span>
                                    </div>

                                    {/* Student Notes */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-text-primary">
                                            {t(
                                                'payment.notes',
                                                'Additional Notes (Optional)',
                                            )}
                                        </label>
                                        <Input
                                            textArea
                                            rows={2}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder={t(
                                                'payment.notesPlaceholder',
                                                'Any additional information such as transaction reference ID...',
                                            )}
                                            maxLength={1000}
                                        />
                                    </div>

                                    {/* Proof File Upload */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-text-primary flex items-center gap-1">
                                            <span>
                                                {t(
                                                    'payment.proofFile',
                                                    'Payment Receipt / Proof Document',
                                                )}
                                            </span>
                                            <span className="text-rose-500">*</span>
                                        </label>

                                        {!proofFile ? (
                                            <div>
                                                <input
                                                    type="file"
                                                    id={fileInputId}
                                                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                                                    onChange={handleFileChange}
                                                    className="hidden"
                                                />
                                                <label
                                                    htmlFor={fileInputId}
                                                    className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-border hover:border-primary rounded-xl cursor-pointer bg-surface-alt/20 hover:bg-surface-alt/40 transition-colors"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl mb-2">
                                                        <HiOutlineDocumentArrowUp />
                                                    </div>
                                                    <span className="text-xs font-semibold text-text-primary">
                                                        {t(
                                                            'payment.proofFileRequired',
                                                            'Click to upload transfer receipt',
                                                        )}
                                                    </span>
                                                    <span className="text-[11px] text-text-secondary mt-0.5">
                                                        {t(
                                                            'payment.proofFileHelp',
                                                            'JPG, PNG, WebP or PDF (Max 20MB)',
                                                        )}
                                                    </span>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-alt/40">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {filePreview ? (
                                                        <img
                                                            src={filePreview}
                                                            alt="Proof Preview"
                                                            className="w-12 h-12 rounded object-cover border border-border shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-2xl shrink-0">
                                                            <HiOutlineDocumentText />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-text-primary truncate">
                                                            {proofFile.name}
                                                        </p>
                                                        <p className="text-[11px] text-text-secondary">
                                                            {(proofFile.size / (1024 * 1024)).toFixed(2)} MB
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="xs"
                                                    variant="plain"
                                                    icon={<HiOutlineXMark className="text-base text-rose-500" />}
                                                    onClick={handleRemoveFile}
                                                    disabled={submitting}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* Footer */}
            {!isSuccess && (
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
                        disabled={submitting || methods.length === 0}
                        onClick={handleSubmit}
                    >
                        {t('payment.submitRequest', 'Submit Payment Request')}
                    </Button>
                </div>
            )}
        </Dialog>
    )
}

export default PaymentRequestModal
