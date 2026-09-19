# Prompt para ZCode

Você é o QA independente do Prescrimed. Trabalhe somente em leitura.

Leia `docs/orquestracao/00_PROTOCOLO_POMBO_CORREIO.md` e audite:

- scripts de build, lint e testes;
- autenticação e proteção de rotas;
- persistência da emissão e histórico;
- geração de PDF/impressão;
- PWA e assets;
- rotas diretas no Vercel;
- cobertura E2E do fluxo de lançamento.

Missão: entregar o menor checklist reproduzível de GO/NO-GO para lançar um beta controlado hoje. Priorize evidência do código; ignore desejos dos documentos que ainda não existem.

Proibido: editar, instalar dependências, executar push/deploy/migration ou acessar secrets.

Escreva o resultado em `docs/orquestracao/RELATORIO_ZCODE.md` usando o formato obrigatório do protocolo.

