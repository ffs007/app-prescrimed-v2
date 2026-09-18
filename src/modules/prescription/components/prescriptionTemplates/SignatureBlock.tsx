/**
 * Bloco de assinatura + carimbo digital compartilhado.
 * Renderiza a imagem da assinatura (upload) acima da linha e, abaixo,
 * o carimbo gerado automaticamente (nome · função · CRM).
 */
import { buildStampLines, type SignatureConfig, type ClinicInfo } from "../../types/prescription";

interface Props {
  signatureConfig: SignatureConfig;
  /** Dados da unidade usados como fallback do carimbo. */
  clinicInfo?: ClinicInfo;
  /** Mais compacto quando houver muitos campos legais abaixo. */
  compact?: boolean;
}

const SignatureBlock = ({ signatureConfig, clinicInfo, compact = false }: Props) => {
  const lines = buildStampLines(signatureConfig, {
    doctorName: clinicInfo?.doctorName,
    specialty: clinicInfo?.specialty,
    crm: clinicInfo?.crm,
  });

  return (
    <div className={`text-center ${compact ? "mt-8 pt-2" : "mt-14 pt-3"}`}>
      {signatureConfig.signatureImageUrl && (
        <img
          src={signatureConfig.signatureImageUrl}
          alt="Assinatura"
          className={`${compact ? "max-h-14" : "max-h-20"} mx-auto mb-1.5 object-contain`}
        />
      )}
      <div className="w-60 mx-auto">
        <div className="border-t-2 border-foreground/70 pt-1.5 print:border-t-2 print:border-gray-800">
          {lines.length > 0 ? (
            lines.map((line, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "text-[12.5px] font-semibold text-foreground leading-snug"
                    : "text-[11px] text-foreground/80 leading-snug"
                }
              >
                {line}
              </p>
            ))
          ) : (
            <p className="text-[12px] text-muted-foreground">Assinatura e Carimbo</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignatureBlock;
