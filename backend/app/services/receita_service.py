from app.core.database import db
from app.models.receita import ReceitaProducao, ReceitaItem
from app.models.produto import Produto, TipoProduto
from app.services.audit_service import AuditService

class ReceitaService:
    def create_receita(self, data, user_id):
        produto_acabado_id = data.get('produto_acabado_id')
        produto = db.session.query(Produto).filter_by(id=produto_acabado_id).first()
        if not produto or produto.tipo != TipoProduto.ACABADO.value:
            return None, "Produto Acabado inválido"

        receita = ReceitaProducao(
            produto_acabado_id=produto.id,
            descricao=data.get('descricao'),
            tempo_preparacao=data.get('tempo_preparacao'),
            rendimento_unidades=data.get('rendimento_unidades', 1)
        )
        db.session.add(receita)
        db.session.flush()

        itens = data.get('itens', [])
        for it in itens:
            consumivel_id = it.get('produto_consumivel_id')
            qtd = float(it.get('quantidade'))
            
            consumivel = db.session.query(Produto).filter_by(id=consumivel_id).first()
            if not consumivel or consumivel.tipo != TipoProduto.CONSUMIVEL.value:
                return None, f"Ingrediente inválido: {consumivel_id}"
                
            r_item = ReceitaItem(
                receita_id=receita.id,
                produto_consumivel_id=consumivel.id,
                quantidade=qtd,
                observacao=it.get('observacao')
            )
            db.session.add(r_item)

        receita.recalcular_custos()
        db.session.commit()
        
        AuditService.log_action(user_id, "CREATE", "receitas_producao", receita.id, new_values=data)
        return receita, None

    def edit_receita(self, id, data, user_id):
        receita = ReceitaProducao.query.get(id)
        if not receita:
            return None, "Receita não encontrada"
            
        if 'descricao' in data:
            receita.descricao = data['descricao']
        if 'tempo_preparacao' in data:
            receita.tempo_preparacao = data['tempo_preparacao']
        if 'rendimento_unidades' in data:
            receita.rendimento_unidades = data['rendimento_unidades']
            
        receita.recalcular_custos()
        db.session.commit()
        
        AuditService.log_action(user_id, "UPDATE", "receitas_producao", receita.id, new_values=data)
        return receita, None

    def get_receita(self, id):
        receita = ReceitaProducao.query.get(id)
        if not receita:
            return None, "Receita não encontrada"
        
        # simple dump structure with enriched details for frontend convenience
        data = {
            "id": receita.id,
            "produto_acabado_id": receita.produto_acabado_id,
            "produto_acabado_nome": receita.produto_acabado.nome if receita.produto_acabado else None,
            "produto_acabado_codigo": receita.produto_acabado.codigo if receita.produto_acabado else None,
            "descricao": receita.descricao,
            "tempo_preparacao": receita.tempo_preparacao,
            "rendimento_unidades": float(receita.rendimento_unidades),
            "custo_total": float(receita.custo_total),
            "custo_unitario": float(receita.custo_unitario),
            "margem_lucro": float(receita.margem_lucro),
            "rentabilidade": float(receita.rentabilidade),
            "ativo": receita.ativo,
            "itens": []
        }
        for item in receita.itens:
            data["itens"].append({
                "id": item.id,
                "produto_consumivel_id": item.produto_consumivel_id,
                "produto_consumivel_nome": item.consumivel.nome if item.consumivel else None,
                "produto_consumivel_codigo": item.consumivel.codigo if item.consumivel else None,
                "produto_consumivel_unidade_sigla": item.consumivel.unidade_medida.sigla if item.consumivel and item.consumivel.unidade_medida else None,
                "quantidade": float(item.quantidade),
                "custo_calculado": float(item.custo_calculado),
                "observacao": item.observacao
            })
        return data, None

    def add_ingrediente(self, receita_id, data, user_id):
        receita = ReceitaProducao.query.get(receita_id)
        if not receita:
            return None, "Receita não encontrada"
            
        consumivel_id = data.get('produto_consumivel_id')
        qtd = float(data.get('quantidade'))
        
        consumivel = db.session.query(Produto).filter_by(id=consumivel_id).first()
        if not consumivel or consumivel.tipo != TipoProduto.CONSUMIVEL.value:
            return None, "Ingrediente inválido"
            
        item = ReceitaItem(
            receita_id=receita.id,
            produto_consumivel_id=consumivel.id,
            quantidade=qtd,
            observacao=data.get('observacao')
        )
        db.session.add(item)
        receita.itens.append(item)
        
        receita.recalcular_custos()
        db.session.commit()
        AuditService.log_action(user_id, "ADD_ITEM", "receitas_producao", receita.id, new_values=data)
        return item, None

    def remove_ingrediente(self, receita_id, item_id, user_id):
        receita = ReceitaProducao.query.get(receita_id)
        if not receita:
            return False, "Receita não encontrada"
            
        item = ReceitaItem.query.get(item_id)
        if not item or item.receita_id != receita_id:
            return False, "Item não encontrado"
            
        db.session.delete(item)
        receita.itens.remove(item)
        
        receita.recalcular_custos()
        db.session.commit()
        AuditService.log_action(user_id, "REMOVE_ITEM", "receitas_producao", receita.id, new_values={"item_id": item_id})
        return True, None
        
    def duplicate_receita(self, id, new_produto_id, user_id):
        receita = ReceitaProducao.query.get(id)
        if not receita:
            return None, "Receita original não encontrada"
            
        produto = db.session.query(Produto).filter_by(id=new_produto_id).first()
        if not produto or produto.tipo != TipoProduto.ACABADO.value:
            return None, "Produto de destino inválido"
            
        # check if already has receita
        existente = ReceitaProducao.query.filter_by(produto_acabado_id=new_produto_id).first()
        if existente:
            return None, "Produto de destino já possui receita."
            
        nova_receita = ReceitaProducao(
            produto_acabado_id=produto.id,
            descricao=f"Cópia de {receita.descricao}",
            tempo_preparacao=receita.tempo_preparacao,
            rendimento_unidades=receita.rendimento_unidades
        )
        db.session.add(nova_receita)
        db.session.flush()
        
        for item in receita.itens:
            n_item = ReceitaItem(
                receita_id=nova_receita.id,
                produto_consumivel_id=item.produto_consumivel_id,
                quantidade=item.quantidade,
                observacao=item.observacao
            )
            db.session.add(n_item)
            nova_receita.itens.append(n_item)
            
        nova_receita.recalcular_custos()
        db.session.commit()
        
        AuditService.log_action(user_id, "DUPLICATE", "receitas_producao", nova_receita.id, new_values={"original_receita_id": id})
        return nova_receita, None

    def list_receitas(self, page=1, per_page=10, search=""):
        query = ReceitaProducao.query.filter_by(ativo=True)
        if search:
            from sqlalchemy import or_
            query = query.join(Produto, ReceitaProducao.produto_acabado_id == Produto.id).filter(
                or_(
                    ReceitaProducao.descricao.ilike(f"%{search}%"),
                    Produto.nome.ilike(f"%{search}%"),
                    Produto.codigo.ilike(f"%{search}%")
                )
            )
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        items = []
        for r in pagination.items:
            items.append({
                "id": r.id,
                "produto_acabado_id": r.produto_acabado_id,
                "produto_acabado_nome": r.produto_acabado.nome if r.produto_acabado else None,
                "produto_acabado_codigo": r.produto_acabado.codigo if r.produto_acabado else None,
                "descricao": r.descricao,
                "tempo_preparacao": r.tempo_preparacao,
                "rendimento_unidades": float(r.rendimento_unidades),
                "custo_total": float(r.custo_total),
                "custo_unitario": float(r.custo_unitario),
                "margem_lucro": float(r.margem_lucro),
                "rentabilidade": float(r.rentabilidade),
                "ativo": r.ativo,
                "qtd_ingredientes": len(r.itens)
            })
        return {
            "items": items,
            "total": pagination.total,
            "pages": pagination.pages,
            "page": page
        }, None

receita_service = ReceitaService()
