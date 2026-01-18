export function formatMoneyFromCents(priceCents: number) {
  const v = Math.round(priceCents / 100);
  return v.toLocaleString("vi-VN") + "$";
}

export function formatSecondsToMMSS(sec: number | null) {
  if (sec == null) return "-";
  const s = Math.max(0, Math.round(sec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m ${ss}s`;
}
