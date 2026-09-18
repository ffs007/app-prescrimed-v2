import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBaseMedIndicators, type BaseMedIndicators } from "./hooks/useBaseMedIndicators";

const cards: Array<[keyof BaseMedIndicators, string]> = [
  ["total", "Total"],
  ["revisados", "Revisados"],
  ["aguardando", "Aguardando revisão"],
  ["essenciais", "Essenciais"],
  ["essenciaisRevisados", "Essenciais revisados"],
  ["apresentacoes", "Apresentações"],
  ["comContexto", "Vínculos CID/queixa"],
  ["semFonte", "Sem fonte"],
  ["inativos", "Inativos"],
  ["antimicrobianos", "Antimicrobianos"],
  ["controlados", "Controlados"],
  ["injetaveisVinculadosIv", "Injetáveis vinc. IV"],
];

export default function IndicadoresBaseMedCard() {
  const { data, loading } = useBaseMedIndicators();
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Base Medicamentosa</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map(([k, lbl]) => (
          <div key={String(k)} className="border rounded p-3">
            <p className="text-xs text-muted-foreground">{lbl}</p>
            <p className="text-2xl font-semibold">{loading || !data ? "—" : data[k]}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
