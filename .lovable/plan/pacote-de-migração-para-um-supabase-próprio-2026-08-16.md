# Pacote de migração para um Supabase próprio

Objetivo: gerar um conjunto de arquivos SQL + CSV que reproduza, num projeto Supabase criado por você, todo o backend atual deste app — estrutura, regras de acesso, lógica e dados.

Importante: este projeto continua no Lovable Cloud. O pacote é um artefato de exportação; o app aqui não passa a apontar para o seu Supabase.

## O que será entregue

Arquivos em `/mnt/documents/migracao_supabase/`, numerados na ordem de execução:

```text
00_LEIA-ME.md              passo a passo de aplicação
01_extensoes.sql           extensões usadas (pg_trgm, unaccent, etc.)
02_tipos_enums.sql         os ~78 enums do schema public
03_tabelas.sql             as 146 tabelas, colunas, defaults e PKs
04_constraints_indices.sql FKs, uniques, checks e índices
05_funcoes.sql             as 116 funções (cálculo de escores, ETL, has_role...)
06_triggers.sql            triggers por tabela
07_views.sql               as 47 views (security_invoker preservado)
08_rls_policies.sql        RLS habilitado + as 357 políticas
09_grants.sql              grants para anon/authenticated/service_role
10_dados/                  CSVs por tabela (stg_*, base_* e configurações)
11_carga_dados.sql         comandos \copy na ordem correta de dependência
12_edge_functions/         código das 3 edge functions + instruções de deploy
```

## Como o conteúdo é obtido

A estrutura é reconstruída por introspecção dos catálogos do Postgres (`pg_class`, `pg_attribute`, `pg_constraint`, `pg_proc`, `pg_policy`, `pg_views`, `information_schema`), gerando SQL determinístico e legível — não um dump binário.

Os dados saem como CSV por tabela via `COPY ... TO STDOUT WITH CSV HEADER`, com a ordem de carga calculada a partir do grafo de foreign keys para não quebrar integridade.

## Escopo e limites

Incluído: schema `public` completo, dados clínicos (`stg_*`, `base_*`), tabelas de configuração/log, e o código-fonte das edge functions (`smart-input-extract`, `iv-extract`, `public-document-link`).

Não incluído, com instruções no LEIA-ME para recriar:
- Usuários de `auth.users` (schema gerenciado pelo Supabase) — você recria as contas e reinsere as linhas de `user_roles` correspondentes.
- Segredos das edge functions (chaves de IA etc.) — precisam ser configurados no seu projeto.
- Arquivos de Storage, se houver buckets em uso.

## Passos

1. Introspecção do banco e geração dos arquivos de estrutura (01–09).
2. Exportação dos dados por tabela e geração da ordem de carga (10–11).
3. Cópia do código das edge functions e do LEIA-ME com o passo a passo, incluindo como apontar um projeto novo do Lovable (ou um app fora do Lovable) para o seu Supabase via `VITE_SUPABASE_URL` e chave publicável.
4. Verificação: rodar contagens por tabela no banco atual e incluir a tabela de referência no LEIA-ME, para você conferir após importar.
