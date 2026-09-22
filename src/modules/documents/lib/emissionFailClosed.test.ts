import { afterEach, describe, expect, it, vi } from "vitest";
import type { EmissionLogAction } from "./persistEmission";
import type { NewEmissionRecord } from "@/modules/prescription/hooks/useEmissionHistory";
import type { ReceiptFamily } from "@/modules/prescription/services/regulatoryTaxonomy";
import { runEmissionFailClosed } from "./emissionFailClosed";

/**
 * Contrato FAIL-CLOSED do workflow de emissão clínica.
 *
 * Regra imutável: o médico NUNCA recebe PDF / diálogo impressora antes de
 * (1) linha nova em `documentos_gerados`,
 * (2) linha nova em `prescricoes_historico` (quando aplicável),
 * (3) upload binário do PDF concluído em storage://documentos-pdf.
 *
 * Se qualquer etapa lançar erro → allowDelivery === false e nenhuma ação
 * de UI posterior pode rodar. 0 exceções.
 */

const FAKE_SNAP: NewEmissionRecord = {
  id: "snap-1",
  timestamp: 0,
  action: "receita",
  patientName: "Paciente Teste",
  ageValue: "38",
  ageUnit: "anos",
  weight: "78",
  isPediatric: false,
  isPregnant: false,
  environment: "urgencia",
  context: "Amigdalite bacteriana",
  pathology: null,
  pathologyType: null,
  pathologyCid: null,
  syndrome: null,
  selected: [
    { id: 1, name: "Amoxicilina 500mg", text: "1 comp 12/12h por 7 dias" },
  ],
  documentTitle: "Receita médica",
  regulatoryLabel: "Comum",
  signatureConfig: { stampName: null, stampRole: null, stampCrm: null, showStamp: false },
};

describe("runEmissionFailClosed — contrato fail-closed de 3 etapas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("[RED] Sem passos → por padrão o pipeline NÃO libera entrega (force fail closed base)", async () => {
    const result = await runEmissionFailClosed({
      snapshot: FAKE_SNAP,
      acao: "imprimiu",
      generatePdf: async () => new Blob(["pdf"], { type: "application/pdf" }),
      persistDocumento: async () => { throw new Error("simulado: persistência sem rede"); },
      persistHistorico: async () => undefined,
      uploadPdfBucket: async () => "/user/abc.pdf",
    });
    expect(result.allowDelivery).toBe(false);
    expect(result.error).toMatch(/persistência sem rede/);
  });

  it("[RED] 2 etapas passam mas 3ª (upload bucket) falha → allowDelivery false e erro visível", async () => {
    const persist = vi.fn().mockResolvedValue("doc-42");
    const historico = vi.fn().mockResolvedValue(undefined);
    const upload = vi.fn().mockRejectedValue(new Error("storage bucket: permissão negada"));
    const generate = vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" }));

    const result = await runEmissionFailClosed({
      snapshot: FAKE_SNAP,
      acao: "gerou_pdf",
      family: "comum",
      generatePdf: generate,
      persistDocumento: persist,
      persistHistorico: historico,
      uploadPdfBucket: upload,
      saveLocalHistory: async () => undefined,
    });

    // Fail closed: bucket caiu, médico NÃO PODE receber o PDF (vazaria do log)
    expect(result.allowDelivery).toBe(false);
    // Etapas 1 e 2 RODARAM (foram antes da falha)
    expect(persist).toHaveBeenCalledTimes(1);
    expect(historico).toHaveBeenCalledTimes(1);
    // Upload TAMBÉM foi chamado
    expect(upload).toHaveBeenCalledTimes(1);
    // O registro do documento já existe e seu ID é útil para reconciliação;
    // só o PDF não deve ser entregue enquanto o upload falhar.
    expect(result.documentoId).toBe("doc-42");
    expect(result.pdfBlob).toBeUndefined();
    // saveLocalHistory NÃO deve rodar se allowDelivery === false (evitar falsa sensação de salvo).
    expect(result.error).toMatch(/bucket: permissão negada/);
  });

  it("[RED] persistHistorico falha quando há receita → allowDelivery false", async () => {
    const persist = vi.fn().mockResolvedValue("doc-43");
    const historico = vi.fn().mockRejectedValue(new Error("fk_prescricoes_historico_rl_err"));
    const upload = vi.fn().mockResolvedValue("/u/x.pdf");

    const result = await runEmissionFailClosed({
      snapshot: { ...FAKE_SNAP, selected: [{ id: 1, name: "A", text: "B" }] },
      acao: "imprimiu",
      family: "comum",
      generatePdf: async () => new Blob(["a"]),
      persistDocumento: persist,
      persistHistorico: historico,
      uploadPdfBucket: upload,
    });

    expect(result.allowDelivery).toBe(false);
    expect(result.error).toMatch(/fk_prescricoes_historico/);
    // Se falhou no histórico → NÃO tenta enviar o PDF para o bucket
    expect(upload).not.toHaveBeenCalled();
  });

  it("[RED] acao imprimiu ainda sim exige upload bucket → não entrega antes do blob", async () => {
    const callOrder: Array<string> = [];
    const persist = vi.fn().mockImplementation(async () => { callOrder.push("persist"); return "doc-ok"; });
    const historico = vi.fn().mockImplementation(async () => { callOrder.push("historico"); });
    const generate = vi.fn().mockImplementation(async () => { callOrder.push("generate"); return new Blob(["pdf"]); });
    const upload = vi.fn().mockImplementation(async () => { callOrder.push("upload"); return "/u/x.pdf"; });
    const saveLocal = vi.fn().mockImplementation(async () => { callOrder.push("saveLocal"); });

    const result = await runEmissionFailClosed({
      snapshot: FAKE_SNAP,
      acao: "imprimiu",
      family: "comum",
      generatePdf: generate,
      persistDocumento: persist,
      persistHistorico: historico,
      uploadPdfBucket: upload,
      saveLocalHistory: saveLocal,
    });

    expect(result.allowDelivery).toBe(true);
    expect(result.documentoId).toBe("doc-ok");
    expect(result.pdfPath).toBe("/u/x.pdf");
    expect(persist).toHaveBeenCalledTimes(1);
    expect(historico).toHaveBeenCalledTimes(1);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(upload).toHaveBeenCalledTimes(1);
    // A ordem de execução precisa ser ESTA. Se qualquer uma inverter, fail closed quebra
    expect(callOrder).toEqual(["persist", "historico", "generate", "upload", "saveLocal"]);
    // saveLocalHistory só é chamado SE allowDelivery === true (não espalhar dado parcial)
    expect(saveLocal).toHaveBeenCalledTimes(1);
    expect(saveLocal).toHaveBeenCalledWith("doc-ok");
  });

  it("[RED] Não receita (ex: atestado) não chama persistHistorico e ainda passa por bucket", async () => {
    const snap: NewEmissionRecord = {
      ...FAKE_SNAP,
      id: "snap-2",
      action: "atestado",
      selected: [],
      atestado: { dias: 2, justificativa: "Gripe" },
    };
    const persist = vi.fn().mockResolvedValue("doc-10");
    const historico = vi.fn().mockResolvedValue(undefined);
    const upload = vi.fn().mockResolvedValue("/u/atestado.pdf");
    const result = await runEmissionFailClosed({
      snapshot: snap,
      acao: "imprimiu",
      generatePdf: async () => new Blob(["atestado"]),
      persistDocumento: persist,
      persistHistorico: historico,
      uploadPdfBucket: upload,
    });
    expect(result.allowDelivery).toBe(true);
    // prescricoes_historico é tabela SOMENTE de receita; para outros docs não há insert
    expect(historico).not.toHaveBeenCalled();
    expect(upload).toHaveBeenCalledTimes(1);
  });
});

// Satisfazer ts-unused se import não for usado em runtime (teste existe para validar imports)
export type _unused = EmissionLogAction | ReceiptFamily;
