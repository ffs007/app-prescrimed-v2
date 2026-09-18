import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssinaturaDigitalConfig } from "../hooks/useAssinaturaDigitalConfig";

export default function AssinaturaDigitalSettingsCard() {
  const { config, loading, update } = useAssinaturaDigitalConfig();
  if (loading || !config) return <div className="text-sm text-muted-foreground p-4">Carregando…</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assinatura Digital</CardTitle>
          <Badge variant="outline">{config.status_integracao}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Estrutura preparada para assinatura digital / certificado. A integração real será habilitada em fase posterior.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Tipo de assinatura</Label>
            <Select value={config.tipo_assinatura} onValueChange={(v) => update({ tipo_assinatura: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sem_assinatura_digital">Sem assinatura digital</SelectItem>
                <SelectItem value="assinatura_digital_externa">Assinatura digital externa</SelectItem>
                <SelectItem value="certificado_a1">Certificado A1</SelectItem>
                <SelectItem value="certificado_a3">Certificado A3</SelectItem>
                <SelectItem value="assinatura_eletronica_simples">Assinatura eletrônica simples</SelectItem>
                <SelectItem value="integracao_api">Integração via API</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Modo</Label>
            <Select value={config.modo_assinatura} onValueChange={(v) => update({ modo_assinatura: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="imprimir_sem_assinatura_digital">Imprimir sem assinatura digital</SelectItem>
                <SelectItem value="gerar_pdf_para_assinar">Gerar PDF para assinar</SelectItem>
                <SelectItem value="assinar_automaticamente">Assinar automaticamente</SelectItem>
                <SelectItem value="enviar_para_assinatura_externa">Enviar para assinatura externa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Provedor</Label>
            <Input defaultValue={config.provedor_assinatura ?? ""} onBlur={(e) => update({ provedor_assinatura: e.target.value })} placeholder="Ex.: BirdID, Vidaas, ICP-Brasil" />
          </div>
          <div>
            <Label className="text-xs">Ambiente</Label>
            <Select value={config.ambiente} onValueChange={(v) => update({ ambiente: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="teste">Teste</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">URL da API</Label>
            <Input defaultValue={config.api_assinatura_url ?? ""} onBlur={(e) => update({ api_assinatura_url: e.target.value })} placeholder="https://…" />
          </div>
          <div>
            <Label className="text-xs">Status da integração</Label>
            <Select value={config.status_integracao} onValueChange={(v) => update({ status_integracao: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nao_configurado">Não configurado</SelectItem>
                <SelectItem value="em_configuracao">Em configuração</SelectItem>
                <SelectItem value="configurado">Configurado</SelectItem>
                <SelectItem value="erro">Erro</SelectItem>
                <SelectItem value="producao">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <div>
            <Label className="text-sm">API key configurada</Label>
            <p className="text-xs text-muted-foreground">Indica que a chave foi armazenada com segurança.</p>
          </div>
          <Switch checked={config.api_key_configurada} onCheckedChange={(v) => update({ api_key_configurada: v })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Certificado configurado</Label>
          </div>
          <Switch checked={config.certificado_configurado} onCheckedChange={(v) => update({ certificado_configurado: v })} />
        </div>
        {config.ultimo_teste_assinatura && (
          <p className="text-xs text-muted-foreground">Último teste: {new Date(config.ultimo_teste_assinatura).toLocaleString()}</p>
        )}
      </CardContent>
    </Card>
  );
}
