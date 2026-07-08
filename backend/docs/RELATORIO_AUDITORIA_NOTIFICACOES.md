# RELATÓRIO: NOTIFICAÇÕES E AUDITORIA & INSTRUÇÕES DE FRONTEND

Este relatório detalha o estado atual dos módulos de Notificações e Auditoria no backend e fornece as instruções necessárias para o frontend implementá-los.

---

## 1. Módulo de Notificações (`NotificationService`)

O backend possui o `NotificationService` (`backend/app/services/notification_service.py`) preparado para envio de notificações (Email/WhatsApp/PDF). 

### Estado Atual
* **Assincronismo:** As notificações estão sendo simuladas de forma assíncrona usando `threading.Thread` (ex: `send_invoice_async`, `send_pedido_async`). Isso previne bloqueios na requisição HTTP no momento do envio de faturas ou criação de pedidos.
* **Canal/API:** Atualmente as funções executam um `print` de log na thread e agem como "mocks" do serviço real.
* **Escalabilidade (Go-Live):** No futuro (em alta carga), a arquitetura foi desenhada para que este serviço troque `threading.Thread` por um task runner como o **Celery** + Redis ou RabbitMQ, sem necessidade de reescrever os controllers que as chamam.

### Uso no Backend
Exemplo nas Vendas:
```python
from app.services.notification_service import NotificationService
NotificationService.send_invoice_async(venda_id, client.email, method="email")
```

---

## 2. Módulo de Auditoria (`AuditService` & Controllers)

O sistema conta com um módulo extenso de auditoria para registar todas as transações, logins e erros do sistema (em `backend/app/models/auditoria.py`).

### Estado Atual
* **Registos de Ações (`Auditoria`):** O `AuditService.log_action` grava todas as alterações críticas. Regista o ID do Utilizador, IP (`request.remote_addr`), Entidade (ex: "Venda", "Stock"), ID do Registo, Valores Anteriores/Novos (JSON), Justificativa e Data.
* **Registos de Login (`LogAcesso`):** Regista sucesso/falha de login, IP e `User-Agent`.
* **Registos de Erros (`LogErro`):** Interceta e grava Stacktraces, tipo de erro e o endpoint/rota onde o erro ocorreu (`AuditService.log_erro`).

### Novos Endpoints Disponibilizados
Foi criado o blueprint `/api/v1/auditoria` (disponível **apenas** para o perfil `Administrador`):

1. **Listar Auditoria Geral (Operações)**
   * `GET /api/v1/auditoria?tipo=auditoria&page=1&per_page=20`
   * Permite filtros de URL: `&entidade=Venda`, `&operacao=CREATE`.
2. **Listar Acessos (Logins)**
   * `GET /api/v1/auditoria?tipo=acesso&page=1`
3. **Listar Erros de Sistema**
   * `GET /api/v1/auditoria?tipo=erro&page=1`

*(Todos retornam payload com `{ items: [...], total, pages, current_page }`)*

---

## 3. Instruções para Implementação no Frontend

### 3.1. Ecrã de "Logs do Sistema" (Dashboard Admin)
No Frontend (React/Vue/Angular), deve-se criar uma view acessível apenas por administradores com 3 abas principais:

#### Aba 1: Auditoria de Operações (`tipo=auditoria`)
- **Tabela:** ID, Data/Hora, Utilizador, Operação (badge colorido), Entidade, Módulo.
- **Ação "Ver Detalhes":** Abrir um Modal ou Drawer exibindo os campos alterados (`valor_anterior` vs `valor_novo` formatado como JSON Diff).
- **Filtros:** Adicionar dropdown para filtrar por "Entidade" (ex: Venda, Pedido, User) ou "Operação" (ex: UPDATE, DELETE).

#### Aba 2: Histórico de Acessos (`tipo=acesso`)
- **Tabela:** Data de Login, Utilizador, IP, Browser/Device (`user_agent`) e Status (Sucesso/Falha - Icone Verde/Vermelho).

#### Aba 3: Log de Erros (`tipo=erro`)
- **Tabela:** Data, Rota (ex: `/api/v1/vendas`), Tipo de Erro e Mensagem Resumida.
- **Ação "Ver Stacktrace":** Abrir Modal com `pre` / `code` para visualização de stacktrace detalhado.

### 3.2. Integração das Notificações
O frontend não precisa chamar uma rota separada para notificar; isso já ocorre automaticamente nos backends de Checkout. Mas o frontend deve apresentar configurações:

1. **Configuração do Cliente:** Nos detalhes do Cliente (`POST /api/v1/clientes`), garantir a captura do campo `email` e `whatsapp` se o utilizador desejar faturas digitais.
2. **Caixa de Opções no POS:** Adicionar check-boxes silenciosos no ecrã de Pagamento / Fechar Conta:
   - `[x] Enviar Fatura por Email`
   - `[x] Enviar Recibo via WhatsApp`
   *Estes campos podem ser submetidos no payload de metadados da Venda se o backend passar a recebê-los dinamicamente.*

### 3.3. Requisição Base (Exemplo Frontend)
```javascript
// store/auditoria.ts ou API service
async function fetchAuditoria(tipo = 'auditoria', page = 1) {
    const response = await axios.get(`/api/v1/auditoria?tipo=${tipo}&page=${page}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
}
```
