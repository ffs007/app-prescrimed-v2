
-- ============= ENUMS =============
CREATE TYPE public.medicamento_categoria_clinica AS ENUM (
  'dor_febre','nauseas_vomitos','alergia_anafilaxia','broncoespasmo_respiratorio',
  'antibioticos','antivirais','antifungicos','gastrointestinal','cardiovascular',
  'anti_hipertensivos','diureticos','corticoides','anticoag_antiagreg',
  'neurologico_anticonvulsivante','psiquiatria_agitacao','sedacao_analgesia_hospitalar',
  'hidratacao_eletrolitos','endocrino_metabolico','diabetes_glicemia',
  'gineco_obstetricia','pediatria_comum','dermatologia_basica','otorrino_oftalmo',
  'emergencia','controlados'
);

CREATE TYPE public.medicamento_prioridade_mvp AS ENUM ('essencial','alta','media','baixa','futuro');
CREATE TYPE public.medicamento_status_revisao AS ENUM ('rascunho','aguardando_revisao','revisado','precisa_corrigir','inativo');
CREATE TYPE public.medicamento_tipo_receita AS ENUM ('comum','especial_b','especial_a','antimicrobiano','controlado_outros');
CREATE TYPE public.medicamento_alerta_gest_lact AS ENUM ('seguro','cautela','evitar','contraindicado','sem_dados');
CREATE TYPE public.medicamento_contexto_uso AS ENUM ('urgencia','emergencia','pronto_atendimento','hospitalar','ambulatorial_rapido','pediatria','gestante','outro');

-- ============= base_medicamentos_geral =============
CREATE TABLE public.base_medicamentos_geral (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  principio_ativo text NOT NULL,
  principio_ativo_dcb text,
  nome_comercial_referencia text,
  nomes_comerciais text[] NOT NULL DEFAULT '{}',
  sinonimos text[] NOT NULL DEFAULT '{}',
  classe_terapeutica text,
  subclasse_terapeutica text,
  categoria_clinica public.medicamento_categoria_clinica NOT NULL DEFAULT 'dor_febre',
  forma_farmaceutica text,
  apresentacao text,
  concentracao text,
  via_administracao text,
  uso_principal text,
  uso_em_urgencia boolean NOT NULL DEFAULT false,
  uso_emergencia boolean NOT NULL DEFAULT false,
  uso_ambulatorial_rapido boolean NOT NULL DEFAULT false,
  medicamento_injetavel boolean NOT NULL DEFAULT false,
  medicamento_oral boolean NOT NULL DEFAULT false,
  medicamento_topico boolean NOT NULL DEFAULT false,
  medicamento_inalatorio boolean NOT NULL DEFAULT false,
  medicamento_controlado boolean NOT NULL DEFAULT false,
  antimicrobiano boolean NOT NULL DEFAULT false,
  tipo_receita public.medicamento_tipo_receita NOT NULL DEFAULT 'comum',
  exige_receita_especial boolean NOT NULL DEFAULT false,
  exige_retencao_receita boolean NOT NULL DEFAULT false,
  dose_adulto_padrao text,
  dose_pediatrica_padrao text,
  dose_maxima_adulto text,
  dose_maxima_pediatrica text,
  unidade_dose text,
  frequencia_padrao text,
  duracao_padrao text,
  observacao_posologia text,
  exige_peso boolean NOT NULL DEFAULT false,
  exige_ajuste_renal boolean NOT NULL DEFAULT false,
  exige_ajuste_hepatico boolean NOT NULL DEFAULT false,
  alerta_gestacao public.medicamento_alerta_gest_lact NOT NULL DEFAULT 'sem_dados',
  alerta_lactacao public.medicamento_alerta_gest_lact NOT NULL DEFAULT 'sem_dados',
  alerta_alergia_classe text,
  risco_interacao_relevante boolean NOT NULL DEFAULT false,
  risco_duplicidade boolean NOT NULL DEFAULT false,
  vinculo_iv_medication_id uuid,
  cid_relacionados text[] NOT NULL DEFAULT '{}',
  queixas_relacionadas text[] NOT NULL DEFAULT '{}',
  protocolos_relacionados text[] NOT NULL DEFAULT '{}',
  modelos_rapidos_relacionados text[] NOT NULL DEFAULT '{}',
  -- Busca
  nome_normalizado text,
  termos_busca text[] NOT NULL DEFAULT '{}',
  abreviacoes text[] NOT NULL DEFAULT '{}',
  nomes_populares text[] NOT NULL DEFAULT '{}',
  equivalencias jsonb NOT NULL DEFAULT '[]'::jsonb,
  prioridade_busca integer NOT NULL DEFAULT 0,
  prioridade_mvp public.medicamento_prioridade_mvp NOT NULL DEFAULT 'media',
  -- Governança
  status_revisao public.medicamento_status_revisao NOT NULL DEFAULT 'rascunho',
  fonte_referencia text,
  data_atualizacao date NOT NULL DEFAULT CURRENT_DATE,
  revisado_por uuid,
  criado_por uuid,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bmg_nome_norm ON public.base_medicamentos_geral(nome_normalizado);
CREATE INDEX idx_bmg_categoria ON public.base_medicamentos_geral(categoria_clinica);
CREATE INDEX idx_bmg_prioridade ON public.base_medicamentos_geral(prioridade_mvp);
CREATE INDEX idx_bmg_ativo ON public.base_medicamentos_geral(ativo);
CREATE INDEX idx_bmg_termos_busca ON public.base_medicamentos_geral USING GIN(termos_busca);
CREATE INDEX idx_bmg_cids ON public.base_medicamentos_geral USING GIN(cid_relacionados);
CREATE INDEX idx_bmg_queixas ON public.base_medicamentos_geral USING GIN(queixas_relacionadas);

ALTER TABLE public.base_medicamentos_geral ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read base_medicamentos_geral" ON public.base_medicamentos_geral
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/revisor insert base_medicamentos_geral" ON public.base_medicamentos_geral
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin/revisor update base_medicamentos_geral" ON public.base_medicamentos_geral
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin delete base_medicamentos_geral" ON public.base_medicamentos_geral
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

-- Trigger normalização + updated_at
CREATE OR REPLACE FUNCTION public.bmg_set_normalized()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.nome_normalizado := public.iv_normalize_text(NEW.principio_ativo);
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_bmg_set_normalized
  BEFORE INSERT OR UPDATE ON public.base_medicamentos_geral
  FOR EACH ROW EXECUTE FUNCTION public.bmg_set_normalized();

-- ============= base_apresentacoes_medicamentos =============
CREATE TABLE public.base_apresentacoes_medicamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_medicamento uuid NOT NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  principio_ativo text NOT NULL,
  forma_farmaceutica text,
  concentracao text,
  unidade_concentracao text,
  volume text,
  unidade_volume text,
  apresentacao_texto text NOT NULL,
  via_administracao text,
  uso_adulto boolean NOT NULL DEFAULT true,
  uso_pediatrico boolean NOT NULL DEFAULT false,
  injetavel boolean NOT NULL DEFAULT false,
  oral boolean NOT NULL DEFAULT false,
  topico boolean NOT NULL DEFAULT false,
  inalatorio boolean NOT NULL DEFAULT false,
  status_revisao public.medicamento_status_revisao NOT NULL DEFAULT 'aguardando_revisao',
  fonte_referencia text,
  ativo boolean NOT NULL DEFAULT true,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_bam_med ON public.base_apresentacoes_medicamentos(id_medicamento);

ALTER TABLE public.base_apresentacoes_medicamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read base_apresentacoes" ON public.base_apresentacoes_medicamentos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/revisor insert base_apresentacoes" ON public.base_apresentacoes_medicamentos
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin/revisor update base_apresentacoes" ON public.base_apresentacoes_medicamentos
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin delete base_apresentacoes" ON public.base_apresentacoes_medicamentos
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_bam_updated
  BEFORE UPDATE ON public.base_apresentacoes_medicamentos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= medicamento_contexto_clinico =============
CREATE TABLE public.medicamento_contexto_clinico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_medicamento uuid NOT NULL REFERENCES public.base_medicamentos_geral(id) ON DELETE CASCADE,
  principio_ativo text NOT NULL,
  cid text,
  descricao_cid text,
  queixa text,
  sindrome text,
  protocolo text,
  contexto public.medicamento_contexto_uso NOT NULL DEFAULT 'urgencia',
  prioridade_sugestao integer NOT NULL DEFAULT 0,
  observacao_uso text,
  status_revisao public.medicamento_status_revisao NOT NULL DEFAULT 'aguardando_revisao',
  fonte_referencia text,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcc_med ON public.medicamento_contexto_clinico(id_medicamento);
CREATE INDEX idx_mcc_cid ON public.medicamento_contexto_clinico(cid);
CREATE INDEX idx_mcc_queixa ON public.medicamento_contexto_clinico(queixa);

ALTER TABLE public.medicamento_contexto_clinico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read med_contexto" ON public.medicamento_contexto_clinico
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/revisor insert med_contexto" ON public.medicamento_contexto_clinico
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin/revisor update med_contexto" ON public.medicamento_contexto_clinico
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'revisor'::app_role));
CREATE POLICY "Admin delete med_contexto" ON public.medicamento_contexto_clinico
  FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'::app_role));

CREATE TRIGGER trg_mcc_updated
  BEFORE UPDATE ON public.medicamento_contexto_clinico
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= base_medicamentos_checklist =============
CREATE TABLE public.base_medicamentos_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text NOT NULL UNIQUE,
  label text NOT NULL,
  status public.checklist_status NOT NULL DEFAULT 'pendente',
  observacao text,
  ordem integer NOT NULL DEFAULT 0,
  atualizado_por uuid,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.base_medicamentos_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read bmc" ON public.base_medicamentos_checklist
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin write bmc" ON public.base_medicamentos_checklist
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (has_role(auth.uid(),'admin'::app_role));

INSERT INTO public.base_medicamentos_checklist (chave,label,ordem) VALUES
  ('dor_febre','Dor/febre cadastrados',1),
  ('nauseas_vomitos','Náuseas/vômitos cadastrados',2),
  ('alergia_anafilaxia','Alergia/anafilaxia cadastrados',3),
  ('respiratorios','Respiratórios cadastrados',4),
  ('antibioticos_essenciais','Antibióticos essenciais cadastrados',5),
  ('hidratacao_eletrolitos','Hidratação/eletrólitos cadastrados',6),
  ('iv_criticos_vinculados','Medicamentos IV críticos vinculados',7),
  ('controlados_identificados','Medicamentos controlados identificados',8),
  ('antimicrobianos_identificados','Antimicrobianos identificados',9),
  ('apresentacoes_principais','Apresentações principais cadastradas',10),
  ('busca_sinonimos','Busca por sinônimos funcionando',11),
  ('vinculo_cid_queixa','Vínculo por CID/queixa funcionando',12),
  ('favoritos','Favoritos funcionando',13),
  ('modelos_usando_base','Modelos rápidos usando base geral',14);

-- ============= SEED inicial dos 12 grupos =============
INSERT INTO public.base_medicamentos_geral (principio_ativo, categoria_clinica, prioridade_mvp, medicamento_oral, medicamento_injetavel, medicamento_inalatorio, antimicrobiano, medicamento_controlado, tipo_receita, status_revisao, sinonimos, termos_busca) VALUES
-- Grupo 1 dor/febre
('Dipirona','dor_febre','essencial',true,true,false,false,false,'comum','aguardando_revisao','{metamizol,novalgina}','{dor,febre,analgesico,antitermico,dipirona,metamizol,novalgina}'),
('Paracetamol','dor_febre','essencial',true,false,false,false,false,'comum','aguardando_revisao','{acetaminofeno,tylenol}','{dor,febre,paracetamol,acetaminofeno,tylenol}'),
('Ibuprofeno','dor_febre','essencial',true,false,false,false,false,'comum','aguardando_revisao','{advil,alivium}','{dor,febre,ibuprofeno,aine,antiinflamatorio}'),
('Cetoprofeno','dor_febre','alta',true,true,false,false,false,'comum','aguardando_revisao','{profenid}','{dor,cetoprofeno,profenid,aine}'),
('Diclofenaco','dor_febre','alta',true,true,false,false,false,'comum','aguardando_revisao','{voltaren,cataflam}','{dor,diclofenaco,voltaren,cataflam,aine}'),
('Tramadol','dor_febre','alta',true,true,false,false,true,'especial_b','aguardando_revisao','{tramal}','{dor,tramadol,tramal,opioide}'),
('Morfina','dor_febre','essencial',true,true,false,false,true,'especial_a','aguardando_revisao','{dimorf}','{dor,morfina,opioide,emergencia}'),
('Codeína','dor_febre','media',true,false,false,false,true,'especial_b','aguardando_revisao','{}','{dor,codeina,opioide,tosse}'),
-- Grupo 2 nausea
('Ondansetrona','nauseas_vomitos','essencial',true,true,false,false,false,'comum','aguardando_revisao','{vonau,zofran}','{nausea,vomito,antiemetico,ondansetrona,vonau,zofran}'),
('Metoclopramida','nauseas_vomitos','essencial',true,true,false,false,false,'comum','aguardando_revisao','{plasil}','{nausea,vomito,metoclopramida,plasil,antiemetico}'),
('Bromoprida','nauseas_vomitos','alta',true,true,false,false,false,'comum','aguardando_revisao','{digesan}','{nausea,vomito,bromoprida,digesan}'),
('Dimenidrinato','nauseas_vomitos','alta',true,true,false,false,false,'comum','aguardando_revisao','{dramin}','{nausea,vomito,labirintite,dimenidrinato,dramin}'),
-- Grupo 3 alergia
('Dexclorfeniramina','alergia_anafilaxia','alta',true,false,false,false,false,'comum','aguardando_revisao','{polaramine}','{alergia,prurido,dexclorfeniramina,polaramine,anti-histaminico}'),
('Prometazina','alergia_anafilaxia','alta',true,true,false,false,false,'comum','aguardando_revisao','{fenergan}','{alergia,prometazina,fenergan,sedacao}'),
('Loratadina','alergia_anafilaxia','media',true,false,false,false,false,'comum','aguardando_revisao','{claritin}','{alergia,rinite,loratadina,claritin}'),
('Cetirizina','alergia_anafilaxia','media',true,false,false,false,false,'comum','aguardando_revisao','{zyrtec}','{alergia,rinite,cetirizina,zyrtec}'),
('Hidrocortisona','corticoides','essencial',false,true,false,false,false,'comum','aguardando_revisao','{solu-cortef}','{alergia,anafilaxia,corticoide,hidrocortisona}'),
('Dexametasona','corticoides','essencial',true,true,false,false,false,'comum','aguardando_revisao','{decadron}','{alergia,anafilaxia,corticoide,dexametasona,decadron}'),
('Prednisona','corticoides','alta',true,false,false,false,false,'comum','aguardando_revisao','{meticorten}','{alergia,asma,corticoide,prednisona}'),
('Adrenalina','emergencia','essencial',false,true,false,false,false,'comum','aguardando_revisao','{epinefrina}','{anafilaxia,parada,adrenalina,epinefrina,emergencia}'),
-- Grupo 4 respiratorio
('Salbutamol','broncoespasmo_respiratorio','essencial',false,false,true,false,false,'comum','aguardando_revisao','{aerolin,albuterol}','{asma,broncoespasmo,salbutamol,aerolin,albuterol}'),
('Brometo de ipratrópio','broncoespasmo_respiratorio','essencial',false,false,true,false,false,'comum','aguardando_revisao','{atrovent}','{asma,dpoc,ipratropio,atrovent}'),
('Budesonida','broncoespasmo_respiratorio','alta',false,false,true,false,false,'comum','aguardando_revisao','{pulmicort}','{asma,corticoide,budesonida,pulmicort}'),
('Fenoterol','broncoespasmo_respiratorio','media',false,false,true,false,false,'comum','aguardando_revisao','{berotec}','{asma,fenoterol,berotec}'),
('Aminofilina','broncoespasmo_respiratorio','media',false,true,false,false,false,'comum','aguardando_revisao','{}','{asma,aminofilina,broncodilatador}'),
('Prednisolona','corticoides','alta',true,false,false,false,false,'comum','aguardando_revisao','{prelone}','{asma,prednisolona,prelone,corticoide}'),
-- Grupo 5 antibioticos
('Amoxicilina','antibioticos','essencial',true,false,false,true,false,'antimicrobiano','aguardando_revisao','{amoxil}','{antibiotico,amoxicilina,amoxil,otite,faringite}'),
('Amoxicilina + clavulanato','antibioticos','essencial',true,true,false,true,false,'antimicrobiano','aguardando_revisao','{clavulin}','{antibiotico,clavulanato,clavulin,sinusite}'),
('Azitromicina','antibioticos','essencial',true,true,false,true,false,'antimicrobiano','aguardando_revisao','{zitromax}','{antibiotico,azitromicina,zitromax,pneumonia}'),
('Cefalexina','antibioticos','essencial',true,false,false,true,false,'antimicrobiano','aguardando_revisao','{keflex}','{antibiotico,cefalexina,keflex,pele}'),
('Ceftriaxona','antibioticos','essencial',false,true,false,true,false,'antimicrobiano','aguardando_revisao','{rocefin,rocephin}','{antibiotico,ceftriaxona,rocefin,pneumonia,itu,infeccao}'),
('Cefazolina','antibioticos','alta',false,true,false,true,false,'antimicrobiano','aguardando_revisao','{}','{antibiotico,cefazolina,profilaxia}'),
('Cefepima','antibioticos','alta',false,true,false,true,false,'antimicrobiano','aguardando_revisao','{maxcef}','{antibiotico,cefepima,maxcef,hospitalar}'),
('Ciprofloxacino','antibioticos','essencial',true,true,false,true,false,'antimicrobiano','aguardando_revisao','{cipro}','{antibiotico,ciprofloxacino,cipro,itu}'),
('Levofloxacino','antibioticos','alta',true,true,false,true,false,'antimicrobiano','aguardando_revisao','{levaquin}','{antibiotico,levofloxacino,pneumonia}'),
('Metronidazol','antibioticos','essencial',true,true,false,true,false,'antimicrobiano','aguardando_revisao','{flagyl}','{antibiotico,metronidazol,flagyl,anaerobio}'),
('Clindamicina','antibioticos','alta',true,true,false,true,false,'antimicrobiano','aguardando_revisao','{dalacin}','{antibiotico,clindamicina,dalacin,pele}'),
('Sulfametoxazol + trimetoprima','antibioticos','alta',true,true,false,true,false,'antimicrobiano','aguardando_revisao','{bactrim}','{antibiotico,bactrim,smx-tmp,itu}'),
('Nitrofurantoína','antibioticos','alta',true,false,false,true,false,'antimicrobiano','aguardando_revisao','{macrodantina}','{antibiotico,nitrofurantoina,itu,macrodantina}'),
-- Grupo 6 GI
('Omeprazol','gastrointestinal','essencial',true,true,false,false,false,'comum','aguardando_revisao','{losec}','{ibp,omeprazol,refluxo,gastrite}'),
('Pantoprazol','gastrointestinal','essencial',true,true,false,false,false,'comum','aguardando_revisao','{pantozol}','{ibp,pantoprazol,refluxo}'),
('Simeticona','gastrointestinal','media',true,false,false,false,false,'comum','aguardando_revisao','{luftal}','{gases,simeticona,luftal}'),
('Escopolamina','gastrointestinal','alta',true,true,false,false,false,'comum','aguardando_revisao','{buscopan,hioscina}','{colica,escopolamina,buscopan,hioscina}'),
('Loperamida','gastrointestinal','media',true,false,false,false,false,'comum','aguardando_revisao','{imosec}','{diarreia,loperamida,imosec}'),
('Lactulose','gastrointestinal','media',true,false,false,false,false,'comum','aguardando_revisao','{}','{constipacao,lactulose,laxativo}'),
-- Grupo 7 cardio
('Captopril','anti_hipertensivos','essencial',true,false,false,false,false,'comum','aguardando_revisao','{capoten}','{has,hipertensao,captopril,iech}'),
('Losartana','anti_hipertensivos','essencial',true,false,false,false,false,'comum','aguardando_revisao','{cozaar}','{has,losartana,bra}'),
('Enalapril','anti_hipertensivos','alta',true,false,false,false,false,'comum','aguardando_revisao','{renitec}','{has,enalapril,iech}'),
('Anlodipino','anti_hipertensivos','essencial',true,false,false,false,false,'comum','aguardando_revisao','{norvasc}','{has,anlodipino,bcc}'),
('Atenolol','anti_hipertensivos','alta',true,false,false,false,false,'comum','aguardando_revisao','{atenol}','{has,atenolol,betabloq}'),
('Metoprolol','anti_hipertensivos','alta',true,true,false,false,false,'comum','aguardando_revisao','{seloken,selozok}','{has,metoprolol,betabloq,fa}'),
('Furosemida','diureticos','essencial',true,true,false,false,false,'comum','aguardando_revisao','{lasix}','{edema,furosemida,lasix,diuretico}'),
('Hidroclorotiazida','diureticos','alta',true,false,false,false,false,'comum','aguardando_revisao','{}','{has,hidroclorotiazida,diuretico}'),
('Espironolactona','diureticos','alta',true,false,false,false,false,'comum','aguardando_revisao','{aldactone}','{espironolactona,aldactone,diuretico}'),
('Nitroglicerina','cardiovascular','essencial',false,true,false,false,false,'comum','aguardando_revisao','{tridil}','{angina,nitroglicerina,tridil,emergencia}'),
('Mononitrato de isossorbida','cardiovascular','alta',true,false,false,false,false,'comum','aguardando_revisao','{monocordil}','{angina,isossorbida,monocordil}'),
-- Grupo 8 neuro
('Diazepam','neurologico_anticonvulsivante','essencial',true,true,false,false,true,'especial_b','aguardando_revisao','{valium}','{convulsao,ansiedade,diazepam,valium,bzd}'),
('Midazolam','neurologico_anticonvulsivante','essencial',true,true,false,false,true,'especial_b','aguardando_revisao','{dormonid}','{convulsao,sedacao,midazolam,dormonid,bzd}'),
('Fenitoína','neurologico_anticonvulsivante','essencial',true,true,false,false,false,'comum','aguardando_revisao','{hidantal}','{convulsao,fenitoina,hidantal,epilepsia}'),
('Fenobarbital','neurologico_anticonvulsivante','alta',true,true,false,false,true,'especial_b','aguardando_revisao','{gardenal}','{convulsao,fenobarbital,gardenal}'),
('Ácido valproico','neurologico_anticonvulsivante','alta',true,false,false,false,false,'comum','aguardando_revisao','{depakene}','{epilepsia,valproato,depakene}'),
('Levetiracetam','neurologico_anticonvulsivante','alta',true,true,false,false,false,'comum','aguardando_revisao','{keppra}','{epilepsia,levetiracetam,keppra}'),
-- Grupo 9 diabetes
('Insulina regular','diabetes_glicemia','essencial',false,true,false,false,false,'comum','aguardando_revisao','{}','{diabetes,insulina,regular,hiperglicemia}'),
('Insulina NPH','diabetes_glicemia','essencial',false,true,false,false,false,'comum','aguardando_revisao','{}','{diabetes,insulina,nph}'),
('Glicose hipertônica','emergencia','essencial',false,true,false,false,false,'comum','aguardando_revisao','{glicose 50%}','{hipoglicemia,glicose,emergencia}'),
('Glucagon','emergencia','alta',false,true,false,false,false,'comum','aguardando_revisao','{}','{hipoglicemia,glucagon,emergencia}'),
('Metformina','diabetes_glicemia','essencial',true,false,false,false,false,'comum','aguardando_revisao','{glifage}','{diabetes,metformina,glifage}'),
('Glibenclamida','diabetes_glicemia','alta',true,false,false,false,false,'comum','aguardando_revisao','{daonil}','{diabetes,glibenclamida,daonil}'),
-- Grupo 10 eletrolitos
('Soro fisiológico 0,9%','hidratacao_eletrolitos','essencial',false,true,false,false,false,'comum','aguardando_revisao','{sf 0.9%,nacl 0.9%}','{hidratacao,soro,sf,fisiologico}'),
('Soro glicosado 5%','hidratacao_eletrolitos','essencial',false,true,false,false,false,'comum','aguardando_revisao','{sg 5%}','{hidratacao,glicosado,sg}'),
('Ringer lactato','hidratacao_eletrolitos','essencial',false,true,false,false,false,'comum','aguardando_revisao','{rl}','{hidratacao,ringer,lactato,reposicao}'),
('Cloreto de potássio','hidratacao_eletrolitos','essencial',true,true,false,false,false,'comum','aguardando_revisao','{kcl}','{potassio,kcl,hipocalemia}'),
('Sulfato de magnésio','hidratacao_eletrolitos','essencial',false,true,false,false,false,'comum','aguardando_revisao','{}','{magnesio,sulfato,eclampsia,asma}'),
('Bicarbonato de sódio','hidratacao_eletrolitos','alta',false,true,false,false,false,'comum','aguardando_revisao','{}','{acidose,bicarbonato,emergencia}'),
('Gluconato de cálcio','hidratacao_eletrolitos','essencial',false,true,false,false,false,'comum','aguardando_revisao','{}','{calcio,gluconato,hipercalemia,emergencia}'),
-- Grupo 11 gineco
('Ácido fólico','gineco_obstetricia','alta',true,false,false,false,false,'comum','aguardando_revisao','{}','{gestante,acido folico,anemia}'),
('Sulfato ferroso','gineco_obstetricia','alta',true,false,false,false,false,'comum','aguardando_revisao','{}','{anemia,ferro,sulfato ferroso}'),
('Metildopa','gineco_obstetricia','alta',true,false,false,false,false,'comum','aguardando_revisao','{aldomet}','{has,gestante,metildopa,aldomet}'),
('Nifedipino','anti_hipertensivos','alta',true,false,false,false,false,'comum','aguardando_revisao','{adalat}','{has,nifedipino,adalat,bcc}'),
('Ocitocina','gineco_obstetricia','essencial',false,true,false,false,false,'comum','aguardando_revisao','{}','{parto,ocitocina,hemorragia}'),
-- Grupo 12 psiquiatria
('Haloperidol','psiquiatria_agitacao','essencial',true,true,false,false,false,'especial_b','aguardando_revisao','{haldol}','{agitacao,psiquiatria,haloperidol,haldol}'),
('Clonazepam','psiquiatria_agitacao','alta',true,false,false,false,true,'especial_b','aguardando_revisao','{rivotril}','{ansiedade,clonazepam,rivotril,bzd}'),
('Risperidona','psiquiatria_agitacao','media',true,false,false,false,false,'especial_b','aguardando_revisao','{}','{psiquiatria,risperidona,antipsicotico}'),
('Olanzapina','psiquiatria_agitacao','media',true,true,false,false,false,'especial_b','aguardando_revisao','{zyprexa}','{psiquiatria,olanzapina,zyprexa,antipsicotico}');
