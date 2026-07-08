# Notas de Implementação - Sabor Imbatível (Motor de Vendas e Estoque)

## 1. Bloqueio de Consumíveis
Foi implementada validação em `ComercialService.create_venda` para impedir que produtos do tipo `CONSUMIVEL` sejam adicionados em transações de venda direta (Caixa).

## 2 e 3. Motor Central de Estoque
Criado o `StockService` em `app.services.stock_service`. Este serviço agora é o único ponto de entrada para registo de movimentos de estoque e utiliza `with_for_update()` para prevenir race conditions.
Nas vendas (`create_venda`, `converter_pedido_em_venda`, `converter_evento_em_venda`), a baixa é automática dependendo do tipo de produto (Revenda vs Acabado).

## 4. Faturação de Eventos
Adicionado o fluxo `converter_evento_em_venda` ao `ComercialService`.
Ele converte serviços e reservas de materiais num documento fiscal e regista o pagamento no Caixa. O endpoint exposto é `POST /eventos/<id>/faturar`.

## 5. Envio Assíncrono de Faturas
Criado `NotificationService` que simula tarefas assíncronas (via `threading`, pronto para Celery) para envio de faturas por Email ou WhatsApp. Endpoint `POST /vendas/<id>/send`.

## 6. Locks Transacionais
Adicionados em:
- `StockService` (Produto, Ingrediente, Material)
- `ComercialService` (Caixa saldo)

## 7. Performance (N+1)
O parâmetro `lazy=True` foi substituído por `lazy='selectin'` nas relationships mais acedidas (como `itens` em pedidos e vendas) para evitar o problema de N+1 queries.

## 8. Auditoria
Cada movimento gerado no `StockService` produz um log na tabela de `auditorias` associado ao utilizador responsável pela transação.
