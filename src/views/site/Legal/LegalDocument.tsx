import { useTranslation } from 'react-i18next'
import Container from '@/components/shared/Container'
import Breadcrumbs from '@/components/shared/catalog/Breadcrumbs'

interface LegalSection {
    h: string
    p: string
}

const slugify = (value: string, index: number) =>
    `section-${index + 1}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`

/**
 * Terms and Privacy share one reading layout: a short intro, a jump list, then
 * numbered clauses. Content lives in the locale files so Arabic is authored,
 * not translated at render time.
 */
const LegalDocument = ({ doc }: { doc: 'terms' | 'privacy' }) => {
    const { t, i18n } = useTranslation()

    const sections = t(`site.legal.${doc}.sections`, {
        returnObjects: true,
        defaultValue: [],
    }) as LegalSection[]

    const lastUpdated = new Intl.DateTimeFormat(
        i18n.language?.startsWith('ar') ? 'ar-EG' : 'en-GB',
        { month: 'long', year: 'numeric' },
    ).format(new Date(2026, 0, 1))

    return (
        <main className="pb-20 pt-8">
            <Container>
                <Breadcrumbs
                    items={[
                        { label: t('site.nav.home', 'Home'), to: '/' },
                        { label: t(`site.legal.${doc}.title`) },
                    ]}
                />

                <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-16">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                            {t(`site.legal.${doc}.title`)}
                        </h1>
                        <p className="mt-1.5 text-sm text-text-muted">
                            {t('site.legal.lastUpdated', { date: lastUpdated })}
                        </p>
                        <p className="mt-6 border-s-2 border-primary ps-4 text-lg leading-relaxed text-text-secondary">
                            {t(`site.legal.${doc}.intro`)}
                        </p>

                        <div className="mt-10 divide-y divide-border border-t border-border">
                            {sections.map((section, index) => (
                                <section
                                    key={section.h}
                                    id={slugify(section.h, index)}
                                    className="scroll-mt-24 py-7"
                                >
                                    <h2 className="flex gap-3 text-lg font-semibold text-text-primary">
                                        <span
                                            aria-hidden="true"
                                            className="tabular-nums text-text-muted"
                                        >
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {section.h}
                                    </h2>
                                    <p className="mt-2 leading-relaxed text-text-secondary sm:ps-9">
                                        {section.p}
                                    </p>
                                </section>
                            ))}
                        </div>
                    </div>

                    <aside className="hidden lg:block">
                        <nav
                            aria-label={t('site.legal.onThisPage', 'On this page')}
                            className="sticky top-24"
                        >
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                                {t('site.legal.onThisPage', 'On this page')}
                            </p>
                            <ul className="mt-3 space-y-2 border-s border-border">
                                {sections.map((section, index) => (
                                    <li key={section.h}>
                                        <a
                                            href={`#${slugify(section.h, index)}`}
                                            className="-ms-px block border-s border-transparent ps-3 text-sm text-text-secondary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                        >
                                            {section.h}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>
                </div>
            </Container>
        </main>
    )
}

export default LegalDocument
