CREATE TABLE IF NOT EXISTS public.stg_protocolos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  linha_origem text,
  linha_bruta text,
  nome_protocolo text,
  nome_patologia text,
  cid10 text,
  tipo_protocolo text,
  area_clinica text,
  contexto_atendimento text,
  populacao_alvo text,
  sinais_gravidade text,
  diagnosticos_diferenciais text,
  condutas_iniciais text,
  exames_sugeridos text,
  medicamentos_sugeridos text,
  medidas_nao_farmacologicas text,
  cuidados_enfermagem text,
  criterios_internacao text,
  criterios_encaminhamento text,
  sinais_retorno_imediato text,
  orientacoes_paciente text,
  alertas_seguranca text,
  contraindicacoes_relevantes text,
  fonte_id text,
  trecho_citado text,
  importado_em timestamptz DEFAULT now(),
  processado boolean DEFAULT false
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stg_protocolos TO authenticated;
GRANT ALL ON public.stg_protocolos TO service_role;

ALTER TABLE public.stg_protocolos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stg_admin_only"
ON public.stg_protocolos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_stg_protocolos_lote ON public.stg_protocolos (lote_id);
CREATE INDEX IF NOT EXISTS idx_stg_protocolos_patologia ON public.stg_protocolos (nome_patologia);