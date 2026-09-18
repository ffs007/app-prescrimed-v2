/**
 * ClinicalSupportPanel — Passo 6: consolida o apoio clínico do atendimento
 * (contexto da patologia, calculadora de dose e IA) em um único bloco com
 * abas, para manter a tela limpa: só um painel visível por vez e possibilidade
 * de recolher tudo.
 */
import { useState, type ReactNode } from "react";
import { Activity, BookOpen, Calculator, ChevronDown, Sparkles } from "lucide-react";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

type TabId = "sindrome" | "patologia" | "dose" | "ia";

const TABS: Array<{ id: TabId; label: string; icon: typeof BookOpen }> = [
  { id: "sindrome", label: "Síndrome", icon: Activity },
  { id: "patologia", label: "Patologia", icon: BookOpen },
  { id: "dose", label: "Dose", icon: Calculator },
  { id: "ia", label: "IA", icon: Sparkles },
];

interface Props {
  contexto: ReactNode;
  dose: ReactNode;
  ia: ReactNode;
  /** Bloco da síndrome ativa (Camada 2). Quando ausente, a aba não aparece. */
  sindrome?: ReactNode;
}

const ClinicalSupportPanel = ({ contexto, dose, ia, sindrome }: Props) => {
  const tabs = TABS.filter((t) => t.id !== "sindrome" || !!sindrome);
  const [tab, setTab] = useState<TabId>(sindrome ? "sindrome" : "patologia");
  const [open, setOpen] = useState(true);


  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setTab(id); setOpen(true); }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-editorial transition-colors",
                open && tab === id
                  ? "border-canon-blue/40 bg-canon-blue/10 text-canon-blue"
                  : "border-ink-soft bg-card text-ink-muted hover:text-ink",
              )}
              aria-pressed={open && tab === id}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-ink-muted hover:text-ink"
        >
          {open ? "Recolher" : "Apoio clínico"}
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div>
          {tab === "patologia" && contexto}
          {tab === "dose" && dose}
          {tab === "ia" && ia}
        </div>
      )}
    </section>
  );
};

export default ClinicalSupportPanel;
