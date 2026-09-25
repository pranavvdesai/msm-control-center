import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sessionIsRamAdmin } from "@/lib/permissions";
import { loadAdminOpsDashboard } from "@/lib/ops/load-dashboard";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !(await sessionIsRamAdmin(session))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const istDate = url.searchParams.get("date") || undefined;
    const dashboard = await loadAdminOpsDashboard(istDate);

    return NextResponse.json(dashboard);
  } catch (err) {
    console.error("admin ops dashboard error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load today's tasks" },
      { status: 500 }
    );
  }
}
