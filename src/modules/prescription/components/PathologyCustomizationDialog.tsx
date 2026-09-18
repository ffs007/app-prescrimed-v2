/**
 * PathologyCustomizationDialog — ajuste dos conteúdos padrão de uma patologia.
 *
 * Permite editar anamnese sugerida, exames preferenciais, condutas usuais e
 * prescrições-modelo, além de vincular protocolos, guidelines, modelos de
 * documento e arquivos enviados. Hierárquico: o essencial primeiro, detalhes
 * em seções recolhíveis.
 */
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, FileUp, Link2, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { describeSupabaseError, type SupabaseLikeError } from "@/lib/supabaseError";
import {
  getProtocolFileUrl,
  pathologyKey,
  uploadProtocolFile,
  usePathologyCustomizationMutations,
  type PathologyCustomizationRow,
  type PathologyResource,
  type ResourceKind,
} from "../hooks/usePathologyCustomization";

const RESOURCE_LABEL: Record<ResourceKind, string> = {
  protocolo: "Protocolo institucional",
  guideline: "Guideline",
  modelo: "Modelo de documento",
  arquivo: "Arquivo enviado",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pathologyName: string;
  specialty?: string;
  existing?: PathologyCustomizationRow;
}

const toText = (list: string[]) => list.join("\n");
const toList = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export function PathologyCustomizationDialog({
  open,
  onOpenChange,
  pathologyName,
  specialty,
  existing,
}: Props) {
  const { save } = usePathologyCustomizationMutations();
  const [anamnese, setAnamnese] = useState("");
  const [exames, setExames] = useState("");
  const [condutas, setCondutas] = useState("");
  const [prescricoes, setPrescricoes] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [esp, setEsp] = useState("");
  const [recursos, setRecursos] = useState<PathologyResource[]>([]);
  const [novoTipo, setNovoTipo] = useState<ResourceKind>("protocolo");
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaUrl, setNovaUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAnamnese(toText(existing?.anamnese ?? []));
    setExames(toText(existing?.exames ?? []));
    setCondutas(toText(existing?.condutas ?? []));
    setPrescricoes(toText(existing?.prescricoes_modelo ?? []));
    setObservacoes(existing?.observacoes ?? "");
    setEsp(existing?.especialidade ?? specialty ?? "");
    setRecursos(existing?.recursos ?? []);
    setNovoTitulo("");
    setNovaUrl("");
  }, [open, existing, specialty]);

  const addResource = () => {
    if (!novoTitulo.trim()) {
      toast.error("Informe o título do recurso");
      return;
    }
    setRecursos((r) => [
      ...r,
      {
        id: crypto.randomUUID(),
        tipo: novoTipo,
        titulo: novoTitulo.trim(),
        url: novaUrl.trim() || undefined,
      },
    ]);
    setNovoTitulo("");
    setNovaUrl("");
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = await uploadProtocolFile(file);
      setRecursos((r) => [
        ...r,
        { id: crypto.randomUUID(), tipo: "arquivo", titulo: file.name, storagePath: path },
      ]);
      toast.success("Arquivo anexado");
    } catch (e) {
      toast.error(describeSupabaseError(e as SupabaseLikeError));
    } finally {
      setUploading(false);
    }
  };

  const openResource = async (r: PathologyResource) => {
    try {
      const url = r.storagePath ? await getProtocolFileUrl(r.storagePath) : r.url;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(describeSupabaseError(e as SupabaseLikeError));
    }
  };

  const submit = async () => {
    try {
      await save.mutateAsync({
        patologia_key: pathologyKey(pathologyName),
        patologia_nome: pathologyName,
        especialidade: esp,
        favorito: existing?.favorito ?? false,
        anamnese: toList(anamnese),
        exames: toList(exames),
        condutas: toList(condutas),
        prescricoes_modelo: toList(prescricoes),
        recursos,
        observacoes,
      });
      toast.success("Personalização salva");
      onOpenChange(false);
    } catch (e) {
      toast.error(describeSupabaseError(e as SupabaseLikeError));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Personalizar “{pathologyName}”</DialogTitle>
          <DialogDescription>
            Um item por linha. Esses conteúdos aparecem como sugestão no atendimento e continuam
            revisáveis antes da emissão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pc-anamnese">Anamnese sugerida (perguntas-chave)</Label>
            <Textarea
              id="pc-anamnese"
              rows={4}
              value={anamnese}
              onChange={(e) => setAnamnese(e.target.value)}
              placeholder={"Há quanto tempo começou?\nFebre aferida?\nUso prévio de antibiótico?"}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pc-exames">Exames preferenciais</Label>
            <Textarea
              id="pc-exames"
              rows={3}
              value={exames}
              onChange={(e) => setExames(e.target.value)}
              placeholder={"Hemograma completo\nRaio-X de tórax PA e perfil"}
            />
          </div>

          <Accordion type="multiple" className="rounded-lg border border-border px-3">
            <AccordionItem value="condutas">
              <AccordionTrigger className="text-sm">Condutas usuais</AccordionTrigger>
              <AccordionContent>
                <Textarea
                  rows={4}
                  value={condutas}
                  onChange={(e) => setCondutas(e.target.value)}
                  placeholder={"Hidratação oral\nRetorno em 48h ou antes se piora"}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="prescricoes">
              <AccordionTrigger className="text-sm">Prescrições-modelo</AccordionTrigger>
              <AccordionContent>
                <Textarea
                  rows={4}
                  value={prescricoes}
                  onChange={(e) => setPrescricoes(e.target.value)}
                  placeholder={"Amoxicilina 500 mg — 1 cp VO 8/8h por 7 dias\nDipirona 500 mg — 1 cp VO 6/6h se dor"}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="recursos">
              <AccordionTrigger className="text-sm">
                Protocolos, guidelines e modelos
                {recursos.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {recursos.length}
                  </Badge>
                )}
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {recursos.length > 0 && (
                  <ul className="space-y-1.5">
                    {recursos.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm"
                      >
                        <Badge variant="outline" className="shrink-0">
                          {RESOURCE_LABEL[r.tipo]}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate">{r.titulo}</span>
                        {(r.url || r.storagePath) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Abrir recurso"
                            onClick={() => openResource(r)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Remover recurso"
                          onClick={() => setRecursos((list) => list.filter((x) => x.id !== r.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid gap-2 sm:grid-cols-[10rem_1fr]">
                  <Select value={novoTipo} onValueChange={(v) => setNovoTipo(v as ResourceKind)}>
                    <SelectTrigger aria-label="Tipo de recurso">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="protocolo">Protocolo</SelectItem>
                      <SelectItem value="guideline">Guideline</SelectItem>
                      <SelectItem value="modelo">Modelo de documento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={novoTitulo}
                    onChange={(e) => setNovoTitulo(e.target.value)}
                    placeholder="Título (ex.: Protocolo de sepse do hospital)"
                  />
                  <Input
                    className="sm:col-span-2"
                    value={novaUrl}
                    onChange={(e) => setNovaUrl(e.target.value)}
                    placeholder="Link (opcional)"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={addResource}>
                    <Link2 className="mr-2 h-4 w-4" /> Vincular recurso
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                    <label className="cursor-pointer">
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FileUp className="mr-2 h-4 w-4" />
                      )}
                      Enviar arquivo
                      <input
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void onUpload(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="extra" className="border-b-0">
              <AccordionTrigger className="text-sm">Especialidade e observações</AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pc-esp">Especialidade</Label>
                  <Input
                    id="pc-esp"
                    value={esp}
                    onChange={(e) => setEsp(e.target.value)}
                    placeholder="Pneumologia"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pc-obs">Observações</Label>
                  <Textarea
                    id="pc-obs"
                    rows={3}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar personalização"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
