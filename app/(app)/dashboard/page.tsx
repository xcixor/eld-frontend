import { getCurrentSessionUser } from "@/lib/auth";
import DashboardWrapper from "./dashboard-wrapper";


const DashboardPage = async () => {
  const {user, driver} = await getCurrentSessionUser();
  return (
    <DashboardWrapper user={user} driver={driver}  />
  )
}

export default DashboardPage