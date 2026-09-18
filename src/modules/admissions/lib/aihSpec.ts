/**
 * AIH — Autorização de Internação Hospitalar (Laudo para Solicitação/Autorização).
 *
 * Modelo declarativo em seções, seguindo o laudo padrão do SUS, com:
 *  - campos obrigatórios por normativa (exigência mínima);
 *  - campos personalizáveis pelo serviço (institucionais / auditoria interna);
 *  - validações de consistência entre campos (datas, CID, procedimento).
 *
 * Tudo é sugestão revisável: nada é emitido sem revisão do médico.
 */

export type AihFieldType = "text" | "textarea" | "date" | "datetime" | "select" | "number" | "checkbox";

export interface AihField {
  key: string;
  label: string;
  type: AihFieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  suggestions?: string[];
  /** Meia largura em telas médias. */
  half?: boolean;
  /** Campo criado pelo usuário (institucional). */
  custom?: boolean;
}

export interface AihSection {
  id: string;
  title: string;
  description?: string;
  fields: AihField[];
  /** Seção exigida pelo SUS — não pode ser ocultada. */
  core?: boolean;
}

export type AihData = Record<string, string | boolean>;

/* ------------------------------------------------------------------ */
/* Seções padrão                                                       */
/* ------------------------------------------------------------------ */

export const AIH_SECTIONS: AihSection[] = [
  {
    id: "estabelecimento",
    title: "1. Estabelecimento solicitante",
    core: true,
    fields: [
      { key: "estabelecimento", label: "Nome do estabelecimento", type: "text", required: true, half: true },
      { key: "cnesEstabelecimento", label: "CNES", type: "text", required: true, half: true, placeholder: "0000000" },
      { key: "municipioEstabelecimento", label: "Município / UF", type: "text", half: true },
      {
        key: "tipoSolicitacao",
        label: "Tipo de solicitação",
        type: "select",
        half: true,
        options: [
          { value: "inicial", label: "AIH inicial" },
          { value: "continuidade", label: "AIH de continuidade (longa permanência)" },
          { value: "transferencia", label: "Transferência" },
        ],
      },
    ],
  },
  {
    id: "paciente",
    title: "2. Identificação do paciente",
    core: true,
    fields: [
      { key: "pacienteNome", label: "Nome completo", type: "text", required: true },
      { key: "pacienteNomeMae", label: "Nome da mãe", type: "text", required: true, half: true },
      { key: "pacienteNomeResponsavel", label: "Nome do responsável", type: "text", half: true },
      { key: "pacienteCns", label: "Cartão Nacional de Saúde (CNS)", type: "text", required: true, half: true, placeholder: "000 0000 0000 0000" },
      { key: "pacienteCpf", label: "CPF", type: "text", half: true, placeholder: "000.000.000-00" },
      { key: "pacienteNascimento", label: "Data de nascimento", type: "date", required: true, half: true },
      {
        key: "pacienteSexo",
        label: "Sexo",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "", label: "Selecione" },
          { value: "F", label: "Feminino" },
          { value: "M", label: "Masculino" },
        ],
      },
      { key: "pacienteRaca", label: "Raça / cor", type: "select", half: true, options: [
        { value: "", label: "Selecione" },
        { value: "branca", label: "Branca" },
        { value: "preta", label: "Preta" },
        { value: "parda", label: "Parda" },
        { value: "amarela", label: "Amarela" },
        { value: "indigena", label: "Indígena" },
        { value: "nao_informado", label: "Não informado" },
      ] },
      { key: "pacienteTelefone", label: "Telefone de contato", type: "text", half: true },
      { key: "pacienteEndereco", label: "Endereço (logradouro, nº, bairro)", type: "text" },
      { key: "pacienteMunicipio", label: "Município de residência", type: "text", required: true, half: true },
      { key: "pacienteUf", label: "UF", type: "text", half: true, placeholder: "SP" },
      { key: "pacienteCep", label: "CEP", type: "text", half: true },
    ],
  },
  {
    id: "diagnostico",
    title: "3. Justificativa e diagnóstico",
    core: true,
    fields: [
      { key: "sinaisSintomas", label: "Principais sinais e sintomas clínicos", type: "textarea", required: true, placeholder: "Quadro que motiva a internação" },
      { key: "condicoes", label: "Condições que justificam a internação", type: "textarea", required: true, placeholder: "Gravidade, falha do tratamento ambulatorial, necessidade de suporte hospitalar" },
      { key: "resultadosExames", label: "Principais resultados de exames (laboratório, imagem, ECG)", type: "textarea" },
      { key: "cidPrincipal", label: "CID-10 — diagnóstico principal", type: "text", required: true, half: true, placeholder: "Ex: J18.9" },
      { key: "diagnosticoPrincipal", label: "Descrição do diagnóstico principal", type: "text", required: true, half: true },
      { key: "cidSecundario", label: "CID-10 — diagnóstico secundário", type: "text", half: true },
      { key: "cidCausasAssociadas", label: "CID-10 — causas associadas / comorbidades", type: "text", half: true, hint: "Separe por vírgula (ex: I10, E11.9)" },
      { key: "comorbidades", label: "Comorbidades e condições relevantes", type: "textarea", placeholder: "Cardiopatia, DM, DRC, imunossupressão, uso de anticoagulante..." },
    ],
  },
  {
    id: "procedimento",
    title: "4. Procedimento solicitado / realizado",
    core: true,
    fields: [
      {
        key: "procedimento",
        label: "Procedimento solicitado",
        type: "text",
        required: true,
        placeholder: "Ex: Tratamento de pneumonia em adulto",
        suggestions: [
          "Tratamento de pneumonia ou influenza",
          "Tratamento de insuficiência cardíaca",
          "Tratamento de acidente vascular cerebral",
          "Tratamento de infecção do trato urinário",
          "Tratamento de septicemia",
          "Tratamento de diabetes mellitus descompensado",
          "Tratamento de doença pulmonar obstrutiva crônica",
          "Colecistectomia",
          "Apendicectomia",
          "Parto normal",
          "Parto cesariano",
        ],
      },
      { key: "codigoProcedimento", label: "Código SIGTAP", type: "text", required: true, half: true, placeholder: "00.00.00.000-0" },
      { key: "procedimentosSecundarios", label: "Procedimentos secundários realizados", type: "textarea", placeholder: "Um por linha, com código SIGTAP quando houver" },
      {
        key: "carater",
        label: "Caráter da internação",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "eletivo", label: "Eletivo" },
          { value: "urgencia", label: "Urgência / emergência" },
          { value: "acidente_trabalho", label: "Acidente de trabalho" },
          { value: "acidente_transito", label: "Acidente de trânsito" },
        ],
      },
      {
        key: "clinica",
        label: "Clínica",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "medica", label: "Clínica médica" },
          { value: "cirurgica", label: "Cirúrgica" },
          { value: "obstetrica", label: "Obstétrica" },
          { value: "pediatrica", label: "Pediátrica" },
          { value: "psiquiatrica", label: "Psiquiátrica" },
          { value: "uti", label: "Terapia intensiva" },
        ],
      },
      { key: "diasSolicitados", label: "Diárias solicitadas", type: "number", half: true, placeholder: "Ex: 5" },
      { key: "leito", label: "Tipo de leito / enfermaria", type: "text", half: true },
    ],
  },
  {
    id: "internacao",
    title: "5. Datas e desfecho",
    core: true,
    fields: [
      { key: "dataSolicitacao", label: "Data da solicitação", type: "date", required: true, half: true },
      { key: "dataInternacao", label: "Data da internação", type: "date", half: true },
      { key: "dataAlta", label: "Data da alta / saída", type: "date", half: true },
      {
        key: "motivoSaida",
        label: "Motivo de saída / permanência",
        type: "select",
        half: true,
        options: [
          { value: "", label: "Ainda internado" },
          { value: "alta_melhorado", label: "Alta melhorado" },
          { value: "alta_pedido", label: "Alta a pedido" },
          { value: "alta_evasao", label: "Evasão" },
          { value: "transferencia", label: "Transferência para outro estabelecimento" },
          { value: "obito_com_declaracao", label: "Óbito com declaração pelo médico assistente" },
        ],
      },
      { key: "terapeutica", label: "Terapêutica instituída", type: "textarea", hint: "Pode ser importada da prescrição do paciente." },
    ],
  },
  {
    id: "medico",
    title: "6. Médico responsável",
    core: true,
    fields: [
      { key: "medicoNome", label: "Nome do médico solicitante", type: "text", required: true, half: true },
      { key: "medicoCrm", label: "CRM / UF", type: "text", required: true, half: true, placeholder: "123456 / SP" },
      { key: "medicoCns", label: "CNS do profissional", type: "text", half: true },
      { key: "medicoEspecialidade", label: "Especialidade", type: "text", half: true },
      { key: "dataAssinatura", label: "Data da assinatura", type: "date", half: true },
    ],
  },
  {
    id: "auditoria",
    title: "7. Auditoria interna",
    description: "Seção institucional — não faz parte da exigência mínima do SUS.",
    fields: [
      { key: "auditorNome", label: "Auditor / revisor", type: "text", half: true },
      {
        key: "auditoriaStatus",
        label: "Situação da revisão",
        type: "select",
        half: true,
        options: [
          { value: "pendente", label: "Pendente de revisão" },
          { value: "conforme", label: "Conforme" },
          { value: "pendencia", label: "Com pendência" },
          { value: "glosa_risco", label: "Risco de glosa" },
        ],
      },
      { key: "auditoriaData", label: "Data da revisão", type: "date", half: true },
      { key: "auditoriaProntuario", label: "Nº do prontuário / registro interno", type: "text", half: true },
      { key: "auditoriaObs", label: "Observações da auditoria", type: "textarea" },
      { key: "auditoriaDocumentacao", label: "Documentação comprobatória anexada ao prontuário", type: "checkbox" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Estado inicial                                                      */
/* ------------------------------------------------------------------ */

export const emptyAih = (sections: AihSection[] = AIH_SECTIONS): AihData => {
  const out: AihData = {};
  for (const s of sections) {
    for (const f of s.fields) {
      out[f.key] = f.type === "checkbox" ? false : f.type === "select" ? (f.options?.[0]?.value ?? "") : "";
    }
  }
  return out;
};

export const allFields = (sections: AihSection[]): AihField[] => sections.flatMap((s) => s.fields);

/* ------------------------------------------------------------------ */
/* Validação: obrigatórios + consistência                              */
/* ------------------------------------------------------------------ */

export interface AihIssue {
  fieldKey?: string;
  label: string;
  kind: "obrigatorio" | "consistencia";
  message: string;
}

const val = (d: AihData, k: string) => String(d[k] ?? "").trim();
const CID_RE = /^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,2})?$/i;

export const validateAih = (sections: AihSection[], data: AihData): AihIssue[] => {
  const issues: AihIssue[] = [];

  for (const s of sections) {
    for (const f of s.fields) {
      if (!f.required) continue;
      const v = f.type === "checkbox" ? (data[f.key] === true ? "sim" : "") : val(data, f.key);
      if (!v) {
        issues.push({
          fieldKey: f.key,
          label: f.label,
          kind: "obrigatorio",
          message: `${f.label} é obrigatório para a AIH.`,
        });
      }
    }
  }

  // Consistência ------------------------------------------------------
  const cidP = val(data, "cidPrincipal");
  if (cidP && !CID_RE.test(cidP)) {
    issues.push({ fieldKey: "cidPrincipal", label: "CID-10 principal", kind: "consistencia", message: `"${cidP}" não tem formato de CID-10 (ex.: J18.9).` });
  }
  const cidS = val(data, "cidSecundario");
  if (cidS && !CID_RE.test(cidS)) {
    issues.push({ fieldKey: "cidSecundario", label: "CID-10 secundário", kind: "consistencia", message: `"${cidS}" não tem formato de CID-10.` });
  }
  for (const c of val(data, "cidCausasAssociadas").split(",").map((x) => x.trim()).filter(Boolean)) {
    if (!CID_RE.test(c)) {
      issues.push({ fieldKey: "cidCausasAssociadas", label: "CID-10 associados", kind: "consistencia", message: `"${c}" não tem formato de CID-10.` });
    }
  }
  if (cidP && cidS && cidP.toUpperCase() === cidS.toUpperCase()) {
    issues.push({ fieldKey: "cidSecundario", label: "CID-10 secundário", kind: "consistencia", message: "O CID secundário está igual ao principal." });
  }

  const nasc = val(data, "pacienteNascimento");
  const sol = val(data, "dataSolicitacao");
  const int = val(data, "dataInternacao");
  const alta = val(data, "dataAlta");
  const hoje = new Date().toISOString().slice(0, 10);

  if (nasc && nasc > hoje) {
    issues.push({ fieldKey: "pacienteNascimento", label: "Data de nascimento", kind: "consistencia", message: "A data de nascimento está no futuro." });
  }
  if (nasc && int && int < nasc) {
    issues.push({ fieldKey: "dataInternacao", label: "Data da internação", kind: "consistencia", message: "A internação é anterior ao nascimento do paciente." });
  }
  if (sol && int && int < sol) {
    issues.push({ fieldKey: "dataInternacao", label: "Data da internação", kind: "consistencia", message: "A internação é anterior à data da solicitação." });
  }
  if (int && alta && alta < int) {
    issues.push({ fieldKey: "dataAlta", label: "Data da alta", kind: "consistencia", message: "A alta é anterior à internação." });
  }
  if (alta && !int) {
    issues.push({ fieldKey: "dataInternacao", label: "Data da internação", kind: "consistencia", message: "Há data de alta sem data de internação." });
  }
  if (alta && !val(data, "motivoSaida")) {
    issues.push({ fieldKey: "motivoSaida", label: "Motivo de saída", kind: "consistencia", message: "Informe o motivo de saída quando há data de alta." });
  }

  // Diárias x permanência
  const dias = Number(val(data, "diasSolicitados"));
  if (int && alta && Number.isFinite(dias) && dias > 0) {
    const perm = Math.round((new Date(alta).getTime() - new Date(int).getTime()) / 86_400_000);
    if (perm > dias) {
      issues.push({ fieldKey: "diasSolicitados", label: "Diárias solicitadas", kind: "consistencia", message: `A permanência (${perm} dias) excede as ${dias} diárias solicitadas.` });
    }
  }

  // Sexo x clínica obstétrica
  if (val(data, "clinica") === "obstetrica" && val(data, "pacienteSexo") === "M") {
    issues.push({ fieldKey: "clinica", label: "Clínica", kind: "consistencia", message: "Clínica obstétrica com paciente do sexo masculino." });
  }

  // Idade x clínica pediátrica
  if (nasc) {
    const idade = (Date.now() - new Date(nasc).getTime()) / (365.25 * 86_400_000);
    if (val(data, "clinica") === "pediatrica" && idade > 14) {
      issues.push({ fieldKey: "clinica", label: "Clínica", kind: "consistencia", message: `Clínica pediátrica com paciente de ~${Math.floor(idade)} anos.` });
    }
  }

  if (val(data, "motivoSaida").startsWith("obito") && val(data, "auditoriaStatus") === "") {
    // sem bloqueio, apenas lembrete de auditoria
    issues.push({ label: "Auditoria", kind: "consistencia", message: "Óbito informado: registre a revisão na seção de auditoria interna." });
  }

  return issues;
};

/* ------------------------------------------------------------------ */
/* Sugestão de CID por patologia                                       */
/* ------------------------------------------------------------------ */

export interface CidSuggestion {
  code: string;
  origem: string;
}

/* ------------------------------------------------------------------ */
/* Impressão                                                           */
/* ------------------------------------------------------------------ */

const fmtDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

export const displayValue = (f: AihField, data: AihData): string => {
  const raw = data[f.key];
  if (f.type === "checkbox") return raw === true ? "Sim" : "";
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (f.type === "date") return fmtDate(s);
  if (f.type === "select") return f.options?.find((o) => o.value === s)?.label ?? s;
  return s;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** HTML do laudo, pronto para impressão ou "Salvar como PDF". */
export const buildAihHtml = (sections: AihSection[], data: AihData): string => {
  const body = sections
    .map((s) => {
      const rows = s.fields
        .map((f) => ({ f, v: displayValue(f, data) }))
        .filter((x) => x.v);
      if (!rows.length) return "";
      return `<section><h2>${escapeHtml(s.title)}</h2><table>${rows
        .map(
          (x) =>
            `<tr><th>${escapeHtml(x.f.label)}</th><td>${escapeHtml(x.v).replace(/\n/g, "<br/>")}</td></tr>`,
        )
        .join("")}</table></section>`;
    })
    .join("");

  const nome = escapeHtml(val(data, "pacienteNome") || "____________________");
  const medico = escapeHtml(val(data, "medicoNome"));
  const crm = escapeHtml(val(data, "medicoCrm"));

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>AIH — ${nome}</title>
<style>
  @page { size: A4; margin: 16mm; }
  body { font-family: Georgia, "Times New Roman", serif; color: #111; font-size: 11.5pt; }
  h1 { font-size: 15pt; text-align: center; margin: 0 0 2mm; }
  .sub { text-align: center; font-size: 9.5pt; color: #444; margin-bottom: 6mm; }
  section { margin-bottom: 5mm; page-break-inside: avoid; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: .5px; border-bottom: 1px solid #333; padding-bottom: 1mm; margin: 0 0 2mm; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; width: 38%; font-weight: 600; font-size: 9.5pt; vertical-align: top; padding: 1.2mm 2mm 1.2mm 0; color: #333; }
  td { padding: 1.2mm 0; vertical-align: top; }
  .sign { margin-top: 14mm; text-align: center; }
  .line { width: 70mm; border-top: 1px solid #111; margin: 0 auto 1.5mm; }
</style></head><body>
<h1>Laudo para Solicitação / Autorização de Internação Hospitalar</h1>
<div class="sub">AIH — Sistema Único de Saúde</div>
${body}
<div class="sign"><div class="line"></div>${medico}${crm ? ` — CRM ${crm}` : ""}</div>
</body></html>`;
};

/** Texto simples do laudo (para histórico e cópia). */
export const aihToText = (sections: AihSection[], data: AihData): string =>
  sections
    .map((s) => {
      const rows = s.fields.map((f) => ({ f, v: displayValue(f, data) })).filter((x) => x.v);
      if (!rows.length) return "";
      return `${s.title}\n${rows.map((x) => `- ${x.f.label}: ${x.v}`).join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
