import type { ReactNode } from 'react'
import classNames from 'classnames'
import { Link } from 'react-router-dom'
import { TbArrowRight, TbArrowLeft } from 'react-icons/tb'
import { useTranslation } from 'react-i18next'

interface SectionIntroProps {
    eyebrow?: string
    title: string
    description?: string
    link?: { label: string; to: string }
    align?: 'start' | 'between'
    as?: 'h2' | 'h3'
    children?: ReactNode
    className?: string
}

/**
 * Section headers share typography, not layout — sections still choose their
 * own composition below the header.
 */
const SectionIntro = ({
    eyebrow,
    title,
    description,
    link,
    align = 'between',
    as: Heading = 'h2',
    children,
    className,
}: SectionIntroProps) => {
    const { i18n } = useTranslation()
    const rtl = i18n.dir() === 'rtl'
    const Arrow = rtl ? TbArrowLeft : TbArrowRight

    return (
        <div
            className={classNames(
                'gap-4',
                align === 'between'
                    ? 'flex flex-col sm:flex-row sm:items-end sm:justify-between'
                    : 'flex flex-col',
                className,
            )}
        >
            <div className="max-w-2xl">
                {eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary">
                        {eyebrow}
                    </p>
                )}
                <Heading className="mt-1.5 text-2xl font-bold tracking-tight text-text-primary sm:text-[1.75rem]">
                    {title}
                </Heading>
                {description && (
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-text-secondary">
                        {description}
                    </p>
                )}
            </div>
            {children}
            {link && (
                <Link
                    to={link.to}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                    {link.label}
                    <Arrow aria-hidden="true" />
                </Link>
            )}
        </div>
    )
}

export default SectionIntro
