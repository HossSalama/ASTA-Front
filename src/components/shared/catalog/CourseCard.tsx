import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { TbClock, TbUser, TbWorld, TbCalendar } from 'react-icons/tb'
import dayjs from 'dayjs'
import Rating from './Rating'
import SaveCourseButton from './SaveCourseButton'
import CourseThumbnail from './CourseThumbnail'
import {
    courseHref,
    formatDuration,
    formatPrice,
    localizedName,
} from '@/utils/catalog'
import type { CatalogCourse } from '@/services/CatalogService'
import { CourseDeliveryType, isLiveCourse } from '@/@types/courseContent'

export type CourseCardLayout = 'grid' | 'row' | 'compact'

interface CourseCardProps {
    course: CatalogCourse
    layout?: CourseCardLayout
    /** Percentage 0-100. When present the card presents learning state instead of price. */
    progress?: number
    showSave?: boolean
    className?: string
}

const CourseCard = ({
    course,
    layout = 'grid',
    progress,
    showSave = true,
    className,
}: CourseCardProps) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language
    const category = localizedName(course.category, lang)
    const href = courseHref(course.id)
    const isEnrolledView = typeof progress === 'number'
    const isLive = isLiveCourse(course.deliveryType)

    const meta = (
        <>
            <span className="inline-flex items-center gap-1">
                <TbClock aria-hidden="true" />
                {formatDuration(course.duration, lang)}
            </span>
            {course.language && (
                <span className="inline-flex items-center gap-1">
                    <TbWorld aria-hidden="true" />
                    {course.language}
                </span>
            )}
            {isLive && course.startDate && (
                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                    <TbCalendar aria-hidden="true" />
                    {dayjs(course.startDate).format('DD/MM/YYYY')}
                </span>
            )}
        </>
    )

    if (layout === 'compact') {
        return (
            <Link
                to={href}
                className={classNames(
                    'group flex items-start gap-3 py-3 transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    className,
                )}
            >
                <CourseThumbnail
                    course={course}
                    className="w-20 shrink-0 rounded-md"
                />
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-text-primary group-hover:text-primary">
                        {isLive && (
                            <span className="inline-flex items-center rounded bg-rose-500/10 px-1 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                                {t('liveSessions.liveBadge', 'مباشر')}
                            </span>
                        )}
                        <span className="truncate">{course.name}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-text-secondary">
                        {course.instructor?.name || category}
                    </span>
                </span>
            </Link>
        )
    }

    if (layout === 'row') {
        return (
            <article
                className={classNames(
                    'group relative flex flex-col gap-4 border-b border-border py-6 sm:flex-row',
                    className,
                )}
            >
                <Link
                    to={href}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="sm:w-64 shrink-0 relative block"
                >
                    <CourseThumbnail course={course} className="rounded-lg" />
                    {isLive && (
                        <span className="absolute start-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-rose-600/90 backdrop-blur-xs px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                            </span>
                            {t('liveSessions.liveBadge', 'مباشر')}
                        </span>
                    )}
                </Link>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        {category && (
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                {category}
                            </p>
                        )}
                        {isLive && (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                                </span>
                                {t('liveSessions.liveCourse', 'دورة مباشرة')}
                            </span>
                        )}
                    </div>
                    <h3 className="mt-1 text-lg font-bold leading-snug text-text-primary">
                        <Link
                            to={href}
                            className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                            {course.name}
                        </Link>
                    </h3>
                    {course.shortDescription && (
                        <p className="mt-1.5 line-clamp-2 text-sm text-text-secondary">
                            {course.shortDescription}
                        </p>
                    )}
                    {course.instructor?.name && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-secondary">
                            <TbUser aria-hidden="true" />
                            {course.instructor.name}
                        </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
                        <Rating
                            value={course.averageRating}
                            count={course.ratingCount}
                        />
                        {meta}
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end sm:justify-between">
                    <p className="text-lg font-bold text-text-primary">
                        {formatPrice(course.price, lang)}
                    </p>
                    {showSave && (
                        <SaveCourseButton
                            courseId={course.id}
                            className="relative z-10 -me-2"
                        />
                    )}
                </div>
            </article>
        )
    }

    return (
        <article
            className={classNames(
                'group relative flex h-full flex-col overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md',
                className,
            )}
        >
            <div className="relative">
                <CourseThumbnail course={course} />
                {isLive && (
                    <span className="absolute start-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-rose-600/90 backdrop-blur-xs px-2 py-0.5 text-xs font-bold text-white shadow-xs">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                        {t('liveSessions.liveBadge', 'مباشر')}
                    </span>
                )}
                {showSave && (
                    <SaveCourseButton
                        courseId={course.id}
                        className="absolute end-2 top-2 z-10"
                    />
                )}
            </div>
            <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {category && (
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                            {category}
                        </p>
                    )}
                </div>
                <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug text-text-primary">
                    <Link
                        to={href}
                        className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        {course.name}
                    </Link>
                </h3>
                {course.instructor?.name && (
                    <p className="mt-1 truncate text-sm text-text-secondary">
                        {course.instructor.name}
                    </p>
                )}

                <div className="mt-auto pt-3">
                    {isEnrolledView ? (
                        <div>
                            <div
                                className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt"
                                role="progressbar"
                                aria-valuenow={Math.round(progress)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={t(
                                    'catalog.courseProgress',
                                    'Course progress',
                                )}
                            >
                                <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="mt-2 text-xs font-medium text-text-secondary">
                                {t('catalog.percentComplete', {
                                    defaultValue: '{{value}}% complete',
                                    value: Math.round(progress),
                                })}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
                                <Rating
                                    value={course.averageRating}
                                    count={course.ratingCount}
                                />
                            </div>
                            <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs text-text-secondary">
                                        <TbClock aria-hidden="true" />
                                        {formatDuration(course.duration, lang)}
                                    </span>
                                </div>
                                <span className="text-base font-bold text-text-primary">
                                    {formatPrice(course.price, lang)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </article>
    )
}

export default CourseCard
