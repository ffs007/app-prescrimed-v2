import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Eye, Download, Printer, Trash2, FileText, Building2, Ambulance, Search, Inbox } from "lucide-react";
import type { EmissionRecord } from "../hooks/useEmissionHistory";
import type { DocumentAction } from "./ActionGrid";

const DOC_TITLES: Record<DocumentAction, string> = {
  receita: "Receita médica",
  atestado: "Atestado",
  exames: "Solicitação de exames",
  encaminhamento: "Encaminhamento",
  declaracao: "Declaração",
  relatorio: "Relatório",
  orientacoes: "Orientações",
  procedimento: "Solicitação de procedimento",
  aih: "Laudo de internação (AIH)",
  apac: "Laudo APAC",
  notificacao: "Notificação compulsória",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: EmissionRecord[];
  onView: (record: EmissionRecord) => void;
  onPrint: (record: EmissionRecord) => void;
  onDownload: (record: EmissionRecord) => void;
  onRemove: (id: string) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EmissionHistoryDrawer = ({
  open,
  onOpenChange,
  history,
  onView,
  onPrint,
  onDownload,
  onRemove,
}: Props) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter((r) =>
      [r.patientName, DOC_TITLES[r.action], r.regulatoryLabel]
        .filter(Boolean)
        .some((s) => (s as string).toLowerCase().includes(q)),
    );
  }, [history, query]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col bg-paper p-0"
      >
        <SheetHeader className="border-b border-ink-soft px-5 py-4 text-left">
          <SheetTitle className="font-serif text-lg text-ink">
            Histórico de emissões
          </SheetTitle>
          <SheetDescription className="text-xs text-ink-muted">
            Reabra, imprima ou baixe novamente documentos já emitidos.
          </SheetDescription>
        </SheetHeader>

        {/* Busca */}
        <div className="border-b border-ink-soft px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por paciente ou tipo"
              className="h-9 w-full rounded-md border border-ink-soft bg-card pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filtered.length === 0 ? (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-alt text-ink-muted">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <p className="font-serif text-base text-ink">
                  {history.length === 0 ? "Nenhuma emissão ainda" : "Nada encontrado"}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {history.length === 0
                    ? "Os documentos emitidos aparecerão aqui."
                    : "Ajuste sua busca e tente novamente."}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-ink-soft">
              {filtered.map((r) => {
                const ContextIcon = r.context === "urgencia" ? Ambulance : Building2;
                return (
                  <li key={r.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-canon-blue" />
                          <span className="truncate text-sm font-medium text-ink">
                            {DOC_TITLES[r.action]}
                          </span>
                          {r.regulatoryLabel && (
                            <span className="rounded border border-ink-soft bg-paper-alt px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                              {r.regulatoryLabel}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm text-ink">
                          {r.patientName || (
                            <span className="italic text-ink-muted">Sem nome</span>
                          )}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                          <span>{formatDate(r.emittedAt)}</span>
                          <span className="inline-flex items-center gap-1">
                            <ContextIcon className="h-3 w-3" />
                            {r.context === "urgencia" ? "Urgência" : "Hospitalar"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemove(r.id)}
                        className="shrink-0 rounded p-1 text-ink-muted transition hover:bg-paper-alt hover:text-destructive"
                        aria-label="Remover do histórico"
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => onView(r)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Visualizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => onPrint(r)}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 text-xs"
                        onClick={() => onDownload(r)}
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default EmissionHistoryDrawer;
