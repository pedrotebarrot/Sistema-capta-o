import { GoogleGenAI } from "@google/genai";
import { guard } from "../lib/auth.js";

// Gemini lê GEMINI_API_KEY do ambiente da Vercel.
const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

const str = { type: "string" };
const list = { type: "array", items: str };
const PLAN_SCHEMA = {
  type: "object",
  properties: {
    cliente: str, evento: str,
    data: { type: "string", description: "AAAA-MM-DD ou vazio" },
    local: str,
    formato: { type: "string", description: "vertical 9:16, horizontal 16:9, ambos, ou vazio" },
    resumo: str,
    cenas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titulo: str, descricao: str,
          momento: { type: "string", enum: ["antes", "durante", "depois"] },
          prioridade: { type: "string", enum: ["obrigatoria", "desejavel"] },
          quem: str, perguntas: list,
        },
        required: ["titulo", "descricao", "momento", "prioridade", "quem", "perguntas"],
      },
    },
    equipamentos: {
      type: "array",
      items: { type: "object", properties: { item: str, qtd: { type: "integer" } }, required: ["item", "qtd"] },
    },
    pre: list, durante: list, pos: list, alertas: list,
  },
  required: ["cliente", "evento", "data", "local", "formato", "resumo", "cenas", "equipamentos", "pre", "durante", "pos", "alertas"],
};

function prompt(tipo, generic) {
  return `Você coordena captações audiovisuais feitas com celular (nível intermediário, storymaker) em uma agência de marketing. Leia o roteiro do evento e gere o checklist específico deste evento.

Já existe um checklist técnico padrão (lista abaixo). Não repita esses itens: inclua só o que é específico deste evento.

- "cenas": em ordem cronológica. Depoimentos são cenas com "perguntas" (3 a 5 perguntas abertas; use as do roteiro quando houver). "descricao" diz o que gravar e com quais planos.
- "equipamentos": o que o roteiro pedir; se não pedir, o mínimo para as cenas (ex.: 2 depoimentos em paralelo = 2 tripés). Inclua kit lapela quando houver fala.
- "pre", "durante", "pos": ações curtas no imperativo, específicas deste evento (horário de chegada, contato no local, quem assina termo de imagem, o que não pode aparecer, itens de marca). No máximo 8 em cada.
- "alertas": informações que faltam no roteiro ou riscos (ex.: sem horário de chegada, sem contato no local). No máximo 5.
- Campos sem informação ficam como string vazia.
- Se o roteiro estiver incompleto, complete o mínimo razoável para um evento do tipo "${tipo}".
- Português do Brasil.

Checklist padrão (não repetir):
${generic.map((g) => "- " + g).join("\n")}`;
}

export default async function handler(req, res) {
  if (!guard(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: "A chave da IA não está configurada na Vercel." });

  const { text = "", pdf = "", tipo = "Outro", generic = [] } = req.body || {};
  if (!text.trim() && !pdf) return res.status(400).json({ error: "Envie o roteiro em PDF ou em texto." });

  const parts = [];
  if (pdf) parts.push({ inlineData: { mimeType: "application/pdf", data: pdf } });
  parts.push({
    text: prompt(String(tipo), Array.isArray(generic) ? generic.map(String) : []) +
      (text.trim() ? `\n\nRoteiro:\n"""\n${text}\n"""` : "\n\nO roteiro está no PDF anexado."),
  });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: { responseMimeType: "application/json", responseJsonSchema: PLAN_SCHEMA },
    });
    let plan;
    try { plan = JSON.parse(r.text || ""); } catch { return res.status(502).json({ error: "A IA respondeu fora do formato. Tente de novo." }); }
    res.status(200).json({ plan: { fonte: "roteiro", ...plan } });
  } catch (e) {
    console.error(e);
    const status = e?.status || e?.code;
    if (status === 429) return res.status(429).json({ error: "Muitos pedidos à IA agora. Espere um minuto e tente de novo." });
    if (status === 400) return res.status(400).json({ error: "O arquivo não pôde ser lido pela IA. Tente colar o texto do roteiro." });
    res.status(502).json({ error: "A IA está indisponível agora. Tente de novo em instantes." });
  }
}
