import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import type { Protocolo, ProtocolContext } from "./lib/types";
import { logProtocolUse } from "./lib/protocolLog";

interface Props {
  open: boolean;
  protocolo: Protocolo;
  onClose: () => void;
  patientCtx?: { idade_anos?: number; gestante?: boolean; contexto?: ProtocolContext };
  onAddPrescription?: (m: { principio_ativo: string; dose?: string; via?: string; frequencia?: string; duracao?: string }) => void;
  onAddExams?: (exames: string[]) => void;
  onAddOrientations?: (texto: string) => void;
}

type Sec = "condutas"|"exames"|"medicamentos"|"orientacoes"|"encaminhamento"|"cuidados";

export default function ProtocolPlanReviewDialog({ open, protocolo, onClose, onAddPrescription, onAddExams, onAddOrientations }: Props) {
  const [sel, setSel] = useState<Record<Sec, Record<number, boolean>>>({
    condutas: {}, exames: {}, medicamentos: {}, orientacoes: {}, encaminhamento: {}, cuidados: {},
  });

  function toggle(sec: Sec, i: number, v: boolean) {
    setSel((s) => ({ ...s, [sec]: { ...s[sec], [i]: v } }));
  }

  function apply() {
    const exames = (protocolo.exames_sugeridos || []).filter((_, i) => sel.exames[i]).map((e) => e.nome_exame);
    if (exames.length > 0) onAddExams?.(exames);

    (protocolo.medicamentos_sugeridos || []).forEach((m, i) => {
      if (sel.medicamentos[i]) {
        onAddPrescription?.({
          principio_ativo: m.principio_ativo,
          dose: [m.dose_sugerida, m.unidade_dose].filter(Boolean).join(" "),
          via: m.via, frequencia: m.frequencia, duracao: m.duracao,
        });
      }
    });

    if (sel.orientacoes[0] && protocolo.orientacoes_paciente) {
      onAddOrientations?.(protocolo.orientacoes_paciente);
    }

    logProtocolUse({
      id_protocolo: protocolo.id, nome_protocolo: protocolo.nome_protocolo,
      versao_protocolo: protocolo.versao_protocolo, acao: "plano_montado",
      itens_adicionados: [{ exames: exames.length, medicamentos: Object.values(sel.medicamentos).filter(Boolean).length }],
    });

    toast.success("Plano sugerido adicionado");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar plano sugerido — {protocolo.nome_protocolo}</DialogTitle>
        </DialogHeader>

        <Section title="Condutas">
          {(protocolo.condutas_iniciais || []).map((c, i) => (
            <Row key={i} checked={!!sel.condutas[i]} onChange={(v) => toggle("condutas", i, v)} label={c.titulo} hint={c.descricao} />
          ))}
        </Section>

        <Section title="Exames">
          {(protocolo.exames_sugeridos || []).map((e, i) => (
            <Row key={i} checked={!!sel.exames[i]} onChange={(v) => toggle("exames", i, v)} label={e.nome_exame} hint={e.indicacao} />
          ))}
        </Section>

        <Section title="Medicamentos">
          {(protocolo.medicamentos_sugeridos || []).map((m, i) => (
            <Row key={i} checked={!!sel.medicamentos[i]} onChange={(v) => toggle("medicamentos", i, v)}
              label={m.principio_ativo}
              hint={[m.dose_sugerida, m.unidade_dose, m.via, m.frequencia].filter(Boolean).join(" · ")} />
          ))}
        </Section>

        {protocolo.orientacoes_paciente && (
          <Section title="Orientações ao paciente">
            <Row checked={!!sel.orientacoes[0]} onChange={(v) => toggle("orientacoes", 0, v)}
              label="Adicionar orientações" hint={protocolo.orientacoes_paciente.slice(0, 120) + (protocolo.orientacoes_paciente.length > 120 ? "…" : "")} />
          </Section>
        )}

        <Section title="Encaminhamento / Internação">
          {[...(protocolo.criterios_encaminhamento || []), ...(protocolo.criterios_internacao || [])].map((c, i) => (
            <Row key={i} checked={!!sel.encaminhamento[i]} onChange={(v) => toggle("encaminhamento", i, v)} label={c.titulo} hint={c.descricao} />
          ))}
        </Section>

        <Section title="Cuidados de enfermagem">
          {(protocolo.cuidados_enfermagem || []).map((c, i) => (
            <Row key={i} checked={!!sel.cuidados[i]} onChange={(v) => toggle("cuidados", i, v)} label={c.descricao} hint={[c.frequencia, c.prioridade].filter(Boolean).join(" · ")} />
          ))}
        </Section>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={apply}>Adicionar selecionados</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold border-b pb-1">{title}</h4>
      {children}
    </div>
  );
}
function Row({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2 py-1 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="mt-0.5" />
      <div className="text-sm">
        {label}
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </label>
  );
}
