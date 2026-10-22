import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Tag from '@/components/ui/Tag'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Tooltip from '@/components/ui/Tooltip'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineCreditCard,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineArrowPath,
    HiOutlineDocumentArrowDown,
    HiOutlineEye,
    HiOutlineAcademicCap,
    HiOutlineUser,
    HiOutlinePhone,
    HiOutlineEnvelope,
    HiOutlineShieldCheck,
    HiOutlineArrowTopRightOnSquare,
    HiOutlineDocumentText,
} from 'react-icons/hi2'
import {
    apiGetAdminPaymentRequestById,
    apiMarkPaymentRequestUnderReview,
    apiApprovePaymentRequest,
    apiRejectPaymentRequest,
} from '@/services/PaymentService'
import type {
    AdminPaymentRequestDetail,
    PaymentRequestStatus,
} from '@/@types/payment'
import { formatPrice } from '@/utils/catalog'
import { useLocaleStore } from '@/store/localeStore'

const AdminPaymentRequestDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'
    const BackArrow = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    // Data states
    const [request, setRequest] = useState<AdminPaymentRequestDetail | null>(
        null,
    )
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Action loading states
    const [actionLoading, setActionLoading] = useState<boolean>(false)

    // Modal states
    const [approveModalOpen, setApproveModalOpen] = useState<boolean>(false)
    const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false)
    const [rejectReason, setRejectReason] = useState<string>('')
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)

    const fetchDetails = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetAdminPaymentRequestById(Number(id))
            const data = (res as any)?.data?.data || (res as any)?.data || res
            if (
                data &&
                typeof data === 'object' &&
                ('id' in data || 'courseId' in data || 'amount' in data)
            ) {
                setRequest(data as AdminPaymentRequestDetail)
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'adminPaymentRequests.fetchDetailsFailed',
                            'Failed to fetch payment request details.',
                        ),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t(
                        'adminPaymentRequests.fetchDetailsFailed',
                        'Failed to fetch payment request details.',
                    ),
            )
        } finally {
            setLoading(false)
        }
    }, [id, t])

    useEffect(() => {
        fetchDetails()
    }, [fetchDetails])

    // Action 1: Mark Under Review (New -> Pending)
    const handleMarkUnderReview = async () => {
        if (!id) return
        setActionLoading(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            await apiMarkPaymentRequestUnderReview(Number(id))
            setSuccessMsg(
                t(
                    'adminPaymentRequests.underReviewSuccess',
                    'Payment request marked as under review.',
                ),
            )
            await fetchDetails()
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t(
                        'adminPaymentRequests.underReviewFailed',
                        'Failed to mark payment request as under review.',
                    ),
            )
        } finally {
            setActionLoading(false)
        }
    }

    // Action 2: Approve (Pending -> Approved)
    const handleApprove = async () => {
        if (!id) return
        setActionLoading(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            await apiApprovePaymentRequest(Number(id))
            setSuccessMsg(
                t(
                    'adminPaymentRequests.approveSuccess',
                    'Payment request approved and student enrolled successfully.',
                ),
            )
            setApproveModalOpen(false)
            await fetchDetails()
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t(
                        'adminPaymentRequests.approveFailed',
                        'Failed to approve payment request.',
                    ),
            )
        } finally {
            setActionLoading(false)
        }
    }

    // Action 3: Reject (Pending -> Rejected)
    const handleReject = async () => {
        if (!id) return
        setActionLoading(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            await apiRejectPaymentRequest(Number(id), {
                reason: rejectReason.trim() || undefined,
            })
            setSuccessMsg(
                t(
                    'adminPaymentRequests.rejectSuccess',
                    'Payment request rejected successfully.',
                ),
            )
            setRejectModalOpen(false)
            setRejectReason('')
            await fetchDetails()
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setErrorMsg(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t(
                        'adminPaymentRequests.rejectFailed',
                        'Failed to reject payment request.',
                    ),
            )
        } finally {
            setActionLoading(false)
        }
    }

    const renderStatusTag = (status: PaymentRequestStatus) => {
        switch (status) {
            case 'New':
                return (
                    <Tag className="bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-semibold gap-1">
                        <HiOutlineClock className="text-xs" />
                        <span>{t('payment.status.new', 'New')}</span>
                    </Tag>
                )
            case 'Pending':
                return (
                    <Tag className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold gap-1">
                        <HiOutlineClock className="text-xs" />
                        <span>{t('payment.status.pending', 'Under Review')}</span>
                    </Tag>
                )
            case 'Approved':
                return (
                    <Tag className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold gap-1">
                        <HiOutlineCheckCircle className="text-xs" />
                        <span>{t('payment.status.approved', 'Approved')}</span>
                    </Tag>
                )
            case 'Rejected':
                return (
                    <Tag className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-semibold gap-1">
                        <HiOutlineXCircle className="text-xs" />
                        <span>{t('payment.status.rejected', 'Rejected')}</span>
                    </Tag>
                )
            default:
                return <Tag>{status}</Tag>
        }
    }

    const isPdf = request?.proofUrl
        ? request.proofUrl.toLowerCase().includes('.pdf') ||
          Boolean(request.proofFileName?.toLowerCase().endsWith('.pdf'))
        : false

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="default"
                        icon={<BackArrow />}
                        onClick={() => navigate('/admin/payment-requests')}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                                {t(
                                    'adminPaymentRequests.detailsTitle',
                                    'Payment Request Review',
                                )}
                            </h1>
                            {request && renderStatusTag(request.status)}
                        </div>
                        {request && (
                            <p className="text-xs text-text-muted mt-0.5">
                                {dayjs(request.createdAt).format(
                                    'YYYY-MM-DD HH:mm',
                                )}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Tooltip title={t('common.retry', 'Refresh')}>
                        <Button
                            variant="default"
                            size="sm"
                            icon={<HiOutlineArrowPath />}
                            loading={loading}
                            onClick={() => fetchDetails()}
                        />
                    </Tooltip>
                </div>
            </div>

            {/* Alerts */}
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

            {successMsg && (
                <Alert
                    type="success"
                    showIcon
                    closable
                    onClose={() => setSuccessMsg('')}
                >
                    {successMsg}
                </Alert>
            )}

            {/* Loading */}
            {loading ? (
                <Card className="border border-border shadow-sm p-16 flex flex-col items-center justify-center gap-3">
                    <Spinner size={36} />
                    <span className="text-xs text-text-secondary">
                        {t('common.loading', 'Loading...')}
                    </span>
                </Card>
            ) : !request ? (
                <Card className="border border-border shadow-sm p-12 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-3xl">
                        <HiOutlineXCircle />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-text-primary">
                            {t(
                                'adminPaymentRequests.requestNotFound',
                                'Payment request not found or could not be loaded.',
                            )}
                        </h3>
                        <p className="text-xs text-text-secondary max-w-md mx-auto">
                            {errorMsg ||
                                t(
                                    'adminPaymentRequests.fetchDetailsFailed',
                                    'Failed to fetch payment request details. Please try again.',
                                )}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => navigate('/admin/payment-requests')}
                        >
                            {t('adminPaymentRequests.title', 'Back to Requests')}
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            icon={<HiOutlineArrowPath />}
                            onClick={() => fetchDetails()}
                        >
                            {t('common.retry', 'Retry')}
                        </Button>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Workflow Action Bar */}
                    <Card className="border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
                                    {t('adminPaymentRequests.status', 'Current Status')}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    {renderStatusTag(request.status)}
                                    {request.reviewerName && (
                                        <span className="text-xs text-text-muted">
                                            ({t('adminPaymentRequests.reviewer', 'Reviewer')}: {request.reviewerName})
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap items-center gap-3">
                                {request.status === 'New' && (
                                    <Button
                                        variant="solid"
                                        loading={actionLoading}
                                        onClick={handleMarkUnderReview}
                                        icon={<HiOutlineClock />}
                                    >
                                        {t(
                                            'adminPaymentRequests.markUnderReview',
                                            'Mark Under Review',
                                        )}
                                    </Button>
                                )}

                                {request.status === 'Pending' && (
                                    <>
                                        <Button
                                            variant="solid"
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            loading={actionLoading}
                                            onClick={() =>
                                                setApproveModalOpen(true)
                                            }
                                            icon={<HiOutlineCheckCircle />}
                                        >
                                            {t(
                                                'adminPaymentRequests.approve',
                                                'Approve & Enroll Student',
                                            )}
                                        </Button>
                                        <Button
                                            variant="default"
                                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                                            loading={actionLoading}
                                            onClick={() =>
                                                setRejectModalOpen(true)
                                            }
                                            icon={<HiOutlineXCircle />}
                                        >
                                            {t(
                                                'adminPaymentRequests.reject',
                                                'Reject Request',
                                            )}
                                        </Button>
                                    </>
                                )}

                                {request.status === 'Approved' && (
                                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                                        <HiOutlineShieldCheck className="text-xl" />
                                        <span>
                                            {t(
                                                'adminPaymentRequests.approveSuccess',
                                                'Approved & Enrolled',
                                            )}
                                        </span>
                                    </div>
                                )}

                                {request.status === 'Rejected' && (
                                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                                        <HiOutlineXCircle className="text-xl" />
                                        <span>
                                            {t(
                                                'payment.status.rejected',
                                                'Rejected',
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Rejection Reason Notice (if rejected) */}
                    {request.status === 'Rejected' && request.rejectionReason && (
                        <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-1.5">
                            <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                                {t(
                                    'adminPaymentRequests.rejectReasonLabel',
                                    'Rejection Reason',
                                )}
                                :
                            </span>
                            <p className="text-sm text-text-primary whitespace-pre-line">
                                {request.rejectionReason}
                            </p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Student Information */}
                        <Card className="border border-border shadow-sm p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-border">
                                <HiOutlineUser className="text-primary text-xl" />
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                    {t(
                                        'adminPaymentRequests.studentInfo',
                                        'Student Information',
                                    )}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'adminPaymentRequests.studentName',
                                            'Student Name',
                                        )}
                                    </span>
                                    <span className="text-sm font-bold text-text-primary mt-0.5 block">
                                        {request.studentName}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'adminPaymentRequests.studentEmail',
                                            'Email',
                                        )}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-sm text-text-primary mt-0.5">
                                        <HiOutlineEnvelope className="text-text-muted" />
                                        <span>{request.studentEmail}</span>
                                    </div>
                                </div>

                                {request.studentPhoneNumber && (
                                    <div>
                                        <span className="text-xs text-text-muted block">
                                            {t(
                                                'adminPaymentRequests.studentPhone',
                                                'Phone Number',
                                            )}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-sm font-mono text-text-primary mt-0.5">
                                            <HiOutlinePhone className="text-text-muted" />
                                            <span>{request.studentPhoneNumber}</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t('adminTickets.userId', 'Student ID')}
                                    </span>
                                    <span className="text-xs font-mono text-text-secondary mt-0.5 block">
                                        {request.studentId}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Course & Amount Information */}
                        <Card className="border border-border shadow-sm p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-border">
                                <HiOutlineAcademicCap className="text-primary text-xl" />
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                    {t(
                                        'userPaymentRequests.courseInfo',
                                        'Course Details',
                                    )}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'adminPaymentRequests.course',
                                            'Course',
                                        )}
                                    </span>
                                    <span className="text-base font-bold text-text-primary mt-0.5 block">
                                        {request.courseName || request.courseTitle || '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'adminPaymentRequests.amount',
                                            'Amount Snapshot',
                                        )}
                                    </span>
                                    <span className="text-xl font-black text-primary mt-0.5 block">
                                        {formatPrice(request.amount, lang)}
                                    </span>
                                </div>

                                <div>
                                    <Button
                                        size="xs"
                                        variant="default"
                                        icon={<HiOutlineArrowTopRightOnSquare />}
                                        onClick={() =>
                                            navigate(`/admin/courses/${request.courseId}`)
                                        }
                                    >
                                        {t('course.viewCourse', 'View Course Details')}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Transfer & Payment Information */}
                    <Card className="border border-border shadow-sm p-5 space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-border">
                            <HiOutlineCreditCard className="text-primary text-xl" />
                            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                {t(
                                    'adminPaymentRequests.transferInfo',
                                    'Transfer Information',
                                )}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs text-text-muted block">
                                    {t(
                                        'adminPaymentRequests.method',
                                        'Payment Method',
                                    )}
                                </span>
                                <span className="text-sm font-bold text-text-primary mt-0.5 block">
                                    {(isRtl
                                        ? request.paymentMethodNameAr
                                        : request.paymentMethodNameEn) ||
                                        request.paymentMethodNameAr ||
                                        request.paymentMethodNameEn ||
                                        request.paymentMethodName ||
                                        '—'}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs text-text-muted block">
                                    {t(
                                        'adminPaymentRequests.targetAccount',
                                        'Target Account',
                                    )}
                                </span>
                                <span className="text-sm font-mono font-bold text-text-primary mt-0.5 block select-all">
                                    {request.paymentMethodAccountNumber}
                                </span>
                            </div>

                            <div>
                                <span className="text-xs text-text-muted block">
                                    {t(
                                        'adminPaymentRequests.senderAccount',
                                        'Sender Account',
                                    )}
                                </span>
                                <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-400 mt-0.5 block select-all">
                                    {request.senderAccount}
                                </span>
                            </div>
                        </div>

                        {request.studentNotes && (
                            <div className="pt-2 border-t border-border">
                                <span className="text-xs text-text-muted block">
                                    {t(
                                        'userPaymentRequests.studentNotes',
                                        'Student Notes',
                                    )}
                                </span>
                                <p className="text-xs sm:text-sm text-text-secondary mt-1 bg-surface-alt/40 p-3 rounded-lg border border-border whitespace-pre-line">
                                    {request.studentNotes}
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Receipt Document Card */}
                    <Card className="border border-border shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <HiOutlineDocumentText className="text-primary text-xl" />
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                    {t(
                                        'adminPaymentRequests.receiptDocument',
                                        'Payment Receipt Document',
                                    )}
                                </h2>
                            </div>
                            {request.proofUrl && (
                                <a
                                    href={request.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                                >
                                    <HiOutlineArrowTopRightOnSquare />
                                    <span>{t('common.downloadFile', 'Open in New Tab')}</span>
                                </a>
                            )}
                        </div>

                        {request.proofUrl ? (
                            <div>
                                {isPdf ? (
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface-alt/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-2xl shrink-0">
                                                <HiOutlineDocumentArrowDown />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-text-primary">
                                                    {request.proofFileName ||
                                                        'Payment Receipt (PDF)'}
                                                </h4>
                                                <p className="text-xs text-text-secondary">
                                                    PDF Document
                                                </p>
                                            </div>
                                        </div>
                                        <a
                                            href={request.proofUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Button
                                                size="sm"
                                                variant="default"
                                                icon={<HiOutlineEye />}
                                            >
                                                {t(
                                                    'userPaymentRequests.viewProof',
                                                    'View PDF',
                                                )}
                                            </Button>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div
                                            className="relative max-w-lg rounded-xl overflow-hidden border border-border bg-surface-alt cursor-pointer group"
                                            onClick={() => setPreviewOpen(true)}
                                        >
                                            <img
                                                src={request.proofUrl}
                                                alt="Receipt Proof"
                                                className="w-full max-h-96 object-contain group-hover:scale-[1.02] transition-transform duration-200"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 text-sm font-semibold">
                                                <HiOutlineEye className="text-xl" />
                                                <span>
                                                    {t(
                                                        'userPaymentRequests.viewProof',
                                                        'Click to Enlarge',
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-text-muted">
                                {t('common.noDataFound', 'No receipt attached.')}
                            </div>
                        )}
                    </Card>

                    {/* Image Preview Modal */}
                    {request.proofUrl && !isPdf && (
                        <Dialog
                            isOpen={previewOpen}
                            onClose={() => setPreviewOpen(false)}
                            width={900}
                            contentClassName="p-0 overflow-hidden bg-black/95 text-white rounded-2xl"
                        >
                            <div className="relative p-2 flex items-center justify-center min-h-[50vh]">
                                <img
                                    src={request.proofUrl}
                                    alt="Payment Proof Full"
                                    className="max-h-[85vh] max-w-full object-contain rounded"
                                />
                            </div>
                        </Dialog>
                    )}

                    {/* Approval Confirmation Dialog */}
                    <Dialog
                        isOpen={approveModalOpen}
                        onClose={() => setApproveModalOpen(false)}
                        closable={!actionLoading}
                        width={480}
                        contentClassName="p-6 rounded-2xl bg-surface border border-border shadow-2xl space-y-4"
                    >
                        <div className="flex items-center gap-3 text-emerald-600">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-xl shrink-0">
                                <HiOutlineCheckCircle />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">
                                {t(
                                    'adminPaymentRequests.approveConfirmTitle',
                                    'Confirm Payment Approval',
                                )}
                            </h3>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {t(
                                'adminPaymentRequests.approveConfirmMsg',
                                'This will approve the payment and automatically enroll the student in this course. Continue?',
                            )}
                        </p>
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <Button
                                variant="default"
                                disabled={actionLoading}
                                onClick={() => setApproveModalOpen(false)}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                variant="solid"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                loading={actionLoading}
                                onClick={handleApprove}
                            >
                                {t('adminPaymentRequests.approve', 'Approve & Enroll')}
                            </Button>
                        </div>
                    </Dialog>

                    {/* Reject Dialog */}
                    <Dialog
                        isOpen={rejectModalOpen}
                        onClose={() => setRejectModalOpen(false)}
                        closable={!actionLoading}
                        width={520}
                        contentClassName="p-6 rounded-2xl bg-surface border border-border shadow-2xl space-y-4"
                    >
                        <div className="flex items-center gap-3 text-rose-600">
                            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-xl shrink-0">
                                <HiOutlineXCircle />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-primary">
                                    {t(
                                        'adminPaymentRequests.rejectTitle',
                                        'Reject Payment Request',
                                    )}
                                </h3>
                                <p className="text-xs text-text-secondary">
                                    {t(
                                        'adminPaymentRequests.rejectSubtitle',
                                        'Provide a reason explaining why the payment was rejected.',
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-text-primary">
                                {t(
                                    'adminPaymentRequests.rejectReasonLabel',
                                    'Rejection Reason',
                                )}
                            </label>
                            <Input
                                textArea
                                rows={3}
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder={t(
                                    'adminPaymentRequests.rejectReasonPlaceholder',
                                    'e.g., Transfer could not be verified...',
                                )}
                                maxLength={1000}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                            <Button
                                variant="default"
                                disabled={actionLoading}
                                onClick={() => setRejectModalOpen(false)}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                variant="solid"
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                                loading={actionLoading}
                                onClick={handleReject}
                            >
                                {t('adminPaymentRequests.reject', 'Reject Request')}
                            </Button>
                        </div>
                    </Dialog>
                </>
            )}
        </div>
    )
}

export default AdminPaymentRequestDetails
