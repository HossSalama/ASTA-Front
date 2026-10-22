import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { TbChevronRight, TbChevronLeft } from 'react-icons/tb'

export interface Crumb {
    label: string
    to?: string
}

interface BreadcrumbsProps {
    items: Crumb[]
    className?: string
}

const Breadcrumbs = ({ items, className }: BreadcrumbsProps) => {
    const { t, i18n } = useTranslation()
    const Chevron = i18n.dir() === 'rtl' ? TbChevronLeft : TbChevronRight

    return (
        <nav
            aria-label={t('common.breadcrumb', 'Breadcrumb')}
            className={className}
        >
            <ol className="flex flex-wrap items-center gap-1 text-xs text-text-secondary">
                {items.map((item, index) => {
                    const last = index === items.length - 1
                    return (
                        <li key={index} className="flex items-center gap-1">
                            {item.to && !last ? (
                                <Link
                                    to={item.to}
                                    className="transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span
                                    className={classNames(
                                        last && 'font-medium text-text-primary',
                                    )}
                                    aria-current={last ? 'page' : undefined}
                                >
                                    {item.label}
                                </span>
                            )}
                            {!last && (
                                <Chevron
                                    className="text-text-muted"
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

export default Breadcrumbs
