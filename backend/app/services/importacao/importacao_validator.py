from typing import List, Dict, Any, Tuple, Set, Optional
from sqlalchemy import or_, func
from app.core.database import db
from app.models.produto import Produto
from app.models.material import Material
from app.services.importacao.importacao_constants import (
    ImportacaoErrorCode,
    ImportacaoWarningCode,
    MAX_IMPORT_ROWS,
    TIPOS_PRODUTO_PERMITIDOS,
    TIPOS_MATERIAL_PERMITIDOS,
    SERVICOS_PERMITIDOS
)
from app.services.importacao.importacao_normalizer import (
    normalizar_texto,
    normalizar_chave_busca,
    normalizar_tipo,
    normalizar_tipo_material,
    normalizar_servico,
    normalizar_numero
)
from app.services.importacao.reference_resolver import ReferenceResolver


class ImportacaoValidator:
    """
    Motor de validação e resolução do catálogo importado via Excel.
    Executa validação estrutural, resolução de referências, regras de negócio e deteção de duplicados em lote.
    """

    def __init__(self, resolver: Optional[ReferenceResolver] = None):
        self.resolver = resolver or ReferenceResolver()

    def validar_lote(self, linhas: Any) -> Dict[str, Any]:
        """
        Valida todas as linhas do payload sem efetuar qualquer escrita na base de dados.
        Retorna estrutura detalhada para exibição na pré-visualização.
        """
        if not isinstance(linhas, list):
            return {
                "success": False,
                "error": {
                    "code": ImportacaoErrorCode.INVALID_PAYLOAD,
                    "message": "O campo 'linhas' deve ser uma lista de registos."
                },
                "total": 0,
                "validas": 0,
                "bloqueadas": 0,
                "avisos": 0,
                "linhas": []
            }

        if len(linhas) == 0:
            return {
                "success": False,
                "error": {
                    "code": ImportacaoErrorCode.EMPTY_FILE,
                    "message": "O ficheiro enviado não contém nenhuma linha para importação."
                },
                "total": 0,
                "validas": 0,
                "bloqueadas": 0,
                "avisos": 0,
                "linhas": []
            }

        if len(linhas) > MAX_IMPORT_ROWS:
            return {
                "success": False,
                "error": {
                    "code": ImportacaoErrorCode.MAX_ROWS_EXCEEDED,
                    "message": f"O lote excede o limite máximo permitido de {MAX_IMPORT_ROWS} linhas por importação."
                },
                "total": len(linhas),
                "validas": 0,
                "bloqueadas": len(linhas),
                "avisos": 0,
                "linhas": []
            }

        # 1. Pré-processamento e normalização linha a linha
        linhas_processadas: List[Dict[str, Any]] = []
        codigos_no_lote: Dict[str, int] = {}  # chave_min -> numero_linha
        nomes_no_lote: Dict[str, int] = {}    # chave_min -> numero_linha

        for idx, linha_bruta in enumerate(linhas, start=2):
            num_linha = linha_bruta.get('linha') if isinstance(linha_bruta, dict) and linha_bruta.get('linha') is not None else idx
            if not isinstance(linha_bruta, dict):
                linhas_processadas.append({
                    "linha": num_linha,
                    "estado": "bloqueado",
                    "valido": False,
                    "erros": [{
                        "code": ImportacaoErrorCode.INVALID_ROW,
                        "field": None,
                        "message": "Formato de linha inválido; cada linha deve ser um objeto JSON."
                    }],
                    "avisos": [],
                    "dados": {},
                    "dados_resolvidos": {}
                })
                continue

            resultado_linha = self._processar_e_validar_linha(num_linha, linha_bruta)
            linhas_processadas.append(resultado_linha)

        # 2. Deteção de duplicados dentro do próprio ficheiro
        for item in linhas_processadas:
            if not item["valido"]:
                continue
            dados = item["dados_resolvidos"]
            codigo = dados.get("codigo")
            nome = dados.get("nome")

            if codigo:
                chave_cod = codigo.lower()
                if chave_cod in codigos_no_lote:
                    linha_anterior = codigos_no_lote[chave_cod]
                    item["erros"].append({
                        "code": ImportacaoErrorCode.DUPLICATE_CODE_IN_FILE,
                        "field": "codigo",
                        "message": f"Código '{codigo}' duplicado no próprio ficheiro (já presente na linha {linha_anterior})."
                    })
                    item["valido"] = False
                    item["estado"] = "bloqueado"
                else:
                    codigos_no_lote[chave_cod] = item["linha"]

            if nome:
                chave_nome = nome.lower()
                if chave_nome in nomes_no_lote:
                    linha_anterior = nomes_no_lote[chave_nome]
                    item["erros"].append({
                        "code": ImportacaoErrorCode.DUPLICATE_NAME_IN_FILE,
                        "field": "nome",
                        "message": f"Nome '{nome}' duplicado no próprio ficheiro (já presente na linha {linha_anterior})."
                    })
                    item["valido"] = False
                    item["estado"] = "bloqueado"
                else:
                    nomes_no_lote[chave_nome] = item["linha"]

        # 3. Deteção de duplicados na Base de Dados em lote (Batch query)
        self._verificar_duplicados_bd_lote(linhas_processadas)

        # 4. Compilar totais e resumo
        total = len(linhas_processadas)
        validas = sum(1 for item in linhas_processadas if item["valido"])
        bloqueadas = total - validas
        total_avisos = sum(len(item["avisos"]) for item in linhas_processadas)

        return {
            "success": True,
            "total": total,
            "validas": validas,
            "bloqueadas": bloqueadas,
            "avisos": total_avisos,
            "linhas": linhas_processadas
        }

    def _processar_e_validar_linha(self, num_linha: int, bruta: Dict[str, Any]) -> Dict[str, Any]:
        """Executa a normalização, resolução e validação individual de uma linha."""
        erros: List[Dict[str, Any]] = []
        avisos: List[Dict[str, Any]] = []
        dados_resolvidos: Dict[str, Any] = {}

        # Normalização básica dos campos textuais
        tipo_raw = bruta.get('tipo')
        tipo = normalizar_tipo(tipo_raw)

        nome = normalizar_texto(bruta.get('nome'))
        codigo = normalizar_texto(bruta.get('codigo'))
        descricao = normalizar_texto(bruta.get('descricao'))

        # Validação do Tipo
        if not tipo:
            erros.append({
                "code": ImportacaoErrorCode.INVALID_TYPE,
                "field": "tipo",
                "message": f"Tipo '{tipo_raw}' inválido. Valores permitidos: Consumivel, Acabado, Revenda, Material."
            })
            return {
                "linha": num_linha,
                "estado": "bloqueado",
                "valido": False,
                "erros": erros,
                "avisos": avisos,
                "dados": bruta,
                "dados_resolvidos": {}
            }

        # Validação do Nome
        if not nome:
            erros.append({
                "code": ImportacaoErrorCode.REQUIRED_FIELD,
                "field": "nome",
                "message": "O campo 'nome' é obrigatório."
            })

        dados_resolvidos['tipo'] = tipo
        dados_resolvidos['nome'] = nome
        dados_resolvidos['codigo'] = codigo
        dados_resolvidos['descricao'] = descricao

        # Normalização numérica de quantidades
        try:
            quantidade_inicial = normalizar_numero(bruta.get('quantidade_inicial'), default=0.0)
            if quantidade_inicial < 0:
                erros.append({
                    "code": ImportacaoErrorCode.INVALID_STOCK,
                    "field": "quantidade_inicial",
                    "message": "A quantidade inicial não pode ser negativa."
                })
        except ValueError as e:
            erros.append({
                "code": ImportacaoErrorCode.INVALID_NUMBER,
                "field": "quantidade_inicial",
                "message": str(e)
            })
            quantidade_inicial = 0.0

        dados_resolvidos['quantidade_inicial'] = quantidade_inicial

        # Resolução do Armazém
        armazem_raw = bruta.get('armazem') or bruta.get('armazem_nome')
        armazem_id_raw = bruta.get('armazem_id')
        armazem_id = self.resolver.resolver_armazem(armazem_raw, armazem_id_raw)

        if (armazem_raw or armazem_id_raw) and not armazem_id:
            erros.append({
                "code": ImportacaoErrorCode.WAREHOUSE_NOT_FOUND,
                "field": "armazem",
                "message": f"Armazém não encontrado no sistema: '{armazem_raw or armazem_id_raw}'."
            })
        elif not armazem_id and quantidade_inicial > 0:
            # Fallback para o armazém padrão se não especificado mas houver quantidade
            if self.resolver.armazem_padrao_id:
                armazem_id = self.resolver.armazem_padrao_id
                avisos.append({
                    "code": ImportacaoWarningCode.DEFAULT_WAREHOUSE_APPLIED,
                    "field": "armazem",
                    "message": "Armazém não indicado; atribuído automaticamente ao Armazém Principal."
                })
            else:
                erros.append({
                    "code": ImportacaoErrorCode.WAREHOUSE_NOT_FOUND,
                    "field": "armazem",
                    "message": "É necessário indicar um armazém válido para dar entrada ao stock inicial."
                })

        dados_resolvidos['armazem_id'] = armazem_id

        # Resolução da Taxa de IVA (opcional para ambos)
        taxa_iva_raw = bruta.get('taxa_iva') if bruta.get('taxa_iva') is not None else bruta.get('iva')
        taxa_iva_id_raw = bruta.get('taxa_iva_id')
        if taxa_iva_raw is not None or taxa_iva_id_raw is not None:
            taxa_iva_id = self.resolver.resolver_taxa_iva(taxa_iva_raw, taxa_iva_id_raw)
            if not taxa_iva_id:
                erros.append({
                    "code": ImportacaoErrorCode.TAX_NOT_FOUND,
                    "field": "taxa_iva",
                    "message": f"Taxa de IVA não encontrada ou inativa no sistema: '{taxa_iva_raw if taxa_iva_raw is not None else taxa_iva_id_raw}'."
                })
            else:
                dados_resolvidos['taxa_iva_id'] = taxa_iva_id
        else:
            dados_resolvidos['taxa_iva_id'] = None

        # Ramo específico: MATERIAL
        if tipo == 'Material':
            tipo_mat_raw = bruta.get('tipo_material') or 'Reutilizavel'
            tipo_material = normalizar_tipo_material(tipo_mat_raw)
            if not tipo_material:
                erros.append({
                    "code": ImportacaoErrorCode.INVALID_MATERIAL_TYPE,
                    "field": "tipo_material",
                    "message": f"Subtipo de material inválido: '{tipo_mat_raw}'. Valores permitidos: Reutilizavel, Consumivel."
                })
            dados_resolvidos['tipo_material'] = tipo_material or 'Reutilizavel'

            # Valor unitário (opcional / default 0)
            try:
                raw_vu = bruta.get('valor_unitario') if bruta.get('valor_unitario') is not None else bruta.get('preco_compra')
                valor_unitario = normalizar_numero(raw_vu, default=0.0)
                if valor_unitario < 0:
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_PRICE,
                        "field": "valor_unitario",
                        "message": "O valor unitário não pode ser negativo."
                    })
                dados_resolvidos['valor_unitario'] = valor_unitario
            except ValueError as e:
                erros.append({
                    "code": ImportacaoErrorCode.INVALID_NUMBER,
                    "field": "valor_unitario",
                    "message": str(e)
                })

            # Stock mínimo para material (opcional)
            dados_resolvidos['stock_minimo'] = normalizar_numero(bruta.get('stock_minimo'), default=0.0)

            # Unidade de medida para material (opcional)
            um_raw = bruta.get('unidade_medida') or bruta.get('unidade')
            um_id_raw = bruta.get('unidade_medida_id')
            if um_raw or um_id_raw:
                um_id = self.resolver.resolver_unidade_medida(um_raw, um_id_raw)
                if not um_id:
                    erros.append({
                        "code": ImportacaoErrorCode.UNIT_NOT_FOUND,
                        "field": "unidade_medida",
                        "message": f"Unidade de medida não encontrada: '{um_raw or um_id_raw}'."
                    })
                dados_resolvidos['unidade_medida_id'] = um_id
            else:
                dados_resolvidos['unidade_medida_id'] = None

        # Ramo específico: PRODUTOS (Consumivel, Acabado, Revenda)
        else:
            # 1. Categoria (obrigatória para todos os produtos)
            cat_raw = bruta.get('categoria') or bruta.get('categoria_nome')
            cat_id_raw = bruta.get('categoria_id')
            if not cat_raw and not cat_id_raw:
                erros.append({
                    "code": ImportacaoErrorCode.REQUIRED_FIELD,
                    "field": "categoria",
                    "message": "O campo 'categoria' é obrigatório para produtos."
                })
                categoria_id = None
            else:
                categoria_id = self.resolver.resolver_categoria(cat_raw, cat_id_raw)
                if not categoria_id:
                    erros.append({
                        "code": ImportacaoErrorCode.CATEGORY_NOT_FOUND,
                        "field": "categoria",
                        "message": f"Categoria não encontrada: '{cat_raw or cat_id_raw}'."
                    })
            dados_resolvidos['categoria_id'] = categoria_id

            # 2. Unidade de Medida (obrigatória para todos os produtos)
            um_raw = bruta.get('unidade_medida') or bruta.get('unidade')
            um_id_raw = bruta.get('unidade_medida_id')
            if not um_raw and not um_id_raw:
                erros.append({
                    "code": ImportacaoErrorCode.REQUIRED_FIELD,
                    "field": "unidade_medida",
                    "message": "O campo 'unidade_medida' é obrigatório para produtos."
                })
                unidade_medida_id = None
            else:
                unidade_medida_id = self.resolver.resolver_unidade_medida(um_raw, um_id_raw)
                if not unidade_medida_id:
                    erros.append({
                        "code": ImportacaoErrorCode.UNIT_NOT_FOUND,
                        "field": "unidade_medida",
                        "message": f"Unidade de medida não encontrada: '{um_raw or um_id_raw}'."
                    })
            dados_resolvidos['unidade_medida_id'] = unidade_medida_id

            # 3. Stock Mínimo
            try:
                stock_minimo = normalizar_numero(bruta.get('stock_minimo'), default=0.0)
                if stock_minimo < 0:
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_STOCK,
                        "field": "stock_minimo",
                        "message": "O stock mínimo não pode ser negativo."
                    })
                dados_resolvidos['stock_minimo'] = stock_minimo
            except ValueError as e:
                erros.append({
                    "code": ImportacaoErrorCode.INVALID_NUMBER,
                    "field": "stock_minimo",
                    "message": str(e)
                })
                stock_minimo = 0.0

            # Alerta de stock baixo se quantidade inicial <= stock mínimo
            if quantidade_inicial <= stock_minimo and stock_minimo > 0:
                avisos.append({
                    "code": ImportacaoWarningCode.LOW_INITIAL_STOCK,
                    "field": "quantidade_inicial",
                    "message": f"Stock inicial ({quantidade_inicial}) é menor ou igual ao stock mínimo ({stock_minimo})."
                })

            # 4. Preços e Regras específicas por Tipo de Produto
            servico_normalizado = normalizar_servico(bruta.get('servico'))

            if tipo == 'Consumivel':
                # Preço de compra obrigatório
                try:
                    preco_compra = normalizar_numero(bruta.get('preco_compra'))
                    if preco_compra is None or preco_compra < 0:
                        erros.append({
                            "code": ImportacaoErrorCode.REQUIRED_FIELD if preco_compra is None else ImportacaoErrorCode.INVALID_PRICE,
                            "field": "preco_compra",
                            "message": "O campo 'preco_compra' é obrigatório e deve ser maior ou igual a 0 para Consumível."
                        })
                    dados_resolvidos['preco_compra'] = preco_compra or 0.0
                except ValueError as e:
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_PRICE,
                        "field": "preco_compra",
                        "message": str(e)
                    })

                # Consumível não tem tempo de produção nem preço de venda
                tempo_prod = bruta.get('tempo_producao')
                if tempo_prod not in (None, '', 0, '0'):
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_NUMBER,
                        "field": "tempo_producao",
                        "message": "Consumível não pode ter tempo de produção."
                    })
                dados_resolvidos['tempo_producao'] = None
                dados_resolvidos['preco_venda'] = 0.0

                # Serviço para Consumível é fixo em ABASTECIMENTO
                if servico_normalizado and servico_normalizado != 'ABASTECIMENTO':
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_SERVICE,
                        "field": "servico",
                        "message": "Serviço inválido para Consumível. Apenas 'ABASTECIMENTO' é permitido."
                    })
                dados_resolvidos['servico'] = 'ABASTECIMENTO'

            elif tipo == 'Acabado':
                # Preço de venda obrigatório
                try:
                    preco_venda = normalizar_numero(bruta.get('preco_venda'))
                    if preco_venda is None or preco_venda < 0:
                        erros.append({
                            "code": ImportacaoErrorCode.REQUIRED_FIELD if preco_venda is None else ImportacaoErrorCode.INVALID_PRICE,
                            "field": "preco_venda",
                            "message": "O campo 'preco_venda' é obrigatório para Produto Acabado."
                        })
                    dados_resolvidos['preco_venda'] = preco_venda or 0.0
                except ValueError as e:
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_PRICE,
                        "field": "preco_venda",
                        "message": str(e)
                    })

                # Tempo de produção obrigatório
                try:
                    tempo_prod = normalizar_numero(bruta.get('tempo_producao'))
                    if tempo_prod is None or tempo_prod < 0:
                        erros.append({
                            "code": ImportacaoErrorCode.REQUIRED_FIELD if tempo_prod is None else ImportacaoErrorCode.INVALID_NUMBER,
                            "field": "tempo_producao",
                            "message": "O campo 'tempo_producao' (minutos) é obrigatório para Produto Acabado."
                        })
                    dados_resolvidos['tempo_producao'] = int(tempo_prod) if tempo_prod is not None else 0
                except ValueError as e:
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_NUMBER,
                        "field": "tempo_producao",
                        "message": str(e)
                    })

                # Serviço obrigatório: COZINHA ou PASTELARIA
                if not servico_normalizado or servico_normalizado not in ('COZINHA', 'PASTELARIA'):
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_SERVICE,
                        "field": "servico",
                        "message": "O campo 'servico' é obrigatório para Produto Acabado ('COZINHA' ou 'PASTELARIA')."
                    })
                dados_resolvidos['servico'] = servico_normalizado
                dados_resolvidos['preco_compra'] = 0.0  # Calculado posteriormente por ficha técnica

            elif tipo == 'Revenda':
                # Preço de compra e preço de venda obrigatórios
                try:
                    preco_compra = normalizar_numero(bruta.get('preco_compra'))
                    if preco_compra is None or preco_compra < 0:
                        erros.append({
                            "code": ImportacaoErrorCode.REQUIRED_FIELD if preco_compra is None else ImportacaoErrorCode.INVALID_PRICE,
                            "field": "preco_compra",
                            "message": "O campo 'preco_compra' é obrigatório para Produto de Revenda."
                        })
                    dados_resolvidos['preco_compra'] = preco_compra or 0.0
                except ValueError as e:
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_PRICE,
                        "field": "preco_compra",
                        "message": str(e)
                    })

                try:
                    preco_venda = normalizar_numero(bruta.get('preco_venda'))
                    if preco_venda is None or preco_venda < 0:
                        erros.append({
                            "code": ImportacaoErrorCode.REQUIRED_FIELD if preco_venda is None else ImportacaoErrorCode.INVALID_PRICE,
                            "field": "preco_venda",
                            "message": "O campo 'preco_venda' é obrigatório para Produto de Revenda."
                        })
                    dados_resolvidos['preco_venda'] = preco_venda or 0.0
                except ValueError as e:
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_PRICE,
                        "field": "preco_venda",
                        "message": str(e)
                    })

                # Serviço para Revenda é fixo em BAR
                if servico_normalizado and servico_normalizado != 'BAR':
                    erros.append({
                        "code": ImportacaoErrorCode.INVALID_SERVICE,
                        "field": "servico",
                        "message": "Serviço inválido para Revenda. Apenas 'BAR' é permitido."
                    })
                dados_resolvidos['servico'] = 'BAR'
                dados_resolvidos['tempo_producao'] = None

        valido = len(erros) == 0
        return {
            "linha": num_linha,
            "estado": "valido" if valido else "bloqueado",
            "valido": valido,
            "erros": erros,
            "avisos": avisos,
            "dados": bruta,
            "dados_resolvidos": dados_resolvidos
        }

    def _verificar_duplicados_bd_lote(self, linhas_processadas: List[Dict[str, Any]]):
        """Verifica duplicações contra a base de dados em lote único de alta performance."""
        # 1. Separar nomes e códigos por modelo (Produto vs Material)
        nomes_produtos_set: Set[str] = set()
        codigos_produtos_set: Set[str] = set()
        nomes_materiais_set: Set[str] = set()
        codigos_materiais_set: Set[str] = set()

        for item in linhas_processadas:
            if not item["valido"]:
                continue
            tipo = item["dados_resolvidos"].get("tipo")
            nome = item["dados_resolvidos"].get("nome")
            cod = item["dados_resolvidos"].get("codigo")

            if tipo == 'Material':
                if nome:
                    nomes_materiais_set.add(nome.lower())
                if cod:
                    codigos_materiais_set.add(cod.lower())
            else:
                if nome:
                    nomes_produtos_set.add(nome.lower())
                if cod:
                    codigos_produtos_set.add(cod.lower())

        # 2. Consultas em lote para Produtos
        produtos_nomes_db: Set[str] = set()
        produtos_codigos_db: Set[str] = set()

        if nomes_produtos_set or codigos_produtos_set:
            condicoes = []
            if nomes_produtos_set:
                condicoes.append(func.lower(Produto.nome).in_(list(nomes_produtos_set)))
            if codigos_produtos_set:
                condicoes.append(func.lower(Produto.codigo).in_(list(codigos_produtos_set)))

            filtro = or_(*condicoes)
            if hasattr(Produto, 'is_active'):
                query = Produto.query.filter(Produto.is_active == True, filtro)
            elif hasattr(Produto, 'ativo'):
                query = Produto.query.filter(Produto.ativo == True, filtro)
            else:
                query = Produto.query.filter(filtro)

            for prod in query.all():
                if prod.nome:
                    produtos_nomes_db.add(prod.nome.lower())
                if prod.codigo:
                    produtos_codigos_db.add(prod.codigo.lower())

        # 3. Consultas em lote para Materiais
        materiais_nomes_db: Set[str] = set()
        materiais_codigos_db: Set[str] = set()

        if nomes_materiais_set or codigos_materiais_set:
            condicoes = []
            if nomes_materiais_set:
                condicoes.append(func.lower(Material.nome).in_(list(nomes_materiais_set)))
            if codigos_materiais_set:
                condicoes.append(func.lower(Material.codigo).in_(list(codigos_materiais_set)))

            filtro = or_(*condicoes)
            if hasattr(Material, 'is_active'):
                query = Material.query.filter(Material.is_active == True, filtro)
            elif hasattr(Material, 'ativo'):
                query = Material.query.filter(Material.ativo == True, filtro)
            else:
                query = Material.query.filter(filtro)

            for mat in query.all():
                if mat.nome:
                    materiais_nomes_db.add(mat.nome.lower())
                if mat.codigo:
                    materiais_codigos_db.add(mat.codigo.lower())

        # 4. Atribuir erros aos itens duplicados na base de dados
        for item in linhas_processadas:
            if not item["valido"]:
                continue
            tipo = item["dados_resolvidos"].get("tipo")
            nome = item["dados_resolvidos"].get("nome", "")
            cod = item["dados_resolvidos"].get("codigo", "")

            if tipo == 'Material':
                if cod and cod.lower() in materiais_codigos_db:
                    item["erros"].append({
                        "code": ImportacaoErrorCode.CODE_ALREADY_EXISTS,
                        "field": "codigo",
                        "message": f"O código de material '{cod}' já está registado e ativo no sistema."
                    })
                    item["valido"] = False
                    item["estado"] = "bloqueado"

                if nome and nome.lower() in materiais_nomes_db:
                    item["erros"].append({
                        "code": ImportacaoErrorCode.NAME_ALREADY_EXISTS,
                        "field": "nome",
                        "message": f"O material '{nome}' já existe no catálogo do sistema."
                    })
                    item["valido"] = False
                    item["estado"] = "bloqueado"
            else:
                if cod and cod.lower() in produtos_codigos_db:
                    item["erros"].append({
                        "code": ImportacaoErrorCode.CODE_ALREADY_EXISTS,
                        "field": "codigo",
                        "message": f"O código de produto '{cod}' já está registado e ativo no sistema."
                    })
                    item["valido"] = False
                    item["estado"] = "bloqueado"

                if nome and nome.lower() in produtos_nomes_db:
                    item["erros"].append({
                        "code": ImportacaoErrorCode.NAME_ALREADY_EXISTS,
                        "field": "nome",
                        "message": f"O produto '{nome}' já existe no catálogo do sistema."
                    })
                    item["valido"] = False
                    item["estado"] = "bloqueado"
