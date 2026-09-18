/**
 * Modal de encaminhamentos por patologia.
 *
 * A) Intrahospitalar / inter-hospitalar — dados imprescindíveis para quem
 *    recebe o paciente agora.
 * B) Ambulatorial / PSF — continuidade do cuidado.
 * C) CIDs — principal, associados e combos, integrados ao documento.
 */
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Building2, Stethoscope } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import CidManager, { type CidSelection } from "./CidManager";
import {
  buildReferralTemplate,
  referralToText,
  type ReferralKind,
} from "../data/referralTemplates";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathologyName: string;
  category?: string;
  onApply: (result: { texto: string; cidPrincipal: string; cidsAssociados: string[]; destino: string }) => void;
}

const ReferralModal = ({ open, onOpenChange, pathologyName, category, onApply }: Props) => {
  const [kind, setKind] = useState<ReferralKind>("hospitalar");
  const [values, setValues] = useState<Record<string, string>>({});
  const [cids, setCids] = useState<CidSelection>({ principal: "", associados: [] });

  const sections = useMemo(
    () => buildReferralTemplate(kind, pathologyName, category),
    [kind, pathologyName, category],
  );

  // Pré-preenche os campos com as sugestões da patologia sempre que o bloco muda.
  useEffect(() => {
    if (!open) return;
    setValues((prev) => {
      const next = { ...prev };
      sections.forEach((sec) =>
        sec.campos.forEach((f) => {
          if (next[f.id] === undefined) next[f.id] = f.value ?? "";
        }),
      );
      return next;
    });
  }, [open, sections]);

  const handleApply = () => {
    const texto = referralToText(sections, values);
    onApply({
      texto,
      cidPrincipal: cids.principal,
      cidsAssociados: cids.associados,
      destino: values.servico_destino ?? "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Encaminhamento — {pathologyName || "sem patologia"}</DialogTitle>
          <DialogDescription>
            Conteúdo pré-preenchido pela patologia. Tudo é editável e passa pela sua revisão antes da emissão.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={kind} onValueChange={(v) => setKind(v as ReferralKind)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hospitalar" className="gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Intra / inter-hospitalar
            </TabsTrigger>
            <TabsTrigger value="ambulatorial" className="gap-1.5">
              <Stethoscope className="h-3.5 w-3.5" /> Ambulatorial / PSF
            </TabsTrigger>
          </TabsList>

          <TabsContent value={kind} className="mt-3">
            <ScrollArea className="h-[52vh] pr-3">
              <div className="space-y-4">
                {sections.map((sec) => (
                  <section key={sec.id} className="space-y-2.5">
                    <h3 className="text-[11px] font-semibold uppercase tracking-editorial text-ink-faint">
                      {sec.titulo}
                    </h3>
                    {sec.campos.map((f) => (
                      <div key={f.id} className="space-y-1">
                        <Label className="flex items-center gap-1 text-xs font-medium text-ink">
                          {f.label}
                          {f.essential && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700">
                              <AlertTriangle className="h-3 w-3" /> imprescindível
                            </span>
                          )}
                        </Label>
                        {f.multiline ? (
                          <Textarea
                            value={values[f.id] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="min-h-[68px] resize-none border-ink-soft bg-paper-alt/40"
                          />
                        ) : (
                          <Input
                            value={values[f.id] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [f.id]: e.target.value }))}
                            placeholder={f.placeholder}
                            className="h-9 border-ink-soft bg-paper-alt/40"
                          />
                        )}
                      </div>
                    ))}
                  </section>
                ))}

                <section className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-editorial text-ink-faint">
                    CIDs do encaminhamento
                  </h3>
                  <CidManager
                    pathologyName={pathologyName}
                    category={category}
                    value={cids}
                    onChange={setCids}
                  />
                </section>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleApply}>
            Aplicar ao encaminhamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralModal;
