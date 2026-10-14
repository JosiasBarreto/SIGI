from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required
from app.core.database import db
from app.models.pedido import Pedido, EstadoPedido
from app.models.item_pedido import ItemPedido
from app.models.produto import Produto, TipoProduto
from app.models.categoria_produto import CategoriaProduto
from app.models.material import Material
from app.models.evento import Evento, ReservaMaterial
from app.models.caixa import Caixa, MovimentoCaixa, EstadoCaixa
from app.models.user import User
from sqlalchemy import func, desc, asc
from datetime import datetime, date, timedelta
import io

relatorios_bp = Blueprint('relatorios', __name__)

@relatorios_bp.route('/dashboard', methods=['GET'])
@relatorios_bp.route('/geral', methods=['GET'])
@jwt_required()
def get_relatorio_geral():
    hoje = date.today()
    agora = datetime.utcnow()
    
    # Parâmetros opcionais de filtro
    data_inicio_str = request.args.get('data_inicio')
    data_fim_str = request.args.get('data_fim')
    
    try:
        data_inicio = datetime.strptime(data_inicio_str, '%Y-%m-%d').date() if data_inicio_str else (hoje - timedelta(days=30))
        data_fim = datetime.strptime(data_fim_str, '%Y-%m-%d').date() if data_fim_str else hoje
    except Exception:
        data_inicio = hoje - timedelta(days=30)
        data_fim = hoje

    # -------------------------------------------------------------
    # 1. PRODUTOS ATIVOS, POR TIPO E CATEGORIA, ESTADOS DE STOCK
    # -------------------------------------------------------------
    produtos_query = Produto.query.filter(Produto.ativo == True)
    total_produtos_ativos = produtos_query.count()

    # Produtos por Tipo
    tipo_counts = db.session.query(
        Produto.tipo,
        func.count(Produto.id),
        func.sum(Produto.preco_venda * Produto.stock_atual)
    ).filter(Produto.ativo == True).group_by(Produto.tipo).all()

    produtos_por_tipo = [
        {
            "tipo": str(t[0].value if hasattr(t[0], 'value') else t[0] or 'Outro'),
            "quantidade": int(t[1] or 0),
            "valor_estimado": float(t[2] or 0)
        } for t in tipo_counts
    ]

    # Produtos por Categoria
    cat_counts = db.session.query(
        func.coalesce(Produto.categoria, CategoriaProduto.nome, 'Sem Categoria'),
        func.count(Produto.id),
        func.sum(Produto.stock_atual)
    ).outerjoin(CategoriaProduto, Produto.categoria_id == CategoriaProduto.id)\
     .filter(Produto.ativo == True)\
     .group_by(func.coalesce(Produto.categoria, CategoriaProduto.nome, 'Sem Categoria')).all()

    produtos_por_categoria = [
        {
            "categoria": str(c[0]),
            "total_produtos": int(c[1] or 0),
            "stock_total": float(c[2] or 0)
        } for c in cat_counts
    ]

    # Alertas de Validade e Stock
    prods_expirados = Produto.query.filter(
        Produto.ativo == True,
        Produto.data_validade != None,
        Produto.data_validade < hoje
    ).count()

    prods_a_expirar = Produto.query.filter(
        Produto.ativo == True,
        Produto.data_validade != None,
        Produto.data_validade >= hoje,
        Produto.data_validade <= hoje + timedelta(days=5)
    ).count()

    prods_stock_baixo = Produto.query.filter(
        Produto.ativo == True,
        Produto.stock_atual <= Produto.stock_minimo
    ).count()

    # -------------------------------------------------------------
    # 2. FUNCIONÁRIOS / UTILIZADORES ATIVOS
    # -------------------------------------------------------------
    users_ativos_query = User.query.filter(User.is_active == True)
    total_utilizadores_ativos = users_ativos_query.count()

    users_by_role = db.session.query(
        User.role,
        func.count(User.id)
    ).filter(User.is_active == True).group_by(User.role).all()

    utilizadores_por_cargo = [
        {
            "cargo": str(r[0].value if hasattr(r[0], 'value') else r[0]),
            "total": int(r[1] or 0)
        } for r in users_by_role
    ]

    lista_utilizadores_ativos = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": str(u.role.value if hasattr(u.role, 'value') else u.role)
        } for u in users_ativos_query.order_by(User.name.asc()).all()
    ]

    # -------------------------------------------------------------
    # 3. PRODUTOS MAIS VENDIDOS E MENOS VENDIDOS
    # -------------------------------------------------------------
    vendas_por_produto = db.session.query(
        ItemPedido.produto_id,
        func.coalesce(Produto.nome, ItemPedido.descricao, 'Item').label('nome_produto'),
        func.coalesce(Produto.codigo, '').label('codigo_produto'),
        func.sum(ItemPedido.quantidade).label('qtd_vendida'),
        func.sum(ItemPedido.total).label('total_faturado')
    ).outerjoin(Produto, ItemPedido.produto_id == Produto.id)\
     .group_by(ItemPedido.produto_id, func.coalesce(Produto.nome, ItemPedido.descricao, 'Item'), Produto.codigo)\
     .all()

    # Ordenar mais vendidos
    mais_vendidos_sorted = sorted(vendas_por_produto, key=lambda x: float(x[3] or 0), reverse=True)
    produtos_mais_vendidos = [
        {
            "produto_id": row[0],
            "nome": row[1],
            "codigo": row[2],
            "quantidade_vendida": float(row[3] or 0),
            "total_faturado": float(row[4] or 0)
        } for row in mais_vendidos_sorted[:10]
    ]

    # Produtos menos vendidos (ativos com menor ou nenhuma saída)
    vendas_map = {row[0]: float(row[3] or 0) for row in vendas_por_produto if row[0] is not None}
    todos_prods_ativos = Produto.query.filter(Produto.ativo == True).all()

    prods_com_vendas = []
    for p in todos_prods_ativos:
        qtd = vendas_map.get(p.id, 0.0)
        prods_com_vendas.append({
            "produto_id": p.id,
            "nome": p.nome,
            "codigo": p.codigo or '',
            "quantidade_vendida": qtd,
            "stock_atual": float(p.stock_atual or 0),
            "preco_venda": float(p.preco_venda or 0)
        })

    produtos_menos_vendidos = sorted(prods_com_vendas, key=lambda x: x["quantidade_vendida"])[:10]

    # -------------------------------------------------------------
    # 4. MATERIAIS MAIS UTILIZADOS E MENOS UTILIZADOS
    # -------------------------------------------------------------
    materiais_reservas = db.session.query(
        ReservaMaterial.material_id,
        func.coalesce(Material.nome, 'Material').label('nome_material'),
        func.coalesce(Material.codigo, '').label('codigo_material'),
        func.sum(ReservaMaterial.quantidade).label('qtd_utilizada')
    ).outerjoin(Material, ReservaMaterial.material_id == Material.id)\
     .group_by(ReservaMaterial.material_id, Material.nome, Material.codigo)\
     .all()

    mat_utilizados_map = {row[0]: float(row[3] or 0) for row in materiais_reservas if row[0] is not None}
    todos_materiais = Material.query.filter(Material.ativo == True).all()

    lista_materiais_stats = []
    for m in todos_materiais:
        qtd_uso = mat_utilizados_map.get(m.id, 0.0)
        lista_materiais_stats.append({
            "material_id": m.id,
            "nome": m.nome,
            "codigo": m.codigo or '',
            "categoria": m.categoria or 'Geral',
            "quantidade_utilizada": qtd_uso,
            "quantidade_total": float(m.quantidade_total or 0),
            "quantidade_disponivel": float(m.quantidade_disponivel or 0),
            "estado": str(m.estado.value if hasattr(m.estado, 'value') else m.estado or 'Disponivel')
        })

    materiais_mais_utilizados = sorted(lista_materiais_stats, key=lambda x: x["quantidade_utilizada"], reverse=True)[:10]
    materiais_menos_utilizados = sorted(lista_materiais_stats, key=lambda x: x["quantidade_utilizada"])[:10]
    total_materiais_ativos = len(todos_materiais)

    # -------------------------------------------------------------
    # 5. CONTAGEM DE CADA ESTADO DE PEDIDOS & NÃO ENTREGUES
    # -------------------------------------------------------------
    todos_pedidos = Pedido.query.all()
    estados_padrao = ['Pendente', 'Agendado', 'Confirmado', 'Em Producao', 'Pronto', 'Entregue', 'Concluido', 'Cancelado']
    
    pedidos_por_estado = {est: {"quantidade": 0, "valor_total": 0.0} for est in estados_padrao}
    pedidos_nao_entregues_count = 0
    pedidos_nao_entregues_valor = 0.0

    for ped in todos_pedidos:
        st = str(ped.estado.value if hasattr(ped.estado, 'value') else ped.estado or 'Pendente').strip()
        v = float(ped.valor_total or 0)
        if st not in pedidos_por_estado:
            pedidos_por_estado[st] = {"quantidade": 0, "valor_total": 0.0}
        pedidos_por_estado[st]["quantidade"] += 1
        pedidos_por_estado[st]["valor_total"] += v

        # Verificação de pedidos atrasados / não entregues
        if ped.data_entrega and ped.data_entrega <= hoje and st not in ['Entregue', 'Concluido', 'Cancelado']:
            pedidos_nao_entregues_count += 1
            pedidos_nao_entregues_valor += v

    total_pedidos_geral = len(todos_pedidos)

    # -------------------------------------------------------------
    # 6. VALORES DIÁRIOS (ÚLTIMOS 30 DIAS) E VALOR DE HOJE
    # -------------------------------------------------------------
    trinta_dias_atras = hoje - timedelta(days=29)
    pedidos_30_dias = Pedido.query.filter(
        Pedido.data_pedido >= datetime.combine(trinta_dias_atras, datetime.min.time())
    ).all()

    valores_diarios_map = {}
    # Inicializar todos os 30 dias com 0 para gráfico contínuo sem buracos
    for i in range(30):
        d_str = (trinta_dias_atras + timedelta(days=i)).strftime('%Y-%m-%d')
        valores_diarios_map[d_str] = {"data": d_str, "valor": 0.0, "pedidos": 0}

    valor_hoje = 0.0
    pedidos_hoje_count = 0
    hoje_str = hoje.strftime('%Y-%m-%d')

    for p in pedidos_30_dias:
        if p.data_pedido:
            p_data_str = p.data_pedido.strftime('%Y-%m-%d')
            val = float(p.valor_total or 0)
            if p_data_str in valores_diarios_map:
                valores_diarios_map[p_data_str]["valor"] += val
                valores_diarios_map[p_data_str]["pedidos"] += 1
            if p_data_str == hoje_str:
                valor_hoje += val
                pedidos_hoje_count += 1

    valores_diarios = sorted(valores_diarios_map.values(), key=lambda x: x["data"])

    # -------------------------------------------------------------
    # 7. VALORES EM UM MÊS E EVOLUÇÃO MENSAL (ÚLTIMOS 12 MESES)
    # -------------------------------------------------------------
    mes_atual_str = hoje.strftime('%Y-%m')
    mes_anterior_date = (hoje.replace(day=1) - timedelta(days=1))
    mes_anterior_str = mes_anterior_date.strftime('%Y-%m')

    doze_meses_atras = (hoje.replace(day=1) - timedelta(days=365))
    pedidos_ano = Pedido.query.filter(
        Pedido.data_pedido >= datetime.combine(doze_meses_atras, datetime.min.time())
    ).all()

    mensal_map = {}
    for p in pedidos_ano:
        if p.data_pedido:
            m_str = p.data_pedido.strftime('%Y-%m')
            if m_str not in mensal_map:
                mensal_map[m_str] = {"mes": m_str, "valor": 0.0, "pedidos": 0}
            mensal_map[m_str]["valor"] += float(p.valor_total or 0)
            mensal_map[m_str]["pedidos"] += 1

    valores_mensais = sorted(mensal_map.values(), key=lambda x: x["mes"])
    valor_mes_atual = mensal_map.get(mes_atual_str, {}).get("valor", 0.0)
    valor_mes_anterior = mensal_map.get(mes_anterior_str, {}).get("valor", 0.0)

    variacao_mensal_perc = 0.0
    if valor_mes_anterior > 0:
        variacao_mensal_perc = ((valor_mes_atual - valor_mes_anterior) / valor_mes_anterior) * 100.0

    # -------------------------------------------------------------
    # 8. RECONCILIAÇÃO COM O CAIXA
    # -------------------------------------------------------------
    # Totais de Vendas/Pedidos por Forma de Pagamento
    pagamentos_por_forma = db.session.query(
        Pedido.forma_pagamento,
        func.count(Pedido.id),
        func.sum(Pedido.valor_total),
        func.sum(Pedido.valor_pago)
    ).group_by(Pedido.forma_pagamento).all()

    formas_pagamento_stats = [
        {
            "forma": str(r[0].value if hasattr(r[0], 'value') else r[0] or 'Não Definida'),
            "quantidade_pedidos": int(r[1] or 0),
            "valor_total": float(r[2] or 0),
            "valor_recebido": float(r[3] or 0)
        } for r in pagamentos_por_forma
    ]

    # Movimentos de Caixa por Tipo
    movimentos_caixa_stats = db.session.query(
        MovimentoCaixa.tipo,
        func.count(MovimentoCaixa.id),
        func.sum(MovimentoCaixa.valor)
    ).group_by(MovimentoCaixa.tipo).all()

    movimentos_resumo = [
        {
            "tipo": str(m[0].value if hasattr(m[0], 'value') else m[0]),
            "quantidade": int(m[1] or 0),
            "total": float(m[2] or 0)
        } for m in movimentos_caixa_stats
    ]

    # Sessões de Caixa
    caixas_abertos = Caixa.query.filter_by(estado=EstadoCaixa.ABERTO.value).count()
    caixas_fechados = Caixa.query.filter_by(estado=EstadoCaixa.FECHADO.value).count()
    
    total_fundo_caixa = db.session.query(func.sum(Caixa.valor_inicial)).scalar() or 0
    total_saldo_fecho = db.session.query(func.sum(Caixa.valor_final)).scalar() or 0

    # Divergências acumuladas em fechos
    dif_dinheiro = db.session.query(func.sum(Caixa.diferenca_dinheiro)).scalar() or 0
    dif_transferencia = db.session.query(func.sum(Caixa.diferenca_transferencia)).scalar() or 0
    dif_pos = db.session.query(func.sum(Caixa.diferenca_pos)).scalar() or 0
    total_divergencias = float(dif_dinheiro) + float(dif_transferencia) + float(dif_pos)

    # Últimos fechos com divergência
    fechos_com_divergencia = Caixa.query.filter(
        Caixa.estado == EstadoCaixa.FECHADO.value
    ).filter(
        (Caixa.diferenca_dinheiro != 0) | 
        (Caixa.diferenca_transferencia != 0) | 
        (Caixa.diferenca_pos != 0)
    ).order_by(Caixa.id.desc()).limit(10).all()

    fechos_divergentes_lista = [
        {
            "id": c.id,
            "numero": c.numero,
            "data_fecho": c.data_fecho.strftime('%d/%m/%Y %H:%M') if c.data_fecho else None,
            "declarado_dinheiro": float(c.valor_declarado_dinheiro or 0),
            "esperado_dinheiro": float(c.valor_esperado_dinheiro or 0),
            "diferenca_dinheiro": float(c.diferenca_dinheiro or 0),
            "diferenca_transferencia": float(c.diferenca_transferencia or 0),
            "diferenca_pos": float(c.diferenca_pos or 0),
            "diferenca_total": float(c.diferenca_dinheiro or 0) + float(c.diferenca_transferencia or 0) + float(c.diferenca_pos or 0),
            "explicacao": c.explicacao_divergencia or 'Sem justificação'
        } for c in fechos_com_divergencia
    ]

    total_receita_geral = db.session.query(func.sum(Pedido.valor_total)).scalar() or 0
    total_eventos = db.session.query(func.count(Evento.id)).scalar() or 0

    return jsonify({
        "success": True,
        "timestamp": agora.isoformat(),
        "periodo": {
            "hoje": hoje_str,
            "data_inicio": data_inicio.strftime('%Y-%m-%d'),
            "data_fim": data_fim.strftime('%Y-%m-%d'),
            "mes_atual": mes_atual_str
        },
        "kpis_gerais": {
            "total_receita": float(total_receita_geral),
            "total_pedidos": total_pedidos_geral,
            "total_eventos": total_eventos,
            "valor_hoje": valor_hoje,
            "pedidos_hoje": pedidos_hoje_count,
            "valor_mes_atual": valor_mes_atual,
            "valor_mes_anterior": valor_mes_anterior,
            "variacao_mensal_percentagem": round(variacao_mensal_perc, 2),
            "pedidos_nao_entregues": pedidos_nao_entregues_count,
            "valor_pedidos_nao_entregues": pedidos_nao_entregues_valor,
            "produtos_expirados": prods_expirados,
            "produtos_a_expirar": prods_a_expirar,
            "produtos_stock_baixo": prods_stock_baixo
        },
        "produtos": {
            "total_ativos": total_produtos_ativos,
            "por_tipo": produtos_por_tipo,
            "por_categoria": produtos_por_categoria,
            "mais_vendidos": produtos_mais_vendidos,
            "menos_vendidos": produtos_menos_vendidos,
            "alertas": {
                "expirados": prods_expirados,
                "a_expirar": prods_a_expirar,
                "stock_baixo": prods_stock_baixo
            }
        },
        "utilizadores": {
            "total_ativos": total_utilizadores_ativos,
            "por_cargo": utilizadores_por_cargo,
            "lista_ativos": lista_utilizadores_ativos
        },
        "materiais": {
            "total_ativos": total_materiais_ativos,
            "mais_utilizados": materiais_mais_utilizados,
            "menos_utilizados": materiais_menos_utilizados
        },
        "pedidos_estados": {
            "total_pedidos": total_pedidos_geral,
            "por_estado": pedidos_por_estado,
            "nao_entregues": {
                "quantidade": pedidos_nao_entregues_count,
                "valor_total": pedidos_nao_entregues_valor
            }
        },
        "financeiro_faturacao": {
            "valor_hoje": valor_hoje,
            "pedidos_hoje": pedidos_hoje_count,
            "valor_mes_atual": valor_mes_atual,
            "valores_diarios_ultimos_30_dias": valores_diarios,
            "valores_mensais": valores_mensais
        },
        "reconciliacao_caixa": {
            "caixas_abertos": caixas_abertos,
            "caixas_fechados": caixas_fechados,
            "total_fundo_inicial": float(total_fundo_caixa),
            "total_saldo_fecho": float(total_saldo_fecho),
            "divergencias": {
                "dinheiro": float(dif_dinheiro),
                "transferencia": float(dif_transferencia),
                "pos": float(dif_pos),
                "total": total_divergencias
            },
            "formas_pagamento": formas_pagamento_stats,
            "movimentos_resumo": movimentos_resumo,
            "fechos_recentes_com_divergencia": fechos_divergentes_lista
        }
    }), 200

@relatorios_bp.route('/exportar/<tipo>', methods=['GET'])
@jwt_required()
def exportar(tipo):
    format_exc = request.args.get('formato', 'pdf').lower() # pdf, word, excel, csv
    buffer = io.BytesIO()
    
    titulo = f"Relatório Geral do Sistema - {tipo.upper()}"
    ext = format_exc
    mimetype = 'text/plain'
    
    # Gerar dados reais para exportação
    if tipo == 'produtos':
        prods = Produto.query.filter(Produto.ativo == True).all()
        data_rows = [["ID", "Código", "Nome", "Tipo", "Preço Venda (€)", "Stock Atual", "Validade"]]
        for p in prods:
            data_rows.append([
                p.id, p.codigo or '', p.nome,
                str(p.tipo.value if hasattr(p.tipo, 'value') else p.tipo),
                f"{float(p.preco_venda or 0):.2f}",
                f"{float(p.stock_atual or 0):.2f}",
                p.data_validade.strftime('%d/%m/%Y') if p.data_validade else 'N/A'
            ])
    elif tipo == 'pedidos':
        peds = Pedido.query.order_by(Pedido.id.desc()).limit(50).all()
        data_rows = [["ID", "Número", "Data", "Entrega", "Estado", "Valor (€)", "Pagamento"]]
        for ped in peds:
            data_rows.append([
                ped.id, ped.numero,
                ped.data_pedido.strftime('%d/%m/%Y') if ped.data_pedido else '',
                ped.data_entrega.strftime('%d/%m/%Y') if ped.data_entrega else '',
                str(ped.estado.value if hasattr(ped.estado, 'value') else ped.estado),
                f"{float(ped.valor_total or 0):.2f}",
                str(ped.forma_pagamento.value if hasattr(ped.forma_pagamento, 'value') else ped.forma_pagamento or '')
            ])
    else:
        # Geral
        peds = Pedido.query.all()
        data_rows = [
            ["Métrica", "Valor"],
            ["Total de Pedidos", len(peds)],
            ["Total de Faturação", f"{sum(float(p.valor_total or 0) for p in peds):.2f} €"],
            ["Total de Produtos Ativos", Produto.query.filter_by(ativo=True).count()],
            ["Total de Utilizadores Ativos", User.query.filter_by(is_active=True).count()]
        ]
    
    if format_exc == 'pdf':
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            c = canvas.Canvas(buffer, pagesize=letter)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, 760, titulo)
            c.setFont("Helvetica", 9)
            c.drawString(50, 745, f"Emitido em: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
            
            y = 710
            for row in data_rows:
                if y < 50:
                    c.showPage()
                    y = 750
                    c.setFont("Helvetica", 9)
                text_line = " | ".join(str(item) for item in row)
                c.drawString(50, y, text_line[:110])
                y -= 18
            c.showPage()
            c.save()
            mimetype = 'application/pdf'
        except ImportError:
            buffer.write(b"reportlab nao instalado")
    
    elif format_exc in ('excel', 'xlsx'):
        try:
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            ws.title = tipo.capitalize()
            for row in data_rows:
                ws.append(row)
            wb.save(buffer)
            mimetype = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ext = 'xlsx'
        except ImportError:
            buffer.write(b"openpyxl nao instalado")
            
    elif format_exc == 'csv':
        import csv
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerows(data_rows)
        buffer.write(output.getvalue().encode('utf-8'))
        mimetype = 'text/csv'
        
    else:
        buffer.write(f"Relatório de {tipo.upper()} gerado.".encode('utf-8'))
        
    buffer.seek(0)
    
    return send_file(
        buffer, 
        as_attachment=True, 
        download_name=f"relatorio_{tipo}_{date.today().strftime('%Y%m%d')}.{ext}", 
        mimetype=mimetype
    )
