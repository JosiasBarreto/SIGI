# Plano de testes de regressão

## Executados

- `venv\\Scripts\\python -m pytest tests\\test_financeiro.py -q`: **PASSOU** — 9 testes.
- `venv\\Scripts\\python -m compileall app\\services -q`: **PASSOU**.
- `npm run lint` no diretório `Frontend`: **PASSOU** (`tsc --noEmit`).

## A executar localmente

1. `cd backend`
2. `venv\\Scripts\\python -m pytest tests/test_financeiro.py -q`
3. `venv\\Scripts\\python -m pytest tests/test_comercial_flows.py tests/test_pedido.py -q`

Casos ainda a executar em MySQL isolado: concorrência real, emissão/pagamento de pedido cancelado, cancelamento com recebimentos e fluxos de produção/stock. O fluxo de evento com FT parcial e parcela final foi validado em SQLite.
