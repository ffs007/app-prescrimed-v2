# Correção definitiva da sidebar e dos ambientes clínicos

## Objetivo
Entregar a área interna limpa e coerente, sem a lista lateral interminável e sem repetir indiscriminadamente as mesmas patologias entre Ambulatorial, Urgências/PS e Emergências/SV.

## Diagnóstico confirmado
- A sidebar atual contém mais de 20 links em uma única seção; os pedidos anteriores apenas acrescentaram itens, sem reorganizar a navegação.
- O aplicativo tenta buscar a classificação na tabela `patologia_ambiente`, mas essa tabela não existe no banco conectado.
- Quando a classificação não existe ou vem vazia, há dois retornos indevidos para a lista completa: um no filtro principal e outro na tela de escolha. Patologias personalizadas também são acrescentadas a todos os ambientes.
- Por isso as abas parecem diferentes visualmente, mas exibem essencialmente o mesmo catálogo.

## 1. Sidebar realmente limpa
Organizar a navegação em grupos recolhíveis, mantendo aberto apenas o grupo da tela atual:

- **Atendimento**: Início, Nova Prescrição, Pacientes.
- **Documentos**: Documentos, Histórico, Internações/AIH, Notificações.
- **Base clínica**: Medicamentos, Minhas Patologias, Modelos Rápidos, Protocolos & Escores.
- **Qualidade clínica**: Atualizações, Indicadores e Auditoria de Protocolos.
- **Administração**: importação, curadoria, promoção da base, testes e configurações — visível somente para perfis autorizados.

Remover atalhos redundantes de protocolos específicos e telas técnicas da navegação principal; eles continuam acessíveis dentro do hub correspondente. Preservar o modo compacto por ícones, destaque da rota ativa e botão externo para reabrir a sidebar.

## 2. Classificação clínica real no banco
Criar `patologia_ambiente` com permissões explícitas, proteção por perfil e índices de busca. Popular a tabela a partir do catálogo atual, atribuindo a cada registro clínico um **ambiente principal**:

- **Ambulatorial**: condições estáveis, crônicas, rastreamento e seguimento.
- **Urgências/PS**: quadros agudos sem critérios imediatos de sala vermelha.
- **Emergências/SV**: condições tempo-dependentes, instabilidade ou alto risco.

Quando uma doença tiver apresentações de gravidade distintas, usar as variantes clínicas existentes (por exemplo, “sem sinais de alarme” e “grave”) em ambientes diferentes, em vez de repetir o mesmo item genérico nas três listas.

## 3. Filtro sem vazamento entre abas
- Remover todos os fallbacks que mostram o catálogo completo quando a classificação está vazia.
- Exibir somente patologias explicitamente classificadas no ambiente selecionado.
- Patologias personalizadas aparecem apenas nos ambientes marcados pelo usuário.
- Se a classificação falhar, mostrar erro claro com opção de tentar novamente; nunca preencher silenciosamente com todas as patologias.
- Deduplicar por nome normalizado e subtipo antes da exibição.

## 4. Validação
- Conferir no banco quantas patologias ficaram em cada ambiente e detectar duplicatas exatas entre ambientes.
- Testar troca entre as três abas, busca, favoritos, recentes e patologias personalizadas.
- Verificar sidebar expandida e compacta, rota ativa, grupos recolhíveis e visibilidade administrativa.
- Validar desktop e celular e executar os testes do fluxo de prescrição.

## Critério de aceite
- Nenhuma patologia exata aparece em mais de um ambiente sem uma decisão clínica explícita e documentada.
- Uma falha de carregamento nunca volta a mostrar todas as patologias.
- A sidebar deixa de ser uma lista única e passa a ter poucos grupos claros, com recursos técnicos fora do caminho principal do médico.
