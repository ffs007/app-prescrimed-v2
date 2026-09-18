// Comparação linha a linha entre a versão anterior e a nova de um protocolo.

export type DiffKind = "igual" | "adicionada" | "removida";
export interface DiffLine {
  kind: DiffKind;
  text: string;
}

/** Diff simples por LCS de linhas — suficiente para textos de protocolo. */
export function diffLines(anterior: string, novo: string): DiffLine[] {
  const a = (anterior ?? "").split("\n");
  const b = (novo ?? "").split("\n");
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i].trim() === b[j].trim() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].trim() === b[j].trim()) {
      out.push({ kind: "igual", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "removida", text: a[i] });
      i++;
    } else {
      out.push({ kind: "adicionada", text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ kind: "removida", text: a[i++] });
  while (j < m) out.push({ kind: "adicionada", text: b[j++] });
  return out;
}

export function diffStats(lines: DiffLine[]) {
  return {
    adicionadas: lines.filter((l) => l.kind === "adicionada").length,
    removidas: lines.filter((l) => l.kind === "removida").length,
  };
}
