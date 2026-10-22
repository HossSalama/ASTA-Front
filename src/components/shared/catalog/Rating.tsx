import classNames from 'classnames'
import { TbStarFilled, TbStarHalfFilled, TbStar } from 'react-icons/tb'
import { formatCount } from '@/utils/catalog'
import { useTranslation } from 'react-i18next'

interface RatingProps {
    value?: number | null
    count?: number | null
    showCount?: boolean
    size?: 'sm' | 'md'
    className?: string
}

const Rating = ({
    value,
    count,
    showCount = true,
    size = 'sm',
    className,
}: RatingProps) => {
    const { i18n, t } = useTranslation()
    const rating = Math.max(0, Math.min(5, value || 0))
    const hasRating = (count || 0) > 0 && rating > 0

    if (!hasRating) {
        return (
            <span
                className={classNames(
                    'text-text-muted',
                    size === 'sm' ? 'text-xs' : 'text-sm',
                    className,
                )}
            >
                {t('catalog.notRatedYet', 'Not rated yet')}
            </span>
        )
    }

    const stars = [1, 2, 3, 4, 5].map((position) => {
        if (rating >= position) {
            return 'full' as const
        }
        if (rating >= position - 0.5) {
            return 'half' as const
        }
        return 'empty' as const
    })

    return (
        <span
            className={classNames(
                'inline-flex items-center gap-1.5',
                size === 'sm' ? 'text-xs' : 'text-sm',
                className,
            )}
        >
            <span
                className="inline-flex items-center gap-0.5 text-secondary"
                aria-hidden="true"
            >
                {stars.map((kind, index) => {
                    const Icon =
                        kind === 'full'
                            ? TbStarFilled
                            : kind === 'half'
                              ? TbStarHalfFilled
                              : TbStar
                    return (
                        <Icon
                            key={index}
                            className={
                                kind === 'empty'
                                    ? 'text-gray-300'
                                    : 'text-secondary'
                            }
                        />
                    )
                })}
            </span>
            <span className="font-semibold text-text-primary">
                {rating.toFixed(1)}
            </span>
            {showCount && (
                <span className="text-text-muted">
                    ({formatCount(count, i18n.language)})
                </span>
            )}
            <span className="sr-only">
                {t('catalog.ratingLabel', {
                    defaultValue: '{{rating}} out of 5 from {{count}} reviews',
                    rating: rating.toFixed(1),
                    count: count || 0,
                })}
            </span>
        </span>
    )
}

export default Rating
