import { getCurrentSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
    const user = await getCurrentSessionUser();
    console.log("Current user:", user);
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Welcome to your dashboard!</p>
        <p className="text-sm text-gray-500 mt-2">
          You have successfully logged in.
        </p>
      </div>
    </div>
  );
}