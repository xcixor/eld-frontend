"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session, status } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  if (status === "loading") {
    return (
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-xl font-bold text-gray-900"
              >
                ELD System
              </Link>
            </div>
            <div className="flex items-center">Loading...</div>
          </div>
        </div>
      </nav>
    );
  }

  if (status === "unauthenticated") {
    return (
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                ELD System
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              ELD System
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Hi {session?.user?.username}</span>
            <Button onClick={handleSignOut} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
