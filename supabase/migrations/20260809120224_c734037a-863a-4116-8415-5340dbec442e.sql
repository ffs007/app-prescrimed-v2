CREATE TABLE IF NOT EXISTS public.base_sinais_alarme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  sistema text,
  descricao_sinal_medico text,
  descricao_sinal_paciente text,
  gravidade text,
  conduta text,
  tempo_maximo_acao_horas integer,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.base_sinais_alarme TO authenticated;
GRANT ALL ON public.base_sinais_alarme TO service_role;

ALTER TABLE public.base_sinais_alarme ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'base_sinais_alarme' AND policyname = 'Sinais de alarme legíveis por usuários autenticados') THEN
    CREATE POLICY "Sinais de alarme legíveis por usuários autenticados"
    ON public.base_sinais_alarme FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'base_sinais_alarme' AND policyname = 'Apenas admins gerenciam sinais de alarme') THEN
    CREATE POLICY "Apenas admins gerenciam sinais de alarme"
    ON public.base_sinais_alarme FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.base_escores_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  nome_escore text NOT NULL,
  nome_normalizado text NOT NULL,
  sigla text,
  tipo text,
  dominio text,
  populacao text,
  faixa_etaria text,
  n_itens integer,
  tempo_aplicacao_min integer,
  validacao_ptbr boolean DEFAULT false,
  referencia_validacao text,
  pontos_corte jsonb,
  desempenho jsonb,
  evidencia text,
  fonte_id uuid REFERENCES public.base_referencias_clinicas(id),
  trecho_citado text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.base_escores_clinicos TO authenticated;
GRANT ALL ON public.base_escores_clinicos TO service_role;

ALTER TABLE public.base_escores_clinicos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'base_escores_clinicos' AND policyname = 'Escores clínicos legíveis por usuários autenticados') THEN
    CREATE POLICY "Escores clínicos legíveis por usuários autenticados"
    ON public.base_escores_clinicos FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'base_escores_clinicos' AND policyname = 'Apenas admins gerenciam escores clínicos') THEN
    CREATE POLICY "Apenas admins gerenciam escores clínicos"
    ON public.base_escores_clinicos FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.base_escore_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id text NOT NULL,
  escore_id uuid REFERENCES public.base_escores_clinicos(id),
  ordem integer NOT NULL,
  descricao text NOT NULL,
  pontuacao jsonb,
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.base_escore_itens TO authenticated;
GRANT ALL ON public.base_escore_itens TO service_role;

ALTER TABLE public.base_escore_itens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'base_escore_itens' AND policyname = 'Itens de escore legíveis por usuários autenticados') THEN
    CREATE POLICY "Itens de escore legíveis por usuários autenticados"
    ON public.base_escore_itens FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'base_escore_itens' AND policyname = 'Apenas admins gerenciam itens de escore') THEN
    CREATE POLICY "Apenas admins gerenciam itens de escore"
    ON public.base_escore_itens FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_sinais_alarme_updated ON public.base_sinais_alarme;
CREATE TRIGGER trg_sinais_alarme_updated
BEFORE UPDATE ON public.base_sinais_alarme
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_escores_updated ON public.base_escores_clinicos;
CREATE TRIGGER trg_escores_updated
BEFORE UPDATE ON public.base_escores_clinicos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_escore_itens_updated ON public.base_escore_itens;
CREATE TRIGGER trg_escore_itens_updated
BEFORE UPDATE ON public.base_escore_itens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();