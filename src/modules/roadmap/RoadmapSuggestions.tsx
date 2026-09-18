import { useMemo, useState } from "react";
import { Download, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  COMPLEXITY_LABEL,
  FEATURE_SUGGESTIONS,
  PRIORITY_LABEL,
  SUGGESTION_AREAS,
  buildSuggestionsMarkdown,
  type Priority,
} from "./lib/featureSuggestions";
import { downloadFile } from "@/modules/requirements/lib/exporters";

const priorityVariant: Record<Priority, "default" | "secondary" | "outline"> = {
  alta: "default",
  media: "secondary",
  baixa: "outline",
};

export default function RoadmapSuggestions() {
  const [area, setArea] = useState<string>("todas");
  const [priority, setPriority] = useState<string>("todas");

  const items = useMemo(
    () =>
      FEATURE_SUGGESTIONS.filter(
        (s) => (area === "todas" || s.area === area) && (priority === "todas" || s.priority === priority),
      ),
    [area, priority],
  );

  const exportMd = () => {
    downloadFile("prescrimed-sugestoes.md", buildSuggestionsMarkdown(items), "text/markdown");
    toast.success("Documento de sugestões gerado.");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40">
          <label className="text-xs text-muted-foreground">Área</label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as áreas</SelectItem>
              {SUGGESTION_AREAS.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-40">
          <label className="text-xs text-muted-foreground">Prioridade</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={exportMd} className="ml-auto">
          <Download className="h-4 w-4 mr-1" /> Baixar documento (.md)
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {items.length} sugestões — cada uma com benefício clínico, complexidade e prioridade.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        {items.map((s) => (
          <Card key={s.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge variant="outline" className="mb-1">{s.area}</Badge>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" aria-hidden />
                    {s.title}
                  </CardTitle>
                </div>
                <Badge variant={priorityVariant[s.priority]}>{PRIORITY_LABEL[s.priority]}</Badge>
              </div>
              <CardDescription>{s.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="font-medium">Benefício:</span> {s.clinicalBenefit}</p>
              <p className="text-muted-foreground">
                Complexidade {COMPLEXITY_LABEL[s.complexity]} · Conecta-se a {s.linkedTo.join(", ")}
                {s.dependsOn?.length ? ` · Depende de ${s.dependsOn.join(", ")}` : ""}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
