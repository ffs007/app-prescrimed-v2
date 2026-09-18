import { useSearchParams } from "react-router-dom";
import PageMeta from "@/components/seo/PageMeta";
import RequirePermission from "@/modules/security/components/RequirePermission";
import NotificationWorkbench from "@/modules/notifications/NotificationWorkbench";

export default function NotificacoesPage() {
  const [params] = useSearchParams();
  const agravo = params.get("agravo") ?? undefined;

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <PageMeta
        title="Notificações Compulsórias | PrescriMed"
        description="Preencha fichas de notificação compulsória por agravo, com prazos legais, campos da sua instituição, impressão em PDF e controle de envio à vigilância."
        path="/app/notificacoes"
      />
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Notificações Compulsórias</h1>
        <p className="text-sm text-muted-foreground">
          Fichas por agravo conforme a lista nacional, com alerta de prazo legal, preenchimento
          assistido, campos internos da instituição e histórico com situação de envio.
        </p>
      </header>
      <RequirePermission permission="notificacao.emitir">
        <NotificationWorkbench initialAgravoId={agravo} />
      </RequirePermission>
    </div>
  );
}
