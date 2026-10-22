import { useTranslation } from 'react-i18next'
import Container from '@/components/shared/Container'
import Breadcrumbs from '@/components/shared/catalog/Breadcrumbs'
import InstructorTile from '@/components/shared/catalog/InstructorTile'
import StateView, { CatalogErrorState } from '@/components/shared/catalog/StateView'
import { useCatalogInstructors } from '@/utils/hooks/useCatalog'

const Instructors = () => {
    const { t } = useTranslation()
    const { instructors, isLoading, error } = useCatalogInstructors({
        pageSize: 20
    })

    return (
        <Container width="wide" className="py-8 lg:py-12">
            <Breadcrumbs 
                items={[
                    { label: t('site.nav.home', 'Home'), to: '/' },
                    { label: t('site.nav.instructors', 'Instructors') }
                ]} 
            />

            <div className="mt-6 border-b border-border pb-8">
                <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                    {t('instructors.title', 'Our instructors')}
                </h1>
                <p className="mt-3 max-w-2xl text-base text-text-secondary">
                    {t('instructors.description', 'Learn from industry experts with years of real-world experience.')}
                </p>
            </div>

            <div className="mt-10">
                {error ? (
                    <CatalogErrorState />
                ) : isLoading ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-64 animate-pulse rounded-lg bg-surface-alt" />
                        ))}
                    </div>
                ) : instructors.length > 0 ? (
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {instructors.map((instructor) => (
                            <li key={instructor.id} className="flex">
                                <InstructorTile instructor={instructor} className="w-full" />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <StateView 
                        tone="empty"
                        title={t('instructors.emptyTitle', 'No instructors found')}
                        description={t('instructors.emptyBody', 'We are currently onboarding new instructors. Please check back soon.')}
                    />
                )}
            </div>
        </Container>
    )
}

export default Instructors
