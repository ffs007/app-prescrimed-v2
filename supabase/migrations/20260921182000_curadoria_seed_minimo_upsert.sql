-- Migration A5: Seed mínimo idempotente da base nacional curadoria (instituicao_id NULL = base compartilhada)
-- Ordem topológica: mestres sem FK -> mestres com FK
-- Todo INSERT usa ON CONFLICT (unique_key) DO UPDATE SET ... para re-rodável.

BEGIN;

-- ---------------------------------------------------------------- 1. Instituição Sentinela "NACIONAL_PRESCRIMED" (id=1 fixo para futuras referências)
INSERT INTO curadoria.instituicoes (id, codigo_instituicao, nome, tipo_instituicao, ativa)
OVERRIDING SYSTEM VALUE
VALUES (1, 'NACIONAL_PRESCRIMED', 'Base Nacional PrescriMed', 'publica', true)
ON CONFLICT (codigo_instituicao) DO UPDATE SET
  nome = excluded.nome,
  tipo_instituicao = excluded.tipo_instituicao,
  ativa = excluded.ativa,
  updated_at = now();

-- ---------------------------------------------------------------- 2. 20 classes medicamentosas (slug, nome, instituicao_id NULL = nacional)
INSERT INTO curadoria.classes_medicamentosas (slug, nome, descricao, instituicao_id) VALUES
  ('analgesicos'                  , 'Analgésicos'                   , 'Dor leve a intensa, multimodal'                   , NULL),
  ('antitermicos'                 , 'Antitérmicos'                  , 'Controle da febre em crianças e adultos'          , NULL),
  ('antiemeticos'                 , 'Antieméticos'                  , 'Náuseas e vômitos, profilaxia e resgate'          , NULL),
  ('antibioticos'                 , 'Antibióticos'                  , 'Terapia empírica e dirigida, espectro curto/largo', NULL),
  ('broncodilatadores'            , 'Broncodilatadores'             , 'Agonistas beta-2 curta/longa duração, anticolinerg', NULL),
  ('anti_hipertensivos'           , 'Antihipertensivos'             , 'Controle PA crônico e emergencial'                , NULL),
  ('sedativos'                    , 'Sedativos'                     , 'Sedação procedural, ventilação mecânica'          , NULL),
  ('ansioliticos'                 , 'Ansiolíticos'                  , 'Crises de ansiedade, agitação psicomotora'        , NULL),
  ('antiaritmicos'                , 'Antiarrítmicos'                , 'FA, Flutter, TV, extra-sístoles sintomáticas'     , NULL),
  ('tromboliticos'                , 'Trombolíticos'                 , 'IAM com supradesnivelamento, AVC isquêmico agudo' , NULL),
  ('anticoagulantes'              , 'Anticoagulantes'               , 'TEP, TVP, FA não valvular, profilaxia cirúrgica'  , NULL),
  ('solucoes_endovenosas'         , 'Soluções endovenosas'          , 'Cristaloides, coloides, soluções de manutenção'   , NULL),
  ('corticoides'                  , 'Corticoides'                   , 'Anti-inflamatório e imunossupressor sistêmico'    , NULL),
  ('antialergicos'                , 'Antialérgicos'                 , 'Anti-histamínicos H1 de 1ª/2ª geração'            , NULL),
  ('anticonvulsivantes'           , 'Anticonvulsivantes'            , 'Controle crise aguda e profilaxia crônica'        , NULL),
  ('insulinas'                    , 'Insulinas'                     , 'Basal, prandial, mistas, ultra-rápidas IV/SC'     , NULL),
  ('vasopressores'                , 'Vasopressores'                 , 'Norepinefrina, vasopressina, dopamina, fenilefrina', NULL),
  ('suporte_avancado'             , 'Suporte avançado'              , 'Drogas de PCR: adrenalina, amiodarona, atropina'  , NULL),
  ('opioides'                     , 'Opioides'                      , 'Dor moderada a intensa, PCA, controle dispneia'   , NULL),
  ('eletrólitos_concentrados'     , 'Eletrólitos concentrados'      , 'KCl, MgSO4, Ca gluconato, fosfato, Na bicarbonato', NULL)
ON CONFLICT (slug, instituicao_id) DO UPDATE SET
  nome = excluded.nome,
  descricao = excluded.descricao,
  updated_at = now();

-- ---------------------------------------------------------------- 3. 8 tipos de prescrição (slug global)
INSERT INTO curadoria.tipos_prescricao (slug, nome, descricao) VALUES
  ('dose_unica'         , 'Dose única'           , 'Administração de uma dose única, eventual'      ),
  ('bolus'              , 'Bolus IV'             , 'Dose rápida intravenosa, volume ou concentrado'),
  ('continua'           , 'Contínua'             , 'Dose mantida contínua, 24h'                     ),
  ('infusao_bomba'      , 'Infusão em bomba'     , 'Bomba infusora programada, mL/h ou dose/min'    ),
  ('conforme_parametro' , 'Conforme parâmetro'   , 'Gatilho PA, glicemia, FC, dor, etc.'            ),
  ('se_necessario'      , 'Se necessário (SOS)'  , 'Medicação de resgate, com intervalo mínimo'     ),
  ('protocolar'         , 'Protocolar'           , 'Liga direta a protocolo clínico institucional'  ),
  ('emergencia'         , 'Emergência'           , 'Urgência imediata, sem autorização prévia'      )
ON CONFLICT (slug) DO UPDATE SET
  nome = excluded.nome,
  descricao = excluded.descricao,
  updated_at = now();

-- ---------------------------------------------------------------- 4. 12 monitorizações (slug global)
INSERT INTO curadoria.monitorizacoes (slug, nome, unidade_medida, parametros_normais) VALUES
  ('pa'                  , 'Pressão arterial'          , 'mmHg'        , jsonb_build_object('sistolica','90-140','diastolica','60-90')),
  ('saturacao_o2'        , 'Saturação de oxigênio'     , '%'           , jsonb_build_object('normal','>=94%')),
  ('fc'                  , 'Frequência cardíaca'       , 'bpm'         , jsonb_build_object('normal','60-100')),
  ('fr'                  , 'Frequência respiratória'   , 'irpm'        , jsonb_build_object('normal','12-20')),
  ('temperatura'         , 'Temperatura corpórea'      , '°C'          , jsonb_build_object('normal','36,0-37,5')),
  ('glicemia'            , 'Glicemia capilar'          , 'mg/dL'       , jsonb_build_object('jejum','70-100','casual','<200')),
  ('dor'                 , 'Escala de dor'             , '0-10/face/Wong-Baker' , jsonb_build_object('alvo','<3/10')),
  ('nivel_consciencia'   , 'Nível de consciência'      , 'GCS/AVPU'    , jsonb_build_object('GCS','15','AVPU','A')),
  ('diurese'             , 'Diurese horária'           , 'mL/kg/h'     , jsonb_build_object('minimo','>1 mL/kg/h crianças','adultos','>0,5 mL/kg/h')),
  ('escala_sedacao'      , 'Escala de sedação'         , 'RASS/Ramsay' , jsonb_build_object('RASS_alvo_ventilado','-2 a +0')),
  ('sinais_sangramento'  , 'Sinais de sangramento'     , 'qualitativo' , jsonb_build_object('alvo','negativo')),
  ('reacao_alergica'     , 'Sinais de reação alérgica' , 'qualitativo' , jsonb_build_object('alvo','ausente'))
ON CONFLICT (slug) DO UPDATE SET
  nome = excluded.nome,
  unidade_medida = excluded.unidade_medida,
  parametros_normais = excluded.parametros_normais,
  updated_at = now();

-- ---------------------------------------------------------------- 5. 35 condições clínicas (32 frequentes texto do usuário + 3 inespecíficas)
--    UNIQUE(tipo, nome_normalizado, instituicao_id). Instituicao_id = NULL => base nacional
INSERT INTO curadoria.condicoes_clinicas (tipo, nome, sinonimos, red_flags, cid10, faixa_etaria_prevalente, instituicao_id) VALUES
  ('patologia','Asma brônquica',                    '["asmático","broncospasmo"]',                                        '["dispneia súbita","silêncio auscultatório","PEFR <50%"]',      ARRAY['J45'],         '[0,120]', NULL),
  ('patologia','Pneumonia adquirida na comunidade', '["PAC","pneumonia comunitária"]',                                    '["hipoxemia <90","taquipneia FR>30","chopra","confusão"]',        ARRAY['J18','J13','J14'], '[0,120]', NULL),
  ('patologia','Doença pulmonar obstrutiva crônica','["DPOC","bronquite crônica","enfisema"]',                            '["retenção CO2","acidose respiratória","poliglobulia"]',         ARRAY['J44','J43','J42'], '[40,120]', NULL),
  ('patologia','Infarto agudo do miocárdio',        '["IAM","síndrome coronariana aguda","SCA","dor torácica cardíaca"]', '["sudorese fria","hipotensão","dispneia súbita","alteração ECG"]',ARRAY['I21','I22','I20'], '[30,120]', NULL),
  ('patologia','Insuficiência cardíaca descompensada','["ICC descompensada","edema agudo pulmão","falência cardíaca"]', '["ortopneia","escuma rosada","BNP muito elevado","hipoperfusão"]',ARRAY['I50'],         '[40,120]', NULL),
  ('patologia','Acidente vascular cerebral isquêmico','["AVCi","Derrame cerebral","ictus isquêmico"]',              '[" NIHSS >10","desvio da comissura","afasia súbita","hemiparesia"]',ARRAY['I63'],      '[40,120]', NULL),
  ('patologia','Acidente vascular cerebral hemorrágico','["AVCh","hematoma intracraniano","HIC"]',                   '["Cefaleia súbita explosiva","nível consciência caído","hipertensão maligna"]',ARRAY['I61','I62'], '[40,120]', NULL),
  ('patologia','Tromboembolismo pulmonar',          '["TEP","embolia pulmonar"]',                                        '["síncope súbita","saturação cai bruscamente","Taquicardia >110", "ECG S1Q3T3"]',ARRAY['I26'], '[15,120]', NULL),
  ('patologia','Sepse',                              '["síndrome da resposta inflamatória sistêmica","SIRS","choque séptico"]','["hipotensão refratária","Lactato >2","petequias","confusão abrupta"]',ARRAY['R65','A41'], '[0,120]', NULL),
  ('patologia','Meningite bacteriana',              '["meningoencefalite bacteriana","irritação meníngea"]',             '["rigidez nucal","petequias","estado mental diminuído","fonofotofobia"]',ARRAY['G00'], '[0,80]', NULL),
  ('patologia','Apendicite aguda',                  '["dor em fossa ilíaca direita","sinal de Blumberg"]',               '["descompressão súbita dolorosa","temperatura >38,5","vômitos persistentes"]',ARRAY['K35','K36'], '[5,80]', NULL),
  ('patologia','Cetoacidose diabética',             '["CAD","cetoacidose","descompensação DM1"]',                        '["hálito cetônico","Kussmaul","Glicemia >250","pH <7,30"]',     ARRAY['E10','E11','E13'], '[0,120]', NULL),
  ('patologia','Estado de mal epiléptico',          '["convulsão prolongada","crises recorrentes sem recuperação"]',     '[">5 min crise única","2 crises sem retorno basal","estado mental baixo"]',ARRAY['G41'], '[0,120]', NULL),
  ('patologia','Gastroenterite aguda',              '["diarreia infecciosa","gastroenterocolite"]',                      '["sinais desidratação grave","sangue nas fezes","tóxicos","cólicas intensas"]',ARRAY['A08','A09'], '[0,90]', NULL),
  ('patologia','Anemia falciforme em crise',        '["drepanocitose crise vaso-oclusiva","crise álgica falciforme"]',    '["priapismo","síndrome torácica aguda","AVC","sepsis"]',        ARRAY['D57'], '[0,70]', NULL),
  ('patologia','Asma exacerbação grave',            '["asma em estado de mal","crise asmática grave"]',                  '["PEFR <50%","uso de musculatura acessória","cianose","silêncio"]',ARRAY['J46'], '[0,120]', NULL),
  ('patologia','Insuficiência renal aguda',         '["IRA","lesão renal aguda","LRA"]',                                  '["oligoanúria","creatinina dobra em 48h","hidroeletrolítico instável"]',ARRAY['N17'], '[0,120]', NULL),
  ('patologia','Intoxicação exógena',               '["intoxicação medicamentosa","overdose","tentativa de suicídio"]',   '["depressão respiratória","meningismo falso","escala de coma baixa","agitação"]',ARRAY['T36','T50','X40-X49'], '[12,120]', NULL),
  ('patologia','Pancreatite aguda',                 '["dor epigástrica irradiada para dorso","dor em faixa"]',           '["Lipase >3x VN","necrose pancreática","íleo paralítico"]',       ARRAY['K85'], '[18,120]', NULL),
  ('patologia','Celulite / Erisipela',              '["infecção de pele e tecidos moles","abscesso em formação"]',       '["linfangite","sinais de necrose","febre alta","compartimento"]',ARRAY['L03','L04'], '[0,120]', NULL),
  ('patologia','Fratura exposta',                   '["fratura aberta","ferida óssea"]',                                  '["sinais de nervoso/vaso comprometido","sangramento ativo","sepse"]',ARRAY['S02-S99','T02'], '[0,120]', NULL),
  ('patologia','Descolamento de placenta',         '["DPP","hemorragia segunda metade gestação"]',                      '["hipertonia uterina","sofrimento fetal agudo","choque","dor abdominal"]',ARRAY['O45'], '[14,50]', NULL),
  ('patologia','Descolamento prematuro de membranes','["ruptura bolsa d''água","RPM prematura","PPROM"]',              '["perda líquido claro/fétido","corioamnionite","trabalho de parto"]',ARRAY['O42'], '[14,50]', NULL),
  ('patologia','Síndrome hipertensiva gestacional', '["pré-eclâmpsia","eclâmpsia","HELLP"]',                             '["convulsão eclâmptica","PA>160/110","proteinúria 24h>300mg", "elevação TGO/TGP"]',ARRAY['O13','O14','O15'], '[14,50]', NULL),
  ('patologia','Cólica renal',                      '["litíase renal","cálculo ureteral","nefrolitíase"]',               '["anúria bilateral","sépsis concomitante","dor refratária","hematúria macro"]',ARRAY['N20','N23'], '[15,80]', NULL),
  ('patologia','Derrame pleural',                   '["efusão pleural","líquido na pleura"]',                            '["empiema","hipoxemia refratária","tampão mediastino"]',          ARRAY['J90','J91'], '[0,120]', NULL),
  ('patologia','Dor abdominal aguda não específica','["abdômen agudo inespecífico","dor abdominal sem diagnóstico"]',     '["peritonismo","sinais irrítativos","instabilidade","íleo paralítico"]',ARRAY['R10'], '[0,120]', NULL),
  ('patologia','Síndrome de Down',                  '["trissomia 21","T21"]',                                            '["cardiopatia associada","hipotonia neonatal","atresia duodenal"]',ARRAY['Q90'], '[0,120]', NULL),
  ('patologia','Transtorno do espectro autista',    '["TEA","autismo","atraso neuroevolutivo não global"]',               '["crise epiléptica","autolesão","agressividade","dificuldade alimentar"]',ARRAY['F84'], '[0,60]', NULL),
  ('patologia','Transtorno de déficit de atenção e hiperatividade','["TDAH","déficit atenção"]',                         '["risco suicídio","bullying grave","abuso substâncias","comorbidades condutas"]',ARRAY['F90'], '[4,40]', NULL),
  ('sindrome','Síndrome febril aguda',              '["sem foco infeccioso aparente","febre sem sinais localizatórios"]', '["petéquias","lactato","estado mental baixo","hipoperfusão"]',  ARRAY['R50','P36'], '[0,120]', NULL),
  ('sindrome','Síndrome dispneica aguda',           '["insuficiência respiratória","falência respiratória"]',            '["hipoxemia <90%","taquipneia >30","uso musculatura acessória"]',ARRAY['J96','R06'], '[0,120]', NULL),
  ('sintoma','Dor torácica',                        '["dor no peito","toracalgia","precordialgia"]',                     '["sudorese","irradiação mandíbula/MMSE","dispneia associada","palpitações","síncope"]',ARRAY['R07'], '[12,120]', NULL),
  ('sintoma','Dor abdominal',                       '["dor barriga","abdômen doloroso"]',                                '["vômitos persistentes","evacuação sangue","desidratação","abdômen agudo"]',ARRAY['R10'], '[0,120]', NULL),
  ('queixa','Queixa inespecífica',                  '["mal estar geral","astenia","queda do estado geral"]',              '["febre não esclarecida","perda ponderal","emagrecimento","anoressia"]',ARRAY['R53','R68'], '[0,120]', NULL)
ON CONFLICT (tipo, nome_normalizado, instituicao_id) DO UPDATE SET
  sinonimos = excluded.sinonimos,
  red_flags = excluded.red_flags,
  cid10 = excluded.cid10,
  faixa_etaria_prevalente = excluded.faixa_etaria_prevalente,
  updated_at = now();

-- ---------------------------------------------------------------- 6. 14 exames complementares essenciais (tipo_exame, subtipo_imagem NULL permitido)
INSERT INTO curadoria.exames_complementares (codigo_exame, nome, tipo_exame, subtipo_imagem, sinonimos_busca, disponibilidade_local_padrao, instituicao_id) VALUES
  ('LAB_HEMOGRAMA'        , 'Hemograma completo'                          , 'laboratorial'    , NULL                 , ARRAY['hemograma','CBC','sangue completo']                          , '24h'               , NULL),
  ('LAB_BIOQUIMICA'      , 'Painel bioquímico básico (Cr/Ur/Ureia/Eletrólitos)', 'laboratorial', NULL              , ARRAY['cr','creatinina','ureia','eletrólitos','potássio','sódio','bicarbonato'],'24h'         , NULL),
  ('LAB_GLICOSE'         , 'Glicemia capilar ou venosa'                   , 'laboratorial'    , NULL                 , ARRAY['glicose','açúcar sangue','casual','jejum']                  , '24h'               , NULL),
  ('LAB_LACTATO'         , 'Lactato venoso / arterial'                    , 'laboratorial'    , NULL                 , ARRAY['ácido lático','perfusão','choque']                           , 'unidade_referencia', NULL),
  ('LAB_GASOMETRIA'      , 'Gasometria arterial / venosa'                 , 'laboratorial'    , NULL                 , ARRAY['gaso','ABG','ph','pco2','hco3','eb']                         , 'unidade_referencia', NULL),
  ('LAB_COAGULOGRAMA'    , 'Coagulograma (TP/TTPA/INR/Fibrinogênio)'      , 'laboratorial'    , NULL                 , ARRAY['TP','TTPA','INR','anticoagulação','coagulação']             , '24h'               , NULL),
  ('LAB_MIOCARDIO'       , 'Troponina e CK-MB'                             , 'laboratorial'    , NULL                 , ARRAY['troponina','CK','necrose miocárdica','IAM']                 , '24h'               , NULL),
  ('LAB_EPIDEMIO'        , 'Pesquisa de patógenos / sorologias variadas'  , 'laboratorial'    , NULL                 , ARRAY['sorologia','anticorpos','PCR','vírus','bactéria']           , 'horario_comercial' , NULL),
  ('IMG_RX_TORAX'        , 'Radiografia de tórax PA/P perfil'             , 'imagem'          , 'rx'                 , ARRAY['RX tórax','raio x tórax','Pulmão','RX torácico']            , '24h'               , NULL),
  ('IMG_TC_CRANIO'       , 'Tomografia computadorizada do crânio'         , 'imagem'          , 'tc'                 , ARRAY['TCC','cabeça','cranio','tomografia crânio']                 , '24h'               , NULL),
  ('IMG_US_PARTO'        , 'Ecografia obstétrica / geral'                 , 'imagem'          , 'us'                 , ARRAY['US','eco','ultrassom','ultra-som','ultrassonografia']       , 'horario_comercial' , NULL),
  ('ECG_LEITO'           , 'Eletrocardiograma de 12 derivações'           , 'teste_rapido'    , NULL                 , ARRAY['ECG','Eletrocardio','12 derivações','ritmo cardíaco']       , '24h'               , NULL),
  ('ESCALA_RASS'         , 'Escala de sedação RASS aplicada de 4/4h'       , 'escala_clinica'  , NULL                 , ARRAY['RASS','sedação','avalie sedativo','profundidade sedação']  , '24h'               , NULL),
  ('SCORE_SOFA_QSOFA'    , 'Scores clínicos SOFA / qSOFA / NEWS2'         , 'score_clinico'   , NULL                 , ARRAY['qSOFA','SOFA','NEWS','early warning','sepse score']         , '24h'               , NULL)
ON CONFLICT (codigo_exame, instituicao_id) DO UPDATE SET
  nome = excluded.nome,
  tipo_exame = excluded.tipo_exame,
  subtipo_imagem = excluded.subtipo_imagem,
  sinonimos_busca = excluded.sinonimos_busca,
  disponibilidade_local_padrao = excluded.disponibilidade_local_padrao,
  updated_at = now();

-- ---------------------------------------------------------------- 7. 24 protocolos clínicos (slug, nome, instituicao_id NULL)
INSERT INTO curadoria.protocolos_clinicos (slug, nome, descricao_curta, cid10_relacionados, instituicao_id) VALUES
  ('sepse_1_hora'              , 'Protocolo Sepse 1ª hora (Surviving Sepsis)'       , 'Lactato + hemoculturas + ATB empírico em <1h + cristaloide 30 mL/kg', ARRAY['R65','A41'],                       NULL),
  ('iam_120_minutos'           , 'Protocolo IAM c/ supradesnivelamento (porta-balão <120min)','Troponina, ECG serial, antiagregante, estatina, AAS, transferência' , ARRAY['I21','I22'],                        NULL),
  ('avc_isquemico_4_5h'        , 'Protocolo AVC isquêmico - trombólise <4,5h'       , 'NIHSS, TC crânio SEM contraste, critérios exclusão, TNKase/rtPA',       ARRAY['I63'],                             NULL),
  ('asma_grave'                , 'Protocolo asma exacerbação grave'                 , 'SABA 3x inalatório, corticoide PO/IV, brometo ipratrópio, MgSO4 IV',    ARRAY['J45','J46'],                        NULL),
  ('dpoc_exacerbacao'          , 'Protocolo DPOC exacerbação (GOLD 2024)'           , 'SABA/ipratrópio, prednisona 5 dias, ATB Anthonisen, BIPAP se pH<7,35',   ARRAY['J44'],                              NULL),
  ('pneumonia_pac'             , 'Protocolo PAC - escore CURB-65'                   , 'Critério Ureia, Resp, PA, Idade, SIRS - CURB65 pontuação, ATB em <6h',   ARRAY['J18'],                              NULL),
  ('icc_descompensada'         , 'Protocolo ICC descompensada'                      , 'Nitratos sublingual/IV, furosemida IV, BIPAP, BNP orientador',           ARRAY['I50'],                              NULL),
  ('cetoacidose_diabetica'     , 'Protocolo CAD / HHS'                              , 'Fluido + K suplementar + insulina IV regular 0,1u/kg/h + pH bicarb',      ARRAY['E10','E11','E13'],                  NULL),
  ('mal_epileptico'            , 'Protocolo Mal epiléptico'                         , 'Benzodiazepines 3 passos -> fosphenytoina -> levetiracetam -> midazolam',ARRAY['G41'],                               NULL),
  ('hipertensao_emergencia'    , 'Protocolo Urgência / Emergência hipertensiva'     , 'Metoprolol, hidralazina, nitroprussiato, urapidil, clonidina, nicardipino', ARRAY['I10','I16'],                        NULL),
  ('anafilaxia'                , 'Protocolo Anafilaxia - AA em IM vasto lateral'    , 'Adrenalina IM = único tratamento que reduz mortalidade. Hidrocortisona.', ARRAY['T78','T80'],                        NULL),
  ('gastroenterite_desidratacao','Protocolo Desidratação gastroenterite (OMS)'     , 'Escala de Gorelick, Plan A/B/C com SF oral ou RL IV 20mL/kg',             ARRAY['A08','A09','E86'],                  NULL),
  ('abuso_substancias_overdose','Protocolo overdose e intoxicação exógena'         , 'ABCDE + Antídotos + Carvão ativado se <2h + UCG toxicológico'           , ARRAY['T36','T50','X40','X44','X60'],     NULL),
  ('meningite_encefalite'      , 'Protocolo Meningite bacteriana / encefalite viral', 'Punção lombar, ATB empírico em <30min, dexametasona antes ATB pneumo',    ARRAY['G00','G03','G04'],                  NULL),
  ('dor_abdominal_aguda'       , 'Protocolo Abdômen agudo'                         , 'Cirurgia avaliação, NPO, US abdominal, TC dorso-lombar, amilase/lipase', ARRAY['K35','K36','K85','R10'],            NULL),
  ('toracalgia_baixo_risco'    , 'Protocolo Dor torácica baixo risco (HEART PATH)'  , 'HEART score 0-3 com 2 serial Tn -> alta segura; >=4 admitir observação',  ARRAY['R07','I20'],                        NULL),
  ('pediatrica_febre_neonato'  , 'Protocolo Febre <28 dias (ROCHESTER)'             , 'Laboratório screening completo, hemoculturas x2, LP, ATB ampicilina+cefotaxima', ARRAY['P36','R50'],                   NULL),
  ('obstetrica_pre_eclampsia'  , 'Protocolo Pré-eclâmpsia / Eclâmpsia'              , 'Sulfato de magnésio protocolo Zuspan ou Pritchard. Controle PA metildopa/labetalol/nifedipino', ARRAY['O13','O14','O15'], NULL),
  ('obstetrica_hemorragia_posparto','Protocolo Hemorragia Pós-Parto (Quatro T's)','Tração controle cordão, tamponamento balão, misoprostol, prostaglandinas, uterotonicos', ARRAY['O72','O67'], NULL),
  ('trauma_sala_vermelha'      , 'Protocolo Sala vermelha ATLS'                     , 'ABCDE primário + secundário FAST/eFAST, radiografia básica, hemostasia controlável', ARRAY['S00','T09'],                 NULL),
  ('queimados'                 , 'Protocolo Queimado e inalação'                    , 'Parkland 4mL/kg/%SCQ, Ringer Lactato, cuidado airway inalação, 2x vacina tétano', ARRAY['T20','T31'],                      NULL),
  ('dor_pediatrica_multimodal' , 'Protocolo Dor pediátrica multimodal'              , 'Flanelinha, leite materno, glicose 25% 2mL, AAS+codeína, tramadol, morfina PCA', ARRAY['R52','G89'],                       NULL),
  ('delirium_uti'              , 'Protocolo Delirium (CAM-ICU e ABCDEF Bundle)'     , 'Avaliação de delirium em UTI diário com CAM-ICU, bundle não-farmacológico', ARRAY['F05'],                              NULL),
  ('tromboprofilaxia'          , 'Profilaxia tromboembólica institucional (Caprini)' , 'Heparina não fracionada SC 5000UI 8/8h, meias compressivas, deambulação', ARRAY['I80','I82','Z79'],                  NULL)
ON CONFLICT (slug, instituicao_id) DO UPDATE SET
  nome = excluded.nome,
  descricao_curta = excluded.descricao_curta,
  cid10_relacionados = excluded.cid10_relacionados,
  updated_at = now();

-- ---------------------------------------------------------------- 8. 10 linhas de cuidado (perfis de risco)
INSERT INTO curadoria.linhas_cuidado (slug, nome, descricao_curta, eixos_conectados, instituicao_id) VALUES
  ('alto_risco_cardiovascular' , 'Linha de cuidado Alto risco cardiovascular'    , 'Hipertensão resistente, IAM prévio, ICC NYHA III-IV, AVC isquêmico',            ARRAY['seguranca','acompanhamento','comunicacao_formal']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('alto_risco_respiratorio'   , 'Linha de cuidado Respiratória crônica complexa', 'DPOC GOLD D, Asma severa >2 urgências ano, dependência O2, BIPAP domiciliar',  ARRAY['seguranca','acompanhamento','acionamento_rede','documentacao']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('sepse_e_infeccoes_graves'  , 'Linha de cuidado Sepse e infecções graves'     , 'Sepse, infecção corrente sanguínea, pneumonia grave, abscesso, osteomielite',  ARRAY['seguranca','acompanhamento','acionamento_rede','documentacao','comunicacao_formal']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('neurocognitivo_e_convulsoes','Linha de cuidado Neurológico e convulsões'    , 'Epilepsia focal refratária, AVC sequelado, TEA agressivo, crises focais prolongadas', ARRAY['seguranca','protecao','acompanhamento','documentacao']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('neuroevolutivo_pediatrico' , 'Linha de cuidado Neuroevolutivo pediátrico'    , 'Atraso desenvolvimento, TEA, T21, paralisia cerebral, dificuldade alimentar',  ARRAY['acompanhamento','acionamento_rede','documentacao','comunicacao_formal']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('diabetes_metabolico'       , 'Linha de cuidado Diabetes e metabólico'        , 'DM1 bomba insulina, CAD frequente, pé diabético, DM2 polimedicado, obesidade mórbida', ARRAY['acompanhamento','acionamento_rede','documentacao']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('hematologia_e_hemoglobinopatias','Linha cuidado Hematologia e hemoglobinopatias','Anemia falciforme, talassemia maior, hemofilia, câncer hematológico quimioterapia', ARRAY['seguranca','acompanhamento','acionamento_rede','protecao','documentacao']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('saude_mental_sindrome_psicossomatica','Linha Saúde mental e psicossomática','Depressão grave, ideação suicida, agitação psicomotora, anorexia, TDAH impulsivo', ARRAY['seguranca','protecao','acompanhamento','comunicacao_formal','acionamento_rede']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('obstetricia_risco_gestacional','Linha Obstetrícia risco gestacional alto'    , 'Pré-eclâmpsia com órgão alvo, cardiopatia gestacional, hemorragias, placenta prévia, isoimunização', ARRAY['seguranca','protecao','documentacao','comunicacao_formal','acionamento_rede']::curadoria.curadoria_eixo_linha_cuidado[], NULL),
  ('cuidados_paliativos'       , 'Linha de cuidado Cuidados paliativos'          , 'Oncologia avançada, DPOC terminal, demência avançada, falência multiorgânica progressiva', ARRAY['seguranca','protecao','acompanhamento','comunicacao_formal','documentacao','acionamento_rede']::curadoria.curadoria_eixo_linha_cuidado[], NULL)
ON CONFLICT (slug, instituicao_id) DO UPDATE SET
  nome = excluded.nome,
  descricao_curta = excluded.descricao_curta,
  eixos_conectados = excluded.eixos_conectados,
  updated_at = now();

-- ---------------------------------------------------------------- 9. 5 modelos de documento (tipo_documento, instituicao_id NULL)
INSERT INTO curadoria.modelos_documento (tipo_documento, nome_visual, cabecalho_obriga_crm, assinatura_visivel, requer_carimbo, linguagem_alvo, instituicao_id) VALUES
  ('prescricao_hospitalar'   , 'Prescrição hospitalar (1 folha)'                , true , true , true , 'medico_receptor', NULL),
  ('prescricao_ambulatorial' , 'Prescrição ambulatorial (papel CMS/Receituário B)', true , true , true , 'paciente'       , NULL),
  ('atestado_medico'         , 'Atestado médico padrão'                         , true , true , true , 'auditoria'      , NULL),
  ('solicitacao_exames_lab'  , 'Solicitação de exames laboratoriais padronizada', true , true , false, 'medico_receptor', NULL),
  ('solicitacao_exames_img'  , 'Solicitação de exames de imagem padrão'         , true , true , false, 'medico_receptor', NULL)
ON CONFLICT (tipo_documento, instituicao_id) DO UPDATE SET
  nome_visual = excluded.nome_visual,
  cabecalho_obriga_crm = excluded.cabecalho_obriga_crm,
  assinatura_visivel = excluded.assinatura_visivel,
  requer_carimbo = excluded.requer_carimbo,
  linguagem_alvo = excluded.linguagem_alvo,
  updated_at = now();

COMMIT;
