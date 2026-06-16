/** Subjects excluded from attendance tracking and class lists (not real credit courses). */
export function isExcludedSubject(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("internship") || n.includes("viva");
}
