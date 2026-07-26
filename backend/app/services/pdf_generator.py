import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from app.models.empresa import Empresa

def _get_empresa_info():
    empresa = Empresa.query.first()
    if empresa:
        return {
            "nome": empresa.nome,
            "localizacao": empresa.localizacao or "",
            "telefone": empresa.telefone or empresa.telemoveis or "",
            "nif": empresa.nif or "",
            "moeda": empresa.moeda or "STN"
        }
    return {
        "nome": "Empresa Não Configurada",
        "localizacao": "",
        "telefone": "",
        "nif": "",
        "moeda": "STN"
    }

def generate_pedido_pdf(pedido):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    empresa = _get_empresa_info()
    moeda = empresa["moeda"]
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, empresa["nome"])
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, f"Endereço: {empresa['localizacao']}")
    c.drawString(50, height - 85, f"Tel: {empresa['telefone']}")
    if empresa['nif']:
        c.drawString(50, height - 100, f"NIF: {empresa['nif']}")
    
    y_doc_info = height - 70
    c.drawString(width - 200, y_doc_info, "Pedido Nº: " + (pedido.numero or ""))
    c.drawString(width - 200, y_doc_info - 15, "Data: " + (pedido.data_pedido.strftime("%d/%m/%Y %H:%M") if pedido.data_pedido else ""))
    
    c.drawString(50, height - 130, "Dados do Cliente:")
    c.drawString(50, height - 145, f"Cliente: {pedido.cliente.nome if pedido.cliente else 'Consumidor Final'}")
    c.drawString(50, height - 160, f"Telefone: {pedido.cliente.telefone if pedido.cliente else 'N/A'}")
    
    data = [["Produto", "Qtd", f"P. Unit ({moeda})", "Desc", "IVA %", f"Subtotal ({moeda})", f"Total IVA ({moeda})", f"Total ({moeda})"]]
    
    if pedido.itens:
        for item in pedido.itens:
            produto = None
            if item.produto_id:
                from app.models.produto import Produto
                produto = Produto.query.get(item.produto_id)
                
            nome_produto = produto.nome if produto else "N/A"
            unidade = produto.unidade_medida.sigla if (produto and produto.unidade_medida) else "un"
            qtd_str = f"{item.quantidade} {unidade}"
            
            preco = float(item.preco_unitario)
            desc = float(item.desconto) if hasattr(item, 'desconto') and item.desconto else 0.0
            iva_perc = float(item.taxa_iva) if hasattr(item, 'taxa_iva') and item.taxa_iva else 0.0
            
            subtotal = (float(item.quantidade) * preco) - desc
            total_iva = subtotal * (iva_perc / 100)
            total = subtotal + total_iva
            
            data.append([
                nome_produto,
                qtd_str,
                f"{preco:.2f}",
                f"{desc:.2f}",
                f"{iva_perc:.1f}%",
                f"{subtotal:.2f}",
                f"{total_iva:.2f}",
                f"{total:.2f}"
            ])

    table_x = 40
    table_y = height - 200
    
    # 8 columns -> total width ~ 515
    col_widths = [140, 50, 65, 45, 40, 60, 60, 55]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    w, h = t.wrap(width - 80, height)
    table_y -= h
    t.drawOn(c, table_x, table_y)
    
    c.setFont("Helvetica-Bold", 10)
    subt = getattr(pedido, 'subtotal', 0) or 0
    desc_total = getattr(pedido, 'desconto_total', 0) or 0
    iva_total = getattr(pedido, 'total_iva', 0) or 0
    
    footer_x = width - 150
    footer_y = table_y - 20
    
    c.drawString(footer_x - 50, footer_y, "Subtotal:")
    c.drawString(footer_x + 30, footer_y, f"{subt:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 15, "Descontos:")
    c.drawString(footer_x + 30, footer_y - 15, f"{desc_total:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 30, "IVA:")
    c.drawString(footer_x + 30, footer_y - 30, f"{iva_total:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 45, "Total:")
    c.drawString(footer_x + 30, footer_y - 45, f"{pedido.valor_total:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 60, "Valor Pago:")
    c.drawString(footer_x + 30, footer_y - 60, f"{pedido.valor_pago:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 75, "Saldo Pendente:")
    c.drawString(footer_x + 30, footer_y - 75, f"{pedido.saldo:.2f} {moeda}")
    
    c.save()
    buffer.seek(0)
    return buffer

def generate_pedido_receipt(pedido):
    width = 226
    height = 600
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    empresa = _get_empresa_info()
    moeda = empresa["moeda"]
    
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 20, empresa["nome"])
    
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 35, empresa["localizacao"])
    c.drawCentredString(width / 2, height - 50, f"Tel: {empresa['telefone']}")
    if empresa['nif']:
        c.drawCentredString(width / 2, height - 65, f"NIF: {empresa['nif']}")
    
    y = height - 80 if empresa['nif'] else height - 65
    
    c.line(10, y, width - 10, y)
    y -= 15
    
    c.setFont("Helvetica", 9)
    c.drawString(10, y, "Pedido Nº: " + (pedido.numero or ""))
    y -= 15
    c.drawString(10, y, "Data: " + (pedido.data_pedido.strftime("%d/%m/%Y %H:%M") if pedido.data_pedido else ""))
    y -= 15
    
    c.drawString(10, y, f"Cliente: {pedido.cliente.nome if pedido.cliente else 'Consumidor Final'}")
    y -= 10
    
    c.line(10, y, width - 10, y)
    y -= 15
    
    c.setFont("Helvetica-Bold", 9)
    c.drawString(10, y, "Qtd")
    c.drawString(40, y, "Item")
    c.drawString(width - 50, y, "Total")
    
    c.setFont("Helvetica", 9)
    y -= 15
    if pedido.itens:
        for item in pedido.itens:
            produto = None
            if item.produto_id:
                from app.models.produto import Produto
                produto = Produto.query.get(item.produto_id)
                
            nome_produto = produto.nome if produto else "N/A"
            nome_str = (nome_produto[:15] + '..') if len(nome_produto) > 15 else nome_produto
            
            unidade = produto.unidade_medida.sigla if (produto and produto.unidade_medida) else "un"
            qtd_str = f"{item.quantidade}{unidade}"
            
            c.drawString(10, y, qtd_str)
            c.drawString(40, y, nome_str)
            
            total_item = float(item.total) if hasattr(item, 'total') and item.total else (float(item.quantidade) * float(item.preco_unitario))
            c.drawString(width - 50, y, f"{total_item:.2f}")
            y -= 15
            
    c.line(10, y - 5, width - 10, y - 5)
    y -= 20
    
    c.setFont("Helvetica", 9)
    subt = getattr(pedido, 'subtotal', 0) or 0
    desc_total = getattr(pedido, 'desconto_total', 0) or 0
    iva = getattr(pedido, 'total_iva', 0) or 0
    
    c.drawString(10, y, "Subtotal:")
    c.drawString(width - 70, y, f"{subt:.2f} {moeda}")
    y -= 15
    c.drawString(10, y, "Descontos:")
    c.drawString(width - 70, y, f"{desc_total:.2f} {moeda}")
    y -= 15
    c.drawString(10, y, "IVA:")
    c.drawString(width - 70, y, f"{iva:.2f} {moeda}")
    y -= 15
    c.setFont("Helvetica-Bold", 10)
    c.drawString(10, y, "TOTAL:")
    c.drawString(width - 70, y, f"{pedido.valor_total:.2f} {moeda}")
    
    y -= 15
    c.setFont("Helvetica", 9)
    c.drawString(10, y, "Valor Pago:")
    c.drawString(width - 70, y, f"{pedido.valor_pago:.2f} {moeda}")
    
    if pedido.saldo > 0:
        y -= 15
        c.drawString(10, y, "Saldo Restante:")
        c.drawString(width - 70, y, f"{pedido.saldo:.2f} {moeda}")
        
    y -= 30
    c.drawCentredString(width / 2, y, "Obrigado pela preferência!")
    
    c.save()
    buffer.seek(0)
    return buffer

def generate_venda_pdf(venda):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    empresa = _get_empresa_info()
    moeda = empresa["moeda"]
    
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, empresa["nome"])
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, f"Endereço: {empresa['localizacao']}")
    c.drawString(50, height - 85, f"Tel: {empresa['telefone']}")
    if empresa['nif']:
        c.drawString(50, height - 100, f"NIF: {empresa['nif']}")
    
    y_doc_info = height - 70
    c.drawString(width - 250, y_doc_info, "Documento: " + (venda.numero_documento or ""))
    c.drawString(width - 250, y_doc_info - 15, "Data: " + (venda.created_at.strftime("%d/%m/%Y %H:%M") if venda.created_at else ""))
    
    c.drawString(50, height - 130, "Dados do Cliente:")
    if venda.pedido and venda.pedido.cliente:
        c.drawString(50, height - 145, f"Cliente: {venda.pedido.cliente.nome}")
        c.drawString(50, height - 160, f"Telefone: {venda.pedido.cliente.telefone}")
    else:
        c.drawString(50, height - 145, f"Cliente ID: {venda.cliente_id or 'Consumidor Final'}")
    
    data = [["Descrição", "Qtd", f"P. Unit ({moeda})", "Desc", "IVA %", f"Subtotal ({moeda})", f"Total IVA ({moeda})", f"Total ({moeda})"]]
    
    if venda.itens:
        for item in venda.itens:
            # Tentar obter unidade de medida se for produto
            unidade = "un"
            if item.item_tipo == 'Produto' and item.item_id:
                from app.models.produto import Produto
                produto = Produto.query.get(item.item_id)
                if produto and produto.unidade_medida:
                    unidade = produto.unidade_medida.sigla
            
            qtd_str = f"{item.quantidade} {unidade}"
            
            preco = float(item.preco_unitario) if item.preco_unitario is not None else 0.0
            desc = float(item.desconto) if getattr(item, 'desconto', None) is not None else 0.0
            iva_perc = float(item.taxa_iva) if getattr(item, 'taxa_iva', None) is not None else 0.0
            subtotal = float(item.subtotal) if item.subtotal is not None else 0.0
            valor_iva = float(item.valor_iva) if item.valor_iva is not None else 0.0
            total = float(item.total) if item.total is not None else 0.0
            
            data.append([
                item.descricao,
                qtd_str,
                f"{preco:.2f}",
                f"{desc:.2f}",
                f"{iva_perc:.1f}%",
                f"{subtotal:.2f}",
                f"{valor_iva:.2f}",
                f"{total:.2f}"
            ])
            
    table_x = 40
    table_y = height - 200
    
    col_widths = [140, 50, 65, 45, 40, 60, 60, 55]
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    w, h = t.wrap(width - 80, height)
    table_y -= h
    t.drawOn(c, table_x, table_y)
    
    footer_x = width - 150
    footer_y = table_y - 20
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(footer_x - 50, footer_y, "Subtotal:")
    c.drawString(footer_x + 30, footer_y, f"{venda.subtotal:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 15, "Descontos:")
    c.drawString(footer_x + 30, footer_y - 15, f"{venda.desconto_total:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 30, "IVA:")
    c.drawString(footer_x + 30, footer_y - 30, f"{venda.total_iva:.2f} {moeda}")
    
    c.drawString(footer_x - 50, footer_y - 45, "Total a Pagar:")
    c.drawString(footer_x + 30, footer_y - 45, f"{venda.total:.2f} {moeda}")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, 50, "Documento processado por computador.")
    
    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer

