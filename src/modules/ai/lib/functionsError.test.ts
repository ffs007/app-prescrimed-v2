import { describe, expect, it } from "vitest";
import { readFunctionErrorMessage } from "./functionsError";

function errorWithContext(body: unknown, ok = false) {
  return {
    message: "Edge Function returned a non-2xx status code",
    context: { json: async () => body, ok },
  };
}

describe("readFunctionErrorMessage", () => {
  it("mapeia código de erro conhecido no corpo JSON", async () => {
    const msg = await readFunctionErrorMessage(errorWithContext({ error: "assinatura-necessaria" }), "fallback");
    expect(msg).toBe("Recurso exclusivo do plano Pro. Assine para usar.");
  });

  it("usa fallback quando código não é mapeado", async () => {
    const msg = await readFunctionErrorMessage(errorWithContext({ error: "codigo-desconhecido" }), "fallback");
    expect(msg).toBe("fallback");
  });

  it("usa fallback quando corpo não é JSON válido", async () => {
    const err = { message: "boom", context: { json: async () => { throw new Error("not json"); } } };
    const msg = await readFunctionErrorMessage(err, "fallback");
    expect(msg).toBe("fallback");
  });

  it("usa error.message quando não há context", async () => {
    const msg = await readFunctionErrorMessage(new Error("falha de rede"), "fallback");
    expect(msg).toBe("falha de rede");
  });

  it("usa fallback quando não há context nem message", async () => {
    const msg = await readFunctionErrorMessage(null, "fallback");
    expect(msg).toBe("fallback");
  });
});
