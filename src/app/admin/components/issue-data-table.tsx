
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { issueCategories } from "@/lib/types"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function IssueDataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div>
        <div className="flex items-center py-4 gap-2">
            <Input
            placeholder="Filter by title..."
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            />
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                Filter Status
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {['Pending', 'Seen', 'Accepted', 'In Progress', 'Resolved', 'Rejected'].map((status) => {
                return (
                    <DropdownMenuCheckboxItem
                    key={status}
                    className="capitalize"
                    checked={(table.getColumn("status")?.getFilterValue() as string[])?.includes(status) ?? false}
                    onCheckedChange={(value) => {
                        const currentFilter = (table.getColumn("status")?.getFilterValue() as string[]) || []
                        if (value) {
                            table.getColumn("status")?.setFilterValue([...currentFilter, status])
                        } else {
                            table.getColumn("status")?.setFilterValue(currentFilter.filter(s => s !== status))
                        }
                    }}
                    >
                    {status}
                    </DropdownMenuCheckboxItem>
                )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">
                Filter Category
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {issueCategories.map((category) => {
                return (
                    <DropdownMenuCheckboxItem
                    key={category}
                    className="capitalize"
                    checked={(table.getColumn("category")?.getFilterValue() as string[])?.includes(category) ?? false}
                    onCheckedChange={(value) => {
                        const currentFilter = (table.getColumn("category")?.getFilterValue() as string[]) || []
                        if (value) {
                            table.getColumn("category")?.setFilterValue([...currentFilter, category])
                        } else {
                            table.getColumn("category")?.setFilterValue(currentFilter.filter(s => s !== category))
                        }
                    }}
                    >
                    {category}
                    </DropdownMenuCheckboxItem>
                )
                })}
            </DropdownMenuContent>
            </DropdownMenu>
      </div>
        <div className="rounded-md border">
        <Table>
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                    return (
                    <TableHead key={header.id}>
                        {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                            )}
                    </TableHead>
                    )
                })}
                </TableRow>
            ))}
            </TableHeader>
            <TableBody>
            {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                >
                    {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            >
            Previous
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            >
            Next
            </Button>
        </div>
    </div>
  )
}
