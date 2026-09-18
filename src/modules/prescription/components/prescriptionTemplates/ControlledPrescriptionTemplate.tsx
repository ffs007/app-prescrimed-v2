/**
 * Template — Receita de Controle Especial (C1/C2/C5) e Antimicrobianos.
 *
 * Modelo branco em 2 vias (Farmácia + Paciente), referência SNCR vigente.
 *
 * Características:
 *   - A4 paisagem, 2 vias lado a lado separadas por linha pontilhada
 *   - Cada via contém: identificação do emitente · paciente · prescrição
 *     · identificação do comprador · identificação do fornecedor (farmácia)
 *   - Faixa azul fina identificadora no topo de cada via (híbrido)
 *   - Reten\u00e7\u00e3o da 1ª via na farmácia
 */
import { buildStampLines } from "../../types/prescription";
import { todayBR, type PrescriptionTemplateProps } from "./types";

const Via = ({
  via,
  meds,
  patientName,
  clinicInfo,
  regulatoryLabel,
  signatureConfig,
  validityDays,
}: {
  via: string;
  meds: PrescriptionTemplateProps["meds"];
  patientName: string;
  clinicInfo: PrescriptionTemplateProps["clinicInfo"];
  regulatoryLabel: string;
  signatureConfig: PrescriptionTemplateProps["signatureConfig"];
  validityDays: number;
}) => {
  const stampLines = buildStampLines(signatureConfig, {
    doctorName: clinicInfo.doctorName,
    specialty: clinicInfo.specialty,
    crm: clinicInfo.crm,
  });
  return (
  <div className="flex-1 flex flex-col px-3 py-2 text-[10px] text-foreground">
    {/* Faixa identificadora azul fina */}
    <div className="h-1 -mx-3 -mt-2 mb-1.5 bg-receipt-controlled" />

    {/* Cabeçalho */}
    <div className="text-center mb-1.5">
      {clinicInfo.clinicName && (
        <p className="font-bold text-foreground text-[12px] leading-tight">
          {clinicInfo.clinicName}
        </p>
      )}
      <p className="font-semibold text-foreground text-[10px] uppercase tracking-wider mt-0.5">
        {regulatoryLabel}
      </p>
      <p className="text-foreground text-[9px] mt-0.5 italic">{via}</p>
    </div>

    {/* Identificação do emitente */}
    <div className="border-t border-foreground/60 pt-1 print:border-gray-800">
      <div className="flex justify-between items-baseline">
        <span className="font-bold text-[9px] uppercase tracking-wide">Identificação do emitente</span>
        <span className="text-[9px]">Data: {todayBR()}</span>
      </div>
      <p className="leading-snug mt-0.5 text-[9px]">
        {clinicInfo.doctorName && (
          <>
            Dr(a). {clinicInfo.doctorName}
            {clinicInfo.crm && ` · ${clinicInfo.crm}`}
            {clinicInfo.specialty && ` · ${clinicInfo.specialty}`}
            <br />
          </>
        )}
        {clinicInfo.address && <>{clinicInfo.address}</>}
        {clinicInfo.phone && <> · Tel.: {clinicInfo.phone}</>}
      </p>
    </div>

    {/* Paciente */}
    <div className="mt-1.5 text-[10px]">
      <span className="font-semibold">Paciente:</span> {patientName || "________________________"}
    </div>

    {/* Prescrição */}
    <div className="mt-1.5 flex-1">
      <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
        Prescrição
      </p>
      <div className="space-y-1.5">
        {meds.map((med, i) => (
          <div key={med.id} className="leading-snug text-[10px]">
            <span className="font-bold">{i + 1})</span> {med.text}
          </div>
        ))}
      </div>
    </div>

    {/* Assinatura + carimbo digital compacto */}
    <div className="text-center mt-3">
      {signatureConfig.signatureImageUrl && (
        <img
          src={signatureConfig.signatureImageUrl}
          alt="Assinatura"
          className="max-h-10 mx-auto mb-1 object-contain"
        />
      )}
      <div className="w-44 mx-auto">
        <div className="border-t border-foreground/60 pt-0.5 print:border-gray-800">
          {stampLines.length > 0 ? (
            stampLines.map((line, i) => (
              <p
                key={i}
                className={i === 0 ? "text-[9px] font-semibold text-foreground leading-tight" : "text-[8.5px] text-foreground/80 leading-tight"}
              >
                {line}
              </p>
            ))
          ) : (
            <p className="text-[9px] text-foreground leading-tight">Assinatura e Carimbo</p>
          )}
        </div>
      </div>
    </div>

    {/* Identificação do comprador */}
    <div className="border-t border-foreground/60 mt-2 pt-1 print:border-gray-800">
      <p className="text-center font-bold text-[9px] uppercase tracking-wide mb-1">
        Identificação do comprador
      </p>
      <div className="space-y-1 text-[9px]">
        <p className="border-b border-foreground/40 pb-0.5 print:border-gray-600">Nome:</p>
        <div className="flex gap-3">
          <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Documento:</p>
          <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Órgão emissor:</p>
        </div>
        <p className="border-b border-foreground/40 pb-0.5 print:border-gray-600">Endereço:</p>
        <div className="flex gap-3">
          <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Cidade / UF:</p>
          <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Telefone:</p>
        </div>
      </div>
    </div>

    {/* Identificação do fornecedor */}
    <div className="border-t border-foreground/60 mt-1.5 pt-1 print:border-gray-800">
      <p className="text-center font-bold text-[9px] uppercase tracking-wide">
        Identificação do fornecedor
      </p>
      <div className="flex justify-between mt-3 text-[8px]">
        <div className="text-center flex-1">
          <p>_________________________</p>
          <p>Assinatura do farmacêutico</p>
        </div>
        <div className="text-center flex-1">
          <p>____ / ____ / ____</p>
          <p>Data de fornecimento</p>
        </div>
      </div>
    </div>

    {/* Validade */}
    <p className="text-[8px] text-center text-muted-foreground mt-1.5">
      Validade: {validityDays} dias a partir da emissão.
    </p>
    </div>
  );
};

const ControlledPrescriptionTemplate = (props: PrescriptionTemplateProps) => (
  <div className="prescription-template-controlled flex print:gap-0">
    <Via {...props} via="1ª via — Farmácia (retida)" />
    <div className="w-px bg-foreground/50 print:bg-gray-800 shrink-0 mx-1" />
    <Via {...props} via="2ª via — Paciente" />
  </div>
);

export default ControlledPrescriptionTemplate;
