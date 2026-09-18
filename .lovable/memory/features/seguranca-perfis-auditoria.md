---
name: Perfis de acesso, auditoria imutável e LGPD
description: Papéis em user_roles, matriz de permissões granulares, trilha audit_log_critico imutável e tabelas LGPD
type: feature
---

- Papéis SEMPRE em `user_roles` + função `has_role` (nunca no perfil). Enum `app_role` inclui: admin, revisor, medico, residente, enfermagem, farmacia, administrativo, moderator, user.
- Matriz de permissões granulares em `src/modules/security/lib/permissions.ts`; hook `usePermissions()`; guarda de tela `<RequirePermission permission="...">` (registra acesso negado).
- Residente = médico sem `supervisao.validar` e sem `documentos.editar_emitido`; documentos nascem marcados para supervisão (`requiresSupervision`).
- Trilha `audit_log_critico` é imutável (gatilho bloqueia UPDATE/DELETE; sem políticas de alteração). Registrar via `recordCriticalEvent()` (serviços) ou `useAuditLogger()` (componentes). NUNCA gravar texto clínico ou dado de paciente em `detalhes`.
- LGPD: `lgpd_consentimentos` (aceite versionado, LEGAL_VERSION), `lgpd_solicitacoes` (prazo 15 dias), `lgpd_politicas_retencao` (prazo + base legal + anonimização).
- Documentação de arquitetura para novos módulos: `docs/ARQUITETURA.md`.
