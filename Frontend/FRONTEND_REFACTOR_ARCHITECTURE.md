# Arquitetura de Refatoração do Frontend (Sabor Imbatível)

Este documento descreve a estrutura ideal e o plano de refatoração do frontend para alinhar com o novo Motor Comercial unificado do backend (Fluxo: Pedido -> Venda -> Pagamento -> Documento Fiscal -> Estoque -> Financeiro -> Auditoria).

## 1. Estrutura Ideal do Projeto

Abaixo a estrutura recomendada para manter a separação de responsabilidades clara e escalável:

```text
src/
├── api/             # Cliente HTTP (Axios) e interceptors
├── services/        # Abstração de chamadas à API (ex: comercialService, inventarioService)
├── hooks/           # Custom hooks (React Query, lógica de UI reutilizável)
├── contexts/        # Contextos Globais (Auth, Socket, Tema)
├── pages/           # Telas completas roteadas
├── components/      # Componentes visuais (UI, Forms, Modals)
├── dtos/            # Interfaces de Request e Response (alinhadas ao backend)
├── enums/           # Constantes e Enumerações padronizadas
├── schemas/         # Validações (Zod/Yup) e definições estruturais
├── utils/           # Funções utilitárias e formatadores
└── constants/       # Variáveis de ambiente e constantes globais
```

### O que permanece, muda, cria ou remove:
- **Permanece**: O core visual (Tailwind/Componentes UI), sistema de rotas base, configuração do Vite.
- **Muda**: Tipagem solta passará para DTOs rigorosos; `services/index.ts` monolítico será idealmente dividido ou refatorado; chamadas diretas passarão a usar constantes de enum; os payloads de requisição serão estritos.
- **Cria**: Pastas e arquivos dedicados para `dtos/`, `enums/`, e `validators/`. Criação de `comercialService`.
- **Remove**: Mocks de dados (fake DB) soltos nos services antigos, strings mágicas para status (ex: `"PENDENTE"`).

---

## 2. Auditoria de Serviços (Services)

| Service Atual | Continua | Altera | Novo | Descrição da Mudança |
| --- | --- | --- | --- | --- |
| `vendaService` | Não | Sim (Renomear/Juntar) | `comercialService` | Passa a englobar Vendas, Checkout, Faturas. |
| `orderService` | Sim | Sim | - | Ajustado para criar Pedidos e listar status. |
| `eventService` | Sim | Sim | - | Nova integração: `POST /api/v1/eventos/{id}/faturar`. |
| `productService` | Sim | Sim | - | Filtros estritos no backend, tipagem de devolução de Estoque ajustada. |
| `financeiroService`| Sim | Sim | - | Suporte a extratos vindos diretamente de pagamentos parciais. |

---

## 3. Auditoria de Hooks

| Hook | Continua | Altera | Novo | Descrição da Mudança |
| --- | --- | --- | --- | --- |
| `useApi` | Sim | Sim | - | Padronização no tratamento de erro (400 com payload específico). |
| `useComercial` | - | - | Sim | Hook dedicado para orquestrar Queries/Mutations do motor comercial. |
| `useEstoque` | - | - | Sim | Hook para centralizar refetch de produtos quando o WS avisa alerta. |

---

## 4. DTOs (Data Transfer Objects)

*Nota: Todas as tipagens devem ser extraídas para `src/dtos/`.*

| DTO | Backend | Frontend Atual | Compatível |
| --- | --- | --- | --- |
| `VendaRequest` | `{cliente_id, origem, itens, valor_pago, forma_pagamento_id}` | Parcialmente | 🟡 Refatorar |
| `VendaResponse` | Objeto completo da Venda com estado e troco calculado | Interface genérica | ❌ Refatorar |
| `PagamentoRequest`| `{valor, forma_pagamento_id, observacoes}` | Não implementado (separado) | ❌ Criar |
| `PagamentoResponse`| Confirmação e novo saldo/troco | - | ❌ Criar |
| `CheckoutPedidoRequest`| `{forma_pagamento_id, valor, observacoes}` | Enviado no Pedido | ❌ Refatorar |

---

## 5. ENUMs

*Nota: Extrair de strings perdidas para `src/enums/index.ts`.*

| Enum | Valores Backend | Frontend Atual | Status |
| --- | --- | --- | --- |
| `EstadoPedido` | `"Agendado" \| "Confirmado" \| "Em Producao" \| "Pronto" \| "Entregue" \| "Concluido" \| "Cancelado"` | Strings espalhadas | 🟡 Centralizar |
| `TipoProduto` | `"Acabado" \| "Revenda" \| "Consumivel" \| "Servico" \| "Aluguer"` | `"Produto Acabado"`, etc | ❌ Sincronizar |
| `EstadoVenda` | `"Pendente" \| "Parcial" \| "Pago" \| "Cancelado"` | N/A | ❌ Criar |
| `FormaPagamento` | `"Dinheiro" \| "Transferencia" \| "POS" \| "Mixto"` | Misturado | 🟡 Centralizar |

---

## 6. Components (Formulários e Modals)

| Componente | Alteração Necessária |
| --- | --- |
| `CaixaPOS` | UX/Lógica: Impedir seleção de Consumíveis. Modal de Pagamento Múltiplo e Troco. Tratar erro HTTP 400 se enviar Consumível. |
| `PaymentModal` (Novo) | Lidar com Pagamento Parcial, Total, Múltiplos, Troco e enviar para `PagamentoRequest`. |
| `OrderDetailsModal` | Trocar botão de concluir por "Checkout" (invoca nova rota de checkout). |
| `SendInvoiceDialog` | Novo modal para envio de fatura via WhatsApp/Email. |

---

## 7. Pages

| Página | Alteração Necessária |
| --- | --- |
| `Orders.tsx` | Isolar fluxo de criação pura de Pedido. O Pagamento deve passar para o modal de checkout. |
| `Eventos.tsx` | Adicionar fluxo de Faturação no detalhe do evento (chamando endpoint novo). |
| `Inventario.tsx` | Tornar interface estritamente baseada no Backend. Retirar inputs que alterem quantidade sem passar por rota oficial de movimento. |

---

## 8. Contexts

| Context | Alteração Necessária |
| --- | --- |
| `SocketContext.tsx`| Mapear e reagir a: `novo_pedido`, `pedido_atualizado`, `producao_concluida`, `alerta_stock`. Invocar `queryClient.invalidateQueries`. |

---

## 9. React Query & Mutations

### Queries (Cache, StaleTime, Invalidation)

| Query Key | Endpoint Associado | Tratamento (Cache/Refetch) |
| --- | --- | --- |
| `['produtos']` | `/api/v1/armazem/produtos` | Invalida em `alerta_stock`. `staleTime: 5min`. |
| `['pedidos']` | `/api/v1/pedidos` | Invalida em `novo_pedido` e após mutation. |
| `['vendas']` | `/api/v1/comercial/vendas` | Invalida após novo `pagamento` ou `venda`. |
| `['eventos']` | `/api/v1/eventos` | Invalida após mutation `faturar`. |

### Mutations

| Mutation Key | Endpoint Associado | Ação Pós-Successo (Optimistic Update) |
| --- | --- | --- |
| `createVenda` | `POST /api/v1/comercial/vendas` | Mostrar Recibo/Troco, Invalidar Vendas/Estoque. |
| `addPagamento` | `POST /api/v1/comercial/vendas/{id}/pagamentos` | Atualizar EstadoVenda no cache atual, exibir Troco. |
| `checkoutPedido` | `POST /api/v1/comercial/checkout_pedido/{id}` | Invalidar Pedidos e Vendas. Mostrar Recibo. |
| `faturarEvento` | `POST /api/v1/eventos/{id}/faturar` | Atualizar status do Evento para faturado. |
| `sendFatura` | `POST /api/v1/comercial/vendas/{id}/send` | Toast de sucesso. |

---

## 10. WebSockets (Eventos)

| Evento WS | Ação / Atualiza quais telas |
| --- | --- |
| `novo_pedido` | Invalida cache de Pedidos. Aparece na Fila da Cozinha / Orders. |
| `producao_concluida` | Invalida cache de Pedidos (Estado). Notifica Caixa/Balcão. |
| `alerta_stock` | Invalida cache de Produtos/Inventário. Toast UI de aviso. |

---

## 11. Fluxos de Negócio Consolidados

1. **Venda Direta (POS)**
   - Front apenas exibe Acabado/Revenda. Submete -> Backend -> Retorna Venda.
   - Pagamento via modal próprio integrado ao backend (que devolve o troco).
2. **Pedido -> Checkout**
   - Criação via `Orders`.
   - Produção altera estado (via App Cozinha / WS).
   - Operador clica "Checkout" -> Submete -> Backend converte em Venda + Movimenta Caixa + Remove Estoque.
3. **Evento -> Faturação**
   - Criação normal. No momento certo, Operador clica "Faturar".
   - Backend gera Venda automaticamente com as verbas do evento.
4. **Pagamento (Nova Lógica Múltipla)**
   - Aceita X€ em Multibanco, Y€ em Dinheiro.
   - Frontend orquestra as chamadas sequenciais para `vendas/{id}/pagamentos`.
5. **Estoque**
   - 100% derivado. Frontend não deduz nada sozinho. Ouve WS e atualiza UI.

---

## 12. Ordem Exata de Implementação (Fases)

Para reduzir o risco de retrabalho e instabilidade, a implementação seguirá rigorosamente a seguinte ordem, priorizando a estabilização da base (tipos e contratos) antes da interface gráfica:

### Fase 1: Arquitetura Base (Sem impactos visuais)
1. Extração e tipagem rigorosa dos **ENUMs** (`src/enums/index.ts`).
2. Implementação das tipagens exatas dos **DTOs** (`VendaRequest`, `PagamentoRequest`, etc. em `src/dtos/`).
3. Refatoração dos **Services** (criar `comercialService.ts`, remover lógicas isoladas).
4. Configuração do cliente da **API** (Tratamento global de Erro 400 para interceptors do Axios).
5. Criação de **Hooks** globais (ex: `useComercial.ts`).

### Fase 2: Integração e Sincronização de Estado
6. Otimização do **React Query** (Configuração de Query Keys padronizadas e tempos de cache).
7. Implementação das **Mutations** (associadas aos novos Services).
8. Conexão completa dos **WebSockets** (`SocketContext` ouvindo eventos e invalidando caches corretos).

### Fase 3: Módulos de Negócio (Lógica Core)
9. Atualização da Lógica do **POS (CaixaPOS)** (Mudança de payload, integração com o novo fluxo).
10. Atualização do Módulo de **Pedidos (Orders)** (Mudança para fluxo `checkout_pedido`).
11. Atualização do Módulo de **Eventos** (Adição da mutation `Faturar Evento`).
12. Revisão do Módulo de **Produção** e Inventário (Leitura rigorosa do backend).

### Fase 4: UX (Melhorias Finais e Refinamento)
13. Implementação dos formulários de **Pagamentos Múltiplos** e recebimento parcial.
14. Implementação do sistema de **Envio de Faturas** (Email/WhatsApp via endpoint).
15. Modals de impressão e recibos dinâmicos.
16. Testes integrados e validação de UX de tratamentos de erros.

---
*Este documento é a diretriz oficial para as refatorações. Nenhuma interface deve ser adaptada antes que as Fases 1 e 2 estejam concluídas e validadas contra o servidor.*
