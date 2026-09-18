import PageMeta from "@/components/seo/PageMeta";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RequirementsSurvey from "@/modules/requirements/RequirementsSurvey";
import RoadmapSuggestions from "@/modules/roadmap/RoadmapSuggestions";

export default function RequisitosPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-5xl space-y-4">
      <PageMeta
        title="Requisitos e novas áreas | PrescriMed"
        description="Questionário de requisitos clínicos e documento de sugestões de novas áreas do PrescriMed, com exportação estruturada."
        path="/app/requisitos"
      />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Requisitos e novas áreas</h1>
        <p className="text-sm text-muted-foreground">
          Responda ao questionário para orientar o produto e gere o documento de sugestões de módulos futuros.
        </p>
      </header>

      <Tabs defaultValue="questionario">
        <TabsList>
          <TabsTrigger value="questionario">Questionário</TabsTrigger>
          <TabsTrigger value="sugestoes">Sugestões de novas áreas</TabsTrigger>
        </TabsList>
        <TabsContent value="questionario" className="pt-4">
          <RequirementsSurvey />
        </TabsContent>
        <TabsContent value="sugestoes" className="pt-4">
          <RoadmapSuggestions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
