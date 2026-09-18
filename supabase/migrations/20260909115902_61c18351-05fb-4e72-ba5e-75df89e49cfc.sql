CREATE OR REPLACE FUNCTION public.fn_posologia_texto(
  p_dose_min numeric, p_dose_max numeric, p_unidade text,
  p_via text, p_frequencia text, p_duracao text, p_intervalo_horas int
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(btrim(concat_ws(' ',
    NULLIF(concat_ws('–',
      trim_scale(p_dose_min)::text,
      NULLIF(trim_scale(p_dose_max)::text, trim_scale(p_dose_min)::text)
    ), ''),
    NULLIF(btrim(coalesce(p_unidade,'')), ''),
    public.fn_via_canonica(p_via),
    NULLIF(btrim(coalesce(p_frequencia,'')), ''),
    CASE WHEN p_intervalo_horas IS NOT NULL AND coalesce(btrim(p_frequencia),'') = ''
         THEN p_intervalo_horas || '/' || p_intervalo_horas || 'h' END,
    CASE WHEN NULLIF(btrim(coalesce(p_duracao,'')), '') IS NOT NULL
         THEN 'por ' || btrim(p_duracao) END
  )), '');
$$;