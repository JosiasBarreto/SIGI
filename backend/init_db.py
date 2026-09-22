"""
Script de Inicialização de Estrutura da Base de Dados - SIGI ERP
Gera 100% das tabelas no MySQL SEM criar utilizadores ou dados de empresa,
garantindo que o fluxo de primeiro utilizador (Setup Wizard) do Frontend continue ativo.

Uso:
  python init_db.py
"""
import sys
import os
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
load_dotenv(os.path.join(backend_dir, '.env'))

from app import create_app
from app.core.db_initializer import ensure_database_ready

def main():
    force = '--force' in sys.argv
    app = create_app()
    with app.app_context():
        success = ensure_database_ready(app, force=force)
        if success:
            print("=======================================================")
            print("🎉 [SUCESSO] Todas as tabelas foram geradas no MySQL!")
            print("ℹ️  Nenhum utilizador foi criado.")
            print("🌐 O fluxo de primeiro utilizador (Setup Wizard) no Frontend")
            print("   está pronto para criar o seu Administrador e Empresa.")
            print("=======================================================\n")
            sys.exit(0)
        else:
            print("❌ Falha na geração das tabelas.")
            sys.exit(1)

if __name__ == '__main__':
    main()
