import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { IVMedication } from "./IVDilutionAdminPage";

type Props = { medication: IVMedication; open: boolean; onClose: () => void };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
    <div className="rounded-md border bg-card/50 p-3 space-y-1.5 text-sm">{children}</div>
  </section>
);

const Row = ({ label, value }: { label: string; value?: string | null }) =>
  value ? (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span>{value}</span>
    </div>
  ) : null;

export default function IVMedicationDetailDialog({ medication: m, open, onClose }: Props) {
  const alertLabel = m.nivel_alerta === "alto" ? "Alerta alto" : m.nivel_alerta === "medio" ? "Alerta médio" : "Alerta baixo";
  const alertClass =
    m.nivel_alerta === "alto"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : m.nivel_alerta === "medio"
      ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
      : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {m.principio_ativo}
            <Badge variant="outline" className={alertClass}>{alertLabel}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {m.exige_fotoprotecao && <Badge variant="secondary">Fotoproteção</Badge>}
          {m.exige_equipo_fotossensivel && <Badge variant="secondary">Equipo fotossensível</Badge>}
          {m.exige_filtro && <Badge variant="secondary">Exige filtro</Badge>}
          {m.risco_flebite && <Badge variant="secondary">Risco de flebite</Badge>}
          {m.incompatibilidades.length > 0 && <Badge variant="secondary">Incompatibilidade importante</Badge>}
        </div>

        <div className="space-y-4 mt-2">
          <Section title="Identificação">
            <Row label="Princípio ativo" value={m.principio_ativo} />
            <Row label="Nome comercial" value={m.nome_comercial_referencia} />
            <Row label="Apresentação" value={m.apresentacao} />
            <Row label="Via" value={m.via_administracao} />
          </Section>

          <Section title="Reconstituição">
            <Row label="Volume" value={m.volume_reconstituicao} />
            <Row label="Diluente" value={m.diluente_reconstituicao} />
            <Row label="Volume de expansão" value={m.volume_expansao_pos_reconstituicao} />
          </Section>

          <Section title="Diluição">
            <Row label="Volume de diluição" value={m.volume_diluicao} />
            <Row label="Concentração máx." value={m.concentracao_maxima} />
            <Row label="Soluções compatíveis" value={m.solucoes_compativeis.join(", ") || undefined} />
            <Row label="Incompatibilidades" value={m.incompatibilidades.join(", ") || undefined} />
            <Row label="pH" value={m.ph} />
          </Section>

          <Section title="Administração">
            <Row label="Tempo mínimo de infusão" value={m.tempo_minimo_infusao} />
            <Row label="Velocidade máxima" value={m.velocidade_maxima_infusao} />
          </Section>

          <Section title="Estabilidade">
            <Row label="Após reconstituição" value={m.estabilidade_apos_reconstituicao} />
            <Row label="Após diluição" value={m.estabilidade_apos_diluicao} />
          </Section>

          <Section title="Alertas de segurança">
            <Row label="Alerta médico" value={m.alerta_medico} />
            <Row label="Enfermagem / farmácia" value={m.alerta_enfermagem_farmacia} />
          </Section>

          {m.observacoes_gerais && (
            <Section title="Observações">
              <p className="whitespace-pre-wrap">{m.observacoes_gerais}</p>
            </Section>
          )}

          <Section title="Fonte">
            <Row label="Referência" value={m.fonte_referencia} />
            <Row label="Atualizado em" value={m.data_atualizacao} />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
