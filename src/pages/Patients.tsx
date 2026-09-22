import ComingSoonModule from "@/modules/prescription/components/ComingSoonModule";

/**
 * Rota /app/pacientes — placeholder de "Prontuário Longitudinal / Busca de
 * pacientes". Hoje a base NÃO tem tabela pronta de busca longitudinal, a
 * página era um stub estático sem qualquer ação. Retornamos o painel oficial
 * de "Em breve" do módulo ComingSoonModule para alinhar com o mesmo selo que
 * o item de menu sidebar mostra.
 */
export default function Patients() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <ComingSoonModule action="prontuario" />
    </div>
  );
}
