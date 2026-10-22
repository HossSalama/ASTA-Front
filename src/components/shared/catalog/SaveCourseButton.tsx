import classNames from 'classnames'
import { TbHeart, TbHeartFilled } from 'react-icons/tb'
import { useTranslation } from 'react-i18next'
import { useWishlistStore } from '@/store/wishlistStore'

interface SaveCourseButtonProps {
    courseId: number
    variant?: 'icon' | 'inline'
    className?: string
}

const SaveCourseButton = ({
    courseId,
    variant = 'icon',
    className,
}: SaveCourseButtonProps) => {
    const { t } = useTranslation()
    const saved = useWishlistStore((state) =>
        Array.isArray(state.courseIds) && state.courseIds.includes(courseId),
    )
    const toggle = useWishlistStore((state) => state.toggle)

    const label = saved
        ? t('catalog.removeFromSaved', 'Remove from wishlist')
        : t('catalog.saveCourse', 'Add to wishlist')

    const Icon = saved ? TbHeartFilled : TbHeart

    if (variant === 'inline') {
        return (
            <button
                type="button"
                aria-pressed={saved}
                className={classNames(
                    'inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-md border border-border',
                    'text-sm font-semibold text-text-primary transition-colors',
                    'hover:border-primary hover:text-primary',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    saved && 'border-primary text-primary',
                    className,
                )}
                onClick={() => toggle(courseId)}
            >
                <Icon className="text-lg" aria-hidden="true" />
                {saved
                    ? t('catalog.saved', 'In Wishlist')
                    : t('catalog.save', 'Add to Wishlist')}
            </button>
        )
    }

    return (
        <button
            type="button"
            aria-label={label}
            aria-pressed={saved}
            title={label}
            className={classNames(
                'inline-flex items-center justify-center h-11 w-11 rounded-full',
                'bg-surface/95 text-text-primary shadow-sm transition-colors',
                'hover:text-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                saved && 'text-primary',
                className,
            )}
            onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                toggle(courseId)
            }}
        >
            <Icon className="text-lg" aria-hidden="true" />
        </button>
    )
}

export default SaveCourseButton
