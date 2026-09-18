// Regras de cálculo de "prontidão beta" — cliente puro, sem side effects.
export type PacoteItem = {
  id: string;
  bloco_slug: string;
  bloco_nome: string;
  principio_ativo: string;
  principio_ativo_normalizado: string | null;
  obrigatoriedade: "obrigatorio" | "desejavel";
  alto_risco: boolean;
  ordem: number;
  ativo: boolean;
};

export type MedBase = {
  id: string;
  principio_ativo: string;
  nome_normalizado: string | null;
  categoria_clinica: string | null;
  classe_terapeutica: string | null;
  apresentacao: string | null;
  via_administracao: string | null;
  termos_busca: string[] | null;
  prioridade_mvp: string | null;
  status_revisao: string | null;
  fonte_referencia: string | null;
  antimicrobiano: boolean | null;
  medicamento_controlado: boolean | null;
  tipo_receita: string | null;
  dose_adulto_padrao: string | null;
  dose_pediatrica_padrao: string | null;
  alerta_gestacao: string | null;
  alerta_lactacao: string | null;
  alerta_alergia_classe: boolean | null;
  ativo: boolean | null;
};

export type StatusCompletude =
  | "incompleto"
  | "rascunho_seguro"
  | "pronto_teste"
  | "pronto_beta"
  | "revisado"
  | "inativo"
  | "nao_cadastrado";

export const STATUS_LABEL: Record<StatusCompletude, string> = {
  incompleto: "Incompleto",
  rascunho_seguro: "Rascunho seguro",
  pronto_teste: "Pronto para teste",
  pronto_beta: "Pronto beta",
  revisado: "Revisado",
  inativo: "Inativo",
  nao_cadastrado: "Não cadastrado",
};

export const statusTone = (s: StatusCompletude): string => {
  switch (s) {
    case "revisado": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
    case "pronto_beta": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
    case "pronto_teste": return "bg-sky-500/10 text-sky-700 border-sky-500/30";
    case "rascunho_seguro": return "bg-amber-500/10 text-amber-700 border-amber-500/30";
    case "incompleto": return "bg-destructive/10 text-destructive border-destructive/30";
    case "nao_cadastrado": return "bg-destructive/10 text-destructive border-destructive/30";
    case "inativo": return "bg-muted text-muted-foreground";
  }
};

export type Pendencia = {
  campo: string;
  gravidade: "critica" | "alta" | "media" | "baixa";
  acao: string;
};

export type ItemAvaliado = {
  pacote: PacoteItem;
  med: MedBase | null;
  status: StatusCompletude;
  pendencias: Pendencia[];
  seguranca_incompleta: boolean;
};

const norm = (s?: string | null) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function indexMeds(meds: MedBase[]): Map<string, MedBase> {
  const map = new Map<string, MedBase>();
  for (const m of meds) {
    const k = m.nome_normalizado || norm(m.principio_ativo);
    if (k && !map.has(k)) map.set(k, m);
  }
  return map;
}

function tem(v: any) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

export function avaliar(pacote: PacoteItem, med: MedBase | null): ItemAvaliado {
  const pend: Pendencia[] = [];

  if (!med) {
    pend.push({
      campo: "cadastro",
      gravidade: pacote.obrigatoriedade === "obrigatorio" ? "critica" : "media",
      acao: "Cadastrar o medicamento na Base Geral",
    });
    return { pacote, med: null, status: "nao_cadastrado", pendencias: pend, seguranca_incompleta: true };
  }

  if (!tem(med.principio_ativo)) pend.push({ campo: "principio_ativo", gravidade: "critica", acao: "Preencher princípio ativo" });
  if (!tem(med.categoria_clinica)) pend.push({ campo: "categoria_clinica", gravidade: "alta", acao: "Definir categoria clínica" });
  if (!tem(med.apresentacao)) pend.push({ campo: "apresentacao", gravidade: "critica", acao: "Cadastrar ao menos uma apresentação" });
  if (!tem(med.via_administracao)) pend.push({ campo: "via_administracao", gravidade: "alta", acao: "Definir via de administração" });
  if (!tem(med.termos_busca)) pend.push({ campo: "termos_busca", gravidade: "media", acao: "Preencher termos de busca (queixas/sinônimos)" });

  const temDose = tem(med.dose_adulto_padrao) || tem(med.dose_pediatrica_padrao);
  if (temDose && !tem(med.fonte_referencia)) {
    pend.push({ campo: "fonte_referencia", gravidade: "alta", acao: "Registrar fonte da dose/posologia" });
  }

  const segIncompleta =
    !tem(med.alerta_gestacao) ||
    !tem(med.alerta_lactacao) ||
    med.alerta_alergia_classe === null;

  if (pacote.alto_risco) {
    if (!tem(med.status_revisao) || med.status_revisao === "rascunho" || med.status_revisao === "precisa_corrigir") {
      pend.push({ campo: "status_revisao", gravidade: "critica", acao: "Alto risco exige revisão antes de liberar" });
    }
    if (!tem(med.fonte_referencia) && !tem(med.dose_adulto_padrao)) {
      pend.push({ campo: "fonte_referencia", gravidade: "alta", acao: "Alto risco: registrar fonte ou alerta de segurança" });
    }
    if (segIncompleta) {
      pend.push({ campo: "alerta_seguranca", gravidade: "alta", acao: "Alto risco: preencher alertas essenciais de segurança" });
    }
  }

  const ativo = med.ativo !== false;
  let status: StatusCompletude;
  const sr = (med.status_revisao ?? "") as string;

  if (!ativo || sr === "inativo") status = "inativo";
  else if (pend.some(p => p.gravidade === "critica")) status = "incompleto";
  else if (sr === "revisado" && tem(med.fonte_referencia)) status = "revisado";
  else if (
    tem(med.principio_ativo) && tem(med.apresentacao) && tem(med.via_administracao) &&
    tem(med.categoria_clinica) && tem(med.termos_busca) &&
    (sr === "aguardando_revisao" || sr === "revisado") &&
    (!pacote.alto_risco || (!segIncompleta && (tem(med.fonte_referencia) || tem(med.dose_adulto_padrao))))
  ) status = "pronto_beta";
  else if (tem(med.principio_ativo) && tem(med.apresentacao) && tem(med.via_administracao)) {
    status = sr === "rascunho" ? "rascunho_seguro" : "pronto_teste";
  } else status = "incompleto";

  return { pacote, med, status, pendencias: pend, seguranca_incompleta: segIncompleta };
}

export type BlocoResumo = {
  slug: string;
  nome: string;
  obrig_total: number;
  obrig_prontos: number;
  desej_total: number;
  desej_prontos: number;
  alto_risco_pendentes: number;
  status: "pendente" | "em_cadastro" | "minimo_beta_pronto" | "completo_beta" | "precisa_revisao";
};

const isPronto = (s: StatusCompletude) => s === "pronto_beta" || s === "revisado";

export function resumirBlocos(itens: ItemAvaliado[]): BlocoResumo[] {
  const groups = new Map<string, ItemAvaliado[]>();
  for (const it of itens) {
    if (!groups.has(it.pacote.bloco_slug)) groups.set(it.pacote.bloco_slug, []);
    groups.get(it.pacote.bloco_slug)!.push(it);
  }
  const out: BlocoResumo[] = [];
  for (const [slug, arr] of groups) {
    const nome = arr[0].pacote.bloco_nome;
    const ob = arr.filter(x => x.pacote.obrigatoriedade === "obrigatorio");
    const de = arr.filter(x => x.pacote.obrigatoriedade === "desejavel");
    const ob_pronto = ob.filter(x => isPronto(x.status)).length;
    const de_pronto = de.filter(x => isPronto(x.status)).length;
    const ar_pend = arr.filter(x => x.pacote.alto_risco && !isPronto(x.status)).length;
    let status: BlocoResumo["status"];
    if (ar_pend > 0) status = "precisa_revisao";
    else if (ob_pronto === ob.length && de_pronto === de.length) status = "completo_beta";
    else if (ob_pronto === ob.length) status = "minimo_beta_pronto";
    else if (ob_pronto > 0) status = "em_cadastro";
    else status = "pendente";
    out.push({
      slug, nome,
      obrig_total: ob.length, obrig_prontos: ob_pronto,
      desej_total: de.length, desej_prontos: de_pronto,
      alto_risco_pendentes: ar_pend, status,
    });
  }
  return out;
}

export const BLOCO_STATUS_LABEL: Record<BlocoResumo["status"], string> = {
  pendente: "Pendente",
  em_cadastro: "Em cadastro",
  minimo_beta_pronto: "Mínimo beta pronto",
  completo_beta: "Completo beta",
  precisa_revisao: "Precisa revisão",
};

export const blocoTone = (s: BlocoResumo["status"]) => {
  switch (s) {
    case "completo_beta": return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
    case "minimo_beta_pronto": return "bg-sky-500/10 text-sky-700 border-sky-500/30";
    case "em_cadastro": return "bg-amber-500/10 text-amber-700 border-amber-500/30";
    case "pendente": return "bg-destructive/10 text-destructive border-destructive/30";
    case "precisa_revisao": return "bg-destructive/10 text-destructive border-destructive/30";
  }
};

export type ProntidaoGeral = "nao_pronto" | "parcial" | "pronto_com_pendencias" | "pronto_beta";
export const PRONTIDAO_LABEL: Record<ProntidaoGeral, string> = {
  nao_pronto: "Não pronto",
  parcial: "Parcial",
  pronto_com_pendencias: "Pronto com pendências",
  pronto_beta: "Pronto beta",
};

export function prontidaoGeral(itens: ItemAvaliado[]): ProntidaoGeral {
  const ob = itens.filter(x => x.pacote.obrigatoriedade === "obrigatorio");
  if (ob.length === 0) return "nao_pronto";
  const prontos = ob.filter(x => isPronto(x.status)).length;
  const pct = prontos / ob.length;
  const altoRiscoCritico = itens.some(x => x.pacote.alto_risco && x.pacote.obrigatoriedade === "obrigatorio" && !isPronto(x.status));
  if (pct < 0.5) return "nao_pronto";
  if (pct < 0.8) return "parcial";
  if (pct < 1 || altoRiscoCritico) return "pronto_com_pendencias";
  return "pronto_beta";
}
