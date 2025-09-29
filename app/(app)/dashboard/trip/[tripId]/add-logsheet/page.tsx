import LogSheetForm from "@/components/eld-logs/LogSheetForm";
import { getCurrentSessionUser } from "@/lib/auth";

export default async function AddLogSheetPage({
  params,
}: {
  params: { tripId: string };
}) {
  const { tripId } = await params;
  const { driver } = await getCurrentSessionUser();

  return (
    <div className="mx-auto max-w-xl p-6">
      <h2 className="mb-4 text-2xl font-bold">Add Log Sheet</h2>
      <LogSheetForm tripId={Number(tripId)} driverId={Number(driver.id)} />
    </div>
  );
}
