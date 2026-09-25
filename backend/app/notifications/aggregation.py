from typing import List, Dict, Any, Optional
from datetime import datetime


class EventAggregator:
    """
    Agregador de eventos relacionados a uma mesma entidade/transação de negócio.
    Evita emissão de múltiplos avisos visuais quando uma ação gera várias sub-operações
    (ex: criação de um pedido que gera 3 ordens de produção para Cozinha, Pastelaria e Bar).
    """

    @staticmethod
    def aggregate_production_orders(
        pedido_numero: str,
        ordens: List[Dict[str, Any]],
        cliente_nome: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Consolida múltiplas ordens de produção num único resumo coerente.
        """
        sectores = set()
        itens_resumo = []

        for ord_info in ordens:
            sec = ord_info.get("sector")
            if sec:
                sectores.add(sec)
            itens = ord_info.get("itens") or []
            for it in itens:
                desc = it.get("descricao") or it.get("nome") or "Artigo"
                qtd = it.get("quantidade", 1)
                itens_resumo.append(f"{desc} ({qtd}x)")

        sectores_str = ", ".join(sorted(sectores)) if sectores else "Cozinha"
        itens_str = ", ".join(itens_resumo) if itens_resumo else "Artigos do pedido"
        cli_str = cliente_nome or "Consumidor Final"

        titulo = f"Nova Produção: Pedido #{pedido_numero}"
        mensagem = (
            f"Ordens de produção geradas para: {sectores_str}.\n"
            f"• Pedido: #{pedido_numero}\n"
            f"• Cliente: {cli_str}\n"
            f"• Artigos a Confecionar: {itens_str}"
        )

        return {
            "titulo": titulo,
            "mensagem": mensagem,
            "sectores": list(sorted(sectores)),
            "itens_str": itens_str,
            "total_ordens": len(ordens)
        }
