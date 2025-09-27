import { Menu } from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Sidebar } from "./Sidebar";
import { MobileRoutes } from "./MobileRoutes";

export const MobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger className="pr-4 text-zinc-700 transition hover:opacity-75 md:hidden">
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="bg-white p-0 text-zinc-700">
        <MobileRoutes />
      </SheetContent>
    </Sheet>
  );
};
