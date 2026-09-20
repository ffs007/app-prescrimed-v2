import { describe, expect, it, vi } from "vitest";
import { Constants } from "@/integrations/supabase/types";
import type { DocumentAction } from "@/modules/prescription/components/ActionGrid";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { resolveDocumentoTipo } from "./persistEmission";

const ACTIONS: DocumentAction[] = [
  "receita", "exames", "encaminhamento", "atestado", "declaracao", "relatorio",
  "orientacoes", "procedimento", "aih", "apac", "notificacao",
];

describe("resolveDocumentoTipo", () => {
  it("mapeia as 11 emissões do ActionGrid para valores existentes do enum documento_tipo", () => {
    const enumValues: readonly string[] = Constants.public.Enums.documento_tipo;
    for (const action of ACTIONS) {
      expect(enumValues).toContain(resolveDocumentoTipo(action));
    }
  });

  it("diferencia AIH, APAC, notificação compulsória e procedimento", () => {
    expect(resolveDocumentoTipo("aih")).toBe("aih");
    expect(resolveDocumentoTipo("apac")).toBe("apac");
    expect(resolveDocumentoTipo("notificacao")).toBe("notificacao_compulsoria");
    expect(resolveDocumentoTipo("procedimento")).toBe("procedimento");
  });

  it("classifica a receita pela família regulatória", () => {
    expect(resolveDocumentoTipo("receita")).toBe("receita_comum");
    expect(resolveDocumentoTipo("receita", "controle-especial")).toBe("receita_controle_especial");
    expect(resolveDocumentoTipo("receita", "antimicrobiano")).toBe("receita_antimicrobiano");
    expect(resolveDocumentoTipo("receita", "notificacao-A")).toBe("receita_controlado_especifico");
    expect(resolveDocumentoTipo("receita", "notificacao-B")).toBe("receita_controlado_especifico");
  });
});
