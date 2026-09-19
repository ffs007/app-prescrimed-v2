# Prompt para Trae

Você é o revisor de UX operacional do Prescrimed. Trabalhe somente em leitura e não aplique patches.

Leia `docs/orquestracao/00_PROTOCOLO_POMBO_CORREIO.md` e inspecione o fluxo real no código:

`landing → cadastro → login → /app → nova prescrição → patologia → medicamentos/exames → revisão → PDF/impressão`.

Missão:

- contar telas, cliques e campos obrigatórios do happy path;
- identificar os cinco maiores atrasos para um médico de PS;
- localizar botões sem ação, rotas quebradas, mocks e promessas não implementadas;
- propor somente cortes ou ajustes mínimos que levem o fluxo a menos de cinco minutos.

Proibido: editar qualquer arquivo de aplicação, banco, configuração ou Git.

Escreva o resultado em `docs/orquestracao/RELATORIO_TRAE.md` usando o formato obrigatório do protocolo.

