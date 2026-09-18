---
name: Módulo de Notificações Compulsórias
description: Fichas por agravo (SINAN), prazos legais, campos institucionais, histórico com status de envio e detecção automática pela patologia
type: feature
---

# Notificações Compulsórias

Rota `/app/notificacoes` (`NotificacoesPage` → `src/modules/notifications/NotificationWorkbench.tsx`).

- `lib/notificationSpec.ts`: seções comuns (unidade, responsáveis, paciente, clínico, epidemiológico,
  encerramento, campos institucionais) + catálogo `AGRAVOS` com ficha SINAN, prazo legal (24h ou 7 dias),
  destino, palavras-chave e campos próprios. Novos agravos entram só nesse array.
- `detectAgravos(texto)` alimenta `NotificationSuggestionAlert`, usado no `PathologyCorrelationPanel`
  para sugerir a ficha e lembrar o prazo quando a patologia é notificável.
- Rascunho, campos institucionais e dados fixos do serviço ficam em localStorage
  (`useNotificationWorkbench`); histórico e status (pendente/enviado/confirmado) na tabela
  `notificacoes_compulsorias` com RLS por `user_id` (`useNotificationRecords`).
- Envio à vigilância continua manual (SINAN/e-SUS Notifica/plantão); o status é controle interno
  até haver integração direta.
