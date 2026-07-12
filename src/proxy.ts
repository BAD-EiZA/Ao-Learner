import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth;

export const config = {
  matcher: ["/dashboard/:path*", "/learn/:path*", "/api/evaluate"],
};
