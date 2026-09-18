# Entrada por síndrome + catálogo clínico robusto

## O que está errado hoje (verificado no banco)
- O catálogo tem apenas 91 condições em `base_patologias_ref` (mais 26 repetidas em `base_patologias_clinicas`) e 31 síndromes em `base_sindromes`.
- A classificação `patologia_ambiente` permite um único ambiente por condição: 9 ambulatorial, 47 urgência, 35 emergência. Por isso o ambulatório ficou vazio.
- A tela lista tudo em bloco único, sem agrupamento, então o pouco que existe ainda parece bagunçado.

## 1. Entrada pela síndrome (o caminho do PS)
Etapa 1 passa a ser a queixa/síndrome, não a doença:

```text
[Ambiente]  Ambulatorial | Urgências/PS | Emergências/SV
      |
[Síndrome / queixa]   dor torácica · dispneia · febre · dor abdominal · cefaleia ...
      |
[Condição específica dentro da síndrome]   ou "seguir só com a síndrome"
      |
[Documento]  prescrição, atestado, relatório, encaminhamento, AIH, notificação
```

- Cada síndrome mostra as condições ligadas a ela, já filtradas pelo ambiente.
- Continua existindo o cartão "Receita / documento em branco".
- Quem já sabe o diagnóstico digita direto na busca e pula a síndrome.

## 2. Uma condição pode viver em vários ambientes
Trocar a classificação de "um ambiente por doença" para "um ou mais", com gravidade por ambiente. Exemplo: asma leve no ambulatório, crise moderada na urgência, mal asmático na emergência — mesma doença, textos e condutas diferentes conforme o ambiente. Cada aba mostra a apresentação certa, sem virar cópia da outra.

## 3. Lista completa, agrupada por sistema
A lista deixa de ser um rolo único e passa a ser agrupada: cardiovascular, respiratório, neurológico, gastrointestinal, infeccioso, geniturinário, endócrino/metabólico, musculoesquelético, dermatológico, psiquiátrico, obstétrico/ginecológico, pediátrico, trauma, toxicológico, hematológico, oftalmo/otorrino.

- Grupos recolhíveis; abre o grupo em que você está buscando.
- Dentro de cada grupo, as mais frequentes primeiro; favoritos e recentes no topo da tela.
- Busca sempre visível, atravessa todos os grupos, síndromes e sinônimos.
- Visual sem enfeite: uma linha por condição, nome + CID, marcador discreto de gravidade só nas de risco.

## 4. Ampliação do catálogo
Carga grande de condições de pronto-socorro e ambulatório, com nome, sinônimos, CID-10, sistema, ambientes aplicáveis, gravidade por ambiente e vínculo com síndrome. Feita em lotes por sistema, começando por: cardiovascular, respiratório, infeccioso, neurológico, gastrointestinal, geniturinário, trauma, e depois os demais — incluindo as condições raras, que ficam acessíveis pela busca sem poluir a tela.

Ao final você recebe a contagem por ambiente e por sistema para revisar.

## 5. Verificação
- Contagem por ambiente e sistema direto no banco.
- Conferir que abas diferentes mostram apresentações diferentes, não a mesma lista.
- Testar busca por nome, sinônimo, CID e síndrome; favoritos e recentes.
- Rodar os testes do fluxo de prescrição.

## Notas técnicas
- Migração: `patologia_ambiente` passa a aceitar múltiplos ambientes por condição (chave única por condição+ambiente), com colunas de gravidade por ambiente, sistema e vínculo de síndrome; índices de busca por nome normalizado e sinônimos.
- Vínculo síndrome↔condição em tabela própria, alimentando a etapa 1.
- `usePathologiesCatalog` retorna condições agrupadas por sistema e filtradas por ambiente, sem fallback para catálogo completo em caso de erro.
- `PathologyGate` reescrito em três estágios (síndrome → condição → documento) reaproveitando `useSyndromes`.
- Carga de dados por `run_sql` em lotes idempotentes por nome normalizado.
