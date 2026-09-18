// Etapa 18 — Comparação entre snapshot antigo do paciente e dados atuais.
import type { PatientSnapshot, ComparisonDiff } from "./types";

const fmt = (v: unknown): string | null =>
  v === undefined || v === null || v === "" ? null : String(v);

const arrDiff = (a: string[] = [], b: string[] = []) => {
  const setA = new Set(a.map((x) => x.toLowerCase()));
  const setB = new Set(b.map((x) => x.toLowerCase()));
  const novos = b.filter((x) => !setA.has(x.toLowerCase()));
  const removidos = a.filter((x) => !setB.has(x.toLowerCase()));
  return { novos, removidos };
};

/**
 * Compara o snapshot da prescrição anterior com os dados atuais.
 * Retorna apenas diffs relevantes do ponto de vista clínico.
 */
export function comparePatientSnapshots(
  anterior: PatientSnapshot,
  atual: PatientSnapshot,
): ComparisonDiff[] {
  const diffs: ComparisonDiff[] = [];

  // Peso — diferença > 5% relevante (ou >2kg para baixo peso).
  if (anterior.peso_kg && atual.peso_kg) {
    const delta = Math.abs(anterior.peso_kg - atual.peso_kg);
    const pct = delta / anterior.peso_kg;
    if (pct > 0.05 || delta >= 2) {
      diffs.push({
        campo: "peso",
        valor_anterior: `${anterior.peso_kg} kg`,
        valor_atual: `${atual.peso_kg} kg`,
        mensagem:
          "Peso atual diferente do peso usado na prescrição anterior. Recalcular dose por peso.",
        severidade: "alta",
      });
    }
  }

  // Idade
  if (anterior.idade_anos && atual.idade_anos) {
    if (Math.abs(anterior.idade_anos - atual.idade_anos) >= 1) {
      diffs.push({
        campo: "idade",
        valor_anterior: `${anterior.idade_anos} anos`,
        valor_atual: `${atual.idade_anos} anos`,
        mensagem: "Idade do paciente mudou desde a prescrição anterior.",
        severidade: "info",
      });
    }
  }

  // Função renal
  const clcrAnt = anterior.clcr ?? anterior.etfg;
  const clcrAtu = atual.clcr ?? atual.etfg;
  if (clcrAnt && clcrAtu) {
    if (Math.abs(clcrAnt - clcrAtu) >= 10) {
      const pior = clcrAtu < clcrAnt;
      diffs.push({
        campo: "funcao_renal",
        valor_anterior: `${clcrAnt} mL/min`,
        valor_atual: `${clcrAtu} mL/min`,
        mensagem: pior
          ? "Função renal atual pior que na prescrição anterior. Revisar dose/intervalo."
          : "Função renal atual diferente da anterior. Revisar dose/intervalo.",
        severidade: "alta",
      });
    }
  }

  // Alergias
  const alg = arrDiff(anterior.alergias, atual.alergias);
  if (alg.novos.length) {
    diffs.push({
      campo: "alergias",
      valor_anterior: (anterior.alergias ?? []).join(", ") || null,
      valor_atual: (atual.alergias ?? []).join(", ") || null,
      mensagem: `Nova alergia registrada desde a prescrição anterior: ${alg.novos.join(", ")}.`,
      severidade: "alta",
    });
  }

  // Gestação/Lactação
  if (Boolean(anterior.gestante) !== Boolean(atual.gestante)) {
    diffs.push({
      campo: "gestacao",
      valor_anterior: anterior.gestante ? "Sim" : "Não",
      valor_atual: atual.gestante ? "Sim" : "Não",
      mensagem:
        "Condição de gestação atual exige revisão dos medicamentos reaproveitados.",
      severidade: "alta",
    });
  }
  if (Boolean(anterior.lactante) !== Boolean(atual.lactante)) {
    diffs.push({
      campo: "lactacao",
      valor_anterior: anterior.lactante ? "Sim" : "Não",
      valor_atual: atual.lactante ? "Sim" : "Não",
      mensagem:
        "Condição de lactação atual exige revisão dos medicamentos reaproveitados.",
      severidade: "alta",
    });
  }

  // CID/diagnóstico
  if (fmt(anterior.cid) !== fmt(atual.cid)) {
    diffs.push({
      campo: "cid",
      valor_anterior: fmt(anterior.cid),
      valor_atual: fmt(atual.cid),
      mensagem: "CID/diagnóstico atual diferente do registrado anteriormente.",
      severidade: "atencao",
    });
  }

  // Comorbidades
  const com = arrDiff(anterior.comorbidades, atual.comorbidades);
  if (com.novos.length) {
    diffs.push({
      campo: "comorbidades",
      valor_anterior: (anterior.comorbidades ?? []).join(", ") || null,
      valor_atual: (atual.comorbidades ?? []).join(", ") || null,
      mensagem: `Novas comorbidades desde a prescrição anterior: ${com.novos.join(", ")}.`,
      severidade: "atencao",
    });
  }

  return diffs;
}

/** Verifica se há diferenças que exigem justificativa para reaproveitar. */
export function hasCriticalChanges(diffs: ComparisonDiff[]): boolean {
  return diffs.some((d) => d.severidade === "alta");
}
