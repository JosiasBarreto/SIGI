import os
import subprocess
import shutil
from datetime import datetime
from flask import current_app


class BackupService:
    """Backups SQL completos, sem expor credenciais ao cliente."""
    def _dir(self):
        path = current_app.config['BACKUP_DIR']
        os.makedirs(path, exist_ok=True)
        return path

    def _mysql_args(self, executable):
        cfg = current_app.config
        return [executable, '-h', cfg['MYSQL_HOST'], '-P', str(cfg['MYSQL_PORT']), '-u', cfg['MYSQL_USER']]

    def _resolve_binary(self, configured_name, alternatives):
        """Resolve o executável no PATH ou nas instalações habituais do Windows."""
        candidates = [configured_name, *alternatives]
        roots = [
            os.environ.get('ProgramFiles', r'C:\Program Files'),
            os.environ.get('ProgramFiles(x86)', r'C:\Program Files (x86)'),
            r'C:\xampp\mysql\bin', r'C:\wamp64\bin\mysql\mysql8.0.0\bin',
        ]
        for candidate in candidates:
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
        raise FileNotFoundError(
            f'Executável não encontrado: {configured_name}. Configure MYSQLDUMP_BIN/MYSQL_BIN ou instale o cliente MySQL.'
        )

    def create(self):
        cfg = current_app.config
        filename = f"sigi_completo_{datetime.utcnow():%Y%m%d_%H%M%S}.sql"
        path = os.path.join(self._dir(), filename)
        dump_bin = self._resolve_binary(cfg['MYSQLDUMP_BIN'], ['mysqldump.exe', 'mariadb-dump', 'mariadb-dump.exe'])
        command = self._mysql_args(dump_bin) + [
            '--single-transaction', '--routines', '--triggers', '--events',
            '--add-drop-table', cfg['MYSQL_DB']
        ]
        env = {**os.environ, 'MYSQL_PWD': cfg['MYSQL_PASSWORD']}
        try:
            with open(path, 'wb') as output:
                subprocess.run(command, stdout=output, stderr=subprocess.PIPE, env=env, check=True, timeout=300)
        except Exception:
            if os.path.exists(path):
                os.remove(path)
            raise
        return {'filename': filename, 'path': path, 'size': os.path.getsize(path), 'created_at': datetime.utcnow().isoformat()}

    def list(self):
        files = []
        for name in os.listdir(self._dir()):
            if name.startswith('sigi_completo_') and name.endswith('.sql'):
                path = os.path.join(self._dir(), name)
                files.append({'filename': name, 'size': os.path.getsize(path), 'created_at': datetime.utcfromtimestamp(os.path.getmtime(path)).isoformat()})
        return sorted(files, key=lambda item: item['created_at'], reverse=True)

    def restore(self, uploaded_file):
        if not uploaded_file or not uploaded_file.filename.endswith('.sql'):
            raise ValueError('Envie um ficheiro .sql de backup válido.')
        # Apenas SQL recebido em upload, nunca usa o nome do cliente como caminho.
        content = uploaded_file.read()
        if not content or len(content) > 1024 * 1024 * 1024:
            raise ValueError('Backup vazio ou acima de 1 GB.')
        cfg = current_app.config
        mysql_bin = self._resolve_binary(cfg['MYSQL_BIN'], ['mysql.exe', 'mariadb', 'mariadb.exe'])
        command = self._mysql_args(mysql_bin) + [cfg['MYSQL_DB']]
        env = {**os.environ, 'MYSQL_PWD': cfg['MYSQL_PASSWORD']}
        subprocess.run(command, input=content, stderr=subprocess.PIPE, env=env, check=True, timeout=600)


backup_service = BackupService()
