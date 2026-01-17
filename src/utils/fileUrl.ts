export function fileUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = import.meta.env.VITE_ADMIN_API_URL;
  return `${base}${path}`;
}