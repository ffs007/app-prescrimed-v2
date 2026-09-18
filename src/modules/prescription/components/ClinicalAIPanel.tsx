/**
 * ClinicalAIPanel — Passo 5: apoio clínico por IA dentro do atendimento.
 *
 * Envia patologia + ambiente + perfil do paciente + prescrição atual para a
 * edge function `clinical-ai` e mostra condutas, medicamentos, exames e alertas
 * como SUGESTÃO (nada entra na receita sem clique do médico).
 */
import { useState } from "react";
import { Sparkles, AlertTriangle, Plus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClinicalAI, type AIAlerta } from "../hooks/useClinicalAI";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

interface Props {
  pathologyName?: string;
  environment?: string;
  patient: {
    idade?: string | null;
    peso?: string | null;
    pediatrico?: boolean;
    gestante?: boolean;
    alergias?: string | null;
    renal?: boolean;
  };
  medicamentos: string[];
  exames?: string[];
  /** Injeta um medicamento sugerido na receita. */
  onAddMedication?: (nome: string, texto: string) => void;
  /** Injeta um exame sugerido no pedido de exames. */
  onAddExam?: (nome: string) => void;
}

const PRIORITY_STYLE: Record<string, string> = {
  imediata: "border-destructive/40 bg-destructive/10 text-destructive",
  alta: "border-canon-blue/40 bg-canon-blue/10 text-canon-blue",
  media: "border-ink-soft bg-paper-alt/60 text-ink-muted",
  baixa: "border-ink-soft bg-paper-alt/40 text-ink-faint",
};

const ALERT_STYLE: Record<AIAlerta["gravidade"], string> = {
  critico: "border-destructive/40 bg-destructive/10 text-destructive",
  atencao: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  informativo: "border-ink-soft bg-paper-alt/60 text-ink-muted",
};

const ClinicalAIPanel = ({
  pathologyName,
  environment,
  patient,
  medicamentos,
  exames,
  onAddMedication,
  onAddExam,
}: Props) => {
  const { ask, loading, error, result } = useClinicalAI();
  const [question, setQuestion] = useState("");

  const run = (pergunta?: string) =>
    ask({
      patologia: pathologyName,
      ambiente: environment,
      paciente: patient,
      medicamentos,
      exames,
      pergunta,
    });

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Apoio clínico por IA
          </div>
          <h3 className="font-serif text-base font-semibold text-ink">
            Conferência e sugestões
          </h3>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" disabled={loading} onClick={() => run()}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : result ? <RefreshCw className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
          {result ? "Reavaliar" : "Analisar caso"}
        </Button>
      </div>

      <p className="text-[11px] leading-snug text-ink-muted">
        Sugestões geradas por IA a partir da patologia, do ambiente e do perfil do paciente.
        Toda conduta exige revisão e responsabilidade médica.
      </p>

      <div className="mt-3 flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && question.trim() && !loading) run(question.trim());
          }}
          placeholder="Pergunta específica — ex: posso usar AINE aqui?"
          className="h-9 text-xs"
        />
        <Button
          size="sm"
          variant="secondary"
          disabled={!question.trim() || loading}
          onClick={() => run(question.trim())}
        >
          Perguntar
        </Button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-[11px] text-destructive">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          {result.resumo && (
            <p className="text-xs leading-relaxed text-ink">{result.resumo}</p>
          )}

          {result.alertas.length > 0 && (
            <div className="space-y-1.5">
              {result.alertas.map((a, i) => (
                <div key={i} className={cn("flex gap-2 rounded-md border p-2.5 text-[11px] leading-snug", ALERT_STYLE[a.gravidade])}>
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{a.mensagem}</span>
                </div>
              ))}
            </div>
          )}

          {result.condutas.length > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                Condutas sugeridas
              </div>
              <ul className="space-y-1.5">
                {result.condutas.map((c, i) => (
                  <li key={i} className="rounded-md border border-ink-soft bg-paper-alt/40 p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">{c.titulo}</span>
                      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-medium uppercase", PRIORITY_STYLE[c.prioridade])}>
                        {c.prioridade}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-ink-muted">{c.detalhe}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(result.medicamentos_sugeridos?.length ?? 0) > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                Medicamentos sugeridos
              </div>
              <ul className="space-y-1.5">
                {result.medicamentos_sugeridos!.map((m, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 rounded-md border border-ink-soft bg-paper-alt/40 p-2.5">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-ink">{m.nome}</div>
                      <div className="text-[11px] leading-snug text-ink-muted">{m.posologia}</div>
                      {m.observacao && (
                        <div className="mt-0.5 text-[10px] leading-snug text-ink-faint">{m.observacao}</div>
                      )}
                    </div>
                    {onAddMedication && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 shrink-0 gap-1 px-2 text-[10px]"
                        onClick={() => onAddMedication(m.nome, [m.posologia, m.observacao].filter(Boolean).join(" — "))}
                      >
                        <Plus className="h-3 w-3" />
                        Usar
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(result.exames_sugeridos?.length ?? 0) > 0 && (
            <div>
              <div className="mb-1.5 text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
                Exames sugeridos
              </div>
              <div className="flex flex-wrap gap-1.5">
                {result.exames_sugeridos!.map((e, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={!onAddExam}
                    onClick={() => onAddExam?.(e)}
                    className="rounded-full border border-ink-soft bg-paper-alt/50 px-2.5 py-1 text-[10px] font-medium text-ink-muted hover:border-canon-blue/40 hover:text-canon-blue disabled:hover:border-ink-soft disabled:hover:text-ink-muted"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(result.escores_recomendados?.length ?? 0) > 0 && (
            <div className="text-[11px] text-ink-muted">
              <span className="font-semibold text-ink">Escores: </span>
              {result.escores_recomendados!.join(" · ")}
            </div>
          )}

          {(result.referencias?.length ?? 0) > 0 && (
            <div className="text-[10px] leading-snug text-ink-faint">
              {result.referencias!.join(" · ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClinicalAIPanel;
