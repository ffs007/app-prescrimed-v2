# PrescriMed — arquitetura modular

Documento de referência para expandir o app sem quebrar usabilidade nem conformidade.

## 1. Camadas

```text
src/
  pages/            rotas finas: <PageMeta/> + cabeçalho + composição de módulos
  modules/<dominio>/
    lib/            regras puras e dados declarativos (testáveis, sem React)
    hooks/          acesso a dados (React Query) e estado de fluxo
    components/     UI do domínio
  components/       shell, navegação, SEO, guardas de rota, primitivas shadcn
  integrations/     cliente do backend (gerado, não editar)
```

Regra de ouro: **nada de regra clínica em componente**. Toda decisão (dose, gravidade,
correlação, validação de ficha) fica em `lib/` como função pura, o que permite testar
sem renderizar e reutilizar em outro módulo.

## 2. Módulos atuais

| Domínio | Módulo | Responsabilidade |
| --- | --- | --- |
| Assistência | `prescription`, `syndromes`, `protocols`, `scores`, `trauma-scores`, `calculators` | Fluxo por patologia/síndrome, correlação clínica, escores e cálculos de dose |
| Medicamentos | `medications-base`, `interactions`, `iv-dilution`, `clinical-alerts` | Base de fármacos, interações, diluição, alertas |
| Documental | `documents`, `doc-branding`, `templates`, `digital-signature`, `patient-link` | Emissão, layout institucional, assinatura, link público |
| Regulatório | `admissions` (AIH), `notifications` | Formulários SUS e vigilância |
| Conhecimento | `library`, `ai`, `search` | Hub de protocolos/escores, IA assistiva, busca unificada |
| Gestão | `indicators`, `clinical-tests`, `import-lotes`, `beta`, `requirements`, `roadmap` | Qualidade, curadoria, importação, evolução do produto |
| Segurança | `security` | Perfis, permissões, auditoria, LGPD |

## 3. Segurança e acesso

- Papéis vivem em `user_roles` (nunca no perfil do usuário) e são checados no banco
  pela função `has_role`, usada nas políticas de acesso.
- `modules/security/lib/permissions.ts` traduz papéis em permissões granulares por
  módulo; `usePermissions()` responde `can("documentos.emitir")`.
- `<RequirePermission permission="…">` protege áreas de tela e registra tentativa
  negada na trilha de auditoria.
- A tela só esconde o que o banco já bloqueia — nunca use a permissão do front como
  única barreira ao criar um módulo novo.

## 4. Auditoria

Tabela `audit_log_critico`: data/hora, usuário, e-mail, ação, módulo, entidade,
identificador do registro, severidade, IP, agente e detalhes. Um gatilho impede
alteração e remoção; não existe política de UPDATE/DELETE.

Para registrar de dentro de um serviço, use `recordCriticalEvent()`; dentro de um
componente, `useAuditLogger()`. Nunca inclua texto clínico ou identificação de
paciente no campo de detalhes.

Eventos cobertos hoje: emissão e cancelamento de documento, registro de AIH,
notificação compulsória, aceite de termos, solicitação do titular e acesso negado.

## 5. Conformidade (LGPD)

- `lgpd_consentimentos` — aceite versionado de termos e política.
- `lgpd_solicitacoes` — direitos do titular com prazo legal de 15 dias.
- `lgpd_politicas_retencao` — prazo, base legal e anonimização por módulo.
- Tráfego em TLS; armazenamento cifrado em repouso pela infraestrutura do banco;
  chaves de IA guardadas por conta e nunca devolvidas à interface.

## 6. Como adicionar um módulo

1. Criar `src/modules/<nome>/lib` com as regras puras e os testes.
2. Criar hooks de dados com React Query; erros pelo helper `describeSupabaseError`.
3. Criar a página fina em `src/pages`, com `<PageMeta/>` e um `h1` único.
4. Registrar a rota em `src/App.tsx` e o item em `AppSidebar.tsx`.
5. Declarar as permissões novas em `permissions.ts` e proteger a tela com
   `<RequirePermission>`.
6. Registrar as ações críticas com `recordCriticalEvent()`.
7. Adicionar entradas ao índice da busca unificada (`modules/search/lib/searchIndex.ts`).
8. Se houver tabela nova: GRANT + RLS + políticas por `auth.uid()` na mesma migração.

## 7. Coerência visual

- Cores, sombras e tipografia sempre por tokens do design system — nunca classes
  fixas como `text-white` ou `bg-blue-500`.
- Padrão de página: container `max-w-5xl`/`max-w-6xl`, cabeçalho com título e
  subtítulo curto, conteúdo em abas quando houver mais de um assunto.
- Hierarquia progressiva: primeiro o essencial, detalhes em acordeão ou aba.
- Ações destrutivas sempre com confirmação; estados de carregamento com skeleton.
