import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Input from '@/components/ui/Input'
import Tooltip from '@/components/ui/Tooltip'
import Dialog from '@/components/ui/Dialog'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineTicket,
    HiOutlinePaperClip,
    HiOutlineClock,
    HiOutlineCheckCircle,
    HiOutlineArrowPath,
    HiOutlineArrowDownTray,
    HiOutlinePhoto,
    HiOutlineMagnifyingGlass,
    HiOutlineChatBubbleLeftRight,
    HiOutlineStar,
    HiStar,
    HiOutlineInformationCircle,
    HiOutlineDocumentText,
} from 'react-icons/hi2'
import {
    apiGetUserTicketById,
    apiSubmitTicketRating,
} from '@/services/TicketService'
import {
    TicketStatus,
    type UserTicketDetailResponse,
    type CreateTicketRatingPayload,
} from '@/@types/ticket'
import { useLocaleStore } from '@/store/localeStore'

const UserTicketDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'
    const BackArrow = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    // Data States
    const [ticket, setTicket] = useState<UserTicketDetailResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Rating State
    const [selectedRating, setSelectedRating] = useState<number>(0)
    const [hoverRating, setHoverRating] = useState<number>(0)
    const [ratingComment, setRatingComment] = useState<string>('')
    const [ratingSubmitting, setRatingSubmitting] = useState<boolean>(false)
    const [ratingError, setRatingError] = useState<string>('')

    // Image Preview Modal State
    const [previewImageOpen, setPreviewImageOpen] = useState<boolean>(false)

    // Fetch Details
    const fetchTicketDetails = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetUserTicketById(Number(id))
            if (res?.status && res.data) {
                setTicket(res.data)
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'adminTickets.fetchDetailsFailed',
                            'فشل جلب تفاصيل التذكرة.',
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
                        'adminTickets.fetchDetailsFailed',
                        'فشل جلب تفاصيل التذكرة.',
                    ),
            )
        } finally {
            setLoading(false)
        }
    }, [id, t])

    useEffect(() => {
        fetchTicketDetails()
    }, [fetchTicketDetails])

    // Submit Rating
    const handleRatingSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedRating < 1 || selectedRating > 5) {
            setRatingError(
                t(
                    'userTickets.selectRatingError',
                    'يرجى تحديد تقييم من 1 إلى 5 نجوم',
                ),
            )
            return
        }

        setRatingSubmitting(true)
        setRatingError('')
        setSuccessMsg('')

        try {
            const payload: CreateTicketRatingPayload = {
                rating: selectedRating,
                comment: ratingComment.trim() || undefined,
            }
            const res = await apiSubmitTicketRating(Number(id), payload)
            if (res?.status && res.data) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'userTickets.ratingSuccess',
                            'شكراً لك! تم إرسال تقييمك بنجاح.',
                        ),
                )
                // Update local state with the rating
                setTicket((prev) =>
                    prev ? { ...prev, rating: res.data } : prev,
                )
            } else {
                setRatingError(
                    res?.message ||
                        t('userTickets.ratingFailed', 'فشل إرسال التقييم.'),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setRatingError(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('userTickets.ratingFailed', 'فشل إرسال التقييم.'),
            )
        } finally {
            setRatingSubmitting(false)
        }
    }

    // Status Badge Helper
    const renderStatusBadge = (status: TicketStatus) => {
        switch (status) {
            case TicketStatus.New:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50">
                        <span className="w-2 h-2 rounded-full shrink-0 bg-sky-500 animate-pulse" />
                        {t('ticket.status.new', 'جديدة')}
                    </span>
                )
            case TicketStatus.InProgress:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50">
                        <HiOutlineArrowPath className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        {t('ticket.status.inProgress', 'قيد المعالجة')}
                    </span>
                )
            case TicketStatus.Closed:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50">
                        <HiOutlineCheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        {t('ticket.status.closed', 'مغلقة')}
                    </span>
                )
            default:
                return null
        }
    }

    // Attachment Helpers
    const isImageAttachment = (
        url?: string | null,
        fileName?: string | null,
    ) => {
        if (!url && !fileName) return false
        const ext =
            (fileName || url || '')
                .split('?')[0]
                .split('.')
                .pop()
                ?.toLowerCase() || ''
        return [
            'jpg',
            'jpeg',
            'png',
            'webp',
            'gif',
            'svg',
            'bmp',
            'avif',
        ].includes(ext)
    }

    const isPdfAttachment = (
        url?: string | null,
        fileName?: string | null,
    ) => {
        if (!url && !fileName) return false
        const ext =
            (fileName || url || '')
                .split('?')[0]
                .split('.')
                .pop()
                ?.toLowerCase() || ''
        return ext === 'pdf'
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Spinner size={40} />
            </div>
        )
    }

    if (!ticket) {
        return (
            <div className="max-w-4xl mx-auto p-4 space-y-4">
                <Button
                    variant="plain"
                    icon={<BackArrow />}
                    onClick={() => navigate('/user/tickets')}
                >
                    {t('common.back', 'رجوع')}
                </Button>
                <Alert type="danger">
                    {errorMsg ||
                        t(
                            'adminTickets.fetchDetailsFailed',
                            'فشل جلب تفاصيل التذكرة.',
                        )}
                </Alert>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 w-full p-4 max-w-5xl mx-auto">
            {/* Header Navigation & Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/user/tickets')}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-lg transition-colors cursor-pointer"
                        title={t('common.back', 'رجوع')}
                    >
                        <BackArrow />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-base font-extrabold text-gray-900 dark:text-gray-100 dir-ltr">
                                {ticket.ticketNumber}
                            </span>
                            {renderStatusBadge(ticket.status)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {ticket.ticketTypeName} •{' '}
                            <span className="dir-ltr">
                                {dayjs(ticket.createdAt).format(
                                    'YYYY/MM/DD hh:mm A',
                                )}
                            </span>
                        </p>
                    </div>
                </div>

                <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate('/support')}
                >
                    {t('userTickets.createTicket', 'إنشاء تذكرة جديدة')}
                </Button>
            </div>

            {/* Notifications */}
            {successMsg && (
                <Alert type="success" onClose={() => setSuccessMsg('')}>
                    {successMsg}
                </Alert>
            )}
            {errorMsg && (
                <Alert type="danger" onClose={() => setErrorMsg('')}>
                    {errorMsg}
                </Alert>
            )}

            {/* Ticket Information & Content Card */}
            <Card className="shadow-xs border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="space-y-6">
                    {/* Header Details Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t('userTickets.type', 'نوع التذكرة')}
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                {ticket.ticketTypeName}
                            </span>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t('userTickets.createdAt', 'تاريخ التقديم')}
                            </span>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 dir-ltr">
                                {dayjs(ticket.createdAt).format(
                                    'YYYY/MM/DD hh:mm A',
                                )}
                            </span>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t('userTickets.status', 'حالة التذكرة')}
                            </span>
                            <div className="mt-0.5">
                                {renderStatusBadge(ticket.status)}
                            </div>
                        </div>
                    </div>

                    {/* Ticket Description */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {t(
                                'userTickets.description',
                                'تفاصيل المشكلة / الطلب',
                            )}
                        </h4>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                            {ticket.description}
                        </div>
                    </div>

                    {/* Attachment Section */}
                    {ticket.attachmentUrl && (
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">
                                {t('userTickets.attachment', 'الملف المرفق')}
                            </h4>

                            {isImageAttachment(
                                ticket.attachmentUrl,
                                ticket.attachmentFileName,
                            ) ? (
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 overflow-hidden shadow-2xs">
                                    {/* Header Bar */}
                                    <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-800/50">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center text-base shrink-0">
                                                <HiOutlinePhoto />
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate dir-ltr text-start">
                                                {ticket.attachmentFileName ||
                                                    'attachment_image.png'}
                                            </p>
                                        </div>
                                        <a
                                            href={ticket.attachmentUrl}
                                            download={
                                                ticket.attachmentFileName ||
                                                'attachment'
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-deep transition-colors shrink-0"
                                        >
                                            <HiOutlineArrowDownTray className="text-sm" />
                                            {t(
                                                'common.downloadFile',
                                                'تحميل',
                                            )}
                                        </a>
                                    </div>

                                    {/* Direct Image Preview with click to enlarge */}
                                    <div className="p-3 bg-gray-50/40 dark:bg-gray-900/40 flex justify-center items-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPreviewImageOpen(true)
                                            }
                                            className="block max-w-full overflow-hidden rounded-xl group cursor-zoom-in relative focus:outline-hidden"
                                            title={t(
                                                'common.clickToEnlarge',
                                                'انقر لعرض الصورة بالحجم الكامل',
                                            )}
                                        >
                                            <img
                                                src={ticket.attachmentUrl}
                                                alt={
                                                    ticket.attachmentFileName ||
                                                    'مرفق التذكرة'
                                                }
                                                className="max-h-96 w-auto max-w-full object-contain rounded-xl border border-gray-200 dark:border-gray-700/60 shadow-xs group-hover:opacity-95 transition-opacity"
                                            />
                                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                <span className="bg-black/75 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 backdrop-blur-xs">
                                                    <HiOutlineMagnifyingGlass className="text-sm" />
                                                    {t(
                                                        'common.clickToEnlarge',
                                                        'تكبير الصورة',
                                                    )}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            ) : isPdfAttachment(
                                  ticket.attachmentUrl,
                                  ticket.attachmentFileName,
                              ) ? (
                                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80 overflow-hidden shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between p-3.5 border-b border-gray-100 dark:border-gray-700/60">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center text-xl shrink-0">
                                                <HiOutlineDocumentText />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate dir-ltr text-start">
                                                    {ticket.attachmentFileName ||
                                                        'document.pdf'}
                                                </p>
                                                <span className="text-xs text-gray-400">
                                                    PDF Document
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={ticket.attachmentUrl}
                                            download={
                                                ticket.attachmentFileName ||
                                                'document.pdf'
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-deep transition-colors shrink-0"
                                        >
                                            <HiOutlineArrowDownTray className="text-sm" />
                                            {t(
                                                'common.downloadFile',
                                                'تحميل',
                                            )}
                                        </a>
                                    </div>
                                    <div className="p-3 pt-0">
                                        <iframe
                                            src={ticket.attachmentUrl}
                                            title={
                                                ticket.attachmentFileName ||
                                                'PDF Preview'
                                            }
                                            className="w-full h-80 rounded-xl border border-gray-200 dark:border-gray-700"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-primary flex items-center justify-center text-xl shrink-0">
                                            <HiOutlineDocumentText />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate dir-ltr text-left">
                                                {ticket.attachmentFileName ||
                                                    'attachment_file'}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {t(
                                                    'userTickets.hasAttachment',
                                                    'مرفق',
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <a
                                        href={ticket.attachmentUrl}
                                        download={
                                            ticket.attachmentFileName ||
                                            'attachment'
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-deep transition-colors shrink-0"
                                    >
                                        <HiOutlineArrowDownTray className="text-sm" />
                                        {t(
                                            'common.downloadFile',
                                            'تحميل',
                                        )}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Card>

            {/* Admin Response Card */}
            <Card
                className={`shadow-xs border ${
                    ticket.adminReply
                        ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'border-gray-100 dark:border-gray-800'
                }`}
            >
                <div className="flex items-start gap-3.5">
                    <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                            ticket.adminReply
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}
                    >
                        <HiOutlineChatBubbleLeftRight />
                    </div>
                    <div className="space-y-2 flex-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {t(
                                'userTickets.adminReply',
                                'رد فريق الدعم والإدارة',
                            )}
                        </h4>

                        {ticket.adminReply ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/40 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line shadow-2xs">
                                {ticket.adminReply}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                {t(
                                    'userTickets.adminReplyAwaiting',
                                    'التذكرة قيد المعالجة من قبل فريق الدعم الفني، وسيتم الرد عليك في أقرب وقت.',
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </Card>

            {/* Post-Closure Rating Section */}
            {ticket.status === TicketStatus.Closed && (
                <Card className="shadow-xs border border-amber-100 dark:border-amber-950/50 bg-amber-50/20 dark:bg-amber-950/10 overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                                <HiStar />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    {t(
                                        'userTickets.ratingTitle',
                                        'تقييم خدمة الدعم الفني',
                                    )}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t(
                                        'userTickets.ratingDescription',
                                        'رأيك يهمنا لمساعدتنا في تحسين مستوى وجودة خدماتنا.',
                                    )}
                                </p>
                            </div>
                        </div>

                        {ticket.rating ? (
                            /* Already Rated View */
                            <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-amber-200/70 dark:border-amber-900/40 space-y-2.5 shadow-2xs">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <HiStar
                                                key={star}
                                                className={`text-xl ${
                                                    star <=
                                                    (ticket.rating?.rating || 0)
                                                        ? 'text-amber-400'
                                                        : 'text-gray-200 dark:text-gray-700'
                                                }`}
                                            />
                                        ))}
                                        <span className="ms-2 font-bold text-sm text-gray-800 dark:text-gray-200">
                                            {ticket.rating.rating} / 5
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 dir-ltr">
                                        {dayjs(ticket.rating.createdAt).format(
                                            'YYYY/MM/DD',
                                        )}
                                    </span>
                                </div>

                                {ticket.rating.comment && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 italic pt-1 border-t border-gray-100 dark:border-gray-800">
                                        "{ticket.rating.comment}"
                                    </p>
                                )}
                            </div>
                        ) : (
                            /* Interactive Rating Form */
                            <form
                                onSubmit={handleRatingSubmit}
                                className="space-y-4 pt-2"
                            >
                                {ratingError && (
                                    <Alert
                                        type="danger"
                                        onClose={() => setRatingError('')}
                                    >
                                        {ratingError}
                                    </Alert>
                                )}

                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                                        {t(
                                            'userTickets.ratingPrompt',
                                            'كيف تقيم تجربتك مع حل هذه التذكرة؟',
                                        )}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => {
                                            const isFilled =
                                                (hoverRating ||
                                                    selectedRating) >= star
                                            return (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onMouseEnter={() =>
                                                        setHoverRating(star)
                                                    }
                                                    onMouseLeave={() =>
                                                        setHoverRating(0)
                                                    }
                                                    onClick={() =>
                                                        setSelectedRating(star)
                                                    }
                                                    className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                                                >
                                                    {isFilled ? (
                                                        <HiStar className="text-amber-400 drop-shadow-xs" />
                                                    ) : (
                                                        <HiOutlineStar className="text-gray-300 dark:text-gray-600 hover:text-amber-300" />
                                                    )}
                                                </button>
                                            )
                                        })}
                                        {selectedRating > 0 && (
                                            <span className="ms-2 font-bold text-sm text-amber-600 dark:text-amber-400">
                                                {selectedRating} / 5
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Input
                                        textArea
                                        rows={3}
                                        placeholder={t(
                                            'userTickets.ratingCommentPlaceholder',
                                            'أضف ملاحظاتك أو تعليقك هنا (اختياري)...',
                                        )}
                                        value={ratingComment}
                                        onChange={(e) =>
                                            setRatingComment(e.target.value)
                                        }
                                        maxLength={1000}
                                    />
                                    <span className="text-[11px] text-gray-400 mt-1 block text-end">
                                        {ratingComment.length} / 1000
                                    </span>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        variant="solid"
                                        type="submit"
                                        loading={ratingSubmitting}
                                        disabled={selectedRating === 0}
                                    >
                                        {t(
                                            'userTickets.submitRating',
                                            'إرسال التقييم',
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </Card>
            )}

            {/* Image Preview Lightbox Dialog */}
            <Dialog
                isOpen={previewImageOpen}
                onClose={() => setPreviewImageOpen(false)}
                onRequestClose={() => setPreviewImageOpen(false)}
                width={800}
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-2 min-w-0">
                            <HiOutlinePhoto className="text-primary text-xl shrink-0" />
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate dir-ltr text-start">
                                {ticket?.attachmentFileName ||
                                    'attachment_image.png'}
                            </h4>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {ticket?.attachmentUrl && (
                                <a
                                    href={ticket.attachmentUrl}
                                    download={
                                        ticket.attachmentFileName ||
                                        'attachment'
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-deep transition-colors"
                                >
                                    <HiOutlineArrowDownTray className="text-sm" />
                                    {t('common.downloadFile', 'تحميل')}
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-center max-h-[75vh] overflow-auto bg-gray-50 dark:bg-gray-900/60 rounded-xl p-2">
                        {ticket?.attachmentUrl && (
                            <img
                                src={ticket.attachmentUrl}
                                alt={
                                    ticket.attachmentFileName ||
                                    'مرفق التذكرة'
                                }
                                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
                            />
                        )}
                    </div>
                </div>
            </Dialog>
        </div>
    )
}

export default UserTicketDetails
