import { useTranslation } from 'react-i18next'
import Container from '@/components/shared/Container'
import Breadcrumbs from '@/components/shared/catalog/Breadcrumbs'
import CategoryTile from '@/components/shared/catalog/CategoryTile'
import StateView, { CatalogErrorState } from '@/components/shared/catalog/StateView'
import { useCatalogCategories } from '@/utils/hooks/useCatalog'

const Categories = () => {
    const { t } = useTranslation()
    const { categories, isLoading, error } = useCatalogCategories()

    return (
        <Container width="wide" className="py-8 lg:py-12">
            <Breadcrumbs 
                items={[
                    { label: t('site.nav.home', 'Home'), to: '/' },
                    { label: t('site.nav.categories', 'Categories') }
                ]} 
            />

            <div className="mt-6 border-b border-border pb-8">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                    {t('categories.title', 'Explore by category')}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-text-secondary">
                    {t('categories.description', 'Browse courses by subject and find exactly what you want to learn.')}
                </p>
            </div>

            <div className="mt-10">
                {error ? (
                    <CatalogErrorState />
                ) : isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-alt" />
                        ))}
                    </div>
                ) : categories.length > 0 ? (
                    <ul className="grid gap-x-12 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map(category => (
                            <li key={category.id}>
                                <CategoryTile category={category} />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <StateView 
                        tone="empty"
                        title={t('categories.emptyTitle', 'No categories available')}
                    />
                )}
            </div>
        </Container>
    )
}

export default Categories
