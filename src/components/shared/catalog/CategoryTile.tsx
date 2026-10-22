import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { TbArrowUpRight } from 'react-icons/tb'
import { categoryHref, localizedName } from '@/utils/catalog'
import type { CourseCategoryPublicResponse } from '@/@types/courseCategory'

interface CategoryTileProps {
    category: CourseCategoryPublicResponse
    courseCount?: number
    className?: string
}

const CategoryTile = ({
    category,
    courseCount,
    className,
}: CategoryTileProps) => {
    const { i18n, t } = useTranslation()

    return (
        <Link
            to={categoryHref(category.id)}
            className={classNames(
                'group flex items-center justify-between gap-3 border-b border-border py-4 transition-colors hover:border-primary',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                className,
            )}
        >
            <span className="min-w-0">
                <span className="block truncate text-[0.95rem] font-semibold text-text-primary group-hover:text-primary">
                    {localizedName(category, i18n.language)}
                </span>
                {typeof courseCount === 'number' && (
                    <span className="mt-0.5 block text-xs text-text-secondary">
                        {t('catalog.courseCount', {
                            defaultValue: '{{count}} course',
                            defaultValue_plural: '{{count}} courses',
                            count: courseCount,
                        })}
                    </span>
                )}
            </span>
            <TbArrowUpRight
                className="shrink-0 text-text-muted transition-colors group-hover:text-primary rtl:-scale-x-100"
                aria-hidden="true"
            />
        </Link>
    )
}

export default CategoryTile
