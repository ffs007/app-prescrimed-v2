import type { DocSection } from "../services/regulatoryForms";

interface Props {
  lead: string;
  sections: DocSection[];
  /** "preview" usa a paleta da tela; "print" usa a paleta do papel. */
  variant?: "preview" | "print";
  emptyHint?: string;
}

/**
 * Corpo visual compartilhado dos documentos regulatórios (AIH, APAC,
 * notificação compulsória), tanto no preview quanto na folha impressa.
 */
const StructuredDocumentBody = ({ lead, sections, variant = "preview", emptyHint }: Props) => {
  const isPrint = variant === "print";
  const labelCls = isPrint
    ? "text-[10px] font-bold uppercase tracking-wider text-foreground"
    : "text-[10px] font-bold uppercase tracking-editorial text-ink-faint";
  const valueCls = isPrint
    ? "text-sm text-foreground leading-[1.7]"
    : "text-sm text-ink leading-6";

  return (
    <div className={isPrint ? "mt-6 space-y-4" : "rounded-lg border border-ink-soft p-4 space-y-3"}>
      <p className={isPrint ? "text-sm text-foreground leading-[1.8]" : "text-sm text-ink leading-7"}>
        {lead}
      </p>

      {sections.length === 0 ? (
        <p className={isPrint ? "text-sm italic text-foreground" : "py-6 text-center text-xs italic text-ink-faint"}>
          {emptyHint ?? "Preencha os campos do documento"}
        </p>
      ) : (
        <div className="space-y-3">
          {sections.map((s) => (
            <div key={s.label}>
              <div className={labelCls}>{s.label}</div>
              <p
                className={`${valueCls} ${s.block ? "whitespace-pre-line" : ""} ${
                  s.emphasis ? "font-semibold" : ""
                }`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StructuredDocumentBody;
