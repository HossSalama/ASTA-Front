import Container from '@/components/shared/Container'
import { useTranslation } from 'react-i18next'
import { useWishlistStore } from '@/store/wishlistStore'
import { useCatalogCourses } from '@/utils/hooks/useCatalog'
import CourseCard from '@/components/shared/catalog/CourseCard'
import StateView from '@/components/shared/catalog/StateView'
import type { CatalogCourse } from '@/services/CatalogService'

const Saved = () => {
    const { t } = useTranslation()
    const { courseIds } = useWishlistStore()
    const { courses, isLoading } = useCatalogCourses()
    
    const savedCourses = courses.filter((c: CatalogCourse) => courseIds.includes(c.id))

    return (
        <main className="py-8 md:py-12">
            <Container>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-text-primary">
                        {t('site.saved.title', 'Wishlist')}
                    </h1>
                    <p className="mt-2 text-text-secondary">
                        {t('site.saved.subtitle', 'Courses you have added to your wishlist.')}
                    </p>
                </header>

                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-[340px] animate-pulse rounded-xl bg-surface-alt" />
                        ))}
                    </div>
                ) : savedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {savedCourses.map((course: CatalogCourse) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <StateView
                        tone="empty"
                        title={t('site.saved.emptyTitle', 'Your wishlist is empty')}
                        description={t('site.saved.emptyDescription', "You haven't added any courses to your wishlist yet. Explore our catalog to find something you love.")}
                        action={{
                            label: t('site.saved.explore', 'Explore Courses'),
                            to: '/courses'
                        }}
                    />
                )}
            </Container>
        </main>
    )
}

export default Saved
