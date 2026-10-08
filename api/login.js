import { guard } from "../lib/auth.js";

export default function handler(req, res) {
  if (!guard(req, res)) return;
  res.status(200).json({ ok: true });
}
