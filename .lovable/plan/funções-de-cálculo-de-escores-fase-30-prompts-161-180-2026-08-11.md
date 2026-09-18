# Funções de cálculo de escores — Fase 30 (prompts 161–180)

O texto colado voltou corrompido: os underscores foram removidos (`fncalcularmeld`, `auditescoresclinicos`, `vtotal`) e os sinais `<`, `>` e `<=` desapareceram no meio das condições (`IF p_idade  55 THEN`, `IF v_total =4`, `IF pgcs = 15`). Isso destrói exatamente os pontos de corte dos escores. Vou reconstruir cada corte pela definição publicada do escore, como já foi feito no lote de escores 101–120 — sem inventar valores.

## O que já existe (verificado)

- 13 funções `fn_calcular_*` (NEWS2, qSOFA, SOFA, GCS, 4AT, CURB-65, HEART, Wells-TEP, PERC, GBS, MASCC, Alvarado, Child-Pugh) no padrão: `SET search_path = public`, validação por `fn_validar_populacao_escore`, `ENTRADAS_INCOMPLETAS`, auditoria em `audit_escores_clinicos`.
- `audit_escores_clinicos` com `entradas`, `versao`, `resultado`, `red_flag_override`, `divergencia`, `lote_id`.
- `stg_escores_clinicos` com 46 escores catalogados — inclui MELD, MELD-Na, Ranson, BISAP, LRINEC, SCORTEN, CHA2DS2-VASc, HAS-BLED, C-SSRS, Ottawa (joelho/tornozelo), NEXUS, Canadian-C-Spine, GRACE, TIMI, Rockall, AIMS65, SMART-COP, SIRS, AIR, SINS, RegiSCAR, YEARS, ABCD2.
- **Não catalogados**: PHQ-9, AUDIT, CIWA-Ar, CRB-65, Hunt-Hess, WFNS. Serão inseridos em `stg_escores_clinicos` antes das funções, para que a validação de população funcione.
- `indicadores_qualidade_ps` já tem chave única `(lote_id, codigo_indicador)` — os 12 indicadores novos entram no lote `funcoes_calculo_escores_v2`.

## Entregas

### 1. Catálogo faltante
Inserir PHQ-9, AUDIT, CIWA-Ar, CRB-65, Hunt-Hess e WFNS em `stg_escores_clinicos` (lote `escores_clinicos_v4`) com população-alvo, finalidade, faixas e conduta.

### 2. Funções de cálculo (~30), no padrão das existentes
- Hepático/pancreatite/derma: MELD, MELD-Na, Ranson, BISAP, LRINEC, SCORTEN, RegiSCAR
- Cardiovascular: CHA2DS2-VASc, HAS-BLED, GRACE, TIMI, YEARS
- Psiquiatria/álcool: C-SSRS, PHQ-9, AUDIT, CIWA-Ar
- Trauma/imagem: Ottawa-Tornozelo, Ottawa-Knee, NEXUS, Canadian-C-Spine, ABCD2, Hunt-Hess, WFNS
- GI/infeccioso/respiratório: Rockall, AIMS65, SMART-COP, CRB-65, SIRS, AIR, SINS

Cada função: valida população (idade/contexto), bloqueia entradas incompletas ou fora de faixa, calcula, devolve `status/total/categoria/resposta/populacao_validada/versao/limitacoes`, aplica `red_flag_override` onde o prompt define (ex.: CHA2DS2-VASc em FA valvar, GRACE em choque) e grava auditoria com `lote_id = 'funcoes_calculo_escores_v2'`.

Regras clínicas reconstruídas onde o texto veio cortado, por exemplo:

```text
MELD          pediatria bloqueada (<18 -> usar PELD); pisos 1.0; diálise -> creatinina 4.0
Ranson adm.   idade >55, leuco >16.000, glicose >200, LDH >350, AST >250
BISAP         ureia >25, mental alterado, SIRS >=2, idade >60, derrame pleural
LRINEC        PCR >=150 -> 4 pts; Hb <11 -> 2; corte >=6 risco intermediário/alto
SCORTEN       idade >40, malignidade, FC >120, SCQ >10%, ureia >10, glicose >14, HCO3 <20
CHA2DS2-VASc  idade >=75 -> 2, 65–74 -> 1, AVC prévio -> 2
WFNS          GCS 15 sem déficit -> 1; 13–14 sem déficit -> 2; 13–14 com déficit -> 3; 7–12 -> 4; 3–6 -> 5
YEARS         limiar de D-dímero 1000 sem critério YEARS, 500 com critério
```

Onde a definição oficial for ambígua, a função devolve `limitacoes` explícitas em vez de um corte inventado.

### 3. Funções auxiliares
`fn_registrar_conduta_real` (marcar divergência entre conduta sugerida e realizada), `fn_validar_entradas_escore` e `fn_escore_versao_atual`, conforme os prompts 176–179.

### 4. Views e indicadores
- `vw_escores_divergencia_conduta`, `vw_escores_sem_auditoria`, `vw_dashboard_escores` e uma view de overrides — todas com `security_invoker = true`.
- 12 indicadores `IQV2:1`–`IQV2:12` no lote `funcoes_calculo_escores_v2`.

## Detalhes técnicos

- Tudo em migrações, em blocos por fase (catálogo → funções → auxiliares → views/indicadores) para conferência incremental.
- Nomes normalizados em snake_case (`fn_calcular_meld`, `audit_escores_clinicos`, `p_atendimento_id`), coerentes com o que já existe.
- Todas as funções `SECURITY INVOKER` com `SET search_path = public`.
- Nenhuma tela é alterada nesta etapa.
- Ao final: consulta de verificação (funções criadas, escores sem auditoria, indicadores inseridos) e a lista dos cortes reconstruídos por escore para sua conferência clínica.
