import type { ReactNode } from 'react'
import classNames from 'classnames'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    TbAlertTriangle,
    TbSearchOff,
    TbInbox,
    TbLock,
    TbCheck,
} from 'react-icons/tb'

type StateTone = 'empty' | 'error' | 'noResults' | 'unauthorized' | 'success'

interface StateViewProps {
    tone?: StateTone
    title: string
    description?: string
    action?: { label: string; to: string } | ReactNode
    className?: string
    compact?: boolean
}

const icons: Record<StateTone, typeof TbInbox> = {
    empty: TbInbox,
    error: TbAlertTriangle,
    noResults: TbSearchOff,
    unauthorized: TbLock,
    success: TbCheck,
}

/**
 * Single presentation for every non-happy path so messaging stays contextual
 * instead of collapsing into a generic "something went wrong".
 */
const StateView = ({
    tone = 'empty',
    title,
    description,
    action,
    className,
    compact,
}: StateViewProps) => {
    const Icon = icons[tone]
    const isError = tone === 'error'

    return (
        <div
            role={isError ? 'alert' : undefined}
            className={classNames(
                'flex flex-col items-center justify-center text-center',
                compact ? 'py-10' : 'py-16',
                className,
            )}
        >
            <span
                className={classNames(
                    'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
                    isError
                        ? 'bg-error-subtle text-error'
                        : tone === 'success'
                          ? 'bg-success-subtle text-success'
                          : 'bg-surface-alt text-text-secondary',
                )}
            >
                <Icon className="text-xl" aria-hidden="true" />
            </span>
            <p className="max-w-md text-base font-semibold text-text-primary">
                {title}
            </p>
            {description && (
                <p className="mt-1.5 max-w-md text-sm text-text-secondary">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-5">
                    {typeof action === 'object' &&
                    action !== null &&
                    'label' in (action as Record<string, unknown>) ? (
                        <Link
                            to={(action as { to: string }).to}
                            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-neutral transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {(action as { label: string }).label}
                        </Link>
                    ) : (
                        (action as ReactNode)
                    )}
                </div>
            )}
        </div>
    )
}

export const CatalogErrorState = ({
    onRetry,
    className,
}: {
    onRetry?: () => void
    className?: string
}) => {
    const { t } = useTranslation()
    return (
        <StateView
            tone="error"
            className={className}
            title={t('states.loadFailedTitle', 'We could not load this content')}
            description={t(
                'states.loadFailedDesc',
                'The catalogue service did not respond. Check your connection and try again.',
            )}
            action={
                onRetry ? (
                    <button
                        type="button"
                        className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        onClick={onRetry}
                    >
                        {t('states.retry', 'Try again')}
                    </button>
                ) : undefined
            }
        />
    )
}

export default StateView
