import uuid
from datetime import datetime
from app.models.evento import (
    Evento, EventoServico, Espaco, ReservaEspaco, ReservaMaterial, EventoEquipa, 
    EventoItem, ServicoCadastro, TipoEventoCadastro, EquipaCadastro,
    PoliticaComercialEvento, PoliticaComercialRegra,
    EstadoEvento, EstadoReservaEspaco, TipoItemEvento, TipoCalculoPolitica
)
from app.models.produto import Produto
from app.models.material import Material
from app.models.pedido import Pedido, EstadoPedido
from app.repositories.evento_repos import EventoRepository, EspacoRepository
from app.services.audit_service import AuditService
from app.core.database import db
from app.websocket.socket_manager import socketio

class EventoService:
    def __init__(self):
        self.evento_repo = EventoRepository()
        self.espaco_repo = EspacoRepository()

    def create_espaco(self, data, user_id):
        espaco = Espaco(**data, created_by=user_id)
        self.espaco_repo.create(espaco)
        AuditService.log_action(user_id, "CREATE", "espacos", espaco.id)
        return espaco, None

    def _validar_conflitos(self, data, evento_id=None):
        data_evt = data.get('data_evento')
        if not data_evt and evento_id:
            evt = db.session.query(Evento).get(evento_id)
            if evt:
                data_evt = evt.data_evento

        # Reservas Espaço
        for r in data.get('reservas_espaco', []):
            esp_id = r.get('espaco_id') if isinstance(r, dict) else getattr(r, 'espaco_id', None)
            d_inicio = r.get('data_inicio') if isinstance(r, dict) else getattr(r, 'data_inicio', None)
            d_fim = r.get('data_fim') if isinstance(r, dict) else getattr(r, 'data_fim', None)
            
            if isinstance(d_inicio, str):
                try: d_inicio = datetime.fromisoformat(d_inicio)
                except: pass
            if isinstance(d_fim, str):
                try: d_fim = datetime.fromisoformat(d_fim)
                except: pass

            if esp_id and d_inicio and d_fim:
                query = db.session.query(ReservaEspaco).filter(
                    ReservaEspaco.espaco_id == esp_id,
                    ReservaEspaco.estado != EstadoReservaEspaco.CANCELADO.value,
                    ReservaEspaco.data_inicio < d_fim,
                    ReservaEspaco.data_fim > d_inicio
                )
                if evento_id:
                    query = query.filter(ReservaEspaco.evento_id != evento_id)
                if query.first():
                    return f"Conflito de reserva no espaço ID {esp_id}"

        # Reservas Equipa
        for e in data.get('equipas', []):
            util_id = e.get('utilizador_id') if isinstance(e, dict) else getattr(e, 'utilizador_id', None)
            if util_id and data_evt:
                query = db.session.query(EventoEquipa).join(Evento).filter(
                    EventoEquipa.utilizador_id == util_id,
                    Evento.estado != EstadoEvento.CANCELADO.value,
                    Evento.data_evento == data_evt
                )
                if evento_id:
                    query = query.filter(EventoEquipa.evento_id != evento_id)
                if query.first():
                    return f"Colaborador ID {util_id} já alocado para outro evento no mesmo dia."

        # Reservas Materiais
        for m in data.get('reservas_material', []):
            mat_id = m.get('material_id') if isinstance(m, dict) else getattr(m, 'material_id', None)
            d_inicio = m.get('data_inicio') if isinstance(m, dict) else getattr(m, 'data_inicio', None)
            d_fim = m.get('data_fim') if isinstance(m, dict) else getattr(m, 'data_fim', None)
            qtd = float(m.get('quantidade', 0) if isinstance(m, dict) else getattr(m, 'quantidade', 0))

            if isinstance(d_inicio, str):
                try: d_inicio = datetime.fromisoformat(d_inicio)
                except: pass
            if isinstance(d_fim, str):
                try: d_fim = datetime.fromisoformat(d_fim)
                except: pass

            if mat_id and d_inicio and d_fim:
                query = db.session.query(ReservaMaterial).filter(
                    ReservaMaterial.material_id == mat_id,
                    ReservaMaterial.estado != EstadoReservaEspaco.CANCELADO.value,
                    ReservaMaterial.data_inicio < d_fim,
                    ReservaMaterial.data_fim > d_inicio
                )
                if evento_id:
                    query = query.filter(ReservaMaterial.evento_id != evento_id)
                
                reservas_existentes = query.all()
                quantidade_reservada = sum(float(r.quantidade) for r in reservas_existentes)
                
                material = db.session.query(Material).get(mat_id)
                if material and (quantidade_reservada + qtd) > float(material.quantidade_disponivel or 0):
                    return f"Conflito: Material ID {mat_id} não tem quantidade suficiente disponível para o período."
        
        return None

    def sugerir_preco_item(self, tipo_evento, numero_convidados, tipo_item, referencia_id=None, nome_item=None):
        """
        Procura regras na Política Comercial de Eventos ativa.
        Se encontrada, sugere o valor unitário e traz a mensagem justificativa.
        Se não encontrada, busca o preço sugerido do cadastro base de referência.
        """
        num_part = int(numero_convidados or 1)
        tipo_item_str = str(tipo_item or '').strip()

        # 1. Buscar Política Comercial Ativa para o tipo_evento
        politica = PoliticaComercialEvento.query.filter(
            PoliticaComercialEvento.estado == 'Ativa',
            db.func.lower(PoliticaComercialEvento.tipo_evento) == str(tipo_evento or '').lower()
        ).first()

        if politica:
            regras = [r for r in politica.regras if str(r.tipo_item.value if hasattr(r.tipo_item, 'value') else r.tipo_item).lower() == tipo_item_str.lower()]
            regras = [r for r in regras if r.min_participantes <= num_part <= r.max_participantes]

            regra_escolhida = None
            if referencia_id:
                regra_escolhida = next((r for r in regras if r.referencia_id == int(referencia_id)), None)
            if not regra_escolhida and nome_item:
                regra_escolhida = next((r for r in regras if r.nome_item and r.nome_item.lower() in nome_item.lower()), None)
            if not regra_escolhida and regras:
                regra_escolhida = regras[0]

            if regra_escolhida:
                val_sug = float(regra_escolhida.valor_sugerido or 0.0)
                tipo_calc = str(regra_escolhida.tipo_calculo.value if hasattr(regra_escolhida.tipo_calculo, 'value') else regra_escolhida.tipo_calculo)
                
                if tipo_calc == TipoCalculoPolitica.POR_PARTICIPANTE.value or tipo_calc == 'Por Participante':
                    val_calculado = val_sug * num_part
                else:
                    val_calculado = val_sug

                msg = regra_escolhida.mensagem_sugestao or f"Valor sugerido pela Política Comercial '{politica.nome}' para {tipo_evento} ({regra_escolhida.min_participantes}-{regra_escolhida.max_participantes} convidados)."
                return {
                    "valor_sugerido": val_calculado,
                    "preco_unitario_sugerido": val_sug,
                    "tipo_calculo": tipo_calc,
                    "origem": f"Política Comercial: {politica.nome}",
                    "mensagem": msg,
                    "politica_id": politica.id,
                    "regra_id": regra_escolhida.id
                }

        # 2. Fallback ao Cadastro Base de Referência
        valor_base = 0.0
        origem_str = "Cadastro Base"
        
        if tipo_item_str.lower() in ['servico', 'serviço'] and referencia_id:
            s_cad = ServicoCadastro.query.get(referencia_id)
            if s_cad: valor_base = float(s_cad.preco_sugerido or 0.0); origem_str = f"Cadastro de Serviço: {s_cad.nome}"
        elif tipo_item_str.lower() == 'espaco' and referencia_id:
            esp = Espaco.query.get(referencia_id)
            if esp: valor_base = float(esp.preco_aluguer or 0.0); origem_str = f"Cadastro de Espaço: {esp.nome}"
        elif tipo_item_str.lower() == 'material' and referencia_id:
            mat = Material.query.get(referencia_id)
            if mat: valor_base = float(mat.preco_aluguer or 0.0); origem_str = f"Cadastro de Material: {mat.nome}"
        elif tipo_item_str.lower() in ['maodeobra', 'mão', 'equipa'] and referencia_id:
            eq_cad = EquipaCadastro.query.get(referencia_id)
            if eq_cad: valor_base = float(eq_cad.preco_sugerido or 0.0); origem_str = f"Cadastro de Equipa: {eq_cad.nome}"
        elif tipo_item_str.lower() == 'produto' and referencia_id:
            prod = Produto.query.get(referencia_id)
            if prod: valor_base = float(prod.preco_venda or 0.0); origem_str = f"Tabela de Produto: {prod.nome}"

        return {
            "valor_sugerido": valor_base,
            "preco_unitario_sugerido": valor_base,
            "tipo_calculo": "Fixo",
            "origem": origem_str,
            "mensagem": f"Valor sugerido a partir de {origem_str}.",
            "politica_id": None,
            "regra_id": None
        }

    def create_evento(self, data, user_id):
        error = self._validar_conflitos(data)
        if error: return None, error
        
        itens_data = data.pop('itens', [])
        servicos_data = data.pop('servicos', [])
        espacos_data = data.pop('reservas_espaco', [])
        materiais_data = data.pop('reservas_material', [])
        equipas_data = data.pop('equipas', [])
        
        numero = f"EVT-{datetime.utcnow().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
        data['numero'] = numero
        valor_pago = float(data.get('valor_pago', 0))
        
        evento = Evento(**data, created_by=user_id)

        # 1. Processar Entidade Agregadora EventoItem
        produtos_para_pedido = []
        for it in itens_data:
            q = float(it.get('quantidade', 1))
            pu = float(it.get('preco_unitario', 0))
            perc_desc = float(it.get('percentual_desconto', 0))
            v_desc = float(it.get('valor_desconto', (q * pu * (perc_desc / 100.0))))
            subtotal = max(0.0, (q * pu) - v_desc)
            taxa_iva = float(it.get('taxa_iva', 0))
            v_iva = subtotal * (taxa_iva / 100.0)
            total = subtotal + v_iva

            e_item = EventoItem(
                tipo_item=it['tipo_item'],
                referencia_id=it.get('referencia_id'),
                produto_id=it.get('produto_id'),
                descricao=it['descricao'],
                quantidade=q,
                unidade=it.get('unidade', 'Unidade'),
                preco_unitario=pu,
                percentual_desconto=perc_desc,
                valor_desconto=v_desc,
                taxa_iva=taxa_iva,
                valor_iva=v_iva,
                subtotal=subtotal,
                total=total,
                observacoes=it.get('observacoes'),
                sugestao_politica_id=it.get('sugestao_politica_id'),
                sugestao_origem=it.get('sugestao_origem')
            )
            evento.itens.append(e_item)

            if 'produto' in str(it['tipo_item']).lower() and it.get('produto_id'):
                produtos_para_pedido.append({
                    'tipo_item': it['tipo_item'],
                    'produto_id': it['produto_id'],
                    'descricao': it['descricao'],
                    'quantidade': q,
                    'preco_unitario': pu,
                    'desconto': v_desc,
                    'observacoes': it.get('observacoes')
                })

        # 2. Processar Coleções Legadas (servicos, reservas_espaco, reservas_material, equipas)
        for s in servicos_data:
            q = float(s.get('quantidade', 1))
            pu = float(s.get('valor_unitario', 0))
            desl = float(s.get('deslocacao', 0))
            subtotal = (q * pu) + desl
            es = EventoServico(
                tipo=s['tipo'],
                descricao=s.get('descricao'),
                quantidade=q,
                valor_unitario=pu,
                deslocacao=desl,
                subtotal=subtotal,
                observacoes=s.get('observacoes')
            )
            evento.servicos.append(es)
            
        for e in espacos_data:
            re = ReservaEspaco(
                espaco_id=e['espaco_id'],
                data_inicio=e['data_inicio'],
                data_fim=e['data_fim'],
                valor_aluguer=float(e.get('valor_aluguer', 0))
            )
            evento.reservas_espaco.append(re)
            
        for m in materiais_data:
            q = float(m.get('quantidade', 1))
            pu = float(m.get('valor_unitario', 0))
            subtotal = q * pu
            rm = ReservaMaterial(
                material_id=m['material_id'],
                quantidade=q,
                valor_unitario=pu,
                subtotal=subtotal,
                data_inicio=m['data_inicio'],
                data_fim=m['data_fim']
            )
            evento.reservas_material.append(rm)
            
        for eq in equipas_data:
            eeq = EventoEquipa(**eq)
            evento.equipas.append(eeq)

        # 3. Se houver produtos de qualquer tipo (Acabado, Revenda, Consumível), vincular/gerar Pedido
        if produtos_para_pedido and not evento.pedido_id:
            from app.services.pedido_service import PedidoService
            p_service = PedidoService()
            ped_data = {
                'cliente_id': evento.cliente_id,
                'tipo': 'Composto' if len(produtos_para_pedido) > 1 else 'Simples',
                'origem': 'Balcao',
                'estado': EstadoPedido.AGENDADO,
                'data_entrega': evento.data_evento,
                'hora_entrega': evento.hora_inicio,
                'observacoes': f"Pedido automatico gerado para o Evento {evento.numero}",
                'itens': produtos_para_pedido
            }
            pedido, p_err = p_service.create_pedido(ped_data, user_id)
            if pedido:
                evento.pedido_id = pedido.id

        self.evento_repo.create(evento)
        
        # 4. Acionar ordens de produção se existirem produtos acabados com stock insuficiente
        if evento.pedido_id:
            from app.services.producao_service import ProducaoService
            producao_service = ProducaoService()
            producao_service.gerar_ordens_por_pedido(evento.pedido_id, user_id)

        AuditService.log_action(user_id, "CREATE", "eventos", evento.id, new_values={"numero": evento.numero, "total": float(evento.valor_total)})
        
        socketio.emit('novo_evento', {'numero': evento.numero})
        
        return evento, None

    def update_evento(self, evento_id, data, user_id):
        evento = self.evento_repo.get_by_id(evento_id)
        if not evento: return None, "Evento não encontrado"

        error = self._validar_conflitos(data, evento_id=evento.id)
        if error: return None, error

        if 'itens' in data:
            itens_data = data.pop('itens')
            evento.itens.clear()
            for it in itens_data:
                q = float(it.get('quantidade', 1))
                pu = float(it.get('preco_unitario', 0))
                perc_desc = float(it.get('percentual_desconto', 0))
                v_desc = float(it.get('valor_desconto', (q * pu * (perc_desc / 100.0))))
                subtotal = max(0.0, (q * pu) - v_desc)
                taxa_iva = float(it.get('taxa_iva', 0))
                v_iva = subtotal * (taxa_iva / 100.0)
                total = subtotal + v_iva

                e_item = EventoItem(
                    tipo_item=it['tipo_item'],
                    referencia_id=it.get('referencia_id'),
                    produto_id=it.get('produto_id'),
                    descricao=it['descricao'],
                    quantidade=q,
                    unidade=it.get('unidade', 'Unidade'),
                    preco_unitario=pu,
                    percentual_desconto=perc_desc,
                    valor_desconto=v_desc,
                    taxa_iva=taxa_iva,
                    valor_iva=v_iva,
                    subtotal=subtotal,
                    total=total,
                    observacoes=it.get('observacoes'),
                    sugestao_politica_id=it.get('sugestao_politica_id'),
                    sugestao_origem=it.get('sugestao_origem')
                )
                evento.itens.append(e_item)

        if 'servicos' in data:
            servicos_data = data.pop('servicos')
            evento.servicos.clear()
            for s in servicos_data:
                q = float(s.get('quantidade', 1))
                pu = float(s.get('valor_unitario', 0))
                desl = float(s.get('deslocacao', 0))
                subtotal = (q * pu) + desl
                es = EventoServico(
                    tipo=s['tipo'],
                    descricao=s.get('descricao'),
                    quantidade=q,
                    valor_unitario=pu,
                    deslocacao=desl,
                    subtotal=subtotal,
                    observacoes=s.get('observacoes')
                )
                evento.servicos.append(es)

        if 'reservas_espaco' in data:
            espacos_data = data.pop('reservas_espaco')
            evento.reservas_espaco.clear()
            for e in espacos_data:
                re = ReservaEspaco(
                    espaco_id=e['espaco_id'] if isinstance(e, dict) else getattr(e, 'espaco_id'),
                    data_inicio=e['data_inicio'] if isinstance(e, dict) else getattr(e, 'data_inicio'),
                    data_fim=e['data_fim'] if isinstance(e, dict) else getattr(e, 'data_fim'),
                    valor_aluguer=float(e.get('valor_aluguer', 0) if isinstance(e, dict) else getattr(e, 'valor_aluguer', 0))
                )
                evento.reservas_espaco.append(re)

        if 'reservas_material' in data:
            materiais_data = data.pop('reservas_material')
            evento.reservas_material.clear()
            for m in materiais_data:
                q = float(m.get('quantidade', 1) if isinstance(m, dict) else getattr(m, 'quantidade', 1))
                pu = float(m.get('valor_unitario', 0) if isinstance(m, dict) else getattr(m, 'valor_unitario', 0))
                subtotal = q * pu
                rm = ReservaMaterial(
                    material_id=m['material_id'] if isinstance(m, dict) else getattr(m, 'material_id'),
                    quantidade=q,
                    valor_unitario=pu,
                    subtotal=subtotal,
                    data_inicio=m['data_inicio'] if isinstance(m, dict) else getattr(m, 'data_inicio'),
                    data_fim=m['data_fim'] if isinstance(m, dict) else getattr(m, 'data_fim')
                )
                evento.reservas_material.append(rm)

        if 'equipas' in data:
            equipas_data = data.pop('equipas')
            evento.equipas.clear()
            for eq in equipas_data:
                eeq_data = eq if isinstance(eq, dict) else eq.__dict__
                eeq = EventoEquipa(**eeq_data)
                evento.equipas.append(eeq)

        for key, val in data.items():
            if hasattr(evento, key) and key not in ['id', 'numero', 'servicos', 'reservas_espaco', 'reservas_material', 'equipas', 'itens']:
                setattr(evento, key, val)

        db.session.commit()

        # Executar Motor de Planeamento para manter orquestração sincronizada
        try:
            from app.services.planning_engine import PlanningEngine
            PlanningEngine().processar_planeamento_evento(evento.id, user_id)
        except Exception as ex:
            print(f"Erro ao re-processar planeamento do evento: {ex}")

        AuditService.log_action(user_id, "UPDATE", "eventos", evento.id, new_values={"total": float(evento.valor_total or 0)})
        socketio.emit('atualizacao_evento', {'id': evento.id, 'numero': evento.numero})
        return evento, None

    def alterar_estado(self, evento_id, estado, user_id):
        evento = self.evento_repo.get_by_id(evento_id)
        if not evento: return None, "Evento não encontrado"
        
        evento.estado = estado
        db.session.commit()
        
        # Se transitar para Confirmado ou Planeamento Gerado ou Em Preparacao, invocar Motor de Planeamento
        estado_lower = str(estado).lower()
        if any(e in estado_lower for e in ['confirmado', 'planeamento', 'preparacao']):
            from app.services.planning_engine import PlanningEngine
            PlanningEngine().processar_planeamento_evento(evento.id, user_id)

        AuditService.log_action(user_id, "UPDATE_ESTADO", "eventos", evento.id, new_values={"estado": estado})
        return evento, None

    def gerar_planeamento(self, evento_id, user_id):
        from app.services.planning_engine import PlanningEngine
        return PlanningEngine().processar_planeamento_evento(evento_id, user_id)

