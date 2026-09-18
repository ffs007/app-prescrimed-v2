
-- Enums
CREATE TYPE public.bloco_status AS ENUM ('nao_iniciado','em_cadastro','em_revisao','pronto_beta','precisa_ajuste');
CREATE TYPE public.bloco_checklist_item_status AS ENUM ('pendente','em_andamento','revisado','nao_aplicavel');
CREATE TYPE public.bloco_checklist_item_chave AS ENUM (
  'principio_ativo','apresentacoes','via_oral','via_injetavel',
  'dose_adulto','dose_pediatrica','dose_maxima','tipo_receita',
  'controlado_marcado','alertas','vinculo_cid_queixa','vinculo_modelos',
  'fonte','status_revisao'
);

-- Tabela de blocos
CREATE TABLE public.base_blocos_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  descricao text,
  total_previsto int NOT NULL DEFAULT 0,
  categoria_clinica text,
  status_bloco public.bloco_status NOT NULL DEFAULT 'nao_iniciado',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.base_blocos_medicamentos_planejados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_slug text NOT NULL REFERENCES public.base_blocos_clinicos(slug) ON DELETE CASCADE,
  principio_ativo text NOT NULL,
  principio_ativo_normalizado text,
  prioridade text NOT NULL DEFAULT 'media',
  observacao text,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_blocos_planejados_bloco ON public.base_blocos_medicamentos_planejados(bloco_slug);
CREATE INDEX idx_blocos_planejados_norm ON public.base_blocos_medicamentos_planejados(principio_ativo_normalizado);

CREATE TABLE public.base_blocos_checklist_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bloco_slug text NOT NULL REFERENCES public.base_blocos_clinicos(slug) ON DELETE CASCADE,
  medicamento_id uuid REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  item_chave public.bloco_checklist_item_chave NOT NULL,
  status public.bloco_checklist_item_status NOT NULL DEFAULT 'pendente',
  nota text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_blocos_checklist_bloco ON public.base_blocos_checklist_itens(bloco_slug);
CREATE INDEX idx_blocos_checklist_med ON public.base_blocos_checklist_itens(medicamento_id);

-- Triggers updated_at + normalize
CREATE OR REPLACE FUNCTION public.blocos_set_updated()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.blocos_planejados_set_normalized()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.principio_ativo_normalizado := public.iv_normalize_text(NEW.principio_ativo);
  NEW.updated_at = now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_blocos_clinicos_upd BEFORE UPDATE ON public.base_blocos_clinicos
  FOR EACH ROW EXECUTE FUNCTION public.blocos_set_updated();
CREATE TRIGGER trg_blocos_planejados_norm BEFORE INSERT OR UPDATE ON public.base_blocos_medicamentos_planejados
  FOR EACH ROW EXECUTE FUNCTION public.blocos_planejados_set_normalized();
CREATE TRIGGER trg_blocos_checklist_upd BEFORE UPDATE ON public.base_blocos_checklist_itens
  FOR EACH ROW EXECUTE FUNCTION public.blocos_set_updated();

-- RLS
ALTER TABLE public.base_blocos_clinicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_blocos_medicamentos_planejados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_blocos_checklist_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocos read auth" ON public.base_blocos_clinicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocos write admin" ON public.base_blocos_clinicos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "blocos plan read auth" ON public.base_blocos_medicamentos_planejados FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocos plan write admin" ON public.base_blocos_medicamentos_planejados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "blocos check read auth" ON public.base_blocos_checklist_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "blocos check write admin" ON public.base_blocos_checklist_itens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed dos 15 blocos
INSERT INTO public.base_blocos_clinicos (slug, nome, ordem, categoria_clinica, total_previsto) VALUES
  ('dor_febre','Dor e febre',1,'dor_febre',8),
  ('nauseas_vomitos','Náuseas e vômitos',2,'nauseas_vomitos',5),
  ('alergia_anafilaxia','Alergia e anafilaxia',3,'alergia_anafilaxia',9),
  ('respiratorio','Respiratório',4,'broncoespasmo_respiratorio',8),
  ('antibioticos_comuns','Antibióticos comuns',5,'antibioticos',13),
  ('gastrointestinal','Gastrointestinal',6,'gastrointestinal',9),
  ('hidratacao_eletrolitos','Hidratação e eletrólitos',7,'hidratacao_eletrolitos',9),
  ('cardiovascular_pressao','Cardiovascular / pressão',8,'cardiovascular',11),
  ('neuro_convulsao_agitacao','Neurológico / convulsão / agitação',9,'neurologico_anticonvulsivante',10),
  ('diabetes_glicemia','Diabetes / glicemia',10,'diabetes_glicemia',6),
  ('gineco_obstetricia_basica','Gineco-obstetrícia básica',11,'gineco_obstetricia',7),
  ('dermatologia_basica','Dermatologia básica',12,'dermatologia_basica',8),
  ('otorrino_oftalmo_basico','Otorrino / oftalmo básico',13,'otorrino_oftalmo',9),
  ('controlados_essenciais','Controlados essenciais',14,'controlados',8),
  ('emergencia','Medicamentos de emergência',15,'emergencia',16);

-- Seed dos princípios ativos planejados por bloco
INSERT INTO public.base_blocos_medicamentos_planejados (bloco_slug, principio_ativo, ordem) VALUES
  ('dor_febre','dipirona',1),('dor_febre','paracetamol',2),('dor_febre','ibuprofeno',3),
  ('dor_febre','cetoprofeno',4),('dor_febre','diclofenaco',5),('dor_febre','tramadol',6),
  ('dor_febre','morfina',7),('dor_febre','codeina',8),

  ('nauseas_vomitos','ondansetrona',1),('nauseas_vomitos','metoclopramida',2),
  ('nauseas_vomitos','bromoprida',3),('nauseas_vomitos','dimenidrinato',4),
  ('nauseas_vomitos','domperidona',5),

  ('alergia_anafilaxia','adrenalina',1),('alergia_anafilaxia','dexclorfeniramina',2),
  ('alergia_anafilaxia','prometazina',3),('alergia_anafilaxia','loratadina',4),
  ('alergia_anafilaxia','cetirizina',5),('alergia_anafilaxia','hidrocortisona',6),
  ('alergia_anafilaxia','dexametasona',7),('alergia_anafilaxia','prednisona',8),
  ('alergia_anafilaxia','prednisolona',9),

  ('respiratorio','salbutamol',1),('respiratorio','ipratropio',2),('respiratorio','fenoterol',3),
  ('respiratorio','budesonida',4),('respiratorio','dexametasona',5),('respiratorio','prednisolona',6),
  ('respiratorio','hidrocortisona',7),('respiratorio','aminofilina',8),

  ('antibioticos_comuns','amoxicilina',1),('antibioticos_comuns','amoxicilina + clavulanato',2),
  ('antibioticos_comuns','azitromicina',3),('antibioticos_comuns','cefalexina',4),
  ('antibioticos_comuns','ceftriaxona',5),('antibioticos_comuns','cefazolina',6),
  ('antibioticos_comuns','cefepima',7),('antibioticos_comuns','ciprofloxacino',8),
  ('antibioticos_comuns','levofloxacino',9),('antibioticos_comuns','metronidazol',10),
  ('antibioticos_comuns','clindamicina',11),('antibioticos_comuns','sulfametoxazol + trimetoprima',12),
  ('antibioticos_comuns','nitrofurantoina',13),

  ('gastrointestinal','omeprazol',1),('gastrointestinal','pantoprazol',2),
  ('gastrointestinal','escopolamina',3),('gastrointestinal','simeticona',4),
  ('gastrointestinal','loperamida',5),('gastrointestinal','lactulose',6),
  ('gastrointestinal','metoclopramida',7),('gastrointestinal','bromoprida',8),
  ('gastrointestinal','ondansetrona',9),

  ('hidratacao_eletrolitos','soro fisiologico 0,9%',1),('hidratacao_eletrolitos','soro glicosado 5%',2),
  ('hidratacao_eletrolitos','ringer lactato',3),('hidratacao_eletrolitos','cloreto de potassio',4),
  ('hidratacao_eletrolitos','fosfato de potassio',5),('hidratacao_eletrolitos','sulfato de magnesio',6),
  ('hidratacao_eletrolitos','bicarbonato de sodio',7),('hidratacao_eletrolitos','gluconato de calcio',8),
  ('hidratacao_eletrolitos','glicose hipertonica',9),

  ('cardiovascular_pressao','captopril',1),('cardiovascular_pressao','losartana',2),
  ('cardiovascular_pressao','enalapril',3),('cardiovascular_pressao','anlodipino',4),
  ('cardiovascular_pressao','atenolol',5),('cardiovascular_pressao','metoprolol',6),
  ('cardiovascular_pressao','furosemida',7),('cardiovascular_pressao','hidroclorotiazida',8),
  ('cardiovascular_pressao','espironolactona',9),('cardiovascular_pressao','nitroglicerina',10),
  ('cardiovascular_pressao','mononitrato de isossorbida',11),

  ('neuro_convulsao_agitacao','diazepam',1),('neuro_convulsao_agitacao','midazolam',2),
  ('neuro_convulsao_agitacao','fenitoina',3),('neuro_convulsao_agitacao','fenobarbital',4),
  ('neuro_convulsao_agitacao','acido valproico',5),('neuro_convulsao_agitacao','levetiracetam',6),
  ('neuro_convulsao_agitacao','haloperidol',7),('neuro_convulsao_agitacao','risperidona',8),
  ('neuro_convulsao_agitacao','olanzapina',9),('neuro_convulsao_agitacao','clonazepam',10),

  ('diabetes_glicemia','insulina regular',1),('diabetes_glicemia','insulina nph',2),
  ('diabetes_glicemia','glicose hipertonica',3),('diabetes_glicemia','glucagon',4),
  ('diabetes_glicemia','metformina',5),('diabetes_glicemia','glibenclamida',6),

  ('gineco_obstetricia_basica','acido folico',1),('gineco_obstetricia_basica','sulfato ferroso',2),
  ('gineco_obstetricia_basica','metildopa',3),('gineco_obstetricia_basica','nifedipino',4),
  ('gineco_obstetricia_basica','sulfato de magnesio',5),('gineco_obstetricia_basica','ocitocina',6),
  ('gineco_obstetricia_basica','misoprostol',7),

  ('dermatologia_basica','dexametasona creme',1),('dermatologia_basica','hidrocortisona creme',2),
  ('dermatologia_basica','cetoconazol creme',3),('dermatologia_basica','mupirocina',4),
  ('dermatologia_basica','neomicina + bacitracina',5),('dermatologia_basica','permetrina',6),
  ('dermatologia_basica','ivermectina',7),('dermatologia_basica','fluconazol',8),

  ('otorrino_oftalmo_basico','solucao nasal fisiologica',1),('otorrino_oftalmo_basico','budesonida nasal',2),
  ('otorrino_oftalmo_basico','loratadina',3),('otorrino_oftalmo_basico','cetirizina',4),
  ('otorrino_oftalmo_basico','amoxicilina',5),('otorrino_oftalmo_basico','amoxicilina + clavulanato',6),
  ('otorrino_oftalmo_basico','azitromicina',7),('otorrino_oftalmo_basico','colirio lubrificante',8),
  ('otorrino_oftalmo_basico','antibiotico oftalmico',9),

  ('controlados_essenciais','tramadol',1),('controlados_essenciais','morfina',2),
  ('controlados_essenciais','codeina',3),('controlados_essenciais','diazepam',4),
  ('controlados_essenciais','midazolam',5),('controlados_essenciais','clonazepam',6),
  ('controlados_essenciais','fenobarbital',7),('controlados_essenciais','metilfenidato',8),

  ('emergencia','adrenalina',1),('emergencia','noradrenalina',2),('emergencia','atropina',3),
  ('emergencia','amiodarona',4),('emergencia','adenosina',5),('emergencia','nitroprussiato de sodio',6),
  ('emergencia','nitroglicerina',7),('emergencia','bicarbonato de sodio',8),
  ('emergencia','gluconato de calcio',9),('emergencia','sulfato de magnesio',10),
  ('emergencia','glicose hipertonica',11),('emergencia','hidrocortisona',12),
  ('emergencia','salbutamol',13),('emergencia','ipratropio',14),
  ('emergencia','midazolam',15),('emergencia','diazepam',16);
