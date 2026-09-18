CREATE TABLE public.documento_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  descricao text,
  documento_tipo text NOT NULL DEFAULT 'todos',
  is_galeria boolean NOT NULL DEFAULT false,
  visibilidade text NOT NULL DEFAULT 'privado',
  instituicao text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT documento_templates_visibilidade_chk CHECK (visibilidade IN ('privado','instituicao','publico'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documento_templates TO authenticated;
GRANT ALL ON public.documento_templates TO service_role;

ALTER TABLE public.documento_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_visiveis"
  ON public.documento_templates FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_galeria = true
    OR visibilidade IN ('publico','instituicao')
  );

CREATE POLICY "templates_insert_proprio"
  ON public.documento_templates FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (is_galeria = false OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "templates_update_proprio"
  ON public.documento_templates FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (
    (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    AND (is_galeria = false OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "templates_delete_proprio"
  ON public.documento_templates FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_documento_templates_user ON public.documento_templates (user_id);
CREATE INDEX idx_documento_templates_tipo ON public.documento_templates (documento_tipo);

CREATE TRIGGER trg_documento_templates_updated
  BEFORE UPDATE ON public.documento_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_generic();