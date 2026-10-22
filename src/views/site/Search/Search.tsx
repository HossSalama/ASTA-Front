import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import Container from '@/components/shared/Container'
import Breadcrumbs from '@/components/shared/catalog/Breadcrumbs'
import CourseCard from '@/components/shared/catalog/CourseCard'
import CourseGridSkeleton from '@/components/shared/catalog/CourseGridSkeleton'
import StateView, { CatalogErrorState } from '@/components/shared/catalog/StateView'
import { useCatalogCourses } from '@/utils/hooks/useCatalog'

const Search = () => {
    const { t } = useTranslation()
    const [params] = useSearchParams()
    const query = params.get('q') || ''

    const { courses, isLoading, error, totalCount } = useCatalogCourses({
        searchTerm: query,
        pageSize: 20
    })

    return (
        <Container width="wide" className="py-8 lg:py-12">
            <Breadcrumbs 
                items={[
                    { label: t('site.nav.home', 'Home'), to: '/' },
                    { label: t('site.nav.search', 'Search') }
                ]} 
            />

            <div className="mt-6 border-b border-border pb-8">
                <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                    {query 
                        ? t('search.resultsFor', 'Search results for "{{query}}"', { query })
                        : t('search.title', 'Search the catalogue')
                    }
                </h1>
                <p className="mt-2 text-sm text-text-secondary">
                    {t('search.count', 'Found {{count}} results', { count: totalCount })}
                </p>
            </div>

            <div className="mt-10">
                {error ? (
                    <CatalogErrorState />
                ) : isLoading ? (
                    <CourseGridSkeleton count={8} />
                ) : courses.length > 0 ? (
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {courses.map(course => (
                            <li key={course.id}>
                                <CourseCard course={course} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <StateView 
                        tone="noResults"
                        title={t('search.emptyTitle', 'No matches found')}
                        description={t('search.emptyBody', 'Try searching for something else, like "Product Design" or "JavaScript".')}
                    />
                )}
            </div>
        </Container>
    )
}

export default Search
