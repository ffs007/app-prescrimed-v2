import { Card, CardContent } from "@/components/ui/card";
import { useIndicators } from "./hooks/useIndicators";
import BetaReadinessCard from "./BetaReadinessCard";
import BetaChecklistCard from "./BetaChecklistCard";
import IndicadoresBaseMedCard from "@/modules/medications-base/IndicadoresBaseMedCard";
import ProntidaoBlocosCard from "@/modules/medications-base/blocos/ProntidaoBlocosCard";
import EscoresIndicatorsCard from "./EscoresIndicatorsCard";
import CheckoutFunnelCard from "@/modules/usage/CheckoutFunnelCard";
import { useAuth } from "@/components/providers/AuthProvider";

const Tile = ({ label, value }: { label: string; value: number | string }) => (
  <Card><CardContent className="p-4">
    <div className="text-2xl font-semibold">{value}</div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
  </CardContent></Card>
);

export default function IndicatorsPanel() {
  const { counts, loading } = useIndicators();
  const { isAdmin } = useAuth();
  if (loading) return <div className="text-sm text-muted-foreground p-4">Carregando indicadores…</div>;

  return (
    <div className="space-y-6">
      {isAdmin && <CheckoutFunnelCard />}
      <div>
        <h2 className="text-lg font-semibold mb-3">Indicadores</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Tile label="Prescrições criadas" value={counts.prescricoes} />
          <Tile label="Documentos gerados" value={counts.documentos} />
          <Tile label="Alertas totais" value={counts.alertas_total} />
          <Tile label="Alertas críticos" value={counts.alertas_criticos} />
          <Tile label="Alertas médios" value={counts.alertas_medios} />
          <Tile label="Revisões Segurança IV" value={counts.prescricoes_iv} />
          <Tile label="Links criados" value={counts.links_criados} />
          <Tile label="Links enviados" value={counts.links_enviados} />
          <Tile label="Testes aprovados" value={counts.testes_aprovados} />
          <Tile label="Testes reprovados" value={counts.testes_reprovados} />
          <Tile label="Testes pendentes" value={counts.testes_pendentes} />
        </div>
      </div>

      <EscoresIndicatorsCard />
      <IndicadoresBaseMedCard />

      <ProntidaoBlocosCard />
      <BetaReadinessCard />
      <BetaChecklistCard />
    </div>
  );
}
