import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Container from '@/components/shared/Container'
import Logo from '@/components/template/Logo'
import { useCatalogCategories } from '@/utils/hooks/useCatalog'
import { categoryHref, localizedName } from '@/utils/catalog'
import { discoveryNav, supportNav, legalNav } from './siteNavigation'
import { APP_NAME } from '@/constants/app.constant'
import type { SiteNavItem } from './siteNavigation'

const linkClass =
    'inline-flex min-h-9 items-center text-sm text-text-secondary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const FooterColumn = ({
    title,
    items,
}: {
    title: string
    items: SiteNavItem[]
}) => {
    const { t } = useTranslation()
    return (
        <div>
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-primary">
                {title}
            </h2>
            <ul className="mt-3 space-y-0.5">
                {items.map((item) => (
                    <li key={item.key}>
                        <Link to={item.to} className={linkClass}>
                            {t(item.labelKey, item.fallback)}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const SiteFooter = () => {
    const { t, i18n } = useTranslation()
    const { categories } = useCatalogCategories()
    const topCategories = categories.slice(0, 6)

    return (
        <footer className="mt-20 border-t border-border bg-background-secondary">
            <Container width="wide" className="py-12">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
                    <div className="max-w-sm">
                        <Logo imgClass="h-8 w-auto" logoWidth="auto" />
                        <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                            {t(
                                'site.footerBlurb',
                                'Structured courses taught by vetted instructors, built so you can finish what you start.',
                            )}
                        </p>
                    </div>

                    <FooterColumn
                        title={t('site.footer.platform', 'Platform')}
                        items={discoveryNav}
                    />

                    <div>
                        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-primary">
                            {t('site.footer.browse', 'Browse')}
                        </h2>
                        <ul className="mt-3 space-y-0.5">
                            {topCategories.length ? (
                                topCategories.map((category) => (
                                    <li key={category.id}>
                                        <Link
                                            to={categoryHref(category.id)}
                                            className={linkClass}
                                        >
                                            {localizedName(
                                                category,
                                                i18n.language,
                                            )}
                                        </Link>
                                    </li>
                                ))
                            ) : (
                                <li>
                                    <Link to="/categories" className={linkClass}>
                                        {t(
                                            'site.footer.allCategories',
                                            'All categories',
                                        )}
                                    </Link>
                                </li>
                            )}
                        </ul>
                    </div>

                    <FooterColumn
                        title={t('site.footer.support', 'Support')}
                        items={supportNav}
                    />

                    <FooterColumn
                        title={t('site.footer.legal', 'Legal')}
                        items={legalNav}
                    />
                </div>
            </Container>

            <div className="border-t border-border">
                <Container
                    width="wide"
                    className="flex flex-col items-center justify-between gap-3 py-5 sm:flex-row"
                >
                    <p className="text-xs text-text-secondary">
                        &copy; {new Date().getFullYear()} {APP_NAME}.{' '}
                        {t('site.rightsReserved', 'All rights reserved.')}
                    </p>
                    <ul className="flex items-center gap-4">
                        {legalNav.map((item) => (
                            <li key={item.key}>
                                <Link
                                    to={item.to}
                                    className="text-xs text-text-secondary transition-colors hover:text-primary"
                                >
                                    {t(item.labelKey, item.fallback)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Container>
            </div>
        </footer>
    )
}

export default SiteFooter
