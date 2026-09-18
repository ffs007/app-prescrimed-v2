# PrescriMed — Reorganização clínica por patologia

Missão longa, executada em passos. Este documento descreve o **Passo 1** em detalhe e lista os passos seguintes (acionados por "próximo") sem reduzir escopo.

## Decisões já fixadas

- Fluxo: **patologia primeiro**, documento depois.
- Ambientes: **Ambulatorial**, **Urgências/PS** (verde/amarelo), **Emergências/SV** (laranja/vermelho) — substituem "Hospitalar/Urgência".
- Conteúdo clínico por patologia vive em **tabelas novas no banco** (não em arquivos locais).
- IA: **gateway de IA já incluso na plataforma** (sem chave) para chatbot e preenchimento assistido; Perplexity fica reservado só para curadoria de evidências, em passo posterior.
- Classificação das patologias nos 3 ambientes: **curadoria feita por mim**, ajustável depois via chat e pela aba de personalização.

---

## Passo 1 — Fluxo patologia → documento + 3 ambientes

### 1.1 Banco (migração)

Novas tabelas, todas com RLS (leitura para usuário logado; escrita restrita ao dono ou admin):

| Tabela | Para quê |
| --- | --- |
| `patologia_ambiente` | Classifica cada patologia em ambulatorial / urgencia / emergencia + gravidade + especialidade. Curadoria inicial minha, editável. |
| `patologia_conteudo` | Conteúdo padrão por patologia e por seção: anamnese, exame físico, diferenciais, exames, conduta, critérios de alta/internação, encaminhamento, notificação. Estrutura `secao` + `conteudo` (jsonb) + `ambiente` opcional, para permitir variação por gravidade. |
| `patologia_documentos` | Quais documentos fazem sentido para cada patologia, com prioridade de exibição. |
| `patologia_recursos` | Vínculo de protocolos, escores e trials à patologia (referencia `base_protocolos_clinicos`, `stg_escores_clinicos` e links externos). |
| `patologia_preferencias_usuario` | Favoritos, uso recente, ordem, ambiente preferido — por usuário. |
| `patologia_customizada` | Patologias e subperfis criados pelo usuário (ex.: "DPOC exacerbado em VNI"), com patologia-mãe opcional. |
| `patologia_conteudo_override` | Ajustes do usuário sobre o conteúdo padrão, sem tocar na curadoria base. |

Todas com `GRANT` explícito, `created_at`/`updated_at` e trigger de atualização.

### 1.2 Curadoria inicial

Classificar as ~108 patologias hoje em `base_patologias_ref` / `base_patologias_clinicas` nos três ambientes, marcando gravidade e especialidade, e completar as lacunas óbvias (ex.: emergências obstétricas, politrauma, AVC, SCA na SV; asma leve, ITU, cefaleia não grave no PS; HAS, DM, DPOC estável, rastreamentos no ambulatorial).

### 1.3 Fluxo na tela "Nova Prescrição"

Reordenação dos blocos atuais (`Dashboard.tsx`, `ActionGrid.tsx`, `PathologyLibrary.tsx`):

```text
Etapa 1  Paciente (enxuto, colapsável)
Etapa 2  PATOLOGIA
         [Ambulatorial] [Urgências/PS] [Emergências/SV]
         busca única + Favoritos / Recentes / Especialidade
         card fixo: "Receita / Patologia em branco"
Etapa 3  DOCUMENTO  (grade filtrada e ordenada pela patologia)
Etapa 4  Construção do documento, já pré-preenchida pela patologia
```

- "Receita/Patologia em branco" pula a correlação e libera todos os documentos, sem conteúdo sugerido.
- Após escolher a patologia, os módulos passam a receber: exames usuais, encaminhamento sugerido, condutas farmacológicas padrão, protocolos e escores vinculados, CID principal e associados — sempre respeitando as restrições do perfil do paciente já existentes (alergias, gestante, renal, pediátrico).
- Breadcrumb permite trocar patologia ou documento sem perder o que já foi preenchido.

### 1.4 Aba de personalização de patologias

Nova rota `/app/patologias`, com:

- Reordenação por frequência de uso, favoritos, recentes, especialidade.
- Criação de patologias e subperfis personalizados.
- Edição dos conteúdos padrão (anamnese, exames, condutas, prescrições-modelo).
- Vínculo de protocolos institucionais, guidelines e modelos de documento.

### 1.5 Design

Mantém o sistema visual atual (tokens do `index.css`, tipografia serif/sans já em uso). Cor só para gravidade e alerta; ícones minimalistas; etapa 2 → 4 em no máximo 3 cliques; responsivo com as etapas virando wizard no mobile.

### 1.6 Entregável de documentação

`docs/questionario-requisitos.md` — questionário abrangente (perfis de usuário, documentos mais usados, patologias prioritárias, integrações externas, preferências de interface, nível de automação da IA, LGPD e políticas institucionais), para calibrar os passos seguintes.

---

## Passos seguintes (comando "próximo")

**Passo 2 — Anamnese, exame físico e diferenciais por patologia.** Abas dentro da patologia, com variação por gravidade e por perfil (obstétrico, pediátrico), blocos de alerta tempo-dependentes na SV.

**Passo 3 — Hub central de escores, protocolos e trials.** Aba única com filtros por especialidade, gravidade, ambiente e patologia; o mesmo conteúdo aparece embutido na patologia (aba Conduta / Estratificação de Risco). Gera `docs/lacunas-clinicas.md` com o que faltar.

**Passo 4 — Calculadoras condicionais ao perfil.** Clearance de creatinina, dose por clearance, dose por superfície corporal, ajuste em IC, hepatopata, geriátrico, obstétrico, oncológico — no mesmo padrão da pediátrica existente, disparadas pela patologia (ex.: anticoagulante em FA sugere clearance).

**Passo 5 — Encaminhamentos.** Modal por patologia, intra-hospitalar e ambulatorial/PSF, pré-preenchido com os dados imprescindíveis daquela condição; CID principal e associados, combos salvos.

**Passo 6 — Internações e AIH.** Formulário AIH padrão SUS, personalizável, com sugestão de CID, preenchimento inteligente e coerência com a prescrição.

**Passo 7 — Notificações compulsórias.** Detecção automática pela patologia, formulário normativo, pré-preenchimento e personalização institucional.

**Passo 8 — Personalização de documentos.** Logos, dados institucionais, campos personalizados, layout, assinaturas, carimbos, QR code; PDF otimizado e template engine.

**Passo 9 — IA assistiva e chatbot.** Chatbot de dúvidas e preenchimento assistido de qualquer documento pelo gateway da plataforma, com logs auditáveis e respeito à LGPD.

**Passo 10 — Atualização de conteúdo via Perplexity.** Rotina de verificação, painel de "Atualizações Pendentes" e histórico de versões dos protocolos. Requer a chave do Perplexity.

**Passo 11 — Sugestões de novas áreas.** `docs/sugestoes-novas-areas.md` (reabilitação, telemedicina, indicadores, checklists de segurança, material educativo para paciente).

---

## Detalhes técnicos

- Consultas via React Query, seguindo `usePathologiesCatalog.ts`; novo hook `usePathologyContent` para conteúdo, recursos e overrides.
- O conteúdo curado local (`extraPathologies.ts`, `pathologyProtocols.ts`) é migrado para as novas tabelas e mantido apenas como semente da migração.
- Nenhuma cor hardcoded; tudo por tokens HSL, conforme a regra do projeto.
- Auditoria: emissão e alteração de documentos, internações e notificações já registram em `documentos_gerados` / tabelas de log; os novos módulos reaproveitam esse caminho.
