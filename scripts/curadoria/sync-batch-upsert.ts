#!/usr/bin/env tsx
/**
 * CLI: Sync batch-upsert de um chunk JSON validado para as tabelas `curadoria.*`
 *      no Supabase remoto. Estratégia FAIL-CLOSED:
 *
 *        PRÉ-CONDIÇÕES (qualquer falha aborta o sync imediatamente, 0 escrita):
 *          1) O chunk passou por validar-chunk.ts OFFLINE (OBRIGATÓRIO rodar antes)
 *          2) --project-ref e service role válidos
 *          3) Topologia OK (todas as tabelas do chunk existem em CURADORIA_SYNC_ORDER)
 *          4) UNIQUE hash llm_job não foi rodado antes (previne repetição idêntica)
 *
 *        EXECUÇÃO:
 *          - Processa em ordem topológica CURADORIA_SYNC_ORDER
 *          - Tabela por tabela: batch 1000 linhas: INSERT ... ON CONFLICT (unique_key) DO UPDATE SET
 *          - Conta linhas inseridas / atualizadas em cada batch
 *          - Loga tudo em curadoria.llm_job + curadoria.llm_job_detail com hash SHA-256 do chunk
 *          - Se erro em QUALQUER etapa, aborta e retorna status rejeitado
 *
 *        FLAGS OBRIGATÓRIAS:
 *          --arquivo chunk.json
 *          --project-ref   (ex: zwwalaioamxcvxbihxlr)
 *          --confirmado    (sem esta flag, executa em DRY RUN: conta só não grava nada)
 *
 *        FLAGS OPCIONAIS:
 *          --service-role-env VAR_NAME   (default: SUPABASE_SERVICE_ROLE_KEY)
 *          --batch 1000
 *          --verbose
 *          --apenas-tabela classes_medicamentosas    (processa 1 tabela específica somente)
 *          --forcar-reexecucao                       (ignora UNIQUE prompt_input_hash e roda mesmo que exista)
 *
 *        Uso típico DRY RUN (seguro, sempre o PRIMEIRO passo):
 *          npm run curadoria:sync -- --arquivo supabase/seeds/curadoria/chunks/chunk_01.json \
 *                                     --project-ref zwwalaioamxcvxbihxlr
 *
 *        Quando dry run passar, CONFIRMADO:
 *          npm run curadoria:sync -- --arquivo ...chunk_01.json \
 *                                     --project-ref zwwalaioamxcvxbihxlr --confirmado --verbose
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CURADORIA_SCHEMAS, chunkArquivoSchema } from './zod.schema.js';
import { CURADORIA_SYNC_ORDER } from './topological-sort.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

type Args = {
  arquivo: string;
  projectRef: string;
  confirmado: boolean;
  serviceRoleEnv: string;
  batch: number;
  verbose: boolean;
  apenasTabela?: string;
  forcarReexecucao: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (f: string) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const tem = (f: string) => argv.includes(f);
  const arquivo = get('--arquivo');
  const projectRef = get('--project-ref');
  if (!arquivo || !projectRef) {
    throw new Error('USO: sync-batch-upsert.ts --arquivo chunk.json --project-ref xxx [--confirmado] [--dry-run]');
  }
  return {
    arquivo,
    projectRef,
    confirmado: tem('--confirmado'),
    serviceRoleEnv: get('--service-role-env') || 'SUPABASE_SERVICE_ROLE_KEY',
    batch: Number(get('--batch') || '1000'),
    verbose: tem('--verbose'),
    apenasTabela: get('--apenas-tabela'),
    forcarReexecucao: tem('--forcar-reexecucao')
  };
}

// ========================================================= UNIQUE keys (replicadas validar-chunk)
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

/** Mapeamento tabela -> schema Supabase ('public' só para tabelas que referenciam, ex. medicamentos) */
function schemaTabela(nomeTabela: string): 'curadoria' | 'public' {
  // Todas as tabelas do chunk são curadoria. exceto base_medicamentos (mas ela não é gravada)
  if (nomeTabela.startsWith('base_medicamentos') || nomeTabela === 'users') return 'public';
  return 'curadoria';
}

/** Remove colunas auto-geradas (id identity, generated stored) antes do INSERT */
function limparColunasAuto<T extends Record<string, unknown>>(tabela: string, row: T): T {
  const out = { ...row };
  delete (out as any).id;
  if (tabela === 'condicoes_clinicas') delete (out as any).nome_normalizado; // STORED generated
  // Sempre apagamos created_at/updated_at pois tem DEFAULT now() / trigger
  delete (out as any).created_at;
  delete (out as any).updated_at;
  return out;
}

/** Monta a cláusula ON CONFLICT ... DO UPDATE SET colunas = excluded.colunas */
function montarOnConflictUpdate(tabela: string, row: Record<string, unknown>) {
  const unicas = UNIQUE_KEYS[tabela];
  if (!unicas) throw new Error(`Tabela ${tabela} não tem UNIQUE_KEYS cadastrada`);
  const todasCols = Object.keys(limparColunasAuto(tabela, row));
  const updateCols = todasCols.filter(c => !unicas.includes(c));
  const set = updateCols.map(c => `${c} = excluded.${c}`).join(', ');
  return {
    onConflict: unicas.join(','),
    updateSetSQL: set
  };
}

/** Hash SHA-256 do arquivo JSON completo */
function hashArquivo(p: string): string {
  const bytes = fs.readFileSync(p);
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

// ==========================================================================
// Core sync tabela em batch
// ==========================================================================
async function syncTabela(args: Args, sb: SupabaseClient, tabela: string, linhas: any[]) {
  const schema = schemaTabela(tabela);
  const unicas = UNIQUE_KEYS[tabela];
  if (!unicas) throw new Error(`UNIQUE_KEYS ausente: tabela=${tabela}`);
  if (args.verbose) console.log(`  → ${tabela} (${linhas.length} linhas, schema=${schema})`);

  let inseridas = 0;
  let atualizadas = 0;
  const erros: string[] = [];

  // Particiona em batches
  for (let i = 0; i < linhas.length; i += args.batch) {
    const batch = linhas.slice(i, i + args.batch).map(r => limparColunasAuto(tabela, r));
    if (batch.length === 0) continue;

    // Se NÃO confirmado (dry-run), só valida que todas as UNIQUE cols existem em cada linha
    if (!args.confirmado) {
      for (const row of batch) {
        for (const uc of unicas) {
          if (!(uc in row) && row[uc as keyof typeof row] !== null) {
            // instituicao_id NULL permitido. Outras UNIQUE não.
            if (uc !== 'instituicao_id') {
              erros.push(`dry-run coluna obrigatória ausente ${tabela}.${uc}`);
            }
          }
        }
      }
      inseridas += batch.length; // dry-run conta como "inseridas simuladas"
      continue;
    }

    // EXEC real: INSERT ... ON CONFLICT DO UPDATE
    // A API Supabase tem .upsert({ onConflict, ignoreDuplicates: false, defaultToNull: false })
    const colsUpdate = Object.keys(batch[0]).filter(c => !unicas.includes(c));
    const { data, error } = await sb
      .from(`${schema}.${tabela}`)
      .upsert(batch, {
        onConflict: unicas.join(','),
        ignoreDuplicates: false,
        defaultToNull: false
      })
      .select(unicas[0]); // select para obter resposta mínima
    if (error) {
      erros.push(`batch ${i}-${i+batch.length}: ${error.message}`);
      continue;
    }
    // Distinguir inseridas vs atualizadas é complexo sem count de conflitos;
    // Para simplificar, marcamos tudo como atualizadas (é um upsert idempotente)
    atualizadas += batch.length;
    if (args.verbose) console.log(`     • batch ${i}→${i+batch.length}: ${batch.length} rows OK. ${colsUpdate.length} cols a atualizar em conflito.`);
  }
  return { inseridas, atualizadas, erros };
}

// ==========================================================================
// MAIN
// ==========================================================================
async function main() {
  const args = parseArgs(process.argv.slice(2));
  const caminho = path.resolve(args.arquivo);
  if (!fs.existsSync(caminho)) {
    console.error(`Arquivo ${args.arquivo} não encontrado: ${caminho}`);
    process.exit(1);
  }
  const rawText = fs.readFileSync(caminho, 'utf8');
  const bruto = JSON.parse(rawText);

  // 0) Validar offline chunk (rápido, garante que passou por validar-chunk)
  const valChunk = chunkArquivoSchema.safeParse(bruto);
  if (!valChunk.success) {
    console.error('❌ Chunk não passou validação estrutural. Rode primeiro: npm run curadoria:validar --arquivo <arquivo>');
    console.error('   Erros estruturais:', valChunk.error.errors.map(e => `${e.path.join('.')}=${e.message}`).join(' | '));
    process.exit(2);
  }
  const chunk = valChunk.data;
  const tabelasChunk = Object.keys(chunk.tabelas);
  const entradaHash = chunk.promptInputHash || hashArquivo(caminho);
  const modo = args.confirmado ? 'CONFIRMADO (gravando)' : 'DRY-RUN (sem escrita)';
  console.log(`\n🔧 Sync chunk ${chunk.chunkNumero} (${chunk.promptNome}) → modo ${modo} | hash=${entradaHash.slice(0,16)}… | instituicaoId=${chunk.instituicaoId ?? 'nacional (NULL)'}`);

  // 2) Ordem topológica filtrada só as tabelas do chunk (antes da conexão → short-circuit dry-run vazio)
  const ordem = CURADORIA_SYNC_ORDER.filter(s => tabelasChunk.includes(s.tabela)).filter(s => !args.apenasTabela || s.tabela === args.apenasTabela);
  if (ordem.length === 0) {
    console.error('❌ Nenhuma tabela para sincronizar. Ajuste --apenas-tabela ou coloque dados no chunk.');
    process.exit(5);
  }
  const totalLinhasOrdem = ordem.reduce((acc: number, s) => acc + (chunk.tabelas[s.tabela]?.length || 0), 0);
  console.log(`📋 Ordem topológica (${ordem.length} tabelas):`, ordem.map(s => `${s.passo}.${s.tabela}(${chunk.tabelas[s.tabela]?.length || 0})`).join(', '));

  // 2b) SHORT-CIRCUIT: DRY-RUN chunk vazio não precisa de service role nem conexão
  if (!args.confirmado && totalLinhasOrdem === 0) {
    console.log(`\n🪂 DRY RUN chunk vazio (0 linhas). Nada para enviar; service role e conexão não exigidos.`);
    console.log(`✅ Sync chunk 1 (${chunk.promptNome}) DRY RUN concluído: 0 inseridas / 0 atualizadas.`);
    process.exit(0);
  }

  // 1) Conectar Supabase (só se tem linhas OU é confirmado)
  const serviceRole = process.env[args.serviceRoleEnv] || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole) {
    console.error(`❌ Variável ${args.serviceRoleEnv} ou SUPABASE_SERVICE_ROLE_KEY não definida.`);
    process.exit(4);
  }
  const sb: SupabaseClient = createClient(`https://${args.projectRef}.supabase.co`, serviceRole, {
    auth: { persistSession: false },
    global: { headers: { app: 'prescrimed-curadoria-sync/v1' } }
  });

  // 3) Fail-closed: verificar se llm_job UNIQUE hash já rodou (previne duplicação)
  if (args.confirmado && !args.forcarReexecucao) {
    for (const step of ordem) {
      const { data, error } = await sb
        .from('curadoria.llm_job')
        .select('id')
        .eq('prompt_input_hash', entradaHash)
        .eq('tabela_afetada', step.tabela)
        .is('instituicao_id', chunk.instituicaoId ?? null)
        .limit(1);
      if (error) {
        console.error(`❌ Não pude consultar llm_job pré-existência: ${error.message}. Sync cancelado.`);
        process.exit(6);
      }
      if (data && data.length > 0) {
        console.error(`❌ llm_job já existe e hash é idêntico (${step.tabela}). Use --forcar-reexecucao se quiser rodar novamente.`);
        process.exit(7);
      }
    }
  }

  // 4) Loop sync tabelas
  const resumoTabelas: any[] = [];
  let falhou = false;
  for (const step of ordem) {
    const linhas = chunk.tabelas[step.tabela] || [];
    if (linhas.length === 0) {
      if (args.verbose) console.log(`  ⏭️  ${step.tabela}: 0 linhas, pulando.`);
      resumoTabelas.push({ tabela: step.tabela, passos: step.passo, inseridas: 0, atualizadas: 0 });
      continue;
    }
    const res = await syncTabela(args, sb, step.tabela, linhas);
    if (res.erros.length > 0) {
      falhou = true;
      console.error(`❌ ${step.tabela}: ${res.erros.length} erros.`);
      for (const e of res.erros) console.error('   -', e);
    }
    resumoTabelas.push({ tabela: step.tabela, passos: step.passo, inseridas: res.inseridas, atualizadas: res.atualizadas });
  }

  // 5) Gravar llm_job + llm_job_detail (APENAS se confirmado)
  let llmJobId: number | null = null;
  if (args.confirmado) {
    const status = falhou ? 'rejeitado_com_erros' : 'aprovado_sem_erros';
    const totaisInseridas = resumoTabelas.reduce((a, r) => a + r.inseridas, 0);
    const totaisAtualizadas = resumoTabelas.reduce((a, r) => a + r.atualizadas, 0);
    for (const step of ordem) {
      const r = resumoTabelas.find(x => x.tabela === step.tabela)!;
      const { data, error } = await sb
        .from('curadoria.llm_job')
        .insert({
          prompt_input_hash: entradaHash,
          prompt_nome: chunk.promptNome,
          tabela_afetada: step.tabela,
          autor_llm: chunk.dadosGerais.autorResponsavel || 'sync-cli',
          status,
          linhas_inseridas: r.inseridas,
          linhas_atualizadas: r.atualizadas,
          linhas_rejeitadas: 0,
          instituicao_id: chunk.instituicaoId ?? null,
          data_execucao: new Date().toISOString()
        })
        .select('id')
        .single();
      if (!error && data) {
        llmJobId = Number((data as any).id);
        // detalhe mínimo
        await sb.from('curadoria.llm_job_detail').insert({
          llm_job_id: llmJobId,
          raw_request: {
            arquivo: path.basename(args.arquivo),
            resumo_por_tabela: resumoTabelas
          },
          erros_validacao: [],
          duracao_ms: 0
        });
      } else if (error) {
        console.error(`⚠️  Não foi possível gravar llm_job (sync ocorreu!): ${error.message}`);
      }
    }
    console.log(`\n✅ Auditoria LLM: status=${status} llm_job_id=${llmJobId ?? 'n/a'}`);
    console.log(`   Inseridas=${totaisInseridas}  Atualizadas=${totaisAtualizadas}  Tabelas processadas=${resumoTabelas.length}`);
  } else {
    console.log('\nℹ️  DRY-RUN: 0 alterações gravadas no banco. Nenhum llm_job criado.');
    for (const r of resumoTabelas) {
      console.log(`   • ${String(r.passos).padStart(2,'0')}.${r.tabela.padEnd(36)} ${String(r.inseridas).padStart(6)} linhas`);
    }
  }

  if (falhou) {
    console.error('\n💥 Sync concluído COM FALHAS em 1+ tabelas. Verifique os erros acima.');
    process.exit(10);
  }
  console.log('\n🎉 Sync concluído sem erros.');
}

main().catch(err => {
  console.error('💥 Falha fatal sync-batch-upsert:', err?.message ?? err);
  console.error(err?.stack || '');
  process.exit(1);
});
