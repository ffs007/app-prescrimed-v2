# Atualizar o handoff técnico para o IDE

O arquivo `HANDOFF_LOVABLE_TO_IDE.md` já existe na raiz (303 linhas) e cobre as 7 seções pedidas, mas está desatualizado em relação ao trabalho mais recente. O plano é reescrevê-lo por completo, mantendo a estrutura das 7 seções e corrigindo o que mudou.

## O que está desatualizado hoje

- A seção de Auth afirma que "não há AuthContext/Provider global" — hoje existe `src/components/providers/AuthProvider.tsx` (sessão + papéis + `isAdmin` + `signOut`) montado no app.
- A seção de estado afirma que o React Query está "montado e ignorado" — os hooks de medicamentos já foram migrados.
- Faltam as camadas clínicas novas: tabelas de staging (`stg_*`), tabelas definitivas (`base_*` de patologias, exames, sinais de alarme, escores, protocolos), funções de promoção (`promover_stg_*`, `aprovar_lote`, `clin_normalize`, `med_normalizar_principio`) e as telas `/admin/importar-lote` e `/admin/curadoria`.
- Falta a tabela de auditoria `audit_medflow_ps` e as três views de dashboard de PS.
- Falta registrar o conteúdo já semeado no lote `medflow_ps_v1` (15 princípios ativos, 20 doses, 10 diluições IV, 8 interações, 10 sinais de alarme, 8 escores) e que ele ainda está em staging, não promovido.
- A "Última Ação Tentada" aponta para a rodada de refinamentos de prescrição; a última ação real foi a criação das views de PS.

## O que o documento vai conter

1. **Visão geral da arquitetura** — stack e versões exatas lidas de `package.json` (React 18.3, Vite 5.4 + SWC, TS 5.8, Tailwind 3.4, shadcn/Radix, React Router 6.30, React Query 5.83, supabase-js 2.105, xlsx, fuse.js, html2pdf, Vitest/Playwright), config do Vite (porta 8080, alias `@`, `dedupe`).
2. **Estrutura de pastas e roteamento** — árvore de `src/` com o desenho por módulos de domínio, mais a tabela completa de rotas de `App.tsx` (públicas, protegidas, admin, rota pública `/d/:token`).
3. **Estado do Supabase** — inventário das ~130 tabelas agrupadas por domínio (prescrição, base de medicamentos, IV, alertas clínicos, interações, protocolos, documentos, histórico, staging/curadoria, beta/lançamento, auditoria de PS), FKs principais, o padrão único de RLS aplicado (leitura para `authenticated` nas bases, escrita para `admin`/`revisor`, staging só `admin`, dados de usuário por `auth.uid()`), a lista de GRANTs, funções, triggers, enums e as três views de PS.
4. **Estado e Auth** — `AuthProvider` como fonte única de sessão/papéis, `ProtectedRoute`/`AdminRoute`, `useIVPermissions`, o que ainda usa `supabase.auth.getUser()` local, uso atual de React Query vs. hooks manuais, `useLocalStorage`, e a regra de `usePrescription` ser hook puro.
5. **Integrações ativas** — as três edge functions e seus modos de JWT, Lovable AI Gateway (`LOVABLE_API_KEY`), variáveis `VITE_*`, secrets do backend, compartilhamento por WhatsApp/mailto, assinatura apenas visual, impressão via `window.print()`.
6. **Dívida técnica** — lista priorizada (crítico/alto/médio) revisada: base de medicamentos hardcoded x banco, `pediatricDose` como string, `iv_medications` com 149 colunas, `Dashboard.tsx` god component, impressão sem paginação real, lote `medflow_ps_v1` parado em staging, módulos beta/lançamento como instrumentação, `clinical-tests` v1 x v2, triggers duplicados, TS frouxo, ausência de testes clínicos e de CI.
7. **Última ação tentada** — criação das views `vw_ps_prescricoes_calculaveis`, `vw_ps_interacoes_criticas` e `vw_ps_sinais_alarme_criticos`, com o ajuste do filtro `dose_pendente_de_fonte` (boolean), e o próximo passo natural (promover o lote `medflow_ps_v1` para as tabelas `base_*`).

## Nota técnica

Antes de escrever, consulto o banco para listar colunas, FKs e políticas RLS reais em vez de descrevê-las de memória. Nenhum código da aplicação é alterado — apenas o arquivo `HANDOFF_LOVABLE_TO_IDE.md` na raiz.
