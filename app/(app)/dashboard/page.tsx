import { getCurrentSessionUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentSessionUser();
  console.log("Current user:", user);
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      <div className="rounded-lg bg-white p-6 shadow">
        <p className="text-gray-600">Welcome to your dashboard!</p>
        <p className="mt-2 text-sm text-gray-500">
          You have successfully logged in.
        </p>
      </div>
    </div>
  );
}
