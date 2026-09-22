# Relatório — ZCode (QA independente + Engenharia de Release)

Data: 2026-09-21 · Branch `fix/monetization-baseline` · Missão: carga/promoção do lote, assets PWA, bateria de testes, checklist de liberação.

## Veredito
**GO para beta controlado** — condicionado ao deploy do HEAD local + aprovação no smoke pós-deploy (seção Teste decisivo). O único P0 remanescente de código (cromo da UI no PDF gerado por html2pdf) fica bloqueado pelo item T3: se falhar no smoke, cortar "Baixar PDF" do beta até o conserto.

Evidência executada nesta rodada:
- **Conteúdo clínico ativado em produção** (lote `LOTE_BASE_LOCAL_V1`, via staging → `promover_stg_patologias` → `aprovar_lote`, sem inventar conteúdo): `base_patologias_clinicas` **103 aprovadas**; `patologia_ambiente` **15** (somente `isEmergency` → `emergencia/critica`); `base_medicamentos_geral` **314** (228 com dose adulto, 55 com dose pediátrica na `vw_medicamento_completo`). Auditoria prévia: **o lote `medflow_ps_v1` não existe neste projeto** (staging vazio, exceto 4 linhas `processado=true` do lote de teste `diabetes_endocrino_cronico_v1`) — ele ficou no projeto Lovable antigo; a carga usou o catálogo local curado que o app já serve (`src/data/medications.ts` + `extraPathologies.ts`), mapeamento idêntico ao `syncMedicationsToBase.ts`. Script reutilizável e idempotente: `scripts/carga-base-local.ts`.
- **PWA/assets**: gerados `public/app-icon-512.png`, `app-icon-192.png`, `apple-touch-icon.png`, `favicon.png` (`scripts/gerar-icones.ps1`, System.Drawing, sem dependências); todos entram no `dist/` e os dois ícones de app estão no precache do `sw.js`. Com ícone 192px o `beforeinstallprompt` volta a poder disparar.
- **Testes**: Vitest **257/257 verde** (20 arquivos). Playwright `e2e/public-launch.spec.ts` **2/2 verde** (landing → `/cadastro?plan=pro_monthly`; `/termos`, `/privacidade`, `/login` com link "Esqueci minha senha"). Build de produção OK; `dist/sw.js` regenerado.

Limitações honestas desta liberação: abas **Ambulatorial** e **Urgências/PS** permanecem vazias (falha fechada — não existe curadoria de ambiente para essas camadas; inventá-las violaria a regra de conteúdo); `base_sindromes` segue 0 (entrada por síndrome inativa); 86 medicamentos pré-existentes seguem sem dose ("Dose não cadastrada — preencher manualmente", comportamento fail-closed correto).

## P0 comprovados
Resolvidos nesta rodada:
- ~~[banco] base_patologias_ref/base_sindromes = 0 linhas~~ → **RESOLVIDO**: 103 patologias aprovadas + 15 ambientes; happy path com patologias emergenciais funcional (sugestões curadas por nome + doses). `base_sindromes` = 0 permanece (ver Cortar).
- ~~[manifest.webmanifest:12-14 + index.html:6,11] ícones 404~~ → **RESOLVIDO**: 4 PNGs gerados, no `dist/` e no precache.
- ~~[playwright.config.ts] config quebrada/zero specs~~ → **RESOLVIDO**: config padrão + spec rodando 2/2 (via `playwright-fixture.ts`).

Restantes (um único P0 de código):
- [src/modules/prescription/components/PrintArea.tsx:196-208,725-763 + src/pages/Dashboard.tsx:562-570,700-714] html2pdf/html2canvas capturam mídia screen; botões/seletor IV/banner estão dentro do nó capturado, sem `onclone`/`ignoreElements` → o PDF pode sair com cromo da aplicação. **Não foi editado** (vedação da missão: sem editar lógica sem passar pela suíte). Bloqueio de liberação: item T3 do smoke. Correção mínima sugerida ao Codex: mover controles para fora de `.prescription-print-area` ou filtrar `[data-no-print]` no `onclone`, com teste na suíte antes do merge.
- Publicação: produção está em `43b14a0`; o HEAD local (`8663f62` + alterações não commitadas de Codex/Trae + assets desta rodada) **ainda não foi commitado/deployado**. Sem deploy, nada acima existe para o beta tester.

## Cortar do lançamento
- Entrada por **síndrome** (base_sindromes = 0) e abas Ambulatorial/Urgências — a demo do beta é: patologia (Emergências) → medicamentos com dose → revisão → PDF, e "Documento em branco".
- Comunicar assinatura apenas como **visual** (nunca ICP-Brasil); IA/chatbot fora do roteiro de demo (dependência do gateway externo).
- Banner "Instalar app" só após o smoke de ícones em produção (T5).
- Não incluir médicos no console `/admin/*`.

## Teste decisivo
Smoke pós-deploy (bloqueante; cada item precisa passar):
1. **Conteúdo**: abrir `/app/prescricao/nova` → aba **Emergências** lista as 15 patologias críticas; buscar "sepse" e "amigdalite" (esta última aparece via busca apenas na aba com ambiente atribuído; se abas Ambulatorial/Urgências estiverem vazias, é o esperado).
2. **Happy path (<5 min)**: login → Sepse (ou Amigdalite via emergência) → 2 medicamentos **com dose** → revisão → Imprimir. Esperado: A4, cabeçalho, itens numerados, sem UI da aplicação.
3. **PDF (bloqueante)**: "Baixar PDF" → conferir que **nenhum** botão/seletor/banner sai dentro do PDF. Se sair: cortar "Baixar PDF" do beta e registrar P0 para o Codex (correção na suíte antes do merge).
4. **Persistência**: emitir → `/app/prescricoes` mostra o registro; bloqueio de revisão final e perfil de assinatura ativos (gate 0.7); offline → aviso de falha, não silêncio.
5. **PWA/rotas**: `curl -s -o /dev/null -w "%{http_code}" https://<domínio>/app-icon-192.png` = 200; instalar no Android; deep links `/app/historico`, `/d/<token>`, `/escore/<token>` abrem direto.
6. **Gate Pro no servidor**: conta sem assinatura não grava em `notificacoes_compulsorias` nem usa chat IA (1.9); conta Pro flui.

## Próxima ação única
- **Commitar e deployar** o estado atual (HEAD + assets/scripts de release + mudanças não commitadas do Codex/Trae preservadas) e executar o smoke T1–T6 na produção — se T3 falhar, cortar "Baixar PDF" e seguir com beta; em paralelo, curadores (Q9) começam o lote de ambientes Ambulatorial/Urgências e as 10 síndromes do passo 0.8 (pacote NotebookLM já pronto em `PROMPT_PACK_NOTEBOOKLM_DADOS.md`).
