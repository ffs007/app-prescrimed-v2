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
**Ligar `saveGeneratedDocument` nas 3 rotas de emissão do `Dashboard.tsx` e validar persistência real** (handleEmit para docs não-receita + handlePrintGroup + handleDownloadGroup para receita). Resolve 1 P0 inteiro, completa o ciclo do histórico, e é o único patch que toca menos de 50 linhas com impacto direto no fechamento do happy path clínico. Após este patch, aplicar o corte do botão Assinar/CTA Entrar/voz-texto já reduz o tempo do médico de PS em cerca de 30-45 segundos por atendimento.
