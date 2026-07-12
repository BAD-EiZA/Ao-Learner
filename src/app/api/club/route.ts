import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/user";
import { createClub, getClubBoard, joinClub } from "@/lib/learning/club";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const board = await getClubBoard(user.id);
  return NextResponse.json({ board });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body.action === "create") {
    const club = await createClub(user.id, String(body.name ?? "Ao Club"));
    return NextResponse.json({ club });
  }
  const r = await joinClub(user.id, String(body.code ?? ""));
  if (!r.ok)
    return NextResponse.json({ error: r.reason }, { status: 400 });
  return NextResponse.json(r);
}
