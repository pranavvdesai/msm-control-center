const TAB_ROUTES: Array<{ prefix: string; tab: string }> = [
  { prefix: "/dashboard", tab: "Home" },
  { prefix: "/about", tab: "About" },
  { prefix: "/leave", tab: "Leave" },
  { prefix: "/timetable", tab: "Timetable" },
  { prefix: "/cake-radar", tab: "Cake Radar" },
  { prefix: "/games", tab: "Play" },
  { prefix: "/news", tab: "News" },
  { prefix: "/history", tab: "History" },
  { prefix: "/cr-board", tab: "CR Board" },
  { prefix: "/admin/timetable", tab: "Upload TT" },
  { prefix: "/admin", tab: "Admin" },
  { prefix: "/analytics", tab: "Analytics" },
  { prefix: "/onboarding", tab: "Onboarding" },
  { prefix: "/welcome", tab: "Welcome" },
];

const SKIP_PREFIXES = ["/login", "/register", "/logout", "/api"];

export function pathToTab(pathname: string): string | null {
  if (!pathname || SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const sorted = [...TAB_ROUTES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const route of sorted) {
    if (pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)) {
      return route.tab;
    }
  }

  if (pathname === "/") return "Home";
  return "Other";
}

export const TRACKABLE_TABS = [
  "Home",
  "About",
  "Leave",
  "Timetable",
  "Cake Radar",
  "Play",
  "News",
  "History",
  "CR Board",
  "Upload TT",
  "Admin",
  "Analytics",
  "Onboarding",
  "Welcome",
  "Other",
];
