# Relatório — Claude Code (rodada 2: patches para o Codex)

Escopo:

- Nenhum arquivo de código foi editado. Os patches estão em `docs/orquestracao/patches/` para o Codex revisar e aplicar.
- Não li `.env`, `.env.development` nem `.mcp.json`.
- Não houve push, deploy nem migration.

## Veredito
**GO beta controlado depois de aplicar P0-1 + P0-2 e o roteiro `ROTEIRO_TESTE_SANDBOX.md` passar inteiro.**

Até lá: **NO-GO**.

## P0 comprovados
- **[P0-1] `src/components/providers/AuthProvider.tsx:25-28, 31-34, 68-71`**
  - Problema: o cache do React Query e o localStorage do app sobrevivem ao logout e à troca de usuário.
  - Impacto: vazamento de dado clínico em PC compartilhado.
  - **Patch:** `patches/P0-1_isolamento_sessao.patch`
    - Novo `src/lib/sessionCleanup.ts`:
      - `clearLocalAppData()` remove as chaves do app: prefixos `prescrimed*` e `protocolo-sessao:`, mais `protocolos_recentes`, `clinic-info`, `signature-config`, `custom-medications` e `custom-templates`.
      - Preserva `sb-*` (Supabase Auth) e `prescrimed:install-banner-dismissed`.
      - `ensureLocalDataOwner(userId)` grava o dono em `prescrimed:session-owner` e limpa tudo quando o dono é outro.
    - Em `AuthProvider`:
      - Em `SIGNED_OUT`: `queryClient.clear()` + `clearLocalAppData()`.
      - Em qualquer sessão com usuário (listener e `getSession`): `ensureLocalDataOwner`, e `queryClient.clear()` se o dono mudou.
      - `signOut` limpa em `finally`, mesmo se o signOut remoto falhar.
  - **Validação feita:**
    - `git apply --check` OK.
    - `tsc -p tsconfig.app.json --noEmit` sem erro nos arquivos tocados. Há 5 erros **pré-existentes** em arquivos não tocados: `PatientProfileFields.tsx:33`, `clinicalLinks.ts:298`, `PrintArea.tsx:207`, `Dashboard.tsx:569` e `:713`.
    - Teste de unidade com localStorage simulado: limpa as chaves certas, preserva `sb-*` e a chave do banner, e não limpa quando o dono é o mesmo.
  - **Chaves mapeadas:** `useAihWorkbench.ts:16-17`, `smartFill.ts:13-14`, `useNotificationWorkbench.ts:17-20`, `useEmissionHistory.ts:14`, `safetyLog.ts:10`, `quickAccess.ts:56`, `useUnifiedSearch.ts:13-14`, `useDocumentBranding.ts:6`, `usePathologyMemory.ts:18-21`, `useRequirementsSurvey.ts:5`, `clinicalSuggestions.ts:583`, `useProtocolSearch.ts:5`, `protocoloAudit.ts:9`, `Dashboard.tsx:124-127`.
  - **Efeito colateral assumido:** dados só locais (clínica, assinatura, medicamentos e modelos custom, favoritos) somem no logout. Na primeira carga depois do deploy também há uma limpeza única, porque ainda não existe dono registrado. A alternativa sem perda seria namespacing por userId, que é refatoração e fica fora de P0.
- **[P0-2] `supabase/functions/create-checkout/index.ts:105-118`**
  - Problema: `automatic_tax` ligado com `customer` sem endereço e sem `customer_update`. O Stripe rejeita a criação da sessão, então ninguém consegue assinar.
  - **Patch:** `patches/P0-2_checkout_automatic_tax.patch`
    - Adiciona `customer_update: { address: "auto" }` quando há customer e o imposto automático está ligado.
    - Novo secret opcional `STRIPE_AUTOMATIC_TAX`: por padrão o comportamento atual é mantido; com `false`, desliga o imposto automático.
  - `git apply --check` OK. Não compilei com Deno (não há Deno no ambiente de revisão). A mudança é só de objeto literal.

## Verificação de configuração (item 4)
- **Imposto automático no Stripe: INCONCLUSIVO para a conta do app, com um alerta.**
  - A conta Stripe acessível pelo conector (sandbox da "ffs medical servicos medicos") respondeu a `GET /v1/tax/settings` com **"Stripe Tax isn't yet supported for your country"**.
  - Essa conta **não** tem preços `pro_monthly`/`pro_yearly`. Portanto **não é** a conta usada pelo app, que passa pelo gateway do Lovable.
  - **Risco:** se o live for ligado numa conta brasileira, `automatic_tax: true` quebra o checkout mesmo com o patch. Nesse caso, definir `STRIPE_AUTOMATIC_TAX=false`.
  - Stripe Tax não calcula tributo brasileiro (ISS/NF-e), então para venda em BRL o imposto automático provavelmente não agrega nada. **Decisão do Codex/Felipe.**
- **Confirmação de e-mail no Auth: NÃO VERIFICÁVEL daqui.**
  - O projeto está no Lovable Cloud e não aparece nos conectores Supabase/Lovable desta sessão.
  - `supabase/config.toml` não tem bloco `[auth]`.
  - O passo A1 do roteiro resolve isso empiricamente.
  - **Mitigação independente da configuração:** `patches/P1_cadastro_confirmacao_email.patch` (`Cadastro.tsx:36-52`). Sem sessão depois do `signUp`, mostra "Enviamos um link de confirmação…" em vez de redirecionar para `/login` sem explicação. `git apply --check` e `tsc` OK.

## Cortar do lançamento
- **Checkout automático via `?plan=` para quem já assina** (`AssinaturaPage.tsx:25-30`, `:150-164`): **não** foi incluído nos patches. É P1. Correção de uma condição: só setar `checkoutPlan` quando `!loading && !isActive`.
- **Realtime em `subscriptions`:** nenhuma migration adiciona a tabela à publicação. A página de retorno exige recarregar. O roteiro C3 aceita isso. Fora de P0.

## Teste decisivo
- `docs/orquestracao/ROTEIRO_TESTE_SANDBOX.md`, blocos A–E.
- Mínimo para liberar: **A1, B1, B4, C1, C2, D3, D4, D5** em PASSA.

## Próxima ação única
- O Codex aplica, em ordem:
  ```
  git apply docs/orquestracao/patches/P0-1_isolamento_sessao.patch
  git apply docs/orquestracao/patches/P0-2_checkout_automatic_tax.patch
  git apply docs/orquestracao/patches/P1_cadastro_confirmacao_email.patch
  ```
- Um commit por patch em `fix/monetization-baseline`.
- Publicar as functions no preview e rodar o roteiro sandbox.
