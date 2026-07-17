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
    <header className="sticky top-0 z-40 border-b-3 border-neo-ink bg-neo-yellow pt-[env(safe-area-inset-top)] text-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:h-14 sm:gap-3 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border-2 border-neo-ink bg-neo-white py-1.5 pl-1 pr-2.5 text-sm font-black tracking-tight !text-neo-ink shadow-[2px_2px_0_#1B4EF5]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-neo-primary text-xs font-black text-neo-white">
            AO
          </span>
          <span className="hidden sm:inline">Learner</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2">
          {authed && user ? (
            <>
              <NavClientLinks authed />
              <UserMenu
                name={name}
                email={user.email}
                picture={user.picture}
              />
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <LoginLink
                postLoginRedirectURL="/dashboard"
                className="hidden rounded-lg border-2 border-neo-ink bg-neo-white px-3 py-1.5 text-xs font-black uppercase !text-neo-ink sm:inline-flex"
              >
                Log in
              </LoginLink>
              <RegisterLink
                postLoginRedirectURL="/dashboard"
                className="inline-flex rounded-lg border-2 border-neo-ink bg-neo-ink px-3 py-1.5 text-xs font-black uppercase !text-neo-white"
              >
                Sign up
              </RegisterLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
