---
name: Premium polish round
description: Polimento premium da landing + Dashboard sem mudar identidade visual. Reordenação, indicadores de rascunho, smooth scroll, FAB com contador.
type: feature
---
# Polimento premium (rodada pós-Fase C)

## Landing
- **Ordem das seções:** Hero → Trust → PainPoints → Modules → Steps → Features → Testimonials → Pricing → FAQ. PainPoints vem antes de Modules para criar tensão antes de mostrar a solução.
- **TrustSection refeita:** sem números fictícios. Mostra "Sete documentos clínicos / Pediátrico, gestante, urgência / CFM · LGPD · ICP-Brasil".
- **Hero:** badge pill com Sparkles no eyebrow, badge "Checagem ativa" pulsante no canto do mockup, grain overlay sutil, h1 com tamanhos reduzidos no mobile (2.25rem em vez de 2.75rem).
- **ModulesSection:** badge "Disponível" (canon-blue) ou "Em breve" (ink-faint) em cada card, baseado no roadmap real (4 funcionais: Receita, Exames, Encaminhamento, Atestado).
- **Smooth scroll global** + `scroll-mt-20` em todas seções com âncora.
- **Focus ring** semântico via canon-blue (acessibilidade).

## Dashboard
- **ActionGrid** recebe prop `drafts: Partial<Record<DocumentAction, boolean>>`. Mostra ponto canon-blue no canto superior direito de cada card que tem rascunho ativo (e não está selecionado).
- **Dashboard calcula `drafts`** via useMemo a partir de `selected`, `atestado`, `exames`, `encaminhamento`.
- **FAB mobile:** mostra pill "N documentos em rascunho" acima do botão quando draftCount > 1.
- **MobilePreviewDrawer:** suporta tecla Esc para fechar.
