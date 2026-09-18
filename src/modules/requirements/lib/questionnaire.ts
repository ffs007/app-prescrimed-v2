/**
 * Questionário abrangente de requisitos do PrescriMed.
 *
 * Estrutura declarativa: 7 blocos temáticos, cada um com perguntas tipadas.
 * O objetivo é cobrir o escopo do produto com alta sensibilidade (poucas
 * lacunas) e alta especificidade (poucas perguntas fora de escopo).
 */

export type QuestionType = "single" | "multi" | "scale" | "text";

export interface SurveyQuestion {
  id: string;
  label: string;
  help?: string;
  type: QuestionType;
  options?: string[];
  /** Permite texto livre adicional em perguntas de escolha. */
  allowOther?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  placeholder?: string;
}

export interface SurveySection {
  id: string;
  title: string;
  purpose: string;
  questions: SurveyQuestion[];
}

export const SURVEY_VERSION = "1.0";

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    id: "perfil",
    title: "1. Perfil do usuário",
    purpose: "Define especialidade, experiência e ambiente de atuação.",
    questions: [
      {
        id: "perfil_especialidade",
        label: "Qual sua especialidade principal?",
        type: "single",
        required: true,
        allowOther: true,
        options: [
          "Clínica médica",
          "Medicina de família e comunidade",
          "Emergência / Medicina intensiva",
          "Pediatria",
          "Ginecologia e obstetrícia",
          "Cirurgia geral",
          "Cardiologia",
          "Psiquiatria",
          "Generalista / plantonista sem título",
        ],
      },
      {
        id: "perfil_subespecialidade",
        label: "Áreas de atuação complementares",
        type: "multi",
        allowOther: true,
        options: [
          "Cuidados paliativos",
          "Geriatria",
          "Nefrologia",
          "Pneumologia",
          "Infectologia",
          "Endocrinologia",
          "Ortopedia / trauma",
          "Oncologia",
        ],
      },
      {
        id: "perfil_experiencia",
        label: "Tempo de formado",
        type: "single",
        required: true,
        options: ["Residente / até 2 anos", "3 a 7 anos", "8 a 15 anos", "Mais de 15 anos"],
      },
      {
        id: "perfil_ambiente",
        label: "Ambientes em que você atende (marque todos)",
        type: "multi",
        required: true,
        options: [
          "Consultório / ambulatorial",
          "UBS / atenção primária",
          "Pronto-socorro / urgência",
          "Emergência e suporte à vida",
          "Enfermaria / internação",
          "UTI",
          "Telemedicina",
          "Domiciliar",
        ],
      },
      {
        id: "perfil_volume",
        label: "Volume médio de atendimentos por dia",
        type: "single",
        options: ["Até 10", "11 a 25", "26 a 45", "Mais de 45"],
      },
      {
        id: "perfil_vinculo",
        label: "Vínculo predominante",
        type: "multi",
        options: ["SUS", "Convênios", "Particular", "Hospital privado", "Cooperativa / plantões"],
      },
    ],
  },
  {
    id: "documentos",
    title: "2. Documentos mais usados",
    purpose: "Mede frequência e finalidade de cada tipo de documento.",
    questions: [
      {
        id: "doc_frequentes",
        label: "Documentos que você emite pelo menos uma vez por semana",
        type: "multi",
        required: true,
        allowOther: true,
        options: [
          "Prescrição simples",
          "Receita de controle especial",
          "Atestado",
          "Relatório médico",
          "Encaminhamento",
          "Solicitação de exames",
          "AIH",
          "APAC",
          "Notificação compulsória",
          "Laudo",
          "Declaração de comparecimento",
          "Termo de consentimento",
        ],
      },
      {
        id: "doc_mais_demorado",
        label: "Qual documento consome mais tempo hoje?",
        type: "single",
        allowOther: true,
        options: [
          "Relatório médico",
          "AIH",
          "APAC",
          "Notificação compulsória",
          "Laudo",
          "Encaminhamento com justificativa",
          "Prescrição complexa / polifarmácia",
        ],
      },
      {
        id: "doc_finalidade",
        label: "Principais finalidades dos documentos que você emite",
        type: "multi",
        options: [
          "Tratamento / conduta",
          "Autorização e faturamento",
          "Perícia / afastamento",
          "Regulação e vagas",
          "Vigilância epidemiológica",
          "Auditoria de convênio",
          "Comunicação com paciente/família",
        ],
      },
      {
        id: "doc_reuso",
        label: "Com que frequência você reaproveita modelos prontos?",
        type: "scale",
        min: 1,
        max: 5,
        minLabel: "Quase nunca",
        maxLabel: "Sempre",
      },
    ],
  },
  {
    id: "patologias",
    title: "3. Patologias prioritárias",
    purpose: "Prioriza conteúdo clínico por especialidade e ambiente.",
    questions: [
      {
        id: "pat_top",
        label: "Liste as 10 condições que você mais atende (uma por linha)",
        type: "text",
        required: true,
        placeholder: "Ex.: Hipertensão\nITU não complicada\nPneumonia adquirida na comunidade",
      },
      {
        id: "pat_grupos",
        label: "Grupos de condições relevantes no seu dia a dia",
        type: "multi",
        options: [
          "Cardiovascular",
          "Respiratório",
          "Infecciosas",
          "Metabólico / endócrino",
          "Neurológico",
          "Trauma",
          "Saúde mental",
          "Gastrointestinal",
          "Dermatológico",
          "Obstétrico",
          "Pediátrico",
          "Geriátrico / fragilidade",
        ],
      },
      {
        id: "pat_tempo_dependente",
        label: "Condições tempo-dependentes que precisam de alerta ativo",
        type: "multi",
        allowOther: true,
        options: ["IAM / SCA", "AVC", "Sepse", "Trauma grave", "Anafilaxia", "Parada cardiorrespiratória", "Hemorragia obstétrica"],
      },
      {
        id: "pat_perfis",
        label: "Perfis de paciente que mais exigem ajuste de conduta",
        type: "multi",
        options: ["Cardiopata", "Nefropata", "Hepatopata", "Geriátrico", "Pediátrico", "Obstétrico", "Oncológico", "Imunossuprimido"],
      },
    ],
  },
  {
    id: "integracoes",
    title: "4. Integrações externas",
    purpose: "Mapeia sistemas com que o app precisa conversar.",
    questions: [
      {
        id: "int_prontuario",
        label: "Qual prontuário eletrônico você usa?",
        type: "text",
        placeholder: "Nome do sistema, ou 'nenhum'",
      },
      {
        id: "int_desejadas",
        label: "Integrações desejadas por ordem de utilidade",
        type: "multi",
        options: [
          "Prontuário eletrônico",
          "Laboratório (resultados)",
          "Radiologia / PACS",
          "Farmácia hospitalar",
          "Faturamento / billing",
          "Regulação de vagas",
          "Vigilância epidemiológica (SINAN / e-SUS)",
          "Assinatura digital ICP-Brasil",
          "Agenda / secretaria",
        ],
      },
      {
        id: "int_formato",
        label: "Formatos de troca aceitos pela sua instituição",
        type: "multi",
        options: ["HL7 FHIR", "HL7 v2", "API REST proprietária", "CSV / planilha", "PDF assinado", "Não sei"],
      },
      {
        id: "int_bloqueio",
        label: "Existe restrição de TI para integrar sistemas externos?",
        type: "single",
        options: ["Sem restrição", "Precisa de aprovação da TI", "Bloqueado por política", "Não sei"],
      },
    ],
  },
  {
    id: "interface",
    title: "5. Preferências de interface",
    purpose: "Ajusta fluxos, densidade e personalização.",
    questions: [
      {
        id: "ui_fluxo",
        label: "Como prefere iniciar um atendimento?",
        type: "single",
        options: [
          "Escolhendo a patologia primeiro",
          "Escolhendo o documento primeiro",
          "Buscando por texto livre",
          "Partindo de um modelo salvo",
        ],
      },
      {
        id: "ui_densidade",
        label: "Densidade de informação preferida",
        type: "scale",
        min: 1,
        max: 5,
        minLabel: "Mínima, só o essencial",
        maxLabel: "Máxima, tudo visível",
      },
      {
        id: "ui_dispositivo",
        label: "Dispositivo mais usado durante o atendimento",
        type: "single",
        options: ["Computador", "Notebook", "Tablet", "Celular"],
      },
      {
        id: "ui_personalizacao",
        label: "O que você mais quer personalizar",
        type: "multi",
        options: [
          "Modelos de documento",
          "Layout e timbre",
          "Lista de patologias favoritas",
          "Prescrições padrão",
          "Atalhos de teclado",
          "Ordem das seções clínicas",
        ],
      },
      {
        id: "ui_tempo_alvo",
        label: "Tempo aceitável para emitir uma prescrição completa (segundos)",
        type: "scale",
        min: 15,
        max: 180,
        minLabel: "15s",
        maxLabel: "3 min",
      },
    ],
  },
  {
    id: "ia",
    title: "6. Nível de automação por IA",
    purpose: "Define até onde a IA pode agir sem confirmação.",
    questions: [
      {
        id: "ia_nivel",
        label: "Nível de atuação desejado da IA",
        type: "single",
        required: true,
        options: [
          "Passiva: só responde quando eu peço",
          "Sugestiva: mostra sugestões que eu aceito ou ignoro",
          "Ativa: pré-preenche rascunhos que eu reviso",
          "Ativa com aprendizado dos meus padrões",
        ],
      },
      {
        id: "ia_areas",
        label: "Onde a IA pode ajudar",
        type: "multi",
        options: [
          "Rascunho de relatório e laudo",
          "Justificativa para auditoria",
          "Sugestão de CID",
          "Sugestão de exames",
          "Revisão de texto",
          "Checagem de interações",
          "Busca de diretrizes atualizadas",
          "Resumo de histórico do paciente",
        ],
      },
      {
        id: "ia_limites",
        label: "Onde a IA NÃO deve atuar",
        type: "multi",
        allowOther: true,
        options: [
          "Escolha final de medicamento",
          "Dose",
          "Decisão de internar ou dar alta",
          "Emissão automática sem revisão",
          "Contato direto com o paciente",
        ],
      },
      {
        id: "ia_confianca",
        label: "Confiança atual em sugestões de IA clínica",
        type: "scale",
        min: 1,
        max: 5,
        minLabel: "Nenhuma",
        maxLabel: "Alta",
      },
    ],
  },
  {
    id: "restricoes",
    title: "7. Restrições e conformidade",
    purpose: "Captura limites de privacidade, LGPD e política institucional.",
    questions: [
      {
        id: "res_dados",
        label: "Dados de paciente que podem ser armazenados no app",
        type: "multi",
        required: true,
        options: [
          "Nome completo",
          "CPF / cartão SUS",
          "Data de nascimento",
          "Diagnósticos",
          "Prescrições emitidas",
          "Exames e resultados",
          "Apenas dados anonimizados",
        ],
      },
      {
        id: "res_retencao",
        label: "Prazo de retenção aceito para documentos emitidos",
        type: "single",
        options: ["Sessão apenas", "30 dias", "1 ano", "5 anos", "20 anos (prontuário)"],
      },
      {
        id: "res_politicas",
        label: "Exigências institucionais aplicáveis",
        type: "multi",
        options: [
          "LGPD com encarregado (DPO) definido",
          "Assinatura digital ICP-Brasil obrigatória",
          "Auditoria de acesso rastreável",
          "Dados hospedados no Brasil",
          "Aprovação de comitê de ética",
          "Termo de consentimento do paciente",
        ],
      },
      {
        id: "res_observacoes",
        label: "Outras restrições ou exigências",
        type: "text",
        placeholder: "Descreva políticas internas, contratos ou vetos.",
      },
    ],
  },
];

export const ALL_QUESTIONS: SurveyQuestion[] = SURVEY_SECTIONS.flatMap((s) => s.questions);

export const REQUIRED_QUESTION_IDS = ALL_QUESTIONS.filter((q) => q.required).map((q) => q.id);
