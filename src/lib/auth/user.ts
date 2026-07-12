import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function requireUser() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  if (!(await isAuthenticated())) return null;

  const kindeUser = await getUser();
  if (!kindeUser?.id || !kindeUser.email) return null;

  const user = await prisma.user.upsert({
    where: { kindeId: kindeUser.id },
    update: {
      email: kindeUser.email,
      name:
        [kindeUser.given_name, kindeUser.family_name]
          .filter(Boolean)
          .join(" ") || kindeUser.email,
    },
    create: {
      kindeId: kindeUser.id,
      email: kindeUser.email,
      name:
        [kindeUser.given_name, kindeUser.family_name]
          .filter(Boolean)
          .join(" ") || kindeUser.email,
    },
  });

  return user;
}
