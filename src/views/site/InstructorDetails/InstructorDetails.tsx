import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { TbBook } from 'react-icons/tb'
import Container from '@/components/shared/Container'
import Breadcrumbs from '@/components/shared/catalog/Breadcrumbs'
import CourseCard from '@/components/shared/catalog/CourseCard'
import StateView, { CatalogErrorState } from '@/components/shared/catalog/StateView'
import { useCatalogInstructor, useCatalogCourses } from '@/utils/hooks/useCatalog'
import Avatar from '@/components/ui/Avatar'

const InstructorDetails = () => {
    const { t } = useTranslation()
    const { instructorId } = useParams<{ instructorId: string }>()
    const id = Number(instructorId)
    
    const { instructor, isLoading, error } = useCatalogInstructor(id)
    const { courses } = useCatalogCourses({ 
        instructorId: id,
        pageSize: 12
    })

    if (error) {
        return (
            <Container className="py-16">
                <CatalogErrorState />
            </Container>
        )
    }

    if (isLoading) {
        return (
            <Container className="py-16">
                <div className="animate-pulse h-64 bg-surface-alt rounded-lg" />
            </Container>
        )
    }

    if (!instructor) {
        return (
            <Container className="py-16">
                <StateView
                    tone="noResults"
                    title={t('instructor.notFound', 'Instructor not found')}
                />
            </Container>
        )
    }

    return (
        <Container width="wide" className="py-8 lg:py-12">
            <Breadcrumbs 
                items={[
                    { label: t('site.nav.home', 'Home'), to: '/' },
                    { label: t('site.nav.instructors', 'Instructors'), to: '/instructors' },
                    { label: instructor.name }
                ]} 
            />

            <div className="mt-8 grid gap-10 lg:grid-cols-[280px_1fr]">
                <aside className="space-y-6">
                    <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                        <Avatar 
                            size={160} 
                            src={instructor.profileImageUrl || undefined} 
                            className="ring-4 ring-surface shadow-lg"
                        />
                        <h1 className="mt-5 text-2xl font-bold text-text-primary">{instructor.name}</h1>
                        <p className="mt-1 font-medium text-secondary">{t('instructor.expert', 'Expert Instructor')}</p>
                    </div>

                    <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
                        <div className="flex items-center gap-3 text-sm">
                            <TbBook className="text-text-muted" />
                            <span className="font-semibold text-text-primary">
                                {instructor.courseCount || 0} {t('instructor.courses', 'Courses')}
                            </span>
                        </div>
                    </div>
                </aside>

                <main className="space-y-12">
                    <section>
                        <h2 className="text-xl font-bold text-text-primary">{t('instructor.about', 'About the instructor')}</h2>
                        <div className="mt-4 text-base leading-relaxed text-text-secondary whitespace-pre-line">
                            {instructor.bio || t('instructor.noBio', 'No biography provided.')}
                        </div>
                    </section>

                    {courses.length > 0 && (
                        <section>
                            <h2 className="text-xl font-bold text-text-primary">{t('instructor.coursesBy', 'Courses by {{name}}', { name: instructor.name })}</h2>
                            <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                {courses.map(course => (
                                    <li key={course.id}>
                                        <CourseCard course={course} />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </main>
            </div>
        </Container>
    )
}

export default InstructorDetails
