// Edge function: public-document-link
// Resolves a public document by token with safety checks (expiration, revocation).
// Returns minimal document metadata + PDF URL. Logs access.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token")?.trim();
    if (!token || token.length < 8 || token.length > 64) {
      return json({ ok: false, reason: "nao_encontrado" }, 200);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: link } = await admin
      .from("documento_links_publicos")
      .select("id, id_documento, status, expira_em, numero_acessos")
      .eq("token", token)
      .maybeSingle();

    if (!link) return json({ ok: false, reason: "nao_encontrado" }, 200);
    if (link.status === "revogado") return json({ ok: false, reason: "revogado" }, 200);
    if (new Date(link.expira_em) < new Date()) {
      const { error: expireError } = await admin
        .from("documento_links_publicos")
        .update({ status: "expirado" })
        .eq("id", link.id);
      if (expireError) console.error("public-document-link: falha ao marcar link expirado", expireError);
      return json({ ok: false, reason: "expirado" }, 200);
    }

    const { data: doc } = await admin
      .from("documentos_gerados")
      .select("titulo, tipo, id_paciente, gerado_por, data_hora, arquivo_pdf_url, conteudo_json")
      .eq("id", link.id_documento)
      .maybeSingle();

    if (!doc) return json({ ok: false, reason: "nao_encontrado" }, 200);

    // Try to extract patient name from conteudo_json.paciente.nome (best effort)
    const conteudo = (doc.conteudo_json ?? {}) as Record<string, unknown>;
    const paciente = (conteudo as { paciente?: { nome?: string } }).paciente?.nome ?? doc.id_paciente ?? null;

    // Minimal professional name from assinatura_perfis padrao do gerador
    let profissional: string | null = null;
    if (doc.gerado_por) {
      const { data: perfil } = await admin
        .from("assinatura_perfis")
        .select("nome_profissional")
        .eq("id_usuario", doc.gerado_por)
        .eq("padrao", true)
        .maybeSingle();
      profissional = perfil?.nome_profissional ?? null;
    }

    // Registro de acesso: falhas não impedem a abertura do documento, mas ficam nos logs da função.
    const [accessLog, counter] = await Promise.all([
      admin.from("link_acessos_log").insert({
        id_link: link.id,
        ip: req.headers.get("x-forwarded-for") ?? null,
        user_agent: req.headers.get("user-agent") ?? null,
      }),
      admin.from("documento_links_publicos").update({
        numero_acessos: link.numero_acessos + 1,
      }).eq("id", link.id),
    ]);
    if (accessLog.error) console.error("public-document-link: falha ao registrar acesso", accessLog.error);
    if (counter.error) console.error("public-document-link: falha ao incrementar acessos", counter.error);

    // arquivo_pdf_url guarda o caminho no bucket privado; a URL assinada expira em 5 minutos.
    let pdfUrl: string | null = null;
    if (doc.arquivo_pdf_url) {
      if (/^https?:\/\//i.test(doc.arquivo_pdf_url)) {
        pdfUrl = doc.arquivo_pdf_url;
      } else {
        const { data: signed, error: signError } = await admin.storage
          .from("documentos-pdf")
          .createSignedUrl(doc.arquivo_pdf_url, 300);
        if (signError) console.error("public-document-link: falha ao assinar URL do PDF", signError);
        pdfUrl = signed?.signedUrl ?? null;
      }
    }

    return json({
      ok: true,
      documento: {
        titulo: doc.titulo,
        tipo: doc.tipo,
        paciente,
        profissional,
        data: doc.data_hora,
        pdf_url: pdfUrl,
      },
    }, 200);
  } catch (e) {
    console.error("public-document-link: erro inesperado", e);
    return json({ ok: false, reason: "erro_interno" }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
