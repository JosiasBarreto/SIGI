import logging
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy import text, func
from app.core.database import db
from app.models.produto import Produto, TipoProduto, ServicoEnum
from app.models.material import Material, TipoMaterial, EstadoMaterial
from app.models.armazem import Armazem, ProdutoStockArmazem, MaterialStockArmazem
from app.models.stock_movement import StockMovement, TipoMovimentoStock
from app.services.audit_service import AuditService
from app.services.importacao.importacao_constants import ImportacaoErrorCode
from app.services.importacao.reference_resolver import ReferenceResolver
from app.services.importacao.importacao_validator import ImportacaoValidator

logger = logging.getLogger("sigi.importacao")


class ImportacaoCatalogoService:
    """
    Serviço empresarial de Importação de Catálogo via Excel para o SIGI ERP.
    Garante validação multi-fases, atomicidade transacional e integridade de stocks.
    """

    def __init__(self):
        self.resolver = ReferenceResolver()
        self.validator = ImportacaoValidator(self.resolver)

    def validar_catalogo(self, linhas: Any) -> Dict[str, Any]:
        """
        Ponto de entrada para validação e pré-visualização.
        Retorna estrutura detalhada com compatibilidade total com o frontend existente.
        """
        logger.info("Iniciando validação de lote de importação de catálogo...")
        # Recarregar tabelas de referência para garantir dados atualizados da base de dados na requisição
        self.resolver.recarregar()
        resultado = self.validator.validar_lote(linhas)

        # Compatibilidade com formatos anteriores do front (resumo com validos/invalidos)
        resultado["resumo"] = {
            "total": resultado["total"],
            "validos": resultado["validas"],
            "invalidos": resultado["bloqueadas"],
            "avisos": resultado["avisos"]
        }
        logger.info(f"Validação concluída: {resultado['total']} linhas ({resultado['validas']} válidas, {resultado['bloqueadas']} bloqueadas).")
        return resultado

    def confirmar_importacao(self, linhas: Any, user_id: Any) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Ponto de entrada para gravação do catálogo na base de dados.
        Revalida tudo em tempo real para evitar condições de corrida e garante transação atómica.
        """
        logger.info(f"Iniciando confirmação de importação pelo utilizador {user_id}...")

        # 1. Revalidação integral no momento da confirmação
        validacao = self.validar_catalogo(linhas)
        if not validacao.get("success"):
            erro_info = validacao.get("error") or {}
            return None, {
                "success": False,
                "code": erro_info.get("code", ImportacaoErrorCode.INVALID_PAYLOAD),
                "msg": erro_info.get("message", "Dados de importação inválidos."),
                "message": erro_info.get("message", "Dados de importação inválidos.")
            }

        if validacao["bloqueadas"] > 0:
            linhas_bloqueadas = [item for item in validacao["linhas"] if not item["valido"]]
            logger.warning(f"Importação rejeitada: {validacao['bloqueadas']} linhas inválidas detectadas.")
            return None, {
                "success": False,
                "code": ImportacaoErrorCode.IMPORT_FAILED,
                "msg": "Existem linhas inválidas ou com erros; corrija-as antes de confirmar.",
                "message": "Existem linhas inválidas ou com erros; corrija-as antes de confirmar.",
                "total_bloqueadas": validacao["bloqueadas"],
                "linhas": linhas_bloqueadas
            }

        # 2. Inicializar contadores de códigos em lote para geração sequencial segura
        contadores_codigo = self._inicializar_contadores_codigo()

        # 3. Execução da transação atómica (Tudo ou Nada)
        produtos_criados = []
        materiais_criados = []
        stock_movimentos_count = 0
        inseridos_retrocompat = []

        try:
            for item in validacao["linhas"]:
                dados = item["dados_resolvidos"]
                tipo = dados.get("tipo")
                quantidade_inicial = float(dados.get("quantidade_inicial") or 0.0)
                armazem_id = dados.get("armazem_id")

                if tipo == "Material":
                    # Gerar código se não fornecido
                    codigo_mat = dados.get("codigo")
                    if not codigo_mat:
                        contadores_codigo["MAT"] += 1
                        codigo_mat = f"MAT-{contadores_codigo['MAT']:04d}"

                    # Obter enum de tipo de material
                    subtipo = TipoMaterial.REUTILIZAVEL if dados.get("tipo_material") == "Reutilizavel" else TipoMaterial.CONSUMIVEL

                    material = Material(
                        nome=dados.get("nome"),
                        codigo=codigo_mat,
                        tipo=subtipo,
                        quantidade_total=quantidade_inicial,
                        quantidade_disponivel=quantidade_inicial,
                        quantidade_reservada=0.0,
                        estado=EstadoMaterial.DISPONIVEL,
                        ativo=True,
                        valor_unitario=dados.get("valor_unitario") or 0.0,
                        unidade_medida_id=dados.get("unidade_medida_id"),
                        created_by=user_id
                    )
                    db.session.add(material)
                    db.session.flush()

                    # Criar vínculo no armazém
                    if armazem_id:
                        stock_rel = MaterialStockArmazem(
                            material_id=material.id,
                            armazem_id=armazem_id,
                            stock_atual=quantidade_inicial,
                            stock_minimo=float(dados.get("stock_minimo") or 0.0)
                        )
                        db.session.add(stock_rel)
                        db.session.flush()

                    materiais_criados.append(material.id)
                    inseridos_retrocompat.append({
                        "tipo": "Material",
                        "id": material.id,
                        "codigo": material.codigo,
                        "nome": material.nome,
                        "quantidade_entrada": quantidade_inicial
                    })

                else:
                    # PRODUTO (Consumivel, Acabado, Revenda)
                    prefixo = "REV"
                    if tipo == "Consumivel":
                        prefixo = "ING"
                    elif tipo == "Acabado":
                        prefixo = "PAC"

                    codigo_prod = dados.get("codigo")
                    if not codigo_prod:
                        contadores_codigo[prefixo] += 1
                        codigo_prod = f"{prefixo}{contadores_codigo[prefixo]:06d}"

                    tipo_enum = TipoProduto(tipo)
                    servico_val = dados.get("servico")
                    servico_enum = ServicoEnum(servico_val) if servico_val else None

                    produto = Produto(
                        codigo=codigo_prod,
                        nome=dados.get("nome"),
                        tipo=tipo_enum,
                        servico=servico_enum,
                        categoria_id=dados.get("categoria_id"),
                        unidade_medida_id=dados.get("unidade_medida_id"),
                        tempo_producao=dados.get("tempo_producao"),
                        preco_venda=dados.get("preco_venda") or 0.0,
                        preco_compra=dados.get("preco_compra") or 0.0,
                        stock_atual=quantidade_inicial,
                        stock_minimo=dados.get("stock_minimo") or 0.0,
                        taxa_iva_id=dados.get("taxa_iva_id"),
                        descricao=dados.get("descricao"),
                        ativo=True,
                        created_by=user_id
                    )
                    db.session.add(produto)
                    db.session.flush()

                    # Vínculo no armazém
                    if armazem_id:
                        prod_stock_rel = ProdutoStockArmazem(
                            produto_id=produto.id,
                            armazem_id=armazem_id,
                            stock_atual=quantidade_inicial,
                            stock_minimo=dados.get("stock_minimo") or 0.0
                        )
                        db.session.add(prod_stock_rel)
                        db.session.flush()

                    # Registo oficial de Movimento de Stock se houver quantidade inicial
                    if quantidade_inicial > 0:
                        movimento = StockMovement(
                            produto_id=produto.id,
                            tipo_movimento=TipoMovimentoStock.ENTRADA,
                            quantidade=quantidade_inicial,
                            stock_anterior=0.0,
                            stock_atual=quantidade_inicial,
                            motivo="Importação de Catálogo Excel",
                            observacao="Entrada inicial via importação Excel",
                            utilizador_id=user_id
                        )
                        db.session.add(movimento)
                        db.session.flush()
                        stock_movimentos_count += 1

                    produtos_criados.append(produto.id)
                    inseridos_retrocompat.append({
                        "tipo": tipo,
                        "id": produto.id,
                        "codigo": produto.codigo,
                        "nome": produto.nome,
                        "quantidade_entrada": quantidade_inicial
                    })

            # Commit único e atómico de todos os registos
            db.session.commit()
            logger.info("Transação da importação commitada com sucesso no MySQL.")

            # Registo de auditoria
            importacao_id = f"IMP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{user_id}"
            try:
                AuditService.log_action(
                    user_id=user_id,
                    action="IMPORT",
                    entidade="catalogo",
                    modulo="ARMAZEM",
                    new_values={
                        "importacao_id": importacao_id,
                        "total_processado": len(validacao["linhas"]),
                        "produtos_criados": len(produtos_criados),
                        "materiais_criados": len(materiais_criados),
                        "stock_movimentos": stock_movimentos_count
                    }
                )
            except Exception as e_audit:
                logger.error(f"Aviso: Não foi possível registar log de auditoria da importação: {e_audit}")

            resultado_final = {
                "success": True,
                "msg": "Importação concluída com sucesso.",
                "message": "Importação concluída com sucesso.",
                "itens": inseridos_retrocompat,  # Retrocompatibilidade direta
                "data": {
                    "importacao_id": importacao_id,
                    "total_processado": len(validacao["linhas"]),
                    "produtos_criados": len(produtos_criados),
                    "materiais_criados": len(materiais_criados),
                    "stock_movimentos": stock_movimentos_count
                }
            }
            return resultado_final, None

        except Exception as error:
            db.session.rollback()
            logger.exception(f"Falha crítica na importação de catálogo. Rollback executado: {error}")
            return None, {
                "success": False,
                "code": ImportacaoErrorCode.IMPORT_FAILED,
                "msg": str(error),
                "message": f"Erro durante a gravação da importação: {str(error)}"
            }

    def _inicializar_contadores_codigo(self) -> Dict[str, int]:
        """Calcula com segurança os maiores IDs/números existentes para evitar colisões de códigos gerados."""
        contadores = {"MAT": 0, "ING": 0, "PAC": 0, "REV": 0}

        try:
            # Material
            max_mat = db.session.query(func.max(Material.id)).scalar() or 0
            contadores["MAT"] = int(max_mat)
        except Exception:
            contadores["MAT"] = 0

        # Produtos por prefixo
        for prefix in ("ING", "PAC", "REV"):
            try:
                sql = text("SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) FROM produtos WHERE codigo LIKE :prefix")
                result = db.session.execute(sql, {"prefix": f"{prefix}%"}).scalar()
                contadores[prefix] = int(result) if result is not None else 0
            except Exception:
                contadores[prefix] = 0

        return contadores

    def get_template_info(self) -> Dict[str, Any]:
        """Fornece dados do catálogo atual para alimentar o gerador ou preenchimento de templates Excel."""
        return {
            "success": True,
            "data": self.resolver.get_template_catalog()
        }
