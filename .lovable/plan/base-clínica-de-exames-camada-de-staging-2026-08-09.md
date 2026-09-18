# Base clínica de exames — camada de staging

Criar a estrutura de staging bruta para ingestão externa das quatro tabelas `stg_`, mais uma view de auditoria de qualidade. Nenhuma tabela existente é alterada.

## Migrações (4, aplicadas na ordem)

Cada migração cria uma tabela com **todas as colunas em TEXT**, com os nomes exatamente iguais aos cabeçalhos colados (amarrados ao importador externo), mais `id uuid`, `created_at`, `updated_at`.

1. `stg_patologias` — lote_id, linha_origem, nome_patologia, sinonimos, cid10, cid11, categoria_clinica, is_emergencia, patologia_pai, subtipo, contexto_predominante, fonte_id, trecho_citado
2. `stg_exames` — lote_id, linha_origem, nome_exame, sigla, sinonimos, tipo_exame, categoria, loinc, tuss, sigtap, amostra_metodo, preparo_paciente, jejum_horas, tempo_resultado_horas, disponivel_sus, observacoes, fonte_id, trecho_citado
3. `stg_patologia_exames` — lote_id, linha_origem, nome_patologia, subtipo, nome_exame, finalidade, obrigatoriedade, contextos, momento_solicitation, idade_min_anos, idade_max_anos, sexo_alvo, aplica_gestante, justificativa_padrao, interpretacao_esperada, criterio_positividade, conduta_se_alterado, nivel_evidencia, forca_recomendacao, repetir_em_horas, nao_solicitar_se, fonte_id, trecho_citado, conflito
4. `stg_rastreamentos` — lote_id, linha_origem, nome_rastreamento, patologia_alvo, exame_metodo, populacao_alvo, sexo_alvo, idade_inicio, idade_fim, intervalo_meses, condicao_de_risco, forca_recomendacao, nivel_evidencia, orgao_emissor, incorporado_sus, divergencia_internacional, acao_se_positivo, fonte_id, trecho_citado, conflito

Para cada tabela, na ordem exigida pelo projeto:

- `CREATE TABLE`
- `GRANT ALL` para `service_role` e `GRANT SELECT, INSERT, UPDATE, DELETE` para `authenticated` (o acesso real é cortado pela política)
- `ENABLE ROW LEVEL SECURITY`
- Política única `FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (...)` — tabelas `stg_` são só de admin
- Trigger `BEFORE UPDATE ... EXECUTE FUNCTION public.set_updated_at()`
- Índice em `lote_id`

Observação: sem `UNIQUE` em `(lote_id, linha_origem)` nesta fase — staging aceita ingestão bruta, e a duplicidade é reportada pela view em vez de bloquear o insert.

## View de auditoria: `vw_qualidade_base_clinica`

Uma linha por (tabela, lote) com:

- `total_registros` — contagem por lote
- `campos_vazios` e `pct_campos_vazios` — volume absoluto e percentual de campos nulos ou iguais a `NAO_NA_FONTE`, sobre o total de células da tabela naquele lote
- `linhas_conflito` — quantidade de `linha_origem` repetida dentro do mesmo lote
- `categorias` — JSON com a contagem por `categoria_clinica` (preenchido para `stg_patologias`; nulo nas demais, que não têm essa coluna)

A view é `security_invoker`, de modo que só admins enxergam dados (respeita a RLS das tabelas base).

## Carga dos dados

Depois das migrações aprovadas, insiro as linhas coladas em cada tabela via a ferramenta de dados, exatamente como estão (texto literal, incluindo `NAO_NA_FONTE`).

## Verificação

Rodo `select * from public.vw_qualidade_base_clinica;` e mostro o resultado completo.

## Se algo falhar

Paro imediatamente e mostro o erro exato, sem contornar mudando o schema.

## Fora do escopo

Nenhuma tabela existente é alterada, nenhuma tela ou código de frontend é tocado. As bases clínicas finais (não-`stg_`, com SELECT para `authenticated` e escrita para admin/revisor) ficam para uma etapa posterior de promoção dos dados.
