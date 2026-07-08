from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.core.database import db
from app.models.producao_nova import Producao, ProducaoItem, ProducaoDesvio
from app.models.receita import ReceitaProducao, ReceitaItem
from app.models.produto import Produto
from app.models.stock_movement import StockMovement, TipoMovimentoStock
import uuid
from datetime import datetime

producao_lote_bp = Blueprint('producao_lote', __name__)

@producao_lote_bp.route('/lotes', methods=['POST'])
@jwt_required()
def create_lote():
    data = request.json
    user_id = get_jwt_identity()

    produto_id = data.get('produto_id')
    quantidade = data.get('quantidade_produzida')
    
    produto = db.session.query(Produto).filter_by(id=produto_id).first()
    if not produto:
        return jsonify({"msg": "Produto não encontrado"}), 404

    receita = db.session.query(ReceitaProducao).filter_by(produto_acabado_id=produto.id).first()
    if not receita:
        return jsonify({"msg": "Receita não encontrada para este produto"}), 404

    numero = f"PRD-{datetime.utcnow().strftime('%Y%M')}-{str(uuid.uuid4())[:6].upper()}"
    
    producao = Producao(
        numero=numero,
        produto_id=produto.id,
        quantidade_produzida=quantidade,
        responsavel_id=user_id,
        turno=data.get('turno'),
        observacoes=data.get('observacoes')
    )
    db.session.add(producao)
    db.session.flush() # get producao.id
    
    itens = data.get('itens', [])
    for it in itens:
        consumivel_id = it.get('produto_consumivel_id')
        qtd_real = float(it.get('quantidade_real'))
        
        # Calculate expected based on receita
        receita_item = next((r for r in receita.itens if r.produto_consumivel_id == consumivel_id), None)
        if not receita_item:
            return jsonify({"msg": f"Consumível {consumivel_id} não faz parte da receita"}), 400
        
        qtd_prevista = float(receita_item.quantidade) * float(quantidade)
        
        prod_item = ProducaoItem(
            producao_id=producao.id,
            produto_consumivel_id=consumivel_id,
            quantidade_prevista=qtd_prevista,
            quantidade_real=qtd_real
        )
        db.session.add(prod_item)
        
        diferenca = qtd_real - qtd_prevista
        if diferenca != 0:
            if not it.get('justificativa'):
                return jsonify({"msg": "Justificativa obrigatória para desvios de consumo"}), 400
            
            desvio = ProducaoDesvio(
                producao_id=producao.id,
                produto_consumivel_id=consumivel_id,
                quantidade_prevista=qtd_prevista,
                quantidade_real=qtd_real,
                diferenca=diferenca,
                justificativa=it.get('justificativa'),
                utilizador_id=user_id
            )
            db.session.add(desvio)
            
        # Register stock movement for consumption (raw material)
        consumivel = db.session.query(Produto).filter_by(id=consumivel_id).first()
        stock_ant = float(consumivel.stock_atual)
        consumivel.stock_atual = stock_ant - qtd_real
        mov = StockMovement(
            produto_id=consumivel.id, tipo_movimento=TipoMovimentoStock.PRODUCAO,
            quantidade=-qtd_real, stock_anterior=stock_ant, stock_posterior=consumivel.stock_atual,
            referencia=f"Produção #{producao.numero}", utilizador_id=user_id,
            observacao="Consumo de matéria-prima"
        )
        db.session.add(mov)

    # Register stock movement for finished product
    stock_ant_prod = float(produto.stock_atual)
    produto.stock_atual = stock_ant_prod + float(quantidade)
    mov_prod = StockMovement(
        produto_id=produto.id, tipo_movimento=TipoMovimentoStock.PRODUCAO,
        quantidade=float(quantidade), stock_anterior=stock_ant_prod, stock_posterior=produto.stock_atual,
        referencia=f"Produção #{producao.numero}", utilizador_id=user_id,
        observacao="Entrada de produto acabado"
    )
    db.session.add(mov_prod)

    db.session.commit()
    
    return jsonify({"msg": "Lote de Produção criado com sucesso", "numero": producao.numero}), 201
