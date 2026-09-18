import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ITEM_CHAVES, type BlocoChecklistItem, type ChecklistItemChave, type ChecklistItemStatus, CHECKLIST_STATUS_LABEL } from "../lib/types";

type Props = {
  items: BlocoChecklistItem[];
  onChange: (chave: ChecklistItemChave, status: ChecklistItemStatus) => Promise<void> | void;
};

export default function BlocoChecklistList({ items, onChange }: Props) {
  const find = (chave: ChecklistItemChave): ChecklistItemStatus =>
    (items.find((i) => i.item_chave === chave && !i.medicamento_id)?.status ?? "pendente") as ChecklistItemStatus;

  return (
    <div className="space-y-2">
      {ITEM_CHAVES.map((it) => (
        <div key={it.value} className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0">
          <span className="text-sm">{it.label}</span>
          <Select value={find(it.value)} onValueChange={(v) => onChange(it.value, v as ChecklistItemStatus)}>
            <SelectTrigger className="w-44 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CHECKLIST_STATUS_LABEL) as ChecklistItemStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{CHECKLIST_STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
