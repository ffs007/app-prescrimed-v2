# Assinaturas, segurança e app instalável

## 1. Planos e preços

| Plano | Preço |
| --- | --- |
| Mensal promocional | R$ 15,99/mês nos 3 primeiros meses |
| Mensal padrão | R$ 25,99/mês a partir do 4º mês (renovação automática) |
| Anual | R$ 249,50/ano (12 × 25,99 com 20% de desconto) |

A promoção é aplicada como desconto automático de 3 ciclos no plano mensal, para que o preço suba sozinho depois, sem ação do assinante.

## 2. Pagamento com Stripe

- Ativar o Stripe integrado do Lovable (ambiente de teste imediato; conta é reivindicada depois para receber de verdade).
- Cadastrar os dois produtos com os preços acima e o cupom promocional.
- Página de planos com comparação mensal x anual e destaque do valor promocional.
- Checkout hospedado do Stripe + retorno para uma tela de confirmação no app.
- Recebimento automático dos eventos de pagamento para manter o status da assinatura sempre atualizado (pago, cancelado, inadimplente).
- Impostos: cálculo e cobrança automáticos no checkout; registro e recolhimento seguem por conta do vendedor.
- E-mails do Stripe: recibos, falha de cobrança e aviso de fim da promoção ativados, com nome e contato do PrescriMed.

## 3. O que exige assinatura

Uso básico continua livre (síndromes, condições, prescrição simples).
Exigem plano ativo:
- Assistente de IA e chatbot
- AIH e internações
- Notificações compulsórias
- Documentos avançados (relatório, laudo, encaminhamento com layout personalizado)
- Atualizações clínicas automáticas

Quem não tem plano vê um aviso curto com botão "Assinar", nunca uma tela quebrada.

## 4. Observação de ações do usuário

- Ampliar o registro já existente para cobrir: entrada/saída, telas visitadas, documentos emitidos, buscas, uso de IA e tentativas bloqueadas por falta de plano.
- Painel simples em Segurança mostrando uso por dia, recursos mais usados e eventos sensíveis.
- Sem armazenar texto clínico ou dado de paciente nesses registros.

## 5. Segurança

- Varredura de segurança do banco e correção dos avisos pendentes das funções internas.
- Revisão das permissões de todas as tabelas novas de assinatura.
- Conferência de privacidade dos dados de cobrança (só o próprio usuário enxerga o seu).

## 6. Acessibilidade

- Contraste, foco visível e navegação por teclado em todas as telas principais.
- Rótulos em botões só de ícone, campos de formulário e diálogos.
- Textos alternativos e leitura correta por leitor de tela nos fluxos de prescrição e documentos.

## 7. App instalável (iPhone e Android) com uso offline

- Manifesto, ícones e cor de tema para instalar na tela inicial.
- Funcionamento offline do que já foi aberto (listas de condições, protocolos e rascunhos), com aviso quando estiver sem internet.
- Faixa discreta de instalação: no Android, botão "Instalar app"; no iPhone, instrução curta "Compartilhar → Adicionar à Tela de Início". Aparece uma vez e pode ser dispensada.
- O modo offline só vale no app publicado, não na pré-visualização.

## Detalhes técnicos

- `enable_stripe_payments` (integração gerenciada) + `batch_create_product` para os dois preços e o cupom de 3 ciclos.
- Tabela `assinaturas` (user_id, status, plano, período, customer/subscription id) com RLS por usuário; escrita apenas pela função de webhook.
- Edge functions: `create-checkout`, `stripe-webhook`, `customer-portal`.
- Hook `useSubscription` + componente `RequireSubscription` reaproveitando o padrão de `RequirePermission`.
- Auditoria via `auditClient.ts` estendido; painel novo em `SegurancaPage.tsx`.
- PWA com `vite-plugin-pwa` (`generateSW`, `autoUpdate`, NetworkFirst em navegações), registro apenas em produção fora de preview/iframe, `/~oauth` excluído.
- Sem alterar `src/components/ui/*`.

## Ordem de execução

1. Ativar Stripe e criar produtos/preços
2. Banco + webhook + checkout
3. Tela de planos e bloqueios por assinatura
4. Observação de ações e painel
5. Segurança e acessibilidade
6. App instalável e offline
