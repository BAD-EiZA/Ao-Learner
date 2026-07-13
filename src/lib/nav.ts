/** Shared nav model — primary bar vs overflow menu */

export type NavItem = {
  href: string;
  label: string;
  /** Show on desktop bar (md+) */
  primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Learn", primary: true },
  { href: "/path", label: "Path", primary: true },
  { href: "/practice", label: "Practice", primary: true },
  { href: "/review", label: "Review", primary: true },
  { href: "/talk", label: "Talk", primary: true },
  { href: "/plan", label: "Plan" },
  { href: "/match", label: "Match" },
  { href: "/shop", label: "Shop" },
  { href: "/stories", label: "Stories" },
  { href: "/scenarios", label: "Role-play" },
  { href: "/report", label: "Report" },
  { href: "/gap", label: "Speak gap" },
  { href: "/bank", label: "Word bank" },
  { href: "/checkpoint", label: "Checkpoint" },
  { href: "/society", label: "Streak" },
  { href: "/friends", label: "Friends" },
  { href: "/club", label: "Club" },
  { href: "/achievements", label: "Badges" },
  { href: "/plus", label: "Plus" },
];

export function navActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function primaryNav() {
  return NAV_ITEMS.filter((i) => i.primary);
}

export function moreNav() {
  return NAV_ITEMS.filter((i) => !i.primary);
}
