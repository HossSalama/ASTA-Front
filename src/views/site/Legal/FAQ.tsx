import { useEffect, useState, useCallback, useId } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TbSearch, TbChevronDown, TbChevronUp, TbHelpCircle } from 'react-icons/tb'
import Container from '@/components/shared/Container'
import StateView, { CatalogErrorState } from '@/components/shared/catalog/StateView'
import { useLocaleStore } from '@/store/localeStore'
import { apiGetPublicFaqs } from '@/services/FaqService'
import type { PublicFAQ } from '@/@types/faq'
import supportIcon from '@/assets/icons/g1.svg'

interface SupportCardProps {
    whatsAppNumber?: string | null
    hasTickets?: boolean
}

const SupportCard = ({ whatsAppNumber, hasTickets }: SupportCardProps) => {
    const { t } = useTranslation()
    const cleanPhone = (whatsAppNumber || '201000000000').replace(/[^0-9]/g, '')

    return (
        <div className="rounded-2xl sm:rounded-3xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900/90 p-4 sm:p-7 md:p-8 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 sm:gap-6">
                {/* Text Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="w-1 sm:w-1.5 h-5 sm:h-6 bg-[#3ABB90] rounded-full inline-block shrink-0" />
                        <h3 className="text-lg sm:text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">
                            {t('site.help.notFoundTitle', "Didn't find your answer?")}
                        </h3>
                    </div>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-snug sm:leading-relaxed">
                        {t(
                            'site.help.notFoundSubtitle',
                            "Don't worry — our support team is here to help. Send us your question and we'll get back to you shortly.",
                        )}
                    </p>
                </div>

                {/* 3D Customer Support Icon from assets */}
                <div className="shrink-0 select-none pointer-events-none">
                    <img
                        alt="Customer Support"
                        className="w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 object-contain drop-shadow-xs"
                        src={supportIcon}
                    />
                </div>
            </div>

            {/* Action Buttons Side-by-Side */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
                <Link
                    className="inline-flex items-center justify-center rounded-full bg-[#0B2545] hover:bg-[#07192f] text-white px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0 text-center"
                    to={hasTickets ? '/dashboard/tickets' : '/support'}
                >
                    {hasTickets
                        ? t('site.help.viewTickets', 'View My Tickets')
                        : t('site.help.submitTicket', 'Submit a Ticket')}
                </Link>
                <a
                    className="inline-flex items-center justify-center rounded-full bg-[#38A169] hover:bg-[#2F855A] text-white px-3 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold shadow-xs transition-all hover:shadow hover:-translate-y-0.5 active:translate-y-0 text-center"
                    href={`https://wa.me/${cleanPhone}`}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    {t('site.help.chatWhatsapp', 'Chat on WhatsApp')}
                </a>
            </div>
        </div>
    )
}

const FAQ = () => {
    const { t } = useTranslation()
    const currentLang = useLocaleStore((state) => state.currentLang)
    const searchInputId = useId()

    const [query, setQuery] = useState<string>('')
    const [debouncedQuery, setDebouncedQuery] = useState<string>('')
    const [faqs, setFaqs] = useState<PublicFAQ[]>([])
    const [whatsAppNumber, setWhatsAppNumber] = useState<string | null>(null)
    const [hasTickets, setHasTickets] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(true)
    const [hasError, setHasError] = useState<boolean>(false)
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    // Debounce search query by 300ms
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query.trim())
        }, 300)
        return () => clearTimeout(handler)
    }, [query])

    // Fetch FAQs from Public API
    const fetchFaqs = useCallback(async (search: string) => {
        setLoading(true)
        setHasError(false)
        try {
            const res = await apiGetPublicFaqs({
                pageNumber: 1,
                pageSize: 50,
                searchTerm: search || undefined,
            })
            if (res?.status && res.data) {
                setFaqs(res.data.items || [])
                setWhatsAppNumber(res.data.whatsAppNumber)
                setHasTickets(res.data.hasTickets)
            } else {
                setFaqs([])
                setWhatsAppNumber(null)
                setHasTickets(false)
            }
        } catch {
            setHasError(true)
            setFaqs([])
            setWhatsAppNumber(null)
            setHasTickets(false)
        } finally {
            setLoading(false)
        }
    }, [])

    // Trigger fetch on query debounce or language switch
    useEffect(() => {
        fetchFaqs(debouncedQuery)
    }, [debouncedQuery, currentLang, fetchFaqs])

    const toggleAccordion = (index: number) => {
        setOpenIndex((prev) => (prev === index ? null : index))
    }

    return (
        <main className="pb-24">
            {/* Header Hero Section (Centered) */}
            <section className="border-b border-border bg-surface-alt py-12 md:py-16">
                <Container>
                    <div className="max-w-3xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold mb-4">
                            <TbHelpCircle className="text-base" />
                            {t('site.help.title', 'Help & FAQs')}
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
                            {t('site.help.title', 'Help centre')}
                        </h1>
                        <p className="mt-3 text-base sm:text-lg text-text-secondary leading-relaxed">
                            {t(
                                'site.help.subtitle',
                                'Answers to the questions we get most, plus a way to reach us.',
                            )}
                        </p>
                        <div className="relative mt-7 max-w-2xl mx-auto">
                            <TbSearch
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-0 start-4 my-auto text-xl text-text-muted"
                            />
                            <input
                                aria-label={t('site.help.searchPlaceholder', 'Search help topics')}
                                className="h-13 w-full rounded-xl border border-border bg-surface ps-12 pe-4 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all shadow-xs"
                                id={searchInputId}
                                placeholder={t('site.help.searchPlaceholder', 'Search help topics...')}
                                type="search"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                            />
                        </div>
                    </div>
                </Container>
            </section>

            {/* Main Content Area */}
            <Container className="pt-8 sm:pt-10">
                <div className="max-w-3xl mx-auto space-y-10 sm:space-y-12">
                    {/* FAQs Section */}
                    <div>
                        {/* Loading Skeleton */}
                        {loading && (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
                                {[1, 2, 3, 4, 5].map((skeleton) => (
                                    <div
                                        key={skeleton}
                                        className="py-6 animate-pulse space-y-3"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                        </div>
                                        {skeleton === 1 && (
                                            <div className="space-y-2 pt-2">
                                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full" />
                                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-5/6" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Error State with Retry */}
                        {!loading && hasError && (
                            <CatalogErrorState onRetry={() => fetchFaqs(debouncedQuery)} />
                        )}

                        {/* Empty Search Results */}
                        {!loading && !hasError && faqs.length === 0 && (
                            <StateView
                                action={{
                                    label: t('site.help.stillStuckCta', 'Contact support'),
                                    to: '/contact',
                                }}
                                description={
                                    debouncedQuery
                                        ? t(
                                              'site.help.noResultsDesc',
                                              'Try a different wording, or contact us and we will answer directly.',
                                          )
                                        : t(
                                              'site.help.stillStuckBody',
                                              'Tell us what you were trying to do and we will follow up by email.',
                                          )
                                }
                                title={
                                    debouncedQuery
                                        ? t('site.help.noResultsTitle', 'No answer matches that search')
                                        : t('faqManagement.noFaqsFound', 'No FAQs found.')
                                }
                                tone={debouncedQuery ? 'noResults' : 'empty'}
                            />
                        )}

                        {/* Accordion List */}
                        {!loading && !hasError && faqs.length > 0 && (
                            <div className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
                                {faqs.map((faq, index) => {
                                    const isOpen = openIndex === index
                                    return (
                                        <div
                                            key={faq.id}
                                            className="transition-colors"
                                        >
                                            <button
                                                aria-expanded={isOpen}
                                                className="w-full flex justify-between items-center gap-4 py-5 sm:py-6 text-start group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                                type="button"
                                                onClick={() => toggleAccordion(index)}
                                            >
                                                <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug group-hover:text-primary transition-colors">
                                                    {faq.question}
                                                </span>
                                                <span className="shrink-0 text-orange-500 dark:text-orange-400 text-xl font-bold transition-transform duration-200">
                                                    {isOpen ? (
                                                        <TbChevronUp className="stroke-[2.5]" />
                                                    ) : (
                                                        <TbChevronDown className="stroke-[2.5]" />
                                                    )}
                                                </span>
                                            </button>
                                            {isOpen && (
                                                <div className="pb-6 sm:pb-7 pt-1 text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed whitespace-pre-wrap pe-4 sm:pe-8 animate-fadeIn">
                                                    {faq.answer}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Support Card at Bottom — Fallback CTA for users who didn't find their answer */}
                    <div>
                        <SupportCard
                            hasTickets={hasTickets}
                            whatsAppNumber={whatsAppNumber}
                        />
                    </div>
                </div>
            </Container>
        </main>
    )
}

export default FAQ
