import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    TbArrowRight,
    TbArrowLeft,
    TbChevronRight,
    TbChevronLeft,
} from 'react-icons/tb'
import classNames from 'classnames'
import Container from '@/components/shared/Container'
import SectionIntro from '@/components/shared/catalog/SectionIntro'
import CourseCard from '@/components/shared/catalog/CourseCard'
import CategoryTile from '@/components/shared/catalog/CategoryTile'
import InstructorTile from '@/components/shared/catalog/InstructorTile'
import CourseGridSkeleton from '@/components/shared/catalog/CourseGridSkeleton'
import StateView, {
    CatalogErrorState,
} from '@/components/shared/catalog/StateView'
import SiteSearch from '@/components/layouts/SiteLayout/SiteSearch'
import {
    useHomePageData,
    useCatalogCategories,
    useCatalogInstructors,
} from '@/utils/hooks/useCatalog'
import { categoryHref, localizedName } from '@/utils/catalog'
import { useAuth } from '@/auth'
import HeroAdvertisement from './HeroAdvertisement'

const Home = () => {
    const { t, i18n } = useTranslation()
    const { authenticated } = useAuth()
    const isRtl = i18n.dir() === 'rtl'
    const Arrow = isRtl ? TbArrowLeft : TbArrowRight
    const PrevIcon = isRtl ? TbChevronRight : TbChevronLeft
    const NextIcon = isRtl ? TbChevronLeft : TbChevronRight

    const [popularPage, setPopularPage] = useState(1)
    const pageSize = 8

    const {
        popularCourses,
        advertisements,
        totalPages,
        hasPreviousPage,
        hasNextPage,
        isLoading: homeLoading,
        error: homeError,
        mutate: retryHome,
    } = useHomePageData(popularPage, pageSize)

    const { categories } = useCatalogCategories()
    const { instructors } = useCatalogInstructors({
        pageNumber: 1,
        pageSize: 4,
    })

    const handlePageChange = (newPage: number) => {
        setPopularPage(newPage)
        // Smooth scroll to popular courses section if scrolled past
        const element = document.getElementById('popular-courses-section')
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    }

    return (
        <>
            {/* Hero — editorial split, anchored by a working search and advertisement showcase */}
            <section className="border-b border-border bg-background-secondary">
                <Container width="wide" className="py-12 lg:py-16">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                        <div>
                            <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight text-text-primary sm:text-[2.75rem]">
                                {t(
                                    'home.heroTitle',
                                    'Learn a skill properly, from people who work in the field.',
                                )}
                            </h1>
                            <p className="mt-4 max-w-xl text-base leading-relaxed text-text-secondary">
                                {t(
                                    'home.heroBody',
                                    'Every course is structured into sections and lessons with a clear outcome, so you always know what comes next.',
                                )}
                            </p>
                            <div className="mt-7 max-w-xl">
                                <SiteSearch />
                            </div>
                            {categories.length > 0 && (
                                <div className="mt-5 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                                        {t('home.popularIn', 'Popular in')}
                                    </span>
                                    {categories.slice(0, 5).map((category) => (
                                        <Link
                                            key={category.id}
                                            to={categoryHref(category.id)}
                                            className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface px-3.5 text-sm text-text-primary transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                        >
                                            {localizedName(
                                                category,
                                                i18n.language,
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Advertisement Carousel / Featured Course Preview */}
                        <div className="lg:ps-6">
                            <HeroAdvertisement
                                advertisements={advertisements}
                                fallbackCourse={popularCourses[0]}
                                isLoading={homeLoading}
                            />
                        </div>
                    </div>
                </Container>
            </section>

            {/* Featured / Popular catalogue */}
            <section id="popular-courses-section" className="py-14 lg:py-16">
                <Container width="wide">
                    <SectionIntro
                        title={t('home.featuredTitle', 'Popular courses')}
                        description={t(
                            'home.featuredBody',
                            'Explore trending and highly-rated courses across every category.',
                        )}
                        link={{
                            label: t('home.browseAll', 'Browse all courses'),
                            to: '/courses',
                        }}
                    />
                    <div className="mt-8">
                        {homeError ? (
                            <CatalogErrorState
                                onRetry={() => void retryHome()}
                            />
                        ) : homeLoading ? (
                            <CourseGridSkeleton count={pageSize} />
                        ) : popularCourses.length ? (
                            <>
                                <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                    {popularCourses.map((course) => (
                                        <li key={course.id} className="flex">
                                            <CourseCard
                                                course={course}
                                                className="w-full"
                                            />
                                        </li>
                                    ))}
                                </ul>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <nav
                                        aria-label={t(
                                            'home.popularPagination',
                                            'Popular courses pagination',
                                        )}
                                        className="mt-10 flex items-center justify-center gap-2"
                                    >
                                        <button
                                            type="button"
                                            disabled={!hasPreviousPage || popularPage <= 1}
                                            onClick={() => handlePageChange(Math.max(1, popularPage - 1))}
                                            aria-label={t('common.previous', 'Previous')}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-primary"
                                        >
                                            <PrevIcon className="text-base" />
                                        </button>

                                        {Array.from({ length: totalPages }).map((_, index) => {
                                            const page = index + 1
                                            const isActive = page === popularPage
                                            return (
                                                <button
                                                    key={page}
                                                    type="button"
                                                    aria-current={isActive ? 'page' : undefined}
                                                    onClick={() => handlePageChange(page)}
                                                    className={classNames(
                                                        'h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold transition-colors',
                                                        isActive
                                                            ? 'border-primary bg-primary text-neutral shadow-sm'
                                                            : 'border-border bg-surface text-text-primary hover:border-primary hover:text-primary',
                                                    )}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        })}

                                        <button
                                            type="button"
                                            disabled={!hasNextPage || popularPage >= totalPages}
                                            onClick={() => handlePageChange(Math.min(totalPages, popularPage + 1))}
                                            aria-label={t('common.next', 'Next')}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-text-primary"
                                        >
                                            <NextIcon className="text-base" />
                                        </button>
                                    </nav>
                                )}
                            </>
                        ) : (
                            <StateView
                                tone="empty"
                                title={t(
                                    'home.noCoursesTitle',
                                    'No published courses yet',
                                )}
                                description={t(
                                    'home.noCoursesBody',
                                    'New courses appear here as soon as they are published.',
                                )}
                            />
                        )}
                    </div>
                </Container>
            </section>

            {/* Categories — dense navigational list, deliberately not cards */}
            {categories.length > 0 && (
                <section className="border-y border-border bg-background-secondary py-14 lg:py-16">
                    <Container width="wide">
                        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                            <SectionIntro
                                align="start"
                                eyebrow={t('home.browseEyebrow', 'Browse')}
                                title={t(
                                    'home.categoriesTitle',
                                    'Find your subject',
                                )}
                                description={t(
                                    'home.categoriesBody',
                                    'Jump straight into a category and filter from there.',
                                )}
                                link={{
                                    label: t(
                                        'home.allCategories',
                                        'All categories',
                                    ),
                                    to: '/categories',
                                }}
                            />
                            <ul className="grid gap-x-10 sm:grid-cols-2">
                                {categories.slice(0, 10).map((category) => (
                                    <li key={category.id}>
                                        <CategoryTile category={category} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </Container>
                </section>
            )}

            {/* How it works — numbered editorial steps, no icon grid */}
            <section className="py-14 lg:py-16">
                <Container width="wide">
                    <SectionIntro
                        align="start"
                        title={t('home.howTitle', 'How learning works here')}
                        className="max-w-2xl"
                    />
                    <ol className="mt-8 grid gap-8 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            {
                                key: 'choose',
                                title: t('home.step1Title', 'Choose a course'),
                                body: t(
                                    'home.step1Body',
                                    'Compare outcomes, requirements and curriculum before you commit.',
                                ),
                            },
                            {
                                key: 'enrol',
                                title: t('home.step2Title', 'Enrol'),
                                body: t(
                                    'home.step2Body',
                                    'Create an account once and keep every course in one place.',
                                ),
                            },
                            {
                                key: 'learn',
                                title: t('home.step3Title', 'Work through it'),
                                body: t(
                                    'home.step3Body',
                                    'Lessons are grouped into sections, with your position saved as you go.',
                                ),
                            },
                            {
                                key: 'finish',
                                title: t('home.step4Title', 'Finish'),
                                body: t(
                                    'home.step4Body',
                                    'Complete every lesson to close out the course and collect your certificate.',
                                ),
                            },
                        ].map((step, index) => (
                            <li key={step.key}>
                                <p className="text-sm font-bold text-secondary">
                                    {String(index + 1).padStart(2, '0')}
                                </p>
                                <h3 className="mt-2 text-base font-bold text-text-primary">
                                    {step.title}
                                </h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                                    {step.body}
                                </p>
                            </li>
                        ))}
                    </ol>
                </Container>
            </section>

            {/* Instructors — profile composition */}
            {instructors.length > 0 && (
                <section className="border-t border-border py-14 lg:py-16">
                    <Container width="wide">
                        <SectionIntro
                            title={t('home.instructorsTitle', 'Who teaches')}
                            description={t(
                                'home.instructorsBody',
                                'Every course on the platform is authored by a named instructor.',
                            )}
                            link={{
                                label: t(
                                    'home.allInstructors',
                                    'All instructors',
                                ),
                                to: '/instructors',
                            }}
                        />
                        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {instructors.map((instructor) => (
                                <li key={instructor.id} className="flex">
                                    <InstructorTile
                                        instructor={instructor}
                                        className="w-full"
                                    />
                                </li>
                            ))}
                        </ul>
                    </Container>
                </section>
            )}

            {/* Closing CTA — single band, only for signed-out visitors */}
            {!authenticated && (
                <section className="bg-primary">
                    <Container
                        width="wide"
                        className="flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center"
                    >
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-bold text-neutral">
                                {t(
                                    'home.ctaTitle',
                                    'Create an account to keep your progress',
                                )}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-neutral/80">
                                {t(
                                    'home.ctaBody',
                                    'Save courses, resume where you stopped, and download certificates when you finish.',
                                )}
                            </p>
                        </div>
                        <Link
                            to="/sign-up"
                            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-secondary px-6 text-sm font-bold text-neutral transition-colors hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral"
                        >
                            {t('site.createAccount', 'Create account')}
                            <Arrow aria-hidden="true" />
                        </Link>
                    </Container>
                </section>
            )}
        </>
    )
}

export default Home
