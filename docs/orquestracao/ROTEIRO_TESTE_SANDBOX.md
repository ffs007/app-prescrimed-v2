# Roteiro de teste — sandbox (cadastro → checkout → webhook → `subscriptions`)

Pré-requisitos:

- Os patches P0-1, P0-2 e P1 estão aplicados, e as functions `create-checkout` e `payments-webhook` foram publicadas no ambiente de preview.
- O frontend está em modo sandbox: o token público de pagamentos com prefixo de teste leva `src/lib/stripe.ts` a resolver `sandbox`.
- Há duas janelas do mesmo navegador, sem aba anônima, para reproduzir o PC compartilhado.
- Use e-mails novos a cada rodada: `teste+a1@...` e `teste+b1@...`.

Critério global: todos os passos em **PASSA**. Qualquer **FALHA** bloqueia o deploy.

---

## Bloco A — Cadastro

| # | Ação | Esperado | Onde olhar |
|---|------|----------|------------|
| A1 | Abrir `/cadastro?plan=pro_monthly` e criar a conta A (senha ≥ 8 caracteres) | **Confirmação de e-mail DESLIGADA:** vai para `/app/assinatura?plan=pro_monthly` e o checkout abre sozinho. **LIGADA:** aparece o toast "Enviamos um link de confirmação…" e você fica em `/cadastro` | Tela e toast |
| A2 | Só se a confirmação estiver ligada: abrir o link do e-mail | Chega em `/app/assinatura?plan=pro_monthly` já logado | Tela |
| A3 | SQL: `select id, email, email_confirmed_at from auth.users where email = '<A>';` | 1 linha. `email_confirmed_at` preenchido no fluxo sem confirmação, ou depois de A2 | Lovable Cloud → SQL |

> **A1 também é o teste de configuração do e-mail.** Se o toast de confirmação aparecer, a confirmação está ligada. Decida no produto se o beta roda assim ou com auto-confirm.

## Bloco B — Checkout (P0-2)

| # | Ação | Esperado | Onde olhar |
|---|------|----------|------------|
| B1 | O checkout embutido carrega | O formulário do Stripe aparece. Nenhum evento `checkout_erro`. `create-checkout` responde 200 com `clientSecret` | DevTools → Network e logs da function |
| B2 | Se B1 falhar | Copiar a mensagem do erro 400 **sem** colar chaves. Se mencionar `automatic_tax`/endereço, a correção não chegou ao deploy. Se mencionar "Stripe Tax isn't supported", definir o secret `STRIPE_AUTOMATIC_TAX=false` e repetir | Logs de `create-checkout` |
| B3 | Conferir o preço | Plano mensal com o desconto promocional (cupom `prescrimed_promo_3m`) | Tela do checkout |
| B4 | Pagar com cartão `4242 4242 4242 4242`, validade futura, CVC qualquer; endereço, se o Stripe pedir | Redireciona para `/app/assinatura/retorno?session_id=cs_test_…` | URL |

## Bloco C — Webhook e ativação

| # | Ação | Esperado | Onde olhar |
|---|------|----------|------------|
| C1 | Logs de `payments-webhook` | `customer.subscription.created` com HTTP 200 e sem "Webhook with invalid env" | Logs da function |
| C2 | SQL: `select user_id, status, price_id, environment, current_period_end from public.subscriptions where user_id = '<id de A>' order by created_at desc;` | 1 linha, `status = 'active'` (ou `trialing`), `environment = 'sandbox'`, `current_period_end` no futuro | Lovable Cloud → SQL |
| C3 | Tela de retorno | "Assinatura confirmada". Se ficar em "Pagamento em confirmação", recarregar **uma vez**: tem que virar confirmada (sem Realtime na tabela, isso é esperado) | Tela |
| C4 | Voltar a `/app/assinatura?plan=pro_monthly` com A já ativo | **Registrar:** hoje o checkout ainda abre (item de corte P1, fora destes patches). **Não pagar de novo** | Tela |

## Bloco D — Isolamento de sessão (P0-1)

| # | Ação | Esperado | Onde olhar |
|---|------|----------|------------|
| D1 | Com A: emitir 1 prescrição, salvar rascunho de AIH, preencher dados da clínica/assinatura | Os dados aparecem para A | Tela |
| D2 | DevTools → Application → Local Storage | Existem chaves `prescrimed-*`, `clinic-info` e `prescrimed:session-owner` = id de A | DevTools |
| D3 | Clicar **Sair** | Vai para `/login`. No Local Storage não sobra nenhuma chave `prescrimed*` exceto `prescrimed:install-banner-dismissed`, nem `clinic-info`, `signature-config`, `custom-*`, `protocolo-sessao:*` ou `protocolos_recentes` | DevTools |
| D4 | Entrar com a conta B na mesma aba | Prescrições emitidas, rascunhos, clínica e assinatura **vazios**. Nenhum dado de A | Tela |
| D5 | Sessão órfã, sem logout. Logar A e criar rascunho. No DevTools, apagar **só** a chave `sb-*-auth-token`, recarregar e entrar com B | Sem dado de A: `prescrimed:session-owner` ≠ B, então `ensureLocalDataOwner` limpa tudo antes de renderizar | Tela e DevTools |
| D6 | Logar A de novo | A também começa limpo. **Efeito colateral aceito:** dados só locais somem no logout | Tela |

## Bloco E — Cancelamento (sanidade)

| # | Ação | Esperado |
|---|------|----------|
| E1 | Em `/app/assinatura`, abrir o portal e cancelar | Webhook `customer.subscription.updated`/`deleted` com 200. Linha com `cancel_at_period_end = true` ou `status = 'canceled'` |
| E2 | O app continua liberado até `current_period_end` | `isSubscriptionActive` mantém o acesso enquanto o período não termina |

---

**Registrar o resultado** em `RELATORIO_*` como tabela `#passo | PASSA/FALHA | evidência`, sem colar chaves, tokens ou `client_secret`.
