import { guard } from "../lib/auth.js";
import { sb, toEvent, toRow } from "../lib/db.js";

const COLS = "id,title,client,date,location,type,drive_url,notes,plan,checks,custom,created_by,created_at,updated_at";

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  const id = req.query.id;
  try {
    if (req.method === "GET") {
      const { data, error } = await sb.from("events").select(COLS).order("date", { ascending: true });
      if (error) throw error;
      return res.status(200).json({ events: data.map(toEvent) });
    }
    if (req.method === "POST") {
      const row = toRow(req.body || {});
      if (!row.title || !row.client) return res.status(400).json({ error: "Evento e cliente são obrigatórios." });
      const { data, error } = await sb.from("events").insert(row).select(COLS).single();
      if (error) throw error;
      return res.status(201).json({ event: toEvent(data) });
    }
    if (req.method === "PATCH" && id) {
      const row = { ...toRow(req.body || {}), updated_at: new Date().toISOString() };
      const { data, error } = await sb.from("events").update(row).eq("id", id).select(COLS).single();
      if (error) throw error;
      return res.status(200).json({ event: toEvent(data) });
    }
    if (req.method === "DELETE" && id) {
      const { error } = await sb.from("events").delete().eq("id", id);
      if (error) throw error;
      return res.status(204).end();
    }
    res.status(405).json({ error: "Método não permitido." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro no banco de dados." });
  }
}
