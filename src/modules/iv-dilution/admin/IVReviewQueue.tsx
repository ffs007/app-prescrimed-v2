import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { IVMedication } from "../IVDilutionAdminPage";
import { IVReviewStatusBadge, IVQualityBadges } from "./IVQualityBadges";
import IVReviewDialog from "./IVReviewDialog";

type Med = IVMedication & { status_revisao?: string | null };

const INCLUDE = new Set(["aguardando_revisao", "rascunho", "precisa_corrigir"]);

export default function IVReviewQueue({ items, canReview, onChanged }: {
  items: Med[]; canReview: boolean; onChanged: () => void;
}) {
  const queue = useMemo(() => items.filter((m) => INCLUDE.has(m.status_revisao ?? "aguardando_revisao")), [items]);
  const [reviewing, setReviewing] = useState<Med | null>(null);

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Princípio ativo</TableHead>
              <TableHead className="hidden md:table-cell">Apresentação</TableHead>
              <TableHead className="hidden lg:table-cell">Fonte</TableHead>
              <TableHead className="hidden sm:table-cell">Atualizado</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden xl:table-cell">Qualidade</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Fila vazia. 🎉</TableCell></TableRow>
            ) : queue.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.principio_ativo}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{m.apresentacao ?? "—"}</TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px]">{m.fonte_referencia ?? "—"}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{m.data_atualizacao}</TableCell>
                <TableCell><IVReviewStatusBadge status={m.status_revisao} /></TableCell>
                <TableCell className="hidden xl:table-cell"><IVQualityBadges med={m} /></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" disabled={!canReview} onClick={() => setReviewing(m)}>Revisar</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {reviewing && (
        <IVReviewDialog
          medication={reviewing}
          open={!!reviewing}
          onClose={() => setReviewing(null)}
          onSaved={onChanged}
        />
      )}
    </Card>
  );
}
