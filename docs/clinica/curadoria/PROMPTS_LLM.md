# 8 + 1 Prompts LLM para Alimentar Banco Curadoria (PrescriMed)

Ordem topológica obrigatória. **NÃO pule a ordem — junções N:N não rodam sem mestres.**
Cada prompt alimenta 1 chunk JSON em `supabase/seeds/curadoria/chunks/chunk_NN.json`.

---

## Prompt 1 — Condições clínicas, DDX, Refinamentos

> Saída esperada: `chunk_01.json`. Mínimo 50 linhas.

```
Você é o Curador Clínico Sênior do PrescriMed (ver PERSONA_LLM.md).
Objetivo: Listar **todas as condições clínicas** contempladas pelo texto do usuário ("Seleção medicamentos, exames, documentos, protocolos, linhas cuidado, refinamentos, ddx, medicamentos alto risco") — separando-as em 5 tipos (curadoria_tipo_condicao_clinica ENUM): sintoma, síndrome, patologia, queixa, hipótese.

Para CADA condição preencha:
  tipo (ENUM), nome (sem abreviações), sinonimos[] JSON, apresentacoes[] JSON por faixa etária,
  red_flags[] de alerta máximo em PT-BR, cid10[] códigos CID-10 OFICIAIS (array texto),
  etiologias_possiveis{} por 3 virais/bacterianas/farmacológicas/outras,
  faixa_etaria_prevalente [min,max] em anos,
  apresentacoes_tipicas_atipicas{} por população (RN, lactente, criança, adolescente, adulto, idoso, imunodeprimido),
  instituicao_id = NULL.

Depois:
  (A) Tabela condicao_ddx (self-join): para cada condição frequente liste 2-5 diagnósticos diferenciais
      ordenados por prevalência brasileira. probabilidade ENUM (alta/media/baixa). Não permitir mesma origem=dest.
  (B) Tabela condicao_refinamentos (self-join): crie um caminho de refinamento
      "sintoma X → síndrome Y → patologia Z". Ex.: "Dor torácica → Síndrome coronariana aguda → Infarto agudo miocárdio com ST elevado".
      Para cada ligação, gatilhos_refinar[] (2-5 sinais clínicos que disparam o refinamento) e criterios{} JSON com testes objetivos.

REGRAS:
 - 35 linhas seed mínimo já estão na Migration A5; não duplique.
 - CID-10 deve bater com tabela oficial MS; não invente códigos.
 - Red flags: máximo 8 termos curtos; ordem de maior gravidade primeiro.
 - Nome use sempre nome comum clínico em PT-BR atualizado, sem eponímia antiga.

Saída final: cole o resultado na forma de JSON exato do chunk_01.json (ver FORMATO_SAIDA_JSON.md).
Depois de gerar, execute offline: npm run curadoria:validar --arquivo chunks/chunk_01.json
```

---

## Prompt 2 — Exames complementares + Junção com justificativas

> Saída: `chunk_02.json`. Mínimo 80 exames + 200 junções.

```
Você é o Curador Clínico Sênior do PrescriMed.
Objetivo: Preencher tabelas `exames_complementares` (100-150 linhas) + `condicao_exames` (200+).

Em exames_complementares, categorize cada exame em 5 tipo_exame ENUM:
  laboratorial, imagem, teste_rapido, escala_clinica, score_clinico.
Para imagens: subtipo_imagem ENUM (rx/tc/rm/us/angiotc/ecobeira_leito/us_poc/ressonancia/fluoroscopia/outros).
Preencha: codigo_exame (interno PrescriMed, exemplo: LAB_HEMOGRAMA), nome, descricao_abreviada max 300
chars, sinonimos_busca[] palavras chave fuzzy, disponibilidade_local_padrao (rotina/24h/horario_comercial/unidade_referencia),
tempo_processamento_medio_minutos, requisitos_preparo[] (ex: "jejum 8h"), faixa_resultado_referencia{}.

Em condicao_exames juncao N:N com 4 colunas SEMANTICAS OBRIGATORIAS:
  categoria_pedido (essencial/opcional/dependente_recurso/ideal_alta_tecnologia),
  justificativa (texto ≥10, porquê este exame nesta condição — usar CONSELHO/MS/SBP),
  impacto_conduta ENUM (7 valores: mudanca_imediata, definie_internacao, definie_alta, definie_transferencia, confirmatorio, descartatorio, monitoramento),
  sequencia_solicitacao smallint ≥1 (ordem correta dos exames 1,2,3...).
Também preencha disponibilidade_local e perfis_risco_requeridos[] e parametros_medicao[].

REGRAS:
 - 14 essenciais já estão na seed mínima; não duplique UNIQUE codigo_exame.
 - Sempre que houver exame de imagem (ex: TC de tórax com contraste), registre-o como UM registro separado de TC de tórax sem contraste.
 - Escalas clínicas e scores devem entrar como tipo='escala_clinica' ou 'score_clinico'; ex: RASS, CAM-ICU, NIHSS, HEART, CURB-65, PERC, Wells.

Saída JSON como chunk_02.json → validar offline primeiro → depois sync --dry-run.
```

---

## Prompt 3 — Classes medicamentosas + alternativos (6 justificativas + off-label)

> Saída: `chunk_03.json`. Mínimo 20 classes + 200 junções.

```
Você é o Curador Clínico Sênior do PrescriMed.
Objetivo: classes_medicamentosas (20 já seed; complete com mais 10 se faltar) + condicao_classes_medicamentosas
+ condicao_medicamentos_alternativos (juncao N:N com CHAVES SEMANTICAS OBRIGATORIAS 6).

Em classes_medicamentosas, filtros_padrao{} JSON com até 8 propriedades.

Em condicao_classes_medicamentosas, papel_classe ENUM 6 valores:
  primeira_linha / segunda_linha / adjuvante / resgate / cronico_continuo / profilatico

Em condicao_medicamentos_alternativos (FK public.base_medicamentos_geral.id UUID obrigatória, não invente novos):
  ordem_escolha ENUM 7: primeira / segunda / terceira / mesma_classe_substituta / nao_farmacologica / adjuvante / resgate
  via_administracao_aceita text (oral / IV / IM / inalatoria / SC / intratecal / retal / tópico)
  faixa_etaria_permitida numrange [0,120]
  restricoes_comorbidades[] texto
  eh_off_label=false → off_label_justificativa=NULL.
  eh_off_label=true  → OFF_LABEL_JUSTIFICATIVA TEXTO >= 30 CARACTERES OBRIGATORIO COM REFERENCIA.
  justificativas_escolha{} JSON com 6 CHAVES EXATAS: { custo, disponibilidade, eficacia, perfil_efeitos_adversos, seguranca_populacao, adequacao_protocolo }. Cada valor texto.
  ambiente_uso[] ENUM: ambulatorial, hospitalar, observacao, sala_vermelha, emergencia, restrito, controlado
  eh_medicamento_alto_risco boolean (marque TRUE para: anticoagulantes, insulinas, opioides, eletrólitos conc, vasopressores, trombolíticos, quimioterápicos, midazolam IV em crianças)
  monitorizacoes_requeridas bigint[] (FKs da tabela monitorizacoes 1-12)
  tipo_prescricao_sugerido bigint[] (FK tabela tipos_prescricao 1-8)

FAIL-CLOSED: sempre que for off-label e não tiver referência com ≥300 pacientes, não grave.
Saída: chunk_03.json → validar → dry-run.
```

---

## Prompt 4 — Exame físico direcionado

> Saída: `chunk_04.json`. Mínimo 30 condições × 1-3 sistemas cada = 30 linhas.

```
Curador Clínico Sênior. Para CADA condição clínica do chunk 01 (≥30 condições frequentes),
crie UMA linha em condicao_exame_fisico com:

  sistemas_envolvidos[]: array ENUM, 16 valores permitidos: cardiovascular, respiratorio, abdomen,
     neurologico, osteomuscular, pele, geniturinario, otorrinolaringologico, oftalmologico,
     psiquiatrico, cabeca_e_pescoco, vascular_periferico, linfonodos, toraxilo_pelve, endocrino,
     hematologico. Escolha 2-6 sistemas envolvidos (não 1 só; sempre no mínimo 2).
  manobras_obrigatorias[]: 2-8 manobras (ex: "Ausculta pulmonar bilateral 6 campos", "Palpação de fígado baço", "Sinal de Blumberg", "Manobra de Lasègue")
  achados_sugestivos[]: 2-6 achados típicos
  red_flags_exame_fisico[]: 2-4 achados que indicam risco de vida
  ordem_inspecao: 1 (ou 2 se houver 2 linhas mesma condição, raro)
  observacoes: null ou texto para dicas pediátricas (ex: "em criança agitada, começar por ausculta enquanto dorme no colo")

REGRAS: UNIQUE (condicao_id, instituicao_id). Uma condição = 1 linha.
Saída: chunk_04.json.
```

---

## Prompt 5 — Modelos de documento + campos custom + condicao juncao

> Saída: `chunk_05.json`. 22 tipos documento ENUM + ~80 campos + 40 junções.

```
Curador Clínico Sênior PrescriMed. Objetivo:
  A) modelos_documento: 22 valores do curadoria_tipo_documento_clinico ENUM. Para cada:
        nome_visual amigável, cabecalho_obriga_crm, assinatura_visivel, requer_carimbo,
        linguagem_alvo ENUM 5 (paciente/enfermagem/medico_receptor/auditoria/rede_de_saude).
  B) modelo_documento_campos: 4-8 campos custom POR modelo_documento. Tipo_campo ENUM:
        texto_curto/texto_longo/lista_bullets/data/numerico/checkbox_multiplo/condicional/selecao_unica.
        Os campos obrigatórios com obrigatorio=true. Ordem smallint. sugestao_llm_instrucao opcional:
        frase de como a IA deve preencher este campo automaticamente.
  C) condicao_modelos_documento: juncao. Para 40 condições × 2-4 tipos de documento cada:
        preenchimento_automatico boolean. ordem_apresentacao: ordem dos documentos no PDF final.

REGRAS: 5 modelos já seed mínimo; complete 17 restantes. linguagem_alvo: atestados e receitas = paciente;
laudos e encaminhamentos = medico_receptor; auditorias = auditoria.
Saída: chunk_05.json.
```

---

## Prompt 6 — Protocolos clínicos + versionamento + 9 etapas por versão

> Saída: `chunk_06.json`. 24 protocolos seed mínimo + versões 1.0 + 9 etapas × 1 protocolo + 24 junções.

```
Curador Clínico Sênior. Objetivo:
  A) protocolos_clinicos: 24 seed mínimo, complete se faltar.
  B) protocolo_clinico_versao: para cada protocolo, 1 versão inicial "1.0 — Linha de base nacional".
        responsavel_revisao = "Comitê Científico PrescriMed (coordenação geral)",
        historico_alteracoes[] array JSON = vazio na 1.0,
        diretrizes_alinhadas[] = ex: ["Diretriz SBP 2024 Hipertensão", "MS DATASUS 2023 Sepse 1h"]
  C) protocolo_etapa: CADA versão protocolo = 9 LINHAS, numero_etapa 1..9 na ORDEM EXATA ENUM:
        1 triagem, 2 avaliacao_inicial, 3 estabilizacao, 4 solicitacao_exames, 5 tratamento,
        6 criterios_alta, 7 criterios_transferencia, 8 criterios_internacao, 9 pontos_checagem.
        Para etapa preencher: descricao_texto 3-6 frases, criterios_mensuraveis{} JSON objetivos
        (ex: "PAS >=180", "FR >30 irpm", "Glicemia <70"), gatilhos_gravidade[] 2-6 strings,
        decisoes_chave[] 2-6 frases curtas.
  D) condicao_protocolo_clinico: juncao 24 condições × 1 protocolo + gatilho_entrada ≥10 chars.

Saída: chunk_06.json → validar (vai verificar CHECK numero_etapa 1..9, UNIQUE versao_id+numero)
```

---

## Prompt 7 — Linhas de cuidado + ações + condicao conexao

> Saída: `chunk_07.json`. 10 linhas seed mínimas + 20 ações + 30 junções com conexões válidas.

```
Curador Clínico Sênior.
Objetivo:
  A) linhas_cuidado: 10 perfis seed mínimo + mais 2 se necessário. eixos_conectados[] ENUM:
     seguranca, protecao, acompanhamento, acionamento_rede, documentacao, comunicacao_formal.
     Minimum 1, máx 6.
  B) linha_cuidado_acoes: 3-4 ações por linha, ordem crescente 1..N.
     titulo, passos[] 3-8 bullets, quem_executa[] ENUM 10 valores (medico/enfermagem/... equipe_multiprofissional).
     requer_notificacao_formal boolean (TRUE para casos de violência doméstica, maus-tratos, surtos notificáveis).
     requer_documento_id (FK modelos_documento.id) se tiver.
  C) condicao_linha_cuidado: para cada linha 8-12 condições × 1 linha.
     conexao[] apenas VALORES EXATOS DO ENUM (acima). CHECK: não vazio, nenhum valor inválido.

REGRAS: conexao[] não pode ter string free text; só enum.
Saída: chunk_07.json → validador confere ENUM válido.
```

---

## Prompt 8 — Parametrização Institucional (Config + Templates + Dupla Checagem)

> Saída: `chunk_08.json`. `instituicao_id=1` NACIONAL_PRESCRIMED.

```
Curador Clínico Sênior. Instituição = NACIONAL_PRESCRIMED (id=1).
Objetivo: 4 tabelas:
  A) instituicoes_config: 3 perfis assistenciais (básico/intermediário/avançado_terciário) × 2 setores
     (emergencia/ambulatorio) → 6 linhas. parametros_configuraveis{} JSON precisa ter AO MENOS UMA
     das 8 chaves obrigatórias do CHECK (limites_pa_min/max, doses_padroes_sobrepoe,
     exames_obrigatorios_por_condicao, fluxos_internos_encaminhamentos, responsaveis_acionamento,
     disponibilidade_medicamentos, disponibilidade_exames).
  B) prescricao_rapida_templates: 6 templates: 3 ambulatoriais + 3 hospitalares. tipo_ambito ENUM.
     owner_uuid=null = template institucional compartilhado. conteudo_modelo_id = FK modelos_documento.
  C) prescricao_template_item: 2-4 linhas medicamento POR template. medicamento_id UUID FK public.base_medicamentos_geral.
     dose_padrao, unidade, via, frequencia, duracao, restricoes_populacao[], observacoes, ordem_item.
  D) dupla_checagem_politica: 8 grupos de alto risco mapeados para 8 medicamentos_exemplo UUID.
     ativa=false (PADRÃO DESLIGADO. Cada instituição liga quando quiser, para não travar o fluxo beta).
     requer_segundo_profissional_tipo[] default ['farmaceutico'].
     alertas_especificos[] 2-4 strings. instituicao_id=1.

Saída: chunk_08.json. Validar.
```

---

## Prompt Extra 9 (opcional) — Geração de esqueletos e batch

```
Agora que você conhece os 8 prompts e a topologia, gere:
  1. O comando bash para gerar TODOS os 8 chunks esqueleto de uma vez.
  2. O comando bash para validar todos os 8 offline em loop (exit on first failure).
  3. O comando bash para dry-run de todos os 8 chunks em batch, com --project-ref=zwwalaioamxcvxbihxlr, em ordem.
  4. O checklist markdown para o médico revisor humano assinalar em cada chunk 8 itens de qualidade.

Formato de saída: 4 blocos de código ```bash ou ```markdown respectivamente.
```
