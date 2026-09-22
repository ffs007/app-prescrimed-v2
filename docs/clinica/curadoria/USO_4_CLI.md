# Guia de Uso: Curadoria PrescriMed via 4 CLIs + Codex/Trae/Claude Code/Zcode

Documento de "cópia e cola" para qualquer LLM ou operador humano subir dados clínicos
no PrescriMed. **Sempre use esta ordem — fail-closed: qualquer passo que falhe, pare imediatamente.**

---

## 0. Pré-requisitos (1 vez por workstation)

```bash
# 0.1 Verificar que tem tsx instalado (devDependencies)
cd "c:\Users\Felip\Desktop\APP Prescrimed v2\lovable-export-prescrimed-v2"
npm install tsx dotenv --save-dev    # se já não estiver em package.json (já está no spec)

# 0.2 Criar .env se não existir com 3 var OBRIGATÓRIAS:
#    VITE_SUPABASE_URL="https://zwwalaioamxcvxbihxlr.supabase.co"
#    VITE_SUPABASE_ANON_KEY="..."
#    SUPABASE_SERVICE_ROLE_KEY="..."    ← para --online e sync --confirmado
#    (Service Role é obtida em Supabase Dashboard → Settings → API → service_role)
```

---

## ORDEM OBRIGATÓRIA de 4 CLIs (9 passos total)

### CLI 1/5: `npm run curadoria:topologia` — imprime a ordem

```bash
npm run curadoria:topologia
# ou filtrar por tipo:
npx tsx scripts/curadoria/topological-sort.ts --tipo mestre
npx tsx scripts/curadoria/topological-sort.ts --tipo juncao
```

Saída esperada: **26 linhas, 17 mestres/parametrizáveis + 9 junções**.
Se faltar tabela ou tiver ordem errada, **não siga**.

---

### CLI 2/5: `npm run curadoria:esqueleto` — gerar chunk vazio quando precisar

Só use quando os 8 chunks iniciais forem insuficientes (ex: 9ª iteração, bloco novo).

```bash
# Ex: chunk 9 (novo bloco) para nova instituição 42
npm run curadoria:esqueleto -- --numero 9 \
  --prompt-nome "novo_bloco_asma_grave_pediatria" \
  --autor "Dr. Fulano CRM 123456" \
  --instituicao-id 42 \
  --saida supabase/seeds/curadoria/chunks/chunk_09.json
```

Flags:
- `--numero N` (1..inf; N=1..8 já existem)
- `--vazia` gera chunk sem linhas exemplo (recomendado para produção)
- `--exemplo` (default) gera 1-2 linhas fakes para ensinar o shape à LLM. **Antes do sync, APAGUE as linhas fakes.** Sempre.

---

### CLI 3/5: `npm run curadoria:validar` — validação offline + online (FAIL-CLOSED)

**4 Níveis. Todos devem PASSA para o sync poder rodar.**

```bash
# NÍVEIS 1,2,3 (offline sempre. 0 custa, <1s):
npm run curadoria:validar -- \
  --arquivo supabase/seeds/curadoria/chunks/chunk_01.json

# Com verbose:
npm run curadoria:validar -- \
  --arquivo supabase/seeds/curadoria/chunks/chunk_01.json --verbose

# Para ATIVAR NÍVEL 4 (checagem FK ONLINE real no Supabase):
npm run curadoria:validar -- \
  --arquivo supabase/seeds/curadoria/chunks/chunk_01.json \
  --online \
  --project-ref zwwalaioamxcvxbihxlr \
  --service-role-env SUPABASE_SERVICE_ROLE_KEY
```

| Nível | Checa                            | Falha se:                                            |
|-------|----------------------------------|------------------------------------------------------|
| 1     | Estrutura arquivo (wrapper)      | Chave fora do FORMATO_SAIDA_JSON.md                  |
| 2     | Zod linha a linha                | Tipo, obrigatoriedade, ENUM, CHECK off-label >30 chars |
| 3     | UNIQUE dentro do chunk           | Duas linhas com mesma chave_negócio + instituicao_id  |
| 4     | FK online no banco real          | condicao_id=999 não existir em condicoes_clinicas     |

Exit codes:
- `0` = tudo OK;
- `2` = falha níveis 1/2/3 offline;
- `3` = falha nível 4 online FK;
- `1` = erro fatal (arquivo não existe, etc).

**Regra de ouro**: NUNCA pule para CLI 4 antes do CLI 3 passar com exit 0.

---

### CLI 4/5: `npm run curadoria:sync` — sync batch upsert + auditoria LLM

⚠️ **A regra mais importante do sync: o padrão é DRY-RUN. Sempre DRY-RUN primeiro.
Só adicione `--confirmado` se o DRY-RUN passou 0 erros.**

```bash
# ================================================= PASSO A: DRY RUN (padrão, sem --confirmado)
npm run curadoria:sync -- \
  --arquivo supabase/seeds/curadoria/chunks/chunk_01.json \
  --project-ref zwwalaioamxcvxbihxlr \
  --verbose

# ================================================= PASSO B: CONFIRMADO (SÓ SE PASSO A PASSOU!)
npm run curadoria:sync -- \
  --arquivo supabase/seeds/curadoria/chunks/chunk_01.json \
  --project-ref zwwalaioamxcvxbihxlr \
  --confirmado \
  --verbose
```

Flags úteis:
- `--batch N` (padrão 1000, reduzir para 50 se JSON for muito grande)
- `--apenas-tabela nome_tabela` (testar só 1 tabela isoladamente)
- `--forcar-reexecucao` (roda mesmo que llm_job UNIQUE hash já exista)
- `--service-role-env VAR` (ex: `VITE_SUPABASE_SERVICE_ROLE_KEY`)

**Como funciona o upsert**:
```sql
INSERT INTO curadoria.condicoes_clinicas (tipo, nome, sinonimos, red_flags, cid10, ...)
VALUES ($1, $2, ...)
ON CONFLICT (tipo, nome_normalizado, instituicao_id) DO UPDATE SET
  sinonimos = EXCLUDED.sinonimos,
  red_flags = EXCLUDED.red_flags,
  ...
  updated_at = now()
```

Ou seja: **chunk é re-rodável**. Se o dado existir, é atualizado; se não, é inserido.

Auditoria automática após sync confirmado:
- `curadoria.llm_job` 1 linha por tabela processada (status = `aprovado_sem_erros` ou `rejeitado_com_erros`)
- `curadoria.llm_job_detail` raw_request + contadores.

---

### CLI 5/5 (interna): `validar-chunk.ts` vs `zod.schema.ts` vs `topological-sort.ts`

Os 3 primeiros arquivos TypeScript são bibliotecas importadas pelos CLIs 3 e 4.
**Não execute-os diretamente**. Eles estão lá para reuso futuro no backend.

---

## Ordem batch completo: 8 chunks + validações em loop

Quando houver necessidade de rodar **todos os 8 chunks de uma vez**, copie este script:

```bash
# ================ Windows PowerShell: validar + dry-run TODOS os chunks ================
$chunks = 1..8 | ForEach-Object { "chunk_{0:D2}.json" -f $_ }
$FAIL = 0
foreach ($c in $chunks) {
  Write-Host "`n=== VALIDAR $c ==="
  npm run curadoria:validar -- --arquivo "supabase/seeds/curadoria/chunks/$c"
  if ($LASTEXITCODE -ne 0) { Write-Host "❌ $c FALHOU validação"; $FAIL = 1; break }
}
if ($FAIL -eq 0) {
  foreach ($c in $chunks) {
    Write-Host "`n=== DRY-RUN SYNC $c ==="
    npm run curadoria:sync -- --arquivo "supabase/seeds/curadoria/chunks/$c" --project-ref zwwalaioamxcvxbihxlr
    if ($LASTEXITCODE -ne 0) { Write-Host "❌ $c FALHOU dry-run"; $FAIL = 2; break }
  }
}
Write-Host "Resultado final FAIL=$FAIL (0 = tudo certo para --confirmado)"
```

---

## 8 prompts × como chamar via Codex / Trae / Claude Code / Zcode

Use este prompt único em QUALQUER uma das 4 CLIs Codex/Trae/Claude/Zcode:

```text
Você é o Curador Clínico Sênior do PrescriMed conforme PERSONA_LLM.md.
[COLOQUE AQUI O CONTEÚDO DO PROMPT_NN.md (1..8)]

Quando terminar de gerar o chunk JSON:
  1) Escreva o arquivo em supabase/seeds/curadoria/chunks/chunk_NN.json
  2) RODE E ME MOSTRE A SAÍDA DE:
       npm run curadoria:validar -- --arquivo supabase/seeds/curadoria/chunks/chunk_NN.json
     — se falhar, corrija automaticamente e volte para o passo 1.
  3) Quando validação passar, RODE E ME MOSTRE A SAÍDA DE:
       npm run curadoria:sync -- --arquivo supabase/seeds/curadoria/chunks/chunk_NN.json --project-ref zwwalaioamxcvxbihxlr
     (DRY-RUN, sem --confirmado).
  4) Se dry-run tiver 0 erros, me peça autorização explícita para rodar --confirmado.
     NUNCA rode --confirmado sem autorização.
```

---

## Checklist antes de autorizar `--confirmado`

- [ ] Exit 0 do CLI 3 (4/4 níveis passou)
- [ ] Exit 0 do CLI 4 DRY-RUN, 0 erros, 0 FK quebradas
- [ ] `duvidas_clinicas[]` vazias ou revisadas por CRM humano
- [ ] Nenhum `eh_off_label=true` com justificativa < 30 chars
- [ ] `conexao[]` da linha cuidado só tem os 6 valores enum
- [ ] 9 etapas do protocolo 1..9 exatas, sem repetição
- [ ] Autor CRM explicitamente aprovou por escrito (chat, email, assinatura)
