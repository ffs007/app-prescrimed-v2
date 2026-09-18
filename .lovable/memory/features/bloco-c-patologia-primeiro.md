---
name: Bloco C — UX patologia-primeiro
description: Refatoração do Bloco C (Receita) para fluxo patologia→subtipo→prescrição com tabs Emergências/Favoritos/Recentes/Todas e CID secundário
type: feature
---

# Bloco C — Patologia primeiro, CID depois

## Princípio
No Bloco C do PrescriMed, a navegação principal é por PATOLOGIA, não por CID. O CID é metadado clínico secundário, exibido em segunda linha, discreto, **depois** da seleção. Aparece antes da prescrição apenas quando há subtipos com condutas distintas.

## Arquitetura de dados
- `Pathology` (em `types/prescription.ts`) ganhou:
  - `subtypes?: PathologySubtype[]` — quando presente, força etapa de escolha
  - `synonyms?: string[]` — busca aceita "ITU", "olho vermelho", "pressão alta"
  - `isEmergency?: boolean` — aparece na aba Emergências com destaque destructive sutil
- `PathologySubtype` herda meds/hospitalMeds do pai se omitir.
- Patologias novas em `src/modules/prescription/data/extraPathologies.ts` (IDs ≥ 2000), mescladas com `DEFAULT_PATHOLOGIES` legadas no Dashboard.

## UX do componente `PathologyLibrary`
1. **Tabs** no topo (quando sem busca): Emergências | Favoritos | Recentes | Todas. Busca ignora a aba.
2. **Clique direto** em patologia sem subtipo → `onLoadPathology` imediato (1 clique).
3. **Clique em patologia com subtipos** → expande inline grid 2 colunas com nome+hint+CID discreto.
4. **Clique em patologia sem subtipo, sem ainda decidir carregar** → mostra preview de meds (compatibilidade com fluxo antigo de "ver antes").
5. **Estrela (★)** ao lado de cada patologia para favoritar (warning tone, fill quando ativo).
6. **CID** só aparece após seleção, no card carregado. Nunca na lista principal sem contexto.

## Hooks
- `usePathologyMemory` (`hooks/usePathologyMemory.ts`) — favoritos + recentes (limite 8) em localStorage com chaves `prescrimed.pathology.{favorites,recents}`.

## Subtipo aplicado
`applySubtype(parent, sub)` compõe Pathology com nome "{Pai} {Sub}", CID do sub e meds do sub (fallback pai). Recente é registrado pelo id do PAI, não do subtipo.

## Emergências cobertas (críticos)
Sepse, Choque Séptico, Anafilaxia, PCR, EAP, IRpA, TEP, Crise Convulsiva, Abdome Agudo, Hemorragia Digestiva, IAM, CAD, Hipercalemia, AVC, Intoxicações.

## Não fazer
- Nunca usar CID como primeiro menu.
- Nunca exibir lista de CIDs antes da seleção da patologia.
- Nunca criar submenu se a separação não muda a conduta.
