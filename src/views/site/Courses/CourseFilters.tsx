import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { TbChevronDown } from 'react-icons/tb'
import { localizedName } from '@/utils/catalog'
import type { CourseCategoryPublicResponse } from '@/@types/courseCategory'

export interface CourseFilterValue {
    categoryId?: number
    instructorId?: number
    deliveryType?: 'recorded' | 'live'
    priceBucket?: 'free' | 'paid'
    minRating?: number
    language?: string
}

interface CourseFiltersProps {
    value: CourseFilterValue
    categories: CourseCategoryPublicResponse[]
    languages: string[]
    onChange: (next: CourseFilterValue) => void
    onReset: () => void
}

const Group = ({
    title,
    children,
    defaultOpen = true,
}: {
    title: string
    children: React.ReactNode
    defaultOpen?: boolean
}) => {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className="border-b border-border py-4 first:pt-0">
            <button
                type="button"
                aria-expanded={open}
                className="flex w-full items-center justify-between text-start text-sm font-bold text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => setOpen((state) => !state)}
            >
                {title}
                <TbChevronDown
                    className={classNames(
                        'text-text-muted transition-transform',
                        open && 'rotate-180',
                    )}
                    aria-hidden="true"
                />
            </button>
            {open && <div className="mt-3 space-y-1.5">{children}</div>}
        </div>
    )
}

const Choice = ({
    name,
    label,
    checked,
    onSelect,
}: {
    name: string
    label: string
    checked: boolean
    onSelect: () => void
}) => (
    <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-text-secondary hover:text-text-primary">
        <input
            type="radio"
            name={name}
            checked={checked}
            className="h-4 w-4 accent-[var(--primary)]"
            onChange={onSelect}
        />
        <span className={checked ? 'font-semibold text-text-primary' : ''}>
            {label}
        </span>
    </label>
)

const CourseFilters = ({
    value,
    categories,
    languages,
    onChange,
    onReset,
}: CourseFiltersProps) => {
    const { t, i18n } = useTranslation()
    const hasFilters = Object.values(value).some(
        (item) => item !== undefined && item !== '',
    )

    return (
        <div>
            <div className="flex items-center justify-between pb-3">
                <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary">
                    {t('courses.filters', 'Filters')}
                </h2>
                {hasFilters && (
                    <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        onClick={onReset}
                    >
                        {t('courses.clearAll', 'Clear all')}
                    </button>
                )}
            </div>

            <Group title={t('courses.category', 'Category')}>
                <Choice
                    name="category"
                    label={t('courses.allCategories', 'All categories')}
                    checked={!value.categoryId}
                    onSelect={() =>
                        onChange({ ...value, categoryId: undefined })
                    }
                />
                {categories.map((category) => (
                    <Choice
                        key={category.id}
                        name="category"
                        label={localizedName(category, i18n.language)}
                        checked={value.categoryId === category.id}
                        onSelect={() =>
                            onChange({ ...value, categoryId: category.id })
                        }
                    />
                ))}
            </Group>

            <Group title={t('courses.deliveryType', 'Course Type')}>
                <Choice
                    name="deliveryType"
                    label={t('courses.allDeliveryTypes', 'All types')}
                    checked={!value.deliveryType}
                    onSelect={() =>
                        onChange({ ...value, deliveryType: undefined })
                    }
                />
                <Choice
                    name="deliveryType"
                    label={t('courses.recorded', 'Recorded courses')}
                    checked={value.deliveryType === 'recorded'}
                    onSelect={() => onChange({ ...value, deliveryType: 'recorded' })}
                />
                <Choice
                    name="deliveryType"
                    label={t('courses.live', 'Live courses')}
                    checked={value.deliveryType === 'live'}
                    onSelect={() => onChange({ ...value, deliveryType: 'live' })}
                />
            </Group>

            <Group title={t('courses.price', 'Price')}>
                <Choice
                    name="price"
                    label={t('courses.anyPrice', 'Any price')}
                    checked={!value.priceBucket}
                    onSelect={() =>
                        onChange({ ...value, priceBucket: undefined })
                    }
                />
                <Choice
                    name="price"
                    label={t('courses.free', 'Free')}
                    checked={value.priceBucket === 'free'}
                    onSelect={() => onChange({ ...value, priceBucket: 'free' })}
                />
                <Choice
                    name="price"
                    label={t('courses.paid', 'Paid')}
                    checked={value.priceBucket === 'paid'}
                    onSelect={() => onChange({ ...value, priceBucket: 'paid' })}
                />
            </Group>

            <Group title={t('courses.rating', 'Rating')} defaultOpen={false}>
                <Choice
                    name="rating"
                    label={t('courses.anyRating', 'Any rating')}
                    checked={!value.minRating}
                    onSelect={() =>
                        onChange({ ...value, minRating: undefined })
                    }
                />
                {[4.5, 4, 3].map((rating) => (
                    <Choice
                        key={rating}
                        name="rating"
                        label={t('courses.ratingAndUp', {
                            defaultValue: '{{rating}} & up',
                            rating,
                        })}
                        checked={value.minRating === rating}
                        onSelect={() => onChange({ ...value, minRating: rating })}
                    />
                ))}
            </Group>

            {languages.length > 1 && (
                <Group
                    title={t('courses.language', 'Language')}
                    defaultOpen={false}
                >
                    <Choice
                        name="language"
                        label={t('courses.anyLanguage', 'Any language')}
                        checked={!value.language}
                        onSelect={() =>
                            onChange({ ...value, language: undefined })
                        }
                    />
                    {languages.map((language) => (
                        <Choice
                            key={language}
                            name="language"
                            label={language}
                            checked={value.language === language}
                            onSelect={() => onChange({ ...value, language })}
                        />
                    ))}
                </Group>
            )}
        </div>
    )
}

export default CourseFilters
