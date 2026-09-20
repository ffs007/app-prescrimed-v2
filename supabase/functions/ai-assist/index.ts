// Módulo de IA do PrescriMed: chatbot, assistente de documentos, busca de
// atualizações clínicas e validação de templates.
//
// Provedores, em ordem de preferência (chaves fornecidas pelo próprio médico):
//   - OpenRouter (preferindo Claude) para redação/revisão de documentos e chat
//   - Perplexity (busca com fontes) para atualizações, protocolos e evidências
//   - Gateway de IA da plataforma como fallback
//
// Nunca decide sozinho: todo retorno é sugestão revisável pelo médico.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, data: unknown) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const DISCLAIMER =
  "Conteúdo de apoio: não substitui o julgamento clínico do médico responsável.";

const CHAT_PROMPT = `Você é o assistente do PrescriMed, aplicativo brasileiro de prescrição e documentos clínicos.
Você ajuda em duas frentes:
1) Uso do app: fluxo de nova prescrição (ambiente -> patologia -> tipo de documento), Minhas Patologias, Protocolos & Escores, Internações (AIH), Notificações Compulsórias, Documentos e Indicadores.
2) Apoio clínico: sugestão de condutas, protocolos e escores aplicáveis, sempre baseada em diretrizes (SBC, AMB, Ministério da Saúde, SBP, ACC/AHA, ESC, Surviving Sepsis, NICE).
Regras:
- Cite a diretriz e o ano sempre que fizer afirmação clínica; não invente referência nem link.
- Seja curto, direto e acionável. Português do Brasil.
- Nunca decida pelo médico. Encerre respostas clínicas com o aviso: "${DISCLAIMER}"`;

const DOC_PROMPT = `Você é assistente de redação de documentos médicos brasileiros (prescrição, encaminhamento, AIH, notificação compulsória, laudo, relatório, atestado).
Regras:
- Escreva em português técnico, objetivo e impessoal, no padrão de documento médico.
- Não invente dados clínicos, exames, datas ou valores que não estejam nas anotações recebidas. Se algo essencial faltar, marque com [preencher: ...].
- Quando pedirem justificativa para auditoria, fundamente em critérios objetivos (gravidade, falha terapêutica, achados, CID).
- Sugira CIDs apenas quando houver suporte no texto, indicando código e descrição.
- Entregue somente o texto final do documento, sem comentários fora dele.`;

const UPDATE_SCHEMA = {
  type: "object",
  properties: {
    itens: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["protocolo", "escore", "trial", "fluxograma", "diretriz"] },
          titulo: { type: "string" },
          resumo: { type: "string" },
          conteudo_novo: { type: "string" },
          referencia: { type: "string" },
          url: { type: "string" },
        },
        required: ["tipo", "titulo", "resumo", "conteudo_novo", "referencia"],
      },
    },
  },
  required: ["itens"],
};

const UPDATE_PROMPT = `Você monitora atualizações de diretrizes, protocolos, escores e ensaios clínicos relevantes para a prática médica brasileira.
Regras:
1) Liste apenas itens reais e verificáveis, com fonte e ano da versão.
2) Priorize o que mudou recentemente ou o que é novo em relação à prática consolidada.
3) Em "conteudo_novo", escreva o texto de protocolo pronto para revisão médica (condutas objetivas, em tópicos).
4) Nunca invente links; omita a URL se não tiver certeza.
5) De 3 a 8 itens. Responda somente no JSON pedido.`;

interface Body {
  modo: "chat" | "documento" | "atualizacoes" | "validar_template";
  mensagens?: Array<{ role: "user" | "assistant"; content: string }>;
  // documento
  tipo_documento?: string;
  acao?: "rascunho" | "revisar" | "justificativa" | "cids";
  anotacoes?: string;
  texto?: string;
  // atualizações / template
  patologia?: string;
  template?: string;
}

async function callOpenRouter(key: string, model: string, messages: unknown[]) {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages }),
  });
  if (!resp.ok) {
    console.error("ai-assist: openrouter", resp.status, (await resp.text()).slice(0, 500));
    return { error: "openrouter-erro", status: resp.status } as const;
  }
  const data = await resp.json();
  return { texto: data?.choices?.[0]?.message?.content ?? "", fonte: "openrouter", modelo: model } as const;
}

async function callGateway(key: string, messages: unknown[]) {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3.8-flash", messages }),
  });
  if (resp.status === 429) return { error: "rate-limited" } as const;
  if (resp.status === 402) return { error: "credits-exhausted" } as const;
  if (!resp.ok) {
    console.error("ai-assist: ai-error", (await resp.text()).slice(0, 500));
    return { error: "ai-error" } as const;
  }
  const data = await resp.json();
  return { texto: data?.choices?.[0]?.message?.content ?? "", fonte: "gateway", modelo: "google/gemini-3.8-flash" } as const;
}

async function searchPerplexity(key: string, system: string, user: string, schema?: unknown) {
  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      ...(schema ? { response_format: { type: "json_schema", json_schema: { name: "resultado", schema } } } : {}),
    }),
  });
  if (!resp.ok) {
    console.error("ai-assist: perplexity", resp.status, (await resp.text()).slice(0, 500));
    return { error: "perplexity-erro", status: resp.status } as const;
  }
  const data = await resp.json();
  return {
    texto: data?.choices?.[0]?.message?.content ?? "",
    referencias: (data?.citations ?? []) as string[],
    fonte: "perplexity",
    modelo: "sonar-pro",
  } as const;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method-not-allowed" });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid-json" });
  }

  // Identifica o médico e lê as chaves dele (nunca expostas ao navegador).
  const authHeader = req.headers.get("Authorization") ?? "";
  const supaUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(supaUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await anon.auth.getUser();
  const user = userData?.user;
  if (!user) return json(401, { error: "nao-autenticado" });

  const admin = createClient(supaUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: cred } = await admin
    .from("ia_credenciais_usuario")
    .select("perplexity_key, openrouter_key, modelo_preferido")
    .eq("user_id", user.id)
    .maybeSingle();

  const openrouterKey = (cred?.openrouter_key ?? "").trim();
  const perplexityKey = (cred?.perplexity_key ?? "").trim() || (Deno.env.get("PERPLEXITY_API_KEY") ?? "");
  const modelo = (cred?.modelo_preferido ?? "").trim() || "anthropic/claude-sonnet-4";
  const lovableKey = Deno.env.get("LOVABLE_API_KEY") ?? "";

  const run = async (system: string, userContent: string, preferSearch = false) => {
    if (preferSearch && perplexityKey) {
      const r = await searchPerplexity(perplexityKey, system, userContent);
      if (!("error" in r)) return r;
    }
    if (openrouterKey) {
      const r = await callOpenRouter(openrouterKey, modelo, [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ]);
      if (!("error" in r)) return r;
    }
    if (!lovableKey) return { error: "missing-api-key" } as const;
    return await callGateway(lovableKey, [
      { role: "system", content: system },
      { role: "user", content: userContent },
    ]);
  };

  try {
    if (body.modo === "chat") {
      const msgs = (body.mensagens ?? []).slice(-16);
      if (!msgs.length) return json(400, { error: "missing-messages" });
      const history = [{ role: "system", content: CHAT_PROMPT }, ...msgs];
      let result: Record<string, unknown>;
      if (openrouterKey) {
        result = await callOpenRouter(openrouterKey, modelo, history) as Record<string, unknown>;
        if (result.error && perplexityKey) result = await searchPerplexity(perplexityKey, CHAT_PROMPT, msgs[msgs.length - 1].content) as Record<string, unknown>;
      } else if (perplexityKey) {
        result = await searchPerplexity(perplexityKey, CHAT_PROMPT, msgs.map((m) => `${m.role === "user" ? "Médico" : "Assistente"}: ${m.content}`).join("\n")) as Record<string, unknown>;
      } else {
        if (!lovableKey) return json(500, { error: "missing-api-key" });
        result = await callGateway(lovableKey, history) as Record<string, unknown>;
      }
      if (result.error) return json(502, result);
      return json(200, { ...result, disclaimer: DISCLAIMER });
    }

    if (body.modo === "documento") {
      const acao = body.acao ?? "rascunho";
      const tipo = body.tipo_documento ?? "documento médico";
      const instrucao =
        acao === "revisar"
          ? `Revise o texto abaixo de ${tipo} para clareza, coerência, completude e padrão técnico. Preserve todos os dados clínicos existentes.`
          : acao === "justificativa"
          ? `Escreva a justificativa clínica robusta para auditoria referente a este ${tipo}, fundamentada em critérios objetivos.`
          : acao === "cids"
          ? `Liste os CIDs pertinentes (código — descrição) e termos técnicos adequados a este ${tipo}, separando CID principal e associados. Indique quando o suporte no texto for insuficiente.`
          : `Gere o rascunho completo de um(a) ${tipo} a partir das anotações abaixo.`;
      const conteudo = (body.texto ?? body.anotacoes ?? "").trim();
      if (!conteudo) return json(400, { error: "missing-content" });
      const result = await run(DOC_PROMPT, `${instrucao}\n\n---\n${conteudo}`);
      if ("error" in result) return json(502, result);
      return json(200, { ...result, disclaimer: DISCLAIMER });
    }

    if (body.modo === "atualizacoes") {
      const tema = (body.patologia ?? "").trim();
      if (!tema) return json(400, { error: "missing-patologia" });
      const userMsg = `Patologia/tema: ${tema}. Traga atualizações relevantes de protocolos, escores, fluxogramas, diretrizes e ensaios clínicos publicadas ou revisadas recentemente, aplicáveis à prática médica no Brasil.`;
      if (perplexityKey) {
        const r = await searchPerplexity(perplexityKey, UPDATE_PROMPT, userMsg, UPDATE_SCHEMA);
        if (!("error" in r)) {
          try {
            const parsed = JSON.parse(r.texto || "{}");
            return json(200, { itens: parsed.itens ?? [], referencias: r.referencias, fonte: "perplexity", modelo: r.modelo });
          } catch {
            return json(502, { error: "resposta-invalida" });
          }
        }
      }
      if (!lovableKey) return json(500, { error: "missing-api-key" });
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [
            { role: "system", content: UPDATE_PROMPT },
            { role: "user", content: userMsg },
          ],
          tools: [{ type: "function", function: { name: "atualizacoes", description: "Atualizações clínicas.", parameters: UPDATE_SCHEMA } }],
          tool_choice: { type: "function", function: { name: "atualizacoes" } },
        }),
      });
      if (resp.status === 429) return json(429, { error: "rate-limited" });
      if (resp.status === 402) return json(402, { error: "credits-exhausted" });
      if (!resp.ok) {
        console.error("ai-assist: ai-error", (await resp.text()).slice(0, 500));
        return json(502, { error: "ai-error" });
      }
      const data = await resp.json();
      const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
      try {
        return json(200, { itens: JSON.parse(args ?? "{}").itens ?? [], referencias: [], fonte: "gateway", modelo: "google/gemini-3.8-flash" });
      } catch {
        return json(502, { error: "resposta-invalida" });
      }
    }

    if (body.modo === "validar_template") {
      const tpl = (body.template ?? "").trim();
      if (!tpl) return json(400, { error: "missing-template" });
      const system = `Você audita modelos de documentos médicos brasileiros quanto a exigências regulatórias (CFM, RDC/Anvisa para receituários e controle especial, Ministério da Saúde para AIH/APAC e notificação compulsória, LGPD).
Aponte: campos obrigatórios ausentes, elementos em desacordo, riscos de recusa por auditoria e sugestões objetivas de correção. Cite a norma quando afirmar obrigatoriedade. Não invente norma.`;
      const result = await run(system, `Tipo de documento: ${body.tipo_documento ?? "não informado"}\n\nModelo a validar:\n${tpl}`, true);
      if ("error" in result) return json(502, result);
      return json(200, { ...result, disclaimer: DISCLAIMER });
    }

    return json(400, { error: "modo-invalido" });
  } catch (e) {
    console.error("ai-assist: ia-indisponivel", e);
    return json(502, { error: "ia-indisponivel" });
  }
});
