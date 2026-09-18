---
name: Etapa 7 — Base clínica e escalabilidade
description: Fundação modular pós-Etapa 7 — schema v2, motor de regras com registry, busca unificada e bibliotecas auxiliares
type: feature
---

# Etapa 7 — Arquitetura clínica

## Schema v2 (overlay opcional)
- `MedicationV2` extende `Medication` legado com: `activeIngredient`, `therapeuticClass`, `atcCode`, `presentations[]`, `adultDose`, `pediatricDoseStructured`, `pregnancy`, `renal[]`, `interactions[]`, `requiresWeight`, `requiresRenalReview`, `verifiedBy`, `lastReviewed`.
- Localização: `src/modules/prescription/types/clinical.ts`.
- Banco legado em `src/data/medications.ts` continua sendo a fonte primária. v2 é overlay consultado por `getMedicationV2(id)`.

## Estrutura de dados modular
- `src/modules/prescription/data/medications/` — uma pasta por classe terapêutica (antibiotics, analgesics-antipyretics, anti-inflammatories, corticosteroids, respiratory, gastro, antiallergics).
- `src/modules/prescription/data/orientations.ts` — biblioteca de orientações com red flags e plano de retorno.
- `src/modules/prescription/data/exams.ts` — biblioteca de exames com justificativa padrão.
- `src/modules/prescription/data/procedures.ts` — biblioteca de procedimentos.
- `src/modules/prescription/data/specialties.ts` — especialidades para encaminhamento.
- `src/modules/prescription/data/protocols.ts` — modelos prontos que apontam para meds/exames/orientações por id.

## Motor de regras (registry)
- `src/modules/prescription/services/ruleRegistry.ts` — registry central com `registerRule`, `evaluateAll`, `unregisterRule`.
- `clinicalSafety.ts` agora registra as 5 regras core no boot e delega `assessSafety` para `evaluateAll`.
- `services/v2Rules.ts` adiciona regras estruturadas baseadas no banco v2 (peso obrigatório, restrição renal, gestante avoid, interação por classe).

## Busca unificada
- Fuse.js indexa medicamentos + patologias + exames + procedimentos + especialidades + orientações.
- Hook: `useClinicalSearch()` retorna `{ search, all }` com filtro opcional por `kinds`.

## Convenções
- Migração incremental: novos meds entram primeiro no banco legado e depois ganham overlay v2.
- IDs ≥ 9000 reservados para overlay v2 não promovido ao banco principal.
- Cada item v2 deve ter `verifiedBy` e `lastReviewed` (governança).
