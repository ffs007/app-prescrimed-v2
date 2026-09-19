import { describe, expect, it } from "vitest";
import { summarizeCheckoutFunnel, type UsageEventRow } from "./useUsageStats";

const event = (userId: string, tipo: string, recurso: string | null = null): UsageEventRow => ({
  id: `${userId}-${tipo}-${recurso ?? "none"}-${Math.random()}`,
  user_id: userId,
  tipo,
  rota: null,
  recurso,
  criado_em: "2026-09-19T12:00:00.000Z",
});

describe("summarizeCheckoutFunnel", () => {
  it("calcula conversão por usuários únicos", () => {
    const summary = summarizeCheckoutFunnel([
      event("u1", "checkout_inicio", "pro_monthly"),
      event("u1", "checkout_inicio", "pro_monthly"),
      event("u2", "checkout_inicio", "pro_yearly"),
      event("u1", "checkout_aberto", "pro_monthly"),
      event("u1", "checkout_retorno", "pendente"),
      event("u1", "checkout_retorno", "ativo"),
      event("u2", "checkout_erro", "pro_yearly"),
      event("u2", "checkout_erro", "pro_yearly"),
    ]);

    expect(summary).toEqual({
      started: 2,
      opened: 1,
      activated: 1,
      errors: 2,
      openRate: 50,
      activationRate: 50,
      monthlyInterest: 1,
      yearlyInterest: 1,
    });
  });

  it("retorna percentuais zero sem início de checkout", () => {
    expect(summarizeCheckoutFunnel([]).openRate).toBe(0);
    expect(summarizeCheckoutFunnel([]).activationRate).toBe(0);
  });
});
