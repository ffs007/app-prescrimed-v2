import type { TesteClinicoV2 } from "../hooks/useTestesClinicosV2";
import { STATUS_LABEL, CATEGORIA_LABEL } from "./status";

function acaoRecomendada(t: TesteClinicoV2): string {
  if (t.status_teste === "reprovado" && t.critico) return "Corrigir antes do beta (crítico)";
  if (t.status_teste === "reprovado") return "Rever módulo e ajustar";
  if (t.status_teste === "precisa_ajuste") return "Ajuste solicitado";
  if (t.status_teste === "pendente") return t.critico ? "Executar (crítico)" : "Executar";
  if (t.status_teste === "ignorado") return "Ignorado com justificativa";
  return "Nenhuma";
}

function toRows(items: TesteClinicoV2[]) {
  return items.map((t) => ({
    codigo: t.codigo,
    nome: t.nome_teste,
    categoria: CATEGORIA_LABEL[t.categoria_teste] ?? t.categoria_teste,
    critico: t.critico ? "sim" : "não",
    status: STATUS_LABEL[t.status_teste],
    resultado_esperado: t.alerta_esperado ?? "",
    resultado_obtido: t.resultado_obtido ?? "",
    observacao: t.observacao ?? "",
    data_teste: t.data_hora_teste ?? "",
    acao: acaoRecomendada(t),
  }));
}

export function exportCSV(items: TesteClinicoV2[]) {
  const rows = toRows(items);
  const headers = Object.keys(rows[0] ?? { codigo: "" });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as Record<string, unknown>)[h])).join(","))].join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `testes-clinicos-${dateStamp()}.csv`);
}

export async function exportXLSX(items: TesteClinicoV2[]) {
  const XLSX = await import("xlsx");
  const rows = toRows(items);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Testes Clínicos");
  XLSX.writeFile(wb, `testes-clinicos-${dateStamp()}.xlsx`);
}

export function exportPDF(items: TesteClinicoV2[]) {
  const rows = toRows(items);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Relatório Testes Clínicos</title>
    <style>
      body{font-family:system-ui,-apple-system,Arial,sans-serif;padding:24px;color:#111;font-size:12px}
      h1{font-size:16px;margin:0 0 4px}
      p.sub{color:#666;margin:0 0 16px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}
      th{background:#f5f5f5;font-size:11px}
      tr.crit td{background:#fff5f5}
    </style></head><body>
    <h1>Relatório de Testes Clínicos — PrescriMed</h1>
    <p class="sub">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <table><thead><tr>
      <th>Código</th><th>Nome</th><th>Categoria</th><th>Crítico</th><th>Status</th>
      <th>Esperado</th><th>Obtido</th><th>Observação</th><th>Data</th><th>Ação</th>
    </tr></thead><tbody>
    ${rows.map((r) => `<tr class="${r.critico === "sim" ? "crit" : ""}">
      <td>${r.codigo}</td><td>${r.nome}</td><td>${r.categoria}</td>
      <td>${r.critico}</td><td>${r.status}</td>
      <td>${escape(r.resultado_esperado)}</td><td>${escape(r.resultado_obtido)}</td>
      <td>${escape(r.observacao)}</td><td>${r.data_teste ? new Date(r.data_teste).toLocaleString("pt-BR") : ""}</td>
      <td>${r.acao}</td></tr>`).join("")}
    </tbody></table>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function escape(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
}
function dateStamp() { return new Date().toISOString().slice(0, 10); }
function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
