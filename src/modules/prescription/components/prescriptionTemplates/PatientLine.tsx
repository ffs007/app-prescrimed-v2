/**
 * Linha de identificação do paciente, compartilhada entre todos os templates.
 * Mantida estável (sem cores hardcoded) para boa legibilidade na impressão.
 */
import { Heart } from "lucide-react";
import { todayBR } from "./types";

interface Props {
  patientName: string;
  isPediatric: boolean;
  isPregnant: boolean;
  ageValue: string;
  ageUnit: string;
  weight: string;
}

const PatientLine = ({ patientName, isPediatric, isPregnant, ageValue, ageUnit, weight }: Props) => (
  <div className="border border-foreground/20 rounded-md px-4 py-2.5 mb-5 print:border-gray-400 print:rounded">
    <div className="grid grid-cols-2 gap-y-1 text-[12px]">
      <p className="text-foreground">
        <span className="font-semibold">Paciente:</span> {patientName || "________________________"}
      </p>
      <p className="text-foreground text-right">
        <span className="font-semibold">Data:</span> {todayBR()}
      </p>
      {isPediatric && (ageValue || weight) && (
        <p className="text-foreground col-span-2">
          <span className="font-semibold">Idade:</span> {ageValue} {ageUnit}
          {weight && (
            <>
              {" "}
              · <span className="font-semibold">Peso:</span> {weight} kg
            </>
          )}
        </p>
      )}
      {isPregnant && (
        <p className="text-destructive font-semibold flex items-center gap-1 col-span-2">
          <Heart className="h-3 w-3" /> Gestante
        </p>
      )}
    </div>
  </div>
);

export default PatientLine;
