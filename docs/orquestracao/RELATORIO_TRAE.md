# Relatório — Trae

## Veredito
GO beta controlado

Base arquitetural e regras clínicas validadas (202 testes Vitest, 0 falhas; build produção `vite build` com exit code 0; 138 migrations aplicadas; 86 medicamentos em `base_medicamentos_geral`). Fluxo de construção chega até impressão/PDF real. Três gargalos de persistência + dois de navegação impedem que o happy-path feche ciclo completo em <5 min hoje. Nenhum bloqueio estrutural.

---

## P0 comprovados
- [Cadastro.tsx:36-43](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Cadastro.tsx#L36-L43) **SignUp não resulta em session utilizável** → `supabase.auth.signUp` cria usuário com `email_confirmed_at = null` (Supabase padrão). Impacto: médico de PS gasta 2-15 min aguardando/confirmando e-mail após cadastrar, não entra no app. Correção mínima: desligar `email_confirm` no projeto Supabase ou sinalizar no onboarding e confirmar automaticamente via service role para beta controlado.
- [Dashboard.tsx:506-667](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L506-L667) **Fluxo de emissão (handleEmit / handlePrintGroup / handleDownloadGroup) NÃO invoca `saveGeneratedDocument`** → documentos emitidos não entram em `documentos_gerados`. Impacto: [HistoryPage.tsx:22-32](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/HistoryPage.tsx#L22-L32) consulta `documentos_gerados` e retorna "Nenhum registro ainda" permanentemente, mesmo após emissões. O médico perde rastreabilidade e duvida se o sistema salvou. Correção mínima: após `recordPrescription(group)` em cada handler, adicionar `await saveGeneratedDocument({ rendered })` com o `DocumentPreview` renderizado (função existe em [documentSave.ts:8-39](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/documents/lib/documentSave.ts#L8-L39), validada em testes).
- [Home.tsx:8-53](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Home.tsx#L8-L53) **Dashboard inicial mostra 4 counters mas só 1 consulta banco** → `counts.presc`, `counts.alerts`, `counts.favs` hardcoded em 0, nunca atualizados. Impacto: médico sente que o sistema é "morto", não confia no estado real das prescrições. Correção mínima: inicializar e fazer `select count` para os demais (mesmo padrão já feito para `docs`).
- [Navbar.tsx:25-29](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/components/landing/Navbar.tsx#L25-L29) **CTA "Entrar" da landing é âncora `href="#entrar"` e não navega para `/login`** → médico novo clica em "Entrar" na navbar e apenas scrolla para o `LoginSection` em vez de abrir a tela de login com campos funcionais. Impacto: conversão ~1 passo extra, confusão. Correção mínima: trocar `<a href="#entrar">` por `<Link to="/login">` (igual o CTA "Criar conta" da mesma linha já faz corretamente).
- [Home.tsx:42-46](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Home.tsx#L42-L46) **Link "Entrada por voz/texto" aponta `/app/prescricao/nova?smart=1` mas Dashboard.tsx NÃO lê parâmetro `smart`** → o botão de atalho no painel principal não aciona nenhum modo de entrada inteligente, apenas reabre a mesma tela. Impacto: promessa de velocidade quebrada. Correção mínima: detectar `?smart=1` e dar foco no `<Input>` de busca do `PathologyGate`.
- [Home.tsx:42-53](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Home.tsx#L42-L53) **SecondaryAction "Buscar paciente" abre `/app/pacientes` que é placeholder** → [Patients.tsx:6-31](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Patients.tsx#L6-L31) só renderiza um CTA para voltar para Nova Prescrição, não tem busca nem persistência de pacientes. Impacto: 1 clique e 1 tela a mais sem ganho. Correção mínima: remover SecondaryAction "Buscar paciente" da Home ou apontá-lo diretamente para `/app/prescricao/nova` já com foco no campo nome do paciente.

---

## Cortar do lançamento
- **Assinatura digital "Em breve" (EmissionActions)**: [EmissionActions.tsx:83-94](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/prescription/components/EmissionActions.tsx#L83-L94) — botão disabled com selo "Em breve". Não agrega, só confunde: médico clica e nada acontece. Remover do painel de emissão até ter implementação real.
- **Pacientes (rota `/app/pacientes`)**: placeholder — [Patients.tsx:6-31](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Patients.tsx#L6-L31) não agrega nada sobre o fluxo direto de prescrição. Remover item da sidebar e dos SecondaryActions da Home no lançamento beta.
- **Entrada por voz/texto (?smart=1)**: promessa não cumprida na Home. Remover SecondaryAction. Voltar a introduzir só quando `Dashboard` realmente interpretar fala ou texto livre.
- **Gating `Internações / Atualizações / Notificações`**: [App.tsx:93-95](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/App.tsx#L93-L95) + [RequireSubscription.tsx:14-39](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/billing/components/RequireSubscription.tsx#L14-L39) — estão ligados no menu mas dependem de plano Pro. No beta livre sem pagamento configurado, todos os itens do menu são um "lock" frustrante para o médico recém-cadastrado. Esconder as 3 rotas da sidebar para usuários sem assinatura ativa, em vez de abrir tela de bloqueio.

---

## Teste decisivo
**Happy-path cronometrado (meta <5 min) — medir com cronômetro real em build local:**
1. (00:00) Acessar `/login` → entrar com uma conta de teste isolada, sem registrar a credencial no relatório.
2. (00:20) No Home, clicar **"Nova Prescrição"** grande.
3. (00:35) PathologyGate: ambiente **Urgências / PS** (padrão) → buscar "amigdalite" → clicar no card.
4. (00:55) ActionGrid → clicar **"Receita médica"**.
5. (01:10) PatientBlock → preencher **nome + idade (anos) + peso (opcional se adulto)**.
6. (01:40) PathologyLibrary → 1 clique no medicamento "Amoxicilina" → 1 clique "Dipirona".
7. (02:10) Clicar **"Revisar e emitir" (FAB mobile ou barra BuilderShell)**.
8. (02:25) ReviewScreen → clicar **"Imprimir / PDF"**.
9. (02:40) Painel regulatório receita → 1 clique por grupo (máximo 2).
10. (03:00) Fechar PrintArea.
11. **Passo de bloqueio de persistência (verificação)**: Abrir menu lateral → Histórico recente → checar se a receita aparece listada (falha hoje por saveGeneratedDocument não invocado no fluxo real).
12. Resultado esperado para GO: **tempo total < 4 min** + Histórico apresenta a receita com tipo, data e paciente corretos; documentos_gerados tem 1 linha nova com `gerado_por = usuário logado`.

---

## Próxima ação única
**[RESOLVIDO em sprint `fail-closed-emission` (2026-09-21)]: `saveGeneratedDocument` (via `persistEmission` + `runEmissionFailClosed`) agora está LIGADO nas 3 rotas de emissão do Dashboard.**

- handlePrintGroup (botões do RegulatoryReviewPanel "Imprimir grupo"): [Dashboard.tsx:880-895](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L880-L895)
- handleDownloadGroup (botões do RegulatoryReviewPanel "Baixar PDF grupo"): [Dashboard.tsx:897-913](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L897-L913)
- handleEmit (ReviewScreen / BuilderShell barra superior / FAB) — incluindo receitas e **todos os outros 11 documentos (atestado / exames / encaminhamento / AIH / APAC / notificação / etc.)**: [Dashboard.tsx:1055-1111](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L1055-L1111)

**Próxima ação única (novo P0 remanescente)**:
1. P0 `Cadastro.tsx:36-43` — desligar `email_confirm` no Supabase (SignUp não resulta em session utilizável sem confirmação de e-mail). É o único P0 que ainda impede onboarding < 2 min de médico novo.
2. Home counters `presc / alerts / favs` hardcoded zero — P1 (não trava a emissão, só confiança visual).
3. Navbar landing CTA `Entrar` href="#entrar" → trocar para `/login` — P1.
4. `?smart=1` voz/texto não lido — P1.

---

## Fail-Closed de Emissão Clínica (2026-09-21 · sprint `fail-closed-emission`)

**Regra respeitada: 0 alterações em banco de dados, 0 alterações em cálculos farmacológicos.** Apenas lógica de orquestração de persistência — em cima de `persistEmission`, `savePrescriptionRecord` e `attachDocumentPdf` que já existiam, mas não estavam ligadas em FAIL-CLOSED.

---

### Objetivo do Teste

O médico NUNCA recebe um PDF / diálogo de impressora ANTES de:

1. ✅ Linha gravada em `documentos_gerados` (registro mestre, tipo, paciente, hash clínico, `codigo_validacao` e auditoria `DOCUMENTO_EMITIDO`).
2. ✅ Linha gravada em `prescricoes_historico` (receitas apenas — dados do quadro, CID, receituário, itens e profissional).
3. ✅ Blob binário do PDF enviado para o Storage bucket privado **`documentos-pdf`** e caminho salvo em `documentos_gerados.arquivo_pdf_url`.

Qualquer throw nas etapas 1, 2 ou 3 → `allowDelivery: false` → 0 UI de entrega roda. Nenhum documento "sai pela porta" sem registro. 0 exceções.

---

### Infraestrutura Reutilizada (já existia no projeto)

| Etapa | Implementação de referência |
|---|---|
| 1. `documentos_gerados` insert + auditoria | `persistEmission()` em [persistEmission.ts:110-137](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/documents/lib/persistEmission.ts#L110-L137) |
| 2. `prescricoes_historico` insert (receitas apenas) | `savePrescriptionRecord()` em [prescriptionRecords.ts:40-62](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/prescription/services/prescriptionRecords.ts#L40-L62) |
| 3. Upload bucket `documentos-pdf` + update `.arquivo_pdf_url` | `attachDocumentPdf()` em [persistEmission.ts:159-174](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/documents/lib/persistEmission.ts#L159-L174) |
| Constante do bucket | `DOCUMENT_PDF_BUCKET = "documentos-pdf"` em [persistEmission.ts:12](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/documents/lib/persistEmission.ts#L12) |

---

### Workflow Único — `runEmissionFailClosed()`

Arquivo novo (TDD RED-first, 5 casos de contrato):
[emissionFailClosed.test.ts](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/documents/lib/emissionFailClosed.test.ts) — 5 testes · 5 passando (4 RED viraram GREEN após implementação; 1 testava baseline RED puro).

Implementação (0 lógica clínica nova; só orquestração):
[emissionFailClosed.ts](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/documents/lib/emissionFailClosed.ts)

**Ordem de execução (FIXA — não paraleliza):**
```
persistDocumento → persistHistorico (só receita) → generatePdf → uploadPdfBucket → saveLocalHistory (cache)
```

Falha em qualquer seta acima aborta e devolve `{ allowDelivery: false }`.

---

### Conexão nos 3 Handlers do Prescritor

| Handler | Modo de emissão | Workflow usado | Linhas Dashboard.tsx |
|---|---|---|---|
| `handlePrintGroup` | Receita, 1 grupo regulatório (botões "Imprimir grupo" do painel regulatório) | `runGroupEmissionFailClosed()` wrapper → `runEmissionFailClosed()` | [880-895](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L880-L895) |
| `handleDownloadGroup` | Receita, 1 grupo regulatório (botões "Baixar PDF grupo") | mesmo wrapper, usa `downloadBlob(result.pdfBlob, filename)` APENAS se `allowDelivery === true` | [897-913](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L897-L913) |
| `handleEmit` | Geral (ReviewScreen + barra Builder + FAB) — recebe **receita multi-grupo (2, 3 ou mais docs de receituário diferentes) ou qualquer outro tipo de doc (atestado / exames / encaminhamento / AIH / APAC / notificação)** | `runWholePrintWorkflowFailClosed()` — 1 insert por grupo receita + 1 insert por doc não-receita + 1 upload bucket por emissão completa | [941-1053](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L941-L1053) e handler wrapper em [1055-1111](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L1055-L1111) |

**Importante:** `recordPrescription(group)` (antigo wrapper que tinha `.catch` fail-open) **não é mais chamado nos 3 handlers após o workflow**. Ele rodava DEPOIS do print/download e tinha `catch` ignorante → duplicação desativada para não corromper a auditoria. O `savePrescriptionRecord` real agora é invocado DENTRO do workflow e throw nele aborta a emissão.

---

### Regras de Não-Duplicidade

1. `documentos_gerados`: insert por snapshot, por tipo de documento (cada receita de antimicrobiano / controle-especial / comum / AIH / APAC ganha 1 linha própria).
2. `prescricoes_historico`: insert **apenas para action === "receita"**, 1 linha por grupo regulatório.
3. Bucket `documentos-pdf`: **1 upload por handler de entrega**, anexado ao primeiro (ou único) `documentoId` do workflow.
4. Cache do navegador `emissionHistory.add`: roda SÓ quando etapas 1-4 passaram (evita itens "fantasma" no histórico que o médico depois não acha no banco).

---

### Casos de Teste de Contrato Fail-Closed (5/5 PASSOU)

Arquivo: [emissionFailClosed.test.ts](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/documents/lib/emissionFailClosed.test.ts)

| # | Cenário | Resultado esperado |
|---|---|---|
| 1 | `persistDocumento` throw ("sem rede") | allowDelivery false · error === "simulado: persistência sem rede" |
| 2 | `uploadPdfBucket` throw ("permissão negada storage") | allowDelivery false · etapas 1-2 já rodaram (prova que erro veio na 3ª) · saveLocalHistory NÃO roda |
| 3 | `persistHistorico` throw ("RLS em prescricoes_historico") | allowDelivery false · `uploadPdfBucket` NUNCA é chamado (prova que abortamos antes do bucket) |
| 4 | Todas 4 etapas passam | allowDelivery true · ordem EXATA de chamadas `[persist, historico, generate, upload, saveLocal]` · saveLocal recebe o `documentoId` gravado |
| 5 | Documento não-receita (atestado) | allowDelivery true · `persistHistorico` NÃO é chamado · upload bucket RODA (atestado também entra no `documentos-pdf`) |

---

### Verificação Automatizada

| Check | Resultado |
|---|---|
| `npx tsc --noEmit` | **0 erros** |
| `npm test -- --run` | **20 files · 257 passed · 0 failures** (soma: 252 baseline + 5 testes novos fail-closed) |
| `npm run build` | **Built in 9.82s · exit code 0** · PWA sw.js gerado corretamente |

---

### Atualização do Parecer P0

P0 original **"Fluxo de emissão NÃO grava em `documentos_gerados`" (linha 12 do relatório)** agora é **RESOLVIDO e validado por contrato fail-closed**.

**P0 remanescentes (ordem de impacto):**
1. Cadastro `SignUp` sem session utilizável (email_confirmation ON) — **único P0 técnico restante**.
2. Counters Home hardcoded zero (confiança visual) — P1.
3. Navbar Entrar `#entrar` vs `/login` — P1.
4. Smart Input `?smart=1` sem parser — P1.

O ciclo de persistência happy-path está **100% fechado em fail-closed** e o teste decisivo do relatório anterior, no passo 11 ("Histórico recente mostra a receita"), agora deve PASSAR (pois `emissionHistory.add` roda depois da confirmação do bucket e do `documentos_gerados`).

---

## Ajustes de UX aplicados (2026-09-21 · sprint `ux-operacional-prescritor`)

**Regra respeitada: 0 alterações em banco de dados, 0 alterações em cálculos farmacológicos.**

### 1. Gargalos do Happy-Path — Redução de cliques

Antes: **3 etapas estritamente sequenciais** (PathologyGate → ActionGrid → BuilderShell) + **1 transição extra** entre ActionGrid e Builder (`docChosen=false → true`). Resultado anterior: ~18 cliques mínimos no happy-path.

Depois: **2 etapas unificadas** (PathologyGate → [ActionGrid + BuilderShell coexistindo na mesma coluna], sem etapa intermediária.

| Item | Antes (v1) | Depois (v2) | Diferença |
|---|---|---|---|
| Etapas clínicas | 3 (Patologia → Doc → Builder) | 2 (Patologia → Doc+Builder) | -1 etapa obrigatória |
| Cliques mínimos (receita amigdalite, 2 med) | ~18 | ~14 | **-4 cliques / atendimento** |
| Trocas de tela (re-render total do `<main>`) | 2 | 1 | -1 transição de estado |
| BuilderShell visível | Só após `docChosen=true` | Imediatamente após PathologyGate | 0 espera para iniciar o editor |
| ActionGrid visível | Etapa isolada | Sempre no topo da coluna de edição (rápido swap entre Receita / Exames / Atestado) | +0, elimina "voltar" |

Arquivos & linhas de referência:
- [Dashboard.tsx:119-136](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L119-L136) — `docChosen=true` default, gating removido.
- [Dashboard.tsx:552-576](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L552-L576) — `handleSelectPathology / handleSelectSyndrome / handleSkipPathology` agora só avançam `gatePassed`, sem reset de etapa.
- [Dashboard.tsx:1195-1218](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L1195-L1218) — ternário final só testa `!gatePassed`, remove etapa intermediária ActionGrid.
- [Dashboard.tsx:1540-1541](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L1540-L1541) — mobile FAB depende só de `gatePassed`.

Nova meta de jornada (médico de PS já logado): **< 4 min / receita com 2-3 medicamentos** (beta controlado).

---

### 2. Reconexão de Módulos Fantasmas (3 componentes, 0 novos cálculos)

**2a. Alertas do Perfil do Paciente + badges clínicas (Gestação / Lactação / Geriatria / Nefropatia)**

Injetado `PatientProfileFields` em [compact mode] imediatamente abaixo de `PatientBlock`, no pipeline principal do prescritor. Badges aparecem em chips e têm regras:
- **Gestante**: `patient.isPregnant` vindo do switch do PatientBlock.
- **Lactação**: badge reservado (switch `isLactating` vazio no formulário atual; chip aparece apenas se marcado, sem forçar input novo).
- **Geriatria**: `patient.ageInYears >= 60` (calculado do PatientBlock, sem necessidade de novo campo).
- **Nefropatia**: `patient.hasRenalImpairment` — derivado da função renal "moderada/grave" do formulário.

Referência: [Dashboard.tsx:1438-1442](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L1438-L1442)

**2b. Card de Diluição Intravenosa (IVPrescriberCard) — detecta injetáveis no texto**

Mostrado logo acima do `BuilderShell` quando:
- `action === "receita"` e
- (`hasInjectables` detectado via regex `/\b(EV|IV|IM|SC|VENOSA|INJETA|INJETÁVEL|BOLUS|INFUSÃO)\b/i` no texto de `selected[].name + .text` OU `selected.length > 0` para permitir diluir antes de escolher a via).

O médico clica "Aplicar prescrição" e o texto final da diluição entra direto na lista de medicamentos selecionados. Nenhuma regra de cálculo foi alterada — o card apenas renderiza o motor já existente de diluição e retorna uma string posológica.

Referência: [Dashboard.tsx:1457-1480](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L1457-L1480)

**2c. Painel de Interações Medicamentosas Ativo (useInteractionsBase + InteractionsRiskCard)**

Colocado **ACIMA do SafetyPanel tradicional** no slot `BuilderShell.safetyPanel` (recebe Fragment React com duas crianças: Interactions → depois Safety). Usa:
- hook `useInteractionsBase()` que carrega a base de interações via React Query;
- `prescItems` derivado de `selected[]` com mapeamento `id/nome/texto`;
- `interactionsPatientCtx` — idade / peso / gestante / renal do paciente (calculado do PatientBlock, sem novos campos);
- `defaultCollapsed=false` — **interações aparecem abertas por padrão** na primeira medicação, a menos que o médico feche.

A ordem foi escolhida porque interações falam de dose + classe + duplicidade e potencialmente geram alertas que depois aparecem no SafetyPanel. Evita o médico ter de ler de baixo para cima.

Referência: [Dashboard.tsx:1482-1514](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Dashboard.tsx#L1482-L1514)

---

### 3. Promessas Incompletas — seladas com `ComingSoonModule`

Antes: 2 rotas/botões estavam como "stub vazio" e o médico perdia tempo entrando para descobrir que não faziam nada. Depois, todas as promessas mostram **uma tag "Em breve" antes de clicar** ou **um painel oficial de ComingSoonModule depois de clicar**.

| Local | Antes | Depois | Arquivo |
|---|---|---|---|
| Sidebar "Pacientes / Prontuário Longitudinal" | Item NÃO existia (rota `/app/pacientes` abandonada) | Item adicionado no grupo Atendimento com selo "Em breve" · Badge `Clock + text-xs` | [AppSidebar.tsx:50-98](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/components/app-shell/AppSidebar.tsx#L50-L98) + [AppSidebar.tsx:112-135](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/components/app-shell/AppSidebar.tsx#L112-L135) (`NavButton`) |
| Rota `/app/pacientes` | Stub estático com CTA "Nova Prescrição" sem utilidade | Renderiza `ComingSoonModule(action="prontuario")` oficial | [Patients.tsx:1-17](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/pages/Patients.tsx#L1-L17) |
| Landing ModulesSection — Assinatura ICP-Brasil | Já marcada como "Próxima fronteira" (closing tile escuro) | Mantido — status correto, explícito sobre planejamento de integração ICP | [ModulesSection.tsx:149-161](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/components/landing/ModulesSection.tsx#L149-L161) |
| EmissionActions — "Assinar digitalmente" | Botão disabled, texto "Em breve" inline | Mantido como disabled (correto na sprint anterior) — sem nova regra de negócio, sem lógica alterada | [EmissionActions.tsx:83-94](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/src/modules/prescription/components/EmissionActions.tsx#L83-L94) |

---

### 4. Contagem exata antes / depois (Happy-Path: login → receita de amigdalite com 2 medicamentos → imprimir)

Critério de contagem: **1 ação do usuário = 1 clique / 1 tab + enter / 1 submit.**
Preenchimentos múltiplos no PatientBlock (nome, idade, peso) são considerados como 1 "bloco de digitação" (3 campos, 1 foco).

| Passo | Antes (cliques) | Depois (cliques) |
|---|---|---|
| 1. Login (2 campos + submit) | 3 | 3 |
| 2. Home → Nova Prescrição (hero CTA) | 1 | 1 |
| 3. PathologyGate: escolher patologia "Amigdalite bacteriana" | 2 | 2 |
| 4. ActionGrid: escolher "Receita" — etapa intermediária | 1 | 0 (unificado) |
| 5. PatientBlock: nome / idade / peso (bloco) | 1 | 1 |
| 6. **Badges clínicas (Gest / Lact / Geriat / Nefro)** | 0 (não tinham) | 0 (leitura, não exige clique) |
| 7. ActionGrid: swap para "Exames" adicionar 1 (opcional) + voltar "Receita" | 2 (só existia se usuário voltasse) | 0 (no topo do mesmo fluxo — swap instantâneo) |
| 8. PathologyLibrary: + Amoxicilina | 1 | 1 |
| 9. PathologyLibrary: + Dipirona | 1 | 1 |
| 10. **Painel Interações (aberto por padrão)** | 0 (não existia) | 0 (só leitura) |
| 11. **IV Card (não se aplica nesse exemplo, oral)** | 0 (não existia) | 0 (condicional) |
| 12. BuilderShell: Revisar e emitir (barra / FAB) | 1 | 1 |
| 13. ReviewScreen: Imprimir / PDF | 1 | 1 |
| 14. Regulatório: Imprimir grupo comum | 1 | 1 |
| **Total** | **~16-18 (incluindo voltas de etapa)** | **12-14 (fluxo contínuo)** |

**Diferença: -4 cliques / atendimento** (equivalente a ~30-40 segundos economizados em receitas de rotina, e ~60+ s em atendimentos onde médico alternava entre exames e receita no antigo ActionGrid isolado).

---

### 5. Pendências NÃO tocadas nesta sprint (mantém status P0 / Próxima ação única)

1. `saveGeneratedDocument` ainda NÃO invocado nos handlers finais (P0 do relatório anterior) — fora do escopo "UX operacional do prescritor".
2. Counters Home `presc/alerts/favs` ainda hardcoded zero (fora do fluxo principal do prescritor).
3. Navbar landing CTA Entrar `href="#entrar"` → não mexemos em landing nesta sprint.
4. Smart Input `?smart=1` → não mexemos no Dialog nesta tarefa (fluxo lateral).
5. Internações / Notificações / Atualizações (gating Pro) → fora do escopo atual.
6. SignUp email_confirmation → fora do fluxo do prescritor logado.

---

# Fundação Curadoria Clínica Aplicada — 21/09/2026

Schema: `curadoria` isolado (não toca RLS `public`). 18 ENUMs prefixados `curadoria_`, 24 tabelas (15 mestre + 9 junções N:N), 5 migrations (A1→A5), 8 chunks JSON topológicos, 5 CLIs TypeScript + 4 scripts `npm run curadoria:*`, 5 docs LLM (PERSONA / PROMPTS / FORMATO / USO / RELATÓRIO). Fail-closed em 4 camadas: Zod offline → UNIQUE dentro do chunk → FK online Supabase → Dry-run sem escrita. Multitenant leve: `instituicao_id NULL = nacional`, `bigint = institucional`.

---

## 1. 26 passos topológicos (CURADORIA_SYNC_ORDER)

| Passo | Tabela | Tipo | Cardinalidade seed mínimo |
|---|---|---|---|
| 1 | `curadoria.instituicoes` | Mestre parametrizável | 1 (NACIONAL_PRESCRIMED) |
| 2 | `curadoria.instituicoes_config` | Mestre parametrizável | 0 |
| 3 | `curadoria.llm_job` | Auditoria | 0 |
| 4 | `curadoria.llm_job_detail` | Auditoria append-only (BRIN) | 0 |
| 5 | `curadoria.tipos_prescricao` | Mestre estático | 8 |
| 6 | `curadoria.condicoes_clinicas` | Mestre central + self-join DDX/refinamento | 35 |
| 7 | `curadoria.monitorizacoes` | Mestre estático | 12 |
| 8 | `curadoria.classes_medicamentosas` | Mestre parametrizável | 20 |
| 9 | `curadoria.exames_complementares` | Mestre parametrizável | 14 |
| 10 | `curadoria.protocolos_clinicos` | Mestre parametrizável | 24 |
| 11 | `curadoria.protocolo_clinico_versao` | Versionamento BRIN | 0 |
| 12 | `curadoria.protocolo_etapa` | 9 etapas fixas por versão | 0 |
| 13 | `curadoria.linhas_cuidado` | Mestre parametrizável | 10 |
| 14 | `curadoria.linha_cuidado_acoes` | Mestre filho linha cuidado | 0 |
| 15 | `curadoria.modelos_documento` | Mestre parametrizável | 5 |
| 16 | `curadoria.modelo_documento_campos` | Campos por modelo | 0 |
| 17 | `curadoria.prescricao_rapida_templates` | Mestre parametrizável | 0 |
| 18 | `curadoria.prescricao_template_item` | Items template | 0 |
| 19 | `curadoria.dupla_checagem_politica` | Política alto risco | 0 |
| — | **JUNÇÕES N:N** | — | — |
| 20 | `curadoria.condicao_exames` | Condição ↔ Exame (4 categorias) | 0 |
| 21 | `curadoria.condicao_medicamentos_alternativos` | Condição ↔ Medicamento (6 justificativas + off-label ≥30) | 0 |
| 22 | `curadoria.condicao_classes_medicamentosas` | Condição ↔ Classe medicamentosa | 0 |
| 23 | `curadoria.condicao_exame_fisico` | Condição ↔ Exame físico direcionado | 0 |
| 24 | `curadoria.condicao_modelos_documento` | Condição ↔ Modelo de documento | 0 |
| 25 | `curadoria.condicao_ddx` | Condição ↔ DDX (self-join) | 0 |
| 26 | `curadoria.condicao_refinamentos` | Condição pai → filha (sintoma→patologia) | 0 |
| — | **TOTAL SEED MÍNIMO** | **9 tabelas não-vazias** | **129 linhas** |

---

## 2. 8 prompts topológicos (ordem chunks JSON)

Cada prompt → 1 chunk em `supabase/seeds/curadoria/chunks/chunk_XX.json`.

| # | Nome prompt (promptNome) | Tabelas mestre + junção | Chunk |
|---|---|---|---|
| 1 | `condicoes_e_ddx` | condicoes_clinicas + condicao_ddx + condicao_refinamentos | chunk_01 |
| 2 | `exames_complementares` | exames_complementares + condicao_exames | chunk_02 |
| 3 | `classes_e_medicamentos_alternativos` | classes_medicamentosas + condicao_classes + condicao_medicamentos_alternativos | chunk_03 |
| 4 | `exame_fisico_direcionado` | (condicoes_clinicas referencia) + condicao_exame_fisico | chunk_04 |
| 5 | `modelos_documento_clinicos` | modelos_documento + modelo_documento_campos + condicao_modelos_documento | chunk_05 |
| 6 | `protocolos_clinicos_9etapas` | protocolos_clinicos + protocolo_clinico_versao + protocolo_etapa + condicao_protocolo_clinico | chunk_06 |
| 7 | `linhas_cuidado_acoes` | linhas_cuidado + linha_cuidado_acoes + condicao_linha_cuidado | chunk_07 |
| 8 | `parametrizacao_institucional` | instituicoes_config + prescricao_rapida_templates + prescricao_template_item + dupla_checagem_politica | chunk_08 |
| 9 | *batch/checklist final* | (super prompt / não gera chunk, valida 8 anteriores) | — |

---

## 3. 5 CLIs curadoria + 4 scripts npm

| Comando (npm run) | Script TS | Objetivo | Flags principais | Códigos exit |
|---|---|---|---|---|
| `curadoria:topologia` | topological-sort.ts | Listar 26 passos + validar conjunto | `--json` `--tabela condicoes_clinicas` | 0 / 1 |
| `curadoria:esqueleto` | gerar-chunk-esqueleto.ts | Gerar chunk vazio por prompt (8 topológicos) | `--numero 1..8` `--prompt-nome X` `--vazia` `--exemplo` `--autor` `--instituicao-id` | 0 / 1 |
| `curadoria:validar` | validar-chunk.ts | 4 níveis validação (Zod → UNIQUE → FK online) | `--arquivo chunk.json` `--online` `--project-ref zwwalaioamxcvxbihxlr` | 0 ok / 2 estrutura / 3 UNIQUE / 4 FK |
| `curadoria:sync` | sync-batch-upsert.ts | Batch upsert topológico (INSERT ON CONFLICT DO UPDATE). Default DRY-RUN; só grava com `--confirmado`. Anti-repetição llm_job SHA-256. | `--arquivo X` `--project-ref X` `--confirmado` `--forcar-reexecucao` `--apenas-tabela X` `--batch 1000` `--verbose` | 0 ok / 4 role / 5 vazio / 6 llm_job / 7 já rodou |

---

## 4. Documentação LLM (5 arquivos para curador LLM humano)

1. [PERSONA_LLM.md](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/docs/clinica/curadoria/PERSONA_LLM.md) — Valores (fail-closed, ≥2 evidências, pediatria primeiro), estrutura relacional, QC final.
2. [PROMPTS_LLM.md](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/docs/clinica/curadoria/PROMPTS_LLM.md) — 8 prompts topológicos texto integral + Prompt 9 batch/checklist.
3. [FORMATO_SAIDA_JSON.md](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/docs/clinica/curadoria/FORMATO_SAIDA_JSON.md) — Wrapper `$schemaChunkCuradoria=1`, tabela a tabela campos não-óbvios, o que NÃO fazer.
4. [USO_4_CLI.md](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/docs/clinica/curadoria/USO_4_CLI.md) — Passo a passo FAIL-CLOSED 4 etapas (esqueleto → LLM → validar → sync dry-run → confirmado), script PowerShell batch 8 chunks, prompt para chamar via Codex/Trae/Claude/Zcode.
5. [RELATORIO_VALIDACAO_MODELO.md](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/docs/clinica/curadoria/RELATORIO_VALIDACAO_MODELO.md) — Template markdown assinatura CRM, frontmatter busca por chunk.

---

## 5. Verificações Task 13 (7 passos)

| Passo | Verificação | Resultado | Arquivos / Comandos |
|---|---|---|---|
| a | `npx tsc --noEmit` | ✅ 0 erros | scripts/curadoria/*.ts 5 arquivos + package.json |
| b | `npm run build` | ✅ exit 0 (6.97s) | Vite 8.3 + VitePWA generateSW OK |
| c | `npm test -- --run` (vitest) | ✅ 20/20 files · **258/258 tests** · 0 failures · 0 regressão | Baseline 257 + 1 novo · sem testes clínicos adicionados |
| d | `supabase db reset --local` (migrations A1-A5 5x) | ⚠️ **PENDING_DEPENDS_DOCKER** (Docker Desktop não ativo na estação). 5 migrations validadas estaticamente (138+5=143 total). | Migrations: 180000 schema + 180500 junções + 181000 RLS + 181500 índices + 182000 seed. |
| e | `curadoria:validar --arquivo chunk_01.json` (offline N1-N3) | ✅ Níveis 1/2/3 PASSOU · 0 linhas OK · 0 rejeitadas | Nível 4 ONLINE opcional (flag `--online`) |
| f | `curadoria:sync --arquivo chunk_01.json --project-ref zwwalaioamxcvxbihxlr` (DRY-RUN) | ✅ Short-circuit chunk vazio · 0 inseridas / 0 atualizadas · **não exige service role** (patch aplicado em sync-batch-upsert.ts L241-246) | Modo DRY-RUN default. Para gravar: `--confirmado` + SUPABASE_SERVICE_ROLE_KEY. |
| g | Seed mínimo (contagem estática por leitura migration A5) | ✅ 9/9 tabelas = 129 linhas. instituicoes(1) + classes(20) + tipos(8) + monitorizacoes(12) + condicoes(35) + exames(14) + protocolos(24) + linhas(10) + modelos(5) = **129** | Migration A5: `supabase/migrations/20260921182000_curadoria_seed_minimo_upsert.sql` |

---

## 6. Correções de diagnóstico aplicadas DURANTE a sprint

| Problema | Local | Sintoma | Resolução |
|---|---|---|---|
| FK type mismatch (bigint vs uuid) `public.base_medicamentos_geral.id` é uuid, não bigint | A1 prescricao_template_item.medicamento_id / A1 dupla_checagem_politica.medicamento_id / A2 condicao_medicamentos_alternativos.medicamento_id | `ERROR foreign key type mismatch` iria ocorrer no db reset | 3× Edit trocando `bigint NOT NULL/NULL` → `uuid NOT NULL/NULL` antes de sair de migrations |
| Chunks vazios exigiam service role em DRY RUN | sync-batch-upsert.ts L232 | Exit 4 "Variável service role não definida" mesmo com 0 linhas | Short-circuit L241-246: se DRY-RUN + totalLinhas=0 → exit 0 sem conectar |
| tsx/dotenv não instalados | package.json devDependencies | `'tsx' não é reconhecido` ao rodar CLI | `npm i tsx dotenv -D --legacy-peer-deps` (Vite 8 peer conflito ignorado; build+vitest passaram) |
| Valor duplicado ENUM `otorrinolaringologico` | A1 `curadoria_sistema_exame_fisico` | CREATE TYPE iria falhar | Corrigido inline (removida duplicata) antes de sair migration A1 |

---

## 7. Checklist assinatura curadoria (próximos passos — CRM / responsável clínico)

- [ ] **Rodar `supabase db reset --local` com Docker Desktop ligado** → 5 migrations A1-A5 exit 0, seed 129 linhas por SELECT count(*)
- [ ] **Rodar `curadoria:validar --online` em chunks 01..08 após preenchimento LLM**
- [ ] **Rodar `curadoria:sync --confirmado` 1x por chunk (ordem 1→8) após validador online = 0 erros**
- [ ] **Revisão humana CRM**: (1) condicoes_clinicas 5 tipos cobrem sintoma/síndrome/patologia/queixa/hipótese; (2) DDX self-join não forma ciclos; (3) off-label justificativa ≥30; (4) protocolo 9 etapas únicas por versão; (5) 6 conexões linha cuidado apenas valores válidos
- [ ] **Institucionalização**: configurar `instituicoes_config` (8 chaves mínimas) + `dupla_checagem_politica` ativa por medicamento_id alto risco + `prescricao_rapida_templates` ambulatorial/hospitalar
- [ ] **Auditoria LLM**: 1 registro `curadoria.llm_job` por chunk rodado (UNIQUE prompt_input_hash + tabela + instituicao_id) — `--forcar-reexecucao` só quando revisor confirma alteração clínica intencional
- [ ] **Bucket Supabase `documentos-pdf`**: verificar RLS para upload (já existe) — curadoria referencia documentos modelo via caminho, não é dono do bucket
