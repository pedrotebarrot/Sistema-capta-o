import { guard } from "../lib/auth.js";
import { sb } from "../lib/db.js";

// Marca/desmarca itens. Aceita uma lista para enviar de uma vez as marcações feitas sem internet.
// Cada item é gravado de forma atômica (set_check), então duas pessoas marcando ao mesmo tempo não se sobrescrevem.
export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  const ops = Array.isArray(req.body?.ops) ? req.body.ops.slice(0, 200) : [];
  try {
    for (const op of ops) {
      if (!op?.id || !op?.item) continue;
      const { error } = await sb.rpc("captacao_set_check", { p_id: op.id, p_item: String(op.item), p_val: op.val ?? { v: false } });
      if (error) throw error;
    }
    res.status(200).json({ ok: true, saved: ops.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Não foi possível salvar as marcações." });
  }
}
