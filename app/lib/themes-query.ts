export function themeQuery(request: Request) {
  const params = new URL(request.url).searchParams;
  const touchpoint = Number(params.get("touchpoint") ?? 14);
  const month = params.get("month");
  if (!Number.isInteger(touchpoint) || (month !== null && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month))) return null;
  return { touchpoint, month: month && `${month}-01`, team: params.get("team") };
}
