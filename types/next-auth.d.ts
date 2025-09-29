import { DefaultUser } from "next-auth";

export type LoginUser = {
  id: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type DriverInfo = {
  id: string;
  driver_number?: string;
  initials?: string;
  home_operating_center?: string;
  license_number?: string;
  license_state?: string;
};

declare module "next-auth" {
  export interface Session {
    user: LoginUser;
    driver: DriverInfo;
    token: string;
    expires?: string;
  }
  export interface User extends DefaultUser {
    user: LoginUser;
    driver: DriverInfo;
    token: string;
    expires?: string;
  }
}
