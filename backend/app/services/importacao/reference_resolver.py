from typing import Optional, Dict, Any
from app.core.database import db
from app.models.categoria_produto import CategoriaProduto
from app.models.unidade_medida import UnidadeMedida
from app.models.comercial import TaxaIVA
from app.models.armazem import Armazem
from app.services.importacao.importacao_normalizer import (
    normalizar_texto,
    normalizar_chave_busca,
    normalizar_taxa_iva
)

class ReferenceResolver:
    """
    Camada responsável por resolver nomes, códigos, siglas e percentagens em IDs de base de dados.
    Carrega os dados em lote na inicialização para garantir alta performance e evitar N+1 queries.
    """

    def __init__(self):
        self._carregado = False
        self.categorias_por_id: Dict[int, CategoriaProduto] = {}
        self.categorias_por_nome: Dict[str, int] = {}
        self.unidades_por_id: Dict[int, UnidadeMedida] = {}
        self.unidades_por_sigla: Dict[str, int] = {}
        self.unidades_por_nome: Dict[str, int] = {}
        self.taxas_por_id: Dict[int, TaxaIVA] = {}
        self.taxas_por_descricao: Dict[str, int] = {}
        self.taxas_por_percentagem: Dict[float, int] = {}
        self.armazens_por_id: Dict[int, Armazem] = {}
        self.armazens_por_nome: Dict[str, int] = {}
        self.armazens_por_codigo: Dict[str, int] = {}
        self.armazem_padrao_id: Optional[int] = None

    def _assegurar_carregado(self):
        """Garante que as tabelas de referência foram carregadas dentro de um application context ativo."""
        if not self._carregado:
            self._carregar_tabelas()

    def recarregar(self):
        """Força o recarregamento das tabelas em memória."""
        self._carregar_tabelas()

    def _carregar_tabelas(self):
        self._carregado = True
        # 1. Categorias
        categorias = CategoriaProduto.query.all()
        self.categorias_por_id: Dict[int, CategoriaProduto] = {c.id: c for c in categorias}
        self.categorias_por_nome: Dict[str, int] = {
            normalizar_chave_busca(c.nome): c.id for c in categorias if c.nome
        }

        # 2. Unidades de Medida
        unidades = UnidadeMedida.query.all()
        self.unidades_por_id: Dict[int, UnidadeMedida] = {u.id: u for u in unidades}
        self.unidades_por_sigla: Dict[str, int] = {
            normalizar_chave_busca(u.sigla): u.id for u in unidades if u.sigla
        }
        self.unidades_por_nome: Dict[str, int] = {
            normalizar_chave_busca(u.nome): u.id for u in unidades if u.nome
        }

        # 3. Taxas de IVA
        taxas = TaxaIVA.query.filter_by(ativo=True).all()
        self.taxas_por_id: Dict[int, TaxaIVA] = {t.id: t for t in taxas}
        self.taxas_por_descricao: Dict[str, int] = {
            normalizar_chave_busca(t.descricao): t.id for t in taxas if t.descricao
        }
        self.taxas_por_percentagem: Dict[float, int] = {
            round(float(t.percentagem), 2): t.id for t in taxas if t.percentagem is not None
        }

        # 4. Armazéns
        armazens = Armazem.query.filter_by(is_active=True).all() if hasattr(Armazem, 'is_active') else Armazem.query.all()
        self.armazens_por_id: Dict[int, Armazem] = {a.id: a for a in armazens}
        self.armazens_por_nome: Dict[str, int] = {
            normalizar_chave_busca(a.nome): a.id for a in armazens if a.nome
        }
        self.armazens_por_codigo: Dict[str, int] = {
            normalizar_chave_busca(a.codigo): a.id for a in armazens if a.codigo
        }
        # Identificar o armazém principal ou primeiro ativo
        self.armazem_padrao_id: Optional[int] = None
        for a in armazens:
            if getattr(a, 'principal', False):
                self.armazem_padrao_id = a.id
                break
        if not self.armazem_padrao_id and armazens:
            self.armazem_padrao_id = armazens[0].id

    def resolver_categoria(self, valor_nome: Any, valor_id: Any = None) -> Optional[int]:
        """Resolve o ID da categoria pelo ID direto ou pelo nome."""
        self._assegurar_carregado()
        if valor_id:
            try:
                cid = int(valor_id)
                if cid in self.categorias_por_id:
                    return cid
            except (ValueError, TypeError):
                pass
        chave = normalizar_chave_busca(valor_nome)
        if not chave:
            return None
        return self.categorias_por_nome.get(chave)

    def resolver_unidade_medida(self, valor_sigla_ou_nome: Any, valor_id: Any = None) -> Optional[int]:
        """Resolve a unidade pelo ID direto, sigla (ex: KG) ou nome (ex: Quilograma)."""
        self._assegurar_carregado()
        if valor_id:
            try:
                uid = int(valor_id)
                if uid in self.unidades_por_id:
                    return uid
            except (ValueError, TypeError):
                pass
        chave = normalizar_chave_busca(valor_sigla_ou_nome)
        if not chave:
            return None
        # 1. Tentar por sigla
        if chave in self.unidades_por_sigla:
            return self.unidades_por_sigla[chave]
        # 2. Tentar por nome completo
        if chave in self.unidades_por_nome:
            return self.unidades_por_nome[chave]
        return None

    def resolver_taxa_iva(self, valor_taxa: Any, valor_id: Any = None) -> Optional[int]:
        """Resolve a taxa de IVA pelo ID direto, descrição ('Normal') ou percentagem ('15%', 0.15, 15)."""
        self._assegurar_carregado()
        if valor_id is not None:
            try:
                tid = int(valor_id)
                if tid in self.taxas_por_id:
                    return tid
            except (ValueError, TypeError):
                pass

        if valor_taxa is None or str(valor_taxa).strip() == "":
            return None

        chave = normalizar_chave_busca(valor_taxa)
        # 1. Tentar por descrição
        if chave in self.taxas_por_descricao:
            return self.taxas_por_descricao[chave]

        # 2. Tentar por percentagem numérica
        num_pct = normalizar_taxa_iva(valor_taxa)
        if num_pct is not None:
            round_pct = round(num_pct, 2)
            if round_pct in self.taxas_por_percentagem:
                return self.taxas_por_percentagem[round_pct]

            # Tolerância para 0% / Isenção
            if round_pct == 0.0:
                for t in self.taxas_por_id.values():
                    try:
                        if float(t.percentagem) == 0.0 or 'isento' in (t.descricao or '').lower():
                            return t.id
                    except (ValueError, TypeError):
                        pass

            # Tolerância para taxa normal positiva (ex: 15% vs 14%)
            if round_pct > 0:
                # Procura por proximidade (diferença <= 2%)
                for p, tid in self.taxas_por_percentagem.items():
                    if abs(p - round_pct) <= 2.0:
                        return tid
                # Se só houver uma taxa positiva ativa no sistema (ex: IVA Geral)
                positivas = [t for t in self.taxas_por_id.values() if t.percentagem and float(t.percentagem) > 0]
                if len(positivas) == 1:
                    return positivas[0].id

        return None

    def resolver_armazem(self, valor_nome_ou_codigo: Any, valor_id: Any = None) -> Optional[int]:
        """Resolve o armazém pelo ID direto, nome ou código com tolerância a variações."""
        self._assegurar_carregado()
        if valor_id is not None:
            try:
                aid = int(valor_id)
                if aid in self.armazens_por_id:
                    return aid
            except (ValueError, TypeError):
                pass

        chave = normalizar_chave_busca(valor_nome_ou_codigo)
        if not chave:
            return self.armazem_padrao_id

        if chave in self.armazens_por_nome:
            return self.armazens_por_nome[chave]
        if chave in self.armazens_por_codigo:
            return self.armazens_por_codigo[chave]

        # Correspondência parcial (ex: "armazem 1" vs "armazem central")
        for nome_key, aid in self.armazens_por_nome.items():
            if chave in nome_key or nome_key in chave:
                return aid

        # Fallback para o armazém padrão se existir
        return self.armazem_padrao_id

    def get_template_catalog(self) -> Dict[str, Any]:
        """Retorna as listas de valores válidos atuais no sistema para auxiliar no preenchimento do Excel."""
        self._assegurar_carregado()
        return {
            "tipos": ["Consumivel", "Acabado", "Revenda", "Material"],
            "tipos_material": ["Reutilizavel", "Consumivel"],
            "servicos": ["ABASTECIMENTO", "COZINHA", "PASTELARIA", "BAR"],
            "categorias": [{"id": c.id, "nome": c.nome} for c in self.categorias_por_id.values()],
            "unidades_medida": [{"id": u.id, "sigla": u.sigla, "nome": u.nome} for u in self.unidades_por_id.values()],
            "taxas_iva": [{"id": t.id, "descricao": t.descricao, "percentagem": float(t.percentagem)} for t in self.taxas_por_id.values()],
            "armazens": [{"id": a.id, "codigo": a.codigo, "nome": a.nome, "principal": getattr(a, 'principal', False)} for a in self.armazens_por_id.values()]
        }
