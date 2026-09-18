---
name: Calculadoras clínicas e hub de Protocolos & Escores
description: Motor declarativo de calculadoras com sugestão por contexto e hub unificado de protocolos/escores/trials/fluxogramas com gerador de lacunas .md
type: feature
---

# Calculadoras clínicas
- `src/modules/calculators/lib/calculators.ts` — definições declarativas (campos + compute) para ClCr (Cockcroft-Gault), CKD-EPI 2021, ajuste renal de dose, ASC (Mosteller), Carboplatina AUC (Calvert), CHA₂DS₂-VASc, HAS-BLED, RCRI, Child-Pugh, ajuste de diurético na IC, peso ideal/ajustado e dose pediátrica mg/kg.
- `lib/suggestions.ts` — regras contexto → calculadora. Ex.: anticoagulante + FA → ClCr + CHA₂DS₂-VASc + HAS-BLED; IC descompensada → ajuste de diurético.
- `ClinicalCalculatorsPanel.tsx` — renderiza sugeridas + catálogo; autofill de idade/peso/sexo do paciente; "Usar no documento" injeta o texto.
- Integrado no Dashboard, aba/slot `dose`, ao lado do `DoseCalculatorPanel`.

# Hub Protocolos & Escores
- Rota `/app/protocolos-escores` (`src/pages/ProtocolosEscoresPage.tsx`), item no menu lateral.
- `src/modules/library/` — `hooks/useClinicalLibrary.ts` unifica `base_protocolos_clinicos` + `stg_escores_clinicos` + catálogo local (`lib/catalog.ts`, trials e fluxogramas).
- Filtros: categoria, especialidade, gravidade, ambiente clínico e patologia.
- `lib/missingItems.ts` — compara `KNOWLEDGE_RULES` (pathologyKnowledge) com a biblioteca e gera .md de itens faltantes para pesquisa externa (Perplexity).
