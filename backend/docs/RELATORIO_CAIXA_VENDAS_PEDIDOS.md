# RELATÓRIO E GUIA DE INTEGRAÇÃO: CAIXA, PEDIDOS E VENDAS

Este guia serve como documentação estrita para o frontend interagir com os módulos base de Caixa (Turnos/Financeiro), Pedidos e Vendas do Sabor Imbatível. As variáveis documentadas abaixo representam exatamente o que o backend processa e retorna em formato JSON.

---

## 1. CAIXA & FINANCEIRO (`/api/v1/financeiro/caixas`)
Gerencia a abertura e fecho de sessões (turnos) para movimentação de valores físicos/eletrónicos.

### 1.1 Abertura de Caixa
- **Endpoint:** `POST /api/v1/financeiro/caixas/abrir`
- **Permissões:** Administrador, Financeiro, Atendimento
- **Payload Enviado:**
  ```json
  {
    "valor_inicial": 50000.00
  }
  ```
  *Nota: `valor_inicial` deve ser do tipo `float` ou `decimal`.*
- **Payload Retornado (201 Created):**
  ```json
  {
    "id": 1,
    "numero": "CX-20231015-001",
    "valor_inicial": 50000.00,
    "estado": "Aberto",
    "data_abertura": "2023-10-15T08:00:00",
    "utilizador_abertura_id": 2
  }
  ```

### 1.2 Fecho de Caixa
- **Endpoint:** `PUT /api/v1/financeiro/caixas/<id>/fechar`
- **Permissões:** Administrador, Financeiro, Atendimento
- **Payload Enviado:**
  Para um fecho cego (backend apenas fecha o caixa), envie um objeto vazio: `{}`.
  Para declarar os valores apurados (fecho detalhado), envie:
  ```json
  {
    "valor_declarado_dinheiro": 120000.00,
    "valor_declarado_transferencia": 50000.00,
    "valor_declarado_pos": 30000.00,
    "explicacao_divergencia": "Faltou 500 STN de troco não contabilizado."
  }
  ```
- **Payload Retornado (200 OK):** Retorna o Caixa fechado, contendo os `diferenca_dinheiro`, `diferenca_transferencia` calculados pelo sistema.

### 1.3 Registar Movimento Avulso (Entrada/Saída no Caixa Aberto)
- **Endpoint:** `POST /api/v1/financeiro/caixas/<id>/movimentos`
- **Payload Enviado:**
  ```json
  {
    "tipo": "ENTRADA", // Ou "SAIDA"
    "valor": 15000.00,
    "descricao": "Reforço de trocos",
    "codigo_transferencia": null, // opcional
    "emissor": null, // opcional
    "forma_pagamento": "Dinheiro" // opcional
  }
  ```

---

## 2. PEDIDOS (`/api/v1/pedidos`)
Gerencia o registo de pré-vendas (Ex: Restaurante/Mesas/Balcão/Encomendas).

### 2.1 Criar Pedido
- **Endpoint:** `POST /api/v1/pedidos`
- **Permissões:** Administrador, Atendimento
- **Payload Enviado:**
  ```json
  {
    "cliente_id": 12, // opcional
    "tipo": "RESTAURANTE", // Opções: RESTAURANTE, BALCAO, ENCOMENDA
    "origem": "LOCAL", // Opções: LOCAL, TELEFONE, ONLINE
    "observacoes": "Mesa 5. Sem cebola na salada.",
    "itens": [
      {
        "tipo_item": "PRODUTO", // PRODUTO ou SERVICO
        "produto_id": 45,
        "quantidade": 2,
        "preco_unitario": 2500.00,
        "descricao": "Hambúrguer Clássico" // opcional
      }
    ]
  }
  ```
- **Payload Retornado (201 Created):** Devolve as chaves enviadas, juntamente com `id`, `numero` (Ex: "PED-20231015-001"), `valor_total`, e `estado` (Pendente).

### 2.2 Alterar Estado do Pedido
- **Endpoint:** `PUT /api/v1/pedidos/<id>/estado`
- **Payload Enviado:**
  ```json
  {
    "estado": "EM_PREPARACAO", // PRONTO, ENTREGUE, CANCELADO
    "justificativa_cancelamento": "" // Obrigatório se estado for CANCELADO
  }
  ```

---

## 3. VENDAS E CHECKOUT (`/api/v1/vendas`)
A Venda é a concretização financeira final, abatendo o estoque e gerando receita.

### 3.1 Converter Pedido em Venda (Checkout)
Ponto crucial da integração. Quando o cliente vai pagar o Pedido.
- **Endpoint:** `POST /api/v1/vendas/checkout-pedido/<pedido_id>`
- **Payload Enviado:**
  O backend espera receber a informação de pagamento encapsulada:
  ```json
  {
    "pagamento": {
      "forma_pagamento_id": 1, // 1=Dinheiro, 2=Multicaixa, etc. Requer /api/v1/financeiro/formas-pagamento
      "valor": 5000.00
    }
  }
  ```
  *Nota: Se o cliente der 10000.00 em dinheiro para uma conta de 5000.00, deve enviar `valor: 10000.00`. O backend calculará o troco.*
- **Payload Retornado (200 OK):**
  ```json
  {
    "id": 128,
    "numero_documento": "FR 2023/128",
    "total": "5000.00",
    "valor_pago": "10000.00",
    "saldo": "0.00",
    "estado": "PAGA"
  }
  ```

### 3.2 Criação Direta de Venda (Sem Pedido Prévio)
Para lojas onde não existe atendimento de mesa, regista-se diretamente a venda.
- **Endpoint:** `POST /api/v1/vendas`
- **Payload Enviado:**
  ```json
  {
    "cliente_id": null, // opcional
    "tipo_documento": "FR", // FR (Fatura-Recibo), FT (Fatura), PROFORMA, NC (Nota de Crédito), ND (Nota de Débito)
    "itens": [
      {
        "produto_id": 45,
        "quantidade": 1,
        "desconto": 0
      }
    ],
    "pagamentos": [
      {
        "forma_pagamento_id": 1,
        "valor": 2500.00
      }
    ]
  }
  ```

### 3.3 Múltiplos Pagamentos (Adicionar Pagamento a uma Venda Pendente/Fatura)
- **Endpoint:** `POST /api/v1/vendas/<venda_id>/pagamentos`
- **Payload Enviado:**
  ```json
  {
    "forma_pagamento_id": 2, // Ex: Multicaixa
    "valor": 2500.00
  }
  ```
- **Payload Retornado (200 OK):**
  ```json
  {
    "id": 5, // ID do Pagamento Registado
    "saldo": "0.00" // Saldo restante da venda
  }
  ```

### 3.4 Enviar Fatura/Recibo (Notificações)
- **Endpoint:** `POST /api/v1/vendas/<venda_id>/send`
- **Payload Enviado:**
  ```json
  {
    "method": "email", // ou "whatsapp"
    "contact": "cliente@email.com"
  }
  ```

---

## RESUMO DE PRECAUÇÕES PARA O FRONTEND

1. **Tipagem Decimal:** Enviar e ler valores monetários usando Strings nas respostas do Backend (`"5000.00"`) para evitar erros de floating-point do Javascript. Envie `float` ou `int` nos POSTs (`5000` ou `5000.00`).
2. **Checkout (Venda):** A rota de Checkout `checkout-pedido` gera uma baixa automática de estoque pelo `StockService`. Certifique-se de não submeter este POST duas vezes (desabilite o botão enquanto o request acontece).
3. **Erros Frequentes:** O erro de variáveis geralmente acontece quando esquecemos de aninhar o objeto `pagamento` dentro de `POST /checkout-pedido/<id>`.
