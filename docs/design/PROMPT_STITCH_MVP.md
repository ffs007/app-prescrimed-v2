# Prompt para o Google Stitch — MVP PrescriMed

Cole o texto abaixo no Stitch. Use os assets do Ideogram somente como referência de clima visual.

---

Redesenhe apenas a experiência visual do MVP existente do **PrescriMed**, um webapp brasileiro para médicos criarem prescrições e documentos clínicos rapidamente durante plantões de pronto-socorro.

O objetivo primário é permitir que um médico encontre uma patologia, selecione medicamentos e exames, revise e gere o documento em menos de 5 minutos. Preserve a arquitetura funcional e os dados existentes. Não invente funcionalidades, tabelas, métricas, integrações, pacientes, depoimentos ou alegações clínicas.

## Princípios

- mobile-first, responsivo e instalável como PWA;
- linguagem em português brasileiro;
- visual clínico limpo, rápido e confiável;
- poucas decisões por tela;
- ações primárias óbvias e acessíveis com uma mão no celular;
- contraste AA, foco visível, alvos de toque de no mínimo 44 px;
- feedback imediato de carregamento, sucesso, vazio e erro;
- sem menus profundos, dashboards executivos ou gráficos decorativos;
- nenhuma ação crítica depende de IA;
- não exibir dados clínicos fictícios como se fossem reais.

## Marca e sistema visual

- Nome: **PrescriMed**.
- Fonte: Inter ou equivalente sans-serif.
- Azul profundo: `#0B2A4A`.
- Azul de ação: `#1677FF`.
- Verde seguro: `#16A56F`.
- Fundo: `#F7FAFC`.
- Texto: `#132238`.
- Erro: `#C93636`.
- Alerta: `#D97706`.
- Bordas suaves, sombra mínima, raio entre 10 e 14 px.
- Ícones lineares consistentes.
- Não usar cruz, escudo, ECG ou estetoscópio como marca principal.

## Telas a desenhar

### 1. Landing page

- Headline: **Prescreva com segurança em poucos minutos.**
- Subheadline: **Encontre a patologia, selecione a conduta e gere um documento clínico pronto para revisar e imprimir.**
- CTA primário: **Começar agora**.
- CTA secundário: **Ver como funciona**.
- Demonstração visual do fluxo em três passos: escolher patologia, montar conduta, revisar e gerar.
- Não citar telemedicina, APAC/AIH, integrações hospitalares, inteligência artificial ou números não comprovados.

### 2. Autenticação

- Entrar, criar conta e recuperar senha.
- Mensagens claras para confirmação de e-mail e falhas.
- Acesso rápido ao produto; sem distrações comerciais excessivas.

### 3. Início do app

- Busca em destaque: **Qual patologia você quer tratar?**
- Atalhos para patologias recentes e favoritas quando houver dados reais.
- Ações secundárias discretas: histórico, modelos e assinatura.
- Não criar painel institucional, gráficos ou fila de pacientes.

### 4. Nova prescrição — seleção

- Busca com autocomplete por patologia.
- Resultados legíveis e agrupados apenas se os grupos existirem no banco.
- Estado vazio instrutivo.
- Continuar somente após seleção explícita.

### 5. Construtor de prescrição

- Cabeçalho compacto com paciente opcional e patologia selecionada.
- Seções claras: medicamentos, exames e orientações.
- Cartões compactos com nome, apresentação, posologia, via e duração quando esses dados existirem.
- Adicionar, editar, remover e reordenar com poucos toques.
- Alertas clínicos visíveis, mas sem bloquear silenciosamente o fluxo.
- Barra inferior fixa no mobile com **Revisar prescrição**.

### 6. Revisão e documento

- Prévia fiel ao PDF/impressão.
- Resumo dos itens e alertas pendentes.
- CTA primário: **Gerar documento**.
- Ações secundárias: editar e imprimir/baixar quando disponíveis.
- Não adicionar botões ou informações que apareçam no PDF sem necessidade clínica.

### 7. Histórico e assinatura

- Histórico simples com busca e acesso ao documento.
- Página de assinatura com o plano atual, benefícios reais e um único CTA de checkout.
- Usuário já assinante não deve receber novo checkout como ação principal.

## Componentes obrigatórios

- cabeçalho compacto;
- campo de busca grande;
- cartão de patologia;
- cartão de medicamento/exame;
- alerta clínico;
- stepper discreto;
- barra de ação mobile fixa;
- skeleton, estado vazio, erro e confirmação;
- modal de confirmação somente para ações destrutivas.

## Restrições

- Trabalhar sobre o produto existente, não propor uma reconstrução total.
- Produzir no máximo estas 7 telas e seus estados responsivos.
- Não criar prontuário completo, gestão hospitalar, telemedicina, auditoria, faturamento, protocolos com IA, dashboard executivo ou aplicativo separado.
- Não usar imagens de telas geradas como interface final; entregar layout e componentes editáveis.
- Não alterar regras clínicas ou inventar conteúdo médico.

## Resultado esperado

Entregar um sistema visual coerente e os layouts desktop/mobile destas telas, priorizando velocidade de uso real no pronto-socorro. A primeira ação do app autenticado deve ser buscar ou escolher uma patologia.

---
