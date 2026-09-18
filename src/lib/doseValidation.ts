export interface DoseRegistro {
  id: string;
  lote_id: string;
  linha_origem: string | null;
  principio_ativo: string | null;
  via: string | null;
  indicacao: string | null;
  populacao: string | null;
  dose_tipo: string | null;
  dose_min: string | null;
  dose_max: string | null;
  dose_unidade: string | null;
  fonte_id: string | null;
  versao?: number | null;
  status_revisao?: string | null;
}

export type Severidade = "erro" | "alerta";

export interface Inconsistencia {
  doseId: string;
  campo: string;
  severidade: Severidade;
  mensagem: string;
}

/** Unidades reconhecidas, agrupadas por natureza da dose */
export const UNIDADES_POR_TIPO: Record<string, string[]> = {
  peso: ["mg/kg", "mcg/kg", "mcg/kg/min", "mg/kg/h", "mcg/kg/h", "mL/kg", "UI/kg", "g/kg"],
  fixa: ["mg", "mcg", "g", "mL", "mEq", "UI", "mcg/min", "mg/h", "mg/min", "mL/h", "gotas/min"],
};

const TODAS_UNIDADES = [...UNIDADES_POR_TIPO.peso, ...UNIDADES_POR_TIPO.fixa];

const numero = (v: string | null): number | null => {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export function validarDose(d: DoseRegistro): Inconsistencia[] {
  const out: Inconsistencia[] = [];
  const push = (campo: string, severidade: Severidade, mensagem: string) =>
    out.push({ doseId: d.id, campo, severidade, mensagem });

  // Campos obrigatórios
  const obrigatorios: Array<[keyof DoseRegistro, string]> = [
    ["principio_ativo", "Princípio ativo"],
    ["via", "Via"],
    ["populacao", "População"],
    ["dose_tipo", "Tipo de dose"],
    ["dose_unidade", "Unidade"],
    ["fonte_id", "Fonte"],
  ];
  for (const [campo, rotulo] of obrigatorios) {
    const valor = d[campo];
    if (valor == null || String(valor).trim() === "") {
      push(String(campo), "erro", `${rotulo} é obrigatório.`);
    }
  }

  const min = numero(d.dose_min);
  const max = numero(d.dose_max);

  if (d.dose_min == null || String(d.dose_min).trim() === "") {
    push("dose_min", "erro", "Dose mínima é obrigatória.");
  } else if (min === null) {
    push("dose_min", "erro", "Dose mínima não é um número válido.");
  } else if (min < 0) {
    push("dose_min", "erro", "Dose mínima não pode ser negativa.");
  }

  if (d.dose_max == null || String(d.dose_max).trim() === "") {
    push("dose_max", "erro", "Dose máxima é obrigatória.");
  } else if (max === null) {
    push("dose_max", "erro", "Dose máxima não é um número válido.");
  } else if (max < 0) {
    push("dose_max", "erro", "Dose máxima não pode ser negativa.");
  }

  if (min !== null && max !== null && min > max) {
    push("dose_max", "erro", `Valores invertidos: mínima (${min}) maior que máxima (${max}).`);
  }

  if (min !== null && max !== null && max > 0 && min > 0 && max / min > 100) {
    push("dose_max", "alerta", "Intervalo entre mínima e máxima muito amplo (>100x) — confirmar unidade.");
  }

  const unidade = (d.dose_unidade ?? "").trim();
  if (unidade) {
    if (!TODAS_UNIDADES.includes(unidade)) {
      push("dose_unidade", "alerta", `Unidade "${unidade}" fora da lista padronizada.`);
    }
    const porPeso = unidade.includes("/kg");
    if (d.dose_tipo === "peso" && !porPeso) {
      push("dose_unidade", "erro", `Dose por peso deve usar unidade por kg (recebido "${unidade}").`);
    }
    if (d.dose_tipo === "fixa" && porPeso) {
      push("dose_unidade", "erro", `Dose fixa não deve usar unidade por kg (recebido "${unidade}").`);
    }
  }

  return out;
}

export function validarLote(doses: DoseRegistro[]) {
  const todas = doses.flatMap(validarDose);
  return {
    inconsistencias: todas,
    porDose: todas.reduce<Record<string, Inconsistencia[]>>((acc, i) => {
      (acc[i.doseId] ||= []).push(i);
      return acc;
    }, {}),
    erros: todas.filter((i) => i.severidade === "erro").length,
    alertas: todas.filter((i) => i.severidade === "alerta").length,
  };
}
