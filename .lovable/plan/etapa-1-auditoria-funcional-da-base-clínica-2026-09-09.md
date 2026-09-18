# Etapa 1 — Auditoria funcional da base clínica

Objetivo: fazer o que já está cadastrado aparecer, com dose e apresentação corretas, em todas as telas. Sem adicionar medicamento, CID ou protocolo novo.

## O que a auditoria do banco já mostrou

Rodei as consultas antes de propor qualquer correção. Os números explicam exatamente o sintoma "está cadastrado mas não aparece":

| Achado | Números |
| --- | --- |
| Medicamentos cadastrados / ativos | 258 / 258 |
| Medicamentos com dose no cadastro principal | **0 de 258** (campo vazio) |
| Medicamentos com concentração / via / apresentação no cadastro principal | **0 de 258** (campos vazios) |
| Doses reais guardadas em outra tabela | 407 registros, cobrindo 222 medicamentos |
| Apresentações reais guardadas em outra tabela | 43 registros, cobrindo 39 medicamentos |
| Vínculos quadro clínico → medicamento | 409 (99 condições) |
| Vínculos síndrome → medicamento | 333 (52 síndromes) |
| Vínculos hoje marcados como "aprovado" | **0** — todos ficaram "pendente" |
| Vínculos apontando para medicamento inexistente | 0 |
| Apresentações órfãs / medicamentos duplicados | 0 / 0 |

Conclusões:

1. **A tela lê a tabela errada.** A prescrição busca dose, concentração, via e apresentação no cadastro principal, onde esses campos estão todos vazios. As informações existem, mas em duas tabelas separadas que a interface nunca consulta.
2. **A ligação dose ↔ medicamento é por texto**, não por identificador. Por isso 36 medicamentos ficam sem dose só por diferença de escrita.
3. **Nenhuma sugestão aparece hoje**, porque na correção de segurança anterior os 742 vínculos foram colocados em revisão e a tela só mostra vínculos aprovados.
4. Não há registros quebrados, duplicados ou órfãos — o problema é de conexão e de consulta, não de dados corrompidos.

## O que vou fazer

### 1. Uma fonte única de verdade no banco
Criar uma visão consolidada que junta, por medicamento: princípio ativo, classe, tipo de receita, apresentações, concentração, via, dose adulto, dose pediátrica, frequência, duração e sinalizações de segurança. A ligação dose ↔ medicamento passa a gravar o identificador estável, resolvida uma única vez por nome normalizado (minúsculas, sem acento, sem hífen/espaço extra). Nada de dados novos: só ligação do que já existe.

### 2. Um único serviço de sugestões
`getClinicalSuggestions(condição, ambiente, contextoDoPaciente)` passa a ser a única porta de entrada, usada por prescrição, explorador e busca. Retorno padronizado: identificador, nome, princípio ativo, apresentação, concentração, via, dose, frequência, duração, prioridade, observações e alertas. Se dose ou apresentação faltarem, o item vem marcado como incompleto — nunca preenchido por adivinhação.

### 3. Busca normalizada
Uma coluna de busca normalizada (sem acento, sem maiúscula, sem hífen) com índice, cobrindo princípio ativo, nome comercial e apresentação. "amoxicilina clavulanato", "amoxicilina" e "clavulanato" passam a achar o mesmo registro. Sem inventar apelidos clínicos.

### 4. Liberação controlada dos vínculos
Os vínculos ficam invisíveis hoje. Vou reabilitar apenas os que passam em verificação objetiva — medicamento existente, dose preenchida no vínculo e ambiente coerente — e deixar em revisão os que não passam, com o motivo registrado. As listas de síndrome que estavam idênticas nos três ambientes continuam bloqueadas até revisão clínica.

### 5. Painel de rastreabilidade (só admin)
Nova aba em `/admin` mostrando, por condição: vínculos no banco → retornados pelo serviço → exibidos na tela, com o motivo de cada item descartado (sem dose, sem apresentação, filtro de ambiente, em revisão). Também lista órfãos, condições sem sugestão e medicamentos sem dose. Invisível para o médico.

### 6. Fallback seguro e registro de lacunas
Quando não houver sugestão: apenas "Adicionar medicamento manualmente". Nenhum medicamento, dose ou posologia inventada. A lacuna (condição + termo buscado) é registrada internamente para orientar a Etapa 2.

### 7. Desempenho
Uma consulta por tela em vez de várias em sequência, cache de catálogo e índices de busca. Meta: sugestões e busca praticamente instantâneas.

### 8. Testes
Os sete casos pedidos: vinculado aparece; não vinculado só na busca; apresentação chega junto; dose chega junto; inativo não aparece; busca normalizada acha; quadro sem sugestão mostra opção manual sem inventar nada.

## Detalhes técnicos

- Migração: coluna `medicamento_id` em `base_medicamentos_dose` + resolução por nome normalizado; coluna/índice `busca_normalizada` em `base_medicamentos_geral`; visão `vw_medicamento_completo`; função `fn_sugestoes_clinicas(condicao, ambiente)`; tabela `auditoria_sugestoes_lacunas`. Todas com GRANT e RLS.
- Cliente: novo `src/modules/prescription/services/clinicalSuggestions.ts` como única porta; `useLinkedMedications.ts`, `MedicationExplorer.tsx`, `MedicationsBrowse.tsx` e `useMedications.ts` passam a consumi-lo. Restos do fallback por classe removidos.
- Admin: `src/pages/admin/AuditoriaBaseClinicaPage.tsx` + hook de diagnóstico.
- Sem redesenho: só estados de carregando/erro/vazio mais claros.

## Fora do escopo

Nenhum medicamento, CID, protocolo ou apresentação novo. Revisão clínica de conteúdo continua sendo decisão humana.
