import threading

class NotificationService:
    """
    Camada de integração desacoplada para envio de notificações e documentos
    (Email, WhatsApp, etc). Preparado para Celery ou Async workers no futuro.
    """
    
    @staticmethod
    def send_invoice_async(venda_id, client_contact, method="email"):
        """
        Envia fatura de forma assíncrona.
        No futuro, isso pode ser um task.delay(venda_id, ...) usando Celery.
        """
        def task():
            print(f"[Notificação Async] Enviando Venda {venda_id} para {client_contact} via {method}...")
            # Lógica real de integração API (SendGrid, Twilio WhatsApp, etc)
            pass
            
        thread = threading.Thread(target=task)
        thread.start()

    @staticmethod
    def send_pedido_async(pedido_id, client_contact, method="email"):
        def task():
            print(f"[Notificação Async] Enviando Pedido {pedido_id} para {client_contact} via {method}...")
            # Integração real
            pass
            
        thread = threading.Thread(target=task)
        thread.start()

