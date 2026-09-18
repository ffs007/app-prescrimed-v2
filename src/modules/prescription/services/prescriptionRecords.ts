/**
 * Registro das receitas emitidas para revisão posterior.
 *
 * Guarda o que foi prescrito (medicamento + posologia como saiu no papel),
 * o quadro clínico que originou a receita e o ambiente de atendimento.
 * Nenhum dado é inferido: é o retrato exato da emissão.
 */
import { supabase } from "@/integrations/supabase/client";

export interface PrescriptionItemRecord {
  nome: string;
  posologia: string;
}

export interface PrescriptionRecord {
  id: string;
  criadoEm: string;
  paciente: string;
  ambiente: string | null;
  contexto: string | null;
  quadro: string | null;
  quadroTipo: string | null;
  cid: string | null;
  receituario: string | null;
  itens: PrescriptionItemRecord[];
  status: string;
}

interface SaveArgs {
  patientName: string;
  environment: string;
  careContext?: string | null;
  conditionName?: string | null;
  conditionType?: "patologia" | "sindrome" | null;
  cid?: string | null;
  regulatoryLabel?: string | null;
  items: PrescriptionItemRecord[];
}

/** Persiste a receita emitida. Falha silenciosa: nunca bloqueia a impressão. */
export async function savePrescriptionRecord(args: SaveArgs): Promise<void> {
  try {
    if (args.items.length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("prescricoes_historico").insert({
      id_paciente: args.patientName.trim() || "Sem identificação",
      profissional_id: user.id,
      contexto_atendimento: args.careContext ?? args.environment,
      cid: args.cid ?? null,
      diagnostico: args.conditionName ?? null,
      dados_paciente_snapshot: {
        nome: args.patientName || null,
        ambiente: args.environment,
        quadro: args.conditionName ?? null,
        quadro_tipo: args.conditionType ?? null,
        receituario: args.regulatoryLabel ?? null,
      } as never,
      itens: args.items as never,
      status: "emitida",
    });
  } catch (e) {
    console.error("Falha ao registrar receita", e);
  }
}

type Row = {
  id: string;
  criado_em: string;
  id_paciente: string;
  contexto_atendimento: string | null;
  cid: string | null;
  diagnostico: string | null;
  status: string;
  itens: unknown;
  dados_paciente_snapshot: Record<string, unknown> | null;
};

const asItems = (raw: unknown): PrescriptionItemRecord[] =>
  Array.isArray(raw)
    ? raw.map((i) => {
        const o = (i ?? {}) as Record<string, unknown>;
        return {
          nome: String(o.nome ?? o.name ?? "—"),
          posologia: String(o.posologia ?? o.text ?? ""),
        };
      })
    : [];

export async function listPrescriptionRecords(limit = 100): Promise<PrescriptionRecord[]> {
  const { data, error } = await supabase
    .from("prescricoes_historico")
    .select("id, criado_em, id_paciente, contexto_atendimento, cid, diagnostico, status, itens, dados_paciente_snapshot")
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Row[]).map((r) => {
    const snap = (r.dados_paciente_snapshot ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      criadoEm: r.criado_em,
      paciente: (snap.nome as string) || r.id_paciente,
      ambiente: (snap.ambiente as string) ?? null,
      contexto: r.contexto_atendimento,
      quadro: (snap.quadro as string) ?? r.diagnostico ?? null,
      quadroTipo: (snap.quadro_tipo as string) ?? null,
      cid: r.cid,
      receituario: (snap.receituario as string) ?? null,
      itens: asItems(r.itens),
      status: r.status,
    };
  });
}
