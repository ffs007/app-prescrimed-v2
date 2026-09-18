# Integração Escores × Protocolos (Prompts 121–140)

O texto colado veio corrompido pelo terceiro turno seguido: underscores removidos (`stgescoreprotocolo_integracao`, `loteid`, `nivelgate`), sinais `<` apagados e várias linhas cortadas no meio da string (ex.: `'Angiografia precoce em 4'` era `<24h`; `'CURB65 ... em 4'`; `'GCS','ATLS','gatilhoentrada','=4'` traz descrição de 4AT). Nada disso será inserido como está.

Além da corrupção, três incompatibilidades reais com o banco atual:

- **Códigos de protocolo não existem.** A tabela `protocolos_ps` tem 16 protocolos: ACLS, SCA, AVC_ISQ, SEPSE, ANAFILAXIA, STATUS_EP, CRISE_HTN, TEP, HDA, POLITRAUMA, TCE, PRE_ECLAMPSIA, HPP, BRONQUIOLITE, MENINGITE, IRA_OBSTETRICA. O texto usa DORTORACICA, CRISEASMA, IRA, CHOQUE, ATLS, QUEIMADURAS, LRA, AVCISQ, STATUSEP.
- **Escores não existem.** O lote atual tem 25 escores. O texto integra ~50, incluindo GBS, MELD, MELD-Na, Child-Pugh, Rockall, AIMS65, BISAP, SCORTEN, RegiSCAR, MASCC, SMART-COP, PSI, 4AT, C-SSRS, SIRS, YEARS, Genebra, NEXUS, Canadian C-Spine, Ottawa-Knee, ARISCAT — nenhum cadastrado.
- **Tabela de override já existe.** `stg_regras_override_red_flag` (14 regras) já cobre escore, red flag, ação de override, `escore_nao_pode`, nível de gate e prioridade, e já é lida pela função `fn_verificar_override_red_flag`. Criar uma segunda tabela duplicaria a regra de segurança.

## O que será construído

### 1. Duas tabelas novas (migração)

- `stg_escore_protocolo_integracao` — regra que liga um escore a um protocolo: tipo de integração, faixa de gatilho, ação disparada, nível de gate (hard/soft), ordem na cadeia, população validada, versão do escore e fonte.
- `stg_fluxo_decisao_patologia` — máquina de estados por patologia: estado atual, escore aplicado, faixa, próximo estado e ação.

Ambas com RLS de administrador, GRANTs, trigger de `updated_at` e índices por escore, protocolo e patologia, seguindo o padrão das demais tabelas `stg_*`.

Chaves de integridade: `protocolo_codigo` validado contra `protocolos_ps.codigo_protocolo` e `escore_nome` contra `stg_escores_clinicos.nome_escore`, via trigger de validação (não CHECK).

### 2. Regras de integração (apenas as mapeáveis)

Serão inseridas somente as regras cujo escore e protocolo já existem, com as faixas reconstruídas pelas definições oficiais. Mapeamento de código aplicado:

```text
DORTORACICA -> SCA          AVCISQ    -> AVC_ISQ
ATLS        -> POLITRAUMA   STATUSEP  -> STATUS_EP
CRISEASMA   -> (sem correspondente; regra fica de fora)
IRA/CHOQUE/QUEIMADURAS/LRA -> (sem correspondente; ficam de fora)
```

Cobertura estimada: cerca de 45 regras envolvendo NEWS2, ESI, CTAS, qSOFA, SOFA, HEART, TIMI, GRACE, NIHSS, ABCD2, Glasgow, Wells-TEP, PERC, CURB-65, CHA2DS2-VASc, HAS-BLED, Alvarado, AIR, LRINEC, Ranson, SINS, Canadian-CT-Head e Ottawa-Tornozelo, sobre ACLS, SEPSE, AVC_ISQ, SCA, TEP, HDA, POLITRAUMA, TCE, MENINGITE, ANAFILAXIA e STATUS_EP.

### 3. Overrides por red flag

Novas regras de override serão acrescentadas à tabela existente `stg_regras_override_red_flag`, no lote `integracao_escores_protocolos_v1`, cobrindo os casos íntegros do texto: parada cardíaca sobre NEWS2/Glasgow, choque sobre NEWS2/qSOFA, supra de ST sobre HEART, choque cardiogênico sobre GRACE, hemorragia intracraniana sobre NIHSS, instabilidade hemodinâmica sobre Wells-TEP, probabilidade pré-teste alta sobre PERC, dor desproporcional sobre LRINEC, sangramento ativo sobre escores de HDA e HAS-BLED alto não contraindicando anticoagulação.

### 4. Fluxos de decisão por patologia

Cadeias de estados para as patologias que têm protocolo e escores disponíveis: Sepse, AVC/AIT, Dor torácica (SCA), TEP, Pneumonia (via CURB-65), HDA, Apendicite, Fasciíte e Politrauma. Cerca de 35 transições, cada uma com estado de origem, escore, faixa, estado destino e ação.

### 5. Funções e views

- `fn_integrar_escore_protocolo(escore, protocolo, resultado, red_flag)` — retorna as regras aplicáveis e sinaliza se há override ativo.
- `fn_obter_fluxo_decisao(patologia, protocolo)` — retorna a cadeia de estados ordenada.
- Views `vw_integracao_escore_protocolo`, `vw_integracao_overrides`, `vw_integracao_fluxos` e `vw_integracao_resumo_global`, todas com `security_invoker = true`.

Override continua sendo consultado pela função já existente `fn_verificar_override_red_flag`, sem duplicação de lógica.

### 6. Indicadores de qualidade

Os 10 indicadores IQINT:1 a IQINT:10 entram em `indicadores_qualidade_ps`, com metas numéricas normalizadas para o formato já usado na tabela (`meta_pct` + operador), já que valores como `'<5'` não cabem em campo numérico.

## O que fica de fora

- Regras que dependem de escores não cadastrados (GBS, MELD, Child-Pugh, Rockall, AIMS65, BISAP, SCORTEN, RegiSCAR, MASCC, SMART-COP, PSI, 4AT, C-SSRS, SIRS, YEARS, Genebra, NEXUS, Canadian C-Spine, Ottawa-Knee, ARISCAT) e de protocolos inexistentes (IRA, CHOQUE, QUEIMADURAS, LRA, CRISEASMA).
- Linhas cortadas no meio da string, que não permitem reconstruir a ação com segurança.

Ao final entrego a lista do que entrou e a lista nominal do que ficou pendente, para você decidir se quer cadastrar os escores e protocolos faltantes numa etapa seguinte.

## Ordem de execução

1. Migração: cria as duas tabelas, triggers, índices, RLS, GRANTs, as 3 funções e as 4 views.
2. Carga de dados: regras de integração, overrides, fluxos e indicadores.
3. Consulta de verificação: contagem por protocolo, por escore e resumo global.
