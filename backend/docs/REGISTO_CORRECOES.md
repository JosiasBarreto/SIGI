# Registo de correções

## FIN-001 a FIN-003 / PED-001

- Ficheiros: `app/services/comercial_service.py`, `app/services/pedido_service.py`, `tests/test_financeiro.py`.
- Pagamentos passam a bloquear o documento e rejeitam valores não positivos, excesso, saldo nulo, documentos cancelados e documentos já pagos.
- O cancelamento simples passa a bloquear documentos com pagamentos; não elimina histórico financeiro.
- A emissão de documento e o pagamento de pedido recusam pedidos cancelados.
- Vendas originadas de pedidos guardam os valores de linhas e totais no próprio documento; alterações posteriores do pedido não alteram a fatura.
- A faturação de eventos aceita o envelope de pagamento usado pelo formulário, emite FT para entradas parciais, reutiliza o documento para parcelas seguintes e não envia o recibo do pedido técnico ao cliente.
- Estado de validação: `tests/test_financeiro.py` passou (7 testes), `compileall` dos serviços passou e o lint TypeScript do frontend passou. Testes de integração MySQL e concorrência real continuam pendentes.
