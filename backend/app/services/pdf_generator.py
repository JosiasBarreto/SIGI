import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle
from app.models.empresa import Empresa
from app.models.user import User
from app.models.cliente import Cliente
from app.models.produto import Produto

def format_qtd(val):
    try:
        val_f = float(val)
        if val_f.is_integer():
            return str(int(val_f))
        return f"{val_f:.3f}".rstrip('0').rstrip('.')
    except (ValueError, TypeError):
        return str(val)

def format_percentagem(val):
    try:
        val_f = float(val)
        if val_f.is_integer():
            return f"{int(val_f)}%"
        return f"{val_f:.2f}".rstrip('0').rstrip('.') + "%"
    except (ValueError, TypeError):
        return f"{val}%"

def _get_empresa_info():
    empresa = Empresa.query.first()
    if empresa:
        licenca = empresa.licenca_empresa or empresa.licenca_aplicacao or "001/SIGI/2026"
        contactos = []
        if empresa.telefone:
            contactos.append(f"Tel: {empresa.telefone}")
        if empresa.telemoveis:
            contactos.append(f"Tlm: {empresa.telemoveis}")
        if empresa.correio_eletronico:
            contactos.append(f"Email: {empresa.correio_eletronico}")
        
        contacto_str = " | ".join(contactos) if contactos else "Tel: N/A"

        return {
            "nome": empresa.nome,
            "localizacao": empresa.localizacao or "São Tomé e Príncipe",
            "telefone": empresa.telefone or empresa.telemoveis or "",
            "telemoveis": empresa.telemoveis or "",
            "email": empresa.correio_eletronico or "",
            "contacto_completo": contacto_str,
            "nif": empresa.nif or "500000000",
            "licenca": licenca,
            "numero_certificado": licenca,
            "moeda": empresa.moeda or "STN"
        }
    return {
        "nome": "Empresa SIGI ERP",
        "localizacao": "São Tomé e Príncipe",
        "telefone": "",
        "telemoveis": "",
        "email": "",
        "contacto_completo": "Tel: N/A",
        "nif": "500000000",
        "licenca": "001/SIGI/2026",
        "numero_certificado": "001/SIGI/2026",
        "moeda": "STN"
    }

def get_venda_receipt_data(venda):
    empresa = _get_empresa_info()
    moeda = empresa["moeda"]

    # Operador / User
    operador_nome = "Sistema / Atendimento"
    operador_id = getattr(venda, 'criado_por', None) or getattr(venda, 'created_by', None)
    if operador_id:
        u = User.query.get(operador_id)
        if u:
            operador_nome = u.name

    # Cliente / Comprador
    cliente_nome = "Consumidor Final"
    cliente_nif = "Consumidor Final"
    cliente_telefone = ""
    cliente_email = ""
    cliente_empresa = ""
    cliente_morada = ""

    c = None
    if venda.pedido and venda.pedido.cliente:
        c = venda.pedido.cliente
    elif getattr(venda, 'cliente_id', None):
        c = Cliente.query.get(venda.cliente_id)
    elif venda.pedido and getattr(venda.pedido, 'cliente_id', None):
        c = Cliente.query.get(venda.pedido.cliente_id)

    if c:
        cliente_nome = c.nome or "Consumidor Final"
        cliente_nif = c.nif or ""
        cliente_telefone = c.telefone or c.whatsapp or ""
        cliente_email = c.email or ""
        cliente_empresa = c.empresa or ""
        cliente_morada = c.morada or ""

    if not cliente_nif and cliente_nome == "Consumidor Final":
        cliente_nif = "Consumidor Final"

    # Data e Hora de Operacao
    dt_op = venda.created_at.strftime("%d/%m/%Y %H:%M") if venda.created_at else "N/A"

    # Data e Hora de Entrega (se pedido/agendamento associado)
    dt_entrega = None
    if venda.pedido:
        if venda.pedido.data_entrega:
            d_str = venda.pedido.data_entrega.strftime("%d/%m/%Y")
            h_str = venda.pedido.hora_entrega.strftime("%H:%M") if venda.pedido.hora_entrega else ""
            dt_entrega = f"{d_str} {h_str}".strip()

    # Formas de pagamento
    forma_pagamento = "Dinheiro"
    if venda.pedido and venda.pedido.forma_pagamento:
        forma_pagamento = venda.pedido.forma_pagamento.value if hasattr(venda.pedido.forma_pagamento, 'value') else str(venda.pedido.forma_pagamento)
    elif venda.pagamentos:
        from app.models.financeiro import FormaPagamento as FinFormaPagamento
        formas = []
        for p in venda.pagamentos:
            if getattr(p, 'forma_pagamento_id', None):
                fp = FinFormaPagamento.query.get(p.forma_pagamento_id)
                if fp:
                    formas.append(fp.nome)
        if formas:
            forma_pagamento = ", ".join(set(formas))

    # Items
    itens_data = []
    for item in venda.itens:
        unidade = "un"
        if item.item_tipo == 'Produto' and item.item_id:
            p = Produto.query.get(item.item_id)
            if p and p.unidade_medida:
                unidade = p.unidade_medida.sigla

        preco_u = float(item.preco_unitario) if item.preco_unitario is not None else 0.0
        desc = float(item.desconto) if getattr(item, 'desconto', None) is not None else 0.0
        iva_perc = float(item.taxa_iva) if getattr(item, 'taxa_iva', None) is not None else 0.0
        subt = float(item.subtotal) if item.subtotal is not None else (float(item.quantidade) * preco_u - desc)
        val_iva = float(item.valor_iva) if item.valor_iva is not None else (subt * (iva_perc / 100))
        tot = float(item.total) if item.total is not None else (subt + val_iva)

        itens_data.append({
            "descricao": item.descricao,
            "quantidade": float(item.quantidade),
            "unidade": unidade,
            "preco_unitario": preco_u,
            "desconto": desc,
            "taxa_iva": iva_perc,
            "valor_iva": val_iva,
            "subtotal": subt,
            "total": tot
        })

    subtotal_venda = float(venda.subtotal) if venda.subtotal is not None else 0.0
    desconto_venda = float(venda.desconto_total) if venda.desconto_total is not None else 0.0
    iva_venda = float(venda.total_iva) if venda.total_iva is not None else 0.0
    total_venda = float(venda.total) if venda.total is not None else 0.0
    pago_venda = float(venda.valor_pago) if venda.valor_pago is not None else 0.0
    saldo_venda = float(venda.saldo) if venda.saldo is not None else 0.0
    troco_venda = max(0.0, pago_venda - total_venda)

    tipo_doc_str = venda.tipo_documento.value if hasattr(venda.tipo_documento, 'value') else str(venda.tipo_documento)

    return {
        "empresa": empresa,
        "documento": {
            "tipo": tipo_doc_str,
            "numero": venda.numero_documento,
            "estado": venda.estado.value if hasattr(venda.estado, 'value') else str(venda.estado),
            "data_hora_operacao": dt_op,
            "data_hora_entrega": dt_entrega,
            "operador": operador_nome,
            "forma_pagamento": forma_pagamento
        },
        "cliente": {
            "nome": cliente_nome,
            "nif": cliente_nif,
            "telefone": cliente_telefone,
            "email": cliente_email,
            "empresa": cliente_empresa,
            "morada": cliente_morada
        },
        "itens": itens_data,
        "totais": {
            "subtotal": subtotal_venda,
            "desconto_total": desconto_venda,
            "total_iva": iva_venda,
            "total_geral": total_venda,
            "valor_pago": pago_venda,
            "saldo": saldo_venda,
            "troco": troco_venda,
            "moeda": moeda
        }
    }

def get_pedido_receipt_data(pedido):
    empresa = _get_empresa_info()
    moeda = empresa["moeda"]

    operador_nome = "Atendimento"
    if getattr(pedido, 'created_by', None):
        u = User.query.get(pedido.created_by)
        if u:
            operador_nome = u.name

    cliente_nome = "Consumidor Final"
    cliente_nif = "Consumidor Final"
    cliente_telefone = ""
    cliente_email = ""
    cliente_empresa = ""
    cliente_morada = ""

    c = None
    if pedido.cliente:
        c = pedido.cliente
    elif getattr(pedido, 'cliente_id', None):
        c = Cliente.query.get(pedido.cliente_id)

    if c:
        cliente_nome = c.nome or "Consumidor Final"
        cliente_nif = c.nif or ""
        cliente_telefone = c.telefone or c.whatsapp or ""
        cliente_email = c.email or ""
        cliente_empresa = c.empresa or ""
        cliente_morada = c.morada or ""

    if not cliente_nif and cliente_nome == "Consumidor Final":
        cliente_nif = "Consumidor Final"

    dt_op = pedido.data_pedido.strftime("%d/%m/%Y %H:%M") if pedido.data_pedido else "N/A"
    
    dt_entrega = None
    if pedido.data_entrega:
        d_str = pedido.data_entrega.strftime("%d/%m/%Y")
        h_str = pedido.hora_entrega.strftime("%H:%M") if pedido.hora_entrega else ""
        dt_entrega = f"{d_str} {h_str}".strip()

    forma_pag = pedido.forma_pagamento.value if (pedido.forma_pagamento and hasattr(pedido.forma_pagamento, 'value')) else (str(pedido.forma_pagamento) if pedido.forma_pagamento else "Dinheiro")

    itens_data = []
    if pedido.itens:
        for item in pedido.itens:
            produto = None
            if item.produto_id:
                produto = Produto.query.get(item.produto_id)

            nome_prod = produto.nome if produto else (item.descricao if hasattr(item, 'descricao') and item.descricao else "Produto")
            unidade = produto.unidade_medida.sigla if (produto and produto.unidade_medida) else "un"

            preco_u = float(item.preco_unitario) if item.preco_unitario is not None else 0.0
            desc = float(item.desconto) if getattr(item, 'desconto', None) is not None else 0.0
            iva_perc = float(item.taxa_iva) if getattr(item, 'taxa_iva', None) is not None else 0.0
            subt = float(item.subtotal) if getattr(item, 'subtotal', None) is not None else (float(item.quantidade) * preco_u - desc)
            val_iva = float(item.valor_iva) if getattr(item, 'valor_iva', None) is not None else (subt * (iva_perc / 100))
            tot = float(item.total) if getattr(item, 'total', None) is not None else (subt + val_iva)

            itens_data.append({
                "descricao": nome_prod,
                "quantidade": float(item.quantidade),
                "unidade": unidade,
                "preco_unitario": preco_u,
                "desconto": desc,
                "taxa_iva": iva_perc,
                "valor_iva": val_iva,
                "subtotal": subt,
                "total": tot
            })

    subt_p = float(pedido.subtotal) if pedido.subtotal is not None else 0.0
    desc_p = float(pedido.desconto_total) if pedido.desconto_total is not None else 0.0
    iva_p = float(pedido.total_iva) if pedido.total_iva is not None else 0.0
    tot_p = float(pedido.valor_total) if pedido.valor_total is not None else 0.0
    pago_p = float(pedido.valor_pago) if pedido.valor_pago is not None else 0.0
    saldo_p = float(pedido.saldo) if pedido.saldo is not None else 0.0
    troco_p = max(0.0, pago_p - tot_p)

    return {
        "empresa": empresa,
        "documento": {
            "tipo": "PEDIDO DE VENDA",
            "numero": pedido.numero,
            "estado": pedido.estado.value if hasattr(pedido.estado, 'value') else str(pedido.estado),
            "data_hora_operacao": dt_op,
            "data_hora_entrega": dt_entrega,
            "operador": operador_nome,
            "forma_pagamento": forma_pag
        },
        "cliente": {
            "nome": cliente_nome,
            "nif": cliente_nif,
            "telefone": cliente_telefone,
            "email": cliente_email,
            "empresa": cliente_empresa,
            "morada": cliente_morada
        },
        "itens": itens_data,
        "totais": {
            "subtotal": subt_p,
            "desconto_total": desc_p,
            "total_iva": iva_p,
            "total_geral": tot_p,
            "valor_pago": pago_p,
            "saldo": saldo_p,
            "troco": troco_p,
            "moeda": moeda
        }
    }


def generate_venda_pdf(venda):
    data = get_venda_receipt_data(venda)
    return _build_a4_pdf(data)


def generate_venda_receipt(venda):
    data = get_venda_receipt_data(venda)
    return _build_thermal_receipt_pdf(data)


def generate_pedido_pdf(pedido):
    data = get_pedido_receipt_data(pedido)
    return _build_a4_pdf(data)


def generate_pedido_receipt(pedido):
    data = get_pedido_receipt_data(pedido)
    return _build_thermal_receipt_pdf(data)


def _build_a4_pdf(rec_data):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    empresa = rec_data["empresa"]
    doc = rec_data["documento"]
    cliente = rec_data["cliente"]
    totais = rec_data["totais"]
    moeda = totais["moeda"]
    
    # Header Empresa (Left)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(40, height - 40, empresa["nome"])
    
    c.setFont("Helvetica", 9)
    c.drawString(40, height - 55, f"Morada: {empresa['localizacao']}")
    c.drawString(40, height - 68, f"Contacto: {empresa['contacto_completo']}")
    c.drawString(40, height - 81, f"NIF Empresa: {empresa['nif']}")
    c.drawString(40, height - 94, f"Certificado nº: {empresa['licenca']}")
    
    # Header Documento (Right)
    y_doc = height - 40
    c.setFont("Helvetica-Bold", 12)
    c.drawRightString(width - 40, y_doc, f"{doc['tipo']} Nº {doc['numero']}")
    c.setFont("Helvetica", 9)
    c.drawRightString(width - 40, y_doc - 15, f"Data/Hora Op.: {doc['data_hora_operacao']}")
    if doc.get('data_hora_entrega'):
        c.drawRightString(width - 40, y_doc - 30, f"⭐ Data/Hora Entrega: {doc['data_hora_entrega']}")
    c.drawRightString(width - 40, y_doc - 45, f"Operador: {doc['operador']}")
    c.drawRightString(width - 40, y_doc - 60, f"Forma Pgto: {doc['forma_pagamento']}")

    # Box Dados do Cliente
    c.setStrokeColor(colors.lightgrey)
    has_contacts = bool(cliente.get('telefone') or cliente.get('email') or cliente.get('morada'))
    box_height = 45 if has_contacts else 35
    box_top = height - 110
    c.rect(40, box_top - box_height, width - 80, box_height, fill=0)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, box_top - 12, "DADOS DO COMPRADOR / CLIENTE:")
    c.setFont("Helvetica", 8)
    
    nome_str = f"Nome: {cliente['nome']}"
    if cliente.get('empresa'):
        nome_str += f" ({cliente['empresa']})"
    nome_str += f"   |   NIF: {cliente['nif']}"
    c.drawString(50, box_top - 25, nome_str)
    
    if has_contacts:
        contacts = []
        if cliente.get('telefone'): contacts.append(f"Tel: {cliente['telefone']}")
        if cliente.get('email'): contacts.append(f"Email: {cliente['email']}")
        if cliente.get('morada'): contacts.append(f"Morada: {cliente['morada']}")
        c.drawString(50, box_top - 37, "   |   ".join(contacts))

    # Table of Items
    table_data = [["Descrição", "Qtd", f"P. Unit ({moeda})", "Desc", "IVA %", f"Subtotal ({moeda})", f"Total IVA ({moeda})", f"Total ({moeda})"]]
    
    for item in rec_data["itens"]:
        qtd_formatted = format_qtd(item['quantidade'])
        qtd_str = f"{qtd_formatted} {item['unidade']}"
        table_data.append([
            item["descricao"],
            qtd_str,
            f"{item['preco_unitario']:.2f}",
            f"{item['desconto']:.2f}",
            format_percentagem(item['taxa_iva']),
            f"{item['subtotal']:.2f}",
            f"{item['valor_iva']:.2f}",
            f"{item['total']:.2f}"
        ])

    table_x = 40
    table_y = box_top - box_height - 15
    
    col_widths = [145, 45, 65, 45, 40, 60, 60, 55]
    t = Table(table_data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1"))
    ]))
    
    w, h = t.wrap(width - 80, height)
    table_y -= h
    t.drawOn(c, table_x, table_y)
    
    # Summary Totals (Right Aligned)
    footer_x = width - 200
    footer_y = table_y - 20
    
    c.setFont("Helvetica", 9)
    c.drawString(footer_x, footer_y, "Subtotal:")
    c.drawRightString(width - 40, footer_y, f"{totais['subtotal']:.2f} {moeda}")
    
    c.drawString(footer_x, footer_y - 13, "Descontos Totais:")
    c.drawRightString(width - 40, footer_y - 13, f"{totais['desconto_total']:.2f} {moeda}")
    
    c.drawString(footer_x, footer_y - 26, "Total IVA:")
    c.drawRightString(width - 40, footer_y - 26, f"{totais['total_iva']:.2f} {moeda}")
    
    c.setFont("Helvetica-Bold", 10)
    c.drawString(footer_x, footer_y - 42, "TOTAL A PAGAR:")
    c.drawRightString(width - 40, footer_y - 42, f"{totais['total_geral']:.2f} {moeda}")
    
    c.setFont("Helvetica", 9)
    c.drawString(footer_x, footer_y - 57, "Valor Pago:")
    c.drawRightString(width - 40, footer_y - 57, f"{totais['valor_pago']:.2f} {moeda}")
    
    if totais["saldo"] > 0:
        c.drawString(footer_x, footer_y - 70, "Saldo Pendente:")
        c.drawRightString(width - 40, footer_y - 70, f"{totais['saldo']:.2f} {moeda}")
    elif totais["troco"] > 0:
        c.drawString(footer_x, footer_y - 70, "Troco:")
        c.drawRightString(width - 40, footer_y - 70, f"{totais['troco']:.2f} {moeda}")

    # Footer Legal Note
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(40, 40, f"Processado por computador - {empresa['licenca']}")
    c.drawRightString(width - 40, 40, "Obrigado pela sua preferência!")
    
    c.save()
    buffer.seek(0)
    return buffer


def _build_thermal_receipt_pdf(rec_data):
    # 80mm roll width = ~226 points
    width = 226
    
    empresa = rec_data["empresa"]
    doc = rec_data["documento"]
    cliente = rec_data["cliente"]
    totais = rec_data["totais"]
    itens = rec_data["itens"]
    moeda = totais["moeda"]

    # Calculate dynamic height so nothing is cut off
    base_height = 360
    items_height = len(itens) * 28
    height = max(520, base_height + items_height)

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))
    
    y = height - 15
    
    # Empresa Info Centered
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(width / 2, y, empresa["nome"])
    y -= 12
    
    c.setFont("Helvetica", 8)
    if empresa["localizacao"]:
        c.drawCentredString(width / 2, y, empresa["localizacao"])
        y -= 10
    if empresa["contacto_completo"]:
        c.drawCentredString(width / 2, y, empresa["contacto_completo"])
        y -= 10
    if empresa["nif"]:
        c.drawCentredString(width / 2, y, f"NIF: {empresa['nif']}")
        y -= 10
    c.drawCentredString(width / 2, y, f"Cert.: {empresa['licenca']}")
    y -= 12

    c.setLineWidth(0.5)
    c.line(8, y, width - 8, y)
    y -= 12

    # Document Info
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width / 2, y, f"*** {doc['tipo']} ***")
    y -= 12
    c.setFont("Helvetica", 8)
    c.drawString(10, y, f"Nº Doc: {doc['numero']}")
    y -= 10
    c.drawString(10, y, f"Data Op: {doc['data_hora_operacao']}")
    y -= 10
    if doc.get('data_hora_entrega'):
        c.setFont("Helvetica-Bold", 8)
        c.drawString(10, y, f"ENTREGA: {doc['data_hora_entrega']}")
        c.setFont("Helvetica", 8)
        y -= 10
    c.drawString(10, y, f"Operador: {doc['operador']}")
    y -= 10
    c.drawString(10, y, f"Forma Pgto: {doc['forma_pagamento']}")
    y -= 12

    c.line(8, y, width - 8, y)
    y -= 12

    # Cliente Info
    c.setFont("Helvetica-Bold", 8)
    c.drawString(10, y, "COMPRADOR / CLIENTE:")
    y -= 10
    c.setFont("Helvetica", 8)
    c.drawString(10, y, f"Nome: {cliente['nome']}")
    y -= 10
    if cliente.get('empresa'):
        c.drawString(10, y, f"Empresa: {cliente['empresa']}")
        y -= 10
    if cliente.get('nif'):
        c.drawString(10, y, f"NIF: {cliente['nif']}")
        y -= 10
    if cliente.get('telefone'):
        c.drawString(10, y, f"Tel: {cliente['telefone']}")
        y -= 10
    if cliente.get('email'):
        c.drawString(10, y, f"Email: {cliente['email']}")
        y -= 10
    y -= 2

    c.line(8, y, width - 8, y)
    y -= 12

    # Items Header
    c.setFont("Helvetica-Bold", 8)
    c.drawString(10, y, "Qtd  Item")
    c.drawRightString(width - 10, y, "Total")
    y -= 10

    c.setFont("Helvetica", 8)
    for item in itens:
        desc = item["descricao"]
        if len(desc) > 22:
            desc = desc[:20] + ".."
            
        qtd_formatted = format_qtd(item['quantidade'])
        qtd_str = f"{qtd_formatted}{item['unidade']}"
        c.drawString(10, y, f"{qtd_str} {desc}")
        c.drawRightString(width - 10, y, f"{item['total']:.2f}")
        y -= 10
        
        # Line detail for price/IVA
        iva_str = format_percentagem(item['taxa_iva'])
        detalhe = f"   P.U: {item['preco_unitario']:.2f} | IVA: {iva_str}"
        if item['desconto'] > 0:
            detalhe += f" | Desc: {item['desconto']:.2f}"
        c.setFont("Helvetica-Oblique", 7)
        c.drawString(10, y, detalhe)
        c.setFont("Helvetica", 8)
        y -= 12

    c.line(8, y, width - 8, y)
    y -= 12

    # Totais
    c.setFont("Helvetica", 8)
    c.drawString(10, y, "Subtotal:")
    c.drawRightString(width - 10, y, f"{totais['subtotal']:.2f} {moeda}")
    y -= 10

    if totais["desconto_total"] > 0:
        c.drawString(10, y, "Descontos:")
        c.drawRightString(width - 10, y, f"{totais['desconto_total']:.2f} {moeda}")
        y -= 10

    c.drawString(10, y, "Total IVA:")
    c.drawRightString(width - 10, y, f"{totais['total_iva']:.2f} {moeda}")
    y -= 12

    c.setFont("Helvetica-Bold", 10)
    c.drawString(10, y, "TOTAL:")
    c.drawRightString(width - 10, y, f"{totais['total_geral']:.2f} {moeda}")
    y -= 12

    c.setFont("Helvetica", 8)
    c.drawString(10, y, "Valor Pago:")
    c.drawRightString(width - 10, y, f"{totais['valor_pago']:.2f} {moeda}")
    y -= 10

    if totais["saldo"] > 0:
        c.setFont("Helvetica-Bold", 8)
        c.drawString(10, y, "Saldo Restante:")
        c.drawRightString(width - 10, y, f"{totais['saldo']:.2f} {moeda}")
        y -= 10
    elif totais["troco"] > 0:
        c.drawString(10, y, "Troco:")
        c.drawRightString(width - 10, y, f"{totais['troco']:.2f} {moeda}")
        y -= 10

    y -= 10
    c.setFont("Helvetica-Oblique", 7)
    c.drawCentredString(width / 2, y, f"Processado por computador - {empresa['licenca']}")
    y -= 10
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(width / 2, y, "Obrigado pela preferência!")

    c.save()
    buffer.seek(0)
    return buffer
