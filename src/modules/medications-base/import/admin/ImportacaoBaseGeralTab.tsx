import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, ShieldCheck, ListChecks, AlertTriangle, History, ClipboardCheck, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadTemplateXlsx, downloadTemplateCsv } from "../lib/templateXlsx";

type Props = { canImport: boolean; isAdmin: boolean };

export default function ImportacaoBaseGeralTab({ canImport, isAdmin }: Props) {
  const { toast } = useToast();

  const handleDownloadXlsx = () => {
    try {
      downloadTemplateXlsx();
      toast({ title: "Modelo baixado", description: "Use o XLSX para preencher Medicamentos, Apresentações, Vínculos CID/Queixa e Modelos rápidos." });
    } catch (e: any) {
      toast({ title: "Falha ao gerar modelo", description: e?.message ?? "Erro inesperado", variant: "destructive" });
    }
  };

  const handleDownloadCsv = () => {
    try {
      downloadTemplateCsv();
      toast({ title: "Modelo CSV baixado", description: "O CSV cobre apenas a aba Medicamentos. Use o XLSX para o conjunto completo." });
    } catch (e: any) {
      toast({ title: "Falha ao gerar CSV", description: e?.message ?? "Erro inesperado", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Importação da Base Geral
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cadastre medicamentos, apresentações, vínculos com CID/queixa e modelos rápidos por planilha.
            Tudo entra como <Badge variant="outline" className="ml-1">rascunho seguro</Badge> até ser revisado manualmente.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleDownloadXlsx} disabled={!canImport}>
              <Download className="h-4 w-4 mr-1" /> Baixar modelo (XLSX)
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadCsv} disabled={!canImport}>
              <Download className="h-4 w-4 mr-1" /> Baixar modelo (CSV)
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Arquivo: <code>modelo_importacao_base_geral_medicamentos_prescrimed.xlsx</code> — 6 abas: Medicamentos, Apresentações, Vínculos CID/Queixa, Modelos rápidos, Instruções e Valores permitidos.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <PlaceholderStep icon={<FileSpreadsheet className="h-4 w-4" />} step="2" title="Importar planilha" desc="Envie o XLSX/CSV preenchido. Próxima fase." />
        <PlaceholderStep icon={<ShieldCheck className="h-4 w-4" />} step="3" title="Pré-validar dados" desc="Resumo de medicamentos, apresentações, vínculos, modelos, erros e alertas." />
        <PlaceholderStep icon={<AlertTriangle className="h-4 w-4" />} step="4" title="Erros e pendências" desc="Tabela com linha, aba, campo, problema e sugestão." />
        <PlaceholderStep icon={<ListChecks className="h-4 w-4" />} step="5" title="Confirmar importação" desc="Salva como rascunho seguro. Não sobrescreve revisado sem confirmação." />
        <PlaceholderStep icon={<Send className="h-4 w-4" />} step="6" title="Enviar para revisão" desc="Itens vão para a Fila de Revisão da Base Medicamentosa." />
        <PlaceholderStep icon={<ClipboardCheck className="h-4 w-4" />} step="7" title="Aprovar revisado" desc="Apenas registros revisados aparecem como recomendação confiável." />
        <PlaceholderStep icon={<History className="h-4 w-4" />} step="8" title="Histórico de importações" desc="Arquivo, responsável, contagens, status." />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Princípios de segurança</CardTitle></CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1.5">
          <p>• Nenhum dado importado entra como revisado automaticamente.</p>
          <p>• Doses sem fonte não são tratadas como recomendação confiável.</p>
          <p>• Vínculo CID/queixa é apenas sugestão cadastrada — nunca prescrição automática.</p>
          <p>• Medicamento revisado não é sobrescrito por importação sem confirmação explícita.</p>
          <p>• Importação é incremental: dados existentes são preservados.</p>
          {!isAdmin && <p className="pt-1">As configurações da importação são gerenciadas pelo administrador.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function PlaceholderStep({ icon, step, title, desc }: { icon: React.ReactNode; step: string; title: string; desc: string }) {
  return (
    <Card className="opacity-70">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">{step}</span>
          {icon} {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        {desc}
        <div className="mt-2"><Badge variant="outline">Em construção</Badge></div>
      </CardContent>
    </Card>
  );
}
