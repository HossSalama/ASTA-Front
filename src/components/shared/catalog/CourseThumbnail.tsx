import classNames from 'classnames'
import { TbPhoto } from 'react-icons/tb'
import type { CatalogCourse } from '@/services/CatalogService'

interface CourseThumbnailProps {
    course: Pick<CatalogCourse, 'name' | 'thumbnailUrl'>
    className?: string
    /** Rendered above the fold (hero, first row) — skips lazy loading. */
    eager?: boolean
}

/**
 * Fixed 16:9 frame so grids never shift while images resolve, with a neutral
 * fallback for courses that have no artwork yet.
 */
const CourseThumbnail = ({
    course,
    className,
    eager,
}: CourseThumbnailProps) => {
    return (
        <div
            className={classNames(
                'relative aspect-video w-full overflow-hidden bg-surface-alt',
                className,
            )}
        >
            {course.thumbnailUrl ? (
                <img
                    src={course.thumbnailUrl}
                    alt=""
                    loading={eager ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full object-cover"
                />
            ) : (
                <span className="flex h-full w-full items-center justify-center text-text-muted">
                    <TbPhoto className="text-2xl" aria-hidden="true" />
                </span>
            )}
        </div>
    )
}

export default CourseThumbnail
