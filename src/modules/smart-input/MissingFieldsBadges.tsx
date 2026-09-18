// Etapa 19 — Badges de campos faltantes.
import { Badge } from "@/components/ui/badge";
import type { MissingField } from "./lib/types";

export default function MissingFieldsBadges({ fields }: { fields: MissingField[] }) {
  if (!fields.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {fields.map((f, i) => (
        <Badge
          key={i}
          variant="outline"
          className="text-[10px] bg-warning/10 text-warning border-warning/30"
          title={f.mensagem}
        >
          {f.campo}
        </Badge>
      ))}
    </div>
  );
}
