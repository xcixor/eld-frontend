import { useSession } from "next-auth/react";

export interface CurrentUser {
  id: string | number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  driver_number?: string;
  initials?: string;
  home_operating_center?: string;
  license_number?: string;
  license_state?: string;
  token?: string;
}

export function useCurrentUser(): CurrentUser | undefined {
  const { data: session } = useSession();
  return session?.user as CurrentUser | undefined;
}
