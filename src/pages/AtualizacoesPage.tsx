// Painel de Atualizações Clínicas: pendentes para revisão, histórico de versões
// dos protocolos e configuração das chaves de IA do médico.
import { useMemo, useState } from "react";
import { Check, ExternalLink, Loader2, Search, X, History } from "lucide-react";
import PageMeta from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import AISettingsCard from "@/modules/ai/AISettingsCard";
import VersionDiff from "@/modules/ai/VersionDiff";
import { useAIUpdates } from "@/modules/ai/hooks/useAIUpdates";
import { AI_DISCLAIMER, type PendingUpdate } from "@/modules/ai/lib/types";

export default function AtualizacoesPage() {
  const { updates, versions, isLoading, buscar, revisar } = useAIUpdates();
  const [tema, setTema] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);
  const [protocoloSel, setProtocoloSel] = useState<string | null>(null);

  const pendentes = updates.filter((u) => u.status === "pendente");
  const revisadas = updates.filter((u) => u.status !== "pendente");

  const protocolos = useMemo(() => {
    const map = new Map<string, typeof versions>();
    for (const v of versions) {
      map.set(v.protocolo, [...(map.get(v.protocolo) ?? []), v]);
    }
    return Array.from(map.entries()).map(([nome, vs]) => ({
      nome,
      versoes: [...vs].sort((a, b) => b.versao - a.versao),
    }));
  }, [versions]);

  const selecionado = protocolos.find((p) => p.nome === protocoloSel) ?? protocolos[0];

  const pesquisar = async () => {
    if (!tema.trim()) return;
    try {
      const r = await buscar.mutateAsync(tema.trim());
      toast.success(
        r.inseridos
          ? `${r.inseridos} atualização(ões) encontradas para revisão.`
          : "Nenhuma atualização nova encontrada.",
      );
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível buscar agora.");
    }
  };

  const decidir = async (item: PendingUpdate, status: "aceito" | "recusado") => {
    try {
      await revisar.mutateAsync({ item, status });
      toast.success(status === "aceito" ? "Incorporado como nova versão." : "Sugestão recusada.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível registrar a decisão.");
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6">
      <PageMeta
        title="Atualizações Clínicas | PrescriMed"
        description="Revise e aceite atualizações de protocolos, escores e diretrizes por patologia, com histórico de versões e comparação entre versões."
        path="/app/atualizacoes"
      />
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Atualizações Clínicas</h1>
        <p className="text-sm text-muted-foreground">
          Novas evidências entram sempre como sugestão. Nada muda no seu conteúdo sem a sua
          aceitação. {AI_DISCLAIMER}
        </p>
      </header>

      <div className="mb-5 flex flex-col gap-2 sm:flex-row">
        <Input
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pesquisar()}
          placeholder="Buscar novidades por patologia — ex.: sepse, fibrilação atrial, asma"
        />
        <Button onClick={pesquisar} disabled={buscar.isPending || !tema.trim()} className="shrink-0">
          {buscar.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Search className="mr-1.5 h-4 w-4" />}
          Buscar atualizações
        </Button>
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico de versões</TabsTrigger>
          <TabsTrigger value="revisadas">Decisões ({revisadas.length})</TabsTrigger>
          <TabsTrigger value="chaves">Chaves de IA</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4 space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && pendentes.length === 0 && (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma atualização aguardando revisão. Busque por uma patologia acima.
            </p>
          )}
          {pendentes.map((u) => (
            <article key={u.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{u.tipo}</Badge>
                    <Badge variant="outline">{u.patologia}</Badge>
                    {u.fonte && <span className="text-[11px] text-muted-foreground">via {u.fonte}</span>}
                  </div>
                  <h2 className="mt-1.5 text-sm font-semibold">{u.titulo}</h2>
                  {u.resumo && <p className="mt-1 text-xs text-muted-foreground">{u.resumo}</p>}
                  {u.referencia && (
                    <p className="mt-1 text-[11px] text-muted-foreground">Referência: {u.referencia}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" onClick={() => decidir(u, "aceito")} disabled={revisar.isPending}>
                    <Check className="mr-1.5 h-4 w-4" /> Aceitar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => decidir(u, "recusado")} disabled={revisar.isPending}>
                    <X className="mr-1.5 h-4 w-4" /> Recusar
                  </Button>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="text-[11px] font-medium underline underline-offset-2"
                  onClick={() => setAberta(aberta === u.id ? null : u.id)}
                >
                  {aberta === u.id ? "Ocultar conteúdo" : "Ver conteúdo e comparação"}
                </button>
                {u.url && (
                  <a
                    href={u.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] underline underline-offset-2"
                  >
                    <ExternalLink className="h-3 w-3" /> Fonte
                  </a>
                )}
              </div>

              {aberta === u.id && (
                <div className="mt-3 space-y-3">
                  {u.conteudo_anterior ? (
                    <VersionDiff anterior={u.conteudo_anterior} novo={u.conteudo_novo ?? ""} />
                  ) : (
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border p-3 text-[11px] leading-relaxed">
                      {u.conteudo_novo || "Sem conteúdo detalhado."}
                    </pre>
                  )}
                </div>
              )}
            </article>
          ))}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          {protocolos.length === 0 ? (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Ainda não há versões registradas. Ao aceitar uma atualização, ela vira a versão
              seguinte do protocolo e fica rastreável aqui.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
              <nav className="space-y-1">
                {protocolos.map((p) => (
                  <button
                    key={p.nome}
                    type="button"
                    onClick={() => setProtocoloSel(p.nome)}
                    className={`block w-full rounded-md border px-2.5 py-2 text-left text-xs ${
                      selecionado?.nome === p.nome ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
                    }`}
                  >
                    <span className="font-medium">{p.nome}</span>
                    <span className="ml-1 text-muted-foreground">v{p.versoes[0].versao}</span>
                  </button>
                ))}
              </nav>

              <div className="space-y-3">
                {selecionado?.versoes.map((v, idx) => {
                  const anterior = selecionado.versoes[idx + 1];
                  return (
                    <article key={v.id} className="rounded-lg border bg-card p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="gap-1">
                          <History className="h-3 w-3" /> versão {v.versao}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(v.created_at).toLocaleString("pt-BR")} · origem {v.origem}
                        </span>
                      </div>
                      {v.referencia && (
                        <p className="mt-1 text-[11px] text-muted-foreground">Referência: {v.referencia}</p>
                      )}
                      {anterior ? (
                        <div className="mt-2">
                          <VersionDiff anterior={anterior.conteudo} novo={v.conteudo} />
                        </div>
                      ) : (
                        <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-md border p-3 text-[11px] leading-relaxed">
                          {v.conteudo || "Sem conteúdo."}
                        </pre>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="revisadas" className="mt-4 space-y-2">
          {revisadas.length === 0 && (
            <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma decisão registrada ainda.
            </p>
          )}
          {revisadas.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <div className="min-w-0">
                <div className="text-xs font-medium">{u.titulo}</div>
                <div className="text-[11px] text-muted-foreground">
                  {u.patologia} · {u.revisado_em ? new Date(u.revisado_em).toLocaleString("pt-BR") : "—"}
                </div>
              </div>
              <Badge variant={u.status === "aceito" ? "default" : "outline"}>{u.status}</Badge>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="chaves" className="mt-4">
          <AISettingsCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
