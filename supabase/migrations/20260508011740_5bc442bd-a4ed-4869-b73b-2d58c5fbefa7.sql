-- Roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- IV medications
CREATE TYPE public.alert_level AS ENUM ('baixo', 'medio', 'alto');

CREATE TABLE public.iv_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  principio_ativo TEXT NOT NULL,
  nome_comercial_referencia TEXT,
  apresentacao TEXT,
  via_administracao TEXT NOT NULL DEFAULT 'IV',
  volume_reconstituicao TEXT,
  diluente_reconstituicao TEXT,
  estabilidade_apos_reconstituicao TEXT,
  solucoes_compativeis TEXT[] NOT NULL DEFAULT '{}',
  volume_diluicao TEXT,
  estabilidade_apos_diluicao TEXT,
  concentracao_maxima TEXT,
  tempo_minimo_infusao TEXT,
  velocidade_maxima_infusao TEXT,
  ph TEXT,
  observacoes_gerais TEXT,
  risco_flebite BOOLEAN NOT NULL DEFAULT false,
  exige_fotoprotecao BOOLEAN NOT NULL DEFAULT false,
  exige_equipo_fotossensivel BOOLEAN NOT NULL DEFAULT false,
  exige_filtro BOOLEAN NOT NULL DEFAULT false,
  incompatibilidades TEXT[] NOT NULL DEFAULT '{}',
  volume_expansao_pos_reconstituicao TEXT,
  nivel_alerta public.alert_level NOT NULL DEFAULT 'baixo',
  alerta_medico TEXT,
  alerta_enfermagem_farmacia TEXT,
  fonte_referencia TEXT,
  data_atualizacao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_iv_medications_principio ON public.iv_medications (principio_ativo);
CREATE INDEX idx_iv_medications_nivel ON public.iv_medications (nivel_alerta);

ALTER TABLE public.iv_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view IV meds"
  ON public.iv_medications FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert IV meds"
  ON public.iv_medications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update IV meds"
  ON public.iv_medications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete IV meds"
  ON public.iv_medications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER iv_medications_set_updated_at
BEFORE UPDATE ON public.iv_medications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();