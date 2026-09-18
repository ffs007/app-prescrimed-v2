---
name: Fluxo Nova Prescrição em 3 etapas
description: Sequência patologia → tipo de documento → construção, com correlação automática e opção "em branco"
type: feature
---

# Nova Prescrição — etapas sequenciais

1. **Etapa 1 (PathologyGate)** — ambiente clínico (ambulatorial/urgência/emergência) + busca + lista filtrada.
   Card destacado "Receita / Patologia em branco" chama `onSkip` (sem filtros automáticos).
2. **Etapa 2** — `docChosen` no Dashboard controla a tela de escolha do documento (ActionGrid em tela cheia).
   Botão "Trocar" na etapa 2 volta à patologia; na etapa 3 volta ao tipo de documento.
3. **Etapa 3** — construção com `PathologyCorrelationPanel`.

## Correlação automática
`src/modules/prescription/data/pathologyKnowledge.ts` — regras por palavra-chave (nome + sinônimos + categoria).
Cada regra traz: anamnese, exame físico, diferenciais, exames, condutas, CIDs, encaminhamentos, protocolos, escores e restrições por perfil.
Perfis: cardiopata, nefropata, hepatopata, geriátrico, pediátrico, obstétrico, oncológico
(`deriveProfiles` a partir dos dados do paciente + `GENERIC_PROFILE_RESTRICTIONS`).
`isHighSeverity` dispara alerta vermelho em Emergências/SV ou gravidade grave/crítica.

Fluxo em branco: `knowledge` é `null` e nenhum filtro/sugestão é aplicado.
