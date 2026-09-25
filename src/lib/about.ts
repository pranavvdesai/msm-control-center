export type AboutPhoto = {
  src: string;
  alt: string;
  caption: string;
  featured?: boolean;
};

export const ABOUT_GALLERY: AboutPhoto[] = [
  {
    src: "/images/about/class-tapmi-jerseys.jpg",
    alt: "MSM cohort in team jerseys at TAPMI",
    caption: "The Kootlers — full cohort in jersey, steps of TAPMI Manipal.",
    featured: true,
  },
  {
    src: "/images/about/cricket-team.jpg",
    alt: "Kootlers cricket team with banner",
    caption: "कूटLERS on the field — Be the best among the rest.",
  },
  {
    src: "/images/about/cricket-champions.jpg",
    alt: "Cricket champions on stage",
    caption: "Cricket Champions — trophy night at TAPMI.",
  },
  {
    src: "/images/about/basketball-night.jpg",
    alt: "Kootlers basketball team at night",
    caption: "Late-night court sessions — MSM never clocks out.",
  },
  {
    src: "/images/about/basketball-squad.jpg",
    alt: "Kootlers basketball squad",
    caption: "The squad that turns every set into a story.",
  },
];

export const ABOUT_GIRLIE_SQUAD: AboutPhoto[] = [
  {
    src: "/images/about/volleyball-team.jpg",
    alt: "MSM girlie squad volleyball team",
    caption: "Court queens — jerseys on, game face stronger.",
    featured: true,
  },
  {
    src: "/images/about/cohort-night.jpg",
    alt: "MSM girlie squad at night",
    caption: "Birthdays, cake on the face, and zero regrets.",
  },
  {
    src: "/images/about/cohort-indoor.jpg",
    alt: "MSM girlie squad indoors",
    caption: "Between lectures and life — the squad that shows up.",
  },
];

export const ABOUT_HIGHLIGHTS = [
  { label: "Cohort strength", value: "59" },
  { label: "Program", value: "MBA-MKT" },
  { label: "Batch", value: "2025–27" },
  { label: "Term", value: "Term 5" },
] as const;
