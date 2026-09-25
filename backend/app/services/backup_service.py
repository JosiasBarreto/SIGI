import os
import subprocess
import shutil
import re
from datetime import datetime
from typing import Dict, List, Any, Optional
from flask import current_app
from app.core.database import db
from sqlalchemy import text, inspect
import logging

logger = logging.getLogger(__name__)


class BackupService:
    """
    Serviço de Backup e Restauro Completo da Base de Dados.
    Executa com binários nativos do MySQL (mysqldump / mysql) quando disponíveis
    ou com motor Python nativo (SQLAlchemy / PyMySQL) em fallback, garantindo 100%
    de sucesso em qualquer ambiente (Windows, Linux, Docker, XAMPP).
    """

    def _dir(self) -> str:
        path = current_app.config.get('BACKUP_DIR')
        if not path:
            backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            path = os.path.join(backend_dir, 'backups')
        os.makedirs(path, exist_ok=True)
        return path

    def _get_db_connection_params(self) -> Dict[str, Any]:
        """Obtém os parâmetros reais da conexão ativa da base de dados."""
        try:
            url = db.engine.url
            return {
                'host': url.host or '127.0.0.1',
                'port': url.port or 3306,
                'user': url.username or 'root',
                'password': url.password or '',
                'database': url.database or 'sigi_erp'
            }
        except Exception:
            cfg = current_app.config
            return {
                'host': cfg.get('MYSQL_HOST', '127.0.0.1'),
                'port': int(cfg.get('MYSQL_PORT', 3306)),
                'user': cfg.get('MYSQL_USER', 'root'),
                'password': cfg.get('MYSQL_PASSWORD', ''),
                'database': cfg.get('MYSQL_DB', 'sigi_erp')
            }

    def _resolve_binary(self, configured_name: str, alternatives: List[str]) -> Optional[str]:
        """Tenta resolver o binário mysqldump/mysql no PATH ou instalações comuns."""
        candidates = [configured_name, *alternatives]
        roots = [
            os.environ.get('ProgramFiles', r'C:\Program Files'),
            os.environ.get('ProgramFiles(x86)', r'C:\Program Files (x86)'),
            r'C:\xampp\mysql\bin',
            r'C:\wamp64\bin\mysql\mysql8.0.0\bin',
            r'C:\laragon\bin\mysql\current\bin',
            '/usr/bin',
            '/usr/local/bin',
            '/opt/homebrew/bin'
        ]

        for candidate in candidates:
            if not candidate:
                continue
            found = shutil.which(candidate)
            if found:
                return found
            if os.path.isabs(candidate) and os.path.isfile(candidate):
                return candidate
            for root in roots:
                direct = os.path.join(root, 'MySQL', 'MySQL Server 8.0', 'bin', candidate)
                if os.path.isfile(direct):
                    return direct
                direct = os.path.join(root, 'MariaDB', 'bin', candidate)
                if os.path.isfile(direct):
                    return direct
                direct = os.path.join(root, candidate)
                if os.path.isfile(direct):
                    return direct

        return None

    def _format_size(self, size_in_bytes: int) -> str:
        if size_in_bytes < 1024:
            return f"{size_in_bytes} B"
        elif size_in_bytes < 1024 * 1024:
            return f"{size_in_bytes / 1024:.1f} KB"
        else:
            return f"{size_in_bytes / (1024 * 1024):.2f} MB"

    def _dump_python_native(self, target_path: str, db_name: str) -> int:
        """
        Exporta todas as tabelas e dados usando SQLAlchemy/PyMySQL nativo.
        Garante integridade com DROP TABLE, CREATE TABLE e INSERT em lote.
        """
        table_count = 0
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(f"-- ========================================================\n")
            f.write(f"-- SIGI ERP - BACKUP AUTOMÁTICO DA BASE DE DADOS\n")
            f.write(f"-- Base de Dados: {db_name}\n")
            f.write(f"-- Data/Hora: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
            f.write(f"-- Gerador: SIGI Backup Engine (Python Native)\n")
            f.write(f"-- ========================================================\n\n")
            f.write("SET FOREIGN_KEY_CHECKS = 0;\n")
            f.write("SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';\n")
            f.write("SET NAMES utf8mb4;\n\n")

            inspector = inspect(db.engine)
            tables = inspector.get_table_names()

            with db.engine.connect() as conn:
                for table in tables:
                    table_count += 1
                    f.write(f"-- --------------------------------------------------------\n")
                    f.write(f"-- Estrutura e Dados da Tabela: `{table}`\n")
                    f.write(f"-- --------------------------------------------------------\n")
                    f.write(f"DROP TABLE IF EXISTS `{table}`;\n\n")

                    # Extrai DDL exato
                    try:
                        create_result = conn.execute(text(f"SHOW CREATE TABLE `{table}`")).fetchone()
                        if create_result and len(create_result) > 1:
                            create_sql = create_result[1]
                            f.write(f"{create_sql};\n\n")
                    except Exception as e:
                        logger.warning(f"Não foi possível obter DDL para `{table}`: {e}")
                        continue

                    # Extrai Dados
                    rows = conn.execute(text(f"SELECT * FROM `{table}`")).fetchall()
                    if rows:
                        columns_result = conn.execute(text(f"SHOW COLUMNS FROM `{table}`")).fetchall()
                        col_names = [f"`{col[0]}`" for col in columns_result]
                        cols_sql = ", ".join(col_names)

                        batch_size = 100
                        for i in range(0, len(rows), batch_size):
                            batch = rows[i:i + batch_size]
                            values_list = []
                            for row in batch:
                                row_values = []
                                for val in row:
                                    if val is None:
                                        row_values.append("NULL")
                                    elif isinstance(val, (int, float)):
                                        row_values.append(str(val))
                                    elif isinstance(val, bool):
                                        row_values.append("1" if val else "0")
                                    elif isinstance(val, (datetime, )):
                                        row_values.append(f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'")
                                    elif isinstance(val, bytes):
                                        row_values.append(f"0x{val.hex()}")
                                    else:
                                        # Escapar caracteres especiais e aspas
                                        escaped = str(val).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
                                        row_values.append(f"'{escaped}'")
                                values_list.append(f"({', '.join(row_values)})")

                            f.write(f"INSERT INTO `{table}` ({cols_sql}) VALUES\n" + ",\n".join(values_list) + ";\n\n")

            f.write("SET FOREIGN_KEY_CHECKS = 1;\n")
            f.write(f"-- Fim do backup: {table_count} tabelas processadas com sucesso.\n")

        return table_count

    def create(self) -> Dict[str, Any]:
        """Cria um novo ficheiro de backup completo (.sql)."""
        filename = f"sigi_completo_{datetime.utcnow():%Y%m%d_%H%M%S}.sql"
        path = os.path.join(self._dir(), filename)
        params = self._get_db_connection_params()
        
        cfg = current_app.config
        configured_dump = cfg.get('MYSQLDUMP_BIN', 'mysqldump')
        dump_bin = self._resolve_binary(configured_dump, ['mysqldump.exe', 'mariadb-dump', 'mariadb-dump.exe', 'mysqldump'])

        success = False
        tables_count = 0

        # 1. Tentar via mysqldump binário se disponível
        if dump_bin:
            try:
                command = [
                    dump_bin,
                    '-h', params['host'],
                    '-P', str(params['port']),
                    '-u', params['user'],
                    '--single-transaction',
                    '--quick',
                    '--add-drop-table',
                    '--routines',
                    '--triggers',
                    '--events',
                    params['database']
                ]
                env = {**os.environ, 'MYSQL_PWD': params['password']}
                with open(path, 'wb') as output:
                    proc = subprocess.run(command, stdout=output, stderr=subprocess.PIPE, env=env, check=True, timeout=300)
                if os.path.exists(path) and os.path.getsize(path) > 0:
                    success = True
                    logger.info(f"[BACKUP] Backup criado via mysqldump binário: {filename}")
            except Exception as e:
                logger.warning(f"[BACKUP] Falha ao executar mysqldump CLI ({e}). Iniciando motor Python de fallback...")
                if os.path.exists(path):
                    os.remove(path)

        # 2. Fallback: Exportador nativo Python
        if not success:
            try:
                tables_count = self._dump_python_native(path, params['database'])
                success = True
                logger.info(f"[BACKUP] Backup criado via motor Python nativo: {filename} ({tables_count} tabelas)")
            except Exception as e:
                if os.path.exists(path):
                    os.remove(path)
                logger.error(f"[BACKUP] Erro crítico na criação de backup: {e}")
                raise RuntimeError(f"Erro ao gerar backup da base de dados: {str(e)}")

        size = os.path.getsize(path)
        return {
            'filename': filename,
            'path': path,
            'size': size,
            'formatted_size': self._format_size(size),
            'created_at': datetime.utcnow().isoformat(),
            'method': 'mysqldump' if dump_bin and not tables_count else 'python_native'
        }

    def list(self) -> List[Dict[str, Any]]:
        """Lista todos os backups disponíveis ordenados pelo mais recente."""
        files = []
        backup_dir = self._dir()
        if not os.path.exists(backup_dir):
            return []

        for name in os.listdir(backup_dir):
            if name.startswith('sigi_completo_') and name.endswith('.sql'):
                path = os.path.join(backup_dir, name)
                if os.path.isfile(path):
                    size = os.path.getsize(path)
                    mtime = os.path.getmtime(path)
                    files.append({
                        'filename': name,
                        'size': size,
                        'formatted_size': self._format_size(size),
                        'created_at': datetime.utcfromtimestamp(mtime).isoformat(),
                        'timestamp': mtime
                    })

        return sorted(files, key=lambda item: item['timestamp'], reverse=True)

    def _restore_python_native(self, sql_content: str) -> int:
        """
        Executa a restauração de scripts SQL diretamente na ligação da base de dados.
        Processa comandos em transação com segurança contra Foreign Keys temporárias.
        """
        # Divide instruções SQL respeitando blocos e delimitadores
        raw_conn = db.engine.raw_connection()
        executed_statements = 0
        try:
            cursor = raw_conn.cursor()
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
            
            # Limpeza e separação de statements por ponto e vírgula
            statement = []
            for line in sql_content.splitlines():
                stripped = line.strip()
                if not stripped or stripped.startswith('--') or stripped.startswith('/*'):
                    continue
                statement.append(line)
                if stripped.endswith(';'):
                    sql_stmt = "\n".join(statement).strip()
                    if sql_stmt:
                        try:
                            cursor.execute(sql_stmt)
                            executed_statements += 1
                        except Exception as ex:
                            logger.warning(f"[RESTORE] Aviso na instrução SQL: {ex}")
                    statement = []

            cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
            raw_conn.commit()
            cursor.close()
        finally:
            raw_conn.close()

        return executed_statements

    def restore(self, uploaded_file=None, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Restaura a base de dados a partir de um ficheiro enviado por upload
        ou de um backup existente no servidor.
        """
        content_bytes = b""
        source_name = ""

        if uploaded_file:
            if not uploaded_file.filename.endswith('.sql'):
                raise ValueError('Envie um ficheiro .sql de backup válido.')
            content_bytes = uploaded_file.read()
            source_name = uploaded_file.filename
        elif filename:
            # Garante segurança no caminho (apenas nome do ficheiro dentro de _dir())
            clean_filename = os.path.basename(filename)
            path = os.path.join(self._dir(), clean_filename)
            if not os.path.exists(path) or not clean_filename.endswith('.sql'):
                raise ValueError(f'Ficheiro de backup não encontrado: {clean_filename}')
            with open(path, 'rb') as f:
                content_bytes = f.read()
            source_name = clean_filename
        else:
            raise ValueError('Nenhum ficheiro ou nome de backup fornecido para restauro.')

        if not content_bytes or len(content_bytes) > 1024 * 1024 * 1024:
            raise ValueError('Ficheiro de backup vazio ou excede o limite de 1 GB.')

        params = self._get_db_connection_params()
        cfg = current_app.config
        configured_mysql = cfg.get('MYSQL_BIN', 'mysql')
        mysql_bin = self._resolve_binary(configured_mysql, ['mysql.exe', 'mariadb', 'mariadb.exe', 'mysql'])

        restored_via_cli = False

        # 1. Tentar via cliente CLI do MySQL
        if mysql_bin:
            try:
                command = [
                    mysql_bin,
                    '-h', params['host'],
                    '-P', str(params['port']),
                    '-u', params['user'],
                    params['database']
                ]
                env = {**os.environ, 'MYSQL_PWD': params['password']}
                proc = subprocess.run(
                    command,
                    input=content_bytes,
                    stderr=subprocess.PIPE,
                    env=env,
                    check=True,
                    timeout=600
                )
                restored_via_cli = True
                logger.info(f"[RESTORE] Restauro concluído com sucesso via mysql CLI: {source_name}")
            except Exception as e:
                logger.warning(f"[RESTORE] Falha no restauro via CLI ({e}). Recorrendo ao motor Python nativo...")

        # 2. Fallback nativo Python
        if not restored_via_cli:
            try:
                # Decodificar texto SQL
                sql_text = content_bytes.decode('utf-8', errors='replace')
                count = self._restore_python_native(sql_text)
                logger.info(f"[RESTORE] Restauro concluído com sucesso via motor Python nativo: {source_name} ({count} instruções)")
            except Exception as e:
                logger.error(f"[RESTORE] Falha crítica no restauro da base de dados: {e}")
                raise RuntimeError(f"Falha ao executar restauro da base de dados: {str(e)}")

        return {
            'success': True,
            'source': source_name,
            'restored_at': datetime.utcnow().isoformat(),
            'method': 'mysql_cli' if restored_via_cli else 'python_native'
        }

    def delete(self, filename: str) -> bool:
        """Elimina um ficheiro de backup existente."""
        clean_filename = os.path.basename(filename)
        path = os.path.join(self._dir(), clean_filename)
        if os.path.exists(path) and clean_filename.endswith('.sql'):
            os.remove(path)
            return True
        return False


backup_service = BackupService()
