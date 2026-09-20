import { useSearchParams } from "react-router-dom";
import PageMeta from "@/components/seo/PageMeta";
import ScoresHub from "@/modules/scores/ScoresHub";
import { SCORE_DEFINITIONS } from "@/modules/scores/lib/scoreCatalog";

export default function EscoresServidorPage() {
  const [params] = useSearchParams();
  const requested = params.get("escore");
  const initial = SCORE_DEFINITIONS.some((s) => s.id === requested) ? requested : null;

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <PageMeta
        title="Escores clínicos | PrescriMed"
        description="Calculadoras de escores clínicos validados, com cálculo e auditoria no servidor."
        path="/app/escores"
      />
      <header className="mb-5">
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">Base clínica</div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">Escores clínicos</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {SCORE_DEFINITIONS.length} escores calculados no servidor, com validação de população e registro em auditoria.
        </p>
      </header>
      <ScoresHub initialScoreId={initial} />
    </div>
  );
}
