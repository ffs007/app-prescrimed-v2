// Etapa 20 — Aba administrativa do módulo de Documentos.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DocumentsSettingsCard from "./DocumentsSettingsCard";
import SignatureProfilesTab from "./SignatureProfilesTab";
import DocumentsLogsTab from "./DocumentsLogsTab";

export default function DocumentsAdminTab({
  canEdit, isAdmin: _isAdmin,
}: { canEdit: boolean; isAdmin: boolean }) {
  return (
    <Tabs defaultValue="settings">
      <TabsList>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
        <TabsTrigger value="signatures">Perfis de Assinatura</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="settings" className="pt-4">
        <DocumentsSettingsCard canEdit={canEdit} />
      </TabsContent>
      <TabsContent value="signatures" className="pt-4">
        <SignatureProfilesTab canEdit={canEdit} />
      </TabsContent>
      <TabsContent value="logs" className="pt-4">
        <DocumentsLogsTab />
      </TabsContent>
    </Tabs>
  );
}
