-- Migration A4: Índices (GIN fuzzy, BRIN auditoria, btree FKs em junções)
-- Recomendações Supabase: pg_trgm para busca fuzzy; BRIN para append-only;
-- btree para FKs usadas com frequência em WHERE/JOIN.

CREATE INDEX IF NOT EXISTS idx_condicoes_clinicas_trgm_nome
  ON curadoria.condicoes_clinicas USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_condicoes_clinicas_tipo_nome
  ON curadoria.condicoes_clinicas (tipo, nome_normalizado);

CREATE INDEX IF NOT EXISTS idx_condicoes_clinicas_cid10
  ON curadoria.condicoes_clinicas USING gin (cid10);

CREATE INDEX IF NOT EXISTS idx_condicoes_clinicas_redflags
  ON curadoria.condicoes_clinicas USING gin (red_flags);

-- Busca de exames por nome
CREATE INDEX IF NOT EXISTS idx_exames_comp_nome_trgm
  ON curadoria.exames_complementares USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_exames_comp_sinonimos
  ON curadoria.exames_complementares USING gin (sinonimos_busca);

CREATE INDEX IF NOT EXISTS idx_exames_comp_tipo
  ON curadoria.exames_complementares (tipo_exame);

-- BRIN auditoria (append-only grandes)
CREATE INDEX IF NOT EXISTS idx_llm_job_detail_exec_brin
  ON curadoria.llm_job_detail USING BRIN (data_execucao);

CREATE INDEX IF NOT EXISTS idx_protocolo_versao_revisao_brin
  ON curadoria.protocolo_clinico_versao USING BRIN (data_revisao);

CREATE INDEX IF NOT EXISTS idx_llm_job_instituicao_status
  ON curadoria.llm_job (instituicao_id, status, data_execucao DESC);

-- ===== ÍNDICES DAS JUNÇÕES (cada FK em cada junção) =====

-- condicao_exames
CREATE INDEX IF NOT EXISTS idx_condicao_exames_condicao ON curadoria.condicao_exames (condicao_id);
CREATE INDEX IF NOT EXISTS idx_condicao_exames_exame   ON curadoria.condicao_exames (exame_id);
CREATE INDEX IF NOT EXISTS idx_condicao_exames_categoria ON curadoria.condicao_exames (categoria_pedido);

-- condicao_medicamentos_alternativos
CREATE INDEX IF NOT EXISTS idx_cma_condicao    ON curadoria.condicao_medicamentos_alternativos (condicao_id);
CREATE INDEX IF NOT EXISTS idx_cma_medicamento ON curadoria.condicao_medicamentos_alternativos (medicamento_id);
CREATE INDEX IF NOT EXISTS idx_cma_alto_risco  ON curadoria.condicao_medicamentos_alternativos (eh_medicamento_alto_risco);
CREATE INDEX IF NOT EXISTS idx_cma_offlabel    ON curadoria.condicao_medicamentos_alternativos (eh_off_label);
CREATE INDEX IF NOT EXISTS idx_cma_ordem       ON curadoria.condicao_medicamentos_alternativos (condicao_id, ordem_escolha);

-- condicao_classes_medicamentosas
CREATE INDEX IF NOT EXISTS idx_ccm_condicao ON curadoria.condicao_classes_medicamentosas (condicao_id);
CREATE INDEX IF NOT EXISTS idx_ccm_classe   ON curadoria.condicao_classes_medicamentosas (classe_medicamentosa_id);
CREATE INDEX IF NOT EXISTS idx_ccm_papel    ON curadoria.condicao_classes_medicamentosas (papel_classe);

-- condicao_exame_fisico
CREATE INDEX IF NOT EXISTS idx_cef_condicao ON curadoria.condicao_exame_fisico (condicao_id);

-- condicao_modelos_documento
CREATE INDEX IF NOT EXISTS idx_cmd_condicao ON curadoria.condicao_modelos_documento (condicao_id);
CREATE INDEX IF NOT EXISTS idx_cmd_modelo   ON curadoria.condicao_modelos_documento (modelo_documento_id);

-- condicao_protocolo_clinico
CREATE INDEX IF NOT EXISTS idx_cpc_condicao  ON curadoria.condicao_protocolo_clinico (condicao_id);
CREATE INDEX IF NOT EXISTS idx_cpc_protocolo ON curadoria.condicao_protocolo_clinico (protocolo_clinico_id);

-- condicao_linha_cuidado
CREATE INDEX IF NOT EXISTS idx_clc_condicao ON curadoria.condicao_linha_cuidado (condicao_id);
CREATE INDEX IF NOT EXISTS idx_clc_linha    ON curadoria.condicao_linha_cuidado (linha_cuidado_id);

-- ddx e refinamentos
CREATE INDEX IF NOT EXISTS idx_ddx_origem ON curadoria.condicao_ddx (origem_id);
CREATE INDEX IF NOT EXISTS idx_ddx_dest   ON curadoria.condicao_ddx (ddx_id);
CREATE INDEX IF NOT EXISTS idx_refin_de    ON curadoria.condicao_refinamentos (de_condicao_id);
CREATE INDEX IF NOT EXISTS idx_refin_para  ON curadoria.condicao_refinamentos (para_condicao_id);

-- protocolos_versao e etapas
CREATE INDEX IF NOT EXISTS idx_protocolos_versao_data ON curadoria.protocolo_clinico_versao (protocolo_id, data_revisao DESC);
CREATE INDEX IF NOT EXISTS idx_protocolo_etapa_num    ON curadoria.protocolo_etapa (versao_id, numero_etapa);

-- modelo_documento_campos
CREATE INDEX IF NOT EXISTS idx_mdc_modelo_ordem ON curadoria.modelo_documento_campos (modelo_documento_id, ordem);
CREATE INDEX IF NOT EXISTS idx_mdc_tipo          ON curadoria.modelos_documento (tipo_documento);

-- linha_cuidado_acoes
CREATE INDEX IF NOT EXISTS idx_lca_ordem ON curadoria.linha_cuidado_acoes (linha_id, ordem);

-- instituicoes_config
CREATE INDEX IF NOT EXISTS idx_config_inst_perfil ON curadoria.instituicoes_config (instituicao_id, setor, perfil_assistencial);

-- prescricao_rapida
CREATE INDEX IF NOT EXISTS idx_prt_owner   ON curadoria.prescricao_rapida_templates (owner_uuid, instituicao_id);
CREATE INDEX IF NOT EXISTS idx_prti_templ  ON curadoria.prescricao_template_item (template_id, ordem_item);

-- dupla checagem
CREATE INDEX IF NOT EXISTS idx_dcp_med ON curadoria.dupla_checagem_politica (medicamento_id, ativa);
