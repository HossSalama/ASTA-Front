import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import useTranslation from '@/utils/hooks/useTranslation'
import dayjs from 'dayjs'
import {
    HiOutlineArrowLeft,
    HiOutlineArrowRight,
    HiOutlineTicket,
    HiOutlineUser,
    HiOutlineEnvelope,
    HiOutlinePhone,
    HiOutlineClock,
    HiOutlineCalendar,
    HiOutlineCheckCircle,
    HiOutlineArrowPath,
    HiOutlineArrowDownTray,
    HiOutlinePhoto,
    HiOutlineMagnifyingGlass,
    HiOutlineXMark,
    HiOutlineChatBubbleLeftRight,
    HiStar,
    HiOutlineDocumentText,
    HiOutlineShieldCheck,
    HiOutlineXCircle,
    HiOutlineLockClosed,
} from 'react-icons/hi2'
import {
    apiGetAdminTicketById,
    apiUpdateAdminTicketStatus,
    apiCloseAdminTicket,
} from '@/services/TicketService'
import {
    TicketStatus,
    TicketPriority,
    type AdminTicketDetailResponse,
} from '@/@types/ticket'
import { useLocaleStore } from '@/store/localeStore'

const AdminTicketDetails = () => {
    const { id } = useParams<{ id: string }>()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const isRtl = currentLang === 'ar'
    const BackArrow = isRtl ? HiOutlineArrowRight : HiOutlineArrowLeft

    // Data States
    const [ticket, setTicket] = useState<AdminTicketDetailResponse | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [errorMsg, setErrorMsg] = useState<string>('')
    const [successMsg, setSuccessMsg] = useState<string>('')

    // Status Updating State
    const [statusUpdating, setStatusUpdating] = useState<boolean>(false)

    // Close Modal State
    const [closeModalOpen, setCloseModalOpen] = useState<boolean>(false)
    const [adminReply, setAdminReply] = useState<string>('')
    const [closeSubmitting, setCloseSubmitting] = useState<boolean>(false)
    const [closeError, setCloseError] = useState<string>('')

    // Image Preview Modal State
    const [previewImageOpen, setPreviewImageOpen] = useState<boolean>(false)

    // Fetch Admin Ticket Details
    const fetchDetails = useCallback(async () => {
        if (!id) return
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await apiGetAdminTicketById(Number(id))
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
        fetchDetails()
    }, [fetchDetails])

    // Update Status Between New <-> InProgress
    const handleUpdateStatus = async (newStatus: TicketStatus) => {
        if (!ticket) return
        setStatusUpdating(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await apiUpdateAdminTicketStatus(ticket.id, {
                status: newStatus,
            })
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'adminTickets.statusUpdated',
                            'تم تحديث حالة التذكرة بنجاح.',
                        ),
                )
                fetchDetails()
            } else {
                setErrorMsg(
                    res?.message ||
                        t(
                            'adminTickets.statusUpdateFailed',
                            'فشل تحديث حالة التذكرة.',
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
                        'adminTickets.statusUpdateFailed',
                        'فشل تحديث حالة التذكرة.',
                    ),
            )
        } finally {
            setStatusUpdating(false)
        }
    }

    // Submit Close Ticket
    const handleCloseSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!ticket) return

        setCloseSubmitting(true)
        setCloseError('')
        try {
            const res = await apiCloseAdminTicket(ticket.id, {
                adminReply: adminReply.trim() || undefined,
            })
            if (res?.status) {
                setSuccessMsg(
                    res.message ||
                        t(
                            'adminTickets.closeSuccess',
                            'تم إغلاق التذكرة بنجاح.',
                        ),
                )
                setCloseModalOpen(false)
                setAdminReply('')
                fetchDetails()
            } else {
                setCloseError(
                    res?.message ||
                        t('adminTickets.closeFailed', 'فشل إغلاق التذكرة.'),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setCloseError(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('adminTickets.closeFailed', 'فشل إغلاق التذكرة.'),
            )
        } finally {
            setCloseSubmitting(false)
        }
    }

    // Priority Badge Helper
    const renderPriorityBadge = (p: TicketPriority) => {
        switch (p) {
            case TicketPriority.Low:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {t('ticket.priority.low', 'منخفضة (Low)')}
                    </span>
                )
            case TicketPriority.Medium:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        {t('ticket.priority.medium', 'متوسطة (Medium)')}
                    </span>
                )
            case TicketPriority.High:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60">
                        {t('ticket.priority.high', 'مرتفعة (High)')}
                    </span>
                )
            case TicketPriority.Critical:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                        {t('ticket.priority.critical', 'حرجة (Critical)')}
                    </span>
                )
            default:
                return null
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
                    onClick={() => navigate('/admin/tickets')}
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
        <div className="flex flex-col gap-6 w-full p-4 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/tickets')}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-lg transition-colors cursor-pointer"
                        title={t('common.back', 'رجوع')}
                    >
                        <BackArrow />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-xl font-extrabold text-gray-900 dark:text-gray-100 dir-ltr">
                                {ticket.ticketNumber}
                            </span>
                            {renderStatusBadge(ticket.status)}
                            {renderPriorityBadge(ticket.priority)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {isRtl
                                ? ticket.ticketTypeNameAr
                                : ticket.ticketTypeNameEn}{' '}
                            •{' '}
                            <span className="dir-ltr">
                                {dayjs(ticket.createdAt).format(
                                    'YYYY/MM/DD hh:mm A',
                                )}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-2">
                    {ticket.status === TicketStatus.New && (
                        <>
                            <Button
                                variant="solid"
                                icon={<HiOutlineArrowPath />}
                                loading={statusUpdating}
                                onClick={() =>
                                    handleUpdateStatus(TicketStatus.InProgress)
                                }
                            >
                                {t(
                                    'adminTickets.markInProgress',
                                    'بدء المعالجة',
                                )}
                            </Button>
                            <Button
                                variant="default"
                                className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30"
                                icon={<HiOutlineLockClosed />}
                                onClick={() => setCloseModalOpen(true)}
                            >
                                {t('adminTickets.closeTicket', 'إغلاق التذكرة')}
                            </Button>
                        </>
                    )}

                    {ticket.status === TicketStatus.InProgress && (
                        <>
                            <Button
                                variant="default"
                                icon={<HiOutlineArrowPath />}
                                loading={statusUpdating}
                                onClick={() =>
                                    handleUpdateStatus(TicketStatus.New)
                                }
                            >
                                {t('adminTickets.markNew', 'إرجاع إلى جديد')}
                            </Button>
                            <Button
                                variant="solid"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                icon={<HiOutlineLockClosed />}
                                onClick={() => setCloseModalOpen(true)}
                            >
                                {t('adminTickets.closeTicket', 'إغلاق التذكرة')}
                            </Button>
                        </>
                    )}

                    {ticket.status === TicketStatus.Closed && (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                            <HiOutlineLockClosed className="text-sm" />
                            {t('adminTickets.closedBadge', 'مغلقة نهائياً')}
                        </span>
                    )}
                </div>
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

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left (2 cols): Ticket Content & Admin Response */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ticket Content Card */}
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800 space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                <HiOutlineTicket className="text-primary text-lg" />
                                {t('adminTickets.ticketInfo', 'بيانات التذكرة')}
                            </h4>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 font-medium">
                                    {t(
                                        'adminTickets.typePriority',
                                        'أولوية النوع',
                                    )}
                                    :
                                </span>
                                {renderPriorityBadge(ticket.ticketTypePriority)}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-medium block">
                                {t('adminTickets.type', 'نوع التذكرة')}
                            </span>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                    {ticket.ticketTypeNameAr}
                                </span>
                                <span className="text-xs text-gray-400 dir-ltr">
                                    ({ticket.ticketTypeNameEn})
                                </span>
                            </div>
                        </div>

                        <div>
                            <h5 className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1.5">
                                {t('userTickets.description', 'تفاصيل المشكلة')}
                            </h5>
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                                {ticket.description}
                            </div>
                        </div>

                        {/* Attachment */}
                        {ticket.attachmentUrl && (
                            <div>
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
                                                        'مرفق من العميل',
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
                                            {t('common.downloadFile', 'تحميل')}
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Official Admin Reply & Rating (If Closed) */}
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
                                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                    {t(
                                        'adminTickets.adminReplyLabel',
                                        'الرد الرسمي للإدارة',
                                    )}
                                </h4>

                                {ticket.adminReply ? (
                                    <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-emerald-100 dark:border-emerald-900/40 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line shadow-2xs">
                                        {ticket.adminReply}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                        {ticket.status === TicketStatus.Closed
                                            ? t(
                                                  'adminTickets.closedNoReply',
                                                  'تم إغلاق التذكرة بدون رد رسمي.',
                                              )
                                            : t(
                                                  'adminTickets.notRepliedYet',
                                                  'لم يتم إضافة رد رسمي بعد. يمكنك كتابة رد رسمي عند إغلاق التذكرة.',
                                              )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Customer Rating Card */}
                    {ticket.status === TicketStatus.Closed && (
                        <Card className="shadow-xs border border-amber-100 dark:border-amber-950/50 bg-amber-50/20 dark:bg-amber-950/10">
                            <div className="flex items-start gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shrink-0">
                                    <HiStar />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                                        {t(
                                            'adminTickets.customerRating',
                                            'تقييم ورأي العميل',
                                        )}
                                    </h4>

                                    {ticket.rating ? (
                                        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-amber-200/70 dark:border-amber-900/40 space-y-2 shadow-2xs">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    {[1, 2, 3, 4, 5].map(
                                                        (star) => (
                                                            <HiStar
                                                                key={star}
                                                                className={`text-xl ${
                                                                    star <=
                                                                    ticket
                                                                        .rating!
                                                                        .rating
                                                                        ? 'text-amber-400'
                                                                        : 'text-gray-200 dark:text-gray-700'
                                                                }`}
                                                            />
                                                        ),
                                                    )}
                                                    <span className="ms-2 font-bold text-sm text-gray-800 dark:text-gray-200">
                                                        {ticket.rating.rating} /
                                                        5
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-400 dir-ltr">
                                                    {dayjs(
                                                        ticket.rating.createdAt,
                                                    ).format(
                                                        'YYYY/MM/DD hh:mm A',
                                                    )}
                                                </span>
                                            </div>

                                            {ticket.rating.comment && (
                                                <p className="text-sm text-gray-700 dark:text-gray-300 italic pt-2 border-t border-gray-100 dark:border-gray-800">
                                                    "{ticket.rating.comment}"
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            {t(
                                                'adminTickets.notRatedYet',
                                                'لم يقم العميل بتقييم هذه التذكرة بعد.',
                                            )}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Right (1 col): Customer Info & Audit Card */}
                <div className="space-y-6">
                    {/* Customer Info Card */}
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <HiOutlineUser className="text-primary text-lg" />
                            {t('adminTickets.userInfo', 'معلومات العميل')}
                        </h4>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                                    <HiOutlineUser />
                                </div>
                                <div className="min-w-0">
                                    <span className="text-xs text-gray-400 block">
                                        {t(
                                            'adminTickets.userName',
                                            'اسم العميل',
                                        )}
                                    </span>
                                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate block">
                                        {ticket.userName}
                                    </span>
                                </div>
                            </div>

                            {ticket.userEmail && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                                        <HiOutlineEnvelope />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs text-gray-400 block">
                                            {t(
                                                'adminTickets.userEmail',
                                                'البريد الإلكتروني',
                                            )}
                                        </span>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate block dir-ltr text-start">
                                            {ticket.userEmail}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {ticket.userPhoneNumber && (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                                        <HiOutlinePhone />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-xs text-gray-400 block">
                                            {t(
                                                'adminTickets.userPhone',
                                                'رقم الهاتف',
                                            )}
                                        </span>
                                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 dir-ltr text-start block">
                                            {ticket.userPhoneNumber}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Audit Trail Card */}
                    <Card className="shadow-xs border border-gray-100 dark:border-gray-800 space-y-4">
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <HiOutlineClock className="text-primary text-lg" />
                            {t(
                                'adminTickets.auditInfo',
                                'سجل التدقيق والمتابعة',
                            )}
                        </h4>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1">
                                <span className="text-gray-400 block font-medium">
                                    {t('common.createdAt', 'تاريخ الإنشاء')}
                                </span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200 dir-ltr block">
                                    {dayjs(ticket.createdAt).format(
                                        'YYYY/MM/DD hh:mm A',
                                    )}
                                </span>
                            </div>

                            {ticket.closedAt && (
                                <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 space-y-1">
                                    <span className="text-emerald-600 dark:text-emerald-400 block font-medium">
                                        {t(
                                            'adminTickets.closedAt',
                                            'تاريخ الإغلاق',
                                        )}
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 dir-ltr block">
                                        {dayjs(ticket.closedAt).format(
                                            'YYYY/MM/DD hh:mm A',
                                        )}
                                    </span>
                                    {ticket.closedByName && (
                                        <span className="text-gray-500 dark:text-gray-400 block mt-1">
                                            {t(
                                                'adminTickets.closedBy',
                                                'بواسطة',
                                            )}
                                            :{' '}
                                            <strong>
                                                {ticket.closedByName}
                                            </strong>
                                        </span>
                                    )}
                                </div>
                            )}

                            {ticket.updatedAt && (
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 space-y-1">
                                    <span className="text-gray-400 block font-medium">
                                        {t('common.updatedAt', 'آخر تحديث')}
                                    </span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 dir-ltr block">
                                        {dayjs(ticket.updatedAt).format(
                                            'YYYY/MM/DD hh:mm A',
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Close Ticket Dialog */}
            <Dialog
                isOpen={closeModalOpen}
                onClose={() => setCloseModalOpen(false)}
                onRequestClose={() => setCloseModalOpen(false)}
                width={560}
            >
                <div className="p-4 sm:p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl mb-4">
                        <HiOutlineLockClosed />
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {t(
                            'adminTickets.closeTicketTitle',
                            'إغلاق تذكرة الدعم الفني',
                        )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                        {t(
                            'adminTickets.closeTicketSubtitle',
                            'إغلاق التذكرة نهائيًا وإرسال الرد الرسمي للعميل.',
                        )}
                    </p>

                    {closeError && (
                        <Alert
                            type="danger"
                            className="mb-4"
                            onClose={() => setCloseError('')}
                        >
                            {closeError}
                        </Alert>
                    )}

                    <form onSubmit={handleCloseSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t(
                                    'adminTickets.adminReplyLabel',
                                    'الرد الرسمي للعميل',
                                )}
                            </label>
                            <Input
                                textArea
                                rows={4}
                                placeholder={t(
                                    'adminTickets.adminReplyPlaceholder',
                                    'اكتب الرد التوضيحي للعميل هنا...',
                                )}
                                value={adminReply}
                                onChange={(e) => setAdminReply(e.target.value)}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                type="button"
                                variant="plain"
                                onClick={() => setCloseModalOpen(false)}
                                disabled={closeSubmitting}
                            >
                                {t('common.cancel', 'إلغاء')}
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                className="bg-red-600 hover:bg-red-700 text-white"
                                loading={closeSubmitting}
                            >
                                {t(
                                    'adminTickets.confirmClose',
                                    'تأكيد الإغلاق',
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </Dialog>

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

export default AdminTicketDetails
