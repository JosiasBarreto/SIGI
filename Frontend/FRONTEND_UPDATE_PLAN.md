# Plano de Atualização do Frontend - Sabor Imbatível (Conformidade com Backend)

Este documento centraliza todas as alterações técnicas necessárias para garantir a total compatibilidade entre o frontend atual e a nova arquitetura unificada do backend.

## 1. Ficheiros que deverão ser modificados

### Pages (Páginas)
- `src/pages/CaixaPOS.tsx`: Atualizar endpoints, payloads e lógica de pagamento (vendas diretas vs checkout pedido). Melhorar ocultação de produtos consumíveis.
- `src/pages/Orders.tsx`: Refatorar criação e checkout de pedidos. Implementar botão "Faturar" ou checkout correto utilizando `/api/v1/comercial/checkout_pedido`.
- `src/pages/Eventos.tsx`: Implementar funcionalidade de faturar evento utilizando o novo endpoint `POST /api/v1/eventos/{id}/faturar`.
- `src/pages/ContasReceber.tsx` / `src/pages/Financeiro.tsx`: Atualizar chamadas para pagamentos em contas a receber, possivelmente utilizando pagamentos múltiplos em vendas parciais.
- `src/pages/Dashboard.tsx`: Confirmar se os endpoints de resumo financeiro estão a utilizar `/api/v1/relatorios/dashboard`.
- `src/pages/Inventario.tsx`: Garantir que qualquer gestão local seja removida; a página deve ser estritamente *read-only* de stock ou utilizar as rotas apropriadas (por ex: `/api/v1/armazem/transferir`, `/api/v1/armazem/movimentacoes`).

### Services (Integração de APIs)
- `src/services/index.ts`: 
  - Refatorar `vendaService`, `orderService` e `eventService` para bater nas novas rotas comerciais.
  - Atualizar chamadas de pagamento, checkout de pedido, e a nova funcionalidade de faturar eventos.
  - Adicionar as rotas para envio de fatura (`POST /api/v1/comercial/vendas/{id}/send`).

### Contexts
- `src/contexts/SocketContext.tsx`: Adicionar/atualizar os event listeners para eventos mais recentes do backend (`novo_pedido`, `producao_concluida`, `alerta_stock`, etc.).

### Types & Schemas
- `src/types/dtos.ts` e `src/data/schemas.tsx`: Alinhar os valores dos ENUMs exatamente como definidos no backend (ex: `TipoProduto` - "Acabado", "Revenda", "Consumível"; `EstadoVenda` - "Pendente", "Parcial", "Pago", "Cancelado"; e os respetivos para métodos de pagamento).

## 2. Novos Componentes Necessários

- **PaymentSplitDialog / ModalPagamento**: Um modal robusto que suporte múltiplos métodos de pagamento, recebimentos parciais, e cálculo automático de troco de acordo com o backend.
- **SendInvoiceDialog**: Um modal para envio da fatura via E-mail ou WhatsApp (`POST /api/v1/comercial/vendas/{id}/send`).
- **ProductListFilter**: Filtros que permitam garantir que `Produto Consumível` nunca chegue até as telas de Caixa, sem duplicar lógica de negócio, mas focados na UX (ocultar os que têm enum = Consumível).

## 3. Componentes Existentes a serem Refatorados

- **OrderDetailsModal** (`src/components/OrderDetailsModal.tsx`): Deverá incluir o botão correto para Checkout / Pagamento ou Cancelamento baseado no `EstadoPedido` unificado.

## 4. Hooks (se aplicável)

- *Não existem hooks customizados que precisem de refatoração profunda além do `useQuery`/`useMutation` inseridos nas próprias páginas.*

## 5. Endpoints Utilizados por Componente (Mapeamento)

### CaixaPOS
- **Produtos**: `GET /api/v1/armazem/produtos` (Frontend filtra para ocultar consumíveis)
- **Venda Direta**: `POST /api/v1/comercial/vendas`
  - *Payload*: `{ cliente_id?, origem, itens: [{ produto_id, quantidade, preco_unitario }], valor_pago?, forma_pagamento_id? }`
  - *Resposta*: Recebe os dados da Venda (fatura/recibo) ou erro `400` se for enviado consumível/stock insuficiente.
- **Pagamento Posterior/Múltiplo**: `POST /api/v1/comercial/vendas/{id}/pagamentos`
- **Envio Fatura**: `POST /api/v1/comercial/vendas/{id}/send`

### Orders (Pedidos)
- **Criação**: `POST /api/v1/pedidos`
- **Checkout**: `POST /api/v1/comercial/checkout_pedido/{id}`
  - *Payload*: `{ forma_pagamento_id, valor, observacoes, ... }`

### Eventos
- **Listagem**: `GET /api/v1/eventos`
- **Faturação**: `POST /api/v1/eventos/{id}/faturar`

## 6. Eventos WebSocket Utilizados

O `notificationService` já possui um esboço, mas precisará ser plenamente conectado nos componentes:
- `novo_pedido`: Refresh na query de "Pendentes" (Orders / Cozinha).
- `pedido_atualizado`: Refresh na fila de produção ou expedição.
- `producao_concluida`: Refresh na fila de Balcão/Take-Away.
- `alerta_stock`: Notificação toast global e refresh da Dashboard / Produtos.

## 7. Ordem Correta de Implementação

1. **FASE 1 - Base (Tipos e Enums):** Atualizar interfaces, schemas e mapeamentos de enums em `dtos.ts` e serviços associados.
2. **FASE 2 - Serviços (API):** Ajustar `services/index.ts` e garantir que o Axios (`client.ts`) propaga os erros adequadamente para o UI tratar `400` e outras mensagens de negócio do backend.
3. **FASE 3 - WebSockets:** Otimizar `SocketContext` para invalidar as queries do React Query globalmente quando os eventos disparam.
4. **FASE 4 - POS & Pagamentos (Crítico):** Refatorar o `CaixaPOS.tsx`. Garantir suporte a pagamentos parciais, integração ao troco calculado pelo backend e tratamentos de falhas de consumíveis.
5. **FASE 5 - Pedidos & Eventos:** Refatorar o fluxo de Pedidos (`Orders.tsx`) para usar `checkout_pedido` e introduzir a ação "Faturar" nos `Eventos.tsx`.
6. **FASE 6 - Faturação (Notificações):** Adicionar modal e requisições para o endpoint `/send` de fatura via E-mail/WhatsApp nas telas de POS e Histórico de Vendas.
7. **FASE 7 - Limpeza & Validação Final:** Limpar falsos estados (fake db) de `services/index.ts`, e testar fluxos end-to-end com o novo backend auditado.
