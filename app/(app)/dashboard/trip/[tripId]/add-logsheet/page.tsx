
import LogSheetForm from '@/components/eld-logs/LogSheetForm';
import { getCurrentSessionUser } from '@/lib/auth';

export default async function AddLogSheetPage({ params }: { params: { tripId: string } }) {
  const { tripId } = await params;
  const { driver } = await getCurrentSessionUser();


  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Add Log Sheet</h2>
      <LogSheetForm tripId={Number(tripId)} driverId={Number(driver.id)} />
    </div>
  );
}
