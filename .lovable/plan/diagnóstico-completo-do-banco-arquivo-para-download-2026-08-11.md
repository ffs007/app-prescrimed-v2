# Diagnóstico completo do banco — arquivo para download

As 8 consultas já foram executadas com sucesso no banco. O resultado completo tem 4.362 linhas / ~712 KB, grande demais para o chat. Falta apenas gerar o arquivo, o que exige sair do modo plano (no modo plano não posso escrever arquivos fora deste plano).

## O que será entregue

Um arquivo único, `diagnostico_banco.txt`, com as 8 seções na íntegra, sem resumo e sem omissão de colunas:

1. Tabelas do schema public — 194 linhas (147 tabelas base + 47 views)
2. Colunas de todas as tabelas — 2.724 linhas (nome, tipo, udt, nullable, default)
3. Enums — 505 valores
4. Políticas RLS — 357 políticas (com `qual` e `with_check` completos)
5. Funções do schema public — 116
6. Views — 47
7. Constraints (PK, FK, UNIQUE) — 247 linhas
8. Contagem de linhas por tabela — 147 tabelas

Também gero uma versão `diagnostico_banco.csv` por seção (arquivos separados em `diagnostico/`), caso queira abrir em planilha.

## Nota técnica

A consulta 8 do seu texto tinha SQL inválido (`xml_count` não existe e `public."table_name"` é literal). Foi substituída por uma equivalente que funciona:

```text
SELECT relname,
       (xpath('/row/c/text()',
        query_to_xml(format('select count(*) as c from public.%I', relname),
        false, true, '')))[1]::text::bigint AS row_count
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY relname;
```

Nenhuma alteração é feita no banco nem no código — tudo é somente leitura.
