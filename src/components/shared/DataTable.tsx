import {
    useMemo,
    useRef,
    useEffect,
    useState,
    useImperativeHandle,
} from 'react'
import classNames from 'classnames'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import TableRowSkeleton from './loaders/TableRowSkeleton'
import Loading from './Loading'
import FileNotFound from '@/assets/svg/FileNotFound'
import useTranslation from '@/utils/hooks/useTranslation'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
    ColumnSort,
    Row,
    CellContext,
} from '@tanstack/react-table'
import type { TableProps } from '@/components/ui/Table'
import type { SkeletonProps } from '@/components/ui/Skeleton'
import type { Ref, ChangeEvent, ReactNode } from 'react'
import type { CheckboxProps } from '@/components/ui/Checkbox'

export type OnSortParam = { order: 'asc' | 'desc' | ''; key: string | number }

type DataTableProps<T> = {
    columns: ColumnDef<T>[]
    customNoDataIcon?: ReactNode
    data?: unknown[]
    loading?: boolean
    noData?: boolean
    instanceId?: string
    onCheckBoxChange?: (checked: boolean, row: T) => void
    onIndeterminateCheckBoxChange?: (checked: boolean, rows: Row<T>[]) => void
    onPaginationChange?: (page: number) => void
    onSelectChange?: (num: number) => void
    onSort?: (sort: OnSortParam) => void
    onRowClick?: (row: T, e: React.MouseEvent<HTMLTableRowElement>) => void
    pageSizes?: number[]
    selectable?: boolean
    skeletonAvatarColumns?: number[]
    skeletonAvatarProps?: SkeletonProps
    pagingData?: {
        total: number
        pageIndex: number
        pageSize: number
    }
    checkboxChecked?: (row: T) => boolean
    indeterminateCheckboxChecked?: (row: Row<T>[]) => boolean
    ref?: Ref<DataTableResetHandle | HTMLTableElement>
} & TableProps

type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
    onChange: (event: CheckBoxChangeEvent) => void
    indeterminate: boolean
    onCheckBoxChange?: (event: CheckBoxChangeEvent) => void
    onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void
}

const { Tr, Th, Td, THead, TBody, Sorter } = Table

const IndeterminateCheckbox = (props: IndeterminateCheckboxProps) => {
    const {
        indeterminate,
        onChange,
        onCheckBoxChange,
        onIndeterminateCheckBoxChange,
        ...rest
    } = props

    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (typeof indeterminate === 'boolean' && ref.current) {
            ref.current.indeterminate = !rest.checked && indeterminate
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, indeterminate])

    const handleChange = (e: CheckBoxChangeEvent) => {
        onChange(e)
        onCheckBoxChange?.(e)
        onIndeterminateCheckBoxChange?.(e)
    }

    return (
        <Checkbox
            ref={ref}
            className="mb-0"
            onChange={(_, e) => handleChange(e)}
            {...rest}
        />
    )
}

export type DataTableResetHandle = {
    resetSorting: () => void
    resetSelected: () => void
}

function DataTable<T>(props: DataTableProps<T>) {
    const {
        skeletonAvatarColumns,
        columns: columnsProp = [],
        data = [],
        customNoDataIcon,
        loading,
        noData,
        onCheckBoxChange,
        onIndeterminateCheckBoxChange,
        onPaginationChange,
        onSelectChange,
        onSort,
        onRowClick,
        pageSizes = [10, 25, 50, 100],
        selectable = false,
        skeletonAvatarProps,
        pagingData = {
            total: 0,
            pageIndex: 1,
            pageSize: 10,
        },
        checkboxChecked,
        indeterminateCheckboxChecked,
        instanceId = 'data-table',
        ref,
        ...rest
    } = props

    const { t } = useTranslation()
    const { pageSize, pageIndex, total } = pagingData

    const isNoData =
        typeof noData === 'boolean' ? noData : (!loading && data.length === 0)

    const [sorting, setSorting] = useState<ColumnSort[] | null>(null)

    const pageSizeOption = useMemo(
        () =>
            pageSizes.map((number) => ({
                value: number,
                label: `${number}`,
            })),
        [pageSizes],
    )

    useEffect(() => {
        if (Array.isArray(sorting)) {
            const sortOrder =
                sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : ''
            const id = sorting.length > 0 ? sorting[0].id : ''
            onSort?.({ order: sortOrder, key: id })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sorting])

    const handleIndeterminateCheckBoxChange = (
        checked: boolean,
        rows: Row<T>[],
    ) => {
        if (!loading) {
            onIndeterminateCheckBoxChange?.(checked, rows)
        }
    }

    const handleCheckBoxChange = (checked: boolean, row: T) => {
        if (!loading) {
            onCheckBoxChange?.(checked, row)
        }
    }

    const finalColumns: ColumnDef<T>[] = useMemo(() => {
        const columns = columnsProp

        if (selectable) {
            return [
                {
                    id: 'select',
                    maxSize: 50,
                    header: ({ table }) => (
                        <IndeterminateCheckbox
                            checked={
                                indeterminateCheckboxChecked
                                    ? indeterminateCheckboxChecked(
                                          table.getRowModel().rows,
                                      )
                                    : table.getIsAllRowsSelected()
                            }
                            indeterminate={table.getIsSomeRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                            onIndeterminateCheckBoxChange={(e) => {
                                handleIndeterminateCheckBoxChange(
                                    e.target.checked,
                                    table.getRowModel().rows,
                                )
                            }}
                        />
                    ),
                    cell: ({ row }) => (
                        <IndeterminateCheckbox
                            checked={
                                checkboxChecked
                                    ? checkboxChecked(row.original)
                                    : row.getIsSelected()
                            }
                            disabled={!row.getCanSelect()}
                            indeterminate={row.getIsSomeSelected()}
                            onChange={row.getToggleSelectedHandler()}
                            onCheckBoxChange={(e) =>
                                handleCheckBoxChange(
                                    e.target.checked,
                                    row.original,
                                )
                            }
                        />
                    ),
                },
                ...columns,
            ]
        }
        return columns
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnsProp, selectable, loading, checkboxChecked])

    const table = useReactTable({
        data,
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        columns: finalColumns as ColumnDef<unknown | object | any[], any>[],
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        manualSorting: true,
        onSortingChange: (sorter) => {
            setSorting(sorter as ColumnSort[])
        },
        state: {
            sorting: sorting as ColumnSort[],
        },
    })

    const resetSorting = () => {
        table.resetSorting()
    }

    const resetSelected = () => {
        table.resetRowSelection(true)
    }

    useImperativeHandle(ref, () => ({
        resetSorting,
        resetSelected,
    }))

    const handlePaginationChange = (page: number) => {
        if (!loading) {
            resetSelected()
            onPaginationChange?.(page)
        }
    }

    const handleSelectChange = (value?: number) => {
        if (!loading) {
            onSelectChange?.(Number(value))
        }
    }

    return (
        <div className="flex flex-col w-full min-h-[460px] justify-between">
            <div className="flex-1 w-full flex flex-col overflow-x-auto">
                <Loading loading={Boolean(loading && data.length !== 0)} type="cover" className="w-full flex-1 flex flex-col">
                    <Table className="w-full min-w-full" {...rest}>
                        <THead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <Tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <Th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                style={{
                                                    width:
                                                        header.column.getSize() !== 150
                                                            ? header.column.getSize()
                                                            : undefined,
                                                }}
                                            >
                                                {header.isPlaceholder ? null : (
                                                    <div
                                                        className={classNames(
                                                            'flex items-center gap-1.5 whitespace-nowrap w-full',
                                                            (header.column.columnDef as { meta?: { align?: string } }).meta?.align === 'start'
                                                                ? 'justify-start text-start px-3'
                                                                : (header.column.columnDef as { meta?: { align?: string } }).meta?.align === 'end'
                                                                ? 'justify-end text-end px-3'
                                                                : 'justify-center text-center',
                                                            header.column.getCanSort() &&
                                                                'cursor-pointer select-none point',
                                                            loading &&
                                                                'pointer-events-none',
                                                        )}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        <span className="inline-flex items-center">
                                                            {flexRender(
                                                                header.column.columnDef
                                                                    .header,
                                                                header.getContext(),
                                                            )}
                                                        </span>
                                                        {header.column.getCanSort() && (
                                                            <Sorter
                                                                sort={header.column.getIsSorted()}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </Th>
                                        )
                                    })}
                                </Tr>
                            ))}
                        </THead>
                        {loading && data.length === 0 ? (
                            <TableRowSkeleton
                                columns={(finalColumns as Array<T>).length}
                                rows={pagingData.pageSize}
                                avatarInColumns={skeletonAvatarColumns}
                                avatarProps={skeletonAvatarProps}
                            />
                        ) : (
                            <TBody>
                                {isNoData ? (
                                    <Tr>
                                        <Td
                                            className="hover:bg-transparent text-center h-[340px]"
                                            colSpan={finalColumns.length}
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3 h-full">
                                                {customNoDataIcon ? (
                                                    customNoDataIcon
                                                ) : (
                                                    <>
                                                        <FileNotFound />
                                                        <span className="font-semibold text-gray-500 dark:text-gray-400 text-sm">
                                                            {t('common.noDataFound', 'لا توجد بيانات')}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </Td>
                                    </Tr>
                                ) : (
                                    table
                                        .getRowModel()
                                        .rows.slice(0, pageSize)
                                        .map((row) => {
                                            return (
                                                <Tr
                                                    key={row.id}
                                                    className={classNames(
                                                        onRowClick &&
                                                            'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                                                    )}
                                                    onClick={(e) =>
                                                        onRowClick?.(
                                                            row.original as T,
                                                            e,
                                                        )
                                                    }
                                                >
                                                    {row
                                                        .getVisibleCells()
                                                        .map((cell) => {
                                                            return (
                                                                <Td
                                                                    key={cell.id}
                                                                    style={{
                                                                        width: cell.column.getSize(),
                                                                    }}
                                                                >
                                                                    {flexRender(
                                                                        cell.column
                                                                            .columnDef
                                                                            .cell,
                                                                        cell.getContext(),
                                                                    )}
                                                                </Td>
                                                            )
                                                        })}
                                                </Tr>
                                            )
                                        })
                                )}
                            </TBody>
                        )}
                    </Table>
                </Loading>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Pagination
                    pageSize={pageSize}
                    currentPage={pageIndex}
                    total={total}
                    onChange={handlePaginationChange}
                />

                <div className="flex items-center gap-2.5">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {t('common.rowsPerPage', 'عدد الصفوف في الصفحة:')}
                    </span>
                    <div style={{ minWidth: 80 }}>
                        <Select
                            instanceId={instanceId}
                            size="sm"
                            menuPlacement="top"
                            isSearchable={false}
                            value={pageSizeOption.filter(
                                (option) => option.value === pageSize,
                            )}
                            options={pageSizeOption}
                            onChange={(option) => handleSelectChange(option?.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export type { ColumnDef, Row, CellContext }
export default DataTable
