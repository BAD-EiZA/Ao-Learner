import { prisma } from "@/lib/db/prisma";
import { weekKey } from "@/lib/learning/leagues";

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createClub(userId: string, name: string) {
  const code = genCode();
  const club = await prisma.club.create({
    data: {
      code,
      name: name.slice(0, 40) || "Ao Club",
      weekKey: weekKey(),
      members: { create: { userId, weekXp: 0 } },
    },
  });
  await prisma.userStats.upsert({
    where: { userId },
    create: { userId, clubCode: code },
    update: { clubCode: code },
  });
  return club;
}

export async function joinClub(userId: string, code: string) {
  const club = await prisma.club.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!club) return { ok: false as const, reason: "not_found" };
  // leave old
  await prisma.clubMember.deleteMany({ where: { userId } });
  await prisma.clubMember.create({
    data: { clubId: club.id, userId, weekXp: 0 },
  });
  await prisma.userStats.upsert({
    where: { userId },
    create: { userId, clubCode: club.code },
    update: { clubCode: club.code },
  });
  return { ok: true as const, club };
}

export async function addClubXp(userId: string, amount: number) {
  const m = await prisma.clubMember.findUnique({ where: { userId } });
  if (!m) return;
  const key = weekKey();
  const club = await prisma.club.findUnique({ where: { id: m.clubId } });
  if (club && club.weekKey !== key) {
    await prisma.club.update({
      where: { id: club.id },
      data: { weekKey: key, weekXp: 0 },
    });
    await prisma.clubMember.updateMany({
      where: { clubId: club.id },
      data: { weekXp: 0 },
    });
  }
  await prisma.clubMember.update({
    where: { userId },
    data: { weekXp: { increment: amount } },
  });
  await prisma.club.update({
    where: { id: m.clubId },
    data: { weekXp: { increment: amount } },
  });
}

export async function getClubBoard(userId: string) {
  const m = await prisma.clubMember.findUnique({
    where: { userId },
    include: {
      club: {
        include: {
          members: {
            orderBy: { weekXp: "desc" },
            take: 20,
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
      },
    },
  });
  if (!m) return null;
  return {
    code: m.club.code,
    name: m.club.name,
    weekXp: m.club.weekXp,
    members: m.club.members.map((x, i) => ({
      rank: i + 1,
      name: x.user.name || x.user.email.split("@")[0] || "Learner",
      weekXp: x.weekXp,
      isMe: x.userId === userId,
    })),
  };
}
