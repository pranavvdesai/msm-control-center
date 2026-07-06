import { maxLeavesForCredits } from "./utils";
import { effectiveAbsencesFromCounts } from "./leaves";

type SubjectStats = {
  subjectName: string;
  credits: number;
  regularAbsences: number;
  condonedLeaves: number;
  lateMarks: number;
  maxLeaves: number;
  effectiveLeaves: number;
  remainingLeaves: number;
};

const WARNING_MESSAGES = [
  "Warning. One more leave and your GPA enters danger zone.",
  "Faculty has started noticing your disappearance patterns.",
  "This is your final life. Use wisely.",
  "Attendance radar is blinking red. Proceed with caution.",
  "One slip away from Subgrade Mode activation.",
];

const CRITICAL_MESSAGES = [
  "Congratulations. You have unlocked Subgrade Mode.",
  "Beta… ek aur leave liya toh problem hoga.",
  "Faculty suspicion level: MAXIMUM.",
  "Your attendance graph looks like a cliff dive.",
];

const MEME_SAFE = [
  "All is well. Attendance under control.",
  "Mast hai! Attendance looking solid.",
  "Faculty still thinks you're the good kid.",
];

const MEME_WARNING = [
  "Ek aur leave… picture abhi baaki hai.",
  "Thoda sa careful rehna, warna scene badal jayega.",
  "Attendance meter: yellow zone. Drive safely.",
];

export function buildSubjectStats(
  subjectName: string,
  credits: number,
  regularAbsences: number,
  condonedLeaves: number,
  lateMarks = 0
): SubjectStats {
  const maxLeaves = maxLeavesForCredits(credits);
  const effectiveLeaves = effectiveAbsencesFromCounts(regularAbsences, lateMarks);
  const remainingLeaves = Math.max(0, maxLeaves - effectiveLeaves);

  return {
    subjectName,
    credits,
    regularAbsences,
    condonedLeaves,
    lateMarks,
    maxLeaves,
    effectiveLeaves,
    remainingLeaves,
  };
}

export function getSubjectAlert(stats: SubjectStats) {
  const usedRatio = stats.effectiveLeaves / stats.maxLeaves;

  if (stats.remainingLeaves === 0) {
    return {
      level: "critical" as const,
      message: pickRandom(CRITICAL_MESSAGES),
    };
  }

  if (stats.remainingLeaves === 1) {
    return {
      level: "warning" as const,
      message: pickRandom(WARNING_MESSAGES),
    };
  }

  if (usedRatio >= 0.5) {
    return {
      level: "caution" as const,
      message: pickRandom(MEME_WARNING),
    };
  }

  return {
    level: "safe" as const,
    message: pickRandom(MEME_SAFE),
  };
}

export function generateSocialFeedMessages(
  events: Array<{ message: string; createdAt: Date }>
) {
  return events;
}

export function buildLoginFeedMessage(name: string) {
  const templates = [
    `${name} just entered the MSM Control Center.`,
    `${name} logged in. Attendance anxiety levels recalibrating.`,
    `Welcome back, ${name}. Faculty hasn't noticed yet. Probably.`,
  ];
  return pickRandom(templates);
}

export function buildLeaveFeedMessage(
  studentName: string,
  subjectName: string,
  type: "REGULAR" | "CONDONED" | "LATE"
) {
  if (type === "CONDONED") {
    return `${studentName} marked a condoned leave in ${subjectName}. Looks like life happened.`;
  }
  if (type === "LATE") {
    return `${studentName} marked late in ${subjectName}. Faculty noted the entrance drama.`;
  }
  return `${studentName} took a regular absence in ${subjectName}. The plot thickens.`;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function buildClassmateAlert(
  classmateName: string,
  subjectName: string,
  leavesTaken: number,
  maxLeaves: number
) {
  if (leavesTaken >= maxLeaves - 1 && maxLeaves > 1) {
    return `${classmateName} has already taken ${leavesTaken} leaves in ${subjectName}. Please tell them academics still exist.`;
  }
  if (leavesTaken >= maxLeaves) {
    return `${classmateName} is living dangerously in ${subjectName}. Subgrade vibes detected.`;
  }
  return `${classmateName} marked activity in ${subjectName}. Social feed updated.`;
}
