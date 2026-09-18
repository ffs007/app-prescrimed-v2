# Medicamentos por patologia e síndrome — plano de robustez

## O que está acontecendo hoje (verificado no banco e no código)

- A base tem **258 medicamentos ativos**, distribuídos por todas as letras (34 em "A", 30 em "C", 17 em "M"...). O problema não é a base estar vazia.
- **Nenhum medicamento está ligado a uma doença**: as colunas de CID relacionado e queixa relacionada estão zeradas em todos os 258 registros, e a tabela de contexto clínico do medicamento está vazia.
- A ligação doença → medicamento existe apenas em uma **lista fixa dentro do código**, com cerca de 137 doenças curadas. Como o app hoje lista **293 doenças** vindas do banco, a maioria abre sem nenhum medicamento sugerido.
- Quando não há sugestão curada, a tela mostra uma lista plana **cortada nos 8 primeiros itens em ordem alfabética** — é daí que vem a sensação de "só aparecem medicamentos com A". O mesmo corte alfabético existe na tela de consulta da base.
- As **síndromes não têm nenhuma ligação com medicamentos**; só ligam para doenças.

## Correção imediata (bloqueando publicação)

A publicação está falhando desde a última alteração: o pacote do app instalável tenta guardar um arquivo maior que o limite padrão. Ajustar o limite de cache e dividir o pacote em partes menores para o build voltar a passar.

## Estrutura de dados nova

Uma tabela de vínculo clínico, feita para crescer:

`patologia_medicamento`
- doença (nome normalizado + id), medicamento (id da base)
- ambiente: ambulatorial / urgência / emergência (um vínculo pode valer para vários)
- linha: primeira escolha, alternativa, sintomático, suporte
- via, dose adulto, dose pediátrica, duração, observação
- público-alvo: adulto / pediátrico / ambos; sinalização de gestante, renal e hepático
- prioridade (ordena a lista), fonte/referência e status de revisão
- quem criou, quando, e histórico de alterações

`sindrome_medicamento` — mesmo formato, para a conduta inicial de síndromes (dor torácica, dispneia, choque etc.), usada enquanto a doença ainda não foi definida.

Ambas com regras de acesso: qualquer profissional autenticado lê; só administradores escrevem.

## Preenchimento por lotes clínicos

Preencher os vínculos em lotes revisáveis, começando pelo que mais aparece no plantão:

1. Infecções comuns (respiratórias, urinárias, pele/partes moles, gastrointestinais)
2. Cardiovascular (síndrome coronariana, arritmias, crise hipertensiva, insuficiência cardíaca)
3. Respiratório (asma, DPOC, pneumonia, tromboembolismo)
4. Dor, febre, náusea, alergia e outros sintomáticos transversais
5. Neurologia (AVC, crise convulsiva, cefaleias), endócrino-metabólico (hipo/hiperglicemia, distúrbios eletrolíticos)
6. Gineco-obstetrícia, pediatria, trauma, toxicologia, psiquiatria

Cada lote traz dose adulta, dose pediátrica quando aplicável, via, duração e linha de escolha. Meta de cobertura: **todas as doenças de urgência e emergência com pelo menos uma primeira escolha**, e as demais com sugestão por classe.

## Rede de segurança quando não há vínculo curado

Nenhuma doença deve terminar com lista vazia ou com "os 8 primeiros do alfabeto":

1. Se houver vínculo curado, mostra ele, agrupado por linha de escolha.
2. Se não houver, mostra sugestão **por classe terapêutica** compatível com a categoria da doença (ex.: infecção respiratória → antibióticos respiratórios), ordenada por relevância, não por alfabeto.
3. Sempre disponível: busca em toda a base (258 itens, com paginação e busca por princípio ativo, nome comercial e classe) e inclusão manual.
4. A lista deixa de ser truncada silenciosamente: mostra os principais e um botão "ver todos (N)".

## Ajustes de tela

- Bloco de medicamentos com abas curtas: **Sugeridos** · **Por classe** · **Buscar na base**.
- Cada item mostra dose adulta e, quando o paciente é pediátrico, a dose por peso já calculada.
- Marcações visíveis de gestante, ajuste renal/hepático e receita especial.
- Ao escolher uma síndrome sem doença definida, aparece a conduta inicial da síndrome.
- Contagens reais no cabeçalho ("12 sugestões", "258 na base") para o médico saber o que está vendo.

## Curadoria administrativa

Tela em Administração para adicionar, editar e revisar vínculos doença/síndrome → medicamento, com filtro por ambiente e status, e indicador de cobertura (quantas doenças de cada ambiente já têm primeira escolha).

## Detalhes técnicos

- Migrações: duas tabelas novas com índices por doença, ambiente e prioridade, GRANTs e políticas de leitura autenticada/escrita administrativa; gatilho de atualização de data.
- Seeds por lote via SQL de dados, com chave única (doença + medicamento + ambiente + linha) para permitir reexecução sem duplicar.
- Novo hook `usePathologyMedications(pathology, ambiente, paciente)` retornando sugestões agrupadas por linha, com fallback por classe; `useSyndromeMedications` equivalente.
- `usePathologiesCatalog` passa a mesclar os vínculos do banco em vez de depender só da lista curada em código.
- `PathologyLibrary` remove o `slice(0, 8)` e passa a usar o novo hook; a lista legada em `src/data/medications.ts` vira apenas complemento.
- `vite.config.ts`: elevar `maximumFileSizeToCacheInBytes` e configurar divisão de pacotes para destravar a publicação.
- Sem alterar `src/components/ui/*` e sem rodar `npx shadcn init`.

## Entrega

1. Build destravado.
2. Tabelas de vínculo + curadoria administrativa.
3. Lotes 1–3 preenchidos e visíveis na tela.
4. Fallback por classe e busca completa na base.
5. Lotes 4–6 e indicador de cobertura.
