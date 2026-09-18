import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface GlobalRow {
  total_pediatricos: number;
  total_geriatricos: number;
  total_obstetricos: number;
  total_dor: number;
  total_calculos: number;
  total_calculos_validos: number;
  total_calculos_invalidos: number;
  total_entradas_incompletas: number;
  total_overrides: number;
  total_divergencias: number;
}

interface IndicadorRow {
  codigo_indicador: string;
  nome: string;
  descricao: string | null;
  meta_pct: string | null;
  periodicidade: string | null;
}

interface EscoreAudit {
  nome_escore: string;
  populacao_validada: boolean;
  entradas_completas: boolean;
  red_flag_override: boolean;
  divergencia: boolean;
}

const Tile = ({ label, value, tone }: { label: string; value: number | string; tone?: "warn" | "danger" }) => (
  <div className="rounded-lg border p-3">
    <div
      className={
        "text-2xl font-semibold " +
        (tone === "danger" ? "text-destructive" : tone === "warn" ? "text-amber-600 dark:text-amber-400" : "")
      }
    >
      {value}
    </div>
    <div className="text-xs text-muted-foreground mt-1">{label}</div>
  </div>
);

const pct = (num: number, den: number) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

export default function EscoresIndicatorsCard() {
  const [global, setGlobal] = useState<GlobalRow | null>(null);
  const [indicadores, setIndicadores] = useState<IndicadorRow[]>([]);
  const [audit, setAudit] = useState<EscoreAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [g, i, a] = await Promise.all([
          supabase.from("vw_dashboard_escores_global" as never).select("*").maybeSingle(),
          supabase
            .from("indicadores_qualidade_ps")
            .select("codigo_indicador, nome, descricao, meta_pct, periodicidade")
            .like("codigo_indicador", "IQV2:%")
            .eq("ativo", true),
          supabase
            .from("audit_escores_clinicos")
            .select("nome_escore, populacao_validada, entradas_completas, red_flag_override, divergencia")
            .limit(2000),
        ]);
        if (!active) return;
        const firstError = [g, i, a].find((r) => r.error)?.error;
        if (firstError) {
          console.error("[EscoresIndicatorsCard] falha ao carregar indicadores:", firstError);
          toast.error("Não foi possível carregar os indicadores de escores.");
          setFailed(true);
          return;
        }
        setGlobal((g.data ?? null) as unknown as GlobalRow | null);
        const list = ((i.data ?? []) as IndicadorRow[]).sort(
          (x, y) =>
            Number(x.codigo_indicador.split(":")[1] ?? 0) - Number(y.codigo_indicador.split(":")[1] ?? 0),
        );
        setIndicadores(list);
        setAudit((a.data ?? []) as unknown as EscoreAudit[]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground p-4">Carregando indicadores de escores…</div>;
  if (failed) return <div className="text-sm text-muted-foreground p-4">Não foi possível carregar os indicadores de escores.</div>;

  const total = global?.total_calculos ?? 0;
  const validos = global?.total_calculos_validos ?? 0;
  const taxaValida = pct(validos, total);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Escores clínicos — visão global</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Tile label="Cálculos registrados" value={total} />
            <Tile label="População validada" value={validos} />
            <Tile
              label="População inválida"
              value={global?.total_calculos_invalidos ?? 0}
              tone={(global?.total_calculos_invalidos ?? 0) > 0 ? "warn" : undefined}
            />
            <Tile
              label="Entradas incompletas"
              value={global?.total_entradas_incompletas ?? 0}
              tone={(global?.total_entradas_incompletas ?? 0) > 0 ? "warn" : undefined}
            />
            <Tile
              label="Overrides red flag"
              value={global?.total_overrides ?? 0}
              tone={(global?.total_overrides ?? 0) > 0 ? "warn" : undefined}
            />
            <Tile
              label="Divergências de conduta"
              value={global?.total_divergencias ?? 0}
              tone={(global?.total_divergencias ?? 0) > 0 ? "danger" : undefined}
            />
            <Tile label="Taxa população válida" value={taxaValida === null ? "—" : `${taxaValida}%`} />
            <Tile label="Escores obstétricos usados" value={global?.total_obstetricos ?? 0} />
            <Tile label="Escores de dor usados" value={global?.total_dor ?? 0} />
            <Tile label="Escores pediátricos usados" value={global?.total_pediatricos ?? 0} />
          </div>
          {total === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum cálculo de escore registrado ainda — os valores atualizam automaticamente conforme as funções de
              cálculo forem utilizadas.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Indicadores de qualidade IQV2:1–12</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {indicadores.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum indicador IQV2 ativo encontrado.</p>
          )}
          {indicadores.map((ind) => {
            const escore = ind.nome.split(" ")[0];
            const rows = audit.filter((r) => r.nome_escore.toLowerCase() === escore.toLowerCase());
            const den = rows.length;
            const num = rows.filter((r) => r.populacao_validada && r.entradas_completas).length;
            const valor = pct(num, den);
            const meta = Number(ind.meta_pct ?? 0);
            const atinge = valor !== null && valor >= meta;
            return (
              <div
                key={ind.codigo_indicador}
                className="flex items-start justify-between gap-4 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{ind.codigo_indicador}</Badge>
                    <span className="text-sm font-medium">{ind.nome}</span>
                  </div>
                  {ind.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ind.descricao}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-semibold">{valor === null ? "—" : `${valor}%`}</div>
                  <div className="text-xs text-muted-foreground">
                    meta {ind.meta_pct ?? "—"}% · n={den}
                  </div>
                  {valor !== null && (
                    <Badge variant={atinge ? "secondary" : "destructive"} className="mt-1">
                      {atinge ? "Na meta" : "Abaixo"}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
