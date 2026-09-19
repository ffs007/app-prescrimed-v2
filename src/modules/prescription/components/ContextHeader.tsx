import { Link, useNavigate } from "react-router-dom";
import { Stethoscope, Settings, LogOut, User, Building2, Ambulance, History } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { toast } from "sonner";

export type CareContext = "hospitalar" | "urgencia";

const CONTEXT_OPTIONS: { id: CareContext; label: string; icon: typeof Building2 }[] = [
  { id: "hospitalar", label: "Hospitalar", icon: Building2 },
  { id: "urgencia", label: "Urgência", icon: Ambulance },
];

interface ContextHeaderProps {
  context: CareContext;
  onContextChange: (c: CareContext) => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  historyCount?: number;
}

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

const ContextHeader = ({
  context,
  onContextChange,
  onOpenSettings,
  onOpenHistory,
  historyCount = 0,
}: ContextHeaderProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const subtitle =
    context === "hospitalar"
      ? "Enfermaria · internação"
      : "Pronto atendimento · plantão";

  return (
    <div className="sticky top-0 z-40 border-b border-ink-soft bg-paper/90 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-canon-blue/10 text-canon-blue ring-1 ring-canon-blue/20">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-serif text-lg font-semibold tracking-tight text-ink">
              Prescri<span className="text-canon-blue">Med+</span>
            </div>
            <div className="truncate text-[11px] text-ink-muted">{subtitle}</div>
          </div>
        </Link>

        {/* Segmented control desktop — CONTEXTO de atendimento */}
        <div className="hidden items-center gap-1 rounded-md border border-ink-soft bg-card p-1 md:flex">
          {CONTEXT_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onContextChange(id)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded px-3.5 text-xs font-medium uppercase tracking-wider transition",
                context === id
                  ? "bg-canon-blue text-primary-foreground shadow-sm"
                  : "text-ink-muted hover:bg-paper-alt"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-soft bg-card text-ink-muted transition hover:bg-paper-alt"
            aria-label="Histórico de emissões"
            title="Histórico de emissões"
          >
            <History className="h-4 w-4" />
            {historyCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-canon-blue px-1 text-[9px] font-semibold leading-none text-primary-foreground">
                {historyCount > 99 ? "99+" : historyCount}
              </span>
            )}
          </button>
          <button
            onClick={onOpenSettings}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-soft bg-card text-ink-muted transition hover:bg-paper-alt"
            aria-label="Configurações"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => void signOut()
              .then(() => navigate("/login", { replace: true }))
              .catch(() => toast.error("Não foi possível encerrar a sessão."))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-soft bg-card text-ink-muted transition hover:bg-paper-alt"
            aria-label="Sair"
            title="Encerrar sessão"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-canon-blue/10 text-canon-blue">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Segmented mobile — CONTEXTO */}
      <div className="border-t border-ink-soft px-4 py-2 md:hidden">
        <div className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto pb-1">
          {CONTEXT_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onContextChange(id)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition",
                context === id
                  ? "border-canon-blue bg-canon-blue text-primary-foreground"
                  : "border-ink-soft bg-card text-ink-muted"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContextHeader;
