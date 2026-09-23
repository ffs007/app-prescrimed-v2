import { describe, expect, it } from "vitest";
import type { ClinicInfo, SignatureConfig } from "@/modules/prescription/types/prescription";
import type { AssinaturaPerfil } from "./types";
import { mergeClinicInfo, mergeSignatureConfig } from "./applySignatureProfile";

const BASE_SIGNATURE: SignatureConfig = {
  signatureText: "",
  signatureImageUrl: "local.png",
  stampName: "Local Nome",
  stampRole: "Local Função",
  stampCrm: "Local CRM",
  stampExtra: "Local Extra",
};

const BASE_CLINIC: ClinicInfo = {
  clinicName: "Clínica Local",
  doctorName: "Local Nome",
  crm: "Local CRM",
  specialty: "Local Função",
  address: "Endereço local",
  phone: "Telefone local",
  email: "local@x.com",
};

const perfil = (over: Partial<AssinaturaPerfil> = {}): AssinaturaPerfil => ({
  id: "p1",
  id_usuario: "u1",
  perfil_nome: "Plantão",
  nome_profissional: "Dra. Ana Souza",
  especialidade: "Clínica Médica",
  registro: "123456",
  registro_uf: "SP",
  rqe: "9876",
  assinatura_url: "https://x/assinatura.png",
  logo_url: null,
  endereco: "Rua das Flores, 1",
  telefone: "(11) 4000-0000",
  email: "ana@clinica.com",
  cidade_padrao: "São Paulo",
  padrao: true,
  ativo: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  ...over,
});

describe("mergeSignatureConfig", () => {
  it("sem perfil, devolve a configuração local sem alterar", () => {
    expect(mergeSignatureConfig(BASE_SIGNATURE, null)).toBe(BASE_SIGNATURE);
  });

  it("com perfil, sobrepõe nome/função/registro/RQE/assinatura", () => {
    const merged = mergeSignatureConfig(BASE_SIGNATURE, perfil());
    expect(merged).toMatchObject({
      stampName: "Dra. Ana Souza",
      stampRole: "Clínica Médica",
      stampCrm: "123456/SP",
      stampExtra: "RQE 9876",
      signatureImageUrl: "https://x/assinatura.png",
    });
  });

  it("campo vazio no perfil mantém o valor local (fallback)", () => {
    const merged = mergeSignatureConfig(BASE_SIGNATURE, perfil({ especialidade: null, rqe: null, assinatura_url: null }));
    expect(merged.stampRole).toBe("Local Função");
    expect(merged.stampExtra).toBe("Local Extra");
    expect(merged.signatureImageUrl).toBe("local.png");
  });

  it("registro sem UF não quebra o CRM combinado", () => {
    const merged = mergeSignatureConfig(BASE_SIGNATURE, perfil({ registro_uf: null }));
    expect(merged.stampCrm).toBe("123456");
  });
});

describe("mergeClinicInfo", () => {
  it("sem perfil, devolve os dados locais sem alterar", () => {
    expect(mergeClinicInfo(BASE_CLINIC, null)).toBe(BASE_CLINIC);
  });

  it("com perfil, sobrepõe médico/registro/especialidade/contato, preserva o nome da clínica", () => {
    const merged = mergeClinicInfo(BASE_CLINIC, perfil());
    expect(merged).toMatchObject({
      clinicName: "Clínica Local",
      doctorName: "Dra. Ana Souza",
      crm: "123456/SP",
      specialty: "Clínica Médica",
      address: "Rua das Flores, 1",
      phone: "(11) 4000-0000",
      email: "ana@clinica.com",
    });
  });
});
