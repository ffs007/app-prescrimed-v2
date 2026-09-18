// Configuração das chaves de IA fornecidas pelo próprio médico.
import { useEffect, useState } from "react";
import { KeyRound, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAICredentials } from "./hooks/useAICredentials";
import { OPENROUTER_MODELS } from "./lib/types";

export default function AISettingsCard() {
  const { credentials, save, isLoading } = useAICredentials();
  const [perplexity, setPerplexity] = useState("");
  const [openrouter, setOpenrouter] = useState("");
  const [modelo, setModelo] = useState(credentials.modelo_preferido);
  const [auto, setAuto] = useState(credentials.atualizacoes_automaticas);

  useEffect(() => {
    setModelo(credentials.modelo_preferido);
    setAuto(credentials.atualizacoes_automaticas);
  }, [credentials.modelo_preferido, credentials.atualizacoes_automaticas]);

  const submit = async () => {
    try {
      await save.mutateAsync({
        modelo_preferido: modelo,
        atualizacoes_automaticas: auto,
        ...(perplexity.trim() ? { perplexity_key: perplexity.trim() } : {}),
        ...(openrouter.trim() ? { openrouter_key: openrouter.trim() } : {}),
      });
      setPerplexity("");
      setOpenrouter("");
      toast.success("Configurações de IA salvas.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível salvar.");
    }
  };

  const limpar = async (campo: "perplexity_key" | "openrouter_key") => {
    await save.mutateAsync({ [campo]: null } as never);
    toast.success("Chave removida.");
  };

  return (
    <section className="rounded-lg border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Chaves de IA</h3>
      </header>
      <p className="mb-4 text-xs text-muted-foreground">
        Use suas próprias chaves para pesquisa com fontes (Perplexity) e para redação de
        documentos (OpenRouter, com preferência por Claude). Sem chave, o app usa a IA
        incluída na plataforma. As chaves ficam guardadas apenas na sua conta e nunca
        aparecem no navegador depois de salvas.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="pplx" className="text-xs">
            Chave Perplexity {credentials.perplexity_key && <span className="text-muted-foreground">— configurada</span>}
          </Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="pplx"
              type="password"
              autoComplete="off"
              placeholder={credentials.perplexity_key ? "••••••••  (deixe em branco para manter)" : "pplx-..."}
              value={perplexity}
              onChange={(e) => setPerplexity(e.target.value)}
            />
            {credentials.perplexity_key && (
              <Button type="button" variant="outline" size="sm" onClick={() => limpar("perplexity_key")}>
                Remover
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="or" className="text-xs">
            Chave OpenRouter {credentials.openrouter_key && <span className="text-muted-foreground">— configurada</span>}
          </Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="or"
              type="password"
              autoComplete="off"
              placeholder={credentials.openrouter_key ? "••••••••  (deixe em branco para manter)" : "sk-or-..."}
              value={openrouter}
              onChange={(e) => setOpenrouter(e.target.value)}
            />
            {credentials.openrouter_key && (
              <Button type="button" variant="outline" size="sm" onClick={() => limpar("openrouter_key")}>
                Remover
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label className="text-xs">Modelo preferido para documentos</Label>
          <Select value={modelo} onValueChange={setModelo}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPENROUTER_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="pr-3">
            <div className="text-xs font-medium">Sugerir atualizações clínicas</div>
            <div className="text-[11px] text-muted-foreground">
              Deixa a busca de novas diretrizes disponível na aba Atualizações. Nada entra
              no seu conteúdo sem você aceitar.
            </div>
          </div>
          <Switch checked={auto} onCheckedChange={setAuto} />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Registramos apenas quem usou a IA, quando, com qual provedor e o assunto
            resumido — sem dados do paciente.
          </p>
          <Button onClick={submit} disabled={save.isPending || isLoading} size="sm" className="shrink-0">
            <Save className="mr-1.5 h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>
    </section>
  );
}
