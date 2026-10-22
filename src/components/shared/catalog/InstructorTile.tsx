import { Link } from 'react-router-dom'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import Avatar from '@/components/ui/Avatar'
import { instructorHref } from '@/utils/catalog'
import type { InstructorResponse } from '@/@types/adminManagement'
import type { PublicInstructorSummary } from '@/@types/publicCatalog'

interface InstructorTileProps {
    instructor: PublicInstructorSummary | InstructorResponse
    layout?: 'card' | 'row'
    className?: string
}

const initials = (name: string) =>
    name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()

const InstructorTile = ({
    instructor,
    layout = 'card',
    className,
}: InstructorTileProps) => {
    const { t } = useTranslation()
    const href = instructorHref(instructor.id)

    const countLabel = t('catalog.courseCount', {
        defaultValue: '{{count}} course',
        defaultValue_plural: '{{count}} courses',
        count: instructor.courseCount || 0,
    })

    if (layout === 'row') {
        return (
            <Link
                to={href}
                className={classNames(
                    'group flex items-center gap-3 py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    className,
                )}
            >
                <Avatar
                    size={40}
                    shape="circle"
                    src={instructor.profileImageUrl || undefined}
                >
                    {initials(instructor.name)}
                </Avatar>
                <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary group-hover:text-primary">
                        {instructor.name}
                    </span>
                    <span className="block text-xs text-text-secondary">
                        {countLabel}
                    </span>
                </span>
            </Link>
        )
    }

    return (
        <article
            className={classNames(
                'group relative flex flex-col items-start gap-3 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary',
                className,
            )}
        >
            <Avatar
                size={64}
                shape="circle"
                src={instructor.profileImageUrl || undefined}
            >
                {initials(instructor.name)}
            </Avatar>
            <div className="min-w-0">
                <h3 className="text-base font-bold text-text-primary">
                    <Link
                        to={href}
                        className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                        {instructor.name}
                    </Link>
                </h3>
                <p className="mt-0.5 text-xs font-medium text-text-secondary">
                    {countLabel}
                </p>
            </div>
            {instructor.bio && (
                <p className="line-clamp-3 text-sm leading-relaxed text-text-secondary">
                    {instructor.bio}
                </p>
            )}
        </article>
    )
}

export default InstructorTile
