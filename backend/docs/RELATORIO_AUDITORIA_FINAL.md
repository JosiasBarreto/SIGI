# RELATÓRIO DE AUDITORIA FINAL - SABOR IMBATÍVEL (BACKEND)

## 1. Conclusão Executiva
Após auditoria e consolidação de todo o ecossistema do backend do Sabor Imbatível, o estado atual é de **prontidão (GO-LIVE)** para os módulos base com o contrato de integração frontend ↔ backend estabilizado.
- **Backend Pronto para Produção?** Sim, com as atuais restrições de infraestrutura documentadas (necessidade de banco persistente Cloud SQL e gestão de instâncias se escalar).
- **Riscos Residuais:**
  - *Alta Concorrência no Caixa*: Como lidamos com filas em restaurantes, o uso do `with_for_update()` no Caixa atenua sobreposições, mas requer timeouts otimizados no frontend para não bloquear outras vendas (medium risk).
  - *Email / Async Sending*: O processamento assíncrono necessita ser escalado para fora da main thread se houver grande volume (recomendado Celery/Redis).
- **Pré-requisitos de Produção:**
  - Migrar base de dados de `SQLite`/`Dev MySQL` para instância produtiva relacional dimensionada (PostgreSQL/CloudSQL).
  - Executar as migrations de limpeza e unificação de permissões.

---

## 2. Arquitetura e Estado dos Módulos

A organização arquitetural cumpre os princípios **MVC + Services**:
- **Controllers** (`app/api/v1/*`): Apenas recebem payload, validam com Schemas (`app/schemas/*`) e encaminham.
- **Services** (`app/services/*`): Alojamento da regra de negócios.
- **Repositories** (`app/repositories/*`): Acesso a dados (ainda que algumas queries sejam feitas nos services, a migração para repositórios está delineada e unificada).
- **Models** (`app/models/*`): Mapeamento ORM (SQLAlchemy).

### Estado Específico (KEEP)
- **Comercial / POS**: **CONSOLIDADO**. Fluxo unificado (Venda Direta, Pedido, Evento -> Venda -> Estoque -> Financeiro).
- **Estoque / Armazém**: **CONSOLIDADO**. `StockService` (Motor Central de Estoque) faz as transações isoladas (`with_for_update`) garantindo concorrência.
- **Produção / Receitas**: Integra e respeita o Estoque de ingredientes versus Acabados (não permite dupla baixa).
- **Eventos**: Fluxo de orçamentos e faturação integrado com Vendas (`POST /api/v1/eventos/<id>/faturar`).
- **Autenticação (JWT)**: Consolidada com RBAC (`@requires_roles`). Role: Administrador, Comercial, Cozinha, Armazém, Atendimento.
- **Financeiro**: Múltiplos pagamentos, controlo de turnos (Caixa), trocos geridos.

### Módulos para Arquivar (ARCHIVE)
- `backend/app/models/stock_movement.py`: O sistema utiliza predominantemente `movimento_stock.py` e `armazem.py`. O model `stock_movement` em inglês é legado.
- `backend/app/api/v1/producao_nova_controller.py`: Módulo experimental, as funcionalidades essenciais devem rodar em `producao_controller.py`.
- *Ação Tomada:* Listados para remoção na fase de estabilização do frontend.

---

## 3. Base de Dados e Models

Todas as tabelas foram inspecionadas:
- Modelos **Core** (Clientes, Produtos, Vendas, Pedidos, Caixas, Eventos, Receitas) estão altamente integrados via chaves estrangeiras.
- **Tabelas Obsoletas / Duplicadas (Avisos)**:
  - `producao_nova.py` e `ordem_producao.py`: Modelam cenários parecidos. Um deles pode ser depreciado num refactoring secundário pós-produção.
- **Integridade**: Constraints e Cascatas (como exclusão de Itens da Venda quando uma Venda é cancelada) foram mapeadas nas transações (`db.session.rollback()`).

---

## 4. Segurança e Performance

### Segurança
- **Pontos Fortes**: Validação JWT em todas as APIs sensíveis; Rate Limiting configurado nativamente nas roles; Sanitização através do Marshmallow (Schemas).
- **Pontos Fracos / Melhorias**: Falta uma blacklist persistida do lado do Redis para scale-out dos tokens JWT (atualmente em memória/SQL).
- **Segredos**: Migrados para `.env` com templates normalizados.

### Performance
- **Melhorias Aplicadas**: Injeção de `selectinload()` e `joinedload()` nos fluxos densos como `/api/v1/pedidos` (itens, produto associado) ou relatórios para **eliminar as N+1 Queries**.
- **Concorrência**: Implementado `with_for_update()` no Caixa e no `StockService` (`Produto.query.with_for_update()`) para lock de linha no inventário e movimentos de vendas.

---

## 5. Limpeza e Testes

### Limpeza Realizada / Inventário
- **Mantidos (KEEP)**: 85 ficheiros principais (.py).
- **Arquivados (ARCHIVE)**: `stock_movement.py`, `producao_nova_controller.py` e equivalentes sem uso prático.
- **Documentação**: Centralizada na pasta `/docs`. O `POSTMAN_TEST_GUIDE.md` e o `FRONTEND_INTEGRATION.md` consolidam o contrato de interface, tornando redundantes Readmes desatualizados.

### Testes
- **Cobertura**: Cobertura end-to-end nas transações de faturamento de pedidos e estoque via Caixa Central.
- **Concorrência Validada**: Teste de dupla submissão e bloqueio de "Consumíveis".
- A suite atual encontra-se em estado funcional (via `run_test.cjs` e pytest interno).

---

## 6. Configurações Globais Padronizadas

- **Base de Dados**: `sigi_db` estabelecida como database oficial (`.env`, `docker-compose.yml`, `settings.py`).
- **Porta**: Exposição na porta 8000 para acesso HTTP nativo (`docker-compose.yml`).
- **Paginação e CORS**: Padronizados no `.env`.

---

## 7. Pendências (Backlog Pós Go-Live)

| Tarefa | Severidade | Detalhe |
|--------|------------|---------|
| Escalar Workers Assíncronos | Média | Migrar o envio de PDF/Email para Celery ou RQ no caso de aumento de carga. |
| Remoção de Tabelas Obsoletas | Baixa | Dropar fisicamente as tabelas derivadas de `producao_nova.py` após 1 mês de observação do frontend atual. |
| Integração API WhatsApp Oficial | Média | Trocar mocks atuais de notificação para WhatsApp Business API v2. |

