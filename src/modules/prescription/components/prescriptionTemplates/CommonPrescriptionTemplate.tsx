/**
 * Template — Receita Comum / Simples (modelo PRÓPRIO PrescriMed+ Premium).
 *
 * Identidade visual:
 *   - A4 retrato, fundo branco
 *   - Faixa azul-médico (canon-blue) fina e discreta no topo
 *   - Cabeçalho serif (Newsreader) com hierarquia forte
 *   - Selo "Receita Médica" centralizado, tracking elegante
 *   - Lista de medicamentos com hairlines, numeração serif destacada
 *   - Bloco opcional de orientações em coluna lateral discreta
 *   - Rodapé com assinatura elegante + validade discreta
 *
 * Pensado para 3 leitores: médico (credibilidade), paciente (clareza),
 * farmácia (escaneabilidade rápida de nome + posologia).
 */
import PatientLine from "./PatientLine";
import SignatureBlock from "./SignatureBlock";
import type { PrescriptionTemplateProps } from "./types";

const CommonPrescriptionTemplate = ({
  meds,
  patientName,
  isPediatric,
  isPregnant,
  ageValue,
  ageUnit,
  weight,
  clinicInfo,
  signatureConfig,
  validityDays,
  returnInstructions,
}: PrescriptionTemplateProps) => {
  const hasClinic = clinicInfo.clinicName || clinicInfo.doctorName;

  /**
   * Heurística de parsing: a 1ª linha é o nome/apresentação do medicamento
   * (destaque), as demais linhas são posologia/observações (corpo).
   * Mantém compatibilidade total com o formato atual de `med.text`.
   */
  const splitMed = (text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const head = lines[0] ?? "";
    const body = lines.slice(1).join("\n");
    return { head, body };
  };

  return (
    <div className="prescription-template-comum bg-white">
      {/* Faixa azul-médico discreta no topo */}
      <div className="h-[6px] -mx-10 -mt-10 mb-7 bg-canon-blue print:-mx-[10mm] print:-mt-[10mm]" />

      {/* ===================== CABEÇALHO ===================== */}
      <header className="mb-7">
        {hasClinic ? (
          <div className="flex items-end justify-between gap-6 pb-4 border-b border-foreground/15 print:border-gray-300">
            <div className="min-w-0">
              {clinicInfo.clinicName && (
                <h1 className="font-serif font-medium text-foreground text-[19px] leading-tight tracking-tight">
                  {clinicInfo.clinicName}
                </h1>
              )}
              {clinicInfo.doctorName && (
                <p className="text-[12.5px] text-foreground mt-1.5 font-medium">
                  {clinicInfo.doctorName}
                  {clinicInfo.crm && (
                    <span className="text-muted-foreground font-normal"> · {clinicInfo.crm}</span>
                  )}
                </p>
              )}
              {clinicInfo.specialty && (
                <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                  {clinicInfo.specialty}
                </p>
              )}
            </div>
            <div className="text-right text-[10.5px] text-muted-foreground leading-relaxed shrink-0 max-w-[45%]">
              {clinicInfo.address && <p>{clinicInfo.address}</p>}
              {clinicInfo.phone && <p>{clinicInfo.phone}</p>}
              {clinicInfo.email && <p>{clinicInfo.email}</p>}
            </div>
          </div>
        ) : (
          <div className="text-center pb-3 border-b border-foreground/15 print:border-gray-300">
            <p className="text-[11px] text-muted-foreground italic">
              Configure os dados da unidade em Configurações
            </p>
          </div>
        )}

        {/* Selo "Receita Médica" centralizado, serif elegante */}
        <div className="mt-6 text-center">
          <p className="font-serif text-[13px] text-foreground tracking-[0.42em] uppercase">
            Receita Médica
          </p>
          <div className="mx-auto mt-2 h-px w-12 bg-canon-blue/60" />
        </div>
      </header>

      {/* ===================== PACIENTE ===================== */}
      <PatientLine
        patientName={patientName}
        isPediatric={isPediatric}
        isPregnant={isPregnant}
        ageValue={ageValue}
        ageUnit={ageUnit}
        weight={weight}
      />

      {/* ===================== PRESCRIÇÃO ===================== */}
      <section className="mt-2">
        <ol className="divide-y divide-foreground/10 print:divide-gray-300">
          {meds.map((med, i) => {
            const { head, body } = splitMed(med.text);
            return (
              <li key={med.id} className="py-4 first:pt-2 flex gap-4">
                <span className="font-serif text-[15px] font-medium text-canon-blue shrink-0 leading-tight w-6 text-right tabular-nums">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  {/* Nome + apresentação — destaque máximo */}
                  <p className="text-[14px] font-semibold text-foreground leading-snug">
                    {head}
                  </p>
                  {/* Posologia / instruções */}
                  {body && (
                    <p className="mt-1 text-[13px] text-foreground/85 whitespace-pre-line leading-[1.55]">
                      {body}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ===================== ASSINATURA ===================== */}
      <SignatureBlock signatureConfig={signatureConfig} clinicInfo={clinicInfo} />

      {/* ===================== ORIENTAÇÕES / SINAIS DE ALARME ===================== */}
      {(returnInstructions?.length ?? 0) > 0 && (
        <section className="mt-8 rounded border border-foreground/15 p-3 print:border-gray-300">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
            Orientações e sinais de alarme
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {returnInstructions!.map((line, i) => (
              <li key={i} className="text-[11px] leading-snug text-foreground/85">• {line}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ===================== RODAPÉ ===================== */}
      <footer className="mt-10 pt-3 border-t border-foreground/10 flex items-center justify-between text-[10px] text-muted-foreground print:border-gray-300">
        <p className="tracking-wide">
          Validade: {validityDays} dias a partir da emissão
        </p>
        <p className="font-serif italic tracking-wide">PrescriMed+</p>
      </footer>
    </div>
  );
};

export default CommonPrescriptionTemplate;
