# Project Memory

## Core
Refatoração modular em curso: src/modules/prescription/ (services + hooks + components + PrintView). Fases 1-2 concluídas (services, hooks).
usePrescription é hook PURO: sem toasts, sem loadPathology, sem getMedText. Lança MedicationContraindicatedError. Toda orquestração (toasts, loadPathology) fica no Dashboard.
Receita de Controle Especial: impressão em PAISAGEM, 2 vias lado a lado (Farmácia + Paciente).
NUNCA usar cores hardcoded em componentes (text-white, bg-blue-500 etc). Sempre design tokens HSL via index.css/tailwind.config.ts.
Bloco C: navegação por PATOLOGIA, nunca por CID. CID é metadado secundário, mostrado depois da seleção. Subtipos só quando mudam conduta.

Novos tipos de documento entram via especificação de campos em services/regulatoryForms.ts — nunca duplicar formulário/preview/impressão.
IA é assistiva: rascunho automático sempre revisável e editável antes da emissão.

## Memories
- [Notificações Compulsórias](mem://features/notificacoes-compulsorias) — Fichas por agravo, prazos legais, campos institucionais, histórico com status e detecção automática pela patologia
- [Nova Prescrição em 3 etapas](mem://features/nova-prescricao-3-etapas) — Patologia → documento → construção, correlação automática por patologia e opção "em branco"
- [Roadmap plataforma modular](mem://features/plataforma-modular-roadmap) — Fases: documentos regulatórios (feito), central unificada, telemedicina, auditoria
- [PediatricDose estruturado (Fase 6)](mem://features/pediatric-dose-structured) — Plano de migrar pediatricDose: string para objeto tipado com 5 variantes, depois das Fases 3-5
- [GamificationBar (Fase 5)](mem://features/gamification-bar) — Score = contador simples de receitas geradas, persistido em localStorage. Esboço do componente com cores a corrigir (sem hardcoded)
- [Bloco C — Patologia primeiro](mem://features/bloco-c-patologia-primeiro) — Nova UX do Bloco C: tabs Emergências/Favoritos/Recentes/Todas, subtipos inline, CID discreto após seleção, hook usePathologyMemory
- [Calculadoras e hub clínico](mem://features/calculadoras-e-hub-clinico) — Calculadoras por perfil com sugestão automática no atendimento e hub de Protocolos & Escores com gerador de lacunas .md
- [Personalização de documentos](mem://features/personalizacao-documentos) — Módulo doc-branding: logos, dados institucionais, campos extras, layout/QR, galeria e templates compartilháveis
- [Segurança, perfis e LGPD](mem://features/seguranca-perfis-auditoria) — Papéis em user_roles, matriz de permissões, auditoria imutável, tabelas LGPD, docs/ARQUITETURA.md
