import { describe, expect, it } from "vitest";
import { analyze, parseJsonl } from "./parsers";
import { TABLE_DEFS } from "./schema";

describe("JSONL clinical lote parser", () => {
  it("maps NotebookLM JSONL objects and simple arrays to staging columns", () => {
    const input = [
      "# patologias.jsonl",
      '```jsonl',
      '{"nome_patologia":"Choque séptico","sinonimos":["sepse grave","sepse"],"is_emergencia":true}',
      '```',
    ].join("\n");

    const result = analyze(input, "jsonl", TABLE_DEFS.stg_patologias);

    expect(result.total).toBe(1);
    expect(result.aceitas).toBe(1);
    expect(result.rows[0].data).toMatchObject({
      nome_patologia: "Choque séptico",
      sinonimos: "sepse grave; sepse",
      is_emergencia: "true",
    });
  });

  it("keeps malformed and nested JSON lines visible as rejected rows", () => {
    const parsed = parseJsonl([
      '{"nome_patologia":"Sepse"}',
      "not json",
      '{"nome_patologia":"Choque","metadata":{"source":"x"}}',
    ].join("\n"));
    const result = analyze(
      ['{"nome_patologia":"Sepse"}', "not json", '{"nome_patologia":"Choque","metadata":{"source":"x"}}'].join("\n"),
      "jsonl",
      TABLE_DEFS.stg_patologias,
    );

    expect(parsed.rows).toHaveLength(3);
    expect(result.aceitas).toBe(1);
    expect(result.rejeitadas).toBe(2);
    const messages = result.problemas.map((problem) => problem.mensagem);
    expect(messages.some((message) => message.includes("JSON inválido"))).toBe(true);
    expect(messages.some((message) => message.includes("valores simples"))).toBe(true);
  });
});

describe("NotebookLM Markdown lote parser", () => {
  it("reads the fenced pipe tables used in exported clinical notes", () => {
    const input = [
      "# Protocolos e Diagnósticos Clínicos",
      "```",
      String.raw`nome\_patologia|is\_emergencia|fonte\_id`,
      String.raw`Sepse|SIM|F001`,
      "```",
      "Lacunas do documento não fazem parte da tabela.",
    ].join("\n");

    const result = analyze(input, "markdown", TABLE_DEFS.stg_patologias);

    expect(result.total).toBe(1);
    expect(result.aceitas).toBe(1);
    expect(result.rows[0].data).toMatchObject({
      nome_patologia: "Sepse",
      is_emergencia: "SIM",
      fonte_id: "F001",
    });
  });
});
