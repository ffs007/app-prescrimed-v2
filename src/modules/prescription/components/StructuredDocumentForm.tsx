import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { LucideIcon } from "lucide-react";
import type { FieldSpec, StructuredData } from "../services/regulatoryForms";

interface Props {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  fields: FieldSpec[];
  data: StructuredData;
  onChange: (data: StructuredData) => void;
  /** Aviso regulatório exibido no topo do formulário. */
  notice?: string;
}

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

/**
 * Formulário dirigido por especificação — usado pelos documentos regulatórios
 * (AIH, APAC, notificação compulsória). Todo campo é editável e revisável
 * antes da emissão; nada é preenchido automaticamente sem revisão.
 */
const StructuredDocumentForm = ({
  title, subtitle, icon: Icon, fields, data, onChange, notice,
}: Props) => {
  const update = (key: string, value: string | boolean) => onChange({ ...data, [key]: value });

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-canon-blue/10 text-canon-blue">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Bloco C · construção
          </div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>
        </div>
      </div>

      {notice && (
        <p className="mb-4 rounded-md border border-canon-blue/20 bg-canon-blue/5 p-2.5 text-[11px] leading-5 text-ink-muted">
          {notice}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          const value = data[f.key];
          const listId = f.suggestions ? `sug-${f.key}` : undefined;
          return (
            <div
              key={f.key}
              className={cn("space-y-1.5", !f.half && "sm:col-span-2")}
            >
              {f.type !== "checkbox" && (
                <Label htmlFor={`fld-${f.key}`} className="text-xs font-medium text-ink">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </Label>
              )}

              {f.type === "textarea" && (
                <Textarea
                  id={`fld-${f.key}`}
                  value={String(value ?? "")}
                  onChange={(e) => update(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="min-h-[88px] border-ink-soft bg-paper-alt/40"
                />
              )}

              {(f.type === "text" || f.type === "date" || f.type === "number") && (
                <>
                  <Input
                    id={`fld-${f.key}`}
                    type={f.type === "text" ? "text" : f.type}
                    value={String(value ?? "")}
                    onChange={(e) => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    list={listId}
                    className="h-11 border-ink-soft bg-paper-alt/40"
                  />
                  {f.suggestions && (
                    <datalist id={listId}>
                      {f.suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  )}
                </>
              )}

              {f.type === "select" && (
                <select
                  id={`fld-${f.key}`}
                  value={String(value ?? "")}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="h-11 w-full rounded-md border border-ink-soft bg-paper-alt/40 px-3 text-sm text-ink"
                >
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}

              {f.type === "checkbox" && (
                <div className="flex items-center gap-2 pt-5">
                  <Checkbox
                    id={`fld-${f.key}`}
                    checked={value === true}
                    onCheckedChange={(c) => update(f.key, c === true)}
                  />
                  <Label htmlFor={`fld-${f.key}`} className="text-xs font-medium text-ink">
                    {f.label}
                  </Label>
                </div>
              )}

              {f.hint && <p className="text-[10px] leading-4 text-ink-faint">{f.hint}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StructuredDocumentForm;
