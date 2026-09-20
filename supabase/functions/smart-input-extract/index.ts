// Etapa 19 — Edge function: extração estruturada de prescrição via Lovable AI.
// kind: "text" | "image" | "audio_text" (o cliente envia o texto já transcrito; OCR/transcrição via vision do Gemini quando kind=image)

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RequestBody {
  kind: "text" | "image" | "file_text";
  payload: string; // texto OU base64 data url da imagem OU texto extraído de arquivo
  contexto?: string;
  mime_type?: string; // para image
}

const SYSTEM_PROMPT = `Você é um assistente clínico que extrai itens estruturados de uma prescrição médica em texto livre.
REGRAS CRÍTICAS:
1) Nunca preencha dose, via, frequência, duração, diluente, volume ou tempo de infusão que NÃO estejam no texto.
2) Marque como ausente o que não estiver explícito.
3) Atribua score de 0 a 100 por item: 90+ se inequívoco; 70-89 se ambíguo leve; 50-69 se faltam dados ou termo incerto; <50 se você não tem certeza.
4) Se um medicamento for ambíguo (ex.: "anfotericina") OU de alto risco, mantenha score abaixo de 90 e descreva no campo alertas.
5) Identifique também exames, orientações, documentos (atestado/encaminhamento/relatório/declaração), cuidados de enfermagem e diagnósticos/CID quando aparecerem.
6) Retorne SOMENTE via tool call extract_prescription. NÃO escreva texto livre.`;

const TOOL = {
  type: "function",
  function: {
    name: "extract_prescription",
    description: "Estrutura itens identificados a partir de um comando clínico.",
    parameters: {
      type: "object",
      properties: {
        confianca_geral: { type: "number", minimum: 0, maximum: 100 },
        alertas_ia: { type: "array", items: { type: "string" } },
        itens: {
          type: "array",
          items: {
            type: "object",
            properties: {
              tipo: {
                type: "string",
                enum: [
                  "medicamento", "exame", "orientacao", "documento",
                  "cuidado_enfermagem", "diagnostico", "nao_reconhecido",
                ],
              },
              texto_original: { type: "string" },
              confianca: { type: "number", minimum: 0, maximum: 100 },
              campos_faltantes: {
                type: "array",
                items: {
                  type: "object",
                  properties: { campo: { type: "string" }, mensagem: { type: "string" } },
                  required: ["campo", "mensagem"],
                },
              },
              campos_ambiguos: { type: "array", items: { type: "string" } },
              alertas: { type: "array", items: { type: "string" } },
              // medicamento
              principio_ativo: { type: ["string", "null"] },
              nome_comercial: { type: ["string", "null"] },
              dose: { type: ["string", "null"] },
              unidade: { type: ["string", "null"] },
              via: { type: ["string", "null"] },
              frequencia: { type: ["string", "null"] },
              duracao: { type: ["string", "null"] },
              diluente: { type: ["string", "null"] },
              volume_diluicao: { type: ["string", "null"] },
              tempo_infusao: { type: ["string", "null"] },
              velocidade: { type: ["string", "null"] },
              condicao_uso: { type: ["string", "null"] },
              observacoes: { type: ["string", "null"] },
              // exame
              nome: { type: ["string", "null"] },
              categoria: { type: ["string", "null"] },
              prioridade: { type: ["string", "null"] },
              justificativa: { type: ["string", "null"] },
              // orientacao
              texto: { type: ["string", "null"] },
              sinais_alerta: { type: ["string", "null"] },
              retorno: { type: ["string", "null"] },
              // documento
              subtipo: { type: ["string", "null"] },
              conteudo: { type: ["string", "null"] },
              duracao_dias: { type: ["number", "null"] },
              // cuidado_enfermagem
              cuidado: { type: ["string", "null"] },
              observacao: { type: ["string", "null"] },
              condicao: { type: ["string", "null"] },
              // diagnostico
              hipotese: { type: ["string", "null"] },
              cid: { type: ["string", "null"] },
              queixa: { type: ["string", "null"] },
              sindrome: { type: ["string", "null"] },
            },
            required: ["tipo", "texto_original", "confianca"],
          },
        },
      },
      required: ["itens", "confianca_geral"],
    },
  },
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method-not-allowed" });

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid-json" });
  }
  if (!body.payload || typeof body.payload !== "string") {
    return json(400, { error: "missing-payload" });
  }

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return json(500, { error: "missing-api-key" });

  const isImage = body.kind === "image";
  const model = isImage ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

  const userContent: unknown = isImage
    ? [
        {
          type: "text",
          text:
            "Extraia itens estruturados desta prescrição/imagem. Se a imagem estiver ilegível, defina confianca_geral baixa e itens=[]." +
            (body.contexto ? `\nContexto: ${body.contexto}` : ""),
        },
        { type: "image_url", image_url: { url: body.payload } },
      ]
    : `Texto da prescrição:\n${body.payload}\n${body.contexto ? `Contexto: ${body.contexto}` : ""}`;

  let aiResp: Response;
  try {
    aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "extract_prescription" } },
      }),
    });
  } catch (e) {
    console.error("smart-input-extract: ai-unreachable", e);
    return json(502, { error: "ai-unreachable" });
  }

  if (aiResp.status === 429) return json(429, { error: "rate-limited" });
  if (aiResp.status === 402) return json(402, { error: "credits-exhausted" });
  if (!aiResp.ok) {
    console.error("smart-input-extract: ai-error", (await aiResp.text()).slice(0, 500));
    return json(502, { error: "ai-error" });
  }

  const data = await aiResp.json();
  const call = data?.choices?.[0]?.message?.tool_calls?.[0];
  if (!call?.function?.arguments) {
    return json(200, { itens: [], confianca_geral: 0, alertas_ia: ["IA não conseguiu estruturar o conteúdo."] });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(call.function.arguments);
  } catch {
    return json(200, { itens: [], confianca_geral: 0, alertas_ia: ["Resposta da IA inválida."] });
  }

  return json(200, parsed);
});
