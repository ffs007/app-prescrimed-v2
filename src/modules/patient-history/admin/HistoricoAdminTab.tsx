// Etapa 18 — Aba admin do módulo Histórico do Paciente.
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import HistoricoSettingsCard from "./HistoricoSettingsCard";

interface ReuseLogRow {
  id: string;
  data_hora: string;
  acao: string;
  id_paciente: string;
  id_prescricao_origem: string | null;
}
interface ViewLogRow {
  id: string;
  data_hora: string;
  tipo_historico_visualizado: string;
  id_paciente: string;
}

export default function HistoricoAdminTab() {
  const [reuseLogs, setReuseLogs] = useState<ReuseLogRow[]>([]);
  const [viewLogs, setViewLogs] = useState<ViewLogRow[]>([]);

  useEffect(() => {
    supabase
      .from("log_reaproveitamento_prescricao")
      .select("id, data_hora, acao, id_paciente, id_prescricao_origem")
      .order("data_hora", { ascending: false })
      .limit(50)
      .then(({ data }) => setReuseLogs((data as ReuseLogRow[]) ?? []));

    supabase
      .from("log_visualizacao_historico_paciente")
      .select("id, data_hora, tipo_historico_visualizado, id_paciente")
      .order("data_hora", { ascending: false })
      .limit(50)
      .then(({ data }) => setViewLogs((data as ViewLogRow[]) ?? []));
  }, []);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="settings">
        <TabsList>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="reuse_log">Logs de reaproveitamento</TabsTrigger>
          <TabsTrigger value="view_log">Logs de visualização</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="mt-3">
          <HistoricoSettingsCard />
        </TabsContent>

        <TabsContent value="reuse_log" className="mt-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">Últimas 50 ações de reaproveitamento</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-xs">
              {reuseLogs.length === 0 && <div className="text-muted-foreground">Nenhum registro.</div>}
              {reuseLogs.map((l) => (
                <div key={l.id} className="flex items-center justify-between border rounded p-2">
                  <div className="text-muted-foreground">
                    {new Date(l.data_hora).toLocaleString("pt-BR")} • paciente {l.id_paciente.slice(0, 8)}
                  </div>
                  <Badge variant="outline" className="text-[10px]">{l.acao}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="view_log" className="mt-3">
          <Card>
            <CardHeader><CardTitle className="text-sm">Últimas 50 visualizações</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-xs">
              {viewLogs.length === 0 && <div className="text-muted-foreground">Nenhum registro.</div>}
              {viewLogs.map((l) => (
                <div key={l.id} className="flex items-center justify-between border rounded p-2">
                  <div className="text-muted-foreground">
                    {new Date(l.data_hora).toLocaleString("pt-BR")} • paciente {l.id_paciente.slice(0, 8)}
                  </div>
                  <Badge variant="outline" className="text-[10px]">{l.tipo_historico_visualizado}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
