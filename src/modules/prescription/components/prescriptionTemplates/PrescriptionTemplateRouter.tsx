/**
 * Seletor central de template de impressão por família regulatória.
 *
 * Mantém o PrintArea limpo: só passa a família ativa e os dados, sem
 * conhecer a estrutura interna de cada modelo.
 */
import type { ReceiptFamily } from "../../services/regulatoryTaxonomy";
import CommonPrescriptionTemplate from "./CommonPrescriptionTemplate";
import ControlledPrescriptionTemplate from "./ControlledPrescriptionTemplate";
import NotificationATemplate from "./NotificationATemplate";
import NotificationBTemplate from "./NotificationBTemplate";
import type { PrescriptionTemplateProps } from "./types";

interface Props extends PrescriptionTemplateProps {
  family: ReceiptFamily;
}

/** True quando o template usa A4 paisagem (2 vias lado a lado). */
export const isLandscapeFamily = (family: ReceiptFamily): boolean =>
  family === "controle-especial" || family === "antimicrobiano";

const PrescriptionTemplateRouter = ({ family, ...props }: Props) => {
  switch (family) {
    case "controle-especial":
    case "antimicrobiano":
    case "notificacao-especial":
      return <ControlledPrescriptionTemplate {...props} />;
    case "notificacao-A":
      return <NotificationATemplate {...props} />;
    case "notificacao-B":
      return <NotificationBTemplate {...props} />;
    case "comum":
    default:
      return <CommonPrescriptionTemplate {...props} />;
  }
};

export default PrescriptionTemplateRouter;
