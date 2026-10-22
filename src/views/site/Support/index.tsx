import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    TbChevronDown,
    TbUpload,
    TbCheck,
    TbCopy,
    TbPaperclip,
    TbX,
    TbTicket,
    TbHeadset,
    TbCategory,
    TbClockHour4,
    TbHelpCircle,
    TbArrowLeft,
} from 'react-icons/tb'
import Container from '@/components/shared/Container'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import Spinner from '@/components/ui/Spinner'
import { useAuth } from '@/auth'
import {
    apiGetPublicTicketTypes,
    apiCreateTicket,
} from '@/services/TicketService'
import type {
    TicketTypePublicResponse,
    UserTicketDetailResponse,
} from '@/@types/ticket'

/* ─── helpers ───────────────────────────────────────────────────── */

const labelClass =
    'flex items-center gap-1.5 text-sm font-semibold text-text-primary'
const borderAccent =
    'inline-block w-[3px] h-[1em] rounded-full bg-secondary shrink-0'

const selectClass =
    'h-11 w-full appearance-none rounded-md border border-border bg-surface px-3 pe-10 text-sm text-text-primary ' +
    'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const textareaClass =
    'w-full min-h-[140px] rounded-md border border-border bg-surface p-3 text-sm text-text-primary resize-y ' +
    'focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

/* ─── component ─────────────────────────────────────────────────── */

const Support = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { authenticated } = useAuth()

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Dynamic Ticket Types
    const [ticketTypes, setTicketTypes] = useState<TicketTypePublicResponse[]>(
        [],
    )
    const [loadingTypes, setLoadingTypes] = useState<boolean>(true)

    // Form states
    const [selectedTypeId, setSelectedTypeId] = useState<string>('')
    const [description, setDescription] = useState<string>('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [apiError, setApiError] = useState<string>('')

    // Submitted state & ticket data
    const [createdTicket, setCreatedTicket] =
        useState<UserTicketDetailResponse | null>(null)
    const [copied, setCopied] = useState(false)

    // Fetch active ticket types
    useEffect(() => {
        let isMounted = true
        setLoadingTypes(true)
        apiGetPublicTicketTypes()
            .then((res) => {
                if (isMounted && res?.status && res.data) {
                    setTicketTypes(res.data || [])
                }
            })
            .catch(() => {
                if (isMounted) {
                    setTicketTypes([])
                }
            })
            .finally(() => {
                if (isMounted) setLoadingTypes(false)
            })
        return () => {
            isMounted = false
        }
    }, [])

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (files && files.length > 0) {
            const file = files[0]
            // Validate file size: 20MB limit
            const maxSizeInBytes = 20 * 1024 * 1024
            if (file.size > maxSizeInBytes) {
                setErrors((prev) => ({
                    ...prev,
                    file: t(
                        'site.support.fileTooLarge',
                        'حجم الملف يتجاوز الحد الأقصى المسموح به (20 ميجابايت).',
                    ),
                }))
                return
            }

            setErrors((prev) => ({ ...prev, file: '' }))
            setSelectedFile(file)
        }
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleCopyNumber = () => {
        if (createdTicket?.ticketNumber) {
            navigator.clipboard.writeText(createdTicket.ticketNumber)
            setCopied(true)
            setTimeout(() => setCopied(false), 2500)
        }
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setApiError('')

        // If not authenticated, redirect to sign in
        if (!authenticated) {
            navigate('/sign-in')
            return
        }

        const next: Record<string, string> = {}

        if (!selectedTypeId) {
            next.type = t('site.support.required', 'هذا الحقل مطلوب')
        }
        if (!description.trim()) {
            next.description = t('site.support.required', 'هذا الحقل مطلوب')
        } else if (description.trim().length > 4000) {
            next.description = t(
                'site.support.descriptionTooLong',
                'الوصف يجب ألا يتجاوز 4000 حرف',
            )
        }

        setErrors(next)
        if (Object.keys(next).length > 0) return

        setSubmitting(true)

        try {
            const formData = new FormData()
            formData.append('ticketTypeId', selectedTypeId)
            formData.append('description', description.trim())
            if (selectedFile) {
                formData.append('attachment', selectedFile)
            }

            const res = await apiCreateTicket(formData)
            if (res?.status && res.data) {
                setCreatedTicket(res.data)
                setSelectedTypeId('')
                setDescription('')
                setSelectedFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
            } else {
                setApiError(
                    res?.message ||
                        t(
                            'common.operationFailed',
                            'فشلت العملية. يرجى المحاولة مرة أخرى.',
                        ),
                )
            }
        } catch (err: unknown) {
            const errorObj = err as {
                response?: { data?: { message?: string } }
                message?: string
            }
            setApiError(
                errorObj?.response?.data?.message ||
                    errorObj.message ||
                    t('common.operationFailed', 'حدث خطأ أثناء إرسال التذكرة.'),
            )
        } finally {
            setSubmitting(false)
        }
    }

    const renderError = (field: string) =>
        errors[field] ? (
            <p className="mt-1 text-xs text-red-500 font-medium">
                {errors[field]}
            </p>
        ) : null

    return (
        <main className="min-h-screen bg-background pb-20">
            {/* ── Header ────────────────────────────────────────────── */}
            <div className="relative overflow-hidden bg-gradient-to-b from-[#dbeafe] via-[#e0f0ff] to-background pb-10 pt-8">
                {/* decorative wave */}
                <div
                    className="pointer-events-none absolute bottom-0 start-0 end-0 h-10 rounded-t-[40px] bg-background"
                    aria-hidden="true"
                />

                <Container>
                    <div className="flex items-start justify-between lg:items-center">
                        {/* text */}
                        <div className="max-w-sm lg:max-w-lg">
                            <p className="text-lg font-medium text-text-secondary">
                                {t('site.support.eyebrow', 'هل تحتاج مساعدة؟')}
                            </p>
                            <h1 className="mt-1 text-2xl font-extrabold leading-tight text-text-primary sm:text-3xl lg:text-4xl">
                                {t('site.support.title', 'أرسل طلبك الآن')}
                            </h1>
                            {authenticated && (
                                <div className="mt-3">
                                    <Link
                                        to="/user/tickets"
                                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-primary hover:underline"
                                    >
                                        <TbTicket className="text-base" />
                                        {t(
                                            'userTickets.title',
                                            'عرض ومتابعة تذاكري السابقة',
                                        )}
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* headset illustration */}
                        <div className="shrink-0 ms-4">
                            <svg
                                viewBox="0 0 120 110"
                                className="w-24 sm:w-28 lg:w-36"
                                aria-hidden="true"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M20 55 C20 30 40 12 60 12 C80 12 100 30 100 55"
                                    stroke="#2F78AE"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <rect
                                    x="8"
                                    y="50"
                                    width="18"
                                    height="28"
                                    rx="9"
                                    fill="#3F8CC4"
                                />
                                <rect
                                    x="94"
                                    y="50"
                                    width="18"
                                    height="28"
                                    rx="9"
                                    fill="#3F8CC4"
                                />
                                <path
                                    d="M26 75 Q26 95 50 98"
                                    stroke="#2F78AE"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                                <circle cx="50" cy="100" r="5" fill="#2F78AE" />
                                <rect
                                    x="58"
                                    y="38"
                                    width="44"
                                    height="30"
                                    rx="8"
                                    fill="#6FAEDC"
                                />
                                <rect
                                    x="58"
                                    y="38"
                                    width="44"
                                    height="30"
                                    rx="8"
                                    fill="white"
                                    fillOpacity="0.25"
                                />
                                <circle cx="72" cy="53" r="3" fill="white" />
                                <circle cx="80" cy="53" r="3" fill="white" />
                                <circle cx="88" cy="53" r="3" fill="white" />
                                <path
                                    d="M70 68 L65 75 L80 68 Z"
                                    fill="#6FAEDC"
                                />
                            </svg>
                        </div>
                    </div>
                </Container>
            </div>

            {/* ── Body ──────────────────────────────────────────────── */}
            <Container>
                <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12 xl:gap-16">
                    {/* ── Sidebar ─────────────────────── */}
                    <aside className="order-2 lg:order-1 pt-6 lg:pt-10">
                        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-surface shadow-sm p-6 space-y-6 lg:sticky lg:top-24">
                            {/* Header with Icon & Title */}
                            <div className="flex items-start gap-3.5">
                                <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 text-primary flex items-center justify-center shrink-0">
                                    <TbHeadset className="text-2xl" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-text-primary leading-tight">
                                        {t(
                                            'site.support.sidebarTitle',
                                            'إرشادات الدعم الفني',
                                        )}
                                    </h2>
                                    <p className="mt-1 text-xs text-text-secondary leading-relaxed">
                                        {t(
                                            'site.support.sidebarBody',
                                            'املأ النموذج وسيتواصل معك فريقنا في أقرب وقت ممكن.',
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* SLA / Response Time Badge */}
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span>
                                    {t(
                                        'site.support.responseTime',
                                        'متوسط وقت الرد: خلال يوم عمل واحد',
                                    )}
                                </span>
                            </div>

                            {/* Guidance Items */}
                            <div className="space-y-4 pt-1">
                                {/* Item 1: Category */}
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <TbCategory className="text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-text-primary">
                                            {t(
                                                'site.support.tipCategoryTitle',
                                                'اختر نوع الطلب بدقة',
                                            )}
                                        </h3>
                                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                                            {t(
                                                'site.support.typeHint',
                                                'اختر نوع الطلب الذي يصف مشكلتك لتوجيهها للفريق المختص مباشرة.',
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 2: Attachments */}
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <TbPaperclip className="text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-text-primary">
                                            {t(
                                                'site.support.tipFilesTitle',
                                                'إرفاق الملفات والصور',
                                            )}
                                        </h3>
                                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                                            {t(
                                                'site.support.filesHint',
                                                'أرفق لقطات شاشة أو مستندات لتسريع فحص المشكلة وحلها.',
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* Item 3: Ongoing Tracking */}
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                                        <TbClockHour4 className="text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-text-primary">
                                            {t(
                                                'site.support.tipTrackingTitle',
                                                'متابعة مستمرة',
                                            )}
                                        </h3>
                                        <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                                            {t(
                                                'site.support.tipTrackingDesc',
                                                'ستتمكن من متابعة حالة تذكرتك وتلقي ردود الفريق خطوة بخطوة.',
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Card: User Tickets or Sign In Prompt */}
                            {authenticated ? (
                                <div className="pt-2 border-t border-border">
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 transition-all hover:border-primary/40">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                                                <TbTicket className="text-xl" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-bold text-text-primary">
                                                    {t(
                                                        'userTickets.title',
                                                        'تذاكر الدعم الفني',
                                                    )}
                                                </h3>
                                                <p className="text-xs text-text-muted mt-0.5 truncate">
                                                    {t(
                                                        'site.support.myTicketsDesc',
                                                        'عرض ومتابعة حالة تذاكرك السابقة والردود عليها',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="solid"
                                            size="sm"
                                            className="w-full mt-3 flex items-center justify-center gap-2 group"
                                            onClick={() =>
                                                navigate('/user/tickets')
                                            }
                                        >
                                            <span>
                                                {t(
                                                    'site.support.viewMyTickets',
                                                    'عرض ومتابعة تذاكري',
                                                )}
                                            </span>
                                            <TbArrowLeft className="text-sm transition-transform rtl:rotate-0 rtl:group-hover:-translate-x-1 ltr:rotate-180 ltr:group-hover:translate-x-1" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-2 border-t border-border">
                                    <div className="rounded-xl border border-border bg-gray-50/80 dark:bg-gray-800/50 p-4 text-center">
                                        <p className="text-xs text-text-secondary leading-relaxed mb-3">
                                            {t(
                                                'site.support.loginToTrack',
                                                'هل قمت بتقديم تذاكر سابقاً؟ سجل دخولك لمتابعتها.',
                                            )}
                                        </p>
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="w-full text-xs font-semibold"
                                            onClick={() => navigate('/sign-in')}
                                        >
                                            {t('nav.signIn', 'تسجيل الدخول')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Quick FAQ Link */}
                            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                                <span className="flex items-center gap-1.5">
                                    <TbHelpCircle className="text-base text-secondary" />
                                    <span>
                                        {t(
                                            'site.support.needQuickAnswer',
                                            'تبحث عن إجابة سريعة؟',
                                        )}
                                    </span>
                                </span>
                                <Link
                                    to="/faq"
                                    className="font-bold text-primary hover:underline"
                                >
                                    {t('site.faq.title', 'الأسئلة الشائعة')}
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* ── Form Card ─────────────────────────────────────── */}
                    <div className="order-1 lg:order-2 mt-6 lg:mt-10">
                        {/* Success Confirmation Card */}
                        {createdTicket ? (
                            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-surface shadow-sm p-6 sm:p-8 space-y-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto">
                                    <TbCheck />
                                </div>

                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {t(
                                            'site.support.sent',
                                            'تم إنشاء التذكرة بنجاح!',
                                        )}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                                        {t(
                                            'site.support.successDescription',
                                            'تم تسجيل تذكرتك وسيتم فحصها والرد عليك من قبل فريق الدعم الفني.',
                                        )}
                                    </p>
                                </div>

                                {/* Ticket Number Box */}
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 max-w-md mx-auto flex items-center justify-between gap-3">
                                    <div className="text-start">
                                        <span className="text-xs text-gray-400 block font-medium">
                                            {t(
                                                'userTickets.ticketNumber',
                                                'رقم التذكرة',
                                            )}
                                        </span>
                                        <span className="font-mono text-base font-extrabold text-primary dir-ltr">
                                            {createdTicket.ticketNumber}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleCopyNumber}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        <TbCopy className="text-sm" />
                                        {copied
                                            ? t('common.copied', 'تم النسخ!')
                                            : t('common.copy', 'نسخ')}
                                    </button>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                                    <Button
                                        variant="solid"
                                        onClick={() =>
                                            navigate(
                                                `/user/tickets/${createdTicket.id}`,
                                            )
                                        }
                                    >
                                        {t(
                                            'userTickets.viewDetails',
                                            'متابعة هذه التذكرة',
                                        )}
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => setCreatedTicket(null)}
                                    >
                                        {t(
                                            'site.support.submitAnother',
                                            'إرسال تذكرة أخرى',
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-border bg-surface shadow-sm p-6 sm:p-8">
                                {/* Unauthenticated Notice */}
                                {!authenticated && (
                                    <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
                                                {t(
                                                    'site.support.signInRequired',
                                                    'يتطلب إنشاء وتتبع التذاكر تسجيل الدخول إلى حسابك.',
                                                )}
                                            </p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                                {t(
                                                    'site.support.signInHelp',
                                                    'سجل الدخول لتتمكن من إرسال طلبك واستلام الردود ومتابعة الحالة.',
                                                )}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="solid"
                                            onClick={() => navigate('/sign-in')}
                                        >
                                            {t('nav.signIn', 'تسجيل الدخول')}
                                        </Button>
                                    </div>
                                )}

                                {apiError && (
                                    <Alert
                                        type="danger"
                                        className="mb-6"
                                        onClose={() => setApiError('')}
                                    >
                                        {apiError}
                                    </Alert>
                                )}

                                <form
                                    onSubmit={handleSubmit}
                                    noValidate
                                    className="space-y-6"
                                >
                                    {/* Type Dropdown (Dynamically Loaded) */}
                                    <div>
                                        <label
                                            htmlFor="support-type"
                                            className={labelClass}
                                        >
                                            <span
                                                className={borderAccent}
                                                aria-hidden="true"
                                            />
                                            {t(
                                                'site.support.typeLabel',
                                                'النوع:',
                                            )}{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <div className="relative mt-2">
                                            {loadingTypes ? (
                                                <div className="flex items-center gap-2 h-11 px-3 border border-border rounded-md bg-surface text-sm text-text-muted">
                                                    <Spinner size={16} />
                                                    <span>
                                                        {t(
                                                            'common.loading',
                                                            'جاري التحميل...',
                                                        )}
                                                    </span>
                                                </div>
                                            ) : (
                                                <select
                                                    id="support-type"
                                                    name="type"
                                                    value={selectedTypeId}
                                                    onChange={(e) => {
                                                        setSelectedTypeId(
                                                            e.target.value,
                                                        )
                                                        if (errors.type) {
                                                            setErrors(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    type: '',
                                                                }),
                                                            )
                                                        }
                                                    }}
                                                    className={selectClass}
                                                    aria-invalid={Boolean(
                                                        errors.type,
                                                    )}
                                                >
                                                    <option value="" disabled>
                                                        {t(
                                                            'site.support.selectTypePlaceholder',
                                                            'اختر نوع التذكرة...',
                                                        )}
                                                    </option>
                                                    {ticketTypes.map(
                                                        (tType) => (
                                                            <option
                                                                key={tType.id}
                                                                value={String(
                                                                    tType.id,
                                                                )}
                                                            >
                                                                {tType.name}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            )}
                                            <TbChevronDown
                                                className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-secondary"
                                                aria-hidden="true"
                                            />
                                        </div>
                                        {renderError('type')}
                                    </div>

                                    {/* Describe */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label
                                                htmlFor="support-description"
                                                className={labelClass}
                                            >
                                                <span
                                                    className={borderAccent}
                                                    aria-hidden="true"
                                                />
                                                {t(
                                                    'site.support.describeLabel',
                                                    'الوصف:',
                                                )}{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <span className="text-xs text-text-muted">
                                                {description.length} / 4000
                                            </span>
                                        </div>
                                        <textarea
                                            id="support-description"
                                            name="description"
                                            rows={5}
                                            maxLength={4000}
                                            value={description}
                                            onChange={(e) => {
                                                setDescription(e.target.value)
                                                if (errors.description) {
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        description: '',
                                                    }))
                                                }
                                            }}
                                            placeholder={t(
                                                'site.support.descriptionPlaceholder',
                                                'يرجى كتابة كافة التفاصيل التي تساعدنا على حل المشكلة...',
                                            )}
                                            className={`${textareaClass}`}
                                            aria-invalid={Boolean(
                                                errors.description,
                                            )}
                                        />
                                        {renderError('description')}
                                    </div>

                                    {/* Upload Files */}
                                    <div>
                                        <label className={labelClass}>
                                            <span
                                                className={borderAccent}
                                                aria-hidden="true"
                                            />
                                            {t(
                                                'site.support.uploadLabel',
                                                'إرفاق ملف (اختياري):',
                                            )}
                                        </label>

                                        {selectedFile ? (
                                            <div className="mt-2 flex items-center justify-between p-3 rounded-lg border border-primary/40 bg-primary/5 dark:bg-primary/10">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <TbPaperclip className="text-primary text-lg shrink-0" />
                                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate dir-ltr">
                                                        {selectedFile.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400 shrink-0">
                                                        (
                                                        {(
                                                            selectedFile.size /
                                                            (1024 * 1024)
                                                        ).toFixed(2)}{' '}
                                                        MB)
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-red-500 transition-colors"
                                                    title={t(
                                                        'common.delete',
                                                        'حذف',
                                                    )}
                                                >
                                                    <TbX className="text-base" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    fileInputRef.current?.click()
                                                }
                                                className="mt-2 flex h-12 w-full items-center justify-between rounded-md border border-border bg-surface px-4 text-sm text-text-muted hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors cursor-pointer"
                                                aria-label={t(
                                                    'site.support.uploadAriaLabel',
                                                    'اختر ملف للرفع',
                                                )}
                                            >
                                                <span>
                                                    {t(
                                                        'site.support.chooseFile',
                                                        'اختر ملفاً (صور، PDF، Word، Zip حتى 20 ميجابايت)...',
                                                    )}
                                                </span>
                                                <TbUpload
                                                    className="shrink-0 ms-2 text-secondary text-lg"
                                                    aria-hidden="true"
                                                />
                                            </button>
                                        )}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            name="attachment"
                                            className="sr-only"
                                            accept="image/*,.pdf,.doc,.docx,.zip,.rar"
                                            onChange={handleFileChange}
                                            tabIndex={-1}
                                            aria-hidden="true"
                                        />
                                        {renderError('file')}
                                    </div>

                                    {/* Submit */}
                                    <Button
                                        type="submit"
                                        variant="solid"
                                        loading={submitting}
                                        className="h-12 w-full text-base font-bold"
                                    >
                                        {t(
                                            'site.support.submit',
                                            'إرسال التذكرة',
                                        )}
                                    </Button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </main>
    )
}

export default Support
