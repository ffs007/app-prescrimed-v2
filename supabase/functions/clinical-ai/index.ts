// Passo 5 — Conferência e sugestão clínica por IA (gateway de IA da plataforma).
// Recebe patologia + ambiente + perfil do paciente + itens da prescrição atual
// e devolve sugestões estruturadas + alertas de segurança. Nunca prescreve sozinho:
// tudo volta como sugestão para revisão médica.

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  patologia?: string;
  ambiente?: string;
  paciente?: {
    idade?: string | null;
    peso?: string | null;
    pediatrico?: boolean;
    gestante?: boolean;
    alergias?: string | null;
    renal?: boolean;
    hepatico?: boolean;
    comorbidades?: string | null;
  };
  medicamentos?: string[];
  exames?: string[];
  pergunta?: string;
  /** "biblioteca" = busca online de protocolos/escores oficiais. */
  modo?: "apoio" | "biblioteca";
  /** Tema/patologia a pesquisar no modo biblioteca. */
  tema?: string;
}

const SYSTEM_PROMPT = `Você é um assistente clínico de apoio à decisão para médicos brasileiros em ambulatório, urgência/PS e emergência/sala vermelha.
REGRAS CRÍTICAS:
1) Você NÃO prescreve: você sugere e confere. Todo item é uma sugestão para revisão médica.
2) Baseie-se em diretrizes brasileiras (SBC, AMB, Ministério da Saúde) e internacionais consagradas. Se não houver evidência sólida, diga.
3) Priorize segurança: aponte contraindicações, ajustes por função renal/hepática, gestação/lactação, pediatria, interações e dose máxima.
4) Adeque a urgência ao ambiente informado (na sala vermelha, condutas tempo-dependentes primeiro).
5) Seja curto e acionável: frases diretas, sem enrolação, sem repetir o enunciado.
6) Responda SOMENTE via tool call clinical_support.`;

const TOOL = {
  type: "function",
  function: {
    name: "clinical_support",
    description: "Sugestões e conferência clínica estruturadas.",
    parameters: {
      type: "object",
      properties: {
        resumo: { type: "string", description: "1 a 2 frases sobre a abordagem da condição neste ambiente." },
        condutas: {
          type: "array",
          description: "Condutas sugeridas, em ordem de prioridade.",
          items: {
            type: "object",
            properties: {
              titulo: { type: "string" },
              detalhe: { type: "string" },
              prioridade: { type: "string", enum: ["imediata", "alta", "media", "baixa"] },
            },
            required: ["titulo", "detalhe", "prioridade"],
          },
        },
        medicamentos_sugeridos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nome: { type: "string" },
              posologia: { type: "string" },
              observacao: { type: ["string", "null"] },
            },
            required: ["nome", "posologia"],
          },
        },
        exames_sugeridos: { type: "array", items: { type: "string" } },
        alertas: {
          type: "array",
          description: "Riscos identificados na prescrição atual ou no perfil do paciente.",
          items: {
            type: "object",
            properties: {
              gravidade: { type: "string", enum: ["critico", "atencao", "informativo"] },
              mensagem: { type: "string" },
            },
            required: ["gravidade", "mensagem"],
          },
        },
        escores_recomendados: { type: "array", items: { type: "string" } },
        referencias: { type: "array", items: { type: "string" } },
      },
      required: ["resumo", "condutas", "alertas"],
    },
  },
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------------------------------------------------------------------------
// Modo biblioteca — busca online de protocolos e escores oficiais.
// Usa Perplexity (busca com fontes) quando a chave está configurada; sem ela,
// cai para o gateway de IA da plataforma. Retorna sempre itens REVISÁVEIS.
// ---------------------------------------------------------------------------

const LIBRARY_SCHEMA = {
  type: "object",
  properties: {
    itens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["protocolo", "escore", "trial", "fluxograma"] },
          nome: { type: "string" },
          descricao: { type: "string" },
          patologias: { type: "array", items: { type: "string" } },
          especialidade: { type: "string" },
          gravidade: { type: "string", enum: ["leve", "moderada", "grave", "critica"] },
          ambientes: {
            type: "array",
            items: { type: "string", enum: ["ambulatorial", "urgencia", "emergencia"] },
          },
          referencia: { type: "string" },
          url: { type: "string" },
        },
        required: ["kind", "nome", "descricao", "patologias", "referencia"],
      },
    },
  },
  required: ["itens"],
};

const LIBRARY_PROMPT = `Você pesquisa protocolos, escores, trials e fluxogramas clínicos OFICIAIS para médicos brasileiros.
Regras:
1) Liste apenas itens reais e verificáveis, com a fonte/diretriz de origem (SBC, AMB, Ministério da Saúde, SBP, ACC/AHA, ESC, Surviving Sepsis, NICE etc.) e o ano da versão.
2) Prefira a versão mais recente de cada diretriz.
3) Nunca invente nomes, siglas ou links. Se não tiver certeza da URL, omita a URL.
4) Traga entre 5 e 12 itens, sem repetir o mesmo item.
5) Responda somente no formato JSON pedido.`;

async function searchLibrary(tema: string, lovableKey: string | undefined) {
  const pplxKey = Deno.env.get("PERPLEXITY_API_KEY");
  const userMsg = `Tema: ${tema}. Liste protocolos, escores, trials e fluxogramas oficiais aplicáveis, indicando patologias associadas, especialidade, gravidade típica e ambientes (ambulatorial, urgencia, emergencia).`;

  if (pplxKey) {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${pplxKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: LIBRARY_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "biblioteca_clinica", schema: LIBRARY_SCHEMA },
        },
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text();
      if (resp.status === 401 && detail.includes("insufficient_quota")) {
        return { error: "perplexity-sem-creditos" } as const;
      }
      console.error("clinical-ai: perplexity", resp.status, detail.slice(0, 500));
      return { error: "perplexity-erro", status: resp.status } as const;
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    const citations: string[] = data?.citations ?? [];
    try {
      const parsed = JSON.parse(content);
      return { itens: parsed.itens ?? [], citations, fonte: "perplexity" } as const;
    } catch {
      console.error("clinical-ai: resposta-invalida", String(content).slice(0, 500));
      return { error: "resposta-invalida" } as const;
    }
  }

  if (!lovableKey) return { error: "missing-api-key" } as const;
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      messages: [
        { role: "system", content: LIBRARY_PROMPT },
        { role: "user", content: userMsg },
      ],
      tools: [
        {
          type: "function",
          function: { name: "biblioteca_clinica", description: "Itens da biblioteca clínica.", parameters: LIBRARY_SCHEMA },
        },
      ],
      tool_choice: { type: "function", function: { name: "biblioteca_clinica" } },
    }),
  });
  if (resp.status === 429) return { error: "rate-limited" } as const;
  if (resp.status === 402) return { error: "credits-exhausted" } as const;
  if (!resp.ok) {
    console.error("clinical-ai: ai-error", (await resp.text()).slice(0, 500));
    return { error: "ai-error" } as const;
  }
  const data = await resp.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  try {
    return { itens: JSON.parse(args ?? "{}").itens ?? [], citations: [], fonte: "gateway" } as const;
  } catch {
    return { error: "resposta-invalida" } as const;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method-not-allowed" });

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid-json" });
  }

  if (body.modo === "biblioteca") {
    const tema = (body.tema ?? body.patologia ?? "").trim();
    if (!tema) return json(400, { error: "missing-tema" });
    const result = await searchLibrary(tema, Deno.env.get("LOVABLE_API_KEY"));
    if ("error" in result) {
      const status = result.error === "rate-limited" ? 429 : result.error === "credits-exhausted" ? 402 : 502;
      return json(status, result);
    }
    return json(200, result);
  }

  if (!body.patologia && !body.pergunta) return json(400, { error: "missing-context" });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json(500, { error: "missing-api-key" });

  const p = body.paciente ?? {};
  const perfil = [
    p.idade ? `idade ${p.idade}` : null,
    p.peso ? `peso ${p.peso} kg` : null,
    p.pediatrico ? "pediátrico" : null,
    p.gestante ? "gestante" : null,
    p.renal ? "disfunção renal" : null,
    p.hepatico ? "disfunção hepática" : null,
    p.alergias ? `alergias: ${p.alergias}` : null,
    p.comorbidades ? `comorbidades: ${p.comorbidades}` : null,
  ].filter(Boolean).join("; ") || "sem dados relevantes informados";

  const userContent = [
    `Patologia/condição: ${body.patologia ?? "não informada"}`,
    `Ambiente de atendimento: ${body.ambiente ?? "não informado"}`,
    `Perfil do paciente: ${perfil}`,
    `Prescrição atual: ${(body.medicamentos ?? []).join(" | ") || "vazia"}`,
    `Exames já solicitados: ${(body.exames ?? []).join(" | ") || "nenhum"}`,
    body.pergunta ? `Pergunta do médico: ${body.pergunta}` : "",
  ].filter(Boolean).join("\n");

  let aiResp: Response;
  try {
    aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "clinical_support" } },
      }),
    });
  } catch (e) {
    console.error("clinical-ai: ai-unreachable", e);
    return json(502, { error: "ai-unreachable" });
  }

  if (aiResp.status === 429) return json(429, { error: "rate-limited" });
  if (aiResp.status === 402) return json(402, { error: "credits-exhausted" });
  if (!aiResp.ok) {
    console.error("clinical-ai: ai-error", (await aiResp.text()).slice(0, 500));
    return json(502, { error: "ai-error" });
  }

  const data = await aiResp.json();
  const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!args) return json(200, { resumo: "", condutas: [], alertas: [] });
  try {
    return json(200, JSON.parse(args));
  } catch {
    return json(200, { resumo: "", condutas: [], alertas: [{ gravidade: "informativo", mensagem: "Resposta da IA inválida." }] });
  }
});
