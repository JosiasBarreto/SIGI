# Guia de Testes no Postman - Motor Comercial Unificado

Este guia detalha exatamente como testar as funcionalidades recém-implementadas do fluxo Comercial e Estoque no Postman.

## Variáveis de Ambiente Recomendadas (Postman)
Crie um *Environment* no Postman com as seguintes variáveis:
- `base_url`: A URL do backend (ex: `http://localhost:8000` ou a sua URL de preview `https://ais-dev-kvb56fxtnb2ohsd66pifga-71038390491.europe-west1.run.app`)
- `token`: O token JWT de um utilizador autenticado.

---

## 1. Venda Direta no Caixa (POS)
Gera uma Venda a Dinheiro (VD), Fatura (FT) ou Fatura Recibo (FR), baixa o estoque dos produtos e atualiza o saldo do Caixa.

* **Objetivo:** Simular o checkout de produtos diretamente no balcão.
* **Endpoint:** `POST {{base_url}}/api/v1/vendas`
* **Headers:**
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "tipo_documento": "FR", // Pode ser "VD", "FT" ou "FR"
  "cliente_id": 1,
  "observacoes": "Venda ao balcão - Teste",
  "itens": [
    {
      "item_tipo": "Produto",
      "item_id": 2,
      "quantidade": 2,
      "preco_unitario": 500.0,
      "desconto": 0,
      "taxa_iva_id": 1
    }
  ]
}
```
> **Nota:** Teste passar um `item_id` de um produto que seja do tipo `CONSUMIVEL`. A API deve retornar status `400` com a mensagem `"O produto X é consumível e não pode ser vendido."`

* **Resposta de Sucesso (201 Created):**
```json
{
  "id": 15,
  "numero_documento": "FR 2026/000001",
  "total": "1140.0" 
}
```

---

## 2. Criar e Pagar Pedido de Mesa

### 2.1 Criar o Pedido
* **Objetivo:** Iniciar um pedido para mesa ou balcão (para ser pago depois).
* **Endpoint:** `POST {{base_url}}/api/v1/pedidos`
* **Headers:**
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "cliente_id": 1,
  "tipo": "Restaurante",
  "origem": "Local",
  "observacoes": "Mesa 04",
  "itens": [
    {
      "tipo_item": "Produto",
      "produto_id": 1,
      "quantidade": 2,
      "preco_unitario": 570.0
    }
  ]
}
```

### 2.2 Faturar o Pedido
Converte o pedido de mesa em Venda e abate os valores financeiros no Caixa, mas não deduz o estoque dos produtos acabados novamente (visto que foram deduzidos na produção).

* **Objetivo:** Fechar a conta de uma mesa.
* **Endpoint:** `POST {{base_url}}/api/v1/vendas/checkout-pedido/<ID_DO_PEDIDO>`
* **Headers:**
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "valor": 1140.0,
  "forma_pagamento_id": 1,
  "observacoes": "Pagamento total em dinheiro"
}
```

* **Resposta de Sucesso (201 Created):**
```json
{
  "message": "Pedido processado com sucesso",
  "venda_id": 16,
  "venda_numero": "FR 2026/000002"
}
```

---

## 3. Criar e Faturar um Evento

### 3.1 Criar o Evento
* **Objetivo:** Criar a estrutura do evento (agendamento).
* **Endpoint:** `POST {{base_url}}/api/v1/eventos`
* **Headers:**
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "cliente_id": 1,
  "tipo_evento": "Casamento",
  "titulo": "Casamento João e Maria",
  "data_evento": "2026-10-10",
  "hora_inicio": "14:00:00",
  "hora_fim": "22:00:00",
  "numero_convidados": 150,
  "servicos": [
    {
      "tipo_servico": "Catering",
      "descricao": "Menu VIP",
      "valor": 50000.0
    }
  ]
}
```

### 3.2 Faturar o Evento
Pega todos os serviços e recursos de um Evento e converte em Venda (Fatura), gerando os movimentos financeiros associados ao Evento.

* **Objetivo:** Faturar cliente por um evento realizado ou sinal.
* **Endpoint:** `POST {{base_url}}/api/v1/eventos/<ID_DO_EVENTO>/faturar`
* **Headers:**
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "valor": 50000.0,
  "forma_pagamento_id": 1,
  "codigo_transferencia": "TR12345", 
  "emissor": "João Silva",
  "observacoes": "Sinal pago via transferência bancária"
}
```

* **Resposta de Sucesso (200 OK):**
```json
{
  "msg": "Evento faturado com sucesso",
  "venda_id": 17
}
```

---

## 4. Adicionar Pagamento (Parcial ou Múltiplo) a uma Venda
Permite registar um pagamento adicional em uma venda que ficou com estado `Parcialmente Pago`, ou processar pagamentos múltiplos (ex: metade em dinheiro, metade em Multicaixa).

* **Objetivo:** Pagar parcelas de uma venda pendente ou simular cálculo de Troco.
* **Endpoint:** `POST {{base_url}}/api/v1/vendas/<ID_DA_VENDA>/pagamentos`
* **Headers:**
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "valor": 5000.0,
  "forma_pagamento_id": 2,
  "referencia": "TPA-9921",
  "observacoes": "Pagamento da segunda metade"
}
```
> **Nota de Teste (Troco):** Se o saldo da venda for `4000` e enviar o valor `5000`, a API quita a venda e regista o troco de `1000` nas observações e logs.

* **Resposta de Sucesso (201 Created):**
```json
{
  "message": "Pagamento registrado com sucesso",
  "pagamento": {
    "id": 5,
    "valor": "4000.0",
    "estado": "Pago"
  },
  "venda": {
    "estado": "Pago",
    "saldo": "0.0"
  }
}
```

---

## 5. Envio Assíncrono de Fatura
Este endpoint não foi desenhado para retornar o PDF como download, mas sim para "colocar na fila" de envio. Ideal para integração via frontend.

* **Objetivo:** Enviar a fatura para o email ou whatsapp do cliente de forma assíncrona.
* **Endpoint:** `POST {{base_url}}/api/v1/vendas/<ID_DA_VENDA>/send`
* **Headers:**
  - `Authorization`: `Bearer {{token}}`
  - `Content-Type`: `application/json`
* **Body (JSON):**
```json
{
  "method": "email",
  "contact": "cliente@email.com"
}
```
*(Para WhatsApp, alterar method para "whatsapp" e contact para o nº de telefone)*

* **Resposta de Sucesso (200 OK):**
```json
{
  "msg": "Fatura colocada na fila para envio via email"
}
```

---

## Estrutura do Motor Interno de Vendas (Resumo da Regra de Negócio)

1. **Validação de Consumíveis:** Qualquer requisição no `POST /api/v1/vendas` que referenciar o `item_id` de um Consumível será bloqueada antes da persistência.
2. **Atualização do Estoque:** 
   - A requisição `POST /api/v1/vendas` aciona o `StockService.baixar_stock_venda()`.
   - Se o produto é `Revenda`, o stock cai de imediato.
   - Se é `Acabado`, baixa o stock de Produto Acabado de forma transacional.
3. **Auditoria Integrada:** Cada um destes endpoints regista uma entrada na tabela de `Auditoria`, vinculando o IP, o utilizador logado e os valores afetados.
