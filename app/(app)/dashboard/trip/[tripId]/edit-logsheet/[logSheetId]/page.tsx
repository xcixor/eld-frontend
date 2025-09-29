import ManageLogSheet from "@/components/eld-logs/ManageLogSheet";

export default async function Page({
  params,
}: {
  params: { tripId: string; logSheetId: string };
}) {
  const { tripId, logSheetId } = await params;
  return (
    <ManageLogSheet tripId={Number(tripId)} logSheetId={Number(logSheetId)} />
  );
}
