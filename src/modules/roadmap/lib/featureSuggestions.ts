/**
 * Catálogo de novas áreas sugeridas para o PrescriMed, com benefício clínico,
 * complexidade e prioridade — exportável em Markdown.
 */

export type Complexity = "baixa" | "media" | "alta";
export type Priority = "alta" | "media" | "baixa";

export interface FeatureSuggestion {
  id: string;
  area: string;
  title: string;
  description: string;
  clinicalBenefit: string;
  complexity: Complexity;
  priority: Priority;
  dependsOn?: string[];
  linkedTo: string[];
}

export const COMPLEXITY_LABEL: Record<Complexity, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const FEATURE_SUGGESTIONS: FeatureSuggestion[] = [
  {
    id: "reab-planos",
    area: "Reabilitação",
    title: "Planos de reabilitação vinculados à patologia",
    description:
      "Prescrição estruturada de fisioterapia, fonoaudiologia e terapia ocupacional, com objetivos, frequência semanal, duração e critérios de reavaliação, sugeridos a partir da patologia selecionada (ex.: AVC, DPOC, pós-operatório ortopédico).",
    clinicalBenefit:
      "Reduz encaminhamentos genéricos, melhora aderência e dá ao terapeuta metas mensuráveis.",
    complexity: "media",
    priority: "alta",
    linkedTo: ["Patologias", "Encaminhamentos", "Documentos"],
  },
  {
    id: "reab-evolucao",
    area: "Reabilitação",
    title: "Acompanhamento funcional entre consultas",
    description:
      "Registro seriado de escalas funcionais (Barthel, MRC, MIF, escala de deglutição) com gráfico de evolução e alerta de estagnação.",
    clinicalBenefit: "Torna objetiva a decisão de manter, intensificar ou encerrar a reabilitação.",
    complexity: "media",
    priority: "media",
    dependsOn: ["reab-planos"],
    linkedTo: ["Escores", "Histórico"],
  },
  {
    id: "tele-consulta",
    area: "Telemedicina",
    title: "Teleconsulta com emissão documental no mesmo fluxo",
    description:
      "Sala de atendimento por vídeo com o painel clínico ao lado, gerando prescrição, atestado e encaminhamento assinados digitalmente ao final, entregues por link seguro.",
    clinicalBenefit: "Elimina o retrabalho de reemitir documentos após a chamada.",
    complexity: "alta",
    priority: "alta",
    linkedTo: ["Documentos", "Assinatura digital", "Link público"],
  },
  {
    id: "tele-diagnostico",
    area: "Telemedicina",
    title: "Telediagnóstico e segunda opinião assíncrona",
    description:
      "Envio de caso estruturado (resumo, exames, imagens) para especialista responder em prazo definido, com trilha de auditoria.",
    clinicalBenefit: "Encurta o tempo até conduta definitiva em locais sem especialista.",
    complexity: "alta",
    priority: "media",
    linkedTo: ["Encaminhamentos", "Auditoria"],
  },
  {
    id: "tele-orientacao",
    area: "Telemedicina",
    title: "Teleorientação e triagem pré-atendimento",
    description:
      "Formulário guiado por sintoma que classifica risco e orienta o paciente a procurar PS, agendar consulta ou manter cuidado domiciliar.",
    clinicalBenefit: "Reduz demanda inadequada ao pronto-socorro e prioriza casos graves.",
    complexity: "media",
    priority: "media",
    linkedTo: ["Síndromes", "Sinais de alarme"],
  },
  {
    id: "ind-tempo-dependente",
    area: "Indicadores",
    title: "Painel de tempos porta-agulha e porta-balão",
    description:
      "Cronometragem automática a partir da abertura do protocolo de SCA/AVC, com marcos, mediana do serviço e comparação com metas de diretriz.",
    clinicalBenefit: "Expõe gargalos em condições tempo-dependentes onde minutos mudam desfecho.",
    complexity: "media",
    priority: "alta",
    linkedTo: ["Protocolos", "Indicadores de qualidade"],
  },
  {
    id: "ind-reavaliacao",
    area: "Indicadores",
    title: "Taxa de retorno e reavaliação em 72h",
    description:
      "Acompanha reentradas no serviço em 72 horas por patologia de alta, com detalhamento por conduta prescrita.",
    clinicalBenefit: "Identifica altas precoces e protocolos com falha de segurança.",
    complexity: "media",
    priority: "alta",
    linkedTo: ["Histórico", "Indicadores de qualidade"],
  },
  {
    id: "ind-seguranca-medicamentosa",
    area: "Indicadores",
    title: "Indicadores de segurança medicamentosa",
    description:
      "Monitora interações graves aceitas, prescrições fora de faixa renal e uso de medicamentos potencialmente inapropriados em idosos.",
    clinicalBenefit: "Reduz eventos adversos evitáveis por prescrição.",
    complexity: "media",
    priority: "media",
    linkedTo: ["Interações", "Calculadoras"],
  },
  {
    id: "check-cirurgico",
    area: "Checklists de segurança",
    title: "Checklist cirúrgico (OMS) integrado à internação",
    description:
      "Três etapas — antes da indução, antes da incisão e antes da saída da sala — com registro de quem confirmou cada item e anexação ao prontuário da internação.",
    clinicalBenefit: "Reduz cirurgia em sítio errado e falhas de comunicação da equipe.",
    complexity: "media",
    priority: "alta",
    linkedTo: ["Internações (AIH)", "Auditoria"],
  },
  {
    id: "check-transfusional",
    area: "Checklists de segurança",
    title: "Checklist transfusional",
    description:
      "Dupla checagem de identificação, tipagem, indicação, consentimento e monitorização de reação, com registro temporal por bolsa.",
    clinicalBenefit: "Previne reação hemolítica por troca de hemocomponente.",
    complexity: "baixa",
    priority: "alta",
    linkedTo: ["Internações (AIH)", "Prescrição"],
  },
  {
    id: "check-queda-lpp",
    area: "Checklists de segurança",
    title: "Avaliação de risco de queda e úlcera por pressão",
    description:
      "Morse e Braden aplicados na admissão e reavaliados por gatilho, com plano preventivo sugerido conforme faixa de risco.",
    clinicalBenefit: "Reduz eventos adversos evitáveis em pacientes internados.",
    complexity: "baixa",
    priority: "media",
    linkedTo: ["Escores", "Internações (AIH)"],
  },
  {
    id: "edu-folhetos",
    area: "Educação do paciente",
    title: "Folhetos e orientações por patologia",
    description:
      "Biblioteca de orientações em linguagem simples, personalizadas com o plano prescrito, entregues por QR code impresso ou link seguro com validade.",
    clinicalBenefit: "Aumenta aderência ao tratamento e reduz dúvidas pós-alta.",
    complexity: "baixa",
    priority: "alta",
    linkedTo: ["Documentos", "Link público", "Patologias"],
  },
  {
    id: "edu-sinais-alarme",
    area: "Educação do paciente",
    title: "Cartão de sinais de alarme para retorno",
    description:
      "Cartão impresso ou digital com os sinais que exigem retorno imediato, gerado a partir dos sinais de alarme da patologia.",
    clinicalBenefit: "Antecipa retorno de casos que agravam após a alta.",
    complexity: "baixa",
    priority: "alta",
    linkedTo: ["Sinais de alarme", "Documentos"],
  },
  {
    id: "edu-adesao",
    area: "Educação do paciente",
    title: "Lembretes de tratamento e questionário de adesão",
    description:
      "Envio opcional de lembretes por link e questionário curto de adesão, cujo resultado volta ao histórico do paciente.",
    clinicalBenefit: "Permite intervir cedo em falha de adesão em doenças crônicas.",
    complexity: "media",
    priority: "baixa",
    linkedTo: ["Histórico", "Link público"],
  },
];

export const SUGGESTION_AREAS = Array.from(new Set(FEATURE_SUGGESTIONS.map((s) => s.area)));

const PRIORITY_ORDER: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export function buildSuggestionsMarkdown(items: FeatureSuggestion[] = FEATURE_SUGGESTIONS): string {
  const sorted = [...items].sort(
    (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.area.localeCompare(b.area),
  );
  const lines: string[] = [
    "# PrescriMed — sugestões de novas áreas",
    "",
    `Gerado em ${new Date().toLocaleString("pt-BR")} · ${sorted.length} sugestões`,
    "",
    "| Área | Sugestão | Complexidade | Prioridade |",
    "| --- | --- | --- | --- |",
    ...sorted.map(
      (s) =>
        `| ${s.area} | ${s.title} | ${COMPLEXITY_LABEL[s.complexity]} | ${PRIORITY_LABEL[s.priority]} |`,
    ),
    "",
  ];
  for (const area of Array.from(new Set(sorted.map((s) => s.area)))) {
    lines.push(`## ${area}`, "");
    for (const s of sorted.filter((x) => x.area === area)) {
      lines.push(
        `### ${s.title}`,
        "",
        s.description,
        "",
        `- **Benefício clínico:** ${s.clinicalBenefit}`,
        `- **Complexidade:** ${COMPLEXITY_LABEL[s.complexity]}`,
        `- **Prioridade sugerida:** ${PRIORITY_LABEL[s.priority]}`,
        `- **Conecta-se a:** ${s.linkedTo.join(", ")}`,
        ...(s.dependsOn?.length ? [`- **Depende de:** ${s.dependsOn.join(", ")}`] : []),
        "",
      );
    }
  }
  return lines.join("\n");
}
