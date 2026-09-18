import type { IVMedication } from "./IVDilutionAdminPage";
import { buildPdfAnnexLine } from "./lib/ivFormatters";

type Props = {
  meds: IVMedication[];
  /** "todos" | "medio_alto" — filtra quais entram no anexo */
  scope?: "todos" | "medio_alto";
};

/**
 * Bloco "Orientações de Diluição e Administração IV" para o PDF.
 * Renderizado como anexo após a prescrição principal — não polui as linhas da receita.
 */
export default function IVPdfAnnex({ meds, scope = "todos" }: Props) {
  const filtered = meds.filter((m) => (scope === "medio_alto" ? m.nivel_alerta !== "baixo" : true));
  if (!filtered.length) return null;

  return (
    <section className="mt-8 pt-4 border-t border-foreground/40 print:break-before-page print:border-t-2 print:border-gray-800">
      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3 text-center">
        Orientações de Diluição e Administração IV
      </h3>
      <ol className="space-y-2 text-[12px] text-foreground leading-relaxed list-decimal pl-5">
        {filtered.map((m) => (
          <li key={m.id}><span className="font-medium">{m.principio_ativo}</span> — {buildPdfAnnexLine(m).replace(`${m.principio_ativo} IV: `, "")}</li>
        ))}
      </ol>
      <p className="text-[10px] italic text-muted-foreground mt-3 text-center print:text-gray-600">
        Informações de apoio à decisão clínica. Validar conforme protocolo institucional, farmácia clínica e condições do paciente.
      </p>
    </section>
  );
}
