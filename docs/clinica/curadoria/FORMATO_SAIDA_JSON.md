# Formato de Saída JSON — Chunks Curadoria (v1)

Este documento descreve o schema rígido de **todo arquivo chunk_NN.json**. Toda LLM ou humano
que produzir chunks deve seguir exatamente este formato. A validação offline recusa 100% dos
arquivos fora do formato.

---

## Estrutura RAIZ do arquivo (4 campos obrigatórios)

```jsonc
{
  "$schemaChunkCuradoria": 1,          // fixo, literalmente 1. NÚMERO. Não string.
  "chunkNumero": 1,                     // 1..8, conforme ordem topológica 8 prompts
  "promptNome": "condicoes_e_ddx",      // nome curto do prompt origem
  "promptInputHash": "",                // SHA-256 opcional do prompt de entrada string
  "instituicaoId": null,                // null = base nacional compartilhada; 1 = NACIONAL_PRESCRIMED; número = FK curadoria.instituicoes.id
  "dadosGerais": { ... },               // metadados do chunk
  "tabelas": { ... }                    // mapa nome_tabela → array linhas
}
```

### Campo `dadosGerais` (obrigatório)

| Chave                 | Tipo          | Obrigatorio | Exemplo                                              |
|-----------------------|---------------|-------------|------------------------------------------------------|
| `dataCriacao`         | ISO datetime  | sim         | `"2026-09-21T18:30:00.000Z"`                         |
| `autorResponsavel`    | string / null | sim         | `"Dr. Exemplo CRM 123456-SP"` ou `null`              |
| `observacoes`         | string        | não         | `"Chunk revisado e validado 21/09"`                  |

### Campo `tabelas` (objeto, não array)

Cada **chave** de `tabelas` deve ser o nome EXATO de uma tabela existente em
`curadoria.*`. A lista completa aceita está em:

```
instituicoes, condicoes_clinicas, tipos_prescricao, monitorizacoes,
classes_medicamentosas, exames_complementares, protocolos_clinicos,
protocolo_clinico_versao, protocolo_etapa, linhas_cuidado, linha_cuidado_acoes,
modelos_documento, modelo_documento_campos, instituicoes_config,
prescricao_rapida_templates, prescricao_template_item, dupla_checagem_politica,
llm_job, llm_job_detail, condicao_exames, condicao_medicamentos_alternativos,
condicao_classes_medicamentosas, condicao_exame_fisico, condicao_modelos_documento,
condicao_protocolo_clinico, condicao_linha_cuidado, condicao_ddx, condicao_refinamentos
```

Qualquer outra chave → **erro de validação Nível 1**.

---

## Exemplo mínimo (chunk_01.json válido vazio)

```json
{
  "$schemaChunkCuradoria": 1,
  "chunkNumero": 1,
  "promptNome": "condicoes_e_ddx",
  "promptInputHash": "",
  "instituicaoId": null,
  "dadosGerais": {
    "dataCriacao": "2026-09-21T00:00:00.000Z",
    "autorResponsavel": null,
    "observacoes": "Primeiro preenchimento"
  },
  "tabelas": {
    "condicoes_clinicas": [],
    "condicao_ddx": [],
    "condicao_refinamentos": []
  }
}
```

---

## Tabela por tabela: campos NÃO ÓBVIOS

### 1. `condicoes_clinicas`

- `tipo`: ENUM estrito. Valores válidos: `sintoma | sindrome | patologia | queixa | hipotese`.
- `nome_normalizado`: **NÃO INCLUIR** — é uma coluna `GENERATED ALWAYS AS STORED`, calculada automaticamente.
- `red_flags[]`: sempre preencha. Vazio `[]` é permitido mas não recomendado.
- `instituicao_id`: `null` = nacional. **Só use número se for customização institucional.**

### 2. `exames_complementares`

- `codigo_exame`: UNIQUE com instituicao_id. Convenção: prefixo `LAB_`, `IMG_`, `ECG_`, `ESC_`, `SCORE_`.
- `subtipo_imagem`: só preencha se `tipo_exame = 'imagem'`; senão `null`.
- `sinonimos_busca[]`: 5-20 sinônimos que o usuário pode digitar no buscador fuzzy.

### 3. `condicao_medicamentos_alternativos` (junção mais restrita)

- **CHECK CRÍTICO NÃO NEGOCIÁVEL**:
  ```
  eh_off_label = true  →  off_label_justificativa obrigatória, len >= 30 caracteres.
  eh_off_label = false →  off_label_justificativa DEVE ser null ou "".
  ```
  Validador Zod recusa automaticamente se for violado.
- `medicamento_id`: UUID. Copie de `public.base_medicamentos_geral.id`. Não gere UUID novo.
- `justificativas_escolha`: JSON com **6 e só 6 chaves exatas**:
  ```json
  { "custo": "...", "disponibilidade": "...", "eficacia": "...",
    "perfil_efeitos_adversos": "...", "seguranca_populacao": "...", "adequacao_protocolo": "..." }
  ```

### 4. `protocolo_etapa` (9 etapas fixas)

- `numero_etapa` entre 1 e 9. Valores:
  1 = triagem, 2 = avaliacao_inicial, 3 = estabilizacao, 4 = solicitacao_exames,
  5 = tratamento, 6 = criterios_alta, 7 = criterios_transferencia,
  8 = criterios_internacao, 9 = pontos_checagem.
- UNIQUE `(versao_id, numero_etapa)`. Nunca insira 2x mesma etapa.

### 5. `instituicoes_config` (CHECK JSON 8 chaves)

- `parametros_configuraveis` DEVE ter ao menos 1 das 8 chaves abaixo. Tudo fora disso:
  ```
  limites_pa_min, limites_pa_max, doses_padroes_sobrepoe, exames_obrigatorios_por_condicao,
  fluxos_internos_encaminhamentos, responsaveis_acionamento,
  disponibilidade_medicamentos, disponibilidade_exames
  ```

### 6. `condicao_linha_cuidado` (conexao só ENUM)

- `conexao[]` array só pode ter estes 6 valores (case sensitive):
  `seguranca`, `protecao`, `acompanhamento`, `acionamento_rede`, `documentacao`, `comunicacao_formal`.
- Qualquer outro valor (ex: `"rede_externa"`, `"medico_receptor"`) → **validador recusa**.

---

## Regras de representação de tipos especiais

| Tipo SQL           | Como representar em JSON                               | Exemplo                                   |
|--------------------|--------------------------------------------------------|-------------------------------------------|
| `bigint`           | número inteiro (≥0) ou string numérica, tanto faz     | `1`, `"42"`                                |
| `uuid`             | string 36 chars com 4 hifens, lowercase                | `"550e8400-e29b-41d4-a716-446655440000"`  |
| `numrange`         | string `"[min,max)"` ou tupla `[min,max]` no JSON (Zod transforma) | `"[0,18)"` ou `[0, 18]`         |
| `ENUM*`            | string literal exata, minúsculas, acentos exatos       | `"patologia"` (não `"Patologia"`)         |
| `timestamptz`      | ISO-8601 datetime string UTC com `Z`                   | `"2026-09-21T19:15:00.000Z"`              |
| `text[]`           | array strings                                          | `["Dispneia", "Saturação baixa"]`         |
| `jsonb`            | objeto JSON aninhado com chaves strings                | `{"efeito_colateral":"sonolencia"}`       |

---

## O que NUNCA fazer em um chunk

1. ❌ Não remova campos de nível raiz (`$schemaChunkCuradoria`, etc.).
2. ❌ Não crie colunas extras que não existem no schema curadoria.
3. ❌ Não use abreviações livres em campos ENUM (ex: `hipot` ao invés de `hipotese`).
4. ❌ Não deixe `medicamento_id` UUID = `null` se for N:N obrigatória (exceto template items).
5. ❌ Não adicione comentários (`//`) ou trailing commas (JSON é estrito).
6. ❌ Não embaralhe a ordem dos 8 chunks.
7. ❌ Não use valores `undefined` (use `null`).
8. ❌ Não repita a mesma linha UNIQUE no mesmo chunk (validador Nível 3 recusa).
