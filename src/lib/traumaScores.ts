// Calculadoras de escores de trauma: RTS (Revised Trauma Score) e ISS (Injury Severity Score)
// Estratos derivados das faixas de `pontos_corte` cadastradas em stg_escores (lote medflow_ps_v1).

export type Estrato = "leve" | "moderado" | "grave" | "critico";

export interface ResultadoEscore {
  pontuacao: number;
  estrato: Estrato;
  rotulo: string;
  descricao: string;
  detalhes: string[];
}

export const ESTRATO_LABEL: Record<Estrato, string> = {
  leve: "Leve",
  moderado: "Moderado",
  grave: "Grave",
  critico: "Crítico",
};

/* ---------------------------- RTS ---------------------------- */

export const RTS_PESOS = { gcs: 0.9368, pas: 0.7326, fr: 0.2908 };

/** Codificação 0-4 do Glasgow */
export function codificarGCS(gcs: number): number {
  if (gcs >= 13) return 4;
  if (gcs >= 9) return 3;
  if (gcs >= 6) return 2;
  if (gcs >= 4) return 1;
  return 0;
}

/** Codificação 0-4 da pressão arterial sistólica (mmHg) */
export function codificarPAS(pas: number): number {
  if (pas > 89) return 4;
  if (pas >= 76) return 3;
  if (pas >= 50) return 2;
  if (pas >= 1) return 1;
  return 0;
}

/** Codificação 0-4 da frequência respiratória (irpm) */
export function codificarFR(fr: number): number {
  if (fr >= 10 && fr <= 29) return 4;
  if (fr > 29) return 3;
  if (fr >= 6) return 2;
  if (fr >= 1) return 1;
  return 0;
}

/** Faixa de gravidade do RTS (0–7.8408; quanto menor, mais grave) */
export function estratificarRTS(valor: number): Estrato {
  if (valor < 4) return "critico";
  if (valor < 6) return "grave";
  if (valor < 7.84) return "moderado";
  return "leve";
}

export interface EntradaRTS {
  gcs: number;
  pas: number;
  fr: number;
}

export function calcularRTS({ gcs, pas, fr }: EntradaRTS): ResultadoEscore {
  const cGcs = codificarGCS(gcs);
  const cPas = codificarPAS(pas);
  const cFr = codificarFR(fr);

  const bruto = RTS_PESOS.gcs * cGcs + RTS_PESOS.pas * cPas + RTS_PESOS.fr * cFr;
  const pontuacao = Math.round(bruto * 100) / 100;
  const estrato = estratificarRTS(pontuacao);

  const descricao: Record<Estrato, string> = {
    leve: "RTS máximo (7,84): fisiologia preservada. Manter observação conforme mecanismo de trauma.",
    moderado: "Alteração fisiológica leve a moderada. Reavaliação seriada e monitorização contínua.",
    grave: "Comprometimento fisiológico importante. Considerar acionamento de time de trauma.",
    critico: "Risco elevado de óbito. Suporte avançado imediato e transferência para centro de trauma.",
  };

  return {
    pontuacao,
    estrato,
    rotulo: `${pontuacao.toFixed(2)} / 7,84`,
    descricao: descricao[estrato],
    detalhes: [
      `Glasgow ${gcs} → código ${cGcs} (× ${RTS_PESOS.gcs})`,
      `PAS ${pas} mmHg → código ${cPas} (× ${RTS_PESOS.pas})`,
      `FR ${fr} irpm → código ${cFr} (× ${RTS_PESOS.fr})`,
    ],
  };
}

/* ---------------------------- ISS ---------------------------- */

export const ISS_REGIOES = [
  { key: "cabeca", label: "Cabeça / Pescoço" },
  { key: "face", label: "Face" },
  { key: "torax", label: "Tórax" },
  { key: "abdome", label: "Abdome / Pelve (conteúdo)" },
  { key: "extremidades", label: "Extremidades / Cintura pélvica" },
  { key: "externo", label: "Externo (pele / tegumento)" },
] as const;

export type RegiaoISS = (typeof ISS_REGIOES)[number]["key"];
export type EntradaISS = Record<RegiaoISS, number>;

export const AIS_LABEL: Record<number, string> = {
  0: "0 — Sem lesão",
  1: "1 — Leve",
  2: "2 — Moderada",
  3: "3 — Séria",
  4: "4 — Grave",
  5: "5 — Crítica",
  6: "6 — Não sobrevivível",
};

/** Faixa de gravidade do ISS (1–75; >= 16 trauma grave) */
export function estratificarISS(valor: number): Estrato {
  if (valor >= 25) return "critico";
  if (valor >= 16) return "grave";
  if (valor >= 9) return "moderado";
  return "leve";
}

export function calcularISS(entrada: EntradaISS): ResultadoEscore {
  const valores = ISS_REGIOES.map((r) => ({ label: r.label, ais: entrada[r.key] ?? 0 }));
  const naoSobrevivivel = valores.some((v) => v.ais === 6);

  const top3 = [...valores].sort((a, b) => b.ais - a.ais).slice(0, 3);
  const pontuacao = naoSobrevivivel ? 75 : top3.reduce((acc, v) => acc + v.ais * v.ais, 0);
  const estrato = naoSobrevivivel ? "critico" : estratificarISS(pontuacao);

  const descricao: Record<Estrato, string> = {
    leve: "Trauma leve (ISS 1–8). Conduta conforme lesão isolada.",
    moderado: "Trauma moderado (ISS 9–15). Investigação complementar e observação.",
    grave: "Trauma grave (ISS ≥ 16). Encaminhar a centro de trauma.",
    critico: "Trauma crítico (ISS ≥ 25). Mortalidade elevada; suporte avançado imediato.",
  };

  return {
    pontuacao,
    estrato,
    rotulo: `${pontuacao} / 75`,
    descricao: naoSobrevivivel
      ? "AIS 6 em alguma região: ISS fixado em 75 (lesão não sobrevivível)."
      : descricao[estrato],
    detalhes: naoSobrevivivel
      ? valores.filter((v) => v.ais === 6).map((v) => `${v.label}: AIS 6 → ISS = 75`)
      : top3
          .filter((v) => v.ais > 0)
          .map((v) => `${v.label}: AIS ${v.ais} → ${v.ais * v.ais} pontos`),
  };
}

/* ---------------------------- TRISS ---------------------------- */

export type MecanismoTrauma = "contuso" | "penetrante";

/** Coeficientes clássicos de Boyd (MTOS) por mecanismo de trauma */
export const TRISS_COEFICIENTES: Record<MecanismoTrauma, { b0: number; rts: number; iss: number; idade: number }> = {
  contuso: { b0: -0.4499, rts: 0.8085, iss: -0.0835, idade: -1.743 },
  penetrante: { b0: -2.5355, rts: 0.9934, iss: -0.0651, idade: -1.136 },
};

/** Faixas de probabilidade de sobrevivência (pontos_corte cadastrados para TRISS) */
export function estratificarTRISS(ps: number): Estrato {
  if (ps < 0.25) return "critico";
  if (ps < 0.5) return "grave";
  if (ps < 0.75) return "moderado";
  return "leve";
}

export interface EntradaTRISS {
  rts: number;
  iss: number;
  idadeAnos: number;
  mecanismo: MecanismoTrauma;
}

export function calcularTRISS({ rts, iss, idadeAnos, mecanismo }: EntradaTRISS): ResultadoEscore {
  const c = TRISS_COEFICIENTES[mecanismo];
  const indiceIdade = idadeAnos >= 55 ? 1 : 0;
  const b = c.b0 + c.rts * rts + c.iss * iss + c.idade * indiceIdade;
  const ps = 1 / (1 + Math.exp(-b));
  const pontuacao = Math.round(ps * 1000) / 1000;
  const estrato = estratificarTRISS(pontuacao);

  const descricao: Record<Estrato, string> = {
    leve: "Probabilidade alta de sobrevivência (≥ 75%). Manter conduta conforme lesões identificadas.",
    moderado: "Probabilidade intermediária (50–74%). Reavaliação seriada e suporte em centro de trauma.",
    grave: "Probabilidade baixa (25–49%). Priorizar suporte avançado e time de trauma.",
    critico: "Probabilidade muito baixa (< 25%). Mortalidade esperada elevada; medidas imediatas.",
  };

  return {
    pontuacao,
    estrato,
    rotulo: `${(pontuacao * 100).toFixed(1)}% de sobrevida`,
    descricao: descricao[estrato],
    detalhes: [
      `Mecanismo ${mecanismo} → b0 ${c.b0}`,
      `RTS ${rts.toFixed(2)} × ${c.rts}`,
      `ISS ${iss} × ${c.iss}`,
      `Idade ${idadeAnos} anos → índice ${indiceIdade} (× ${c.idade})`,
      `b = ${b.toFixed(4)} → Ps = 1 / (1 + e^-b)`,
    ],
  };
}
