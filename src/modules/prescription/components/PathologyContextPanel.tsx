/**
 * PathologyContextPanel — tudo o que é clínico da patologia ativa,
 * dentro do próprio atendimento: documentos sugeridos, protocolos, escores
 * e seções curadas (anamnese, exame físico, conduta...).
 */
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Calculator,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClinicalEnvironment } from "../types/prescription";
import type { DocumentAction } from "./ActionGrid";
import { ACTIONS } from "./ActionGrid";
import { usePathologyContext } from "../hooks/usePathologyContext";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const SECTION_LABEL: Record<string, string> = {
  anamnese: "Anamnese dirigida",
  exame_fisico: "Exame físico",
  diferenciais: "Diagnósticos diferenciais",
  exames: "Exames sugeridos",
  conduta: "Conduta",
  criterios_internacao: "Critérios de internação",
  encaminhamento: "Encaminhamento",
  notificacao: "Notificação compulsória",
  orientacoes: "Orientações ao paciente",
  monitorizacao: "Monitorização",
};

const RESOURCE_ICON = {
  protocolo: ClipboardList,
  escore: Calculator,
  trial: Sparkles,
  guideline: BookOpen,
  link: ExternalLink,
} as const;

const RESOURCE_LABEL = {
  protocolo: "Protocolo",
  escore: "Escore",
  trial: "Trial",
  guideline: "Guideline",
  link: "Link",
} as const;

const renderSectionBody = (conteudo: Record<string, unknown>) => {
  const items = (conteudo.itens ?? conteudo.items) as unknown;
  if (Array.isArray(items)) {
    return (
      <ul className="list-disc space-y-1 pl-4">
        {items.map((it, i) => (
          <li key={i}>{typeof it === "string" ? it : JSON.stringify(it)}</li>
        ))}
      </ul>
    );
  }
  if (typeof conteudo.texto === "string") return <p>{conteudo.texto}</p>;
  return <pre className="whitespace-pre-wrap text-[11px]">{JSON.stringify(conteudo, null, 2)}</pre>;
};

interface Props {
  pathologyName: string | null | undefined;
  environment: ClinicalEnvironment;
  activeAction: DocumentAction;
  onSelectAction: (a: DocumentAction) => void;
}

const PathologyContextPanel = ({
  pathologyName,
  environment,
  activeAction,
  onSelectAction,
}: Props) => {
  const { context, isLoading } = usePathologyContext(pathologyName, environment);
  const [openSection, setOpenSection] = useState<string | null>(null);

  if (!pathologyName) return null;

  const hasAnything =
    context.documentos.length > 0 || context.recursos.length > 0 || context.secoes.length > 0;

  if (!isLoading && !hasAnything) return null;

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-3">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Contexto clínico
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
          O que essa patologia pede
        </h2>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-paper-alt" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {context.documentos.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
                Documentos sugeridos
              </div>
              <div className="flex flex-wrap gap-2">
                {context.documentos.map((d) => {
                  const meta = ACTIONS.find((a) => a.id === d.documento);
                  if (!meta) return null;
                  const isActive = meta.id === activeAction;
                  const Icon = meta.icon;
                  return (
                    <button
                      key={d.documento}
                      type="button"
                      onClick={() => onSelectAction(meta.id)}
                      title={d.nota ?? undefined}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition",
                        isActive
                          ? "border-canon-blue bg-canon-blue/10 font-medium text-canon-blue"
                          : "border-ink-soft bg-paper-alt/40 text-ink hover:border-canon-blue/40 hover:bg-paper-alt",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {meta.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {context.recursos.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
                Protocolos, escores e evidência
              </div>
              <div className="space-y-1.5">
                {context.recursos.map((r) => {
                  const Icon = RESOURCE_ICON[r.tipo] ?? BookOpen;
                  return (
                    <div
                      key={r.id}
                      className="flex items-start gap-2.5 rounded-md border border-ink-soft bg-paper-alt/30 p-2.5"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-canon-blue" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium leading-tight text-ink">{r.titulo}</div>
                        <div className="mt-0.5 text-[11px] text-ink-muted">
                          {RESOURCE_LABEL[r.tipo] ?? r.tipo}
                          {r.codigo ? ` · ${r.codigo}` : ""}
                          {r.resumo ? ` · ${r.resumo}` : ""}
                        </div>
                      </div>
                      {r.url && (
                        <Button asChild variant="ghost" size="sm" className="h-7 shrink-0 px-2">
                          <a href={r.url} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {context.secoes.length > 0 && (
            <div className="space-y-1.5">
              {context.secoes.map((s) => {
                const open = openSection === s.secao;
                return (
                  <div key={s.secao} className="rounded-md border border-ink-soft">
                    <button
                      type="button"
                      onClick={() => setOpenSection(open ? null : s.secao)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-ink"
                    >
                      {SECTION_LABEL[s.secao] ?? s.secao}
                      <ChevronDown
                        className={cn("h-4 w-4 text-ink-muted transition", open && "rotate-180")}
                      />
                    </button>
                    {open && (
                      <div className="border-t border-ink-soft px-3 py-2.5 text-xs leading-relaxed text-ink-muted">
                        {renderSectionBody(s.conteudo)}
                        {s.fonte && (
                          <div className="mt-2 text-[10px] uppercase tracking-editorial text-ink-faint">
                            Fonte: {s.fonte}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PathologyContextPanel;
