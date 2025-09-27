"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Logo } from "./Logo";
import UserMenuButton from "./UserMenuButton";

interface Props {
  user: Session["user"] | undefined;
  avatarUrl?: string | undefined;
}

export default function NavbarRoutes({ user, avatarUrl }: Props) {
  const pathname = usePathname();

  const routes = [
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <>
      <div className="hidden flex-1 md:block">
        <Link href="/" className="mr-8 inline-block">
          <Logo />
        </Link>
      </div>

      <div className="hidden flex-1 md:block">
        <div className="flex w-full justify-end gap-x-2 align-middle">
          <ul className="flex items-center gap-x-2">
            {routes.map((route) => (
              <li className="mr-4" key={route.href}>
                <Link href={route.href}>
                  <p
                    className={cn(
                      "hover:text-primary-500 cursor-pointer rounded-full font-semibold transition",
                      pathname === route.href
                        ? "text-secondary-600"
                        : "text-primary",
                    )}
                  >
                    {route.label}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-x-2">
        <UserMenuButton user={user} />
      </div>
    </>
  );
}
