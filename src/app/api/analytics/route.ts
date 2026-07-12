import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      props?: Record<string, unknown>;
    };
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const { isAuthenticated, getUser } = getKindeServerSession();
      if (await isAuthenticated()) {
        const ku = await getUser();
        if (ku?.id) {
          const u = await prisma.user.findUnique({
            where: { kindeId: ku.id },
            select: { id: true },
          });
          userId = u?.id ?? null;
        }
      }
    } catch {
      /* anonymous ok */
    }

    await prisma.analyticsEvent.create({
      data: {
        name: body.name.slice(0, 80),
        userId,
        props: (body.props as object | undefined) ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
