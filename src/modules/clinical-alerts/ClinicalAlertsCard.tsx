import { useMemo, useState } from "react";
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronUp, Info, Heart, Baby } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  analyzePrescription, type MedicationInfo, type ContraindicationRecord,
  type RestrictionRecord, type ClinicalSettings, type PatientProfile, type AlertLevel,
} from "./lib/clinicalAlertsCalc";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const levelStyles: Record<AlertLevel, string> = {
  critico: "border-destructive/40 bg-destructive/5 text-destructive",
  alto: "border-destructive/30 bg-destructive/5 text-destructive",
  atencao: "border-warning/40 bg-warning/5 text-warning",
  informativo: "border-canon-blue/30 bg-canon-blue/5 text-canon-blue",
};

interface Props {
  meds: MedicationInfo[];
  patient: PatientProfile;
  base: ContraindicationRecord[];
  restrictions: RestrictionRecord[];
  settings: ClinicalSettings;
  defaultCollapsed?: boolean;
}

export default function ClinicalAlertsCard({
  meds, patient, base, restrictions, settings, defaultCollapsed = true,
}: Props) {
  const [expanded, setExpanded] = useState(!defaultCollapsed);
  const [open, setOpen] = useState(false);

  const result = useMemo(
    () => analyzePrescription({ meds, patient, base, restrictions, settings }),
    [meds, patient, base, restrictions, settings]
  );

  const maior: AlertLevel = result.contadores.criticos
    ? "critico"
    : result.contadores.altos
    ? "alto"
    : result.todos_alertas.some((a) => a.nivel === "atencao")
    ? "atencao"
    : "informativo";

  const alergiasResumo = patient.alergias_medicamentosas.map((a) => a.principio_ativo).filter(Boolean).join(", ")
    || (patient.alergias_classes_medicamentosas.length ? patient.alergias_classes_medicamentosas.join(", ") : "Nenhuma");

  return (
    <div className={cn("rounded-md border p-3 text-[12px]", levelStyles[maior])}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 text-left"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldAlert className="h-4 w-4" />
          Alergias e Condições
        </span>
        {expanded ? <ChevronUp className="h-4 w-4 text-ink-faint" /> : <ChevronDown className="h-4 w-4 text-ink-faint" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">Alergias: {alergiasResumo}</Badge>
            {patient.gestante && (
              <Badge className="bg-warning/10 text-warning border-warning/30">
                <Baby className="h-3 w-3 mr-1" /> Gestante
              </Badge>
            )}
            {patient.lactante && (
              <Badge className="bg-warning/10 text-warning border-warning/30">
                <Heart className="h-3 w-3 mr-1" /> Lactante
              </Badge>
            )}
            {result.contadores.altos > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                Altos: {result.contadores.altos}
              </Badge>
            )}
            {result.contadores.criticos > 0 && (
              <Badge className="bg-destructive/10 text-destructive border-destructive/30">
                Críticos: {result.contadores.criticos}
              </Badge>
            )}
          </div>

          {result.todos_alertas.slice(0, 3).map((a) => (
            <p key={a.id} className="flex items-start gap-1 text-[11px] leading-snug">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{a.mensagem}</span>
            </p>
          ))}

          <div className="pt-1">
            <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setOpen(true)}>
              Ver detalhes
            </Button>
          </div>

          <p className="flex items-start gap-1 text-[10px] italic text-ink-faint pt-0.5">
            <Info className="h-2.5 w-2.5 mt-0.5 shrink-0" />
            Alertas de alergia e contraindicação são ferramentas de apoio. Validar história clínica, gravidade da reação, indicação, alternativas terapêuticas e protocolo institucional.
          </p>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhes — Alergias e Condições</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="alergias">
            <TabsList>
              <TabsTrigger value="alergias">Alergias</TabsTrigger>
              <TabsTrigger value="gestlact">Gestação/Lactação</TabsTrigger>
              <TabsTrigger value="condicoes">Comorbidades/CID/Idade</TabsTrigger>
              <TabsTrigger value="restricoes">Restrições</TabsTrigger>
            </TabsList>

            <TabsContent value="alergias" className="space-y-2">
              {result.todos_alertas.filter((a) => a.tipo.startsWith("alergia") || a.tipo === "reacao_cruzada").length === 0 && (
                <p className="text-sm text-ink-faint">Sem alertas de alergia.</p>
              )}
              {result.todos_alertas
                .filter((a) => a.tipo.startsWith("alergia") || a.tipo === "reacao_cruzada")
                .map((a) => (
                  <AlertRow key={a.id} a={a} />
                ))}
            </TabsContent>

            <TabsContent value="gestlact" className="space-y-2">
              {result.todos_alertas.filter((a) => a.tipo === "gestacao" || a.tipo === "lactacao").map((a) => (
                <AlertRow key={a.id} a={a} />
              ))}
            </TabsContent>

            <TabsContent value="condicoes" className="space-y-2">
              {result.todos_alertas.filter((a) => a.tipo === "comorbidade" || a.tipo === "cid" || a.tipo === "idade").map((a) => (
                <AlertRow key={a.id} a={a} />
              ))}
            </TabsContent>

            <TabsContent value="restricoes" className="space-y-2">
              {result.todos_alertas.filter((a) => a.tipo === "restricao_paciente").length === 0 && (
                <p className="text-sm text-ink-faint">Sem restrições específicas para os medicamentos atuais.</p>
              )}
              {result.todos_alertas.filter((a) => a.tipo === "restricao_paciente").map((a) => (
                <AlertRow key={a.id} a={a} />
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AlertRow({ a }: { a: import("./lib/clinicalAlertsCalc").ClinicalAlert }) {
  return (
    <div className={cn("rounded border p-2 text-[12px]", levelStyles[a.nivel])}>
      <div className="font-medium">{a.mensagem}</div>
      {a.detalhes?.map((d, i) => (
        <p key={i} className="text-[11px] mt-0.5">{d}</p>
      ))}
      <div className="flex gap-1 mt-1">
        {a.exige_justificativa && (
          <Badge variant="outline" className="text-[10px]">Exige justificativa</Badge>
        )}
        {a.bloqueia && (
          <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
            Bloqueio
          </Badge>
        )}
      </div>
    </div>
  );
}
