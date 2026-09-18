import PageMeta from "@/components/seo/PageMeta";
import RequirePermission from "@/modules/security/components/RequirePermission";
import AihWorkbench from "@/modules/admissions/AihWorkbench";

export default function InternacoesPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <PageMeta
        title="Internações — AIH | PrescriMed"
        description="Monte o laudo de internação hospitalar (AIH) do SUS com preenchimento inteligente, alerta de campos obrigatórios e impressão em PDF."
        path="/app/internacoes"
      />
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Internações</h1>
        <p className="text-sm text-muted-foreground">
          Laudo para solicitação de internação hospitalar (AIH), com sugestões revisáveis,
          conferência de campos obrigatórios e seção de auditoria interna.
        </p>
      </header>
      <RequirePermission permission="internacao.registrar">
        <AihWorkbench />
      </RequirePermission>
    </div>
  );
}
