ALTER TABLE public.protocolo_etapas
  ADD CONSTRAINT protocolo_etapas_ordem_positiva CHECK (ordem > 0);

CREATE UNIQUE INDEX IF NOT EXISTS uq_protocolo_etapas_protocolo_ordem
  ON public.protocolo_etapas (protocolo_id, ordem);

CREATE UNIQUE INDEX IF NOT EXISTS uq_protocolo_etapas_protocolo_titulo
  ON public.protocolo_etapas (protocolo_id, lower(btrim(titulo)));