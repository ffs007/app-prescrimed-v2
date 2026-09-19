import { describe, expect, it } from "vitest";
import { isPlanId } from "./plans";

describe("isPlanId", () => {
  it.each(["pro_monthly", "pro_yearly"])("aceita o plano %s", (plan) => {
    expect(isPlanId(plan)).toBe(true);
  });

  it.each([null, "", "price_123", "javascript:alert(1)"])("rejeita o valor %s", (value) => {
    expect(isPlanId(value)).toBe(false);
  });
});
