import { createClient } from "@supabase/supabase-js";

export const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Linha do banco (snake_case) -> objeto do app (camelCase)
export function toEvent(r) {
  return {
    id: r.id, title: r.title, client: r.client, date: r.date || "", location: r.location || "",
    type: r.type || "outro", driveUrl: r.drive_url || "", notes: r.notes || "",
    plan: r.plan || {}, checks: r.checks || {}, custom: r.custom || { pre: [], durante: [], pos: [] },
    createdBy: r.created_by || "", createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

// Campos que o app pode gravar -> colunas
const FIELDS = {
  title: "title", client: "client", date: "date", location: "location", type: "type",
  driveUrl: "drive_url", notes: "notes", plan: "plan", checks: "checks", custom: "custom",
  createdBy: "created_by", roteiro: "roteiro",
};
export function toRow(body) {
  const row = {};
  for (const [k, col] of Object.entries(FIELDS)) if (k in body) row[col] = body[k] === "" && k === "date" ? null : body[k];
  return row;
}
