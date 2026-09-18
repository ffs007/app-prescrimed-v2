/**
 * Etapa 22J — Consolidação final beta.
 * Agrega estado de todos os subsistemas (checklist de lançamento,
 * hardening técnico, testes clínicos V2, pacote beta de medicamentos
 * e qualidade da base) num único veredicto GO/NO-GO auditável.
 *
 * Puro: sem side-effects, sem I/O. A UI consulta as tabelas e envia.
 */

export type SubStatus = "pronto" | "quase_pronto" | "atencao" | "critico" | "sem_dados";

export interface SubSystemSummary {
  key: string;
  label: string;
  status: SubStatus;
  hint: string;
  /** Contadores relevantes para o relatório. */
  metrics: Record<string, number>;
  /** Se true, impede GO global. */
  blocker: boolean;
}

export interface FinalDecision {
  status: "go" | "nogo" | "quase";
  label: string;
  color: string;
  blockers: SubSystemSummary[];
  attention: SubSystemSummary[];
  ready: SubSystemSummary[];
}

const STATUS_ORDER: Record<SubStatus, number> = {
  critico: 0, atencao: 1, quase_pronto: 2, sem_dados: 3, pronto: 4,
};

/* -------- Sub-avaliadores -------- */

export function summarizeLancamento(items: Array<{
  status: string; criticidade: string; bloqueante: boolean;
}>): SubSystemSummary {
  if (items.length === 0) {
    return { key: "lancamento", label: "Checklist de lançamento", status: "sem_dados",
      hint: "Nenhum item carregado.", metrics: { total: 0 }, blocker: true };
  }
  let bloqueiaGo = 0, aprovados = 0, pendencias = 0;
  for (const it of items) {
    const critical = it.bloqueante || it.criticidade === "alta";
    if (critical && (it.status === "bloqueante" || it.status === "precisa_ajuste" || it.status === "pendente")) bloqueiaGo++;
    if (it.status === "aprovado" || it.status === "nao_aplicavel") aprovados++;
    else pendencias++;
  }
  const metrics = { total: items.length, aprovados, pendencias, bloqueiaGo };
  if (bloqueiaGo > 0) return { key: "lancamento", label: "Checklist de lançamento", status: "critico",
    hint: `${bloqueiaGo} item(ns) crítico(s) impedem o GO.`, metrics, blocker: true };
  if (aprovados === items.length) return { key: "lancamento", label: "Checklist de lançamento", status: "pronto",
    hint: "Todos os itens aprovados.", metrics, blocker: false };
  return { key: "lancamento", label: "Checklist de lançamento", status: "quase_pronto",
    hint: `${pendencias} pendência(s) não crítica(s).`, metrics, blocker: false };
}

export function summarizeHardening(items: Array<{
  status: string; criticidade: string;
}>): SubSystemSummary {
  if (items.length === 0) {
    return { key: "hardening", label: "Hardening técnico", status: "sem_dados",
      hint: "Nenhum item carregado.", metrics: { total: 0 }, blocker: true };
  }
  let bloq = 0, pend = 0, apr = 0;
  for (const it of items) {
    const critical = it.criticidade === "alta";
    if (critical && (it.status === "bloqueante" || it.status === "precisa_ajuste")) bloq++;
    if (critical && (it.status === "pendente" || it.status === "em_teste")) pend++;
    if (it.status === "aprovado" || it.status === "nao_aplicavel") apr++;
  }
  const metrics = { total: items.length, aprovados: apr, criticosBloqueantes: bloq, criticosPendentes: pend };
  if (bloq > 0) return { key: "hardening", label: "Hardening técnico", status: "critico",
    hint: `${bloq} item(ns) crítico(s) marcado(s) como bloqueante ou precisa ajuste.`, metrics, blocker: true };
  if (pend > 0) return { key: "hardening", label: "Hardening técnico", status: "atencao",
    hint: `${pend} item(ns) crítico(s) ainda pendente(s).`, metrics, blocker: false };
  if (apr === items.length) return { key: "hardening", label: "Hardening técnico", status: "pronto",
    hint: "Todos os itens aprovados.", metrics, blocker: false };
  return { key: "hardening", label: "Hardening técnico", status: "quase_pronto",
    hint: `${items.length - apr} pendência(s) não crítica(s).`, metrics, blocker: false };
}

export function summarizeTestesV2(items: Array<{
  status_teste: string; critico: boolean;
}>): SubSystemSummary {
  if (items.length === 0) {
    return { key: "testes", label: "Testes clínicos", status: "sem_dados",
      hint: "Nenhum caso carregado.", metrics: { total: 0 }, blocker: true };
  }
  const criticos = items.filter(i => i.critico);
  const critReprov = criticos.filter(i => i.status_teste === "reprovado").length;
  const critPend = criticos.filter(i => ["pendente", "precisa_ajuste"].includes(i.status_teste)).length;
  const critOk = criticos.filter(i => ["aprovado", "corrigido"].includes(i.status_teste)).length;
  const metrics = { total: items.length, criticos: criticos.length, critReprov, critPend, critOk };
  if (critReprov > 0) return { key: "testes", label: "Testes clínicos", status: "critico",
    hint: `${critReprov} teste(s) crítico(s) reprovado(s).`, metrics, blocker: true };
  if (critPend > 0) return { key: "testes", label: "Testes clínicos", status: "atencao",
    hint: `${critPend} teste(s) crítico(s) pendente(s).`, metrics, blocker: true };
  if (critOk === criticos.length && criticos.length > 0) return { key: "testes", label: "Testes clínicos",
    status: "pronto", hint: `${critOk}/${criticos.length} testes críticos aprovados.`, metrics, blocker: false };
  return { key: "testes", label: "Testes clínicos", status: "quase_pronto",
    hint: "Casos não críticos ainda em avaliação.", metrics, blocker: false };
}

export function summarizePacoteBeta(items: Array<{
  status: string; obrigatorio: boolean;
}>): SubSystemSummary {
  if (items.length === 0) {
    return { key: "pacote", label: "Pacote beta de medicamentos", status: "sem_dados",
      hint: "Sem itens cadastrados.", metrics: { total: 0 }, blocker: false };
  }
  const obrig = items.filter(i => i.obrigatorio);
  const obrigFalt = obrig.filter(i => i.status !== "cadastrado" && i.status !== "revisado").length;
  const obrigOk = obrig.length - obrigFalt;
  const metrics = { total: items.length, obrigatorios: obrig.length, obrigatoriosOk: obrigOk, obrigatoriosFaltando: obrigFalt };
  if (obrigFalt > 0) return { key: "pacote", label: "Pacote beta de medicamentos", status: "atencao",
    hint: `${obrigFalt} obrigatório(s) faltando.`, metrics, blocker: obrigFalt > obrig.length * 0.2 };
  return { key: "pacote", label: "Pacote beta de medicamentos", status: "pronto",
    hint: `${obrigOk}/${obrig.length} obrigatórios prontos.`, metrics, blocker: false };
}

export function summarizeQualidade(criticos: number, alertas: number, total: number): SubSystemSummary {
  if (total === 0) {
    return { key: "qualidade", label: "Qualidade da base", status: "sem_dados",
      hint: "Análise ainda não executada.", metrics: { criticos: 0, alertas: 0, total: 0 }, blocker: false };
  }
  const metrics = { criticos, alertas, total };
  if (criticos > 0) return { key: "qualidade", label: "Qualidade da base", status: "critico",
    hint: `${criticos} erro(s) crítico(s) na base.`, metrics, blocker: true };
  if (alertas > 0) return { key: "qualidade", label: "Qualidade da base", status: "quase_pronto",
    hint: `${alertas} alerta(s) leve(s) — beta liberado.`, metrics, blocker: false };
  return { key: "qualidade", label: "Qualidade da base", status: "pronto",
    hint: "Sem alertas na base.", metrics, blocker: false };
}

/* -------- Decisão final -------- */

export function computeFinalDecision(subs: SubSystemSummary[]): FinalDecision {
  const blockers = subs.filter(s => s.blocker && (s.status === "critico" || s.status === "atencao" || s.status === "sem_dados"));
  const attention = subs.filter(s => !s.blocker && (s.status === "atencao" || s.status === "quase_pronto"));
  const ready = subs.filter(s => s.status === "pronto");

  if (blockers.length > 0) {
    return { status: "nogo", label: "NO-GO — bloqueio crítico detectado",
      color: "text-destructive", blockers, attention, ready };
  }
  if (attention.length > 0 || ready.length < subs.length) {
    return { status: "quase", label: "Quase pronto — pendências não críticas",
      color: "text-amber-600 dark:text-amber-400", blockers, attention, ready };
  }
  return { status: "go", label: "GO — pronto para beta controlado",
    color: "text-emerald-600 dark:text-emerald-400", blockers, attention, ready };
}

export const SUB_STATUS_LABEL: Record<SubStatus, string> = {
  pronto: "Pronto",
  quase_pronto: "Quase pronto",
  atencao: "Atenção",
  critico: "Crítico",
  sem_dados: "Sem dados",
};

export const SUB_STATUS_TONE: Record<SubStatus, string> = {
  pronto: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  quase_pronto: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
  atencao: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  critico: "bg-destructive/10 text-destructive border-destructive/30",
  sem_dados: "bg-muted text-muted-foreground border-border",
};

export function sortByStatus(subs: SubSystemSummary[]): SubSystemSummary[] {
  return [...subs].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
}
