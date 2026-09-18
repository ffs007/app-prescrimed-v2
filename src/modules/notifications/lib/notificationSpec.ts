/**
 * Notificação Compulsória — motor declarativo.
 *
 * Cada agravo da Lista Nacional de Notificação Compulsória (Portaria de
 * Consolidação nº 4/2017 e atualizações) é descrito por uma especificação:
 * prazo legal, ficha do SINAN correspondente, palavras-chave para detecção
 * automática a partir da patologia do atendimento e os campos próprios da
 * ficha.
 *
 * As seções comuns (unidade notificadora, notificante, paciente, dados
 * clínicos e epidemiológicos, encerramento) valem para todas as fichas.
 * Tudo é sugestão revisável: nada é enviado sem revisão do médico.
 */

export type NotifFieldType = "text" | "textarea" | "date" | "select" | "number" | "checkbox";

export interface NotifField {
  key: string;
  label: string;
  type: NotifFieldType;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  options?: { value: string; label: string }[];
  suggestions?: string[];
  half?: boolean;
  /** Campo criado pela instituição. */
  custom?: boolean;
}

export interface NotifSection {
  id: string;
  title: string;
  description?: string;
  fields: NotifField[];
  /** Exigida pela normativa — não pode ser ocultada. */
  core?: boolean;
}

export type NotifData = Record<string, string | boolean>;

const SIM_NAO_IGN = [
  { value: "", label: "Selecione" },
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "ignorado", label: "Ignorado" },
];

/* ------------------------------------------------------------------ */
/* Seções comuns a todas as fichas                                     */
/* ------------------------------------------------------------------ */

export const NOTIF_SECTIONS: NotifSection[] = [
  {
    id: "unidade",
    title: "1. Unidade notificadora",
    core: true,
    fields: [
      { key: "unidadeNome", label: "Estabelecimento de saúde", type: "text", required: true, half: true },
      { key: "unidadeCnes", label: "CNES", type: "text", required: true, half: true, placeholder: "0000000" },
      { key: "unidadeMunicipio", label: "Município de notificação", type: "text", required: true, half: true },
      { key: "unidadeUf", label: "UF", type: "text", half: true, placeholder: "SP" },
      { key: "dataNotificacao", label: "Data da notificação", type: "date", required: true, half: true },
      {
        key: "tipoNotificacao",
        label: "Tipo de notificação",
        type: "select",
        half: true,
        options: [
          { value: "individual", label: "Individual" },
          { value: "surto", label: "Surto / agregado" },
          { value: "negativa", label: "Notificação negativa" },
        ],
      },
    ],
  },
  {
    id: "notificante",
    title: "2. Responsáveis pelo preenchimento",
    core: true,
    description: "Quem notificou e quem revisou — exigência de rastreabilidade da vigilância.",
    fields: [
      { key: "notificanteNome", label: "Profissional notificante", type: "text", required: true, half: true },
      { key: "notificanteRegistro", label: "Conselho / registro", type: "text", half: true, placeholder: "CRM 000000-UF" },
      { key: "notificanteFuncao", label: "Função", type: "text", half: true, placeholder: "Médico plantonista" },
      { key: "notificanteContato", label: "Telefone / e-mail de contato", type: "text", half: true },
      { key: "digitadorNome", label: "Responsável pela digitação no SINAN", type: "text", half: true },
      { key: "revisorNome", label: "Revisado por (vigilância / enfermagem)", type: "text", half: true },
    ],
  },
  {
    id: "paciente",
    title: "3. Identificação do paciente",
    core: true,
    fields: [
      { key: "pacienteNome", label: "Nome completo", type: "text", required: true },
      { key: "pacienteNomeMae", label: "Nome da mãe", type: "text", half: true },
      { key: "pacienteNascimento", label: "Data de nascimento", type: "date", required: true, half: true },
      { key: "pacienteIdade", label: "Idade", type: "text", half: true, placeholder: "Ex: 34 anos" },
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
          { value: "I", label: "Ignorado" },
        ],
      },
      {
        key: "gestante",
        label: "Gestante",
        type: "select",
        half: true,
        options: [
          { value: "", label: "Selecione" },
          { value: "1tri", label: "1º trimestre" },
          { value: "2tri", label: "2º trimestre" },
          { value: "3tri", label: "3º trimestre" },
          { value: "ig_ignorada", label: "Gestante, idade gestacional ignorada" },
          { value: "nao", label: "Não" },
          { value: "nao_aplica", label: "Não se aplica" },
        ],
      },
      {
        key: "racaCor",
        label: "Raça / cor",
        type: "select",
        half: true,
        options: [
          { value: "", label: "Selecione" },
          { value: "branca", label: "Branca" },
          { value: "preta", label: "Preta" },
          { value: "parda", label: "Parda" },
          { value: "amarela", label: "Amarela" },
          { value: "indigena", label: "Indígena" },
          { value: "ignorado", label: "Ignorado" },
        ],
      },
      { key: "escolaridade", label: "Escolaridade", type: "text", half: true },
      { key: "pacienteCns", label: "Cartão Nacional de Saúde (CNS)", type: "text", half: true },
      { key: "pacienteCpf", label: "CPF", type: "text", half: true },
      { key: "ocupacao", label: "Ocupação (CBO)", type: "text", half: true },
      { key: "pacienteTelefone", label: "Telefone para busca ativa", type: "text", half: true },
      { key: "enderecoLogradouro", label: "Endereço de residência", type: "text" },
      { key: "enderecoBairro", label: "Bairro", type: "text", half: true },
      { key: "enderecoMunicipio", label: "Município de residência", type: "text", required: true, half: true },
      { key: "enderecoUf", label: "UF de residência", type: "text", half: true },
      { key: "enderecoCep", label: "CEP", type: "text", half: true },
      {
        key: "zona",
        label: "Zona",
        type: "select",
        half: true,
        options: [
          { value: "", label: "Selecione" },
          { value: "urbana", label: "Urbana" },
          { value: "rural", label: "Rural" },
          { value: "periurbana", label: "Periurbana" },
        ],
      },
    ],
  },
  {
    id: "clinico",
    title: "4. Dados clínicos",
    core: true,
    fields: [
      { key: "dataSintomas", label: "Data dos primeiros sintomas", type: "date", required: true, half: true },
      { key: "dataAtendimento", label: "Data do atendimento", type: "date", half: true },
      {
        key: "classificacao",
        label: "Classificação do caso",
        type: "select",
        required: true,
        half: true,
        options: [
          { value: "suspeito", label: "Suspeito" },
          { value: "confirmado", label: "Confirmado" },
          { value: "descartado", label: "Descartado" },
        ],
      },
      {
        key: "criterio",
        label: "Critério de confirmação",
        type: "select",
        half: true,
        options: [
          { value: "", label: "Selecione" },
          { value: "laboratorial", label: "Laboratorial" },
          { value: "clinico_epidemiologico", label: "Clínico-epidemiológico" },
          { value: "clinico_imagem", label: "Clínico-imagem" },
          { value: "em_investigacao", label: "Em investigação" },
        ],
      },
      { key: "cid", label: "CID-10", type: "text", half: true, placeholder: "Ex: A90" },
      {
        key: "evolucao",
        label: "Evolução do caso",
        type: "select",
        half: true,
        options: [
          { value: "", label: "Selecione" },
          { value: "ambulatorial", label: "Em tratamento ambulatorial" },
          { value: "internado", label: "Internado" },
          { value: "uti", label: "Internado em UTI" },
          { value: "cura", label: "Cura / alta" },
          { value: "obito_agravo", label: "Óbito pelo agravo" },
          { value: "obito_outra", label: "Óbito por outra causa" },
          { value: "ignorado", label: "Ignorado" },
        ],
      },
      { key: "dataObito", label: "Data do óbito, se houver", type: "date", half: true },
      { key: "sinaisSintomas", label: "Sinais e sintomas apresentados", type: "textarea", required: true },
      { key: "examesRealizados", label: "Exames realizados e resultados", type: "textarea" },
      { key: "conduta", label: "Conduta e tratamento instituído", type: "textarea" },
      { key: "hospitalizacao", label: "Hospitalização", type: "select", half: true, options: SIM_NAO_IGN },
      { key: "dataInternacao", label: "Data da internação", type: "date", half: true },
    ],
  },
  {
    id: "epidemiologico",
    title: "5. Dados epidemiológicos",
    core: true,
    fields: [
      { key: "localProvavelInfeccao", label: "Local provável de infecção (município / UF / país)", type: "text", half: true },
      { key: "viagem", label: "Viagem nos 15 dias anteriores", type: "text", half: true, placeholder: "Destino e período" },
      { key: "contatos", label: "Contatos e comunicantes", type: "textarea", placeholder: "Domiciliares, escolares, de trabalho" },
      { key: "vinculoSurto", label: "Vínculo com surto conhecido", type: "select", half: true, options: SIM_NAO_IGN },
      { key: "vacinacao", label: "Situação vacinal para o agravo", type: "text", half: true },
      { key: "exposicao", label: "Exposição / fator de risco", type: "textarea" },
    ],
  },
  {
    id: "encerramento",
    title: "6. Encaminhamento à vigilância",
    core: true,
    fields: [
      { key: "vigilanciaDestino", label: "Vigilância destinatária", type: "text", half: true, placeholder: "Vigilância Epidemiológica Municipal" },
      { key: "meioEnvio", label: "Meio de envio", type: "select", half: true, options: [
        { value: "", label: "Selecione" },
        { value: "sinan", label: "SINAN (ficha digitada)" },
        { value: "telefone", label: "Telefone / plantão de 24h" },
        { value: "email", label: "E-mail institucional" },
        { value: "esus_notifica", label: "e-SUS Notifica" },
        { value: "presencial", label: "Entrega presencial" },
      ] },
      { key: "protocoloVigilancia", label: "Nº de protocolo / ficha SINAN", type: "text", half: true },
      { key: "dataEnvio", label: "Data do envio", type: "date", half: true },
      { key: "observacoes", label: "Observações", type: "textarea" },
    ],
  },
  {
    id: "institucional",
    title: "7. Campos internos da instituição",
    description: "Codificações internas, setor, prontuário e conferências próprias do serviço.",
    fields: [
      { key: "prontuario", label: "Nº do prontuário", type: "text", half: true },
      { key: "setor", label: "Setor / unidade interna", type: "text", half: true },
      { key: "codigoInterno", label: "Codificação interna adicional", type: "text", half: true },
      { key: "conferidoPor", label: "Conferido por (auditoria interna)", type: "text", half: true },
      { key: "notasInternas", label: "Notas internas (não enviadas à vigilância)", type: "textarea" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Agravos de notificação compulsória                                  */
/* ------------------------------------------------------------------ */

export interface AgravoSpec {
  id: string;
  nome: string;
  /** Ficha correspondente no SINAN / sistema de vigilância. */
  ficha: string;
  cid?: string;
  /** Prazo legal em horas a partir do conhecimento do caso. */
  prazoHoras: 24 | 168;
  /** Onde notificar em primeiro lugar. */
  destino: string;
  keywords: string[];
  /** Campos próprios da ficha do agravo. */
  campos: NotifField[];
  alertas?: string[];
}

const f = (
  key: string,
  label: string,
  type: NotifFieldType = "text",
  extra: Partial<NotifField> = {},
): NotifField => ({ key, label, type, half: type !== "textarea", ...extra });

export const AGRAVOS: AgravoSpec[] = [
  {
    id: "dengue",
    nome: "Dengue",
    ficha: "SINAN — Dengue / Chikungunya",
    cid: "A90",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["dengue", "arbovirose", "aedes"],
    campos: [
      f("dengueClassificacaoRisco", "Classificação de risco", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "A", label: "Grupo A — sem sinais de alarme" },
          { value: "B", label: "Grupo B — risco/comorbidade" },
          { value: "C", label: "Grupo C — sinais de alarme" },
          { value: "D", label: "Grupo D — dengue grave/choque" },
        ],
      }),
      f("dengueSinaisAlarme", "Sinais de alarme presentes", "textarea", {
        placeholder: "Dor abdominal intensa, vômitos persistentes, sangramento de mucosa, letargia, hepatomegalia dolorosa",
      }),
      f("dengueProva", "Prova do laço", "select", { options: SIM_NAO_IGN }),
      f("dengueHematocrito", "Hematócrito / plaquetas", "text", { placeholder: "Ht 45% / Plaq 90.000" }),
      f("dengueSorologia", "NS1 / sorologia / PCR", "text"),
      f("dengueHidratacao", "Plano de hidratação adotado", "text"),
    ],
    alertas: ["Casos graves e óbitos por dengue têm notificação imediata em 24 horas."],
  },
  {
    id: "chikungunya_zika",
    nome: "Chikungunya / Zika",
    ficha: "SINAN — Arboviroses",
    cid: "A92",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["chikungunya", "zika", "arbovirose"],
    campos: [
      f("arboArtralgia", "Artralgia / edema articular", "textarea"),
      f("arboExantema", "Exantema e prurido", "text"),
      f("arboGestante", "Gestante exposta — semanas de gestação", "text"),
      f("arboSorologia", "Sorologia / RT-PCR", "text"),
    ],
    alertas: ["Zika em gestante e óbito por arbovirose são de notificação imediata."],
  },
  {
    id: "sifilis_adquirida",
    nome: "Sífilis adquirida",
    ficha: "SINAN — Sífilis adquirida",
    cid: "A53.9",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["sífilis", "sifilis", "lues", "cancro duro"],
    campos: [
      f("sifilisFase", "Fase clínica", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "primaria", label: "Primária" },
          { value: "secundaria", label: "Secundária" },
          { value: "latente_recente", label: "Latente recente" },
          { value: "latente_tardia", label: "Latente tardia" },
          { value: "terciaria", label: "Terciária" },
        ],
      }),
      f("sifilisTeste", "Teste rápido / VDRL (titulação)", "text", { placeholder: "VDRL 1:32" }),
      f("sifilisTreponemico", "Teste treponêmico", "text"),
      f("sifilisTratamento", "Esquema de penicilina prescrito", "text"),
      f("sifilisParceria", "Tratamento das parcerias sexuais", "textarea"),
      f("sifilisHiv", "Testagem para HIV, hepatites B e C", "text"),
    ],
  },
  {
    id: "sifilis_gestante",
    nome: "Sífilis em gestante",
    ficha: "SINAN — Sífilis em gestante",
    cid: "O98.1",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["sífilis em gestante", "sifilis gestante", "sifilis na gravidez"],
    campos: [
      f("sifilisIg", "Idade gestacional no diagnóstico", "text", { placeholder: "Ex: 22 semanas" }),
      f("sifilisPreNatal", "Realiza pré-natal", "select", { options: SIM_NAO_IGN }),
      f("sifilisTeste", "VDRL / teste rápido (titulação)", "text"),
      f("sifilisTratamento", "Esquema e data de início da penicilina", "text"),
      f("sifilisParceria", "Parceria tratada concomitantemente", "select", { options: SIM_NAO_IGN }),
    ],
    alertas: ["Assegure tratamento com penicilina benzatina e seguimento sorológico mensal."],
  },
  {
    id: "sifilis_congenita",
    nome: "Sífilis congênita",
    ficha: "SINAN — Sífilis congênita",
    cid: "A50",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["sífilis congênita", "sifilis congenita"],
    campos: [
      f("scMaeVdrl", "VDRL materno (parto/curetagem)", "text"),
      f("scMaeTratamento", "Tratamento materno adequado", "select", { options: SIM_NAO_IGN }),
      f("scRnVdrl", "VDRL do recém-nascido", "text"),
      f("scRnExames", "Radiografia de ossos longos / líquor / hemograma", "textarea"),
      f("scRnTratamento", "Tratamento do recém-nascido", "text"),
    ],
  },
  {
    id: "tuberculose",
    nome: "Tuberculose",
    ficha: "SINAN — Tuberculose",
    cid: "A15",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal / Programa de TB",
    keywords: ["tuberculose", "tb pulmonar", "bacilo de koch", "bk"],
    campos: [
      f("tbForma", "Forma clínica", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "pulmonar", label: "Pulmonar" },
          { value: "extrapulmonar", label: "Extrapulmonar" },
          { value: "ambas", label: "Pulmonar + extrapulmonar" },
        ],
      }),
      f("tbTipoEntrada", "Tipo de entrada", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "novo", label: "Caso novo" },
          { value: "recidiva", label: "Recidiva" },
          { value: "reingresso", label: "Reingresso após abandono" },
          { value: "transferencia", label: "Transferência" },
        ],
      }),
      f("tbBaciloscopia", "Baciloscopia de escarro", "text"),
      f("tbTrm", "TRM-TB (Xpert) / cultura / TSA", "text"),
      f("tbRaioX", "Radiografia de tórax", "text"),
      f("tbHiv", "Testagem para HIV", "select", { options: SIM_NAO_IGN }),
      f("tbEsquema", "Esquema terapêutico iniciado", "text", { placeholder: "RHZE 2 meses + RH 4 meses" }),
      f("tbTdo", "Tratamento diretamente observado (TDO)", "select", { options: SIM_NAO_IGN }),
      f("tbContatos", "Contatos identificados para investigação", "textarea"),
    ],
  },
  {
    id: "hanseniase",
    nome: "Hanseníase",
    ficha: "SINAN — Hanseníase",
    cid: "A30",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["hanseníase", "hanseniase", "lepra"],
    campos: [
      f("hansClassificacao", "Classificação operacional", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "pb", label: "Paucibacilar" },
          { value: "mb", label: "Multibacilar" },
        ],
      }),
      f("hansLesoes", "Número de lesões cutâneas / nervos acometidos", "text"),
      f("hansGrau", "Grau de incapacidade física", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "0", label: "Grau 0" },
          { value: "1", label: "Grau 1" },
          { value: "2", label: "Grau 2" },
        ],
      }),
      f("hansBaciloscopia", "Baciloscopia", "text"),
      f("hansPqt", "Esquema PQT iniciado", "text"),
    ],
  },
  {
    id: "violencia",
    nome: "Violência interpessoal / autoprovocada",
    ficha: "SINAN — Violência interpessoal e autoprovocada",
    cid: "Y09",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica e rede de proteção",
    keywords: ["violência", "violencia", "agressão", "agressao", "estupro", "abuso", "tentativa de suicídio", "autoextermínio", "autolesão", "maus-tratos"],
    campos: [
      f("violTipo", "Tipo de violência", "textarea", {
        placeholder: "Física, psicológica, sexual, negligência, financeira, tortura, tráfico",
      }),
      f("violLocal", "Local de ocorrência", "text"),
      f("violDataOcorrencia", "Data e hora da ocorrência", "text"),
      f("violRecorrente", "Violência de repetição", "select", { options: SIM_NAO_IGN }),
      f("violAutor", "Vínculo do provável autor", "text", { placeholder: "Cônjuge, familiar, desconhecido" }),
      f("violLesoes", "Lesões e procedimentos realizados", "textarea"),
      f("violProfilaxias", "Profilaxias em violência sexual", "textarea", {
        placeholder: "PEP HIV, contracepção de emergência, IST, hepatite B",
      }),
      f("violEncaminhamentos", "Encaminhamentos da rede", "textarea", {
        placeholder: "Conselho Tutelar, delegacia, CREAS, saúde mental, IML",
      }),
    ],
    alertas: [
      "Notificação imediata em 24 horas para violência sexual, tentativa de suicídio e casos envolvendo crianças, adolescentes, idosos e pessoas com deficiência.",
      "Casos com criança ou adolescente exigem comunicação ao Conselho Tutelar.",
    ],
  },
  {
    id: "eapv",
    nome: "Evento adverso pós-vacinação (EAPV)",
    ficha: "e-SUS Notifica / SI-EAPV",
    prazoHoras: 24,
    destino: "Vigilância de EAPV municipal/estadual",
    keywords: ["evento adverso", "pós-vacina", "pos vacina", "eapv", "reação vacinal", "vacina"],
    campos: [
      f("eapvImuno", "Imunobiológico aplicado", "text"),
      f("eapvLote", "Lote e fabricante", "text"),
      f("eapvDose", "Dose e via de administração", "text"),
      f("eapvDataVacina", "Data da vacinação", "date"),
      f("eapvIntervalo", "Intervalo até o evento", "text", { placeholder: "Ex: 6 horas" }),
      f("eapvManifestacao", "Manifestações clínicas", "textarea"),
      f("eapvGravidade", "Classificação", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "nao_grave", label: "Não grave" },
          { value: "grave", label: "Grave (internação, risco de vida, sequela, óbito)" },
          { value: "erro_imunizacao", label: "Erro de imunização" },
        ],
      }),
      f("eapvConduta", "Conduta e desfecho", "textarea"),
    ],
    alertas: ["Eventos adversos graves e erros de imunização são de notificação imediata (24 horas)."],
  },
  {
    id: "srag_covid",
    nome: "Síndrome respiratória aguda grave / COVID-19",
    ficha: "SIVEP-Gripe / e-SUS Notifica",
    cid: "U07.1",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["srag", "covid", "influenza", "síndrome respiratória", "sindrome respiratoria"],
    campos: [
      f("sragSaturacao", "Saturação de O₂ em ar ambiente", "text"),
      f("sragSuporte", "Suporte ventilatório", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "nao", label: "Sem suporte" },
          { value: "nao_invasivo", label: "Não invasivo" },
          { value: "invasivo", label: "Invasivo" },
        ],
      }),
      f("sragTeste", "RT-PCR / teste de antígeno / painel viral", "text"),
      f("sragRaioX", "Radiografia ou tomografia de tórax", "text"),
      f("sragVacina", "Vacinação COVID-19 / influenza", "text"),
      f("sragComorbidades", "Fatores de risco e comorbidades", "textarea"),
    ],
    alertas: ["Óbito por SRAG exige notificação imediata."],
  },
  {
    id: "meningite",
    nome: "Meningite / doença meningocócica",
    ficha: "SINAN — Meningite",
    cid: "G03.9",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica Municipal (plantão 24h)",
    keywords: ["meningite", "meningococ", "meningocócica"],
    campos: [
      f("meningLiquor", "Líquor — celularidade, glicose, proteína", "textarea"),
      f("meningEtiologia", "Etiologia provável / cultura / látex", "text"),
      f("meningPetequias", "Petéquias ou sufusões hemorrágicas", "select", { options: SIM_NAO_IGN }),
      f("meningQuimioprofilaxia", "Quimioprofilaxia de contatos", "textarea"),
    ],
    alertas: ["Notificação imediata em 24 horas; acione a quimioprofilaxia dos comunicantes."],
  },
  {
    id: "hepatites",
    nome: "Hepatites virais",
    ficha: "SINAN — Hepatites virais",
    cid: "B19",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["hepatite", "hbsag", "anti-hcv"],
    campos: [
      f("hepAgente", "Agente etiológico", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "a", label: "Hepatite A" },
          { value: "b", label: "Hepatite B" },
          { value: "c", label: "Hepatite C" },
          { value: "d", label: "Hepatite D" },
          { value: "e", label: "Hepatite E" },
        ],
      }),
      f("hepMarcadores", "Marcadores sorológicos / carga viral", "textarea"),
      f("hepTransaminases", "Transaminases e bilirrubinas", "text"),
      f("hepExposicao", "Provável fonte de infecção", "text"),
    ],
  },
  {
    id: "leptospirose",
    nome: "Leptospirose",
    ficha: "SINAN — Leptospirose",
    cid: "A27",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["leptospirose", "enchente", "rato"],
    campos: [
      f("leptoExposicao", "Exposição a água/lama de enchente ou roedores", "textarea"),
      f("leptoIcterica", "Forma ictérica (Weil)", "select", { options: SIM_NAO_IGN }),
      f("leptoFuncaoRenal", "Função renal e plaquetas", "text"),
      f("leptoSorologia", "Sorologia / MAT / PCR", "text"),
    ],
  },
  {
    id: "animal_peconhento",
    nome: "Acidente por animal peçonhento",
    ficha: "SINAN — Acidente por animal peçonhento",
    cid: "T63",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica Municipal / CIATOX",
    keywords: ["animal peçonhento", "peconhento", "serpente", "cobra", "escorpião", "escorpiao", "aranha", "abelha"],
    campos: [
      f("apAnimal", "Tipo de animal", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "serpente", label: "Serpente" },
          { value: "escorpiao", label: "Escorpião" },
          { value: "aranha", label: "Aranha" },
          { value: "lagarta", label: "Lagarta" },
          { value: "abelha", label: "Abelha / vespa" },
          { value: "outro", label: "Outro" },
        ],
      }),
      f("apLocalPicada", "Local da picada e tempo decorrido", "text"),
      f("apClassificacao", "Classificação de gravidade", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "leve", label: "Leve" },
          { value: "moderado", label: "Moderado" },
          { value: "grave", label: "Grave" },
        ],
      }),
      f("apSoro", "Soroterapia — tipo e nº de ampolas", "text"),
      f("apComplicacoes", "Complicações locais e sistêmicas", "textarea"),
    ],
    alertas: ["Notificação imediata; registre a soroterapia administrada."],
  },
  {
    id: "intoxicacao",
    nome: "Intoxicação exógena",
    ficha: "SINAN — Intoxicação exógena",
    cid: "T65",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica / CIATOX",
    keywords: ["intoxicação", "intoxicacao", "envenenamento", "agrotóxico", "agrotoxico", "overdose"],
    campos: [
      f("intoxAgente", "Agente tóxico", "text", { placeholder: "Medicamento, agrotóxico, produto químico, droga" }),
      f("intoxVia", "Via de exposição", "text"),
      f("intoxCircunstancia", "Circunstância", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "acidental", label: "Acidental" },
          { value: "tentativa_suicidio", label: "Tentativa de suicídio" },
          { value: "abuso", label: "Uso abusivo" },
          { value: "ocupacional", label: "Ocupacional" },
          { value: "ambiental", label: "Ambiental" },
          { value: "violencia", label: "Violência / tentativa de homicídio" },
        ],
      }),
      f("intoxQuantidade", "Quantidade estimada e tempo até o atendimento", "text"),
      f("intoxAntidoto", "Antídoto / descontaminação", "text"),
    ],
    alertas: ["Circunstância de tentativa de suicídio exige também notificação de violência autoprovocada."],
  },
  {
    id: "acidente_trabalho",
    nome: "Acidente de trabalho grave",
    ficha: "SINAN — Acidente de trabalho grave / fatal",
    prazoHoras: 24,
    destino: "Vigilância em Saúde do Trabalhador (CEREST)",
    keywords: ["acidente de trabalho", "acidente laboral", "cat"],
    campos: [
      f("atOcupacao", "Ocupação e ramo de atividade", "text"),
      f("atEmpresa", "Empresa / CNPJ", "text"),
      f("atDescricao", "Descrição do acidente", "textarea"),
      f("atCat", "CAT emitida", "select", { options: SIM_NAO_IGN }),
      f("atLesoes", "Lesões e parte do corpo atingida", "textarea"),
    ],
  },
  {
    id: "malaria",
    nome: "Malária",
    ficha: "SIVEP-Malária",
    cid: "B54",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["malária", "malaria", "plasmodium"],
    campos: [
      f("malEspecie", "Espécie de Plasmodium", "text"),
      f("malParasitemia", "Parasitemia / gota espessa", "text"),
      f("malAreaTransmissao", "Área de transmissão", "text"),
      f("malTratamento", "Esquema terapêutico", "text"),
    ],
    alertas: ["Malária em região extra-amazônica é de notificação imediata."],
  },
  {
    id: "sarampo_rubeola",
    nome: "Sarampo / rubéola",
    ficha: "SINAN — Doenças exantemáticas",
    cid: "B05",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica Municipal (plantão 24h)",
    keywords: ["sarampo", "rubéola", "rubeola", "exantemática"],
    campos: [
      f("exantDescricao", "Características do exantema", "textarea"),
      f("exantVacina", "Doses de tríplice viral e datas", "text"),
      f("exantColeta", "Coleta de sorologia / swab", "text"),
      f("exantContatos", "Bloqueio vacinal dos contatos", "textarea"),
    ],
    alertas: ["Notificação imediata em 24 horas; inicie o bloqueio vacinal dos contatos."],
  },
  {
    id: "coqueluche",
    nome: "Coqueluche",
    ficha: "SINAN — Coqueluche",
    cid: "A37",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["coqueluche", "bordetella", "tosse comprida"],
    campos: [
      f("coqTosse", "Duração e características da tosse", "text"),
      f("coqVacina", "Situação vacinal (penta/DTP/dTpa)", "text"),
      f("coqColeta", "Coleta de swab de nasofaringe", "select", { options: SIM_NAO_IGN }),
      f("coqQuimioprofilaxia", "Quimioprofilaxia de contatos", "textarea"),
    ],
    alertas: ["Notificação imediata em 24 horas."],
  },
  {
    id: "febre_amarela",
    nome: "Febre amarela",
    ficha: "SINAN — Febre amarela",
    cid: "A95",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica Municipal (plantão 24h)",
    keywords: ["febre amarela"],
    campos: [
      f("faVacina", "Vacinação prévia e data", "text"),
      f("faAreaRisco", "Deslocamento para área silvestre", "text"),
      f("faLaboratorio", "Transaminases, bilirrubinas, sorologia/PCR", "textarea"),
    ],
    alertas: ["Notificação imediata em 24 horas."],
  },
  {
    id: "raiva",
    nome: "Raiva humana / atendimento antirrábico",
    ficha: "SINAN — Atendimento antirrábico",
    cid: "A82",
    prazoHoras: 24,
    destino: "Vigilância Epidemiológica / Zoonoses",
    keywords: ["raiva", "mordedura", "antirrábic", "cão", "morcego"],
    campos: [
      f("raivaAnimal", "Animal agressor e condição", "text"),
      f("raivaFerimento", "Tipo e localização do ferimento", "text"),
      f("raivaConduta", "Conduta: vacina e/ou soro antirrábico", "textarea"),
      f("raivaObservacaoAnimal", "Animal em observação", "select", { options: SIM_NAO_IGN }),
    ],
    alertas: ["Caso humano de raiva é notificação imediata nacional."],
  },
  {
    id: "obito_materno",
    nome: "Óbito materno",
    ficha: "Ficha de investigação de óbito materno",
    cid: "O95",
    prazoHoras: 24,
    destino: "Comitê de Mortalidade Materna / Vigilância",
    keywords: ["óbito materno", "obito materno", "morte materna"],
    campos: [
      f("omMomento", "Momento do óbito", "select", {
        options: [
          { value: "", label: "Selecione" },
          { value: "gestacao", label: "Durante a gestação" },
          { value: "parto", label: "Durante o parto" },
          { value: "puerperio", label: "Puerpério (até 42 dias)" },
          { value: "tardio", label: "Tardio (43 dias a 1 ano)" },
        ],
      }),
      f("omCausa", "Causa básica e causas associadas", "textarea"),
      f("omAssistencia", "Assistência prestada e intercorrências", "textarea"),
    ],
    alertas: ["Notificação e investigação imediatas."],
  },
  {
    id: "hiv",
    nome: "HIV / aids",
    ficha: "SINAN — HIV/aids",
    cid: "B24",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: ["hiv", "aids", "sida"],
    campos: [
      f("hivTeste", "Testes realizados e datas", "textarea"),
      f("hivCd4", "CD4 / carga viral", "text"),
      f("hivTarv", "TARV iniciada", "select", { options: SIM_NAO_IGN }),
      f("hivCoinfeccoes", "Coinfecções (TB, sífilis, hepatites)", "text"),
    ],
  },
  {
    id: "outro",
    nome: "Outro agravo da lista nacional",
    ficha: "SINAN — ficha individual do agravo",
    prazoHoras: 168,
    destino: "Vigilância Epidemiológica Municipal",
    keywords: [],
    campos: [
      f("outroAgravoNome", "Agravo notificado", "text", { required: true }),
      f("outroFicha", "Ficha / sistema de destino", "text"),
      f("outroPrazo", "Prazo definido pela vigilância local", "text"),
      f("outroDetalhes", "Informações específicas exigidas", "textarea"),
    ],
  },
];

export const agravoById = (id: string): AgravoSpec | undefined => AGRAVOS.find((a) => a.id === id);

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/** Detecta agravos de notificação compulsória a partir de um texto clínico. */
export const detectAgravos = (text: string): AgravoSpec[] => {
  const t = norm(text || "");
  if (!t.trim()) return [];
  return AGRAVOS.filter(
    (a) => a.keywords.length > 0 && a.keywords.some((k) => t.includes(norm(k))),
  );
};

/** Busca por nome/palavra-chave, para o campo de busca rápida. */
export const searchAgravos = (term: string): AgravoSpec[] => {
  const t = norm(term).trim();
  if (!t) return AGRAVOS;
  return AGRAVOS.filter(
    (a) => norm(a.nome).includes(t) || a.keywords.some((k) => norm(k).includes(t)),
  );
};

export const prazoLabel = (a: AgravoSpec) =>
  a.prazoHoras === 24 ? "Imediata — até 24 horas" : "Semanal — até 7 dias";

/** Prazo restante em horas a partir da data/hora de conhecimento do caso. */
export const horasRestantes = (a: AgravoSpec, desdeIso: string): number | null => {
  if (!desdeIso) return null;
  const base = new Date(desdeIso).getTime();
  if (!Number.isFinite(base)) return null;
  return Math.round((base + a.prazoHoras * 3_600_000 - Date.now()) / 3_600_000);
};

/* ------------------------------------------------------------------ */
/* Montagem das seções e estado                                        */
/* ------------------------------------------------------------------ */

export const buildNotifSections = (
  agravo: AgravoSpec | undefined,
  customFields: Record<string, NotifField[]> = {},
  hidden: string[] = [],
): NotifSection[] => {
  const specific: NotifSection | null = agravo
    ? {
        id: "especifico",
        title: `4B. Ficha específica — ${agravo.nome}`,
        description: `${agravo.ficha} · ${prazoLabel(agravo)} · ${agravo.destino}`,
        core: true,
        fields: agravo.campos,
      }
    : null;

  const base = [...NOTIF_SECTIONS];
  if (specific) {
    const i = base.findIndex((s) => s.id === "clinico");
    base.splice(i + 1, 0, specific);
  }
  return base
    .filter((s) => s.core || !hidden.includes(s.id))
    .map((s) => ({ ...s, fields: [...s.fields, ...(customFields[s.id] ?? [])] }));
};

export const emptyNotif = (sections: NotifSection[] = NOTIF_SECTIONS): NotifData => {
  const out: NotifData = {};
  for (const s of sections) {
    for (const fd of s.fields) {
      out[fd.key] = fd.type === "checkbox" ? false : fd.type === "select" ? (fd.options?.[0]?.value ?? "") : "";
    }
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* Validação                                                           */
/* ------------------------------------------------------------------ */

export interface NotifIssue {
  fieldKey?: string;
  label: string;
  kind: "obrigatorio" | "consistencia";
  message: string;
}

const val = (d: NotifData, k: string) => String(d[k] ?? "").trim();
const CID_RE = /^[A-TV-Z][0-9]{2}(\.[0-9A-Z]{1,2})?$/i;

export const validateNotif = (
  sections: NotifSection[],
  data: NotifData,
  agravo?: AgravoSpec,
): NotifIssue[] => {
  const issues: NotifIssue[] = [];

  for (const s of sections) {
    for (const fd of s.fields) {
      if (!fd.required) continue;
      const v = fd.type === "checkbox" ? (data[fd.key] === true ? "sim" : "") : val(data, fd.key);
      if (!v) {
        issues.push({
          fieldKey: fd.key,
          label: fd.label,
          kind: "obrigatorio",
          message: `${fd.label} é obrigatório na ficha de notificação.`,
        });
      }
    }
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const cid = val(data, "cid");
  if (cid && !CID_RE.test(cid)) {
    issues.push({ fieldKey: "cid", label: "CID-10", kind: "consistencia", message: `"${cid}" não tem formato de CID-10 (ex.: A90).` });
  }

  const nasc = val(data, "pacienteNascimento");
  const sint = val(data, "dataSintomas");
  const notif = val(data, "dataNotificacao");
  const obito = val(data, "dataObito");

  if (nasc && nasc > hoje) {
    issues.push({ fieldKey: "pacienteNascimento", label: "Data de nascimento", kind: "consistencia", message: "A data de nascimento está no futuro." });
  }
  if (sint && sint > hoje) {
    issues.push({ fieldKey: "dataSintomas", label: "Início dos sintomas", kind: "consistencia", message: "O início dos sintomas está no futuro." });
  }
  if (sint && nasc && sint < nasc) {
    issues.push({ fieldKey: "dataSintomas", label: "Início dos sintomas", kind: "consistencia", message: "Os sintomas começaram antes do nascimento do paciente." });
  }
  if (sint && notif && notif < sint) {
    issues.push({ fieldKey: "dataNotificacao", label: "Data da notificação", kind: "consistencia", message: "A notificação é anterior ao início dos sintomas." });
  }
  if (agravo && sint && notif) {
    const dias = Math.round((new Date(notif).getTime() - new Date(sint).getTime()) / 86_400_000);
    if (agravo.prazoHoras === 24 && dias > 1) {
      issues.push({ label: "Prazo legal", kind: "consistencia", message: `Agravo de notificação imediata notificado ${dias} dias após o início dos sintomas.` });
    }
  }
  if (val(data, "evolucao").startsWith("obito") && !obito) {
    issues.push({ fieldKey: "dataObito", label: "Data do óbito", kind: "consistencia", message: "Informe a data do óbito." });
  }
  if (obito && sint && obito < sint) {
    issues.push({ fieldKey: "dataObito", label: "Data do óbito", kind: "consistencia", message: "O óbito é anterior ao início dos sintomas." });
  }
  if (val(data, "classificacao") === "confirmado" && !val(data, "criterio")) {
    issues.push({ fieldKey: "criterio", label: "Critério de confirmação", kind: "consistencia", message: "Caso confirmado exige o critério de confirmação." });
  }
  if (val(data, "gestante").endsWith("tri") && val(data, "pacienteSexo") === "M") {
    issues.push({ fieldKey: "gestante", label: "Gestante", kind: "consistencia", message: "Gestação registrada em paciente do sexo masculino." });
  }
  if (val(data, "hospitalizacao") === "sim" && !val(data, "dataInternacao")) {
    issues.push({ fieldKey: "dataInternacao", label: "Data da internação", kind: "consistencia", message: "Informe a data da internação." });
  }

  return issues;
};

/* ------------------------------------------------------------------ */
/* Impressão e texto                                                   */
/* ------------------------------------------------------------------ */

const fmtDate = (iso: string) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
};

export const displayValue = (fd: NotifField, data: NotifData): string => {
  const raw = data[fd.key];
  if (fd.type === "checkbox") return raw === true ? "Sim" : "";
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (fd.type === "date") return fmtDate(s);
  if (fd.type === "select") return fd.options?.find((o) => o.value === s)?.label ?? s;
  return s;
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const notifToText = (sections: NotifSection[], data: NotifData): string =>
  sections
    .map((s) => {
      const rows = sections.length
        ? s.fields.map((fd) => ({ fd, v: displayValue(fd, data) })).filter((x) => x.v)
        : [];
      if (!rows.length) return "";
      return `${s.title}\n${rows.map((x) => `- ${x.fd.label}: ${x.v}`).join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");

export const buildNotifHtml = (
  sections: NotifSection[],
  data: NotifData,
  agravo?: AgravoSpec,
): string => {
  const body = sections
    .map((s) => {
      const rows = s.fields.map((fd) => ({ fd, v: displayValue(fd, data) })).filter((x) => x.v);
      if (!rows.length) return "";
      return `<section><h2>${escapeHtml(s.title)}</h2><table>${rows
        .map(
          (x) =>
            `<tr><th>${escapeHtml(x.fd.label)}</th><td>${escapeHtml(x.v).replace(/\n/g, "<br/>")}</td></tr>`,
        )
        .join("")}</table></section>`;
    })
    .join("");

  const nome = escapeHtml(val(data, "pacienteNome") || "____________________");
  const medico = escapeHtml(val(data, "notificanteNome"));
  const registro = escapeHtml(val(data, "notificanteRegistro"));
  const titulo = agravo ? `Notificação Compulsória — ${escapeHtml(agravo.nome)}` : "Notificação Compulsória";
  const sub = agravo ? `${escapeHtml(agravo.ficha)} · ${escapeHtml(prazoLabel(agravo))}` : "";

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<title>${titulo} — ${nome}</title>
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
<h1>${titulo}</h1>
<div class="sub">${sub}</div>
${body}
<div class="sign"><div class="line"></div>${medico}${registro ? ` — ${registro}` : ""}</div>
</body></html>`;
};
