import { useMemo } from "react";
import { Download, FileJson, FileSpreadsheet, FileText, RotateCcw } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SURVEY_SECTIONS, type SurveyQuestion } from "./lib/questionnaire";
import { useRequirementsSurvey } from "./hooks/useRequirementsSurvey";
import {
  completionRate,
  downloadFile,
  missingRequired,
  toCsv,
  toMarkdown,
  toStructuredJson,
} from "./lib/exporters";

export default function RequirementsSurvey() {
  const { response, setAnswer, toggleMulti, setRespondent, reset } = useRequirementsSurvey();
  const progress = useMemo(() => completionRate(response), [response]);
  const pending = useMemo(() => missingRequired(response), [response]);

  const otherId = (id: string) => `${id}__outro`;

  const renderQuestion = (q: SurveyQuestion) => {
    const value = response.answers[q.id];
    return (
      <div key={q.id} className="space-y-2 border-b pb-4 last:border-0">
        <div className="flex items-start gap-2">
          <Label className="text-sm font-medium">{q.label}</Label>
          {q.required && <Badge variant="outline" className="text-[10px]">obrigatória</Badge>}
        </div>
        {q.help && <p className="text-xs text-muted-foreground">{q.help}</p>}

        {q.type === "single" && (
          <RadioGroup
            value={typeof value === "string" ? value : ""}
            onValueChange={(v) => setAnswer(q.id, v)}
            className="grid gap-1 sm:grid-cols-2"
          >
            {(q.options ?? []).map((opt) => (
              <div key={opt} className="flex items-center gap-2">
                <RadioGroupItem value={opt} id={`${q.id}-${opt}`} />
                <Label htmlFor={`${q.id}-${opt}`} className="text-sm font-normal">{opt}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {q.type === "multi" && (
          <div className="grid gap-1 sm:grid-cols-2">
            {(q.options ?? []).map((opt) => {
              const list = Array.isArray(value) ? value : [];
              return (
                <div key={opt} className="flex items-center gap-2">
                  <Checkbox
                    id={`${q.id}-${opt}`}
                    checked={list.includes(opt)}
                    onCheckedChange={() => toggleMulti(q.id, opt)}
                  />
                  <Label htmlFor={`${q.id}-${opt}`} className="text-sm font-normal">{opt}</Label>
                </div>
              );
            })}
          </div>
        )}

        {q.type === "scale" && (
          <div className="space-y-1">
            <Slider
              value={[typeof value === "number" ? value : (q.min ?? 1)]}
              min={q.min ?? 1}
              max={q.max ?? 5}
              step={1}
              onValueChange={([v]) => setAnswer(q.id, v)}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{q.minLabel ?? q.min}</span>
              <span className="font-medium text-foreground">
                {typeof value === "number" ? value : "—"}
              </span>
              <span>{q.maxLabel ?? q.max}</span>
            </div>
          </div>
        )}

        {q.type === "text" && (
          <Textarea
            rows={3}
            placeholder={q.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => setAnswer(q.id, e.target.value)}
          />
        )}

        {q.allowOther && q.type !== "text" && (
          <Input
            className="mt-1"
            placeholder="Outro (descreva)"
            value={(response.answers[otherId(q.id)] as string) ?? ""}
            onChange={(e) => setAnswer(otherId(q.id), e.target.value)}
          />
        )}
      </div>
    );
  };

  const exportJson = () => {
    downloadFile(
      "prescrimed-requisitos.json",
      JSON.stringify(toStructuredJson(response), null, 2),
      "application/json",
    );
    toast.success("Respostas exportadas em JSON.");
  };
  const exportMd = () => {
    downloadFile("prescrimed-requisitos.md", toMarkdown(response), "text/markdown");
    toast.success("Respostas exportadas em Markdown.");
  };
  const exportCsv = () => {
    downloadFile("prescrimed-requisitos.csv", toCsv(response), "text/csv");
    toast.success("Respostas exportadas em CSV.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identificação (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input
              value={response.respondent.nome ?? ""}
              onChange={(e) => setRespondent({ nome: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Instituição</Label>
            <Input
              value={response.respondent.instituicao ?? ""}
              onChange={(e) => setRespondent({ instituicao: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Contato</Label>
            <Input
              value={response.respondent.email ?? ""}
              onChange={(e) => setRespondent({ email: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-48">
          <Progress value={progress} />
          <p className="text-xs text-muted-foreground mt-1">
            {progress}% preenchido
            {pending.length > 0 && ` · ${pending.length} pergunta(s) obrigatória(s) pendente(s)`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportJson}>
          <FileJson className="h-4 w-4 mr-1" /> JSON
        </Button>
        <Button variant="outline" size="sm" onClick={exportMd}>
          <FileText className="h-4 w-4 mr-1" /> Markdown
        </Button>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { reset(); toast.success("Respostas limpas."); }}>
          <RotateCcw className="h-4 w-4 mr-1" /> Limpar
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={[SURVEY_SECTIONS[0].id]} className="space-y-2">
        {SURVEY_SECTIONS.map((section) => (
          <AccordionItem key={section.id} value={section.id} className="border rounded-md px-3">
            <AccordionTrigger className="text-left">
              <div>
                <p className="font-medium">{section.title}</p>
                <p className="text-xs text-muted-foreground">{section.purpose}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-1">
              {section.questions.map(renderQuestion)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Download className="h-3 w-3" aria-hidden /> As respostas ficam salvas neste navegador e só saem daqui quando você exporta.
      </p>
    </div>
  );
}
