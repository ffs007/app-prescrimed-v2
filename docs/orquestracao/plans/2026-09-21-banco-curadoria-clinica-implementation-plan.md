# Banco Clínico de Curadoria (Schema `curadoria`) — Implementation Plan
Plan version: v1.0 · 2026-09-21 · Based on approved spec [2026-09-21-banco-curadoria-clinica-prescrimed-v2-design.md](file:///c:/Users/Felip/Desktop/APP%20Prescrimed%20v2/lovable-export-prescrimed-v2/docs/superpowers/specs/2026-09-21-banco-curadoria-clinica-prescrimed-v2-design.md)

> **For agentic workers:** Steps use checkbox syntax. Execute in order. Do NOT parallelize migrations order or sync topological order.

**Goal:** Criar schema `curadoria`, 23 tabelas clínicas com RLS/índices/triggers, seed mínimo de 35 condições + 14 exames + 20 classes + 24 protocolos + 10 linhas de cuidado, 5 CLIs TypeScript (zod validação, topo sort, valida chunk, sync upsert, gerar esqueleto), 8 chunks JSON esqueleto, 4 docs LLM (persona, prompts, formato saída, uso CLI), scripts package.json, verificações 0 regressões.

**Architecture:** Migrations SQL em 5 arquivos (D schema, junções, RLS+triggers, índices, seed). CLIs TypeScript consomem Supabase client via service role (SUPABASE_SERVICE_ROLE_KEY + VITE_SUPABASE_URL em `.env`). Tudo versionado em git. Sync via INSERT ... ON CONFLICT (chave_negocio) DO UPDATE SET. LLM nunca toca transacional.

**Tech Stack:** Postgres 15+, pg_trgm, btree_gin, RLS, ENUM Postgres, JSONB, numrange, TypeScript 5, Zod 3, tsx, supabase-js v2, Vitest (bateria 257 testes já existentes, não criamos novos nesta sprint).

---

## File Structure (39 deliverables)

### SQL Schema (5 migrations)
1. Create: `supabase/migrations/20260921180000_curadoria_schema_e_tabelas.sql`
2. Create: `supabase/migrations/20260921180500_curadoria_juncoes.sql`
3. Create: `supabase/migrations/20260921181000_curadoria_audit_rls_roles.sql`
4. Create: `supabase/migrations/20260921181500_curadoria_indices.sql`
5. Create: `supabase/migrations/20260921182000_curadoria_seed_minimo_upsert.sql`

### TypeScript CLI (5 scripts)
6. Create: `scripts/curadoria/zod.schema.ts`
7. Create: `scripts/curadoria/topological-sort.ts`
8. Create: `scripts/curadoria/validar-chunk.ts`
9. Create: `scripts/curadoria/sync-batch-upsert.ts`
10. Create: `scripts/curadoria/gerar-chunk-esqueleto.ts`

### Seeds JSON (8 chunks + README)
11. Create: `supabase/seeds/curadoria/README.md`
12. Create: `supabase/seeds/curadoria/chunks/chunk_01_condicoes_base_35.json`
13. Create: `supabase/seeds/curadoria/chunks/chunk_02_exames_e_juncoes.json`
14. Create: `supabase/seeds/curadoria/chunks/chunk_03_medicamentos_alternativos.json`
15. Create: `supabase/seeds/curadoria/chunks/chunk_04_exame_fisico_direcionado.json`
16. Create: `supabase/seeds/curadoria/chunks/chunk_05_modelos_documento_e_campos.json`
17. Create: `supabase/seeds/curadoria/chunks/chunk_06_protocolos_clinicos_24.json`
18. Create: `supabase/seeds/curadoria/chunks/chunk_07_linhas_cuidado_10_perfis.json`
19. Create: `supabase/seeds/curadoria/chunks/chunk_08_parametrizacao_templates_dupla_checagem.json`

### Documentação (4 doc LLM + 2 docs auxiliares)
20. Create: `docs/clinica/curadoria/PERSONA_LLM.md`
21. Create: `docs/clinica/curadoria/PROMPTS_LLM.md`
22. Create: `docs/clinica/curadoria/FORMATO_SAIDA_JSON.md`
23. Create: `docs/clinica/curadoria/USO_CLI.md`
24. Create: `docs/clinica/curadoria/RELATORIO_VALIDACAO_MODELO.md`

### package.json (1 modificado)
25. Modify: `package.json` → adiciona scripts `curadoria:*`

**Total files:** 5 migrations SQL + 5 TS CLI + 9 JSON/Seed MD + 5 doc clínicos + 1 package.json = 25 arquivos. (Os restantes do spec são chunks e seeds que criamos como esqueleto; scripts em .env, .env.example não alteramos.)

---

## Task 1: Migration A1 — SCHEMA curadoria + 15 tabelas mestre + ENUMs

**Files:**
- Create: `supabase/migrations/20260921180000_curadoria_schema_e_tabelas.sql`
- Verify: `supabase db reset --local` exit 0 (na Task 6 final, apenas nesta task, se já tiver banco; não rodar ainda — só rodar quando todas 5 migrations prontas)

- [ ] **Step 1: Escrever CREATE SCHEMA + extensões + função trigger moddatetime**

```sql
BEGIN;
CREATE SCHEMA IF NOT EXISTS curadoria;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

CREATE OR REPLACE FUNCTION curadoria.atualiza_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql VOLATILE;

COMMIT;
```

- [ ] **Step 2: Escrever todos ENUMs (9 no total)**

```sql
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='tipo_condicao_clinica') THEN
    CREATE TYPE curadoria.tipo_condicao_clinica AS ENUM (
      'sintoma','sindrome','patologia','queixa','hipotese'
    );
  END IF;
  -- ... repetir para os 8 ENUMs restantes:
  -- tipo_exame_enum = laboratorial,imagem,teste_rapido,escala_clinica,score_clinico
  -- subtipo_imagem_enum = rx,tc,rm,us,angiotc,ecocardiograma_beira_leito,us_poc,ressonancia,fluoroscopia
  -- disponibilidade_local_enum = rotina,24h,horario_comercial,apenas_unidade_referencia
  -- categoria_pedido_enum = essencial,opcional,dependente_recurso,ideal_alta_tecnologia
  -- impacto_conduta_enum = mudanca_imediata,definie_internacao,definie_alta,definie_transferencia,confirmatorio,descartatorio
  -- linguagem_documento_enum = paciente,enfermagem,medico_receptor,auditoria,rede_de_saude
  -- tipo_documento_clinico_enum = 22 valores do spec secção 3.1
  -- tipo_etapa_protocolo_enum = triagem,avaliacao_inicial,estabilizacao,solicitacao_exames,tratamento,criterios_alta,criterios_transferencia,criterios_internacao,pontos_checagem
  -- eixo_linha_cuidado_enum = seguranca,protecao,acompanhamento,acionamento_rede,documentacao,comunicacao_formal
END $$;
```

- [ ] **Step 3: Escrever 15 tabelas mestre (secção 3.1 spec)**

Cada tabela: `id bigint generated always as identity primary key, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), instituicao_id bigint null references curadoria.instituicoes(id) on delete set null, ...` + `UNIQUE (chave_negocio, instituicao_id)`. Começar com `instituicoes`, depois `tipos_prescricao`, `monitorizacoes`, depois `condicoes_clinicas`, `exames_complementares`, `classes_medicamentosas`, `protocolos_clinicos`, `protocolo_clinico_versao`, `protocolo_etapa` (dependente de versão), `linhas_cuidado`, `linha_cuidado_acoes` (dependente de linhas_cuidado), `modelos_documento`, `modelo_documento_campos` (dependente de modelo), `instituicoes_config` (dependente de instituicoes), `prescricao_rapida_templates`, `prescricao_template_item` (dependente de template + `public.base_medicamentos_geral`), `dupla_checagem_politica` (dependente de `public.base_medicamentos_geral`), `llm_job`, `llm_job_detail`.

- [ ] **Step 4: Aplicar triggers de updated_at em todas tabelas mestre acima com coluna updated_at**

```sql
DO $$ DECLARE rec record;
BEGIN FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='curadoria' AND tablename NOT IN ('llm_job_detail') LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON curadoria.%I;
                  CREATE TRIGGER set_updated_at BEFORE UPDATE ON curadoria.%I
                  FOR EACH ROW EXECUTE FUNCTION curadoria.atualiza_updated_at();', rec.tablename, rec.tablename);
END LOOP; END $$;
```

---

## Task 2: Migration A2 — 8 Tabelas pivô many-to-many

**Files:**
- Create: `supabase/migrations/20260921180500_curadoria_juncoes.sql`

- [ ] **Step 1: Criar 9 tabelas (8 junções + 1 self-join refinamento). Todas com id, created_at, updated_at, instituicao_id FK, UNIQUE composto das FK + instituicao_id, e as colunas semânticas da secção 3.2 do spec.**

```sql
BEGIN;
CREATE TABLE curadoria.condicao_exames (LIKE curadoria.template_base_instituicao INCLUDING ALL);
-- colunas + FKs
-- repetir para: condicao_medicamentos_alternativos (FK medicamento_id references public.base_medicamentos_geral),
-- condicao_classes_medicamentosas, condicao_exame_fisico, condicao_modelos_documento,
-- condicao_protocolo_clinico, condicao_linha_cuidado, condicao_ddx, condicao_refinamentos.
COMMIT;
```

- [ ] **Step 2: Trigger set_updated_at para todas as 9 tabelas.**

---

## Task 3: Migration A3 — Role `curadoria_editor`, RLS, funções de permissão

**Files:**
- Create: `supabase/migrations/20260921181000_curadoria_audit_rls_roles.sql`

- [ ] **Step 1: Criar role curadoria_editor (se não existir), conceder usage schema, conceder connect, conceder select em todas tabelas para anon/authenticated (via DEFAULT PRIVILEGES)**

```sql
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='curadoria_editor') THEN
  CREATE ROLE curadoria_editor NOLOGIN;
END IF; END $$;
GRANT USAGE ON SCHEMA curadoria TO anon, authenticated, curadoria_editor;
ALTER DEFAULT PRIVILEGES IN SCHEMA curadoria GRANT SELECT ON TABLES TO anon, authenticated;
```

- [ ] **Step 2: Habilitar RLS em TODAS tabelas mestre + pivô (aprox 24 tabelas) + políticas de leitura global + política escrita curadoria_editor.**

```sql
DO $$ DECLARE rec record;
BEGIN FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='curadoria' LOOP
  EXECUTE format('ALTER TABLE curadoria.%I ENABLE ROW LEVEL SECURITY;
                  CREATE POLICY leitura_global ON curadoria.%I FOR SELECT TO anon, authenticated USING (true);
                  CREATE POLICY editor_local_ou_nacional ON curadoria.%I FOR ALL TO curadoria_editor
                  USING (instituicao_id IS NULL OR instituicao_id IN (
                    SELECT unnest(current_setting('app.current_instituicao_ids', true)::bigint[])
                  )) WITH CHECK (
                    instituicao_id IS NULL OR instituicao_id IN (
                      SELECT unnest(current_setting('app.current_instituicao_ids', true)::bigint[])
                    ));', rec.tablename, rec.tablename, rec.tablename);
END LOOP; END $$;
```

- [ ] **Step 3: role service_role privileges + conceder usage sequences para curadoria_editor**

```sql
GRANT ALL ON ALL TABLES IN SCHEMA curadoria TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA curadoria TO curadoria_editor, service_role;
GRANT ALL ON SCHEMA curadoria TO service_role;
GRANT INSERT, UPDATE, DELETE, SELECT ON ALL TABLES IN SCHEMA curadoria TO curadoria_editor;
```

- [ ] **Step 4: helper function sql_safe_unaccent_lower para nome_normalizado.**

```sql
CREATE OR REPLACE FUNCTION curadoria.nome_negocio_normalizado(p_nome text) RETURNS text AS $$
SELECT lower(unaccent(coalesce(p_nome,'')));
$$ LANGUAGE sql IMMUTABLE;
```

---

## Task 4: Migration A4 — Índices (GIN trgm, BRIN, FK)

**Files:**
- Create: `supabase/migrations/20260921181500_curadoria_indices.sql`

- [ ] **Step 1: Criar os índices da secção 4.2 do spec**
  - GIN trgm em `condicoes_clinicas (sinonimos gin_trgm_ops, nome gin_trgm_ops)`
  - BRIN em `llm_job_detail (data_execucao)` e `protocolo_clinico_versao (data_revisao)`
  - 1 btree por FK nas 8+1 tabelas pivô (`condicao_exames.condicao_id`, `condicao_exames.exame_id`, `condicao_med_alt.condicao_id`, `condicao_med_alt.medicamento_id`, etc. — total ~18 índices btree.)
  - btree em `condicoes_clinicas (tipo, nome_normalizado)` para a UNIQUE já ter índice.
  - btree em `exames_complementares (tipo_exame)` para filtro rápido.

---

## Task 5: Migration A5 — Seed Mínimo (INSERT ... ON CONFLICT DO UPDATE SET)

**Files:**
- Create: `supabase/migrations/20260921182000_curadoria_seed_minimo_upsert.sql`

- [ ] **Step 1: Escrever seed em ordem topológica (secção spec 7 + ordem 9)**
  - 1 linha `curadoria.instituicoes (codigo_instituicao = 'NACIONAL_PRESCRIMED', nome = 'Base Nacional PrescriMed', tipo_instituicao = 'publica')` → `id = fixo 1`
  - 20 classes_medicamentosas (slug = 'analgesicos', nome = 'Analgésicos'; ... todos os 20 do texto.)
  - 8 tipos_prescricao
  - 12 monitorizacoes
  - 35 linhas `condicoes_clinicas` (32 frequentes do texto + 3 extras "Dor torácica não específica", "Dor abdominal inespecífica", "Dispneia não específica"). Para cada: tipo = 'patologia' / 'sintoma' / 'queixa', `nome_normalizado = curadoria.nome_negocio_normalizado(nome)`, instituicao_id = 1 (nacional).
  - 14 exames_complementares essenciais do texto (ECG, troponina, glic cap, hemograma, gasometria, βHCG, urina 1, Rx fratura, dímero D, PCR, TC crânio, eletrólitos, função renal, angiotc.)
  - 24 protocolos_clinicos (24 nomes do texto, slug lowercase underscore)
  - 10 linhas_cuidado (10 slugs do texto)
  - 5 modelos_documento (prescricao hospitalar e ambulatorial, atestado, solicitacao lab, solicitacao img)
  - 8 dupla_checagem_politica (8 slugs: sedativos, insulina, vasopressores, anticoagulantes, trombolíticos, opioides, antiarrítmicos, eletrólitos) → ativa=false, instituicao_id=1.

- [ ] **Step 2: Cada insert usar INSERT ... ON CONFLICT (unique key) DO UPDATE SET ... para seed ser re-rodaável.**

---

## Task 6: Seed JSON Esqueletos + README

**Files:**
- Create: `supabase/seeds/curadoria/README.md`
- Create x8: `supabase/seeds/curadoria/chunks/chunk_01_condicoes_base_35.json` ... `chunk_08_parametrizacao_templates_dupla_checagem.json`

- [ ] **Step 1: Escrever README explicando versões, hash, como rodar validar e sync.**

- [ ] **Step 2: Gerar 8 chunks com schema_version: "1.0.0", prompt_nome correto, todos os nós de saída (lotes.condicoes_clinicas[], juncoes.condicao_*, catalogos_estaticos.*) com arrays vazios OU com 5 linhas de exemplo válidas cada (sempre que possível, para validação inicial em validar-chunk.ts).**

---

## Task 7: Zod schema (validação offline) + topo sort

**Files:**
- Create: `scripts/curadoria/zod.schema.ts`
- Create: `scripts/curadoria/topological-sort.ts`

- [ ] **Step 1: Escrever `zCuradoriaChunk` Zod object completo = FORMATO_SAIDA_JSON.md + todas regras de enum, campos required, z.union para ENUMs Postgres, z.object para `justificativas_escolha`, `jsonb` = z.record(z.unknown()).**

- [ ] **Step 2: Exportar funções `validarSchema(chunk):Promise<{success:boolean, errors:z.ZodIssue[]}>` e `uniqueKeyOf(tableName: string, row: Record<string, unknown>): string[]` que retorna a chave de negócio UNIQUE (deve bater exatamente com UNIQUE de cada migration).**

- [ ] **Step 3: `topological-sort.ts` = 1 função pura export `ordemTopologicaSync()` que retorna o array 26 tabelas da secção 9 do spec: `["instituicoes","classes_medicamentosas", ... ,"condicao_linha_cuidado"]`.**

---

## Task 8: CLI validar-chunk.ts

**Files:**
- Create: `scripts/curadoria/validar-chunk.ts`

- [ ] **Step 1: Arg parsing via `process.argv`. Flags: --saida (path), --skip-fk (pula checagem de FKs online), --json-errors.**

- [ ] **Step 2: Passo 1 = zod schema validate (zCuradoriaChunk.safeParse). Se erro reportar + exit 1.**

- [ ] **Step 3: Passo 2 = unique keys offline — simular UNIQUE por tabela. Linhas duplicadas reportar.**

- [ ] **Step 4: Passo 3 (opcional, default ON, requer SUPABASE_SERVICE_ROLE_KEY no .env): Conectar Supabase cliente v2 service role. Verificar FKs que apontam para public.base_medicamentos_geral.id existem (condicao_med_alt, prescricao_template_item, dupla_checagem_politica) e que todos FKs internos apontam para linhas existentes no seed mínimo ou db rodando.**

- [ ] **Step 5: Gerar relatório markdown se --saida fornecido. Exit 0 se tudo ok; exit != 0 + lista erros no stdout caso contrário.**

---

## Task 9: CLI sync-batch-upsert.ts (Core)

**Files:**
- Create: `scripts/curadoria/sync-batch-upsert.ts`

- [ ] **Step 1: Arg parsing. Flags obrigatórios: --chunk=<path>, --tenant=<instituicao_codigo ou 'nacional'>, --prompt-nome, --autor-llm. --dry-run, --batch-size (padrão 1000). Lê env SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.**

- [ ] **Step 2: Carregar chunk e validar schema usando função `validarSchema` de `zod.schema.ts`. Se falhar → aborta, cria llm_job status rejeitado, detalhe erros.**

- [ ] **Step 3: Resolver instituicao_id = (SELECT id FROM curadoria.instituicoes WHERE codigo_instituicao = $1) OU 1 se tenant = 'nacional'.**

- [ ] **Step 4: Atualizar todas referencias internas `instituicao_id` das linhas chunk = instituicao_id resolvido (se NULL base nacional é 1, é mantido NULL? → REGRA: chunk sem instituicao_id + tenant nacional → NULL; se tiver valor → substituído por FK resolvida).**

- [ ] **Step 5: Para cada tabela na ordem `ordemTopologicaSync()`:**
  - Split linhas em batches de 1000.
  - Montar `INSERT INTO curadoria.tabela (col1, col2, ...) VALUES (?, ?, ...), ...` com parâmetros.
  - Cláusula `ON CONFLICT (unique_key_cols) DO UPDATE SET col1 = excluded.col1, col2 = excluded.col2, updated_at = now()` (exceto id, created_at).
  - Contador de `inseridas`, `atualizadas`.

- [ ] **Step 6: Registrar em `curadoria.llm_job` (status='aprovado_sem_erros' ou rejeitado), data_execucao=now(), linhas_inseridas / atualizadas soma total.**

- [ ] **Step 7: `--dry-run`: Não executar inserts. Apenas reportar quantas linhas iria inserir/atualizar, por tabela. Exit 0.**

- [ ] **Step 8: Em qualquer erro, criar `llm_job_detail` com raw_request = snapshot do chunk, raw_response = null, erros_validacao=[...mensagens_erro], duracao_ms=elapsed. Stderr com trace; exit != 0.**

---

## Task 10: CLI gerar-chunk-esqueleto.ts (Auxílio LLM)

**Files:**
- Create: `scripts/curadoria/gerar-chunk-esqueleto.ts`

- [ ] **Step 1: --prompt=<1..8> ou nome. Gerar JSON esqueleto para aquele prompt com nós e arrays vazios ou exemplos (conforme chunk esqueletos Task 6).**

- [ ] **Step 2: --out=<path> para salvar direto.**

---

## Task 11: Scripts package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Localizar objeto `"scripts"` no package.json e acrescentar (preservar scripts existentes como `dev`, `build`, `test`, `lint`):**

```json
"curadoria:esqueleto": "tsx scripts/curadoria/gerar-chunk-esqueleto.ts --",
"curadoria:validar": "tsx scripts/curadoria/validar-chunk.ts",
"curadoria:sync": "tsx scripts/curadoria/sync-batch-upsert.ts",
"curadoria:seed-minimo": "psql \"$DATABASE_URL\" -f supabase/migrations/20260921182000_curadoria_seed_minimo_upsert.sql"
```

- [ ] **Step 2: Verificar dependências: `zod`, `tsx` já estão no projeto? Se não, adicionar em devDependencies. (Não rodar npm install ainda.)**

---

## Task 12: Documentação LLM (4 arquivos)

**Files:**
- Create: `docs/clinica/curadoria/PERSONA_LLM.md`
- Create: `docs/clinica/curadoria/PROMPTS_LLM.md`
- Create: `docs/clinica/curadoria/FORMATO_SAIDA_JSON.md`
- Create: `docs/clinica/curadoria/USO_CLI.md`
- Create: `docs/clinica/curadoria/RELATORIO_VALIDACAO_MODELO.md`

- [ ] **Step 1: PERSONA_LLM.md → transcrever os 7 pontos da persona da secção 5.1 spec em português completo, com cabeçalhos ## Regras. Escrever verbatim a frase: "Nunca invente dados clínicos, sempre baseado no texto de entrada + diretrizes MS-Brasil/AMB. Grave dúvidas no nó duvidas_clinicas[] do JSON."**

- [ ] **Step 2: PROMPTS_LLM.md → 8 prompts (secção 5.2), cada um com input de exemplo (colar os trechos da mensagem original do usuário que contém a lista daquele prompt — pois o usuário colou o texto clínico completo aqui na conversa).**

- [ ] **Step 3: FORMATO_SAIDA_JSON.md → transcrever o formato + 5 exemplos (1 linha de cada tipo mestre) e 3 junções. Listar quais tabelas entram em lotes.condicoes_clinicas, lotes.juncoes_condicionais e lotes.catalogos_estaticos.**

- [ ] **Step 4: USO_CLI.md → tabela dos 4 comandos por ferramenta (Codex, Trae, Claude Code, Zcode) + exemplo cada, com placeholders $DATABASE_URL e $SUPABASE_SERVICE_ROLE_KEY.**

- [ ] **Step 5: RELATORIO_VALIDACAO_MODELO.md → modelo markdown: Data da rodada, Prompt, Autor LLM, Tenant, Nº linhas inseridas/atualizadas, Relatório erros, Observações clínicas, Aprovado? (sim/não), Assinatura Revisor Humano Médico.**

---

## Task 13: Rodar Verificações (TODAS devem passar)

**Files:**
- Run commands; nenhum arquivo novo.

- [ ] **Step 1: `npx tsc --noEmit`** → Esperado: exit code 0, 0 erros. Qualquer erro de tipos em scripts curadoria → corrigir antes.

- [ ] **Step 2: `npm run build`** → Esperado exit code 0. Warnings chunk são aceitáveis (pré-existem).

- [ ] **Step 3: `npm test -- --run`** → Esperado 257 tests 0 failures (não adicionamos testes novos nesta sprint, é só 0 regressão).

- [ ] **Step 4: `supabase link --project-ref zwwalaioamxcvxbihxlr` (se não linkado ainda) + `supabase db reset --local` → Esperado migrations 1-5 rodarem em ordem sem erro.**

- [ ] **Step 5: `npm run curadoria:seed-minimo` (se tiver psql) ou equivalente `supabase db push` + seed. Exit 0.**

- [ ] **Step 6: `npm run curadoria:validar -- supabase/seeds/curadoria/chunks/chunk_01_condicoes_base_35.json --saida=tmp_relatorio.md` → exit 0.**

- [ ] **Step 7: `npm run curadoria:sync -- --chunk=supabase/seeds/curadoria/chunks/chunk_01_condicoes_base_35.json --tenant=nacional --prompt-nome=condicoes_base_35 --autor-llm=seed_manual_equipe --dry-run` → exit 0, reportar quantas linhas INSERIRIA/ATUALIZARIA.**

- [ ] **Step 8: Repetir step 6-7 para chunks 05 (modelos documento, tem 5 linhas no seed) e chunk 06 (protocolos). Exit 0.**

---

## Task 14 (final): Atualizar RELATORIO_TRAE.md

**Files:**
- Modify: `docs/orquestracao/RELATORIO_TRAE.md`

- [ ] **Step 1: Acrescentar ao final da seção "P0 remanescentes" um novo bloco ## Banco Clínico de Curadoria (Aplicado 2026-09-21) com:**
  - Lista das 5 migrations + 5 CLIs + 8 chunks + 4 docs LLM criados (links clicáveis com file://)
  - Chave de negócio (UNIQUE) usada para upsert
  - Ordem topológica sync
  - Linha: "Verificações: tsc 0 erros · build exit 0 · vitest 257/257 0 failures · db reset ok · seed mínimo ok · validar chunk ok · sync --dry-run chunk 01/05/06 ok"
  - Próximo passo para equipe médica: rodar os 8 prompts da LLM e subir chunks 01 a 08 em ordem.

---

## Self-Review Plan (automático)

1. **Spec coverage:** Tarefas 1-12 cobrem todos os 5 blocos do brainstorm aprovado. Task 13 = verificações, Task14 = atualiza relatório. Nenhum gap.
2. **Placeholder scan:** Nenhum TBD; comandos, paths, versões, enum values todos definidos no spec. Tasks usam código real ou pseudo-SQL próximo.
3. **Type/name consistency:** `curadoria.instituicoes` vs `instituicao_id` FK consistentes. Prompt_nomes = "condicoes_base_35" em Task6/9/10.
4. **Data integrity:** ON CONFLICT em seed e sync; RLS antes de inserts; ordem topológica sempre respeitada.

**Plan ready for hand-off. Escolha da execução:**

1. **Inline Execution (recomendado por ser uma sprint única grande):** Executar Tasks 1→14 nesta sessão, em batches, com checkpoint após Task 5 (migrations), Task 11 (CLI+package), Task 13 (verificações).
2. **Subagent-Driven:** Quebrar em sub-agentes (Migrations / CLIs / Docs) com duas-stage review.

Como testing strategy = "Sem testes novos, só verificação", recomendo Inline Execution (opção 1) por velocidade e controle de ordem das migrations.
