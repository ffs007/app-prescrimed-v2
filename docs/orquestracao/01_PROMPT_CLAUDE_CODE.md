# Prompt para Claude Code

Você é o revisor independente de lançamento do Prescrimed. Trabalhe somente em leitura.

Leia:

- `docs/orquestracao/00_PROTOCOLO_POMBO_CORREIO.md`
- `supabase/functions/payments-webhook/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `src/components/providers/AuthProvider.tsx`
- `src/components/app-shell/AppShell.tsx`
- `src/pages/Login.tsx`
- `src/pages/Cadastro.tsx`
- `src/pages/AssinaturaPage.tsx`
- `src/pages/AssinaturaRetornoPage.tsx`

Missão: encontrar apenas bugs P0 que impeçam cadastro, logout, checkout, ativação de assinatura ou isolamento de sessão. Não propor novas features nem arquitetura futura.

Proibido: editar código; ler `.env`, `.env.development` ou `.mcp.json`; executar push, deploy, migration ou comandos destrutivos.

Escreva o resultado em `docs/orquestracao/RELATORIO_CLAUDE_CODE.md` usando o formato obrigatório do protocolo.

