/**
 * PathologyCorrelationPanel — Etapa 3.
 * Mostra o que o sistema correlacionou automaticamente à patologia escolhida:
 * exames usuais, encaminhamentos, protocolos, escores, condutas padrão,
 * diferenciais e restrições conforme o perfil do paciente.
 *
 * Quando o atendimento é "em branco", este painel não é renderizado.
 */
import { useState } from "react";
import {
  AlertTriangle,
  Calculator,
  ClipboardList,
  FlaskConical,
  ListChecks,
  Pill,
  Send,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  PROFILE_LABEL,
  getProfileRestrictions,
  hasKnowledge,
  type PathologyKnowledge,
  type PatientProfile,
} from "../data/pathologyKnowledge";
import PathologyDetailSections from "./PathologyDetailSections";
import NotificationSuggestionAlert from "@/modules/notifications/NotificationSuggestionAlert";
import type { ClinicalEnvironment, ClinicalSeverity } from "../types/prescription";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

interface Props {
  knowledge: PathologyKnowledge;
  profiles: PatientProfile[];
  /** Quadro de alta gravidade (Emergências/SV ou severidade grave/crítica). */
  highSeverity?: boolean;
  /** Adiciona um exame sugerido à solicitação de exames. */
  onAddExam?: (nome: string) => void;
  /** Preenche a especialidade do encaminhamento. */
  onUseEncaminhamento?: (especialidade: string) => void;
  /** Ambiente clínico do atendimento — define o piso de gravidade. */
  environment?: ClinicalEnvironment;
  /** Gravidade declarada da patologia, quando houver. */
  severity?: ClinicalSeverity | null;
}

const Group = ({
  icon: Icon,
  title,
  items,
  onPick,
  pickLabel,
}: {
  icon: typeof FlaskConical;
  title: string;
  items: string[];
  onPick?: (v: string) => void;
  pickLabel?: string;
}) => {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <button
            key={it}
            type="button"
            disabled={!onPick}
            title={onPick ? pickLabel : undefined}
            onClick={() => onPick?.(it)}
            className={cn(
              "rounded-full border border-ink-soft bg-paper-alt/40 px-2.5 py-1 text-left text-[11px] text-ink",
              onPick ? "transition hover:border-canon-blue/50 hover:bg-canon-blue/5" : "cursor-default",
            )}
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
};

const TextList = ({
  icon: Icon,
  title,
  items,
}: {
  icon: typeof Pill;
  title: string;
  items: string[];
}) => {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-editorial text-ink-faint">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <ul className="list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-ink-muted">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
};

const PathologyCorrelationPanel = ({
  knowledge,
  profiles,
  highSeverity,
  onAddExam,
  onUseEncaminhamento,
  environment = "ambulatorial",
  severity,
}: Props) => {
  const [showDetails, setShowDetails] = useState(false);
  const restricoes = getProfileRestrictions(knowledge, profiles);

  if (!hasKnowledge(knowledge) && restricoes.length === 0 && !highSeverity) return null;

  return (
    <div className="space-y-4 rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      {highSeverity && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="text-[12px] leading-relaxed text-ink">
            <strong className="font-semibold text-destructive">Quadro de alta gravidade.</strong>{" "}
            Priorize estabilização (via aérea, ventilação, circulação), monitorização contínua e
            acionamento da equipe antes de concluir a documentação.
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
          Correlação automática
        </div>
        <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
          {knowledge.label || "Conteúdo relacionado"}
        </h2>
        <p className="mt-1 text-xs text-ink-muted">
          Sugestões clínicas ligadas à condição escolhida. Tudo é editável antes de emitir.
        </p>
      </div>

      <NotificationSuggestionAlert
        clinicalText={[knowledge.label, ...knowledge.cids, ...knowledge.diferenciais].join(" ")}
      />

      <Group
        icon={FlaskConical}
        title="Exames usuais"
        items={knowledge.exames}
        onPick={onAddExam}
        pickLabel="Adicionar à solicitação de exames"
      />
      <Group
        icon={Send}
        title="Encaminhamentos adequados"
        items={knowledge.encaminhamentos}
        onPick={onUseEncaminhamento}
        pickLabel="Usar no encaminhamento"
      />
      <Group icon={ClipboardList} title="Protocolos" items={knowledge.protocolos} />
      <Group icon={Calculator} title="Escores de gravidade" items={knowledge.escores} />
      <TextList icon={Pill} title="Condutas farmacológicas padrão" items={knowledge.condutas} />

      {restricoes.length > 0 && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-editorial text-warning">
            <ShieldAlert className="h-3.5 w-3.5" />
            Restrições pelo perfil do paciente
          </div>
          <div className="space-y-2">
            {restricoes.map(({ profile, items }) => (
              <div key={profile}>
                <div className="text-[12px] font-semibold text-ink">{PROFILE_LABEL[profile]}</div>
                <ul className="list-disc space-y-0.5 pl-4 text-[12px] leading-relaxed text-ink-muted">
                  {items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {(knowledge.anamnese.length > 0 ||
        knowledge.exameFisico.length > 0 ||
        knowledge.diferenciais.length > 0 ||
        knowledge.cids.length > 0) && (
        <div className="border-t border-ink-soft pt-3">
          <button
            type="button"
            onClick={() => setShowDetails((v) => !v)}
            className="text-[11px] font-medium text-canon-blue hover:underline"
          >
            {showDetails ? "Ocultar roteiro clínico" : "Ver roteiro clínico (anamnese, exame, diferenciais)"}
          </button>
          {showDetails && (
            <div className="mt-3 space-y-3">
              <TextList icon={ListChecks} title="Anamnese dirigida" items={knowledge.anamnese} />
              <TextList icon={Stethoscope} title="Exame físico" items={knowledge.exameFisico} />
              <TextList icon={ListChecks} title="Diagnósticos diferenciais" items={knowledge.diferenciais} />
              <Group icon={ClipboardList} title="CIDs correlatos" items={knowledge.cids} />
            </div>
          )}
        </div>
      )}

      <PathologyDetailSections
        label={knowledge.label}
        environment={environment}
        severity={severity}
        profiles={profiles}
      />
    </div>
  );
};

export default PathologyCorrelationPanel;
