import { authService } from "@/lib/api/auth";
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

          return {
            id: loginResponse.user.id.toString(),
            username: loginResponse.user.username,
            email: loginResponse.user.email,
            first_name: loginResponse.user.first_name,
            last_name: loginResponse.user.last_name,
            driver_number: "",
            initials: "",
            home_operating_center: "",
            license_number: "",
            license_state: "",
            token: loginResponse.token,
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
        token.id = user.id;
        token.username = user.username;
        token.email = user.email;
        token.first_name = user.first_name;
        token.last_name = user.last_name;
        token.driver_number = user.driver_number;
        token.initials = user.initials;
        token.home_operating_center = user.home_operating_center;
        token.license_number = user.license_number;
        token.license_state = user.license_state;
        token.apiToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.username = token.username as string;
        session.user.email = token.email as string;
        session.user.first_name = token.first_name as string;
        session.user.last_name = token.last_name as string;
        session.user.driver_number = token.driver_number as string;
        session.user.initials = token.initials as string;
        session.user.home_operating_center =
          token.home_operating_center as string;
        session.user.license_number = token.license_number as string;
        session.user.license_state = token.license_state as string;
        session.user.token = token.apiToken as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: `/auth/error?callBackUrl=/auth/signin`,
  },

  secret: process.env.NEXTAUTH_SECRET,
} satisfies AuthOptions;
