// Etapa 17 — Cálculo de badges para modelos/kits/conjuntos.
// Não cadastra dados reais, apenas inferências sobre o registro.

import type { Database } from "@/integrations/supabase/types";

type Modelo = Database["public"]["Tables"]["modelos_prescricao"]["Row"];

export type TemplateBadge =
  | "Pessoal"
  | "Institucional"
  | "Equipe"
  | "Revisado"
  | "Rascunho"
  | "Aguardando revisão"
  | "Alto risco"
  | "Pediátrico"
  | "IV"
  | "Revisar fonte"
  | "Segurança incompleta";

const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

export function computeModeloBadges(m: Modelo): TemplateBadge[] {
  const badges: TemplateBadge[] = [];
  if (m.visibilidade === "pessoal") badges.push("Pessoal");
  else if (m.visibilidade === "institucional") badges.push("Institucional");
  else badges.push("Equipe");

  if (m.status_revisao === "revisado") badges.push("Revisado");
  if (m.status_revisao === "rascunho") badges.push("Rascunho");
  if (m.status_revisao === "aguardando_revisao") badges.push("Aguardando revisão");

  if (m.tipo_modelo === "pediatrico") badges.push("Pediátrico");

  // IV: detectar via "IV" em qualquer item de medicamento
  const itens = (m.itens_prescricao as any[]) ?? [];
  const isIV = itens.some(
    (it) => it?.tipo_item === "medicamento" && /iv|endoven/i.test(String(it?.via ?? "")),
  );
  if (isIV) {
    badges.push("IV");
    const ivIncomplete = itens.some(
      (it) =>
        it?.tipo_item === "medicamento" &&
        /iv|endoven/i.test(String(it?.via ?? "")) &&
        (!it?.diluente || !it?.volume_diluicao || !it?.tempo_infusao),
    );
    if (ivIncomplete) badges.push("Segurança incompleta");
  }

  if ((m.alertas_padrao ?? []).some((a) => /alto risco|alerta_alto/i.test(a))) {
    badges.push("Alto risco");
  }

  if (m.visibilidade === "institucional" && m.revisado_em) {
    const last = new Date(m.revisado_em).getTime();
    if (Date.now() - last > TWELVE_MONTHS_MS) badges.push("Revisar fonte");
  } else if (m.visibilidade === "institucional" && !m.fonte_referencia) {
    badges.push("Revisar fonte");
  }

  return badges;
}
