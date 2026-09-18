# HANDOFF_LOVABLE_TO_IDE — PrescriMed / MedFlow PS

Documento de transferência técnica do projeto **PrescriMed** (prescrição médica rápida e segura para urgência/emergência) do ambiente Lovable para um IDE profissional.

Estado capturado em: **2026-08-09**.

---

## 1. Visão Geral da Arquitetura

| Item | Valor |
| --- | --- |
| Framework | React 18.3.1 (SPA, sem SSR) |
| Linguagem | TypeScript 5.8 (`strictNullChecks: false`, `noImplicitAny: false`, `noUnusedLocals: false`) |
| Bundler | Vite 5.4.19 + `@vitejs/plugin-react-swc` 3.11 |
| Dev server | porta `8080`, host `::`, HMR overlay desativado |
| Estilo | Tailwind CSS 3.4.17 + `tailwindcss-animate` + `@tailwindcss/typography` |
| UI kit | shadcn/ui sobre Radix UI (`src/components/ui/*`) |
| Ícones | lucide-react 0.462 |
| Roteamento | react-router-dom 6.30 (BrowserRouter) |
| Data fetching | @tanstack/react-query 5.83 (`staleTime` 60s, `gcTime` 10min, sem refetch on focus, retry 1) |
| Backend | Supabase (Lovable Cloud) via `@supabase/supabase-js` 2.105 |
| Formulários | react-hook-form 7.61 + zod 3.25 + `@hookform/resolvers` |
| SEO | react-helmet-async 3 (componente `src/components/seo/PageMeta.tsx`) |
| Gráficos | recharts 2.15 |
| Busca fuzzy | fuse.js 7.3 |
| Planilhas | xlsx 0.18 (templates e importação em lote) |
| PDF/Impressão | `window.print()` + CSS `@media print`; `html2pdf.js` 0.10.2 disponível |
| Testes | Vitest 3.2 + Testing Library (`src/test/`), Playwright 1.57 (`playwright.config.ts`) |
| Lint | ESLint 9 (flat config) + typescript-eslint 8 |

- Alias de import: `@/*` → `./src/*`.
- `vite.config.ts` faz `dedupe` de `react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`, `@tanstack/react-query` e `@tanstack/query-core` — **manter**, houve conflito de múltiplas instâncias de React.
- Scripts: `dev`, `build`, `build:dev`, `lint`, `preview`, `test`, `test:watch`.

---

## 2. Estrutura de Pastas e Roteamento

### 2.1 Pastas

```text
src/
├── App.tsx                  # Providers + definição de rotas
├── main.tsx                 # bootstrap createRoot
├── index.css                # design tokens HSL (tema, cores semânticas)
├── pages/                   # páginas de rota
├── components/
│   ├── ui/                  # shadcn/ui (não editar sem necessidade)
│   ├── providers/AuthProvider.tsx   # contexto único de sessão + papéis
│   ├── app-shell/           # AppShell, AppSidebar, MobileBottomNav
│   ├── landing/             # seções da landing page
│   ├── dashboard/           # SettingsModal
│   ├── seo/PageMeta.tsx
│   └── ProtectedRoute.tsx / AdminRoute.tsx / ScrollToTop.tsx / NavLink.tsx
├── modules/                 # domínio — o coração da aplicação
│   ├── prescription/        # motor de prescrição
│   │   ├── types/           # prescription.ts, clinical.ts
│   │   ├── services/        # doseCalculator, clinicalSafety, medicationSafety,
│   │   │                    # regulatoryGrouping (+ .test.ts), regulatoryTaxonomy,
│   │   │                    # regulatoryClassification, prescriptionFormatter,
│   │   │                    # documentText, documentValidation, suggestionEngine,
│   │   │                    # ruleRegistry, v2Rules, clinicalSearch, safetyLog
│   │   ├── hooks/           # usePrescription (puro), usePatient, usePediatricDose,
│   │   │                    # useMedications, useMedicationsCatalog, useClinicalSearch,
│   │   │                    # useEmissionHistory, usePathologyMemory, useSafetyOverride
│   │   ├── components/      # BuilderShell, PathologyLibrary, ReviewScreen, PrintArea,
│   │   │                    # formulários de documentos (Atestado, Relatório, Exames…)
│   │   ├── data/medications/  # overlay v2 por classe terapêutica
│   │   └── mvp/NewPrescriptionPage.tsx
│   ├── medications-base/    # base geral: admin, import XLSX/CSV, blocos, qualidade, pacote beta
│   ├── iv-dilution/         # diluição endovenosa, motor de segurança IV, admin
│   ├── clinical-alerts/     # contraindicações, gestação/lactação, renal/hepático
│   ├── interactions/        # interações medicamentosas
│   ├── protocols/           # protocolos clínicos
│   ├── templates/           # modelos, kits, conjuntos, favoritos
│   ├── patient-history/     # histórico e reaproveitamento de prescrição
│   ├── patient-link/        # links públicos para paciente (WhatsApp/e-mail)
│   ├── documents/           # atestados, encaminhamentos, relatórios, logs
│   ├── digital-signature/   # assinatura e carimbo digital (visual)
│   ├── smart-input/         # extração por IA (texto/imagem)
│   ├── clinical-tests/ + clinical-tests-v2/
│   ├── import-lotes/        # parsers e schema da importação clínica em lote
│   ├── indicators/          # indicadores e prontidão beta
│   └── beta/                # termos beta, feedback, admin de lançamento
├── hooks/                   # useIsAdmin, useLocalStorage, use-toast, use-mobile
├── data/medications.ts      # BASE HARDCODED de medicamentos (ver dívida técnica)
├── lib/utils.ts             # cn() e helpers
├── types/prescription.ts    # re-export de modules/prescription/types
├── scripts/syncMedicationsToBase.ts
└── integrations/supabase/   # client.ts + types.ts (AUTO-GERADOS, não editar)

supabase/
├── config.toml              # project_id + verify_jwt da função pública
└── functions/
    ├── public-document-link/  # verify_jwt = false
    ├── smart-input-extract/
    └── iv-extract/
```

### 2.2 Rotas (`src/App.tsx`)

| Rota | Guarda | Componente |
| --- | --- | --- |
| `/` | pública | `Index` (landing) |
| `/login` | pública | `Login` |
| `/cadastro` | pública | `Cadastro` |
| `/d/:token` | pública | `PublicDocumentPage` (documento compartilhado) |
| `/app` | `ProtectedRoute` + `AppShell` | layout com sidebar/bottom nav |
| `/app` (index) | protegida | `Home` |
| `/app/prescricao/nova` | protegida | `NewPrescriptionPage` |
| `/app/pacientes` | protegida | `Patients` |
| `/app/modelos` | protegida | `QuickTemplates` |
| `/app/medicamentos` | protegida | `MedicationsBrowse` |
| `/app/historico` | protegida | `HistoryPage` |
| `/app/documentos` | protegida | `DocumentsPage` |
| `/app/indicadores` | protegida | `IndicatorsPage` |
| `/app/testes-clinicos` | protegida + `AdminRoute` | `ClinicalTestsPage` |
| `/admin/iv-dilution` | protegida + admin | `IVDilutionAdminPage` |
| `/admin/importar-lote` | protegida + admin | `ImportarLotePage` (staging clínico) |
| `/admin/curadoria` | protegida + admin | `CuradoriaPage` (conflitos + promoção) |
| `*` | — | `NotFound` |

Providers em `App.tsx`, nesta ordem: `QueryClientProvider` → `HelmetProvider` → `TooltipProvider` (+ `Toaster` e `Sonner`) → `AuthProvider` → `BrowserRouter`.

> Observação: `src/pages/Dashboard.tsx` existe e concentra o fluxo antigo de prescrição, mas a rota ativa é `NewPrescriptionPage`.

---

## 3. Estado do Supabase

**124 tabelas** no schema `public`, **7 views**, **317 políticas RLS**, ~76 enums, ~22 funções, ~85 triggers. Nenhum storage bucket criado.

### 3.1 Domínios de tabelas

**Prescrição e paciente**
`prescricoes_historico`, `pacientes_perfil_clinico`, `restricoes_paciente`, `medicacoes_uso_continuo`, `profiles`, `user_roles`.

**Base geral de medicamentos (22A–22C)**
`base_medicamentos_geral` (77 colunas, 84 linhas), `base_apresentacoes_medicamentos`, `base_medicamentos_dose`, `base_medicamentos_populacao`, `base_medicamentos_contraindicacoes`, `base_medicamentos_interacoes`, `base_medicamentos_monitoramento`, `base_medicamentos_regulatorio`, `base_medicamentos_equivalencia`, `base_medicamentos_alerta`, `base_medicamentos_checklist`, `medicamento_contexto_clinico`, `base_vinculos_cid_queixa`, `base_blocos_clinicos`, `base_blocos_medicamentos_planejados`, `base_blocos_checklist_itens`, `base_beta_pacote_itens`, `qualidade_base_configs`, `qualidade_base_ignoradas`, `config_importacao_base`, `historico_importacao_medicamentos`, `log_importacao_medicamentos`, `log_qualidade_base_medicamentosa`.

**Diluição IV**
`iv_medications` (**149 colunas**, 14 linhas), `base_iv_diluicao`, `iv_termos_sugeridos`, `iv_calc_settings`, `iv_pediatric_settings`, `iv_renal_hepatic_settings`, `historico_alertas_iv`, `historico_revisao_seguranca_iv`, `log_calculos_iv`, `log_calculos_pediatricos`, `log_base_diluicao_iv`, `log_textos_diluicao_iv`, `log_correspondencia_medicamentos_iv`, `log_visualizacao_orientacoes_iv`.

**Segurança clínica**
`base_contraindicacoes_medicamentos`, `base_interacoes_medicamentosas`, `clinical_alerts_settings`, `interacoes_settings`, `log_alertas_alergias_condicoes`, `log_alertas_renal_hepatico`, `log_interacoes_prescricao`.

**Base clínica (patologias, exames, escores, protocolos)**
`base_patologias_clinicas` (vazia), `base_patologias_ref`, `base_patologia_exames`, `base_exames`, `base_exames_clinicos`, `base_rastreamentos`, `base_sinais_alarme`, `base_escores_clinicos`, `base_escore_itens`, `base_protocolos_clinicos`, `base_referencias_clinicas`, `base_modelos_rapidos`, `base_modelos_rapidos_itens`, `protocolos_settings`, `protocolos_favoritos`, `log_uso_protocolos`.

**Staging e curadoria** (só admin)
`stg_import_lotes`, `stg_patologias`, `stg_patologia_exames`, `stg_exames`, `stg_rastreamentos`, `stg_sinais_alarme`, `stg_escores`, `stg_escore_itens`, `stg_protocolos`, `stg_med_principio`, `stg_med_dose`, `stg_med_iv`, `stg_med_interacao`, `stg_med_apresentacao`, `stg_med_contraindicacao`, `stg_med_populacao`, `stg_med_regulatorio`, `curadoria_decisoes`.

**Documentos e compartilhamento**
`documentos_gerados`, `documentos_settings`, `documento_links_publicos`, `link_acessos_log`, `log_documentos_clinicos`, `assinatura_digital_config`, `assinatura_perfis`.

**Modelos / entrada inteligente / histórico**
`modelos_prescricao`, `kits_rapidos`, `conjuntos_rapidos`, `favoritos_medicamentos`, `templates_settings`, `log_uso_modelos_prescricao`, `entrada_inteligente_settings`, `termos_aprendizado_ia`, `log_entrada_inteligente`, `log_edicoes_itens_ia`, `historico_settings`, `log_reaproveitamento_prescricao`, `log_visualizacao_historico_paciente`.

**Beta / lançamento (instrumentação de projeto)**
`beta_settings`, `beta_checklist_items`, `beta_modulos_revisao`, `eventos_beta_log`, `hardening_beta_itens`, `lancamento_versoes`, `lancamento_checklist`, `lancamento_metas`, `lancamento_bugs_conhecidos`, `lancamento_feedback`, `lancamento_feedback_medicamento`, `lancamento_testadores`, `lancamento_termos_beta`, `lancamento_termos_aceites`, `lancamento_log`, `testes_clinicos`, `testes_clinicos_v2`, `testes_clinicos_configs`, `log_testes_clinicos`, `indicadores` (via views).

**Auditoria de PS**
`audit_medflow_ps` (20 colunas) — registra eventos do fluxo de urgência (escore aplicado, medicamento prescrito, dose calculada, override de alerta) por `atendimento_id` e `profissional_id`, com índices nessas duas colunas.

### 3.2 Views

| View | Conteúdo |
| --- | --- |
| `vw_ps_prescricoes_calculaveis` | doses de `base_medicamentos_dose` marcadas como calculáveis (min/max/unidade presentes e `dose_pendente_de_fonte` nulo ou falso) |
| `vw_ps_interacoes_criticas` | `base_medicamentos_interacoes` com gravidade `maior`/`critica` |
| `vw_ps_sinais_alarme_criticos` | `base_sinais_alarme` com gravidade `critico` |
| `vw_qualidade_base_clinica` | painel de qualidade da base clínica |
| `vw_stg_conflitos`, `vw_stg_orfaos`, `vw_exames_quase_duplicados` | apoio à curadoria do staging |

Todas as views de PS usam `WITH (security_invoker = true)` — respeitam a RLS do usuário chamador.

### 3.3 Padrão de RLS (317 políticas)

Nenhuma tabela do schema `public` está sem política. Os padrões aplicados:

| Padrão | Alvo | Regra |
| --- | --- | --- |
| Leitura clínica compartilhada | 53 tabelas `base_*`, `iv_medications`, `*_settings`, `audit_medflow_ps` | `SELECT` para `authenticated` com `USING (true)` |
| Curadoria clínica | 18 tabelas `base_*` (medicamentos, exames, escores, sinais, referências) | `ALL` para `has_role(auth.uid(),'admin') OR has_role(auth.uid(),'revisor')` |
| Staging e configuração | 37 tabelas (`stg_*`, `curadoria_decisoes`, blocos, checklists, lançamento) | `ALL` apenas para `admin` |
| Logs e dados sensíveis de atendimento | 22 tabelas `log_*`, `prescricoes_historico`, `pacientes_perfil_clinico`, `restricoes_paciente` | leitura para `admin`/`revisor`; `INSERT` para `authenticated` com `WITH CHECK (auth.uid() = usuario_responsavel)` |
| Dados do próprio usuário | `profiles`, `modelos_prescricao`, `kits_rapidos`, `favoritos_medicamentos`, `medicacoes_uso_continuo`, `documentos_gerados` | escopo por `auth.uid()` (owner) + escape de admin |
| Configuração global | 18 tabelas `*_settings`, `assinatura_digital_config`, `user_roles` | `UPDATE` apenas para `admin` |

`GRANT` explícito de `SELECT/INSERT/UPDATE/DELETE` para `authenticated` e `ALL` para `service_role` está aplicado nas tabelas expostas ao app; `anon` não recebe grant (o único acesso público é via edge function `public-document-link`, que usa service role).

### 3.4 Foreign keys

Não há FK para `auth.users` (regra do Supabase). Os relacionamentos principais são:

- `profiles.id` → identidade do usuário; `user_roles.user_id` → papéis (`app_role`: `admin`, `revisor`, `enfermagem`, `farmacia`, …).
- Todas as tabelas satélite de medicamento (`base_medicamentos_dose`, `_populacao`, `_interacoes`, `_contraindicacoes`, `_monitoramento`, `_regulatorio`, `_equivalencia`, `_alerta`, `base_apresentacoes_medicamentos`, `base_iv_diluicao`, `medicamento_contexto_clinico`) → `base_medicamentos_geral(id)`.
- `base_escore_itens` → `base_escores_clinicos`; `base_sinais_alarme`, `base_exames`, `base_patologias_ref` → `base_referencias_clinicas` (`fonte_id`, fontes F001–F005).
- `base_blocos_checklist_itens` / `base_blocos_medicamentos_planejados` → `base_blocos_clinicos`.
- `documento_links_publicos` → `documentos_gerados`; `link_acessos_log` → link público.
- `lancamento_*` → `lancamento_versoes`; `testes_clinicos_v2` / `testes_clinicos_configs` → versão/config.

### 3.5 Funções e triggers

Funções (todas com `SET search_path = public`):

- Segurança: `has_role` (security definer; `EXECUTE` restrito), `handle_new_user` (security definer, cria `profiles` no signup).
- Normalização: `iv_normalize_text` (immutable), `clin_normalize`, `med_normalizar_principio` (usam `extensions.unaccent`).
- Promoção de staging → base: `promover_stg_patologias`, `promover_stg_exames`, `promover_stg_patologia_exames`, `promover_stg_rastreamentos`, `aprovar_lote`, `stg_conta_vazios`.
- `updated_at`: `set_updated_at`, `templates_set_updated`, `protocolos_set_updated`, `blocos_set_updated`.
- Triggers de normalização por tabela: `bmg_set_normalized`, `iv_set_normalized`, `iv_set_termo_normalized`, `contra_set_normalized`, `interacoes_set_normalized`, `beta_pacote_set_normalized`, `blocos_planejados_set_normalized`.

Triggers: `on_auth_user_created` em `auth.users`; ~55 `BEFORE UPDATE` de `updated_at`; normalizadores `BEFORE INSERT/UPDATE`.

> Atenção: `base_interacoes_medicamentosas` tem **dois pares de triggers** (`tg_base_interacoes_normalize` → `set_updated_at` e `tg_base_interacoes_normalized` → `interacoes_set_normalized`) — nomes confusos, candidato a limpeza.

### 3.6 Conteúdo semeado (lote `medflow_ps_v1`) — ainda em STAGING

| Tabela | Linhas |
| --- | --- |
| `stg_med_principio` | 15 (adrenalina, noradrenalina, amiodarona, fentanil, midazolam, …) |
| `stg_med_dose` | 20 (adulto e pediátrico) |
| `stg_med_iv` | 10 diluições com compatibilidade, fotoproteção e extravasamento |
| `stg_med_interacao` | 8 interações críticas |
| `stg_sinais_alarme` | 10 sinais de emergência |
| `stg_escores` | 8 escores (NEWS2, GCS, qSOFA, …) |
| `stg_protocolos` | 10 protocolos de emergência (sepse, AVC, IAM, …) |

**Nada disso foi promovido** para as tabelas `base_*` — `base_patologias_clinicas` está com 0 linhas. A promoção é feita em `/admin/curadoria` via as funções `promover_stg_*` / `aprovar_lote`.

---

## 4. Gerenciamento de Estado e Auth

### 4.1 Autenticação

- Supabase Auth por **e-mail/senha**. Cliente em `src/integrations/supabase/client.ts` (auto-gerado, **não editar**): `persistSession: true`, `autoRefreshToken: true`, storage `localStorage`.
- **`src/components/providers/AuthProvider.tsx` é a fonte única de verdade**: registra `onAuthStateChange` antes de `getSession()`, expõe `{ session, user, loading, roles, rolesLoading, isAdmin, signOut }` e carrega `user_roles` quando o `userId` muda. Consumido por `useAuth()`.
- `ProtectedRoute` mostra loading e redireciona para `/login` guardando `state.from`. `AdminRoute` bloqueia rotas administrativas.
- `useIVPermissions()` deriva perfil (`medico`/`enfermagem`/`farmacia`/`revisor`/`admin`) e capacidades (`canEdit`, `canImport`, `canApprove`, `canInactivate`, `canSeePreparation`, `canSeeAdminBase`) a partir de `useAuth()`.
- `src/hooks/useIsAdmin.ts` ainda existe como caminho legado (consulta própria a `user_roles`).
- Sem OAuth social, sem confirmação de e-mail customizada, sem MFA.

### 4.2 Estado da aplicação

- **Sem Redux/Zustand.** O único contexto global é o `AuthProvider`.
- React Query está configurado e **em uso parcial**: os hooks de catálogo de medicamentos foram migrados. Muitos hooks de módulo (`useModelosPrescricao`, `useTemplatesSettings`, `useSmartInputSettings`, `useKitsRapidos`, …) ainda seguem o padrão manual `useState + useEffect + load()/reload()`, sem cache compartilhado.
- Vários desses hooks ainda chamam `supabase.auth.getUser()` localmente antes de gravar, em vez de usar `useAuth()`.
- `useLocalStorage` guarda preferências e memória de patologia.
- Estado local pesado em `src/pages/Dashboard.tsx` e `modules/prescription/hooks/usePrescription.ts`.
- Regra do projeto: **`usePrescription` é hook puro** — sem toasts, sem `loadPathology`, sem `getMedText`; lança `MedicationContraindicatedError`. Toda orquestração (toasts, carregamento de patologia) fica na página.
- Regra de design: nunca usar cores hardcoded (`text-white`, `bg-blue-500`); sempre tokens HSL de `index.css` / `tailwind.config.ts`.

---

## 5. Integrações Ativas

### 5.1 Edge Functions (`supabase/functions/`)

| Função | JWT | Papel |
| --- | --- | --- |
| `public-document-link` | `verify_jwt = false` (em `config.toml`) | resolve o token de `/d/:token`, devolve o documento público e grava acesso em `link_acessos_log` |
| `smart-input-extract` | autenticado | extração estruturada de prescrição a partir de texto/imagem via Lovable AI Gateway |
| `iv-extract` | autenticado | extração/normalização de dados de diluição IV via Lovable AI Gateway |

### 5.2 IA

Lovable AI Gateway (Google Gemini) usando o secret `LOVABLE_API_KEY`. Não há chave OpenAI/Anthropic própria. Ao migrar para o IDE, é preciso apontar o gateway ou trocar por um provider próprio nessas duas funções.

### 5.3 Variáveis de ambiente

Frontend (`.env`, prefixo `VITE_`, valores públicos):

```
VITE_SUPABASE_PROJECT_ID="zjlvixqexqjtbunbgcoe"
VITE_SUPABASE_URL="https://zjlvixqexqjtbunbgcoe.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key>"
```

Secrets no backend (Edge Functions): `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_SECRET_KEYS`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SUPABASE_JWKS`.

> A `SERVICE_ROLE_KEY` e a senha do banco não são acessíveis no ambiente Lovable. No IDE será necessário obtê-las/regenerá-las no painel do projeto Supabase.

### 5.4 Outras integrações

- Compartilhamento com paciente: links `/d/:token` enviados via **WhatsApp (deep link `wa.me`)** e **mailto** — sem API oficial do WhatsApp nem e-mail transacional.
- Assinatura digital: **apenas visual** (upload de imagem de assinatura + carimbo). Sem ICP-Brasil / Certisign / BirdID / VIDaaS, apesar de `assinatura_digital_config` prever `assinatura_ambiente` e `assinatura_status_integracao`.
- Impressão/PDF: `window.print()` com folhas de estilo dedicadas; `html2pdf.js` de uso pontual.
- Sem analytics, sem Sentry, sem pagamentos.

---

## 6. Dívida Técnica e Limitações

### 6.1 Crítico

1. **Base de medicamentos duplicada.** `src/data/medications.ts` é um array hardcoded (centenas de itens, IDs até 705 + bloco 900–911 "VO intra-hospitalar") usado pelo fluxo de prescrição, enquanto `base_medicamentos_geral` (84 linhas) vive no banco. **As duas fontes não estão sincronizadas** (existe `src/scripts/syncMedicationsToBase.ts`, parcial). Unificar é o refactor mais urgente.
2. **Lote `medflow_ps_v1` parado em staging.** Todo o conteúdo de PS (medicamentos, doses, diluições, interações, sinais, escores, protocolos) está em `stg_*` e nunca foi promovido. Consequência: as views `vw_ps_*` retornam vazio e `base_patologias_clinicas` está com 0 linhas — o app "de emergência" não tem base clínica ativa.
3. **`pediatricDose` é `string` livre.** A Fase 6 planejada (migrar para objeto tipado com 5 variantes) nunca foi executada; hoje a dose pediátrica é texto reparseado ad hoc — risco clínico.
4. **`iv_medications` com 149 colunas.** Precisa ser normalizada em tabelas filhas (diluição, estabilidade, compatibilidade, alertas), coexistindo hoje com `base_iv_diluicao` (duplicação conceitual).
5. **Cobertura de testes ~zero na lógica de risco.** Só `regulatoryGrouping.test.ts` e `src/test/example.test.ts`. Nada cobre cálculo de dose, contraindicação, interação ou agrupamento de receitas.

### 6.2 Alto

6. **`src/pages/Dashboard.tsx` é um god component** e coexiste com o fluxo novo `NewPrescriptionPage` — decidir qual sobrevive e remover o outro.
7. **Impressão frágil.** Receita de Controle Especial é forçada em A4 paisagem com 2 vias lado a lado; há apenas um *aviso* de estouro (~194mm) medido no DOM, sem paginação real.
8. **React Query pela metade.** Coexistem cache do React Query e dezenas de `load()/reload()` manuais — risco de estado obsoleto entre abas do admin.
9. **Hooks ainda chamam `supabase.auth.getUser()`** em vez de consumir `useAuth()`; `useIsAdmin` duplica a lógica de papéis do `AuthProvider`.
10. **Módulos beta/lançamento em excesso** (~20 tabelas + várias telas admin): instrumentação de projeto, não produto. Isolar atrás de flag ou remover.
11. **`clinical-tests` e `clinical-tests-v2` coexistem** — v1 deveria sair.
12. **Triggers duplicados** em `base_interacoes_medicamentosas` (ver 3.5).
13. **TypeScript frouxo** (`strictNullChecks: false`, `noImplicitAny: false`). Ligar strict vai expor centenas de erros — fazer módulo a módulo.
14. **`any` disseminado** em mapeamentos de linhas do Supabase.

### 6.3 Médio

15. Resíduos da entrada por voz removida (`modules/smart-input/hooks/useVoiceCapture.ts`).
16. Sem tratamento de erro padronizado — muitos `console.error(e); return null;` silenciosos (ex.: `documentSave.ts`).
17. Sem paginação nas listagens administrativas da base de medicamentos.
18. **Sem storage buckets** — assinatura/carimbo são persistidos como dado na tabela, não em Storage.
19. `react-helmet-async` cobre apenas Home/Login/Cadastro; rotas `/app/*` sem metadados próprios.
20. Sem i18n (pt-BR hardcoded no JSX).
21. Sem CI (nenhum workflow de lint/test/build) e Playwright configurado mas sem specs relevantes.

### 6.4 Limitações funcionais conhecidas

- Não há prontuário longitudinal: `pacientes_perfil_clinico` é snapshot por atendimento.
- Interações e contraindicações dependem de base preenchida manualmente; cobertura parcial.
- Nenhuma validação legal de receituário (numeração de controle especial, notificação de receita).
- Sem multi-tenant / vínculo institucional: todo usuário autenticado enxerga as bases clínicas compartilhadas.
- `audit_medflow_ps` está criada mas **ainda não é escrita pelo frontend** — nenhum ponto do app grava eventos de auditoria de PS.

---

## 7. Última Ação Tentada

Criação das **views de dashboard do PS**, concluída com sucesso:

- `vw_ps_prescricoes_calculaveis` — doses com min/max/unidade preenchidos e prontos para cálculo.
- `vw_ps_interacoes_criticas` — interações de gravidade `maior`/`critica`.
- `vw_ps_sinais_alarme_criticos` — sinais de alarme `critico`.

Ajuste feito durante a execução: o filtro sobre `dose_pendente_de_fonte` foi trocado de comparação textual para `IS NULL OR = false`, porque a coluna é `boolean`. As três views usam `security_invoker = true`.

**Próximo passo natural (não executado):** promover o lote `medflow_ps_v1` de `stg_*` para as tabelas `base_*` via `/admin/curadoria` (`promover_stg_*` / `aprovar_lote`) e, em seguida, ligar a escrita em `audit_medflow_ps` no fluxo de prescrição. Sem isso as views de PS retornam vazio.

---

## Checklist de retomada no IDE

1. `npm i` e criar `.env` com as três variáveis `VITE_*`.
2. `npx supabase login` + `link` no projeto; regerar `src/integrations/supabase/types.ts`.
3. Obter/regenerar `SERVICE_ROLE_KEY` e configurar secrets das edge functions (incluindo substituto do `LOVABLE_API_KEY`).
4. Promover o lote `medflow_ps_v1` e validar as views `vw_ps_*`.
5. Atacar a dívida 6.1 na ordem: unificar base de medicamentos → tipar `pediatricDose` → testes da lógica de dose/segurança.
