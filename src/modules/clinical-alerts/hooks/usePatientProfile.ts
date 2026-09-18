import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PatientProfile, PatientAllergy } from "../lib/clinicalAlertsCalc";

const empty = (id: string): PatientProfile => ({
  id_paciente: id,
  alergias_medicamentosas: [],
  alergias_classes_medicamentosas: [],
  alergias_outros: [],
  gestante: false, lactante: false,
  comorbidades: [], diagnosticos_cid: [], condicoes_clinicas_relevantes: [],
  restricoes_medicamentosas: [],
});

export function usePatientProfile(idPaciente: string | null | undefined) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idPaciente) { setProfile(null); setLoading(false); return; }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("pacientes_perfil_clinico")
        .select("*").eq("id_paciente", idPaciente).maybeSingle();
      if (!active) return;
      if (error) {
        console.error("[usePatientProfile] falha ao carregar perfil do paciente:", error);
        toast.error("Não foi possível carregar o perfil clínico do paciente.");
        setLoading(false);
        return;
      }
      if (data) {
        setProfile({
          id_paciente: data.id_paciente,
          alergias_medicamentosas: (data.alergias_medicamentosas as unknown as PatientAllergy[]) || [],
          alergias_classes_medicamentosas: data.alergias_classes_medicamentosas || [],
          alergias_outros: data.alergias_outros || [],
          gestante: data.gestante,
          trimestre_gestacional: data.trimestre_gestacional as PatientProfile["trimestre_gestacional"],
          lactante: data.lactante,
          idade_anos: data.idade_anos,
          comorbidades: data.comorbidades || [],
          diagnosticos_cid: data.diagnosticos_cid || [],
          condicoes_clinicas_relevantes: data.condicoes_clinicas_relevantes || [],
          restricoes_medicamentosas: data.restricoes_medicamentosas || [],
          observacoes_clinicas_paciente: data.observacoes_clinicas_paciente,
        });
      } else setProfile(empty(idPaciente));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [idPaciente]);

  async function save(next: PatientProfile) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setProfile(next);
    const { error } = await supabase.from("pacientes_perfil_clinico").upsert({
      ...next,
      alergias_medicamentosas: next.alergias_medicamentosas as unknown as object,
      created_by: user.id,
    } as never, { onConflict: "id_paciente" });
    if (error) {
      console.error("[usePatientProfile] falha ao salvar perfil do paciente:", error);
      toast.error("Não foi possível salvar o perfil clínico do paciente.");
    }
  }

  return { profile, save, loading };
}
