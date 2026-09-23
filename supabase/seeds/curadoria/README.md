# Dados clínicos curados — PrescriMed (schema `curadoria`)

Pasta de chunks JSON versionados que alimentam o banco de referência clínico.

## Estrutura

| Arquivo / Pasta        | Propósito                                                                     |
|------------------------|-------------------------------------------------------------------------------|
| `chunks/chunk_01.json` | Condições clínicas (35) + DDX + Refinamentos sintoma → síndrome → patologia  |
| `chunks/chunk_02.json` | Exames complementares + junção `condicao_exames` c/ justificativa e impacto  |
| `chunks/chunk_03.json` | Classes medicamentosas + `condicao_classes_*` + medicamentos alternativos    |
| `chunks/chunk_04.json` | Exame físico direcionado por condição (16 sistemas ENUM)                     |
| `chunks/chunk_05.json` | Modelos de documento (22 tipos) + campos parametrizáveis                     |
| `chunks/chunk_06.json` | 24 Protocolos clínicos + versionamento + 9 etapas (fixas) por versão         |
| `chunks/chunk_07.json` | 10 Linhas de cuidado por perfil de risco + ações + conexões válidas          |
| `chunks/chunk_08.json` | Parametrização por instituição: config, templates receita rápida, dupla checagem |

## Regras de escrita de chunks

1. **Sempre preencha `dadosGerais.autorResponsavel`** com CRM/CPF/identificação do clínico responsável pela curadoria.
2. **Não invente colunas**: todo chunk é validado por `zod.schema.ts`. Se uma coluna não existe no schema, a validação falha.
3. **Todas as junções** (`condicao_*`) precisam referenciar IDs existentes das tabelas mestre (instituição / condição / medicamento / exame / protocolo / linha / modelo).
4. **Medicamento id** é UUID (FK `public.base_medicamentos_geral.id`), **não é bigint**.
5. **Off-label**: `eh_off_label=true` obriga `off_label_justificativa` com **mínimo 30 caracteres**.
6. **Dupla checagem** é desativada por padrão (`ativa=false`) e habilitada **por instituição**.
7. **Base nacional**: `instituicaoId=null` = compartilhada por todas as instituições.

## Workflow obrigatório FAIL-CLOSED (nunca pule etapas)

```bash
# 0) (opcional) Gerar um chunk esqueleto vazio para um prompt novo
npm run curadoria:esqueleto -- --numero 9 --prompt-nome "novo_bloco"

# 1) Preencher o chunk JSON manualmente / via LLM.

# 2) Validação offline (Sempre! Custa < 1s e detecta 90% dos erros)
npm run curadoria:validar -- \
    --arquivo supabase/seeds/curadoria/chunks/chunk_01.json

# 3) DRY-RUN de sync (simula batch 1000 mas não grava nada)
npm run curadoria:sync -- \
    --arquivo supabase/seeds/curadoria/chunks/chunk_01.json \
    --project-ref zwwalaioamxcvxbihxlr

# 4) Confirmação real: adicionar --confirmado APENAS se dry-run passou
npm run curadoria:sync -- \
    --arquivo supabase/seeds/curadoria/chunks/chunk_01.json \
    --project-ref zwwalaioamxcvxbihxlr \
    --confirmado --verbose
```

## 8 Prompts LLM (mesma ordem topológica dos chunks)

| Prompt # | Tema                                           | Tabelas afetadas                                                        |
|----------|------------------------------------------------|-------------------------------------------------------------------------|
| 1        | Condições + DDX + Refinamento                  | condicoes_clinicas, condicao_ddx, condicao_refinamentos                |
| 2        | Exames complementares + justificativas         | exames_complementares, condicao_exames                                  |
| 3        | Classes medicamentosas + alternativos/off-label| classes_medicamentosas, condicao_classes_medicamentosas, condicao_medicamentos_alternativos |
| 4        | Exame físico direcionado por condição          | condicao_exame_fisico                                                   |
| 5        | Modelos de documento + campos personalizados   | modelos_documento, modelo_documento_campos, condicao_modelos_documento |
| 6        | Protocolos + 9 etapas                          | protocolos_clinicos, protocolo_clinico_versao, protocolo_etapa, condicao_protocolo_clinico |
| 7        | Linhas de cuidado + ações + conexões           | linhas_cuidado, linha_cuidado_acoes, condicao_linha_cuidado            |
| 8        | Config institucional + templates + dupla checagem | instituicoes_config, prescricao_rapida_templates, prescricao_template_item, dupla_checagem_politica |

## Auditoria LLM

Todo sync `--confirmado` grava automaticamente:
- `curadoria.llm_job`: 1 linha por tabela processada com UNIQUE hash SHA-256 do chunk + prompt + tabela + instituição (previne rodar o mesmo prompt 2x).
- `curadoria.llm_job_detail`: 1 linha com raw_request, contadores de linhas e erros de validação.

Para forçar re-execução de um chunk idêntico:
```bash
npm run curadoria:sync -- --arquivo ...chunk_01.json \
    --project-ref zwwalaioamxcvxbihxlr \
    --confirmado --forcar-reexecucao
```

## Seed mínimo SQL (sem chunks)

A base institucional mínima (1 instituição + 35 condições frequentes + 14 exames essenciais + 24 protocolos + 10 linhas + 5 modelos) está na **Migration A5**:
```
supabase/migrations/20260921182000_curadoria_seed_minimo_upsert.sql
```
Roda automaticamente após aplicar as 4 migrations A1-A4.
