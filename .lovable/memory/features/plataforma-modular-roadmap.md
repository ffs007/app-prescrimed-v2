---
name: Roadmap da plataforma clínica modular
description: Fases acordadas para evoluir o PrescriMed além da receita (AIH, APAC, notificação, central de documentos, telemedicina, auditoria) e o papel da IA
type: feature
---

# Evolução para plataforma clínica modular

Entrega em **fases curtas**: um módulo por vez, validado pelo usuário antes do próximo.

## Fases
1. **Concluída** — Documentos regulatórios faltantes: AIH, APAC e notificação compulsória.
   Implementados sobre motor genérico dirigido por especificação de campos:
   `services/regulatoryForms.ts` (FieldSpec, EMPTY_*, buildSections, structuredLead, missingRequired),
   `components/StructuredDocumentForm.tsx` (form) e `components/StructuredDocumentBody.tsx` (preview + impressão).
   Novos documentos entram pela lista `AIH_FIELDS`/`APAC_FIELDS`/`NOTIFICACAO_FIELDS`, sem duplicar UI.
2. Central de documentos unificada (paciente → tipo → revisão → emissão em fluxo único).
3. Telemedicina.
4. Auditoria e trilha clínica.

## Papel da IA
IA assistiva = **rascunho automático revisável**: pré-preenche campos, o médico revisa e edita antes de emitir.
Nunca autoridade final; nenhum documento é emitido sem revisão humana.
