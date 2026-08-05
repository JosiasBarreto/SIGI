import threading
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from flask import current_app
from app.config.settings import Config

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Serviço centralizado de envio de notificações e comunicações
    (Email SMTP, SMS e WhatsApp). Operações executadas de forma assíncrona.
    """

    @staticmethod
    def _get_app():
        try:
            return current_app._get_current_object()
        except Exception:
            return None

    @staticmethod
    def send_email_smtp(to_email, subject, html_content, text_content=None, attachments=None):
        """
        Envia email via SMTP utilizando as credenciais configuradas.
        attachments: lista de tuplas (filename, bytes_data, content_type)
        """
        if not to_email:
            logger.warning("[SMTP] Tentativa de envio sem email de destino.")
            return False, "Email de destino não especificado"

        smtp_server = Config.SMTP_SERVER
        smtp_port = Config.SMTP_PORT
        smtp_user = Config.SMTP_USER
        smtp_password = Config.SMTP_PASSWORD
        sender_name = Config.SMTP_SENDER_NAME

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{sender_name} <{smtp_user}>"
        msg['To'] = to_email

        if not text_content:
            text_content = "Consulte este email em um leitor com suporte a HTML."

        part1 = MIMEText(text_content, 'plain', 'utf-8')
        part2 = MIMEText(html_content, 'html', 'utf-8')

        msg.attach(part1)
        msg.attach(part2)

        if attachments:
            for filename, data, content_type in attachments:
                try:
                    att = MIMEApplication(data)
                    att.add_header('Content-Disposition', 'attachment', filename=filename)
                    msg.attach(att)
                except Exception as e:
                    logger.error(f"[SMTP] Erro ao anexar ficheiro {filename}: {e}")

        try:
            if Config.SMTP_USE_TLS:
                server = smtplib.SMTP(smtp_server, smtp_port, timeout=15)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=15)

            # Normalizar password (remover espaços se fornecido como chave de 16 caracteres do Gmail)
            pwd_clean = smtp_password.replace(' ', '').strip() if smtp_password else ''
            server.login(smtp_user, pwd_clean)
            server.sendmail(smtp_user, [to_email], msg.as_string())
            server.quit()

            logger.info(f"[SMTP SUCCESS] Email enviado com sucesso para {to_email} | Assunto: {subject}")
            print(f"✅ [SMTP SUCCESS] Email enviado para {to_email} | Assunto: '{subject}'")
            return True, None
        except Exception as e:
            error_msg = f"Falha ao enviar email via SMTP ({smtp_server}:{smtp_port}): {str(e)}"
            logger.error(f"[SMTP ERROR] {error_msg}")
            print(f"⚠️ [SMTP ERROR] {error_msg}")
            print(f"📧 [EMAIL LOGGED LOCAL] Para: {to_email} | Assunto: {subject}\n{text_content}")
            return False, error_msg

    @staticmethod
    def send_sms_whatsapp(phone, message, channel="sms"):
        """
        Envia notificação via SMS ou WhatsApp através de gateways externos (ex: Twilio / Z-API).
        """
        if not phone:
            return False, "Telefone não especificado"

        print(f"📱 [{channel.upper()} DISPATCH] Para: {phone} | Mensagem: {message}")
        
        gateway_url = Config.WHATSAPP_API_URL if channel == "whatsapp" else Config.SMS_GATEWAY_URL
        api_key = Config.WHATSAPP_API_KEY if channel == "whatsapp" else Config.SMS_API_KEY

        if gateway_url and api_key:
            try:
                import requests
                headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                payload = {"phone": phone, "message": message}
                requests.post(gateway_url, json=payload, headers=headers, timeout=5)
                logger.info(f"[{channel.upper()}] Notificação enviada para {phone}")
                return True, None
            except Exception as e:
                logger.error(f"[{channel.upper()} ERROR] Falha no envio para {phone}: {e}")
                return False, str(e)
        
        return True, None

    # --- CREDENCIAIS DE UTILIZADOR ---
    @staticmethod
    def send_user_credentials_async(user_name, user_email, password, role):
        """
        Envia email com as credenciais de acesso para um novo utilizador criado no sistema.
        """
        app = NotificationService._get_app()

        def task():
            if app:
                with app.app_context():
                    NotificationService._execute_send_user_credentials(user_name, user_email, password, role)
            else:
                NotificationService._execute_send_user_credentials(user_name, user_email, password, role)

        thread = threading.Thread(target=task)
        thread.start()

    @staticmethod
    def _execute_send_user_credentials(user_name, user_email, password, role):
        subject = "Sabor Imbatível - As suas credenciais de acesso ao sistema"
        app_url = Config.APP_URL

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
            .header {{ background-color: #e11d48; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
            .content {{ padding: 32px; }}
            .cred-box {{ background-color: #f8fafc; border-left: 4px solid #e11d48; padding: 16px 20px; margin: 20px 0; border-radius: 4px; }}
            .cred-item {{ margin: 8px 0; font-size: 15px; }}
            .cred-label {{ font-weight: 600; color: #475569; display: inline-block; width: 110px; }}
            .cred-value {{ font-family: monospace; font-size: 16px; font-weight: bold; color: #0f172a; background: #e2e8f0; padding: 2px 8px; border-radius: 4px; }}
            .btn {{ display: inline-block; background-color: #e11d48; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 6px; margin-top: 20px; text-align: center; }}
            .footer {{ background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 13px; color: #64748b; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sabor Imbatível</h1>
              <p style="margin:4px 0 0 0; opacity: 0.9;">Sistema de Gestão Integrado</p>
            </div>
            <div class="content">
              <h2>Bem-vindo(a), {user_name}!</h2>
              <p>Foi criada uma conta de acesso para si no sistema de gestão da <strong>Sabor Imbatível</strong> com o perfil de <strong>{role}</strong>.</p>
              
              <div class="cred-box">
                <div class="cred-item"><span class="cred-label">Email:</span> <span class="cred-value">{user_email}</span></div>
                <div class="cred-item"><span class="cred-label">Senha Inicial:</span> <span class="cred-value">{password}</span></div>
              </div>

              <p>Por razões de segurança, recomendamos que altere a sua senha após o primeiro acesso.</p>
              
              <div style="text-align: center;">
                <a href="{app_url}" class="btn">Aceder ao Sistema</a>
              </div>
            </div>
            <div class="footer">
              <p>Este é um email automático enviado pelo sistema de gestão Sabor Imbatível. Por favor não responda a este endereço.</p>
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"Olá {user_name},\n\nSua conta no Sabor Imbatível foi criada!\nEmail: {user_email}\nSenha: {password}\nPerfil: {role}\nAcesse: {app_url}"
        NotificationService.send_email_smtp(user_email, subject, html_content, text_content)

    # --- RECUPERAÇÃO DE SENHA ---
    @staticmethod
    def send_password_recovery_async(user_name, user_email, temp_password):
        """
        Envia email de recuperação de senha com a nova senha temporária.
        """
        app = NotificationService._get_app()

        def task():
            if app:
                with app.app_context():
                    NotificationService._execute_send_password_recovery(user_name, user_email, temp_password)
            else:
                NotificationService._execute_send_password_recovery(user_name, user_email, temp_password)

        thread = threading.Thread(target=task)
        thread.start()

    @staticmethod
    def _execute_send_password_recovery(user_name, user_email, temp_password):
        subject = "Sabor Imbatível - Recuperação de Senha de Acesso"
        app_url = Config.APP_URL

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }}
            .header {{ background-color: #0284c7; color: #ffffff; padding: 24px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 24px; font-weight: 700; }}
            .content {{ padding: 32px; }}
            .pwd-box {{ background-color: #f0f9ff; border: 2px dashed #0284c7; padding: 20px; text-align: center; margin: 24px 0; border-radius: 8px; }}
            .pwd-value {{ font-family: monospace; font-size: 26px; font-weight: bold; letter-spacing: 2px; color: #0369a1; }}
            .btn {{ display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 6px; margin-top: 16px; text-align: center; }}
            .footer {{ background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 13px; color: #64748b; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Sabor Imbatível</h1>
              <p style="margin:4px 0 0 0; opacity: 0.9;">Recuperação de Acesso</p>
            </div>
            <div class="content">
              <h2>Olá, {user_name}!</h2>
              <p>Recebemos uma solicitação de recuperação de senha para o seu utilizador (<strong>{user_email}</strong>).</p>
              
              <p>A sua nova <strong>senha de acesso temporária</strong> é:</p>
              
              <div class="pwd-box">
                <div class="pwd-value">{temp_password}</div>
              </div>

              <p>Após efetuar o login com a senha temporária acima, aceda ao seu perfil para alterar a sua senha para uma da sua preferência.</p>
              
              <div style="text-align: center;">
                <a href="{app_url}" class="btn">Entrar no Sistema</a>
              </div>
            </div>
            <div class="footer">
              <p>Se não solicitou esta recuperação, entre em contacto imediatamente com o administrador do sistema.</p>
            </div>
          </div>
        </body>
        </html>
        """

        text_content = f"Olá {user_name},\n\nSua senha temporária de acesso é: {temp_password}\nAcesse o sistema e altere sua senha em: {app_url}"
        NotificationService.send_email_smtp(user_email, subject, html_content, text_content)

    # --- ENVIO DE FATURAS E RECIBOS ---
    @staticmethod
    def send_invoice_async(venda_id, client_contact, method="email"):
        """
        Envia fatura/venda de forma assíncrona com PDF anexo.
        """
        app = NotificationService._get_app()

        def task():
            if app:
                with app.app_context():
                    NotificationService._execute_send_invoice(venda_id, client_contact, method)
            else:
                NotificationService._execute_send_invoice(venda_id, client_contact, method)

        thread = threading.Thread(target=task)
        thread.start()

    @staticmethod
    def _execute_send_invoice(venda_id, client_contact, method="email"):
        try:
            from app.services.comercial_service import ComercialService
            from app.services.pdf_generator import generate_venda_pdf

            comercial_service = ComercialService()
            venda = comercial_service.get_venda(venda_id)
            if not venda:
                logger.error(f"[NOTIFICAÇÃO] Venda {venda_id} não encontrada para envio de fatura.")
                return

            cliente_nome = "Estimado Cliente"
            if venda.pedido and venda.pedido.cliente:
                cliente_nome = venda.pedido.cliente.nome
            elif getattr(venda, 'cliente_id', None):
                from app.models.cliente import Cliente
                c = Cliente.query.get(venda.cliente_id)
                if c: cliente_nome = c.nome

            doc_numero = venda.numero_documento or f"FAT-{venda.id}"
            total_formatted = f"{float(venda.total or 0):.2f} STN"

            if method == "email":
                pdf_buffer = generate_venda_pdf(venda)
                pdf_bytes = pdf_buffer.getvalue()
                filename = f"Fatura_{doc_numero.replace('/', '_')}.pdf"

                subject = f"Sabor Imbatível - Fatura {doc_numero}"

                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
                    .card {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }}
                    .top {{ background-color: #15803d; color: white; padding: 20px; text-align: center; }}
                    .body {{ padding: 24px; }}
                    .total-box {{ background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 16px 0; font-size: 18px; font-weight: bold; color: #166534; }}
                    .footer {{ background: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b; }}
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="top">
                      <h2 style="margin:0;">Sabor Imbatível</h2>
                      <p style="margin:4px 0 0 0;">Fatura de Compra</p>
                    </div>
                    <div class="body">
                      <p>Olá <strong>{cliente_nome}</strong>,</p>
                      <p>Agradecemos a sua preferência! Enviamos em anexo a sua fatura/documento comercial relativo ao documento <strong>{doc_numero}</strong>.</p>
                      
                      <div class="total-box">
                        Valor Total: {total_formatted}
                      </div>

                      <p>O documento em formato PDF encontra-se anexado a esta mensagem.</p>
                    </div>
                    <div class="footer">
                      Sabor Imbatível - Pastelaria, Padaria & Restauração | Todos os direitos reservados.
                    </div>
                  </div>
                </body>
                </html>
                """

                text_content = f"Olá {cliente_nome},\n\nSua fatura {doc_numero} no valor de {total_formatted} está em anexo em formato PDF."
                attachments = [(filename, pdf_bytes, 'application/pdf')]

                NotificationService.send_email_smtp(client_contact, subject, html_content, text_content, attachments)

            else:
                msg_txt = f"Olá {cliente_nome}, a sua fatura {doc_numero} da Sabor Imbatível no valor de {total_formatted} foi emitida com sucesso. Obrigado pela preferência!"
                NotificationService.send_sms_whatsapp(client_contact, msg_txt, channel=method)

        except Exception as e:
            logger.error(f"[NOTIFICAÇÃO ERROR] Erro no processamento da fatura {venda_id}: {e}")

    # --- ENVIO DE PEDIDOS ---
    @staticmethod
    def send_pedido_async(pedido_id, client_contact, method="email", trigger="creation"):
        """
        Envia detalhes do pedido para o cliente (confirmação ou alteração de estado).
        """
        app = NotificationService._get_app()

        def task():
            if app:
                with app.app_context():
                    NotificationService._execute_send_pedido(pedido_id, client_contact, method, trigger)
            else:
                NotificationService._execute_send_pedido(pedido_id, client_contact, method, trigger)

        thread = threading.Thread(target=task)
        thread.start()

    @staticmethod
    def _execute_send_pedido(pedido_id, client_contact, method="email", trigger="creation"):
        try:
            from app.services.pedido_service import PedidoService
            from app.services.pdf_generator import generate_pedido_pdf

            pedido_service = PedidoService()
            pedido = pedido_service.pedido_repo.get_by_id(pedido_id)
            if not pedido:
                return

            cliente_nome = pedido.cliente.nome if pedido.cliente else "Estimado Cliente"
            estado_str = pedido.estado.value if hasattr(pedido.estado, 'value') else str(pedido.estado)
            numero_pedido = pedido.numero
            total_formatted = f"{float(pedido.valor_total or 0):.2f} STN"

            itens_rows = ""
            for item in (pedido.itens or []):
                itens_rows += f"<tr><td style='padding:8px;border-bottom:1px solid #eee;'>{item.descricao}</td><td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>{item.quantidade}</td><td style='padding:8px;border-bottom:1px solid #eee;text-align:right;'>{float(item.total or 0):.2f} STN</td></tr>"

            if method == "email":
                pdf_buffer = generate_pedido_pdf(pedido)
                pdf_bytes = pdf_buffer.getvalue()
                filename = f"Pedido_{numero_pedido}.pdf"

                subject = f"Sabor Imbatível - Pedido {numero_pedido} [{estado_str}]"

                html_content = f"""
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body {{ font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
                    .card {{ max-width: 650px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }}
                    .top {{ background-color: #0284c7; color: white; padding: 20px; text-align: center; }}
                    .body {{ padding: 24px; }}
                    .badge {{ background-color: #e0f2fe; color: #0369a1; padding: 4px 12px; border-radius: 12px; font-weight: bold; display: inline-block; }}
                    table {{ width: 100%; border-collapse: collapse; margin: 16px 0; }}
                    th {{ background-color: #f1f5f9; padding: 8px; text-align: left; font-size: 13px; color: #475569; }}
                    .footer {{ background: #f1f5f9; padding: 12px; text-align: center; font-size: 12px; color: #64748b; }}
                  </style>
                </head>
                <body>
                  <div class="card">
                    <div class="top">
                      <h2 style="margin:0;">Sabor Imbatível</h2>
                      <p style="margin:4px 0 0 0;">Confirmação de Pedido #{numero_pedido}</p>
                    </div>
                    <div class="body">
                      <p>Olá <strong>{cliente_nome}</strong>,</p>
                      <p>O seu pedido <strong>#{numero_pedido}</strong> foi registado com sucesso. Estado atual: <span class="badge">{estado_str}</span></p>

                      <h3>Resumo dos Itens:</h3>
                      <table>
                        <thead>
                          <tr><th>Descrição</th><th style="text-align:center;">Qtd</th><th style="text-align:right;">Total</th></tr>
                        </thead>
                        <tbody>
                          {itens_rows}
                        </tbody>
                      </table>

                      <p style="text-align:right; font-size: 18px; font-weight: bold; color: #0f172a;">Total do Pedido: {total_formatted}</p>
                      <p>O comprovativo oficial em PDF encontra-se em anexo a este email.</p>
                    </div>
                    <div class="footer">
                      Sabor Imbatível | Obrigado pela sua escolha!
                    </div>
                  </div>
                </body>
                </html>
                """

                text_content = f"Olá {cliente_nome},\n\nSeu pedido {numero_pedido} foi registado. Estado: {estado_str}. Total: {total_formatted}."
                attachments = [(filename, pdf_bytes, 'application/pdf')]

                NotificationService.send_email_smtp(client_contact, subject, html_content, text_content, attachments)
            else:
                msg_txt = f"Olá {cliente_nome}, o seu pedido #{numero_pedido} na Sabor Imbatível está no estado: {estado_str}. Valor total: {total_formatted}."
                NotificationService.send_sms_whatsapp(client_contact, msg_txt, channel=method)

        except Exception as e:
            logger.error(f"[NOTIFICAÇÃO ERROR] Erro no envio do pedido {pedido_id}: {e}")

    # --- BOAS-VINDAS A NOVO CLIENTE ---
    @staticmethod
    def send_cliente_welcome_async(cliente_nome, cliente_email, cliente_telefone, method="both"):
        """
        Envia email e SMS/WhatsApp de boas-vindas para novos clientes.
        """
        app = NotificationService._get_app()

        def task():
            if app:
                with app.app_context():
                    NotificationService._execute_send_cliente_welcome(cliente_nome, cliente_email, cliente_telefone, method)
            else:
                NotificationService._execute_send_cliente_welcome(cliente_nome, cliente_email, cliente_telefone, method)

        thread = threading.Thread(target=task)
        thread.start()

    @staticmethod
    def _execute_send_cliente_welcome(cliente_nome, cliente_email, cliente_telefone, method="both"):
        if cliente_email and method in ("email", "both"):
            subject = "Bem-vindo(a) à Sabor Imbatível!"
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {{ font-family: Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }}
                .card {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #e2e8f0; padding: 32px; }}
                .header {{ color: #e11d48; font-size: 24px; font-weight: bold; margin-bottom: 16px; }}
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">Sabor Imbatível</div>
                <h2>Olá, {cliente_nome}!</h2>
                <p>Seja muito bem-vindo(a) à <strong>Sabor Imbatível</strong>!</p>
                <p>É um enorme prazer tê-lo(a) como nosso cliente. Estamos prontos para oferecer os melhores produtos de padaria, pastelaria e restauração com a máxima qualidade e dedicação.</p>
                <p>Se precisar de realizar encomendas ou tirar qualquer dúvida, a nossa equipa está inteiramente à sua disposição.</p>
                <br>
                <p>Com os melhores cumprimentos,<br><strong>Equipa Sabor Imbatível</strong></p>
              </div>
            </body>
            </html>
            """
            text_content = f"Olá {cliente_nome},\n\nSeja bem-vindo(a) à Sabor Imbatível! É um prazer tê-lo(a) como nosso cliente."
            NotificationService.send_email_smtp(cliente_email, subject, html_content, text_content)

        if cliente_telefone and method in ("sms", "whatsapp", "both"):
            sms_msg = f"Olá {cliente_nome}, bem-vindo(a) à Sabor Imbatível! É um prazer ter-lhe como nosso cliente. Obrigado pela preferência!"
            NotificationService.send_sms_whatsapp(cliente_telefone, sms_msg, channel="sms" if method != "whatsapp" else "whatsapp")
