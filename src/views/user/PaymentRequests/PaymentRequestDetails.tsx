import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Tag from '@/components/ui/Tag'
import Dialog from '@/components/ui/Dialog'
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
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineIdentification,
    HiOutlineArrowTopRightOnSquare,
} from 'react-icons/hi2'
import { apiGetMyPaymentRequestById } from '@/services/PaymentService'
import type {
    MyPaymentRequestDetail,
    PaymentRequestStatus,
} from '@/@types/payment'
import { formatPrice } from '@/utils/catalog'
import { useLocaleStore } from '@/store/localeStore'

const UserPaymentRequestDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'
    const BackArrow = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    // Data States
    const [request, setRequest] = useState<MyPaymentRequestDetail | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')

    // Lightbox / Image modal
    const [previewOpen, setPreviewOpen] = useState<boolean>(false)

    const fetchDetails = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetMyPaymentRequestById(Number(id))
            const data = (res as any)?.data?.data || (res as any)?.data || res
            if (
                data &&
                typeof data === 'object' &&
                ('id' in data || 'courseId' in data || 'amount' in data)
            ) {
                setRequest(data as MyPaymentRequestDetail)
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'userPaymentRequests.fetchDetailsFailed',
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
                        'userPaymentRequests.fetchDetailsFailed',
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
        ? request.proofUrl.toLowerCase().includes('.pdf')
        : false

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        size="sm"
                        variant="default"
                        icon={<BackArrow />}
                        onClick={() => navigate('/user/payment-requests')}
                    >
                        {t('common.back', 'Back')}
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                                {t(
                                    'userPaymentRequests.detailsTitle',
                                    'Payment Request Details',
                                )}
                            </h1>
                            {request && renderStatusTag(request.status)}
                        </div>
                        {request && (
                            <p className="text-xs text-text-muted mt-0.5">
                                #{request.id} •{' '}
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

            {/* Error banner */}
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
                                'userPaymentRequests.requestNotFound',
                                'Payment request details could not be loaded.',
                            )}
                        </h3>
                        <p className="text-xs text-text-secondary max-w-md mx-auto">
                            {errorMsg ||
                                t(
                                    'userPaymentRequests.fetchDetailsFailed',
                                    'Failed to fetch payment request details. Please try again.',
                                )}
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => navigate('/user/payment-requests')}
                        >
                            {t(
                                'userPaymentRequests.title',
                                'Back to My Requests',
                            )}
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
                    {/* Status Alert Banners */}
                    {request.status === 'Approved' && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
                                    <HiOutlineCheckCircle />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-text-primary">
                                        {t(
                                            'userPaymentRequests.approvedBanner',
                                            'Your payment request was approved and you are enrolled in this course!',
                                        )}
                                    </h3>
                                    <p className="text-xs text-text-secondary mt-0.5">
                                        {request.courseName || request.courseTitle}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="solid"
                                icon={<HiOutlineArrowTopRightOnSquare />}
                                onClick={() =>
                                    navigate(`/learn/${request.courseId}`)
                                }
                                className="shrink-0"
                            >
                                {t(
                                    'userPaymentRequests.goToCourse',
                                    'Go to Course & Start Learning',
                                )}
                            </Button>
                        </div>
                    )}

                    {request.status === 'Rejected' && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-2">
                            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm sm:text-base">
                                <HiOutlineXCircle className="text-xl shrink-0" />
                                <span>
                                    {t(
                                        'userPaymentRequests.rejectionReason',
                                        'Rejection Reason from Administration',
                                    )}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-text-primary ps-7 leading-relaxed whitespace-pre-line">
                                {request.rejectionReason ||
                                    t(
                                        'common.noDataFound',
                                        'No details provided.',
                                    )}
                            </p>
                        </div>
                    )}

                    {/* Request Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Course Info Card */}
                        <Card className="border border-border shadow-sm p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-border">
                                <HiOutlineAcademicCap className="text-primary text-xl" />
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                    {t(
                                        'userPaymentRequests.courseInfo',
                                        'Course Info',
                                    )}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'userPaymentRequests.course',
                                            'Course',
                                        )}
                                    </span>
                                    <h3 className="text-base font-bold text-text-primary mt-0.5">
                                        {request.courseName || request.courseTitle || '—'}
                                    </h3>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'userPaymentRequests.amount',
                                            'Amount',
                                        )}
                                    </span>
                                    <span className="text-lg font-black text-primary block mt-0.5">
                                        {formatPrice(request.amount, lang)}
                                    </span>
                                </div>

                                <div>
                                    <Button
                                        size="xs"
                                        variant="default"
                                        icon={<HiOutlineArrowTopRightOnSquare />}
                                        onClick={() =>
                                            navigate(`/courses/${request.courseId}`)
                                        }
                                    >
                                        {t('course.viewCourse', 'View Course Page')}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Payment & Transfer Card */}
                        <Card className="border border-border shadow-sm p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b border-border">
                                <HiOutlineCreditCard className="text-primary text-xl" />
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                    {t(
                                        'userPaymentRequests.requestInfo',
                                        'Transfer Details',
                                    )}
                                </h2>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'userPaymentRequests.paymentMethod',
                                            'Payment Method',
                                        )}
                                    </span>
                                    <span className="text-sm font-semibold text-text-primary mt-0.5 block">
                                        {(isRtl
                                            ? request.paymentMethodNameAr
                                            : request.paymentMethodNameEn) ||
                                            request.paymentMethodName ||
                                            request.paymentMethodNameAr ||
                                            request.paymentMethodNameEn ||
                                            '—'}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block">
                                        {t(
                                            'userPaymentRequests.sender',
                                            'Sender Account / Name',
                                        )}
                                    </span>
                                    <span className="text-sm font-mono font-bold text-text-primary mt-0.5 block">
                                        {request.senderAccount}
                                    </span>
                                </div>

                                {request.studentNotes && (
                                    <div>
                                        <span className="text-xs text-text-muted block">
                                            {t(
                                                'userPaymentRequests.studentNotes',
                                                'Student Notes',
                                            )}
                                        </span>
                                        <p className="text-xs text-text-secondary mt-0.5 whitespace-pre-line bg-surface-alt/40 p-2.5 rounded-lg border border-border">
                                            {request.studentNotes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Receipt Document Card */}
                    <Card className="border border-border shadow-sm p-5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border">
                            <div className="flex items-center gap-2">
                                <HiOutlineIdentification className="text-primary text-xl" />
                                <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                                    {t(
                                        'userPaymentRequests.proofDocument',
                                        'Attached Receipt',
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
                                                    PDF Document
                                                </h4>
                                                <p className="text-xs text-text-secondary">
                                                    {t(
                                                        'userPaymentRequests.downloadProof',
                                                        'Download or view receipt',
                                                    )}
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
                                            className="relative max-w-md rounded-xl overflow-hidden border border-border bg-surface-alt cursor-pointer group"
                                            onClick={() => setPreviewOpen(true)}
                                        >
                                            <img
                                                src={request.proofUrl}
                                                alt="Payment Proof"
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
                            width={800}
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
                </>
            )}
        </div>
    )
}

export default UserPaymentRequestDetails
