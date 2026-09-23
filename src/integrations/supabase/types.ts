export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assinatura_digital_config: {
        Row: {
          ambiente: Database["public"]["Enums"]["assinatura_ambiente"]
          api_assinatura_url: string | null
          api_key_configurada: boolean
          certificado_a1_url: string | null
          certificado_a3_dispositivo: string | null
          certificado_configurado: boolean
          id: string
          modo_assinatura: Database["public"]["Enums"]["assinatura_modo"]
          provedor_assinatura: string | null
          responsavel_configuracao: string | null
          status_integracao: Database["public"]["Enums"]["assinatura_status_integracao"]
          tipo_assinatura: Database["public"]["Enums"]["assinatura_tipo"]
          ultimo_teste_assinatura: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ambiente?: Database["public"]["Enums"]["assinatura_ambiente"]
          api_assinatura_url?: string | null
          api_key_configurada?: boolean
          certificado_a1_url?: string | null
          certificado_a3_dispositivo?: string | null
          certificado_configurado?: boolean
          id?: string
          modo_assinatura?: Database["public"]["Enums"]["assinatura_modo"]
          provedor_assinatura?: string | null
          responsavel_configuracao?: string | null
          status_integracao?: Database["public"]["Enums"]["assinatura_status_integracao"]
          tipo_assinatura?: Database["public"]["Enums"]["assinatura_tipo"]
          ultimo_teste_assinatura?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ambiente?: Database["public"]["Enums"]["assinatura_ambiente"]
          api_assinatura_url?: string | null
          api_key_configurada?: boolean
          certificado_a1_url?: string | null
          certificado_a3_dispositivo?: string | null
          certificado_configurado?: boolean
          id?: string
          modo_assinatura?: Database["public"]["Enums"]["assinatura_modo"]
          provedor_assinatura?: string | null
          responsavel_configuracao?: string | null
          status_integracao?: Database["public"]["Enums"]["assinatura_status_integracao"]
          tipo_assinatura?: Database["public"]["Enums"]["assinatura_tipo"]
          ultimo_teste_assinatura?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      assinatura_perfis: {
        Row: {
          assinatura_url: string | null
          ativo: boolean
          cidade_padrao: string | null
          created_at: string
          email: string | null
          endereco: string | null
          especialidade: string | null
          id: string
          id_usuario: string
          logo_url: string | null
          nome_profissional: string
          padrao: boolean
          perfil_nome: string
          registro: string | null
          registro_uf: string | null
          rqe: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          assinatura_url?: string | null
          ativo?: boolean
          cidade_padrao?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          id?: string
          id_usuario: string
          logo_url?: string | null
          nome_profissional: string
          padrao?: boolean
          perfil_nome: string
          registro?: string | null
          registro_uf?: string | null
          rqe?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          assinatura_url?: string | null
          ativo?: boolean
          cidade_padrao?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          id?: string
          id_usuario?: string
          logo_url?: string | null
          nome_profissional?: string
          padrao?: boolean
          perfil_nome?: string
          registro?: string | null
          registro_uf?: string | null
          rqe?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      audit_escores_clinicos: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_real: string | null
          conduta_sugerida: string | null
          contexto: string | null
          created_at: string
          data_hora: string
          divergencia: boolean
          entradas: Json | null
          entradas_completas: boolean
          fonte_id: string | null
          id: number
          lote_id: string | null
          motivo_override: string | null
          nome_escore: string
          observacoes: string | null
          populacao_validada: boolean
          profissional: string | null
          profissional_id: string | null
          red_flag_override: boolean
          resultado: number | null
          revisao_humana: boolean
          valor_total: number | null
          versao: string | null
          versao_escore: string | null
        }
        Insert: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_real?: string | null
          conduta_sugerida?: string | null
          contexto?: string | null
          created_at?: string
          data_hora?: string
          divergencia?: boolean
          entradas?: Json | null
          entradas_completas?: boolean
          fonte_id?: string | null
          id?: number
          lote_id?: string | null
          motivo_override?: string | null
          nome_escore: string
          observacoes?: string | null
          populacao_validada?: boolean
          profissional?: string | null
          profissional_id?: string | null
          red_flag_override?: boolean
          resultado?: number | null
          revisao_humana?: boolean
          valor_total?: number | null
          versao?: string | null
          versao_escore?: string | null
        }
        Update: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_real?: string | null
          conduta_sugerida?: string | null
          contexto?: string | null
          created_at?: string
          data_hora?: string
          divergencia?: boolean
          entradas?: Json | null
          entradas_completas?: boolean
          fonte_id?: string | null
          id?: number
          lote_id?: string | null
          motivo_override?: string | null
          nome_escore?: string
          observacoes?: string | null
          populacao_validada?: boolean
          profissional?: string | null
          profissional_id?: string | null
          red_flag_override?: boolean
          resultado?: number | null
          revisao_humana?: boolean
          valor_total?: number | null
          versao?: string | null
          versao_escore?: string | null
        }
        Relationships: []
      }
      audit_log_critico: {
        Row: {
          acao: string
          criado_em: string
          detalhes: Json
          entidade: string | null
          entidade_id: string | null
          id: string
          ip: string | null
          modulo: string
          severidade: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string
          detalhes?: Json
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          ip?: string | null
          modulo: string
          severidade?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string
          detalhes?: Json
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          ip?: string | null
          modulo?: string
          severidade?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_medflow_ps: {
        Row: {
          atendimento_id: string
          conduta_executada: string | null
          created_at: string | null
          data_hora: string | null
          diluicao_correta: boolean | null
          dose_prescrita: string | null
          escore_aplicado: string | null
          id: number
          interacao_detectada: string | null
          medicamento_prescrito: string | null
          motivo_override: string | null
          override: boolean | null
          patologia: string | null
          profissional_id: string | null
          revisor: string | null
          sinal_alarme_presente: boolean | null
          tempo_ate_conduta_min: number | null
          valor_escore: number | null
          velocidade_correta: boolean | null
          via_administracao: string | null
        }
        Insert: {
          atendimento_id: string
          conduta_executada?: string | null
          created_at?: string | null
          data_hora?: string | null
          diluicao_correta?: boolean | null
          dose_prescrita?: string | null
          escore_aplicado?: string | null
          id?: number
          interacao_detectada?: string | null
          medicamento_prescrito?: string | null
          motivo_override?: string | null
          override?: boolean | null
          patologia?: string | null
          profissional_id?: string | null
          revisor?: string | null
          sinal_alarme_presente?: boolean | null
          tempo_ate_conduta_min?: number | null
          valor_escore?: number | null
          velocidade_correta?: boolean | null
          via_administracao?: string | null
        }
        Update: {
          atendimento_id?: string
          conduta_executada?: string | null
          created_at?: string | null
          data_hora?: string | null
          diluicao_correta?: boolean | null
          dose_prescrita?: string | null
          escore_aplicado?: string | null
          id?: number
          interacao_detectada?: string | null
          medicamento_prescrito?: string | null
          motivo_override?: string | null
          override?: boolean | null
          patologia?: string | null
          profissional_id?: string | null
          revisor?: string | null
          sinal_alarme_presente?: boolean | null
          tempo_ate_conduta_min?: number | null
          valor_escore?: number | null
          velocidade_correta?: boolean | null
          via_administracao?: string | null
        }
        Relationships: []
      }
      audit_protocolo_execucao: {
        Row: {
          atendimento_id: string
          dentro_prazo: boolean | null
          etapa_ordem: number
          etapa_titulo: string | null
          id: number
          motivo_override: string | null
          override: boolean | null
          profissional_id: string | null
          protocolo_id: string | null
          tempo_previsto_min: number | null
          tempo_realizado_min: number | null
          timestamp_execucao: string | null
        }
        Insert: {
          atendimento_id: string
          dentro_prazo?: boolean | null
          etapa_ordem: number
          etapa_titulo?: string | null
          id?: number
          motivo_override?: string | null
          override?: boolean | null
          profissional_id?: string | null
          protocolo_id?: string | null
          tempo_previsto_min?: number | null
          tempo_realizado_min?: number | null
          timestamp_execucao?: string | null
        }
        Update: {
          atendimento_id?: string
          dentro_prazo?: boolean | null
          etapa_ordem?: number
          etapa_titulo?: string | null
          id?: number
          motivo_override?: string | null
          override?: boolean | null
          profissional_id?: string | null
          protocolo_id?: string | null
          tempo_previsto_min?: number | null
          tempo_realizado_min?: number | null
          timestamp_execucao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_protocolo_execucao_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos_ps"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_sugestoes_lacunas: {
        Row: {
          ambiente: string | null
          condicao: string | null
          created_at: string
          detalhe: string | null
          id: string
          sindrome: string | null
          termo_buscado: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          ambiente?: string | null
          condicao?: string | null
          created_at?: string
          detalhe?: string | null
          id?: string
          sindrome?: string | null
          termo_buscado?: string | null
          tipo: string
          user_id?: string
        }
        Update: {
          ambiente?: string | null
          condicao?: string | null
          created_at?: string
          detalhe?: string | null
          id?: string
          sindrome?: string | null
          termo_buscado?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      base_apresentacoes_medicamentos: {
        Row: {
          apresentacao_texto: string
          ativo: boolean
          concentracao: string | null
          concentracao_mg_ml: number | null
          concentracao_pos_reconstituicao_mg_ml: number | null
          created_at: string
          criado_por: string | null
          fonte_referencia: string | null
          forma_farmaceutica: string | null
          gotas_por_ml: number | null
          id: string
          id_medicamento: string
          inalatorio: boolean
          injetavel: boolean
          oral: boolean
          principio_ativo: string
          requer_reconstituicao: boolean
          status_revisao: Database["public"]["Enums"]["medicamento_status_revisao"]
          topico: boolean
          unidade_concentracao: string | null
          unidade_volume: string | null
          updated_at: string
          uso_adulto: boolean
          uso_pediatrico: boolean
          via_administracao: string | null
          volume: string | null
        }
        Insert: {
          apresentacao_texto: string
          ativo?: boolean
          concentracao?: string | null
          concentracao_mg_ml?: number | null
          concentracao_pos_reconstituicao_mg_ml?: number | null
          created_at?: string
          criado_por?: string | null
          fonte_referencia?: string | null
          forma_farmaceutica?: string | null
          gotas_por_ml?: number | null
          id?: string
          id_medicamento: string
          inalatorio?: boolean
          injetavel?: boolean
          oral?: boolean
          principio_ativo: string
          requer_reconstituicao?: boolean
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          topico?: boolean
          unidade_concentracao?: string | null
          unidade_volume?: string | null
          updated_at?: string
          uso_adulto?: boolean
          uso_pediatrico?: boolean
          via_administracao?: string | null
          volume?: string | null
        }
        Update: {
          apresentacao_texto?: string
          ativo?: boolean
          concentracao?: string | null
          concentracao_mg_ml?: number | null
          concentracao_pos_reconstituicao_mg_ml?: number | null
          created_at?: string
          criado_por?: string | null
          fonte_referencia?: string | null
          forma_farmaceutica?: string | null
          gotas_por_ml?: number | null
          id?: string
          id_medicamento?: string
          inalatorio?: boolean
          injetavel?: boolean
          oral?: boolean
          principio_ativo?: string
          requer_reconstituicao?: boolean
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          topico?: boolean
          unidade_concentracao?: string | null
          unidade_volume?: string | null
          updated_at?: string
          uso_adulto?: boolean
          uso_pediatrico?: boolean
          via_administracao?: string | null
          volume?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      base_beta_pacote_itens: {
        Row: {
          alto_risco: boolean
          ativo: boolean
          bloco_nome: string
          bloco_slug: string
          created_at: string
          id: string
          obrigatoriedade: string
          observacao: string | null
          ordem: number
          principio_ativo: string
          principio_ativo_normalizado: string | null
          updated_at: string
        }
        Insert: {
          alto_risco?: boolean
          ativo?: boolean
          bloco_nome: string
          bloco_slug: string
          created_at?: string
          id?: string
          obrigatoriedade: string
          observacao?: string | null
          ordem?: number
          principio_ativo: string
          principio_ativo_normalizado?: string | null
          updated_at?: string
        }
        Update: {
          alto_risco?: boolean
          ativo?: boolean
          bloco_nome?: string
          bloco_slug?: string
          created_at?: string
          id?: string
          obrigatoriedade?: string
          observacao?: string | null
          ordem?: number
          principio_ativo?: string
          principio_ativo_normalizado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      base_blocos_checklist_itens: {
        Row: {
          bloco_slug: string
          created_at: string
          id: string
          item_chave: Database["public"]["Enums"]["bloco_checklist_item_chave"]
          medicamento_id: string | null
          nota: string | null
          status: Database["public"]["Enums"]["bloco_checklist_item_status"]
          updated_at: string
        }
        Insert: {
          bloco_slug: string
          created_at?: string
          id?: string
          item_chave: Database["public"]["Enums"]["bloco_checklist_item_chave"]
          medicamento_id?: string | null
          nota?: string | null
          status?: Database["public"]["Enums"]["bloco_checklist_item_status"]
          updated_at?: string
        }
        Update: {
          bloco_slug?: string
          created_at?: string
          id?: string
          item_chave?: Database["public"]["Enums"]["bloco_checklist_item_chave"]
          medicamento_id?: string | null
          nota?: string | null
          status?: Database["public"]["Enums"]["bloco_checklist_item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_blocos_checklist_itens_bloco_slug_fkey"
            columns: ["bloco_slug"]
            isOneToOne: false
            referencedRelation: "base_blocos_clinicos"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "base_blocos_checklist_itens_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_blocos_checklist_itens_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_blocos_checklist_itens_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_blocos_checklist_itens_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      base_blocos_clinicos: {
        Row: {
          categoria_clinica: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          observacao: string | null
          ordem: number
          slug: string
          status_bloco: Database["public"]["Enums"]["bloco_status"]
          total_previsto: number
          updated_at: string
        }
        Insert: {
          categoria_clinica?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          observacao?: string | null
          ordem?: number
          slug: string
          status_bloco?: Database["public"]["Enums"]["bloco_status"]
          total_previsto?: number
          updated_at?: string
        }
        Update: {
          categoria_clinica?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          ordem?: number
          slug?: string
          status_bloco?: Database["public"]["Enums"]["bloco_status"]
          total_previsto?: number
          updated_at?: string
        }
        Relationships: []
      }
      base_blocos_medicamentos_planejados: {
        Row: {
          bloco_slug: string
          created_at: string
          id: string
          observacao: string | null
          ordem: number
          principio_ativo: string
          principio_ativo_normalizado: string | null
          prioridade: string
          updated_at: string
        }
        Insert: {
          bloco_slug: string
          created_at?: string
          id?: string
          observacao?: string | null
          ordem?: number
          principio_ativo: string
          principio_ativo_normalizado?: string | null
          prioridade?: string
          updated_at?: string
        }
        Update: {
          bloco_slug?: string
          created_at?: string
          id?: string
          observacao?: string | null
          ordem?: number
          principio_ativo?: string
          principio_ativo_normalizado?: string | null
          prioridade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_blocos_medicamentos_planejados_bloco_slug_fkey"
            columns: ["bloco_slug"]
            isOneToOne: false
            referencedRelation: "base_blocos_clinicos"
            referencedColumns: ["slug"]
          },
        ]
      }
      base_contraindicacoes_medicamentos: {
        Row: {
          bloqueio_absoluto: boolean
          cid_relacionado: string | null
          classe_terapeutica: string | null
          condicao_clinica: string | null
          conduta_sugerida: string | null
          created_at: string
          criado_por: string | null
          data_atualizacao: string
          exige_justificativa: boolean
          fonte_referencia: string | null
          gravidade: Database["public"]["Enums"]["interaction_severity"]
          grupo_cid: string | null
          id: string
          idade_max: number | null
          idade_min: number | null
          mecanismo_ou_motivo: string | null
          mensagem_enfermagem_farmacia: string | null
          mensagem_medico: string | null
          nivel_alerta: Database["public"]["Enums"]["interaction_alert_level"]
          nomes_comerciais: string[]
          populacoes_afetadas: string[]
          principio_ativo: string | null
          principio_ativo_normalizado: string | null
          revisado_por: string | null
          status_revisao: Database["public"]["Enums"]["interaction_review_status"]
          tipo_contraindicacao: Database["public"]["Enums"]["contraindication_type"]
          updated_at: string
        }
        Insert: {
          bloqueio_absoluto?: boolean
          cid_relacionado?: string | null
          classe_terapeutica?: string | null
          condicao_clinica?: string | null
          conduta_sugerida?: string | null
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          exige_justificativa?: boolean
          fonte_referencia?: string | null
          gravidade?: Database["public"]["Enums"]["interaction_severity"]
          grupo_cid?: string | null
          id?: string
          idade_max?: number | null
          idade_min?: number | null
          mecanismo_ou_motivo?: string | null
          mensagem_enfermagem_farmacia?: string | null
          mensagem_medico?: string | null
          nivel_alerta?: Database["public"]["Enums"]["interaction_alert_level"]
          nomes_comerciais?: string[]
          populacoes_afetadas?: string[]
          principio_ativo?: string | null
          principio_ativo_normalizado?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["interaction_review_status"]
          tipo_contraindicacao: Database["public"]["Enums"]["contraindication_type"]
          updated_at?: string
        }
        Update: {
          bloqueio_absoluto?: boolean
          cid_relacionado?: string | null
          classe_terapeutica?: string | null
          condicao_clinica?: string | null
          conduta_sugerida?: string | null
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          exige_justificativa?: boolean
          fonte_referencia?: string | null
          gravidade?: Database["public"]["Enums"]["interaction_severity"]
          grupo_cid?: string | null
          id?: string
          idade_max?: number | null
          idade_min?: number | null
          mecanismo_ou_motivo?: string | null
          mensagem_enfermagem_farmacia?: string | null
          mensagem_medico?: string | null
          nivel_alerta?: Database["public"]["Enums"]["interaction_alert_level"]
          nomes_comerciais?: string[]
          populacoes_afetadas?: string[]
          principio_ativo?: string | null
          principio_ativo_normalizado?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["interaction_review_status"]
          tipo_contraindicacao?: Database["public"]["Enums"]["contraindication_type"]
          updated_at?: string
        }
        Relationships: []
      }
      base_escore_itens: {
        Row: {
          created_at: string | null
          descricao: string
          escore_id: string | null
          id: string
          lote_id: string
          observacao: string | null
          ordem: number
          pontuacao: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          escore_id?: string | null
          id?: string
          lote_id: string
          observacao?: string | null
          ordem: number
          pontuacao?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          escore_id?: string | null
          id?: string
          lote_id?: string
          observacao?: string | null
          ordem?: number
          pontuacao?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_escore_itens_escore_id_fkey"
            columns: ["escore_id"]
            isOneToOne: false
            referencedRelation: "base_escores_clinicos"
            referencedColumns: ["id"]
          },
        ]
      }
      base_escores_clinicos: {
        Row: {
          created_at: string | null
          desempenho: Json | null
          dominio: string | null
          evidencia: string | null
          faixa_etaria: string | null
          fonte_id: string | null
          id: string
          lote_id: string
          n_itens: number | null
          nome_escore: string
          nome_normalizado: string
          pontos_corte: Json | null
          populacao: string | null
          referencia_validacao: string | null
          sigla: string | null
          tempo_aplicacao_min: number | null
          tipo: string | null
          trecho_citado: string | null
          updated_at: string | null
          validacao_ptbr: boolean | null
        }
        Insert: {
          created_at?: string | null
          desempenho?: Json | null
          dominio?: string | null
          evidencia?: string | null
          faixa_etaria?: string | null
          fonte_id?: string | null
          id?: string
          lote_id: string
          n_itens?: number | null
          nome_escore: string
          nome_normalizado: string
          pontos_corte?: Json | null
          populacao?: string | null
          referencia_validacao?: string | null
          sigla?: string | null
          tempo_aplicacao_min?: number | null
          tipo?: string | null
          trecho_citado?: string | null
          updated_at?: string | null
          validacao_ptbr?: boolean | null
        }
        Update: {
          created_at?: string | null
          desempenho?: Json | null
          dominio?: string | null
          evidencia?: string | null
          faixa_etaria?: string | null
          fonte_id?: string | null
          id?: string
          lote_id?: string
          n_itens?: number | null
          nome_escore?: string
          nome_normalizado?: string
          pontos_corte?: Json | null
          populacao?: string | null
          referencia_validacao?: string | null
          sigla?: string | null
          tempo_aplicacao_min?: number | null
          tipo?: string | null
          trecho_citado?: string | null
          updated_at?: string | null
          validacao_ptbr?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "base_escores_clinicos_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_exames: {
        Row: {
          amostra_metodo: string | null
          categoria: string | null
          created_at: string | null
          disponivel_sus: boolean | null
          fonte_id: string | null
          id: string
          jejum_horas: number | null
          loinc: string | null
          lote_id: string
          nome_exame: string
          nome_normalizado: string
          observacoes: string | null
          preparo_paciente: string | null
          sigla: string | null
          sigtap: string | null
          sinonimos: string | null
          tempo_resultado_horas: number | null
          tipo_exame: string | null
          trecho_citado: string | null
          tuss: string | null
          updated_at: string | null
        }
        Insert: {
          amostra_metodo?: string | null
          categoria?: string | null
          created_at?: string | null
          disponivel_sus?: boolean | null
          fonte_id?: string | null
          id?: string
          jejum_horas?: number | null
          loinc?: string | null
          lote_id: string
          nome_exame: string
          nome_normalizado: string
          observacoes?: string | null
          preparo_paciente?: string | null
          sigla?: string | null
          sigtap?: string | null
          sinonimos?: string | null
          tempo_resultado_horas?: number | null
          tipo_exame?: string | null
          trecho_citado?: string | null
          tuss?: string | null
          updated_at?: string | null
        }
        Update: {
          amostra_metodo?: string | null
          categoria?: string | null
          created_at?: string | null
          disponivel_sus?: boolean | null
          fonte_id?: string | null
          id?: string
          jejum_horas?: number | null
          loinc?: string | null
          lote_id?: string
          nome_exame?: string
          nome_normalizado?: string
          observacoes?: string | null
          preparo_paciente?: string | null
          sigla?: string | null
          sigtap?: string | null
          sinonimos?: string | null
          tempo_resultado_horas?: number | null
          tipo_exame?: string | null
          trecho_citado?: string | null
          tuss?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_exames_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_exames_clinicos: {
        Row: {
          amostra_metodo: string | null
          categoria: string | null
          created_at: string
          disponivel_sus: string | null
          fonte_id: string | null
          id: string
          jejum_horas: string | null
          loinc: string | null
          lote_id: string | null
          nome_exame: string
          nome_normalizado: string | null
          observacoes: string | null
          preparo_paciente: string | null
          sigla: string | null
          sigtap: string | null
          sinonimos: string | null
          status: string
          tempo_resultado_horas: string | null
          tipo_exame: string | null
          trecho_citado: string | null
          tuss: string | null
          updated_at: string
        }
        Insert: {
          amostra_metodo?: string | null
          categoria?: string | null
          created_at?: string
          disponivel_sus?: string | null
          fonte_id?: string | null
          id?: string
          jejum_horas?: string | null
          loinc?: string | null
          lote_id?: string | null
          nome_exame: string
          nome_normalizado?: string | null
          observacoes?: string | null
          preparo_paciente?: string | null
          sigla?: string | null
          sigtap?: string | null
          sinonimos?: string | null
          status?: string
          tempo_resultado_horas?: string | null
          tipo_exame?: string | null
          trecho_citado?: string | null
          tuss?: string | null
          updated_at?: string
        }
        Update: {
          amostra_metodo?: string | null
          categoria?: string | null
          created_at?: string
          disponivel_sus?: string | null
          fonte_id?: string | null
          id?: string
          jejum_horas?: string | null
          loinc?: string | null
          lote_id?: string | null
          nome_exame?: string
          nome_normalizado?: string | null
          observacoes?: string | null
          preparo_paciente?: string | null
          sigla?: string | null
          sigtap?: string | null
          sinonimos?: string | null
          status?: string
          tempo_resultado_horas?: string | null
          tipo_exame?: string | null
          trecho_citado?: string | null
          tuss?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      base_interacoes_medicamentosas: {
        Row: {
          bloqueio_absoluto: boolean
          classe_a: string | null
          classe_b: string | null
          conduta_sugerida: string | null
          contexto_clinico_relevante: string | null
          created_at: string
          criado_por: string | null
          data_atualizacao: string
          exames_monitorar: string[]
          exige_justificativa: boolean
          fonte_referencia: string | null
          gravidade: Database["public"]["Enums"]["interaction_severity"]
          id: string
          mecanismo: string | null
          medicamento_a: string | null
          medicamento_b: string | null
          mensagem_enfermagem_farmacia: string | null
          mensagem_medico: string | null
          monitorizacao_recomendada: string | null
          nivel_alerta: Database["public"]["Enums"]["interaction_alert_level"]
          populacoes_maior_risco: string[]
          principio_ativo_a: string | null
          principio_ativo_a_normalizado: string | null
          principio_ativo_b: string | null
          principio_ativo_b_normalizado: string | null
          revisado_por: string | null
          status_revisao: Database["public"]["Enums"]["interaction_review_status"]
          tipo_interacao: Database["public"]["Enums"]["interaction_type"]
          updated_at: string
        }
        Insert: {
          bloqueio_absoluto?: boolean
          classe_a?: string | null
          classe_b?: string | null
          conduta_sugerida?: string | null
          contexto_clinico_relevante?: string | null
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          exames_monitorar?: string[]
          exige_justificativa?: boolean
          fonte_referencia?: string | null
          gravidade?: Database["public"]["Enums"]["interaction_severity"]
          id?: string
          mecanismo?: string | null
          medicamento_a?: string | null
          medicamento_b?: string | null
          mensagem_enfermagem_farmacia?: string | null
          mensagem_medico?: string | null
          monitorizacao_recomendada?: string | null
          nivel_alerta?: Database["public"]["Enums"]["interaction_alert_level"]
          populacoes_maior_risco?: string[]
          principio_ativo_a?: string | null
          principio_ativo_a_normalizado?: string | null
          principio_ativo_b?: string | null
          principio_ativo_b_normalizado?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["interaction_review_status"]
          tipo_interacao: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
        }
        Update: {
          bloqueio_absoluto?: boolean
          classe_a?: string | null
          classe_b?: string | null
          conduta_sugerida?: string | null
          contexto_clinico_relevante?: string | null
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          exames_monitorar?: string[]
          exige_justificativa?: boolean
          fonte_referencia?: string | null
          gravidade?: Database["public"]["Enums"]["interaction_severity"]
          id?: string
          mecanismo?: string | null
          medicamento_a?: string | null
          medicamento_b?: string | null
          mensagem_enfermagem_farmacia?: string | null
          mensagem_medico?: string | null
          monitorizacao_recomendada?: string | null
          nivel_alerta?: Database["public"]["Enums"]["interaction_alert_level"]
          populacoes_maior_risco?: string[]
          principio_ativo_a?: string | null
          principio_ativo_a_normalizado?: string | null
          principio_ativo_b?: string | null
          principio_ativo_b_normalizado?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["interaction_review_status"]
          tipo_interacao?: Database["public"]["Enums"]["interaction_type"]
          updated_at?: string
        }
        Relationships: []
      }
      base_iv_diluicao: {
        Row: {
          bolus_permitido: boolean | null
          concentracao_maxima_mg_ml: number | null
          concentracao_usual_mg_ml: number | null
          conduta_extravasamento: string | null
          created_at: string
          diluentes_compativeis: string | null
          diluentes_incompativeis: string | null
          estabilidade_ambiente_horas: number | null
          estabilidade_refrigerado_horas: number | null
          fonte_id: string | null
          fotoprotecao: boolean | null
          id: string
          incompatibilidades_y: string | null
          lote_id: string
          observacao: string | null
          principio_ativo: string
          requer_bomba: boolean | null
          requer_filtro: boolean | null
          risco_extravasamento: string | null
          risco_flebite: string | null
          tempo_minimo_infusao_min: number | null
          tempo_usual_infusao_min: number | null
          trecho_citado: string | null
          updated_at: string
          velocidade_maxima: string | null
          via_central_obrigatoria: boolean | null
          volume_minimo_ml: number | null
        }
        Insert: {
          bolus_permitido?: boolean | null
          concentracao_maxima_mg_ml?: number | null
          concentracao_usual_mg_ml?: number | null
          conduta_extravasamento?: string | null
          created_at?: string
          diluentes_compativeis?: string | null
          diluentes_incompativeis?: string | null
          estabilidade_ambiente_horas?: number | null
          estabilidade_refrigerado_horas?: number | null
          fonte_id?: string | null
          fotoprotecao?: boolean | null
          id?: string
          incompatibilidades_y?: string | null
          lote_id: string
          observacao?: string | null
          principio_ativo: string
          requer_bomba?: boolean | null
          requer_filtro?: boolean | null
          risco_extravasamento?: string | null
          risco_flebite?: string | null
          tempo_minimo_infusao_min?: number | null
          tempo_usual_infusao_min?: number | null
          trecho_citado?: string | null
          updated_at?: string
          velocidade_maxima?: string | null
          via_central_obrigatoria?: boolean | null
          volume_minimo_ml?: number | null
        }
        Update: {
          bolus_permitido?: boolean | null
          concentracao_maxima_mg_ml?: number | null
          concentracao_usual_mg_ml?: number | null
          conduta_extravasamento?: string | null
          created_at?: string
          diluentes_compativeis?: string | null
          diluentes_incompativeis?: string | null
          estabilidade_ambiente_horas?: number | null
          estabilidade_refrigerado_horas?: number | null
          fonte_id?: string | null
          fotoprotecao?: boolean | null
          id?: string
          incompatibilidades_y?: string | null
          lote_id?: string
          observacao?: string | null
          principio_ativo?: string
          requer_bomba?: boolean | null
          requer_filtro?: boolean | null
          risco_extravasamento?: string | null
          risco_flebite?: string | null
          tempo_minimo_infusao_min?: number | null
          tempo_usual_infusao_min?: number | null
          trecho_citado?: string | null
          updated_at?: string
          velocidade_maxima?: string | null
          via_central_obrigatoria?: boolean | null
          volume_minimo_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "base_iv_diluicao_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_medicamentos_alerta: {
        Row: {
          conduta: string | null
          created_at: string
          descricao: string | null
          fonte_id: string | null
          gravidade: string | null
          id: string
          lote_id: string
          principio_ativo: string
          tipo_alerta: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          conduta?: string | null
          created_at?: string
          descricao?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          lote_id: string
          principio_ativo: string
          tipo_alerta?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          conduta?: string | null
          created_at?: string
          descricao?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          lote_id?: string
          principio_ativo?: string
          tipo_alerta?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_alerta_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_medicamentos_checklist: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          chave: string
          id: string
          label: string
          observacao: string | null
          ordem: number
          status: Database["public"]["Enums"]["checklist_status"]
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave: string
          id?: string
          label: string
          observacao?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["checklist_status"]
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave?: string
          id?: string
          label?: string
          observacao?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["checklist_status"]
        }
        Relationships: []
      }
      base_medicamentos_contraindicacoes: {
        Row: {
          alergia_cruzada_classe: string | null
          alternativa: string | null
          cid10_relacionado: string | null
          condicao: string | null
          conduta: string | null
          conflito: boolean | null
          created_at: string
          fonte_id: string | null
          gravidade: string | null
          id: string
          lote_id: string
          mecanismo: string | null
          principio_ativo: string
          tipo: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          alergia_cruzada_classe?: string | null
          alternativa?: string | null
          cid10_relacionado?: string | null
          condicao?: string | null
          conduta?: string | null
          conflito?: boolean | null
          created_at?: string
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          lote_id: string
          mecanismo?: string | null
          principio_ativo: string
          tipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          alergia_cruzada_classe?: string | null
          alternativa?: string | null
          cid10_relacionado?: string | null
          condicao?: string | null
          conduta?: string | null
          conflito?: boolean | null
          created_at?: string
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          lote_id?: string
          mecanismo?: string | null
          principio_ativo?: string
          tipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_contraindicacoes_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_medicamentos_dose: {
        Row: {
          administrar_com_alimento: boolean | null
          apresentacao_id: string | null
          conflito: boolean | null
          created_at: string
          dose_max: number | null
          dose_maxima_dia: number | null
          dose_maxima_dia_unidade: string | null
          dose_min: number | null
          dose_pendente_de_fonte: boolean | null
          dose_tipo: string | null
          dose_unidade: string | null
          duracao: string | null
          fonte_id: string | null
          frequencia: string | null
          id: string
          indicacao: string | null
          intervalo_horas: number | null
          lote_id: string
          medicamento_id: string | null
          observacao_dose: string | null
          populacao: string | null
          posologia_texto: string | null
          principio_ativo: string
          revisao_farmaceutica_obrigatoria: boolean | null
          status_revisao: string
          trecho_citado: string | null
          updated_at: string
          via: string
        }
        Insert: {
          administrar_com_alimento?: boolean | null
          apresentacao_id?: string | null
          conflito?: boolean | null
          created_at?: string
          dose_max?: number | null
          dose_maxima_dia?: number | null
          dose_maxima_dia_unidade?: string | null
          dose_min?: number | null
          dose_pendente_de_fonte?: boolean | null
          dose_tipo?: string | null
          dose_unidade?: string | null
          duracao?: string | null
          fonte_id?: string | null
          frequencia?: string | null
          id?: string
          indicacao?: string | null
          intervalo_horas?: number | null
          lote_id: string
          medicamento_id?: string | null
          observacao_dose?: string | null
          populacao?: string | null
          posologia_texto?: string | null
          principio_ativo: string
          revisao_farmaceutica_obrigatoria?: boolean | null
          status_revisao?: string
          trecho_citado?: string | null
          updated_at?: string
          via: string
        }
        Update: {
          administrar_com_alimento?: boolean | null
          apresentacao_id?: string | null
          conflito?: boolean | null
          created_at?: string
          dose_max?: number | null
          dose_maxima_dia?: number | null
          dose_maxima_dia_unidade?: string | null
          dose_min?: number | null
          dose_pendente_de_fonte?: boolean | null
          dose_tipo?: string | null
          dose_unidade?: string | null
          duracao?: string | null
          fonte_id?: string | null
          frequencia?: string | null
          id?: string
          indicacao?: string | null
          intervalo_horas?: number | null
          lote_id?: string
          medicamento_id?: string | null
          observacao_dose?: string | null
          populacao?: string | null
          posologia_texto?: string | null
          principio_ativo?: string
          revisao_farmaceutica_obrigatoria?: boolean | null
          status_revisao?: string
          trecho_citado?: string | null
          updated_at?: string
          via?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_dose_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "base_apresentacoes_medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_apresentacao_completa"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["apresentacao_unica_id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_dose_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      base_medicamentos_equivalencia: {
        Row: {
          created_at: string
          equivalente: string
          fator: number | null
          fonte_id: string | null
          id: string
          lote_id: string
          principio_ativo: string
          tipo_equivalencia: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equivalente: string
          fator?: number | null
          fonte_id?: string | null
          id?: string
          lote_id: string
          principio_ativo: string
          tipo_equivalencia?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equivalente?: string
          fator?: number | null
          fonte_id?: string | null
          id?: string
          lote_id?: string
          principio_ativo?: string
          tipo_equivalencia?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_equivalencia_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_medicamentos_geral: {
        Row: {
          abreviacoes: string[]
          alerta_alergia_classe: string | null
          alerta_gestacao: Database["public"]["Enums"]["medicamento_alerta_gest_lact"]
          alerta_lactacao: Database["public"]["Enums"]["medicamento_alerta_gest_lact"]
          alto_risco: boolean | null
          antimicrobiano: boolean
          apresentacao: string | null
          ativo: boolean
          atualizado_por: string | null
          busca_normalizada: string | null
          categoria_clinica: Database["public"]["Enums"]["medicamento_categoria_clinica"]
          cid_relacionados: string[]
          classe_terapeutica: string | null
          codigo_atc: string | null
          codigo_dcb: string | null
          concentracao: string | null
          created_at: string
          criado_por: string | null
          data_atualizacao: string
          dose_adulto_padrao: string | null
          dose_maxima_adulto: string | null
          dose_maxima_pediatrica: string | null
          dose_pediatrica_padrao: string | null
          duracao_padrao: string | null
          equivalencias: Json
          exige_ajuste_hepatico: boolean
          exige_ajuste_renal: boolean
          exige_peso: boolean
          exige_receita_especial: boolean
          exige_retencao_receita: boolean
          fonte_referencia: string | null
          forma_farmaceutica: string | null
          frequencia_padrao: string | null
          id: string
          lasa_confundido_com: string | null
          lote_id: string
          mecanismo_acao: string | null
          medicamento_controlado: boolean
          medicamento_inalatorio: boolean
          medicamento_injetavel: boolean
          medicamento_oral: boolean
          medicamento_topico: boolean
          modelos_rapidos_relacionados: string[]
          motivo_alteracao: string | null
          na_rename: boolean | null
          nome_comercial_referencia: string | null
          nome_normalizado: string | null
          nomes_comerciais: string[]
          nomes_comerciais_br: string | null
          nomes_populares: string[]
          observacao_posologia: string | null
          observacoes: string | null
          principio_ativo: string
          principio_ativo_dcb: string | null
          principio_ativo_en: string | null
          principio_ativo_normalizado: string | null
          prioridade_busca: number
          prioridade_mvp: Database["public"]["Enums"]["medicamento_prioridade_mvp"]
          protocolos_relacionados: string[]
          queixas_relacionadas: string[]
          revisado_por: string | null
          risco_duplicidade: boolean
          risco_interacao_relevante: boolean
          sinonimos: string[]
          status_revisao: Database["public"]["Enums"]["medicamento_status_revisao"]
          subclasse: string | null
          subclasse_terapeutica: string | null
          termos_busca: string[]
          tipo_receita: Database["public"]["Enums"]["medicamento_tipo_receita"]
          unidade_dose: string | null
          updated_at: string
          uso_ambulatorial_rapido: boolean
          uso_em_urgencia: boolean
          uso_emergencia: boolean
          uso_principal: string | null
          versao: number
          versao_anterior_id: string | null
          via_administracao: string | null
          vinculo_iv_medication_id: string | null
        }
        Insert: {
          abreviacoes?: string[]
          alerta_alergia_classe?: string | null
          alerta_gestacao?: Database["public"]["Enums"]["medicamento_alerta_gest_lact"]
          alerta_lactacao?: Database["public"]["Enums"]["medicamento_alerta_gest_lact"]
          alto_risco?: boolean | null
          antimicrobiano?: boolean
          apresentacao?: string | null
          ativo?: boolean
          atualizado_por?: string | null
          busca_normalizada?: string | null
          categoria_clinica?: Database["public"]["Enums"]["medicamento_categoria_clinica"]
          cid_relacionados?: string[]
          classe_terapeutica?: string | null
          codigo_atc?: string | null
          codigo_dcb?: string | null
          concentracao?: string | null
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          dose_adulto_padrao?: string | null
          dose_maxima_adulto?: string | null
          dose_maxima_pediatrica?: string | null
          dose_pediatrica_padrao?: string | null
          duracao_padrao?: string | null
          equivalencias?: Json
          exige_ajuste_hepatico?: boolean
          exige_ajuste_renal?: boolean
          exige_peso?: boolean
          exige_receita_especial?: boolean
          exige_retencao_receita?: boolean
          fonte_referencia?: string | null
          forma_farmaceutica?: string | null
          frequencia_padrao?: string | null
          id?: string
          lasa_confundido_com?: string | null
          lote_id?: string
          mecanismo_acao?: string | null
          medicamento_controlado?: boolean
          medicamento_inalatorio?: boolean
          medicamento_injetavel?: boolean
          medicamento_oral?: boolean
          medicamento_topico?: boolean
          modelos_rapidos_relacionados?: string[]
          motivo_alteracao?: string | null
          na_rename?: boolean | null
          nome_comercial_referencia?: string | null
          nome_normalizado?: string | null
          nomes_comerciais?: string[]
          nomes_comerciais_br?: string | null
          nomes_populares?: string[]
          observacao_posologia?: string | null
          observacoes?: string | null
          principio_ativo: string
          principio_ativo_dcb?: string | null
          principio_ativo_en?: string | null
          principio_ativo_normalizado?: string | null
          prioridade_busca?: number
          prioridade_mvp?: Database["public"]["Enums"]["medicamento_prioridade_mvp"]
          protocolos_relacionados?: string[]
          queixas_relacionadas?: string[]
          revisado_por?: string | null
          risco_duplicidade?: boolean
          risco_interacao_relevante?: boolean
          sinonimos?: string[]
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          subclasse?: string | null
          subclasse_terapeutica?: string | null
          termos_busca?: string[]
          tipo_receita?: Database["public"]["Enums"]["medicamento_tipo_receita"]
          unidade_dose?: string | null
          updated_at?: string
          uso_ambulatorial_rapido?: boolean
          uso_em_urgencia?: boolean
          uso_emergencia?: boolean
          uso_principal?: string | null
          versao?: number
          versao_anterior_id?: string | null
          via_administracao?: string | null
          vinculo_iv_medication_id?: string | null
        }
        Update: {
          abreviacoes?: string[]
          alerta_alergia_classe?: string | null
          alerta_gestacao?: Database["public"]["Enums"]["medicamento_alerta_gest_lact"]
          alerta_lactacao?: Database["public"]["Enums"]["medicamento_alerta_gest_lact"]
          alto_risco?: boolean | null
          antimicrobiano?: boolean
          apresentacao?: string | null
          ativo?: boolean
          atualizado_por?: string | null
          busca_normalizada?: string | null
          categoria_clinica?: Database["public"]["Enums"]["medicamento_categoria_clinica"]
          cid_relacionados?: string[]
          classe_terapeutica?: string | null
          codigo_atc?: string | null
          codigo_dcb?: string | null
          concentracao?: string | null
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          dose_adulto_padrao?: string | null
          dose_maxima_adulto?: string | null
          dose_maxima_pediatrica?: string | null
          dose_pediatrica_padrao?: string | null
          duracao_padrao?: string | null
          equivalencias?: Json
          exige_ajuste_hepatico?: boolean
          exige_ajuste_renal?: boolean
          exige_peso?: boolean
          exige_receita_especial?: boolean
          exige_retencao_receita?: boolean
          fonte_referencia?: string | null
          forma_farmaceutica?: string | null
          frequencia_padrao?: string | null
          id?: string
          lasa_confundido_com?: string | null
          lote_id?: string
          mecanismo_acao?: string | null
          medicamento_controlado?: boolean
          medicamento_inalatorio?: boolean
          medicamento_injetavel?: boolean
          medicamento_oral?: boolean
          medicamento_topico?: boolean
          modelos_rapidos_relacionados?: string[]
          motivo_alteracao?: string | null
          na_rename?: boolean | null
          nome_comercial_referencia?: string | null
          nome_normalizado?: string | null
          nomes_comerciais?: string[]
          nomes_comerciais_br?: string | null
          nomes_populares?: string[]
          observacao_posologia?: string | null
          observacoes?: string | null
          principio_ativo?: string
          principio_ativo_dcb?: string | null
          principio_ativo_en?: string | null
          principio_ativo_normalizado?: string | null
          prioridade_busca?: number
          prioridade_mvp?: Database["public"]["Enums"]["medicamento_prioridade_mvp"]
          protocolos_relacionados?: string[]
          queixas_relacionadas?: string[]
          revisado_por?: string | null
          risco_duplicidade?: boolean
          risco_interacao_relevante?: boolean
          sinonimos?: string[]
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          subclasse?: string | null
          subclasse_terapeutica?: string | null
          termos_busca?: string[]
          tipo_receita?: Database["public"]["Enums"]["medicamento_tipo_receita"]
          unidade_dose?: string | null
          updated_at?: string
          uso_ambulatorial_rapido?: boolean
          uso_em_urgencia?: boolean
          uso_emergencia?: boolean
          uso_principal?: string | null
          versao?: number
          versao_anterior_id?: string | null
          via_administracao?: string | null
          vinculo_iv_medication_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_geral_versao_anterior_id_fkey"
            columns: ["versao_anterior_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_geral_versao_anterior_id_fkey"
            columns: ["versao_anterior_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_geral_versao_anterior_id_fkey"
            columns: ["versao_anterior_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_medicamentos_geral_versao_anterior_id_fkey"
            columns: ["versao_anterior_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      base_medicamentos_interacoes: {
        Row: {
          alternativa: string | null
          classe_a: string | null
          classe_b: string | null
          conduta: string | null
          conflito: boolean | null
          created_at: string
          documentacao: string | null
          efeito_clinico: string | null
          fonte_id: string | null
          gravidade: string | null
          id: string
          inicio_efeito: string | null
          lote_id: string
          mecanismo: string | null
          monitorar: string | null
          principio_ativo_a: string
          principio_ativo_b: string
          tempo_separacao_horas: number | null
          tipo_interacao: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          alternativa?: string | null
          classe_a?: string | null
          classe_b?: string | null
          conduta?: string | null
          conflito?: boolean | null
          created_at?: string
          documentacao?: string | null
          efeito_clinico?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          inicio_efeito?: string | null
          lote_id: string
          mecanismo?: string | null
          monitorar?: string | null
          principio_ativo_a: string
          principio_ativo_b: string
          tempo_separacao_horas?: number | null
          tipo_interacao?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          alternativa?: string | null
          classe_a?: string | null
          classe_b?: string | null
          conduta?: string | null
          conflito?: boolean | null
          created_at?: string
          documentacao?: string | null
          efeito_clinico?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          inicio_efeito?: string | null
          lote_id?: string
          mecanismo?: string | null
          monitorar?: string | null
          principio_ativo_a?: string
          principio_ativo_b?: string
          tempo_separacao_horas?: number | null
          tipo_interacao?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_interacoes_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_medicamentos_monitoramento: {
        Row: {
          conduta_se_alterado: string | null
          created_at: string
          finalidade_monitoramento: string | null
          fonte_id: string | null
          id: string
          lote_id: string
          momento: string | null
          nome_exame: string | null
          obrigatorio: boolean | null
          periodicidade: string | null
          principio_ativo: string
          trecho_citado: string | null
          updated_at: string
          valor_alvo: string | null
          valor_toxico: string | null
        }
        Insert: {
          conduta_se_alterado?: string | null
          created_at?: string
          finalidade_monitoramento?: string | null
          fonte_id?: string | null
          id?: string
          lote_id: string
          momento?: string | null
          nome_exame?: string | null
          obrigatorio?: boolean | null
          periodicidade?: string | null
          principio_ativo: string
          trecho_citado?: string | null
          updated_at?: string
          valor_alvo?: string | null
          valor_toxico?: string | null
        }
        Update: {
          conduta_se_alterado?: string | null
          created_at?: string
          finalidade_monitoramento?: string | null
          fonte_id?: string | null
          id?: string
          lote_id?: string
          momento?: string | null
          nome_exame?: string | null
          obrigatorio?: boolean | null
          periodicidade?: string | null
          principio_ativo?: string
          trecho_citado?: string | null
          updated_at?: string
          valor_alvo?: string | null
          valor_toxico?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_monitoramento_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_medicamentos_populacao: {
        Row: {
          alternativa: string | null
          categoria_risco: string | null
          conduta: string | null
          conflito: boolean | null
          created_at: string
          dimensao: string
          dose_ajustada_texto: string | null
          estrato: string
          fator_ajuste: number | null
          fonte_id: string | null
          id: string
          justificativa: string | null
          lote_id: string
          monitorar: string | null
          principio_ativo: string
          risco: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          alternativa?: string | null
          categoria_risco?: string | null
          conduta?: string | null
          conflito?: boolean | null
          created_at?: string
          dimensao: string
          dose_ajustada_texto?: string | null
          estrato: string
          fator_ajuste?: number | null
          fonte_id?: string | null
          id?: string
          justificativa?: string | null
          lote_id: string
          monitorar?: string | null
          principio_ativo: string
          risco?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          alternativa?: string | null
          categoria_risco?: string | null
          conduta?: string | null
          conflito?: boolean | null
          created_at?: string
          dimensao?: string
          dose_ajustada_texto?: string | null
          estrato?: string
          fator_ajuste?: number | null
          fonte_id?: string | null
          id?: string
          justificativa?: string | null
          lote_id?: string
          monitorar?: string | null
          principio_ativo?: string
          risco?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_populacao_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_medicamentos_regulatorio: {
        Row: {
          antimicrobiano_rdc471: boolean | null
          created_at: string
          exige_notificacao: boolean | null
          familia_receituario: string | null
          fonte_id: string | null
          id: string
          limite_quantidade: string | null
          limite_substancias_receita: number | null
          lista_344: string | null
          lote_id: string
          numeracao_obrigatoria: boolean | null
          observacao_legal: string | null
          principio_ativo: string
          retencao_via: string | null
          trecho_citado: string | null
          updated_at: string
          validade_receita_dias: number | null
          vias_receita: string | null
        }
        Insert: {
          antimicrobiano_rdc471?: boolean | null
          created_at?: string
          exige_notificacao?: boolean | null
          familia_receituario?: string | null
          fonte_id?: string | null
          id?: string
          limite_quantidade?: string | null
          limite_substancias_receita?: number | null
          lista_344?: string | null
          lote_id: string
          numeracao_obrigatoria?: boolean | null
          observacao_legal?: string | null
          principio_ativo: string
          retencao_via?: string | null
          trecho_citado?: string | null
          updated_at?: string
          validade_receita_dias?: number | null
          vias_receita?: string | null
        }
        Update: {
          antimicrobiano_rdc471?: boolean | null
          created_at?: string
          exige_notificacao?: boolean | null
          familia_receituario?: string | null
          fonte_id?: string | null
          id?: string
          limite_quantidade?: string | null
          limite_substancias_receita?: number | null
          lista_344?: string | null
          lote_id?: string
          numeracao_obrigatoria?: boolean | null
          observacao_legal?: string | null
          principio_ativo?: string
          retencao_via?: string | null
          trecho_citado?: string | null
          updated_at?: string
          validade_receita_dias?: number | null
          vias_receita?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_regulatorio_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_modelos_rapidos: {
        Row: {
          ativo: boolean
          categoria_modelo: string | null
          contexto:
            | Database["public"]["Enums"]["medicamento_contexto_uso"]
            | null
          created_at: string
          criado_por: string | null
          fonte_referencia: string | null
          id: string
          nome_modelo: string
          observacao: string | null
          revisado_por: string | null
          status_revisao: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria_modelo?: string | null
          contexto?:
            | Database["public"]["Enums"]["medicamento_contexto_uso"]
            | null
          created_at?: string
          criado_por?: string | null
          fonte_referencia?: string | null
          id?: string
          nome_modelo: string
          observacao?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria_modelo?: string | null
          contexto?:
            | Database["public"]["Enums"]["medicamento_contexto_uso"]
            | null
          created_at?: string
          criado_por?: string | null
          fonte_referencia?: string | null
          id?: string
          nome_modelo?: string
          observacao?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at?: string
        }
        Relationships: []
      }
      base_modelos_rapidos_itens: {
        Row: {
          apresentacao: string | null
          created_at: string
          dose: string | null
          duracao: string | null
          editavel: boolean
          fonte_referencia: string | null
          frequencia: string | null
          id: string
          id_medicamento: string | null
          id_modelo: string
          obrigatorio: boolean
          observacao: string | null
          ordem: number
          principio_ativo: string
          status_revisao: Database["public"]["Enums"]["medicamento_status_revisao"]
          unidade_dose: string | null
          updated_at: string
          via: string | null
        }
        Insert: {
          apresentacao?: string | null
          created_at?: string
          dose?: string | null
          duracao?: string | null
          editavel?: boolean
          fonte_referencia?: string | null
          frequencia?: string | null
          id?: string
          id_medicamento?: string | null
          id_modelo: string
          obrigatorio?: boolean
          observacao?: string | null
          ordem?: number
          principio_ativo: string
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          unidade_dose?: string | null
          updated_at?: string
          via?: string | null
        }
        Update: {
          apresentacao?: string | null
          created_at?: string
          dose?: string | null
          duracao?: string | null
          editavel?: boolean
          fonte_referencia?: string | null
          frequencia?: string | null
          id?: string
          id_medicamento?: string | null
          id_modelo?: string
          obrigatorio?: boolean
          observacao?: string | null
          ordem?: number
          principio_ativo?: string
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          unidade_dose?: string | null
          updated_at?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_modelos_rapidos_itens_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_modelos_rapidos_itens_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_modelos_rapidos_itens_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_modelos_rapidos_itens_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
          {
            foreignKeyName: "base_modelos_rapidos_itens_id_modelo_fkey"
            columns: ["id_modelo"]
            isOneToOne: false
            referencedRelation: "base_modelos_rapidos"
            referencedColumns: ["id"]
          },
        ]
      }
      base_patologia_exames: {
        Row: {
          aplica_gestante: string | null
          conduta_se_alterado: string | null
          contextos: string | null
          created_at: string
          criterio_positividade: string | null
          finalidade: string | null
          fonte_id: string | null
          forca_recomendacao: string | null
          id: string
          idade_max_anos: string | null
          idade_min_anos: string | null
          interpretacao_esperada: string | null
          justificativa_padrao: string | null
          linha_recomendacao: string | null
          lote_id: string | null
          momento_solicitation: string | null
          nao_solicitar_se: string | null
          nivel_evidencia: string | null
          nome_exame: string
          nome_patologia: string
          obrigatoriedade: string | null
          repetir_em_horas: string | null
          sexo_alvo: string | null
          status: string
          subtipo: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          aplica_gestante?: string | null
          conduta_se_alterado?: string | null
          contextos?: string | null
          created_at?: string
          criterio_positividade?: string | null
          finalidade?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_max_anos?: string | null
          idade_min_anos?: string | null
          interpretacao_esperada?: string | null
          justificativa_padrao?: string | null
          linha_recomendacao?: string | null
          lote_id?: string | null
          momento_solicitation?: string | null
          nao_solicitar_se?: string | null
          nivel_evidencia?: string | null
          nome_exame: string
          nome_patologia: string
          obrigatoriedade?: string | null
          repetir_em_horas?: string | null
          sexo_alvo?: string | null
          status?: string
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          aplica_gestante?: string | null
          conduta_se_alterado?: string | null
          contextos?: string | null
          created_at?: string
          criterio_positividade?: string | null
          finalidade?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_max_anos?: string | null
          idade_min_anos?: string | null
          interpretacao_esperada?: string | null
          justificativa_padrao?: string | null
          linha_recomendacao?: string | null
          lote_id?: string | null
          momento_solicitation?: string | null
          nao_solicitar_se?: string | null
          nivel_evidencia?: string | null
          nome_exame?: string
          nome_patologia?: string
          obrigatoriedade?: string | null
          repetir_em_horas?: string | null
          sexo_alvo?: string | null
          status?: string
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      base_patologias_clinicas: {
        Row: {
          categoria_clinica: string | null
          cid10: string | null
          cid11: string | null
          contexto_predominante: string | null
          created_at: string
          fonte_id: string | null
          id: string
          is_emergencia: string | null
          lote_id: string | null
          nome_normalizado: string | null
          nome_patologia: string
          patologia_pai: string | null
          sinonimos: string | null
          status: string
          subtipo: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          categoria_clinica?: string | null
          cid10?: string | null
          cid11?: string | null
          contexto_predominante?: string | null
          created_at?: string
          fonte_id?: string | null
          id?: string
          is_emergencia?: string | null
          lote_id?: string | null
          nome_normalizado?: string | null
          nome_patologia: string
          patologia_pai?: string | null
          sinonimos?: string | null
          status?: string
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          categoria_clinica?: string | null
          cid10?: string | null
          cid11?: string | null
          contexto_predominante?: string | null
          created_at?: string
          fonte_id?: string | null
          id?: string
          is_emergencia?: string | null
          lote_id?: string | null
          nome_normalizado?: string | null
          nome_patologia?: string
          patologia_pai?: string | null
          sinonimos?: string | null
          status?: string
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      base_patologias_ref: {
        Row: {
          categoria_clinica: string | null
          cid10: string | null
          cid11: string | null
          contexto_predominante: string | null
          created_at: string | null
          fonte_id: string | null
          id: string
          is_emergencia: boolean | null
          lote_id: string
          nome_normalizado: string
          nome_patologia: string
          patologia_pai: string | null
          sinonimos: string | null
          subtipo: string | null
          trecho_citado: string | null
          updated_at: string | null
        }
        Insert: {
          categoria_clinica?: string | null
          cid10?: string | null
          cid11?: string | null
          contexto_predominante?: string | null
          created_at?: string | null
          fonte_id?: string | null
          id?: string
          is_emergencia?: boolean | null
          lote_id: string
          nome_normalizado: string
          nome_patologia: string
          patologia_pai?: string | null
          sinonimos?: string | null
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string | null
        }
        Update: {
          categoria_clinica?: string | null
          cid10?: string | null
          cid11?: string | null
          contexto_predominante?: string | null
          created_at?: string | null
          fonte_id?: string | null
          id?: string
          is_emergencia?: boolean | null
          lote_id?: string
          nome_normalizado?: string
          nome_patologia?: string
          patologia_pai?: string | null
          sinonimos?: string | null
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_patologias_ref_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_patologias_ref_patologia_pai_fkey"
            columns: ["patologia_pai"]
            isOneToOne: false
            referencedRelation: "base_patologias_ref"
            referencedColumns: ["id"]
          },
        ]
      }
      base_protocolos_clinicos: {
        Row: {
          alertas_seguranca: string[]
          area_clinica: string | null
          ativo: boolean
          atualizado_em: string
          atualizado_por: string | null
          cids_relacionados: string[]
          condutas_iniciais: Json
          contexto_atendimento: Database["public"]["Enums"]["protocol_context"]
          contraindicacoes_relevantes: string[]
          criado_em: string
          criado_por: string | null
          criterios_encaminhamento: Json
          criterios_internacao: Json
          cuidados_enfermagem: Json
          data_atualizacao: string
          diagnosticos_diferenciais: string[]
          exames_sugeridos: Json
          faixa_etaria_max: number | null
          faixa_etaria_min: number | null
          fonte_referencia: string | null
          id: string
          medicamentos_sugeridos: Json
          medidas_nao_farmacologicas: Json
          motivo_alteracao: string | null
          nome_protocolo: string
          orientacoes_paciente: string | null
          palavras_chave: string[]
          populacao_alvo: string | null
          protocolo_origem: string | null
          queixas_relacionadas: string[]
          revisado_em: string | null
          revisado_por: string | null
          sinais_gravidade: Json
          sinais_retorno_imediato: Json
          sindromes_relacionadas: string[]
          status_revisao: Database["public"]["Enums"]["protocol_review_status"]
          tipo_protocolo: Database["public"]["Enums"]["protocol_type"]
          versao_protocolo: number
        }
        Insert: {
          alertas_seguranca?: string[]
          area_clinica?: string | null
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          cids_relacionados?: string[]
          condutas_iniciais?: Json
          contexto_atendimento?: Database["public"]["Enums"]["protocol_context"]
          contraindicacoes_relevantes?: string[]
          criado_em?: string
          criado_por?: string | null
          criterios_encaminhamento?: Json
          criterios_internacao?: Json
          cuidados_enfermagem?: Json
          data_atualizacao?: string
          diagnosticos_diferenciais?: string[]
          exames_sugeridos?: Json
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          fonte_referencia?: string | null
          id?: string
          medicamentos_sugeridos?: Json
          medidas_nao_farmacologicas?: Json
          motivo_alteracao?: string | null
          nome_protocolo: string
          orientacoes_paciente?: string | null
          palavras_chave?: string[]
          populacao_alvo?: string | null
          protocolo_origem?: string | null
          queixas_relacionadas?: string[]
          revisado_em?: string | null
          revisado_por?: string | null
          sinais_gravidade?: Json
          sinais_retorno_imediato?: Json
          sindromes_relacionadas?: string[]
          status_revisao?: Database["public"]["Enums"]["protocol_review_status"]
          tipo_protocolo?: Database["public"]["Enums"]["protocol_type"]
          versao_protocolo?: number
        }
        Update: {
          alertas_seguranca?: string[]
          area_clinica?: string | null
          ativo?: boolean
          atualizado_em?: string
          atualizado_por?: string | null
          cids_relacionados?: string[]
          condutas_iniciais?: Json
          contexto_atendimento?: Database["public"]["Enums"]["protocol_context"]
          contraindicacoes_relevantes?: string[]
          criado_em?: string
          criado_por?: string | null
          criterios_encaminhamento?: Json
          criterios_internacao?: Json
          cuidados_enfermagem?: Json
          data_atualizacao?: string
          diagnosticos_diferenciais?: string[]
          exames_sugeridos?: Json
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          fonte_referencia?: string | null
          id?: string
          medicamentos_sugeridos?: Json
          medidas_nao_farmacologicas?: Json
          motivo_alteracao?: string | null
          nome_protocolo?: string
          orientacoes_paciente?: string | null
          palavras_chave?: string[]
          populacao_alvo?: string | null
          protocolo_origem?: string | null
          queixas_relacionadas?: string[]
          revisado_em?: string | null
          revisado_por?: string | null
          sinais_gravidade?: Json
          sinais_retorno_imediato?: Json
          sindromes_relacionadas?: string[]
          status_revisao?: Database["public"]["Enums"]["protocol_review_status"]
          tipo_protocolo?: Database["public"]["Enums"]["protocol_type"]
          versao_protocolo?: number
        }
        Relationships: []
      }
      base_rastreamentos: {
        Row: {
          acao_se_positivo: string | null
          condicao_de_risco: string | null
          created_at: string
          divergencia_internacional: string | null
          exame_metodo: string | null
          fonte_id: string | null
          forca_recomendacao: string | null
          id: string
          idade_fim: string | null
          idade_inicio: string | null
          incorporado_sus: string | null
          intervalo_meses: string | null
          lote_id: string | null
          nivel_evidencia: string | null
          nome_rastreamento: string
          orgao_emissor: string | null
          patologia_alvo: string | null
          populacao_alvo: string | null
          sexo_alvo: string | null
          status: string
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          acao_se_positivo?: string | null
          condicao_de_risco?: string | null
          created_at?: string
          divergencia_internacional?: string | null
          exame_metodo?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_fim?: string | null
          idade_inicio?: string | null
          incorporado_sus?: string | null
          intervalo_meses?: string | null
          lote_id?: string | null
          nivel_evidencia?: string | null
          nome_rastreamento: string
          orgao_emissor?: string | null
          patologia_alvo?: string | null
          populacao_alvo?: string | null
          sexo_alvo?: string | null
          status?: string
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          acao_se_positivo?: string | null
          condicao_de_risco?: string | null
          created_at?: string
          divergencia_internacional?: string | null
          exame_metodo?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_fim?: string | null
          idade_inicio?: string | null
          incorporado_sus?: string | null
          intervalo_meses?: string | null
          lote_id?: string | null
          nivel_evidencia?: string | null
          nome_rastreamento?: string
          orgao_emissor?: string | null
          patologia_alvo?: string | null
          populacao_alvo?: string | null
          sexo_alvo?: string | null
          status?: string
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      base_referencias_clinicas: {
        Row: {
          ano_atualizacao: number | null
          ano_publicacao: number | null
          codigo_fonte: string
          confiabilidade: number | null
          created_at: string | null
          doi: string | null
          escopo: string | null
          id: string
          lote_id: string
          observacao: string | null
          orgao_emissor: string | null
          tipo_documento: string | null
          titulo: string
          updated_at: string | null
          url: string | null
          verificacao_pendente: boolean | null
          vigente: boolean | null
        }
        Insert: {
          ano_atualizacao?: number | null
          ano_publicacao?: number | null
          codigo_fonte: string
          confiabilidade?: number | null
          created_at?: string | null
          doi?: string | null
          escopo?: string | null
          id?: string
          lote_id: string
          observacao?: string | null
          orgao_emissor?: string | null
          tipo_documento?: string | null
          titulo: string
          updated_at?: string | null
          url?: string | null
          verificacao_pendente?: boolean | null
          vigente?: boolean | null
        }
        Update: {
          ano_atualizacao?: number | null
          ano_publicacao?: number | null
          codigo_fonte?: string
          confiabilidade?: number | null
          created_at?: string | null
          doi?: string | null
          escopo?: string | null
          id?: string
          lote_id?: string
          observacao?: string | null
          orgao_emissor?: string | null
          tipo_documento?: string | null
          titulo?: string
          updated_at?: string | null
          url?: string | null
          verificacao_pendente?: boolean | null
          vigente?: boolean | null
        }
        Relationships: []
      }
      base_sinais_alarme: {
        Row: {
          conduta: string | null
          created_at: string | null
          descricao_sinal_medico: string | null
          descricao_sinal_paciente: string | null
          fonte_id: string | null
          gravidade: string | null
          id: string
          lote_id: string
          sistema: string | null
          tempo_maximo_acao_horas: number | null
          trecho_citado: string | null
          updated_at: string | null
        }
        Insert: {
          conduta?: string | null
          created_at?: string | null
          descricao_sinal_medico?: string | null
          descricao_sinal_paciente?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          lote_id: string
          sistema?: string | null
          tempo_maximo_acao_horas?: number | null
          trecho_citado?: string | null
          updated_at?: string | null
        }
        Update: {
          conduta?: string | null
          created_at?: string | null
          descricao_sinal_medico?: string | null
          descricao_sinal_paciente?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          lote_id?: string
          sistema?: string | null
          tempo_maximo_acao_horas?: number | null
          trecho_citado?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_sinais_alarme_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      base_sindromes: {
        Row: {
          adaptacao_geriatrica: string | null
          adaptacao_gestante: string | null
          adaptacao_lactante: string | null
          adaptacao_pediatrica: string | null
          ambientes: string[]
          atestado_padrao: string | null
          categoria: string | null
          cid_sugerido: string | null
          codigo: string
          contraindicacoes: string[]
          created_at: string
          documentos_relacionados: string[]
          encaminhamentos: string[]
          exames_apac: Json
          exames_comuns: Json
          fonte: string | null
          gravidade_tipica: string | null
          id: string
          medicamentos_ambulatoriais: Json
          medicamentos_hospitalares: Json
          nome: string
          orientacoes: string[]
          relatorio_padrao: string | null
          sinais_alerta: string[]
          sinonimos: string[]
          status: string
          updated_at: string
          versao: number
        }
        Insert: {
          adaptacao_geriatrica?: string | null
          adaptacao_gestante?: string | null
          adaptacao_lactante?: string | null
          adaptacao_pediatrica?: string | null
          ambientes?: string[]
          atestado_padrao?: string | null
          categoria?: string | null
          cid_sugerido?: string | null
          codigo: string
          contraindicacoes?: string[]
          created_at?: string
          documentos_relacionados?: string[]
          encaminhamentos?: string[]
          exames_apac?: Json
          exames_comuns?: Json
          fonte?: string | null
          gravidade_tipica?: string | null
          id?: string
          medicamentos_ambulatoriais?: Json
          medicamentos_hospitalares?: Json
          nome: string
          orientacoes?: string[]
          relatorio_padrao?: string | null
          sinais_alerta?: string[]
          sinonimos?: string[]
          status?: string
          updated_at?: string
          versao?: number
        }
        Update: {
          adaptacao_geriatrica?: string | null
          adaptacao_gestante?: string | null
          adaptacao_lactante?: string | null
          adaptacao_pediatrica?: string | null
          ambientes?: string[]
          atestado_padrao?: string | null
          categoria?: string | null
          cid_sugerido?: string | null
          codigo?: string
          contraindicacoes?: string[]
          created_at?: string
          documentos_relacionados?: string[]
          encaminhamentos?: string[]
          exames_apac?: Json
          exames_comuns?: Json
          fonte?: string | null
          gravidade_tipica?: string | null
          id?: string
          medicamentos_ambulatoriais?: Json
          medicamentos_hospitalares?: Json
          nome?: string
          orientacoes?: string[]
          relatorio_padrao?: string | null
          sinais_alerta?: string[]
          sinonimos?: string[]
          status?: string
          updated_at?: string
          versao?: number
        }
        Relationships: []
      }
      base_vinculos_cid_queixa: {
        Row: {
          ativo: boolean
          cid: string | null
          contexto:
            | Database["public"]["Enums"]["medicamento_contexto_uso"]
            | null
          created_at: string
          criado_por: string | null
          descricao_cid: string | null
          fonte_referencia: string | null
          id: string
          id_medicamento: string
          observacao_uso: string | null
          principio_ativo: string
          prioridade_sugestao: string | null
          protocolo: string | null
          queixa: string | null
          sindrome: string | null
          status_revisao: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cid?: string | null
          contexto?:
            | Database["public"]["Enums"]["medicamento_contexto_uso"]
            | null
          created_at?: string
          criado_por?: string | null
          descricao_cid?: string | null
          fonte_referencia?: string | null
          id?: string
          id_medicamento: string
          observacao_uso?: string | null
          principio_ativo: string
          prioridade_sugestao?: string | null
          protocolo?: string | null
          queixa?: string | null
          sindrome?: string | null
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cid?: string | null
          contexto?:
            | Database["public"]["Enums"]["medicamento_contexto_uso"]
            | null
          created_at?: string
          criado_por?: string | null
          descricao_cid?: string | null
          fonte_referencia?: string | null
          id?: string
          id_medicamento?: string
          observacao_uso?: string | null
          principio_ativo?: string
          prioridade_sugestao?: string | null
          protocolo?: string | null
          queixa?: string | null
          sindrome?: string | null
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_vinculos_cid_queixa_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_vinculos_cid_queixa_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_vinculos_cid_queixa_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_vinculos_cid_queixa_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      beta_checklist_items: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          chave: string
          id: string
          label: string
          observacao: string | null
          ordem: number
          status: Database["public"]["Enums"]["checklist_status"]
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave: string
          id?: string
          label: string
          observacao?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["checklist_status"]
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave?: string
          id?: string
          label?: string
          observacao?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["checklist_status"]
        }
        Relationships: []
      }
      beta_modulos_revisao: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          chave: string
          id: string
          label: string
          observacao: string | null
          ordem: number
          status: Database["public"]["Enums"]["modulo_revisao_status"]
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave: string
          id?: string
          label: string
          observacao?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["modulo_revisao_status"]
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          chave?: string
          id?: string
          label?: string
          observacao?: string | null
          ordem?: number
          status?: Database["public"]["Enums"]["modulo_revisao_status"]
        }
        Relationships: []
      }
      beta_settings: {
        Row: {
          ajuste_renal: boolean
          assinatura_digital: boolean
          calculo_pediatrico: boolean
          entrada_voz: boolean
          id: string
          interacoes: boolean
          link_paciente: boolean
          modelos_rapidos: boolean
          modo_beta_ativo: boolean
          protocolos: boolean
          seguranca_iv: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ajuste_renal?: boolean
          assinatura_digital?: boolean
          calculo_pediatrico?: boolean
          entrada_voz?: boolean
          id?: string
          interacoes?: boolean
          link_paciente?: boolean
          modelos_rapidos?: boolean
          modo_beta_ativo?: boolean
          protocolos?: boolean
          seguranca_iv?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ajuste_renal?: boolean
          assinatura_digital?: boolean
          calculo_pediatrico?: boolean
          entrada_voz?: boolean
          id?: string
          interacoes?: boolean
          link_paciente?: boolean
          modelos_rapidos?: boolean
          modo_beta_ativo?: boolean
          protocolos?: boolean
          seguranca_iv?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      cid_combos: {
        Row: {
          cid_principal: string | null
          cids_associados: string[]
          contexto: string | null
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
          usos: number
        }
        Insert: {
          cid_principal?: string | null
          cids_associados?: string[]
          contexto?: string | null
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
          usos?: number
        }
        Update: {
          cid_principal?: string | null
          cids_associados?: string[]
          contexto?: string | null
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          usos?: number
        }
        Relationships: []
      }
      cid_preferencias: {
        Row: {
          cid_principal: string | null
          cids_associados: string[]
          cids_removidos: string[]
          created_at: string
          id: string
          patologia_chave: string
          patologia_nome: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cid_principal?: string | null
          cids_associados?: string[]
          cids_removidos?: string[]
          created_at?: string
          id?: string
          patologia_chave: string
          patologia_nome?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cid_principal?: string | null
          cids_associados?: string[]
          cids_removidos?: string[]
          created_at?: string
          id?: string
          patologia_chave?: string
          patologia_nome?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clinical_alerts_settings: {
        Row: {
          bloquear_alergia_grave_pa: boolean
          diferenciar_intolerancia_alergia: boolean
          exigir_just_alergia_suspeita: boolean
          exigir_just_comorbidade_grave: boolean
          exigir_just_gestacao: boolean
          exigir_just_lactacao: boolean
          id: string
          ocultar_sem_fonte_uso_clinico: boolean
          permitir_restricoes_paciente: boolean
          updated_at: string
          updated_by: string | null
          usar_apenas_revisadas: boolean
        }
        Insert: {
          bloquear_alergia_grave_pa?: boolean
          diferenciar_intolerancia_alergia?: boolean
          exigir_just_alergia_suspeita?: boolean
          exigir_just_comorbidade_grave?: boolean
          exigir_just_gestacao?: boolean
          exigir_just_lactacao?: boolean
          id?: string
          ocultar_sem_fonte_uso_clinico?: boolean
          permitir_restricoes_paciente?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_apenas_revisadas?: boolean
        }
        Update: {
          bloquear_alergia_grave_pa?: boolean
          diferenciar_intolerancia_alergia?: boolean
          exigir_just_alergia_suspeita?: boolean
          exigir_just_comorbidade_grave?: boolean
          exigir_just_gestacao?: boolean
          exigir_just_lactacao?: boolean
          id?: string
          ocultar_sem_fonte_uso_clinico?: boolean
          permitir_restricoes_paciente?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_apenas_revisadas?: boolean
        }
        Relationships: []
      }
      clinical_condition_medication: {
        Row: {
          apresentacao_id: string | null
          care_context: Database["public"]["Enums"]["vinculo_contexto"]
          condicao_id: string | null
          condicao_nome: string
          condicao_normalizada: string
          condicao_tipo: string
          created_at: string
          criado_por: string | null
          id: string
          medicamento_id: string
          notes: string | null
          papel: Database["public"]["Enums"]["vinculo_papel"]
          populacao: string | null
          prioridade: number
          review_status: Database["public"]["Enums"]["vinculo_status"]
          revisado_em: string | null
          revisado_por: string | null
          source_reference: string | null
          updated_at: string
          versao: number
        }
        Insert: {
          apresentacao_id?: string | null
          care_context?: Database["public"]["Enums"]["vinculo_contexto"]
          condicao_id?: string | null
          condicao_nome: string
          condicao_normalizada: string
          condicao_tipo: string
          created_at?: string
          criado_por?: string | null
          id?: string
          medicamento_id: string
          notes?: string | null
          papel?: Database["public"]["Enums"]["vinculo_papel"]
          populacao?: string | null
          prioridade?: number
          review_status?: Database["public"]["Enums"]["vinculo_status"]
          revisado_em?: string | null
          revisado_por?: string | null
          source_reference?: string | null
          updated_at?: string
          versao?: number
        }
        Update: {
          apresentacao_id?: string | null
          care_context?: Database["public"]["Enums"]["vinculo_contexto"]
          condicao_id?: string | null
          condicao_nome?: string
          condicao_normalizada?: string
          condicao_tipo?: string
          created_at?: string
          criado_por?: string | null
          id?: string
          medicamento_id?: string
          notes?: string | null
          papel?: Database["public"]["Enums"]["vinculo_papel"]
          populacao?: string | null
          prioridade?: number
          review_status?: Database["public"]["Enums"]["vinculo_status"]
          revisado_em?: string | null
          revisado_por?: string | null
          source_reference?: string | null
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "clinical_condition_medication_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "base_apresentacoes_medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_condition_medication_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_apresentacao_completa"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "clinical_condition_medication_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["apresentacao_unica_id"]
          },
          {
            foreignKeyName: "clinical_condition_medication_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "clinical_condition_medication_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_condition_medication_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_condition_medication_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_condition_medication_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      clinical_condition_medication_log: {
        Row: {
          acao: string
          alterado_por: string | null
          created_at: string
          id: string
          snapshot: Json | null
          vinculo_id: string | null
        }
        Insert: {
          acao: string
          alterado_por?: string | null
          created_at?: string
          id?: string
          snapshot?: Json | null
          vinculo_id?: string | null
        }
        Update: {
          acao?: string
          alterado_por?: string | null
          created_at?: string
          id?: string
          snapshot?: Json | null
          vinculo_id?: string | null
        }
        Relationships: []
      }
      config_importacao_base: {
        Row: {
          atualizado_por: string | null
          chave: string
          descricao: string | null
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          atualizado_por?: string | null
          chave: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          atualizado_por?: string | null
          chave?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      conjuntos_rapidos: {
        Row: {
          ativo: boolean
          atualizado_em: string
          categoria: Database["public"]["Enums"]["quickset_category"]
          contexto_atendimento: Database["public"]["Enums"]["template_context"]
          criado_em: string
          criado_por: string | null
          data_atualizacao: string
          descricao: string | null
          fonte_referencia: string | null
          id: string
          itens: Json
          nome_conjunto: string
          status_revisao: Database["public"]["Enums"]["template_review_status"]
          visibilidade: Database["public"]["Enums"]["template_visibility"]
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: Database["public"]["Enums"]["quickset_category"]
          contexto_atendimento?: Database["public"]["Enums"]["template_context"]
          criado_em?: string
          criado_por?: string | null
          data_atualizacao?: string
          descricao?: string | null
          fonte_referencia?: string | null
          id?: string
          itens?: Json
          nome_conjunto: string
          status_revisao?: Database["public"]["Enums"]["template_review_status"]
          visibilidade?: Database["public"]["Enums"]["template_visibility"]
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          categoria?: Database["public"]["Enums"]["quickset_category"]
          contexto_atendimento?: Database["public"]["Enums"]["template_context"]
          criado_em?: string
          criado_por?: string | null
          data_atualizacao?: string
          descricao?: string | null
          fonte_referencia?: string | null
          id?: string
          itens?: Json
          nome_conjunto?: string
          status_revisao?: Database["public"]["Enums"]["template_review_status"]
          visibilidade?: Database["public"]["Enums"]["template_visibility"]
        }
        Relationships: []
      }
      curadoria_decisoes: {
        Row: {
          chave: string
          created_at: string
          created_by: string | null
          decisao: string
          detalhe: string | null
          id: string
          lote_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          chave: string
          created_at?: string
          created_by?: string | null
          decisao: string
          detalhe?: string | null
          id?: string
          lote_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          chave?: string
          created_at?: string
          created_by?: string | null
          decisao?: string
          detalhe?: string | null
          id?: string
          lote_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      documento_links_publicos: {
        Row: {
          canal_envio: string | null
          created_at: string
          criado_por: string
          data_envio: string | null
          enviado_para: string | null
          expira_em: string
          id: string
          id_documento: string
          numero_acessos: number
          senha_hash: string | null
          status: Database["public"]["Enums"]["link_publico_status"]
          token: string
          updated_at: string
        }
        Insert: {
          canal_envio?: string | null
          created_at?: string
          criado_por: string
          data_envio?: string | null
          enviado_para?: string | null
          expira_em?: string
          id?: string
          id_documento: string
          numero_acessos?: number
          senha_hash?: string | null
          status?: Database["public"]["Enums"]["link_publico_status"]
          token: string
          updated_at?: string
        }
        Update: {
          canal_envio?: string | null
          created_at?: string
          criado_por?: string
          data_envio?: string | null
          enviado_para?: string | null
          expira_em?: string
          id?: string
          id_documento?: string
          numero_acessos?: number
          senha_hash?: string | null
          status?: Database["public"]["Enums"]["link_publico_status"]
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      documento_templates: {
        Row: {
          config: Json
          created_at: string
          descricao: string | null
          documento_tipo: string
          id: string
          instituicao: string | null
          is_galeria: boolean
          nome: string
          updated_at: string
          user_id: string
          visibilidade: string
        }
        Insert: {
          config?: Json
          created_at?: string
          descricao?: string | null
          documento_tipo?: string
          id?: string
          instituicao?: string | null
          is_galeria?: boolean
          nome: string
          updated_at?: string
          user_id?: string
          visibilidade?: string
        }
        Update: {
          config?: Json
          created_at?: string
          descricao?: string | null
          documento_tipo?: string
          id?: string
          instituicao?: string | null
          is_galeria?: boolean
          nome?: string
          updated_at?: string
          user_id?: string
          visibilidade?: string
        }
        Relationships: []
      }
      documentos_gerados: {
        Row: {
          arquivo_pdf_url: string | null
          codigo_validacao: string | null
          conteudo_json: Json
          conteudo_resumido: string | null
          data_hora: string
          documento_original: string | null
          gerado_por: string
          hash_documento: string | null
          id: string
          id_atendimento: string | null
          id_paciente: string | null
          motivo_cancelamento: string | null
          motivo_substituicao: string | null
          origem: Database["public"]["Enums"]["documento_origem"]
          status: Database["public"]["Enums"]["documento_status"]
          tipo: Database["public"]["Enums"]["documento_tipo"]
          titulo: string
          updated_at: string
          versao: number
        }
        Insert: {
          arquivo_pdf_url?: string | null
          codigo_validacao?: string | null
          conteudo_json?: Json
          conteudo_resumido?: string | null
          data_hora?: string
          documento_original?: string | null
          gerado_por: string
          hash_documento?: string | null
          id?: string
          id_atendimento?: string | null
          id_paciente?: string | null
          motivo_cancelamento?: string | null
          motivo_substituicao?: string | null
          origem?: Database["public"]["Enums"]["documento_origem"]
          status?: Database["public"]["Enums"]["documento_status"]
          tipo: Database["public"]["Enums"]["documento_tipo"]
          titulo: string
          updated_at?: string
          versao?: number
        }
        Update: {
          arquivo_pdf_url?: string | null
          codigo_validacao?: string | null
          conteudo_json?: Json
          conteudo_resumido?: string | null
          data_hora?: string
          documento_original?: string | null
          gerado_por?: string
          hash_documento?: string | null
          id?: string
          id_atendimento?: string | null
          id_paciente?: string | null
          motivo_cancelamento?: string | null
          motivo_substituicao?: string | null
          origem?: Database["public"]["Enums"]["documento_origem"]
          status?: Database["public"]["Enums"]["documento_status"]
          tipo?: Database["public"]["Enums"]["documento_tipo"]
          titulo?: string
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentos_gerados_documento_original_fkey"
            columns: ["documento_original"]
            isOneToOne: false
            referencedRelation: "documentos_gerados"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_settings: {
        Row: {
          anexo_iv_modo: Database["public"]["Enums"]["anexo_iv_modo"]
          bloquear_pdf_se_alerta_critico: boolean
          cid_atestado_modo: Database["public"]["Enums"]["cid_atestado_modo"]
          exigir_dados_completos_controle_especial: boolean
          exigir_revisao_final_concluida: boolean
          formato_pagina: string
          gerar_duas_vias_controle_especial: boolean
          gerar_pdfs_separados_padrao: boolean
          id: string
          mostrar_endereco: boolean
          mostrar_logo: boolean
          mostrar_telefone: boolean
          numerar_paginas: boolean
          previa_obrigatoria: boolean
          salvar_copia_historico: boolean
          separar_antimicrobianos: boolean
          updated_at: string
          updated_by: string | null
          usar_qrcode_validacao: boolean
        }
        Insert: {
          anexo_iv_modo?: Database["public"]["Enums"]["anexo_iv_modo"]
          bloquear_pdf_se_alerta_critico?: boolean
          cid_atestado_modo?: Database["public"]["Enums"]["cid_atestado_modo"]
          exigir_dados_completos_controle_especial?: boolean
          exigir_revisao_final_concluida?: boolean
          formato_pagina?: string
          gerar_duas_vias_controle_especial?: boolean
          gerar_pdfs_separados_padrao?: boolean
          id?: string
          mostrar_endereco?: boolean
          mostrar_logo?: boolean
          mostrar_telefone?: boolean
          numerar_paginas?: boolean
          previa_obrigatoria?: boolean
          salvar_copia_historico?: boolean
          separar_antimicrobianos?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_qrcode_validacao?: boolean
        }
        Update: {
          anexo_iv_modo?: Database["public"]["Enums"]["anexo_iv_modo"]
          bloquear_pdf_se_alerta_critico?: boolean
          cid_atestado_modo?: Database["public"]["Enums"]["cid_atestado_modo"]
          exigir_dados_completos_controle_especial?: boolean
          exigir_revisao_final_concluida?: boolean
          formato_pagina?: string
          gerar_duas_vias_controle_especial?: boolean
          gerar_pdfs_separados_padrao?: boolean
          id?: string
          mostrar_endereco?: boolean
          mostrar_logo?: boolean
          mostrar_telefone?: boolean
          numerar_paginas?: boolean
          previa_obrigatoria?: boolean
          salvar_copia_historico?: boolean
          separar_antimicrobianos?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_qrcode_validacao?: boolean
        }
        Relationships: []
      }
      entrada_inteligente_settings: {
        Row: {
          aprendizado_automatico_sem_revisao: boolean
          confianca_min_preselecao: number
          confianca_min_sugestao: number
          exigir_revisao_todos_itens: boolean
          id: string
          permitir_aprendizado_termos: boolean
          permitir_preselecao_alta_confianca: boolean
          salvar_logs: boolean
          updated_at: string
          updated_by: string | null
          usar_arquivo: boolean
          usar_foto: boolean
          usar_texto_livre: boolean
          usar_voz: boolean
        }
        Insert: {
          aprendizado_automatico_sem_revisao?: boolean
          confianca_min_preselecao?: number
          confianca_min_sugestao?: number
          exigir_revisao_todos_itens?: boolean
          id?: string
          permitir_aprendizado_termos?: boolean
          permitir_preselecao_alta_confianca?: boolean
          salvar_logs?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_arquivo?: boolean
          usar_foto?: boolean
          usar_texto_livre?: boolean
          usar_voz?: boolean
        }
        Update: {
          aprendizado_automatico_sem_revisao?: boolean
          confianca_min_preselecao?: number
          confianca_min_sugestao?: number
          exigir_revisao_todos_itens?: boolean
          id?: string
          permitir_aprendizado_termos?: boolean
          permitir_preselecao_alta_confianca?: boolean
          salvar_logs?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_arquivo?: boolean
          usar_foto?: boolean
          usar_texto_livre?: boolean
          usar_voz?: boolean
        }
        Relationships: []
      }
      etl_promocao_log: {
        Row: {
          atualizados: number
          created_at: string
          duracao_ms: number
          erro: string | null
          etapa: string
          execucao_id: string
          executado_por: string | null
          id: string
          inseridos: number
          lidos: number
          lote_id: string
          rejeitados: number
          status: string
          tabela_destino: string
          tabela_origem: string
        }
        Insert: {
          atualizados?: number
          created_at?: string
          duracao_ms?: number
          erro?: string | null
          etapa: string
          execucao_id?: string
          executado_por?: string | null
          id?: string
          inseridos?: number
          lidos?: number
          lote_id: string
          rejeitados?: number
          status?: string
          tabela_destino: string
          tabela_origem: string
        }
        Update: {
          atualizados?: number
          created_at?: string
          duracao_ms?: number
          erro?: string | null
          etapa?: string
          execucao_id?: string
          executado_por?: string | null
          id?: string
          inseridos?: number
          lidos?: number
          lote_id?: string
          rejeitados?: number
          status?: string
          tabela_destino?: string
          tabela_origem?: string
        }
        Relationships: []
      }
      eventos_beta_log: {
        Row: {
          created_at: string
          id: string
          payload: Json
          tipo_evento: string
          usuario: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          tipo_evento: string
          usuario?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          tipo_evento?: string
          usuario?: string | null
        }
        Relationships: []
      }
      favoritos_medicamentos: {
        Row: {
          apresentacao: string | null
          ativo: boolean
          atualizado_em: string
          contexto_uso: string | null
          criado_em: string
          dose_padrao: string | null
          duracao_padrao: string | null
          frequencia_padrao: string | null
          id: string
          id_usuario: string
          nome_medicamento: string | null
          observacoes_padrao: string | null
          principio_ativo: string
          unidade_dose: string | null
          via: string | null
        }
        Insert: {
          apresentacao?: string | null
          ativo?: boolean
          atualizado_em?: string
          contexto_uso?: string | null
          criado_em?: string
          dose_padrao?: string | null
          duracao_padrao?: string | null
          frequencia_padrao?: string | null
          id?: string
          id_usuario: string
          nome_medicamento?: string | null
          observacoes_padrao?: string | null
          principio_ativo: string
          unidade_dose?: string | null
          via?: string | null
        }
        Update: {
          apresentacao?: string | null
          ativo?: boolean
          atualizado_em?: string
          contexto_uso?: string | null
          criado_em?: string
          dose_padrao?: string | null
          duracao_padrao?: string | null
          frequencia_padrao?: string | null
          id?: string
          id_usuario?: string
          nome_medicamento?: string | null
          observacoes_padrao?: string | null
          principio_ativo?: string
          unidade_dose?: string | null
          via?: string | null
        }
        Relationships: []
      }
      hardening_beta_itens: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          criado_em: string
          criticidade: string
          descricao: string | null
          evidencia_url: string | null
          id: string
          observacao: string | null
          ordem: number
          responsavel: string | null
          secao: string
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          criado_em?: string
          criticidade?: string
          descricao?: string | null
          evidencia_url?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          responsavel?: string | null
          secao: string
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          criado_em?: string
          criticidade?: string
          descricao?: string | null
          evidencia_url?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          responsavel?: string | null
          secao?: string
          status?: string
          titulo?: string
        }
        Relationships: []
      }
      historico_alertas_iv: {
        Row: {
          acao_usuario: Database["public"]["Enums"]["iv_alert_action"]
          data_hora: string
          gravidade: Database["public"]["Enums"]["iv_alert_severity"]
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          justificativa: string | null
          mensagem_alerta: string
          principio_ativo: string
          tipo_alerta: string
          usuario_responsavel: string
          valor_prescrito: string | null
          valor_recomendado: string | null
        }
        Insert: {
          acao_usuario: Database["public"]["Enums"]["iv_alert_action"]
          data_hora?: string
          gravidade: Database["public"]["Enums"]["iv_alert_severity"]
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          mensagem_alerta: string
          principio_ativo: string
          tipo_alerta: string
          usuario_responsavel: string
          valor_prescrito?: string | null
          valor_recomendado?: string | null
        }
        Update: {
          acao_usuario?: Database["public"]["Enums"]["iv_alert_action"]
          data_hora?: string
          gravidade?: Database["public"]["Enums"]["iv_alert_severity"]
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          mensagem_alerta?: string
          principio_ativo?: string
          tipo_alerta?: string
          usuario_responsavel?: string
          valor_prescrito?: string | null
          valor_recomendado?: string | null
        }
        Relationships: []
      }
      historico_importacao_medicamentos: {
        Row: {
          apresentacoes_importadas: number
          arquivo_nome: string
          created_at: string
          data_hora: string
          duplicados_detectados: number
          id: string
          linhas_com_alerta: number
          linhas_com_erro: number
          medicamentos_importados: number
          modelos_importados: number
          observacao: string | null
          registros_atualizados: number
          registros_ignorados: number
          status_importacao: string
          total_linhas: number
          usuario_responsavel: string | null
          vinculos_importados: number
        }
        Insert: {
          apresentacoes_importadas?: number
          arquivo_nome: string
          created_at?: string
          data_hora?: string
          duplicados_detectados?: number
          id?: string
          linhas_com_alerta?: number
          linhas_com_erro?: number
          medicamentos_importados?: number
          modelos_importados?: number
          observacao?: string | null
          registros_atualizados?: number
          registros_ignorados?: number
          status_importacao?: string
          total_linhas?: number
          usuario_responsavel?: string | null
          vinculos_importados?: number
        }
        Update: {
          apresentacoes_importadas?: number
          arquivo_nome?: string
          created_at?: string
          data_hora?: string
          duplicados_detectados?: number
          id?: string
          linhas_com_alerta?: number
          linhas_com_erro?: number
          medicamentos_importados?: number
          modelos_importados?: number
          observacao?: string | null
          registros_atualizados?: number
          registros_ignorados?: number
          status_importacao?: string
          total_linhas?: number
          usuario_responsavel?: string | null
          vinculos_importados?: number
        }
        Relationships: []
      }
      historico_revisao_seguranca_iv: {
        Row: {
          bloqueios_corrigidos: number
          bloqueios_identificados: number
          data_hora: string
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          justificativas_registradas: Json
          medicamentos_iv_revisados: Json
          orientacoes_copiadas: boolean
          quantidade_alertas_altos: number
          quantidade_alertas_informativos: number
          quantidade_alertas_medios: number
          status_finalizacao: Database["public"]["Enums"]["iv_review_status"]
          usuario_responsavel: string
        }
        Insert: {
          bloqueios_corrigidos?: number
          bloqueios_identificados?: number
          data_hora?: string
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativas_registradas?: Json
          medicamentos_iv_revisados?: Json
          orientacoes_copiadas?: boolean
          quantidade_alertas_altos?: number
          quantidade_alertas_informativos?: number
          quantidade_alertas_medios?: number
          status_finalizacao: Database["public"]["Enums"]["iv_review_status"]
          usuario_responsavel: string
        }
        Update: {
          bloqueios_corrigidos?: number
          bloqueios_identificados?: number
          data_hora?: string
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativas_registradas?: Json
          medicamentos_iv_revisados?: Json
          orientacoes_copiadas?: boolean
          quantidade_alertas_altos?: number
          quantidade_alertas_informativos?: number
          quantidade_alertas_medios?: number
          status_finalizacao?: Database["public"]["Enums"]["iv_review_status"]
          usuario_responsavel?: string
        }
        Relationships: []
      }
      historico_settings: {
        Row: {
          bloquear_item_alerta_critico: boolean
          cruzar_com_seguranca_atual: boolean
          exigir_just_dados_mudaram: boolean
          exigir_revisao_antes_reaproveitar: boolean
          id: string
          mostrar_medicamentos_recorrentes: boolean
          permitir_reaproveitar: boolean
          permitir_repetir_medicamento_isolado: boolean
          permitir_uso_continuo: boolean
          registrar_logs: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bloquear_item_alerta_critico?: boolean
          cruzar_com_seguranca_atual?: boolean
          exigir_just_dados_mudaram?: boolean
          exigir_revisao_antes_reaproveitar?: boolean
          id?: string
          mostrar_medicamentos_recorrentes?: boolean
          permitir_reaproveitar?: boolean
          permitir_repetir_medicamento_isolado?: boolean
          permitir_uso_continuo?: boolean
          registrar_logs?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bloquear_item_alerta_critico?: boolean
          cruzar_com_seguranca_atual?: boolean
          exigir_just_dados_mudaram?: boolean
          exigir_revisao_antes_reaproveitar?: boolean
          id?: string
          mostrar_medicamentos_recorrentes?: boolean
          permitir_reaproveitar?: boolean
          permitir_repetir_medicamento_isolado?: boolean
          permitir_uso_continuo?: boolean
          registrar_logs?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ia_atualizacoes_pendentes: {
        Row: {
          conteudo_anterior: string | null
          conteudo_novo: string | null
          created_at: string
          fonte: string | null
          id: string
          patologia: string
          provedor: string | null
          referencia: string | null
          resumo: string | null
          revisado_em: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          conteudo_anterior?: string | null
          conteudo_novo?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          patologia: string
          provedor?: string | null
          referencia?: string | null
          resumo?: string | null
          revisado_em?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          conteudo_anterior?: string | null
          conteudo_novo?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          patologia?: string
          provedor?: string | null
          referencia?: string | null
          resumo?: string | null
          revisado_em?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ia_credenciais_usuario: {
        Row: {
          atualizacoes_automaticas: boolean
          created_at: string
          modelo_preferido: string
          openrouter_key: string | null
          perplexity_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          atualizacoes_automaticas?: boolean
          created_at?: string
          modelo_preferido?: string
          openrouter_key?: string | null
          perplexity_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          atualizacoes_automaticas?: boolean
          created_at?: string
          modelo_preferido?: string
          openrouter_key?: string | null
          perplexity_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ia_interacoes_log: {
        Row: {
          aceito: boolean | null
          assunto: string | null
          created_at: string
          id: string
          modelo: string | null
          modulo: string
          provedor: string | null
          referencias: string[]
          user_id: string
        }
        Insert: {
          aceito?: boolean | null
          assunto?: string | null
          created_at?: string
          id?: string
          modelo?: string | null
          modulo: string
          provedor?: string | null
          referencias?: string[]
          user_id: string
        }
        Update: {
          aceito?: boolean | null
          assunto?: string | null
          created_at?: string
          id?: string
          modelo?: string | null
          modulo?: string
          provedor?: string | null
          referencias?: string[]
          user_id?: string
        }
        Relationships: []
      }
      indicadores_qualidade_ps: {
        Row: {
          ativo: boolean
          codigo_indicador: string
          created_at: string
          criterio: string
          descricao: string | null
          etapa_ordem: number | null
          etapa_titulo_match: string | null
          fonte_id: string | null
          formula_denominador: string | null
          formula_numerador: string | null
          id: number
          limite_min: number | null
          lote_id: string
          meta_operador: string
          meta_pct: string | null
          nome: string
          periodicidade: string | null
          protocolo_id: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo_indicador: string
          created_at?: string
          criterio?: string
          descricao?: string | null
          etapa_ordem?: number | null
          etapa_titulo_match?: string | null
          fonte_id?: string | null
          formula_denominador?: string | null
          formula_numerador?: string | null
          id?: number
          limite_min?: number | null
          lote_id: string
          meta_operador?: string
          meta_pct?: string | null
          nome: string
          periodicidade?: string | null
          protocolo_id?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo_indicador?: string
          created_at?: string
          criterio?: string
          descricao?: string | null
          etapa_ordem?: number | null
          etapa_titulo_match?: string | null
          fonte_id?: string | null
          formula_denominador?: string | null
          formula_numerador?: string | null
          id?: number
          limite_min?: number | null
          lote_id?: string
          meta_operador?: string
          meta_pct?: string | null
          nome?: string
          periodicidade?: string | null
          protocolo_id?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      interacoes_settings: {
        Row: {
          alertar_duplicidade: boolean
          bloquear_contraindicada: boolean
          exigir_just_duplicidade_alto_risco: boolean
          exigir_just_interacao_grave: boolean
          exigir_just_risco_muito_alto: boolean
          id: string
          ignorar_alertas_leves_revisao: boolean
          mostrar_risco_acumulado: boolean
          updated_at: string
          updated_by: string | null
          usar_apenas_revisadas: boolean
        }
        Insert: {
          alertar_duplicidade?: boolean
          bloquear_contraindicada?: boolean
          exigir_just_duplicidade_alto_risco?: boolean
          exigir_just_interacao_grave?: boolean
          exigir_just_risco_muito_alto?: boolean
          id?: string
          ignorar_alertas_leves_revisao?: boolean
          mostrar_risco_acumulado?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_apenas_revisadas?: boolean
        }
        Update: {
          alertar_duplicidade?: boolean
          bloquear_contraindicada?: boolean
          exigir_just_duplicidade_alto_risco?: boolean
          exigir_just_interacao_grave?: boolean
          exigir_just_risco_muito_alto?: boolean
          id?: string
          ignorar_alertas_leves_revisao?: boolean
          mostrar_risco_acumulado?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_apenas_revisadas?: boolean
        }
        Relationships: []
      }
      iv_calc_settings: {
        Row: {
          bloquear_concentracao_2x: boolean
          exigir_just_tempo: boolean
          exigir_just_velocidade: boolean
          exigir_peso_vasoativos: boolean
          id: string
          permitir_calculo_incompleto: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          bloquear_concentracao_2x?: boolean
          exigir_just_tempo?: boolean
          exigir_just_velocidade?: boolean
          exigir_peso_vasoativos?: boolean
          id?: string
          permitir_calculo_incompleto?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          bloquear_concentracao_2x?: boolean
          exigir_just_tempo?: boolean
          exigir_just_velocidade?: boolean
          exigir_peso_vasoativos?: boolean
          id?: string
          permitir_calculo_incompleto?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      iv_medications: {
        Row: {
          alerta_enfermagem_farmacia: string | null
          alerta_gestacao: Database["public"]["Enums"]["pregnancy_alert_level"]
          alerta_lactacao: Database["public"]["Enums"]["lactation_alert_level"]
          alerta_medico: string | null
          apresentacao: string | null
          ativo_para_correspondencia: boolean
          categoria_controle: string | null
          categoria_risco_gestacional: string | null
          classe_terapeutica: string | null
          codigo_interno_medicamento: string | null
          concentracao_apresentacao: string | null
          concentracao_maxima: string | null
          contraindicado_abaixo_idade: boolean
          contraindicado_acima_idade: boolean
          contraindicado_gestacao: boolean
          contraindicado_hepatico_grave: boolean
          contraindicado_lactacao: boolean
          contraindicado_renal_grave: boolean
          controlado: boolean
          created_at: string
          criado_por: string | null
          data_atualizacao: string
          data_atualizacao_ajuste_renal_hepatico: string | null
          data_atualizacao_dose_pediatrica: string | null
          data_geracao_texto: string | null
          data_revisao: string | null
          data_revisao_texto: string | null
          diluente_reconstituicao: string | null
          dose_maxima_diaria: number | null
          dose_maxima_por_administracao: number | null
          dose_pediatrica_max: number | null
          dose_pediatrica_min: number | null
          equivalencias_nome: Json
          estabilidade_apos_diluicao: string | null
          estabilidade_apos_reconstituicao: string | null
          exige_ajuste_funcao_hepatica: boolean
          exige_ajuste_funcao_renal: boolean
          exige_duas_vias: boolean
          exige_equipo_fotossensivel: boolean
          exige_filtro: boolean
          exige_fotoprotecao: boolean
          exige_justificativa_gestacao: boolean
          exige_justificativa_lactacao: boolean
          exige_receita_especial: boolean
          exige_retencao_receita: boolean
          faixa_dialise: string | null
          faixa_etaria_max: number | null
          faixa_etaria_min: number | null
          faixa_renal_grave: string | null
          faixa_renal_importante: string | null
          faixa_renal_moderada: string | null
          faixa_renal_normal: string | null
          familia_medicamentosa: string | null
          fonte_ajuste_hepatico: string | null
          fonte_ajuste_renal: string | null
          fonte_dose_pediatrica: string | null
          fonte_gestacao: string | null
          fonte_idade: string | null
          fonte_lactacao: string | null
          fonte_reacao_cruzada: string | null
          fonte_referencia: string | null
          fonte_regra_legal: string | null
          fonte_riscos_medicamento: string | null
          forma_farmaceutica: string | null
          grupo_alergia: string | null
          grupo_medicamento: string | null
          grupo_risco: string | null
          id: string
          idade_maxima: number | null
          idade_minima: number | null
          incompatibilidades: string[]
          intervalo_dose_pediatrica: string | null
          mensagem_revisao_seguranca_iv: string | null
          monitorar_creatinina: boolean
          monitorar_nivel_serico: boolean
          monitorar_transaminases: boolean
          nivel_alerta: Database["public"]["Enums"]["alert_level"]
          nome_comercial_referencia: string | null
          nomes_alternativos: string[]
          nomes_comerciais: string[]
          observacao_ajuste_hepatico: string | null
          observacao_ajuste_renal: string | null
          observacao_duplicidade: string | null
          observacao_gestacao: string | null
          observacao_idade: string | null
          observacao_lactacao: string | null
          observacao_legal: string | null
          observacao_pediatrica: string | null
          observacao_reacao_cruzada: string | null
          observacao_revisao: string | null
          observacoes_gerais: string | null
          orientacao_para_impressao: string | null
          orientacao_resumida_prescricao: string | null
          permite_duplicidade_mesma_classe: boolean
          peso_maximo_kg: number | null
          peso_minimo_kg: number | null
          ph: string | null
          principio_ativo: string
          principio_ativo_normalizado: string | null
          restricao_idade: string | null
          revisado_por: string | null
          revisor_ajuste_renal_hepatico: string | null
          revisor_dose_pediatrica: string | null
          risco_acumulo_renal: boolean
          risco_bradicardia: Database["public"]["Enums"]["risk_level"]
          risco_depressao_respiratoria: Database["public"]["Enums"]["risk_level"]
          risco_flebite: boolean
          risco_glicemia: Database["public"]["Enums"]["risk_level"]
          risco_hemorragico: Database["public"]["Enums"]["risk_level"]
          risco_hepatotoxicidade: boolean
          risco_hepatotoxico: Database["public"]["Enums"]["risk_level"]
          risco_hipercalemia: Database["public"]["Enums"]["risk_level"]
          risco_hipocalemia: Database["public"]["Enums"]["risk_level"]
          risco_hipotensao: Database["public"]["Enums"]["risk_level"]
          risco_nefrotoxicidade: boolean
          risco_nefrotoxico: Database["public"]["Enums"]["risk_level"]
          risco_qt: Database["public"]["Enums"]["risk_level"]
          risco_reacao_cruzada: Database["public"]["Enums"]["risk_level"]
          risco_sedacao: Database["public"]["Enums"]["risk_level"]
          risco_serotoninergico: Database["public"]["Enums"]["risk_level"]
          sinonimos: string[]
          solucoes_compativeis: string[]
          status_revisao: Database["public"]["Enums"]["iv_review_status_med"]
          status_revisao_ajuste_renal_hepatico: Database["public"]["Enums"]["iv_renal_hepatic_review_status"]
          status_revisao_dose_pediatrica: Database["public"]["Enums"]["iv_pediatric_review_status"]
          status_revisao_gestacao: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_idade: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_lactacao: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_reacao_cruzada: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_regra_legal: Database["public"]["Enums"]["regra_legal_review_status"]
          status_revisao_riscos: Database["public"]["Enums"]["interaction_review_status"]
          status_texto: Database["public"]["Enums"]["iv_text_status"] | null
          subclasse_terapeutica: string | null
          tempo_minimo_infusao: string | null
          termos_busca: string[]
          texto_gerado_automaticamente: boolean
          texto_revisado_por: string | null
          tipo_receita: Database["public"]["Enums"]["tipo_receita_legal"] | null
          trimestre_relevante: Database["public"]["Enums"]["pregnancy_trimester"]
          unidade_dose_maxima: string | null
          unidade_dose_pediatrica: string | null
          updated_at: string
          uso_neonatal: boolean
          validade_receita_dias: number | null
          velocidade_maxima_infusao: string | null
          via_administracao: string
          volume_diluicao: string | null
          volume_expansao_pos_reconstituicao: string | null
          volume_reconstituicao: string | null
        }
        Insert: {
          alerta_enfermagem_farmacia?: string | null
          alerta_gestacao?: Database["public"]["Enums"]["pregnancy_alert_level"]
          alerta_lactacao?: Database["public"]["Enums"]["lactation_alert_level"]
          alerta_medico?: string | null
          apresentacao?: string | null
          ativo_para_correspondencia?: boolean
          categoria_controle?: string | null
          categoria_risco_gestacional?: string | null
          classe_terapeutica?: string | null
          codigo_interno_medicamento?: string | null
          concentracao_apresentacao?: string | null
          concentracao_maxima?: string | null
          contraindicado_abaixo_idade?: boolean
          contraindicado_acima_idade?: boolean
          contraindicado_gestacao?: boolean
          contraindicado_hepatico_grave?: boolean
          contraindicado_lactacao?: boolean
          contraindicado_renal_grave?: boolean
          controlado?: boolean
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          data_atualizacao_ajuste_renal_hepatico?: string | null
          data_atualizacao_dose_pediatrica?: string | null
          data_geracao_texto?: string | null
          data_revisao?: string | null
          data_revisao_texto?: string | null
          diluente_reconstituicao?: string | null
          dose_maxima_diaria?: number | null
          dose_maxima_por_administracao?: number | null
          dose_pediatrica_max?: number | null
          dose_pediatrica_min?: number | null
          equivalencias_nome?: Json
          estabilidade_apos_diluicao?: string | null
          estabilidade_apos_reconstituicao?: string | null
          exige_ajuste_funcao_hepatica?: boolean
          exige_ajuste_funcao_renal?: boolean
          exige_duas_vias?: boolean
          exige_equipo_fotossensivel?: boolean
          exige_filtro?: boolean
          exige_fotoprotecao?: boolean
          exige_justificativa_gestacao?: boolean
          exige_justificativa_lactacao?: boolean
          exige_receita_especial?: boolean
          exige_retencao_receita?: boolean
          faixa_dialise?: string | null
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          faixa_renal_grave?: string | null
          faixa_renal_importante?: string | null
          faixa_renal_moderada?: string | null
          faixa_renal_normal?: string | null
          familia_medicamentosa?: string | null
          fonte_ajuste_hepatico?: string | null
          fonte_ajuste_renal?: string | null
          fonte_dose_pediatrica?: string | null
          fonte_gestacao?: string | null
          fonte_idade?: string | null
          fonte_lactacao?: string | null
          fonte_reacao_cruzada?: string | null
          fonte_referencia?: string | null
          fonte_regra_legal?: string | null
          fonte_riscos_medicamento?: string | null
          forma_farmaceutica?: string | null
          grupo_alergia?: string | null
          grupo_medicamento?: string | null
          grupo_risco?: string | null
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          incompatibilidades?: string[]
          intervalo_dose_pediatrica?: string | null
          mensagem_revisao_seguranca_iv?: string | null
          monitorar_creatinina?: boolean
          monitorar_nivel_serico?: boolean
          monitorar_transaminases?: boolean
          nivel_alerta?: Database["public"]["Enums"]["alert_level"]
          nome_comercial_referencia?: string | null
          nomes_alternativos?: string[]
          nomes_comerciais?: string[]
          observacao_ajuste_hepatico?: string | null
          observacao_ajuste_renal?: string | null
          observacao_duplicidade?: string | null
          observacao_gestacao?: string | null
          observacao_idade?: string | null
          observacao_lactacao?: string | null
          observacao_legal?: string | null
          observacao_pediatrica?: string | null
          observacao_reacao_cruzada?: string | null
          observacao_revisao?: string | null
          observacoes_gerais?: string | null
          orientacao_para_impressao?: string | null
          orientacao_resumida_prescricao?: string | null
          permite_duplicidade_mesma_classe?: boolean
          peso_maximo_kg?: number | null
          peso_minimo_kg?: number | null
          ph?: string | null
          principio_ativo: string
          principio_ativo_normalizado?: string | null
          restricao_idade?: string | null
          revisado_por?: string | null
          revisor_ajuste_renal_hepatico?: string | null
          revisor_dose_pediatrica?: string | null
          risco_acumulo_renal?: boolean
          risco_bradicardia?: Database["public"]["Enums"]["risk_level"]
          risco_depressao_respiratoria?: Database["public"]["Enums"]["risk_level"]
          risco_flebite?: boolean
          risco_glicemia?: Database["public"]["Enums"]["risk_level"]
          risco_hemorragico?: Database["public"]["Enums"]["risk_level"]
          risco_hepatotoxicidade?: boolean
          risco_hepatotoxico?: Database["public"]["Enums"]["risk_level"]
          risco_hipercalemia?: Database["public"]["Enums"]["risk_level"]
          risco_hipocalemia?: Database["public"]["Enums"]["risk_level"]
          risco_hipotensao?: Database["public"]["Enums"]["risk_level"]
          risco_nefrotoxicidade?: boolean
          risco_nefrotoxico?: Database["public"]["Enums"]["risk_level"]
          risco_qt?: Database["public"]["Enums"]["risk_level"]
          risco_reacao_cruzada?: Database["public"]["Enums"]["risk_level"]
          risco_sedacao?: Database["public"]["Enums"]["risk_level"]
          risco_serotoninergico?: Database["public"]["Enums"]["risk_level"]
          sinonimos?: string[]
          solucoes_compativeis?: string[]
          status_revisao?: Database["public"]["Enums"]["iv_review_status_med"]
          status_revisao_ajuste_renal_hepatico?: Database["public"]["Enums"]["iv_renal_hepatic_review_status"]
          status_revisao_dose_pediatrica?: Database["public"]["Enums"]["iv_pediatric_review_status"]
          status_revisao_gestacao?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_idade?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_lactacao?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_reacao_cruzada?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_regra_legal?: Database["public"]["Enums"]["regra_legal_review_status"]
          status_revisao_riscos?: Database["public"]["Enums"]["interaction_review_status"]
          status_texto?: Database["public"]["Enums"]["iv_text_status"] | null
          subclasse_terapeutica?: string | null
          tempo_minimo_infusao?: string | null
          termos_busca?: string[]
          texto_gerado_automaticamente?: boolean
          texto_revisado_por?: string | null
          tipo_receita?:
            | Database["public"]["Enums"]["tipo_receita_legal"]
            | null
          trimestre_relevante?: Database["public"]["Enums"]["pregnancy_trimester"]
          unidade_dose_maxima?: string | null
          unidade_dose_pediatrica?: string | null
          updated_at?: string
          uso_neonatal?: boolean
          validade_receita_dias?: number | null
          velocidade_maxima_infusao?: string | null
          via_administracao?: string
          volume_diluicao?: string | null
          volume_expansao_pos_reconstituicao?: string | null
          volume_reconstituicao?: string | null
        }
        Update: {
          alerta_enfermagem_farmacia?: string | null
          alerta_gestacao?: Database["public"]["Enums"]["pregnancy_alert_level"]
          alerta_lactacao?: Database["public"]["Enums"]["lactation_alert_level"]
          alerta_medico?: string | null
          apresentacao?: string | null
          ativo_para_correspondencia?: boolean
          categoria_controle?: string | null
          categoria_risco_gestacional?: string | null
          classe_terapeutica?: string | null
          codigo_interno_medicamento?: string | null
          concentracao_apresentacao?: string | null
          concentracao_maxima?: string | null
          contraindicado_abaixo_idade?: boolean
          contraindicado_acima_idade?: boolean
          contraindicado_gestacao?: boolean
          contraindicado_hepatico_grave?: boolean
          contraindicado_lactacao?: boolean
          contraindicado_renal_grave?: boolean
          controlado?: boolean
          created_at?: string
          criado_por?: string | null
          data_atualizacao?: string
          data_atualizacao_ajuste_renal_hepatico?: string | null
          data_atualizacao_dose_pediatrica?: string | null
          data_geracao_texto?: string | null
          data_revisao?: string | null
          data_revisao_texto?: string | null
          diluente_reconstituicao?: string | null
          dose_maxima_diaria?: number | null
          dose_maxima_por_administracao?: number | null
          dose_pediatrica_max?: number | null
          dose_pediatrica_min?: number | null
          equivalencias_nome?: Json
          estabilidade_apos_diluicao?: string | null
          estabilidade_apos_reconstituicao?: string | null
          exige_ajuste_funcao_hepatica?: boolean
          exige_ajuste_funcao_renal?: boolean
          exige_duas_vias?: boolean
          exige_equipo_fotossensivel?: boolean
          exige_filtro?: boolean
          exige_fotoprotecao?: boolean
          exige_justificativa_gestacao?: boolean
          exige_justificativa_lactacao?: boolean
          exige_receita_especial?: boolean
          exige_retencao_receita?: boolean
          faixa_dialise?: string | null
          faixa_etaria_max?: number | null
          faixa_etaria_min?: number | null
          faixa_renal_grave?: string | null
          faixa_renal_importante?: string | null
          faixa_renal_moderada?: string | null
          faixa_renal_normal?: string | null
          familia_medicamentosa?: string | null
          fonte_ajuste_hepatico?: string | null
          fonte_ajuste_renal?: string | null
          fonte_dose_pediatrica?: string | null
          fonte_gestacao?: string | null
          fonte_idade?: string | null
          fonte_lactacao?: string | null
          fonte_reacao_cruzada?: string | null
          fonte_referencia?: string | null
          fonte_regra_legal?: string | null
          fonte_riscos_medicamento?: string | null
          forma_farmaceutica?: string | null
          grupo_alergia?: string | null
          grupo_medicamento?: string | null
          grupo_risco?: string | null
          id?: string
          idade_maxima?: number | null
          idade_minima?: number | null
          incompatibilidades?: string[]
          intervalo_dose_pediatrica?: string | null
          mensagem_revisao_seguranca_iv?: string | null
          monitorar_creatinina?: boolean
          monitorar_nivel_serico?: boolean
          monitorar_transaminases?: boolean
          nivel_alerta?: Database["public"]["Enums"]["alert_level"]
          nome_comercial_referencia?: string | null
          nomes_alternativos?: string[]
          nomes_comerciais?: string[]
          observacao_ajuste_hepatico?: string | null
          observacao_ajuste_renal?: string | null
          observacao_duplicidade?: string | null
          observacao_gestacao?: string | null
          observacao_idade?: string | null
          observacao_lactacao?: string | null
          observacao_legal?: string | null
          observacao_pediatrica?: string | null
          observacao_reacao_cruzada?: string | null
          observacao_revisao?: string | null
          observacoes_gerais?: string | null
          orientacao_para_impressao?: string | null
          orientacao_resumida_prescricao?: string | null
          permite_duplicidade_mesma_classe?: boolean
          peso_maximo_kg?: number | null
          peso_minimo_kg?: number | null
          ph?: string | null
          principio_ativo?: string
          principio_ativo_normalizado?: string | null
          restricao_idade?: string | null
          revisado_por?: string | null
          revisor_ajuste_renal_hepatico?: string | null
          revisor_dose_pediatrica?: string | null
          risco_acumulo_renal?: boolean
          risco_bradicardia?: Database["public"]["Enums"]["risk_level"]
          risco_depressao_respiratoria?: Database["public"]["Enums"]["risk_level"]
          risco_flebite?: boolean
          risco_glicemia?: Database["public"]["Enums"]["risk_level"]
          risco_hemorragico?: Database["public"]["Enums"]["risk_level"]
          risco_hepatotoxicidade?: boolean
          risco_hepatotoxico?: Database["public"]["Enums"]["risk_level"]
          risco_hipercalemia?: Database["public"]["Enums"]["risk_level"]
          risco_hipocalemia?: Database["public"]["Enums"]["risk_level"]
          risco_hipotensao?: Database["public"]["Enums"]["risk_level"]
          risco_nefrotoxicidade?: boolean
          risco_nefrotoxico?: Database["public"]["Enums"]["risk_level"]
          risco_qt?: Database["public"]["Enums"]["risk_level"]
          risco_reacao_cruzada?: Database["public"]["Enums"]["risk_level"]
          risco_sedacao?: Database["public"]["Enums"]["risk_level"]
          risco_serotoninergico?: Database["public"]["Enums"]["risk_level"]
          sinonimos?: string[]
          solucoes_compativeis?: string[]
          status_revisao?: Database["public"]["Enums"]["iv_review_status_med"]
          status_revisao_ajuste_renal_hepatico?: Database["public"]["Enums"]["iv_renal_hepatic_review_status"]
          status_revisao_dose_pediatrica?: Database["public"]["Enums"]["iv_pediatric_review_status"]
          status_revisao_gestacao?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_idade?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_lactacao?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_reacao_cruzada?: Database["public"]["Enums"]["interaction_review_status"]
          status_revisao_regra_legal?: Database["public"]["Enums"]["regra_legal_review_status"]
          status_revisao_riscos?: Database["public"]["Enums"]["interaction_review_status"]
          status_texto?: Database["public"]["Enums"]["iv_text_status"] | null
          subclasse_terapeutica?: string | null
          tempo_minimo_infusao?: string | null
          termos_busca?: string[]
          texto_gerado_automaticamente?: boolean
          texto_revisado_por?: string | null
          tipo_receita?:
            | Database["public"]["Enums"]["tipo_receita_legal"]
            | null
          trimestre_relevante?: Database["public"]["Enums"]["pregnancy_trimester"]
          unidade_dose_maxima?: string | null
          unidade_dose_pediatrica?: string | null
          updated_at?: string
          uso_neonatal?: boolean
          validade_receita_dias?: number | null
          velocidade_maxima_infusao?: string | null
          via_administracao?: string
          volume_diluicao?: string | null
          volume_expansao_pos_reconstituicao?: string | null
          volume_reconstituicao?: string | null
        }
        Relationships: []
      }
      iv_pediatric_settings: {
        Row: {
          alertar_volume_abaixo_05ml: boolean
          bloquear_dose_2x_maxima: boolean
          bloquear_volume_abaixo_01ml: boolean
          exigir_just_dose_acima_faixa: boolean
          exigir_peso_pediatrico: boolean
          id: string
          mostrar_calc_sempre_menor_18: boolean
          permitir_calc_pediatrico_adulto: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alertar_volume_abaixo_05ml?: boolean
          bloquear_dose_2x_maxima?: boolean
          bloquear_volume_abaixo_01ml?: boolean
          exigir_just_dose_acima_faixa?: boolean
          exigir_peso_pediatrico?: boolean
          id?: string
          mostrar_calc_sempre_menor_18?: boolean
          permitir_calc_pediatrico_adulto?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alertar_volume_abaixo_05ml?: boolean
          bloquear_dose_2x_maxima?: boolean
          bloquear_volume_abaixo_01ml?: boolean
          exigir_just_dose_acima_faixa?: boolean
          exigir_peso_pediatrico?: boolean
          id?: string
          mostrar_calc_sempre_menor_18?: boolean
          permitir_calc_pediatrico_adulto?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      iv_renal_hepatic_settings: {
        Row: {
          alertar_creatinina_desatualizada: boolean
          bloquear_contraind_hepatico_grave: boolean
          bloquear_contraind_renal_grave: boolean
          exigir_funcao_renal_alerta_alto: boolean
          exigir_just_clcr_lt30_ajuste_renal: boolean
          exigir_just_nefrotoxico_clcr_lt30: boolean
          id: string
          metodo_renal_padrao: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alertar_creatinina_desatualizada?: boolean
          bloquear_contraind_hepatico_grave?: boolean
          bloquear_contraind_renal_grave?: boolean
          exigir_funcao_renal_alerta_alto?: boolean
          exigir_just_clcr_lt30_ajuste_renal?: boolean
          exigir_just_nefrotoxico_clcr_lt30?: boolean
          id?: string
          metodo_renal_padrao?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alertar_creatinina_desatualizada?: boolean
          bloquear_contraind_hepatico_grave?: boolean
          bloquear_contraind_renal_grave?: boolean
          exigir_funcao_renal_alerta_alto?: boolean
          exigir_just_clcr_lt30_ajuste_renal?: boolean
          exigir_just_nefrotoxico_clcr_lt30?: boolean
          id?: string
          metodo_renal_padrao?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      iv_termos_sugeridos: {
        Row: {
          created_at: string
          data_revisao: string | null
          id: string
          id_medicamento: string | null
          observacao: string | null
          principio_ativo: string
          revisado_por: string | null
          status: Database["public"]["Enums"]["iv_suggested_term_status"]
          termo_normalizado: string | null
          termo_sugerido: string
          ultimo_usuario: string | null
          updated_at: string
          vezes_confirmado: number
        }
        Insert: {
          created_at?: string
          data_revisao?: string | null
          id?: string
          id_medicamento?: string | null
          observacao?: string | null
          principio_ativo: string
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["iv_suggested_term_status"]
          termo_normalizado?: string | null
          termo_sugerido: string
          ultimo_usuario?: string | null
          updated_at?: string
          vezes_confirmado?: number
        }
        Update: {
          created_at?: string
          data_revisao?: string | null
          id?: string
          id_medicamento?: string | null
          observacao?: string | null
          principio_ativo?: string
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["iv_suggested_term_status"]
          termo_normalizado?: string | null
          termo_sugerido?: string
          ultimo_usuario?: string | null
          updated_at?: string
          vezes_confirmado?: number
        }
        Relationships: [
          {
            foreignKeyName: "iv_termos_sugeridos_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "iv_medications"
            referencedColumns: ["id"]
          },
        ]
      }
      kits_rapidos: {
        Row: {
          alertas: string[]
          ativo: boolean
          atualizado_em: string
          categoria: string | null
          contexto: Database["public"]["Enums"]["template_context"]
          criado_em: string
          criado_por: string | null
          fonte: string | null
          id: string
          itens: Json
          nome: string
          status_revisao: Database["public"]["Enums"]["template_review_status"]
          visibilidade: Database["public"]["Enums"]["template_visibility"]
        }
        Insert: {
          alertas?: string[]
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          contexto?: Database["public"]["Enums"]["template_context"]
          criado_em?: string
          criado_por?: string | null
          fonte?: string | null
          id?: string
          itens?: Json
          nome: string
          status_revisao?: Database["public"]["Enums"]["template_review_status"]
          visibilidade?: Database["public"]["Enums"]["template_visibility"]
        }
        Update: {
          alertas?: string[]
          ativo?: boolean
          atualizado_em?: string
          categoria?: string | null
          contexto?: Database["public"]["Enums"]["template_context"]
          criado_em?: string
          criado_por?: string | null
          fonte?: string | null
          id?: string
          itens?: Json
          nome?: string
          status_revisao?: Database["public"]["Enums"]["template_review_status"]
          visibilidade?: Database["public"]["Enums"]["template_visibility"]
        }
        Relationships: []
      }
      lancamento_bugs_conhecidos: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string | null
          gravidade: string
          id: string
          modulo_afetado: string | null
          previsao: string | null
          solucao_temporaria: string | null
          status: string
          titulo: string
          versao_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          gravidade?: string
          id?: string
          modulo_afetado?: string | null
          previsao?: string | null
          solucao_temporaria?: string | null
          status?: string
          titulo: string
          versao_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          gravidade?: string
          id?: string
          modulo_afetado?: string | null
          previsao?: string | null
          solucao_temporaria?: string | null
          status?: string
          titulo?: string
          versao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lancamento_bugs_conhecidos_versao_id_fkey"
            columns: ["versao_id"]
            isOneToOne: false
            referencedRelation: "lancamento_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamento_checklist: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          bloqueante: boolean
          criado_em: string
          criticidade: string
          descricao: string | null
          id: string
          observacao: string | null
          ordem: number
          responsavel: string | null
          secao: string
          status: string
          titulo: string
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          bloqueante?: boolean
          criado_em?: string
          criticidade?: string
          descricao?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          responsavel?: string | null
          secao: string
          status?: string
          titulo: string
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          bloqueante?: boolean
          criado_em?: string
          criticidade?: string
          descricao?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          responsavel?: string | null
          secao?: string
          status?: string
          titulo?: string
        }
        Relationships: []
      }
      lancamento_feedback: {
        Row: {
          anexo_url: string | null
          atualizado_em: string
          criado_em: string
          dados_tecnicos: Json | null
          descricao: string
          gravidade: string
          id: string
          status: string
          tela: string | null
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          anexo_url?: string | null
          atualizado_em?: string
          criado_em?: string
          dados_tecnicos?: Json | null
          descricao: string
          gravidade?: string
          id?: string
          status?: string
          tela?: string | null
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          anexo_url?: string | null
          atualizado_em?: string
          criado_em?: string
          dados_tecnicos?: Json | null
          descricao?: string
          gravidade?: string
          id?: string
          status?: string
          tela?: string | null
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      lancamento_feedback_medicamento: {
        Row: {
          atualizado_em: string
          criado_em: string
          descricao: string | null
          gravidade: string
          id: string
          medicamento_nome: string | null
          medicamento_ref: string | null
          motivo: string
          status: string
          usuario_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          gravidade?: string
          id?: string
          medicamento_nome?: string | null
          medicamento_ref?: string | null
          motivo: string
          status?: string
          usuario_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          gravidade?: string
          id?: string
          medicamento_nome?: string | null
          medicamento_ref?: string | null
          motivo?: string
          status?: string
          usuario_id?: string | null
        }
        Relationships: []
      }
      lancamento_log: {
        Row: {
          acao: string
          data_hora: string
          id: string
          motivo: string | null
          observacao: string | null
          status_anterior: string | null
          status_novo: string | null
          usuario_responsavel: string | null
          versao_beta: string | null
        }
        Insert: {
          acao: string
          data_hora?: string
          id?: string
          motivo?: string | null
          observacao?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          usuario_responsavel?: string | null
          versao_beta?: string | null
        }
        Update: {
          acao?: string
          data_hora?: string
          id?: string
          motivo?: string | null
          observacao?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          usuario_responsavel?: string | null
          versao_beta?: string | null
        }
        Relationships: []
      }
      lancamento_metas: {
        Row: {
          ativa: boolean
          atualizado_em: string
          criado_em: string
          descricao: string
          id: string
          meta_valor: string | null
          ordem: number
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao: string
          id?: string
          meta_valor?: string | null
          ordem?: number
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          criado_em?: string
          descricao?: string
          id?: string
          meta_valor?: string | null
          ordem?: number
        }
        Relationships: []
      }
      lancamento_termos_aceites: {
        Row: {
          aceito_em: string
          id: string
          usuario_id: string
          versao_termo: string
        }
        Insert: {
          aceito_em?: string
          id?: string
          usuario_id: string
          versao_termo: string
        }
        Update: {
          aceito_em?: string
          id?: string
          usuario_id?: string
          versao_termo?: string
        }
        Relationships: []
      }
      lancamento_termos_beta: {
        Row: {
          ativo: boolean
          atualizado_em: string
          conteudo: string
          criado_em: string
          id: string
          versao_termo: string
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          conteudo: string
          criado_em?: string
          id?: string
          versao_termo: string
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          conteudo?: string
          criado_em?: string
          id?: string
          versao_termo?: string
        }
        Relationships: []
      }
      lancamento_testadores: {
        Row: {
          atualizado_em: string
          criado_em: string
          data_inicio: string | null
          email: string
          feedbacks_enviados: number
          id: string
          local_contexto: string | null
          nome: string
          observacoes: string | null
          perfil_uso: string | null
          prescricoes_feitas: number
          problemas_criticos: number
          status_convite: string
          status_testador: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data_inicio?: string | null
          email: string
          feedbacks_enviados?: number
          id?: string
          local_contexto?: string | null
          nome: string
          observacoes?: string | null
          perfil_uso?: string | null
          prescricoes_feitas?: number
          problemas_criticos?: number
          status_convite?: string
          status_testador?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data_inicio?: string | null
          email?: string
          feedbacks_enviados?: number
          id?: string
          local_contexto?: string | null
          nome?: string
          observacoes?: string | null
          perfil_uso?: string | null
          prescricoes_feitas?: number
          problemas_criticos?: number
          status_convite?: string
          status_testador?: string
        }
        Relationships: []
      }
      lancamento_versoes: {
        Row: {
          atualizado_em: string
          changelog: string | null
          correcoes: string | null
          criado_em: string
          data_lancamento: string | null
          id: string
          liberado_por: string | null
          melhorias: string | null
          observacoes: string | null
          pendencias_conhecidas: string | null
          status_versao: string
          versao: string
        }
        Insert: {
          atualizado_em?: string
          changelog?: string | null
          correcoes?: string | null
          criado_em?: string
          data_lancamento?: string | null
          id?: string
          liberado_por?: string | null
          melhorias?: string | null
          observacoes?: string | null
          pendencias_conhecidas?: string | null
          status_versao?: string
          versao: string
        }
        Update: {
          atualizado_em?: string
          changelog?: string | null
          correcoes?: string | null
          criado_em?: string
          data_lancamento?: string | null
          id?: string
          liberado_por?: string | null
          melhorias?: string | null
          observacoes?: string | null
          pendencias_conhecidas?: string | null
          status_versao?: string
          versao?: string
        }
        Relationships: []
      }
      lgpd_consentimentos: {
        Row: {
          aceito: boolean
          criado_em: string
          documento: string
          id: string
          ip: string | null
          user_id: string
          versao: string
        }
        Insert: {
          aceito?: boolean
          criado_em?: string
          documento: string
          id?: string
          ip?: string | null
          user_id: string
          versao: string
        }
        Update: {
          aceito?: boolean
          criado_em?: string
          documento?: string
          id?: string
          ip?: string | null
          user_id?: string
          versao?: string
        }
        Relationships: []
      }
      lgpd_politicas_retencao: {
        Row: {
          anonimizar_ao_expirar: boolean
          atualizado_em: string
          base_legal: string
          criado_em: string
          descricao: string
          id: string
          meses_retencao: number
          modulo: string
        }
        Insert: {
          anonimizar_ao_expirar?: boolean
          atualizado_em?: string
          base_legal: string
          criado_em?: string
          descricao: string
          id?: string
          meses_retencao: number
          modulo: string
        }
        Update: {
          anonimizar_ao_expirar?: boolean
          atualizado_em?: string
          base_legal?: string
          criado_em?: string
          descricao?: string
          id?: string
          meses_retencao?: number
          modulo?: string
        }
        Relationships: []
      }
      lgpd_solicitacoes: {
        Row: {
          atualizado_em: string
          concluido_em: string | null
          criado_em: string
          descricao: string | null
          id: string
          prazo_legal: string
          resposta: string | null
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          concluido_em?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          prazo_legal?: string
          resposta?: string | null
          status?: string
          tipo: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          concluido_em?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          prazo_legal?: string
          resposta?: string | null
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      library_descobertas: {
        Row: {
          ambientes: string[]
          consulta: string | null
          created_at: string
          criado_por: string | null
          descricao: string | null
          especialidade: string | null
          gravidade: string | null
          id: string
          kind: string
          nome: string
          patologias: string[]
          referencia: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          ambientes?: string[]
          consulta?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          especialidade?: string | null
          gravidade?: string | null
          id?: string
          kind: string
          nome: string
          patologias?: string[]
          referencia?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          ambientes?: string[]
          consulta?: string | null
          created_at?: string
          criado_por?: string | null
          descricao?: string | null
          especialidade?: string | null
          gravidade?: string | null
          id?: string
          kind?: string
          nome?: string
          patologias?: string[]
          referencia?: string | null
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      link_acessos_log: {
        Row: {
          acessado_em: string
          id: string
          id_link: string
          ip: string | null
          user_agent: string | null
        }
        Insert: {
          acessado_em?: string
          id?: string
          id_link: string
          ip?: string | null
          user_agent?: string | null
        }
        Update: {
          acessado_em?: string
          id?: string
          id_link?: string
          ip?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      log_alertas_alergias_condicoes: {
        Row: {
          acao_usuario:
            | Database["public"]["Enums"]["clinical_alert_action"]
            | null
          condicao_relacionada: string | null
          data_hora: string
          gravidade: Database["public"]["Enums"]["interaction_severity"] | null
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          justificativa: string | null
          medicamento_prescrito: string | null
          mensagem_alerta: string
          nivel_alerta:
            | Database["public"]["Enums"]["interaction_alert_level"]
            | null
          principio_ativo: string | null
          tipo_alerta: Database["public"]["Enums"]["clinical_alert_kind"]
          usuario_responsavel: string
        }
        Insert: {
          acao_usuario?:
            | Database["public"]["Enums"]["clinical_alert_action"]
            | null
          condicao_relacionada?: string | null
          data_hora?: string
          gravidade?: Database["public"]["Enums"]["interaction_severity"] | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          medicamento_prescrito?: string | null
          mensagem_alerta: string
          nivel_alerta?:
            | Database["public"]["Enums"]["interaction_alert_level"]
            | null
          principio_ativo?: string | null
          tipo_alerta: Database["public"]["Enums"]["clinical_alert_kind"]
          usuario_responsavel: string
        }
        Update: {
          acao_usuario?:
            | Database["public"]["Enums"]["clinical_alert_action"]
            | null
          condicao_relacionada?: string | null
          data_hora?: string
          gravidade?: Database["public"]["Enums"]["interaction_severity"] | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          medicamento_prescrito?: string | null
          mensagem_alerta?: string
          nivel_alerta?:
            | Database["public"]["Enums"]["interaction_alert_level"]
            | null
          principio_ativo?: string | null
          tipo_alerta?: Database["public"]["Enums"]["clinical_alert_kind"]
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_alertas_renal_hepatico: {
        Row: {
          acao_usuario: string | null
          classificacao_funcao_renal: string | null
          clcr_estimado: number | null
          creatinina_serica: number | null
          dados_hepaticos_disponiveis: Json
          data_hora: string
          etfg_informada: number | null
          gravidade: Database["public"]["Enums"]["alert_level"]
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          justificativa: string | null
          mensagem_alerta: string
          metodo_calculo_renal: string | null
          principio_ativo: string
          tipo_alerta: string
          unidade_creatinina: string | null
          usuario_responsavel: string
        }
        Insert: {
          acao_usuario?: string | null
          classificacao_funcao_renal?: string | null
          clcr_estimado?: number | null
          creatinina_serica?: number | null
          dados_hepaticos_disponiveis?: Json
          data_hora?: string
          etfg_informada?: number | null
          gravidade: Database["public"]["Enums"]["alert_level"]
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          mensagem_alerta: string
          metodo_calculo_renal?: string | null
          principio_ativo: string
          tipo_alerta: string
          unidade_creatinina?: string | null
          usuario_responsavel: string
        }
        Update: {
          acao_usuario?: string | null
          classificacao_funcao_renal?: string | null
          clcr_estimado?: number | null
          creatinina_serica?: number | null
          dados_hepaticos_disponiveis?: Json
          data_hora?: string
          etfg_informada?: number | null
          gravidade?: Database["public"]["Enums"]["alert_level"]
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          mensagem_alerta?: string
          metodo_calculo_renal?: string | null
          principio_ativo?: string
          tipo_alerta?: string
          unidade_creatinina?: string | null
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_base_diluicao_iv: {
        Row: {
          campo_alterado: string | null
          data_hora: string
          id: string
          id_medicamento: string | null
          principio_ativo: string
          tipo_acao: Database["public"]["Enums"]["iv_log_action"]
          usuario_responsavel: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado?: string | null
          data_hora?: string
          id?: string
          id_medicamento?: string | null
          principio_ativo: string
          tipo_acao: Database["public"]["Enums"]["iv_log_action"]
          usuario_responsavel: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string | null
          data_hora?: string
          id?: string
          id_medicamento?: string | null
          principio_ativo?: string
          tipo_acao?: Database["public"]["Enums"]["iv_log_action"]
          usuario_responsavel?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      log_calculos_iv: {
        Row: {
          alertas_gerados: Json
          concentracao_calculada: number | null
          concentracao_maxima: number | null
          data_hora: string
          dose_convertida: number | null
          dose_original: number | null
          evento: string | null
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          peso_paciente_kg: number | null
          principio_ativo: string
          status_calculo: Database["public"]["Enums"]["iv_calc_status"]
          tempo_infusao: number | null
          unidade_dose_original: string | null
          usuario_responsavel: string
          velocidade_calculada_mg_min: number | null
          velocidade_calculada_ml_h: number | null
          velocidade_maxima: number | null
          volume_diluicao: number | null
        }
        Insert: {
          alertas_gerados?: Json
          concentracao_calculada?: number | null
          concentracao_maxima?: number | null
          data_hora?: string
          dose_convertida?: number | null
          dose_original?: number | null
          evento?: string | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          peso_paciente_kg?: number | null
          principio_ativo: string
          status_calculo: Database["public"]["Enums"]["iv_calc_status"]
          tempo_infusao?: number | null
          unidade_dose_original?: string | null
          usuario_responsavel: string
          velocidade_calculada_mg_min?: number | null
          velocidade_calculada_ml_h?: number | null
          velocidade_maxima?: number | null
          volume_diluicao?: number | null
        }
        Update: {
          alertas_gerados?: Json
          concentracao_calculada?: number | null
          concentracao_maxima?: number | null
          data_hora?: string
          dose_convertida?: number | null
          dose_original?: number | null
          evento?: string | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          peso_paciente_kg?: number | null
          principio_ativo?: string
          status_calculo?: Database["public"]["Enums"]["iv_calc_status"]
          tempo_infusao?: number | null
          unidade_dose_original?: string | null
          usuario_responsavel?: string
          velocidade_calculada_mg_min?: number | null
          velocidade_calculada_ml_h?: number | null
          velocidade_maxima?: number | null
          volume_diluicao?: number | null
        }
        Relationships: []
      }
      log_calculos_pediatricos: {
        Row: {
          alertas_gerados: Json
          data_hora: string
          dose_diaria_calculada: number | null
          dose_maxima_calculada: number | null
          dose_maxima_diaria: number | null
          dose_mg_kg_calculada: number | null
          dose_minima_calculada: number | null
          dose_prescrita: number | null
          evento: string | null
          frequencia: string | null
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          idade_anos: number | null
          idade_meses: number | null
          justificativa: string | null
          peso_kg: number | null
          principio_ativo: string
          status_calculo: Database["public"]["Enums"]["iv_calc_status"]
          unidade_dose: string | null
          usuario_responsavel: string
        }
        Insert: {
          alertas_gerados?: Json
          data_hora?: string
          dose_diaria_calculada?: number | null
          dose_maxima_calculada?: number | null
          dose_maxima_diaria?: number | null
          dose_mg_kg_calculada?: number | null
          dose_minima_calculada?: number | null
          dose_prescrita?: number | null
          evento?: string | null
          frequencia?: string | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          idade_anos?: number | null
          idade_meses?: number | null
          justificativa?: string | null
          peso_kg?: number | null
          principio_ativo: string
          status_calculo: Database["public"]["Enums"]["iv_calc_status"]
          unidade_dose?: string | null
          usuario_responsavel: string
        }
        Update: {
          alertas_gerados?: Json
          data_hora?: string
          dose_diaria_calculada?: number | null
          dose_maxima_calculada?: number | null
          dose_maxima_diaria?: number | null
          dose_mg_kg_calculada?: number | null
          dose_minima_calculada?: number | null
          dose_prescrita?: number | null
          evento?: string | null
          frequencia?: string | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          idade_anos?: number | null
          idade_meses?: number | null
          justificativa?: string | null
          peso_kg?: number | null
          principio_ativo?: string
          status_calculo?: Database["public"]["Enums"]["iv_calc_status"]
          unidade_dose?: string | null
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_correspondencia_medicamentos_iv: {
        Row: {
          acao_usuario: Database["public"]["Enums"]["iv_match_action"]
          data_hora: string
          id: string
          id_base_diluicao_iv: string | null
          id_medicamento_prescrito: string | null
          id_prescricao: string | null
          medicamento_correspondente: string | null
          score_confianca: number
          texto_digitado: string
          texto_normalizado: string | null
          tipo_correspondencia: Database["public"]["Enums"]["iv_match_type"]
          usuario_responsavel: string
        }
        Insert: {
          acao_usuario: Database["public"]["Enums"]["iv_match_action"]
          data_hora?: string
          id?: string
          id_base_diluicao_iv?: string | null
          id_medicamento_prescrito?: string | null
          id_prescricao?: string | null
          medicamento_correspondente?: string | null
          score_confianca?: number
          texto_digitado: string
          texto_normalizado?: string | null
          tipo_correspondencia: Database["public"]["Enums"]["iv_match_type"]
          usuario_responsavel: string
        }
        Update: {
          acao_usuario?: Database["public"]["Enums"]["iv_match_action"]
          data_hora?: string
          id?: string
          id_base_diluicao_iv?: string | null
          id_medicamento_prescrito?: string | null
          id_prescricao?: string | null
          medicamento_correspondente?: string | null
          score_confianca?: number
          texto_digitado?: string
          texto_normalizado?: string | null
          tipo_correspondencia?: Database["public"]["Enums"]["iv_match_type"]
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_documentos_clinicos: {
        Row: {
          acao: Database["public"]["Enums"]["documento_acao_log"]
          data_hora: string
          destino_envio: string | null
          id: string
          id_atendimento: string | null
          id_documento: string | null
          id_paciente: string | null
          motivo_cancelamento: string | null
          tipo_documento: Database["public"]["Enums"]["documento_tipo"] | null
          usuario_responsavel: string
        }
        Insert: {
          acao: Database["public"]["Enums"]["documento_acao_log"]
          data_hora?: string
          destino_envio?: string | null
          id?: string
          id_atendimento?: string | null
          id_documento?: string | null
          id_paciente?: string | null
          motivo_cancelamento?: string | null
          tipo_documento?: Database["public"]["Enums"]["documento_tipo"] | null
          usuario_responsavel: string
        }
        Update: {
          acao?: Database["public"]["Enums"]["documento_acao_log"]
          data_hora?: string
          destino_envio?: string | null
          id?: string
          id_atendimento?: string | null
          id_documento?: string | null
          id_paciente?: string | null
          motivo_cancelamento?: string | null
          tipo_documento?: Database["public"]["Enums"]["documento_tipo"] | null
          usuario_responsavel?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_documentos_clinicos_id_documento_fkey"
            columns: ["id_documento"]
            isOneToOne: false
            referencedRelation: "documentos_gerados"
            referencedColumns: ["id"]
          },
        ]
      }
      log_edicoes_itens_ia: {
        Row: {
          campo_editado: string
          data_hora: string
          id: string
          id_entrada: string | null
          texto_original_item: string | null
          tipo_item: Database["public"]["Enums"]["entrada_item_tipo"]
          usuario_responsavel: string
          valor_extraido_ia: string | null
          valor_final_usuario: string | null
        }
        Insert: {
          campo_editado: string
          data_hora?: string
          id?: string
          id_entrada?: string | null
          texto_original_item?: string | null
          tipo_item: Database["public"]["Enums"]["entrada_item_tipo"]
          usuario_responsavel: string
          valor_extraido_ia?: string | null
          valor_final_usuario?: string | null
        }
        Update: {
          campo_editado?: string
          data_hora?: string
          id?: string
          id_entrada?: string | null
          texto_original_item?: string | null
          tipo_item?: Database["public"]["Enums"]["entrada_item_tipo"]
          usuario_responsavel?: string
          valor_extraido_ia?: string | null
          valor_final_usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_edicoes_itens_ia_id_entrada_fkey"
            columns: ["id_entrada"]
            isOneToOne: false
            referencedRelation: "log_entrada_inteligente"
            referencedColumns: ["id"]
          },
        ]
      }
      log_entrada_inteligente: {
        Row: {
          alertas_gerados: Json
          campos_ambiguos: Json
          campos_incompletos: Json
          confianca_geral: number | null
          data_hora: string
          id: string
          id_atendimento: string | null
          id_paciente: string | null
          itens_adicionados: Json
          itens_descartados: Json
          itens_editados: Json
          itens_identificados: Json
          origem: Database["public"]["Enums"]["entrada_origem"]
          status_final: Database["public"]["Enums"]["entrada_status_final"]
          texto_original: string | null
          texto_transcrito_ou_extraido: string | null
          tipo_entrada: Database["public"]["Enums"]["entrada_tipo"]
          usuario_responsavel: string
        }
        Insert: {
          alertas_gerados?: Json
          campos_ambiguos?: Json
          campos_incompletos?: Json
          confianca_geral?: number | null
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_paciente?: string | null
          itens_adicionados?: Json
          itens_descartados?: Json
          itens_editados?: Json
          itens_identificados?: Json
          origem?: Database["public"]["Enums"]["entrada_origem"]
          status_final?: Database["public"]["Enums"]["entrada_status_final"]
          texto_original?: string | null
          texto_transcrito_ou_extraido?: string | null
          tipo_entrada: Database["public"]["Enums"]["entrada_tipo"]
          usuario_responsavel: string
        }
        Update: {
          alertas_gerados?: Json
          campos_ambiguos?: Json
          campos_incompletos?: Json
          confianca_geral?: number | null
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_paciente?: string | null
          itens_adicionados?: Json
          itens_descartados?: Json
          itens_editados?: Json
          itens_identificados?: Json
          origem?: Database["public"]["Enums"]["entrada_origem"]
          status_final?: Database["public"]["Enums"]["entrada_status_final"]
          texto_original?: string | null
          texto_transcrito_ou_extraido?: string | null
          tipo_entrada?: Database["public"]["Enums"]["entrada_tipo"]
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_importacao_medicamentos: {
        Row: {
          aba: string
          acao_realizada: string | null
          campo: string | null
          data_hora: string
          gravidade: string
          id: string
          id_importacao: string
          linha: number | null
          mensagem: string | null
          principio_ativo: string | null
          tipo_registro: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          aba: string
          acao_realizada?: string | null
          campo?: string | null
          data_hora?: string
          gravidade?: string
          id?: string
          id_importacao: string
          linha?: number | null
          mensagem?: string | null
          principio_ativo?: string | null
          tipo_registro?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          aba?: string
          acao_realizada?: string | null
          campo?: string | null
          data_hora?: string
          gravidade?: string
          id?: string
          id_importacao?: string
          linha?: number | null
          mensagem?: string | null
          principio_ativo?: string | null
          tipo_registro?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_importacao_medicamentos_id_importacao_fkey"
            columns: ["id_importacao"]
            isOneToOne: false
            referencedRelation: "historico_importacao_medicamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      log_interacoes_prescricao: {
        Row: {
          acao_usuario:
            | Database["public"]["Enums"]["interaction_alert_action"]
            | null
          data_hora: string
          gravidade: Database["public"]["Enums"]["interaction_severity"] | null
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          justificativa: string | null
          medicamentos_envolvidos: Json
          mensagem_alerta: string
          nivel_alerta:
            | Database["public"]["Enums"]["interaction_alert_level"]
            | null
          principios_ativos_envolvidos: Json
          tipo_alerta: Database["public"]["Enums"]["interaction_alert_kind"]
          tipo_interacao: Database["public"]["Enums"]["interaction_type"] | null
          usuario_responsavel: string
        }
        Insert: {
          acao_usuario?:
            | Database["public"]["Enums"]["interaction_alert_action"]
            | null
          data_hora?: string
          gravidade?: Database["public"]["Enums"]["interaction_severity"] | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          medicamentos_envolvidos?: Json
          mensagem_alerta: string
          nivel_alerta?:
            | Database["public"]["Enums"]["interaction_alert_level"]
            | null
          principios_ativos_envolvidos?: Json
          tipo_alerta: Database["public"]["Enums"]["interaction_alert_kind"]
          tipo_interacao?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          usuario_responsavel: string
        }
        Update: {
          acao_usuario?:
            | Database["public"]["Enums"]["interaction_alert_action"]
            | null
          data_hora?: string
          gravidade?: Database["public"]["Enums"]["interaction_severity"] | null
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          justificativa?: string | null
          medicamentos_envolvidos?: Json
          mensagem_alerta?: string
          nivel_alerta?:
            | Database["public"]["Enums"]["interaction_alert_level"]
            | null
          principios_ativos_envolvidos?: Json
          tipo_alerta?: Database["public"]["Enums"]["interaction_alert_kind"]
          tipo_interacao?:
            | Database["public"]["Enums"]["interaction_type"]
            | null
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_qualidade_base_medicamentosa: {
        Row: {
          acao: string
          created_at: string
          gravidade: string
          id: string
          justificativa: string | null
          medicamento_id: string | null
          mensagem: string | null
          metadata: Json
          principio_ativo: string | null
          rule_code: string
          tipo_problema: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          gravidade: string
          id?: string
          justificativa?: string | null
          medicamento_id?: string | null
          mensagem?: string | null
          metadata?: Json
          principio_ativo?: string | null
          rule_code: string
          tipo_problema?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          gravidade?: string
          id?: string
          justificativa?: string | null
          medicamento_id?: string | null
          mensagem?: string | null
          metadata?: Json
          principio_ativo?: string | null
          rule_code?: string
          tipo_problema?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_qualidade_base_medicamentosa_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_qualidade_base_medicamentosa_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_qualidade_base_medicamentosa_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_qualidade_base_medicamentosa_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      log_reaproveitamento_prescricao: {
        Row: {
          acao: Database["public"]["Enums"]["reaproveitamento_acao"]
          alertas_gerados: Json
          comparacoes_relevantes: Json
          data_hora: string
          data_prescricao_origem: string | null
          id: string
          id_atendimento_atual: string | null
          id_paciente: string
          id_prescricao_origem: string | null
          itens_editados: Json
          itens_reaproveitados: Json
          itens_removidos: Json
          itens_visualizados: Json
          justificativas: Json
          usuario_responsavel: string
        }
        Insert: {
          acao: Database["public"]["Enums"]["reaproveitamento_acao"]
          alertas_gerados?: Json
          comparacoes_relevantes?: Json
          data_hora?: string
          data_prescricao_origem?: string | null
          id?: string
          id_atendimento_atual?: string | null
          id_paciente: string
          id_prescricao_origem?: string | null
          itens_editados?: Json
          itens_reaproveitados?: Json
          itens_removidos?: Json
          itens_visualizados?: Json
          justificativas?: Json
          usuario_responsavel: string
        }
        Update: {
          acao?: Database["public"]["Enums"]["reaproveitamento_acao"]
          alertas_gerados?: Json
          comparacoes_relevantes?: Json
          data_hora?: string
          data_prescricao_origem?: string | null
          id?: string
          id_atendimento_atual?: string | null
          id_paciente?: string
          id_prescricao_origem?: string | null
          itens_editados?: Json
          itens_reaproveitados?: Json
          itens_removidos?: Json
          itens_visualizados?: Json
          justificativas?: Json
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_testes_clinicos: {
        Row: {
          acao: string
          categoria_teste: string | null
          codigo_teste: string | null
          data_hora: string
          id: string
          nome_teste: string | null
          observacao: string | null
          resultado_esperado: string | null
          resultado_obtido: string | null
          status_anterior: string | null
          status_novo: string | null
          teste_id: string | null
          usuario_responsavel: string | null
        }
        Insert: {
          acao: string
          categoria_teste?: string | null
          codigo_teste?: string | null
          data_hora?: string
          id?: string
          nome_teste?: string | null
          observacao?: string | null
          resultado_esperado?: string | null
          resultado_obtido?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          teste_id?: string | null
          usuario_responsavel?: string | null
        }
        Update: {
          acao?: string
          categoria_teste?: string | null
          codigo_teste?: string | null
          data_hora?: string
          id?: string
          nome_teste?: string | null
          observacao?: string | null
          resultado_esperado?: string | null
          resultado_obtido?: string | null
          status_anterior?: string | null
          status_novo?: string | null
          teste_id?: string | null
          usuario_responsavel?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_testes_clinicos_teste_id_fkey"
            columns: ["teste_id"]
            isOneToOne: false
            referencedRelation: "testes_clinicos_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      log_textos_diluicao_iv: {
        Row: {
          campo_texto_alterado: string
          data_hora: string
          id: string
          id_medicamento: string | null
          principio_ativo: string
          tipo_acao: Database["public"]["Enums"]["iv_text_action"]
          usuario_responsavel: string
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_texto_alterado: string
          data_hora?: string
          id?: string
          id_medicamento?: string | null
          principio_ativo: string
          tipo_acao: Database["public"]["Enums"]["iv_text_action"]
          usuario_responsavel: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_texto_alterado?: string
          data_hora?: string
          id?: string
          id_medicamento?: string | null
          principio_ativo?: string
          tipo_acao?: Database["public"]["Enums"]["iv_text_action"]
          usuario_responsavel?: string
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: []
      }
      log_uso_modelos_prescricao: {
        Row: {
          acao: Database["public"]["Enums"]["template_log_action"]
          alertas_gerados: Json
          data_hora: string
          id: string
          id_atendimento: string | null
          id_modelo: string | null
          id_paciente: string | null
          itens_adicionados: Json
          itens_editados: Json
          itens_removidos: Json
          itens_visualizados: Json
          justificativas: Json
          nome_modelo: string | null
          tipo_modelo: Database["public"]["Enums"]["template_type"] | null
          usuario_responsavel: string
          versao_modelo: number | null
        }
        Insert: {
          acao: Database["public"]["Enums"]["template_log_action"]
          alertas_gerados?: Json
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_modelo?: string | null
          id_paciente?: string | null
          itens_adicionados?: Json
          itens_editados?: Json
          itens_removidos?: Json
          itens_visualizados?: Json
          justificativas?: Json
          nome_modelo?: string | null
          tipo_modelo?: Database["public"]["Enums"]["template_type"] | null
          usuario_responsavel: string
          versao_modelo?: number | null
        }
        Update: {
          acao?: Database["public"]["Enums"]["template_log_action"]
          alertas_gerados?: Json
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_modelo?: string | null
          id_paciente?: string | null
          itens_adicionados?: Json
          itens_editados?: Json
          itens_removidos?: Json
          itens_visualizados?: Json
          justificativas?: Json
          nome_modelo?: string | null
          tipo_modelo?: Database["public"]["Enums"]["template_type"] | null
          usuario_responsavel?: string
          versao_modelo?: number | null
        }
        Relationships: []
      }
      log_uso_protocolos: {
        Row: {
          acao: Database["public"]["Enums"]["protocol_log_action"]
          alertas_gerados: Json
          contexto_atendimento:
            | Database["public"]["Enums"]["protocol_context"]
            | null
          data_hora: string
          id: string
          id_atendimento: string | null
          id_paciente: string | null
          id_protocolo: string | null
          itens_adicionados: Json
          itens_editados: Json
          itens_ignorados: Json
          itens_visualizados: Json
          justificativas: Json
          nome_protocolo: string | null
          usuario_responsavel: string
          versao_protocolo: number | null
        }
        Insert: {
          acao: Database["public"]["Enums"]["protocol_log_action"]
          alertas_gerados?: Json
          contexto_atendimento?:
            | Database["public"]["Enums"]["protocol_context"]
            | null
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_paciente?: string | null
          id_protocolo?: string | null
          itens_adicionados?: Json
          itens_editados?: Json
          itens_ignorados?: Json
          itens_visualizados?: Json
          justificativas?: Json
          nome_protocolo?: string | null
          usuario_responsavel: string
          versao_protocolo?: number | null
        }
        Update: {
          acao?: Database["public"]["Enums"]["protocol_log_action"]
          alertas_gerados?: Json
          contexto_atendimento?:
            | Database["public"]["Enums"]["protocol_context"]
            | null
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_paciente?: string | null
          id_protocolo?: string | null
          itens_adicionados?: Json
          itens_editados?: Json
          itens_ignorados?: Json
          itens_visualizados?: Json
          justificativas?: Json
          nome_protocolo?: string | null
          usuario_responsavel?: string
          versao_protocolo?: number | null
        }
        Relationships: []
      }
      log_visualizacao_historico_paciente: {
        Row: {
          data_hora: string
          id: string
          id_atendimento: string | null
          id_paciente: string
          item_visualizado: string | null
          tipo_historico_visualizado: Database["public"]["Enums"]["historico_tipo_visualizado"]
          usuario_responsavel: string
        }
        Insert: {
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_paciente: string
          item_visualizado?: string | null
          tipo_historico_visualizado: Database["public"]["Enums"]["historico_tipo_visualizado"]
          usuario_responsavel: string
        }
        Update: {
          data_hora?: string
          id?: string
          id_atendimento?: string | null
          id_paciente?: string
          item_visualizado?: string | null
          tipo_historico_visualizado?: Database["public"]["Enums"]["historico_tipo_visualizado"]
          usuario_responsavel?: string
        }
        Relationships: []
      }
      log_visualizacao_orientacoes_iv: {
        Row: {
          acao_realizada: string
          data_hora: string
          id: string
          id_paciente: string | null
          id_prescricao: string | null
          perfil_usuario: string | null
          principio_ativo: string
          tipo_visualizacao: string
          usuario_responsavel: string
        }
        Insert: {
          acao_realizada: string
          data_hora?: string
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          perfil_usuario?: string | null
          principio_ativo: string
          tipo_visualizacao: string
          usuario_responsavel: string
        }
        Update: {
          acao_realizada?: string
          data_hora?: string
          id?: string
          id_paciente?: string | null
          id_prescricao?: string | null
          perfil_usuario?: string | null
          principio_ativo?: string
          tipo_visualizacao?: string
          usuario_responsavel?: string
        }
        Relationships: []
      }
      medicacoes_uso_continuo: {
        Row: {
          atualizado_em: string
          confirmado: boolean
          criado_em: string
          criado_por: string | null
          dose: string | null
          frequencia: string | null
          id: string
          id_paciente: string
          inicio: string | null
          nome_medicamento: string | null
          observacoes: string | null
          paciente_refere_uso: boolean
          prescrito_por: string | null
          principio_ativo: string
          status: Database["public"]["Enums"]["uso_continuo_status"]
          via: string | null
        }
        Insert: {
          atualizado_em?: string
          confirmado?: boolean
          criado_em?: string
          criado_por?: string | null
          dose?: string | null
          frequencia?: string | null
          id?: string
          id_paciente: string
          inicio?: string | null
          nome_medicamento?: string | null
          observacoes?: string | null
          paciente_refere_uso?: boolean
          prescrito_por?: string | null
          principio_ativo: string
          status?: Database["public"]["Enums"]["uso_continuo_status"]
          via?: string | null
        }
        Update: {
          atualizado_em?: string
          confirmado?: boolean
          criado_em?: string
          criado_por?: string | null
          dose?: string | null
          frequencia?: string | null
          id?: string
          id_paciente?: string
          inicio?: string | null
          nome_medicamento?: string | null
          observacoes?: string | null
          paciente_refere_uso?: boolean
          prescrito_por?: string | null
          principio_ativo?: string
          status?: Database["public"]["Enums"]["uso_continuo_status"]
          via?: string | null
        }
        Relationships: []
      }
      medicamento_contexto_clinico: {
        Row: {
          cid: string | null
          contexto: Database["public"]["Enums"]["medicamento_contexto_uso"]
          created_at: string
          criado_por: string | null
          descricao_cid: string | null
          fonte_referencia: string | null
          id: string
          id_medicamento: string
          observacao_uso: string | null
          principio_ativo: string
          prioridade_sugestao: number
          protocolo: string | null
          queixa: string | null
          sindrome: string | null
          status_revisao: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at: string
        }
        Insert: {
          cid?: string | null
          contexto?: Database["public"]["Enums"]["medicamento_contexto_uso"]
          created_at?: string
          criado_por?: string | null
          descricao_cid?: string | null
          fonte_referencia?: string | null
          id?: string
          id_medicamento: string
          observacao_uso?: string | null
          principio_ativo: string
          prioridade_sugestao?: number
          protocolo?: string | null
          queixa?: string | null
          sindrome?: string | null
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at?: string
        }
        Update: {
          cid?: string | null
          contexto?: Database["public"]["Enums"]["medicamento_contexto_uso"]
          created_at?: string
          criado_por?: string | null
          descricao_cid?: string | null
          fonte_referencia?: string | null
          id?: string
          id_medicamento?: string
          observacao_uso?: string | null
          principio_ativo?: string
          prioridade_sugestao?: number
          protocolo?: string | null
          queixa?: string | null
          sindrome?: string | null
          status_revisao?: Database["public"]["Enums"]["medicamento_status_revisao"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicamento_contexto_clinico_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_contexto_clinico_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_contexto_clinico_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_contexto_clinico_id_medicamento_fkey"
            columns: ["id_medicamento"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      medicamento_grupo_vinculo: {
        Row: {
          created_at: string
          grupo: string
          grupo_motivo: string | null
          medicamento_id: string
          prioridade_trabalho: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          grupo: string
          grupo_motivo?: string | null
          medicamento_id: string
          prioridade_trabalho?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          grupo?: string
          grupo_motivo?: string | null
          medicamento_id?: string
          prioridade_trabalho?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicamento_grupo_vinculo_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: true
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_grupo_vinculo_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: true
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_grupo_vinculo_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: true
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_grupo_vinculo_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: true
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      medicamento_revisao_clinica: {
        Row: {
          apresentacao_id: string | null
          conteudo_hash: string | null
          created_at: string
          dose_id: string | null
          fonte: string | null
          id: string
          medicamento_id: string
          observacao: string | null
          proxima_revisao_em: string | null
          revisado_em: string | null
          revisor_id: string | null
          status: Database["public"]["Enums"]["revisao_clinica_status"]
          updated_at: string
          versao: number
        }
        Insert: {
          apresentacao_id?: string | null
          conteudo_hash?: string | null
          created_at?: string
          dose_id?: string | null
          fonte?: string | null
          id?: string
          medicamento_id: string
          observacao?: string | null
          proxima_revisao_em?: string | null
          revisado_em?: string | null
          revisor_id?: string | null
          status?: Database["public"]["Enums"]["revisao_clinica_status"]
          updated_at?: string
          versao?: number
        }
        Update: {
          apresentacao_id?: string | null
          conteudo_hash?: string | null
          created_at?: string
          dose_id?: string | null
          fonte?: string | null
          id?: string
          medicamento_id?: string
          observacao?: string | null
          proxima_revisao_em?: string | null
          revisado_em?: string | null
          revisor_id?: string | null
          status?: Database["public"]["Enums"]["revisao_clinica_status"]
          updated_at?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "base_apresentacoes_medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_apresentacao_completa"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["apresentacao_unica_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_dose"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["dose_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      medicamento_revisao_log: {
        Row: {
          acao: string
          alteracoes: Json | null
          apresentacao_id: string | null
          created_at: string
          dose_id: string | null
          id: string
          medicamento_id: string | null
          observacao: string | null
          registro_id: string | null
          revisor_id: string | null
          snapshot: Json | null
          status_anterior: string | null
          status_novo: string | null
          versao: number | null
        }
        Insert: {
          acao: string
          alteracoes?: Json | null
          apresentacao_id?: string | null
          created_at?: string
          dose_id?: string | null
          id?: string
          medicamento_id?: string | null
          observacao?: string | null
          registro_id?: string | null
          revisor_id?: string | null
          snapshot?: Json | null
          status_anterior?: string | null
          status_novo?: string | null
          versao?: number | null
        }
        Update: {
          acao?: string
          alteracoes?: Json | null
          apresentacao_id?: string | null
          created_at?: string
          dose_id?: string | null
          id?: string
          medicamento_id?: string | null
          observacao?: string | null
          registro_id?: string | null
          revisor_id?: string | null
          snapshot?: Json | null
          status_anterior?: string | null
          status_novo?: string | null
          versao?: number | null
        }
        Relationships: []
      }
      modelos_prescricao: {
        Row: {
          alertas_padrao: string[]
          area_clinica: string | null
          ativo: boolean
          atualizado_em: string
          contexto_atendimento: Database["public"]["Enums"]["template_context"]
          criado_em: string
          criado_por: string | null
          criterios_nao_uso: string | null
          criterios_uso: string | null
          cuidados_enfermagem: Json
          data_atualizacao: string
          descricao: string | null
          exames_sugeridos: Json
          fonte_referencia: string | null
          id: string
          itens_prescricao: Json
          modelo_origem: string | null
          motivo_alteracao: string | null
          nome_modelo: string
          orientacoes_paciente: Json
          revisado_em: string | null
          revisado_por: string | null
          status_revisao: Database["public"]["Enums"]["template_review_status"]
          tags: string[]
          tipo_modelo: Database["public"]["Enums"]["template_type"]
          versao_modelo: number
          visibilidade: Database["public"]["Enums"]["template_visibility"]
        }
        Insert: {
          alertas_padrao?: string[]
          area_clinica?: string | null
          ativo?: boolean
          atualizado_em?: string
          contexto_atendimento?: Database["public"]["Enums"]["template_context"]
          criado_em?: string
          criado_por?: string | null
          criterios_nao_uso?: string | null
          criterios_uso?: string | null
          cuidados_enfermagem?: Json
          data_atualizacao?: string
          descricao?: string | null
          exames_sugeridos?: Json
          fonte_referencia?: string | null
          id?: string
          itens_prescricao?: Json
          modelo_origem?: string | null
          motivo_alteracao?: string | null
          nome_modelo: string
          orientacoes_paciente?: Json
          revisado_em?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["template_review_status"]
          tags?: string[]
          tipo_modelo?: Database["public"]["Enums"]["template_type"]
          versao_modelo?: number
          visibilidade?: Database["public"]["Enums"]["template_visibility"]
        }
        Update: {
          alertas_padrao?: string[]
          area_clinica?: string | null
          ativo?: boolean
          atualizado_em?: string
          contexto_atendimento?: Database["public"]["Enums"]["template_context"]
          criado_em?: string
          criado_por?: string | null
          criterios_nao_uso?: string | null
          criterios_uso?: string | null
          cuidados_enfermagem?: Json
          data_atualizacao?: string
          descricao?: string | null
          exames_sugeridos?: Json
          fonte_referencia?: string | null
          id?: string
          itens_prescricao?: Json
          modelo_origem?: string | null
          motivo_alteracao?: string | null
          nome_modelo?: string
          orientacoes_paciente?: Json
          revisado_em?: string | null
          revisado_por?: string | null
          status_revisao?: Database["public"]["Enums"]["template_review_status"]
          tags?: string[]
          tipo_modelo?: Database["public"]["Enums"]["template_type"]
          versao_modelo?: number
          visibilidade?: Database["public"]["Enums"]["template_visibility"]
        }
        Relationships: []
      }
      notificacoes_compulsorias: {
        Row: {
          agravo: string
          agravo_id: string
          cid: string | null
          classificacao: string | null
          created_at: string
          dados: Json
          data_sintomas: string | null
          enviado_em: string | null
          id: string
          imediata: boolean
          paciente_nome: string | null
          prazo_horas: number | null
          protocolo_vigilancia: string | null
          status: string
          texto: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agravo: string
          agravo_id: string
          cid?: string | null
          classificacao?: string | null
          created_at?: string
          dados?: Json
          data_sintomas?: string | null
          enviado_em?: string | null
          id?: string
          imediata?: boolean
          paciente_nome?: string | null
          prazo_horas?: number | null
          protocolo_vigilancia?: string | null
          status?: string
          texto?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          agravo?: string
          agravo_id?: string
          cid?: string | null
          classificacao?: string | null
          created_at?: string
          dados?: Json
          data_sintomas?: string | null
          enviado_em?: string | null
          id?: string
          imediata?: boolean
          paciente_nome?: string | null
          prazo_horas?: number | null
          protocolo_vigilancia?: string | null
          status?: string
          texto?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pacientes_perfil_clinico: {
        Row: {
          alergias_classes_medicamentosas: string[]
          alergias_medicamentosas: Json
          alergias_outros: string[]
          altura_cm: number | null
          comorbidades: string[]
          condicoes_clinicas_relevantes: string[]
          created_at: string
          created_by: string
          diagnosticos_cid: string[]
          gestante: boolean
          historico_reacoes_adversas: Json
          id_paciente: string
          idade_anos: number | null
          idade_gestacional_semanas: number | null
          lactante: boolean
          observacoes_clinicas_paciente: string | null
          peso_kg: number | null
          restricoes_medicamentosas: string[]
          sexo_biologico: string | null
          trimestre_gestacional:
            | Database["public"]["Enums"]["pregnancy_trimester"]
            | null
          updated_at: string
        }
        Insert: {
          alergias_classes_medicamentosas?: string[]
          alergias_medicamentosas?: Json
          alergias_outros?: string[]
          altura_cm?: number | null
          comorbidades?: string[]
          condicoes_clinicas_relevantes?: string[]
          created_at?: string
          created_by: string
          diagnosticos_cid?: string[]
          gestante?: boolean
          historico_reacoes_adversas?: Json
          id_paciente: string
          idade_anos?: number | null
          idade_gestacional_semanas?: number | null
          lactante?: boolean
          observacoes_clinicas_paciente?: string | null
          peso_kg?: number | null
          restricoes_medicamentosas?: string[]
          sexo_biologico?: string | null
          trimestre_gestacional?:
            | Database["public"]["Enums"]["pregnancy_trimester"]
            | null
          updated_at?: string
        }
        Update: {
          alergias_classes_medicamentosas?: string[]
          alergias_medicamentosas?: Json
          alergias_outros?: string[]
          altura_cm?: number | null
          comorbidades?: string[]
          condicoes_clinicas_relevantes?: string[]
          created_at?: string
          created_by?: string
          diagnosticos_cid?: string[]
          gestante?: boolean
          historico_reacoes_adversas?: Json
          id_paciente?: string
          idade_anos?: number | null
          idade_gestacional_semanas?: number | null
          lactante?: boolean
          observacoes_clinicas_paciente?: string | null
          peso_kg?: number | null
          restricoes_medicamentosas?: string[]
          sexo_biologico?: string | null
          trimestre_gestacional?:
            | Database["public"]["Enums"]["pregnancy_trimester"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      patologia_ambiente: {
        Row: {
          ambiente: string
          apresentacao: string | null
          created_at: string
          especialidade: string | null
          frequencia: number
          gravidade: string
          id: string
          nome_normalizado: string
          nome_patologia: string
          sistema: string | null
          updated_at: string
        }
        Insert: {
          ambiente: string
          apresentacao?: string | null
          created_at?: string
          especialidade?: string | null
          frequencia?: number
          gravidade?: string
          id?: string
          nome_normalizado: string
          nome_patologia: string
          sistema?: string | null
          updated_at?: string
        }
        Update: {
          ambiente?: string
          apresentacao?: string | null
          created_at?: string
          especialidade?: string | null
          frequencia?: number
          gravidade?: string
          id?: string
          nome_normalizado?: string
          nome_patologia?: string
          sistema?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patologia_conteudo: {
        Row: {
          ambiente: string | null
          ativo: boolean
          conteudo: Json
          created_at: string
          fonte: string | null
          id: string
          nome_normalizado: string
          ordem: number
          secao: string
          updated_at: string
        }
        Insert: {
          ambiente?: string | null
          ativo?: boolean
          conteudo?: Json
          created_at?: string
          fonte?: string | null
          id?: string
          nome_normalizado: string
          ordem?: number
          secao: string
          updated_at?: string
        }
        Update: {
          ambiente?: string | null
          ativo?: boolean
          conteudo?: Json
          created_at?: string
          fonte?: string | null
          id?: string
          nome_normalizado?: string
          ordem?: number
          secao?: string
          updated_at?: string
        }
        Relationships: []
      }
      patologia_documentos: {
        Row: {
          ambiente: string | null
          ativo: boolean
          created_at: string
          documento: string
          id: string
          nome_normalizado: string
          nota: string | null
          prioridade: number
          updated_at: string
        }
        Insert: {
          ambiente?: string | null
          ativo?: boolean
          created_at?: string
          documento: string
          id?: string
          nome_normalizado: string
          nota?: string | null
          prioridade?: number
          updated_at?: string
        }
        Update: {
          ambiente?: string | null
          ativo?: boolean
          created_at?: string
          documento?: string
          id?: string
          nome_normalizado?: string
          nota?: string | null
          prioridade?: number
          updated_at?: string
        }
        Relationships: []
      }
      patologia_medicamento: {
        Row: {
          ajuste_hepatico: boolean
          ajuste_renal: boolean
          ambiente: string
          created_at: string
          criado_por: string | null
          dose_adulto: string | null
          dose_pediatrica: string | null
          duracao: string | null
          evitar_gestante: boolean
          fonte: string | null
          id: string
          linha: string
          medicamento_id: string | null
          medicamento_nome: string
          observacao: string | null
          patologia_id: string | null
          patologia_nome: string
          patologia_normalizada: string
          prioridade: number
          publico: string
          status_revisao: string
          updated_at: string
          via: string | null
        }
        Insert: {
          ajuste_hepatico?: boolean
          ajuste_renal?: boolean
          ambiente: string
          created_at?: string
          criado_por?: string | null
          dose_adulto?: string | null
          dose_pediatrica?: string | null
          duracao?: string | null
          evitar_gestante?: boolean
          fonte?: string | null
          id?: string
          linha?: string
          medicamento_id?: string | null
          medicamento_nome: string
          observacao?: string | null
          patologia_id?: string | null
          patologia_nome: string
          patologia_normalizada: string
          prioridade?: number
          publico?: string
          status_revisao?: string
          updated_at?: string
          via?: string | null
        }
        Update: {
          ajuste_hepatico?: boolean
          ajuste_renal?: boolean
          ambiente?: string
          created_at?: string
          criado_por?: string | null
          dose_adulto?: string | null
          dose_pediatrica?: string | null
          duracao?: string | null
          evitar_gestante?: boolean
          fonte?: string | null
          id?: string
          linha?: string
          medicamento_id?: string | null
          medicamento_nome?: string
          observacao?: string | null
          patologia_id?: string | null
          patologia_nome?: string
          patologia_normalizada?: string
          prioridade?: number
          publico?: string
          status_revisao?: string
          updated_at?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patologia_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patologia_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patologia_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patologia_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      patologia_personalizacao: {
        Row: {
          anamnese: Json
          condutas: Json
          created_at: string
          especialidade: string | null
          exames: Json
          favorito: boolean
          id: string
          observacoes: string | null
          patologia_key: string
          patologia_nome: string
          prescricoes_modelo: Json
          recursos: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          anamnese?: Json
          condutas?: Json
          created_at?: string
          especialidade?: string | null
          exames?: Json
          favorito?: boolean
          id?: string
          observacoes?: string | null
          patologia_key: string
          patologia_nome: string
          prescricoes_modelo?: Json
          recursos?: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          anamnese?: Json
          condutas?: Json
          created_at?: string
          especialidade?: string | null
          exames?: Json
          favorito?: boolean
          id?: string
          observacoes?: string | null
          patologia_key?: string
          patologia_nome?: string
          prescricoes_modelo?: Json
          recursos?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      patologia_recursos: {
        Row: {
          ativo: boolean
          codigo: string | null
          created_at: string
          id: string
          nome_normalizado: string
          ordem: number
          resumo: string | null
          tipo: string
          titulo: string
          updated_at: string
          url: string | null
        }
        Insert: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome_normalizado: string
          ordem?: number
          resumo?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nome_normalizado?: string
          ordem?: number
          resumo?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      patologias_usuario: {
        Row: {
          ambientes: string[]
          ativo: boolean
          categoria: string | null
          cid10: string | null
          created_at: string
          gravidade: string | null
          id: string
          medicamentos: Json
          nome: string
          observacoes: string | null
          sinonimos: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          ambientes?: string[]
          ativo?: boolean
          categoria?: string | null
          cid10?: string | null
          created_at?: string
          gravidade?: string | null
          id?: string
          medicamentos?: Json
          nome: string
          observacoes?: string | null
          sinonimos?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          ambientes?: string[]
          ativo?: boolean
          categoria?: string | null
          cid10?: string | null
          created_at?: string
          gravidade?: string | null
          id?: string
          medicamentos?: Json
          nome?: string
          observacoes?: string | null
          sinonimos?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prescricoes_historico: {
        Row: {
          alertas_registrados: Json
          atualizado_em: string
          cid: string | null
          contexto_atendimento: string | null
          criado_em: string
          dados_paciente_snapshot: Json
          diagnostico: string | null
          id: string
          id_atendimento: string | null
          id_paciente: string
          itens: Json
          justificativas: Json
          profissional_id: string
          profissional_nome: string | null
          status: string
        }
        Insert: {
          alertas_registrados?: Json
          atualizado_em?: string
          cid?: string | null
          contexto_atendimento?: string | null
          criado_em?: string
          dados_paciente_snapshot?: Json
          diagnostico?: string | null
          id?: string
          id_atendimento?: string | null
          id_paciente: string
          itens?: Json
          justificativas?: Json
          profissional_id: string
          profissional_nome?: string | null
          status?: string
        }
        Update: {
          alertas_registrados?: Json
          atualizado_em?: string
          cid?: string | null
          contexto_atendimento?: string | null
          criado_em?: string
          dados_paciente_snapshot?: Json
          diagnostico?: string | null
          id?: string
          id_atendimento?: string | null
          id_paciente?: string
          itens?: Json
          justificativas?: Json
          profissional_id?: string
          profissional_nome?: string | null
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          clinic_address: string | null
          clinic_email: string | null
          clinic_name: string | null
          clinic_phone: string | null
          created_at: string
          crm: string | null
          full_name: string | null
          id: string
          pref_iv_pdf: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          clinic_address?: string | null
          clinic_email?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          crm?: string | null
          full_name?: string | null
          id: string
          pref_iv_pdf?: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          clinic_address?: string | null
          clinic_email?: string | null
          clinic_name?: string | null
          clinic_phone?: string | null
          created_at?: string
          crm?: string | null
          full_name?: string | null
          id?: string
          pref_iv_pdf?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      protocolo_etapas: {
        Row: {
          created_at: string
          fase: string | null
          id: string
          instrucao: string | null
          obrigatorio: boolean | null
          ordem: number
          protocolo_id: string | null
          tempo_alvo_min: number | null
          titulo: string
        }
        Insert: {
          created_at?: string
          fase?: string | null
          id?: string
          instrucao?: string | null
          obrigatorio?: boolean | null
          ordem: number
          protocolo_id?: string | null
          tempo_alvo_min?: number | null
          titulo: string
        }
        Update: {
          created_at?: string
          fase?: string | null
          id?: string
          instrucao?: string | null
          obrigatorio?: boolean | null
          ordem?: number
          protocolo_id?: string | null
          tempo_alvo_min?: number | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_etapas_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos_ps"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolo_versoes: {
        Row: {
          atualizacao_id: string | null
          conteudo: string
          created_at: string
          id: string
          origem: string
          patologia: string
          protocolo: string
          referencia: string | null
          url: string | null
          user_id: string
          versao: number
        }
        Insert: {
          atualizacao_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          origem?: string
          patologia: string
          protocolo: string
          referencia?: string | null
          url?: string | null
          user_id: string
          versao?: number
        }
        Update: {
          atualizacao_id?: string | null
          conteudo?: string
          created_at?: string
          id?: string
          origem?: string
          patologia?: string
          protocolo?: string
          referencia?: string | null
          url?: string | null
          user_id?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_versoes_atualizacao_id_fkey"
            columns: ["atualizacao_id"]
            isOneToOne: false
            referencedRelation: "ia_atualizacoes_pendentes"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_favoritos: {
        Row: {
          favoritado_em: string
          id: string
          id_protocolo: string
          user_id: string
        }
        Insert: {
          favoritado_em?: string
          id?: string
          id_protocolo: string
          user_id: string
        }
        Update: {
          favoritado_em?: string
          id?: string
          id_protocolo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_favoritos_id_protocolo_fkey"
            columns: ["id_protocolo"]
            isOneToOne: false
            referencedRelation: "base_protocolos_clinicos"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_ps: {
        Row: {
          codigo_protocolo: string
          contexto: string | null
          created_at: string
          fonte_id: string | null
          id: string
          janela_terapeutica_min: number | null
          lote_id: string
          nome: string
          patologia_id: string | null
          tempo_critico: boolean | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          codigo_protocolo: string
          contexto?: string | null
          created_at?: string
          fonte_id?: string | null
          id?: string
          janela_terapeutica_min?: number | null
          lote_id: string
          nome: string
          patologia_id?: string | null
          tempo_critico?: boolean | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          codigo_protocolo?: string
          contexto?: string | null
          created_at?: string
          fonte_id?: string | null
          id?: string
          janela_terapeutica_min?: number | null
          lote_id?: string
          nome?: string
          patologia_id?: string | null
          tempo_critico?: boolean | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocolos_ps_patologia_id_fkey"
            columns: ["patologia_id"]
            isOneToOne: false
            referencedRelation: "stg_patologias"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_settings: {
        Row: {
          alertar_sem_revisao_12m: boolean
          cruzar_seguranca_med_sugerido: boolean
          exigir_revisao_med_sugerido: boolean
          id: string
          mostrar_gravidade_topo: boolean
          mostrar_rascunho_admin: boolean
          permitir_favoritos: boolean
          permitir_montar_plano: boolean
          updated_at: string
          updated_by: string | null
          usar_apenas_revisados: boolean
        }
        Insert: {
          alertar_sem_revisao_12m?: boolean
          cruzar_seguranca_med_sugerido?: boolean
          exigir_revisao_med_sugerido?: boolean
          id?: string
          mostrar_gravidade_topo?: boolean
          mostrar_rascunho_admin?: boolean
          permitir_favoritos?: boolean
          permitir_montar_plano?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_apenas_revisados?: boolean
        }
        Update: {
          alertar_sem_revisao_12m?: boolean
          cruzar_seguranca_med_sugerido?: boolean
          exigir_revisao_med_sugerido?: boolean
          id?: string
          mostrar_gravidade_topo?: boolean
          mostrar_rascunho_admin?: boolean
          permitir_favoritos?: boolean
          permitir_montar_plano?: boolean
          updated_at?: string
          updated_by?: string | null
          usar_apenas_revisados?: boolean
        }
        Relationships: []
      }
      qualidade_base_configs: {
        Row: {
          bloquear_beta_com_erro_critico: boolean
          bloquear_revisado_sem_fonte: boolean
          created_at: string
          criar_tarefa_para_critico: boolean
          id: string
          permitir_ignorar_com_justificativa: boolean
          revisao_ao_editar: boolean
          revisao_ao_importar: boolean
          singleton: boolean
          sugerir_termos_busca: boolean
          updated_at: string
        }
        Insert: {
          bloquear_beta_com_erro_critico?: boolean
          bloquear_revisado_sem_fonte?: boolean
          created_at?: string
          criar_tarefa_para_critico?: boolean
          id?: string
          permitir_ignorar_com_justificativa?: boolean
          revisao_ao_editar?: boolean
          revisao_ao_importar?: boolean
          singleton?: boolean
          sugerir_termos_busca?: boolean
          updated_at?: string
        }
        Update: {
          bloquear_beta_com_erro_critico?: boolean
          bloquear_revisado_sem_fonte?: boolean
          created_at?: string
          criar_tarefa_para_critico?: boolean
          id?: string
          permitir_ignorar_com_justificativa?: boolean
          revisao_ao_editar?: boolean
          revisao_ao_importar?: boolean
          singleton?: boolean
          sugerir_termos_busca?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      qualidade_base_ignoradas: {
        Row: {
          created_at: string
          finding_key: string
          id: string
          justificativa: string
          medicamento_id: string | null
          ref_id: string | null
          rule_code: string
          updated_at: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          finding_key: string
          id?: string
          justificativa: string
          medicamento_id?: string | null
          ref_id?: string | null
          rule_code: string
          updated_at?: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          finding_key?: string
          id?: string
          justificativa?: string
          medicamento_id?: string | null
          ref_id?: string | null
          rule_code?: string
          updated_at?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qualidade_base_ignoradas_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualidade_base_ignoradas_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualidade_base_ignoradas_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qualidade_base_ignoradas_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      restricoes_paciente: {
        Row: {
          ativa: boolean
          classe_terapeutica: string | null
          created_at: string
          criada_por: string
          gravidade: Database["public"]["Enums"]["interaction_severity"]
          grupo_alergia: string | null
          id: string
          id_paciente: string
          motivo: string | null
          principio_ativo: string | null
          texto_restricao: string
          tipo_restricao: string | null
        }
        Insert: {
          ativa?: boolean
          classe_terapeutica?: string | null
          created_at?: string
          criada_por: string
          gravidade?: Database["public"]["Enums"]["interaction_severity"]
          grupo_alergia?: string | null
          id?: string
          id_paciente: string
          motivo?: string | null
          principio_ativo?: string | null
          texto_restricao: string
          tipo_restricao?: string | null
        }
        Update: {
          ativa?: boolean
          classe_terapeutica?: string | null
          created_at?: string
          criada_por?: string
          gravidade?: Database["public"]["Enums"]["interaction_severity"]
          grupo_alergia?: string | null
          id?: string
          id_paciente?: string
          motivo?: string | null
          principio_ativo?: string | null
          texto_restricao?: string
          tipo_restricao?: string | null
        }
        Relationships: []
      }
      resultados_escores_trauma: {
        Row: {
          created_at: string
          detalhes: Json
          entrada: Json
          escore: string
          estrato: string
          id: string
          observacao: string | null
          pontuacao: number
          rotulo: string
          share_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          detalhes?: Json
          entrada?: Json
          escore: string
          estrato: string
          id?: string
          observacao?: string | null
          pontuacao: number
          rotulo: string
          share_token?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          detalhes?: Json
          entrada?: Json
          escore?: string
          estrato?: string
          id?: string
          observacao?: string | null
          pontuacao?: number
          rotulo?: string
          share_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sindrome_medicamento: {
        Row: {
          ajuste_hepatico: boolean
          ajuste_renal: boolean
          ambiente: string
          created_at: string
          criado_por: string | null
          dose_adulto: string | null
          dose_pediatrica: string | null
          duracao: string | null
          evitar_gestante: boolean
          fonte: string | null
          id: string
          linha: string
          medicamento_id: string | null
          medicamento_nome: string
          observacao: string | null
          prioridade: number
          publico: string
          sindrome_id: string | null
          sindrome_nome: string
          sindrome_normalizada: string
          status_revisao: string
          updated_at: string
          via: string | null
        }
        Insert: {
          ajuste_hepatico?: boolean
          ajuste_renal?: boolean
          ambiente: string
          created_at?: string
          criado_por?: string | null
          dose_adulto?: string | null
          dose_pediatrica?: string | null
          duracao?: string | null
          evitar_gestante?: boolean
          fonte?: string | null
          id?: string
          linha?: string
          medicamento_id?: string | null
          medicamento_nome: string
          observacao?: string | null
          prioridade?: number
          publico?: string
          sindrome_id?: string | null
          sindrome_nome: string
          sindrome_normalizada: string
          status_revisao?: string
          updated_at?: string
          via?: string | null
        }
        Update: {
          ajuste_hepatico?: boolean
          ajuste_renal?: boolean
          ambiente?: string
          created_at?: string
          criado_por?: string | null
          dose_adulto?: string | null
          dose_pediatrica?: string | null
          duracao?: string | null
          evitar_gestante?: boolean
          fonte?: string | null
          id?: string
          linha?: string
          medicamento_id?: string | null
          medicamento_nome?: string
          observacao?: string | null
          prioridade?: number
          publico?: string
          sindrome_id?: string | null
          sindrome_nome?: string
          sindrome_normalizada?: string
          status_revisao?: string
          updated_at?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sindrome_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sindrome_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sindrome_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sindrome_medicamento_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      sindrome_patologia: {
        Row: {
          created_at: string
          id: string
          nome_normalizado: string
          nome_patologia: string
          prioridade: number
          sindrome_codigo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_normalizado: string
          nome_patologia: string
          prioridade?: number
          sindrome_codigo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_normalizado?: string
          nome_patologia?: string
          prioridade?: number
          sindrome_codigo?: string
          updated_at?: string
        }
        Relationships: []
      }
      stg_escore_gatilhos: {
        Row: {
          conduta: string | null
          created_at: string
          escore_nome: string
          faixa: string | null
          fonte_id: string | null
          gatilho: string | null
          id: string
          linha_origem: string | null
          lote_id: string
          nivel_gate: string | null
          prazo: string | null
          processado: boolean
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          conduta?: string | null
          created_at?: string
          escore_nome: string
          faixa?: string | null
          fonte_id?: string | null
          gatilho?: string | null
          id?: string
          linha_origem?: string | null
          lote_id: string
          nivel_gate?: string | null
          prazo?: string | null
          processado?: boolean
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          conduta?: string | null
          created_at?: string
          escore_nome?: string
          faixa?: string | null
          fonte_id?: string | null
          gatilho?: string | null
          id?: string
          linha_origem?: string | null
          lote_id?: string
          nivel_gate?: string | null
          prazo?: string | null
          processado?: boolean
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_escore_itens: {
        Row: {
          descricao: string | null
          escore_nome: string | null
          id: string
          importado_em: string | null
          linha_origem: string | null
          lote_id: string
          observacao: string | null
          ordem: string | null
          pontuacao: string | null
          processado: boolean | null
        }
        Insert: {
          descricao?: string | null
          escore_nome?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id: string
          observacao?: string | null
          ordem?: string | null
          pontuacao?: string | null
          processado?: boolean | null
        }
        Update: {
          descricao?: string | null
          escore_nome?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id?: string
          observacao?: string | null
          ordem?: string | null
          pontuacao?: string | null
          processado?: boolean | null
        }
        Relationships: []
      }
      stg_escore_protocolo_integracao: {
        Row: {
          acao_disparada: string | null
          ativo: boolean
          created_at: string
          escore_nome: string
          faixa_gatilho: string | null
          fonte_id: string | null
          gatilho_descricao: string | null
          id: string
          linha_origem: string | null
          lote_id: string
          nivel_gate: string
          ordem_na_cadeia: number | null
          override_por_red_flag: boolean
          populacao_validada: string | null
          protocolo_codigo: string
          red_flag_descricao: string | null
          revisao_humana_obrigatoria: boolean
          tipo_integracao: string
          trecho_citado: string | null
          updated_at: string
          versao_escore: string | null
        }
        Insert: {
          acao_disparada?: string | null
          ativo?: boolean
          created_at?: string
          escore_nome: string
          faixa_gatilho?: string | null
          fonte_id?: string | null
          gatilho_descricao?: string | null
          id?: string
          linha_origem?: string | null
          lote_id: string
          nivel_gate?: string
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean
          populacao_validada?: string | null
          protocolo_codigo: string
          red_flag_descricao?: string | null
          revisao_humana_obrigatoria?: boolean
          tipo_integracao: string
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Update: {
          acao_disparada?: string | null
          ativo?: boolean
          created_at?: string
          escore_nome?: string
          faixa_gatilho?: string | null
          fonte_id?: string | null
          gatilho_descricao?: string | null
          id?: string
          linha_origem?: string | null
          lote_id?: string
          nivel_gate?: string
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean
          populacao_validada?: string | null
          protocolo_codigo?: string
          red_flag_descricao?: string | null
          revisao_humana_obrigatoria?: boolean
          tipo_integracao?: string
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Relationships: []
      }
      stg_escores: {
        Row: {
          desempenho: string | null
          dominio: string | null
          evidencia: string | null
          faixa_etaria: string | null
          fonte_id: string | null
          id: string
          importado_em: string | null
          linha_origem: string | null
          lote_id: string
          n_itens: string | null
          nome_escore: string | null
          pontos_corte: string | null
          populacao: string | null
          processado: boolean | null
          referencia_validacao: string | null
          sigla: string | null
          tempo_aplicacao_min: string | null
          tipo: string | null
          trecho_citado: string | null
          validacao_ptbr: string | null
        }
        Insert: {
          desempenho?: string | null
          dominio?: string | null
          evidencia?: string | null
          faixa_etaria?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id: string
          n_itens?: string | null
          nome_escore?: string | null
          pontos_corte?: string | null
          populacao?: string | null
          processado?: boolean | null
          referencia_validacao?: string | null
          sigla?: string | null
          tempo_aplicacao_min?: string | null
          tipo?: string | null
          trecho_citado?: string | null
          validacao_ptbr?: string | null
        }
        Update: {
          desempenho?: string | null
          dominio?: string | null
          evidencia?: string | null
          faixa_etaria?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id?: string
          n_itens?: string | null
          nome_escore?: string | null
          pontos_corte?: string | null
          populacao?: string | null
          processado?: boolean | null
          referencia_validacao?: string | null
          sigla?: string | null
          tempo_aplicacao_min?: string | null
          tipo?: string | null
          trecho_citado?: string | null
          validacao_ptbr?: string | null
        }
        Relationships: []
      }
      stg_escores_clinicos: {
        Row: {
          calculo_formula: string | null
          conduta_associada: string | null
          created_at: string
          entradas: Json | null
          especialidade: string | null
          faixas_interpretacao: Json | null
          finalidade: string | null
          fonte_id: string | null
          id: string
          linha_origem: string | null
          lote_id: string
          nao_usar_para: string | null
          nome_escore: string
          populacao_alvo: string | null
          processado: boolean
          sinonimos: string | null
          trecho_citado: string | null
          updated_at: string
          versao: string | null
        }
        Insert: {
          calculo_formula?: string | null
          conduta_associada?: string | null
          created_at?: string
          entradas?: Json | null
          especialidade?: string | null
          faixas_interpretacao?: Json | null
          finalidade?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem?: string | null
          lote_id: string
          nao_usar_para?: string | null
          nome_escore: string
          populacao_alvo?: string | null
          processado?: boolean
          sinonimos?: string | null
          trecho_citado?: string | null
          updated_at?: string
          versao?: string | null
        }
        Update: {
          calculo_formula?: string | null
          conduta_associada?: string | null
          created_at?: string
          entradas?: Json | null
          especialidade?: string | null
          faixas_interpretacao?: Json | null
          finalidade?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem?: string | null
          lote_id?: string
          nao_usar_para?: string | null
          nome_escore?: string
          populacao_alvo?: string | null
          processado?: boolean
          sinonimos?: string | null
          trecho_citado?: string | null
          updated_at?: string
          versao?: string | null
        }
        Relationships: []
      }
      stg_exames: {
        Row: {
          amostra_metodo: string | null
          categoria: string | null
          created_at: string
          disponivel_sus: string | null
          fonte_id: string | null
          id: string
          importado_em: string | null
          jejum_horas: string | null
          linha_bruta: string | null
          linha_origem: string | null
          loinc: string | null
          lote_id: string | null
          nome_exame: string | null
          observacoes: string | null
          preparo_paciente: string | null
          processado: boolean | null
          sigla: string | null
          sigtap: string | null
          sinonimos: string | null
          tempo_resultado_horas: string | null
          tipo_exame: string | null
          trecho_citado: string | null
          tuss: string | null
          updated_at: string
        }
        Insert: {
          amostra_metodo?: string | null
          categoria?: string | null
          created_at?: string
          disponivel_sus?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          jejum_horas?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          loinc?: string | null
          lote_id?: string | null
          nome_exame?: string | null
          observacoes?: string | null
          preparo_paciente?: string | null
          processado?: boolean | null
          sigla?: string | null
          sigtap?: string | null
          sinonimos?: string | null
          tempo_resultado_horas?: string | null
          tipo_exame?: string | null
          trecho_citado?: string | null
          tuss?: string | null
          updated_at?: string
        }
        Update: {
          amostra_metodo?: string | null
          categoria?: string | null
          created_at?: string
          disponivel_sus?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          jejum_horas?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          loinc?: string | null
          lote_id?: string | null
          nome_exame?: string | null
          observacoes?: string | null
          preparo_paciente?: string | null
          processado?: boolean | null
          sigla?: string | null
          sigtap?: string | null
          sinonimos?: string | null
          tempo_resultado_horas?: string | null
          tipo_exame?: string | null
          trecho_citado?: string | null
          tuss?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_faixas_validacao_intervencionista_sangramento: {
        Row: {
          contexto: string
          created_at: string
          escore_nome: string
          fonte_id: string | null
          id: number
          idade_max_anos: number | null
          idade_min_anos: number | null
          lote_id: string
          motivo_invalidacao: string | null
          populacao_validada: boolean | null
          revisao_humana_obrigatoria: boolean | null
          trecho_citado: string | null
          updated_at: string
          versao_escore: string | null
        }
        Insert: {
          contexto: string
          created_at?: string
          escore_nome: string
          fonte_id?: string | null
          id?: number
          idade_max_anos?: number | null
          idade_min_anos?: number | null
          lote_id: string
          motivo_invalidacao?: string | null
          populacao_validada?: boolean | null
          revisao_humana_obrigatoria?: boolean | null
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Update: {
          contexto?: string
          created_at?: string
          escore_nome?: string
          fonte_id?: string | null
          id?: number
          idade_max_anos?: number | null
          idade_min_anos?: number | null
          lote_id?: string
          motivo_invalidacao?: string | null
          populacao_validada?: boolean | null
          revisao_humana_obrigatoria?: boolean | null
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Relationships: []
      }
      stg_faixas_validacao_obstetrica_dor: {
        Row: {
          contexto_gestacional: string | null
          created_at: string
          escore_nome: string
          fonte_id: string | null
          id: number
          idade_max_anos: number | null
          idade_max_dias: number | null
          idade_min_anos: number | null
          idade_min_dias: number | null
          lote_id: string
          motivo_invalidacao: string | null
          populacao: string
          populacao_validada: boolean | null
          revisao_humana_obrigatoria: boolean | null
          trecho_citado: string | null
          updated_at: string
          versao_escore: string | null
        }
        Insert: {
          contexto_gestacional?: string | null
          created_at?: string
          escore_nome: string
          fonte_id?: string | null
          id?: number
          idade_max_anos?: number | null
          idade_max_dias?: number | null
          idade_min_anos?: number | null
          idade_min_dias?: number | null
          lote_id: string
          motivo_invalidacao?: string | null
          populacao: string
          populacao_validada?: boolean | null
          revisao_humana_obrigatoria?: boolean | null
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Update: {
          contexto_gestacional?: string | null
          created_at?: string
          escore_nome?: string
          fonte_id?: string | null
          id?: number
          idade_max_anos?: number | null
          idade_max_dias?: number | null
          idade_min_anos?: number | null
          idade_min_dias?: number | null
          lote_id?: string
          motivo_invalidacao?: string | null
          populacao?: string
          populacao_validada?: boolean | null
          revisao_humana_obrigatoria?: boolean | null
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Relationships: []
      }
      stg_faixas_validacao_trauma_cirurgico: {
        Row: {
          contexto: string
          created_at: string
          escore_nome: string
          fonte_id: string | null
          id: number
          idade_max_anos: number | null
          idade_max_dias: number | null
          idade_min_anos: number | null
          idade_min_dias: number | null
          lote_id: string
          motivo_invalidacao: string | null
          populacao_validada: boolean | null
          revisao_humana_obrigatoria: boolean | null
          trecho_citado: string | null
          updated_at: string
          versao_escore: string | null
        }
        Insert: {
          contexto: string
          created_at?: string
          escore_nome: string
          fonte_id?: string | null
          id?: number
          idade_max_anos?: number | null
          idade_max_dias?: number | null
          idade_min_anos?: number | null
          idade_min_dias?: number | null
          lote_id: string
          motivo_invalidacao?: string | null
          populacao_validada?: boolean | null
          revisao_humana_obrigatoria?: boolean | null
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Update: {
          contexto?: string
          created_at?: string
          escore_nome?: string
          fonte_id?: string | null
          id?: number
          idade_max_anos?: number | null
          idade_max_dias?: number | null
          idade_min_anos?: number | null
          idade_min_dias?: number | null
          lote_id?: string
          motivo_invalidacao?: string | null
          populacao_validada?: boolean | null
          revisao_humana_obrigatoria?: boolean | null
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Relationships: []
      }
      stg_fluxo_decisao_patologia: {
        Row: {
          acao_disparada: string | null
          ativo: boolean
          created_at: string
          escore_aplicado: string | null
          estado_atual: string
          faixa_gatilho: string | null
          fonte_id: string | null
          id: string
          linha_origem: string | null
          lote_id: string
          ordem_na_cadeia: number | null
          override_por_red_flag: boolean
          patologia: string
          protocolo_codigo: string
          proximo_estado: string
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          acao_disparada?: string | null
          ativo?: boolean
          created_at?: string
          escore_aplicado?: string | null
          estado_atual: string
          faixa_gatilho?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem?: string | null
          lote_id: string
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean
          patologia: string
          protocolo_codigo: string
          proximo_estado: string
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          acao_disparada?: string | null
          ativo?: boolean
          created_at?: string
          escore_aplicado?: string | null
          estado_atual?: string
          faixa_gatilho?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem?: string | null
          lote_id?: string
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean
          patologia?: string
          protocolo_codigo?: string
          proximo_estado?: string
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_import_lotes: {
        Row: {
          created_at: string
          created_by: string | null
          destino: string
          formato: string
          id: string
          linhas_aceitas: number
          linhas_rejeitadas: number
          lote_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destino: string
          formato: string
          id?: string
          linhas_aceitas?: number
          linhas_rejeitadas?: number
          lote_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destino?: string
          formato?: string
          id?: string
          linhas_aceitas?: number
          linhas_rejeitadas?: number
          lote_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stg_med_apresentacao: {
        Row: {
          concentracao_mg_ml: string | null
          concentracao_pos_reconstituicao_mg_ml: string | null
          concentracao_texto: string | null
          concentracao_unidade: string | null
          concentracao_valor: string | null
          diluente_reconstituicao: string | null
          disponivel_sus: string | null
          fonte_id: string | null
          forma_farmaceutica: string | null
          gotas_por_ml: string | null
          id: string
          importado_em: string | null
          linha_origem: string | null
          lote_id: string
          observacoes: string | null
          principio_ativo: string | null
          processado: boolean | null
          requer_reconstituicao: string | null
          trecho_citado: string | null
          unidades_por_embalagem: string | null
          uso_hospitalar: string | null
          via: string | null
          volume_ml: string | null
          volume_reconstituicao_ml: string | null
        }
        Insert: {
          concentracao_mg_ml?: string | null
          concentracao_pos_reconstituicao_mg_ml?: string | null
          concentracao_texto?: string | null
          concentracao_unidade?: string | null
          concentracao_valor?: string | null
          diluente_reconstituicao?: string | null
          disponivel_sus?: string | null
          fonte_id?: string | null
          forma_farmaceutica?: string | null
          gotas_por_ml?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id: string
          observacoes?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          requer_reconstituicao?: string | null
          trecho_citado?: string | null
          unidades_por_embalagem?: string | null
          uso_hospitalar?: string | null
          via?: string | null
          volume_ml?: string | null
          volume_reconstituicao_ml?: string | null
        }
        Update: {
          concentracao_mg_ml?: string | null
          concentracao_pos_reconstituicao_mg_ml?: string | null
          concentracao_texto?: string | null
          concentracao_unidade?: string | null
          concentracao_valor?: string | null
          diluente_reconstituicao?: string | null
          disponivel_sus?: string | null
          fonte_id?: string | null
          forma_farmaceutica?: string | null
          gotas_por_ml?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id?: string
          observacoes?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          requer_reconstituicao?: string | null
          trecho_citado?: string | null
          unidades_por_embalagem?: string | null
          uso_hospitalar?: string | null
          via?: string | null
          volume_ml?: string | null
          volume_reconstituicao_ml?: string | null
        }
        Relationships: []
      }
      stg_med_contraindicacao: {
        Row: {
          alergia_cruzada_classe: string | null
          alternativa: string | null
          cid10_relacionado: string | null
          condicao: string | null
          conduta: string | null
          conflito: string | null
          fonte_id: string | null
          gravidade: string | null
          id: string
          importado_em: string | null
          linha_origem: string | null
          lote_id: string
          mecanismo: string | null
          principio_ativo: string | null
          processado: boolean | null
          tipo: string | null
          trecho_citado: string | null
        }
        Insert: {
          alergia_cruzada_classe?: string | null
          alternativa?: string | null
          cid10_relacionado?: string | null
          condicao?: string | null
          conduta?: string | null
          conflito?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id: string
          mecanismo?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          tipo?: string | null
          trecho_citado?: string | null
        }
        Update: {
          alergia_cruzada_classe?: string | null
          alternativa?: string | null
          cid10_relacionado?: string | null
          condicao?: string | null
          conduta?: string | null
          conflito?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id?: string
          mecanismo?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          tipo?: string | null
          trecho_citado?: string | null
        }
        Relationships: []
      }
      stg_med_dose: {
        Row: {
          conflito: string | null
          dose_max: string | null
          dose_min: string | null
          dose_pendente_de_fonte: string | null
          dose_tipo: string | null
          dose_unidade: string | null
          fonte_id: string | null
          id: string
          importado_em: string | null
          indicacao: string | null
          linha_origem: string | null
          lote_id: string
          populacao: string | null
          principio_ativo: string | null
          processado: boolean | null
          revisado_em: string | null
          revisado_por: string | null
          status_revisao: string
          trecho_citado: string | null
          updated_at: string
          versao: number
          via: string | null
        }
        Insert: {
          conflito?: string | null
          dose_max?: string | null
          dose_min?: string | null
          dose_pendente_de_fonte?: string | null
          dose_tipo?: string | null
          dose_unidade?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          indicacao?: string | null
          linha_origem?: string | null
          lote_id: string
          populacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          revisado_em?: string | null
          revisado_por?: string | null
          status_revisao?: string
          trecho_citado?: string | null
          updated_at?: string
          versao?: number
          via?: string | null
        }
        Update: {
          conflito?: string | null
          dose_max?: string | null
          dose_min?: string | null
          dose_pendente_de_fonte?: string | null
          dose_tipo?: string | null
          dose_unidade?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          indicacao?: string | null
          linha_origem?: string | null
          lote_id?: string
          populacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          revisado_em?: string | null
          revisado_por?: string | null
          status_revisao?: string
          trecho_citado?: string | null
          updated_at?: string
          versao?: number
          via?: string | null
        }
        Relationships: []
      }
      stg_med_dose_historico: {
        Row: {
          alterado_por: string | null
          created_at: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          dose_id: string
          id: string
          lote_id: string
          motivo: string | null
          versao_anterior: number | null
          versao_nova: number | null
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          dose_id: string
          id?: string
          lote_id: string
          motivo?: string | null
          versao_anterior?: number | null
          versao_nova?: number | null
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          dose_id?: string
          id?: string
          lote_id?: string
          motivo?: string | null
          versao_anterior?: number | null
          versao_nova?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stg_med_dose_historico_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "stg_med_dose"
            referencedColumns: ["id"]
          },
        ]
      }
      stg_med_equivalencia: {
        Row: {
          conflito: boolean
          created_at: string
          equivalente: string
          fator: string | null
          fonte_id: string | null
          id: string
          linha_origem: string | null
          lote_id: string
          principio_ativo: string
          processado: boolean
          tipo_equivalencia: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          conflito?: boolean
          created_at?: string
          equivalente: string
          fator?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem?: string | null
          lote_id: string
          principio_ativo: string
          processado?: boolean
          tipo_equivalencia?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          conflito?: boolean
          created_at?: string
          equivalente?: string
          fator?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem?: string | null
          lote_id?: string
          principio_ativo?: string
          processado?: boolean
          tipo_equivalencia?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_med_exames_monitoramento: {
        Row: {
          conduta_se_alterado: string | null
          created_at: string
          fonte_id: string | null
          frequencia: string | null
          id: string
          lote_id: string
          nome_exame: string
          obrigatoriedade: string
          parametro_alvo: string | null
          principio_ativo: string
          tipo_monitoramento: string
          updated_at: string
        }
        Insert: {
          conduta_se_alterado?: string | null
          created_at?: string
          fonte_id?: string | null
          frequencia?: string | null
          id?: string
          lote_id: string
          nome_exame: string
          obrigatoriedade?: string
          parametro_alvo?: string | null
          principio_ativo: string
          tipo_monitoramento?: string
          updated_at?: string
        }
        Update: {
          conduta_se_alterado?: string | null
          created_at?: string
          fonte_id?: string | null
          frequencia?: string | null
          id?: string
          lote_id?: string
          nome_exame?: string
          obrigatoriedade?: string
          parametro_alvo?: string | null
          principio_ativo?: string
          tipo_monitoramento?: string
          updated_at?: string
        }
        Relationships: []
      }
      stg_med_interacao: {
        Row: {
          alternativa: string | null
          classe_1: string | null
          classe_2: string | null
          conduta: string | null
          conflito: string | null
          efeito: string | null
          evidencia: string | null
          fonte_id: string | null
          gravidade: string | null
          id: string
          importado_em: string | null
          linha_origem: string | null
          lote_id: string
          mecanismo: string | null
          momento: string | null
          monitoramento: string | null
          principio_ativo_1: string | null
          principio_ativo_2: string | null
          processado: boolean | null
          risco: string | null
          tipo_interacao: string | null
          trecho_citado: string | null
        }
        Insert: {
          alternativa?: string | null
          classe_1?: string | null
          classe_2?: string | null
          conduta?: string | null
          conflito?: string | null
          efeito?: string | null
          evidencia?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id: string
          mecanismo?: string | null
          momento?: string | null
          monitoramento?: string | null
          principio_ativo_1?: string | null
          principio_ativo_2?: string | null
          processado?: boolean | null
          risco?: string | null
          tipo_interacao?: string | null
          trecho_citado?: string | null
        }
        Update: {
          alternativa?: string | null
          classe_1?: string | null
          classe_2?: string | null
          conduta?: string | null
          conflito?: string | null
          efeito?: string | null
          evidencia?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id?: string
          mecanismo?: string | null
          momento?: string | null
          monitoramento?: string | null
          principio_ativo_1?: string | null
          principio_ativo_2?: string | null
          processado?: boolean | null
          risco?: string | null
          tipo_interacao?: string | null
          trecho_citado?: string | null
        }
        Relationships: []
      }
      stg_med_iv: {
        Row: {
          bolus_permitido: string | null
          concentracao_maxima_mg_ml: string | null
          concentracao_usual_mg_ml: string | null
          conduta_extravasamento: string | null
          diluentes_compativeis: string | null
          diluentes_incompativeis: string | null
          estabilidade_ambiente_horas: string | null
          estabilidade_refrigerado_horas: string | null
          fonte_id: string | null
          fotoprotecao: string | null
          id: string
          importado_em: string | null
          incompatibilidades_y: string | null
          linha_origem: string | null
          lote_id: string
          observacao: string | null
          principio_ativo: string | null
          processado: boolean | null
          requer_bomba: string | null
          requer_filtro: string | null
          risco_extravasamento: string | null
          risco_flebite: string | null
          tempo_minimo_infusao_min: string | null
          tempo_usual_infusao_min: string | null
          trecho_citado: string | null
          velocidade_maxima: string | null
          via_central_obrigatoria: string | null
          volume_minimo_ml: string | null
        }
        Insert: {
          bolus_permitido?: string | null
          concentracao_maxima_mg_ml?: string | null
          concentracao_usual_mg_ml?: string | null
          conduta_extravasamento?: string | null
          diluentes_compativeis?: string | null
          diluentes_incompativeis?: string | null
          estabilidade_ambiente_horas?: string | null
          estabilidade_refrigerado_horas?: string | null
          fonte_id?: string | null
          fotoprotecao?: string | null
          id?: string
          importado_em?: string | null
          incompatibilidades_y?: string | null
          linha_origem?: string | null
          lote_id: string
          observacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          requer_bomba?: string | null
          requer_filtro?: string | null
          risco_extravasamento?: string | null
          risco_flebite?: string | null
          tempo_minimo_infusao_min?: string | null
          tempo_usual_infusao_min?: string | null
          trecho_citado?: string | null
          velocidade_maxima?: string | null
          via_central_obrigatoria?: string | null
          volume_minimo_ml?: string | null
        }
        Update: {
          bolus_permitido?: string | null
          concentracao_maxima_mg_ml?: string | null
          concentracao_usual_mg_ml?: string | null
          conduta_extravasamento?: string | null
          diluentes_compativeis?: string | null
          diluentes_incompativeis?: string | null
          estabilidade_ambiente_horas?: string | null
          estabilidade_refrigerado_horas?: string | null
          fonte_id?: string | null
          fotoprotecao?: string | null
          id?: string
          importado_em?: string | null
          incompatibilidades_y?: string | null
          linha_origem?: string | null
          lote_id?: string
          observacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          requer_bomba?: string | null
          requer_filtro?: string | null
          risco_extravasamento?: string | null
          risco_flebite?: string | null
          tempo_minimo_infusao_min?: string | null
          tempo_usual_infusao_min?: string | null
          trecho_citado?: string | null
          velocidade_maxima?: string | null
          via_central_obrigatoria?: string | null
          volume_minimo_ml?: string | null
        }
        Relationships: []
      }
      stg_med_monitoramento: {
        Row: {
          conduta_se_alterado: string | null
          created_at: string | null
          finalidade_monitoramento: string | null
          fonte_id: string | null
          id: string
          linha_origem: string
          lote_id: string
          momento: string | null
          nome_exame: string
          obrigatorio: boolean | null
          periodicidade: string | null
          principio_ativo: string
          updated_at: string | null
          valor_alvo: string | null
          valor_toxico: string | null
        }
        Insert: {
          conduta_se_alterado?: string | null
          created_at?: string | null
          finalidade_monitoramento?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem: string
          lote_id: string
          momento?: string | null
          nome_exame: string
          obrigatorio?: boolean | null
          periodicidade?: string | null
          principio_ativo: string
          updated_at?: string | null
          valor_alvo?: string | null
          valor_toxico?: string | null
        }
        Update: {
          conduta_se_alterado?: string | null
          created_at?: string | null
          finalidade_monitoramento?: string | null
          fonte_id?: string | null
          id?: string
          linha_origem?: string
          lote_id?: string
          momento?: string | null
          nome_exame?: string
          obrigatorio?: boolean | null
          periodicidade?: string | null
          principio_ativo?: string
          updated_at?: string | null
          valor_alvo?: string | null
          valor_toxico?: string | null
        }
        Relationships: []
      }
      stg_med_populacao: {
        Row: {
          ajuste: string | null
          condicao: string | null
          fonte_id: string | null
          forca_recomendacao: string | null
          id: string
          importado_em: string | null
          linha_origem: string | null
          lote_id: string
          nivel_evidencia: string | null
          populacao: string | null
          principio_ativo: string | null
          processado: boolean | null
          trecho_citado: string | null
        }
        Insert: {
          ajuste?: string | null
          condicao?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id: string
          nivel_evidencia?: string | null
          populacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          trecho_citado?: string | null
        }
        Update: {
          ajuste?: string | null
          condicao?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id?: string
          nivel_evidencia?: string | null
          populacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          trecho_citado?: string | null
        }
        Relationships: []
      }
      stg_med_posologia: {
        Row: {
          ajuste_hepatico: string | null
          ajuste_idoso: string | null
          ajuste_pediatrico: string | null
          ajuste_renal: string | null
          alto_risco: boolean
          created_at: string
          diluicao_padrao: string | null
          dose_maxima: string | null
          dose_padrao: string
          fonte_id: string | null
          frequencia: string | null
          id: string
          indicacao: string | null
          lote_id: string
          populacao: string | null
          principio_ativo: string
          restricoes: string | null
          updated_at: string
          via: string
        }
        Insert: {
          ajuste_hepatico?: string | null
          ajuste_idoso?: string | null
          ajuste_pediatrico?: string | null
          ajuste_renal?: string | null
          alto_risco?: boolean
          created_at?: string
          diluicao_padrao?: string | null
          dose_maxima?: string | null
          dose_padrao: string
          fonte_id?: string | null
          frequencia?: string | null
          id?: string
          indicacao?: string | null
          lote_id: string
          populacao?: string | null
          principio_ativo: string
          restricoes?: string | null
          updated_at?: string
          via: string
        }
        Update: {
          ajuste_hepatico?: string | null
          ajuste_idoso?: string | null
          ajuste_pediatrico?: string | null
          ajuste_renal?: string | null
          alto_risco?: boolean
          created_at?: string
          diluicao_padrao?: string | null
          dose_maxima?: string | null
          dose_padrao?: string
          fonte_id?: string | null
          frequencia?: string | null
          id?: string
          indicacao?: string | null
          lote_id?: string
          populacao?: string | null
          principio_ativo?: string
          restricoes?: string | null
          updated_at?: string
          via?: string
        }
        Relationships: []
      }
      stg_med_principio: {
        Row: {
          alto_risco_ismp: string | null
          categoria_clinica: string | null
          classe_terapeutica: string | null
          codigo_atc: string | null
          codigo_dcb: string | null
          fonte_id: string | null
          id: string
          importado_em: string | null
          lasa_confundido_com: string | null
          linha_origem: string | null
          lote_id: string
          mecanismo_acao: string | null
          na_rename: string | null
          nomes_comerciais_br: string | null
          principio_ativo: string | null
          principio_ativo_en: string | null
          processado: boolean | null
          sinonimos: string | null
          subclasse: string | null
          trecho_citado: string | null
        }
        Insert: {
          alto_risco_ismp?: string | null
          categoria_clinica?: string | null
          classe_terapeutica?: string | null
          codigo_atc?: string | null
          codigo_dcb?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          lasa_confundido_com?: string | null
          linha_origem?: string | null
          lote_id: string
          mecanismo_acao?: string | null
          na_rename?: string | null
          nomes_comerciais_br?: string | null
          principio_ativo?: string | null
          principio_ativo_en?: string | null
          processado?: boolean | null
          sinonimos?: string | null
          subclasse?: string | null
          trecho_citado?: string | null
        }
        Update: {
          alto_risco_ismp?: string | null
          categoria_clinica?: string | null
          classe_terapeutica?: string | null
          codigo_atc?: string | null
          codigo_dcb?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          lasa_confundido_com?: string | null
          linha_origem?: string | null
          lote_id?: string
          mecanismo_acao?: string | null
          na_rename?: string | null
          nomes_comerciais_br?: string | null
          principio_ativo?: string | null
          principio_ativo_en?: string | null
          processado?: boolean | null
          sinonimos?: string | null
          subclasse?: string | null
          trecho_citado?: string | null
        }
        Relationships: []
      }
      stg_med_regulatorio: {
        Row: {
          antimicrobiano_rdc471: string | null
          familia_receituario: string | null
          fonte_id: string | null
          id: string
          importado_em: string | null
          limite_substancias: string | null
          linha_origem: string | null
          lista: string | null
          lote_id: string
          observacao: string | null
          principio_ativo: string | null
          processado: boolean | null
          retencao_via: string | null
          trecho_citado: string | null
          validade_receita_dias: string | null
          vias_receita: string | null
        }
        Insert: {
          antimicrobiano_rdc471?: string | null
          familia_receituario?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          limite_substancias?: string | null
          linha_origem?: string | null
          lista?: string | null
          lote_id: string
          observacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          retencao_via?: string | null
          trecho_citado?: string | null
          validade_receita_dias?: string | null
          vias_receita?: string | null
        }
        Update: {
          antimicrobiano_rdc471?: string | null
          familia_receituario?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          limite_substancias?: string | null
          linha_origem?: string | null
          lista?: string | null
          lote_id?: string
          observacao?: string | null
          principio_ativo?: string | null
          processado?: boolean | null
          retencao_via?: string | null
          trecho_citado?: string | null
          validade_receita_dias?: string | null
          vias_receita?: string | null
        }
        Relationships: []
      }
      stg_med_restricoes: {
        Row: {
          ativo: boolean
          conduta: string | null
          created_at: string
          descricao: string
          fonte_id: string | null
          gravidade: string | null
          id: string
          limite_maximo_unidade: string | null
          limite_maximo_valor: number | null
          limite_periodo: string | null
          linha_origem: string | null
          lote_id: string
          populacao: string | null
          principio_ativo: string
          tipo_restricao: string
          updated_at: string
          via: string | null
        }
        Insert: {
          ativo?: boolean
          conduta?: string | null
          created_at?: string
          descricao: string
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          limite_maximo_unidade?: string | null
          limite_maximo_valor?: number | null
          limite_periodo?: string | null
          linha_origem?: string | null
          lote_id: string
          populacao?: string | null
          principio_ativo: string
          tipo_restricao?: string
          updated_at?: string
          via?: string | null
        }
        Update: {
          ativo?: boolean
          conduta?: string | null
          created_at?: string
          descricao?: string
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          limite_maximo_unidade?: string | null
          limite_maximo_valor?: number | null
          limite_periodo?: string | null
          linha_origem?: string | null
          lote_id?: string
          populacao?: string | null
          principio_ativo?: string
          tipo_restricao?: string
          updated_at?: string
          via?: string | null
        }
        Relationships: []
      }
      stg_patologia_exames: {
        Row: {
          aplica_gestante: string | null
          conduta_se_alterado: string | null
          conflito: string | null
          contextos: string | null
          created_at: string
          criterio_positividade: string | null
          finalidade: string | null
          fonte_id: string | null
          forca_recomendacao: string | null
          id: string
          idade_max_anos: string | null
          idade_min_anos: string | null
          importado_em: string | null
          interpretacao_esperada: string | null
          justificativa_padrao: string | null
          linha_bruta: string | null
          linha_origem: string | null
          linha_recomendacao: string | null
          lote_id: string | null
          momento_solicitacao: string | null
          momento_solicitation: string | null
          nao_solicitar_se: string | null
          nivel_evidencia: string | null
          nome_exame: string | null
          nome_patologia: string | null
          obrigatoriedade: string | null
          processado: boolean | null
          repetir_em_horas: string | null
          sexo_alvo: string | null
          subtipo: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          aplica_gestante?: string | null
          conduta_se_alterado?: string | null
          conflito?: string | null
          contextos?: string | null
          created_at?: string
          criterio_positividade?: string | null
          finalidade?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_max_anos?: string | null
          idade_min_anos?: string | null
          importado_em?: string | null
          interpretacao_esperada?: string | null
          justificativa_padrao?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          linha_recomendacao?: string | null
          lote_id?: string | null
          momento_solicitacao?: string | null
          momento_solicitation?: string | null
          nao_solicitar_se?: string | null
          nivel_evidencia?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
          obrigatoriedade?: string | null
          processado?: boolean | null
          repetir_em_horas?: string | null
          sexo_alvo?: string | null
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          aplica_gestante?: string | null
          conduta_se_alterado?: string | null
          conflito?: string | null
          contextos?: string | null
          created_at?: string
          criterio_positividade?: string | null
          finalidade?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_max_anos?: string | null
          idade_min_anos?: string | null
          importado_em?: string | null
          interpretacao_esperada?: string | null
          justificativa_padrao?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          linha_recomendacao?: string | null
          lote_id?: string | null
          momento_solicitacao?: string | null
          momento_solicitation?: string | null
          nao_solicitar_se?: string | null
          nivel_evidencia?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
          obrigatoriedade?: string | null
          processado?: boolean | null
          repetir_em_horas?: string | null
          sexo_alvo?: string | null
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_patologias: {
        Row: {
          categoria_clinica: string | null
          cid10: string | null
          cid11: string | null
          contexto_predominante: string | null
          created_at: string
          fonte_id: string | null
          id: string
          importado_em: string | null
          is_emergencia: string | null
          linha_bruta: string | null
          linha_origem: string | null
          lote_id: string | null
          nome_patologia: string | null
          patologia_pai: string | null
          processado: boolean | null
          sinonimos: string | null
          subtipo: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          categoria_clinica?: string | null
          cid10?: string | null
          cid11?: string | null
          contexto_predominante?: string | null
          created_at?: string
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          is_emergencia?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          lote_id?: string | null
          nome_patologia?: string | null
          patologia_pai?: string | null
          processado?: boolean | null
          sinonimos?: string | null
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          categoria_clinica?: string | null
          cid10?: string | null
          cid11?: string | null
          contexto_predominante?: string | null
          created_at?: string
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          is_emergencia?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          lote_id?: string | null
          nome_patologia?: string | null
          patologia_pai?: string | null
          processado?: boolean | null
          sinonimos?: string | null
          subtipo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_protocolo_checklist: {
        Row: {
          ativo: boolean
          created_at: string
          detalhe: string | null
          etapa_ordem: number
          etapa_titulo: string
          fonte_id: string | null
          id: string
          item_nome: string
          item_tipo: string
          lote_id: string
          nome_patologia: string
          obrigatoriedade: string | null
          observacao: string | null
          tempo_alvo_min: number | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          detalhe?: string | null
          etapa_ordem?: number
          etapa_titulo: string
          fonte_id?: string | null
          id?: string
          item_nome: string
          item_tipo?: string
          lote_id: string
          nome_patologia: string
          obrigatoriedade?: string | null
          observacao?: string | null
          tempo_alvo_min?: number | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          detalhe?: string | null
          etapa_ordem?: number
          etapa_titulo?: string
          fonte_id?: string | null
          id?: string
          item_nome?: string
          item_tipo?: string
          lote_id?: string
          nome_patologia?: string
          obrigatoriedade?: string | null
          observacao?: string | null
          tempo_alvo_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_protocolos: {
        Row: {
          alertas_seguranca: string | null
          area_clinica: string | null
          cid10: string | null
          condutas_iniciais: string | null
          contexto_atendimento: string | null
          contraindicacoes_relevantes: string | null
          criterios_encaminhamento: string | null
          criterios_internacao: string | null
          cuidados_enfermagem: string | null
          diagnosticos_diferenciais: string | null
          exames_sugeridos: string | null
          fonte_id: string | null
          id: string
          importado_em: string | null
          linha_bruta: string | null
          linha_origem: string | null
          lote_id: string
          medicamentos_sugeridos: string | null
          medidas_nao_farmacologicas: string | null
          nome_patologia: string | null
          nome_protocolo: string | null
          orientacoes_paciente: string | null
          populacao_alvo: string | null
          processado: boolean | null
          sinais_gravidade: string | null
          sinais_retorno_imediato: string | null
          tipo_protocolo: string | null
          trecho_citado: string | null
        }
        Insert: {
          alertas_seguranca?: string | null
          area_clinica?: string | null
          cid10?: string | null
          condutas_iniciais?: string | null
          contexto_atendimento?: string | null
          contraindicacoes_relevantes?: string | null
          criterios_encaminhamento?: string | null
          criterios_internacao?: string | null
          cuidados_enfermagem?: string | null
          diagnosticos_diferenciais?: string | null
          exames_sugeridos?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          lote_id: string
          medicamentos_sugeridos?: string | null
          medidas_nao_farmacologicas?: string | null
          nome_patologia?: string | null
          nome_protocolo?: string | null
          orientacoes_paciente?: string | null
          populacao_alvo?: string | null
          processado?: boolean | null
          sinais_gravidade?: string | null
          sinais_retorno_imediato?: string | null
          tipo_protocolo?: string | null
          trecho_citado?: string | null
        }
        Update: {
          alertas_seguranca?: string | null
          area_clinica?: string | null
          cid10?: string | null
          condutas_iniciais?: string | null
          contexto_atendimento?: string | null
          contraindicacoes_relevantes?: string | null
          criterios_encaminhamento?: string | null
          criterios_internacao?: string | null
          cuidados_enfermagem?: string | null
          diagnosticos_diferenciais?: string | null
          exames_sugeridos?: string | null
          fonte_id?: string | null
          id?: string
          importado_em?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          lote_id?: string
          medicamentos_sugeridos?: string | null
          medidas_nao_farmacologicas?: string | null
          nome_patologia?: string | null
          nome_protocolo?: string | null
          orientacoes_paciente?: string | null
          populacao_alvo?: string | null
          processado?: boolean | null
          sinais_gravidade?: string | null
          sinais_retorno_imediato?: string | null
          tipo_protocolo?: string | null
          trecho_citado?: string | null
        }
        Relationships: []
      }
      stg_rastreamentos: {
        Row: {
          acao_se_positivo: string | null
          condicao_de_risco: string | null
          conflito: string | null
          created_at: string
          divergencia_internacional: string | null
          exame_metodo: string | null
          fonte_id: string | null
          forca_recomendacao: string | null
          id: string
          idade_fim: string | null
          idade_inicio: string | null
          incorporado_sus: string | null
          intervalo_meses: string | null
          linha_bruta: string | null
          linha_origem: string | null
          lote_id: string | null
          nivel_evidencia: string | null
          nome_rastreamento: string | null
          orgao_emissor: string | null
          patologia_alvo: string | null
          populacao_alvo: string | null
          sexo_alvo: string | null
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          acao_se_positivo?: string | null
          condicao_de_risco?: string | null
          conflito?: string | null
          created_at?: string
          divergencia_internacional?: string | null
          exame_metodo?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_fim?: string | null
          idade_inicio?: string | null
          incorporado_sus?: string | null
          intervalo_meses?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          lote_id?: string | null
          nivel_evidencia?: string | null
          nome_rastreamento?: string | null
          orgao_emissor?: string | null
          patologia_alvo?: string | null
          populacao_alvo?: string | null
          sexo_alvo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          acao_se_positivo?: string | null
          condicao_de_risco?: string | null
          conflito?: string | null
          created_at?: string
          divergencia_internacional?: string | null
          exame_metodo?: string | null
          fonte_id?: string | null
          forca_recomendacao?: string | null
          id?: string
          idade_fim?: string | null
          idade_inicio?: string | null
          incorporado_sus?: string | null
          intervalo_meses?: string | null
          linha_bruta?: string | null
          linha_origem?: string | null
          lote_id?: string | null
          nivel_evidencia?: string | null
          nome_rastreamento?: string | null
          orgao_emissor?: string | null
          patologia_alvo?: string | null
          populacao_alvo?: string | null
          sexo_alvo?: string | null
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_regras_override_red_flag: {
        Row: {
          acao_override: string
          ativo: boolean | null
          contexto: string
          created_at: string
          escore_nao_pode: string
          escore_nome: string
          fonte_id: string | null
          id: number
          lote_id: string
          nivel_gate: string
          prioridade: number | null
          red_flag: string
          red_flag_descricao: string | null
          regra_id: string
          trecho_citado: string | null
          updated_at: string
        }
        Insert: {
          acao_override: string
          ativo?: boolean | null
          contexto: string
          created_at?: string
          escore_nao_pode: string
          escore_nome: string
          fonte_id?: string | null
          id?: number
          lote_id: string
          nivel_gate: string
          prioridade?: number | null
          red_flag: string
          red_flag_descricao?: string | null
          regra_id: string
          trecho_citado?: string | null
          updated_at?: string
        }
        Update: {
          acao_override?: string
          ativo?: boolean | null
          contexto?: string
          created_at?: string
          escore_nao_pode?: string
          escore_nome?: string
          fonte_id?: string | null
          id?: number
          lote_id?: string
          nivel_gate?: string
          prioridade?: number | null
          red_flag?: string
          red_flag_descricao?: string | null
          regra_id?: string
          trecho_citado?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stg_sinais_alarme: {
        Row: {
          conduta: string | null
          descricao_sinal_medico: string | null
          descricao_sinal_paciente: string | null
          fonte_id: string | null
          gravidade: string | null
          id: string
          importado_em: string | null
          linha_origem: string | null
          lote_id: string
          processado: boolean | null
          sistema: string | null
          tempo_maximo_acao_horas: string | null
          trecho_citado: string | null
        }
        Insert: {
          conduta?: string | null
          descricao_sinal_medico?: string | null
          descricao_sinal_paciente?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id: string
          processado?: boolean | null
          sistema?: string | null
          tempo_maximo_acao_horas?: string | null
          trecho_citado?: string | null
        }
        Update: {
          conduta?: string | null
          descricao_sinal_medico?: string | null
          descricao_sinal_paciente?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          id?: string
          importado_em?: string | null
          linha_origem?: string | null
          lote_id?: string
          processado?: boolean | null
          sistema?: string | null
          tempo_maximo_acao_horas?: string | null
          trecho_citado?: string | null
        }
        Relationships: []
      }
      stg_sugestoes_escore_contexto: {
        Row: {
          ativo: boolean | null
          contexto: string
          created_at: string
          escore_nome: string
          fonte_id: string | null
          id: number
          lote_id: string
          motivo: string | null
          populacao_validada: string | null
          prioridade: number | null
          sindrome: string | null
          tipo_sugestao: string
          trecho_citado: string | null
          updated_at: string
          versao_escore: string | null
        }
        Insert: {
          ativo?: boolean | null
          contexto: string
          created_at?: string
          escore_nome: string
          fonte_id?: string | null
          id?: number
          lote_id: string
          motivo?: string | null
          populacao_validada?: string | null
          prioridade?: number | null
          sindrome?: string | null
          tipo_sugestao: string
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Update: {
          ativo?: boolean | null
          contexto?: string
          created_at?: string
          escore_nome?: string
          fonte_id?: string | null
          id?: number
          lote_id?: string
          motivo?: string | null
          populacao_validada?: string | null
          prioridade?: number | null
          sindrome?: string | null
          tipo_sugestao?: string
          trecho_citado?: string | null
          updated_at?: string
          versao_escore?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      templates_settings: {
        Row: {
          alertar_modelo_sem_revisao_12m: boolean
          bloquear_alerta_critico: boolean
          cruzar_seguranca_antes_aplicar: boolean
          exigir_just_alerta_alto: boolean
          exigir_revisao_modelos_institucionais: boolean
          id: string
          permitir_modelos_institucionais: boolean
          permitir_modelos_pessoais: boolean
          permitir_salvar_prescricao_como_modelo: boolean
          remover_dados_paciente_auto: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          alertar_modelo_sem_revisao_12m?: boolean
          bloquear_alerta_critico?: boolean
          cruzar_seguranca_antes_aplicar?: boolean
          exigir_just_alerta_alto?: boolean
          exigir_revisao_modelos_institucionais?: boolean
          id?: string
          permitir_modelos_institucionais?: boolean
          permitir_modelos_pessoais?: boolean
          permitir_salvar_prescricao_como_modelo?: boolean
          remover_dados_paciente_auto?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          alertar_modelo_sem_revisao_12m?: boolean
          bloquear_alerta_critico?: boolean
          cruzar_seguranca_antes_aplicar?: boolean
          exigir_just_alerta_alto?: boolean
          exigir_revisao_modelos_institucionais?: boolean
          id?: string
          permitir_modelos_institucionais?: boolean
          permitir_modelos_pessoais?: boolean
          permitir_salvar_prescricao_como_modelo?: boolean
          remover_dados_paciente_auto?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      termos_aprendizado_ia: {
        Row: {
          atualizado_em: string
          contexto: string | null
          criado_em: string
          id: string
          observacao: string | null
          principio_ativo_relacionado: string | null
          revisado_por: string | null
          status: Database["public"]["Enums"]["aprendizado_termo_status"]
          sugerido_por: string
          termo_corrigido: string
          termo_original: string
        }
        Insert: {
          atualizado_em?: string
          contexto?: string | null
          criado_em?: string
          id?: string
          observacao?: string | null
          principio_ativo_relacionado?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["aprendizado_termo_status"]
          sugerido_por: string
          termo_corrigido: string
          termo_original: string
        }
        Update: {
          atualizado_em?: string
          contexto?: string | null
          criado_em?: string
          id?: string
          observacao?: string | null
          principio_ativo_relacionado?: string | null
          revisado_por?: string | null
          status?: Database["public"]["Enums"]["aprendizado_termo_status"]
          sugerido_por?: string
          termo_corrigido?: string
          termo_original?: string
        }
        Relationships: []
      }
      testes_clinicos: {
        Row: {
          alerta_esperado: Json
          categoria: string | null
          created_at: string
          criado_por: string | null
          data_hora_execucao: string | null
          descricao: string | null
          exames_documentos: Json
          id: string
          medicamentos_prescritos: Json
          nome_do_teste: string
          observacoes: string | null
          paciente_simulado: Json
          resultado_obtido: Json | null
          status: Database["public"]["Enums"]["teste_clinico_status"]
          testado_por: string | null
          updated_at: string
        }
        Insert: {
          alerta_esperado?: Json
          categoria?: string | null
          created_at?: string
          criado_por?: string | null
          data_hora_execucao?: string | null
          descricao?: string | null
          exames_documentos?: Json
          id?: string
          medicamentos_prescritos?: Json
          nome_do_teste: string
          observacoes?: string | null
          paciente_simulado?: Json
          resultado_obtido?: Json | null
          status?: Database["public"]["Enums"]["teste_clinico_status"]
          testado_por?: string | null
          updated_at?: string
        }
        Update: {
          alerta_esperado?: Json
          categoria?: string | null
          created_at?: string
          criado_por?: string | null
          data_hora_execucao?: string | null
          descricao?: string | null
          exames_documentos?: Json
          id?: string
          medicamentos_prescritos?: Json
          nome_do_teste?: string
          observacoes?: string | null
          paciente_simulado?: Json
          resultado_obtido?: Json | null
          status?: Database["public"]["Enums"]["teste_clinico_status"]
          testado_por?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testes_clinicos_configs: {
        Row: {
          exigir_criticos_aprovados: boolean
          gerar_log_execucao: boolean
          id: number
          mostrar_no_menu_lateral: boolean
          mostrar_resumo_prontidao_beta: boolean
          permitir_ignorar_com_justificativa: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          exigir_criticos_aprovados?: boolean
          gerar_log_execucao?: boolean
          id?: number
          mostrar_no_menu_lateral?: boolean
          mostrar_resumo_prontidao_beta?: boolean
          permitir_ignorar_com_justificativa?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          exigir_criticos_aprovados?: boolean
          gerar_log_execucao?: boolean
          id?: number
          mostrar_no_menu_lateral?: boolean
          mostrar_resumo_prontidao_beta?: boolean
          permitir_ignorar_com_justificativa?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      testes_clinicos_v2: {
        Row: {
          alerta_esperado: string | null
          categoria_teste: string
          codigo: string
          comportamento_esperado: string | null
          created_at: string
          critico: boolean
          dados_paciente_simulado: Json | null
          data_hora_teste: string | null
          descricao: string | null
          documentos_simulados: Json | null
          entrada_inteligente_simulada: string | null
          exames_simulados: Json | null
          id: string
          justificativa_ignorar: string | null
          medicamentos_simulados: Json | null
          nome_teste: string
          observacao: string | null
          ordem: number
          resultado_obtido: string | null
          status_teste: string
          testado_por: string | null
          updated_at: string
        }
        Insert: {
          alerta_esperado?: string | null
          categoria_teste: string
          codigo: string
          comportamento_esperado?: string | null
          created_at?: string
          critico?: boolean
          dados_paciente_simulado?: Json | null
          data_hora_teste?: string | null
          descricao?: string | null
          documentos_simulados?: Json | null
          entrada_inteligente_simulada?: string | null
          exames_simulados?: Json | null
          id?: string
          justificativa_ignorar?: string | null
          medicamentos_simulados?: Json | null
          nome_teste: string
          observacao?: string | null
          ordem?: number
          resultado_obtido?: string | null
          status_teste?: string
          testado_por?: string | null
          updated_at?: string
        }
        Update: {
          alerta_esperado?: string | null
          categoria_teste?: string
          codigo?: string
          comportamento_esperado?: string | null
          created_at?: string
          critico?: boolean
          dados_paciente_simulado?: Json | null
          data_hora_teste?: string | null
          descricao?: string | null
          documentos_simulados?: Json | null
          entrada_inteligente_simulada?: string | null
          exames_simulados?: Json | null
          id?: string
          justificativa_ignorar?: string | null
          medicamentos_simulados?: Json | null
          nome_teste?: string
          observacao?: string | null
          ordem?: number
          resultado_obtido?: string | null
          status_teste?: string
          testado_por?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      uso_eventos: {
        Row: {
          criado_em: string
          detalhe: Json
          id: string
          recurso: string | null
          rota: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          criado_em?: string
          detalhe?: Json
          id?: string
          recurso?: string | null
          rota?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          criado_em?: string
          detalhe?: Json
          id?: string
          recurso?: string | null
          rota?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_alertas_qualidade_medicamento: {
        Row: {
          detalhe: string | null
          medicamento_id: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_apresentacao_completa: {
        Row: {
          apresentacao_id: string | null
          apresentacao_texto: string | null
          ativo: boolean | null
          concentracao: string | null
          forma_farmaceutica: string | null
          medicamento_id: string | null
          principio_ativo: string | null
          revisada: boolean | null
          rotulo: string | null
          status_revisao: string | null
          total_doses: number | null
          unidade_concentracao: string | null
          unidade_volume: string | null
          uso_adulto: boolean | null
          uso_pediatrico: boolean | null
          utilizavel: boolean | null
          via: string | null
          volume: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "base_apresentacoes_medicamentos_id_medicamento_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      vw_calculo_escores_divergencias: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_real: string | null
          conduta_sugerida: string | null
          data_hora: string | null
          divergencia: boolean | null
          motivo_override: string | null
          nome_escore: string | null
          resultado: number | null
        }
        Insert: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_real?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          divergencia?: boolean | null
          motivo_override?: string | null
          nome_escore?: string | null
          resultado?: number | null
        }
        Update: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_real?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          divergencia?: boolean | null
          motivo_override?: string | null
          nome_escore?: string | null
          resultado?: number | null
        }
        Relationships: []
      }
      vw_calculo_escores_entradas_incompletas: {
        Row: {
          entradas_incompletas: number | null
          nome_escore: string | null
          taxa_incompleta_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_calculo_escores_overrides: {
        Row: {
          nome_escore: string | null
          overrides: number | null
          taxa_override_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_calculo_escores_populacao_invalida: {
        Row: {
          nome_escore: string | null
          populacao_invalida: number | null
          taxa_invalida_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_dashboard_escores: {
        Row: {
          calculos_entradas_completas: number | null
          calculos_populacao_valida: number | null
          total_calculos: number | null
          total_divergencias: number | null
          total_escores_catalogados: number | null
          total_escores_usados: number | null
          total_overrides: number | null
        }
        Relationships: []
      }
      vw_dashboard_escores_global: {
        Row: {
          total_calculos: number | null
          total_calculos_invalidos: number | null
          total_calculos_validos: number | null
          total_divergencias: number | null
          total_dor: number | null
          total_entradas_incompletas: number | null
          total_geriatricos: number | null
          total_obstetricos: number | null
          total_overrides: number | null
          total_pediatricos: number | null
        }
        Relationships: []
      }
      vw_dashboard_escores_global_completo: {
        Row: {
          taxa_global_validacao_pct: number | null
          total_calculos_invalidos: number | null
          total_calculos_validos: number | null
          total_cirurgicos: number | null
          total_dor: number | null
          total_entradas_incompletas: number | null
          total_geriatricos: number | null
          total_obstetricos: number | null
          total_pediatricos: number | null
          total_trauma: number | null
        }
        Relationships: []
      }
      vw_dashboard_escores_global_final: {
        Row: {
          taxa_global_validacao_pct: number | null
          total_calculos_invalidos: number | null
          total_calculos_validos: number | null
          total_cirurgicos: number | null
          total_dor: number | null
          total_entradas_incompletas: number | null
          total_geriatricos: number | null
          total_intervencionistas: number | null
          total_obstetricos: number | null
          total_pediatricos: number | null
          total_sangramento: number | null
          total_trauma: number | null
        }
        Relationships: []
      }
      vw_dashboard_global_final: {
        Row: {
          taxa_global_entradas_completas_pct: number | null
          taxa_global_validacao_pct: number | null
          total_bloqueados: number | null
          total_calculos_invalidos: number | null
          total_calculos_validos: number | null
          total_cirurgicos: number | null
          total_dor: number | null
          total_entradas_incompletas: number | null
          total_geriatricos: number | null
          total_intervencionistas: number | null
          total_obstetricos: number | null
          total_overrides: number | null
          total_pediatricos: number | null
          total_regras_override: number | null
          total_sangramento: number | null
          total_sugestoes: number | null
          total_trauma: number | null
        }
        Relationships: []
      }
      vw_dashboard_indicadores: {
        Row: {
          codigo_indicador: string | null
          codigo_protocolo: string | null
          meta_pct: string | null
          nome: string | null
          periodicidade: string | null
          protocolo_nome: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_escores_bloqueados: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_sugerida: string | null
          data_hora: string | null
          nome_escore: string | null
          populacao_validada: boolean | null
        }
        Insert: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          nome_escore?: string | null
          populacao_validada?: boolean | null
        }
        Update: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          nome_escore?: string | null
          populacao_validada?: boolean | null
        }
        Relationships: []
      }
      vw_escores_divergencia_conduta: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_real: string | null
          conduta_sugerida: string | null
          data_hora: string | null
          id: number | null
          motivo_override: string | null
          nome_escore: string | null
          profissional: string | null
          resultado: number | null
          versao: string | null
        }
        Relationships: []
      }
      vw_escores_divergencias: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_real: string | null
          conduta_sugerida: string | null
          data_hora: string | null
          motivo_override: string | null
          nome_escore: string | null
          resultado: number | null
        }
        Insert: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_real?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          motivo_override?: string | null
          nome_escore?: string | null
          resultado?: number | null
        }
        Update: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_real?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          motivo_override?: string | null
          nome_escore?: string | null
          resultado?: number | null
        }
        Relationships: []
      }
      vw_escores_dor_resumo: {
        Row: {
          entradas_completas: number | null
          nome_escore: string | null
          populacao_valida: number | null
          resultado_maximo: number | null
          resultado_medio: number | null
          taxa_entradas_completas_pct: number | null
          taxa_populacao_valida_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_escores_intervencionistas_resumo: {
        Row: {
          entradas_completas: number | null
          nome_escore: string | null
          populacao_valida: number | null
          resultado_maximo: number | null
          resultado_medio: number | null
          taxa_entradas_completas_pct: number | null
          taxa_populacao_valida_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_escores_intervencionistas_uso_inadequado: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_sugerida: string | null
          data_hora: string | null
          nome_escore: string | null
          populacao_validada: boolean | null
          resultado: number | null
        }
        Relationships: []
      }
      vw_escores_obstetricos_resumo: {
        Row: {
          entradas_completas: number | null
          nome_escore: string | null
          populacao_valida: number | null
          taxa_entradas_completas_pct: number | null
          taxa_populacao_valida_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_escores_overrides: {
        Row: {
          nome_escore: string | null
          overrides: number | null
          taxa_override_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_escores_overrides_red_flag: {
        Row: {
          nome_escore: string | null
          pct_overrides: number | null
          total_calculos: number | null
          total_overrides: number | null
        }
        Relationships: []
      }
      vw_escores_resumo_global: {
        Row: {
          atendimentos_com_divergencia: number | null
          atendimentos_com_override: number | null
          total_atendimentos_auditados: number | null
          total_escores_catalogados: number | null
          total_gatilhos: number | null
          total_itens: number | null
        }
        Relationships: []
      }
      vw_escores_sangramento_resumo: {
        Row: {
          entradas_completas: number | null
          nome_escore: string | null
          populacao_valida: number | null
          resultado_maximo: number | null
          resultado_medio: number | null
          taxa_entradas_completas_pct: number | null
          taxa_populacao_valida_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_escores_sangramento_uso_inadequado: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_sugerida: string | null
          data_hora: string | null
          nome_escore: string | null
          populacao_validada: boolean | null
          resultado: number | null
        }
        Relationships: []
      }
      vw_escores_sem_auditoria: {
        Row: {
          especialidade: string | null
          nome_escore: string | null
          populacao_alvo: string | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_escores_taxa_populacao_correta: {
        Row: {
          nome_escore: string | null
          populacao_invalida: number | null
          populacao_valida: number | null
          taxa_validacao_pct: number | null
          total_calculos: number | null
        }
        Relationships: []
      }
      vw_etl_consistencia: {
        Row: {
          diferenca: number | null
          pct_promovido: number | null
          status: string | null
          tabela_destino: string | null
          tabela_origem: string | null
          total_base: number | null
          total_staging: number | null
        }
        Relationships: []
      }
      vw_exames_quase_duplicados: {
        Row: {
          id_a: string | null
          id_b: string | null
          lote_id: string | null
          nome_a: string | null
          nome_b: string | null
          sigla_a: string | null
          sigla_b: string | null
        }
        Relationships: []
      }
      vw_exames_sem_vinculo: {
        Row: {
          categoria: string | null
          lote_id: string | null
          nome_exame: string | null
          tipo_exame: string | null
        }
        Insert: {
          categoria?: string | null
          lote_id?: string | null
          nome_exame?: string | null
          tipo_exame?: string | null
        }
        Update: {
          categoria?: string | null
          lote_id?: string | null
          nome_exame?: string | null
          tipo_exame?: string | null
        }
        Relationships: []
      }
      vw_indicadores_ps_mensal: {
        Row: {
          codigo_indicador: string | null
          codigo_protocolo: string | null
          denominador: number | null
          indicador_id: number | null
          lote_id: string | null
          mes: string | null
          meta_operador: string | null
          meta_pct: string | null
          meta_valor: number | null
          nome: string | null
          numerador: number | null
          percentual: number | null
          protocolo_id: string | null
          protocolo_nome: string | null
          tipo: string | null
        }
        Relationships: []
      }
      vw_integracao_escore_protocolo: {
        Row: {
          acao_disparada: string | null
          escore_nome: string | null
          faixa_gatilho: string | null
          fonte_id: string | null
          nivel_gate: string | null
          ordem_na_cadeia: number | null
          override_por_red_flag: boolean | null
          populacao_validada: string | null
          protocolo_codigo: string | null
          tipo_integracao: string | null
          versao_escore: string | null
        }
        Insert: {
          acao_disparada?: string | null
          escore_nome?: string | null
          faixa_gatilho?: string | null
          fonte_id?: string | null
          nivel_gate?: string | null
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean | null
          populacao_validada?: string | null
          protocolo_codigo?: string | null
          tipo_integracao?: string | null
          versao_escore?: string | null
        }
        Update: {
          acao_disparada?: string | null
          escore_nome?: string | null
          faixa_gatilho?: string | null
          fonte_id?: string | null
          nivel_gate?: string | null
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean | null
          populacao_validada?: string | null
          protocolo_codigo?: string | null
          tipo_integracao?: string | null
          versao_escore?: string | null
        }
        Relationships: []
      }
      vw_integracao_fluxos: {
        Row: {
          acao_disparada: string | null
          escore_aplicado: string | null
          estado_atual: string | null
          faixa_gatilho: string | null
          fonte_id: string | null
          ordem_na_cadeia: number | null
          override_por_red_flag: boolean | null
          patologia: string | null
          protocolo_codigo: string | null
          proximo_estado: string | null
        }
        Insert: {
          acao_disparada?: string | null
          escore_aplicado?: string | null
          estado_atual?: string | null
          faixa_gatilho?: string | null
          fonte_id?: string | null
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean | null
          patologia?: string | null
          protocolo_codigo?: string | null
          proximo_estado?: string | null
        }
        Update: {
          acao_disparada?: string | null
          escore_aplicado?: string | null
          estado_atual?: string | null
          faixa_gatilho?: string | null
          fonte_id?: string | null
          ordem_na_cadeia?: number | null
          override_por_red_flag?: boolean | null
          patologia?: string | null
          protocolo_codigo?: string | null
          proximo_estado?: string | null
        }
        Relationships: []
      }
      vw_integracao_overrides: {
        Row: {
          acao_override: string | null
          contexto: string | null
          escore_nao_pode: string | null
          escore_nome: string | null
          fonte_id: string | null
          nivel_gate: string | null
          prioridade: number | null
          red_flag: string | null
          red_flag_descricao: string | null
        }
        Insert: {
          acao_override?: string | null
          contexto?: string | null
          escore_nao_pode?: string | null
          escore_nome?: string | null
          fonte_id?: string | null
          nivel_gate?: string | null
          prioridade?: number | null
          red_flag?: string | null
          red_flag_descricao?: string | null
        }
        Update: {
          acao_override?: string | null
          contexto?: string | null
          escore_nao_pode?: string | null
          escore_nome?: string | null
          fonte_id?: string | null
          nivel_gate?: string | null
          prioridade?: number | null
          red_flag?: string | null
          red_flag_descricao?: string | null
        }
        Relationships: []
      }
      vw_integracao_resumo_global: {
        Row: {
          total_escores_integrados: number | null
          total_fluxos_decisao: number | null
          total_overrides: number | null
          total_patologias_com_fluxo: number | null
          total_protocolos_integrados: number | null
          total_regras_integracao: number | null
        }
        Relationships: []
      }
      vw_med_interacoes_criticas: {
        Row: {
          conduta: string | null
          efeito: string | null
          gravidade: string | null
          mecanismo: string | null
          principio_ativo_1: string | null
          principio_ativo_2: string | null
        }
        Insert: {
          conduta?: string | null
          efeito?: string | null
          gravidade?: string | null
          mecanismo?: string | null
          principio_ativo_1?: string | null
          principio_ativo_2?: string | null
        }
        Update: {
          conduta?: string | null
          efeito?: string | null
          gravidade?: string | null
          mecanismo?: string | null
          principio_ativo_1?: string | null
          principio_ativo_2?: string | null
        }
        Relationships: []
      }
      vw_med_sem_dose: {
        Row: {
          classe_terapeutica: string | null
          principio_ativo: string | null
        }
        Insert: {
          classe_terapeutica?: string | null
          principio_ativo?: string | null
        }
        Update: {
          classe_terapeutica?: string | null
          principio_ativo?: string | null
        }
        Relationships: []
      }
      vw_med_sem_iv: {
        Row: {
          classe_terapeutica: string | null
          principio_ativo: string | null
        }
        Insert: {
          classe_terapeutica?: string | null
          principio_ativo?: string | null
        }
        Update: {
          classe_terapeutica?: string | null
          principio_ativo?: string | null
        }
        Relationships: []
      }
      vw_med_total_por_classe: {
        Row: {
          alto_risco: number | null
          classe_terapeutica: string | null
          total_farmacos: number | null
        }
        Relationships: []
      }
      vw_medicamento_completo: {
        Row: {
          alerta_gestacao:
            | Database["public"]["Enums"]["medicamento_alerta_gest_lact"]
            | null
          alto_risco: boolean | null
          antimicrobiano: boolean | null
          apresentacao: string | null
          apresentacao_autoselecionavel: boolean | null
          apresentacao_incompleta: boolean | null
          apresentacao_rotulo: string | null
          apresentacao_unica_id: string | null
          apresentacoes_disponiveis: number | null
          ativo: boolean | null
          busca_normalizada: string | null
          categoria_clinica:
            | Database["public"]["Enums"]["medicamento_categoria_clinica"]
            | null
          classe_terapeutica: string | null
          concentracao: string | null
          dose_adulto: string | null
          dose_incompleta: boolean | null
          dose_maxima_dia: string | null
          dose_pediatrica: string | null
          duracao: string | null
          forma_farmaceutica: string | null
          frequencia: string | null
          id: string | null
          nome_comercial_referencia: string | null
          observacao_dose: string | null
          posologia_texto: string | null
          principio_ativo: string | null
          status_revisao:
            | Database["public"]["Enums"]["medicamento_status_revisao"]
            | null
          subclasse_terapeutica: string | null
          tem_posologia: boolean | null
          tipo_receita:
            | Database["public"]["Enums"]["medicamento_tipo_receita"]
            | null
          total_apresentacoes: number | null
          total_doses: number | null
          unidade_concentracao: string | null
          via_administracao: string | null
        }
        Relationships: []
      }
      vw_medicamento_liberado: {
        Row: {
          apresentacao_id: string | null
          dose_id: string | null
          medicamento_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "base_apresentacoes_medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_apresentacao_completa"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["apresentacao_unica_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_apresentacao_id_fkey"
            columns: ["apresentacao_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["apresentacao_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_dose"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_dose_id_fkey"
            columns: ["dose_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["dose_id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "base_medicamentos_geral"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_completo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_medicamento_qualidade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medicamento_revisao_clinica_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "vw_revisao_clinica_itens"
            referencedColumns: ["medicamento_id"]
          },
        ]
      }
      vw_medicamento_qualidade: {
        Row: {
          alertas_qualidade: number | null
          apresentacoes: number | null
          apresentacoes_revisadas: number | null
          apresentacoes_utilizaveis: number | null
          ativo: boolean | null
          classe_terapeutica: string | null
          doses: number | null
          doses_com_posologia: number | null
          doses_revisadas: number | null
          id: string | null
          principio_ativo: string | null
          status_funcional: string | null
          tipos_alerta: string[] | null
        }
        Relationships: []
      }
      vw_overrides_aplicados: {
        Row: {
          atendimento_id: string | null
          categoria: string | null
          conduta_sugerida: string | null
          data_hora: string | null
          nome_escore: string | null
          populacao_validada: boolean | null
        }
        Insert: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          nome_escore?: string | null
          populacao_validada?: boolean | null
        }
        Update: {
          atendimento_id?: string | null
          categoria?: string | null
          conduta_sugerida?: string | null
          data_hora?: string | null
          nome_escore?: string | null
          populacao_validada?: boolean | null
        }
        Relationships: []
      }
      vw_patologias_sem_vinculo: {
        Row: {
          categoria_clinica: string | null
          is_emergencia: string | null
          lote_id: string | null
          nome_patologia: string | null
        }
        Insert: {
          categoria_clinica?: string | null
          is_emergencia?: string | null
          lote_id?: string | null
          nome_patologia?: string | null
        }
        Update: {
          categoria_clinica?: string | null
          is_emergencia?: string | null
          lote_id?: string | null
          nome_patologia?: string | null
        }
        Relationships: []
      }
      vw_ps_interacoes_criticas: {
        Row: {
          conduta: string | null
          efeito_clinico: string | null
          fonte_id: string | null
          gravidade: string | null
          mecanismo: string | null
          principio_ativo_a: string | null
          principio_ativo_b: string | null
        }
        Insert: {
          conduta?: string | null
          efeito_clinico?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          mecanismo?: string | null
          principio_ativo_a?: string | null
          principio_ativo_b?: string | null
        }
        Update: {
          conduta?: string | null
          efeito_clinico?: string | null
          fonte_id?: string | null
          gravidade?: string | null
          mecanismo?: string | null
          principio_ativo_a?: string | null
          principio_ativo_b?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_interacoes_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_ps_prescricoes_calculaveis: {
        Row: {
          calculavel: boolean | null
          dose_max: number | null
          dose_min: number | null
          dose_unidade: string | null
          fonte_id: string | null
          indicacao: string | null
          populacao: string | null
          principio_ativo: string | null
          via: string | null
        }
        Insert: {
          calculavel?: never
          dose_max?: number | null
          dose_min?: number | null
          dose_unidade?: string | null
          fonte_id?: string | null
          indicacao?: string | null
          populacao?: string | null
          principio_ativo?: string | null
          via?: string | null
        }
        Update: {
          calculavel?: never
          dose_max?: number | null
          dose_min?: number | null
          dose_unidade?: string | null
          fonte_id?: string | null
          indicacao?: string | null
          populacao?: string | null
          principio_ativo?: string | null
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_medicamentos_dose_fonte_id_fkey"
            columns: ["fonte_id"]
            isOneToOne: false
            referencedRelation: "base_referencias_clinicas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_ps_sinais_alarme_criticos: {
        Row: {
          conduta: string | null
          descricao_sinal_medico: string | null
          descricao_sinal_paciente: string | null
          gravidade: string | null
          sistema: string | null
          tempo_maximo_acao_horas: number | null
        }
        Insert: {
          conduta?: string | null
          descricao_sinal_medico?: string | null
          descricao_sinal_paciente?: string | null
          gravidade?: string | null
          sistema?: string | null
          tempo_maximo_acao_horas?: number | null
        }
        Update: {
          conduta?: string | null
          descricao_sinal_medico?: string | null
          descricao_sinal_paciente?: string | null
          gravidade?: string | null
          sistema?: string | null
          tempo_maximo_acao_horas?: number | null
        }
        Relationships: []
      }
      vw_qualidade_base_clinica: {
        Row: {
          campos_total: number | null
          campos_vazios: number | null
          categorias: Json | null
          linhas_conflito: number | null
          lote_id: string | null
          pct_campos_vazios: number | null
          tabela: string | null
          total_registros: number | null
        }
        Relationships: []
      }
      vw_regras_override_ativas: {
        Row: {
          acao_override: string | null
          contexto: string | null
          escore_nao_pode: string | null
          escore_nome: string | null
          nivel_gate: string | null
          prioridade: number | null
          red_flag: string | null
          red_flag_descricao: string | null
          regra_id: string | null
        }
        Insert: {
          acao_override?: string | null
          contexto?: string | null
          escore_nao_pode?: string | null
          escore_nome?: string | null
          nivel_gate?: string | null
          prioridade?: number | null
          red_flag?: string | null
          red_flag_descricao?: string | null
          regra_id?: string | null
        }
        Update: {
          acao_override?: string | null
          contexto?: string | null
          escore_nao_pode?: string | null
          escore_nome?: string | null
          nivel_gate?: string | null
          prioridade?: number | null
          red_flag?: string | null
          red_flag_descricao?: string | null
          regra_id?: string | null
        }
        Relationships: []
      }
      vw_revisao_clinica_itens: {
        Row: {
          alertas_qualidade: number | null
          apresentacao_id: string | null
          apresentacao_texto: string | null
          apresentacao_utilizavel: boolean | null
          categoria_clinica: string | null
          classe_terapeutica: string | null
          concentracao: string | null
          dose_id: string | null
          dose_max: number | null
          dose_maxima_dia: string | null
          dose_min: number | null
          dose_unidade: string | null
          dose_utilizavel: boolean | null
          duracao: string | null
          fonte: string | null
          forma_farmaceutica: string | null
          frequencia: string | null
          medicamento_id: string | null
          observacao: string | null
          observacao_dose: string | null
          populacao: string | null
          posologia_texto: string | null
          principio_ativo: string | null
          registro_id: string | null
          revisado_em: string | null
          revisor_id: string | null
          status_revisao_clinica: string | null
          tipos_alerta: string[] | null
          unidade_concentracao: string | null
          unidade_volume: string | null
          uso_adulto: boolean | null
          uso_em_urgencia: boolean | null
          uso_emergencia: boolean | null
          uso_pediatrico: boolean | null
          versao: number | null
          via: string | null
          volume: string | null
        }
        Relationships: []
      }
      vw_stg_conflitos: {
        Row: {
          conduta_a: string | null
          conduta_b: string | null
          data_a: string | null
          data_b: string | null
          fonte_a: string | null
          fonte_b: string | null
          id_a: string | null
          id_b: string | null
          lote_id: string | null
          nivel_evidencia_a: string | null
          nivel_evidencia_b: string | null
          nome_exame: string | null
          nome_patologia: string | null
          obrigatoriedade_a: string | null
          obrigatoriedade_b: string | null
        }
        Relationships: []
      }
      vw_stg_orfaos: {
        Row: {
          exame_orfao: boolean | null
          id: string | null
          linha_bruta: string | null
          lote_id: string | null
          nome_exame: string | null
          nome_patologia: string | null
          patologia_orfa: boolean | null
        }
        Insert: {
          exame_orfao?: never
          id?: string | null
          linha_bruta?: string | null
          lote_id?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
          patologia_orfa?: never
        }
        Update: {
          exame_orfao?: never
          id?: string | null
          linha_bruta?: string | null
          lote_id?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
          patologia_orfa?: never
        }
        Relationships: []
      }
      vw_vinculos_cobertura: {
        Row: {
          condicionais: number | null
          essenciais: number | null
          nao_recomendados: number | null
          nome_patologia: string | null
          recomendados: number | null
          total_exames_vinculados: number | null
        }
        Relationships: []
      }
      vw_vinculos_negativos: {
        Row: {
          fonte_id: string | null
          nao_solicitar_se: string | null
          nome_exame: string | null
          nome_patologia: string | null
        }
        Insert: {
          fonte_id?: string | null
          nao_solicitar_se?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
        }
        Update: {
          fonte_id?: string | null
          nao_solicitar_se?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
        }
        Relationships: []
      }
      vw_vinculos_sem_conduta: {
        Row: {
          finalidade: string | null
          fonte_id: string | null
          nome_exame: string | null
          nome_patologia: string | null
          obrigatoriedade: string | null
        }
        Insert: {
          finalidade?: string | null
          fonte_id?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
          obrigatoriedade?: string | null
        }
        Update: {
          finalidade?: string | null
          fonte_id?: string | null
          nome_exame?: string | null
          nome_patologia?: string | null
          obrigatoriedade?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      aprovar_lote: { Args: { _lote_id: string }; Returns: number }
      clin_normalize: { Args: { p: string }; Returns: string }
      etl_arr: { Args: { t: string }; Returns: string[] }
      etl_bool: { Args: { t: string }; Returns: boolean }
      etl_fonte_uuid: { Args: { codigo: string }; Returns: string }
      etl_int: { Args: { t: string }; Returns: number }
      etl_num: { Args: { t: string }; Returns: number }
      etl_txt: { Args: { t: string }; Returns: string }
      fn_apresentacoes_medicamento: {
        Args: { p_medicamento_id: string }
        Returns: {
          apresentacao_id: string
          concentracao: string
          forma_farmaceutica: string
          posologias: Json
          revisada: boolean
          rotulo: string
          unidade_volume: string
          uso_adulto: boolean
          uso_pediatrico: boolean
          utilizavel: boolean
          via: string
          volume: string
        }[]
      }
      fn_auditoria_apresentacoes_doses: { Args: never; Returns: Json }
      fn_auditoria_base_clinica: { Args: never; Returns: Json }
      fn_auditoria_condicoes_sem_sugestao: {
        Args: { p_limit?: number }
        Returns: {
          nome: string
          sistema: string
        }[]
      }
      fn_auditoria_qualidade_farmacologica: { Args: never; Returns: Json }
      fn_bloquear_uso_inadequado_escore: {
        Args: {
          p_atendimento_id: string
          p_contexto: string
          p_escore_nome: string
          p_idade_anos?: number
          p_red_flags?: string[]
        }
        Returns: {
          acao_sugerida: string
          motivo: string
          override_aplicado: boolean
          populacao_validada: boolean
          status: string
          versao_escore: string
        }[]
      }
      fn_calcular_4at: {
        Args: {
          p_alerta: number
          p_amt4: number
          p_atencao: number
          p_atendimento_id: string
          p_curso_agudo: number
          p_idade: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_abcd2: {
        Args: {
          p_atendimento_id: string
          p_diabetes: boolean
          p_duracao_min: number
          p_fala_sem_fraqueza: boolean
          p_fraqueza_unilateral: boolean
          p_idade: number
          p_pad: number
          p_pas: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_aims65: {
        Args: {
          p_albumina: number
          p_alteracao_mental: boolean
          p_atendimento_id: string
          p_idade: number
          p_inr: number
          p_pas: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_air: {
        Args: {
          p_atendimento_id: string
          p_defesa: string
          p_dor_fid: boolean
          p_idade: number
          p_leucocitos: number
          p_pcr: number
          p_pmn_pct: number
          p_profissional?: string
          p_temperatura: number
          p_vomito: boolean
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_alvarado: {
        Args: {
          p_anorexia: boolean
          p_atendimento_id: string
          p_desvio_esquerda: boolean
          p_dor_fid: boolean
          p_febre: boolean
          p_idade: number
          p_leucocitose: boolean
          p_migracao: boolean
          p_nausea_vomito: boolean
          p_profissional?: string
          p_rebound: boolean
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_apache2: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_doenca_cronica_pontos?: number
          p_idade_anos?: number
          p_idade_pontos?: number
          p_profissional?: string
          p_score_fisiologico?: number
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_apgar: {
        Args: {
          p_atendimento_id: string
          p_cor_pts: number
          p_esforco_respiratorio_pts: number
          p_frequencia_cardiaca_pts: number
          p_idade_dias: number
          p_profissional?: string
          p_reflexo_pts: number
          p_tempo_min: number
          p_tonus_muscular_pts: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_asa: {
        Args: {
          p_asa_classe?: number
          p_atendimento_id: string
          p_contexto?: string
          p_emergencia?: boolean
          p_idade_anos?: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_atria: {
        Args: {
          p_anemia?: boolean
          p_atendimento_id: string
          p_contexto?: string
          p_doenca_renal?: boolean
          p_idade_anos?: number
          p_idade_pontos?: number
          p_profissional?: string
          p_sangramento_previo?: boolean
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_audit: {
        Args: {
          p_atendimento_id: string
          p_idade: number
          p_itens: number[]
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_bisap: {
        Args: {
          p_atendimento_id: string
          p_comprometimento_mental: boolean
          p_derrame_pleural: boolean
          p_idade: number
          p_profissional?: string
          p_sirs_criterios: number
          p_ureia: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_bps: {
        Args: {
          p_atendimento_id: string
          p_conformidade_ventilador: number
          p_expressao_facial: number
          p_idade_anos: number
          p_intubado: boolean
          p_movimento_membros: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_canadian_cspine: {
        Args: {
          p_atendimento_id: string
          p_fator_baixo_risco: boolean
          p_idade: number
          p_mecanismo_perigoso: boolean
          p_parestesias: boolean
          p_profissional?: string
          p_rotacao_45_graus: boolean
        }
        Returns: {
          categoria: string
          imagem_indicada: boolean
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_cha2ds2_vasc: {
        Args: {
          p_atendimento_id: string
          p_avc_previo: boolean
          p_dm: boolean
          p_doenca_vascular: boolean
          p_fa_valvar?: boolean
          p_has: boolean
          p_ic: boolean
          p_idade: number
          p_profissional?: string
          p_sexo: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_child_pugh: {
        Args: {
          p_albumina: number
          p_ascite: string
          p_atendimento_id: string
          p_bilirrubina: number
          p_encefalopatia: string
          p_idade: number
          p_inr: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_ciwa_ar: {
        Args: {
          p_atendimento_id: string
          p_dominios: number[]
          p_idade: number
          p_orientacao: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_cpot: {
        Args: {
          p_atendimento_id: string
          p_conformidade_ventilador?: number
          p_expressao_facial: number
          p_idade_anos: number
          p_intubado: boolean
          p_movimentos_corporais: number
          p_profissional?: string
          p_tensao_muscular: number
          p_vocalizacao?: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_crb65: {
        Args: {
          p_atendimento_id: string
          p_confusao: boolean
          p_fr: number
          p_idade: number
          p_pad: number
          p_pas: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_crusade: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_creatinina_cl?: number
          p_diabetes?: boolean
          p_doenca_vascular_periferica?: boolean
          p_fc?: number
          p_hematocrito?: number
          p_ic?: boolean
          p_idade_anos?: number
          p_pas?: number
          p_profissional?: string
          p_sexo?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_cssrs: {
        Args: {
          p_atendimento_id: string
          p_comportamento_3meses?: boolean
          p_comportamento_suicida: boolean
          p_desejo_morte: boolean
          p_idade: number
          p_intencao: boolean
          p_metodo: boolean
          p_pensamentos_ativos: boolean
          p_plano: boolean
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_curb65: {
        Args: {
          p_atendimento_id: string
          p_confusao: boolean
          p_fr: number
          p_idade: number
          p_pad: number
          p_pas: number
          p_profissional?: string
          p_ureia: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_euroscore2: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_euroscore2?: number
          p_idade_anos?: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          mortalidade_prevista: number
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_euroscore2_expandido: {
        Args: {
          p_altura?: number
          p_atendimento_id: string
          p_cirurgia_emergencia?: boolean
          p_cirurgia_urgente?: boolean
          p_contexto?: string
          p_creatinina_cl?: number
          p_endocardite?: boolean
          p_feve?: number
          p_idade_anos?: number
          p_nyha?: number
          p_operacao_previa?: boolean
          p_peso?: number
          p_profissional?: string
          p_sexo?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          mortalidade_prevista: number
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_flacc: {
        Args: {
          p_atendimento_id: string
          p_atividade: number
          p_choro: number
          p_consolabilidade: number
          p_face: number
          p_idade_dias: number
          p_pernas: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_gbs: {
        Args: {
          p_atendimento_id: string
          p_hemoglobina: number
          p_hepatopatia: boolean
          p_ic: boolean
          p_idade: number
          p_melena: boolean
          p_pas: number
          p_profissional?: string
          p_pulso: number
          p_red_flag?: string
          p_sexo: string
          p_sincope: boolean
          p_ureia_mmol: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_gcs: {
        Args: {
          p_atendimento_id: string
          p_idade: number
          p_motora: number
          p_ocular: number
          p_profissional?: string
          p_red_flag?: string
          p_verbal: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_gcs_trauma: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_idade_anos?: number
          p_idade_dias?: number
          p_intubado?: boolean
          p_motora?: number
          p_ocular?: number
          p_profissional?: string
          p_verbal?: number
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_grace: {
        Args: {
          p_atendimento_id: string
          p_biomarcador_elevado: boolean
          p_choque?: boolean
          p_creatinina: number
          p_desvio_st: boolean
          p_fc: number
          p_idade: number
          p_killip: number
          p_parada_cardiaca: boolean
          p_pas: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_grace_bleeding: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_grace_sangramento?: number
          p_idade_anos?: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_has_bled: {
        Args: {
          p_alcool: boolean
          p_atendimento_id: string
          p_avc_previo: boolean
          p_drogas_antiplaquetarias: boolean
          p_funcao_hepatica_alterada: boolean
          p_funcao_renal_alterada: boolean
          p_has_nao_controlada: boolean
          p_idade: number
          p_inr_labil: boolean
          p_profissional?: string
          p_sangramento_previo: boolean
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_hasbled: {
        Args: {
          p_atendimento_id: string
          p_avc_previo?: boolean
          p_contexto?: string
          p_drogas_ou_alcool?: boolean
          p_funcao_hepatica_anormal?: boolean
          p_funcao_renal_anormal?: boolean
          p_has?: boolean
          p_idade_anos?: number
          p_inr_labil?: boolean
          p_profissional?: string
          p_sangramento_previo?: boolean
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_heart: {
        Args: {
          p_atendimento_id: string
          p_ecg: number
          p_fatores_risco: number
          p_historia: number
          p_idade: number
          p_profissional?: string
          p_red_flag?: string
          p_troponina: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_hunt_hess: {
        Args: {
          p_atendimento_id: string
          p_grau: number
          p_idade: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          grau: number
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_iss: {
        Args: {
          p_ais_abdome?: number
          p_ais_cabeca?: number
          p_ais_externo?: number
          p_ais_extremidades?: number
          p_ais_face?: number
          p_ais_torax?: number
          p_atendimento_id: string
          p_contexto?: string
          p_idade_anos?: number
          p_idade_dias?: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_lrinec: {
        Args: {
          p_atendimento_id: string
          p_creatinina: number
          p_dor_desproporcional?: boolean
          p_glicose: number
          p_hemoglobina: number
          p_idade: number
          p_leucocitos: number
          p_pcr: number
          p_profissional?: string
          p_sodio: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_mascc: {
        Args: {
          p_ambulatorial: boolean
          p_atendimento_id: string
          p_burden: number
          p_idade: number
          p_instabilidade?: boolean
          p_profissional?: string
          p_sem_desidratacao: boolean
          p_sem_dpoc: boolean
          p_sem_hipotensao: boolean
          p_tumor_solido: boolean
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_meld: {
        Args: {
          p_atendimento_id: string
          p_bilirrubina: number
          p_creatinina: number
          p_dialise?: boolean
          p_idade: number
          p_inr: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_meld_na: {
        Args: {
          p_atendimento_id: string
          p_bilirrubina: number
          p_creatinina: number
          p_dialise?: boolean
          p_idade: number
          p_inr: number
          p_profissional?: string
          p_sodio: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_mews_ob: {
        Args: {
          p_atendimento_id: string
          p_consciencia: string
          p_contexto: string
          p_diurese_ml_h?: number
          p_fc: number
          p_fr: number
          p_idade_anos: number
          p_pas: number
          p_profissional?: string
          p_temperatura: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_news2: {
        Args: {
          p_atendimento_id: string
          p_consciencia: string
          p_escala?: number
          p_fc: number
          p_fr: number
          p_idade: number
          p_pas: number
          p_profissional?: string
          p_red_flag?: string
          p_spo2: number
          p_suplemento: boolean
          p_temperatura: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_nexus: {
        Args: {
          p_atendimento_id: string
          p_deficit_focal: boolean
          p_dor_linha_media: boolean
          p_idade: number
          p_intoxicacao: boolean
          p_lesao_distratora: boolean
          p_nivel_consciencia_alterado: boolean
          p_profissional?: string
        }
        Returns: {
          categoria: string
          imagem_indicada: boolean
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_orbit: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_doenca_renal?: boolean
          p_hemoglobina?: number
          p_idade_anos?: number
          p_idade_pontos?: number
          p_profissional?: string
          p_sangramento_previo?: boolean
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_ottawa_joelho: {
        Args: {
          p_atendimento_id: string
          p_dor_cabeca_fibula: boolean
          p_dor_patela_isolada: boolean
          p_idade: number
          p_incapaz_apoiar: boolean
          p_incapaz_flexao_90: boolean
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          rx_indicado: boolean
          status: string
          versao: string
        }[]
      }
      fn_calcular_ottawa_tornozelo: {
        Args: {
          p_atendimento_id: string
          p_dor_base_5mt: boolean
          p_dor_maleolar: boolean
          p_dor_maleolo_lateral: boolean
          p_dor_maleolo_medial: boolean
          p_dor_mediope: boolean
          p_dor_navicular: boolean
          p_idade: number
          p_incapaz_apoiar: boolean
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          rx_indicado: boolean
          status: string
          versao: string
        }[]
      }
      fn_calcular_perc: {
        Args: {
          p_atendimento_id: string
          p_cirurgia_trauma: boolean
          p_edema_unilateral: boolean
          p_estrogenio: boolean
          p_fc: number
          p_hemoptise: boolean
          p_idade: number
          p_probabilidade_pre_teste: string
          p_profissional?: string
          p_spo2: number
          p_tep_previa: boolean
        }
        Returns: {
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          todos_negativos: boolean
          versao: string
        }[]
      }
      fn_calcular_phq9: {
        Args: {
          p_atendimento_id: string
          p_idade: number
          p_item1: number
          p_item2: number
          p_item3: number
          p_item4: number
          p_item5: number
          p_item6: number
          p_item7: number
          p_item8: number
          p_item9: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          item9_positivo: boolean
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_possum: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_idade_anos?: number
          p_profissional?: string
          p_score_fisiologico?: number
          p_score_operativo?: number
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          morbidade_prevista: number
          mortalidade_prevista: number
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_qsofa: {
        Args: {
          p_atendimento_id: string
          p_consciencia_alterada: boolean
          p_fr: number
          p_idade: number
          p_pas: number
          p_profissional?: string
          p_red_flag?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_ranson: {
        Args: {
          p_ast: number
          p_atendimento_id: string
          p_glicose: number
          p_idade: number
          p_ldh: number
          p_leucocitos: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_rcri: {
        Args: {
          p_atendimento_id: string
          p_cardiopatia_isquemica?: boolean
          p_cirurgia_alto_risco?: boolean
          p_contexto?: string
          p_diabetes_insulina?: boolean
          p_doenca_cerebrovascular?: boolean
          p_idade_anos?: number
          p_insuficiencia_cardiaca?: boolean
          p_insuficiencia_renal?: boolean
          p_profissional?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_regiscar: {
        Args: {
          p_atendimento_id: string
          p_eosinofilia: number
          p_exclusao_investigada: boolean
          p_febre: boolean
          p_idade: number
          p_linfonodomegalia: boolean
          p_orgao_interno: boolean
          p_profissional?: string
          p_rash_extenso: boolean
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_rockall: {
        Args: {
          p_atendimento_id: string
          p_comorbidade: string
          p_diagnostico: string
          p_estigmas_sangramento: boolean
          p_fc: number
          p_idade: number
          p_pas: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_rts: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_fr?: number
          p_gcs?: number
          p_idade_anos?: number
          p_idade_dias?: number
          p_pas?: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_saps2: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_idade_anos?: number
          p_profissional?: string
          p_saps2_pontos?: number
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          mortalidade_prevista: number
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_scorten: {
        Args: {
          p_atendimento_id: string
          p_bicarbonato: number
          p_fc: number
          p_glicose: number
          p_idade: number
          p_malignidade: boolean
          p_profissional?: string
          p_scq_pct: number
          p_ureia: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          mortalidade_estimada: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_sins: {
        Args: {
          p_alinhamento: number
          p_atendimento_id: string
          p_colapso: number
          p_dor: number
          p_idade: number
          p_lesao_ossea: number
          p_localizacao: number
          p_posterolateral: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_sirs: {
        Args: {
          p_atendimento_id: string
          p_bastoes_pct?: number
          p_fc: number
          p_fr: number
          p_idade: number
          p_leucocitos?: number
          p_paco2?: number
          p_profissional?: string
          p_temperatura: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_smart_cop: {
        Args: {
          p_albumina: number
          p_atendimento_id: string
          p_confusao: boolean
          p_fc: number
          p_fr: number
          p_idade: number
          p_multilobar: boolean
          p_pas: number
          p_ph: number
          p_profissional?: string
          p_spo2: number
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_sofa: {
        Args: {
          p_atendimento_id: string
          p_bilirrubina?: number
          p_creatinina?: number
          p_diurese_ml_dia?: number
          p_dose_vasopressor?: number
          p_gcs?: number
          p_idade: number
          p_pam?: number
          p_pao2_fio2?: number
          p_plaquetas?: number
          p_profissional?: string
          p_vasopressor?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_syntax: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_idade_anos?: number
          p_profissional?: string
          p_syntax_score?: number
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_syntax2: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_creatinina_cl?: number
          p_diabetes?: boolean
          p_doenca_tronco?: boolean
          p_doenca_vascular_periferica?: boolean
          p_feve?: number
          p_idade_anos?: number
          p_idade_pontos?: number
          p_profissional?: string
          p_sexo?: string
          p_syntax_score?: number
        }
        Returns: {
          cabg_risco_mortalidade: number
          categoria: string
          contexto: string
          diferenca: number
          limitacoes: string
          pci_risco_mortalidade: number
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_timi: {
        Args: {
          p_2_angina_24h: boolean
          p_3_fatores_risco: boolean
          p_aas_7dias: boolean
          p_atendimento_id: string
          p_biomarcador_elevado: boolean
          p_dac_conhecida: boolean
          p_desvio_st: boolean
          p_idade: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_timi_bleeding: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_desvio_st?: boolean
          p_doenca_renal?: boolean
          p_idade_anos?: number
          p_idade_pontos?: number
          p_peso?: number
          p_profissional?: string
          p_sexo?: string
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_triss: {
        Args: {
          p_atendimento_id: string
          p_contexto?: string
          p_idade_anos?: number
          p_idade_dias?: number
          p_iss?: number
          p_mecanismo?: string
          p_profissional?: string
          p_rts?: number
        }
        Returns: {
          categoria: string
          contexto: string
          limitacoes: string
          populacao_validada: boolean
          probabilidade_sobrevivencia: number
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_wells_tep: {
        Args: {
          p_atendimento_id: string
          p_cancer: boolean
          p_dx_alternativo_menos_provavel: boolean
          p_fc: number
          p_hemoptise: boolean
          p_idade: number
          p_imobilizacao_cirurgia: boolean
          p_profissional?: string
          p_red_flag?: string
          p_sinais_tvp: boolean
          p_tep_previa: boolean
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao_validada: boolean
          red_flag_override: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_wfns: {
        Args: {
          p_atendimento_id: string
          p_deficit_motor: boolean
          p_gcs: number
          p_idade: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          grau: number
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          versao: string
        }[]
      }
      fn_calcular_wong_baker: {
        Args: {
          p_atendimento_id: string
          p_faces: number
          p_idade_anos: number
          p_profissional?: string
        }
        Returns: {
          categoria: string
          limitacoes: string
          populacao: string
          populacao_validada: boolean
          resposta: string
          status: string
          total: number
          versao: string
        }[]
      }
      fn_calcular_years: {
        Args: {
          p_atendimento_id: string
          p_dimero: number
          p_hemoptise: boolean
          p_idade: number
          p_profissional?: string
          p_sinais_tvp: boolean
          p_tep_mais_provavel: boolean
        }
        Returns: {
          categoria: string
          criterios: number
          limiar_dimero: number
          limitacoes: string
          populacao_validada: boolean
          resposta: string
          status: string
          tep_excluida: boolean
          versao: string
        }[]
      }
      fn_escore_aplicavel: {
        Args: {
          p_contexto: string
          p_escore_nome: string
          p_idade_anos?: number
        }
        Returns: {
          aplicavel: boolean
          motivo: string
          versao_escore: string
        }[]
      }
      fn_escore_versao_atual: {
        Args: { p_nome_escore: string }
        Returns: string
      }
      fn_etl_lista_jsonb: {
        Args: { p_chave: string; p_texto: string }
        Returns: Json
      }
      fn_etl_med_apresentacao: {
        Args: { p_lote_id?: string }
        Returns: {
          atualizados: number
          inseridos: number
          orfaos: number
          rejeitados: number
        }[]
      }
      fn_etl_med_contraindicacao: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_med_dose: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_med_equivalencia: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_med_interacao: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_med_iv: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_med_monitoramento: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_med_principio: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_patologias: {
        Args: { p_lote: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_etl_promover_etapa: {
        Args: { p_etapa: string; p_execucao?: string; p_lote: string }
        Returns: {
          atualizados: number
          duracao_ms: number
          erro: string
          etapa: string
          inseridos: number
          lidos: number
          rejeitados: number
          status: string
        }[]
      }
      fn_etl_promover_tudo: {
        Args: { p_lote?: string }
        Returns: {
          atualizados: number
          duracao_ms: number
          erro: string
          etapa: string
          inseridos: number
          lidos: number
          rejeitados: number
          status: string
        }[]
      }
      fn_etl_protocolos: {
        Args: { p_lote_id?: string }
        Returns: {
          atualizados: number
          inseridos: number
          rejeitados: number
        }[]
      }
      fn_etl_sinais_alarme: {
        Args: { p_lote?: string }
        Returns: {
          atualizados: number
          inseridos: number
          lidos: number
          rejeitados: number
        }[]
      }
      fn_guard_admin_or_service: { Args: never; Returns: undefined }
      fn_fila_revisao_clinica: {
        Args: { p_filtro?: string; p_limit?: number }
        Returns: {
          alertas_qualidade: number | null
          apresentacao_id: string | null
          apresentacao_texto: string | null
          apresentacao_utilizavel: boolean | null
          categoria_clinica: string | null
          classe_terapeutica: string | null
          concentracao: string | null
          dose_id: string | null
          dose_max: number | null
          dose_maxima_dia: string | null
          dose_min: number | null
          dose_unidade: string | null
          dose_utilizavel: boolean | null
          duracao: string | null
          fonte: string | null
          forma_farmaceutica: string | null
          frequencia: string | null
          medicamento_id: string | null
          observacao: string | null
          observacao_dose: string | null
          populacao: string | null
          posologia_texto: string | null
          principio_ativo: string | null
          registro_id: string | null
          revisado_em: string | null
          revisor_id: string | null
          status_revisao_clinica: string | null
          tipos_alerta: string[] | null
          unidade_concentracao: string | null
          unidade_volume: string | null
          uso_adulto: boolean | null
          uso_em_urgencia: boolean | null
          uso_emergencia: boolean | null
          uso_pediatrico: boolean | null
          versao: number | null
          via: string | null
          volume: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "vw_revisao_clinica_itens"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      fn_integrar_escore_protocolo: {
        Args: {
          p_escore_nome: string
          p_protocolo_codigo: string
          p_red_flag?: string
        }
        Returns: {
          acao_disparada: string
          acao_override: string
          escore_nome: string
          faixa_gatilho: string
          gatilho_descricao: string
          nivel_gate: string
          ordem_na_cadeia: number
          override_aplicado: boolean
          protocolo_codigo: string
          tipo_integracao: string
        }[]
      }
      fn_medicamentos_sem_vinculo: {
        Args: never
        Returns: {
          classe_terapeutica: string
          grupo: string
          grupo_motivo: string
          medicamento_id: string
          principio_ativo: string
          prioridade_trabalho: number
          tem_apresentacao: boolean
          tem_dose: boolean
        }[]
      }
      fn_num_inicial: { Args: { p_txt: string }; Returns: number }
      fn_obter_fluxo_decisao: {
        Args: { p_patologia: string; p_protocolo_codigo?: string }
        Returns: {
          acao_disparada: string
          escore_aplicado: string
          estado_atual: string
          faixa_gatilho: string
          ordem_na_cadeia: number
          override_por_red_flag: boolean
          patologia: string
          protocolo_codigo: string
          proximo_estado: string
        }[]
      }
      fn_pendencias_medicamentos: {
        Args: { p_limit?: number; p_tipo: string }
        Returns: {
          classe_terapeutica: string
          detalhe: string
          id: string
          principio_ativo: string
          status_funcional: string
        }[]
      }
      fn_posologia_texto: {
        Args: {
          p_dose_max: number
          p_dose_min: number
          p_duracao: string
          p_frequencia: string
          p_intervalo_horas: number
          p_unidade: string
          p_via: string
        }
        Returns: string
      }
      fn_quadros_prontos_fluxo_rapido: {
        Args: never
        Returns: {
          condicao_nome: string
          condicao_tipo: string
          opcoes: number
        }[]
      }
      fn_registrar_calculo_escore: {
        Args: {
          p_atendimento_id: string
          p_categoria: string
          p_conduta_real?: string
          p_conduta_sugerida: string
          p_divergencia?: boolean
          p_entradas: Json
          p_entradas_completas: boolean
          p_motivo_override?: string
          p_nome_escore: string
          p_populacao_validada: boolean
          p_profissional?: string
          p_red_flag_override?: boolean
          p_resultado: number
          p_versao: string
        }
        Returns: number
      }
      fn_registrar_calculo_intervencionista: {
        Args: {
          p_atendimento_id: string
          p_categoria: string
          p_conduta_sugerida: string
          p_contexto?: string
          p_entradas: Json
          p_idade_anos?: number
          p_nome_escore: string
          p_profissional: string
          p_resultado: number
        }
        Returns: number
      }
      fn_registrar_calculo_sangramento: {
        Args: {
          p_atendimento_id: string
          p_categoria: string
          p_conduta_sugerida: string
          p_contexto?: string
          p_entradas: Json
          p_idade_anos?: number
          p_nome_escore: string
          p_profissional: string
          p_resultado: number
        }
        Returns: number
      }
      fn_registrar_conduta_real: {
        Args: {
          p_auditoria_id: number
          p_conduta_real: string
          p_motivo_divergencia?: string
          p_profissional?: string
        }
        Returns: boolean
      }
      fn_resumo_revisao_clinica: { Args: never; Returns: Json }
      fn_resumo_vinculos_clinicos: { Args: never; Returns: Json }
      fn_revisao_clinica_acao: {
        Args: {
          p_acao: string
          p_apresentacao_id: string
          p_dose_id: string
          p_fonte?: string
          p_medicamento_id: string
          p_observacao?: string
          p_proxima_revisao?: string
        }
        Returns: {
          apresentacao_id: string | null
          conteudo_hash: string | null
          created_at: string
          dose_id: string | null
          fonte: string | null
          id: string
          medicamento_id: string
          observacao: string | null
          proxima_revisao_em: string | null
          revisado_em: string | null
          revisor_id: string | null
          status: Database["public"]["Enums"]["revisao_clinica_status"]
          updated_at: string
          versao: number
        }
        SetofOptions: {
          from: "*"
          to: "medicamento_revisao_clinica"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_revisao_clinica_corrigir_dose: {
        Args: { p_dose_id: string; p_patch: Json }
        Returns: undefined
      }
      fn_revisao_conteudo_hash: {
        Args: { p_apresentacao_id: string; p_dose_id: string }
        Returns: string
      }
      fn_rotulo_apresentacao: {
        Args: {
          p_concentracao: string
          p_forma: string
          p_principio: string
          p_unidade_volume: string
          p_volume: string
        }
        Returns: string
      }
      fn_sugerir_escore_intervencionista: {
        Args: { p_contexto?: string; p_idade_anos?: number }
        Returns: {
          escore_sugerido: string
          motivo: string
        }[]
      }
      fn_sugerir_escore_por_contexto: {
        Args: { p_contexto: string; p_idade_anos?: number; p_sindrome?: string }
        Returns: {
          escore_nome: string
          fonte_id: string
          motivo: string
          populacao_validada: boolean
          prioridade: number
          tipo_sugestao: string
          versao_escore: string
        }[]
      }
      fn_sugerir_escore_por_gravidade: {
        Args: {
          p_contexto: string
          p_gravidade?: string
          p_idade_anos?: number
          p_sindrome?: string
        }
        Returns: {
          escore_nome: string
          fonte_id: string
          motivo: string
          populacao_validada: boolean
          prioridade: number
          tipo_sugestao: string
          versao_escore: string
        }[]
      }
      fn_sugestoes_clinicas: {
        Args: { p_ambiente?: string; p_condicao?: string; p_sindrome?: string }
        Returns: {
          ajuste_hepatico: boolean
          ajuste_renal: boolean
          alto_risco: boolean
          apresentacao: string
          concentracao: string
          dose_adulto: string
          dose_incompleta: boolean
          dose_pediatrica: string
          duracao: string
          evitar_gestante: boolean
          frequencia: string
          linha: string
          medicamento_id: string
          medicamento_nome: string
          observacao: string
          origem: string
          principio_ativo: string
          prioridade: number
          tipo_receita: string
          via: string
          vinculo_id: string
        }[]
      }
      fn_sugestoes_terapeuticas: {
        Args: {
          p_condicao?: string
          p_contexto?: string
          p_paciente?: Json
          p_sindrome?: string
        }
        Returns: {
          ajuste_hepatico: boolean
          ajuste_renal: boolean
          alertas_paciente: string[]
          alto_risco: boolean
          apresentacao: string
          apresentacao_utilizavel: boolean
          care_context: string
          classe_terapeutica: string
          concentracao: string
          condicao_nome: string
          dose_adulto: string
          dose_incompleta: boolean
          dose_pediatrica: string
          duracao: string
          evitar_gestante: boolean
          frequencia: string
          grupo: number
          medicamento_id: string
          medicamento_liberado: boolean
          medicamento_nome: string
          notas: string
          origem: string
          papel: string
          populacao: string
          principio_ativo: string
          prioridade: number
          tipo_receita: string
          via: string
          vinculo_id: string
          vinculo_revisado: boolean
        }[]
      }
      fn_validar_entradas_escore: {
        Args: { p_entradas: Json; p_escore_nome: string }
        Returns: {
          entradas_completas: boolean
          faltantes: string[]
          versao: string
        }[]
      }
      fn_validar_populacao_cirurgico: {
        Args: {
          p_contexto?: string
          p_escore_nome: string
          p_idade_anos?: number
        }
        Returns: {
          contexto: string
          motivo: string
          populacao_validada: boolean
          versao_escore: string
        }[]
      }
      fn_validar_populacao_escore: {
        Args: { p_contexto?: string; p_escore_nome: string; p_idade?: number }
        Returns: {
          motivo: string
          populacao_validada: boolean
          versao_escore: string
        }[]
      }
      fn_validar_populacao_intervencionista: {
        Args: {
          p_contexto?: string
          p_escore_nome: string
          p_idade_anos?: number
        }
        Returns: {
          contexto: string
          motivo: string
          populacao_validada: boolean
          versao_escore: string
        }[]
      }
      fn_validar_populacao_obstetrica: {
        Args: {
          p_contexto_gestacional?: string
          p_escore_nome: string
          p_idade_anos: number
        }
        Returns: {
          motivo: string
          populacao: string
          populacao_validada: boolean
          versao_escore: string
        }[]
      }
      fn_validar_populacao_sangramento: {
        Args: {
          p_contexto?: string
          p_escore_nome: string
          p_idade_anos?: number
        }
        Returns: {
          contexto: string
          motivo: string
          populacao_validada: boolean
          versao_escore: string
        }[]
      }
      fn_validar_populacao_trauma: {
        Args: {
          p_contexto?: string
          p_escore_nome: string
          p_idade_anos?: number
          p_idade_dias?: number
        }
        Returns: {
          contexto: string
          motivo: string
          populacao_validada: boolean
          versao_escore: string
        }[]
      }
      fn_verificar_override_red_flag: {
        Args: {
          p_contexto: string
          p_escore_nome: string
          p_red_flags: string[]
        }
        Returns: {
          acao_override: string
          escore_nao_pode: string
          nivel_gate: string
          override_aplicado: boolean
          prioridade: number
          red_flag: string
          regra_id: string
        }[]
      }
      fn_via_canonica: { Args: { p_via: string }; Returns: string }
      fn_vinculo_acao: {
        Args: { p_acao: string; p_id: string; p_observacao?: string }
        Returns: undefined
      }
      fn_vinculo_upsert: {
        Args: {
          p_apresentacao_id?: string
          p_care_context: string
          p_condicao_id?: string
          p_condicao_nome: string
          p_condicao_tipo: string
          p_id: string
          p_medicamento_id: string
          p_notes?: string
          p_papel: string
          p_populacao?: string
          p_prioridade: number
          p_source?: string
        }
        Returns: string
      }
      fn_vinculos_por_condicao: {
        Args: { p_condicao: string; p_tipo: string }
        Returns: {
          apresentacao: string
          care_context: string
          classe_terapeutica: string
          condicao_nome: string
          id: string
          medicamento_id: string
          medicamento_liberado: boolean
          notes: string
          papel: string
          populacao: string
          principio_ativo: string
          prioridade: number
          review_status: string
          revisado_em: string
          source_reference: string
          versao: number
        }[]
      }
      fn_vinculos_por_medicamento: {
        Args: { p_medicamento_id: string }
        Returns: {
          care_context: string
          condicao_nome: string
          condicao_tipo: string
          id: string
          notes: string
          papel: string
          prioridade: number
          review_status: string
          versao: number
        }[]
      }
      get_resultado_escore_trauma: {
        Args: { _token: string }
        Returns: {
          created_at: string
          detalhes: Json
          entrada: Json
          escore: string
          estrato: string
          observacao: string
          pontuacao: number
          rotulo: string
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      iv_normalize_text: { Args: { input: string }; Returns: string }
      med_normalizar_principio: { Args: { p: string }; Returns: string }
      promover_stg_exames: { Args: { _lote_id: string }; Returns: number }
      promover_stg_patologia_exames: {
        Args: { _lote_id: string }
        Returns: number
      }
      promover_stg_patologias: { Args: { _lote_id: string }; Returns: number }
      promover_stg_rastreamentos: {
        Args: { _lote_id: string }
        Returns: number
      }
      stg_conta_vazios: {
        Args: { row_data: Json }
        Returns: {
          total: number
          vazios: number
        }[]
      }
      validar_exames_ps: {
        Args: { p_lote: string }
        Returns: {
          sem_vinculo: number
          total_exames: number
        }[]
      }
      validar_patologias_ps: {
        Args: { p_lote: string }
        Returns: {
          sem_vinculo: number
          total_patologias: number
        }[]
      }
      validar_vinculos_ps: {
        Args: { p_lote: string }
        Returns: {
          negativos: number
          sem_conduta: number
          sem_fonte: number
          total_vinculos: number
        }[]
      }
    }
    Enums: {
      alert_level: "baixo" | "medio" | "alto"
      allergy_reaction_type:
        | "rash_urticaria"
        | "angioedema"
        | "broncoespasmo"
        | "anafilaxia"
        | "nausea_intolerancia"
        | "reacao_cutanea_grave"
        | "desconhecida"
        | "outro"
      allergy_record_type:
        | "alergia_confirmada"
        | "suspeita_alergia"
        | "intolerancia"
        | "efeito_adverso"
        | "desconhecido"
      allergy_severity:
        | "leve"
        | "moderada"
        | "grave"
        | "anafilaxia"
        | "desconhecida"
      anexo_iv_modo:
        | "nunca"
        | "apenas_alerta_medio_alto"
        | "perguntar_sempre"
        | "sempre_hospitalar"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "revisor"
        | "enfermagem"
        | "farmacia"
        | "medico"
        | "residente"
        | "administrativo"
      aprendizado_termo_status: "pendente" | "aprovado" | "rejeitado"
      assinatura_ambiente: "teste" | "producao"
      assinatura_modo:
        | "imprimir_sem_assinatura_digital"
        | "gerar_pdf_para_assinar"
        | "assinar_automaticamente"
        | "enviar_para_assinatura_externa"
      assinatura_status_integracao:
        | "nao_configurado"
        | "em_configuracao"
        | "configurado"
        | "erro"
        | "producao"
      assinatura_tipo:
        | "sem_assinatura_digital"
        | "assinatura_digital_externa"
        | "certificado_a1"
        | "certificado_a3"
        | "assinatura_eletronica_simples"
        | "integracao_api"
      bloco_checklist_item_chave:
        | "principio_ativo"
        | "apresentacoes"
        | "via_oral"
        | "via_injetavel"
        | "dose_adulto"
        | "dose_pediatrica"
        | "dose_maxima"
        | "tipo_receita"
        | "controlado_marcado"
        | "alertas"
        | "vinculo_cid_queixa"
        | "vinculo_modelos"
        | "fonte"
        | "status_revisao"
      bloco_checklist_item_status:
        | "pendente"
        | "em_andamento"
        | "revisado"
        | "nao_aplicavel"
      bloco_status:
        | "nao_iniciado"
        | "em_cadastro"
        | "em_revisao"
        | "pronto_beta"
        | "precisa_ajuste"
      checklist_status: "pendente" | "em_teste" | "aprovado" | "precisa_ajuste"
      cid_atestado_modo: "nunca" | "perguntar_sempre" | "se_medico_marcar"
      clinical_alert_action:
        | "visualizou"
        | "removeu_medicamento"
        | "substituiu_medicamento"
        | "confirmou_com_justificativa"
        | "bloqueado_pelo_sistema"
        | "ignorou_informativo"
      clinical_alert_kind:
        | "alergia_principio_ativo"
        | "alergia_classe"
        | "reacao_cruzada"
        | "gestacao"
        | "lactacao"
        | "idade"
        | "comorbidade"
        | "cid"
        | "restricao_paciente"
        | "historico_reacao_adversa"
      contraindication_type:
        | "alergia_principio_ativo"
        | "alergia_classe"
        | "gestacao"
        | "lactacao"
        | "idade"
        | "comorbidade"
        | "diagnostico_cid"
        | "condicao_clinica"
        | "funcao_renal"
        | "funcao_hepatica"
        | "historico_reacao_adversa"
        | "outro"
      documento_acao_log:
        | "visualizou_previa"
        | "gerou_pdf"
        | "imprimiu"
        | "baixou"
        | "enviou_email"
        | "enviou_whatsapp"
        | "copiou_link"
        | "cancelou"
        | "substituiu"
      documento_origem:
        | "atendimento_atual"
        | "historico"
        | "modelo"
        | "protocolo"
        | "entrada_inteligente"
        | "manual"
      documento_status:
        | "rascunho"
        | "gerado"
        | "impresso"
        | "enviado"
        | "cancelado"
        | "substituido"
      documento_tipo:
        | "receita_comum"
        | "receita_controle_especial"
        | "receita_antimicrobiano"
        | "receita_controlado_especifico"
        | "solicitacao_exames"
        | "atestado"
        | "encaminhamento"
        | "relatorio"
        | "declaracao"
        | "orientacoes_paciente"
        | "prescricao_hospitalar"
        | "orientacoes_enfermagem_farmacia"
        | "anexo_tecnico_iv"
        | "plano_terapeutico"
        | "resumo_atendimento"
        | "aih"
        | "apac"
        | "notificacao_compulsoria"
        | "procedimento"
      entrada_item_tipo:
        | "medicamento"
        | "exame"
        | "orientacao"
        | "documento"
        | "cuidado_enfermagem"
        | "diagnostico"
        | "nao_reconhecido"
      entrada_origem:
        | "prescricao"
        | "exames"
        | "orientacoes"
        | "documentos"
        | "historico"
        | "outro"
      entrada_status_final:
        | "descartado"
        | "aplicado_parcialmente"
        | "aplicado_totalmente"
        | "apenas_visualizado"
        | "erro_extracao"
      entrada_tipo: "texto_livre" | "voz" | "foto" | "arquivo" | "texto_colado"
      historico_tipo_visualizado:
        | "prescricao"
        | "medicamento"
        | "exame"
        | "documento"
        | "alerta"
        | "uso_continuo"
      interaction_alert_action:
        | "visualizou"
        | "corrigiu_prescricao"
        | "removeu_medicamento"
        | "substituiu_medicamento"
        | "confirmou_com_justificativa"
        | "bloqueado_pelo_sistema"
        | "ignorou_informativo"
      interaction_alert_kind:
        | "interacao_especifica"
        | "duplicidade_terapeutica"
        | "risco_acumulado"
        | "monitorizacao"
        | "bloqueio"
      interaction_alert_level: "informativo" | "atencao" | "alto" | "critico"
      interaction_review_status:
        | "rascunho"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_corrigir"
        | "inativo"
      interaction_severity: "leve" | "moderada" | "grave" | "contraindicada"
      interaction_type:
        | "farmacocinetica"
        | "farmacodinamica"
        | "duplicidade_terapeutica"
        | "qt_longo"
        | "nefrotoxicidade_somada"
        | "hepatotoxicidade_somada"
        | "risco_hemorragico"
        | "depressao_respiratoria"
        | "sedacao_somada"
        | "serotoninergico"
        | "hipercalemia"
        | "hipocalemia"
        | "hipotensao"
        | "bradicardia"
        | "hipertensao"
        | "glicemia"
        | "outro"
      item_reuso_status:
        | "seguro_para_revisao"
        | "requer_atencao"
        | "exige_justificativa"
        | "bloqueado"
        | "dados_insuficientes"
        | "desatualizado"
      iv_alert_action:
        | "corrigiu_prescricao"
        | "confirmou_com_justificativa"
        | "ignorou_alerta_informativo"
        | "bloqueado_pelo_sistema"
      iv_alert_severity: "info" | "warning" | "blocker"
      iv_calc_status:
        | "calculado"
        | "incompleto"
        | "erro_unidade"
        | "exige_peso"
        | "exige_volume"
        | "exige_tempo"
        | "nao_aplicavel"
      iv_log_action:
        | "criou"
        | "editou"
        | "importou"
        | "aprovou"
        | "solicitou_correcao"
        | "inativou"
        | "reativou"
      iv_match_action:
        | "associado_automaticamente"
        | "confirmado_pelo_usuario"
        | "escolhido_manual"
        | "ignorado"
        | "sem_correspondencia"
      iv_match_type: "exata" | "parcial" | "fuzzy" | "manual" | "nenhuma"
      iv_pediatric_review_status:
        | "nao_cadastrado"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_corrigir"
        | "inativo"
      iv_renal_hepatic_review_status:
        | "nao_cadastrado"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_corrigir"
        | "inativo"
      iv_review_status:
        | "finalizada_sem_alertas"
        | "finalizada_com_alertas_informativos"
        | "finalizada_com_justificativa"
        | "bloqueada_pelo_sistema"
        | "retornou_para_edicao"
      iv_review_status_med:
        | "rascunho"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_corrigir"
        | "inativo"
      iv_suggested_term_status: "pendente" | "aprovado" | "rejeitado"
      iv_text_action:
        | "gerou_texto"
        | "editou_texto"
        | "aprovou_texto"
        | "marcou_precisa_ajuste"
        | "substituiu_por_manual"
      iv_text_status:
        | "gerado_automaticamente"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_ajuste"
        | "manual"
      lactation_alert_level:
        | "nao_cadastrado"
        | "compativel"
        | "usar_com_cautela"
        | "evitar"
        | "contraindicado"
      link_publico_status: "ativo" | "expirado" | "revogado"
      medicamento_alerta_gest_lact:
        | "seguro"
        | "cautela"
        | "evitar"
        | "contraindicado"
        | "sem_dados"
      medicamento_categoria_clinica:
        | "dor_febre"
        | "nauseas_vomitos"
        | "alergia_anafilaxia"
        | "broncoespasmo_respiratorio"
        | "antibioticos"
        | "antivirais"
        | "antifungicos"
        | "gastrointestinal"
        | "cardiovascular"
        | "anti_hipertensivos"
        | "diureticos"
        | "corticoides"
        | "anticoag_antiagreg"
        | "neurologico_anticonvulsivante"
        | "psiquiatria_agitacao"
        | "sedacao_analgesia_hospitalar"
        | "hidratacao_eletrolitos"
        | "endocrino_metabolico"
        | "diabetes_glicemia"
        | "gineco_obstetricia"
        | "pediatria_comum"
        | "dermatologia_basica"
        | "otorrino_oftalmo"
        | "emergencia"
        | "controlados"
      medicamento_contexto_uso:
        | "urgencia"
        | "emergencia"
        | "pronto_atendimento"
        | "hospitalar"
        | "ambulatorial_rapido"
        | "pediatria"
        | "gestante"
        | "outro"
      medicamento_prioridade_mvp:
        | "essencial"
        | "alta"
        | "media"
        | "baixa"
        | "futuro"
      medicamento_status_revisao:
        | "rascunho"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_corrigir"
        | "inativo"
      medicamento_tipo_receita:
        | "comum"
        | "especial_b"
        | "especial_a"
        | "antimicrobiano"
        | "controlado_outros"
      modulo_revisao_status:
        | "pronto"
        | "em_ajuste"
        | "pendente"
        | "desativado_no_beta"
      pregnancy_alert_level:
        | "nao_cadastrado"
        | "permitido_com_criterio"
        | "atencao"
        | "evitar"
        | "contraindicado"
      pregnancy_trimester:
        | "qualquer"
        | "primeiro"
        | "segundo"
        | "terceiro"
        | "nao_aplicavel"
      protocol_context:
        | "urgencia"
        | "enfermaria"
        | "ambulatorio"
        | "pronto_atendimento"
        | "telemedicina"
        | "hospitalar"
        | "pediatria"
        | "obstetricia"
        | "geral"
      protocol_log_action:
        | "aberto"
        | "item_adicionado"
        | "item_editado"
        | "item_ignorado"
        | "plano_montado"
        | "alerta_gerado"
        | "aplicado_parcial"
      protocol_priority: "imediata" | "alta" | "moderada" | "baixa"
      protocol_recommendation_level:
        | "forte"
        | "moderada"
        | "condicional"
        | "baixa"
      protocol_review_status:
        | "rascunho"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_corrigir"
        | "inativo"
      protocol_type:
        | "queixa"
        | "sindrome"
        | "cid"
        | "diagnostico"
        | "emergencia"
        | "ambulatorial"
        | "hospitalar"
        | "pediatrico"
        | "obstetrico"
        | "outro"
      quickset_category:
        | "medicamentos"
        | "exames"
        | "orientacoes"
        | "cuidados"
        | "misto"
      reaproveitamento_acao:
        | "prescricao_aberta"
        | "reaproveitar_clicado"
        | "item_selecionado"
        | "item_editado"
        | "item_removido"
        | "item_bloqueado"
        | "item_adicionado"
        | "justificativa_preenchida"
      regra_legal_review_status: "aguardando_revisao" | "revisado" | "rejeitado"
      revisao_clinica_status:
        | "pending_review"
        | "reviewed"
        | "needs_correction"
        | "inactive"
      risk_level: "nenhum" | "baixo" | "moderado" | "alto" | "desconhecido"
      template_context:
        | "urgencia"
        | "enfermaria"
        | "ambulatorio"
        | "pronto_atendimento"
        | "telemedicina"
        | "hospitalar"
        | "pediatria"
        | "obstetricia"
        | "geral"
      template_log_action:
        | "aberto"
        | "aplicado"
        | "item_editado"
        | "item_removido"
        | "alerta_gerado"
        | "justificativa_registrada"
        | "salvo_de_prescricao"
      template_review_status:
        | "rascunho"
        | "aguardando_revisao"
        | "revisado"
        | "precisa_corrigir"
        | "inativo"
      template_type:
        | "prescricao"
        | "exames"
        | "orientacoes"
        | "cuidados_enfermagem"
        | "misto"
        | "protocolo_rapido"
        | "alta"
        | "internacao"
        | "urgencia"
        | "pediatrico"
      template_visibility: "pessoal" | "equipe" | "institucional"
      teste_clinico_status:
        | "pendente"
        | "aprovado"
        | "reprovado"
        | "precisa_ajuste"
        | "corrigido"
      tipo_receita_legal:
        | "comum"
        | "controle_especial"
        | "antimicrobiano"
        | "azul"
        | "amarela"
        | "branca_duas_vias"
        | "outro"
      uso_continuo_status: "ativo" | "suspenso" | "finalizado"
      vinculo_contexto:
        | "ambulatorial"
        | "urgencia"
        | "emergencia"
        | "hospitalar"
        | "qualquer"
      vinculo_papel:
        | "primeira_linha"
        | "alternativa"
        | "adjuvante"
        | "sintomatico"
        | "resgate"
        | "hospitalar"
        | "situacao_especifica"
      vinculo_status:
        | "pending_review"
        | "reviewed"
        | "needs_correction"
        | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_level: ["baixo", "medio", "alto"],
      allergy_reaction_type: [
        "rash_urticaria",
        "angioedema",
        "broncoespasmo",
        "anafilaxia",
        "nausea_intolerancia",
        "reacao_cutanea_grave",
        "desconhecida",
        "outro",
      ],
      allergy_record_type: [
        "alergia_confirmada",
        "suspeita_alergia",
        "intolerancia",
        "efeito_adverso",
        "desconhecido",
      ],
      allergy_severity: [
        "leve",
        "moderada",
        "grave",
        "anafilaxia",
        "desconhecida",
      ],
      anexo_iv_modo: [
        "nunca",
        "apenas_alerta_medio_alto",
        "perguntar_sempre",
        "sempre_hospitalar",
      ],
      app_role: [
        "admin",
        "moderator",
        "user",
        "revisor",
        "enfermagem",
        "farmacia",
        "medico",
        "residente",
        "administrativo",
      ],
      aprendizado_termo_status: ["pendente", "aprovado", "rejeitado"],
      assinatura_ambiente: ["teste", "producao"],
      assinatura_modo: [
        "imprimir_sem_assinatura_digital",
        "gerar_pdf_para_assinar",
        "assinar_automaticamente",
        "enviar_para_assinatura_externa",
      ],
      assinatura_status_integracao: [
        "nao_configurado",
        "em_configuracao",
        "configurado",
        "erro",
        "producao",
      ],
      assinatura_tipo: [
        "sem_assinatura_digital",
        "assinatura_digital_externa",
        "certificado_a1",
        "certificado_a3",
        "assinatura_eletronica_simples",
        "integracao_api",
      ],
      bloco_checklist_item_chave: [
        "principio_ativo",
        "apresentacoes",
        "via_oral",
        "via_injetavel",
        "dose_adulto",
        "dose_pediatrica",
        "dose_maxima",
        "tipo_receita",
        "controlado_marcado",
        "alertas",
        "vinculo_cid_queixa",
        "vinculo_modelos",
        "fonte",
        "status_revisao",
      ],
      bloco_checklist_item_status: [
        "pendente",
        "em_andamento",
        "revisado",
        "nao_aplicavel",
      ],
      bloco_status: [
        "nao_iniciado",
        "em_cadastro",
        "em_revisao",
        "pronto_beta",
        "precisa_ajuste",
      ],
      checklist_status: ["pendente", "em_teste", "aprovado", "precisa_ajuste"],
      cid_atestado_modo: ["nunca", "perguntar_sempre", "se_medico_marcar"],
      clinical_alert_action: [
        "visualizou",
        "removeu_medicamento",
        "substituiu_medicamento",
        "confirmou_com_justificativa",
        "bloqueado_pelo_sistema",
        "ignorou_informativo",
      ],
      clinical_alert_kind: [
        "alergia_principio_ativo",
        "alergia_classe",
        "reacao_cruzada",
        "gestacao",
        "lactacao",
        "idade",
        "comorbidade",
        "cid",
        "restricao_paciente",
        "historico_reacao_adversa",
      ],
      contraindication_type: [
        "alergia_principio_ativo",
        "alergia_classe",
        "gestacao",
        "lactacao",
        "idade",
        "comorbidade",
        "diagnostico_cid",
        "condicao_clinica",
        "funcao_renal",
        "funcao_hepatica",
        "historico_reacao_adversa",
        "outro",
      ],
      documento_acao_log: [
        "visualizou_previa",
        "gerou_pdf",
        "imprimiu",
        "baixou",
        "enviou_email",
        "enviou_whatsapp",
        "copiou_link",
        "cancelou",
        "substituiu",
      ],
      documento_origem: [
        "atendimento_atual",
        "historico",
        "modelo",
        "protocolo",
        "entrada_inteligente",
        "manual",
      ],
      documento_status: [
        "rascunho",
        "gerado",
        "impresso",
        "enviado",
        "cancelado",
        "substituido",
      ],
      documento_tipo: [
        "receita_comum",
        "receita_controle_especial",
        "receita_antimicrobiano",
        "receita_controlado_especifico",
        "solicitacao_exames",
        "atestado",
        "encaminhamento",
        "relatorio",
        "declaracao",
        "orientacoes_paciente",
        "prescricao_hospitalar",
        "orientacoes_enfermagem_farmacia",
        "anexo_tecnico_iv",
        "plano_terapeutico",
        "resumo_atendimento",
        "aih",
        "apac",
        "notificacao_compulsoria",
        "procedimento",
      ],
      entrada_item_tipo: [
        "medicamento",
        "exame",
        "orientacao",
        "documento",
        "cuidado_enfermagem",
        "diagnostico",
        "nao_reconhecido",
      ],
      entrada_origem: [
        "prescricao",
        "exames",
        "orientacoes",
        "documentos",
        "historico",
        "outro",
      ],
      entrada_status_final: [
        "descartado",
        "aplicado_parcialmente",
        "aplicado_totalmente",
        "apenas_visualizado",
        "erro_extracao",
      ],
      entrada_tipo: ["texto_livre", "voz", "foto", "arquivo", "texto_colado"],
      historico_tipo_visualizado: [
        "prescricao",
        "medicamento",
        "exame",
        "documento",
        "alerta",
        "uso_continuo",
      ],
      interaction_alert_action: [
        "visualizou",
        "corrigiu_prescricao",
        "removeu_medicamento",
        "substituiu_medicamento",
        "confirmou_com_justificativa",
        "bloqueado_pelo_sistema",
        "ignorou_informativo",
      ],
      interaction_alert_kind: [
        "interacao_especifica",
        "duplicidade_terapeutica",
        "risco_acumulado",
        "monitorizacao",
        "bloqueio",
      ],
      interaction_alert_level: ["informativo", "atencao", "alto", "critico"],
      interaction_review_status: [
        "rascunho",
        "aguardando_revisao",
        "revisado",
        "precisa_corrigir",
        "inativo",
      ],
      interaction_severity: ["leve", "moderada", "grave", "contraindicada"],
      interaction_type: [
        "farmacocinetica",
        "farmacodinamica",
        "duplicidade_terapeutica",
        "qt_longo",
        "nefrotoxicidade_somada",
        "hepatotoxicidade_somada",
        "risco_hemorragico",
        "depressao_respiratoria",
        "sedacao_somada",
        "serotoninergico",
        "hipercalemia",
        "hipocalemia",
        "hipotensao",
        "bradicardia",
        "hipertensao",
        "glicemia",
        "outro",
      ],
      item_reuso_status: [
        "seguro_para_revisao",
        "requer_atencao",
        "exige_justificativa",
        "bloqueado",
        "dados_insuficientes",
        "desatualizado",
      ],
      iv_alert_action: [
        "corrigiu_prescricao",
        "confirmou_com_justificativa",
        "ignorou_alerta_informativo",
        "bloqueado_pelo_sistema",
      ],
      iv_alert_severity: ["info", "warning", "blocker"],
      iv_calc_status: [
        "calculado",
        "incompleto",
        "erro_unidade",
        "exige_peso",
        "exige_volume",
        "exige_tempo",
        "nao_aplicavel",
      ],
      iv_log_action: [
        "criou",
        "editou",
        "importou",
        "aprovou",
        "solicitou_correcao",
        "inativou",
        "reativou",
      ],
      iv_match_action: [
        "associado_automaticamente",
        "confirmado_pelo_usuario",
        "escolhido_manual",
        "ignorado",
        "sem_correspondencia",
      ],
      iv_match_type: ["exata", "parcial", "fuzzy", "manual", "nenhuma"],
      iv_pediatric_review_status: [
        "nao_cadastrado",
        "aguardando_revisao",
        "revisado",
        "precisa_corrigir",
        "inativo",
      ],
      iv_renal_hepatic_review_status: [
        "nao_cadastrado",
        "aguardando_revisao",
        "revisado",
        "precisa_corrigir",
        "inativo",
      ],
      iv_review_status: [
        "finalizada_sem_alertas",
        "finalizada_com_alertas_informativos",
        "finalizada_com_justificativa",
        "bloqueada_pelo_sistema",
        "retornou_para_edicao",
      ],
      iv_review_status_med: [
        "rascunho",
        "aguardando_revisao",
        "revisado",
        "precisa_corrigir",
        "inativo",
      ],
      iv_suggested_term_status: ["pendente", "aprovado", "rejeitado"],
      iv_text_action: [
        "gerou_texto",
        "editou_texto",
        "aprovou_texto",
        "marcou_precisa_ajuste",
        "substituiu_por_manual",
      ],
      iv_text_status: [
        "gerado_automaticamente",
        "aguardando_revisao",
        "revisado",
        "precisa_ajuste",
        "manual",
      ],
      lactation_alert_level: [
        "nao_cadastrado",
        "compativel",
        "usar_com_cautela",
        "evitar",
        "contraindicado",
      ],
      link_publico_status: ["ativo", "expirado", "revogado"],
      medicamento_alerta_gest_lact: [
        "seguro",
        "cautela",
        "evitar",
        "contraindicado",
        "sem_dados",
      ],
      medicamento_categoria_clinica: [
        "dor_febre",
        "nauseas_vomitos",
        "alergia_anafilaxia",
        "broncoespasmo_respiratorio",
        "antibioticos",
        "antivirais",
        "antifungicos",
        "gastrointestinal",
        "cardiovascular",
        "anti_hipertensivos",
        "diureticos",
        "corticoides",
        "anticoag_antiagreg",
        "neurologico_anticonvulsivante",
        "psiquiatria_agitacao",
        "sedacao_analgesia_hospitalar",
        "hidratacao_eletrolitos",
        "endocrino_metabolico",
        "diabetes_glicemia",
        "gineco_obstetricia",
        "pediatria_comum",
        "dermatologia_basica",
        "otorrino_oftalmo",
        "emergencia",
        "controlados",
      ],
      medicamento_contexto_uso: [
        "urgencia",
        "emergencia",
        "pronto_atendimento",
        "hospitalar",
        "ambulatorial_rapido",
        "pediatria",
        "gestante",
        "outro",
      ],
      medicamento_prioridade_mvp: [
        "essencial",
        "alta",
        "media",
        "baixa",
        "futuro",
      ],
      medicamento_status_revisao: [
        "rascunho",
        "aguardando_revisao",
        "revisado",
        "precisa_corrigir",
        "inativo",
      ],
      medicamento_tipo_receita: [
        "comum",
        "especial_b",
        "especial_a",
        "antimicrobiano",
        "controlado_outros",
      ],
      modulo_revisao_status: [
        "pronto",
        "em_ajuste",
        "pendente",
        "desativado_no_beta",
      ],
      pregnancy_alert_level: [
        "nao_cadastrado",
        "permitido_com_criterio",
        "atencao",
        "evitar",
        "contraindicado",
      ],
      pregnancy_trimester: [
        "qualquer",
        "primeiro",
        "segundo",
        "terceiro",
        "nao_aplicavel",
      ],
      protocol_context: [
        "urgencia",
        "enfermaria",
        "ambulatorio",
        "pronto_atendimento",
        "telemedicina",
        "hospitalar",
        "pediatria",
        "obstetricia",
        "geral",
      ],
      protocol_log_action: [
        "aberto",
        "item_adicionado",
        "item_editado",
        "item_ignorado",
        "plano_montado",
        "alerta_gerado",
        "aplicado_parcial",
      ],
      protocol_priority: ["imediata", "alta", "moderada", "baixa"],
      protocol_recommendation_level: [
        "forte",
        "moderada",
        "condicional",
        "baixa",
      ],
      protocol_review_status: [
        "rascunho",
        "aguardando_revisao",
        "revisado",
        "precisa_corrigir",
        "inativo",
      ],
      protocol_type: [
        "queixa",
        "sindrome",
        "cid",
        "diagnostico",
        "emergencia",
        "ambulatorial",
        "hospitalar",
        "pediatrico",
        "obstetrico",
        "outro",
      ],
      quickset_category: [
        "medicamentos",
        "exames",
        "orientacoes",
        "cuidados",
        "misto",
      ],
      reaproveitamento_acao: [
        "prescricao_aberta",
        "reaproveitar_clicado",
        "item_selecionado",
        "item_editado",
        "item_removido",
        "item_bloqueado",
        "item_adicionado",
        "justificativa_preenchida",
      ],
      regra_legal_review_status: [
        "aguardando_revisao",
        "revisado",
        "rejeitado",
      ],
      revisao_clinica_status: [
        "pending_review",
        "reviewed",
        "needs_correction",
        "inactive",
      ],
      risk_level: ["nenhum", "baixo", "moderado", "alto", "desconhecido"],
      template_context: [
        "urgencia",
        "enfermaria",
        "ambulatorio",
        "pronto_atendimento",
        "telemedicina",
        "hospitalar",
        "pediatria",
        "obstetricia",
        "geral",
      ],
      template_log_action: [
        "aberto",
        "aplicado",
        "item_editado",
        "item_removido",
        "alerta_gerado",
        "justificativa_registrada",
        "salvo_de_prescricao",
      ],
      template_review_status: [
        "rascunho",
        "aguardando_revisao",
        "revisado",
        "precisa_corrigir",
        "inativo",
      ],
      template_type: [
        "prescricao",
        "exames",
        "orientacoes",
        "cuidados_enfermagem",
        "misto",
        "protocolo_rapido",
        "alta",
        "internacao",
        "urgencia",
        "pediatrico",
      ],
      template_visibility: ["pessoal", "equipe", "institucional"],
      teste_clinico_status: [
        "pendente",
        "aprovado",
        "reprovado",
        "precisa_ajuste",
        "corrigido",
      ],
      tipo_receita_legal: [
        "comum",
        "controle_especial",
        "antimicrobiano",
        "azul",
        "amarela",
        "branca_duas_vias",
        "outro",
      ],
      uso_continuo_status: ["ativo", "suspenso", "finalizado"],
      vinculo_contexto: [
        "ambulatorial",
        "urgencia",
        "emergencia",
        "hospitalar",
        "qualquer",
      ],
      vinculo_papel: [
        "primeira_linha",
        "alternativa",
        "adjuvante",
        "sintomatico",
        "resgate",
        "hospitalar",
        "situacao_especifica",
      ],
      vinculo_status: [
        "pending_review",
        "reviewed",
        "needs_correction",
        "inactive",
      ],
    },
  },
} as const
