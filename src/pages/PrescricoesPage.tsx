/**
 * Prescrições emitidas — revisão de cada receita montada:
 * medicamentos, posologia e o quadro clínico que a originou.
 */
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, FileText, Loader2, Pill } from "lucide-react";
import { listPrescriptionRecords } from "@/modules/prescription/services/prescriptionRecords";

const cn = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(" ");

const AMBIENTE_LABEL: Record<string, string> = {
  ambulatorial: "Ambulatorial",
  urgencia: "Urgências / PS",
  emergencia: "Emergências / SV",
  hospitalar: "Hospitalar",
};

const PrescricoesPage = () => {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["prescricoes-emitidas"],
    queryFn: () => listPrescriptionRecords(100),
    staleTime: 30_000,
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data ?? [];
    if (!q) return all;
    return all.filter(
      (r) =>
        r.paciente.toLowerCase().includes(q) ||
        (r.quadro ?? "").toLowerCase().includes(q) ||
        (r.cid ?? "").toLowerCase().includes(q) ||
        r.itens.some((i) => i.nome.toLowerCase().includes(q)),
    );
  }, [data, query]);

  const totalItens = useMemo(
    () => (data ?? []).reduce((acc, r) => acc + r.itens.length, 0),
    [data],
  );

  return (
    <div className="space-y-5 p-4">
      <Helmet>
        <title>Prescrições emitidas | PrescriMed</title>
        <meta
          name="description"
          content="Revise cada receita emitida: medicamentos, posologia e quadro clínico de origem."
        />
      </Helmet>

      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Prescrições emitidas</h1>
        <p className="text-sm text-muted-foreground">
          Cada receita gerada aparece aqui com os medicamentos, a posologia e o quadro clínico usado.{" "}
          <Link to="/app/prescricao/nova" className="underline">
            Nova prescrição
          </Link>
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-2xl font-semibold text-foreground">{data?.length ?? "—"}</div>
          <div className="text-xs text-muted-foreground">Receitas registradas</div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-2xl font-semibold text-foreground">{data ? totalItens : "—"}</div>
          <div className="text-xs text-muted-foreground">Medicamentos prescritos</div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <div className="text-2xl font-semibold text-foreground">
            {data ? new Set((data ?? []).map((r) => r.quadro).filter(Boolean)).size : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Quadros diferentes</div>
        </div>
      </section>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por paciente, quadro, CID ou medicamento…"
        aria-label="Buscar prescrição"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Receitas · {rows.length}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {isError && (
            <div className="space-y-2 py-6 text-center">
              <p className="text-xs text-destructive">Não foi possível carregar as prescrições.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma receita registrada ainda. Ao emitir uma receita, ela aparece aqui para revisão.
            </p>
          )}

          {rows.map((r) => {
            const open = openId === r.id;
            return (
              <div key={r.id} className="rounded-md border border-border">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : r.id)}
                  className="flex w-full items-start gap-3 p-3 text-left"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">
                      {r.quadro ?? "Receita sem quadro definido"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.criadoEm).toLocaleString("pt-BR")} · {r.paciente}
                      {r.ambiente ? ` · ${AMBIENTE_LABEL[r.ambiente] ?? r.ambiente}` : ""}
                      {r.cid ? ` · CID ${r.cid}` : ""}
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {r.itens.length} med.
                  </Badge>
                  <ChevronDown
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      !open && "-rotate-90",
                    )}
                  />
                </button>

                {open && (
                  <div className="space-y-2 border-t border-border p-3">
                    {r.receituario && (
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Receituário: {r.receituario}
                      </div>
                    )}
                    {r.itens.length === 0 && (
                      <p className="text-xs text-muted-foreground">Nenhum medicamento registrado.</p>
                    )}
                    {r.itens.map((item, i) => (
                      <div key={i} className="flex gap-2 rounded-md border border-border p-2">
                        <Pill className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground">{item.nome}</div>
                          <div className="whitespace-pre-wrap text-xs text-muted-foreground">
                            {item.posologia || "Sem posologia registrada"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default PrescricoesPage;
