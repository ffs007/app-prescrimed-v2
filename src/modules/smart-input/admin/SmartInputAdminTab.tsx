// Etapa 19 — Aba administrativa para Entrada Inteligente.
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SmartInputSettingsCard from "./SmartInputSettingsCard";
import LearningTermsTab from "./LearningTermsTab";

export default function SmartInputAdminTab({
  canEdit, isAdmin: _isAdmin,
}: { canEdit: boolean; isAdmin: boolean }) {
  return (
    <Tabs defaultValue="settings">
      <TabsList>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
        <TabsTrigger value="learning">Termos aprendidos</TabsTrigger>
      </TabsList>
      <TabsContent value="settings" className="pt-4">
        <SmartInputSettingsCard canEdit={canEdit} />
      </TabsContent>
      <TabsContent value="learning" className="pt-4">
        <LearningTermsTab canEdit={canEdit} />
      </TabsContent>
    </Tabs>
  );
}
