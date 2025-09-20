import { getServerSession } from "next-auth";

import { options } from "../app/api/auth/[...nextauth]/options";

export const getCurrentSessionUser = async () => {
  const session = await getServerSession(options);
  console.log("Session data:", session);
  const user = session?.user;
  return user;
};
