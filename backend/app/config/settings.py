import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-secret-key-sabor-imbativel')
    
    # Database MySQL
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', 'root')
    MYSQL_HOST = os.environ.get('MYSQL_HOST', 'localhost')
    MYSQL_PORT = os.environ.get('MYSQL_PORT', '3306')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'sigi_db')
    
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 86400 * 30  # 30 days

    # SMTP / Email Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'True').lower() in ('true', '1', 't')
    SMTP_USER = os.environ.get('SMTP_USER', 'suportesaborimbativel@gmail.com')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', 'nink qeqn cpzm dfke')
    SMTP_SENDER_NAME = os.environ.get('SMTP_SENDER_NAME', 'Sabor Imbatível - Sistema de Gestão')
    
    # App URL for emails and links
    APP_URL = os.environ.get('APP_URL', 'https://saborimbativel.pt')

    # SMS / WhatsApp Configuration (Integration placeholders)
    SMS_GATEWAY_URL = os.environ.get('SMS_GATEWAY_URL', '')
    SMS_API_KEY = os.environ.get('SMS_API_KEY', '')
    WHATSAPP_API_URL = os.environ.get('WHATSAPP_API_URL', '')
    WHATSAPP_API_KEY = os.environ.get('WHATSAPP_API_KEY', '')
