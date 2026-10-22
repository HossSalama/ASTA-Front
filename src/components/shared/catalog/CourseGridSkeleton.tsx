import classNames from 'classnames'

interface CourseGridSkeletonProps {
    count?: number
    layout?: 'grid' | 'row'
    className?: string
}

const CourseGridSkeleton = ({
    count = 8,
    layout = 'grid',
    className,
}: CourseGridSkeletonProps) => {
    const items = Array.from({ length: count })

    if (layout === 'row') {
        return (
            <div
                className={classNames('divide-y divide-border', className)}
                aria-hidden="true"
            >
                {items.map((_, index) => (
                    <div key={index} className="flex gap-4 py-6">
                        <div className="aspect-video w-64 shrink-0 animate-pulse rounded-lg bg-surface-alt" />
                        <div className="flex-1 space-y-3 py-1">
                            <div className="h-3 w-24 animate-pulse rounded bg-surface-alt" />
                            <div className="h-5 w-3/4 animate-pulse rounded bg-surface-alt" />
                            <div className="h-3 w-full animate-pulse rounded bg-surface-alt" />
                            <div className="h-3 w-1/3 animate-pulse rounded bg-surface-alt" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div
            className={classNames(
                'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                className,
            )}
            aria-hidden="true"
        >
            {items.map((_, index) => (
                <div
                    key={index}
                    className="overflow-hidden rounded-lg border border-border bg-surface"
                >
                    <div className="aspect-video w-full animate-pulse bg-surface-alt" />
                    <div className="space-y-3 p-4">
                        <div className="h-3 w-20 animate-pulse rounded bg-surface-alt" />
                        <div className="h-4 w-full animate-pulse rounded bg-surface-alt" />
                        <div className="h-4 w-2/3 animate-pulse rounded bg-surface-alt" />
                        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-alt" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default CourseGridSkeleton
