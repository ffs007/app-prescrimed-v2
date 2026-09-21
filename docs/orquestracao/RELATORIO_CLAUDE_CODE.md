# Relatório — Claude Code

## Atualização 2026-09-21 — Acesso ao Supabase destravado; missão P0 (persistência, logout, RLS curadoria)

Diferente da rodada anterior (abaixo), o acesso ao projeto `zwwalaioamxcvxbihxlr` **está funcionando** (MCP Supabase reconectado nesta sessão). Migrations e deploys pendentes do bloqueio anterior já foram aplicados (passos 0.2/0.3/0.4 do roadmap, ver `RELATORIO_PRESCRIMED_PERFEITO.md`).

### Veredito
**GO beta controlado** para o que esta missão cobria. Os 3 itens de código pedidos foram checados: 2 já estavam corrigidos (rodadas anteriores, 0.7/0.10 e P0-1), 1 tinha bug real de RLS, corrigido agora.

### P0 comprovados
- [`supabase/migrations` — antes desta rodada] RLS de `stg_import_lotes`, `stg_exames`, `stg_patologias`, `stg_patologia_exames`, `curadoria_decisoes` e `etl_promocao_log` (SELECT) exigia `has_role(admin)`. `AdminRoute.tsx:14` libera a rota para `isAdmin OR isReviewer` (`useIVPermissions.ts:9,29,31`) → usuário com papel `revisor` entrava em `/admin/curadoria` e `/admin/promocao-base` e toda leitura/gravação caía em 403 do PostgREST. **Corrigido**: migration `20260921130000_rls_curadoria_revisor.sql`, aplicada em produção — as 5 tabelas passam a aceitar admin OU revisor (mesmo padrão já usado em `base_patologia_exames.base_write_admin_revisor`). A promoção final (`fn_etl_promover_etapa`/`fn_etl_promover_tudo`, chamadas por `PromocaoBasePage.tsx:131,152`) **continua admin-only de propósito** — não mexi nisso, é decisão de segurança (última etapa do pipeline antes de virar produção), não bug. Revisor agora vê o log de ETL mas não dispara promoção.
- [`src/pages/Dashboard.tsx:835-884` `handleEmit`; `src/modules/documents/lib/persistEmission.ts:75-102` `insertEmission`] **Já corrigido em rodada anterior (0.7/0.10), verificado nesta.** Todo clique de imprimir/baixar (`handleEmit`, `handlePrintGroup`, `handleDownloadGroup`, `EmissionActions`/`AihWorkbench`/`NotificationWorkbench` via `persistFormDocument`) chama `persistOrWarn`→`persistEmission`/`persistFormDocument`, que grava em `documentos_gerados` **e** `log_documentos_clinicos` (`documentSave.ts:41-63`, `logDocumentAction`, chamado dentro de `insertEmission`). Se a gravação falha, `persistOrWarn` retorna `null` e a função de origem faz `return` antes do `window.print()` — fail-closed, sem fire-and-forget. Nenhuma alteração necessária.
- [`src/components/providers/AuthProvider.tsx:78-80`; `src/lib/sessionCleanup.ts`] **Já corrigido em rodada anterior (P0-1), verificado nesta.** `signOut()` chama `supabase.auth.signOut()` e `clearLocalAppData()` (limpa todas as chaves `prescrimed*`/`clinic-info`/`signature-config`/etc do `localStorage`, preservando só `prescrimed:install-banner-dismissed`) mesmo se o signOut remoto falhar. `AppShell.tsx:27-32` e `ContextHeader.tsx:32,94-98` (botão "Sair") já chamam esse `signOut` do `useAuth()`. Coberto por `src/test/sessionCleanup.test.ts`. Nenhuma alteração necessária.

### Cortar do lançamento
- Nada novo identificado nesta missão.

### Teste decisivo
- Criar usuário com `role = 'revisor'` (sem `admin`) em `user_roles`; logar; abrir `/admin/curadoria` com um `lote_id` existente em `stg_import_lotes`. Esperado: lista carrega, decisões em `curadoria_decisoes` salvam, RPCs `promover_stg_*`/`aprovar_lote` executam (essas já eram admin-OU-service, não mudaram). Em `/admin/promocao-base`: página abre e mostra o log (`etl_promocao_log`), mas clicar em "Promover" deve devolver a exceção `"Apenas administradores podem executar a promoção de dados"` — comportamento esperado, não é 403 do PostgREST.

### Próxima ação única
Rodar o teste decisivo acima com um usuário `revisor` real antes de liberar a curadoria para quem não é `admin`.

---

Escopo original: revisão somente leitura (P0 de cadastro, logout, checkout, ativação de assinatura e isolamento de sessão).
Esta versão (2026-09-20) consolida o que mudou depois das correções, cruzando os relatórios do Trae e do ZCode. Cada achado foi conferido no código atual da branch `fix/monetization-baseline`. Nada foi commitado.

## Veredito atualizado
**GO beta controlado, condicionado** a três itens que o código não resolve sozinho:

1. Aplicar e testar as 4 migrations (`20260919120000` a `20260919120300`) e fazer o deploy das edge functions alteradas. Ver "Bloqueios".
2. Carregar o lote mínimo de conteúdo clínico em produção (ZCode: `base_patologias_ref` = 0 linhas).
3. Rodar em sandbox os testes decisivos T1 a T3 abaixo.

**Ainda NO-GO para lançamento aberto**: nenhum fluxo de tela foi exercitado por mim (exige login), e o checkout nunca foi rodado em sandbox real.

## Validação executada
- `tsc --noEmit`: sem erros.
- `vitest run`: 15 arquivos, 234 testes, 0 falhas (eram 202 no relatório do Trae e 210 no do ZCode).
- `npm run build`: OK.
- Não testado em runtime: fluxos autenticados, migrations no banco, edge functions, checkout Stripe.

## Situação de cada achado

### Meus achados originais
| Achado | Situação | Evidência |
|---|---|---|
| P0-1 Isolamento de sessão no logout | **Corrigido** | `AuthProvider.tsx:68-79`: `signOut` faz `queryClient.clear()` e `clearLocalAppData()` mesmo se o signOut remoto falhar. |
| P0-2 Checkout com `automatic_tax` sem endereço | **Corrigido no código, sem teste em sandbox** | `create-checkout/index.ts:113-115`: `customer_update: { address: "auto" }` quando há customer e `automatic_tax`. Precisa de deploy e do teste T2. |
| Auto-abertura do checkout via `?plan=` | **Corrigido** | `AssinaturaPage.tsx:26-35` e `:155`: só abre com `!loading && !isActive`. |
| Realtime de `subscriptions` | **Pendente (não P0)** | Nenhuma migration adiciona a tabela à publicação `supabase_realtime`. A ativação funciona pelo webhook; a tela de retorno depende de refetch. |
| Cadastro com confirmação de e-mail | **Mensagem corrigida; configuração pendente** | `Cadastro.tsx:50-53` avisa que o link foi enviado quando não há sessão. Decidir no painel do Auth se a confirmação fica ligada no beta. |

### Achados do Trae
| Achado | Situação | Evidência |
|---|---|---|
| SignUp sem sessão utilizável | Igual ao item de cadastro acima | Decisão de produto no painel do Auth. |
| Emissão não grava em `documentos_gerados` | **Corrigido** | `persistEmission.ts` é chamado em imprimir, baixar PDF e reabrir do histórico. Falha na gravação bloqueia a saída do documento (fail-closed). O PDF vai para o bucket `documentos-pdf`. |
| Home com contadores fixos em 0 | **Corrigido nesta rodada** | `Home.tsx`: prescrições do dia (`prescricoes_historico`), documentos do dia e favoritos (`patologia_personalizacao`) vêm do banco, e falha vira `reportError`. O card "Alertas revisados" foi removido: o registro de alertas é só local, sem fonte persistida para contar. |
| "Entrar" da landing é âncora | **Não é defeito** | `#entrar` leva ao `LoginSection` (`id="entrar"`), que tem o formulário de login na própria landing. Mantido. |
| `?smart=1` não é lido | **Corrigido** | `Dashboard.tsx` abre o `SmartInputDialog` com `?smart=1` e tem botão "Entrada inteligente". |
| `/app/pacientes` é placeholder | **Cortado (2026-09-20)** | Rota, `Patients.tsx`, menu, busca global, atalho da Home e aba "Mais" do celular (agora "Escores") removidos. Volta com a tela real (Onda 2). |
| Assinatura digital "Em breve" | **Cortado (2026-09-20)** | Botão "Assinar — Em breve" removido de `EmissionActions.tsx`. |
| Rotas Pro só com gate no front | **Pendente: gate no servidor** | `/app/internacoes`, `/app/notificacoes`, `/app/atualizacoes` mantidas (são módulos reais). Conserto: `has_active_subscription()` nas RLS e edge functions (passo 1.9 do roadmap). |

### Achados do ZCode
| Achado | Situação | Evidência |
|---|---|---|
| Catálogo de patologias com 0 linhas em produção | **Pendente, não é código** | Carga via `/admin/importar-lote`, curadoria e promoção. É o bloqueio principal do happy path. |
| `documentos_gerados` inalcançável | **Corrigido** | Ver "Emissão não grava" acima. |
| `savePrescriptionRecord` fire-and-forget | **Corrigido** | `savePrescriptionRecord` lança erro e o Dashboard mostra toast de falha. |
| PDF com botões e banner da aplicação | **Mitigado, confirmar visualmente** | `PrintArea.tsx` marca controles e banners com `data-html2canvas-ignore` (linhas 390, 395, 720, 735, 759). Falta conferir o PDF real (teste T3). |
| Ícones PWA ausentes (404) | **Corrigido** | `favicon.png`, `apple-touch-icon.png`, `app-icon-192.png` e `app-icon-512.png` gerados a partir do SVG; `index.html` e `manifest.webmanifest` apontam para eles. |
| Playwright sem pacote nem spec | **Parcialmente resolvido, não executado por mim** | `playwright.config.ts` usa `@playwright/test` e existe `e2e/public-launch.spec.ts`. Não rodei. |
| Claims de "assinatura digital" e Instalar app | **Pendente (texto de produto)** | Assinatura é só visual: não sugerir ICP-Brasil. |

## O que mais mudou desde o relatório original
- **Escores clínicos:** nova central `/app/escores` (menu "Calculadoras de escores", busca global e botão "Escores clínicos (todos)" no atendimento) com as **68 funções `fn_calcular_*`**. O registro é gerado a partir de `types.ts`. Cada cálculo roda no servidor, que valida a população e grava em `audit_escores_clinicos`. O resultado pode entrar no documento. A auditoria é agrupada pelo mesmo `atendimentoId` do painel de calculadoras. As 4 calculadoras que já existiam (CHA₂DS₂-VASc, HAS-BLED, RCRI, Child-Pugh) continuam com a conferência servidor vs. local.
- **Suporte à decisão:** interações, alertas por perfil, diluição IV e histórico do paciente ligados ao atendimento (`AssistiveDecisionSupport`).
- **Sem falhas silenciosas:** cerca de 25 `catch` vazios removidos e cerca de 20 escritas passaram a checar `{ error }`, via `reportError`.
- **Edge functions:** texto de erro dos provedores e `e.message` não vão mais para o cliente; o detalhe fica no log do servidor.
- **Dados:** 4 tabelas `patologia_*` versionadas; `GRANT EXECUTE` das RPCs administrativas com guard de admin; view mascarada para credenciais de IA.

## Bloqueios e pendências
- **Deploy e migrations não executados.** O `config.toml` aponta para o projeto `zwwalaioamxcvxbihxlr`, que não está entre as contas acessíveis pelo MCP do Supabase (Farol, GalinhaFarm, cognifyq e um projeto sem nome). A CLI local devolveu `Unauthorized` com o token do ambiente. Nada foi aplicado em outro projeto.
  - Pendente: migrations `20260919120000` a `20260919120300` (primeiro numa branch do Supabase, depois `db push`).
  - Pendente: deploy de `public-document-link`, `ai-assist`, `clinical-ai`, `iv-extract`, `smart-input-extract`, `create-checkout` e `create-portal-session`.
  - Para destravar: fazer `supabase login` com um token válido para esse projeto, ou informar o acesso pelo MCP.
- **Código fantasma resolvido (2026-09-20): `DocumentsToGenerateDialog` e `DocumentPreviewDialog` removidos.** Decisão Q6 era "religar", mas religar como estava duplicava o classificador de receita e imprimia sem `persistEmission`. O que agregavam (perfil de assinatura, gate de revisão final) entrou na `ReviewScreen` já existente. Detalhe em `RELATORIO_PRESCRIMED_PERFEITO.md`, seção 5 (Q6) e passo 0.7.
- **Achado nesta rodada: bypass do fail-closed no preview lateral.** O botão "Imprimir/PDF" do preview do desktop chamava `handlePrint` puro (sem validação, sem `persistEmission`, sem gate de revisão). Corrigido: passa a chamar `handleEmit`, o mesmo caminho da "Revisar e emitir".
- **Perfil clínico do paciente** usado nos alertas vale só no atendimento em curso; não persiste em `pacientes_perfil_clinico`.
- **Smart Input:** itens de diagnóstico e cuidado de enfermagem extraídos são ignorados, com aviso.
- **Credenciais de IA:** o hook do cliente lê a view mascarada, mas a RLS da tabela ainda permite ler a chave bruta.
- **Escores:** campos de texto de contexto (`p_contexto`) são livres com o padrão do banco. Os limites numéricos são validados só no servidor.
- **Segredos:** rotacionar a senha do banco e a chave secreta que constavam no `.env` (o dossiê registra a exposição em log de ferramenta). O `.env` está staged como removido.

## Testes decisivos que restam
1. **T1 — Isolamento de sessão.** Conta A emite receita, salva rascunho de AIH e configura a clínica. Sair, entrar com a conta B no mesmo navegador. Esperado: nenhum dado de A visível.
2. **T2 — Checkout e ativação (sandbox).** Cadastro com `?plan=pro_monthly`, checkout embutido sem `checkout_erro`, cartão 4242, webhook 200, linha `active` em `subscriptions`, tela "Assinatura confirmada". Depende do deploy de `create-checkout`.
3. **T3 — Emissão completa.** Receita de controle especial: imprimir e baixar PDF. Esperado: sem botões nem banner no PDF; uma linha nova em `documentos_gerados` com `arquivo_pdf_url`; PDF aparece em `/d/<token>`; a linha `log_documentos_clinicos` correspondente existe. Repetir com a rede offline: deve aparecer erro e o documento não deve sair.
4. **T4 — Escores.** Abrir `/app/escores`, calcular um escore de cada especialidade e conferir a linha em `audit_escores_clinicos`. Testar entradas fora da faixa e idade fora da população validada: a mensagem do servidor deve aparecer.

## Próxima ação única
Destravar o acesso ao projeto Supabase (`zwwalaioamxcvxbihxlr`), aplicar as migrations numa branch, fazer o deploy das edge functions e só então rodar T1 a T4 em sandbox.
