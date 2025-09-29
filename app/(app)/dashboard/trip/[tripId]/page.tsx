"use client";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/DataTable';
import { useLogSheetsColumns } from '@/components/data-table/columns/log-sheets-columns';
import { getLogSheetsForTrip, LogSheet } from '@/lib/api/logsheets';


export default function TripLogSheetsPage({ params }: { params: { tripId: string } }) {
  const router = useRouter();
  const [logSheets, setLogSheets] = useState<LogSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const columns = useLogSheetsColumns(params.tripId);

  useEffect(() => {
    async function fetchLogSheets() {
      setLoading(true);
      const data = await getLogSheetsForTrip(params.tripId);
      setLogSheets(data);
      setLoading(false);
    }
    fetchLogSheets();
  }, [params.tripId]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Daily Log Sheets</h2>
        <Button onClick={() => router.push(`/dashboard/trip/${params.tripId}/add-logsheet`)}>
          Add Log Sheet
        </Button>
      </div>
      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <DataTable columns={columns} data={logSheets} searchPlaceholder="Filter log sheets..." />
      )}
    </div>
  );
}
