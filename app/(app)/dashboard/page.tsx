import { getCurrentSessionUser } from "@/lib/auth";
import DashboardWrapper from "../../../components/dashboard/dashboard-wrapper";

const DashboardPage = async () => {
  const { user, driver } = await getCurrentSessionUser();

  return (
    <div>
      <div className="mb-8 rounded-lg bg-white p-6 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to your dashboard!</p>
        <p className="mt-2 text-sm text-gray-500">
          Manage your trips and log sheets from here.
        </p>
      </div>
      <DashboardWrapper user={user} driver={driver} />
    </div>
  );
};

export default DashboardPage;
