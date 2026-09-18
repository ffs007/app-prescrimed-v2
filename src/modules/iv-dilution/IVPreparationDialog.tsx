import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { IVMedication } from "./IVDilutionAdminPage";
import { buildNursingCopyText } from "./lib/ivFormatters";
import { logIVView } from "./lib/ivViewLog";

type Props = {
  medication: IVMedication;
  open: boolean;
  onClose: () => void;
  dosePrescrita?: string;
  perfil?: string;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-1.5">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
    <div className="rounded-md border bg-card/40 p-2.5 text-sm space-y-1">{children}</div>
  </section>
);

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="break-words">{value}</span>
    </div>
  ) : null;

/**
 * "Orientações de preparo e administração" — visão para enfermagem/farmácia.
 * Organizada em cards: A. Preparo · B. Diluição · C. Administração · D. Cuidados · E. Fonte.
 */
export default function IVPreparationDialog({ medication: m, open, onClose, dosePrescrita, perfil }: Props) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildNursingCopyText(m));
      toast.success("Orientação copiada");
      logIVView({ principio_ativo: m.principio_ativo, tipo_visualizacao: "orientacao_enfermagem_farmacia", acao_realizada: "copiou_orientacao", perfil_usuario: perfil });
    } catch { toast.error("Não foi possível copiar"); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Preparo/Administração — {m.principio_ativo}
            {m.apresentacao && <Badge variant="outline" className="text-[10px]">{m.apresentacao}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Section title="A. Preparo">
            <Row label="Apresentação" value={m.apresentacao} />
            {dosePrescrita && <Row label="Dose prescrita" value={dosePrescrita} />}
            <Row label="Volume reconstituição" value={m.volume_reconstituicao} />
            <Row label="Diluente" value={m.diluente_reconstituicao} />
            <Row label="Estabilidade pós-reconstituição" value={m.estabilidade_apos_reconstituicao} />
          </Section>

          <Section title="B. Diluição">
            <Row label="Soluções compatíveis" value={m.solucoes_compativeis?.join(", ") || undefined} />
            <Row label="Volume de diluição" value={m.volume_diluicao} />
            <Row label="Concentração máxima" value={m.concentracao_maxima} />
            <Row label="Estabilidade pós-diluição" value={m.estabilidade_apos_diluicao} />
            <Row label="Incompatibilidades" value={m.incompatibilidades?.join(", ") || undefined} />
          </Section>

          <Section title="C. Administração">
            <Row label="Tempo mínimo de infusão" value={m.tempo_minimo_infusao} />
            <Row label="Velocidade máxima" value={m.velocidade_maxima_infusao} />
          </Section>

          <Section title="D. Cuidados">
            <div className="flex flex-wrap gap-1.5">
              {m.exige_fotoprotecao && <Badge variant="secondary">Proteção da luz</Badge>}
              {m.exige_equipo_fotossensivel && <Badge variant="secondary">Equipo fotossensível</Badge>}
              {m.exige_filtro && <Badge variant="secondary">Filtro em linha</Badge>}
              {m.risco_flebite && <Badge variant="secondary">Risco de flebite</Badge>}
              {!m.exige_fotoprotecao && !m.exige_equipo_fotossensivel && !m.exige_filtro && !m.risco_flebite && (
                <span className="text-xs text-muted-foreground">Sem cuidados especiais cadastrados.</span>
              )}
            </div>
            {m.alerta_enfermagem_farmacia && (
              <p className="text-sm pt-1">{m.alerta_enfermagem_farmacia}</p>
            )}
            {m.observacoes_gerais && (
              <p className="text-sm text-muted-foreground pt-1 whitespace-pre-wrap">{m.observacoes_gerais}</p>
            )}
          </Section>

          <Section title="E. Fonte">
            <Row label="Referência" value={m.fonte_referencia} />
            <Row label="Atualizado em" value={m.data_atualizacao} />
          </Section>
        </div>

        <p className="text-[11px] text-muted-foreground pt-2 border-t">
          Orientações de preparo/administração devem ser validadas conforme protocolo institucional e farmácia clínica.
        </p>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={copy}><Copy className="h-4 w-4 mr-1" /> Copiar orientação</Button>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
