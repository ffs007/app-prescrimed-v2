/**
 * MinhasPatologiasPage — personalização de patologias pelo próprio médico.
 *
 * Reúne o catálogo clínico e as patologias próprias numa lista única, com
 * busca, filtro por ambiente/especialidade e reordenação por frequência de
 * uso, favoritos, recentes ou especialidade. Cada patologia pode ter conteúdos
 * padrão ajustados e recursos vinculados (protocolos, guidelines, modelos).
 */
import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  TriangleAlert,
  Stethoscope,
  Star,
  SlidersHorizontal,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { describeSupabaseError, type SupabaseLikeError } from "@/lib/supabaseError";
import type {
  ClinicalEnvironment,
  ClinicalSeverity,
  Pathology,
} from "@/modules/prescription/types/prescription";
import {
  useCustomPathologies,
  useCustomPathologiesQuery,
  useCustomPathologyMutations,
  type CustomPathologyInput,
  type CustomPathologyMed,
  type CustomPathologyRow,
} from "@/modules/prescription/hooks/useCustomPathologies";
import { usePathologiesCatalog } from "@/modules/prescription/hooks/usePathologiesCatalog";
import { usePathologyMemory } from "@/modules/prescription/hooks/usePathologyMemory";
import {
  pathologyKey,
  usePathologyCustomizationMap,
  usePathologyCustomizationMutations,
} from "@/modules/prescription/hooks/usePathologyCustomization";
import { PathologyCustomizationDialog } from "@/modules/prescription/components/PathologyCustomizationDialog";

const ENVIRONMENTS: Array<{ value: ClinicalEnvironment; label: string }> = [
  { value: "ambulatorial", label: "Ambulatorial" },
  { value: "urgencia", label: "Urgências / PS" },
  { value: "emergencia", label: "Emergência / SV" },
];

const SEVERITIES: Array<{ value: ClinicalSeverity; label: string }> = [
  { value: "leve", label: "Leve" },
  { value: "moderada", label: "Moderada" },
  { value: "grave", label: "Grave" },
  { value: "critica", label: "Crítica" },
];

type SortKey = "frequencia" | "favoritos" | "recentes" | "especialidade" | "alfabetica";

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: "frequencia", label: "Frequência de uso" },
  { value: "favoritos", label: "Favoritos primeiro" },
  { value: "recentes", label: "Mais recentes" },
  { value: "especialidade", label: "Especialidade" },
  { value: "alfabetica", label: "Ordem alfabética" },
];

type ViewKey = "todas" | "favoritos" | "recentes" | "personalizadas" | "ajustadas";

const EMPTY_FORM: CustomPathologyInput = {
  nome: "",
  cid10: "",
  categoria: "",
  ambientes: ["ambulatorial"],
  gravidade: "",
  sinonimos: [],
  medicamentos: [{ nome: "", posologia: "" }],
  observacoes: "",
};

const rowToForm = (row: CustomPathologyRow): CustomPathologyInput => ({
  nome: row.nome,
  cid10: row.cid10 ?? "",
  categoria: row.categoria ?? "",
  ambientes: (row.ambientes ?? []).filter(
    (a): a is ClinicalEnvironment =>
      a === "ambulatorial" || a === "urgencia" || a === "emergencia",
  ),
  gravidade: (row.gravidade as ClinicalSeverity | null) ?? "",
  sinonimos: row.sinonimos ?? [],
  medicamentos:
    (row.medicamentos ?? []).length > 0
      ? (row.medicamentos as CustomPathologyMed[])
      : [{ nome: "", posologia: "" }],
  observacoes: row.observacoes ?? "",
});

const MinhasPatologiasPage = () => {
  const { data: customRows, isLoading: customLoading, isError, error } = useCustomPathologiesQuery();
  const { pathologies: customPathologies } = useCustomPathologies();
  const { create, update, remove } = useCustomPathologyMutations();
  const { pathologies, isLoading: catalogLoading } = usePathologiesCatalog(customPathologies);
  const { isFavorite, toggleFavorite, recents, useCount } = usePathologyMemory();
  const { map: customizations, isLoading: customizationLoading } = usePathologyCustomizationMap();
  const { remove: removeCustomization } = usePathologyCustomizationMutations();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewKey>("todas");
  const [sort, setSort] = useState<SortKey>("frequencia");
  const [env, setEnv] = useState<ClinicalEnvironment | "todos">("todos");
  const [specialty, setSpecialty] = useState<string>("todas");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomPathologyInput>(EMPTY_FORM);

  const [customizing, setCustomizing] = useState<Pathology | null>(null);

  const specialties = useMemo(() => {
    const set = new Set<string>();
    for (const p of pathologies) {
      const s = p.specialty ?? p.category;
      if (s) set.add(s);
    }
    return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [pathologies]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    let items = pathologies.filter((p) => {
      if (q) {
        const hay = [p.name, p.cid ?? "", ...(p.synonyms ?? []), p.specialty ?? p.category ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (env !== "todos" && !(p.environments ?? []).includes(env)) return false;
      if (specialty !== "todas" && (p.specialty ?? p.category) !== specialty) return false;
      if (view === "favoritos" && !isFavorite(p.id)) return false;
      if (view === "recentes" && !recents.includes(p.id)) return false;
      if (view === "personalizadas" && !p.isCustom) return false;
      if (view === "ajustadas" && !customizations.has(pathologyKey(p.name))) return false;
      return true;
    });

    const byName = (a: Pathology, b: Pathology) => a.name.localeCompare(b.name, "pt-BR");
    items = [...items].sort((a, b) => {
      switch (sort) {
        case "frequencia": {
          const d = useCount(pathologyKey(b.name)) - useCount(pathologyKey(a.name));
          return d !== 0 ? d : byName(a, b);
        }
        case "favoritos": {
          const d = Number(isFavorite(b.id)) - Number(isFavorite(a.id));
          return d !== 0 ? d : byName(a, b);
        }
        case "recentes": {
          const ia = recents.indexOf(a.id);
          const ib = recents.indexOf(b.id);
          if (ia === -1 && ib === -1) return byName(a, b);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        }
        case "especialidade": {
          const sa = a.specialty ?? a.category ?? "zzz";
          const sb = b.specialty ?? b.category ?? "zzz";
          const d = sa.localeCompare(sb, "pt-BR");
          return d !== 0 ? d : byName(a, b);
        }
        default:
          return byName(a, b);
      }
    });
    return items;
  }, [
    pathologies,
    search,
    env,
    specialty,
    view,
    sort,
    isFavorite,
    recents,
    customizations,
    useCount,
  ]);

  const customRowByName = useMemo(() => {
    const m = new Map<string, CustomPathologyRow>();
    for (const r of customRows ?? []) m.set(r.nome, r);
    return m;
  }, [customRows]);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (row: CustomPathologyRow) => {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setOpen(true);
  };

  const toggleEnv = (value: ClinicalEnvironment) => {
    setForm((f) => ({
      ...f,
      ambientes: f.ambientes.includes(value)
        ? f.ambientes.filter((e) => e !== value)
        : [...f.ambientes, value],
    }));
  };

  const setMed = (idx: number, patch: Partial<CustomPathologyMed>) => {
    setForm((f) => ({
      ...f,
      medicamentos: f.medicamentos.map((m, i) => (i === idx ? { ...m, ...patch } : m)),
    }));
  };

  const save = async () => {
    if (!form.nome.trim()) {
      toast.error("Informe o nome da patologia");
      return;
    }
    if (form.ambientes.length === 0) {
      toast.error("Selecione ao menos um ambiente");
      return;
    }
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, input: form });
        toast.success("Patologia atualizada");
      } else {
        await create.mutateAsync(form);
        toast.success("Patologia criada");
      }
      setOpen(false);
    } catch (e) {
      toast.error(describeSupabaseError(e as SupabaseLikeError));
    }
  };

  const del = async (row: CustomPathologyRow) => {
    try {
      await remove.mutateAsync(row.id);
      toast.success(`"${row.nome}" removida`);
    } catch (e) {
      toast.error(describeSupabaseError(e as SupabaseLikeError));
    }
  };

  const clearCustomization = async (name: string) => {
    const row = customizations.get(pathologyKey(name));
    if (!row) return;
    try {
      await removeCustomization.mutateAsync(row.id);
      toast.success("Ajustes removidos");
    } catch (e) {
      toast.error(describeSupabaseError(e as SupabaseLikeError));
    }
  };

  const saving = create.isPending || update.isPending;
  const loading = customLoading || catalogLoading || customizationLoading;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <Helmet>
        <title>Personalizar patologias | PrescriMed</title>
        <meta
          name="description"
          content="Organize suas patologias por uso, favoritos e especialidade, crie condições personalizadas e ajuste anamnese, exames, condutas e protocolos."
        />
      </Helmet>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Personalizar patologias</h1>
          <p className="text-sm text-muted-foreground">
            Ordene o que você mais usa, crie condições próprias e ajuste os conteúdos sugeridos no
            atendimento.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" /> Nova patologia
        </Button>
      </header>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome, CID, sinônimo ou especialidade"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewKey)}>
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="favoritos">Favoritos</TabsTrigger>
              <TabsTrigger value="recentes">Recentes</TabsTrigger>
              <TabsTrigger value="personalizadas">Minhas</TabsTrigger>
              <TabsTrigger value="ajustadas">Ajustadas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" aria-hidden />
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[13rem]" aria-label="Ordenar por">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={env}
              onValueChange={(v) => setEnv(v as ClinicalEnvironment | "todos")}
            >
              <SelectTrigger className="w-[11rem]" aria-label="Ambiente clínico">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os ambientes</SelectItem>
                {ENVIRONMENTS.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specialty} onValueChange={setSpecialty}>
              <SelectTrigger className="w-[12rem]" aria-label="Especialidade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="todas">Todas especialidades</SelectItem>
                {specialties.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar</AlertTitle>
          <AlertDescription>{describeSupabaseError(error as SupabaseLikeError)}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Stethoscope className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma patologia encontrada com esses filtros.
            </p>
            <Button variant="outline" onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Criar patologia personalizada
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((p) => {
            const custom = p.isCustom ? customRowByName.get(p.name) : undefined;
            const tuning = customizations.get(pathologyKey(p.name));
            const uses = useCount(pathologyKey(p.name));
            const spec = p.specialty ?? p.category;
            return (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <span className="min-w-0">{p.name}</span>
                    <span className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={isFavorite(p.id) ? "Desfavoritar" : "Favoritar"}
                        onClick={() => toggleFavorite(p.id)}
                      >
                        <Star
                          className={
                            isFavorite(p.id)
                              ? "h-4 w-4 fill-current text-warning"
                              : "h-4 w-4 text-muted-foreground"
                          }
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Ajustar conteúdos"
                        onClick={() => setCustomizing(p)}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                      {custom && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Editar patologia"
                            onClick={() => openEdit(custom)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Excluir patologia"
                            onClick={() => del(custom)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-1.5">
                    {(p.environments ?? []).map((a) => (
                      <Badge key={a} variant="secondary">
                        {ENVIRONMENTS.find((e) => e.value === a)?.label ?? a}
                      </Badge>
                    ))}
                    {p.cid && <Badge variant="outline">CID {p.cid}</Badge>}
                    {spec && <Badge variant="outline">{spec}</Badge>}
                    {p.isCustom && <Badge>Minha</Badge>}
                    {uses > 0 && <Badge variant="outline">{uses}× usada</Badge>}
                  </div>

                  {tuning ? (
                    <div className="space-y-1 rounded-md border border-border bg-muted/40 p-2 text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">Conteúdos ajustados por você</p>
                      <p>
                        {tuning.anamnese.length} perguntas · {tuning.exames.length} exames ·{" "}
                        {tuning.condutas.length} condutas · {tuning.prescricoes_modelo.length}{" "}
                        prescrições-modelo
                      </p>
                      {tuning.recursos.length > 0 && (
                        <p className="flex items-center gap-1">
                          <Paperclip className="h-3 w-3" /> {tuning.recursos.length} recurso(s)
                          vinculado(s)
                        </p>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => clearCustomization(p.name)}
                      >
                        Restaurar padrão
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Sem ajustes — usa o conteúdo padrão do sistema.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {customizing && (
        <PathologyCustomizationDialog
          open={!!customizing}
          onOpenChange={(v) => !v && setCustomizing(null)}
          pathologyName={customizing.name}
          specialty={customizing.specialty ?? customizing.category}
          existing={customizations.get(pathologyKey(customizing.name))}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar patologia" : "Nova patologia"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex.: DPOC exacerbado em uso de VNI"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cid">CIDs associados</Label>
                <Input
                  id="cid"
                  value={form.cid10}
                  onChange={(e) => setForm((f) => ({ ...f, cid10: e.target.value }))}
                  placeholder="J44.1, J96.0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cat">Especialidade</Label>
                <Input
                  id="cat"
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                  placeholder="Pneumologia"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Ambientes *</Label>
              <div className="flex flex-wrap gap-2">
                {ENVIRONMENTS.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    size="sm"
                    variant={form.ambientes.includes(item.value) ? "default" : "outline"}
                    onClick={() => toggleEnv(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Gravidade</Label>
              <div className="flex flex-wrap gap-2">
                {SEVERITIES.map((s) => (
                  <Button
                    key={s.value}
                    type="button"
                    size="sm"
                    variant={form.gravidade === s.value ? "default" : "outline"}
                    onClick={() =>
                      setForm((f) => ({ ...f, gravidade: f.gravidade === s.value ? "" : s.value }))
                    }
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sin">Sinônimos (separados por vírgula)</Label>
              <Input
                id="sin"
                value={form.sinonimos.join(", ")}
                onChange={(e) => setForm((f) => ({ ...f, sinonimos: e.target.value.split(",") }))}
                placeholder="pressão alta, PA elevada"
              />
            </div>

            <div className="space-y-2">
              <Label>Medicamentos habituais</Label>
              {form.medicamentos.map((m, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                  <Input
                    value={m.nome}
                    onChange={(e) => setMed(i, { nome: e.target.value })}
                    placeholder="Medicamento"
                  />
                  <Input
                    value={m.posologia}
                    onChange={(e) => setMed(i, { posologia: e.target.value })}
                    placeholder="Posologia (ex.: 1 cp VO 12/12h por 7 dias)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover medicamento"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        medicamentos: f.medicamentos.filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    medicamentos: [...f.medicamentos, { nome: "", posologia: "" }],
                  }))
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar medicamento
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="obs">Descrição</Label>
              <Textarea
                id="obs"
                rows={3}
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                placeholder="Quando usar este subperfil, cuidados e lembretes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhasPatologiasPage;
