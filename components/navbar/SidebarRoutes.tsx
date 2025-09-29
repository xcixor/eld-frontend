"use client";

import { usePathname } from "next/navigation";

import { SidebarItem } from "./SidebarItem";

export default function SidebarRoutes() {
  const pathname = usePathname();

  const routes: { icon: any; label: string; href: string }[] = [
    { icon: "home", label: "Home", href: "/" },
    { icon: "dashboard", label: "Dashboard", href: "/dashboard" },
  ];

  return (
    <div className="flex w-full flex-col">
      {routes.map((route, index) => (
        <SidebarItem
          key={index}
          icon={route.icon}
          label={route.label}
          href={route.href}
        />
      ))}
    </div>
  );
}
