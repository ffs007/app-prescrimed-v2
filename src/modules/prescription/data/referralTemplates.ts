/**
 * Modelos de encaminhamento por patologia.
 *
 * Dois blocos, conforme o destino:
 *  A) Intrahospitalar / inter-hospitalar — foco em dados imprescindíveis para
 *     quem recebe o paciente agora (gravidade, suporte, exames que sustentam
 *     ou descartam diferenciais graves).
 *  B) Ambulatorial / PSF — foco em continuidade do cuidado.
 *
 * Tudo é pré-preenchido a partir da base de conhecimento clínico e permanece
 * editável: nada é emitido sem revisão médica.
 */

import { getPathologyKnowledge, type PathologyKnowledge } from "./pathologyKnowledge";

export type ReferralKind = "hospitalar" | "ambulatorial";

export interface ReferralField {
  id: string;
  label: string;
  placeholder?: string;
  /** Dado imprescindível — destacado na interface. */
  essential?: boolean;
  multiline?: boolean;
  /** Valor sugerido a partir da patologia. */
  value?: string;
}

export interface ReferralSection {
  id: string;
  titulo: string;
  campos: ReferralField[];
}

const norm = (s: string) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const PAIN_KEYS = [
  "dor", "cefaleia", "lombalgia", "colica", "abdome", "abdominal", "torac",
  "renal", "artrite", "fratura", "trauma", "angina", "coronariana", "enxaqueca",
];

export const isPainRelated = (pathologyName: string) => {
  const n = norm(pathologyName);
  return PAIN_KEYS.some((k) => n.includes(k));
};

const painSection = (): ReferralSection => ({
  id: "dor",
  titulo: "Caracterização da dor",
  campos: [
    { id: "dor_intensidade", label: "Intensidade (EVA 0–10) e evolução", placeholder: "Ex.: EVA 8 na admissão, 4 após analgesia", essential: true },
    { id: "dor_tipo", label: "Tipo e localização", placeholder: "Ex.: dor em aperto retroesternal com irradiação para MSE", essential: true },
    { id: "dor_tempo", label: "Tempo de evolução e início", placeholder: "Ex.: início súbito há 2 horas, em repouso", essential: true },
    { id: "dor_analgesia", label: "Analgésicos já tentados (dose e horário)", placeholder: "Ex.: dipirona 1 g EV às 10h; morfina 2 mg EV às 10h40", essential: true, multiline: true },
    { id: "dor_recidiva", label: "Recidiva após medicação", placeholder: "Ex.: alívio parcial por 40 min, com retorno da dor" },
    { id: "dor_fatores", label: "Fatores desencadeantes e de alívio", placeholder: "Ex.: piora ao esforço, alívio ao repouso" },
  ],
});

const join = (items: string[], limit = 4) => items.slice(0, limit).join("; ");

function hospitalarSections(name: string, k: PathologyKnowledge): ReferralSection[] {
  const sections: ReferralSection[] = [
    {
      id: "destino",
      titulo: "Destino e motivo",
      campos: [
        { id: "servico_destino", label: "Serviço / unidade de destino", placeholder: "Ex.: Hemodinâmica — Hospital de referência", essential: true },
        {
          id: "motivo",
          label: "Motivo do encaminhamento",
          placeholder: "Ex.: necessidade de recurso não disponível nesta unidade",
          essential: true,
          multiline: true,
          value: k.encaminhamentos.length ? `Avaliação por ${k.encaminhamentos[0]} — ${name}.` : "",
        },
        { id: "contato", label: "Contato / regulação (nome e horário)", placeholder: "Ex.: vaga aceita por Dr. X às 14h20 — central de regulação" },
      ],
    },
    {
      id: "clinico",
      titulo: "Quadro clínico e gravidade",
      campos: [
        { id: "hipotese", label: "Hipótese diagnóstica", essential: true, value: name, multiline: true },
        {
          id: "diferenciais",
          label: "Diferenciais graves considerados",
          multiline: true,
          value: join(k.diferenciais),
        },
        { id: "sinais_vitais", label: "Sinais vitais atuais", placeholder: "PA / FC / FR / SatO₂ / Tax / glicemia", essential: true },
        {
          id: "exame_fisico",
          label: "Achados relevantes ao exame físico",
          multiline: true,
          essential: true,
          value: join(k.exameFisico, 5),
        },
      ],
    },
    {
      id: "exames",
      titulo: "Exames que sustentam ou descartam diferenciais",
      campos: [
        {
          id: "exames_realizados",
          label: "Exames realizados e resultados",
          multiline: true,
          essential: true,
          value: k.exames.length ? `${join(k.exames, 6)} — preencher resultados e horários.` : "",
        },
        { id: "exames_pendentes", label: "Exames pendentes / em coleta", placeholder: "Ex.: troponina de 3 h pendente" },
      ],
    },
    {
      id: "conduta",
      titulo: "Condutas realizadas e suporte",
      campos: [
        {
          id: "condutas",
          label: "Condutas já realizadas (com horários)",
          multiline: true,
          essential: true,
          value: join(k.condutas, 5),
        },
        { id: "resposta", label: "Resposta clínica às condutas", placeholder: "Ex.: melhora da dispneia, SatO₂ 88% → 95%" },
        { id: "suporte", label: "Dispositivos e suporte em uso", placeholder: "Ex.: AVP 18G em MSD, O₂ 3 L/min por cateter, SVD" },
        { id: "transporte", label: "Riscos no transporte / cuidados na transferência", placeholder: "Ex.: risco de arritmia — monitorização contínua e desfibrilador na ambulância", essential: true },
      ],
    },
  ];
  if (isPainRelated(name)) sections.splice(2, 0, painSection());
  return sections;
}

function ambulatorialSections(name: string, k: PathologyKnowledge): ReferralSection[] {
  return [
    {
      id: "destino",
      titulo: "Destino e motivo do encaminhamento",
      campos: [
        {
          id: "servico_destino",
          label: "Especialidade / equipe de destino",
          essential: true,
          value: k.encaminhamentos[0] ?? "",
          placeholder: "Ex.: Cardiologia ambulatorial / equipe de saúde da família",
        },
        {
          id: "motivo",
          label: "Motivo específico (investigação, seguimento, procedimento, reabilitação)",
          essential: true,
          multiline: true,
          placeholder: "Ex.: investigação de causa secundária após controle pressórico inadequado",
        },
      ],
    },
    {
      id: "historia",
      titulo: "Resumo da história clínica",
      campos: [
        {
          id: "resumo",
          label: "História clínica resumida",
          essential: true,
          multiline: true,
          value: k.anamnese.length ? `${name}. ${join(k.anamnese, 4)}.` : name,
        },
        { id: "comorbidades", label: "Comorbidades e medicações em uso", multiline: true },
      ],
    },
    {
      id: "tratamento",
      titulo: "Tratamentos realizados e resposta",
      campos: [
        {
          id: "tratamentos",
          label: "Tratamentos já realizados (dose, tempo) e resposta",
          essential: true,
          multiline: true,
          value: join(k.condutas, 4),
        },
        {
          id: "exames",
          label: "Exames já realizados",
          multiline: true,
          value: join(k.exames, 6),
        },
      ],
    },
    {
      id: "seguranca",
      titulo: "Sinais de gravidade e continuidade",
      campos: [
        {
          id: "sinais_alarme",
          label: "Sinais de gravidade que exigem retorno urgente",
          essential: true,
          multiline: true,
          value: k.exameFisico.length
            ? "Retornar imediatamente ao serviço de urgência em caso de: piora importante dos sintomas, febre persistente, dispneia, dor intensa, alteração do nível de consciência."
            : "",
        },
        {
          id: "plano",
          label: "Sugestão de continuidade do plano terapêutico",
          multiline: true,
          essential: true,
          value: k.condutas.length ? `Manter: ${join(k.condutas, 3)}. Reavaliar resposta e ajustar conforme evolução.` : "",
        },
        { id: "retorno", label: "Retorno programado nesta unidade", placeholder: "Ex.: reavaliação em 15 dias na UBS" },
      ],
    },
  ];
}

export function buildReferralTemplate(
  kind: ReferralKind,
  pathologyName: string,
  category?: string,
): ReferralSection[] {
  const k = getPathologyKnowledge({ name: pathologyName, category });
  const name = pathologyName || "Condição não especificada";
  return kind === "hospitalar" ? hospitalarSections(name, k) : ambulatorialSections(name, k);
}

/** Converte as seções preenchidas em texto corrido para o documento. */
export function referralToText(sections: ReferralSection[], values: Record<string, string>): string {
  return sections
    .map((sec) => {
      const lines = sec.campos
        .map((f) => {
          const v = (values[f.id] ?? f.value ?? "").trim();
          return v ? `- ${f.label}: ${v}` : "";
        })
        .filter(Boolean);
      return lines.length ? `${sec.titulo.toUpperCase()}\n${lines.join("\n")}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}
