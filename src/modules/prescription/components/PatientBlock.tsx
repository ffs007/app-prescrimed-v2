import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Heart,
  Baby,
  Weight,
  UserRound,
  AlertTriangle,
} from "lucide-react";
import type { UsePatientReturn } from "../hooks/usePatient";

const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

interface PatientBlockProps {
  patient: UsePatientReturn;
}

const PatientBlock = ({ patient }: PatientBlockProps) => {
  const {
    patientName,
    isPediatric,
    isPregnant,
    ageValue,
    ageUnit,
    weight,
    allergies,
    hasAllergies,
    setPatientName,
    setIsPediatric,
    setIsPregnant,
    setAgeValue,
    setAgeUnit,
    setWeight,
    setAllergies,
  } = patient;

  const weightCritical = isPediatric && !weight;

  return (
    <div className="rounded-lg border border-ink-soft bg-card p-4 shadow-paper sm:p-5">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-canon-blue/10 text-canon-blue">
          <UserRound className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium uppercase tracking-editorial text-ink-faint">
            Bloco A
          </div>
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            Paciente & contexto
          </h2>
        </div>
      </div>

      {/* Linha 1 — Nome */}
      <div className="mb-3 space-y-1.5">
        <Label className="text-xs font-medium text-ink">
          Nome do paciente <span className="text-destructive">*</span>
        </Label>
        <Input
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder="Digite o nome completo"
          className="h-12 bg-paper-alt/40 border-ink-soft text-base"
        />
      </div>

      {/* Linha 2 — Idade / Peso */}
      <div className="mb-3 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-ink">Idade</Label>
          <div className="flex gap-1.5">
            <Input
              value={ageValue}
              onChange={(e) => setAgeValue(e.target.value)}
              placeholder="0"
              type="number"
              min="0"
              className="h-11 bg-paper-alt/40 border-ink-soft flex-1"
            />
            <select
              value={ageUnit}
              onChange={(e) => setAgeUnit(e.target.value as "meses" | "anos")}
              className="h-11 rounded-md border border-ink-soft bg-paper-alt/40 px-2 text-xs text-ink"
              aria-label="Unidade de idade"
            >
              <option value="anos">anos</option>
              <option value="meses">meses</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            className={cn(
              "flex items-center gap-1 text-xs font-medium",
              weightCritical ? "text-destructive" : "text-ink",
            )}
          >
            Peso (kg)
            {weightCritical && (
              <span className="text-[10px] font-normal">crítico p/ pediátrico</span>
            )}
          </Label>
          <div className="relative">
            <Weight
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                weightCritical ? "text-destructive" : "text-ink-faint",
              )}
            />
            <Input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ex: 18"
              type="number"
              min="0"
              step="0.1"
              className={cn(
                "h-11 bg-paper-alt/40 pl-10",
                weightCritical
                  ? "border-destructive/50 focus-visible:ring-destructive/30"
                  : "border-ink-soft",
              )}
            />
          </div>
        </div>
      </div>

      {/* Linha 3 — Toggles + Alergias */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setIsPregnant(!isPregnant)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition",
              isPregnant
                ? "border-destructive/30 bg-destructive/5"
                : "border-ink-soft bg-paper-alt/30 hover:bg-paper-alt/60",
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  isPregnant
                    ? "bg-destructive/10 text-destructive"
                    : "bg-card text-ink-faint",
                )}
              >
                <Heart className="h-3.5 w-3.5" />
              </div>
              <div className="text-sm font-medium text-ink">Gestante</div>
            </div>
            <Switch checked={isPregnant} onCheckedChange={setIsPregnant} />
          </button>

          <button
            type="button"
            onClick={() => setIsPediatric(!isPediatric)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition",
              isPediatric
                ? "border-canon-blue/30 bg-canon-blue/5"
                : "border-ink-soft bg-paper-alt/30 hover:bg-paper-alt/60",
            )}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-md",
                  isPediatric
                    ? "bg-canon-blue/10 text-canon-blue"
                    : "bg-card text-ink-faint",
                )}
              >
                <Baby className="h-3.5 w-3.5" />
              </div>
              <div className="text-sm font-medium text-ink">Pediátrico</div>
            </div>
            <Switch checked={isPediatric} onCheckedChange={setIsPediatric} />
          </button>
        </div>

        <div className="space-y-1.5">
          <Label
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              hasAllergies ? "text-warning" : "text-ink",
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            Alergias
          </Label>
          <Input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder='Ex: dipirona, penicilina — ou "nega"'
            className={cn(
              "h-11 bg-paper-alt/40",
              hasAllergies
                ? "border-warning/40 focus-visible:ring-warning/30"
                : "border-ink-soft",
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default PatientBlock;
