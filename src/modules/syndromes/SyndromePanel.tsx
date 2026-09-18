/**
 * SyndromePanel — Camada 4 (composição) do fluxo por síndrome.
 *
 * Mostra os blocos clínicos da síndrome escolhida com checkbox: cada item
 * marcado é injetado no documento correspondente (receita, exames,
 * orientações, atestado, encaminhamento). Nada é emitido automaticamente —
 * o médico revisa e edita antes da emissão.
 */
import { useMemo, useState } from "react";
import {
  AlertTriangle, Ban, Baby, Building2, ClipboardList, FileText,
  FlaskConical, HeartPulse, Pill, Send, Sparkles, UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Syndrome, SyndromeExam, SyndromeMedication } from "./lib/types";
import { syndromeMedText } from "./lib/types";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

type BlockId =
  | "med_amb" | "med_hosp" | "exames" | "apac" | "orientacoes"
  | "alerta" | "encaminhamento" | "perfil";

const BLOCKS: Array<{ id: BlockId; label: string; icon: typeof Pill }> = [
  { id: "med_amb", label: "Medicação ambulatorial", icon: Pill },
  { id: "med_hosp", label: "Medicação hospitalar", icon: Building2 },
  { id: "exames", label: "Exames", icon: FlaskConical },
  { id: "apac", label: "Exames com APAC", icon: ClipboardList },
  { id: "orientacoes", label: "Orientações", icon: FileText },
  { id: "alerta", label: "Sinais de alerta", icon: AlertTriangle },
  { id: "encaminhamento", label: "Encaminhamento", icon: Send },
  { id: "perfil", label: "Perfis especiais", icon: UserRound },
];

export interface SyndromePanelActions {
  onAddMedication: (nome: string, texto: string) => void;
  onAddExam: (nome: string) => void;
  onAddOrientacoes: (linhas: string[]) => void;
  onAddSinaisAlerta: (linhas: string[]) => void;
  onFillAtestado: (texto: string, cid?: string | null) => void;
  onFillEncaminhamento: (destino: string) => void;
}

interface Props extends SyndromePanelActions {
  syndrome: Syndrome | null;
  isPediatric?: boolean;
  isPregnant?: boolean;
  isHospital?: boolean;
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">{children}</h4>
);

const SyndromePanel = ({
  syndrome, isPediatric, isPregnant, isHospital,
  onAddMedication, onAddExam, onAddOrientacoes, onAddSinaisAlerta,
  onFillAtestado, onFillEncaminhamento,
}: Props) => {
  const [block, setBlock] = useState<BlockId>(isHospital ? "med_hosp" : "med_amb");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const meds: SyndromeMedication[] = useMemo(
    () => (block === "med_hosp" ? syndrome?.medicamentosHospitalares ?? [] : syndrome?.medicamentosAmbulatoriais ?? []),
    [block, syndrome],
  );
  const exams: SyndromeExam[] = useMemo(
    () => (block === "apac" ? syndrome?.examesApac ?? [] : syndrome?.examesComuns ?? []),
    [block, syndrome],
  );

  if (!syndrome) {
    return (
      <div className="rounded-lg border border-ink-soft bg-card p-4 text-xs text-ink-muted">
        Escolha uma síndrome para ver medicamentos, exames e orientações sugeridos.
      </div>
    );
  }

  const applyMeds = () => {
    const list = meds.filter((_, i) => checked[`${block}:${i}`]);
    list.forEach((m) => onAddMedication(m.nome, syndromeMedText(m)));
    setChecked({});
  };
  const applyExams = () => {
    const list = exams.filter((_, i) => checked[`${block}:${i}`]);
    list.forEach((e) => onAddExam(e.nome));
    setChecked({});
  };

  return (
    <div className="space-y-3 rounded-lg border border-ink-soft bg-card p-4 shadow-paper">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            <Sparkles className="h-3 w-3" /> Síndrome · v{syndrome.versao}
          </div>
          <div className="truncate font-serif text-base font-semibold text-ink">{syndrome.nome}</div>
          <div className="text-[11px] text-ink-muted">
            {syndrome.cid ? `CID ${syndrome.cid}` : "Sem CID definido"}
            {syndrome.categoria ? ` · ${syndrome.categoria}` : ""}
          </div>
        </div>
        {syndrome.gravidade && (
          <span className="shrink-0 rounded-full border border-ink-soft px-2 py-0.5 text-[9px] font-semibold uppercase tracking-editorial text-ink-muted">
            {syndrome.gravidade}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {BLOCKS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setBlock(id); setChecked({}); }}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-editorial transition-colors",
              block === id
                ? "border-canon-blue/40 bg-canon-blue/10 text-canon-blue"
                : "border-ink-soft bg-paper-alt/40 text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {(block === "med_amb" || block === "med_hosp") && (
        <div className="space-y-2">
          <SectionTitle>Marque o que deseja levar para a receita</SectionTitle>
          {meds.length === 0 && <p className="text-xs text-ink-muted">Nenhum medicamento neste bloco.</p>}
          {meds.map((m, i) => (
            <label key={`${m.nome}-${i}`} className="flex cursor-pointer items-start gap-2 rounded-md border border-ink-soft bg-paper-alt/30 px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 h-3.5 w-3.5 accent-current"
                checked={!!checked[`${block}:${i}`]}
                onChange={() => toggle(`${block}:${i}`)}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{m.nome}</span>
                <span className="block text-[11px] text-ink-muted">{syndromeMedText(m)}</span>
              </span>
            </label>
          ))}
          {meds.length > 0 && (
            <Button size="sm" onClick={applyMeds} className="gap-1.5">
              <Pill className="h-3.5 w-3.5" /> Adicionar à receita
            </Button>
          )}
        </div>
      )}

      {(block === "exames" || block === "apac") && (
        <div className="space-y-2">
          <SectionTitle>
            {block === "apac" ? "Exames que exigem APAC" : "Exames sugeridos"}
          </SectionTitle>
          {exams.length === 0 && <p className="text-xs text-ink-muted">Nenhum exame neste bloco.</p>}
          {exams.map((e, i) => (
            <label key={`${e.nome}-${i}`} className="flex cursor-pointer items-start gap-2 rounded-md border border-ink-soft bg-paper-alt/30 px-3 py-2">
              <input
                type="checkbox"
                className="mt-1 h-3.5 w-3.5 accent-current"
                checked={!!checked[`${block}:${i}`]}
                onChange={() => toggle(`${block}:${i}`)}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-ink">{e.nome}</span>
                {(e.tipo || e.obs) && (
                  <span className="block text-[11px] text-ink-muted">
                    {[e.tipo, e.obs].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
            </label>
          ))}
          {exams.length > 0 && (
            <Button size="sm" onClick={applyExams} className="gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" /> Adicionar aos exames
            </Button>
          )}
        </div>
      )}

      {block === "orientacoes" && (
        <div className="space-y-2">
          <SectionTitle>Orientações ao paciente</SectionTitle>
          <ul className="space-y-1.5">
            {syndrome.orientacoes.map((o) => (
              <li key={o} className="rounded-md border border-ink-soft bg-paper-alt/30 px-3 py-2 text-xs text-ink">{o}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {syndrome.orientacoes.length > 0 && (
              <Button size="sm" onClick={() => onAddOrientacoes(syndrome.orientacoes)} className="gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Usar nas orientações
              </Button>
            )}
            {syndrome.atestadoPadrao && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => onFillAtestado(syndrome.atestadoPadrao ?? "", syndrome.cid)}
              >
                <ClipboardList className="h-3.5 w-3.5" /> Atestado padrão
              </Button>
            )}
          </div>
        </div>
      )}

      {block === "alerta" && (
        <div className="space-y-2">
          <SectionTitle>Sinais de alerta</SectionTitle>
          <ul className="space-y-1.5">
            {syndrome.sinaisAlerta.map((s) => (
              <li key={s} className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-ink">
                <HeartPulse className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                {s}
              </li>
            ))}
          </ul>
          {syndrome.sinaisAlerta.length > 0 && (
            <Button size="sm" onClick={() => onAddSinaisAlerta(syndrome.sinaisAlerta)} className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Levar para orientações
            </Button>
          )}
          {syndrome.contraindicacoes.length > 0 && (
            <>
              <SectionTitle>Contraindicações</SectionTitle>
              <ul className="space-y-1.5">
                {syndrome.contraindicacoes.map((c) => (
                  <li key={c} className="flex items-start gap-2 rounded-md border border-ink-soft bg-paper-alt/30 px-3 py-2 text-xs text-ink-muted">
                    <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {c}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {block === "encaminhamento" && (
        <div className="space-y-2">
          <SectionTitle>Encaminhamentos sugeridos</SectionTitle>
          {syndrome.encaminhamentos.length === 0 && (
            <p className="text-xs text-ink-muted">Nenhum encaminhamento sugerido.</p>
          )}
          {syndrome.encaminhamentos.map((e) => (
            <div key={e} className="flex items-center justify-between gap-2 rounded-md border border-ink-soft bg-paper-alt/30 px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-xs text-ink">{e}</span>
              <Button size="sm" variant="outline" onClick={() => onFillEncaminhamento(e)}>Usar</Button>
            </div>
          ))}
        </div>
      )}

      {block === "perfil" && (
        <div className="space-y-2">
          {[
            { label: "Pediatria", texto: syndrome.adaptacaoPediatrica, destaque: isPediatric, icon: Baby },
            { label: "Gestação", texto: syndrome.adaptacaoGestante, destaque: isPregnant, icon: UserRound },
            { label: "Lactação", texto: syndrome.adaptacaoLactante, destaque: false, icon: UserRound },
            { label: "Geriatria", texto: syndrome.adaptacaoGeriatrica, destaque: false, icon: UserRound },
          ]
            .filter((p) => !!p.texto)
            .map(({ label, texto, destaque, icon: Icon }) => (
              <div
                key={label}
                className={cn(
                  "rounded-md border px-3 py-2",
                  destaque ? "border-canon-blue/40 bg-canon-blue/5" : "border-ink-soft bg-paper-alt/30",
                )}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">
                  <Icon className="h-3 w-3" /> {label}
                </div>
                <p className="mt-1 text-xs text-ink">{texto}</p>
              </div>
            ))}
        </div>
      )}

      {syndrome.fonte && (
        <p className="border-t border-ink-soft pt-2 text-[10px] text-ink-faint">Fonte: {syndrome.fonte}</p>
      )}
    </div>
  );
};

export default SyndromePanel;
