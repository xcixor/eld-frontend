import { authService } from "@/lib/api/auth";
import { DriverInfo, LoginUser } from "@/types/next-auth";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const options = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const loginResponse = await authService.login({
            username: credentials.username,
            password: credentials.password,
          });

          console.log("Login response:", loginResponse);

          if (!loginResponse.token) {
            console.error("No token received in login response");
            return null;
          }

          return {
            user: {
              id: loginResponse.user?.id?.toString() ?? "",
              username: loginResponse.user?.username ?? "",
              first_name: loginResponse.user?.first_name ?? "",
              last_name: loginResponse.user?.last_name ?? "",
            },
            driver: loginResponse.driver
              ? {
                  id: loginResponse.driver?.id?.toString() ?? "",
                  driver_number: loginResponse.driver?.driver_number ?? "",
                  initials: loginResponse.driver?.initials ?? "",
                  home_operating_center:
                    loginResponse.driver?.home_operating_center ?? "",
                  license_number: loginResponse.driver?.license_number ?? "",
                  license_state: loginResponse.driver?.license_state ?? "",
                }
              : {
                  id: "",
                  driver_number: "",
                  initials: "",
                  home_operating_center: "",
                  license_number: "",
                  license_state: "",
                },
            token: loginResponse.token ?? "",
            expires: loginResponse.expires ?? undefined,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt" as const,
    maxAge: 23 * 60 * 60, // 23 hours
  },

  jwt: {
    maxAge: 23 * 60 * 60, // 23 hours
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user.user;
        token.driver = user.driver;
        token.token = user.token;
        token.expires = user.expires;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as LoginUser;
        session.driver = token.driver as DriverInfo;
        session.token = token.token as string;
        session.expires = token.expires as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    error: `/auth/error?callBackUrl=/`,
  },

  secret: process.env.NEXTAUTH_SECRET,
} satisfies AuthOptions;
