import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle

def generate_pedido_pdf(pedido):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Sabor Imbatível")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Pedido Nº: " + (pedido.numero or ""))
    c.drawString(50, height - 85, "Data: " + (pedido.data_pedido.strftime("%d/%m/%Y %H:%M") if pedido.data_pedido else ""))
    
    c.drawString(50, height - 110, "Dados do Cliente:")
    c.drawString(50, height - 125, f"Cliente: {pedido.cliente.nome if pedido.cliente else 'N/A'}")
    c.drawString(50, height - 140, f"Telefone: {pedido.cliente.telefone if pedido.cliente else 'N/A'}")
    
    data = [["Produto", "Qtd", "P. Unit", "Subtotal"]]
    
    if pedido.itens:
        for item in pedido.itens:
            # Puxar dados do produto
            nome_produto = item.produto.nome if item.produto else "N/A"
            data.append([
                nome_produto,
                str(item.quantidade),
                f"{item.preco_unitario:.2f}",
                f"{(item.quantidade * item.preco_unitario):.2f}"
            ])
            
    table_x = 50
    table_y = height - 200
    
    t = Table(data, colWidths=[250, 50, 80, 80])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    w, h = t.wrap(width - 100, height)
    table_y -= h
    t.drawOn(c, table_x, table_y)
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(width - 200, table_y - 30, f"Total: {pedido.valor_total:.2f} EUR")
    c.drawString(width - 200, table_y - 50, f"Valor Pago: {pedido.valor_pago:.2f} EUR")
    c.drawString(width - 200, table_y - 70, f"Saldo Pendente: {pedido.saldo:.2f} EUR")
    
    c.save()
    buffer.seek(0)
    return buffer

def generate_pedido_receipt(pedido):
    # Receipt layout ~80mm width
    # 80mm is about 226 points
    width = 226
    height = 600 # Flexible height, but let's make it fixed for now
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 20, "Sabor Imbatível")
    
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 35, "Tala-Tona, Luanda")
    c.drawCentredString(width / 2, height - 50, "Tel: +244 923 000 000")
    
    c.line(10, height - 60, width - 10, height - 60)
    
    c.setFont("Helvetica", 9)
    c.drawString(10, height - 75, "Pedido Nº: " + (pedido.numero or ""))
    c.drawString(10, height - 90, "Data: " + (pedido.data_pedido.strftime("%d/%m/%Y %H:%M") if pedido.data_pedido else ""))
    
    c.drawString(10, height - 105, f"Cliente: {pedido.cliente.nome if pedido.cliente else 'N/A'}")
    
    c.line(10, height - 115, width - 10, height - 115)
    
    c.setFont("Helvetica-Bold", 9)
    c.drawString(10, height - 130, "Qtd")
    c.drawString(40, height - 130, "Item")
    c.drawString(width - 50, height - 130, "Total")
    
    c.setFont("Helvetica", 9)
    y = height - 145
    if pedido.itens:
        for item in pedido.itens:
            nome_produto = item.produto.nome if item.produto else "N/A"
            # simple wrap
            nome_str = (nome_produto[:15] + '..') if len(nome_produto) > 15 else nome_produto
            
            c.drawString(10, y, str(item.quantidade))
            c.drawString(40, y, nome_str)
            
            total_item = item.quantidade * item.preco_unitario
            c.drawString(width - 50, y, f"{total_item:.2f}")
            y -= 15
            
    c.line(10, y - 5, width - 10, y - 5)
    
    y -= 20
    c.setFont("Helvetica-Bold", 10)
    c.drawString(10, y, "TOTAL:")
    c.drawString(width - 60, y, f"{pedido.valor_total:.2f} EUR")
    
    y -= 15
    c.setFont("Helvetica", 9)
    c.drawString(10, y, "Valor Pago:")
    c.drawString(width - 60, y, f"{pedido.valor_pago:.2f} EUR")
    
    if pedido.saldo > 0:
        y -= 15
        c.drawString(10, y, "Saldo Restante:")
        c.drawString(width - 60, y, f"{pedido.saldo:.2f} EUR")
    
    y -= 30
    c.drawCentredString(width / 2, y, "Obrigado pela preferência!")
    
    c.save()
    buffer.seek(0)
    return buffer

def generate_venda_pdf(venda):
    buffer = io.BytesIO()
    
    # Create the PDF object
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Sabor Imbatível")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Documento: " + (venda.numero_documento or ""))
    c.drawString(50, height - 85, "Data: " + (venda.created_at.strftime("%d/%m/%Y %H:%M") if venda.created_at else ""))
    
    # Client section
    c.drawString(50, height - 110, "Dados do Cliente:")
    c.drawString(50, height - 125, f"Cliente ID: {venda.cliente_id or 'N/A'}")
    
    # Items Table
    data = [["Descrição", "Qtd", "P. Unit", "Desc", "IVA %", "Subtotal"]]
    
    if venda.itens:
        for item in venda.itens:
            data.append([
                item.descricao,
                str(item.quantidade),
                f"{item.preco_unitario:.2f}",
                f"{item.desconto:.2f}",
                f"{item.taxa_iva:.2f}",
                f"{item.total:.2f}"
            ])
            
    # Position of table
    table_x = 50
    table_y = height - 200
    
    # Create table
    t = Table(data, colWidths=[200, 50, 70, 60, 50, 70])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    w, h = t.wrap(width - 100, height)
    table_y -= h
    t.drawOn(c, table_x, table_y)
    
    # Footer tools
    footer_y = table_y - 40
    c.setFont("Helvetica-Bold", 12)
    c.drawString(300, footer_y, f"Subtotal: {venda.subtotal:.2f}")
    c.drawString(300, footer_y - 20, f"Descontos: {venda.desconto_total:.2f}")
    c.drawString(300, footer_y - 40, f"IVA: {venda.total_iva:.2f}")
    c.drawString(300, footer_y - 60, f"Total a Pagar: {venda.total:.2f}")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, 50, "Documento processado por computador.")
    
    # Finish up
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer
