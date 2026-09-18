# Carga dos 25 escores clínicos de PS (lote `escoresclinicosv2`)

O arquivo enviado chegou corrompido: underscores removidos dos nomes de tabelas/colunas e sinais `<` apagados (só 4 restaram em 986 linhas), o que destruiu os pontos de corte numéricos. A carga será feita reconstruindo os cortes pelas definições oficiais de cada escore.

## O que será carregado

Nas tabelas de staging já existentes (`stg_escores_clinicos`, `stg_escore_itens`, `stg_escore_gatilhos`), no lote `escoresclinicosv2`:

- **25 escores clínicos** de pronto-socorro, agrupados por fase:
  - Triagem e deterioração: NEWS2, ESI, CTAS, qSOFA, SOFA
  - Cardiovascular: HEART, TIMI, GRACE, Wells (TEP/TVP), PERC, CHA2DS2-VASc, HAS-BLED
  - Neurológico: Glasgow, NIHSS, ABCD2, Canadian CT Head
  - Abdominal/infeccioso: Alvarado, AIR, LRINEC, Ranson
  - Outros: SINS, PSI/CURB-65, Ottawa, Centor, Sepse pediátrica
- **Itens de pontuação** de cada escore, com faixas numéricas reconstruídas (`<`, `<=`, `>=`) conforme a publicação original.
- **Gatilhos de conduta** por faixa de resultado (ex.: NEWS2 >= 7 → resposta emergencial/UTI; escore isolado 3 → avaliação urgente).

## Reconstrução dos cortes

Cada faixa perdida será restaurada a partir da definição publicada do escore, por exemplo:

```text
AIR temperatura   corrompido {"0":"38.5"}   -> {"0":"<38.5","1":">=38.5"}
LRINEC PCR        corrompido {"0":"=150"}   -> {"0":"<150","4":">=150"}
NEWS2 SpO2 esc.1  corrompido {"3":"=92"}    -> {"3":"<=91"}
```

Nenhum valor será inventado: onde a definição oficial for ambígua ou o texto estiver truncado além de recuperação, o item entra com `observacao` marcada como `REVISAR` em vez de um corte inventado.

## Detalhes técnicos

- Inserções via ferramenta de dados (sem migração de schema — as tabelas já existem com RLS admin e GRANTs).
- Colunas usadas: `lote_id`, `nome_escore`, `sinonimos`, `especialidade`, `populacao_alvo`, `finalidade`, `entradas`, `calculo_formula`, `faixas_interpretacao`, `conduta_associada`, `nao_usar_para`, `versao`, `fonte_id`; itens com `linha_origem`, `escore_nome`, `ordem`, `descricao`, `pontuacao`, `observacao`.
- Carga em blocos por fase, para permitir conferência incremental.
- Ao final, uma consulta de verificação: contagem de escores, itens e gatilhos por escore, mais lista dos itens marcados `REVISAR`.
- As funções `fncalcular*` do anexo (NEWS, qSOFA, HEART, GCS, Alvarado) vieram truncadas e ficam **fora** desta etapa.

## Revisão clínica

Ao final entrego a lista de cortes reconstruídos por escore para sua conferência antes de qualquer promoção do lote para as tabelas `base_*`.
