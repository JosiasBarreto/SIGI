# SIGI — guia de instalação, pesquisa e operação

Este guia instala o SIGI numa máquina Windows nova sem copiar ambientes virtuais ou `node_modules` de outra máquina.

## Pré-requisitos

- Windows 10/11 com PowerShell.
- Python 3.11 (64 bits). Confirme com `py -3.11 --version`.
- Node.js 20 LTS ou superior. Confirme com `node --version`.
- MySQL 8.0 ou MariaDB 10.6+ acessível na rede.
- Git, quando o projeto for obtido por repositório.

Não instale dependências com privilégios de administrador. Cada componente usa o seu próprio ambiente.

## 1. Preparar a base de dados

Crie uma base de dados e um utilizador próprios. Exemplo no cliente MySQL:

```sql
CREATE DATABASE sigi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'sigi_user'@'%' IDENTIFIED BY 'defina-uma-senha-segura';
GRANT ALL PRIVILEGES ON sigi_db.* TO 'sigi_user'@'%';
FLUSH PRIVILEGES;
```

Se a instalação vier de uma cópia existente, restaure antes o backup SQL fornecido. Em instalação vazia, o passo de migração cria as tabelas.

## 2. Instalar e iniciar o backend

No diretório do projeto:

```powershell
cd backend
Copy-Item .env.example .env
notepad .env
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python files/apply_migration.py
python run.py
```

Para executar testes e ferramentas de desenvolvimento, instale adicionalmente:

```powershell
pip install -r requirements-dev.txt
pytest -q
```

O backend fica disponível em `http://SERVIDOR:8000`. Ao arrancar, ele verifica e completa as colunas de `notificacoes` sem apagar dados, incluindo `entidade_tipo` e `entidade_id`.

## 3. Instalar e iniciar o frontend

Noutro PowerShell:

```powershell
cd Frontend
Copy-Item .env.example .env
notepad .env
npm ci
npm run dev
```

Em `.env`, defina `VITE_API_URL` para `http://IP_DO_SERVIDOR:8000/api` e `VITE_SOCKET_URL` para `http://IP_DO_SERVIDOR:8000`. Use o mesmo IP que os postos da rede conseguem alcançar.

Para preparar uma compilação de produção:

```powershell
npm ci
npm run lint
npm run build
```

`npm ci` usa exatamente as versões registadas em `package-lock.json`; não substitua por `npm install` em instalações reproduzíveis.

## Atualização numa máquina já instalada

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python files/apply_migration.py

cd ..\Frontend
npm ci
npm run build
```

Reinicie o serviço do backend depois da atualização. Faça um backup da base de dados antes de atualizar uma instalação em produção.

## Pesquisa e diagnóstico rápido

| Sintoma | Verificação | Ação |
| --- | --- | --- |
| Frontend não carrega dados | Abra `http://IP:8000/api/health` | Corrija `VITE_API_URL`, firewall ou IP da API. |
| Sino sem alertas | Abra as ferramentas do browser e procure `Socket connected` | Corrija `VITE_SOCKET_URL`, token de sessão e a porta 8000. |
| Erro `Unknown column notificacoes.entidade_tipo` | Consulte o log de arranque | Execute `python apply_migration.py` e reinicie o backend. |
| Toast repetido | Pesquise no console pelo mesmo evento `notificacao` | O frontend centraliza toast/som no `NotificationManager`; atualize os ficheiros compilados. |
| SMS/WhatsApp não sai | Verifique `SMS_*`/`WHATSAPP_*` no `.env` | Configure o gateway. Sem credenciais, o envio externo não é executado. |
| FR com pagamento parcial | Veja a resposta da API | É uma regra fiscal: emita FT para pagamento parcial/posterior. |

## Política de notificações e mensagens ao cliente

- Um evento WebSocket visual é processado uma vez pelo `NotificationManager`, que controla toast, som e notificação do sistema operativo.
- O centro de notificações/sino mantém o histórico, mas não cria um segundo toast para o mesmo evento.
- O envio de SMS/WhatsApp a partir do modal de pedido é manual, por ação explícita do operador.
- O backend pode enviar automaticamente o documento comercial depois do checkout quando o cliente tiver contacto. Não clique também em “Enviar” se não desejar uma segunda comunicação.

## Ficheiros que não devem ser copiados nem versionados

- `backend/.env` (contém segredos).
- `backend/.venv` ou `backend/venv`.
- `Frontend/node_modules` e `Frontend/dist`.
- Backups SQL sem validação e sem controlo de acesso.

Use os exemplos `.env.example`, `requirements.txt` e `package-lock.json` como fonte de reprodução da instalação.
