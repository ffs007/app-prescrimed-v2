/**
 * PathologyDetailSections — seções clínicas detalhadas da patologia ativa:
 * anamnese (com campos por perfil), diferenciais priorizados, exame físico,
 * exames complementares, conduta, critérios de decisão e monitorização,
 * além dos blocos de alerta por gravidade.
 *
 * Tudo é sugestão revisável antes da emissão de qualquer documento.
 */
import { useState } from "react";
import {
  AlarmClock,
  ArrowUpCircle,
  ClipboardList,
  FlaskConical,
  ChevronDown,
  ListChecks,
  Pill,
  Siren,
  Stethoscope,
  Timer,
} from "lucide-react";
import type { ClinicalEnvironment, ClinicalSeverity } from "../types/prescription";
import type { PatientProfile } from "../data/pathologyKnowledge";
import { PROFILE_LABEL } from "../data/pathologyKnowledge";
import {
  DIFFERENTIAL_LABEL,
  PROFILE_ANAMNESIS,
  SEVERITY_ALERT_BLOCKS,
  effectiveSeverity,
  getPathologyDetail,
  type DifferentialWeight,
} from "../data/pathologyDetails";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const SEVERITY_LABEL: Record<ClinicalSeverity, string> = {
  leve: "Gravidade leve",
  moderada: "Gravidade moderada",
  grave: "Alta gravidade",
  critica: "Gravidade crítica",
};

const WEIGHT_STYLE: Record<DifferentialWeight, string> = {
  alta: "border-canon-blue/40 bg-canon-blue/10 text-canon-blue",
  media: "border-ink-soft bg-paper-alt/60 text-ink-muted",
  baixa: "border-destructive/40 bg-destructive/5 text-destructive",
};

const Bullets = ({ items }: { items: string[] }) =>
  items.length === 0 ? null : (
    <ul className="list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-ink-muted">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );

const SubBlock = ({ title, items }: { title: string; items: string[] }) =>
  items.length === 0 ? null : (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-ink">{title}</div>
      <Bullets items={items} />
    </div>
  );

const Section = ({
  id,
  icon: Icon,
  title,
  openId,
  setOpenId,
  children,
}: {
  id: string;
  icon: typeof ListChecks;
  title: string;
  openId: string | null;
  setOpenId: (v: string | null) => void;
  children: React.ReactNode;
}) => {
  const open = openId === id;
  return (
    <div className="rounded-md border border-ink-soft">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium text-ink"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-canon-blue" />
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-ink-muted transition", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-3 border-t border-ink-soft px-3 py-3">{children}</div>}
    </div>
  );
};

interface Props {
  /** Rótulo da patologia correlacionada (label da base de conhecimento). */
  label: string;
  environment: ClinicalEnvironment;
  severity?: ClinicalSeverity | null;
  profiles: PatientProfile[];
}

const PathologyDetailSections = ({ label, environment, severity, profiles }: Props) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const detail = getPathologyDetail(label);
  const sev = effectiveSeverity(environment, severity);
  const alerts = SEVERITY_ALERT_BLOCKS[sev];
  const isHigh = sev === "grave" || sev === "critica";

  const perfilAnamnese = profiles
    .map((p) => ({
      profile: p,
      items: [...(PROFILE_ANAMNESIS[p] ?? []), ...((detail?.anamnesePerfil?.[p] ?? []) as string[])],
    }))
    .filter((x) => x.items.length > 0);

  if (!detail && perfilAnamnese.length === 0 && !isHigh) return null;

  return (
    <div className="space-y-3 border-t border-ink-soft pt-4">
      <div
        className={cn(
          "rounded-md border p-3",
          isHigh ? "border-destructive/40 bg-destructive/5" : "border-warning/30 bg-warning/5",
        )}
      >
        <div
          className={cn(
            "mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-editorial",
            isHigh ? "text-destructive" : "text-warning",
          )}
        >
          <Siren className="h-3.5 w-3.5" />
          {SEVERITY_LABEL[sev]} — checagem automática
        </div>
        <Bullets items={alerts} />
      </div>

      {detail?.tempoDependentes?.length ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-editorial text-destructive">
            <Timer className="h-3.5 w-3.5" />
            Intervenções tempo-dependentes
          </div>
          <Bullets items={detail.tempoDependentes} />
        </div>
      ) : null}

      {detail?.escalonamento?.length ? (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-editorial text-warning">
            <ArrowUpCircle className="h-3.5 w-3.5" />
            Escalonamento de cuidado
          </div>
          <Bullets items={detail.escalonamento} />
        </div>
      ) : null}

      {(detail || perfilAnamnese.length > 0) && (
        <div className="space-y-1.5">
          <Section id="anamnese" icon={ListChecks} title="1. Anamnese dirigida" openId={openId} setOpenId={setOpenId}>
            <Bullets items={detail?.anamnese ?? []} />
            {perfilAnamnese.map(({ profile, items }) => (
              <SubBlock key={profile} title={`Perfil ${PROFILE_LABEL[profile]}`} items={items} />
            ))}
          </Section>

          {detail && (
            <>
              <Section id="dd" icon={ClipboardList} title="2. Diagnósticos diferenciais" openId={openId} setOpenId={setOpenId}>
                <div className="space-y-1.5">
                  {detail.diferenciais.map((d) => (
                    <div
                      key={d.nome}
                      className="flex flex-wrap items-center gap-2 rounded-md border border-ink-soft bg-paper-alt/30 px-2.5 py-1.5"
                    >
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-editorial",
                          WEIGHT_STYLE[d.probabilidade],
                        )}
                      >
                        {DIFFERENTIAL_LABEL[d.probabilidade]}
                      </span>
                      <span className="text-[12px] font-medium text-ink">{d.nome}</span>
                      {d.pista && <span className="text-[11px] text-ink-muted">— {d.pista}</span>}
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="exame" icon={Stethoscope} title="3. Exame físico dirigido" openId={openId} setOpenId={setOpenId}>
                <SubBlock title="Sinais cardinais" items={detail.exameFisico.cardinais} />
                <SubBlock title="Sinais de gravidade" items={detail.exameFisico.gravidade} />
                <SubBlock title="Achados típicos" items={detail.exameFisico.tipicos} />
                <SubBlock title="Achados atípicos" items={detail.exameFisico.atipicos} />
              </Section>

              <Section id="exames" icon={FlaskConical} title="4. Exames complementares" openId={openId} setOpenId={setOpenId}>
                <SubBlock title="Laboratoriais" items={detail.exames.laboratoriais} />
                <SubBlock title="Imagem" items={detail.exames.imagem} />
                <SubBlock title="Outros" items={detail.exames.outros} />
              </Section>

              <Section id="conduta" icon={Pill} title="5. Conduta" openId={openId} setOpenId={setOpenId}>
                <SubBlock title="Inicial" items={detail.conduta.inicial} />
                <SubBlock title="Manutenção" items={detail.conduta.manutencao} />
              </Section>

              <Section id="decisao" icon={ClipboardList} title="6. Critérios de decisão" openId={openId} setOpenId={setOpenId}>
                <SubBlock title="Alta" items={detail.decisao.alta} />
                <SubBlock title="Observação" items={detail.decisao.observacao} />
                <SubBlock title="Internação" items={detail.decisao.internacao} />
              </Section>

              <Section id="monitor" icon={AlarmClock} title="7. Monitorização e reavaliação" openId={openId} setOpenId={setOpenId}>
                <SubBlock title="O que monitorar" items={detail.monitorizacao.itens} />
                <SubBlock title="Intervalos de reavaliação" items={detail.monitorizacao.reavaliacao} />
              </Section>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PathologyDetailSections;
