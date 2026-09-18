// Etapa 18 — Hook que orquestra a tela de revisão de reaproveitamento.
import { useEffect, useMemo, useState, useCallback } from "react";
import type { ReuseItem, PatientSnapshot } from "../lib/types";
import { comparePatientSnapshots } from "../lib/historyCompare";
import { evaluateReuseItems } from "../lib/reuseSafetyEngine";

export interface UseReuseReviewArgs {
  itensOriginais: ReuseItem[];
  pacienteAnterior: PatientSnapshot;
  pacienteAtual: PatientSnapshot;
  bloquearAlertaCritico: boolean;
  exigirJustDadosMudaram: boolean;
}

export function useReuseReview(args: UseReuseReviewArgs) {
  const diffs = useMemo(
    () => comparePatientSnapshots(args.pacienteAnterior, args.pacienteAtual),
    [args.pacienteAnterior, args.pacienteAtual],
  );

  const [items, setItems] = useState<ReuseItem[]>([]);

  // Recalcula sempre que entrada muda
  useEffect(() => {
    const evaluated = evaluateReuseItems(args.itensOriginais, {
      diffs,
      pacienteAnterior: args.pacienteAnterior,
      pacienteAtual: args.pacienteAtual,
      bloquearAlertaCritico: args.bloquearAlertaCritico,
      exigirJustDadosMudaram: args.exigirJustDadosMudaram,
    });
    setItems(evaluated);
  }, [args.itensOriginais, args.pacienteAnterior, args.pacienteAtual, args.bloquearAlertaCritico, args.exigirJustDadosMudaram, diffs]);

  const toggle = useCallback((id: string) => {
    setItems((prev) => prev.map((it) =>
      it.id === id && it.status !== "bloqueado"
        ? { ...it, selecionado: !it.selecionado }
        : it,
    ));
  }, []);

  const edit = useCallback((id: string, patch: Partial<ReuseItem>) => {
    setItems((prev) => prev.map((it) =>
      it.id === id ? { ...it, ...patch, editado: true } : it,
    ));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const selecionados = useMemo(() => items.filter((it) => it.selecionado), [items]);
  const temBloqueio = useMemo(() => items.some((it) => it.status === "bloqueado"), [items]);

  return { items, diffs, toggle, edit, remove, selecionados, temBloqueio };
}
