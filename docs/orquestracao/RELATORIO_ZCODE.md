# Relatório — ZCode (QA independente)

## Veredito
**NO-GO** para o beta controlado hoje.

Base de evidência (executado localmente em leitura, branch `fix/monetization-baseline`, HEAD `c56174e` — 8 commits à frente da produção publicada `43b14a0`):
- `npm run lint` → 0 erros, 40 warnings. `vitest run` → **210/210 verde** (11 arquivos). `npm run build` → OK em 13,8s; precache PWA 10 entries (4.195,9 KiB), bundle principal incluído.
- Banco de produção (auditoria read-only via `scripts/audit-base-clinica.mjs`): `base_patologias_ref` = **0 linhas**, `base_sindromes` = 0, `patologia_ambiente` = 0, vínculos (`patologia_medicamento`, `sindrome_medicamento`) = 0, doses = 0. Catálogo de patologias do app lê **só do banco** (`src/modules/prescription/hooks/usePathologiesCatalog.ts:104-117`); os dados locais (`DEFAULT_PATHOLOGIES`/`EXTRA_PATHOLOGIES`, linha 78) são apenas enriquecimento por nome, nunca fallback de lista.
- Consequência: o happy path do protocolo (**patologia → medicamentos/exames → revisão → PDF em <5 min**) está indisponível em produção; hoje só existe "Documento em branco" (`PathologyGate.tsx:441-446,511-513`). Falha fechada (correto em segurança: dose ausente vira "Dose não cadastrada — preencher manualmente", `src/modules/prescription/hooks/useMedications.ts:56`), mas é **NO-GO como beta do produto** até carga mínima de conteúdo + correções P0 abaixo.

Auth/rotas: saudável — `/app/*` sob `ProtectedRoute` (`App.tsx:83`), admin com dupla guarda (`App.tsx:114-120`), `AdminRoute` checa `isAdmin||isReviewer` (`src/components/AdminRoute.tsx:3-12`; enforce real fica nas 317 RLS do banco), 3 rotas com gate de plano (`App.tsx:93-95`), recuperação/reset de senha presentes (`App.tsx:80-81`), `signOut` propaga erro (`src/components/providers/AuthProvider.tsx:68-71`).

## P0 comprovados
- [src/modules/prescription/hooks/usePathologiesCatalog.ts:104-133 + auditoria do banco] Lista de patologias/síndromes/ambientes = 0 linhas em produção → gate de entrada do happy path vazio; médico não alcança o fluxo promovido → **correção mínima**: carregar lote mínimo (patologias + `patologia_ambiente` + síndromes + vínculos) via `/admin/importar-lote` → `/admin/curadoria` → promoção.
- [src/pages/Dashboard.tsx:629-667 e 506-509; src/modules/documents/lib/documentSave.ts:17] `handleEmit` só imprime e guarda histórico em localStorage (linha 663-665); o único INSERT em `documentos_gerados` é inalcançável — `DocumentPreviewDialog` só é montado por `DocumentsToGenerateDialog`, que **não é importado por nenhuma rota** (grep vazio) → Histórico (`HistoryPage.tsx:24-29`) e Documentos (`DocumentsHistoryPanel.tsx:39-48`) eternamente vazios; hash/código de validação/auditoria de documentos inoperantes → **correção mínima**: chamar `saveGeneratedDocument` (fail-closed desde `c56174e`, `DocumentPreviewDialog.tsx:53-78`) dentro do fluxo de emissão do Dashboard.
- [src/pages/Dashboard.tsx:520-521 + src/modules/prescription/services/prescriptionRecords.ts:40-64] `void savePrescriptionRecord` fire-and-forget: falha de INSERT (offline, RLS, sessão expirada) é silenciosa e o toast anuncia sucesso → receita emitida sem rastreabilidade (risco de compliance) → **correção mínima**: tratar retorno null com toast de erro + botão "reemitir registro" (sem bloquear a impressão).
- [src/modules/prescription/components/PrintArea.tsx:196-208, 725-763 e src/pages/Dashboard.tsx:562-570, 700-714] html2pdf/html2canvas capturam mídia **screen**: botões "Imprimir/Salvar PDF/Fechar", seletor de anexo IV e banner de overflow estão dentro do nó capturado (`.prescription-print-area`, linha 393) e nenhuma chamada usa `onclone`/`ignoreElements` (`print:hidden` só vale para @media print) → PDF do paciente pode sair com cromo da aplicação → **correção mínima**: mover os controles para fora do nó capturado (ou filtrar por `data-no-print` no `onclone`). Confirmar no teste decisivo T3.
- [public/manifest.webmanifest:12-14 + index.html:6,11] `/app-icon-192.png`, `/app-icon-512.png` (maskable), `/favicon.png` e `/apple-touch-icon.png` **não existem** em `public/` nem no `dist/` (404 em produção) → sem ícone 192px o Chrome nunca dispara `beforeinstallprompt`; banner "Instalar app" (`InstallAppBanner.tsx:51-62`) morto em Android/desktop → **correção mínima**: gerar os 5 PNGs e republicar.
- [playwright.config.ts:1-10] importa `lovable-agent-playwright-config`, pacote **não instalado**; zero `*.spec.ts` no repo; sem script e2e (`package.json:7-15`) → fluxo de lançamento sem cobertura E2E com navegador real (a integração `src/test/integration/prescription-flow.test.ts` é jsdom + Supabase mockado) → **correção mínima**: hoje, substituir pelo checklist manual T1–T6 abaixo; E2E real fica para pós-beta.

## Cortar do lançamento
- Rotas Pro sem enforce server-side (`/app/internacoes`, `/app/notificacoes`, `/app/atualizacoes` — gate apenas front, `App.tsx:93-95`): aceitar no beta controlado com termos claros, ou cortar.
- Banner/claim "Instalar app" até os ícones existirem (senão é promessa falsa na prática).
- Qualquer comunicação de "assinatura digital": hoje é **apenas visual** — proibido sugerir ICP-Brasil.
- Console admin (`/admin/*`, curadoria, importação) fora do escopo do beta — não incluir médicos.
- IA/chatbot e "atualizações clínicas automáticas": dependem do gateway `ai.gateway.lovable.dev` (dependência externa) — cortar do roteiro de demo.

## Teste decisivo
Checklist mínimo de GO (executar na produção **após** os P0; cada item precisa passar):
1. **Conteúdo**: `/admin/importar-lote` → carregar lote mínimo → `/admin/curadoria` → promover. Esperado: contagem de `base_patologias_ref` e `patologia_ambiente` > 0; abrir `/app/prescricao/nova` e ver patologias nas 3 abas **sem duplicatas entre abas**.
2. **Happy path (<5 min)**: login → patologia (ex.: diarreia aguda) → 2 medicamentos com dose → revisão → Imprimir. Esperado: A4 retrato, cabeçalho, paciente, itens numerados, sem UI da aplicação.
3. **PDF**: repetir com medicamento de controle especial → "Baixar PDF". Esperado: paisagem com **2 vias lado a lado**, e **nenhum** botão/seletor/banner dentro do PDF. Se o cromo aparecer, o P0 do html2pdf está confirmado → NO-GO.
4. **Persistência**: emitir → abrir `/app/prescricoes` (registro com itens) e `/app/documentos` (documento com hash/código). Depois repetir em DevTools offline → esperado aviso de falha de persistência (não silêncio).
5. **PWA/rotas**: `curl -s -o /dev/null -w "%{http_code}" https://<domínio>/app-icon-192.png` = 200; instalar no Android; abrir `/d/<token>` e `/escore/<token>` e uma deep link `/app/historico` direto na barra → todos carregam (rewrite catch-all `vercel.json:2-7` já cobre).
6. **Auth**: logout → acessar `/app/documentos` direto → redireciona para `/login`; link público expirado mostra motivo, sem dado clínico.

## Próxima ação única
- **Carregar o lote mínimo de conteúdo clínico em produção** (patologias + ambientes + síndromes + vínculos, começando pelas emergências e o piloto diarreia aguda) via o pipeline staging → curadoria → promoção já existente — é o único bloqueio que o código não resolve sozinho; em paralelo, Codex aplica as 4 correções P0 de código (persistência da emissão, aviso de falha de `prescricoes_historico`, cromo no PDF, ícones PWA) e publica os 8 commits pendentes acima de `43b14a0`.
