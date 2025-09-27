import { DefaultUser } from "next-auth";

declare module "next-auth" {
  export interface Session {
    user: {
      username?: string;
      first_name?: string;
      last_name?: string;
      driver_number?: string;
      initials?: string;
      home_operating_center?: string;
      license_number?: string;
      license_state?: string;
      token?: string;
      email?: string;
    };
  }
  export interface User extends DefaultUser {
    username: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    driver_number?: string;
    initials?: string;
    home_operating_center?: string;
    license_number?: string;
    license_state?: string;
    token?: string;
    email?: string;
  }
}
