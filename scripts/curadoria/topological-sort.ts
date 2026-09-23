/**
 * Ordem topológica para sync batch-upsert de chunks JSON no schema curadoria.
 * Regra: NUNCA rodar uma junção many-to-many ANTES das tabelas mestre referenciadas.
 * Número total: 26 passos (17 mestres + parametrizáveis + 9 junções).
 *
 * Uso CLI:
 *   import { CURADORIA_SYNC_ORDER, tabelasPorPasso } from './topological-sort.ts';
 */

export interface TopoStep {
  passo: number;
  tabela: string;
  tipo: 'mestre' | 'parametrizavel' | 'juncao' | 'auditoria';
  dependencias: string[];
  descricao: string;
}

export const CURADORIA_SYNC_ORDER: TopoStep[] = [
  // ============================================================= 1-3. Mestres gatos (sem dependências internas curadoria)
  { passo: 1,  tabela: 'instituicoes',                       tipo: 'mestre',         dependencias: [],                                 descricao: '1:NACIONAL_PRESCRIMED sentinela primeiro, pois todo resto tem FK instituicao_id' },
  { passo: 2,  tabela: 'tipos_prescricao',                   tipo: 'mestre',         dependencias: [],                                 descricao: 'Catálogo slugs globais (dose_unica, bolus, etc.)' },
  { passo: 3,  tabela: 'monitorizacoes',                     tipo: 'mestre',         dependencias: [],                                 descricao: 'Catálogo slugs globais (pa, saturacao_o2, etc.)' },

  // ============================================================= 4-8. Mestres catálogo com FK opcional instituicao_id
  { passo: 4,  tabela: 'classes_medicamentosas',             tipo: 'mestre',         dependencias: ['instituicoes'],                   descricao: '20 classes; vínculo posterior via condicao_classes_medicamentosas' },
  { passo: 5,  tabela: 'exames_complementares',              tipo: 'mestre',         dependencias: ['instituicoes'],                   descricao: '14 essenciais + centenas de imagens/lab, FKs em condicao_exames' },
  { passo: 6,  tabela: 'condicoes_clinicas',                 tipo: 'mestre',         dependencias: ['instituicoes'],                   descricao: '35 frequentes + refinamentos self-join; FK pivô de TODAS junções' },
  { passo: 7,  tabela: 'protocolos_clinicos',                tipo: 'mestre',         dependencias: ['instituicoes'],                   descricao: '24 protocolos; versão depende desta tabela' },
  { passo: 8,  tabela: 'linhas_cuidado',                     tipo: 'mestre',         dependencias: ['instituicoes'],                   descricao: '10 perfis de risco; ações e condicao_linha_cuidado dependem' },
  { passo: 9,  tabela: 'modelos_documento',                  tipo: 'mestre',         dependencias: ['instituicoes'],                   descricao: '22 tipos de documento; campos e junções dependem' },

  // ============================================================= 10-12. Mestres parametrizáveis (1 nível de FK)
  { passo: 10, tabela: 'protocolo_clinico_versao',           tipo: 'parametrizavel', dependencias: ['protocolos_clinicos'],            descricao: 'Versionamento semântico do protocolo clínico' },
  { passo: 11, tabela: 'protocolo_etapa',                    tipo: 'parametrizavel', dependencias: ['protocolo_clinico_versao'],       descricao: '9 etapas fixas por versão (triagem..checagem)' },
  { passo: 12, tabela: 'linha_cuidado_acoes',                tipo: 'parametrizavel', dependencias: ['linhas_cuidado'],                 descricao: 'Ações ordenadas por linha cuidado' },

  // ============================================================= 13-17. Mestres parametrizáveis com 2+ FKs
  { passo: 13, tabela: 'modelo_documento_campos',            tipo: 'parametrizavel', dependencias: ['modelos_documento'],              descricao: 'Campos customizáveis por tipo de documento' },
  { passo: 14, tabela: 'instituicoes_config',                tipo: 'parametrizavel', dependencias: ['instituicoes'],                   descricao: 'Parâmetros fluxo local por unidade/setor/perfil' },
  { passo: 15, tabela: 'prescricao_rapida_templates',        tipo: 'parametrizavel', dependencias: ['instituicoes','modelos_documento'],descricao: 'Templates receita rápida (ambulatorial/hospitalar)' },
  { passo: 16, tabela: 'prescricao_template_item',           tipo: 'parametrizavel', dependencias: ['prescricao_rapida_templates'],    descricao: 'Linhas medicamento do template; FK public.base_medicamentos_geral' },
  { passo: 17, tabela: 'dupla_checagem_politica',            tipo: 'parametrizavel', dependencias: ['instituicoes'],                   descricao: 'Políticas dupla checagem; FK public.base_medicamentos_geral' },

  // ============================================================= 18-26. 9 Junções many-to-many (todas as FKs mestres já existem)
  { passo: 18, tabela: 'condicao_exames',                    tipo: 'juncao',         dependencias: ['condicoes_clinicas','exames_complementares','instituicoes'],
    descricao: 'Junção: qual exame para qual condição (com categoria justificativa impacto sequencia)' },
  { passo: 19, tabela: 'condicao_medicamentos_alternativos', tipo: 'juncao',         dependencias: ['condicoes_clinicas','instituicoes'],
    descricao: 'Junção: qual medicamento para qual condição com 6 justificativas e off-label check' },
  { passo: 20, tabela: 'condicao_classes_medicamentosas',    tipo: 'juncao',         dependencias: ['condicoes_clinicas','classes_medicamentosas','instituicoes'],
    descricao: 'Junção: classes 1ª/2ª linha, adjuvante, resgate para a condição' },
  { passo: 21, tabela: 'condicao_exame_fisico',              tipo: 'juncao',         dependencias: ['condicoes_clinicas','instituicoes'],
    descricao: 'Junção: 12 sistemas + manobras + achados + red flags do exame direcionado' },
  { passo: 22, tabela: 'condicao_modelos_documento',         tipo: 'juncao',         dependencias: ['condicoes_clinicas','modelos_documento','instituicoes'],
    descricao: 'Junção: quais tipos de documento devem ser gerados para esta condição' },
  { passo: 23, tabela: 'condicao_protocolo_clinico',         tipo: 'juncao',         dependencias: ['condicoes_clinicas','protocolos_clinicos','instituicoes'],
    descricao: 'Junção: qual protocolo clínico institucional esta condição aciona' },
  { passo: 24, tabela: 'condicao_linha_cuidado',             tipo: 'juncao',         dependencias: ['condicoes_clinicas','linhas_cuidado','instituicoes'],
    descricao: 'Junção: qual linha de cuidado de risco esta condição conecta' },
  { passo: 25, tabela: 'condicao_ddx',                       tipo: 'juncao',         dependencias: ['condicoes_clinicas','instituicoes'],
    descricao: 'Self-join: diagnósticos diferenciais da condição origem; CHECK origem <> dest' },
  { passo: 26, tabela: 'condicao_refinamentos',              tipo: 'juncao',         dependencias: ['condicoes_clinicas','instituicoes'],
    descricao: 'Self-join: fluxo de refinamento de sintoma → síndrome → patologia; CHECK de <> para' }
];

/** Auditoria LLM roda DEPOIS (inserida no mesmo job sync, mas não parte do sync de dados clínicos) */
export const CURADORIA_AUDITORIA_TABLES = ['llm_job','llm_job_detail'] as const;

/** Retorna as tabelas por tipo (usado em UI de progresso) */
export function tabelasPorPasso(tipoFiltro?: TopoStep['tipo']) {
  return CURADORIA_SYNC_ORDER.filter(s => !tipoFiltro || s.tipo === tipoFiltro).map(s => s.tabela);
}

/** Valida se uma lista de tabelas informadas é subconjunto estrito da topologia (erro se existir tabela fora) */
export function validarConjuntoTopologico(tabelas: string[]): { ok: true } | { ok: false; faltantes: string[]; desconhecidas: string[] } {
  const esperado = CURADORIA_SYNC_ORDER.map(s => s.tabela);
  const faltantes   = esperado.filter(t => !tabelas.includes(t));
  const desconhecidas = tabelas.filter(t => !esperado.includes(t));
  if (faltantes.length === 0 && desconhecidas.length === 0) return { ok: true };
  return { ok: false, faltantes, desconhecidas };
}

if (import.meta.url && process.argv[1]?.replace(/\\/g, '/').endsWith('topological-sort.ts')) {
  // CLI mini: imprime a ordem. Usado em pipeline CI/CD para orquestrar jobs em paralelo por grupos.
  const args = process.argv.slice(2);
  const apenasTipos = args.filter(a => a.startsWith('--tipo=')).map(a => a.slice(7)) as TopoStep['tipo'][];
  const linhas = CURADORIA_SYNC_ORDER
    .filter(s => apenasTipos.length === 0 || apenasTipos.includes(s.tipo))
    .map(s => `${String(s.passo).padStart(2,'0')}\t${s.tabela}\t[${s.tipo}]\tdeps=${s.dependencias.join(',') || '∅'}\t${s.descricao}`);
  console.log(linhas.join('\n'));
  console.log(`\nTotal ${CURADORIA_SYNC_ORDER.length} passos topológicos.`);
}
