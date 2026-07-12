import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import {
  getLeaderboard,
  getMyLeaderboardFlag,
  setLeaderboardOptIn,
} from "@/lib/learning/leaderboard";

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [rows, optIn] = await Promise.all([
    getLeaderboard(25),
    getMyLeaderboardFlag(user.id),
  ]);
  return NextResponse.json({ rows, optIn });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { optIn?: boolean };
  await setLeaderboardOptIn(user.id, !!body.optIn);
  const rows = body.optIn ? await getLeaderboard(25) : [];
  return NextResponse.json({ optIn: !!body.optIn, rows });
}
