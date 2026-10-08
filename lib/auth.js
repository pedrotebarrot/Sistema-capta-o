import { timingSafeEqual } from "node:crypto";

// Senha única do time, enviada pelo app no header x-team-key.
export function authorized(req) {
  const expected = process.env.TEAM_PASSWORD || "";
  const given = String(req.headers["x-team-key"] || "");
  if (!expected) return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function guard(req, res) {
  if (authorized(req)) return true;
  res.status(401).json({ error: "Senha do time inválida." });
  return false;
}
