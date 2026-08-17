from datetime import datetime
from sqlalchemy.orm import joinedload
from app.core.database import db
from app.models.comercial import Proforma, ProformaItem, TipoDocumento, SerieDocumento

class ProformaService:
    def get_proformas(self, args):
        query = Proforma.query.options(joinedload(Proforma.itens))
        
        # Filtros básicos
        cliente_id = args.get('cliente_id')
        if cliente_id:
            query = query.filter_by(cliente_id=cliente_id)
            
        estado = args.get('estado')
        if estado:
            query = query.filter_by(estado=estado)
            
        data_inicio = args.get('data_inicio')
        if data_inicio:
            query = query.filter(Proforma.created_at >= f"{data_inicio} 00:00:00")
            
        data_fim = args.get('data_fim')
        if data_fim:
            query = query.filter(Proforma.created_at <= f"{data_fim} 23:59:59")
            
        return query.order_by(Proforma.created_at.desc())

    def get_proforma(self, proforma_id: int):
        return Proforma.query.options(joinedload(Proforma.itens)).get(proforma_id)

    def _generate_numero_documento(self):
        ano_atual = datetime.utcnow().year
        serie = SerieDocumento.query.with_for_update().filter_by(tipo_documento='PROFORMA', ano=ano_atual).first()
        
        if not serie:
            serie = SerieDocumento(tipo_documento='PROFORMA', ano=ano_atual, ultimo_numero=0)
            db.session.add(serie)
            db.session.flush()

        serie.ultimo_numero += 1
        return f"PROFORMA {ano_atual}/{serie.ultimo_numero:06d}"

    def create_proforma(self, data: dict, user_id: int):
        from app.models.pedido import Pedido
        from app.models.evento import Evento
        from app.models.cliente import Cliente
        from app.models.produto import Produto
        
        origem = data.get('origem', 'Avulso')
        cliente_id = data.get('cliente_id')
        pedido_id = data.get('pedido_id')
        evento_id = data.get('evento_id')
        
        # Se veio pedido_id e não cliente, pegar do pedido
        if pedido_id and not cliente_id:
            p = Pedido.query.get(pedido_id)
            if p: cliente_id = p.cliente_id
            
        proforma = Proforma(
            numero_documento=self._generate_numero_documento(),
            cliente_id=cliente_id,
            pedido_id=pedido_id,
            origem=origem,
            estado='Emitida',
            observacoes=data.get('observacoes', ''),
            criado_por=user_id,
            subtotal=0,
            desconto_total=0,
            total_iva=0,
            total=0
        )
        db.session.add(proforma)
        db.session.flush()

        subtotal = 0.0
        total_desconto = 0.0
        total_iva = 0.0
        total = 0.0

        for item_data in data.get('itens', []):
            qtd = float(item_data.get('quantidade', 1))
            preco_unitario = float(item_data.get('preco_unitario', 0))
            desconto = float(item_data.get('desconto', 0))
            taxa_iva = float(item_data.get('taxa_iva', 0))
            
            item_sub = (qtd * preco_unitario) - desconto
            item_iva_val = item_sub * (taxa_iva / 100.0)
            item_total = item_sub + item_iva_val
            
            p_item = ProformaItem(
                proforma_id=proforma.id,
                item_tipo=item_data.get('item_tipo', 'Produto'),
                item_id=item_data.get('item_id'),
                descricao=item_data.get('descricao', 'Item'),
                quantidade=qtd,
                preco_unitario=preco_unitario,
                desconto=desconto,
                taxa_iva=taxa_iva,
                valor_iva=item_iva_val,
                subtotal=item_sub,
                total=item_total
            )
            db.session.add(p_item)
            
            subtotal += item_sub + desconto
            total_desconto += desconto
            total_iva += item_iva_val
            total += item_total

        proforma.subtotal = subtotal
        proforma.desconto_total = total_desconto
        proforma.total_iva = total_iva
        proforma.total = total

        db.session.commit()
        return proforma

    def delete_proforma(self, proforma_id: int):
        proforma = self.get_proforma(proforma_id)
        if not proforma:
            raise ValueError("Proforma não encontrada")
            
        if proforma.estado == 'Faturada':
            raise ValueError("Não pode eliminar uma Proforma já faturada")
            
        db.session.delete(proforma)
        db.session.commit()

    def faturar_proforma(self, proforma_id: int, user_id: int):
        from app.services.comercial_service import ComercialService
        proforma = self.get_proforma(proforma_id)
        
        if not proforma:
            raise ValueError("Proforma não encontrada")
        if proforma.estado == 'Faturada':
            raise ValueError("Proforma já foi faturada")
            
        comercial_service = ComercialService()
        
        # Cria FT
        venda_data = {
            'tipo_documento': 'FT',
            'cliente_id': proforma.cliente_id,
            'pedido_id': proforma.pedido_id,
            'observacoes': f"Faturado a partir da Proforma {proforma.numero_documento}. {proforma.observacoes or ''}",
            'itens': []
        }
        
        for item in proforma.itens:
            venda_data['itens'].append({
                'item_tipo': item.item_tipo,
                'item_id': item.item_id,
                'descricao': item.descricao,
                'quantidade': item.quantidade,
                'preco_unitario': item.preco_unitario,
                'desconto': item.desconto,
                'taxa_iva': item.taxa_iva
            })
            
        venda = comercial_service.create_venda(venda_data, user_id)
        
        proforma.estado = 'Faturada'
        db.session.commit()
        
        return venda
