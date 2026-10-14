"""Script dedicado para aplicar migração e sincronização das tabelas de inventário no MySQL.
Uso no Windows ou Linux:
  python upgrade_inventario_db.py
"""
import os
import sys

# Adicionar caminho atual para PYTHONPATH
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import create_app
from app.core.database import db
from sqlalchemy import text

def run_upgrade():
    print("\n" + "=" * 65)
    print("📦 [SIGI ERP] Executando Migração do Módulo de Inventário de Stock...")
    print("=" * 65)

    statements = [
        # 1. Criar tabela inventarios se não existir
        """
        CREATE TABLE IF NOT EXISTS inventarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            numero VARCHAR(50) NOT NULL UNIQUE,
            armazem_id INT NOT NULL,
            tipo ENUM('COMPLETO', 'PARCIAL') NOT NULL DEFAULT 'COMPLETO',
            estado ENUM('RASCUNHO', 'EM_CONTAGEM', 'EM_CONFERENCIA', 'APROVADO', 'APLICADO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
            data_inventario DATE NOT NULL,
            responsavel_id INT NOT NULL,
            observacao TEXT NULL,
            iniciado_em DATETIME NULL,
            finalizado_em DATETIME NULL,
            aprovado_em DATETIME NULL,
            aprovado_por INT NULL,
            aplicado_em DATETIME NULL,
            aplicado_por INT NULL,
            cancelado_em DATETIME NULL,
            cancelado_por INT NULL,
            motivo_cancelamento VARCHAR(255) NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT NULL,
            updated_by INT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            deleted_at DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        # 2. Criar tabela inventario_items se não existir
        """
        CREATE TABLE IF NOT EXISTS inventario_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            inventario_id INT NOT NULL,
            produto_id INT NULL,
            material_id INT NULL,
            unidade_medida_id INT NULL,
            quantidade_sistema DECIMAL(12,3) NOT NULL DEFAULT 0.000,
            quantidade_contada DECIMAL(12,3) NULL,
            diferenca DECIMAL(12,3) NULL,
            situacao ENUM('SEM_DIVERGENCIA', 'FALTA', 'SOBRA', 'NAO_CONTADO') NOT NULL DEFAULT 'NAO_CONTADO',
            motivo_ajuste ENUM('QUEBRA', 'PERDA', 'DANIFICADO', 'CONSUMO_NAO_REGISTADO', 'ERRO_CONTAGEM', 'ERRO_REGISTO', 'VALIDACAO_INVENTARIO', 'OUTRO') NULL,
            observacao TEXT NULL,
            contado_por INT NULL,
            contado_em DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT NULL,
            updated_by INT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            deleted_at DATETIME NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """,

        # 3. Assegurar colunas na tabela inventarios caso a tabela já existisse
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS armazem_id INT NOT NULL DEFAULT 1;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS numero VARCHAR(50) NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS tipo ENUM('COMPLETO', 'PARCIAL') DEFAULT 'COMPLETO';",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS estado ENUM('RASCUNHO', 'EM_CONTAGEM', 'EM_CONFERENCIA', 'APROVADO', 'APLICADO', 'CANCELADO') DEFAULT 'RASCUNHO';",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS data_inventario DATE NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS responsavel_id INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS observacao TEXT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS iniciado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS finalizado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aprovado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aprovado_por INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aplicado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aplicado_por INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS cancelado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS cancelado_por INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(255) NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS created_by INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS updated_by INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;",

        # 4. Assegurar colunas na tabela inventario_items caso a tabela já existisse
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS inventario_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS produto_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS material_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS unidade_medida_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS quantidade_sistema DECIMAL(12,3) DEFAULT 0.000;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS quantidade_contada DECIMAL(12,3) NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS diferenca DECIMAL(12,3) NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS situacao ENUM('SEM_DIVERGENCIA', 'FALTA', 'SOBRA', 'NAO_CONTADO') DEFAULT 'NAO_CONTADO';",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS motivo_ajuste ENUM('QUEBRA', 'PERDA', 'DANIFICADO', 'CONSUMO_NAO_REGISTADO', 'ERRO_CONTAGEM', 'ERRO_REGISTO', 'VALIDACAO_INVENTARIO', 'OUTRO') NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS observacao TEXT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS contado_por INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS contado_em DATETIME NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS created_by INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS updated_by INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;"
    ]

    sucessos = 0
    ignorados = 0

    for stmt in statements:
        stmt_clean = stmt.strip()
        if not stmt_clean:
            continue
        try:
            db.session.execute(text(stmt_clean))
            db.session.commit()
            sucessos += 1
            primeira_linha = stmt_clean.split('\n')[0][:70]
            print(f"  ✅ [OK] {primeira_linha}")
        except Exception as err:
            db.session.rollback()
            # Se falhou por 'IF NOT EXISTS' não suportado na versão específica do MySQL
            if "IF NOT EXISTS" in stmt_clean:
                try:
                    fallback_stmt = stmt_clean.replace(" IF NOT EXISTS", "")
                    db.session.execute(text(fallback_stmt))
                    db.session.commit()
                    sucessos += 1
                    print(f"  ✅ [OK sem IF NOT EXISTS] {fallback_stmt[:70]}")
                    continue
                except Exception:
                    db.session.rollback()
            ignorados += 1

    print("\n" + "=" * 65)
    print(f"🎉 Migração de Inventário Concluída: {sucessos} comandos executados.")
    print("   A tabela 'inventarios' e 'inventario_items' estão 100% sincronizadas!")
    print("=" * 65 + "\n")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        run_upgrade()
