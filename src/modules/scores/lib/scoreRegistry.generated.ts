// Gerado a partir de src/integrations/supabase/types.ts (Args de fn_calcular_*). Não editar à mão:
// regenerar quando o banco mudar. Metadados de exibição ficam em scoreCatalog.ts.
export type ScoreParamKind = "boolean" | "number" | "list" | "text";

export interface ScoreParamSpec {
  name: string;
  kind: ScoreParamKind;
  required: boolean;
  default?: string | number | boolean;
}

export interface ScoreFnSpec {
  id: string;
  fn: string;
  ageParam: "p_idade" | "p_idade_anos" | null;
  params: ScoreParamSpec[];
}

export const SCORE_FUNCTIONS: ScoreFnSpec[] = [
  {
    "id": "4at",
    "fn": "fn_calcular_4at",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_alerta",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_amt4",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_atencao",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_curso_agudo",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "abcd2",
    "fn": "fn_calcular_abcd2",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_diabetes",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_duracao_min",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_fala_sem_fraqueza",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fraqueza_unilateral",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_pad",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "aims65",
    "fn": "fn_calcular_aims65",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_albumina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_alteracao_mental",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_inr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "air",
    "fn": "fn_calcular_air",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_defesa",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_dor_fid",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_leucocitos",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pcr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pmn_pct",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_temperatura",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_vomito",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "alvarado",
    "fn": "fn_calcular_alvarado",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_anorexia",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_desvio_esquerda",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_fid",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_febre",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_leucocitose",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_migracao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_nausea_vomito",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_rebound",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "apache2",
    "fn": "fn_calcular_apache2",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "uti_adulto"
      },
      {
        "name": "p_doenca_cronica_pontos",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_idade_pontos",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_score_fisiologico",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "apgar",
    "fn": "fn_calcular_apgar",
    "ageParam": null,
    "params": [
      {
        "name": "p_cor_pts",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_esforco_respiratorio_pts",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_frequencia_cardiaca_pts",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_idade_dias",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_reflexo_pts",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_tempo_min",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_tonus_muscular_pts",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "asa",
    "fn": "fn_calcular_asa",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_asa_classe",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "cirurgico_adulto"
      },
      {
        "name": "p_emergencia",
        "kind": "boolean",
        "required": false,
        "default": false
      }
    ]
  },
  {
    "id": "atria",
    "fn": "fn_calcular_atria",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_anemia",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "fa_anticoagulada_adulto"
      },
      {
        "name": "p_doenca_renal",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_idade_pontos",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_sangramento_previo",
        "kind": "boolean",
        "required": false,
        "default": false
      }
    ]
  },
  {
    "id": "audit",
    "fn": "fn_calcular_audit",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_itens",
        "kind": "list",
        "required": true
      }
    ]
  },
  {
    "id": "bisap",
    "fn": "fn_calcular_bisap",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_comprometimento_mental",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_derrame_pleural",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_sirs_criterios",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_ureia",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "bps",
    "fn": "fn_calcular_bps",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_conformidade_ventilador",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_expressao_facial",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_intubado",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_movimento_membros",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "canadian_cspine",
    "fn": "fn_calcular_canadian_cspine",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_fator_baixo_risco",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_mecanismo_perigoso",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_parestesias",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_rotacao_45_graus",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "cha2ds2_vasc",
    "fn": "fn_calcular_cha2ds2_vasc",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_avc_previo",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dm",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_doenca_vascular",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fa_valvar",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_has",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_ic",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_sexo",
        "kind": "text",
        "required": true
      }
    ]
  },
  {
    "id": "child_pugh",
    "fn": "fn_calcular_child_pugh",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_albumina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_ascite",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_bilirrubina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_encefalopatia",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_inr",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "ciwa_ar",
    "fn": "fn_calcular_ciwa_ar",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_dominios",
        "kind": "list",
        "required": true
      },
      {
        "name": "p_orientacao",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "cpot",
    "fn": "fn_calcular_cpot",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_conformidade_ventilador",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_expressao_facial",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_intubado",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_movimentos_corporais",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_tensao_muscular",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_vocalizacao",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "crb65",
    "fn": "fn_calcular_crb65",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_confusao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pad",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "crusade",
    "fn": "fn_calcular_crusade",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "nste_acs_adulto"
      },
      {
        "name": "p_creatinina_cl",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_diabetes",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_doenca_vascular_periferica",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_hematocrito",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_ic",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_sexo",
        "kind": "text",
        "required": false,
        "default": "M"
      }
    ]
  },
  {
    "id": "cssrs",
    "fn": "fn_calcular_cssrs",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_comportamento_3meses",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_comportamento_suicida",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_desejo_morte",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_intencao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_metodo",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_pensamentos_ativos",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_plano",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "curb65",
    "fn": "fn_calcular_curb65",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_confusao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pad",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_ureia",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "euroscore2",
    "fn": "fn_calcular_euroscore2",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "cirurgico_cardiaco_adulto"
      },
      {
        "name": "p_euroscore2",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "euroscore2_expandido",
    "fn": "fn_calcular_euroscore2_expandido",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_altura",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_cirurgia_emergencia",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_cirurgia_urgente",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "cirurgia_cardiaca_adulto"
      },
      {
        "name": "p_creatinina_cl",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_endocardite",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_feve",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_nyha",
        "kind": "number",
        "required": false,
        "default": 1
      },
      {
        "name": "p_operacao_previa",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_peso",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_sexo",
        "kind": "text",
        "required": false,
        "default": "M"
      }
    ]
  },
  {
    "id": "flacc",
    "fn": "fn_calcular_flacc",
    "ageParam": null,
    "params": [
      {
        "name": "p_atividade",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_choro",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_consolabilidade",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_face",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_idade_dias",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pernas",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "gbs",
    "fn": "fn_calcular_gbs",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_hemoglobina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_hepatopatia",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_ic",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_melena",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pulso",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_red_flag",
        "kind": "text",
        "required": false
      },
      {
        "name": "p_sexo",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_sincope",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_ureia_mmol",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "gcs",
    "fn": "fn_calcular_gcs",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_motora",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_ocular",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_red_flag",
        "kind": "text",
        "required": false
      },
      {
        "name": "p_verbal",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "gcs_trauma",
    "fn": "fn_calcular_gcs_trauma",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "trauma_adulto"
      },
      {
        "name": "p_idade_dias",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_intubado",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_motora",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_ocular",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_verbal",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "grace",
    "fn": "fn_calcular_grace",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_biomarcador_elevado",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_choque",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_creatinina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_desvio_st",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_killip",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_parada_cardiaca",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "grace_bleeding",
    "fn": "fn_calcular_grace_bleeding",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "sca_adulto"
      },
      {
        "name": "p_grace_sangramento",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "has_bled",
    "fn": "fn_calcular_has_bled",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_alcool",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_avc_previo",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_drogas_antiplaquetarias",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_funcao_hepatica_alterada",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_funcao_renal_alterada",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_has_nao_controlada",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_inr_labil",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_sangramento_previo",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "hasbled",
    "fn": "fn_calcular_hasbled",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_avc_previo",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "fa_anticoagulada_adulto"
      },
      {
        "name": "p_drogas_ou_alcool",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_funcao_hepatica_anormal",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_funcao_renal_anormal",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_has",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_inr_labil",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_sangramento_previo",
        "kind": "boolean",
        "required": false,
        "default": false
      }
    ]
  },
  {
    "id": "heart",
    "fn": "fn_calcular_heart",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_ecg",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_fatores_risco",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_historia",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_red_flag",
        "kind": "text",
        "required": false
      },
      {
        "name": "p_troponina",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "hunt_hess",
    "fn": "fn_calcular_hunt_hess",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_grau",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "iss",
    "fn": "fn_calcular_iss",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_ais_abdome",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_ais_cabeca",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_ais_externo",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_ais_extremidades",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_ais_face",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_ais_torax",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "trauma_adulto"
      },
      {
        "name": "p_idade_dias",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "lrinec",
    "fn": "fn_calcular_lrinec",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_creatinina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_dor_desproporcional",
        "kind": "boolean",
        "required": false
      },
      {
        "name": "p_glicose",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_hemoglobina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_leucocitos",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pcr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_sodio",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "mascc",
    "fn": "fn_calcular_mascc",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_ambulatorial",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_burden",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_instabilidade",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_sem_desidratacao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_sem_dpoc",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_sem_hipotensao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_tumor_solido",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "meld",
    "fn": "fn_calcular_meld",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_bilirrubina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_creatinina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_dialise",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_inr",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "meld_na",
    "fn": "fn_calcular_meld_na",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_bilirrubina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_creatinina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_dialise",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_inr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_sodio",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "mews_ob",
    "fn": "fn_calcular_mews_ob",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_consciencia",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_contexto",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_diurese_ml_h",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_temperatura",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "news2",
    "fn": "fn_calcular_news2",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_consciencia",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_escala",
        "kind": "number",
        "required": false,
        "default": 1
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_red_flag",
        "kind": "text",
        "required": false
      },
      {
        "name": "p_spo2",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_suplemento",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_temperatura",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "nexus",
    "fn": "fn_calcular_nexus",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_deficit_focal",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_linha_media",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_intoxicacao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_lesao_distratora",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_nivel_consciencia_alterado",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "orbit",
    "fn": "fn_calcular_orbit",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "fa_anticoagulada_adulto"
      },
      {
        "name": "p_doenca_renal",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_hemoglobina",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_idade_pontos",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_sangramento_previo",
        "kind": "boolean",
        "required": false,
        "default": false
      }
    ]
  },
  {
    "id": "ottawa_joelho",
    "fn": "fn_calcular_ottawa_joelho",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_dor_cabeca_fibula",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_patela_isolada",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_incapaz_apoiar",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_incapaz_flexao_90",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "ottawa_tornozelo",
    "fn": "fn_calcular_ottawa_tornozelo",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_dor_base_5mt",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_maleolar",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_maleolo_lateral",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_maleolo_medial",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_mediope",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dor_navicular",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_incapaz_apoiar",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "perc",
    "fn": "fn_calcular_perc",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_cirurgia_trauma",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_edema_unilateral",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_estrogenio",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_hemoptise",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_probabilidade_pre_teste",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_spo2",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_tep_previa",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "phq9",
    "fn": "fn_calcular_phq9",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_item1",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item2",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item3",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item4",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item5",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item6",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item7",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item8",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_item9",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "possum",
    "fn": "fn_calcular_possum",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "cirurgico_adulto"
      },
      {
        "name": "p_score_fisiologico",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_score_operativo",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "qsofa",
    "fn": "fn_calcular_qsofa",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_consciencia_alterada",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_red_flag",
        "kind": "text",
        "required": false
      }
    ]
  },
  {
    "id": "ranson",
    "fn": "fn_calcular_ranson",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_ast",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_glicose",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_ldh",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_leucocitos",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "rcri",
    "fn": "fn_calcular_rcri",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_cardiopatia_isquemica",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_cirurgia_alto_risco",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "cirurgico_nao_cardiaco_adulto"
      },
      {
        "name": "p_diabetes_insulina",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_doenca_cerebrovascular",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_insuficiencia_cardiaca",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_insuficiencia_renal",
        "kind": "boolean",
        "required": false,
        "default": false
      }
    ]
  },
  {
    "id": "regiscar",
    "fn": "fn_calcular_regiscar",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_eosinofilia",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_exclusao_investigada",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_febre",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_linfonodomegalia",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_orgao_interno",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_rash_extenso",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "rockall",
    "fn": "fn_calcular_rockall",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_comorbidade",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_diagnostico",
        "kind": "text",
        "required": true
      },
      {
        "name": "p_estigmas_sangramento",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "rts",
    "fn": "fn_calcular_rts",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "trauma_adulto"
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_gcs",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_idade_dias",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "saps2",
    "fn": "fn_calcular_saps2",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "uti_adulto"
      },
      {
        "name": "p_saps2_pontos",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "scorten",
    "fn": "fn_calcular_scorten",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_bicarbonato",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_glicose",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_malignidade",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_scq_pct",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_ureia",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "sins",
    "fn": "fn_calcular_sins",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_alinhamento",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_colapso",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_dor",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_lesao_ossea",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_localizacao",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_posterolateral",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "sirs",
    "fn": "fn_calcular_sirs",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_bastoes_pct",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_leucocitos",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_paco2",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_temperatura",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "smart_cop",
    "fn": "fn_calcular_smart_cop",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_albumina",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_confusao",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_fr",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_multilobar",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_pas",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_ph",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_spo2",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "sofa",
    "fn": "fn_calcular_sofa",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_bilirrubina",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_creatinina",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_diurese_ml_dia",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_dose_vasopressor",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_gcs",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_pam",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_pao2_fio2",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_plaquetas",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_vasopressor",
        "kind": "text",
        "required": false
      }
    ]
  },
  {
    "id": "syntax",
    "fn": "fn_calcular_syntax",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "intervenção_coronariana_adulto"
      },
      {
        "name": "p_syntax_score",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "syntax2",
    "fn": "fn_calcular_syntax2",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "intervenção_coronariana_adulto"
      },
      {
        "name": "p_creatinina_cl",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_diabetes",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_doenca_tronco",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_doenca_vascular_periferica",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_feve",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_idade_pontos",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_sexo",
        "kind": "text",
        "required": false,
        "default": "M"
      },
      {
        "name": "p_syntax_score",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "timi",
    "fn": "fn_calcular_timi",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_2_angina_24h",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_3_fatores_risco",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_aas_7dias",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_biomarcador_elevado",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dac_conhecida",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_desvio_st",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "timi_bleeding",
    "fn": "fn_calcular_timi_bleeding",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "nste_acs_adulto"
      },
      {
        "name": "p_desvio_st",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_doenca_renal",
        "kind": "boolean",
        "required": false,
        "default": false
      },
      {
        "name": "p_idade_pontos",
        "kind": "number",
        "required": false,
        "default": 0
      },
      {
        "name": "p_peso",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_sexo",
        "kind": "text",
        "required": false,
        "default": "M"
      }
    ]
  },
  {
    "id": "triss",
    "fn": "fn_calcular_triss",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_contexto",
        "kind": "text",
        "required": false,
        "default": "trauma_adulto"
      },
      {
        "name": "p_idade_dias",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_iss",
        "kind": "number",
        "required": false
      },
      {
        "name": "p_mecanismo",
        "kind": "text",
        "required": false,
        "default": "contuso"
      },
      {
        "name": "p_rts",
        "kind": "number",
        "required": false
      }
    ]
  },
  {
    "id": "wells_tep",
    "fn": "fn_calcular_wells_tep",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_cancer",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_dx_alternativo_menos_provavel",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_fc",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_hemoptise",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_imobilizacao_cirurgia",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_red_flag",
        "kind": "text",
        "required": false
      },
      {
        "name": "p_sinais_tvp",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_tep_previa",
        "kind": "boolean",
        "required": true
      }
    ]
  },
  {
    "id": "wfns",
    "fn": "fn_calcular_wfns",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_deficit_motor",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_gcs",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "wong_baker",
    "fn": "fn_calcular_wong_baker",
    "ageParam": "p_idade_anos",
    "params": [
      {
        "name": "p_faces",
        "kind": "number",
        "required": true
      }
    ]
  },
  {
    "id": "years",
    "fn": "fn_calcular_years",
    "ageParam": "p_idade",
    "params": [
      {
        "name": "p_dimero",
        "kind": "number",
        "required": true
      },
      {
        "name": "p_hemoptise",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_sinais_tvp",
        "kind": "boolean",
        "required": true
      },
      {
        "name": "p_tep_mais_provavel",
        "kind": "boolean",
        "required": true
      }
    ]
  }
];
