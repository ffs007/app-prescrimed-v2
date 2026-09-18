CREATE TABLE public.library_descobertas (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('protocolo','escore','trial','fluxograma')),
  nome text not null,
  descricao text,
  patologias text[] not null default '{}',
  especialidade text,
  gravidade text,
  ambientes text[] not null default '{}',
  referencia text,
  url text,
  consulta text,
  status text not null default 'pendente' check (status in ('pendente','aprovado','descartado')),
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, nome)
);

GRANT SELECT, INSERT, UPDATE ON public.library_descobertas TO authenticated;
GRANT ALL ON public.library_descobertas TO service_role;
ALTER TABLE public.library_descobertas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "descobertas_select_auth" ON public.library_descobertas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "descobertas_insert_auth" ON public.library_descobertas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "descobertas_update_auth" ON public.library_descobertas
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE public.cid_preferencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patologia_chave text not null,
  patologia_nome text,
  cid_principal text,
  cids_associados text[] not null default '{}',
  cids_removidos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, patologia_chave)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cid_preferencias TO authenticated;
GRANT ALL ON public.cid_preferencias TO service_role;
ALTER TABLE public.cid_preferencias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cid_pref_own" ON public.cid_preferencias
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.cid_combos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  cid_principal text,
  cids_associados text[] not null default '{}',
  contexto text,
  usos integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cid_combos TO authenticated;
GRANT ALL ON public.cid_combos TO service_role;
ALTER TABLE public.cid_combos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cid_combos_own" ON public.cid_combos
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_library_descobertas_updated BEFORE UPDATE ON public.library_descobertas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER trg_cid_preferencias_updated BEFORE UPDATE ON public.cid_preferencias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();
CREATE TRIGGER trg_cid_combos_updated BEFORE UPDATE ON public.cid_combos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();