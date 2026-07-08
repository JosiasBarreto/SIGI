# Documentação Técnica - Sabor Imbatível (Backend)

Este documento representa o estado final da arquitetura comercial e financeira após a unificação dos motores.

## 1. Fluxo Geral do Sistema

`Cliente -> Pedido Comercial -> Itens -> Produção -> Pagamento -> Venda -> Documento Fiscal -> Financeiro -> Estoque -> Auditoria`

Todos os módulos que representam "venda de produtos/serviços" (Venda Direta, Pedido Mesa, Encomenda, Evento, etc) geram invariavelmente uma `Venda`. O documento de `Venda` é o centro financeiro e fiscal. Somente a Venda dá baixa em estoque (ou aciona o motor de consumo da produção).

## 2. Fluxos Específicos

### Fluxo do Caixa (Venda Direta)
`Consulta Produtos -> Carrinho -> Checkout (POST /api/v1/comercial/vendas) -> Pagamento (criado junto ou posterior) -> Venda -> Documento Fiscal -> Impressão -> Auditoria`
* No Caixa, a baixa de estoque (Revenda e Acabados) ocorre imediatamente através do `StockService`.

### Fluxo dos Pedidos
`Pedido (POST /api/v1/pedidos) -> Agendamento -> Fila de Produção -> Em Preparação -> Pronto -> Entrega -> Pagamento -> Venda (POST /api/v1/comercial/checkout_pedido)`
* A Ordem de Produção baixa o estoque dos Ingredientes. Ao converter em Venda, não há dupla baixa de estoque para produtos acabados que passaram pela produção.

### Fluxo dos Eventos
`Evento (POST /api/v1/eventos) -> Produtos/Serviços -> Pagamento -> Venda (POST /api/v1/eventos/<id>/faturar) -> Documento Fiscal`
* Os serviços e materiais do evento tornam-se itens da Venda.

### Fluxo do Estoque (StockService)
* `Entrada / Compra`: `TipoMovimento.ENTRADA`
* `Venda`: `TipoMovimento.SAIDA` (acionado automaticamente ao gerar Venda)
* `Produção / Consumo`: `TipoMovimento.SAIDA` (acionado ao concluir OP)
* Transações isoladas com `with_for_update()` garantindo integridade.

### Fluxo Financeiro
* `Pagamento Total / Parcial / Múltiplo`: Permite chamar `POST /api/v1/comercial/<venda_id>/pagamentos` repetidamente até zerar o saldo.
* `Troco`: Se o valor enviado for maior que o saldo, registra troco (observações) e quita a venda.
* `Recebimento`: Debita no `Caixa` aberto associado ao turno do utilizador.

## 3. APIs

### POST /api/v1/comercial/vendas (Checkout Venda Direta)
* **Objetivo:** Cria uma nova Venda, abate estoque, regista pagamento (se enviado) e movimento no caixa.
* **Request:** JSON
  ```json
  {
    "tipo_documento": "FR", // ou "VD"
    "cliente_id": 1, // opcional
    "observacoes": "...",
    "itens": [
       {"item_id": 1, "quantidade": 2, "preco_unitario": 10.0, "desconto": 0, "taxa_iva_id": 1}
    ]
  }
  ```
* **Response (201):** Venda criada.
* **Erros (400):** Se contiver um produto `CONSUMIVEL`.

### POST /api/v1/comercial/checkout_pedido
* **Objetivo:** Converte Pedido -> Venda.
* **Request:** `{"pedido_id": 1, "pagamento": {"valor": 100, "forma_pagamento_id": 1}}`

### POST /api/v1/eventos/<id>/faturar
* **Objetivo:** Fatura os serviços e materiais de um evento.
* **Request:** `{"valor": 5000, "forma_pagamento_id": 1}`

### POST /api/v1/comercial/vendas/<id>/pagamentos
* **Objetivo:** Registar pagamento parcial/múltiplo numa venda já existente.
* **Request:** `{"valor": 50, "forma_pagamento_id": 1, "observacoes": "Troco de 5"}`

### POST /api/v1/comercial/vendas/<id>/send
* **Objetivo:** Fila assíncrona para envio de fatura PDF.
* **Request:** `{"method": "email", "contact": "cliente@email.com"}`

## 4. ENUMS Documentados

* **TipoProduto**: `ACABADO`, `REVENDA`, `CONSUMIVEL` (Bloqueado no Caixa)
* **EstadoPedido**: `PENDENTE`, `EM_PREPARACAO`, `PRONTO`, `ENTREGUE`, `CANCELADO`
* **TipoDocumento**: `FR` (Fatura Recibo), `VD` (Venda a Dinheiro), `FT` (Fatura)
* **OrigemMovimento**: `ARMAZEM`, `VENDA`, `COMPRA`, `AJUSTE`, `PRODUCAO`
* **TipoMovimento**: `ENTRADA`, `SAIDA`, `AJUSTE`, `PERDA`
* **EstadoVenda**: `PENDENTE`, `PAGO`, `PARCIALMENTE_PAGO`, `CANCELADO`

## 5. Eventos WebSocket

* `novo_pedido` -> Enviado quando um pedido é criado. Atualiza lista de pedidos no dashboard da cozinha.
* `producao_concluida` -> Enviado quando uma Ordem de Produção é marcada como PRONTO. Atualiza painel de sala/expedição.
* `alerta_stock` -> Enviado quando um produto atinge estoque mínimo (via StockService) ou na produção.

## 6. Contrato de Integração Frontend ↔ Backend

**Venda POS Direta (Caixa)**
1. Obter Produtos Ativos (`GET /api/v1/armazem/produtos`)
2. Validar que nenhum produto do carrinho tem `tipo === 'Consumivel'`.
3. Montar Payload de Venda e chamar `POST /api/v1/comercial/vendas`.
4. Se o cliente der dinheiro a mais, enviar o `valor_entregue` no fluxo de pagamento; o backend trata o Troco.
5. Invalida Cache: `vendas`, `produtos`, `caixa`.

**Pedidos / Restaurante**
1. Criar Pedido (`POST /api/v1/pedidos`). Aguardar preparo (WebSocket).
2. Na hora da conta, chamar `POST /api/v1/comercial/checkout_pedido`.
3. Invalida Cache: `pedidos`, `vendas`, `caixa`.

**Eventos**
1. Criar e gerir Evento normalmente.
2. No acerto de contas, chamar `POST /api/v1/eventos/<id>/faturar`.

## 7. Mapeamento Frontend -> Backend

| Funcionalidade Frontend | Endpoint | Método | Observações |
| ----------------------- | -------- | ------ | ----------- |
| POS (Checkout Venda) | `/api/v1/comercial/vendas` | POST | Gera Venda, Baixa Stock |
| Adicionar Pagamento Parcial | `/api/v1/comercial/<id>/pagamentos` | POST | Verifica caixa e saldo da venda |
| Faturar Evento | `/api/v1/eventos/<id>/faturar` | POST | Gera Venda a partir do Evento |
| Faturar Pedido | `/api/v1/comercial/checkout_pedido`| POST | Converte Pedido e não baixa stock 2x |
| Envio de Fatura | `/api/v1/comercial/vendas/<id>/send` | POST | Async via Threading/Celery |

## 8. Diagrama de Sequência (Textual) - Venda Direta

```
[Frontend] -> Envia Carrinho (POST /vendas) -> [ComercialController]
[ComercialController] -> ComercialService.create_venda()
ComercialService -> Verifica "CONSUMIVEL" (Rollback se Sim)
ComercialService -> Insere Venda e Itens (BD)
ComercialService -> Aciona StockService.baixar_stock_venda()
StockService -> Verifica Tipo (Revenda ou Acabado) -> Atualiza Saldo -> Gera Auditoria -> Retorna
ComercialService -> Caixa.query.with_for_update() -> Atualiza Saldo Caixa
[ComercialController] <- Retorna Venda 201 <- [Frontend] Mostra Sucesso e Imprime
```

