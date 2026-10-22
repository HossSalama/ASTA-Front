import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { TbSearch, TbX, TbHistory } from 'react-icons/tb'
import { useTranslation } from 'react-i18next'
import { useCatalogCourses } from '@/utils/hooks/useCatalog'
import { courseHref } from '@/utils/catalog'

const RECENT_KEY = 'recent-course-searches'

const readRecent = (): string[] => {
    try {
        const raw = localStorage.getItem(RECENT_KEY)
        return raw ? (JSON.parse(raw) as string[]).slice(0, 5) : []
    } catch {
        return []
    }
}

const pushRecent = (term: string) => {
    const next = [term, ...readRecent().filter((item) => item !== term)].slice(
        0,
        5,
    )
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    } catch {
        /* storage unavailable — suggestions degrade silently */
    }
}

interface SiteSearchProps {
    className?: string
    autoFocus?: boolean
    onNavigate?: () => void
}

const SiteSearch = ({ className, autoFocus, onNavigate }: SiteSearchProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [term, setTerm] = useState('')
    const [debounced, setDebounced] = useState('')
    const [open, setOpen] = useState(false)
    const [recent, setRecent] = useState<string[]>(() => readRecent())
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const id = setTimeout(() => setDebounced(term.trim()), 250)
        return () => clearTimeout(id)
    }, [term])

    useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', onPointerDown)
        return () => document.removeEventListener('mousedown', onPointerDown)
    }, [])

    const { courses, isLoading } = useCatalogCourses(
        debounced.length >= 2
            ? { searchTerm: debounced, pageNumber: 1, pageSize: 5 }
            : { pageNumber: 1, pageSize: 0 },
    )

    const suggestions = debounced.length >= 2 ? courses : []

    const submit = (value: string) => {
        const query = value.trim()
        if (!query) {
            return
        }
        pushRecent(query)
        setRecent(readRecent())
        setOpen(false)
        onNavigate?.()
        navigate(`/search?q=${encodeURIComponent(query)}`)
    }

    const showPanel =
        open && (debounced.length >= 2 || (!term && recent.length > 0))

    return (
        <div ref={wrapperRef} className={classNames('relative', className)}>
            <form
                role="search"
                onSubmit={(event) => {
                    event.preventDefault()
                    submit(term)
                }}
            >
                <label htmlFor="site-search" className="sr-only">
                    {t('site.searchLabel', 'Search courses')}
                </label>
                <div className="relative">
                    <TbSearch
                        className="pointer-events-none absolute inset-y-0 start-3 my-auto text-lg text-text-muted"
                        aria-hidden="true"
                    />
                    <input
                        id="site-search"
                        type="search"
                        value={term}
                        autoFocus={autoFocus}
                        autoComplete="off"
                        placeholder={t(
                            'site.searchPlaceholder',
                            'Search courses, topics, instructors',
                        )}
                        aria-expanded={showPanel}
                        aria-controls="site-search-suggestions"
                        className="h-11 w-full rounded-md border border-border bg-surface-alt ps-10 pe-9 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                        onChange={(event) => {
                            setTerm(event.target.value)
                            setOpen(true)
                        }}
                        onFocus={() => setOpen(true)}
                    />
                    {term && (
                        <button
                            type="button"
                            aria-label={t('site.clearSearch', 'Clear search')}
                            className="absolute inset-y-0 end-2 my-auto flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            onClick={() => {
                                setTerm('')
                                setDebounced('')
                            }}
                        >
                            <TbX aria-hidden="true" />
                        </button>
                    )}
                </div>
            </form>

            {showPanel && (
                <div
                    id="site-search-suggestions"
                    className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
                >
                    {debounced.length >= 2 ? (
                        isLoading ? (
                            <p className="px-4 py-3 text-sm text-text-secondary">
                                {t('site.searching', 'Searching…')}
                            </p>
                        ) : suggestions.length ? (
                            <ul className="max-h-80 overflow-y-auto py-1">
                                {suggestions.map((course) => (
                                    <li key={course.id}>
                                        <button
                                            type="button"
                                            className="flex w-full items-start gap-2 px-4 py-2.5 text-start hover:bg-surface-alt focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                                            onClick={() => {
                                                setOpen(false)
                                                onNavigate?.()
                                                navigate(courseHref(course.id))
                                            }}
                                        >
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-medium text-text-primary">
                                                    {course.name}
                                                </span>
                                                {course.instructor?.name && (
                                                    <span className="block truncate text-xs text-text-secondary">
                                                        {
                                                            course.instructor
                                                                .name
                                                        }
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    </li>
                                ))}
                                <li className="border-t border-border">
                                    <button
                                        type="button"
                                        className="w-full px-4 py-2.5 text-start text-sm font-semibold text-primary hover:bg-surface-alt"
                                        onClick={() => submit(term)}
                                    >
                                        {t('site.seeAllResults', {
                                            defaultValue:
                                                'See all results for "{{term}}"',
                                            term: debounced,
                                        })}
                                    </button>
                                </li>
                            </ul>
                        ) : (
                            <p className="px-4 py-4 text-sm text-text-secondary">
                                {t('site.noSuggestions', {
                                    defaultValue:
                                        'No courses match "{{term}}" yet.',
                                    term: debounced,
                                })}
                            </p>
                        )
                    ) : (
                        <div className="py-1">
                            <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                                {t('site.recentSearches', 'Recent searches')}
                            </p>
                            <ul>
                                {recent.map((item) => (
                                    <li key={item}>
                                        <button
                                            type="button"
                                            className="flex w-full items-center gap-2 px-4 py-2 text-start text-sm text-text-primary hover:bg-surface-alt"
                                            onClick={() => submit(item)}
                                        >
                                            <TbHistory
                                                className="text-text-muted"
                                                aria-hidden="true"
                                            />
                                            {item}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default SiteSearch
