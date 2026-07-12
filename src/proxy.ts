import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextResponse, type NextRequest } from "next/server";

function e2eBypass() {
  return (
    process.env.E2E_BYPASS_AUTH === "1" &&
    process.env.NODE_ENV !== "production"
  );
}

export default function proxy(req: NextRequest) {
  if (e2eBypass()) {
    return NextResponse.next();
  }
  // Kinde withAuth accepts NextRequest; cast for SDK typing
  return withAuth(req as never);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/placement/:path*",
    "/review/:path*",
    "/plan/:path*",
    "/scenarios/:path*",
    "/path/:path*",
    "/practice/:path*",
    "/match/:path*",
    "/shop/:path*",
    "/talk/:path*",
    "/gap/:path*",
    "/bank/:path*",
    "/checkpoint/:path*",
    "/society/:path*",
    "/friends/:path*",
    "/club/:path*",
    "/stories/:path*",
    "/report/:path*",
    "/plus/:path*",
    "/achievements/:path*",
    "/onboarding/:path*",
    "/api/evaluate",
    "/api/placement",
    "/api/leaderboard",
    "/api/hearts",
    "/api/goals",
    "/api/quests",
    "/api/shop",
    "/api/talk",
    "/api/trial",
    "/api/comeback",
    "/api/friends",
    "/api/club",
    "/api/bank",
    "/api/checkpoint",
    "/api/streak-society",
    "/api/achievements",
    "/api/plus",
  ],
};
