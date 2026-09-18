UPDATE public.stg_patologias SET processado = true WHERE lote_id='negligenciadas_v1' AND processado = false;
UPDATE public.stg_exames SET processado = true WHERE lote_id='negligenciadas_v1' AND processado = false;
UPDATE public.stg_sinais_alarme SET processado = true WHERE lote_id='negligenciadas_v1' AND processado = false;