export type LeaveType = "REGULAR" | "CONDONED" | "LATE";

export const LEAVE_TYPES: LeaveType[] = ["REGULAR", "CONDONED", "LATE"];

export function isLeaveType(value: string): value is LeaveType {
  return LEAVE_TYPES.includes(value as LeaveType);
}

export function countLeavesByType(leaves: Array<{ type: string }>) {
  return {
    regularAbsences: leaves.filter((l) => l.type === "REGULAR").length,
    condonedLeaves: leaves.filter((l) => l.type === "CONDONED").length,
    lateMarks: leaves.filter((l) => l.type === "LATE").length,
  };
}

export function effectiveAbsencesFromCounts(regularAbsences: number, _lateMarks = 0) {
  return regularAbsences;
}

export function leaveTypeLabel(type: LeaveType) {
  switch (type) {
    case "REGULAR":
      return "Regular absence";
    case "CONDONED":
      return "Condoned leave";
    case "LATE":
      return "Late";
  }
}

export function leaveTypeShortLabel(type: LeaveType) {
  switch (type) {
    case "REGULAR":
      return "Regular";
    case "CONDONED":
      return "Condoned";
    case "LATE":
      return "Late";
  }
}

export function leaveTypeBadgeClass(type: LeaveType) {
  switch (type) {
    case "REGULAR":
      return "bg-red-100 text-red-700";
    case "CONDONED":
      return "bg-violet-100 text-violet-700";
    case "LATE":
      return "bg-amber-100 text-amber-800";
  }
}
