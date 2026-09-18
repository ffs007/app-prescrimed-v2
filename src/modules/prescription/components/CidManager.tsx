/**
 * Gestão de CIDs da patologia: principal, associados, edição da lista sugerida
 * e combos frequentes. Integra encaminhamentos, prescrições e AIH.
 */
import { useMemo, useState } from "react";
import { Check, Plus, Save, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getPathologyKnowledge } from "../data/pathologyKnowledge";
import { useCidCombos, useCidPreference, type CidCombo } from "../hooks/useCids";

export interface CidSelection {
  principal: string;
  associados: string[];
}

interface Props {
  pathologyName: string;
  category?: string;
  value: CidSelection;
  onChange: (value: CidSelection) => void;
}

const CidManager = ({ pathologyName, category, value, onChange }: Props) => {
  const { preference, save } = useCidPreference(pathologyName);
  const { combos, create, remove, registerUse } = useCidCombos();
  const [novoCid, setNovoCid] = useState("");
  const [comboNome, setComboNome] = useState("");

  const sugeridos = useMemo(() => {
    const base = getPathologyKnowledge({ name: pathologyName, category }).cids;
    const extras = preference?.cids_associados ?? [];
    const removidos = new Set(preference?.cids_removidos ?? []);
    return Array.from(new Set([...base, ...extras])).filter((c) => !removidos.has(c));
  }, [pathologyName, category, preference]);

  const setPrincipal = (cid: string) =>
    onChange({ principal: cid, associados: value.associados.filter((c) => c !== cid) });

  const toggleAssociado = (cid: string) => {
    if (cid === value.principal) return;
    onChange({
      ...value,
      associados: value.associados.includes(cid)
        ? value.associados.filter((c) => c !== cid)
        : [...value.associados, cid],
    });
  };

  const addCid = () => {
    const cid = novoCid.trim().toUpperCase();
    if (!cid) return;
    if (!value.principal) onChange({ ...value, principal: cid });
    else if (!value.associados.includes(cid)) onChange({ ...value, associados: [...value.associados, cid] });
    setNovoCid("");
  };

  const hideSuggested = (cid: string) => {
    const removidos = Array.from(new Set([...(preference?.cids_removidos ?? []), cid]));
    save.mutate(
      {
        patologia_nome: pathologyName,
        cid_principal: preference?.cid_principal ?? null,
        cids_associados: preference?.cids_associados ?? [],
        cids_removidos: removidos,
      },
      { onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível ajustar a lista.") },
    );
  };

  const saveLocalList = () => {
    const extras = [value.principal, ...value.associados].filter(Boolean);
    save.mutate(
      {
        patologia_nome: pathologyName,
        cid_principal: value.principal || null,
        cids_associados: Array.from(new Set([...(preference?.cids_associados ?? []), ...extras])),
        cids_removidos: preference?.cids_removidos ?? [],
      },
      {
        onSuccess: () => toast.success("Lista de CIDs desta patologia salva."),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar."),
      },
    );
  };

  const saveCombo = () => {
    const nome = comboNome.trim();
    if (!nome) return toast.error("Dê um nome ao combo.");
    if (!value.principal && value.associados.length === 0) return toast.error("Selecione ao menos um CID.");
    create.mutate(
      { nome, cid_principal: value.principal || null, cids_associados: value.associados, contexto: pathologyName },
      {
        onSuccess: () => {
          setComboNome("");
          toast.success("Combo de CIDs salvo.");
        },
        onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar o combo."),
      },
    );
  };

  const applyCombo = (combo: CidCombo) => {
    onChange({ principal: combo.cid_principal ?? "", associados: combo.cids_associados ?? [] });
    registerUse.mutate(combo);
  };

  return (
    <div className="space-y-4 rounded-lg border border-ink-soft bg-paper-alt/30 p-3">
      <div>
        <Label className="text-xs font-medium text-ink">CIDs sugeridos para a patologia</Label>
        <p className="text-[11px] text-ink-muted">
          Clique para marcar como associado; a estrela define o CID principal.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sugeridos.length === 0 && (
            <span className="text-[11px] text-ink-faint">Nenhum CID sugerido — adicione abaixo.</span>
          )}
          {sugeridos.map((cid) => {
            const isPrincipal = value.principal === cid;
            const isAssoc = value.associados.includes(cid);
            return (
              <span
                key={cid}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                  isPrincipal
                    ? "border-canon-blue bg-canon-blue/10 text-canon-blue"
                    : isAssoc
                      ? "border-ink-soft bg-card text-ink"
                      : "border-ink-soft text-ink-muted"
                }`}
              >
                <button type="button" onClick={() => setPrincipal(cid)} aria-label={`Definir ${cid} como principal`}>
                  <Star className={`h-3 w-3 ${isPrincipal ? "fill-current" : ""}`} />
                </button>
                <button type="button" onClick={() => toggleAssociado(cid)}>
                  {cid}
                </button>
                {isAssoc && <Check className="h-3 w-3" />}
                <button type="button" onClick={() => hideSuggested(cid)} aria-label={`Remover ${cid} da lista sugerida`}>
                  <X className="h-3 w-3 opacity-60" />
                </button>
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={novoCid}
          onChange={(e) => setNovoCid(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCid())}
          placeholder="Adicionar CID (ex.: I10)"
          className="h-9 bg-card border-ink-soft"
          aria-label="Adicionar CID"
        />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addCid}>
            <Plus className="h-3.5 w-3.5" /> Adicionar
          </Button>
          <Button type="button" size="sm" variant="outline" className="gap-1" onClick={saveLocalList}>
            <Save className="h-3.5 w-3.5" /> Salvar lista
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-ink-soft bg-card p-2.5 text-xs">
        <div className="font-medium text-ink">Seleção atual</div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-[11px]">
            Principal: {value.principal || "—"}
          </Badge>
          {value.associados.map((c) => (
            <Badge key={c} variant="secondary" className="text-[11px]">
              {c}
              <button type="button" className="ml-1" onClick={() => toggleAssociado(c)} aria-label={`Remover ${c}`}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-ink">Combos de CIDs</Label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            value={comboNome}
            onChange={(e) => setComboNome(e.target.value)}
            placeholder="Nome do combo (ex.: DPOC + IC + HAS)"
            className="h-9 bg-card border-ink-soft"
            aria-label="Nome do combo de CIDs"
          />
          <Button type="button" size="sm" variant="outline" onClick={saveCombo}>
            Salvar combo
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {combos.map((combo) => (
            <span
              key={combo.id}
              className="inline-flex items-center gap-1 rounded-full border border-ink-soft bg-card px-2 py-0.5 text-[11px] text-ink"
            >
              <button type="button" onClick={() => applyCombo(combo)}>
                {combo.nome}
              </button>
              <button type="button" onClick={() => remove.mutate(combo.id)} aria-label={`Excluir combo ${combo.nome}`}>
                <Trash2 className="h-3 w-3 opacity-60" />
              </button>
            </span>
          ))}
          {combos.length === 0 && <span className="text-[11px] text-ink-faint">Nenhum combo salvo ainda.</span>}
        </div>
      </div>
    </div>
  );
};

export default CidManager;
