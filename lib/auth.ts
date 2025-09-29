import { getServerSession, Session } from "next-auth";
import { options } from "../app/api/auth/[...nextauth]/options";


export const getCurrentSessionUser = async (): Promise<Session > => {
  const session = await getServerSession(options);
  if (!session) {
    throw new Error("No active session found");
  }
  return session;
};
