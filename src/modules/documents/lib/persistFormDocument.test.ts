import { beforeEach, describe, expect, it, vi } from "vitest";

const single = vi.fn();
const insert = vi.fn(() => ({ select: () => ({ single }) }));
const getUser = vi.fn();
const logDocumentAction = vi.fn();
const recordCriticalEvent = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: { getUser: () => getUser() }, from: () => ({ insert }) },
}));
vi.mock("./documentSave", () => ({ logDocumentAction: (a: unknown) => logDocumentAction(a) }));
vi.mock("@/modules/security/lib/auditClient", () => ({ recordCriticalEvent: (a: unknown) => recordCriticalEvent(a) }));
vi.mock("./pdfPrint", () => ({ hashDocument: async () => "hash-1", shortValidationCode: () => "ABC123" }));

import { persistFormDocument } from "./persistEmission";

const args = {
  tipo: "aih" as const,
  titulo: "AIH — Fulano",
  resumo: "resumo",
  campos: { pacienteNome: "Fulano" },
  acao: "imprimiu" as const,
};

describe("persistFormDocument (fail-closed das bancadas de AIH e notificação)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  });

  it("grava em documentos_gerados, registra o log e a auditoria, e devolve o id", async () => {
    single.mockResolvedValue({ data: { id: "doc-1" }, error: null });
    await expect(persistFormDocument(args)).resolves.toBe("doc-1");
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      tipo: "aih", gerado_por: "u1", hash_documento: "hash-1", codigo_validacao: "ABC123", status: "gerado",
    }));
    expect(logDocumentAction).toHaveBeenCalledWith({ id_documento: "doc-1", tipo_documento: "aih", acao: "imprimiu" });
    expect(recordCriticalEvent).toHaveBeenCalledTimes(1);
  });

  it("lança erro quando a gravação falha, sem log nem auditoria (o documento não pode sair)", async () => {
    single.mockResolvedValue({ data: null, error: new Error("rls") });
    await expect(persistFormDocument(args)).rejects.toThrow("rls");
    expect(logDocumentAction).not.toHaveBeenCalled();
    expect(recordCriticalEvent).not.toHaveBeenCalled();
  });

  it("lança erro sem sessão e nem tenta gravar", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(persistFormDocument(args)).rejects.toThrow(/Sessão expirada/);
    expect(insert).not.toHaveBeenCalled();
  });

  it("limita o resumo a 2000 caracteres", async () => {
    single.mockResolvedValue({ data: { id: "doc-2" }, error: null });
    await persistFormDocument({ ...args, resumo: "x".repeat(5000) });
    const row = (insert.mock.calls[0] as unknown as [{ conteudo_resumido: string }])[0];
    expect(row.conteudo_resumido).toHaveLength(2000);
  });
});
