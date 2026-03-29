/** Relative time in the past, e.g. "3 days ago". */
export function timeAgo(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const divisions: [number, Intl.RelativeTimeFormatUnit][] = [
    [31536000, "year"],
    [2592000, "month"],
    [604800, "week"],
    [86400, "day"],
    [3600, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  for (const [unitSeconds, unit] of divisions) {
    const value = Math.floor(seconds / unitSeconds);
    if (value >= 1) return rtf.format(-value, unit);
  }
  return rtf.format(0, "second");
}
