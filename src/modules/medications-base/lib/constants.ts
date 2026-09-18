export const CATEGORIAS_CLINICAS = [
  { value: "dor_febre", label: "Dor e febre" },
  { value: "nauseas_vomitos", label: "Náuseas e vômitos" },
  { value: "alergia_anafilaxia", label: "Alergia e anafilaxia" },
  { value: "broncoespasmo_respiratorio", label: "Broncoespasmo / respiratório" },
  { value: "antibioticos", label: "Antibióticos" },
  { value: "antivirais", label: "Antivirais" },
  { value: "antifungicos", label: "Antifúngicos" },
  { value: "gastrointestinal", label: "Gastrointestinal" },
  { value: "cardiovascular", label: "Cardiovascular" },
  { value: "anti_hipertensivos", label: "Anti-hipertensivos" },
  { value: "diureticos", label: "Diuréticos" },
  { value: "corticoides", label: "Corticoides" },
  { value: "anticoag_antiagreg", label: "Anticoagulantes / antiagregantes" },
  { value: "neurologico_anticonvulsivante", label: "Neurológico / anticonvulsivante" },
  { value: "psiquiatria_agitacao", label: "Psiquiatria / agitação" },
  { value: "sedacao_analgesia_hospitalar", label: "Sedação / analgesia hospitalar" },
  { value: "hidratacao_eletrolitos", label: "Hidratação / eletrólitos" },
  { value: "endocrino_metabolico", label: "Endócrino / metabólico" },
  { value: "diabetes_glicemia", label: "Diabetes / glicemia" },
  { value: "gineco_obstetricia", label: "Gineco-obstetrícia" },
  { value: "pediatria_comum", label: "Pediatria comum" },
  { value: "dermatologia_basica", label: "Dermatologia básica" },
  { value: "otorrino_oftalmo", label: "Otorrino / oftalmo" },
  { value: "emergencia", label: "Medicamentos de emergência" },
  { value: "controlados", label: "Medicamentos controlados" },
] as const;

export const PRIORIDADES_MVP = [
  { value: "essencial", label: "Essencial" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
  { value: "futuro", label: "Futuro" },
] as const;

export const STATUS_REVISAO = [
  { value: "rascunho", label: "Rascunho" },
  { value: "aguardando_revisao", label: "Aguardando revisão" },
  { value: "revisado", label: "Revisado" },
  { value: "precisa_corrigir", label: "Precisa corrigir" },
  { value: "inativo", label: "Inativo" },
] as const;

export const TIPOS_RECEITA = [
  { value: "comum", label: "Comum" },
  { value: "especial_b", label: "Especial B (azul)" },
  { value: "especial_a", label: "Especial A (amarela)" },
  { value: "antimicrobiano", label: "Antimicrobiano" },
  { value: "controlado_outros", label: "Controlado (outros)" },
] as const;

export const ALERTA_GEST_LACT = [
  { value: "sem_dados", label: "Sem dados" },
  { value: "seguro", label: "Seguro" },
  { value: "cautela", label: "Cautela" },
  { value: "evitar", label: "Evitar" },
  { value: "contraindicado", label: "Contraindicado" },
] as const;

export const CONTEXTOS_USO = [
  { value: "urgencia", label: "Urgência" },
  { value: "emergencia", label: "Emergência" },
  { value: "pronto_atendimento", label: "Pronto atendimento" },
  { value: "hospitalar", label: "Hospitalar" },
  { value: "ambulatorial_rapido", label: "Ambulatorial rápido" },
  { value: "pediatria", label: "Pediatria" },
  { value: "gestante", label: "Gestante" },
  { value: "outro", label: "Outro" },
] as const;

export type CategoriaClinica = typeof CATEGORIAS_CLINICAS[number]["value"];
export type PrioridadeMvp = typeof PRIORIDADES_MVP[number]["value"];
export type StatusRevisao = typeof STATUS_REVISAO[number]["value"];
export type TipoReceita = typeof TIPOS_RECEITA[number]["value"];
export type AlertaGestLact = typeof ALERTA_GEST_LACT[number]["value"];
export type ContextoUso = typeof CONTEXTOS_USO[number]["value"];
