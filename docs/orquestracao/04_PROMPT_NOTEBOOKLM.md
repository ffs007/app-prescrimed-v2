# Prompt para NotebookLM

Com base exclusivamente nas fontes do notebook “Prescrimed — Base Mestre de Produto Clínico e Regulatório”, faça uma crítica de lançamento.

Contexto verificado no código:

- público inicial: médico individual/plantonista de pronto-socorro brasileiro;
- meta operacional: gerar documento seguro em menos de cinco minutos;
- exames por patologia possuem vínculos no banco;
- existem vínculos medicamento-patologia revisados, mas nenhuma ficha medicamentosa satisfaz atualmente todos os critérios de dose/apresentação completa para liberação automática;
- IA não deve integrar o caminho crítico;
- lançamento pretendido: beta controlado, não plataforma hospitalar completa.

Responda:

1. Quais dez condições/síndromes devem compor o beta inicial?
2. Quais alegações da landing podem ser feitas hoje sem exagero clínico ou regulatório?
3. Quais funcionalidades devem ser ocultadas ou marcadas como futuras?
4. Qual checklist clínico mínimo o especialista de Sala Vermelha deve validar?
5. Qual é o critério objetivo de GO/NO-GO?

Não invente condutas, doses ou referências ausentes. Cite as fontes do notebook. A resposta deve ser copiada para `docs/orquestracao/RELATORIO_NOTEBOOKLM.md`.

