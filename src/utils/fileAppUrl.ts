export function fileAppUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_APP_API_URL;
  return `${base}${path}`;
}