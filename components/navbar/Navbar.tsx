import MaxWidthWrapper from "@/components/MaxWidthWrapper";
import { getCurrentSessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

import { MobileSidebar } from "./MobileSidebar";
import NavbarRoutes from "./NavbarRoutes";

type NavbarProps = {
  bgColor?: string;
};

const Navbar = async ({ bgColor }: NavbarProps) => {
  const user = await getCurrentSessionUser();

  return (
    <header
      className={cn(
        "text-black-900 flex h-32 items-center shadow-sm",
        bgColor && bgColor,
      )}
    >
      <MaxWidthWrapper className="">
        <nav className="flex size-full items-center justify-between py-4">
          <MobileSidebar />
          <NavbarRoutes user={user} />
        </nav>
      </MaxWidthWrapper>
    </header>
  );
};

export default Navbar;
