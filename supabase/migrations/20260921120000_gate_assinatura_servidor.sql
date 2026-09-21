-- 1.9: gate de assinatura no servidor para os recursos Pro (AIH, notificação
-- compulsória, atualizações por IA). Antes, o RLS só checava dono
-- (auth.uid()); uma chamada direta à API (sem passar pela tela) driblava o
-- "RequireSubscription" do front, que é só UI.

-- has_active_subscription(uuid) já existia (migration 20260909011544) mas
-- filtra por "environment" e teve EXECUTE revogado de authenticated logo
-- depois — hoje é código morto. Esta função nova ignora "environment"
-- (médico individual, uma assinatura por vez) e é de uso interno
-- (service_role / SECURITY DEFINER), nunca chamável direto por outro
-- usuário com uuid alheio.
DROP FUNCTION IF EXISTS public.has_active_subscription(uuid, text);

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND (
        (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO service_role;

-- Wrapper para uso em RLS: só responde sobre o próprio chamador (auth.uid()),
-- por isso pode ser liberado para authenticated sem virar oráculo de terceiros.
CREATE OR REPLACE FUNCTION public.has_active_subscription_self()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_active_subscription(auth.uid());
$$;
REVOKE ALL ON FUNCTION public.has_active_subscription_self() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.has_active_subscription_self() TO authenticated;

-- Notificação compulsória: criar notificação nova exige assinatura ativa.
-- Consultar/editar/apagar as já criadas continua livre (retenção Q8).
DROP POLICY IF EXISTS "own notificacoes insert" ON public.notificacoes_compulsorias;
CREATE POLICY "own notificacoes insert" ON public.notificacoes_compulsorias
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_active_subscription_self());

-- Atualizações por IA: toda proposta nova (vinda do ai-assist) exige
-- assinatura ativa. Consultar/aprovar/descartar as já geradas continua livre.
DROP POLICY IF EXISTS "own ia updates" ON public.ia_atualizacoes_pendentes;
CREATE POLICY "own ia updates select" ON public.ia_atualizacoes_pendentes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own ia updates insert" ON public.ia_atualizacoes_pendentes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.has_active_subscription_self());
CREATE POLICY "own ia updates update" ON public.ia_atualizacoes_pendentes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own ia updates delete" ON public.ia_atualizacoes_pendentes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Versão de protocolo: só a promovida a partir de sugestão de IA
-- (origem <> 'manual', ver useAIUpdates.ts) exige assinatura ativa. Edição
-- manual de protocolo (origem = 'manual') não é recurso Pro, continua livre.
DROP POLICY IF EXISTS "own protocol versions" ON public.protocolo_versoes;
CREATE POLICY "own protocol versions select" ON public.protocolo_versoes
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own protocol versions insert" ON public.protocolo_versoes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND (origem = 'manual' OR public.has_active_subscription_self()));
CREATE POLICY "own protocol versions update" ON public.protocolo_versoes
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "own protocol versions delete" ON public.protocolo_versoes
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Emissão de documento AIH ou notificação compulsória exige assinatura
-- ativa no momento de gravar em documentos_gerados. Os demais 13 tipos de
-- documento (receita, atestado, etc.) não são recurso Pro, continuam livres.
DROP POLICY IF EXISTS "Owner insert documentos_gerados" ON public.documentos_gerados;
CREATE POLICY "Owner insert documentos_gerados" ON public.documentos_gerados
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = gerado_por
    AND (
      tipo NOT IN ('aih'::documento_tipo, 'notificacao_compulsoria'::documento_tipo)
      OR public.has_active_subscription_self()
    )
  );
