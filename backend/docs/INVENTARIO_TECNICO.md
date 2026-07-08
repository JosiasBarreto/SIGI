# INVENTÁRIO TÉCNICO COMPLETO - BACKEND SABOR IMBATÍVEL

## 1. Módulos Existentes
* **Autenticação & Utilizadores:** Gestão de utilizadores, login, registo, RBAC (Role-Based Access Control) e JWT.
* **Comercial / POS:** Motor de vendas unificado, caixa, pagamentos parciais e emissão de documentos fiscais (Faturas, Recibos).
* **Armazém & Estoque:** Motor central de estoque (`StockManager`), movimentos, entradas, saídas, ajustes e baixas de produção.
* **Pedidos (Restaurante/Balcão):** Criação de pedidos, conversão em venda.
* **Produção / Receitas:** Fichas técnicas, ordens de produção, transformação de ingredientes em produtos acabados.
* **Eventos:** Gestão de serviços, materiais, orçamentos e conversão em venda.
* **Financeiro:** Gestão de turnos/caixas, fluxo de caixa, pagamentos, estornos.
* **Logística:** Entregas e distribuição.
* **Relatórios / Auditoria:** Logs de ações do utilizador, exportação de dados, dashboard geral.
* **Inventário:** Contagem cíclica e reconciliação.

---

## 2. Estrutura MVC e Diretórios

### Controllers (`backend/app/api/v1/`)
* `armazem_controller.py`, `auth_controller.py`, `calendario_controller.py`, `comercial_controller.py`, `evento_controller.py`, `financeiro_controller.py`, `inventario_controller.py`, `logistica_controller.py`, `pedido_controller.py`, `producao_controller.py`, `producao_nova_controller.py` (candidato a arquivo), `receita_controller.py`, `relatorios_controller.py`, `requisicao_controller.py`, `turno_controller.py`, `user_controller.py`

### Services (`backend/app/services/`)
* `armazem_service.py`, `audit_service.py`, `auth_service.py`, `comercial_service.py`, `evento_service.py`, `financeiro_service.py`, `inventario_service.py`, `logistica_service.py`, `notification_service.py`, `pdf_generator.py`, `pedido_service.py`, `producao_service.py`, `receita_service.py`, `requisicao_service.py`, `stock_service.py`, `turno_service.py`, `user_service.py`

### Repositories (`backend/app/repositories/`)
* `armazem_repos.py`, `base_repository.py`, `comercial_repos.py`, `evento_repos.py`, `financeiro_repos.py`, `logistica_repos.py`, `pedido_repos.py`, `producao_repos.py`, `requisicao_repos.py`, `user_repository.py`

### Models (`backend/app/models/`)
* `armazem.py`, `auditoria.py`, `base.py`, `caixa.py`, `categoria_produto.py`, `cliente.py`, `comercial.py`, `evento.py`, `ficha_tecnica.py`, `financeiro.py`, `fornecedor.py`, `ingrediente.py`, `inventario.py`, `item_pedido.py`, `logistica.py`, `material.py`, `movimento_stock.py`, `ordem_producao.py`, `pedido.py`, `producao_nova.py`, `produto.py`, `receita.py`, `requisicao.py`, `reserva.py`, `stock_movement.py` (legado), `token_blocklist.py`, `turno.py`, `unidade_medida.py`, `user.py`

---

## 3. Base de Dados: Tabelas e Relações Principais
* **`users`, `clientes`, `fornecedores`**: Perfis base.
* **`produtos`, `categorias`, `unidades_medida`**: Catálogo base. *Relação:* Produto 1:N Categoria.
* **`vendas`, `vendas_itens`**: Core comercial. *Relação:* Venda 1:N Itens -> Produto.
* **`pedidos`, `itens_pedido`**: Pré-venda e Cozinha. *Relação:* Pedido 1:N Itens, Venda 1:1 Pedido.
* **`eventos`, `evento_servicos`**: Core de festas/catering. *Relação:* Evento -> Venda (Fatura).
* **`caixas`, `movimentos_caixa`**: Controlo de turnos de dinheiro.
* **`pagamentos`, `formas_pagamento`**: Quitação de dívida de Vendas.
* **`movimentos_stock`, `armazens`**: Rastreabilidade do motor de inventário (Estoque Central).
* **`ordens_producao`, `fichas_tecnicas`**: Consumo de ingredientes e geração de produtos acabados.
* **`auditoria`**: Log universal (polimórfico por Tabela/ID).

---

## 4. Endpoints Principais (Amostragem dos 126 Endpoints)

| Módulo | Método HTTP | Endpoint | Payload Esperado | Resposta (Sucesso) |
|---|---|---|---|---|
| **Comercial** | `POST` | `/api/v1/vendas` | JSON `{"tipo_documento", "itens"}` | `201 Created` - Venda |
| **Comercial** | `POST` | `/api/v1/vendas/checkout-pedido/<id>` | JSON `{"valor", "forma_pagamento_id"}` | `201 Created` - Transforma Pedido |
| **Eventos** | `POST` | `/api/v1/eventos/<id>/faturar` | JSON `{"valor"}` | `200 OK` - Gera Fatura |
| **Financeiro**| `POST` | `/api/v1/vendas/<id>/pagamentos` | JSON `{"valor", "forma_pagamento_id"}` | `201 Created` - Add Pagamento |
| **Financeiro**| `GET` | `/api/v1/financeiro/formas-pagamento` | - | `200 OK` - Lista de Métodos |
| **Produção** | `POST` | `/api/v1/producao/ordens` | JSON `{"produto_id", "quantidade"}` | `201 Created` |
| **Auth** | `POST` | `/api/v1/auth/login` | JSON `{"email", "password"}` | `200 OK` - Token JWT |
| **Armazém** | `GET` | `/api/v1/armazem/produtos` | - | `200 OK` - Catálogo com Saldo |

---

## 5. Permissões e Perfis (RBAC)
As permissões são validadas através do decorator `@requires_roles('Role')` e JWT.
* **Administrador:** Acesso global, incluindo dashboards financeiros, configurações, edição de utilizadores, anulação de recibos.
* **Comercial:** Acesso à criação de vendas, gestão de clientes, consulta de catálogo e eventos.
* **Cozinha / Pastelaria:** Acesso à listagem de pedidos, ordens de produção, receitas e fichas técnicas. (Sem acesso ao financeiro).
* **Atendimento (Mesa/Balcão):** Acesso à criação de pedidos, consulta de produtos. 
* **Armazém:** Acesso a movimentos de estoque, inventários, compras e fornecedores.

---

## 6. Configurações Globais
* **Porta do Servidor:** `8000` (definida via Docker e Vite Proxy).
* **Base de Dados:** MySQL (`sigi_db` via SQLAlchemy no `settings.py`).
* **Ambientes (`.env`):** Configuráveis para Produção/Dev. `JWT_SECRET_KEY` central.
* **CORS:** Ativado para todas as origens `*` para permitir frontends dinâmicos.

---

## 7. Testes e Cobertura
* **Testes Existentes:** `test_models.py`, `test_seq.py`. Validação dos serializers JSON.
* **Scripts Complementares:** `run_test.cjs`, validando fluxos básicos de boot.
* **Cobertura (Estimativa):** O backend tem cobertura média focada nas operações unitárias do serviço. **Recomendação**: Adicionar mais testes de concorrência (`pytest`) simulando 10 requisições simultâneas ao Caixa.

---

## 8. Pendências por Criticidade
* **CRÍTICO:** 
  - (Nenhuma pendência crítica estrutural impeditiva de go-live).
* **ALTO:** 
  - O motor de envio de E-mail/WhatsApp na Venda (`/api/v1/vendas/<id>/send`) está sincrono/simulado. Migrar para fila assíncrona (Celery/Redis) se o tráfego aumentar.
* **MÉDIO:** 
  - Remover fisicamente tabelas e models obsoletos (`stock_movement.py`, `producao_nova.py`) após a consolidação final da fase 1.
* **BAIXO:** 
  - Atualização dos Mocks do frontend para ler 100% os contratos desta API.

---

## 9. CHECKLIST FINAL - GO-LIVE PRONTIDÃO

- [x] **Unificação do Fluxo Comercial:** Pedidos, Eventos e Venda Direta convergindo no mesmo motor.
- [x] **Bloqueio de Consumíveis:** Impedidos na Venda Direta (Caixa).
- [x] **Motor Central de Estoque:** `StockService` em execução transacional.
- [x] **Baixa Imediata na Venda:** Implementado via Motor Central.
- [x] **Pagamentos Múltiplos & Troco:** Implementado em `/pagamentos` com suporte a troco explícito.
- [x] **Segurança / Concorrência:** `with_for_update()` adicionado aos saldos de Caixa e Movimentação de Estoque.
- [x] **Auditoria Ativada:** Transações registam IP, Utilizador, Ação e Delta (Valores Antigos/Novos).
- [x] **Performance (N+1):** Otimizações em carregamento relacional base efetuadas.
- [x] **Configurações Alinhadas:** `.env` corrigido (porta 8000, `sigi_db`).
- [x] **Contrato de Integração:** Manuais (Postman & Frontend) atualizados.

**Conclusão de Prontidão:** O backend Sabor Imbatível está **Aprovado para Produção (Go-Live)**.
