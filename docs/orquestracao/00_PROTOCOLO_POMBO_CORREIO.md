# Protocolo Pombo-Correio — Prescrimed

Objetivo: permitir que Claude Code, Trae, ZCode e NotebookLM contribuam sem login compartilhado, sem editar os mesmos arquivos e sem conflitar com o Codex.

## Regras

1. Cada auxiliar lê somente o prompt com seu nome.
2. Nenhum auxiliar altera código, banco, secrets, Git, produção ou dependências.
3. Cada auxiliar entrega apenas o relatório solicitado no arquivo de saída indicado.
4. Não copiar `.env`, tokens, chaves, dados de pacientes ou logs sensíveis.
5. Achados devem citar arquivo e linha quando houver código.
6. Codex decide, implementa, testa e integra. Relatórios são pareceres, não ordens.

## Estado de referência

- Produto: beta controlado para médicos individuais de pronto-socorro.
- Happy path: patologia → medicamentos/exames → revisão → PDF/impressão em menos de 5 minutos.
- Branch de trabalho: `fix/monetization-baseline`.
- Produção publicada: commit `43b14a0`.
- Melhorias locais ainda não publicadas: `cc03d53`, `12b5054`, `3f677b8` e trabalhos posteriores.
- Alterações não commitadas do usuário devem ser preservadas.
- Conteúdo clínico incompleto deve falhar fechado e nunca aparecer como recomendação pronta.

## Formato obrigatório do relatório

```md
# Relatório — [auxiliar]

## Veredito
[GO / GO beta controlado / NO-GO]

## P0 comprovados
- [arquivo:linha] Evidência → impacto → correção mínima.

## Cortar do lançamento
- ...

## Teste decisivo
- Passos e resultado esperado.

## Próxima ação única
- ...
```

