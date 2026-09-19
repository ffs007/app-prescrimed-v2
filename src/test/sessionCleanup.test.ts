import { beforeEach, describe, expect, it } from "vitest";
import { clearLocalAppData, ensureLocalDataOwner, isAppDataKey } from "@/lib/sessionCleanup";

describe("sessionCleanup", () => {
  beforeEach(() => localStorage.clear());

  it("classifica somente dados locais do app", () => {
    expect(isAppDataKey("prescrimed:safety-log")).toBe(true);
    expect(isAppDataKey("clinic-info")).toBe(true);
    expect(isAppDataKey("protocolo-sessao:sepse")).toBe(true);
    expect(isAppDataKey("prescrimed:install-banner-dismissed")).toBe(false);
    expect(isAppDataKey("sb-project-auth-token")).toBe(false);
  });

  it("remove dados do app e preserva autenticação e preferências técnicas", () => {
    localStorage.setItem("prescrimed:safety-log", "sensitive");
    localStorage.setItem("clinic-info", "clinic");
    localStorage.setItem("sb-project-auth-token", "auth");
    localStorage.setItem("prescrimed:install-banner-dismissed", "1");
    localStorage.setItem("unrelated", "keep");

    clearLocalAppData();

    expect(localStorage.getItem("prescrimed:safety-log")).toBeNull();
    expect(localStorage.getItem("clinic-info")).toBeNull();
    expect(localStorage.getItem("sb-project-auth-token")).toBe("auth");
    expect(localStorage.getItem("prescrimed:install-banner-dismissed")).toBe("1");
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });

  it("limpa na troca de usuário e mantém dados do mesmo dono", () => {
    expect(ensureLocalDataOwner("user-a")).toBe(true);
    localStorage.setItem("custom-templates", "templates-a");

    expect(ensureLocalDataOwner("user-a")).toBe(false);
    expect(localStorage.getItem("custom-templates")).toBe("templates-a");

    expect(ensureLocalDataOwner("user-b")).toBe(true);
    expect(localStorage.getItem("custom-templates")).toBeNull();
    expect(localStorage.getItem("prescrimed:session-owner")).toBe("user-b");
  });
});
