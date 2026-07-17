export type NavItem = {
  href: string;
  label: string;
  primary?: boolean;
};

export type NavSection = {
  label: "Learn" | "Practice" | "Progress" | "Social" | "Account";
  items: NavItem[];
};

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "Learn",
    items: [
      { href: "/dashboard", label: "Learn", primary: true },
      { href: "/path", label: "Path" },
      { href: "/plan", label: "Study plan" },
      { href: "/stories", label: "Stories" },
      { href: "/scenarios", label: "Role-play" },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/practice", label: "Practice", primary: true },
      { href: "/talk", label: "Talk" },
      { href: "/review", label: "Review" },
      { href: "/match", label: "Match" },
      { href: "/gap", label: "Speak gap" },
      { href: "/bank", label: "Word bank" },
    ],
  },
  {
    label: "Progress",
    items: [
      { href: "/report", label: "Report" },
      { href: "/checkpoint", label: "Checkpoint" },
      { href: "/achievements", label: "Badges" },
      { href: "/society", label: "Streak" },
    ],
  },
  {
    label: "Social",
    items: [
      { href: "/friends", label: "Friends" },
      { href: "/club", label: "Club" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/shop", label: "Shop" },
      { href: "/plus", label: "Plus" },
    ],
  },
];

export const NAV_ITEMS = NAV_SECTIONS.flatMap((section) => section.items);

export function navActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function primaryNav() {
  return NAV_ITEMS.filter((item) => item.primary);
}

export function moreNavSections() {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.primary),
  })).filter((section) => section.items.length > 0);
}
