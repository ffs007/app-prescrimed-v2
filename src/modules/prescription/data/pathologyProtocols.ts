/**
 * Mapa Patologia → Sugestões terapêuticas curadas.
 *
 * Filosofia
 * ---------
 * - O médico clica num quadro clínico e o sistema responde JÁ com sugestões úteis,
 *   organizadas por linha de tratamento (1ª escolha, alternativa, sintomático, suporte).
 * - Cada item aponta para um `medicationId` do banco legado (DEFAULT_MEDICATIONS) e,
 *   opcionalmente, traz `overrides` (dose/intervalo/duração/notas) específicos do contexto.
 * - O motor de sugestão (suggestionEngine) consulta primeiro o overlay v2, calcula
 *   dose por peso quando há `pediatricDoseStructured` e aplica os overrides.
 *
 * Convenções
 * ----------
 * - `line`: "primeira" | "alternativa" | "sintomatico" | "suporte"
 * - `note`: observação curta exibida no card (ex: "Se alérgico a penicilina").
 * - `overrideDurationDays`: quando o protocolo pede dose/duração diferente da default do med.
 *
 * Quando uma patologia não tem entrada aqui, caímos no comportamento atual
 * (`Pathology.meds[]` puro) — nada quebra.
 */

import type { PrescriptionType } from "../types/prescription";

export type SuggestionLine =
  | "primeira" // 1ª linha terapêutica
  | "alternativa" // 2ª linha / alergia / falha
  | "sintomatico" // alívio de sintoma (analgésico, antitérmico)
  | "suporte"; // suporte / adjuvante (PPI, antiemético)

export interface SuggestionRecipe {
  /** ID do medicamento no banco legado (DEFAULT_MEDICATIONS). */
  medicationId: number;
  line: SuggestionLine;
  /** Comentário clínico curto exibido no card. */
  note?: string;
  /** Override opcional de duração (em dias). */
  overrideDurationDays?: number;
  /** Override opcional do tipo de receita (raro). */
  overridePrescriptionType?: PrescriptionType;
  /** Marca como destaque visual (ex: 1ª escolha do plantão). */
  highlight?: boolean;
}

export interface PathologyProtocol {
  pathologyId: number;
  /** Observação geral do quadro (exibida no topo das sugestões). */
  context?: string;
  suggestions: SuggestionRecipe[];
}

/**
 * Sinaliza, sem ambiguidade, qual ID do banco corresponde a quê.
 * Mantemos como mapa nomeado para o leitor humano e auditoria.
 */
const MED = {
  // Antibióticos
  AMOXICILINA_500: 1,
  AZITROMICINA_500: 2,
  CEFALEXINA_500: 9,
  LEVOFLOXACINO_500: 19,
  CIPROFLOXACINO_500: 16,
  METRONIDAZOL_400: 17,
  SULFA_TRIM: 18,
  CLINDAMICINA_300: 20,
  DOXICICLINA_100: 21,
  NORFLOXACINO_400: 22,
  CLARITROMICINA_500: 109,
  ERITROMICINA_500: 110,
  CEFACLOR_500: 112,
  AMOXI_CLAV_500: 102,
  AMOXI_CLAV_875: 103,
  CEFUROXIMA_500: 108,
  // Analgésicos / Antitérmicos
  DIPIRONA_500: 4,
  PARACETAMOL_750: 5,
  TRAMADOL_50: 27,
  CODEINA_30: 28,
  // AINEs
  IBUPROFENO_600: 3,
  NIMESULIDA_100: 23,
  DICLOFENACO_50: 24,
  NAPROXENO_500: 125,
  CETOPROFENO_100: 26,
  // Gastro / Antiemético / Antiespasmódico
  OMEPRAZOL_20: 6,
  PANTOPRAZOL_40: 29,
  RANITIDINA_150: 30,
  DOMPERIDONA_10: 31,
  ONDANSETRONA_8: 35,
  ESCOPOLAMINA: 71,
  LOPERAMIDA: 34,
  METOCLOPRAMIDA: 32,
  SIMETICONA_125: 33,
  // Antialérgicos
  LORATADINA_10: 7,
  DESLORATADINA_5: 36,
  CETIRIZINA_10: 37,
  FEXOFENADINA: 38,
  HIDROXIZINA_25: 39,
  // Corticoides
  PREDNISONA_20: 8,
  DEXAMETASONA_4: 10,
  PREDNISOLONA_XPE: 40,
  BETAMETASONA_05: 41,
  // Anti-hipertensivos
  LOSARTANA_50: 12,
  ENALAPRIL_10: 42,
  ANLODIPINO_5: 43,
  HCTZ_25: 44,
  ATENOLOL_50: 13,
  PROPRANOLOL_40: 45,
  VALSARTANA_80: 46,
  // Antidiabéticos
  METFORMINA_850: 11,
  GLIBENCLAMIDA_5: 47,
  GLICLAZIDA_30: 48,
  // Estatinas
  SINVASTATINA_20: 14,
  ATORVASTATINA_20: 49,
  ROSUVASTATINA_10: 50,
  // Respiratório
  SALBUTAMOL_SPRAY: 63,
  BUDESONIDA_NASAL: 64,
  ACETILCISTEINA: 65,
  AMBROXOL: 66,
  // Outros
  SULFATO_FERROSO: 67,
  ACIDO_FOLICO: 68,
  COMPLEXO_B: 69,
  VITAMINA_D: 70,
  LEVOTIROXINA_50: 74,
  AAS_100: 72,
  ALOPURINOL: 75,
  COLCHICINA: 76,
  // Antifúngicos
  FLUCONAZOL_150: 15,
  NISTATINA: 51,
  CETOCONAZOL: 52,
  // Antiparasitários
  ALBENDAZOL: 59,
  IVERMECTINA: 60,
  SECNIDAZOL: 61,
  MEBENDAZOL: 62,
  // Psiquiatria — ISRS / ISRSN / outros
  FLUOXETINA_20: 53,
  SERTRALINA_50: 54,
  AMITRIPTILINA: 55,
  ESCITALOPRAM_10: 56,
  PAROXETINA_20: 77,
  CITALOPRAM_20: 78,
  VENLAFAXINA_75: 79,
  DULOXETINA_30: 81,
  BUPROPIONA_150: 82,
  MIRTAZAPINA_30: 83,
  TRAZODONA_100: 84,
  // Antipsicóticos
  QUETIAPINA_25: 86,
  // BZD / hipnóticos
  CLONAZEPAM_2: 57,
  DIAZEPAM_10: 58,
  ALPRAZOLAM_05: 97,
  BROMAZEPAM_3: 98,
  ZOLPIDEM_10: 99,
  // Anticonvulsivantes / dor neuropática
  CARBAMAZEPINA_200: 90,
  TOPIRAMATO_50: 91,
  GABAPENTINA_300: 93,
  PREGABALINA_75: 94,
  ACIDO_VALPROICO_500: 95,
} as const;


/* ============================================================
 * IDs de patologias (do banco legado DEFAULT_PATHOLOGIES)
 * Mantidos aqui como mapa nomeado para auditoria fácil.
 * ============================================================ */
const PATHO = {
  AMIGDALITE_BACT: 1,
  AMIGDALITE_VIRAL: 2,
  ANEMIA_FERROPRIVA: 3,
  ARTRITE_GOTOSA: 4,
  ASMA_CRISE: 5,
  BRONCOESPASMO: 6,
  CANDIDIASE_VAG: 7,
  ITU_CISTITE: 8,
  HAS: 9,
  DM2: 10,
  SINUSITE_AGUDA: 11,
  OMA: 12,
  FARINGITE_AGUDA: 13,
  RINITE_ALERGICA: 14,
  LARINGITE_AGUDA: 15,
  BRONQUITE_AGUDA: 16,
  PNEUMONIA: 17,
  IVAS_VIRAL: 18,
  COVID_SINTOMATICO: 19,
  DRGE: 20,
  GASTRITE: 21,
  DISPEPSIA: 22,
  GEA: 23,
  COLICA_ABDOMINAL: 24,
  PARASITOSE: 25,
  GIARDIASE: 26,
  AMEBIASE: 27,
  PIELONEFRITE: 28,
  VAGINOSE: 29,
  URTICARIA: 30,
  DERMATITE: 31,
  ESCABIOSE: 32,
  MICOSE: 33,
  ERISIPELA: 34,
  GOTA_PREVENCAO: 35,
  LOMBALGIA: 36,
  MIALGIA: 37,
  DISLIPIDEMIA: 38,
  IC_MANUTENCAO: 39,
  PREVENCAO_CV: 40,
  HIPOTIREOIDISMO: 41,
  CEFALEIA_TENSIONAL: 42,
  ENXAQUECA: 43,
  DEPRESSAO: 44,
  ANSIEDADE: 45,
  INSONIA: 46,
  DEFICIENCIA_VITD: 47,
  PRENATAL: 48,
  CANDIDIASE_ORAL: 49,
  HERPES_ZOSTER: 50,
} as const;

export const PATHOLOGY_PROTOCOLS: PathologyProtocol[] = [
  /* ============================================================
   * 🦠 OTORRINO / VIA AÉREA SUPERIOR
   * ============================================================ */
  {
    pathologyId: PATHO.AMIGDALITE_BACT,
    context: "Antibiótico empírico para S. pyogenes. Manter por 10 dias mesmo com melhora.",
    suggestions: [
      { medicationId: MED.AMOXICILINA_500, line: "primeira", highlight: true, overrideDurationDays: 10, note: "1ª escolha; manter 10 dias para erradicação." },
      { medicationId: MED.AMOXI_CLAV_875, line: "primeira", overrideDurationDays: 10, note: "Se resposta lenta ou episódio recente." },
      { medicationId: MED.CEFALEXINA_500, line: "alternativa", overrideDurationDays: 10, note: "Alergia leve à penicilina (sem anafilaxia)." },
      { medicationId: MED.CEFUROXIMA_500, line: "alternativa", overrideDurationDays: 10, note: "Alternativa de cefalosporina 2ª geração." },
      { medicationId: MED.AZITROMICINA_500, line: "alternativa", note: "Alergia grave à penicilina (anafilaxia)." },
      { medicationId: MED.CLARITROMICINA_500, line: "alternativa", overrideDurationDays: 10, note: "Alergia à penicilina — alternativa ao macrolídeo." },
      { medicationId: MED.CLINDAMICINA_300, line: "alternativa", overrideDurationDays: 10, note: "Falha terapêutica ou recorrência." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico", note: "Dor e febre." },
      { medicationId: MED.IBUPROFENO_600, line: "sintomatico", note: "Componente inflamatório." },
      { medicationId: MED.PREDNISONA_20, line: "suporte", note: "Dose única se odinofagia importante." },
    ],
  },

  {
    pathologyId: PATHO.AMIGDALITE_VIRAL,
    context: "SEM antibiótico. Foco em sintomáticos.",
    suggestions: [
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico", highlight: true },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.IBUPROFENO_600, line: "sintomatico" },
      { medicationId: MED.NIMESULIDA_100, line: "alternativa", overrideDurationDays: 5, note: "AINE alternativo se intolerância." },
      { medicationId: MED.LORATADINA_10, line: "suporte", note: "Se rinorreia/prurido associados." },
    ],
  },
  {
    pathologyId: PATHO.SINUSITE_AGUDA,
    context: "Antibiótico se sintomas > 10 dias OU piora após 5 dias OU febre alta com secreção purulenta.",
    suggestions: [
      { medicationId: MED.AMOXICILINA_500, line: "primeira", highlight: true, overrideDurationDays: 10 },
      { medicationId: MED.AMOXI_CLAV_875, line: "primeira", overrideDurationDays: 10, note: "Preferir se uso recente de ATB ou comorbidade." },
      { medicationId: MED.CEFUROXIMA_500, line: "alternativa", overrideDurationDays: 10 },
      { medicationId: MED.AZITROMICINA_500, line: "alternativa", note: "Alergia à penicilina." },
      { medicationId: MED.LEVOFLOXACINO_500, line: "alternativa", overrideDurationDays: 10, note: "Alergia grave à penicilina ou falha terapêutica." },
      { medicationId: MED.BUDESONIDA_NASAL, line: "suporte", note: "Reduz edema da mucosa." },
      { medicationId: MED.LORATADINA_10, line: "suporte", note: "Se componente alérgico associado." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
    ],
  },

  {
    pathologyId: PATHO.OMA,
    context: "Antibiótico se < 2 anos OU otalgia intensa OU febre > 39°C OU otorreia.",
    suggestions: [
      { medicationId: MED.AMOXICILINA_500, line: "primeira", highlight: true, overrideDurationDays: 10 },
      { medicationId: MED.AMOXI_CLAV_500, line: "primeira", overrideDurationDays: 10, note: "Falha de amoxicilina ou OMA recorrente." },
      { medicationId: MED.CEFUROXIMA_500, line: "alternativa", overrideDurationDays: 10 },
      { medicationId: MED.AZITROMICINA_500, line: "alternativa", note: "Alergia à penicilina." },
      { medicationId: MED.CLARITROMICINA_500, line: "alternativa", overrideDurationDays: 10 },
      { medicationId: MED.IBUPROFENO_600, line: "sintomatico" },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico" },
    ],
  },
  {
    pathologyId: PATHO.FARINGITE_AGUDA,
    context: "Maioria viral. Avaliar score de Centor antes de antibiótico.",
    suggestions: [
      { medicationId: MED.DIPIRONA_500, line: "sintomatico", highlight: true },
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico" },
      { medicationId: MED.IBUPROFENO_600, line: "sintomatico" },
      { medicationId: MED.AMOXICILINA_500, line: "alternativa", overrideDurationDays: 10, note: "Apenas se Centor ≥ 3 ou cultura+." },
    ],
  },
  {
    pathologyId: PATHO.RINITE_ALERGICA,
    suggestions: [
      { medicationId: MED.LORATADINA_10, line: "primeira", highlight: true, note: "Anti-H1 não sedativo." },
      { medicationId: MED.DESLORATADINA_5, line: "alternativa", note: "Sintomas refratários à loratadina." },
      { medicationId: MED.CETIRIZINA_10, line: "alternativa" },
      { medicationId: MED.FEXOFENADINA, line: "alternativa", note: "Alta potência, não sedativo." },
      { medicationId: MED.HIDROXIZINA_25, line: "alternativa", note: "Sedativo — útil à noite se prurido." },
      { medicationId: MED.BUDESONIDA_NASAL, line: "suporte", note: "Adicionar se sintomas moderados/graves." },
    ],
  },
  {
    pathologyId: PATHO.LARINGITE_AGUDA,
    suggestions: [
      { medicationId: MED.PREDNISONA_20, line: "primeira", highlight: true, overrideDurationDays: 3, note: "Reduz edema de glote." },
      { medicationId: MED.DEXAMETASONA_4, line: "alternativa", overrideDurationDays: 3 },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
    ],
  },

  /* ============================================================
   * 🌬️ RESPIRATÓRIO BAIXO
   * ============================================================ */
  {
    pathologyId: PATHO.ASMA_CRISE,
    context: "B2-agonista + corticoide sistêmico se exacerbação moderada/grave.",
    suggestions: [
      { medicationId: MED.SALBUTAMOL_SPRAY, line: "primeira", highlight: true, note: "2-4 jatos a cada 20 min na 1ª hora." },
      { medicationId: MED.PREDNISONA_20, line: "primeira", overrideDurationDays: 5, note: "40-50 mg/dia VO por 5 dias." },
      { medicationId: MED.DEXAMETASONA_4, line: "alternativa", overrideDurationDays: 3 },
    ],
  },
  {
    pathologyId: PATHO.BRONCOESPASMO,
    suggestions: [
      { medicationId: MED.SALBUTAMOL_SPRAY, line: "primeira", highlight: true },
      { medicationId: MED.PREDNISONA_20, line: "suporte", overrideDurationDays: 5 },
      { medicationId: MED.DEXAMETASONA_4, line: "alternativa", overrideDurationDays: 3, note: "Alternativa ao corticoide oral." },
      { medicationId: MED.BUDESONIDA_NASAL, line: "suporte", note: "Se componente alérgico/rinítico associado." },
    ],
  },
  {
    pathologyId: PATHO.BRONQUITE_AGUDA,
    context: "Maioria viral; antibiótico raramente indicado.",
    suggestions: [
      { medicationId: MED.ACETILCISTEINA, line: "primeira", highlight: true },
      { medicationId: MED.AMBROXOL, line: "alternativa" },
      { medicationId: MED.SALBUTAMOL_SPRAY, line: "suporte", note: "Se broncoespasmo." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
    ],
  },
  {
    pathologyId: PATHO.PNEUMONIA,
    context: "PAC ambulatorial: macrolídeo ou amoxicilina alta dose. Se comorbidade: amoxi-clav.",
    suggestions: [
      { medicationId: MED.AMOXICILINA_500, line: "primeira", highlight: true, overrideDurationDays: 7, note: "Adulto saudável < 65a." },
      { medicationId: MED.AMOXI_CLAV_875, line: "primeira", overrideDurationDays: 7, note: "Comorbidades, > 65a, uso recente de ATB." },
      { medicationId: MED.AZITROMICINA_500, line: "primeira", overrideDurationDays: 5, note: "Cobertura para atípicos." },
      { medicationId: MED.CLARITROMICINA_500, line: "alternativa", overrideDurationDays: 7 },
      { medicationId: MED.LEVOFLOXACINO_500, line: "alternativa", overrideDurationDays: 5, note: "Falha terapêutica ou alergia à penicilina." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico" },
    ],
  },
  {
    pathologyId: PATHO.IVAS_VIRAL,
    context: "Sem antibiótico. Foco em sintomáticos e orientação de retorno.",
    suggestions: [
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico", highlight: true },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.LORATADINA_10, line: "suporte", note: "Rinorreia/espirros." },
    ],
  },
  {
    pathologyId: PATHO.COVID_SINTOMATICO,
    context: "Foco em sintomáticos. Dexametasona apenas se hipoxemia.",
    suggestions: [
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico", highlight: true },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.IBUPROFENO_600, line: "sintomatico", note: "Se mialgia importante." },
      { medicationId: MED.DEXAMETASONA_4, line: "suporte", overrideDurationDays: 10, note: "Apenas se hipoxemia (SatO₂ < 94%)." },
      { medicationId: MED.ACETILCISTEINA, line: "suporte", note: "Tosse produtiva persistente." },
      { medicationId: MED.OMEPRAZOL_20, line: "suporte", note: "Se uso prolongado de AINE." },
    ],
  },

  /* ============================================================
   * 💊 GASTRO
   * ============================================================ */
  {
    pathologyId: PATHO.DRGE,
    suggestions: [
      { medicationId: MED.OMEPRAZOL_20, line: "primeira", highlight: true, note: "20-40 mg/dia em jejum por 4-8 semanas." },
      { medicationId: MED.PANTOPRAZOL_40, line: "alternativa", note: "Útil em uso prolongado." },
      { medicationId: MED.RANITIDINA_150, line: "alternativa", note: "Antagonista H2 — alternativa de manutenção." },
      { medicationId: MED.DOMPERIDONA_10, line: "suporte", note: "Componente de pirose com plenitude pós-prandial." },
    ],
  },
  {
    pathologyId: PATHO.GASTRITE,
    suggestions: [
      { medicationId: MED.OMEPRAZOL_20, line: "primeira", highlight: true },
      { medicationId: MED.PANTOPRAZOL_40, line: "alternativa" },
      { medicationId: MED.RANITIDINA_150, line: "alternativa" },
      { medicationId: MED.ESCOPOLAMINA, line: "sintomatico", note: "Se cólica/desconforto." },
      { medicationId: MED.SIMETICONA_125, line: "suporte", note: "Distensão e empachamento." },
    ],
  },
  {
    pathologyId: PATHO.DISPEPSIA,
    suggestions: [
      { medicationId: MED.OMEPRAZOL_20, line: "primeira", highlight: true },
      { medicationId: MED.METOCLOPRAMIDA, line: "suporte", note: "Se sintomas dismotílicos." },
      { medicationId: MED.DOMPERIDONA_10, line: "alternativa", note: "Plenitude pós-prandial." },
      { medicationId: MED.SIMETICONA_125, line: "suporte" },
    ],
  },

  {
    pathologyId: PATHO.GEA,
    context: "Hidratação é o pilar. Antibiótico só se disenteria + febre alta.",
    suggestions: [
      { medicationId: MED.ONDANSETRONA_8, line: "sintomatico", highlight: true, note: "Vômitos persistentes." },
      { medicationId: MED.METOCLOPRAMIDA, line: "alternativa" },
      { medicationId: MED.ESCOPOLAMINA, line: "sintomatico", note: "Cólica importante." },
      { medicationId: MED.LOPERAMIDA, line: "sintomatico", note: "Evitar se febre/disenteria." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
    ],
  },
  {
    pathologyId: PATHO.COLICA_ABDOMINAL,
    suggestions: [
      { medicationId: MED.ESCOPOLAMINA, line: "primeira", highlight: true },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.SIMETICONA_125, line: "suporte", note: "Componente de distensão/gases." },
      { medicationId: MED.METOCLOPRAMIDA, line: "suporte", note: "Se náusea associada." },
      { medicationId: MED.OMEPRAZOL_20, line: "suporte", note: "Suspeita de componente péptico." },
    ],
  },
  {
    pathologyId: PATHO.PARASITOSE,
    suggestions: [
      { medicationId: MED.ALBENDAZOL, line: "primeira", highlight: true, note: "Dose única; repetir em 14 dias se necessário." },
      { medicationId: MED.MEBENDAZOL, line: "alternativa", overrideDurationDays: 3 },
    ],
  },
  {
    pathologyId: PATHO.GIARDIASE,
    suggestions: [
      { medicationId: MED.METRONIDAZOL_400, line: "primeira", highlight: true, overrideDurationDays: 7 },
      { medicationId: MED.SECNIDAZOL, line: "alternativa", note: "Dose única — boa adesão." },
    ],
  },
  {
    pathologyId: PATHO.AMEBIASE,
    suggestions: [
      { medicationId: MED.METRONIDAZOL_400, line: "primeira", highlight: true, overrideDurationDays: 10 },
      { medicationId: MED.SECNIDAZOL, line: "alternativa" },
    ],
  },

  /* ============================================================
   * 🩺 UROLOGIA / GINECO
   * ============================================================ */
  {
    pathologyId: PATHO.ITU_CISTITE,
    context: "Considerar urocultura se recorrência. Hidratação + analgesia.",
    suggestions: [
      { medicationId: MED.SULFA_TRIM, line: "primeira", highlight: true, overrideDurationDays: 3, note: "3 dias se cistite não complicada." },
      { medicationId: MED.NORFLOXACINO_400, line: "alternativa", overrideDurationDays: 3 },
      { medicationId: MED.CIPROFLOXACINO_500, line: "alternativa", overrideDurationDays: 3, note: "Reservar para falha de 1ª linha." },
      { medicationId: MED.LEVOFLOXACINO_500, line: "alternativa", overrideDurationDays: 3 },
      { medicationId: MED.CEFALEXINA_500, line: "alternativa", overrideDurationDays: 7, note: "Útil em gestantes (categoria B)." },
      { medicationId: MED.ESCOPOLAMINA, line: "sintomatico", note: "Disúria intensa." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
    ],
  },
  {
    pathologyId: PATHO.PIELONEFRITE,
    context: "Avaliar internação se sinais de sepse, gestante, ou comorbidades.",
    suggestions: [
      { medicationId: MED.CIPROFLOXACINO_500, line: "primeira", highlight: true, overrideDurationDays: 7 },
      { medicationId: MED.LEVOFLOXACINO_500, line: "primeira", overrideDurationDays: 7, note: "Posologia 1x/dia." },
      { medicationId: MED.SULFA_TRIM, line: "alternativa", overrideDurationDays: 14 },
      { medicationId: MED.CEFUROXIMA_500, line: "alternativa", overrideDurationDays: 10, note: "Gestante ou alergia à quinolona." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico" },
    ],
  },
  {
    pathologyId: PATHO.CANDIDIASE_VAG,
    suggestions: [
      { medicationId: MED.FLUCONAZOL_150, line: "primeira", highlight: true, note: "Dose única VO." },
    ],
  },
  {
    pathologyId: PATHO.VAGINOSE,
    suggestions: [
      { medicationId: MED.METRONIDAZOL_400, line: "primeira", highlight: true, overrideDurationDays: 7 },
      { medicationId: MED.SECNIDAZOL, line: "alternativa", note: "Dose única — alternativa de adesão." },
    ],
  },

  /* ============================================================
   * 🧴 DERMATOLOGIA
   * ============================================================ */
  {
    pathologyId: PATHO.URTICARIA,
    suggestions: [
      { medicationId: MED.LORATADINA_10, line: "primeira", highlight: true },
      { medicationId: MED.CETIRIZINA_10, line: "alternativa" },
      { medicationId: MED.DESLORATADINA_5, line: "alternativa", note: "Anti-H1 de 2ª geração não sedativo." },
      { medicationId: MED.FEXOFENADINA, line: "alternativa", note: "Alta potência, sem sedação." },
      { medicationId: MED.HIDROXIZINA_25, line: "suporte", note: "Sedativo — útil à noite se prurido intenso." },
      { medicationId: MED.PREDNISONA_20, line: "suporte", overrideDurationDays: 5, note: "Se urticária extensa/refratária." },
    ],
  },
  {
    pathologyId: PATHO.DERMATITE,
    suggestions: [
      { medicationId: MED.LORATADINA_10, line: "primeira", highlight: true },
      { medicationId: MED.DESLORATADINA_5, line: "alternativa" },
      { medicationId: MED.CETIRIZINA_10, line: "alternativa" },
      { medicationId: MED.HIDROXIZINA_25, line: "suporte", note: "Prurido noturno intenso." },
      { medicationId: MED.PREDNISONA_20, line: "suporte", overrideDurationDays: 5 },
      { medicationId: MED.BETAMETASONA_05, line: "suporte", note: "Tópico — lesões localizadas." },
    ],
  },
  {
    pathologyId: PATHO.ESCABIOSE,
    suggestions: [
      { medicationId: MED.IVERMECTINA, line: "primeira", highlight: true, note: "Dose única; repetir em 7 dias." },
      { medicationId: MED.LORATADINA_10, line: "sintomatico", note: "Prurido." },
      { medicationId: MED.HIDROXIZINA_25, line: "sintomatico", note: "Prurido noturno." },
    ],
  },
  {
    pathologyId: PATHO.MICOSE,
    suggestions: [
      { medicationId: MED.CETOCONAZOL, line: "primeira", highlight: true, overrideDurationDays: 14 },
      { medicationId: MED.FLUCONAZOL_150, line: "alternativa", note: "Casos extensos/sistêmicos." },
    ],
  },
  {
    pathologyId: PATHO.ERISIPELA,
    suggestions: [
      { medicationId: MED.CEFALEXINA_500, line: "primeira", highlight: true, overrideDurationDays: 7 },
      { medicationId: MED.AMOXI_CLAV_875, line: "primeira", overrideDurationDays: 7, note: "Cobertura ampliada se ferida contaminada." },
      { medicationId: MED.CLINDAMICINA_300, line: "alternativa", overrideDurationDays: 7, note: "Suspeita de SAMR ou alergia à penicilina." },
      { medicationId: MED.SULFA_TRIM, line: "alternativa", overrideDurationDays: 7, note: "Cobertura para SAMR comunitário." },
      { medicationId: MED.IBUPROFENO_600, line: "sintomatico" },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
    ],
  },

  /* ============================================================
   * 🦴 REUMATO / DOR
   * ============================================================ */
  {
    pathologyId: PATHO.ARTRITE_GOTOSA,
    context: "Crise aguda: AINE OU colchicina OU corticoide. Não iniciar alopurinol durante a crise.",
    suggestions: [
      { medicationId: MED.COLCHICINA, line: "primeira", highlight: true, overrideDurationDays: 5 },
      { medicationId: MED.IBUPROFENO_600, line: "primeira", overrideDurationDays: 5 },
      { medicationId: MED.NAPROXENO_500, line: "alternativa", overrideDurationDays: 5, note: "AINE alternativo." },
      { medicationId: MED.PREDNISONA_20, line: "alternativa", overrideDurationDays: 5, note: "Se contraindicação a AINE." },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
    ],
  },
  {
    pathologyId: PATHO.GOTA_PREVENCAO,
    suggestions: [
      { medicationId: MED.ALOPURINOL, line: "primeira", highlight: true, note: "Iniciar fora da crise; titular conforme uricemia." },
      { medicationId: MED.COLCHICINA, line: "suporte", note: "Profilaxia de crise nos primeiros 3-6 meses do alopurinol." },
    ],
  },
  {
    pathologyId: PATHO.LOMBALGIA,
    context: "Quadro autolimitado. Manter atividade. Imagem só se red flags.",
    suggestions: [
      { medicationId: MED.IBUPROFENO_600, line: "primeira", highlight: true, overrideDurationDays: 5 },
      { medicationId: MED.DICLOFENACO_50, line: "alternativa", overrideDurationDays: 5 },
      { medicationId: MED.NAPROXENO_500, line: "alternativa", overrideDurationDays: 5 },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico", note: "Combinar para potencializar analgesia." },
      { medicationId: MED.OMEPRAZOL_20, line: "suporte", note: "Gastroproteção se AINE > 5 dias ou idoso." },
      { medicationId: MED.TRAMADOL_50, line: "alternativa", note: "Se dor refratária — uso curto." },
      { medicationId: MED.CODEINA_30, line: "alternativa", note: "Opioide fraco — alternativa ao tramadol." },
      { medicationId: MED.PREGABALINA_75, line: "suporte", note: "Componente neuropático (radiculopatia)." },
      { medicationId: MED.GABAPENTINA_300, line: "suporte", note: "Alternativa para dor neuropática." },
    ],
  },
  {
    pathologyId: PATHO.MIALGIA,
    suggestions: [
      { medicationId: MED.IBUPROFENO_600, line: "primeira", highlight: true, overrideDurationDays: 5 },
      { medicationId: MED.DIPIRONA_500, line: "sintomatico" },
      { medicationId: MED.NIMESULIDA_100, line: "alternativa", overrideDurationDays: 5 },
      { medicationId: MED.CETOPROFENO_100, line: "alternativa", overrideDurationDays: 5 },
    ],
  },

  /* ============================================================
   * 🫀 CARDIO / METABOLISMO (uso contínuo)
   * ============================================================ */
  {
    pathologyId: PATHO.HAS,
    context: "Início preferencial: IECA/BRA, BCC ou tiazídico conforme perfil.",
    suggestions: [
      { medicationId: MED.LOSARTANA_50, line: "primeira", highlight: true, note: "1ª escolha em adulto < 65a sem ICC." },
      { medicationId: MED.ENALAPRIL_10, line: "primeira", note: "IECA — atenção à tosse seca." },
      { medicationId: MED.ANLODIPINO_5, line: "primeira", note: "BCC — útil em > 65a e em negros." },
      { medicationId: MED.HCTZ_25, line: "alternativa", note: "Combinar se PA não controlada." },
      { medicationId: MED.VALSARTANA_80, line: "alternativa", note: "BRA alternativo à losartana." },
      { medicationId: MED.ATENOLOL_50, line: "alternativa", note: "Se DAC, FA ou IC associada." },
      { medicationId: MED.PROPRANOLOL_40, line: "alternativa", note: "Útil em jovens com componente adrenérgico." },
    ],
  },
  {
    pathologyId: PATHO.DM2,
    context: "Metformina é primeira linha em todos sem contraindicação.",
    suggestions: [
      { medicationId: MED.METFORMINA_850, line: "primeira", highlight: true, note: "Iniciar 1 cp/dia após jantar; titular." },
      { medicationId: MED.GLICLAZIDA_30, line: "alternativa", note: "Sulfonilureia — adicionar se HbA1c não atingida." },
      { medicationId: MED.GLIBENCLAMIDA_5, line: "alternativa", note: "Alternativa de baixo custo (atenção à hipoglicemia)." },
      { medicationId: MED.LOSARTANA_50, line: "suporte", note: "Nefroproteção se microalbuminúria." },
      { medicationId: MED.ATORVASTATINA_20, line: "suporte", note: "Estatina em todo DM2 com risco CV alto." },
      { medicationId: MED.AAS_100, line: "suporte", note: "Apenas em prevenção secundária." },
    ],
  },
  {
    pathologyId: PATHO.DISLIPIDEMIA,
    suggestions: [
      { medicationId: MED.ATORVASTATINA_20, line: "primeira", highlight: true, note: "Preferir alta-potência se LDL > 130." },
      { medicationId: MED.ROSUVASTATINA_10, line: "primeira", note: "Alta potência; útil em intolerância a outras." },
      { medicationId: MED.SINVASTATINA_20, line: "alternativa", note: "Custo menor — verificar interações." },
    ],
  },
  {
    pathologyId: PATHO.IC_MANUTENCAO,
    suggestions: [
      { medicationId: MED.ENALAPRIL_10, line: "primeira", highlight: true, note: "IECA é base do tratamento de ICFER." },
      { medicationId: MED.LOSARTANA_50, line: "alternativa", note: "Se intolerância ao IECA (tosse)." },
      { medicationId: MED.VALSARTANA_80, line: "alternativa", note: "BRA alternativo." },
      { medicationId: MED.ATENOLOL_50, line: "primeira", note: "Beta-bloqueador em FE reduzida." },
      { medicationId: MED.PROPRANOLOL_40, line: "alternativa" },
      { medicationId: MED.HCTZ_25, line: "suporte", note: "Manejo de congestão leve." },
      { medicationId: MED.AAS_100, line: "suporte", note: "Se etiologia isquêmica." },
    ],
  },
  {
    pathologyId: PATHO.PREVENCAO_CV,
    suggestions: [
      { medicationId: MED.AAS_100, line: "primeira", highlight: true, note: "Prevenção secundária após evento CV." },
      { medicationId: MED.ATORVASTATINA_20, line: "primeira" },
      { medicationId: MED.ROSUVASTATINA_10, line: "alternativa" },
      { medicationId: MED.LOSARTANA_50, line: "suporte", note: "Se HAS ou DRC associadas." },
    ],
  },
  {
    pathologyId: PATHO.HIPOTIREOIDISMO,
    suggestions: [
      { medicationId: MED.LEVOTIROXINA_50, line: "primeira", highlight: true, note: "Em jejum, 30-60 min antes do café. Reavaliar TSH em 6-8 semanas." },
    ],
  },

  /* ============================================================
   * 🧠 NEURO / PSIQUIATRIA
   * ============================================================ */
  {
    pathologyId: PATHO.CEFALEIA_TENSIONAL,
    suggestions: [
      { medicationId: MED.DIPIRONA_500, line: "primeira", highlight: true },
      { medicationId: MED.PARACETAMOL_750, line: "primeira" },
      { medicationId: MED.IBUPROFENO_600, line: "alternativa", note: "Se componente inflamatório." },
      { medicationId: MED.NAPROXENO_500, line: "alternativa" },
      { medicationId: MED.AMITRIPTILINA, line: "suporte", note: "Profilaxia se ≥ 2 episódios/semana." },
    ],
  },
  {
    pathologyId: PATHO.ENXAQUECA,
    suggestions: [
      { medicationId: MED.DIPIRONA_500, line: "primeira", highlight: true },
      { medicationId: MED.NAPROXENO_500, line: "primeira", note: "AINE de escolha em crise leve/moderada." },
      { medicationId: MED.IBUPROFENO_600, line: "alternativa" },
      { medicationId: MED.METOCLOPRAMIDA, line: "suporte", note: "Náusea/vômito associados." },
      { medicationId: MED.ONDANSETRONA_8, line: "suporte", note: "Vômitos refratários." },
      { medicationId: MED.AMITRIPTILINA, line: "suporte", note: "Profilaxia em casos frequentes (uso contínuo)." },
      { medicationId: MED.PROPRANOLOL_40, line: "suporte", note: "Profilaxia alternativa — útil se HAS associada." },
      { medicationId: MED.TOPIRAMATO_50, line: "suporte", note: "Profilaxia em enxaqueca refratária." },
    ],
  },
  {
    pathologyId: PATHO.DEPRESSAO,
    context: "ISRS é primeira linha. Reavaliação em 4-6 semanas.",
    suggestions: [
      { medicationId: MED.SERTRALINA_50, line: "primeira", highlight: true, note: "Boa tolerabilidade; útil se ansiedade associada." },
      { medicationId: MED.ESCITALOPRAM_10, line: "primeira", note: "Boa tolerabilidade, baixa interação." },
      { medicationId: MED.FLUOXETINA_20, line: "primeira", note: "Iniciar 20 mg/dia pela manhã." },
      { medicationId: MED.PAROXETINA_20, line: "alternativa", note: "Útil se ansiedade marcada (cuidado em jovens)." },
      { medicationId: MED.CITALOPRAM_20, line: "alternativa" },
      { medicationId: MED.VENLAFAXINA_75, line: "alternativa", note: "ISRSN — útil em depressão com dor crônica." },
      { medicationId: MED.DULOXETINA_30, line: "alternativa", note: "Útil em depressão com dor neuropática." },
      { medicationId: MED.BUPROPIONA_150, line: "alternativa", note: "Boa opção se sintomas atípicos/cessação tabágica." },
      { medicationId: MED.MIRTAZAPINA_30, line: "alternativa", note: "Útil se insônia e baixo apetite associados." },
      { medicationId: MED.TRAZODONA_100, line: "suporte", note: "Adjuvante para insônia secundária." },
    ],
  },
  {
    pathologyId: PATHO.ANSIEDADE,
    context: "ISRS para tratamento crônico. BZD apenas para crises agudas, curto prazo.",
    suggestions: [
      { medicationId: MED.SERTRALINA_50, line: "primeira", highlight: true },
      { medicationId: MED.ESCITALOPRAM_10, line: "primeira", note: "Boa tolerabilidade." },
      { medicationId: MED.PAROXETINA_20, line: "alternativa", note: "Útil em TAG e TP." },
      { medicationId: MED.VENLAFAXINA_75, line: "alternativa", note: "ISRSN em TAG resistente." },
      { medicationId: MED.PREGABALINA_75, line: "alternativa", note: "Alternativa em TAG resistente." },
      { medicationId: MED.CLONAZEPAM_2, line: "suporte", note: "Crise aguda — uso curto, controlado (azul)." },
      { medicationId: MED.ALPRAZOLAM_05, line: "suporte", note: "Crises de pânico — uso pontual." },
      { medicationId: MED.BROMAZEPAM_3, line: "suporte", note: "Alternativa de BZD para ansiedade aguda." },
    ],
  },
  {
    pathologyId: PATHO.INSONIA,
    context: "Higiene do sono primeiro. Medicação por curto prazo se necessário.",
    suggestions: [
      { medicationId: MED.AMITRIPTILINA, line: "primeira", highlight: true, note: "Dose baixa à noite." },
      { medicationId: MED.TRAZODONA_100, line: "alternativa", note: "Hipnótico — útil se depressão associada." },
      { medicationId: MED.MIRTAZAPINA_30, line: "alternativa", note: "Se depressão e baixo apetite." },
      { medicationId: MED.ZOLPIDEM_10, line: "suporte", note: "Hipnótico não-BZD — uso curto, controlado (azul)." },
      { medicationId: MED.CLONAZEPAM_2, line: "suporte", note: "Apenas se ansiedade noturna importante." },
    ],
  },

  /* ============================================================
   * 🩸 HEMATO / SUPLEMENTOS
   * ============================================================ */
  {
    pathologyId: PATHO.ANEMIA_FERROPRIVA,
    suggestions: [
      { medicationId: MED.SULFATO_FERROSO, line: "primeira", highlight: true, note: "Em jejum com vit C; reavaliar em 30-60 dias." },
      { medicationId: MED.ACIDO_FOLICO, line: "suporte", note: "Se déficit associado." },
      { medicationId: MED.COMPLEXO_B, line: "suporte", note: "Se anemia mista (deficiência de B12)." },
      { medicationId: MED.VITAMINA_D, line: "suporte", note: "Avaliar reposição se déficit associado." },
    ],
  },
  {
    pathologyId: PATHO.DEFICIENCIA_VITD,
    suggestions: [
      { medicationId: MED.VITAMINA_D, line: "primeira", highlight: true, note: "8 semanas; reavaliar 25-OH-D." },
      { medicationId: MED.COMPLEXO_B, line: "suporte", note: "Avaliar polideficiência em idosos/restrição alimentar." },
    ],
  },
  {
    pathologyId: PATHO.PRENATAL,
    suggestions: [
      { medicationId: MED.ACIDO_FOLICO, line: "primeira", highlight: true, note: "Iniciar pré-concepção; manter 1º trimestre." },
      { medicationId: MED.SULFATO_FERROSO, line: "suporte", note: "A partir do 2º trimestre." },
      { medicationId: MED.COMPLEXO_B, line: "suporte" },
      { medicationId: MED.VITAMINA_D, line: "suporte", note: "Reposição se 25-OH-D < 30." },
      { medicationId: MED.ONDANSETRONA_8, line: "sintomatico", note: "Êmese gravídica refratária (após 1º trimestre)." },
      { medicationId: MED.METOCLOPRAMIDA, line: "sintomatico", note: "Náusea/vômitos da gestação." },
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico", note: "Analgesia segura na gestação." },
    ],
  },

  /* ============================================================
   * 🦠 INFECTO MISC
   * ============================================================ */
  {
    pathologyId: PATHO.CANDIDIASE_ORAL,
    suggestions: [
      { medicationId: MED.NISTATINA, line: "primeira", highlight: true, note: "Bochechar e engolir." },
      { medicationId: MED.FLUCONAZOL_150, line: "alternativa", note: "Casos extensos ou imunocomprometidos." },
    ],
  },
  {
    pathologyId: PATHO.HERPES_ZOSTER,
    context: "Antiviral nas primeiras 72h. Manejo agressivo da dor para reduzir neuralgia pós-herpética.",
    suggestions: [
      { medicationId: MED.DIPIRONA_500, line: "sintomatico", highlight: true },
      { medicationId: MED.PARACETAMOL_750, line: "sintomatico" },
      { medicationId: MED.TRAMADOL_50, line: "alternativa", note: "Dor neuropática intensa." },
      { medicationId: MED.CODEINA_30, line: "alternativa", note: "Opioide fraco alternativo." },
      { medicationId: MED.GABAPENTINA_300, line: "suporte", note: "Dor neuropática — titular." },
      { medicationId: MED.PREGABALINA_75, line: "suporte", note: "Alternativa para dor neuropática." },
      { medicationId: MED.AMITRIPTILINA, line: "suporte", note: "Prevenção de neuralgia pós-herpética." },
    ],
  },
];

/* ============================================================
 * Helpers
 * ============================================================ */

const PROTOCOL_INDEX: Map<number, PathologyProtocol> = new Map(
  PATHOLOGY_PROTOCOLS.map((p) => [p.pathologyId, p]),
);

/** Retorna o protocolo curado da patologia (ou undefined se não houver). */
export const getPathologyProtocol = (pathologyId: number): PathologyProtocol | undefined =>
  PROTOCOL_INDEX.get(pathologyId);

/** True se a patologia tem sugestões estruturadas curadas. */
export const hasCuratedProtocol = (pathologyId: number): boolean =>
  PROTOCOL_INDEX.has(pathologyId);

/** Rótulos amigáveis das linhas terapêuticas. */
export const LINE_LABELS: Record<SuggestionLine, string> = {
  primeira: "1ª linha",
  alternativa: "Alternativa",
  sintomatico: "Sintomático",
  suporte: "Suporte",
};

/** Cor (token semântico) para cada linha. Sem hardcoded. */
export const LINE_TOKENS: Record<
  SuggestionLine,
  { badge: string; ring: string }
> = {
  primeira: { badge: "bg-canon-blue/10 text-canon-blue", ring: "ring-canon-blue/20" },
  alternativa: { badge: "bg-ink-soft/60 text-ink-muted", ring: "ring-ink-soft" },
  sintomatico: { badge: "bg-warning/10 text-warning", ring: "ring-warning/20" },
  suporte: { badge: "bg-paper-alt text-ink-muted", ring: "ring-ink-soft" },
};

/** Ordem canônica para renderizar as linhas no card. */
export const LINE_ORDER: SuggestionLine[] = ["primeira", "alternativa", "sintomatico", "suporte"];
