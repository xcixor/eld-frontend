"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LogSheet } from "@/lib/api/logsheets";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function useLogSheetsColumns(tripId: string) {
  const router = useRouter();

  const columns: ColumnDef<LogSheet>[] = [
    {
      accessorKey: "date",
      header: "Date",
      enableSorting: true,
      cell: ({ row }) => row.original.date,
    },
    {
      accessorKey: "total_driving_time",
      header: "Driving (hrs)",
      enableSorting: true,
      cell: ({ row }) => row.original.total_driving_time.toFixed(2),
    },
    {
      accessorKey: "total_on_duty_time",
      header: "On Duty (hrs)",
      enableSorting: true,
      cell: ({ row }) => row.original.total_on_duty_time.toFixed(2),
    },
    {
      accessorKey: "total_off_duty_time",
      header: "Off Duty (hrs)",
      enableSorting: true,
      cell: ({ row }) => row.original.total_off_duty_time.toFixed(2),
    },
    {
      accessorKey: "total_sleeper_berth_time",
      header: "Sleeper (hrs)",
      enableSorting: true,
      cell: ({ row }) => row.original.total_sleeper_berth_time.toFixed(2),
    },
    {
      accessorKey: "miles_driven",
      header: "Miles",
      enableSorting: true,
      cell: ({ row }) => row.original.miles_driven,
    },
    {
      accessorKey: "hos_violation",
      header: "HOS?",
      enableSorting: true,
      cell: ({ row }) => (row.original.hos_violation ? "Yes" : "No"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/trip/${tripId}/edit-logsheet/${row.original.id}`)}>
          Edit
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  return columns;
}
