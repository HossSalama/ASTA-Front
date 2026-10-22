import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { TbFilter, TbLayoutGrid, TbList, TbX } from 'react-icons/tb'
import classNames from 'classnames'
import Container from '@/components/shared/Container'
import Breadcrumbs from '@/components/shared/catalog/Breadcrumbs'
import CourseCard from '@/components/shared/catalog/CourseCard'
import CourseGridSkeleton from '@/components/shared/catalog/CourseGridSkeleton'
import StateView, {
    CatalogErrorState,
} from '@/components/shared/catalog/StateView'
import CourseFilters from './CourseFilters'
import type { CourseFilterValue } from './CourseFilters'
import {
    useCatalogCourses,
    useCatalogCategories,
    refineCourses,
} from '@/utils/hooks/useCatalog'
import { localizedName } from '@/utils/catalog'
import type { CatalogSort } from '@/services/CatalogService'

const PAGE_SIZE = 12

const Courses = () => {
    const { t, i18n } = useTranslation()
    const [params, setParams] = useSearchParams()
    const [view, setView] = useState<'grid' | 'row'>('grid')
    const [filtersOpen, setFiltersOpen] = useState(false)

    const page = Number(params.get('page') || 1)
    const sort = (params.get('sort') || 'newest') as CatalogSort
    const searchTerm = params.get('q') || undefined

    const filters: CourseFilterValue = {
        categoryId: params.get('category')
            ? Number(params.get('category'))
            : undefined,
        deliveryType:
            (params.get('type') as 'recorded' | 'live' | null) || undefined,
        priceBucket:
            (params.get('price') as 'free' | 'paid' | null) || undefined,
        minRating: params.get('rating')
            ? Number(params.get('rating'))
            : undefined,
        language: params.get('lang') || undefined,
    }

    const { categories } = useCatalogCategories()
    const { courses, totalCount, totalPages, isLoading, error, mutate } =
        useCatalogCourses({
            pageNumber: page,
            pageSize: PAGE_SIZE,
            searchTerm,
            categoryId: filters.categoryId,
        })

    const languages = useMemo(
        () =>
            Array.from(
                new Set(courses.map((course) => course.language).filter(Boolean)),
            ) as string[],
        [courses],
    )

    const visible = useMemo(
        () =>
            refineCourses(courses, {
                language: filters.language,
                priceBucket: filters.priceBucket,
                minRating: filters.minRating,
                deliveryType: filters.deliveryType,
                sort,
            }),
        [courses, filters.language, filters.priceBucket, filters.minRating, filters.deliveryType, sort],
    )

    const updateParams = (next: Record<string, string | undefined>) => {
        const merged = new URLSearchParams(params)
        Object.entries(next).forEach(([key, val]) => {
            if (val === undefined || val === '') {
                merged.delete(key)
            } else {
                merged.set(key, val)
            }
        })
        merged.delete('page')
        setParams(merged)
    }

    const applyFilters = (next: CourseFilterValue) =>
        updateParams({
            category: next.categoryId ? String(next.categoryId) : undefined,
            type: next.deliveryType,
            price: next.priceBucket,
            rating: next.minRating ? String(next.minRating) : undefined,
            lang: next.language,
        })

    const resetFilters = () => {
        const merged = new URLSearchParams()
        if (searchTerm) {
            merged.set('q', searchTerm)
        }
        setParams(merged)
    }

    const activeCategory = categories.find(
        (category) => category.id === filters.categoryId,
    )

    const heading = activeCategory
        ? localizedName(activeCategory, i18n.language)
        : searchTerm
          ? t('courses.resultsFor', {
                defaultValue: 'Results for "{{term}}"',
                term: searchTerm,
            })
          : t('courses.title', 'All courses')

    const filterPanel = (
        <CourseFilters
            value={filters}
            categories={categories}
            languages={languages}
            onChange={applyFilters}
            onReset={resetFilters}
        />
    )

    return (
        <Container width="wide" className="py-8 lg:py-10">
            <Breadcrumbs
                items={[
                    { label: t('site.nav.home', 'Home'), to: '/' },
                    { label: t('site.nav.courses', 'Courses'), to: '/courses' },
                    ...(activeCategory
                        ? [
                              {
                                  label: localizedName(
                                      activeCategory,
                                      i18n.language,
                                  ),
                              },
                          ]
                        : []),
                ]}
            />

            <div className="mt-4 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-[1.75rem] font-bold tracking-tight text-text-primary">
                        {heading}
                    </h1>
                    <p className="mt-1 text-sm text-text-secondary" aria-live="polite">
                        {isLoading
                            ? t('courses.loadingCount', 'Loading courses…')
                            : t('courses.count', {
                                  defaultValue: '{{count}} course available',
                                  defaultValue_plural:
                                      '{{count}} courses available',
                                  count: totalCount,
                              })}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border px-3.5 text-sm font-semibold text-text-primary hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden"
                        aria-expanded={filtersOpen}
                        onClick={() => setFiltersOpen(true)}
                    >
                        <TbFilter aria-hidden="true" />
                        {t('courses.filters', 'Filters')}
                    </button>

                    <label className="sr-only" htmlFor="course-sort">
                        {t('courses.sortBy', 'Sort by')}
                    </label>
                    <select
                        id="course-sort"
                        value={sort}
                        className="h-11 rounded-md border border-border bg-surface px-3 text-sm font-medium text-text-primary focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        onChange={(event) =>
                            updateParams({ sort: event.target.value })
                        }
                    >
                        <option value="newest">
                            {t('courses.sortNewest', 'Newest')}
                        </option>
                        <option value="rating">
                            {t('courses.sortRating', 'Highest rated')}
                        </option>
                        <option value="priceAsc">
                            {t('courses.sortPriceAsc', 'Price: low to high')}
                        </option>
                        <option value="priceDesc">
                            {t('courses.sortPriceDesc', 'Price: high to low')}
                        </option>
                    </select>

                    <div
                        className="hidden items-center rounded-md border border-border sm:flex"
                        role="group"
                        aria-label={t('courses.viewMode', 'View mode')}
                    >
                        {(
                            [
                                ['grid', TbLayoutGrid, t('courses.gridView', 'Grid view')],
                                ['row', TbList, t('courses.listView', 'List view')],
                            ] as const
                        ).map(([mode, Icon, label]) => (
                            <button
                                key={mode}
                                type="button"
                                aria-label={label}
                                aria-pressed={view === mode}
                                className={classNames(
                                    'flex h-11 w-11 items-center justify-center transition-colors first:rounded-s-md last:rounded-e-md',
                                    view === mode
                                        ? 'bg-primary-subtle text-primary'
                                        : 'text-text-secondary hover:text-primary',
                                )}
                                onClick={() => setView(mode)}
                            >
                                <Icon aria-hidden="true" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 lg:grid lg:grid-cols-[260px_1fr] lg:gap-10">
                <aside className="hidden lg:block">
                    <div className="sticky top-24">{filterPanel}</div>
                </aside>

                <div>
                    {error ? (
                        <CatalogErrorState onRetry={() => void mutate()} />
                    ) : isLoading ? (
                        <CourseGridSkeleton count={6} layout={view} />
                    ) : visible.length ? (
                        <>
                            {view === 'grid' ? (
                                <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {visible.map((course) => (
                                        <li key={course.id} className="flex">
                                            <CourseCard
                                                course={course}
                                                className="w-full"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <ul>
                                    {visible.map((course) => (
                                        <li key={course.id}>
                                            <CourseCard
                                                course={course}
                                                layout="row"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {totalPages > 1 && (
                                <nav
                                    aria-label={t(
                                        'courses.pagination',
                                        'Course pages',
                                    )}
                                    className="mt-10 flex items-center justify-center gap-2"
                                >
                                    {Array.from({ length: totalPages }).map(
                                        (_, index) => {
                                            const value = index + 1
                                            return (
                                                <button
                                                    key={value}
                                                    type="button"
                                                    aria-current={
                                                        value === page
                                                            ? 'page'
                                                            : undefined
                                                    }
                                                    className={classNames(
                                                        'h-10 min-w-10 rounded-md border px-3 text-sm font-semibold transition-colors',
                                                        value === page
                                                            ? 'border-primary bg-primary text-neutral'
                                                            : 'border-border text-text-primary hover:border-primary hover:text-primary',
                                                    )}
                                                    onClick={() => {
                                                        const merged =
                                                            new URLSearchParams(
                                                                params,
                                                            )
                                                        merged.set(
                                                            'page',
                                                            String(value),
                                                        )
                                                        setParams(merged)
                                                    }}
                                                >
                                                    {value}
                                                </button>
                                            )
                                        },
                                    )}
                                </nav>
                            )}
                        </>
                    ) : (
                        <StateView
                            tone="noResults"
                            title={t(
                                'courses.noResultsTitle',
                                'Nothing matches these filters',
                            )}
                            description={t(
                                'courses.noResultsBody',
                                'Try widening the price or rating range, or clear the filters to see the full catalogue.',
                            )}
                            action={
                                <button
                                    type="button"
                                    className="inline-flex min-h-11 items-center rounded-md border border-border px-5 text-sm font-semibold text-text-primary hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                    onClick={resetFilters}
                                >
                                    {t('courses.clearAll', 'Clear all')}
                                </button>
                            }
                        />
                    )}
                </div>
            </div>

            {/* Mobile filter sheet */}
            {filtersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-gray-900/50"
                        onClick={() => setFiltersOpen(false)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('courses.filters', 'Filters')}
                        className="absolute inset-y-0 end-0 flex w-[85%] max-w-sm flex-col bg-surface shadow-xl"
                    >
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <h2 className="text-base font-bold text-text-primary">
                                {t('courses.filters', 'Filters')}
                            </h2>
                            <button
                                type="button"
                                aria-label={t('common.close', 'Close')}
                                className="flex h-11 w-11 items-center justify-center rounded-md text-text-secondary hover:text-text-primary"
                                onClick={() => setFiltersOpen(false)}
                            >
                                <TbX aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {filterPanel}
                        </div>
                        <div className="border-t border-border p-4">
                            <button
                                type="button"
                                className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-neutral"
                                onClick={() => setFiltersOpen(false)}
                            >
                                {t('courses.showResults', {
                                    defaultValue: 'Show {{count}} results',
                                    count: visible.length,
                                })}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Container>
    )
}

export default Courses
