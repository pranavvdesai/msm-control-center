export function cronAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export function cronUnauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
