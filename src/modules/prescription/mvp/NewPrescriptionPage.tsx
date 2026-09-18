// MVP Consolidação — Reaproveita o Dashboard atual como tela de Nova Prescrição.
// O Dashboard já contém todos os módulos clínicos (paciente, contexto, composição,
// segurança, revisão, geração de documentos). Esta página é apenas o ponto de
// entrada da rota /app/prescricao/nova dentro do app shell do MVP.
import Dashboard from "@/pages/Dashboard";

export default function NewPrescriptionPage() {
  return <Dashboard />;
}
