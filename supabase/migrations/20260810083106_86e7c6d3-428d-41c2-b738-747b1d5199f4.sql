-- Normalização antes de validar
CREATE OR REPLACE FUNCTION public.stg_sinais_alarme_normalize()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.lote_id := btrim(NEW.lote_id);
  NEW.linha_origem := NULLIF(btrim(NEW.linha_origem), '');
  NEW.sistema := NULLIF(lower(btrim(NEW.sistema)), '');
  NEW.descricao_sinal_medico := NULLIF(btrim(NEW.descricao_sinal_medico), '');
  NEW.descricao_sinal_paciente := NULLIF(btrim(NEW.descricao_sinal_paciente), '');
  NEW.conduta := NULLIF(btrim(NEW.conduta), '');
  NEW.fonte_id := NULLIF(btrim(NEW.fonte_id), '');

  -- gravidade: minúsculas, sem acentos, sinônimos comuns
  NEW.gravidade := lower(btrim(coalesce(NEW.gravidade, '')));
  NEW.gravidade := translate(NEW.gravidade,
    'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc');
  NEW.gravidade := CASE NEW.gravidade
    WHEN 'critica' THEN 'critico'
    WHEN 'alta' THEN 'alto'
    WHEN 'moderada' THEN 'moderado'
    WHEN 'media' THEN 'moderado'
    WHEN 'medio' THEN 'moderado'
    WHEN 'baixa' THEN 'baixo'
    WHEN '' THEN NULL
    ELSE NEW.gravidade
  END;

  -- tempo: aceita "0h", "2 h", "1,5" -> número
  IF NEW.tempo_maximo_acao_horas IS NOT NULL THEN
    NEW.tempo_maximo_acao_horas := btrim(
      regexp_replace(replace(lower(NEW.tempo_maximo_acao_horas), ',', '.'), '\s*h(oras?)?$', '')
    );
    NEW.tempo_maximo_acao_horas := NULLIF(NEW.tempo_maximo_acao_horas, '');
  END IF;

  IF NEW.descricao_sinal_medico IS NULL THEN
    RAISE EXCEPTION 'descricao_sinal_medico é obrigatória (lote %, linha %)', NEW.lote_id, NEW.linha_origem;
  END IF;
  IF NEW.sistema IS NULL THEN
    RAISE EXCEPTION 'sistema é obrigatório (lote %, linha %)', NEW.lote_id, NEW.linha_origem;
  END IF;
  IF NEW.gravidade IS NULL OR NEW.gravidade NOT IN ('critico','alto','moderado','baixo') THEN
    RAISE EXCEPTION 'gravidade inválida "%" (use critico, alto, moderado ou baixo) — lote %, linha %',
      NEW.gravidade, NEW.lote_id, NEW.linha_origem;
  END IF;
  IF NEW.tempo_maximo_acao_horas IS NOT NULL
     AND (NEW.tempo_maximo_acao_horas !~ '^[0-9]+(\.[0-9]+)?$'
          OR NEW.tempo_maximo_acao_horas::numeric > 720) THEN
    RAISE EXCEPTION 'tempo_maximo_acao_horas inválido "%" (informe horas entre 0 e 720) — lote %, linha %',
      NEW.tempo_maximo_acao_horas, NEW.lote_id, NEW.linha_origem;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_stg_sinais_alarme_normalize ON public.stg_sinais_alarme;
CREATE TRIGGER trg_stg_sinais_alarme_normalize
BEFORE INSERT OR UPDATE ON public.stg_sinais_alarme
FOR EACH ROW EXECUTE FUNCTION public.stg_sinais_alarme_normalize();

-- Anti-duplicidade dentro do mesmo lote
CREATE UNIQUE INDEX IF NOT EXISTS uq_stg_sinais_alarme_lote_linha
  ON public.stg_sinais_alarme (lote_id, linha_origem)
  WHERE linha_origem IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_stg_sinais_alarme_lote_sistema_desc
  ON public.stg_sinais_alarme (lote_id, sistema, lower(btrim(descricao_sinal_medico)));
