// Edge function: extrai dados estruturados de medicamento IV a partir de texto
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PARAMETERS = {
  type: "object",
  properties: {
    principio_ativo: { type: "string" },
    nome_comercial_referencia: { type: "string" },
    apresentacao: { type: "string" },
    via_administracao: { type: "string" },
    volume_reconstituicao: { type: "string" },
    diluente_reconstituicao: { type: "string" },
    estabilidade_apos_reconstituicao: { type: "string" },
    volume_expansao_pos_reconstituicao: { type: "string" },
    solucoes_compativeis: { type: "array", items: { type: "string" } },
    volume_diluicao: { type: "string" },
    estabilidade_apos_diluicao: { type: "string" },
    concentracao_maxima: { type: "string" },
    tempo_minimo_infusao: { type: "string" },
    velocidade_maxima_infusao: { type: "string" },
    ph: { type: "string" },
    observacoes_gerais: { type: "string" },
    risco_flebite: { type: "boolean" },
    exige_fotoprotecao: { type: "boolean" },
    exige_equipo_fotossensivel: { type: "boolean" },
    exige_filtro: { type: "boolean" },
    incompatibilidades: { type: "array", items: { type: "string" } },
    nivel_alerta: { type: "string", enum: ["baixo", "medio", "alto"] },
    alerta_medico: { type: "string" },
    alerta_enfermagem_farmacia: { type: "string" },
    fonte_referencia: { type: "string" },
    confianca_por_campo: {
      type: "object",
      description:
        "Confiança 0-1 por nome de campo. Inclua APENAS campos extraídos.",
      additionalProperties: { type: "number" },
    },
  },
  required: ["principio_ativo", "confianca_por_campo"],
  additionalProperties: false,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { texto } = await req.json();
    if (!texto || typeof texto !== "string" || texto.length < 5) {
      return new Response(JSON.stringify({ error: "Texto inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY ausente");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Você é um farmacêutico clínico. Extraia dados de diluição/administração IV do texto fornecido em campos estruturados. Use português. Não invente dados ausentes — só inclua campos com informação no texto. Para cada campo extraído, atribua uma confiança 0-1 em confianca_por_campo (1 = certeza total).",
          },
          { role: "user", content: texto },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "registrar_medicamento_iv",
              description: "Registra os dados extraídos do medicamento IV.",
              parameters: PARAMETERS,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "registrar_medicamento_iv" } },
      }),
    });

    if (resp.status === 429)
      return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402)
      return new Response(JSON.stringify({ error: "Créditos esgotados na IA. Adicione créditos na workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gw error", resp.status, t);
      return new Response(JSON.stringify({ error: "Falha na IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "IA não retornou estrutura" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const args = JSON.parse(call.function.arguments);
    const conf = args.confianca_por_campo ?? {};
    const baixa_confianca = Object.entries(conf)
      .filter(([, v]) => typeof v === "number" && (v as number) < 0.7)
      .map(([k]) => k);
    delete args.confianca_por_campo;

    return new Response(JSON.stringify({ campos: args, baixa_confianca, confianca: conf }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("iv-extract error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
