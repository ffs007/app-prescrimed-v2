/**
 * Template — Notificação de Receita B (azul). Listas B1/B2.
 *
 * Características:
 *   - A4 retrato, 1 via (retida na farmácia)
 *   - Faixa azul no topo identificando o tipo
 *   - Campo "Nº da Notificação" em branco para preenchimento manual
 *   - Limite de 1 substância por notificação
 *   - Aviso de validade restrita à UF emissora
 *   - Estrutura idêntica à Notif. A, mudando apenas a faixa e textos
 */
import { AlertTriangle } from "lucide-react";
import PatientLine from "./PatientLine";
import { todayBR, type PrescriptionTemplateProps } from "./types";

const NotificationBTemplate = ({
  meds,
  patientName,
  isPediatric,
  isPregnant,
  ageValue,
  ageUnit,
  weight,
  clinicInfo,
  signatureConfig,
  regulatoryLabel,
  validityDays,
}: PrescriptionTemplateProps) => {
  const hasClinic = clinicInfo.clinicName || clinicInfo.doctorName;

  return (
    <div className="prescription-template-notif-b">
      {/* Faixa azul identificadora */}
      <div className="h-2 -mx-10 -mt-10 mb-3 bg-receipt-blue print:-mx-[10mm] print:-mt-[10mm]" />

      {/* Cabeçalho com Nº da notificação */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 text-center border-b border-foreground/30 pb-2 print:border-gray-400">
          {hasClinic ? (
            <>
              {clinicInfo.clinicName && (
                <h2 className="font-serif font-semibold text-foreground text-base tracking-wide uppercase">
                  {clinicInfo.clinicName}
                </h2>
              )}
              {clinicInfo.doctorName && (
                <p className="text-[11px] text-foreground mt-0.5 font-medium">
                  Dr(a). {clinicInfo.doctorName}
                  {clinicInfo.crm && ` · ${clinicInfo.crm}`}
                </p>
              )}
              {clinicInfo.specialty && (
                <p className="text-[10px] text-muted-foreground">{clinicInfo.specialty}</p>
              )}
              <div className="mt-1 text-[10px] text-muted-foreground leading-tight">
                {clinicInfo.address && <p>{clinicInfo.address}</p>}
                {clinicInfo.phone && <p>Tel.: {clinicInfo.phone}</p>}
              </div>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">
              Configure os dados da unidade em Configurações
            </p>
          )}
        </div>

        {/* Bloco do número da notificação */}
        <div className="border-2 border-foreground/60 rounded-md px-3 py-2 min-w-[140px] print:border-gray-800">
          <p className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground text-center">
            Nº Notificação
          </p>
          <div className="h-6 border-b-2 border-foreground/70 mt-1 print:border-gray-800" />
          <p className="text-[8px] text-center text-muted-foreground mt-1 italic">
            Preencher manualmente
          </p>
        </div>
      </div>

      {/* Título regulatório central */}
      <div className="text-center mb-3">
        <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
          {regulatoryLabel}
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          Talonário oficial azul numerado · 1 via retida na farmácia · Validade {validityDays} dias
        </p>
      </div>

      <PatientLine
        patientName={patientName}
        isPediatric={isPediatric}
        isPregnant={isPregnant}
        ageValue={ageValue}
        ageUnit={ageUnit}
        weight={weight}
      />

      {/* Prescrição */}
      <div className="space-y-3 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Prescrição
        </p>
        {meds.map((med, i) => (
          <div key={med.id} className="flex gap-3">
            <span className="text-[13px] font-bold text-foreground shrink-0">{i + 1})</span>
            <div className="text-[13px] text-foreground whitespace-pre-line leading-relaxed flex-1">
              {med.text}
            </div>
          </div>
        ))}
      </div>

      {/* Assinatura */}
      <div className="text-center mt-10 pt-2">
        {signatureConfig.signatureImageUrl && (
          <img
            src={signatureConfig.signatureImageUrl}
            alt="Assinatura"
            className="max-h-16 mx-auto mb-1 object-contain"
          />
        )}
        <div className="w-60 mx-auto">
          <div className="border-t-2 border-foreground/70 pt-1 print:border-gray-800">
            <p className="text-[11px] text-foreground whitespace-pre-line font-medium leading-snug">
              {signatureConfig.signatureText || "Assinatura e Carimbo do Médico"}
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Data: {todayBR()}</p>
          </div>
        </div>
      </div>

      {/* Identificação do comprador */}
      <div className="border-t border-foreground/40 mt-5 pt-2 print:border-gray-700">
        <p className="text-center font-bold text-[10px] uppercase tracking-wide mb-1.5">
          Identificação do comprador
        </p>
        <div className="space-y-1.5 text-[10px]">
          <p className="border-b border-foreground/40 pb-0.5 print:border-gray-600">Nome:</p>
          <div className="flex gap-4">
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Documento:</p>
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Órgão emissor:</p>
          </div>
          <p className="border-b border-foreground/40 pb-0.5 print:border-gray-600">Endereço:</p>
          <div className="flex gap-4">
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Cidade / UF:</p>
            <p className="flex-1 border-b border-foreground/40 pb-0.5 print:border-gray-600">Telefone:</p>
          </div>
        </div>
      </div>

      {/* Identificação do fornecedor */}
      <div className="border-t border-foreground/40 mt-2.5 pt-2 print:border-gray-700">
        <p className="text-center font-bold text-[10px] uppercase tracking-wide">
          Identificação do fornecedor
        </p>
        <div className="flex justify-between mt-4 text-[9px]">
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

      {/* Aviso */}
      <div className="mt-3 p-2 border border-receipt-blue/50 rounded bg-receipt-blue-soft print:bg-receipt-blue-soft">
        <p className="text-[9px] text-foreground flex items-start gap-1.5 leading-snug">
          <AlertTriangle className="h-3 w-3 text-receipt-blue shrink-0 mt-0.5" />
          <span>
            <strong>Atenção:</strong> Este documento serve como rascunho/referência. A dispensação
            só é válida quando transcrita no talonário oficial azul numerado, fornecido pela
            vigilância sanitária local. Validade restrita à UF de emissão.
          </span>
        </p>
      </div>
    </div>
  );
};

export default NotificationBTemplate;
