# Captação Dennova

Manual e checklists de captação (pré, durante e pós) com checklist por evento gerado a partir do roteiro.

- `index.html`: o app (manual, eventos, roteiro modelo)
- `api/`: funções da Vercel (eventos, marcações, leitura do roteiro pela IA, login)
- `supabase/schema.sql`: tabela e função do banco

## Colocar no ar

### 1. Banco (Supabase)
SQL Editor › New query › cole o conteúdo de `supabase/schema.sql` › **Run**.

### 2. Deploy (Vercel)
O projeto na Vercel está ligado ao repositório `pedrotebarrot/sistema-capta-o` no GitHub:
cada `git push` na branch `main` publica uma versão nova.

### 3. Variáveis de ambiente
Vercel › projeto › Settings › Environment Variables (marque Production, Preview e Development):

| Nome | Onde pegar |
|---|---|
| `SUPABASE_URL` | Supabase › Project Settings › API › Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase › Project Settings › API › `service_role` (secreta) |
| `GEMINI_API_KEY` | aistudio.google.com › Get API key |
| `TEAM_PASSWORD` | Senha que o time vai digitar para entrar |

Depois de alterar uma variável, faça um Redeploy em Deployments.

## Como funciona
- Cada marcação é salva primeiro no celular e enviada ao servidor em seguida. Sem internet, fica na fila
  (aparece "X alterações aguardando internet" no topo) e sobe sozinha quando a conexão volta.
- A lista atualiza a cada 15 s, então duas pessoas no mesmo evento veem as marcações uma da outra.
- A leitura do roteiro usa o Gemini (`gemini-flash-latest`; dá para trocar com a variável `GEMINI_MODEL`).
  Leva de 20 s a 1 min.
