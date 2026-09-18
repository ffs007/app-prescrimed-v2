// Etapa 20 — Templates HTML para todos os tipos de documento.
// Layout limpo, profissional, A4. Cores neutras (preto/cinza) por padrão de impressão.
import type {
  AssinaturaPerfil,
  AtendimentoItem,
  ContextoAtendimento,
  DocumentBundle,
  DocumentoTipo,
  DocumentosSettings,
  ItemAtestado,
  ItemDeclaracao,
  ItemEncaminhamento,
  ItemExame,
  ItemMedicamento,
  ItemOrientacao,
  ItemRelatorio,
  ItemCuidadoEnfermagem,
  PacienteInfo,
  RenderedDocument,
} from "./types";
import { DOCUMENTO_TITULOS } from "./groupItemsByDocument";

const escape = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function pageStyles(): string {
  // Documento de impressão usa cores neutras, fora dos tokens de tema do app.
  // Justificativa: PDF/impressão exige preto sobre branco para legibilidade legal.
  return `
    <style>
      @page { size: A4; margin: 18mm 16mm; }
      * { box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
             color: #111; font-size: 12pt; line-height: 1.45; margin: 0; }
      .doc-header { display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #333;
                    padding-bottom: 8px; margin-bottom: 12px; }
      .doc-header img { max-height: 56px; max-width: 120px; }
      .doc-header .info { flex: 1; }
      .doc-header h2 { margin: 0 0 2px 0; font-size: 13pt; }
      .doc-header .meta { font-size: 9.5pt; color: #444; }
      h1.doc-title { text-align: center; font-size: 14pt; margin: 12px 0; text-transform: uppercase;
                     letter-spacing: 1px; }
      .patient { border: 1px solid #ddd; padding: 8px 10px; margin-bottom: 12px; font-size: 10.5pt; }
      .patient strong { display: inline-block; min-width: 90px; }
      .section { margin-bottom: 14px; }
      .section h3 { font-size: 11.5pt; margin: 10px 0 4px 0; border-bottom: 1px dashed #999; padding-bottom: 2px; }
      ol.med-list { padding-left: 22px; }
      ol.med-list li { margin-bottom: 8px; }
      .item-meta { color: #444; font-size: 10.5pt; margin-left: 4px; }
      .footer { margin-top: 32px; }
      .signature { margin-top: 56px; border-top: 1px solid #333; padding-top: 4px; text-align: center;
                   width: 60%; margin-left: auto; margin-right: auto; font-size: 10.5pt; }
      .city-date { text-align: right; margin-top: 24px; font-size: 10.5pt; }
      .small { font-size: 9.5pt; color: #555; }
      .badge { display: inline-block; border: 1px solid #999; padding: 1px 6px; border-radius: 3px;
               font-size: 9pt; }
      .two-cols { column-count: 2; column-gap: 24px; }
      table { width: 100%; border-collapse: collapse; font-size: 10.5pt; }
      table th, table td { border: 1px solid #bbb; padding: 4px 6px; text-align: left; }
      .notice { border: 1px solid #999; padding: 6px 8px; font-size: 9.5pt; color: #333;
                margin-top: 10px; background: #f8f8f8; }
      @media print { .no-print { display: none; } }
    </style>
  `;
}

function headerHtml(perfil: AssinaturaPerfil | null, settings: DocumentosSettings | null): string {
  if (!perfil) return `<div class="doc-header"><div class="info"><h2>—</h2></div></div>`;
  const showLogo = settings?.mostrar_logo ?? true;
  const showEnd = settings?.mostrar_endereco ?? true;
  const showTel = settings?.mostrar_telefone ?? true;
  const reg = [perfil.registro, perfil.registro_uf].filter(Boolean).join("/");
  const meta = [
    perfil.especialidade,
    perfil.rqe ? `RQE ${perfil.rqe}` : null,
    showTel && perfil.telefone ? perfil.telefone : null,
    showEnd && perfil.endereco ? perfil.endereco : null,
    perfil.email,
  ].filter(Boolean).map(escape).join(" · ");
  return `
    <div class="doc-header">
      ${showLogo && perfil.logo_url ? `<img src="${escape(perfil.logo_url)}" alt="Logo" />` : ""}
      <div class="info">
        <h2>${escape(perfil.nome_profissional)}${reg ? ` — ${escape(reg)}` : ""}</h2>
        <div class="meta">${meta}</div>
      </div>
    </div>
  `;
}

function patientHtml(p: PacienteInfo, opts: { mostrarEndereco?: boolean; mostrarDocumento?: boolean } = {}): string {
  return `
    <div class="patient">
      <div><strong>Paciente:</strong> ${escape(p.nome)}</div>
      ${p.idade != null ? `<div><strong>Idade:</strong> ${escape(p.idade)}</div>` : ""}
      ${p.data_nascimento ? `<div><strong>Nascimento:</strong> ${escape(p.data_nascimento)}</div>` : ""}
      ${opts.mostrarDocumento && p.documento ? `<div><strong>Documento:</strong> ${escape(p.documento)}</div>` : ""}
      ${opts.mostrarEndereco && p.endereco ? `<div><strong>Endereço:</strong> ${escape(p.endereco)}</div>` : ""}
      ${p.numero_atendimento ? `<div><strong>Atendimento:</strong> ${escape(p.numero_atendimento)}</div>` : ""}
    </div>
  `;
}

function footerHtml(perfil: AssinaturaPerfil | null, ctx: ContextoAtendimento, notice?: string): string {
  const cidade = ctx.cidade ?? perfil?.cidade_padrao ?? "";
  const data = ctx.data ?? new Date().toISOString().slice(0, 10);
  const dataBr = (() => {
    try { return new Date(data).toLocaleDateString("pt-BR"); } catch { return data; }
  })();
  const reg = perfil ? [perfil.registro, perfil.registro_uf].filter(Boolean).join("/") : "";
  return `
    <div class="footer">
      <div class="city-date">${escape(cidade)}${cidade ? ", " : ""}${escape(dataBr)}</div>
      <div class="signature">
        ${escape(perfil?.nome_profissional ?? "")}<br/>
        <span class="small">${escape(reg)}${perfil?.especialidade ? ` — ${escape(perfil.especialidade)}` : ""}</span>
      </div>
      ${notice ? `<div class="notice">${escape(notice)}</div>` : ""}
    </div>
  `;
}

function pageWrap(title: string, body: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>${escape(title)}</title>${pageStyles()}</head><body>${body}</body></html>`;
}

function medRow(m: ItemMedicamento): string {
  const meta = [m.apresentacao, m.via, m.frequencia, m.duracao, m.quantidade ? `Quantidade: ${m.quantidade}` : null]
    .filter(Boolean).map(escape).join(" · ");
  const dose = [m.dose, m.unidade].filter(Boolean).map(escape).join(" ");
  return `
    <li>
      <strong>${escape(m.principio_ativo)}${m.nome_comercial ? ` (${escape(m.nome_comercial)})` : ""}</strong>
      ${dose ? ` — ${dose}` : ""}
      <div class="item-meta">${meta}</div>
      ${m.orientacoes ? `<div class="small">Orientação: ${escape(m.orientacoes)}</div>` : ""}
    </li>
  `;
}

// ---------- Templates por tipo ----------

interface RenderArgs {
  bundle: DocumentBundle;
  paciente: PacienteInfo;
  perfil: AssinaturaPerfil | null;
  ctx: ContextoAtendimento;
  settings: DocumentosSettings | null;
}

function renderReceita(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const meds = bundle.itens.filter((i): i is ItemMedicamento => i.kind === "medicamento");
  const titulo = DOCUMENTO_TITULOS[bundle.tipo];
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">${escape(titulo)}</h1>
    ${patientHtml(paciente, {
      mostrarEndereco: bundle.tipo === "receita_controle_especial",
      mostrarDocumento: bundle.tipo !== "receita_comum",
    })}
    <ol class="med-list">${meds.map(medRow).join("")}</ol>
    ${bundle.observacoesExtra ? `<div class="section"><h3>Observações</h3>${escape(bundle.observacoesExtra)}</div>` : ""}
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: bundle.tipo,
    titulo,
    html: pageWrap(titulo, body),
    conteudo_resumido: meds.map((m) => m.principio_ativo).join("; "),
    conteudo_json: { medicamentos: meds },
  };
}

function renderSolicitacaoExames(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const exames = bundle.itens.filter((i): i is ItemExame => i.kind === "exame");
  const porCat = new Map<string, ItemExame[]>();
  for (const e of exames) {
    const k = e.categoria ?? "Outros";
    if (!porCat.has(k)) porCat.set(k, []);
    porCat.get(k)!.push(e);
  }
  const secoes = [...porCat.entries()].map(([cat, list]) => `
    <div class="section">
      <h3>${escape(cat)}</h3>
      <ol class="med-list">
        ${list.map((e) => `
          <li>
            <strong>${escape(e.nome)}</strong>
            ${e.prioridade ? ` <span class="badge">${escape(e.prioridade)}</span>` : ""}
            ${e.justificativa ? `<div class="small">Justificativa: ${escape(e.justificativa)}</div>` : ""}
            ${e.observacao ? `<div class="small">Obs.: ${escape(e.observacao)}</div>` : ""}
          </li>`).join("")}
      </ol>
    </div>
  `).join("");
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Solicitação de Exames</h1>
    ${patientHtml(paciente)}
    ${secoes}
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "solicitacao_exames",
    titulo: "Solicitação de Exames",
    html: pageWrap("Solicitação de Exames", body),
    conteudo_resumido: exames.map((e) => e.nome).join("; "),
    conteudo_json: { exames },
  };
}

function renderAtestado(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const a = bundle.itens.find((i): i is ItemAtestado => i.kind === "atestado");
  if (!a) return renderEmpty(args, "atestado", "Atestado Médico");
  const cidLine = bundle.incluirCid && a.cid ? `<div><strong>CID:</strong> ${escape(a.cid)}</div>` : "";
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Atestado Médico</h1>
    ${patientHtml(paciente)}
    <div class="section">
      <p>${escape(a.texto)}</p>
      <p><strong>Período de afastamento:</strong> ${escape(a.dias)} dia(s) — a partir de ${escape(a.data_inicio)}${a.data_retorno ? `, com retorno em ${escape(a.data_retorno)}` : ""}.</p>
      ${cidLine}
    </div>
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "atestado",
    titulo: "Atestado Médico",
    html: pageWrap("Atestado Médico", body),
    conteudo_resumido: `${a.dias} dia(s) — ${a.data_inicio}`,
    conteudo_json: { atestado: a, incluir_cid: !!bundle.incluirCid },
  };
}

function renderDeclaracao(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const d = bundle.itens.find((i): i is ItemDeclaracao => i.kind === "declaracao");
  if (!d) return renderEmpty(args, "declaracao", "Declaração de Comparecimento");
  const horario = [d.horario_inicio, d.horario_fim].filter(Boolean).join(" às ");
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Declaração de Comparecimento</h1>
    ${patientHtml(paciente)}
    <div class="section">
      <p>${escape(d.texto)}</p>
      ${horario ? `<p><strong>Horário:</strong> ${escape(horario)}</p>` : ""}
    </div>
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "declaracao",
    titulo: "Declaração de Comparecimento",
    html: pageWrap("Declaração de Comparecimento", body),
    conteudo_resumido: d.texto.slice(0, 80),
    conteudo_json: { declaracao: d },
  };
}

function renderEncaminhamento(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const e = bundle.itens.find((i): i is ItemEncaminhamento => i.kind === "encaminhamento");
  if (!e) return renderEmpty(args, "encaminhamento", "Encaminhamento Médico");
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Encaminhamento Médico</h1>
    ${patientHtml(paciente)}
    <div class="section"><h3>Destino / Especialidade</h3><p>${escape(e.destino)}</p></div>
    <div class="section"><h3>Motivo</h3><p>${escape(e.motivo)}</p></div>
    ${e.resumo_clinico ? `<div class="section"><h3>Resumo clínico</h3><p>${escape(e.resumo_clinico)}</p></div>` : ""}
    ${e.cid ? `<div class="section"><h3>Hipótese / CID</h3><p>${escape(e.cid)}</p></div>` : ""}
    ${e.exames_relevantes ? `<div class="section"><h3>Exames relevantes</h3><p>${escape(e.exames_relevantes)}</p></div>` : ""}
    ${e.prioridade ? `<div class="section"><h3>Prioridade</h3><p>${escape(e.prioridade)}</p></div>` : ""}
    ${e.orientacoes ? `<div class="section"><h3>Orientações</h3><p>${escape(e.orientacoes)}</p></div>` : ""}
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "encaminhamento",
    titulo: "Encaminhamento Médico",
    html: pageWrap("Encaminhamento Médico", body),
    conteudo_resumido: `${e.destino} — ${e.motivo}`,
    conteudo_json: { encaminhamento: e },
  };
}

function renderRelatorio(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const r = bundle.itens.find((i): i is ItemRelatorio => i.kind === "relatorio");
  if (!r) return renderEmpty(args, "relatorio", "Relatório Médico");
  const sec = (h: string, v?: string | null) => v ? `<div class="section"><h3>${h}</h3><p>${escape(v)}</p></div>` : "";
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Relatório Médico</h1>
    ${patientHtml(paciente)}
    ${sec("Resumo clínico", r.resumo)}
    ${sec("Antecedentes relevantes", r.antecedentes)}
    ${sec("Exames", r.exames)}
    ${sec("Hipótese / Diagnóstico", r.diagnostico)}
    ${sec("Conduta / Tratamento", r.conduta)}
    ${sec("Evolução", r.evolucao)}
    ${sec("Recomendação", r.recomendacao)}
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "relatorio",
    titulo: "Relatório Médico",
    html: pageWrap("Relatório Médico", body),
    conteudo_resumido: r.resumo.slice(0, 120),
    conteudo_json: { relatorio: r },
  };
}

function renderOrientacoesPaciente(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const ors = bundle.itens.filter((i): i is ItemOrientacao => i.kind === "orientacao");
  const blocos: Record<string, string> = {
    uso_medicamentos: "Como usar os medicamentos",
    cuidados_casa: "Cuidados em casa",
    sinais_alerta: "Sinais de alerta",
    quando_procurar: "Quando procurar atendimento",
    retorno: "Retorno",
    observacoes: "Observações",
  };
  const grupos = new Map<string, ItemOrientacao[]>();
  for (const o of ors) {
    const k = o.bloco ?? "observacoes";
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(o);
  }
  const secoes = [...grupos.entries()].map(([k, list]) => `
    <div class="section">
      <h3>${escape(blocos[k] ?? "Observações")}</h3>
      <ul>${list.map((o) => `<li>${escape(o.texto)}</li>`).join("")}</ul>
    </div>
  `).join("");
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Orientações ao Paciente</h1>
    ${patientHtml(paciente)}
    ${secoes}
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "orientacoes_paciente",
    titulo: "Orientações ao Paciente",
    html: pageWrap("Orientações ao Paciente", body),
    conteudo_resumido: ors.map((o) => o.texto).join(" | ").slice(0, 200),
    conteudo_json: { orientacoes: ors },
  };
}

function renderPrescricaoHospitalar(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const meds = bundle.itens.filter((i): i is ItemMedicamento => i.kind === "medicamento");
  const cuidados = bundle.itens.filter((i): i is ItemCuidadoEnfermagem => i.kind === "cuidado_enfermagem");
  const exames = bundle.itens.filter((i): i is ItemExame => i.kind === "exame");
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Prescrição Hospitalar</h1>
    ${patientHtml(paciente, { mostrarDocumento: true })}
    ${meds.length ? `<div class="section"><h3>Medicamentos</h3><ol class="med-list">${meds.map(medRow).join("")}</ol></div>` : ""}
    ${cuidados.length ? `<div class="section"><h3>Cuidados de enfermagem</h3><ul>${cuidados.map((c) => `<li>${escape(c.cuidado)}${c.frequencia ? ` — ${escape(c.frequencia)}` : ""}${c.observacao ? `<div class="small">${escape(c.observacao)}</div>` : ""}</li>`).join("")}</ul></div>` : ""}
    ${exames.length ? `<div class="section"><h3>Exames / monitorização</h3><ul>${exames.map((e) => `<li>${escape(e.nome)}</li>`).join("")}</ul></div>` : ""}
    ${bundle.observacoesExtra ? `<div class="section"><h3>Observações</h3><p>${escape(bundle.observacoesExtra)}</p></div>` : ""}
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "prescricao_hospitalar",
    titulo: "Prescrição Hospitalar",
    html: pageWrap("Prescrição Hospitalar", body),
    conteudo_resumido: `${meds.length} medicamento(s), ${cuidados.length} cuidado(s)`,
    conteudo_json: { medicamentos: meds, cuidados, exames },
  };
}

function renderOrientacoesEnfFarm(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const meds = bundle.itens.filter((i): i is ItemMedicamento => i.kind === "medicamento" && Boolean(i.diluicao_iv));
  const linhas = meds.map((m) => {
    const d = m.diluicao_iv!;
    return `
      <div class="section">
        <h3>${escape(m.principio_ativo)}</h3>
        <table>
          <tr><th>Diluente</th><td>${escape(d.diluente ?? "—")}</td>
              <th>Volume</th><td>${escape(d.volume ?? "—")}</td></tr>
          <tr><th>Tempo mínimo</th><td>${escape(d.tempo_infusao ?? "—")}</td>
              <th>Velocidade máx.</th><td>${escape(d.velocidade ?? "—")}</td></tr>
          <tr><th>Concentração máx.</th><td>${escape(d.concentracao_maxima ?? "—")}</td>
              <th>pH</th><td>${escape(d.ph ?? "—")}</td></tr>
          <tr><th>Fotoproteção</th><td>${d.fotoprotecao ? "Sim" : "Não"}</td>
              <th>Filtro</th><td>${d.filtro ? "Sim" : "Não"}</td></tr>
          ${d.incompatibilidades?.length ? `<tr><th>Incompatibilidades</th><td colspan="3">${escape(d.incompatibilidades.join(", "))}</td></tr>` : ""}
          ${d.estabilidade ? `<tr><th>Estabilidade</th><td colspan="3">${escape(d.estabilidade)}</td></tr>` : ""}
        </table>
      </div>
    `;
  }).join("");
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Orientações de Preparo e Administração</h1>
    ${patientHtml(paciente)}
    ${linhas}
    ${footerHtml(perfil, ctx, "Orientações técnicas de apoio. Validar conforme protocolo institucional e farmácia clínica.")}
  `;
  return {
    tipo: "orientacoes_enfermagem_farmacia",
    titulo: "Orientações de Preparo e Administração",
    html: pageWrap("Orientações de Preparo e Administração", body),
    conteudo_resumido: meds.map((m) => m.principio_ativo).join("; "),
    conteudo_json: { medicamentos_iv: meds },
  };
}

function renderAnexoIV(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const meds = bundle.itens.filter((i): i is ItemMedicamento => i.kind === "medicamento" && Boolean(i.diluicao_iv));
  const fichas = meds.map((m) => {
    const d = m.diluicao_iv!;
    return `
      <div class="section">
        <h3>${escape(m.principio_ativo)} ${m.apresentacao ? `<span class="small">— ${escape(m.apresentacao)}</span>` : ""}</h3>
        <table>
          <tr><th>Diluente</th><td>${escape(d.diluente ?? "—")}</td></tr>
          <tr><th>Volume de diluição</th><td>${escape(d.volume ?? "—")}</td></tr>
          <tr><th>Concentração máx.</th><td>${escape(d.concentracao_maxima ?? "—")}</td></tr>
          <tr><th>Tempo mínimo</th><td>${escape(d.tempo_infusao ?? "—")}</td></tr>
          <tr><th>Velocidade máx.</th><td>${escape(d.velocidade ?? "—")}</td></tr>
          <tr><th>pH</th><td>${escape(d.ph ?? "—")}</td></tr>
          <tr><th>Estabilidade</th><td>${escape(d.estabilidade ?? "—")}</td></tr>
          <tr><th>Incompatibilidades</th><td>${escape(d.incompatibilidades?.join(", ") ?? "—")}</td></tr>
          <tr><th>Fonte</th><td>${escape(d.fonte ?? "—")}</td></tr>
        </table>
      </div>
    `;
  }).join("");
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Anexo Técnico — Diluição e Administração IV</h1>
    ${patientHtml(paciente)}
    ${fichas}
    ${footerHtml(perfil, ctx, "Documento técnico de apoio. Validar conforme protocolo institucional e farmácia clínica.")}
  `;
  return {
    tipo: "anexo_tecnico_iv",
    titulo: "Anexo Técnico — Diluição e Administração IV",
    html: pageWrap("Anexo Técnico IV", body),
    conteudo_resumido: meds.map((m) => m.principio_ativo).join("; "),
    conteudo_json: { medicamentos_iv: meds },
  };
}

function renderPlanoTerapeutico(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Plano Terapêutico</h1>
    ${patientHtml(paciente)}
    <div class="section"><p>${escape(bundle.observacoesExtra ?? "—")}</p></div>
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "plano_terapeutico",
    titulo: "Plano Terapêutico",
    html: pageWrap("Plano Terapêutico", body),
    conteudo_resumido: (bundle.observacoesExtra ?? "").slice(0, 120),
    conteudo_json: { texto: bundle.observacoesExtra ?? "" },
  };
}

function renderResumoAtendimento(args: RenderArgs): RenderedDocument {
  const { bundle, paciente, perfil, ctx, settings } = args;
  const body = `
    ${headerHtml(perfil, settings)}
    <h1 class="doc-title">Resumo do Atendimento</h1>
    ${patientHtml(paciente)}
    <div class="section"><p>${escape(bundle.observacoesExtra ?? "—")}</p></div>
    ${footerHtml(perfil, ctx)}
  `;
  return {
    tipo: "resumo_atendimento",
    titulo: "Resumo do Atendimento",
    html: pageWrap("Resumo do Atendimento", body),
    conteudo_resumido: (bundle.observacoesExtra ?? "").slice(0, 120),
    conteudo_json: { texto: bundle.observacoesExtra ?? "" },
  };
}

function renderEmpty(args: RenderArgs, tipo: DocumentoTipo, titulo: string): RenderedDocument {
  const body = `
    ${headerHtml(args.perfil, args.settings)}
    <h1 class="doc-title">${escape(titulo)}</h1>
    ${patientHtml(args.paciente)}
    <div class="section"><p>Sem itens.</p></div>
    ${footerHtml(args.perfil, args.ctx)}
  `;
  return { tipo, titulo, html: pageWrap(titulo, body), conteudo_resumido: "", conteudo_json: {} };
}

const RENDERERS: Record<DocumentoTipo, (a: RenderArgs) => RenderedDocument> = {
  receita_comum: renderReceita,
  receita_controle_especial: renderReceita,
  receita_antimicrobiano: renderReceita,
  receita_controlado_especifico: renderReceita,
  solicitacao_exames: renderSolicitacaoExames,
  atestado: renderAtestado,
  declaracao: renderDeclaracao,
  encaminhamento: renderEncaminhamento,
  relatorio: renderRelatorio,
  orientacoes_paciente: renderOrientacoesPaciente,
  prescricao_hospitalar: renderPrescricaoHospitalar,
  orientacoes_enfermagem_farmacia: renderOrientacoesEnfFarm,
  anexo_tecnico_iv: renderAnexoIV,
  plano_terapeutico: renderPlanoTerapeutico,
  resumo_atendimento: renderResumoAtendimento,
};

export function renderDocument(args: RenderArgs): RenderedDocument {
  return RENDERERS[args.bundle.tipo](args);
}

/** Concatena vários documentos em um único HTML (com page-breaks). */
export function renderCombined(docs: RenderedDocument[]): string {
  const styles = pageStyles();
  const sections = docs.map((d, i) => `
    <section style="${i > 0 ? "page-break-before: always;" : ""}">
      ${d.html.replace(/^[\s\S]*<body>/, "").replace(/<\/body>[\s\S]*$/, "")}
    </section>
  `).join("");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Documentos</title>${styles}</head><body>${sections}</body></html>`;
}

// Re-export para outros módulos que precisem de tipos (não usados aqui mas evita unused import warnings).
export type { AtendimentoItem };
