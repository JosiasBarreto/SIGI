from datetime import datetime
import uuid
from app.models.inventario import Inventario, InventarioItem, EstadoInventario, TipoItemInventario
from app.models.ingrediente import Ingrediente
from app.models.material import Material
from app.models.produto import Produto
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
from app.core.database import db
from app.services.audit_service import AuditService

class InventarioService:
    def create_inventario(self, data, user_id):
        numero = f"INV-{datetime.utcnow().strftime('%Y%M')}-{str(uuid.uuid4())[:6].upper()}"
        
        inventario = Inventario(
            numero=numero,
            tipo=data.get('tipo', 'Geral'),
            observacoes=data.get('observacoes'),
            utilizador_id=user_id
        )
        
        items_data = data.get('items', [])
        for item_data in items_data:
            item = InventarioItem(
                tipo_item=item_data['tipo_item'],
                referencia_id=item_data['referencia_id'],
                quantidade_sistema=float(item_data['quantidade_sistema']),
                quantidade_contada=float(item_data['quantidade_contada']),
                diferenca=float(item_data['quantidade_contada']) - float(item_data['quantidade_sistema']),
                justificativa=item_data.get('justificativa')
            )
            inventario.items.append(item)
            
        db.session.add(inventario)
        db.session.commit()
        AuditService.log_action(user_id, "CREATE", "inventarios", inventario.id)
        return inventario, None

    def concluir_inventario(self, inventario_id, user_id):
        inventario = Inventario.query.get(inventario_id)
        if not inventario: return None, "Inventário não encontrado"
        if inventario.estado == EstadoInventario.CONCLUIDO:
            return None, "Inventário já se encontra concluído"
            
        for item in inventario.items:
            if item.diferenca != 0:
                tipo_movimento = TipoMovimento.ENTRADA if item.diferenca > 0 else TipoMovimento.SAIDA
                entidade = EntidadeMovimento[item.tipo_item.upper()]
                
                mov = MovimentoStock(
                    tipo=tipo_movimento,
                    origem=OrigemMovimento.AJUSTE,
                    entidade_tipo=entidade,
                    referencia_id=item.referencia_id,
                    quantidade=abs(item.diferenca),
                    created_by=user_id,
                    justificacao=f"Ajuste via Inventário {inventario.numero}: {item.justificativa}"
                )
                db.session.add(mov)
                
                # Ajustar Stock Real
                if item.tipo_item == TipoItemInventario.INGREDIENTE.value:
                    ent = Ingrediente.query.get(item.referencia_id)
                    if ent: ent.stock_atual = item.quantidade_contada
                elif item.tipo_item == TipoItemInventario.MATERIAL.value:
                    ent = Material.query.get(item.referencia_id)
                    if ent: ent.quantidade_disponivel = item.quantidade_contada
                elif item.tipo_item == TipoItemInventario.PRODUTO.value:
                    ent = Produto.query.get(item.referencia_id)
                    if ent: ent.stock_atual = item.quantidade_contada
                    
        inventario.estado = EstadoInventario.CONCLUIDO
        inventario.data_fim = datetime.utcnow()
        db.session.commit()
        
        AuditService.log_action(user_id, "CONCLUIR", "inventarios", inventario.id)
        return inventario, None
