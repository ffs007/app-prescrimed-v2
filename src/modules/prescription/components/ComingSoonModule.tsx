import { Sparkles } from "lucide-react";

// Fallback for any future non-implemented action. All 7 actions are functional now.
const ComingSoonModule = ({ action }: { action: string }) => (
  <div className="rounded-lg border border-ink-soft bg-card p-6 shadow-paper sm:p-8">
    <div className="flex items-start gap-3 mb-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-canon-blue/10 text-canon-blue">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Em breve · roadmap
        </div>
        <h3 className="font-serif text-2xl font-semibold tracking-tight text-ink">
          Módulo em desenvolvimento
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          O módulo "{action}" será disponibilizado em breve.
        </p>
      </div>
    </div>
  </div>
);

export default ComingSoonModule;
