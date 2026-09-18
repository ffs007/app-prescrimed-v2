import { useEffect, useState } from "react";
import { Check, X, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { IVMedication } from "./IVDilutionAdminPage";
import type { MatchResult } from "./lib/ivMatcher";
import { logIVMatch, suggestSearchTerm } from "./lib/ivMatchLog";
import { normalizeIV } from "./lib/ivMatcher";
import { useIVPermissions } from "./hooks/useIVPermissions";

type Props = {
  query: string;
  match: MatchResult | null;
  onConfirm?: (med: IVMedication) => void;
  onIgnore?: () => void;
  prescricaoId?: string | null;
  medicamentoPrescritoId?: string | null;
};

export default function IVMatchHint({
  query, match, onConfirm, onIgnore, prescricaoId, medicamentoPrescritoId,
}: Props) {
  const perms = useIVPermissions();
  const [resolved, setResolved] = useState<"none" | "confirmed" | "ignored">("none");
  const [pickedId, setPickedId] = useState<string>("");

  useEffect(() => { setResolved("none"); setPickedId(""); }, [query]);

  if (!match || !query) return null;
  if (resolved !== "none") return null;

  const best = match.best;
  const top = match.candidates.slice(0, 5);
  const score = best?.score ?? 0;

  // Auto-associado (>=90 e não ambíguo): badge sutil
  if (best && score >= 90 && !match.ambiguous) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1">
        <Check className="h-3 w-3 text-emerald-600" />
        <span>Segurança IV encontrada para <strong>{best.med.principio_ativo}</strong>.</span>
      </div>
    );
  }

  const handleConfirm = async (med: IVMedication, type: "manual" | "fuzzy" | "parcial") => {
    setResolved("confirmed");
    onConfirm?.(med);
    await logIVMatch({
      result: match,
      action: type === "manual" ? "escolhido_manual" : "confirmado_pelo_usuario",
      type,
      prescricaoId,
      medicamentoPrescritoId,
      chosenMedId: med.id,
      chosenMedName: med.principio_ativo,
    });
    // Sugerir termo se diferente do princípio ativo normalizado
    const queryNorm = normalizeIV(query);
    const principioNorm = normalizeIV(med.principio_ativo);
    if (queryNorm && queryNorm !== principioNorm && queryNorm.length >= 3) {
      // Apenas admin/revisor verão a sugestão (toast), mas o registro é insertado para qualquer usuário autenticado
      await suggestSearchTerm({
        medId: med.id,
        principioAtivo: med.principio_ativo,
        termo: query.trim(),
      });
    }
  };

  const handleIgnore = async () => {
    setResolved("ignored");
    onIgnore?.();
    await logIVMatch({
      result: match,
      action: "ignorado",
      prescricaoId,
      medicamentoPrescritoId,
    });
  };

  // Sem correspondência
  if (!best || score < 50) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/30 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
        <Search className="h-3 w-3" />
        <span>Sem dados de Segurança IV cadastrados para este medicamento.</span>
        {perms.canEdit && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs ml-auto"
            onClick={async () => {
              await logIVMatch({ result: match, action: "sem_correspondencia", prescricaoId, medicamentoPrescritoId });
            }}>
            Sugerir cadastro na Base IV
          </Button>
        )}
      </div>
    );
  }

  // Ambíguo ou score baixo: pedir confirmação
  const isMultiple = match.ambiguous || (score < 70 && top.length > 1);

  return (
    <div className="rounded-md border bg-card px-3 py-2 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        {match.highRisk ? (
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        ) : (
          <Search className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium">
          {isMultiple ? "Encontramos mais de uma opção" : "Possível correspondência encontrada"}
        </span>
        {!isMultiple && best && (
          <Badge variant="outline" className="ml-auto text-[10px]">
            {score}% de confiança
          </Badge>
        )}
      </div>

      {isMultiple ? (
        <>
          <p className="text-xs text-muted-foreground">
            Para "{query}", selecione manualmente o medicamento correspondente:
          </p>
          <Select value={pickedId} onValueChange={setPickedId}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Escolher medicamento…" />
            </SelectTrigger>
            <SelectContent>
              {top.map((c) => (
                <SelectItem key={c.med.id} value={c.med.id}>
                  {c.med.principio_ativo} ({c.score}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={handleIgnore}>
              <X className="h-3 w-3 mr-1" /> Ignorar
            </Button>
            <Button size="sm" disabled={!pickedId} onClick={() => {
              const m = top.find((c) => c.med.id === pickedId)?.med;
              if (m) handleConfirm(m, "manual");
            }}>
              <Check className="h-3 w-3 mr-1" /> Confirmar
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Digitado: <span className="italic">"{query}"</span> · Sugestão:{" "}
            <strong className="text-foreground">{best!.med.principio_ativo}</strong>
          </p>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={handleIgnore}>
              <X className="h-3 w-3 mr-1" /> Ignorar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setPickedId("__choose__")}>
              Escolher outro
            </Button>
            <Button size="sm" onClick={() => handleConfirm(best!.med, best!.type === "fuzzy" ? "fuzzy" : "parcial")}>
              <Check className="h-3 w-3 mr-1" /> Confirmar
            </Button>
          </div>
          {pickedId === "__choose__" && (
            <Select value="" onValueChange={(v) => {
              const m = match.candidates.find((c) => c.med.id === v)?.med;
              if (m) handleConfirm(m, "manual");
            }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Outro medicamento…" />
              </SelectTrigger>
              <SelectContent>
                {match.candidates.map((c) => (
                  <SelectItem key={c.med.id} value={c.med.id}>
                    {c.med.principio_ativo} ({c.score}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </>
      )}
    </div>
  );
}
