import { Printer, Download, AlertTriangle, FileText, Info, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { RegulatoryGroup, RegulatoryGroupingResult } from "../services/regulatoryGrouping";
import type { ReceiptFamily } from "../services/regulatoryTaxonomy";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

interface Props {
  result: RegulatoryGroupingResult;
  /** Disparado quando o médico clica "Imprimir" em um grupo específico. */
  onPrintGroup: (group: RegulatoryGroup) => void;
  /** Disparado para gerar/baixar PDF do grupo. Async para permitir loading. */
  onDownloadGroup: (group: RegulatoryGroup) => Promise<void>;
  /** Documento está liberado pelo motor de segurança? */
  canEmit: boolean;
}

/* ============================================================
 * Tokens visuais por família
 * ============================================================ */

const FAMILY_TONE: Record<ReceiptFamily, string> = {
  comum: "border-ink-soft bg-card",
  antimicrobiano: "border-canon-blue/30 bg-canon-blue/5",
  "controle-especial": "border-canon-blue/40 bg-canon-blue/10",
  "notificacao-A": "border-warning/40 bg-warning/5",
  "notificacao-B": "border-sky-500/40 bg-sky-500/5",
  "notificacao-especial": "border-destructive/40 bg-destructive/5",
};

const FAMILY_BADGE_TONE: Record<ReceiptFamily, string> = {
  comum: "border-ink-soft bg-paper-alt text-ink-muted",
  antimicrobiano: "border-canon-blue/40 bg-canon-blue/10 text-canon-blue",
  "controle-especial": "border-canon-blue/50 bg-canon-blue/15 text-canon-blue",
  "notificacao-A": "border-warning/50 bg-warning/15 text-warning",
  "notificacao-B": "border-sky-500/50 bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "notificacao-especial": "border-destructive/50 bg-destructive/15 text-destructive",
};

/* ============================================================
 * Card de um grupo
 * ============================================================ */

const GroupCard = ({
  group,
  index,
  onPrint,
  onDownload,
  canEmit,
}: {
  group: RegulatoryGroup;
  index: number;
  onPrint: () => void;
  onDownload: () => Promise<void>;
  canEmit: boolean;
}) => {
  const [loading, setLoading] = useState(false);
  const { rules, items, family, subIndex, subTotal, notes } = group;

  const handleDownload = async () => {
    setLoading(true);
    try {
      await onDownload();
    } finally {
      setLoading(false);
    }
  };

  // Princípios ativos únicos (para chip resumo)
  const ingredients = Array.from(
    new Set(items.map((it) => it.classification.identifiedIngredient ?? it.medication.name)),
  );

  return (
    <div
      className={cn(
        "rounded-lg border shadow-paper transition",
        FAMILY_TONE[family],
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-ink-soft/40 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-soft bg-card text-[10px] font-semibold text-ink-muted">
              {index}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                FAMILY_BADGE_TONE[family],
              )}
            >
              {rules.label}
              {subIndex && subTotal && subTotal > 1 && (
                <span className="opacity-70">· {subIndex}/{subTotal}</span>
              )}
            </span>
            {rules.requiresOfficialPaper && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-warning">
                <AlertTriangle className="h-3 w-3" />
                Talonário oficial
              </span>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            {rules.description}
          </p>
        </div>
      </div>

      {/* Itens */}
      <div className="px-4 py-3">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
          {items.length} {items.length === 1 ? "item" : "itens"} · {ingredients.length} princípio{ingredients.length === 1 ? "" : "s"} ativo{ingredients.length === 1 ? "" : "s"}
        </div>
        <ul className="space-y-1">
          {items.map((it, i) => (
            <li key={`${it.selected.id}-${i}`} className="flex items-start gap-2 text-[12px] text-ink">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
              <span className="flex-1 leading-snug">{it.medication.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Metadata regulatória */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-ink-soft/40 px-4 py-2.5 text-[10px]">
        <div>
          <div className="font-semibold uppercase tracking-editorial text-ink-faint">Validade</div>
          <div className="text-ink">{rules.validityDays} dias</div>
        </div>
        <div>
          <div className="font-semibold uppercase tracking-editorial text-ink-faint">Vias</div>
          <div className="text-ink">{rules.copies} {rules.copies === 1 ? "via" : "vias"}</div>
        </div>
        <div className="col-span-2">
          <div className="font-semibold uppercase tracking-editorial text-ink-faint">Retenção</div>
          <div className="text-ink">{rules.retentionPolicy}</div>
        </div>
      </div>

      {/* Notes (regras aplicadas, ex: dividido por limite) */}
      {notes.length > 0 && (
        <div className="flex items-start gap-2 border-t border-ink-soft/40 bg-paper-alt/40 px-4 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-canon-blue" />
          <div className="text-[11px] text-ink-muted">
            {notes.map((n, i) => (
              <p key={i}>{n}</p>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col gap-1.5 border-t border-ink-soft/40 px-4 py-3 sm:flex-row">
        <Button
          onClick={onPrint}
          disabled={!canEmit || loading}
          className="h-9 flex-1 gap-2 bg-canon-blue text-primary-foreground hover:bg-canon-blue/90 disabled:bg-canon-blue/40"
        >
          <Printer className="h-3.5 w-3.5" />
          Imprimir
        </Button>
        <Button
          onClick={handleDownload}
          disabled={!canEmit || loading}
          variant="outline"
          className="h-9 flex-1 gap-2 border-canon-blue/40 text-canon-blue hover:bg-canon-blue/5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          {loading ? "Gerando…" : "Salvar PDF"}
        </Button>
      </div>
    </div>
  );
};

/* ============================================================
 * Painel completo
 * ============================================================ */

const RegulatoryReviewPanel = ({ result, onPrintGroup, onDownloadGroup, canEmit }: Props) => {
  const { groups, splitMessage, totalDocuments, distinctFamilies } = result;

  if (groups.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-ink-muted" />
        <h3 className="font-serif text-sm font-semibold text-ink">
          Documentos que serão emitidos
        </h3>
        <span className="ml-auto text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          {totalDocuments} {totalDocuments === 1 ? "documento" : "documentos"} · {distinctFamilies} {distinctFamilies === 1 ? "tipo" : "tipos"}
        </span>
      </div>

      {/* Mensagem inteligente sobre divisão */}
      {splitMessage && (
        <div className="flex items-start gap-2 rounded-md border border-canon-blue/30 bg-canon-blue/5 px-3 py-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-canon-blue" />
          <p className="text-[12px] leading-relaxed text-ink">
            <span className="font-semibold text-canon-blue">Divisão automática · </span>
            {splitMessage}
          </p>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-2.5">
        {groups.map((g, i) => (
          <GroupCard
            key={g.id}
            group={g}
            index={i + 1}
            onPrint={() => onPrintGroup(g)}
            onDownload={() => onDownloadGroup(g)}
            canEmit={canEmit}
          />
        ))}
      </div>

      {/* Guidance final */}
      {groups.some((g) => g.rules.requiresOfficialPaper) && (
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-[11px] leading-relaxed text-ink-muted">
            <span className="font-semibold text-warning">Atenção · </span>
            Notificações A (amarela) e B (azul) exigem talonário oficial numerado, fornecido pela vigilância sanitária local. O PDF gerado serve como rascunho/referência e deve ser transcrito para o talonário oficial.
          </p>
        </div>
      )}
    </div>
  );
};

export default RegulatoryReviewPanel;
