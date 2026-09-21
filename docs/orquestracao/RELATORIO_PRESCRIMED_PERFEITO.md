# Prescrimed perfeito — o que já existe e o que falta

Data: 2026-09-20 · Branch `fix/monetization-baseline` · Autor: Claude Code
Método: **A** = união deduplicada das capacidades pedidas nas 8 fontes anexas. **B** = o que o código e o banco entregam hoje (verificado no repositório). **Falta = A − B**. Interseção (itens que várias fontes repetem) aparece uma vez, com as fontes citadas.

## Veredito (BLUF)
- **O produto de hoje é um SaaS de prescrição individual muito forte.** Cobre prescrição, motor de segurança, 68 escores auditados, documentos persistidos, IV, protocolos, curadoria e cobrança.
- **Não é multi-tenant.** O banco tem **zero** `organization_id` e o isolamento é por `user_id`. Sem isso não existe "classe mundial institucional".
- **Não existe paciente nem atendimento como entidade.** O atendimento é um id gerado no navegador (`atd-<uuid>`) e `/app/pacientes` é um placeholder. Todo o resto (prontuário longitudinal, AIH/APAC estruturadas, telemedicina, indicadores) depende disso.
- **O conteúdo clínico em produção está vazio**: `base_patologias_ref` tinha 0 linhas na auditoria do ZCode. O melhor código do mundo não fecha o happy path sem conteúdo.
- **As próprias fontes dizem que o escopo total é grande demais** (Summary §61: "o primeiro grande marco é ter 10 síndromes tão bem feitas que provem que o modelo funciona"). Este plano segue isso: fundação primeiro, expansões atrás de feature flag.
- **Decisões Q1–Q11 recebidas em 2026-09-20 e aplicadas** (seção 5). Foco: **médico individual**. Isso reordena o plano: paciente/atendimento (Onda 2) e documentos/segurança clínica (Ondas 3 e 4) vêm antes de qualquer UI institucional. A fundação multi-tenant continua obrigatória, mas enxuta e por baixo.

## Placar da matriz (105 capacidades)
✅ feito: **29** (5 deles com pendência externa, marcados ⛔) · 🟡 parcial: **46** · ❌ falta: **29** · ⛔ só depende de fora do código: **1**

Leitura rápida: **28% pronto, 44% parcial, 28% por construir.** O que falta pesa mais que o número, porque as lacunas ❌ estão na base (tenant, paciente, atendimento, versionamento de documento, observabilidade).

## Como ler
- ✅ existe e foi conferido no código ou no banco.
- 🟡 existe em parte; a lacuna está descrita.
- ❌ não encontrei no código nem no banco.
- ⛔ depende de algo fora do código (acesso, conteúdo, decisão). Vem acompanhado de ✅/🟡 quando o código já existe.
- Fontes: **T1–T6** = Templates 1 a 6; **IDE** = [IDEIA]; **SUM** = Summary.

---

## 1. Matriz: capacidades × estado

### L1 · Acesso e identidade
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| A01 | Login, cadastro, recuperar e redefinir senha | T1 T6 | ✅ | `Login.tsx`, `Cadastro.tsx`, `RecuperarSenha.tsx`, `RedefinirSenha.tsx` |
| A02 | Logout limpa cache e dados locais; retorno à rota original | T4 T6 | ✅ | `AuthProvider.signOut`, `state.from` |
| A03 | Aviso de confirmação de e-mail no cadastro | T6 | ✅ ⛔ | Mensagem em `Cadastro.tsx`; ligar ou desligar a confirmação é decisão no painel do Auth |
| A04 | Onboarding em etapas (perfil, ambiente, documentos, IA, LGPD, assinatura) | T1 SUM | 🟡 | Só o questionário `/app/requisitos` e a entrada direta na primeira prescrição |
| A05 | Perfil profissional (CRM/UF/RQE) com nome e CRM protegidos contra alteração e auditados | T1 IDE | 🟡 | Tabela `profiles` existe; não vi trigger de proteção nem auditoria da alteração |
| A06 | Convite institucional e SSO/SAML | T1 T2 | ❌ | Não existe |

### L2 · Multi-tenant, papéis e administração
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| B01 | `organizations`, unidades, membros, convites | T2 IDE | ❌ | Nenhuma tabela; 0 ocorrências de `organization_id` |
| B02 | Helpers de RLS por organização (`is_org_member`, `has_org_role`, `can_*`) | T2 | ❌ | Só existe `has_role(uid, app_role)` |
| B03 | Papéis granulares (16 na T2) | T1 T2 SUM | 🟡 | `app_role` tem 9: admin, moderator, user, revisor, enfermagem, farmacia, medico, residente, administrativo |
| B04 | Matriz de permissões por ação × módulo | T1 IDE SUM | 🟡 | `permissions.ts` + `RequirePermission` no front; sem tabela nem RLS equivalente |
| B05 | Conteúdo em 3 camadas: global, institucional, pessoal | T2 IDE | 🟡 | Enum `template_visibility` (pessoal/equipe/institucional) já existe; sem organização para sustentar |
| B06 | Painel admin institucional (usuários, permissões, módulos, unidades) | T1 T2 | ❌ | As telas `/admin/*` atuais são de curadoria de conteúdo, não de gestão de usuários |
| B07 | Feature flags e módulos por plano | T1 T2 T6 | ❌ | Só `beta_settings` |
| B08 | Testes de isolamento entre tenants e entre papéis | T6 SUM | ❌ | Não existe suíte de RLS |

### L3 · Paciente e atendimento
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| C01 | Cadastro mestre de pacientes (buscar, criar, editar) | T1 T2 T6 | ❌ | `Patients.tsx` é placeholder |
| C02 | Atendimento (encounter) persistido no servidor | T1 T2 | ❌ | Id gerado no cliente; `prescricoes_historico.id_paciente` é texto (o nome) |
| C03 | Contexto clínico informado uma vez e reaproveitado em todos os documentos | T1 IDE SUM | 🟡 | Funciona na tela de prescrição, em memória; `pacientes_perfil_clinico` existe mas o Dashboard não grava |
| C04 | Alergias, comorbidades e medicamentos em uso estruturados por paciente | T2 | 🟡 | Tabelas `restricoes_paciente`, `medicacoes_uso_continuo`, `pacientes_perfil_clinico`; sem paciente mestre para ligar |
| C05 | Histórico longitudinal | T2 SUM | 🟡 | `PatientHistoryPanel` procura por nome digitado |
| C06 | Sinais vitais e medidas seriadas | T2 | ❌ | Só entradas de calculadora |
| C07 | Consentimentos do paciente (IA, QR, telemedicina, gravação) | T2 IDE | 🟡 | `lgpd_consentimentos` é do usuário, não do paciente |

### L4 · Conteúdo clínico
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| D01 | Síndromes e patologias no banco, com pipeline de importação e curadoria | T1 T2 SUM | ✅ ⛔ | Tabelas e `/admin/importar-lote`, `/admin/curadoria`, `/admin/promocao-base`; **produção com 0 linhas** |
| D02 | 10 síndromes completas (piloto: diarreia aguda) | SUM §16–17 | ❌ | Depende de D01 e de curadoria médica |
| D03 | Estrutura completa por patologia (anamnese, exame, diferenciais, conduta, alta/observação/internação/UTI) | T1 IDE SUM | 🟡 | `patologia_conteudo` (nova, migration pendente), `stg_fluxo_decisao_patologia` |
| D04 | Filtros por ambiente, população e gravidade | T1 IDE | 🟡 | `patologia_ambiente`; gravidade implícita e alertas de cor laranja/vermelha não vi |
| D05 | Matriz síndrome × patologia × documento | IDE SUM | 🟡 | `sindrome_patologia`, `patologia_documentos` (nova) |
| D06 | Protocolos versionados com etapas e checklist | T1 T3 | ✅ | `protocolos_ps`, `protocolo_versoes`, `protocolo_etapas` |
| D07 | Escores calculados e auditados no servidor | T1 SUM | ✅ | 68 `fn_calcular_*` em `/app/escores` + trauma |
| D08 | Hub de apoio à decisão (contexto, protocolos, scores, alertas, fontes) | T1 SUM | 🟡 | `AssistiveDecisionSupport` e `ProtocolosEscoresPage`, sem hub unificado |
| D09 | Checklist `.md` de lacunas clínicas | T1 IDE | ✅ | `library/lib/missingItems.ts` |
| D10 | Fonte única de verdade (estático × banco) | IDE SUM | 🟡 | ZCode: dados locais só enriquecem por nome; confirmar que não há segunda fonte |
| D11 | Modos "PS rápido" e "detalhado" | T1 IDE | 🟡 | Um Dashboard só (`BuilderShell`), sem separação de modos |

### L5 · Prescrição e segurança clínica
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| E01 | Base de medicamentos, doses e apresentações | T2 SUM | ✅ | `base_medicamentos_*` (86 na auditoria do Trae) |
| E02 | Alertas de alergia, duplicidade, interação e contraindicação | T1 IDE SUM | ✅ | Módulos `interactions` e `clinical-alerts` |
| E03 | Gestação, lactação e puerpério | T1 IDE SUM | 🟡 | Enums `pregnancy_alert_level`, `lactation_alert_level`; puerpério não vi tratado |
| E04 | Pediatria por peso com dose máxima estruturada | T1 IDE SUM | 🟡 | `base_medicamentos_dose`, `log_calculos_pediatricos`; validar de ponta a ponta na tela |
| E05 | Geriatria (Beers/STOPP, queda, sedação, anticolinérgicos) | T1 IDE SUM | ❌ | Nenhuma ocorrência no código |
| E06 | Ajuste renal e hepático | T1 IDE | ✅ | `renalHepaticCalc.ts`, Cockcroft/CKD-EPI nas calculadoras |
| E07 | Diluição IV | T1 IDE | 🟡 | Módulo `iv-dilution` funciona; `iv_medications` ainda tem **149 colunas** (a T2 e a IDE pedem normalização) |
| E08 | Sobrestamento com justificativa e log (usuário, hora, motivo, estado anterior e posterior) | T1 IDE SUM | ✅ | `SafetyOverrideDialog`, `audit_log_critico`, enums de ação |
| E09 | Reaproveitamento de documento com revalidação | T1 SUM | ✅ | `log_reaproveitamento_prescricao`, `item_reuso_status` |
| E10 | Bateria de testes clínicos (22 cenários da SUM §46) | T6 SUM IDE | 🟡 | `testes_clinicos` + página + Vitest; falta a suíte dourada cobrindo os 22 cenários |
| E11 | Motor regulatório separado (Portaria 344/98, antimicrobianos, receita especial, carimbo, estouro) | T1 IDE SUM | 🟡 | `base_medicamentos_regulatorio`, `tipo_receita_legal`, validação em `doc-branding` |
| E12 | Efeitos adversos por frequência e linguagem não alarmista | IDE SUM | 🟡 | Conteúdo parcial; sem classificação de frequência padronizada |

### L6 · Documentos
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| F01 | Emissão persistida e auditada (fail-closed) | T1 T6 | ✅ ⛔ | `persistEmission`; migrations e deploy pendentes |
| F02 | PDF em storage privado com URL assinada | T3 T6 | ✅ ⛔ | Bucket `documentos-pdf` (migration pendente) |
| F03 | Link público e QR com expiração, revogação e log de acesso | T1 T3 IDE | ✅ | `documento_links_publicos`, `link_acessos_log`, edge `public-document-link` |
| F04 | Tipos de documento | T1 IDE | 🟡 | 19 no enum. Faltam: parecer, SOAP, anamnese, exame físico, evolução, sumário de alta, termo de consentimento, justificativa p/ operadora, laudo |
| F05 | Editor final editável e prévia | T1 | ✅ | `PrintArea`, `DocumentPreview` |
| F06 | Versionamento e imutabilidade do documento assinado | T2 T6 | ❌ | Sem `document_versions`; a permissão `documentos.editar_emitido` existe só no front |
| F07 | Assinatura visual e carimbo | T1 IDE | ✅ | Módulo `digital-signature` |
| F08 | Níveis de assinatura (simples, avançada, ICP-Brasil) | T1 IDE SUM | ❌ | Correto não prometer ICP; falta o registro do tipo usado em cada documento |
| F09 | Template engine: oficial só leitura/clone, versão, diff, rollback | T1 IDE SUM | 🟡 | `documento_templates`, `modelos_prescricao`; sem versionamento de template |
| F10 | Branding (logo, cabeçalho, rodapé, campos institucionais) | T1 IDE | ✅ | `doc-branding`, `documentos_settings` |
| F11 | Histórico e biblioteca de documentos | T1 | ✅ | `HistoryPage`, `DocumentsPage` |
| F12 | Fluxo de falha de PDF | T6 | 🟡 | A T6 pede salvar rascunho; hoje o fail-closed bloqueia a saída (decisão a confirmar) |
| F13 | Código sem rota (`DocumentsToGenerateDialog`, `DocumentPreviewDialog`) | regra "sem código fantasma" | ❌ | Religar ou remover |

### L7 · Regulatório SUS
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| G01 | AIH com campos obrigatórios e coerência | T1 IDE SUM | 🟡 | `AihWorkbench` funciona; dados ficam em `documentos_gerados`, sem tabela `aih_requests` consultável |
| G02 | APAC com disparo por exame/procedimento | T1 IDE SUM | 🟡 | Tipo e validação existem; sem tela dedicada nem `apac_requests` |
| G03 | Notificação compulsória com detecção por CID e ficha | T1 IDE SUM | 🟡 | `notificacoes_compulsorias` + módulo |
| G04 | Regras por jurisdição (nacional, estadual, municipal) com versionamento | T1 T2 IDE | ❌ | Sem tabela de requisitos regulatórios versionados |
| G05 | Fluxo desfecho → internação → AIH → documentos derivados | T1 SUM | 🟡 | Peças existem, sem encadeamento no atendimento |

### L8 · IA e conhecimento
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| H01 | Front nunca chama LLM; gateway no servidor | T4 IDE | ✅ | 4 edge functions de IA |
| H02 | Provedor configurável (OpenRouter/Claude, Gemini de reserva) | T3 IDE | 🟡 | `ai-assist` aceita OpenRouter do usuário; demais funções usam só o gateway Lovable |
| H03 | Saída tipada com confiança 0–100, ausências e ambiguidades | T1 IDE SUM | 🟡 | Presente em `smart-input-extract` e `iv-extract`; não em todas |
| H04 | Redação de dados pessoais antes de enviar ao LLM | T3 T4 | 🟡 | Redação existe para auditoria (`sanitizeAudit`); envio ao LLM não sanitizado de ponta a ponta |
| H05 | Rate limit e orçamento de IA (alertas 50/80/100/120%) | T4 | 🟡 | Rate limit em 3 funções; sem orçamento nem contagem de custo |
| H06 | Telemetria de IA (Langfuse) e `ai_safety_events` | T2 T4 | 🟡 | `ia_interacoes_log` existe; sem telemetria de custo e segurança |
| H07 | Pesquisa Perplexity → sandbox → curadoria humana | T1 T3 IDE | 🟡 | `AtualizacoesPage`, `ia_atualizacoes_pendentes`; falta comparação de versões e publicação em etapas |
| H08 | RAG com pgvector, ACL por camada | T3 | ❌ | 0 uso de `vector` nas migrations |
| H09 | Chatbot operacional e clínico | T1 IDE | 🟡 | `ClinicalAIPanel`; sem base RAG |

### L9 · Governança de conteúdo
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| I01 | Ciclo de vida (rascunho → revisão → aprovado → publicado → obsoleto) | T1 IDE | ✅ | Enums de `review_status`, `curadoria_decisoes`, `etl_promocao_log` |
| I02 | Comparação de versões e rollback | T1 IDE | 🟡 | `protocolo_versoes`; sem diff visual nem rollback |
| I03 | Autor, revisor, aprovador, fonte e nível de evidência em todo conteúdo | IDE SUM | 🟡 | Parte das tabelas; não uniforme |

### L10 · Personalização
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| J01 | Modelos pessoais, favoritos e recentes | T1 IDE | ✅ | `modelos_prescricao`, `favoritos_medicamentos`, `patologia_personalizacao` |
| J02 | Patologias personalizadas | T1 | ✅ ⛔ | `patologias_usuario` (migration pendente) |
| J03 | Templates institucionais com controle por perfil | T1 IDE | ❌ | Depende de B01 |

### L11 · Auditoria, LGPD e conformidade
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| K01 | Log de auditoria imutável para ações críticas | T1 T4 IDE | ✅ | `audit_log_critico` com gatilho contra UPDATE/DELETE |
| K02 | Tela de auditoria com filtros e exportação | T1 | 🟡 | `SegurancaPage`; filtros por unidade, plantão e severidade não vi |
| K03 | Centro LGPD (consentimentos, retenção, exportação, exclusão, anonimização) | T1 T4 IDE | 🟡 | Tabelas `lgpd_*` existem; sem rotina de retenção nem exportação do titular |
| K04 | Redação de dados sensíveis em logs | T4 | ✅ | `sanitizeAudit` + `reportError` |
| K05 | Termos, privacidade e aviso de IA e de responsabilidade | T5 T6 | ✅ | `LegalPage` |

### L12 · Operação, observabilidade e ambientes
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| M01 | CI (tipos, testes, build, Playwright) | T6 | ❌ | Sem `.github/workflows` |
| M02 | Monitoramento de erros e performance (Sentry) com limpeza de PII | T4 | ❌ | Sem dependência |
| M03 | Logs estruturados JSON e painel operacional | T4 | 🟡 | `uso_eventos`, `eventos_beta_log`; logs de servidor em texto |
| M04 | Ambientes dev, staging e produção; dados reais fora de staging | T4 | ❌ | Só `vercel.json`; um único projeto Supabase |
| M05 | Backup, PITR e teste de restauração; RTO 4 h, RPO 1 h | T4 | ⛔ | Depende do plano Supabase e do acesso |
| M06 | Modo degradado (IA, PDF, storage, integrações) | T3 T4 | 🟡 | Avisos e alternativa manual em parte; sem `DegradedModeBanner` global |
| M07 | Cabeçalhos de segurança, CSP, WAF e rate limit de borda | T4 | ❌ | Sem configuração |
| M08 | Suíte de testes E2E e de RLS | T6 SUM | 🟡 | 234 testes unitários e 1 spec Playwright; sem RLS |
| M09 | Dashboard modular | T6 IDE SUM | ❌ | `Dashboard.tsx` com 1.613 linhas (cresceu nesta rodada) |
| M10 | Cache, filas e jobs (TanStack Query, Redis, Inngest) | T3 | 🟡 | TanStack Query em uso; sem fila (a T2 aceita `async_jobs` no Postgres no MVP) |

### L13 · Monetização e go-to-market
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| N01 | Cobrança por assinatura (Stripe) | T5 T6 | ✅ | `create-checkout`, `payments-webhook`, portal |
| N02 | Planos em 5 níveis (Trial, Starter, Pro, Clinic, Enterprise) e limites de uso | T5 | 🟡 | Só `pro_monthly` e `pro_yearly`; sem `usage_counters` |
| N03 | Cobrança por organização e por assento | T5 T2 | ❌ | Depende de B01 |
| N04 | Landing, planos e FAQ | T5 T6 | ✅ | `components/landing`, `LegalPage` |
| N05 | Ajuda, suporte e macros | T1 T6 | ❌ | Sem página de ajuda |
| N06 | Feedback de beta | T6 | ✅ | `lancamento_feedback` e demais tabelas |

### L14 · Expansões (atrás de feature flag)
| ID | Capacidade | Fontes | Estado | Evidência / lacuna |
|---|---|---|---|---|
| P01 | Educação do paciente (materiais, QR) | T1 IDE SUM | 🟡 | Link público de orientações; sem biblioteca de materiais |
| P02 | Indicadores de qualidade e segurança | T1 IDE SUM | 🟡 | `IndicatorsPage`, `indicadores_qualidade_ps`; falta dashboard institucional |
| P03 | Checklists assistenciais (sepse, queda, cirúrgico, transfusão) | T1 IDE SUM | ❌ | Só checklists de protocolo e de beta |
| P04 | Telemedicina (agenda, sala, consentimento) | T1 IDE SUM | ❌ | Só o valor `telemedicina` em enums |
| P05 | Reabilitação multiprofissional | T1 IDE SUM | ❌ | Não existe |
| P06 | Interoperabilidade HL7 FHIR, webhooks, integrações | T1 T2 IDE | ❌ | Não existe |
| P07 | Assinatura ICP-Brasil | T1 IDE | ❌ | Não existe; não prometer |

---

## 2. O que não bate entre as fontes (e a decisão que recomendo)
| # | Conflito | Recomendação |
|---|---|---|
| 1 | Stack: T1 cita React 18 e Router 6; o app real usa Vite 8, Router 7 e React atual | Vale o código. Não recuar versões |
| 2 | Rotas: T1 propõe `/app/atendimentos/:id/...`; o app usa `/app/prescricao/nova` | Migrar só quando o atendimento existir no servidor (Onda 2), com redirects |
| 3 | Papéis: T2 lista 16; o banco tem 9 | **Decidido (Q7): adotar os 16.** Só a definição (enum + matriz de permissões); telas por papel entram quando houver instituição |
| 4 | Nomes: Summary cita ProntoRx e PlantãoRx | Manter **Prescrimed** |
| 5 | Planos em US$ (T5) × cobrança atual só Pro | **Decidido (Q3): reais, com os planos que já estão no app** (`plans.ts`: mensal R$ 15,99 no 1º período e R$ 25,99 depois; anual R$ 249,50). Trial/Starter/Clinic/Enterprise ficam fora até haver instituição |
| 6 | Hospedagem: T4 Vercel + Cloudflare; T3 Inngest, Upstash, n8n, Langfuse | Ver "VAI DAR B.O." |
| 7 | Falha de PDF: T6 pede rascunho; o código bloqueia a saída | **Decidido (Q5): sim.** Fail-closed na emissão e **rascunho** do conteúdo (sem PDF) quando só a geração falhar |
| 8 | Jurisdição da receita "A4 paisagem, máximo 194 mm" | **Decidido (Q2): 194 mm é a área útil.** Já é o que o código faz: `PrintArea.tsx` limita a `194mm` e avisa quando o conteúdo estoura. Falta só nomear a constante e cobrir com teste (4.6) |
| 9 | Retenção de 20 anos (T3) × princípio de minimização (LGPD) | **Decidido (Q8): 5 anos.** Ver alerta jurídico na seção 5: a regra de prontuário é 20 anos, então a rotina **arquiva, não apaga** |
| 10 | O arquivo da pasta "[BUILD] Lovable + Firebase" contradiz a stack Supabase | Não fez parte da união; ignorar Firebase |
| 11 | Ambiguidades da SUM §60: EDF (=PDF), RSN (=IRSN), SIDs (=CIDs), PECS, CADOR, Kement, SV | Corrigir os três primeiros. **SV = sinais vitais** (Q10). PECS, CADOR e Kement seguem sem definição verificável: não entram em código nem em tela |

---

## 3. VAI DAR B.O. (corte deliberado)
1. **Construir os 179 telas, 16 papéis, Inngest, Upstash, n8n, Langfuse, Cloudflare WAF e pgvector antes de ter médicos usando.** Isso é over-engineering para o MVP. O simples que funciona: Onda 0 a 3 no stack atual (Supabase + Vercel + Stripe + Sentry), com fila em `async_jobs` (Postgres) e cron do Supabase. Só depois medir dor real.
2. **Deixar o multi-tenant para depois dos primeiros clientes institucionais.** Aqui é o contrário: retrofit de `organization_id` com dados clínicos em produção é o item mais caro de desfazer. Fazer a **fundação** (Onda 1) antes do primeiro cliente institucional, mesmo sem UI completa.
3. **RAG sem base clínica curada** gera alucinação com aparência de fonte. Só entra depois que D01/D02 estiverem povoados e revisados.
4. **Prometer ICP-Brasil ou "assinatura digital"** sem integração certificada. Manter o aviso atual de assinatura visual.
5. **Mais features no `Dashboard.tsx`.** Ele já tem 1.613 linhas e cresceu comigo. Cada nova tela empilhada piora o risco clínico de regressão. Refatorar antes da Onda 2.
6. **Dados reais em staging.** Proibido pela T4; criar seeds sintéticos.

---

## 4. Plano por ondas (o que ainda falta fazer)
Esforço: **P** ≤ 3 dias · **M** 1–2 semanas · **G** 2–6 semanas · **GG** > 6 semanas. São estimativas de ordem de grandeza para uma pessoa; dependem de revisão clínica que não é código.

### Onda 0 — Fechar o que já foi construído (destrava tudo) · P a M
| # | Passo | Critério de aceite | Depende de |
|---|---|---|---|
| 0.1 | **Restaurar acesso ao projeto Supabase** `zwwalaioamxcvxbihxlr` (login da CLI ou MCP) | Consigo listar o projeto, as migrations e as functions | Você |
| 0.2 | Aplicar as 4 migrations em branch, testar, depois `db push` | Enum, buckets, 4 tabelas `patologia_*`, view mascarada e guard de admin no ar; RPCs admin negam não-admin | 0.1 |
| 0.3 | Deploy das 7 edge functions alteradas | Nenhuma resposta devolve texto de erro do provedor; `/d/:token` mostra o PDF | 0.1 |
| 0.4 | **Auditar RLS no banco real**: `SELECT relname FROM pg_class WHERE relkind='r' AND NOT relrowsecurity` (a minha checagem estática não vê RLS ligada por laço) | Lista vazia ou justificada | 0.1 |
| 0.5 | ✅ **Feito em 2026-09-20 (informado pelo Dr. Felipe):** senha do banco e chave secreta rotacionadas. `.env` está no `.gitignore` e só o `.env.example` é rastreado. Falta atualizar as chaves novas onde forem usadas (CLI, CI, secrets das edge functions) | Chaves antigas revogadas | — |
| 0.6 | ✅ **Feito em 2026-09-21 (parcial).** `.github/workflows/ci.yml`: `tsc --noEmit`, `eslint`, `vitest run`, `build` em todo push/PR na `main`, Node 24 + `npm ci`. **Falta:** smoke Playwright — `e2e/public-launch.spec.ts` existe mas não roda em CI porque exige app no ar/login; entra quando 0.1–0.3 destravarem sandbox | PR só passa verde | — |
| 0.7 | ✅ **Feito em 2026-09-20.** `DocumentsToGenerateDialog` e `DocumentPreviewDialog` (fantasmas) removidos — não religados como estavam, porque duplicavam classificador de receita e imprimiam sem `persistEmission`. A capacidade voltou de outro jeito, sobre a `ReviewScreen` que já existia: seletor de **perfil de assinatura** (`assinatura_perfis`, com fallback pro Settings local) e checkbox de **revisão final concluída** (`documentos_settings.exigir_revisao_final_concluida`), os dois checados de novo dentro dos handlers (`blockIfReviewPending`), não só no `disabled` do botão. **Achado corrigido de quebra:** o preview lateral do desktop tinha um botão "Imprimir/PDF" que chamava `handlePrint` puro — sem validação, sem `persistEmission`, sem o gate novo; passou a chamar `handleEmit`. Anexo IV já valia (feature própria do `PrintArea`, não do dialog). Funções puras `mergeSignatureConfig`/`mergeClinicInfo` em `applySignatureProfile.ts`, com 6 testes | Perfil de assinatura e gate de revisão valem no `PrintArea`; nenhuma saída sem `persistEmission`; um só classificador de receita (`buildRegulatoryGroups`) | — |
| 0.8 | **Carga do lote mínimo de conteúdo** (piloto diarreia aguda e mais 9 síndromes da SUM §16.4) via importar → curadoria → promover | Produção com síndromes, patologias, ambientes e vínculos > 0; revisão registrada pelos curadores (Q9) | Curadores (donos do MedFlow) |
| 0.9 | Rodar T1 a T4 do relatório anterior em sandbox (sessão, checkout, emissão, escores) | Todos passam | 0.2 0.3 |
| 0.10 | ✅ **Feito em 2026-09-20 (código; não testado contra banco real).** AIH e notificação compulsória agora registram em `documentos_gerados` (+ log + auditoria) via `persistFormDocument` antes de imprimir **ou baixar**; sem registro, o documento não sai e aparece aviso. `DocumentCustomizationDialog` só imprime dados de exemplo, então não é emissão. Teste: `persistFormDocument.test.ts` (4 casos) | Todo botão que imprime ou baixa documento clínico é fail-closed. **Resta:** guarda automática que falhe se surgir `printHtml` fora do caminho registrado | — |

### Onda 1 — Fundação multi-tenant (enxuta, por baixo) · M a G
Com o foco em médico individual (Q1), a Onda 1 **não vira produto institucional agora**. Entram só 1.1 a 1.6 e 1.8. O convite de membros e as telas de papéis (1.7) ficam para quando houver o primeiro cliente institucional. A razão para não adiar tudo: as tabelas novas da Onda 2 já nascem com `organization_id`, evitando migrar duas vezes com dado clínico em produção.

| # | Passo | Critério de aceite |
|---|---|---|
| 1.1 | Tabelas `organizations`, `organization_units`, `organization_members`, `invitations` | Migração + tipos gerados |
| 1.2 | Helpers de RLS: `is_org_member`, `has_org_role`, `can_write_clinical`, `can_audit`, `can_sign_documents` (SECURITY DEFINER, `search_path` fixo) | Testes SQL para cada helper |
| 1.3 | `organization_id` nas ~15 tabelas de propriedade do usuário (prescrições, documentos, logs, templates, modelos, perfil clínico, patologias do usuário, assinatura, auditoria, LGPD, uso) | Coluna obrigatória e índices |
| 1.4 | **Backfill**: cada usuário atual recebe uma organização `individual` e vira `owner` | Nenhum dado órfão; contagens conferem antes e depois |
| 1.5 | Políticas duplas (dono OU membro com papel) substituindo `user_id = auth.uid()` | Suíte de isolamento: A nunca lê B; membro sem papel não emite |
| 1.6 | **Os 16 papéis da T2 (Q7)**: estender o enum, mapear os 9 atuais, criar `roles_permissions`; RLS alinhada ao `permissions.ts` | Front e servidor concordam por teste; o médico individual segue como `owner` sem ver nada novo |
| 1.7 | *(adiado até o 1º cliente institucional)* UI admin: convidar membro, papéis, unidades, módulos ativos | Fluxo de convite ponta a ponta |
| 1.8 | Feature flags por organização e por plano (`feature_flags`) | Módulo desligado some do menu e da API |
| 1.9 | **Gate de assinatura no servidor** para os recursos Pro (AIH, notificações, atualizações por IA, chatbot): função `has_active_subscription()` usada nas RLS e nas edge functions | Chamada direta à API sem assinatura ativa é negada; teste com conta sem assinatura |

### Onda 2 — Paciente e atendimento reais (prontuário longitudinal mínimo) · G
| # | Passo | Critério de aceite |
|---|---|---|
| 2.0 | **Refatorar `Dashboard.tsx`** em módulos por etapa (contexto, seleção, revisão, emissão) e mover regras para `modules/*` | Arquivo < 400 linhas; testes existentes verdes |
| 2.1 | Tabelas `patients`, `encounters`, `patient_allergies`, `patient_measurements`, `patient_medications` | RLS por organização; sem CPF/CNS em logs |
| 2.2 | `/app/pacientes` funcional: buscar, criar, editar, histórico | **O placeholder já foi removido (Q11)**: rota, menu, busca, Home e a aba "Mais" do celular. Recriar o item de menu junto com a tela real |
| 2.3 | Atendimento no servidor; `prescricoes_historico`, `documentos_gerados`, `audit_escores_clinicos` e alertas apontam para `encounter_id` | Fim do `atd-<uuid>` do cliente |
| 2.4 | Persistir e reutilizar `pacientes_perfil_clinico` no atendimento | Perfil não se perde ao recarregar |
| 2.5 | Modos "PS rápido" e "detalhado" sobre o mesmo atendimento | Prescrição em ≤ 3 min (meta da T6) |
| 2.6 | Consentimentos do paciente (IA, QR, compartilhamento) | Registro por atendimento |
| 2.7 | Rotas novas `/app/atendimentos/:id/...` com redirects das antigas | Sem link quebrado |

### Onda 3 — Documentos completos e rastreáveis · M a G
| # | Passo | Critério de aceite |
|---|---|---|
| 3.1 | Novos tipos: parecer, SOAP, anamnese, exame físico, evolução, sumário de alta, termo de consentimento, justificativa p/ operadora, laudo | Enum, template, emissão persistida e auditada |
| 3.2 | `document_versions` e **imutabilidade após emissão/assinatura** (gatilho) | Edição de emitido cria nova versão, nunca sobrescreve |
| 3.3 | Registrar o **tipo de assinatura** usado (visual, simples, avançada) e o aviso exibido | Campo obrigatório no documento |
| 3.4 | Template engine: oficial somente leitura, clonar, versionar, diff e rollback | Teste de rollback |
| 3.5 | Salvar **rascunho do conteúdo** quando a geração do PDF falhar (sem liberar a emissão) | Nenhum dado digitado se perde |
| 3.6 | Hash e código de validação por documento, com página pública de verificação | Verificação sem expor dados sensíveis |
| 3.7 | Retenção **de 5 anos (Q8)** como parâmetro por tipo (rascunho 30 dias). Após o prazo a rotina **arquiva** (sai do uso e da busca) e **nunca apaga sozinha** | Job registra o que arquivou; exclusão definitiva só por ato manual auditado |

### Onda 4 — Segurança clínica e regulatória · G
| # | Passo | Critério de aceite |
|---|---|---|
| 4.1 | Pediatria de ponta a ponta com dose estruturada (mg/kg, máxima por dose e por dia, volume) e bloqueio sem peso | Testes dos cenários "peso ausente" e "acima do máximo" |
| 4.2 | **Normalizar `iv_medications`** (149 colunas) em medicamento, apresentação, diluição, compatibilidade, infusão e alertas | Migração sem perda; telas atuais preservadas |
| 4.3 | Geriatria: critérios de Beers/STOPP, queda, sedação e anticolinérgicos, com revisão farmacêutica | Alerta com fonte e versão |
| 4.4 | Puerpério e lactação tratados como estados próprios | Cenários de teste |
| 4.5 | **Suíte dourada com os 22 cenários da SUM §46** (Vitest + dados sintéticos) | 100% dos críticos exigem justificativa; suíte no CI |
| 4.6 | Limite da receita especial = **área útil de 194 mm (Q2)**, que o `PrintArea` já aplica. Extrair para constante única e cobrir com teste | Constante nomeada; teste falha se o limite mudar |
| 4.7 | APAC com tela dedicada e tabela `apac_requests`; AIH com `aih_requests` estruturada | Consulta por paciente, status e pendência |
| 4.8 | Regras de notificação compulsória com **versionamento e jurisdição** e log de conferência/envio | Lista de agravos e campos confirmados por fonte oficial vigente |
| 4.9 | Encadear desfecho → internação → AIH → documentos derivados no atendimento | Fluxo completo sem redigitar |

### Onda 5 — IA e conhecimento com governança · M a G · prioridade P2 (Q4)
| # | Passo | Critério de aceite |
|---|---|---|
| 5.1 | **Gateway de IA único**, **agnóstico de provedor (Q4: qualquer um)**: o provedor é configuração, não código | Trocar o provedor não altera nenhuma das 4 functions |
| 5.2 | Redação de PII **antes** do envio ao LLM. Política adotada por padrão, já que "qualquer provedor" não responde a isso: **nome, CPF, CNS, telefone e endereço nunca saem** | Teste com payload contendo nome/CPF: nada sai |
| 5.3 | Saída tipada com confiança, ausências e ambiguidades em todas as functions | Schema Zod validado no servidor |
| 5.4 | Orçamento e contagem de custo por organização; bloqueio de IA não crítica no limite | Alertas 50/80/100% |
| 5.5 | Telemetria de IA (Langfuse **ou** tabela própria) e `ai_safety_events` | Painel de custo, latência e bloqueios |
| 5.6 | Curadoria: diff visual entre versões, rollback e publicação em etapas. **Toda atualização de conteúdo exige aprovação dos curadores designados (donos do MedFlow, Q9)** | Nenhuma atualização vai ao ar sem aprovação registrada de um curador |
| 5.7 | **RAG só depois** de D01/D02 povoados: pgvector, ACL por camada, citação obrigatória | RAG nunca é fonte de dose crítica |

### Onda 6 — Conformidade e administração · M
| # | Passo | Critério de aceite |
|---|---|---|
| 6.1 | Centro LGPD: consentimentos, exportação e exclusão do titular, retenção, anonimização | Solicitação atendida ponta a ponta |
| 6.2 | Auditoria com filtros (usuário, paciente, unidade, plantão, severidade) e exportação | Exportação também auditada |
| 6.3 | Perfil profissional protegido: nome e CRM só mudam com auditoria | Trigger + teste |
| 6.4 | Onboarding em etapas (perfil, ambiente, documentos, IA, LGPD, assinatura) | Concluir em < 5 min |
| 6.5 | Página de ajuda, FAQ, suporte e macros | Link no app |

### Onda 7 — Operação de classe mundial · M
| # | Passo | Critério de aceite |
|---|---|---|
| 7.1 | Sentry (front e edge) com limpeza de PII | Nenhum dado de paciente em evento |
| 7.2 | Logs estruturados JSON no servidor com `requestId` | Correlação de uma emissão de ponta a ponta |
| 7.3 | Staging com branch de banco e **dados sintéticos**; produção separada | Nenhum dado real em staging |
| 7.4 | Backups: PITR conferido, exportação criptografada e **teste de restauração** | RTO 4 h e RPO 1 h demonstrados |
| 7.5 | CSP, cabeçalhos de segurança e rate limit em todas as functions | Auditoria de cabeçalhos sem falha alta |
| 7.6 | Suíte de RLS no CI (cross-tenant e por papel) | Falha bloqueia o merge |
| 7.7 | E2E dos fluxos críticos: login, prescrição, emissão, link público, checkout | Rodam no CI |
| 7.8 | Página de status e alertas de erro e de custo de IA | Notificação ao responsável |

### Onda 8 — Monetização institucional · M
| # | Passo | Critério de aceite |
|---|---|---|
| 8.1 | ~~Definir moeda e níveis~~ **Resolvido (Q3)**: reais, com os planos atuais. Novos níveis só com o 1º cliente institucional | — |
| 8.2 | `subscription_plans`, `usage_counters` e limites de documentos por plano | Limite aplicado no servidor |
| 8.3 | Cobrança por organização e por assento | Convidar membro ajusta a fatura |
| 8.4 | Landing e páginas de planos atualizadas; trial de 14 dias | Conversão medida |

### Onda 9 — Expansões atrás de feature flag · GG
Só depois de piloto real com médicos. Ordem sugerida: **educação do paciente → indicadores institucionais → checklists assistenciais → telemedicina → reabilitação → FHIR e webhooks → ICP-Brasil**. Cada módulo entra desligado por padrão.

---

## 5. Decisões registradas (2026-09-20)
| ID | Decisão do Dr. Felipe | Efeito no plano |
|---|---|---|
| Q1 | **Médico individual** | Ondas 2, 3 e 4 antes de UI institucional. Onda 1 enxuta e por baixo (1.7 adiado) |
| Q2 | **194 mm = área útil** | Já implementado em `PrintArea.tsx`; falta constante nomeada e teste (4.6) |
| Q3 | **Reais, planos que já existem no app** | 8.1 resolvido; sem novos níveis agora |
| Q4 | **Qualquer provedor, prioridade P2** | Gateway agnóstico (5.1). PII: adotei o padrão "identificadores nunca saem" (5.2), porque isso não foi decidido |
| Q5 | **Sim** | Fail-closed mantido; rascunho de conteúdo em 3.5 |
| Q6 | **Religar** | Passo 0.7, com o desenho abaixo |
| Q7 | **16 papéis** | 1.6: só definição e matriz de permissões, sem tela |
| Q8 | **5 anos** | 3.7 arquiva em vez de apagar. **Ver alerta jurídico abaixo** |
| Q9 | **Donos do MedFlow, a cada atualização** | 0.8 e 5.6. Falta mapear quais contas são os curadores |
| Q10 | **SV = sinais vitais.** PECS, CADOR e Kement: sem definição verificável | Não entram em código nem em tela |
| Q11 | **Cortar** | Feito para `/app/pacientes` e para o selo "Assinar — Em breve". Rotas Pro: ver abaixo |

### Alerta jurídico da Q8 (retenção de 5 anos)
Se o documento emitido integra o prontuário, a regra que conheço é **20 anos** (Lei 13.787/2018, art. 6º; Resolução CFM 1.821/2007). Eliminar aos 5 anos pode ser infração ética e dificulta a defesa em processo. Por isso o plano arquiva aos 5 anos (some da busca e do uso) e não apaga sozinho. O prazo fica em parâmetro, então trocar para 20 é uma linha. **Vale confirmar com o jurídico do hospital antes de ligar qualquer purga.** Não sou fonte jurídica.

### Q6 — por que não religar o diálogo "como está"
Conferi o código antes de mexer, e religar literalmente teria três efeitos ruins:
1. **Dois classificadores legais.** O Dashboard classifica receita em `buildRegulatoryGroups`; o diálogo usa `classifyItem`. Se divergirem, o mesmo medicamento vira receita comum num caminho e especial no outro. É risco clínico.
2. **Caminho de saída sem registro.** O `DocumentPreviewDialog` imprime com `printHtml` e salva com `saveGeneratedDocument`, sem `persistEmission` e sem PDF no Storage. Reabriria a brecha que o fail-closed fechou.
3. **Ele é o único consumidor de `documentos_settings` e `assinatura_perfis`.** Ou seja, a tela "Admin → Documentos" hoje configura coisas que a emissão real ignora (ela usa o `signature-config` do `localStorage`). É isso que vale religar.

**Feito (passo 0.7, 2026-09-20):** `DocumentsToGenerateDialog.tsx` e `DocumentPreviewDialog.tsx` foram removidos — não religados como estavam. O que agregavam (perfil de assinatura, gate `exigir_revisao_final_concluida`) entrou na `ReviewScreen` que já existia, sobre o `PrintArea` e os grupos regulatórios reais (`buildRegulatoryGroups`), com checagem repetida dentro dos handlers (não só no botão desabilitado). `renderDocument`/`saveGeneratedDocument` (usados por `prescription-flow.test.ts`) não foram tocados — continuam servindo o teste de integração, sem consumidor de UI. Anexo IV não precisou de nada: já era feature própria do `PrintArea` (`ivAnnexScope`), não do diálogo. `groupItemsByDocument.ts` e `classifyDocumentDestination.ts` — o segundo classificador que fazia risco clínico no ponto 1 — foram removidos/esvaziados junto.

### Q11 — rotas Pro (`/app/internacoes`, `/app/notificacoes`, `/app/atualizacoes`)
**Não removi.** Conferi que elas não são casca vazia: envolvem a bancada de AIH, a bancada de notificações e as atualizações por IA, cerca de 20 arquivos. Apagar isso por um "cortar" ambíguo removeria produto pago. O risco real era o gate só no front; o conserto correto é o gate no servidor (RLS ou RPC por assinatura ativa), passo novo **1.9** abaixo. Se a sua intenção era realmente tirar os três do beta, é só dizer e eu removo rotas, menu e busca (o git guarda tudo).

---

## 6. Ordem de execução recomendada
1. **Agora:** Onda 0 (destrava o que já está pronto e mede a realidade). Inclui 0.7 (religar a revisão pré-emissão) e 0.10 (AIH e notificação sem registro).
2. **Em paralelo à curadoria clínica (Q9):** Onda 1 enxuta (1.1 a 1.6, 1.8, 1.9) e 2.0 (refatorar o Dashboard).
3. **Depois (foco individual, Q1):** Onda 2, depois 3 e 4 alternadas por risco clínico.
4. **Só com piloto rodando:** Ondas 5 (P2, Q4), 6, 7 e 8.
5. **Por último:** Onda 9 e o 1.7 (UI institucional).

**Primeiro passo físico concreto hoje:** rodar `supabase login` com um token que enxergue o projeto do app (passo 0.1). Sem ele, nada do que está pronto chega ao banco.

---

## 7. Cobertura desta análise (honestidade)
- **Lidos por inteiro:** [IDEIA] e Template 1 (linhas 1–2000 e o índice do restante).
- **Lidos por trechos:** Templates 2 a 6 (índices, decisões, modelo de dados por nome de tabela, checklist de produção e roadmap da T6). O SQL de RLS da T2 (~1.100 linhas) e os prompts prontos para Lovable/n8n não foram lidos linha a linha.
- **Summary:** lido o índice, o MVP robusto, a síndrome-piloto, os testes obrigatórios e as correções. O restante repete o [IDEIA] em maior detalhe.
- **Fora da união (não anexados):** Template 0, Engenheiro DevOps, MF4 (lançamento), PT3 (deploy), [BUILD] Lovable + Firebase, ATLAS, MTP-DOC-PLD e o `transcript.pdf`.
- **Estado do produto:** conferido por leitura do repositório e do `types.ts`. Não consultei o banco de produção (sem acesso), então "conteúdo vazio" vem do relatório do ZCode e a cobertura de RLS precisa da consulta do passo 0.4.
