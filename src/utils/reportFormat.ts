export function formatMoneyFromCents(priceCents: number) {
  const v = priceCents / 100;
  return v.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + "$";
}

export function formatSecondsToMMSS(sec: number | null) {
  if (sec == null) return "-";
  const s = Math.max(0, Math.round(sec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m ${ss}s`;
}
