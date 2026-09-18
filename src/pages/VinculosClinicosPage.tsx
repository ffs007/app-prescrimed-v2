/**
 * Etapa 4 — administração dos vínculos clínicos (quadro ↔ medicamento).
 *
 * Nenhum vínculo é criado automaticamente: aqui uma pessoa cria, revisa,
 * corrige ou inativa cada associação, e tudo fica registrado.
 */
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  GROUP_LABEL,
  LINK_CONTEXT_LABEL,
  LINK_ROLE_LABEL,
  LINK_STATUS_LABEL,
  type LinkContext,
  type LinkRole,
} from "@/modules/medications/services/clinicalLinks";
import {
  useLinkMutations,
  useLinkSummary,
  useLinksByCondition,
  useReadyConditions,
  useUnlinkedMedications,
} from "@/modules/medications/hooks/useClinicalLinks";

const ROLES = Object.keys(LINK_ROLE_LABEL) as LinkRole[];
const CONTEXTS = Object.keys(LINK_CONTEXT_LABEL) as LinkContext[];

const Metric = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-md border border-border bg-card p-3">
    <div className="text-2xl font-semibold text-foreground">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const VinculosClinicosPage = () => {
  const [conditionType, setConditionType] = useState<"patologia" | "sindrome">("patologia");
  const [condition, setCondition] = useState("");
  const [medicationId, setMedicationId] = useState("");
  const [role, setRole] = useState<LinkRole>("primeira_linha");
  const [careContext, setCareContext] = useState<LinkContext>("qualquer");
  const [priority, setPriority] = useState(20);
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");

  const summary = useLinkSummary();
  const unlinked = useUnlinkedMedications();
  const ready = useReadyConditions();
  const links = useLinksByCondition(conditionType, condition);
  const { save, act } = useLinkMutations();

  const groups = useMemo(() => summary.data?.grupos ?? {}, [summary.data]);

  const handleSave = async () => {
    if (!condition.trim() || !medicationId.trim()) {
      toast.error("Informe o quadro clínico e o medicamento.");
      return;
    }
    try {
      await save.mutateAsync({
        conditionType,
        conditionName: condition.trim(),
        medicationId: medicationId.trim(),
        role,
        priority,
        careContext,
        notes: notes.trim() || null,
        source: source.trim() || null,
      });
      toast.success("Vínculo registrado como pendente de revisão.");
      setMedicationId("");
      setNotes("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o vínculo.");
    }
  };

  const handleAction = async (id: string, action: "aprovar" | "corrigir" | "pendente" | "inativar" | "remover") => {
    try {
      await act.mutateAsync({ id, action });
      toast.success("Vínculo atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ação não concluída.");
    }
  };

  return (
    <div className="space-y-6 p-4">
      <Helmet>
        <title>Vínculos clínicos | PrescriMed</title>
        <meta name="description" content="Administração dos vínculos entre quadros clínicos e medicamentos." />
      </Helmet>

      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Vínculos clínicos</h1>
        <p className="text-sm text-muted-foreground">
          Quadro clínico → medicamento. Toda associação nasce pendente e só passa a sugestão principal depois de
          revisada.{" "}
          <Link to="/admin/auditoria-base" className="underline">
            Ver auditoria da base
          </Link>
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Metric label="Medicamentos com vínculo" value={summary.data?.medicamentos_com_vinculo ?? "—"} />
        <Metric label="Sem vínculo" value={summary.data?.medicamentos_sem_vinculo ?? "—"} />
        <Metric label="Vínculos revisados" value={summary.data?.vinculos_revisados ?? "—"} />
        <Metric label="Pendentes de revisão" value={summary.data?.vinculos_pendentes ?? "—"} />
        <Metric label="Quadros prontos" value={summary.data?.quadros_prontos ?? "—"} />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Novo vínculo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Tipo de quadro</span>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as "patologia" | "sindrome")}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="patologia">Patologia</option>
              <option value="sindrome">Síndrome</option>
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Nome do quadro</span>
            <Input value={condition} onChange={(e) => setCondition(e.target.value)} placeholder="Ex.: Pneumonia" />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Medicamento (id da base)</span>
            <Input value={medicationId} onChange={(e) => setMedicationId(e.target.value)} placeholder="UUID" />
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Papel terapêutico</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as LinkRole)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {LINK_ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Contexto de uso</span>
            <select
              value={careContext}
              onChange={(e) => setCareContext(e.target.value as LinkContext)}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {CONTEXTS.map((c) => (
                <option key={c} value={c}>
                  {LINK_CONTEXT_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs">
            <span className="text-muted-foreground">Prioridade (menor aparece antes)</span>
            <Input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value) || 20)} />
          </label>
          <label className="space-y-1 text-xs md:col-span-2">
            <span className="text-muted-foreground">Fonte / referência</span>
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Diretriz, protocolo…" />
          </label>
          <label className="space-y-1 text-xs md:col-span-2">
            <span className="text-muted-foreground">Observação clínica</span>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <div className="md:col-span-2">
            <Button onClick={handleSave} disabled={save.isPending} size="sm">
              {save.isPending ? "Salvando…" : "Registrar vínculo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Vínculos do quadro {condition ? `· ${condition}` : "(digite um quadro acima)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {links.isLoading && <p className="text-xs text-muted-foreground">Carregando…</p>}
          {links.data?.length === 0 && !links.isLoading && (
            <p className="text-xs text-muted-foreground">Nenhum vínculo cadastrado para este quadro.</p>
          )}
          {(links.data ?? []).map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2 text-xs">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground">{l.activeIngredient ?? l.medicationId}</div>
                <div className="text-muted-foreground">
                  {LINK_ROLE_LABEL[l.role]} · {LINK_CONTEXT_LABEL[l.careContext]} · prioridade {l.priority} ·{" "}
                  {LINK_STATUS_LABEL[l.status]} · v{l.version}
                  {l.medicationReleased ? " · medicamento liberado" : " · medicamento não liberado"}
                </div>
                {l.notes && <div className="text-muted-foreground">{l.notes}</div>}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => handleAction(l.id, "aprovar")}>
                  Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(l.id, "corrigir")}>
                  Corrigir
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(l.id, "pendente")}>
                  Pendente
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(l.id, "inativar")}>
                  Inativar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Medicamentos sem vínculo · {unlinked.data?.length ?? 0}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {Object.entries(groups).map(([g, n]) => (
                <span key={g} className="rounded border border-border px-1.5 py-0.5">
                  {GROUP_LABEL[g] ?? g}: {n}
                </span>
              ))}
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
              {(unlinked.data ?? []).map((m) => (
                <button
                  key={m.medicationId}
                  type="button"
                  onClick={() => setMedicationId(m.medicationId)}
                  className="block w-full rounded-md border border-border p-2 text-left text-xs hover:bg-accent"
                >
                  <div className="font-medium text-foreground">{m.activeIngredient}</div>
                  <div className="text-muted-foreground">
                    Grupo {m.group} · {m.therapeuticClass ?? "sem classe"} ·{" "}
                    {m.hasDose ? "com dose" : "sem dose"} · {m.hasPresentation ? "com apresentação" : "sem apresentação"}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quadros prontos para o fluxo rápido · {ready.data?.length ?? 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 space-y-1 overflow-y-auto pr-1 text-xs">
              {(ready.data ?? []).length === 0 && (
                <p className="text-muted-foreground">
                  Nenhum quadro pronto ainda: é preciso ter vínculo revisado com medicamento liberado na revisão
                  clínica.
                </p>
              )}
              {(ready.data ?? []).map((c) => (
                <div key={`${c.conditionType}-${c.conditionName}`} className="rounded-md border border-border p-2">
                  <span className="font-medium text-foreground">{c.conditionName}</span>{" "}
                  <span className="text-muted-foreground">· {c.options} opções liberadas</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VinculosClinicosPage;
