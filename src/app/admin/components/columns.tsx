
"use client"

import type { Issue } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table"
import { StatusBadge } from "@/components/issues/StatusBadge";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<Issue>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
        return <Badge variant="outline">{row.original.id}</Badge>
    }
  },
  {
    accessorKey: "title",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
            <div className="flex items-center gap-2">
                {row.original.isUrgent && <AlertTriangle className="h-4 w-4 text-destructive" />}
                <div className="font-medium line-clamp-2">{row.original.title}</div>
            </div>
        )
      }
  },
  {
    accessorKey: "category",
    header: "Category",
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
        return <StatusBadge status={row.original.status} />
    },
    filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
  },
  {
    accessorKey: "submittedAt",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Submitted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
    },
    cell: ({ row }) => {
        return <div>{format(row.original.submittedAt, 'PP')}</div>
    }
  },
  {
    accessorKey: "upvotes",
    header: "Upvotes",
    
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const issue = row.original
 
      return (
        <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/issues/${issue.id}`}>
                View
                <ExternalLink className="ml-2 h-3 w-3" />
            </Link>
        </Button>
      )
    },
  },
]
