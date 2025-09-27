"use client";

import { ChevronDown, LogIn, LogOut, UserIcon } from "lucide-react";
import Link from "next/link";
import { Session } from "next-auth";
import { signIn, signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuButtonProps {
  user: Session["user"] | undefined;
  avatarUrl?: string | undefined;
}

export default function UserMenuButton({
  user,
  avatarUrl,
}: UserMenuButtonProps) {
  return (
    <>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger className="border-transparent focus:border-transparent focus:outline-none focus:ring-0">
            <div className="flex items-center">
              <Avatar>
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  <UserIcon />
                </AvatarFallback>
              </Avatar>
              <ChevronDown />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-transparent focus:border-transparent focus:ring-0">
            <DropdownMenuLabel>Welcome, {user?.last_name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="mb-2 py-2">
              <Link href="/profile/dashboard" className="hover:cursor-pointer">
                My Dashboard
              </Link>
            </DropdownMenuItem>
            <Button
              size="sm"
              variant="default"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 size-4" /> SignOut
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          size="sm"
          variant="default"
          className="bg-primary focus-within:ring-transparent"
          onClick={() => signIn()}
        >
          <LogIn className="mr-2 size-4" /> SignIn
        </Button>
      )}
    </>
  );
}
