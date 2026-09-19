# Avaliação dos assets — PrescriMed

## Veredito

Os materiais atuais são bons como **moodboard, apresentação e direção visual**. Não devem entrar diretamente no produto.

O principal risco é a inconsistência: aparecem marcas, tipografias e posicionamentos diferentes, além de interfaces geradas com textos errados, dados clínicos fictícios e funções que ainda não existem.

## Direção aprovada para o MVP

- Nome visual: **PrescriMed**.
- Símbolo: monograma simples inspirado em **Rx/P**, sem cruz, escudo, ECG ou estetoscópio.
- Interface: sans-serif, preferencialmente **Inter**.
- Paleta principal: azul profundo, azul clínico, verde seguro e neutros frios.
- Aparência: limpa, rápida, pouco texto, alto contraste e controles grandes.
- Promessa central: prescrever com segurança em poucos minutos no pronto-socorro.
- Público inicial: médico individual e equipe pequena. A instituição não deve dominar o fluxo.

## Pode ser reutilizado

- Paleta azul/verde e linguagem visual clínica.
- Composição limpa do hero.
- Estrutura dos cartões de medicamentos e exames.
- Hierarquia do fluxo mobile de patologia para prescrição.
- Algumas composições dos decks para apresentação comercial.

## Não deve ser reutilizado como produto

- Screenshots gerados pelo Ideogram.
- Textos, números, depoimentos, pacientes e métricas fictícias.
- Dashboards hospitalares densos.
- Recursos não implementados: telemedicina, auditoria institucional, IA crítica, integrações, APAC/AIH e governança ampla.
- O arquivo chamado de app icon: ele contém uma interface inteira e artefato visual; não funciona como ícone.
- Mistura de `Prescrimed`, `PrescriMed+`, marca Rx, escudo, cruz e ECG.

## Regra de produção

Use os assets apenas como referência visual. A interface final deve ser construída com componentes React/Tailwind, texto real e dados do sistema. Nenhuma tela rasterizada deve virar parte navegável do app.

## Entregáveis visuais mínimos

- Logo horizontal em SVG e PNG transparente.
- Símbolo isolado em SVG.
- `favicon` de 48 ou 64 px.
- `apple-touch-icon` de 180 × 180 px.
- ícones PWA de 192 × 192 e 512 × 512 px.
- versão maskable com símbolo contido em 70% da área segura.
- imagem social de 1200 × 630 px sem dados clínicos fictícios.

## Critério de aceite

Um plantonista deve entender onde clicar em até 3 segundos e chegar à seleção da patologia em no máximo 2 ações após entrar.
