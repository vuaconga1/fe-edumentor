// src/utils/avatar.js

// Normalize avatar URL từ backend (absolute / relative / rác)
export function normalizeAvatarUrl(url) {
  if (!url) return null;

  const s = String(url).trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  if (lower === "null" || lower === "undefined" || lower === "none") return null;

  // data uri
  if (s.startsWith("data:image/")) return s;

  // absolute url
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // relative path -> prefix API base
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  if (!apiBase) return s;

  if (s.startsWith("/")) return `${apiBase}${s}`;
  return `${apiBase}/${s}`;
}

// Normalize file URL (similar to avatar but for any file)
export function normalizeFileUrl(url) {
  if (!url) return null;

  const s = String(url).trim();
  if (!s) return null;

  // absolute url
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  // blob url
  if (s.startsWith("blob:")) return s;

  // relative path -> prefix API base
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
  if (!apiBase) return s;

  if (s.startsWith("/")) return `${apiBase}${s}`;
  return `${apiBase}/${s}`;
}

// Palette màu đẹp để nhìn "random" nhưng không xấu
const PALETTE = [
  "1abc9c", "2ecc71", "3498db", "9b59b6", "e67e22",
  "e74c3c", "f1c40f", "16a085", "27ae60", "2980b9",
  "8e44ad", "d35400", "c0392b", "7f8c8d", "2c3e50",
  "00bcd4", "ff5722", "3f51b5", "795548", "607d8b"
];

// Hash string -> số nguyên ổn định
function hashInt(seed) {
  let hash = 0;
  const str = String(seed || "user");
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Build avatar mặc định: cùng user -> cùng màu, khác user -> khác màu
export function buildDefaultAvatarUrl({ id, email, fullName }) {
  const seed = id || email || fullName || "user";
  const idx = hashInt(seed) % PALETTE.length;
  const bg = PALETTE[idx];
  const name = fullName || email || "User";

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${bg}&color=fff&bold=true`;
}
