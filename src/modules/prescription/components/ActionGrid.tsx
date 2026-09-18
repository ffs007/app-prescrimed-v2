import {
  Pill,
  FlaskConical,
  Send,
  FileCheck2,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  Stethoscope,
  ArrowRight,
  AlertTriangle,
  BedDouble,
  FileSpreadsheet,
  Siren,
} from "lucide-react";

export type DocumentAction =
  | "receita"
  | "exames"
  | "encaminhamento"
  | "atestado"
  | "declaracao"
  | "relatorio"
  | "orientacoes"
  | "procedimento"
  | "aih"
  | "apac"
  | "notificacao";

/** Hierarquia conceitual (não quebra a simetria visual da grade). */
export type ActionTier = "primary" | "clinical" | "administrative" | "complementary";

/** Dependências do paciente que cada módulo "valoriza" — base para alertas contextuais. */
export type PatientDependency =
  | "name"
  | "age"
  | "weight"
  | "sex"
  | "allergies"
  | "renal"
  | "pregnancy";

export interface ActionMeta {
  id: DocumentAction;
  name: string;
  desc: string;
  icon: typeof Pill;
  available: boolean;
  tier: ActionTier;
  /** Dados do paciente que o módulo aproveita; usado para alertas contextuais. */
  uses: PatientDependency[];
  /** Subset de `uses` que vira alerta visível quando ausente E condição clínica aplicável. */
  criticalIfMissing?: PatientDependency[];
}

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

export const ACTIONS: ActionMeta[] = [
  // Primário — peça central do produto
  {
    id: "receita",
    name: "Receita médica",
    desc: "Comum, especial e controle",
    icon: Pill,
    available: true,
    tier: "primary",
    uses: ["name", "age", "weight", "allergies", "pregnancy", "renal"],
    criticalIfMissing: ["weight"], // só dispara se isPediatric
  },
  // Clínicos de alto uso
  {
    id: "exames",
    name: "Solicitação de exames",
    desc: "Laboratoriais e imagem",
    icon: FlaskConical,
    available: true,
    tier: "clinical",
    uses: ["name", "age", "sex"],
  },
  {
    id: "encaminhamento",
    name: "Encaminhamento",
    desc: "Especialidade, hipótese, urgência",
    icon: Send,
    available: true,
    tier: "clinical",
    uses: ["name", "age", "sex", "allergies"],
  },
  // Administrativos
  {
    id: "atestado",
    name: "Atestado",
    desc: "Período, CID e observações",
    icon: FileCheck2,
    available: true,
    tier: "administrative",
    uses: ["name"],
  },
  {
    id: "declaracao",
    name: "Declaração de comparecimento",
    desc: "Data, horário, acompanhante",
    icon: CalendarCheck,
    available: true,
    tier: "administrative",
    uses: ["name"],
  },
  // Complementares
  {
    id: "relatorio",
    name: "Relatório de atendimento",
    desc: "Anamnese, hipótese, conduta",
    icon: ClipboardList,
    available: true,
    tier: "complementary",
    uses: ["name", "age", "sex", "allergies", "pregnancy"],
  },
  {
    id: "orientacoes",
    name: "Orientações & retorno",
    desc: "Sinais de alarme, plano de retorno",
    icon: HeartPulse,
    available: true,
    tier: "complementary",
    uses: ["name", "age", "pregnancy", "allergies"],
  },
  {
    id: "procedimento",
    name: "Solicitação de procedimento",
    desc: "Curativos, terapias e condutas",
    icon: Stethoscope,
    available: true,
    tier: "complementary",
    uses: ["name", "age"],
  },
  // Regulatórios (SUS e vigilância)
  {
    id: "aih",
    name: "Laudo de internação (AIH)",
    desc: "Justificativa, CID e caráter",
    icon: BedDouble,
    available: true,
    tier: "administrative",
    uses: ["name", "age", "sex"],
  },
  {
    id: "apac",
    name: "Laudo APAC",
    desc: "Alta complexidade e competência",
    icon: FileSpreadsheet,
    available: true,
    tier: "administrative",
    uses: ["name", "age", "sex"],
  },
  {
    id: "notificacao",
    name: "Notificação compulsória",
    desc: "Agravo, caso e vigilância",
    icon: Siren,
    available: true,
    tier: "administrative",
    uses: ["name", "age", "sex"],
  },
];

/** Snapshot mínimo do paciente para validar dependências por módulo. */
export interface PatientSnapshot {
  hasName: boolean;
  hasWeight: boolean;
  isPediatric: boolean;
  isPregnant: boolean;
  hasAllergies: boolean;
}

/** Retorna dependências críticas ausentes para o módulo, dado o paciente atual. */
export const getMissingCritical = (
  meta: ActionMeta,
  patient: PatientSnapshot,
): PatientDependency[] => {
  const missing: PatientDependency[] = [];
  for (const dep of meta.criticalIfMissing ?? []) {
    if (dep === "weight" && patient.isPediatric && !patient.hasWeight) missing.push(dep);
  }
  return missing;
};

interface ActionGridProps {
  active: DocumentAction;
  onSelect: (a: DocumentAction) => void;
  /** Map of action -> whether it has draft content. */
  drafts?: Partial<Record<DocumentAction, boolean>>;
  /** Snapshot do Bloco A — habilita alertas contextuais por card. */
  patient?: PatientSnapshot;
}

const ActionGrid = ({ active, onSelect, drafts = {}, patient }: ActionGridProps) => {
  const activeMeta = ACTIONS.find((a) => a.id === active);

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Bloco B
          </div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            O que você quer emitir?
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Escolha o documento. A interface se adapta à ação.
          </p>
        </div>
        {activeMeta && (
          <div className="hidden shrink-0 items-center gap-1.5 rounded-full border border-canon-blue/20 bg-canon-blue/5 px-2.5 py-1 text-[10px] font-medium text-canon-blue sm:inline-flex">
            <activeMeta.icon className="h-3 w-3" />
            <span className="max-w-[140px] truncate">{activeMeta.name}</span>
          </div>
        )}
      </div>

      <div
        role="radiogroup"
        aria-label="Tipo de documento"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4"
      >
        {ACTIONS.map((meta) => {
          const { id, name, desc, icon: Icon, available, tier } = meta;
          const isActive = id === active;
          const hasDraft = !!drafts[id];
          const missingCritical = patient ? getMissingCritical(meta, patient) : [];
          const showWarning = missingCritical.length > 0 && !isActive;
          const isPrimary = tier === "primary";

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isActive}
              aria-label={`${name}${!available ? " — em breve" : ""}`}
              onClick={() => onSelect(id)}
              className={cn(
                "group relative flex flex-col gap-2 rounded-lg border p-3 text-left transition",
                isActive
                  ? "border-canon-blue bg-canon-blue/5 shadow-paper ring-1 ring-canon-blue/20"
                  : isPrimary
                  ? "border-canon-blue/25 bg-paper-alt/50 hover:border-canon-blue/50 hover:bg-paper-alt/80"
                  : "border-ink-soft bg-paper-alt/30 hover:border-canon-blue/30 hover:bg-paper-alt/60",
                !available && "opacity-75",
              )}
            >
              {/* Indicadores no canto superior direito */}
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {showWarning && (
                  <span
                    title={`Faltam dados: ${missingCritical.join(", ")}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-warning text-warning-foreground"
                  >
                    <AlertTriangle className="h-2.5 w-2.5" />
                  </span>
                )}
                {hasDraft && !isActive && (
                  <span
                    aria-label="Rascunho em andamento"
                    className="h-2 w-2 rounded-full bg-canon-blue ring-2 ring-card"
                  />
                )}
              </div>

              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-md transition",
                    isActive
                      ? "bg-canon-blue text-primary-foreground"
                      : isPrimary
                      ? "bg-canon-blue/10 text-canon-blue"
                      : "bg-card text-canon-blue",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!available ? (
                  <span className="text-[9px] font-semibold uppercase tracking-editorial text-ink-faint">
                    Em breve
                  </span>
                ) : isActive ? (
                  <ArrowRight className="h-3.5 w-3.5 text-canon-blue" />
                ) : null}
              </div>

              <div>
                <div className="text-sm font-semibold leading-tight text-ink">
                  {name}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-ink-muted line-clamp-2">
                  {desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Legenda contextual quando há alerta no card ativo */}
      {activeMeta && patient && getMissingCritical(activeMeta, patient).length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-2.5 text-[11px] text-ink">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span>
            <strong className="font-medium">Atenção:</strong> {activeMeta.name} usa{" "}
            <strong>
              {getMissingCritical(activeMeta, patient).join(", ")}
            </strong>{" "}
            — preencha no Bloco A para evitar erros de cálculo.
          </span>
        </div>
      )}
    </div>
  );
};

export default ActionGrid;
