---
name: Taxonomia da emissão clínica
description: Separação correta entre contexto de atendimento e tipo de documento na PrescriMed+
type: feature
---

# Taxonomia: Contexto vs Documento

A área interna NUNCA deve misturar contexto de atendimento com tipo de documento. São dois eixos independentes.

## Eixo 1 — Contexto de atendimento (onde o médico está)
- **Ambulatorial** (consultório, atenção primária)
- **Hospitalar** (enfermaria, internação)
- **Urgência** (PA, plantão) — opcional, pode entrar em fase futura

Selecionado uma vez no header. Define defaults visuais e modelos sugeridos.

## Eixo 2 — Tipo de documento / ação (o que o médico vai emitir)
1. Receita médica
2. Solicitação de exames
3. Encaminhamento
4. Atestado
5. Declaração de comparecimento
6. Relatório de atendimento
7. Orientações & plano de retorno

Selecionado em cards no fluxo do atendimento (depois de paciente).

## Erro a corrigir no Dashboard atual
O segmented control "Ambulatorial / Hospitalar / Atestado" está conceitualmente errado:
mistura contexto (Ambulatorial, Hospitalar) com documento (Atestado).

## Arquitetura mental da área interna (3 blocos)
- **Bloco A** — Paciente & contexto clínico
- **Bloco B** — Escolha do documento/ação
- **Bloco C** — Construção e revisão do documento (área dinâmica)

Mobile: blocos viram etapas (wizard ou tab única + drawer de preview — definir na Fase B).
