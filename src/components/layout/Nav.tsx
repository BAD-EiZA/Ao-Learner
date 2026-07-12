import Link from "next/link";
import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { UserMenu } from "@/components/layout/UserMenu";
import { NavClientLinks } from "@/components/layout/NavClientLinks";

export async function Nav() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  const authed = await isAuthenticated();
  const user = authed ? await getUser() : null;

  const name =
    [user?.given_name, user?.family_name].filter(Boolean).join(" ") ||
    user?.given_name ||
    null;

  return (
    <header className="sticky top-0 z-40 border-b-4 border-neo-ink bg-neo-yellow pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="neo-border neo-shadow-sm shrink-0 rounded-xl bg-neo-white px-2.5 py-2 text-xs font-black tracking-tight text-neo-ink sm:px-3 sm:text-base"
        >
          AO
          <span className="hidden sm:inline"> LEARNER</span>
        </Link>
        <nav className="flex min-w-0 items-center gap-1.5 text-xs sm:gap-2 sm:text-sm">
          <NavClientLinks />
          {authed && user ? (
            <UserMenu
              name={name}
              email={user.email}
              picture={user.picture}
            />
          ) : (
            <>
              <LoginLink
                postLoginRedirectURL="/dashboard"
                className="neo-border neo-shadow-sm neo-press hidden min-h-11 items-center rounded-xl bg-neo-white px-3 py-2 font-black uppercase sm:inline-flex"
              >
                Log in
              </LoginLink>
              <RegisterLink
                postLoginRedirectURL="/dashboard"
                className="neo-border neo-shadow-sm neo-press inline-flex min-h-11 items-center rounded-xl bg-neo-pink px-3 py-2 font-black uppercase"
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
