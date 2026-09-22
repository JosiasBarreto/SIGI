from typing import Dict, Any, List, Optional
from sqlalchemy import and_, func
from app.models.inventario import Inventario, InventarioItem, SituacaoDivergencia, EstadoInventario
from app.models.auditoria import Auditoria
from app.models.stock_movement import StockMovement
from app.models.movimento_stock import MovimentoStock
from app.models.armazem import Armazem

class InventarioReportService:
    @staticmethod
    def obter_relatorio_completo(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        itens = [it.to_dict() for it in inventario.items]
        resumo = inventario.calcular_resumo()

        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "resumo": resumo,
            "itens": itens
        }

    @staticmethod
    def obter_relatorio_divergencias(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        itens = [
            it.to_dict() for it in inventario.items
            if it.situacao in [SituacaoDivergencia.FALTA, SituacaoDivergencia.SOBRA]
        ]

        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "resumo": inventario.calcular_resumo(),
            "total_divergencias": len(itens),
            "itens": itens
        }

    @staticmethod
    def obter_relatorio_faltas(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        itens = [
            it.to_dict() for it in inventario.items
            if it.situacao == SituacaoDivergencia.FALTA
        ]

        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "total_faltas": len(itens),
            "itens": itens
        }

    @staticmethod
    def obter_relatorio_sobras(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        itens = [
            it.to_dict() for it in inventario.items
            if it.situacao == SituacaoDivergencia.SOBRA
        ]

        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "total_sobras": len(itens),
            "itens": itens
        }

    @staticmethod
    def obter_relatorio_sem_divergencias(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        itens = [
            it.to_dict() for it in inventario.items
            if it.situacao == SituacaoDivergencia.SEM_DIVERGENCIA
        ]

        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "total_sem_divergencia": len(itens),
            "itens": itens
        }

    @staticmethod
    def obter_relatorio_nao_contados(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        itens = [
            it.to_dict() for it in inventario.items
            if it.situacao == SituacaoDivergencia.NAO_CONTADO
        ]

        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "total_nao_contados": len(itens),
            "itens": itens
        }

    @staticmethod
    def obter_relatorio_ajustes(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        # Consultar movimentos oficiais gerados por este inventário
        movimentos_prod = StockMovement.query.filter_by(referencia=inventario.numero).all()
        movimentos_armazem = MovimentoStock.query.filter(
            MovimentoStock.justificacao.ilike(f"%{inventario.numero}%")
        ).all()

        ajustes = []
        for m in movimentos_prod:
            ajustes.append({
                "entidade": "PRODUTO",
                "produto_id": m.produto_id,
                "codigo": m.produto.codigo if m.produto else "",
                "nome": m.produto.nome if m.produto else "",
                "tipo_movimento": m.tipo_movimento.value if hasattr(m.tipo_movimento, 'value') else str(m.tipo_movimento),
                "stock_anterior": float(m.stock_anterior or 0.0),
                "quantidade_ajuste": float(m.quantidade or 0.0),
                "stock_final": float(m.stock_atual or 0.0),
                "utilizador": m.utilizador.name if m.utilizador else "Sistema",
                "data_hora": m.created_at.isoformat() if hasattr(m, 'created_at') and m.created_at else None,
                "motivo": m.motivo,
                "observacao": m.observacao
            })

        for ma in movimentos_armazem:
            if ma.entidade_tipo.value == 'Material':
                ajustes.append({
                    "entidade": "MATERIAL",
                    "referencia_id": ma.referencia_id,
                    "codigo": "",
                    "nome": f"Material ID {ma.referencia_id}",
                    "tipo_movimento": ma.tipo.value if hasattr(ma.tipo, 'value') else str(ma.tipo),
                    "stock_anterior": float(ma.quantidade_antes or 0.0),
                    "quantidade_ajuste": float(ma.quantidade or 0.0),
                    "stock_final": float(ma.quantidade_depois or 0.0),
                    "utilizador": "Sistema",
                    "data_hora": ma.created_at.isoformat() if hasattr(ma, 'created_at') and ma.created_at else None,
                    "motivo": ma.justificacao,
                    "observacao": ""
                })

        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "total_ajustes_oficiais": len(ajustes),
            "ajustes": ajustes
        }

    @staticmethod
    def obter_relatorio_auditoria(inventario_id: int) -> Optional[Dict[str, Any]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None

        logs = Auditoria.query.filter(
            Auditoria.entidade.in_(['inventarios', 'inventario_items']),
            Auditoria.registo_id == inventario_id
        ).order_by(Auditoria.data_hora.asc()).all()

        linha_do_tempo = []
        for l in logs:
            linha_do_tempo.append({
                "id": l.id,
                "data_hora": l.data_hora.isoformat() if l.data_hora else None,
                "operacao": l.operacao,
                "utilizador_id": l.utilizador_id,
                "utilizador": l.utilizador.name if l.utilizador else "Sistema",
                "ip": l.ip,
                "detalhes": l.valor_novo
            })

        # Adicionar marcos cronológicos se não estiverem nos logs
        return {
            "inventario": inventario.to_dict(include_resumo=False),
            "auditoria": linha_do_tempo
        }

    @staticmethod
    def relatorio_consolidado(filtros: Dict[str, Any]) -> Dict[str, Any]:
        query = Inventario.query

        if filtros.get('armazem_id'):
            query = query.filter(Inventario.armazem_id == filtros['armazem_id'])
        if filtros.get('estado'):
            query = query.filter(Inventario.estado == filtros['estado'])
        if filtros.get('tipo'):
            query = query.filter(Inventario.tipo == filtros['tipo'])
        if filtros.get('data_inicio'):
            query = query.filter(Inventario.data_inventario >= filtros['data_inicio'])
        if filtros.get('data_fim'):
            query = query.filter(Inventario.data_inventario <= filtros['data_fim'])

        inventarios = query.all()

        total_inventarios = len(inventarios)
        total_itens_contados = 0
        total_faltas_qtd = 0.0
        total_sobras_qtd = 0.0
        total_itens_com_divergencia = 0

        motivos_contagem = {}
        armazens_map = {}

        for inv in inventarios:
            resumo = inv.calcular_resumo()
            total_itens_contados += resumo['itens_contados']
            total_faltas_qtd += resumo['quantidade_falta']
            total_sobras_qtd += resumo['quantidade_sobra']
            total_itens_com_divergencia += (resumo['itens_com_falta'] + resumo['itens_com_sobra'])

            arm_nome = inv.armazem.nome if inv.armazem else f"Armazém #{inv.armazem_id}"
            if arm_nome not in armazens_map:
                armazens_map[arm_nome] = {"total_inventarios": 0, "divergencias": 0}
            armazens_map[arm_nome]["total_inventarios"] += 1
            armazens_map[arm_nome]["divergencias"] += (resumo['itens_com_falta'] + resumo['itens_com_sobra'])

            for it in inv.items:
                if it.motivo_ajuste:
                    m_key = it.motivo_ajuste.value if hasattr(it.motivo_ajuste, 'value') else str(it.motivo_ajuste)
                    motivos_contagem[m_key] = motivos_contagem.get(m_key, 0) + 1

        return {
            "periodo": {
                "data_inicio": filtros.get('data_inicio'),
                "data_fim": filtros.get('data_fim')
            },
            "indicadores_gerais": {
                "total_inventarios": total_inventarios,
                "total_itens_contados": total_itens_contados,
                "total_itens_com_divergencia": total_itens_com_divergencia,
                "quantidade_total_falta": round(total_faltas_qtd, 3),
                "quantidade_total_sobra": round(total_sobras_qtd, 3)
            },
            "distribuicao_por_motivo": motivos_contagem,
            "distribuicao_por_armazem": armazens_map
        }
