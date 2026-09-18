# Estrutura de escores clínicos (anexo) — apenas tabelas

O anexo chegou com o texto danificado pela colagem: os nomes perderam os underscores (`stgescoresclinicos`, `auditescoresclinicos`, `loteid`) e vários trechos de dados e funções vieram truncados no meio (ex.: `IF spo2 = 96`, `WHEN v_total >= 2 THEN 'riscoelevado'`, faixas cortadas como `"3":"=131"`). Por isso este plano cobre **só a estrutura de tabelas**, que é o que foi pedido — os INSERTs de escores/itens/gatilhos e as funções de cálculo ficam de fora até virem íntegros.

## O que já existe no banco

- `stg_escores` e `stg_escore_itens` — staging antigo, com colunas diferentes das do anexo (não têm `entradas`, `calculo_formula`, `faixas_interpretacao`, `conduta_associada`, `nao_usar_para`).
- `audit_escores_clinicos` — existe, mas sem `versao`, `resultado`, `red_flag_override`, `conduta_real`, `divergencia`, `motivo_override`, `profissional`, `revisao_humana`, `lote_id`.
- `indicadores_qualidade_ps` — já compatível com os indicadores do anexo.
- Não existe nenhuma tabela de gatilhos de escore.

## Migração (1 só, com nomes normalizados em snake_case)

1. **`stg_escores_clinicos`** (nova) — `lote_id`, `nome_escore`, `sinonimos`, `especialidade`, `populacao_alvo`, `finalidade`, `entradas` (jsonb), `calculo_formula`, `faixas_interpretacao` (jsonb), `conduta_associada`, `nao_usar_para`, `versao`, `fonte_id`, mais `id`, `created_at`, `updated_at`.
2. **`stg_escore_gatilhos`** (nova) — `lote_id`, `escore_nome`, `faixa`, `gatilho`, `acao`, `prazo`, `nivel`, `fonte_id`, mais campos padrão. As colunas seguem os INSERTs de gatilho do anexo; se algum campo estiver ilegível na colagem, entro como `TEXT` livre.
3. **`stg_escore_itens`** — manter a tabela atual e acrescentar as colunas que o anexo usa e que faltam (nenhuma coluna existente é removida).
4. **`audit_escores_clinicos`** — acrescentar as colunas do anexo que faltam (`versao`, `resultado`, `red_flag_override`, `conduta_real`, `divergencia`, `motivo_override`, `profissional`, `revisao_humana`, `lote_id` como opcional para não quebrar linhas existentes) e os três índices (`atendimento_id`, `nome_escore`, `data_hora`).

Cada tabela nova segue o padrão do projeto: CREATE TABLE → GRANT (`authenticated` + `service_role`) → RLS habilitada → política única de admin via `has_role(auth.uid(),'admin')` → trigger `set_updated_at` → índice em `lote_id`.

## Views de auditoria

Quatro views com `security_invoker = true`, sobre as tabelas acima:

- `vw_escores_taxa_populacao_correta` — total de cálculos, população válida/inválida e % de validação por escore.
- `vw_escores_overrides` — total e % de override por red flag por escore.
- `vw_escores_divergencias` — lista de atendimentos com divergência entre conduta sugerida e realizada.
- `vw_escores_resumo_global` — contagem de escores catalogados, itens, gatilhos e atendimentos auditados.

## Fora do escopo desta etapa

- Carga dos ~50 escores, ~263 itens e ~136 gatilhos — o texto colado está truncado e inseriria dado clínico errado.
- As 9 funções de cálculo (`fn_calcular_news2`, `qsofa`, `gcs`, `alvarado`…) — o corpo veio corrompido; reescrevo depois com as regras corretas.
- Os 10 indicadores `IQ_ESCORE:*` — esses vieram íntegros e podem ir logo depois das tabelas, se você quiser.
- Nenhuma tela ou código de frontend é alterado.

## Se algo falhar

Paro na hora e mostro o erro exato, sem contornar mudando o schema.
