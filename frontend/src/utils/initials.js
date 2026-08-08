export function getInitials(text) {
  const s = String(text || "").trim();
  if (!s) return "?";
  if (s.includes("@")) return s[0].toUpperCase();
  const clean = s.replace(/^\+/, "");
  const parts = clean.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}
