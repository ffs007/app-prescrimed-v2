#!/usr/bin/env tsx
/**
 * CLI: Gerar arquivo JSON esqueleto para um chunk de dados clínicos.
 *
 * Cada chunk corresponde a 1 dos 8 prompts LLM topológicos (mesma ordem):
 *   1 = condições clínicas + refinamentos + DDX
 *   2 = exames complementares + condicao_exames (justificativas/impacto)
 *   3 = medicamentos/alternativos + classes medicamentosas + condicao_*
 *   4 = exame físico direcionado + condicao_exame_fisico
 *   5 = modelos documento + campos + condicao_modelos_documento
 *   6 = protocolos clínicos + versões + 9 etapas + condicao_protocolo_clinico
 *   7 = linhas de cuidado + ações + condicao_linha_cuidado
 *   8 = parametrização: instituicoes_config, templates receita rápida, dupla checagem
 *
 * Saída: arquivo em supabase/seeds/curadoria/chunks/chunk_NN.json
 * O conteúdo final segue rigorosamente o schema Zod de zod.schema.ts.
 *
 * Uso:
 *   npx tsx scripts/curadoria/gerar-chunk-esqueleto.ts \
 *       --numero 1 \
 *       --prompt-nome "condicoes_e_ddx" \
 *       --autor "Dr. Exemplo CRM/XXX" \
 *       --instituicao-id 1 \
 *       --saida supabase/seeds/curadoria/chunks/chunk_01.json
 *
 * Flags opcionais:
 *   --vazia   = gera JSON sem linhas de exemplo, apenas header e [] tabelas
 *   --exemplo = gera 1-2 linhas de exemplo por tabela (DEFAULT)
 */

import fs from 'node:fs';
import path from 'node:path';
import { CURADORIA_SYNC_ORDER } from './topological-sort.js';

const PROMPTS_LLM_ORDEM_TOPOLOGICA = [
  { numero: 1, nome: 'condicoes_e_ddx',             tabelasChave: ['condicoes_clinicas','condicao_ddx','condicao_refinamentos'] },
  { numero: 2, nome: 'exames_complementares',        tabelasChave: ['exames_complementares','condicao_exames'] },
  { numero: 3, nome: 'medicamentos_alternativos',    tabelasChave: ['classes_medicamentosas','condicao_classes_medicamentosas','condicao_medicamentos_alternativos'] },
  { numero: 4, nome: 'exame_fisico_direcionado',     tabelasChave: ['condicao_exame_fisico'] },
  { numero: 5, nome: 'modelos_documento',            tabelasChave: ['modelos_documento','modelo_documento_campos','condicao_modelos_documento'] },
  { numero: 6, nome: 'protocolos_clinicos',          tabelasChave: ['protocolos_clinicos','protocolo_clinico_versao','protocolo_etapa','condicao_protocolo_clinico'] },
  { numero: 7, nome: 'linhas_cuidado',               tabelasChave: ['linhas_cuidado','linha_cuidado_acoes','condicao_linha_cuidado'] },
  { numero: 8, nome: 'parametrizacao_institucional', tabelasChave: ['instituicoes_config','prescricao_rapida_templates','prescricao_template_item','dupla_checagem_politica'] }
];

type Args = {
  numero: number;
  promptNome?: string;
  autor?: string;
  instituicaoId?: number;
  saida: string;
  vazia: boolean;
};

function parseArgs(argv: string[]): Args {
  const get = (flag: string) => {
    const idx = argv.indexOf(flag);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  const tem = (flag: string) => argv.includes(flag);
  const numero = Number(get('--numero') || '1');
  if (!PROMPTS_LLM_ORDEM_TOPOLOGICA.find(p => p.numero === numero)) {
    throw new Error(`--numero ${numero} inválido. Use 1..8.`);
  }
  const meta = PROMPTS_LLM_ORDEM_TOPOLOGICA.find(p => p.numero === numero)!;
  return {
    numero,
    promptNome: get('--prompt-nome') || meta.nome,
    autor: get('--autor'),
    instituicaoId: get('--instituicao-id') ? Number(get('--instituicao-id')) : undefined,
    saida: get('--saida') || `supabase/seeds/curadoria/chunks/chunk_${String(numero).padStart(2,'0')}.json`,
    vazia: tem('--vazia')
  };
}

function linhasExemplo(tabela: string): unknown[] {
  // Retorna 0-2 linhas fake, apenas para mostrar shape ao LLM / humano.
  // Esses valores NUNCA são sincronizados; flag --vazia remove todos eles.
  switch (tabela) {
    case 'condicoes_clinicas':
      return [{ tipo:'sintoma', nome:'Demonstrativo REMOVER', sinonimos:{}, red_flags:['exemplo remover'], cid10:[] }];
    case 'exames_complementares':
      return [{ codigo_exame:'EXEMPLO_REMOVER', nome:'Exame exemplo remover', tipo_exame:'laboratorial' as const }];
    case 'classes_medicamentosas':
      return [{ slug:'exemplo_remover', nome:'Classe exemplo remover' }];
    case 'protocolos_clinicos':
      return [{ slug:'protocolo_exemplo_remover', nome:'Protocolo exemplo remover' }];
    case 'linhas_cuidado':
      return [{ slug:'linha_exemplo_remover', nome:'Linha exemplo remover' }];
    default:
      return [];
  }
}

function montarChunk(args: Args): Record<string, unknown> {
  const meta = PROMPTS_LLM_ORDEM_TOPOLOGICA.find(p => p.numero === args.numero)!;
  const tabelasDesteChunk = CURADORIA_SYNC_ORDER.filter(step => meta.tabelasChave.includes(step.tabela)).map(s => s.tabela);
  const tabelas = Object.fromEntries(
    tabelasDesteChunk.map(t => [t, args.vazia ? [] : linhasExemplo(t)])
  );
  return {
    $schemaChunkCuradoria: 1,
    chunkNumero: args.numero,
    promptNome: args.promptNome,
    promptInputHash: '',
    instituicaoId: args.instituicaoId ?? null,
    dadosGerais: {
      dataCriacao: new Date().toISOString(),
      autorResponsavel: args.autor ?? null,
      observacoes: 'PREENCHER com os dados clínicos e remover linhas exemplo. Validar antes: npm run curadoria:validar.'
    },
    tabelas
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outPath = path.resolve(args.saida);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(montarChunk(args), null, 2) + '\n', 'utf8');
  console.log(`[OK] Chunk ${String(args.numero).padStart(2,'0')} gerado em: ${outPath}`);
}

main();
