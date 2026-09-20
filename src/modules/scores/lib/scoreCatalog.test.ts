import { describe, expect, it } from "vitest";
import { LIST_SIZES, SCORE_DEFINITIONS, SCORE_GROUPS, SCORE_META, findScore, paramLabel, paramOptions } from "./scoreCatalog";
import { buildArgs, initialValues, normalizeOutcome, outcomeToText } from "./scoreRunner";

describe("catálogo de escores do servidor", () => {
  it("cobre as 68 funções fn_calcular_* sem duplicidade", () => {
    expect(SCORE_DEFINITIONS).toHaveLength(68);
    expect(new Set(SCORE_DEFINITIONS.map((s) => s.id)).size).toBe(68);
    expect(new Set(SCORE_DEFINITIONS.map((s) => s.fn)).size).toBe(68);
  });

  it("todo escore tem título, especialidade conhecida e nenhuma meta órfã", () => {
    for (const s of SCORE_DEFINITIONS) {
      expect(SCORE_META[s.id], s.id).toBeDefined();
      expect(SCORE_GROUPS).toContain(s.group);
    }
    const ids = new Set(SCORE_DEFINITIONS.map((s) => s.id));
    for (const id of Object.keys(SCORE_META)) expect(ids.has(id), id).toBe(true);
  });

  it("parâmetros de lista têm tamanho definido", () => {
    for (const s of SCORE_DEFINITIONS)
      for (const p of s.params.filter((x) => x.kind === "list")) expect(LIST_SIZES[p.name], `${s.id}.${p.name}`).toBeGreaterThan(0);
  });

  it("rótulos usam unidade e acentuação", () => {
    expect(paramLabel("p_pas")).toBe("PAS (mmHg)");
    expect(paramLabel("p_funcao_hepatica_anormal")).toBe("Função hepática anormal");
    expect(paramLabel("p_frequencia_cardiaca_pts")).toBe("Frequência cardíaca (pontos)");
  });

  it("consciência tem opções distintas para NEWS2 e MEWS obstétrico", () => {
    expect(paramOptions("news2", "p_consciencia")?.map((o) => o.value)).toEqual(["A", "C", "V", "P", "U"]);
    expect(paramOptions("mews_ob", "p_consciencia")?.[0].value).toBe("alerta");
  });
});

describe("montagem de argumentos", () => {
  const qsofa = findScore("qsofa")!;
  const ctx = { atendimentoId: "atd-1", ageYears: "54" };

  it("bloqueia envio com obrigatórios vazios e aponta quais", () => {
    const { missing } = buildArgs(qsofa, { atendimentoId: "atd-1", ageYears: "" }, initialValues(qsofa));
    expect(missing).toContain("Idade (anos)");
    expect(missing).toContain("FR (irpm)");
    expect(missing).toContain("PAS (mmHg)");
  });

  it("converte números com vírgula, inteiros na idade e booleanos", () => {
    const values = { ...initialValues(qsofa), p_fr: "24", p_pas: "95,5", p_consciencia_alterada: true };
    const { args, missing } = buildArgs(qsofa, { ...ctx, ageYears: "54,7" }, values);
    expect(missing).toEqual([]);
    expect(args).toMatchObject({ p_atendimento_id: "atd-1", p_idade: 54, p_fr: 24, p_pas: 95.5, p_consciencia_alterada: true });
    expect(args).not.toHaveProperty("p_red_flag");
  });

  it("monta lista completa do AUDIT e rejeita lista incompleta", () => {
    const audit = findScore("audit")!;
    const empty = buildArgs(audit, ctx, initialValues(audit));
    expect(empty.missing).toContain("Respostas do AUDIT");
    const full = buildArgs(audit, ctx, { ...initialValues(audit), p_itens: ["1", "0", "2", "0", "0", "1", "0", "0", "0", "0"] });
    expect(full.args.p_itens).toEqual([1, 0, 2, 0, 0, 1, 0, 0, 0, 0]);
  });

  it("escores neonatais sem parâmetro de idade não exigem idade", () => {
    const apgar = findScore("apgar")!;
    expect(apgar.ageParam).toBeNull();
    expect(buildArgs(apgar, { atendimentoId: "a", ageYears: "" }, initialValues(apgar)).missing).not.toContain("Idade (anos)");
  });

  it("mantém padrões do banco (contexto) nos valores iniciais", () => {
    expect(initialValues(findScore("apache2")!).p_contexto).toBe("uti_adulto");
  });
});

describe("normalização do resultado", () => {
  it("separa campos padrão dos extras e classifica o tom", () => {
    const o = normalizeOutcome({
      status: "CALCULATED", total: 3, categoria: "risco_elevado", resposta: "Ativar protocolo", versao: "1.0",
      limitacoes: null, populacao_validada: true, red_flag_override: false, mortalidade_prevista: 12.5,
    });
    expect(o.tone).toBe("ok");
    expect(o.total).toBe(3);
    expect(o.extras).toEqual([
      { label: "Sinal de alarme acionado (override)", value: "Não" },
      { label: "Mortalidade prevista", value: "12.5" },
    ]);
    expect(outcomeToText(findScore("qsofa")!, o)).toContain("qSOFA: 3 pontos — risco elevado");
  });

  it("status BLOCKED e ENTRADAS_INCOMPLETAS não são tratados como sucesso", () => {
    expect(normalizeOutcome({ status: "BLOCKED", resposta: "x" }).tone).toBe("blocked");
    expect(normalizeOutcome({ status: "ENTRADAS_INCOMPLETAS", resposta: "x" }).tone).toBe("warning");
  });
});
