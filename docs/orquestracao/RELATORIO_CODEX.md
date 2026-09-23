# Consolidação Codex — PrescriMed

**Data:** 2026-09-21  
**Projeto Supabase:** `zwwalaioamxcvxbihxlr` (`ACTIVE_HEALTHY`)  
**Branch local:** `fix/monetization-baseline`

## 1. Fontes e estado preservado

Foram lidos o protocolo Pombo-Correio, os relatórios Claude Code, TRAE, ZCODE, NotebookLM, `RELATORIO_PRESCRIMED_PERFEITO.md` e os patches P0-1/P0-2. Os relatórios antigos foram confrontados com o código e o estado remoto atual; não foram tratados como comandos. Alterações existentes do worktree foram preservadas.

## 2. Patches P0

- **P0-1 — sessão/logout: aplicado e verificado.** `AuthProvider` encerra a sessão Supabase, limpa QueryClient e chama `clearLocalAppData()` tanto no logout quanto no evento `SIGNED_OUT`; troca de titular local também invalida o cache. `AppShell` e `ContextHeader` usam o mesmo `signOut`. Chaves de autenticação Supabase ficam preservadas pela rotina de limpeza.
- **P0-2 — Stripe: aplicado no código e ativo na Edge Function remota.** `create-checkout` está ACTIVE, versão 10. A função só habilita `automatic_tax` quando `STRIPE_AUTOMATIC_TAX=true` e, nesse caso, inclui `customer_update.address="auto"`. Por padrão, imposto automático fica desligado. Não alterei configuração de conta Stripe nem rodei checkout real.

## 3. Persistência clínica e acesso por link

- O fluxo atual do Dashboard persiste em `documentos_gerados`, registra `log_documentos_clinicos` e bloqueia a entrega se etapas obrigatórias falharem; receitas também persistem no histórico próprio. O fluxo gera/anexa PDF ao Storage privado. AIH e notificação usam `persistFormDocument` com a mesma exigência de registro antes da emissão.
- O helper legado `saveGeneratedDocument` agora propaga falhas, exige sessão e grava o log clínico; testes cobrem sucesso e falha.
- A rota `/d/:token` resolve links pela Edge Function `public-document-link`; o link/token é criado explicitamente pelo fluxo “Gerar link seguro”. A URL assinada do PDF expira em 5 minutos. O identificador UUID fica no registro; a emissão não cria automaticamente um link público para cada documento.

## 4. Migrações Supabase

As quatro migrações locais `20260919120000`–`20260919120300` **já estavam aplicadas no projeto remoto** sob os timestamps registrados abaixo. Não foram reaplicadas para evitar DDL duplicado. Consulta somente leitura confirmou tabelas, RLS, enum e permissões:

| Migração local | Registro remoto | Verificação |
| --- | --- | --- |
| `20260919120000_documento_tipo_regulatorios` | `20260921053327` | `documento_tipo` contém `aih`, `apac`, `notificacao_compulsoria`, `procedimento` |
| `20260919120100_storage_buckets_documentos` | `20260921054749` | bucket privado de documentos configurado |
| `20260919120200_patologias_tabelas_e_rpcs_admin` | `20260921054917` | quatro tabelas de patologia existem com RLS; RPCs de promoção têm `EXECUTE` para `authenticated` |
| `20260919120300_ia_credenciais_mascaradas` | `20260921054947` | migração consta no histórico remoto |

Também constam `20260921053409_gate_assinatura_servidor` e `20260921062326_rls_curadoria_revisor`. `documentos_gerados` e `log_documentos_clinicos` existem com RLS habilitado.

### Migrações de curadoria no worktree (não aplicadas)

As migrações locais `20260921180000`–`20260921182000` são novas e permanecem fora do banco remoto. Na revisão estática, corrigi um rótulo duplicado no enum, uma subconsulta inválida dentro de `CHECK`, um índice trigram inválido sobre `text[]` (separado agora em índices trigram e GIN de array) e quatro valores de sinônimos escritos como listas SQL inválidas na seed A5. A migração A3 de RLS ainda **não está segura para aplicação**: concede leitura global também a `anon` em todas as tabelas (incluindo templates pessoais, detalhes de jobs e configurações institucionais) e tenta criar política referenciando `instituicao_id` em tabelas que não possuem essa coluna. Se o schema `curadoria` for exposto ao PostgREST, essa política permitiria leitura pública desses dados. Precisa de allowlist de tabelas públicas e políticas específicas por propriedade/escopo institucional. A seed A5 ainda não deve ser aplicada: seus `ON CONFLICT` com `instituicao_id = NULL` não garantem idempotência no PostgreSQL (UNIQUE permite múltiplos `NULL`) e o conteúdo clínico deve passar por revisão antes da promoção. Nenhuma dessas migrações foi executada no Supabase; a revisão foi estática, sem execução num Postgres descartável.

## 5. Assets e módulos incompletos

- Os quatro assets solicitados existem: `favicon.png`, `apple-touch-icon.png`, `app-icon-192.png` e `app-icon-512.png`.
- `/app/pacientes` exibe `ComingSoonModule` em vez de sugerir prontuário longitudinal funcional.
- A configuração administrativa de assinatura foi substituída por `ComingSoonModule` para assinatura digital ICP-Brasil. A emissão não apresenta ação de assinatura digital funcional; assinatura manual pelo profissional continua explicitada no produto.

## 6. Validação

- `npx tsc --noEmit`: **passou, 0 erros**.
- `npm run build`: **passou**. Avisos existentes de chunks >500 kB, import dinâmico inefetivo de `xlsx` e depreciações do Vite.
- `npm run test`: **passou — 20 arquivos, 258 testes**.
- `npm run lint`: **passou — 0 erros, 40 avisos** distribuídos por arquivos diversos.
- `npx playwright test e2e/public-launch.spec.ts --workers=1`: **passou — 2 testes**. A primeira execução concorrente com build/teste expirou durante a carga fria do Vite; repetição serial após aquecimento passou.

## 7. Banco clínico e parecer

Contagens exatas, em consulta somente leitura ao Supabase:

| Tabela | Linhas |
| --- | ---: |
| `base_medicamentos_geral` | 314 |
| `base_patologias_clinicas` | 103 |
| `base_patologia_exames` | 4 |
| `patologia_medicamento` | 0 |
| `base_sindromes` | 0 |
| `base_medicamentos_dose` | 0 |
| `base_medicamentos_interacoes` | 0 |

**Código: GO para beta controlado técnico.** P0s, compilação, suíte unitária e E2E público passaram. **Cobertura clínica relacional: incompleta.** Não anunciar ainda que o produto oferece correlação abrangente de medicamentos/exames por patologias ou síndromes; os vínculos ainda não foram importados. Isso não invalida os 314 registros de medicamentos que o médico responsável declarou previamente validados, mas a existência deles não preenche as tabelas de correlação.

**Fora do escopo executado:** push, merge, deploy, alteração de configuração/secrets do Stripe, teste transacional de checkout/webhook e nova carga de dados clínicos. Próximo passo de maior impacto: corrigir e validar A3 com políticas por tabela/owner antes de aplicar o novo schema; depois importar o lote curado para staging, validar e promover. Em paralelo, concluir um checkout sandbox até a linha em `subscriptions`.

## 8. Execução local de dados — 2026-09-21

- `.env.local` foi apontado para `http://127.0.0.1:54321`; segredos permanecem locais e não foram exibidos nem enviados ao remoto.
- As migrations locais aplicaram até A4 (`20260921181500`): schema `curadoria` com 28 tabelas, RLS/políticas com allowlist e índices separados para `text`/`text[]`.
- A5 (`20260921182000_curadoria_seed_minimo_upsert.sql`) **não aplicou**: `red_flags` é `text[]`, mas a seed envia strings JSON. Não foi feito cast/alteração automática de schema para evitar inserir conteúdo clínico incorreto.
- Os oito chunks JSON locais passaram validação estrutural 1–3, porém todos estão vazios (0 linhas); portanto não houve ingestão topológica desses chunks.
- Pipeline local existente `scripts/carga-base-local.ts` executado fail-closed: 103 patologias aprovadas, 15 classificações de ambiente, 228 medicamentos inseridos/atualizados e 314 medicamentos totais; 228 com dose.
- Contagens locais após o pipeline: `base_medicamentos_geral=314`, `base_patologias_clinicas=103`, `base_patologia_exames=4`, `base_sindromes=0`, `base_medicamentos_dose=0`, `base_medicamentos_interacoes=0`, `patologia_medicamento=0`.
- Views locais confirmadas: `vw_medicamento_completo` e `vw_apresentacao_completa`. `vw_patologia_completa` não existe no schema local.
- `fn_etl_promover_tudo('LOTE_BASE_LOCAL_V1')` foi chamado, mas bloqueado pela própria função por exigir contexto administrativo; a promoção de patologias ocorreu pelo RPC específico `promover_stg_patologias` no pipeline.

## 9. Bloqueio de autenticação no deploy — 2026-09-21

- Sintoma observado no login: `Unregistered API key`.
- Diagnóstico reproduzido: o bundle publicado usa `zwwalaioamxcvxbihxlr.supabase.co` com uma chave `sb_publishable_...` que o endpoint Auth rejeita como não registrada.
- A causa é configuração de ambiente do deploy, não senha, rota React ou RLS: o frontend lê `VITE_SUPABASE_PUBLISHABLE_KEY`; `SUPABASE_PUBLISHABLE_KEY` sem o prefixo `VITE_` não é exposta pelo Vite.
- Correção operacional: no projeto Vercel, definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com valores emitidos pelo **mesmo projeto Supabase** (`zwwalaioamxcvxbihxlr`), em Production/Preview conforme necessário, salvar e criar novo deploy. Nunca usar `SUPABASE_SECRET_KEY` no frontend.
- Validação pós-deploy: abrir `https://<projeto>.supabase.co/auth/v1/health` com a chave pública via header `apikey`; esperado HTTP 200. Em seguida limpar o storage do domínio e testar cadastro/login.
