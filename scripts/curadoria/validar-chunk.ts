#!/usr/bin/env tsx
/**
 * CLI: Valida um chunk JSON de curadoria clínica (offline + opcionalmente online FK).
 *
 * Três níveis de validação FAIL-CLOSED (se qualquer um falhar, saída exit != 0
 * e nada é sincronizado depois):
 *
 *   NÍVEL 1 (offline, sempre): Estrutura do arquivo (chunkArquivoSchema)
 *   NÍVEL 2 (offline, sempre): Zod schema linha a linha em cada tabela
 *   NÍVEL 3 (offline, sempre): UNIQUE de chaves_negócio dentro do chunk (sem duplicados)
 *   NÍVEL 4 (online, se --online): checagem FK contra banco Supabase
 *
 * Uso:
 *   npx tsx scripts/curadoria/validar-chunk.ts \
 *       --arquivo supabase/seeds/curadoria/chunks/chunk_01.json \
 *       --online \
 *       --project-ref zwwalaioamxcvxbihxlr \
 *       --service-role-env VITE_SUPABASE_SERVICE_ROLE
 *
 * Retorna exit 0 = aprovado (printa 4/4 NÍVEIS PASSOU)
 * Retorna exit !=0 = lista de erros numerados e tabela com rejeitados.
 */

import fs from 'node:fs';
import path from 'node:path';
import { CURADORIA_SCHEMAS, chunkArquivoSchema } from './zod.schema.js';
import { CURADORIA_SYNC_ORDER, validarConjuntoTopologico } from './topological-sort.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

type Args = {
  arquivo: string;
  online: boolean;
  projectRef?: string;
  serviceRoleEnv?: string;
  verbose: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (f: string) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const tem = (f: string) => argv.includes(f);
  const arquivo = get('--arquivo');
  if (!arquivo) throw new Error('--arquivo <path.json> OBRIGATÓRIO');
  return {
    arquivo,
    online: tem('--online'),
    projectRef: get('--project-ref'),
    serviceRoleEnv: get('--service-role-env') || 'SUPABASE_SERVICE_ROLE_KEY',
    verbose: tem('--verbose')
  };
}

// ================================================= UNIQUE keys por tabela (copiadas das migrations)
const UNIQUE_KEYS: Record<string, string[]> = {
  instituicoes: ['codigo_instituicao'],
  condicoes_clinicas: ['tipo','nome','instituicao_id'],
  tipos_prescricao: ['slug'],
  monitorizacoes: ['slug'],
  classes_medicamentosas: ['slug','instituicao_id'],
  exames_complementares: ['codigo_exame','instituicao_id'],
  protocolos_clinicos: ['slug','instituicao_id'],
  protocolo_clinico_versao: ['protocolo_id','versao'],
  protocolo_etapa: ['versao_id','numero_etapa'],
  linhas_cuidado: ['slug','instituicao_id'],
  linha_cuidado_acoes: ['linha_id','ordem'],
  modelos_documento: ['tipo_documento','instituicao_id'],
  modelo_documento_campos: ['modelo_documento_id','chave_campo'],
  instituicoes_config: ['instituicao_id','unidade_nome','setor','perfil_assistencial'],
  prescricao_rapida_templates: ['owner_uuid','titulo','instituicao_id'],
  prescricao_template_item: ['template_id','ordem_item'],
  dupla_checagem_politica: ['medicamento_id','instituicao_id'],
  llm_job: ['prompt_input_hash','tabela_afetada','instituicao_id'],
  // juncoes
  condicao_exames: ['condicao_id','exame_id','instituicao_id','categoria_pedido'],
  condicao_medicamentos_alternativos: ['condicao_id','medicamento_id','instituicao_id','ordem_escolha'],
  condicao_classes_medicamentosas: ['condicao_id','classe_medicamentosa_id','instituicao_id'],
  condicao_exame_fisico: ['condicao_id','instituicao_id'],
  condicao_modelos_documento: ['condicao_id','modelo_documento_id','instituicao_id'],
  condicao_protocolo_clinico: ['condicao_id','protocolo_clinico_id','instituicao_id'],
  condicao_linha_cuidado: ['condicao_id','linha_cuidado_id','instituicao_id'],
  condicao_ddx: ['origem_id','ddx_id','instituicao_id'],
  condicao_refinamentos: ['de_condicao_id','para_condicao_id','instituicao_id']
};

function normalizarUnica(row: Record<string, unknown>, cols: string[]): string {
  return cols.map(c => {
    const v = row[c];
    if (v === undefined || v === null) return 'NULL#';
    if (typeof v === 'number' || typeof v === 'bigint') return `${String(v)}:`;
    if (typeof v === 'string') return `s:${v.toLowerCase().trim()}:`;
    return `x:${JSON.stringify(v)}:`;
  }).join('||');
}

// ==========================================================================
// NÍVEIS 1,2,3 OFFLINE
// ==========================================================================
function validarOffline(bruto: unknown) {
  const erros: string[] = [];
  let linhasValidadas = 0;
  let linhasRejeitadas = 0;

  // NÍVEL 1
  const nivel1 = chunkArquivoSchema.safeParse(bruto);
  if (!nivel1.success) {
    for (const e of nivel1.error.errors) erros.push(`[N1] path=${e.path.join('.')}  msg=${e.message}`);
    return { ok: false as const, erros, linhasValidadas, linhasRejeitadas };
  }
  const chunk = nivel1.data;
  const tabelasNomes = Object.keys(chunk.tabelas);

  // Garante que se tabela existe, está na topologia
  const topoOk = validarConjuntoTopologico([
    ...CURADORIA_SYNC_ORDER.map(s => s.tabela).filter(t => tabelasNomes.includes(t)),
    ...tabelasNomes
  ]);
  // (ok se tabelasNomes é subconjunto. A função validar retorna ok se iguais; precisamos de subconjunto)
  for (const t of tabelasNomes) {
    if (!Object.hasOwn(CURADORIA_SCHEMAS, t)) erros.push(`[N1] tabela "${t}" não existe em curadoria`);
  }

  // NÍVEL 2 + 3
  for (const [tabela, linhas] of Object.entries(chunk.tabelas)) {
    const schema = CURADORIA_SCHEMAS[tabela];
    const unica = UNIQUE_KEYS[tabela];
    const vistos = new Set<string>();
    for (const [i, row] of linhas.entries()) {
      const r2 = schema.safeParse(row);
      if (!r2.success) {
        linhasRejeitadas++;
        for (const e of r2.error.errors) erros.push(`[N2] ${tabela}#${i+1} path=${e.path.join('.')}  msg=${e.message}`);
        continue;
      }
      linhasValidadas++;
      if (unica) {
        const key = normalizarUnica(r2.data as Record<string, unknown>, unica);
        if (vistos.has(key)) erros.push(`[N3] ${tabela}#${i+1} duplicado na UNIQUE ${unica.join('+')}`);
        vistos.add(key);
      }
    }
  }

  return { ok: erros.length === 0, chunk, erros, linhasValidadas, linhasRejeitadas };
}

// ==========================================================================
// NÍVEL 4 ONLINE (FK existir nas tabelas referenciadas)
// ==========================================================================
function montarFkChecagem(chunk: ReturnType<typeof validarOffline> extends infer X ? any : any) {
  // Retorna lista { tabela_filha, coluna, tabela_pai, coluna_pai, ids_distintos[] }
  const mapa: Array<{ tabela: string, col: string, pai: string, paiCol: string, ids: Array<string | number> }> = [];
  const fksKnown: Array<[string, string, string, string]> = [
    ['condicoes_clinicas','instituicao_id','instituicoes','id'],
    ['classes_medicamentosas','instituicao_id','instituicoes','id'],
    ['exames_complementares','instituicao_id','instituicoes','id'],
    ['protocolos_clinicos','instituicao_id','instituicoes','id'],
    ['protocolo_clinico_versao','protocolo_id','protocolos_clinicos','id'],
    ['protocolo_etapa','versao_id','protocolo_clinico_versao','id'],
    ['linhas_cuidado','instituicao_id','instituicoes','id'],
    ['linha_cuidado_acoes','linha_id','linhas_cuidado','id'],
    ['modelos_documento','instituicao_id','instituicoes','id'],
    ['modelo_documento_campos','modelo_documento_id','modelos_documento','id'],
    ['instituicoes_config','instituicao_id','instituicoes','id'],
    ['prescricao_rapida_templates','instituicao_id','instituicoes','id'],
    ['prescricao_rapida_templates','conteudo_modelo_id','modelos_documento','id'],
    ['prescricao_template_item','template_id','prescricao_rapida_templates','id'],
    ['dupla_checagem_politica','instituicao_id','instituicoes','id'],
    // juncoes
    ['condicao_exames','condicao_id','condicoes_clinicas','id'],
    ['condicao_exames','exame_id','exames_complementares','id'],
    ['condicao_medicamentos_alternativos','condicao_id','condicoes_clinicas','id'],
    ['condicao_classes_medicamentosas','condicao_id','condicoes_clinicas','id'],
    ['condicao_classes_medicamentosas','classe_medicamentosa_id','classes_medicamentosas','id'],
    ['condicao_exame_fisico','condicao_id','condicoes_clinicas','id'],
    ['condicao_modelos_documento','condicao_id','condicoes_clinicas','id'],
    ['condicao_modelos_documento','modelo_documento_id','modelos_documento','id'],
    ['condicao_protocolo_clinico','condicao_id','condicoes_clinicas','id'],
    ['condicao_protocolo_clinico','protocolo_clinico_id','protocolos_clinicos','id'],
    ['condicao_linha_cuidado','condicao_id','condicoes_clinicas','id'],
    ['condicao_linha_cuidado','linha_cuidado_id','linhas_cuidado','id'],
    ['condicao_ddx','origem_id','condicoes_clinicas','id'],
    ['condicao_ddx','ddx_id','condicoes_clinicas','id'],
    ['condicao_refinamentos','de_condicao_id','condicoes_clinicas','id'],
    ['condicao_refinamentos','para_condicao_id','condicoes_clinicas','id']
  ];

  const chunkData = chunk.chunk!;
  const tabelas = chunkData.tabelas as Record<string, Array<Record<string, unknown>>>;
  for (const [tabela, col, pai, paiCol] of fksKnown) {
    if (!tabelas[tabela]) continue;
    const ids = new Array<string | number>();
    for (const row of tabelas[tabela]) {
      const v = row[col];
      if (v == null) continue;
      if (typeof v === 'number' || typeof v === 'string') ids.push(v);
    }
    if (ids.length > 0) mapa.push({ tabela, col, pai, paiCol, ids: [...new Set(ids)] });
  }
  return mapa;
}

async function validarOnline(chunkValido: any, args: Args): Promise<string[]> {
  const erros: string[] = [];
  if (!args.online) return erros;
  if (!args.projectRef) throw new Error('--project-ref OBRIGATORIO quando --online');
  const serviceRole = process.env[args.serviceRoleEnv] || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) throw new Error(`Variável de ambiente ${args.serviceRoleEnv} (ou SUPABASE_SERVICE_ROLE_KEY) não definida.`);
  const url = `https://${args.projectRef}.supabase.co`;
  const sb: SupabaseClient = createClient(url, serviceRole, { auth: { persistSession: false } });

  const checagens = montarFkChecagem(chunkValido);
  for (const c of checagens) {
    if (args.verbose) console.log(`[N4] ${c.tabela}.${c.col} -> ${c.pai}.${c.paiCol} (${c.ids.length} IDs distintos)`);
    const SCHEMA = c.pai.startsWith('base_medicamentos') ? 'public' : 'curadoria';
    const { data, error } = await sb
      .from(`${SCHEMA === 'public' ? c.pai : `${SCHEMA}.${c.pai}`}`)
      .select(c.paiCol)
      .in(c.paiCol, c.ids.slice(0, 900));
    if (error && !error.message.includes('does not exist')) {
      erros.push(`[N4] query erro em ${c.pai}: ${error.message}`);
      continue;
    }
    const existentes = new Set((data ?? []).map(r => (r as any)[c.paiCol]));
    for (const id of c.ids) if (!existentes.has(id as never)) {
      erros.push(`[N4] FK quebrada ${c.tabela}.${c.col} = ${String(id)} não existe em ${c.pai}.${c.paiCol}`);
    }
  }
  return erros;
}

// ==========================================================================
// MAIN
// ==========================================================================
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const caminho = path.resolve(args.arquivo);
  const rawText = fs.readFileSync(caminho, 'utf8');
  const bruto = JSON.parse(rawText);

  const offline = validarOffline(bruto);
  if (!offline.ok || !offline.chunk) {
    console.log(`❌ Níveis 1/2/3 FALHOU: ${offline.erros.length} erros.`);
    for (const e of offline.erros) console.log('   -', e);
    console.log(`   linhas validadas = ${offline.linhasValidadas} | rejeitadas = ${offline.linhasRejeitadas}`);
    process.exit(2);
  }
  console.log(`✅ Níveis 1/2/3 PASSOU (${offline.linhasValidadas} linhas OK, ${offline.linhasRejeitadas} rejeitadas)`);

  if (args.online) {
    const errosOn = await validarOnline(offline, args);
    if (errosOn.length > 0) {
      console.log(`❌ Nível 4 FALHOU: ${errosOn.length} FK quebradas.`);
      for (const e of errosOn) console.log('   -', e);
      process.exit(3);
    }
    console.log('✅ Nível 4 ONLINE PASSOU (nenhuma FK quebrada)');
  } else {
    console.log('⏭️  Nível 4 ONLINE PULADO (use --online para ativar)');
  }
  console.log('\n🎉 Chunk VALIDADO. Pronto para sync-batch-upsert.');
}

main().catch(err => {
  console.error('💥 Falha fatal validar-chunk:', err?.message ?? err);
  process.exit(1);
});
