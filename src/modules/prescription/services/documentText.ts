import type { SelectedMed, ClinicInfo } from "../types/prescription";
import type { DocumentAction } from "../components/ActionGrid";
import type { AtestadoData } from "../components/AtestadoForm";
import type { ExamesData } from "../components/ExamesForm";
import type { EncaminhamentoData } from "../components/EncaminhamentoForm";
import type { DeclaracaoData } from "../components/DeclaracaoForm";
import type { RelatorioData } from "../components/RelatorioForm";
import type { OrientacoesData } from "../components/OrientacoesForm";
import type { ProcedimentoData } from "./documentValidation";
import {
  buildSections,
  structuredLead,
  AIH_FIELDS,
  APAC_FIELDS,
  NOTIFICACAO_FIELDS,
  type FieldSpec,
  type StructuredData,
} from "./regulatoryForms";

const DOC_TITLES: Record<DocumentAction, string> = {
  receita: "Receita médica",
  atestado: "Atestado médico",
  exames: "Solicitação de exames",
  encaminhamento: "Encaminhamento",
  declaracao: "Declaração de comparecimento",
  relatorio: "Relatório de atendimento",
  orientacoes: "Orientações & retorno",
  procedimento: "Solicitação de procedimento",
  aih: "Laudo de internação (AIH)",
  apac: "Laudo APAC",
  notificacao: "Notificação compulsória",
};

const formatDateBR = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

export interface DocumentTextContext {
  action: DocumentAction;
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageValue: string;
  ageUnit: string;
  weight: string;
  selected: SelectedMed[];
  atestado: AtestadoData;
  exames: ExamesData;
  encaminhamento: EncaminhamentoData;
  declaracao: DeclaracaoData;
  relatorio: RelatorioData;
  orientacoes: OrientacoesData;
  procedimento: ProcedimentoData;
  aih: StructuredData;
  apac: StructuredData;
  notificacao: StructuredData;
  clinicInfo: ClinicInfo;
}

/** Serializa o documento ativo como texto plano legível para compartilhamento/cópia. */
export const serializeDocument = (ctx: DocumentTextContext): string => {
  const today = new Date().toLocaleDateString("pt-BR");
  const lines: string[] = [];

  // Cabeçalho
  if (ctx.clinicInfo.clinicName) lines.push(ctx.clinicInfo.clinicName.toUpperCase());
  if (ctx.clinicInfo.doctorName) {
    lines.push(`${ctx.clinicInfo.doctorName}${ctx.clinicInfo.crm ? ` — ${ctx.clinicInfo.crm}` : ""}`);
  }
  if (ctx.clinicInfo.specialty) lines.push(ctx.clinicInfo.specialty);
  if (lines.length) lines.push("");

  lines.push(DOC_TITLES[ctx.action].toUpperCase());
  lines.push("─".repeat(40));
  lines.push(`Paciente: ${ctx.patientName || "—"}`);
  lines.push(`Data: ${today}`);
  if (ctx.isPediatric && (ctx.ageValue || ctx.weight)) {
    const parts = [];
    if (ctx.ageValue) parts.push(`Idade: ${ctx.ageValue} ${ctx.ageUnit}`);
    if (ctx.weight) parts.push(`Peso: ${ctx.weight} kg`);
    lines.push(parts.join(" — "));
  }
  if (ctx.isPregnant) lines.push("Gestante");
  lines.push("");

  switch (ctx.action) {
    case "receita":
      ctx.selected.forEach((m, i) => {
        lines.push(`${i + 1}) ${m.text}`);
      });
      break;
    case "atestado": {
      const d = ctx.atestado;
      const days = d.days || "___";
      const plural = parseInt(d.days || "0") !== 1 ? "s" : "";
      lines.push(
        `Atesto, para os devidos fins, que o(a) paciente ${ctx.patientName || "____"} foi atendido(a) nesta data, necessitando de afastamento de suas atividades por ${days} dia${plural}, a partir de ${today}.`,
      );
      if (d.showCid && d.cid) {
        lines.push("");
        lines.push(`CID-10: ${d.cid}${d.reason ? ` — ${d.reason}` : ""}`);
      }
      break;
    }
    case "exames": {
      lines.push("Solicito os seguintes exames:");
      lines.push("");
      (["laboratorial", "imagem"] as const).forEach((tipo) => {
        const lista = ctx.exames.itens.filter((i) => i.tipo === tipo);
        if (lista.length === 0) return;
        lines.push(tipo === "laboratorial" ? "Laboratoriais:" : "Imagem:");
        lista.forEach((i, idx) => lines.push(`  ${idx + 1}. ${i.nome}`));
        lines.push("");
      });
      if (ctx.exames.cid) lines.push(`CID-10: ${ctx.exames.cid}`);
      if (ctx.exames.justificativa) lines.push(`Justificativa: ${ctx.exames.justificativa}`);
      if (ctx.exames.urgente) lines.push("** URGENTE **");
      if (ctx.exames.observacoes) lines.push(`Obs.: ${ctx.exames.observacoes}`);
      break;
    }
    case "encaminhamento": {
      const e = ctx.encaminhamento;
      lines.push(`Encaminho o(a) paciente ${ctx.patientName || "____"} para avaliação em ${e.especialidade || "____"}.`);
      if (e.urgencia !== "eletivo") lines.push(`Caráter: ${e.urgencia.toUpperCase()}`);
      if (e.cid) lines.push(`CID-10: ${e.cid}`);
      if (e.hipotese) {
        lines.push("");
        lines.push("Hipótese diagnóstica:");
        lines.push(e.hipotese);
      }
      if (e.resumoClinico) {
        lines.push("");
        lines.push("Resumo clínico:");
        lines.push(e.resumoClinico);
      }
      if (e.exames) {
        lines.push("");
        lines.push("Exames realizados:");
        lines.push(e.exames);
      }
      break;
    }
    case "declaracao": {
      const d = ctx.declaracao;
      let txt = `Declaro, para os devidos fins, que o(a) paciente ${ctx.patientName || "____"} compareceu a esta unidade no dia ${d.data ? formatDateBR(d.data) : today}`;
      if (d.horaInicio) {
        txt += `, no horário das ${d.horaInicio}`;
        if (d.horaFim) txt += ` às ${d.horaFim}`;
      }
      if (d.acompanhante) txt += `, acompanhado(a) de ${d.acompanhante}`;
      txt += ", para atendimento médico.";
      lines.push(txt);
      if (d.finalidade) {
        lines.push("");
        lines.push(`Finalidade: ${d.finalidade}`);
      }
      break;
    }
    case "relatorio": {
      const r = ctx.relatorio;
      if (r.destinatario) lines.push(`À/Ao: ${r.destinatario}`);
      if (r.cid) lines.push(`CID-10: ${r.cid}`);
      lines.push("");
      if (r.conteudo) {
        lines.push(r.conteudo);
        lines.push("");
      }
      break;
    }

    case "orientacoes": {
      const o = ctx.orientacoes;
      if (o.diagnostico) lines.push(`Condição: ${o.diagnostico}`);
      if (o.cuidadosGerais) {
        lines.push("");
        lines.push("Cuidados gerais:");
        lines.push(o.cuidadosGerais);
      }
      if (o.sinaisAlarme.length > 0) {
        lines.push("");
        lines.push("Procurar pronto-atendimento se apresentar:");
        o.sinaisAlarme.forEach((s) => lines.push(`  • ${s}`));
      }
      if (o.retornoData || o.retornoCondicao) {
        lines.push("");
        const parts = [];
        if (o.retornoData) parts.push(`Em ${formatDateBR(o.retornoData)}`);
        if (o.retornoCondicao) parts.push(o.retornoCondicao);
        lines.push(`Retorno: ${parts.join(" — ")}`);
      }
      break;
    }
    case "procedimento": {
      const p = ctx.procedimento;
      lines.push(`Solicito: ${p.tipo || "____"}`);
      if (p.justificativa) {
        lines.push("");
        lines.push(`Justificativa: ${p.justificativa}`);
      }
      if (p.contexto) lines.push(`Contexto: ${p.contexto}`);
      if (p.observacoes) lines.push(`Observações: ${p.observacoes}`);
      break;
    }
    case "aih":
    case "apac":
    case "notificacao": {
      const fields: FieldSpec[] =
        ctx.action === "aih" ? AIH_FIELDS : ctx.action === "apac" ? APAC_FIELDS : NOTIFICACAO_FIELDS;
      const data =
        ctx.action === "aih" ? ctx.aih : ctx.action === "apac" ? ctx.apac : ctx.notificacao;
      lines.push(structuredLead(ctx.action, ctx.patientName, data));
      lines.push("");
      buildSections(fields, data).forEach((s) => {
        lines.push(`${s.label}: ${s.value}`);
      });
      break;
    }
  }

  // Rodapé
  lines.push("");
  lines.push("─".repeat(40));
  if (ctx.clinicInfo.doctorName) {
    lines.push(`${ctx.clinicInfo.doctorName}${ctx.clinicInfo.crm ? ` — ${ctx.clinicInfo.crm}` : ""}`);
  } else {
    lines.push("Assinatura e carimbo");
  }

  return lines.join("\n");
};

export const documentFilename = (action: DocumentAction, patientName: string): string => {
  const date = new Date().toISOString().slice(0, 10);
  const safeName = (patientName || "paciente").replace(/\s+/g, "_");
  const safeTitle = DOC_TITLES[action].replace(/\s+/g, "_");
  return `${safeTitle}_${safeName}_${date}`;
};

export const documentTitle = (action: DocumentAction): string => DOC_TITLES[action];
