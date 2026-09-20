-- Alinha o enum documento_tipo com os 11 tipos de emissão do ActionGrid.
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'aih';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'apac';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'notificacao_compulsoria';
ALTER TYPE public.documento_tipo ADD VALUE IF NOT EXISTS 'procedimento';
