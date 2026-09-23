// Etapa 0.7 — aplica o perfil de assinatura (assinatura_perfis) escolhido na revisão
// final sobre a assinatura/carimbo e os dados da unidade usados na emissão.
// Sem perfil selecionado, devolve os valores locais (Configurações) inalterados.
import type { ClinicInfo, SignatureConfig } from "@/modules/prescription/types/prescription";
import type { AssinaturaPerfil } from "./types";

const registroCompleto = (p: AssinaturaPerfil): string =>
  [p.registro, p.registro_uf].filter(Boolean).join("/");

export function mergeSignatureConfig(
  base: SignatureConfig,
  perfil: AssinaturaPerfil | null,
): SignatureConfig {
  if (!perfil) return base;
  return {
    ...base,
    stampName: perfil.nome_profissional || base.stampName,
    stampRole: perfil.especialidade || base.stampRole,
    stampCrm: registroCompleto(perfil) || base.stampCrm,
    stampExtra: perfil.rqe ? `RQE ${perfil.rqe}` : base.stampExtra,
    signatureImageUrl: perfil.assinatura_url || base.signatureImageUrl,
  };
}

export function mergeClinicInfo(
  base: ClinicInfo,
  perfil: AssinaturaPerfil | null,
): ClinicInfo {
  if (!perfil) return base;
  return {
    ...base,
    doctorName: perfil.nome_profissional || base.doctorName,
    crm: registroCompleto(perfil) || base.crm,
    specialty: perfil.especialidade || base.specialty,
    address: perfil.endereco || base.address,
    phone: perfil.telefone || base.phone,
    email: perfil.email || base.email,
  };
}
