// Etapa 20 — Card de configurações de Documentos.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDocumentsSettings } from "../hooks/useDocumentsSettings";
import type { DocumentosSettings } from "../lib/types";

const toggles: { key: keyof DocumentosSettings; label: string }[] = [
  { key: "previa_obrigatoria", label: "Sempre exibir prévia antes de imprimir" },
  { key: "exigir_revisao_final_concluida", label: "Exigir Revisão Final concluída" },
  { key: "bloquear_pdf_se_alerta_critico", label: "Bloquear geração se houver alerta crítico" },
  { key: "salvar_copia_historico", label: "Salvar cópia no histórico" },
  { key: "gerar_pdfs_separados_padrao", label: "Gerar PDFs separados por padrão" },
  { key: "gerar_duas_vias_controle_especial", label: "Gerar 2 vias para receita de controle especial" },
  { key: "exigir_dados_completos_controle_especial", label: "Exigir endereço e documento em controle especial" },
  { key: "separar_antimicrobianos", label: "Separar receita de antimicrobianos" },
  { key: "mostrar_logo", label: "Mostrar logo no cabeçalho" },
  { key: "mostrar_endereco", label: "Mostrar endereço do paciente" },
  { key: "mostrar_telefone", label: "Mostrar telefone do profissional" },
  { key: "numerar_paginas", label: "Numerar páginas" },
  { key: "usar_qrcode_validacao", label: "Incluir QR Code de validação (placeholder)" },
];

export default function DocumentsSettingsCard({ canEdit }: { canEdit: boolean }) {
  const { settings, loading, update } = useDocumentsSettings();

  if (loading || !settings) {
    return (
      <Card><CardContent className="p-6 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </CardContent></Card>
    );
  }

  const apply = async (patch: Partial<DocumentosSettings>) => {
    try { await update(patch); toast.success("Configuração salva"); }
    catch { toast.error("Falha ao salvar"); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Configurações — Documentos</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between border-b pb-2">
            <Label htmlFor={t.key} className="text-sm">{t.label}</Label>
            <Switch
              id={t.key}
              checked={Boolean(settings[t.key])}
              disabled={!canEdit}
              onCheckedChange={(v) => apply({ [t.key]: v } as Partial<DocumentosSettings>)}
            />
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">Formato da página</Label>
            <Select
              value={settings.formato_pagina}
              onValueChange={(v) => apply({ formato_pagina: v })}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Anexo IV (modo)</Label>
            <Select
              value={settings.anexo_iv_modo}
              onValueChange={(v) => apply({ anexo_iv_modo: v as DocumentosSettings["anexo_iv_modo"] })}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmar">Sempre confirmar</SelectItem>
                <SelectItem value="incluir_sempre">Incluir sempre</SelectItem>
                <SelectItem value="nao_incluir">Não incluir</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">CID em atestado</Label>
            <Select
              value={settings.cid_atestado_modo}
              onValueChange={(v) => apply({ cid_atestado_modo: v as DocumentosSettings["cid_atestado_modo"] })}
              disabled={!canEdit}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmar">Sempre confirmar</SelectItem>
                <SelectItem value="incluir_sempre">Incluir sempre</SelectItem>
                <SelectItem value="nunca_incluir">Nunca incluir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
