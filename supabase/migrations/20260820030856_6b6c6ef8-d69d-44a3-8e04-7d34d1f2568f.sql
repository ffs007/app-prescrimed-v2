SELECT public.promover_stg_patologias('diabetes_endocrino_cronico_v1');
SELECT public.promover_stg_exames('diabetes_endocrino_cronico_v1');
SELECT public.promover_stg_patologia_exames('diabetes_endocrino_cronico_v1');
SELECT public.fn_etl_sinais_alarme('diabetes_endocrino_cronico_v1');
UPDATE public.stg_patologias SET processado = true WHERE lote_id = 'diabetes_endocrino_cronico_v1';
UPDATE public.stg_exames SET processado = true WHERE lote_id = 'diabetes_endocrino_cronico_v1';
UPDATE public.stg_patologia_exames SET processado = true WHERE lote_id = 'diabetes_endocrino_cronico_v1';
UPDATE public.stg_sinais_alarme SET processado = true WHERE lote_id = 'diabetes_endocrino_cronico_v1';