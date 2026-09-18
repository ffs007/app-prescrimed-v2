// Etapa 18 — Lista de documentos anteriores (atestados, encaminhamentos, etc.).
// Lê do snapshot de prescrições_historico.itens (filtra documentos não-medicamento).
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Copy, FileText } from "lucide-react";
import type { PrescriptionHistoryRow } from "./lib/types";
import { stripPatientPII } from "./lib/historySanitize";

interface DocItem {
  prescricaoId: string;
  data: string;
  profissional: string | null;
  tipo: string;
  titulo: string;
  raw: Record<string, unknown>;
}

interface Props {
  rows: PrescriptionHistoryRow[];
  onView: (doc: DocItem) => void;
  onDuplicate: (doc: DocItem, sanitized: Record<string, unknown>) => void;
  onUseAsBase: (doc: DocItem, sanitized: Record<string, unknown>) => void;
}

const NON_MED_KINDS = new Set([
  "atestado", "encaminhamento", "relatorio",
  "orientacao", "exame", "documento",
]);

export default function PreviousDocumentsList({ rows, onView, onDuplicate, onUseAsBase }: Props) {
  const docs: DocItem[] = rows.flatMap((p) => {
    const itens = (p.itens as unknown as Array<Record<string, unknown>>) ?? [];
    return itens
      .filter((it) => NON_MED_KINDS.has(String(it.kind)))
      .map((it) => ({
        prescricaoId: p.id,
        data: p.criado_em,
        profissional: p.profissional_nome,
        tipo: String(it.kind),
        titulo: String(it.titulo ?? it.kind),
        raw: it,
      }));
  });

  if (docs.length === 0) {
    return (
      <div className="text-xs text-muted-foreground rounded-md border bg-muted/30 p-3">
        Nenhum documento anterior encontrado.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Documentos anteriores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {docs.map((d, i) => (
          <div key={`${d.prescricaoId}-${i}`} className="flex items-start gap-2 rounded border p-2">
            <FileText className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{d.titulo}</div>
              <div className="text-[11px] text-muted-foreground">
                {new Date(d.data).toLocaleDateString("pt-BR")}
                {d.profissional && ` • ${d.profissional}`}
              </div>
              <Badge variant="outline" className="text-[10px] mt-1">{d.tipo}</Badge>
            </div>
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="ghost" onClick={() => onView(d)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost"
                onClick={() => onDuplicate(d, stripPatientPII(d.raw))}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline"
                onClick={() => onUseAsBase(d, stripPatientPII(d.raw))}>
                Usar como base
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
