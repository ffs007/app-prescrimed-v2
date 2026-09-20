import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Calculator, RotateCcw, Save, Copy, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AIS_LABEL, ESTRATO_LABEL, ISS_REGIOES, calcularISS, calcularRTS, calcularTRISS,
  type EntradaISS, type Estrato, type MecanismoTrauma, type ResultadoEscore,
} from "@/lib/traumaScores";
import { useResultadosTrauma, buildShareUrl } from "@/modules/trauma-scores/useResultadosTrauma";
import EscoresCatalogoTab from "@/modules/scores/EscoresCatalogoTab";

const estratoVariant: Record<Estrato, "secondary" | "outline" | "destructive"> = {
  leve: "secondary",
  moderado: "outline",
  grave: "destructive",
  critico: "destructive",
};

function ResultadoCard({
  titulo, resultado, onSave,
}: { titulo: string; resultado: ResultadoEscore; onSave: () => void }) {
  return (
    <Card className="bg-muted/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-3">
          <span>{titulo}</span>
          <Badge variant={estratoVariant[resultado.estrato]}>{ESTRATO_LABEL[resultado.estrato]}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-semibold tabular-nums">{resultado.rotulo}</p>
        <p className="text-sm text-muted-foreground">{resultado.descricao}</p>
        {resultado.detalhes.length > 0 && (
          <ul className="text-sm space-y-1 border-t pt-3">
            {resultado.detalhes.map((d) => (
              <li key={d} className="text-muted-foreground">{d}</li>
            ))}
          </ul>
        )}
        <Button size="sm" variant="outline" onClick={onSave}>
          <Save className="h-4 w-4 mr-2" /> Salvar e gerar link
        </Button>
      </CardContent>
    </Card>
  );
}

const RTS_INICIAL = { gcs: 15, pas: 120, fr: 16 };
const ISS_INICIAL = ISS_REGIOES.reduce((acc, r) => ({ ...acc, [r.key]: 0 }), {} as EntradaISS);

export default function EscoresTraumaPage() {
  const [rts, setRts] = useState(RTS_INICIAL);
  const [iss, setIss] = useState<EntradaISS>(ISS_INICIAL);
  const [idade, setIdade] = useState(40);
  const [mecanismo, setMecanismo] = useState<MecanismoTrauma>("contuso");

  const { resultados, salvar, remover } = useResultadosTrauma();

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const resultadoRts = useMemo(() => calcularRTS(rts), [rts]);
  const resultadoIss = useMemo(() => calcularISS(iss), [iss]);
  const resultadoTriss = useMemo(
    () => calcularTRISS({ rts: resultadoRts.pontuacao, iss: resultadoIss.pontuacao, idadeAnos: idade, mecanismo }),
    [resultadoRts.pontuacao, resultadoIss.pontuacao, idade, mecanismo],
  );

  const handleSave = async (escore: string, resultado: ResultadoEscore, entrada: Record<string, unknown>) => {
    const salvo = await salvar(escore, resultado, entrada);
    if (!salvo) {
      toast({ title: "Não foi possível salvar", description: "Faça login para salvar resultados.", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.writeText(buildShareUrl(salvo.share_token));
      toast({ title: "Resultado salvo", description: "Link compartilhável copiado." });
    } catch (error) {
      console.error("[EscoresTraumaPage] falha ao copiar o link compartilhável", error);
      toast({ title: "Resultado salvo", description: "Não foi possível copiar o link automaticamente; copie-o pelo histórico.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Helmet>
        <title>Calculadora RTS, ISS e TRISS | Escores de Trauma</title>
        <meta
          name="description"
          content="Calcule RTS, ISS e TRISS com estrato de gravidade, salve os resultados com data e compartilhe por link seguro."
        />
        <link rel="canonical" href="/app/escores-trauma" />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" aria-hidden />
          Escores de Trauma
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          RTS, ISS e TRISS com estratificação conforme os pontos de corte da base clínica.
        </p>
      </header>

      <Tabs defaultValue="rts">
        <TabsList>
          <TabsTrigger value="rts">RTS</TabsTrigger>
          <TabsTrigger value="iss">ISS</TabsTrigger>
          <TabsTrigger value="triss">TRISS</TabsTrigger>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="salvos">Salvos</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4">
          <EscoresCatalogoTab />
        </TabsContent>


        <TabsContent value="rts" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revised Trauma Score</CardTitle>
              <CardDescription>Parâmetros fisiológicos na admissão (0–7,84).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gcs">Glasgow (3–15)</Label>
                <Input
                  id="gcs" type="number" min={3} max={15} value={rts.gcs}
                  onChange={(e) => setRts({ ...rts, gcs: clamp(Number(e.target.value) || 0, 3, 15) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pas">PA sistólica (mmHg)</Label>
                <Input
                  id="pas" type="number" min={0} max={300} value={rts.pas}
                  onChange={(e) => setRts({ ...rts, pas: clamp(Number(e.target.value) || 0, 0, 300) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fr">Frequência respiratória (irpm)</Label>
                <Input
                  id="fr" type="number" min={0} max={80} value={rts.fr}
                  onChange={(e) => setRts({ ...rts, fr: clamp(Number(e.target.value) || 0, 0, 80) })}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setRts(RTS_INICIAL)}>
                <RotateCcw className="h-4 w-4 mr-2" /> Limpar
              </Button>
            </CardContent>
          </Card>
          <ResultadoCard
            titulo="Resultado RTS"
            resultado={resultadoRts}
            onSave={() => handleSave("RTS", resultadoRts, rts)}
          />
        </TabsContent>

        <TabsContent value="iss" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Injury Severity Score</CardTitle>
              <CardDescription>AIS por região; soma dos quadrados das 3 maiores (1–75).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ISS_REGIOES.map((regiao) => (
                <div key={regiao.key} className="space-y-2">
                  <Label htmlFor={`ais-${regiao.key}`}>{regiao.label}</Label>
                  <Select
                    value={String(iss[regiao.key])}
                    onValueChange={(v) => setIss({ ...iss, [regiao.key]: Number(v) })}
                  >
                    <SelectTrigger id={`ais-${regiao.key}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>{AIS_LABEL[n]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setIss(ISS_INICIAL)}>
                <RotateCcw className="h-4 w-4 mr-2" /> Limpar
              </Button>
            </CardContent>
          </Card>
          <ResultadoCard
            titulo="Resultado ISS"
            resultado={resultadoIss}
            onSave={() => handleSave("ISS", resultadoIss, iss)}
          />
        </TabsContent>

        <TabsContent value="triss" className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">TRISS</CardTitle>
              <CardDescription>
                Probabilidade de sobrevivência a partir do RTS e do ISS já calculados nas abas anteriores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3 text-sm space-y-1">
                <p>RTS atual: <span className="font-medium tabular-nums">{resultadoRts.pontuacao.toFixed(2)}</span></p>
                <p>ISS atual: <span className="font-medium tabular-nums">{resultadoIss.pontuacao}</span></p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idade">Idade (anos)</Label>
                <Input
                  id="idade" type="number" min={0} max={120} value={idade}
                  onChange={(e) => setIdade(clamp(Number(e.target.value) || 0, 0, 120))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mecanismo">Mecanismo do trauma</Label>
                <Select value={mecanismo} onValueChange={(v) => setMecanismo(v as MecanismoTrauma)}>
                  <SelectTrigger id="mecanismo"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="contuso">Contuso</SelectItem>
                    <SelectItem value="penetrante">Penetrante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <ResultadoCard
            titulo="Resultado TRISS"
            resultado={resultadoTriss}
            onSave={() => handleSave("TRISS", resultadoTriss, {
              rts: resultadoRts.pontuacao, iss: resultadoIss.pontuacao, idade, mecanismo,
            })}
          />
        </TabsContent>

        <TabsContent value="salvos" className="mt-4 space-y-2">
          {resultados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum resultado salvo ainda.</p>
          ) : (
            resultados.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.escore}</Badge>
                      <span className="font-medium tabular-nums">{r.rotulo}</span>
                      <span className="text-muted-foreground">{ESTRATO_LABEL[r.estrato]}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground truncate">{buildShareUrl(r.share_token)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon" variant="ghost" aria-label="Copiar link"
                      onClick={async () => {
                        await navigator.clipboard.writeText(buildShareUrl(r.share_token));
                        toast({ title: "Link copiado" });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remover(r.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
