import { useMemo, useState } from 'react'
import Container from '@/components/shared/Container'
import StateView from '@/components/shared/catalog/StateView'
import CourseGridSkeleton from '@/components/shared/catalog/CourseGridSkeleton'
import { useEnrollmentStore } from '@/store/enrollmentStore'
import { useMyEnrollments } from '@/utils/hooks/useCatalog'
import useTranslation from '@/utils/hooks/useTranslation'
import classNames from 'classnames'
import EnrolledCourseCard from './components/EnrolledCourseCard'
import TodayScheduleWidget from './components/TodayScheduleWidget'
import { EnrollmentFilter } from '@/types/enrollments'
import type { EnrollmentRecord } from '@/store/enrollmentStore'
import type { EnrolledCourseSummary } from '@/types/enrollments'

type FilterTab = 'All' | EnrollmentFilter

const MyLearning = () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<FilterTab>('All')
    const localEnrollments = useEnrollmentStore((state) => state.enrollments)

    const filterParam = activeTab === 'All' ? undefined : activeTab
    const {
        enrollments: backendCourses,
        isLoading,
        error,
    } = useMyEnrollments(filterParam)

    const entries = useMemo(() => {
        return (backendCourses as EnrolledCourseSummary[]).map((course) => {
            const record: EnrollmentRecord = localEnrollments[course.id] || {
                courseId: course.id,
                enrolledAt: course.createdAt || new Date().toISOString(),
                completedItemIds: [],
            }
            return { record, course }
        })
    }, [backendCourses, localEnrollments])

    const tabs: { key: FilterTab; label: string }[] = [
        { key: 'All', label: t('myLearning.allCourses', 'All Courses') },
        {
            key: EnrollmentFilter.InProgress,
            label: t('myLearning.inProgress', 'In Progress'),
        },
        {
            key: EnrollmentFilter.Completed,
            label: t('myLearning.completed', 'Completed'),
        },
        {
            key: EnrollmentFilter.PendingPayment,
            label: t('myLearning.pendingPayment', 'Pending Approval'),
        },
    ]

    return (
        <main className="py-8 md:py-12">
            <Container>
                <header className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
                        {t('myLearning.title', 'My Learning')}
                    </h1>
                    <p className="mt-2 text-text-secondary">
                        {t(
                            'myLearning.subtitle',
                            'Every course you have enrolled in, with your current progress.',
                        )}
                    </p>
                </header>

                <TodayScheduleWidget />

                {/* Filter Tabs matching Section 3.1 & 7.4 */}
                <div
                    role="tablist"
                    aria-label={t('myLearning.filter', 'Filter courses')}
                    className="mb-6 flex flex-wrap gap-2"
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            role="tab"
                            type="button"
                            aria-selected={activeTab === tab.key}
                            className={classNames(
                                'rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer',
                                activeTab === tab.key
                                    ? 'border-primary bg-primary text-neutral shadow-xs'
                                    : 'border-border bg-surface text-text-secondary hover:text-text-primary hover:border-border-subtle',
                            )}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {error ? (
                    <StateView
                        tone="error"
                        title={t(
                            'myLearning.errorTitle',
                            'We could not load your courses',
                        )}
                        description={t(
                            'myLearning.errorDesc',
                            'Please refresh the page or try again shortly.',
                        )}
                    />
                ) : isLoading ? (
                    <CourseGridSkeleton count={3} />
                ) : entries.length === 0 ? (
                    activeTab === 'All' ? (
                        <StateView
                            tone="empty"
                            title={t(
                                'myLearning.emptyTitle',
                                'You have not enrolled yet',
                            )}
                            description={t(
                                'myLearning.emptyDesc',
                                'Once you enrol in a course it appears here with your progress.',
                            )}
                            action={{
                                label: t(
                                    'myLearning.explore',
                                    'Explore courses',
                                ),
                                to: '/courses',
                            }}
                        />
                    ) : (
                        <StateView
                            compact
                            tone="noResults"
                            title={
                                activeTab === EnrollmentFilter.PendingPayment
                                    ? t(
                                          'myLearning.pendingEmptyTitle',
                                          'No pending payment requests',
                                      )
                                    : t(
                                          'myLearning.noneInFilter',
                                          'Nothing in this view yet',
                                      )
                            }
                            description={
                                activeTab === EnrollmentFilter.PendingPayment
                                    ? t(
                                          'myLearning.pendingEmptyDesc',
                                          'You do not have any course payments under review.',
                                      )
                                    : t(
                                          'myLearning.noCoursesInFilter',
                                          'No courses found in this section.',
                                      )
                            }
                        />
                    )
                ) : (
                    <ul className="space-y-4">
                        {entries.map(({ record, course }) => (
                            <EnrolledCourseCard
                                key={course.id}
                                course={course}
                                record={record}
                            />
                        ))}
                    </ul>
                )}
            </Container>
        </main>
    )
}

export default MyLearning
