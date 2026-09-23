# Modelo de Relatório de Validação — Curadoria Clínica PrescriMed

Modelo a ser preenchido após cada rodada LLM/humano e **armazenado em**
`docs/clinica/curadoria/relatorios/RELATORIO_CHUNK_NN_YYYY-MM-DD.md`.

---

```markdown
# Relatório de Validação Chunk N° NN — <Nome prompt>
Data validação: YYYY-MM-DD HH:MM
Data referência base clínica: YYYY-MM-DD (última atualização CBO/MS/SBP)

## 1. Identificação
- Chunk: `/supabase/seeds/curadoria/chunks/chunk_NN.json`
- Prompt usado: PROMPTS_LLM.md # NN
- LLM (se for o caso): Claude / GPT-n / Gemini n / Codex n
- Versão LLM: <tag exata>
- Autor responsável (CRM/CPF): Dr. Fulano / Sra. Beltrana CRM nnnnn-UF
- Instituição: NACIONAL (NULL) / id=42 (Nome da Instituição)
- Chave llm_job (se já sincronizado): id=0000

## 2. Contadores de linhas por tabela
| Tabela                         | Qtd linhas | Observações                                          |
|--------------------------------|------------|------------------------------------------------------|
| exemplo_tabela                 | 000        | ex: 12 condições marcadas como "dúvida pendente"     |
|                                |            |                                                      |
| TOTAL tabelas neste chunk: XX  | TOTAL LINHAS |                                                    |

## 3. Resultado CLI 3 validação (npm run curadoria:validar)
- [ ] Nível 1 (estrutura) PASSOU
- [ ] Nível 2 (Zod linha a linha) PASSOU
- [ ] Nível 3 (UNIQUE dentro chunk) PASSOU
- [ ] Nível 4 (FK online) PASSOU  /  NÃO RODADO (marcar o que for)
- Exit code: 0 / 2 / 3 / 1
- Saída resumida dos erros (se exit != 0, colar aqui):

```text
<cole exatamente a saída do console se houve rejeições>
```

## 4. Resultado CLI 4 DRY-RUN (npm run curadoria:sync --project-ref zwwalaioamxcvxbihxlr)
- Modo: DRY-RUN  /  CONFIRMADO
- Exit code: 0 / 10
- Total inseridas: nnnn (simuladas se DRY-RUN)
- Total atualizadas: nnnn
- Erros:

```text
<saída console se houver>
```

## 5. Resultado QUALITATIVO por eixo de qualidade
Marcar S=Sempre, M=Maioria, A=Alguns, N=Nenhum:

| Critério                                                                 | S M A N | Comentário                                                                                         |
|--------------------------------------------------------------------------|---------|-----------------------------------------------------------------------------------------------------|
| 5.1 Fail-closed dúvidas clínicas (não gravou na incerteza)              |         |                                                                                                     |
| 5.2 Referências 1ª mão CFMs/MS/diretrizes citadas em justificativa       |         |                                                                                                     |
| 5.3 Nenhuma terapia inventada (só combinações publicadas)                |         |                                                                                                     |
| 5.4 População pediátrica verificada 1ª (RN 28d < lactente < criança)    |         |                                                                                                     |
| 5.5 Off-label sempre tem justificativa ≥ 30 chars + referência           |         |                                                                                                     |
| 5.6 Red flags sempre preenchidas, não vazio []                           |         |                                                                                                     |
| 5.7 Medicamento_id UUID = existe em public.base_medicamentos_geral       |         |                                                                                                     |
| 5.8 Ordem topológica respeitada (junções só após mestres)                |         |                                                                                                     |

## 6. Dúvidas clínicas remanescentes
Marque com ⚠️ cada item que precisa de 2ª opinião CRM antes do --confirmado:

- [ ] <questão clínica específica>
- [ ] <questão clínica específica>
- [ ] <...>

## 7. Auditoria llm_job (se CONFIRMADO)
- llm_job.id: 0001..nnn
- llm_job.prompt_input_hash: SHA256:<hex>
- Status final: aprovado_sem_erros  /  aprovado_com_alertas  /  rejeitado_com_erros
- Médico(a) que assinou por baixo: Nome CRM 0000-UF em YYYY-MM-DD.

## 8. Assinaturas
- Responsável Técnico (obrigatório por LGPD/Resolução CFM 2314/2022):
  Nome: _____________________________ CRM/UF: _______  Data: __/___/_______ Assinatura: ________________
- Revisor Clínico 2ª opinião (opcional mas recomendado se off-label ≥ 5 linhas):
  Nome: _____________________________ CRM/UF: _______  Data: __/___/_______ Assinatura: ________________
```

---

## Metadados do relatório (para busca por arquivo)

```
frontmatter:
  tipo_documento: relatorio_curadoria_validacao
  versao_formato: 1.0
  chunk_numero: NN
  data_validacao: YYYY-MM-DD
  llm_usada: <nome>
  status: rascunho | validado | aprovado | rejeitado
  instituicao_id: null | 1 | 42 | …
```
