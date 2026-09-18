import type { BlocoAgregado } from "./types";

export type PendenciaItem = {
  bloco: string;
  medicamento: string;
  faltando: string[];
};

export function gerarMarkdown(items: PendenciaItem[]): string {
  if (!items.length) return "# Nenhuma pendência registrada\n";
  const lines: string[] = ["# Lista de pendências — Base Medicamentosa", ""];
  const byBloco = new Map<string, PendenciaItem[]>();
  items.forEach((it) => {
    if (!byBloco.has(it.bloco)) byBloco.set(it.bloco, []);
    byBloco.get(it.bloco)!.push(it);
  });
  byBloco.forEach((arr, bloco) => {
    lines.push(`## ${bloco}`);
    arr.forEach((it) => {
      lines.push(`- **${it.medicamento}** — falta: ${it.faltando.join(", ")}`);
    });
    lines.push("");
  });
  return lines.join("\n");
}

export function gerarCSV(items: PendenciaItem[]): string {
  const head = "bloco,medicamento,faltando";
  const rows = items.map((it) => `"${it.bloco}","${it.medicamento}","${it.faltando.join("; ")}"`);
  return [head, ...rows].join("\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
