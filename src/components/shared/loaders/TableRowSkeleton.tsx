import Skeleton from '@/components/ui/Skeleton'
import Table from '@/components/ui/Table'
import type { SkeletonProps } from '@/components/ui/Skeleton'

type TableRowSkeletonProps = {
    columns?: number
    rows?: number
    avatarInColumns?: number[]
    avatarProps?: SkeletonProps
}

const { Tr, Td, TBody } = Table

const TableRowSkeleton = (props: TableRowSkeletonProps) => {
    const { columns = 1, rows = 10, avatarInColumns = [], avatarProps } = props

    return (
        <TBody className="w-full">
            {Array.from(new Array(rows), (_, i) => i + 0).map((row) => (
                <Tr key={`row-${row}`} className="w-full">
                    {Array.from(new Array(columns), (_, i) => i + 0).map(
                        (col) => (
                            <Td key={`col-${col}`}>
                                <div className="flex flex-auto items-center gap-2 w-full">
                                    {avatarInColumns.includes(col) && (
                                        <div>
                                            <Skeleton
                                                variant="circle"
                                                {...avatarProps}
                                            />
                                        </div>
                                    )}
                                    <Skeleton className="w-full" />
                                </div>
                            </Td>
                        ),
                    )}
                </Tr>
            ))}
        </TBody>
    )
}

export default TableRowSkeleton
