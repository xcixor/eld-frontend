import { User2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getCurrentSessionUser } from "@/lib/auth";

import SidebarRoutes from "./SidebarRoutes";

export const Sidebar = async () => {
  const user = await getCurrentSessionUser();

  return (
    <div className="bg-primary-100 flex h-full flex-col overflow-y-auto border-r border-sky-50 pl-6">
      {user && (
        <>
          <div className="py-6">
            <Link href="/dashboard/">
              <Avatar>
                <AvatarFallback>
                  <User2 />
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
          <div className="flex w-full flex-col">
            <SidebarRoutes />
          </div>
        </>
      )}
    </div>
  );
};
