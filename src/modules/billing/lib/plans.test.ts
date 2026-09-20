import { describe, expect, it } from "vitest";
import { getSignupDestination, isPlanId } from "./plans";

describe("isPlanId", () => {
  it.each(["pro_monthly", "pro_yearly"])("aceita o plano %s", (plan) => {
    expect(isPlanId(plan)).toBe(true);
  });

  it.each([null, "", "price_123", "javascript:alert(1)"])("rejeita o valor %s", (value) => {
    expect(isPlanId(value)).toBe(false);
  });
});

describe("getSignupDestination", () => {
  it("leva cadastro gratuito direto à primeira prescrição", () => {
    expect(getSignupDestination(null)).toBe("/app/prescricao/nova");
    expect(getSignupDestination("invalido")).toBe("/app/prescricao/nova");
  });

  it("preserva o plano escolhido até o checkout", () => {
    expect(getSignupDestination("pro_monthly")).toBe("/app/assinatura?plan=pro_monthly");
    expect(getSignupDestination("pro_yearly")).toBe("/app/assinatura?plan=pro_yearly");
  });
});
