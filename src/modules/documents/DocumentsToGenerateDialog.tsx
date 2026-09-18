// Etapa 20 — Diálogo que lista os documentos que serão gerados a partir do atendimento.
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertCircle, FileText, Eye, Loader2 } from "lucide-react";
import { groupItemsByDocument } from "./lib/groupItemsByDocument";
import { validateBundle } from "./lib/documentValidation";
import { useDocumentsSettings } from "./hooks/useDocumentsSettings";
import { useSignatureProfiles } from "./hooks/useSignatureProfiles";
import DocumentPreviewDialog from "./DocumentPreviewDialog";
import type {
  AtendimentoItem, ContextoAtendimento, DocumentBundle, PacienteInfo,
} from "./lib/types";

export interface DocumentsToGenerateDialogProps {
  open: boolean;
  onClose: () => void;
  itens: AtendimentoItem[];
  paciente: PacienteInfo;
  hospitalar?: boolean;
  ctx?: ContextoAtendimento;
  id_atendimento?: string | null;
  revisaoFinalOk?: boolean;
}

export default function DocumentsToGenerateDialog(props: DocumentsToGenerateDialogProps) {
  const { open, onClose, itens, paciente, hospitalar, id_atendimento, revisaoFinalOk } = props;
  const { settings, loading: loadingSettings } = useDocumentsSettings();
  const { profiles, loading: loadingProfiles } = useSignatureProfiles();
  const [perfilId, setPerfilId] = useState<string>("");
  const [bundles, setBundles] = useState<DocumentBundle[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [incluirAnexoIV, setIncluirAnexoIV] = useState(false);

  useEffect(() => {
    if (!open) return;
    const initial = groupItemsByDocument(itens, {
      hospitalar,
      settings,
      incluirAnexoIV,
    });
    setBundles(initial);
  }, [open, itens, hospitalar, settings, incluirAnexoIV]);

  useEffect(() => {
    if (!perfilId && profiles.length > 0) {
      const padrao = profiles.find((p) => p.padrao) ?? profiles[0];
      setPerfilId(padrao.id);
    }
  }, [profiles, perfilId]);

  const perfil = useMemo(() => profiles.find((p) => p.id === perfilId) ?? null, [profiles, perfilId]);

  const validated = useMemo(
    () => bundles.map((b) => ({ b, v: validateBundle(b, paciente, perfil, settings) })),
    [bundles, paciente, perfil, settings],
  );

  const ctx: ContextoAtendimento = props.ctx ?? {
    hospitalar: Boolean(hospitalar),
    cidade: perfil?.cidade_padrao ?? undefined,
    data: new Date().toISOString().slice(0, 10),
  };

  const exigirRevisao = settings?.exigir_revisao_final_concluida ?? true;
  const podeGerar = !exigirRevisao || revisaoFinalOk === true;
  const algumIncluido = bundles.some((b) => b.incluir);

  const toggleIncluir = (idx: number, v: boolean) => {
    setBundles((s) => s.map((b, i) => (i === idx ? { ...b, incluir: v } : b)));
  };

  const selectedBundles = bundles.filter((b) => b.incluir);

  if (loadingSettings || loadingProfiles) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-md">
          <div className="p-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Documentos a gerar</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!podeGerar && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 text-destructive p-3 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div>
                  Conclua a <strong>Revisão Final de Segurança</strong> antes de gerar os documentos definitivos.
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Perfil de assinatura</Label>
                <Select value={perfilId} onValueChange={setPerfilId}>
                  <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
                  <SelectContent>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.perfil_nome} — {p.nome_profissional}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {profiles.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum perfil cadastrado. Configure em Admin → Documentos.
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Anexo Técnico IV</Label>
                <div className="flex items-center gap-2 h-10 rounded-md border px-3">
                  <Checkbox
                    id="anexoiv"
                    checked={incluirAnexoIV}
                    onCheckedChange={(v) => setIncluirAnexoIV(Boolean(v))}
                  />
                  <Label htmlFor="anexoiv" className="text-sm font-normal cursor-pointer">
                    Incluir anexo de diluição/administração
                  </Label>
                </div>
              </div>
            </div>

            {bundles.length === 0 ? (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Nenhum documento será gerado a partir dos itens atuais.
              </div>
            ) : (
              <div className="space-y-2">
                {validated.map(({ b, v }, idx) => (
                  <Card key={b.tipo}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <Checkbox
                        checked={b.incluir}
                        onCheckedChange={(val) => toggleIncluir(idx, Boolean(val))}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{b.titulo}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {b.itens.length} {b.itens.length === 1 ? "item" : "itens"}
                          </Badge>
                          {!v.ok && (
                            <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">
                              Pendências
                            </Badge>
                          )}
                        </div>
                        {!v.ok && (
                          <ul className="mt-1 ml-6 list-disc text-xs text-destructive">
                            {v.pendencias.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              onClick={() => setPreviewOpen(true)}
              disabled={!podeGerar || !algumIncluido || !perfil}
            >
              <Eye className="h-4 w-4 mr-1" /> Pré-visualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewOpen && (
        <DocumentPreviewDialog
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          bundles={selectedBundles}
          paciente={paciente}
          perfil={perfil}
          ctx={ctx}
          settings={settings}
          id_atendimento={id_atendimento}
          onSaved={() => { setPreviewOpen(false); onClose(); }}
        />
      )}
    </>
  );
}
