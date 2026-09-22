-- Migration A3: Roles + RLS + GRANTS em schema curadoria
-- Padrões:
-- - RLS HABILITADO em TODAS tabelas.
-- - LEITURA GLOBAL (anon/authenticated): liberado para todas tabelas de referência.
-- - ESCRITA: role curadoria_editor + service_role. service_role = tudo;
--            curadoria_editor = só para instituicoes que ele tem direito
--            (via current_setting 'app.current_instituicao_ids' ou NULL para nacional).

BEGIN;

-- Role curadoria_editor existe? (com no_login pois é de sistema)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='curadoria_editor') THEN
    CREATE ROLE curadoria_editor NOLOGIN;
  END IF;
END $$;

-- Grants básicos de uso schema para anon/authenticated/curadoria_editor
GRANT USAGE ON SCHEMA curadoria TO anon, authenticated, curadoria_editor;
ALTER DEFAULT PRIVILEGES IN SCHEMA curadoria GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA curadoria GRANT SELECT, USAGE ON SEQUENCES TO anon, authenticated, curadoria_editor;

-- ================================================================
-- Habilita RLS em TODAS tabelas do schema curadoria
-- ================================================================
DO $$ DECLARE rec record;
BEGIN
  FOR rec IN SELECT tablename FROM pg_tables WHERE schemaname='curadoria' LOOP
    EXECUTE format('ALTER TABLE curadoria.%I ENABLE ROW LEVEL SECURITY;', rec.tablename);
  END LOOP;
END $$;

-- ================================================================
-- Política de leitura apenas para o catálogo clínico compartilhado.
-- Templates, configurações institucionais e jobs permanecem protegidos.
-- ================================================================
DO $$ DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname='curadoria'
      AND tablename = ANY (ARRAY[
        'tipos_prescricao','monitorizacoes','classes_medicamentosas',
        'condicoes_clinicas','exames_complementares','protocolos_clinicos',
        'linhas_cuidado','modelos_documento','condicao_exames',
        'condicao_medicamentos_alternativos','condicao_classes_medicamentosas',
        'condicao_exame_fisico','condicao_modelos_documento',
        'condicao_protocolo_clinico','condicao_linha_cuidado',
        'condicao_ddx','condicao_refinamentos'
      ])
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS leitura_catalogo ON curadoria.%I;
       CREATE POLICY leitura_catalogo ON curadoria.%I FOR SELECT TO anon, authenticated USING (true);',
      rec.tablename, rec.tablename
    );
  END LOOP;
END $$;

-- ================================================================
-- Política de ESCRITA para curadoria_editor:
-- -- Tem permissão apenas se instituicao_id for NULL (base nacional)
-- -- OU se instituicao_id está no setting 'app.current_instituicao_ids[]'
-- -- Usamos funcao helper.
-- ================================================================

CREATE OR REPLACE FUNCTION curadoria.editor_pode_editar_inst(p_instituicao_id bigint) RETURNS boolean AS $$
DECLARE
  v_ids bigint[];
BEGIN
  -- Base nacional (NULL) permitido se a role service_role ou curadoria_editor nacional
  IF p_instituicao_id IS NULL THEN
    -- Apenas service_role (superuser da conexao service_role) ou curadoria_editor se permissão.
    -- Service role has bypass RLS anyway. Para curadoria_editor, permitimos NULL apenas se tiver perm. explicit via setting.
    IF current_setting('app.curadoria_edita_nacional', true) = 'sim' THEN
      RETURN true;
    END IF;
    -- Superuser (postgres) ou service_role Bypass RLS
    IF (SELECT rolsuper OR rolbypassrls FROM pg_roles WHERE rolname = current_user) THEN
      RETURN true;
    END IF;
  END IF;
  -- Instituição específica: verifica array
  BEGIN
    v_ids := current_setting('app.current_instituicao_ids', true)::bigint[];
  EXCEPTION WHEN OTHERS THEN v_ids := NULL;
  END;
  RETURN (v_ids IS NOT NULL AND p_instituicao_id = ANY(v_ids));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

DO $$ DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT t.tablename
    FROM pg_tables t
    WHERE t.schemaname='curadoria'
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema='curadoria'
          AND c.table_name=t.tablename
          AND c.column_name='instituicao_id'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS editor_local_ou_nacional ON curadoria.%I;
       CREATE POLICY editor_local_ou_nacional ON curadoria.%I
       FOR ALL TO curadoria_editor
       USING (
         (instituicao_id IS NULL AND current_setting(''app.curadoria_edita_nacional'',true) = ''sim'')
         OR curadoria.editor_pode_editar_inst(instituicao_id)
       )
       WITH CHECK (
         (instituicao_id IS NULL AND current_setting(''app.curadoria_edita_nacional'',true) = ''sim'')
         OR curadoria.editor_pode_editar_inst(instituicao_id)
       );',
      rec.tablename, rec.tablename
    );
  END LOOP;
END $$;

-- ================================================================
-- Grants de table-level para curadoria_editor e service_role
-- ================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA curadoria TO curadoria_editor, service_role;
GRANT ALL ON SCHEMA curadoria TO service_role;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA curadoria TO curadoria_editor, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA curadoria TO service_role, authenticated, curadoria_editor, anon;
GRANT EXECUTE ON FUNCTION curadoria.atualiza_updated_at() TO service_role, curadoria_editor;
GRANT EXECUTE ON FUNCTION curadoria.nome_negocio_normalizado(text) TO service_role, curadoria_editor, anon, authenticated;

-- Garante no futuro que tabelas novas herdaram grants default
ALTER DEFAULT PRIVILEGES IN SCHEMA curadoria
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA curadoria
  GRANT SELECT, INSERT, UPDATE ON TABLES TO curadoria_editor;
ALTER DEFAULT PRIVILEGES IN SCHEMA curadoria
  GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO service_role, curadoria_editor;

COMMIT;
