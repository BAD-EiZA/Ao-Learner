import Link from "next/link";
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function Nav() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();
  const user = authed ? await getUser() : null;

  return (
    <header className="sticky top-0 z-40 border-b-4 border-neo-ink bg-neo-yellow">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-3 sm:px-6">
        <Link
          href="/"
          className="neo-border neo-shadow-sm rounded-xl bg-neo-white px-3 py-1.5 text-sm font-black tracking-tight text-neo-ink sm:text-base"
        >
          AO LEARNER
        </Link>
        <nav className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          <Link
            href="/dashboard"
            className="neo-border neo-shadow-sm neo-press rounded-xl bg-neo-cyan px-3 py-1.5 font-black uppercase"
          >
            Learn
          </Link>
          {authed ? (
            <>
              <span className="hidden max-w-[120px] truncate font-bold text-neo-ink sm:inline">
                {user?.given_name || user?.email}
              </span>
              <LogoutLink className="neo-border neo-shadow-sm neo-press rounded-xl bg-neo-white px-3 py-1.5 font-black uppercase">
                Log out
              </LogoutLink>
            </>
          ) : (
            <>
              <LoginLink
                postLoginRedirectURL="/dashboard"
                className="neo-border neo-shadow-sm neo-press rounded-xl bg-neo-white px-3 py-1.5 font-black uppercase"
              >
                Log in
              </LoginLink>
              <RegisterLink
                postLoginRedirectURL="/dashboard"
                className="neo-border neo-shadow-sm neo-press rounded-xl bg-neo-pink px-3 py-1.5 font-black uppercase"
              >
                Sign up
              </RegisterLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
