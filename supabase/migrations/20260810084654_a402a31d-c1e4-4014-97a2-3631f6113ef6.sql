CREATE TABLE IF NOT EXISTS public.protocolos_ps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  codigo_protocolo text UNIQUE NOT NULL,
  nome text NOT NULL,
  patologia_id uuid REFERENCES public.stg_patologias(id),
  tipo text,
  contexto text,
  tempo_critico boolean DEFAULT false,
  janela_terapeutica_min integer,
  fonte_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocolos_ps TO authenticated;
GRANT ALL ON public.protocolos_ps TO service_role;
ALTER TABLE public.protocolos_ps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "protocolos_ps_select_auth" ON public.protocolos_ps FOR SELECT TO authenticated USING (true);
CREATE POLICY "protocolos_ps_admin_all" ON public.protocolos_ps FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_protocolos_ps_updated BEFORE UPDATE ON public.protocolos_ps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_protocolos_ps_lote ON public.protocolos_ps(lote_id);

CREATE TABLE IF NOT EXISTS public.protocolo_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id uuid REFERENCES public.protocolos_ps(id) ON DELETE CASCADE,
  ordem integer NOT NULL,
  fase text,
  titulo text NOT NULL,
  instrucao text,
  tempo_alvo_min integer,
  obrigatorio boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.protocolo_etapas TO authenticated;
GRANT ALL ON public.protocolo_etapas TO service_role;
ALTER TABLE public.protocolo_etapas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "protocolo_etapas_select_auth" ON public.protocolo_etapas FOR SELECT TO authenticated USING (true);
CREATE POLICY "protocolo_etapas_admin_all" ON public.protocolo_etapas FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_protocolo_etapas_protocolo ON public.protocolo_etapas(protocolo_id, ordem);