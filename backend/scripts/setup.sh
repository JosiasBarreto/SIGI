#!/bin/bash
set -e

echo "🔹 SIGI ERP - Configuração Local 🔹"

# 1. Configurar variáveis de ambiente
if [ ! -f .env ]; then
    echo "📋 A copiar .env.example para .env..."
    cp .env.example .env
fi

# 2. Instalar dependências
echo "📦 A instalar dependências..."
pip install -r requirements.txt

# 3. Executar Docker (opcional, só executa se a tag for passada)
if [ "$1" == "--docker" ]; then
    echo "🐳 A iniciar base de dados via Docker Compose..."
    docker-compose up -d db
    echo "Pausa 15s aguardando MySQL iniciar..."
    sleep 15
fi

# 4. Iniciar base de dados
echo "⚙️  A executar migrações Alembic..."
export FLASK_APP=run.py
flask db upgrade || flask db init && flask db migrate -m "Initial migration" && flask db upgrade

# 5. Popular a base com dados iniciais (seeds)
echo "🌱 A popular base de dados..."
python scripts/seed.py

echo ""
echo "✅ Configuração concluída com sucesso!"
echo "➡️  Para executar os testes: pytest tests/"
echo "➡️  Para iniciar o servidor: bash scripts/run.sh"
