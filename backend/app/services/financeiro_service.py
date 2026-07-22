import uuid
from datetime import datetime
from sqlalchemy import func
from app.models.caixa import Caixa, MovimentoCaixa, EstadoCaixa, TipoMovimentoCaixa
from app.models.financeiro import (
    Pagamento, ContaReceber, ContaPagar, Receita, Despesa, 
    CentroCusto, FormaPagamento, EstadoConta, EstadoPagamento
)
from app.repositories.financeiro_repos import (
    CaixaRepository, MovimentoCaixaRepository, ContaReceberRepository,
    ContaPagarRepository, ReceitaRepository, DespesaRepository
)
from app.services.audit_service import AuditService
from app.core.database import db

class CaixaEncerradoException(Exception):
    pass

class FinanceiroService:
    def __init__(self):
        self.caixa_repo = CaixaRepository()
        self.movimento_repo = MovimentoCaixaRepository()
        self.conta_receber_repo = ContaReceberRepository()
        self.conta_pagar_repo = ContaPagarRepository()
        self.receita_repo = ReceitaRepository()
        self.despesa_repo = DespesaRepository()

    # --- CAIXA ---
    def abrir_caixa(self, valor_inicial, utilizador_id):
        # Verifica se já existe caixa aberto
        caixa_aberto = db.session.query(Caixa).filter_by(estado=EstadoCaixa.ABERTO).first()
        if caixa_aberto:
            return None, "Já existe um caixa aberto."
            
        numero = f"CX-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        caixa = Caixa(numero=numero, valor_inicial=valor_inicial, utilizador_abertura_id=utilizador_id)
        self.caixa_repo.create(caixa)
        
        # Movimento de abertura
        mov = MovimentoCaixa(
            caixa_id=caixa.id,
            tipo=TipoMovimentoCaixa.ABERTURA,
            valor=valor_inicial,
            descricao="Abertura de Caixa",
            utilizador_id=utilizador_id
        )
        self.movimento_repo.create(mov)
        AuditService.log_action(utilizador_id, "ABRIR", "caixas", caixa.id)
        return caixa, None

    def fechar_caixa(self, caixa_id, utilizador_id):
        caixa = self.caixa_repo.get_by_id(caixa_id)
        if not caixa or caixa.estado == EstadoCaixa.FECHADO:
            return None, "Caixa inválido ou já fechado."
            
        # Calcular valor final sum
        total_entradas = db.session.query(func.sum(MovimentoCaixa.valor)).filter(
            MovimentoCaixa.caixa_id == caixa.id,
            MovimentoCaixa.tipo.in_([TipoMovimentoCaixa.ABERTURA, TipoMovimentoCaixa.VENDA, TipoMovimentoCaixa.RECEBIMENTO, TipoMovimentoCaixa.REFORCO])
        ).scalar() or 0
        
        total_saidas = db.session.query(func.sum(MovimentoCaixa.valor)).filter(
            MovimentoCaixa.caixa_id == caixa.id,
            MovimentoCaixa.tipo.in_([TipoMovimentoCaixa.SANGRIA, TipoMovimentoCaixa.DEVOLUCAO, TipoMovimentoCaixa.AJUSTE]) # simplificando ajuste como saida ou podemos fazer pos/neg
        ).scalar() or 0

        # Para simplificar, assumimos valor positivo para entrada e negativo para saida no insert ou sum manual
        saldo = total_entradas - total_saidas
        
        caixa.valor_final = saldo
        caixa.estado = EstadoCaixa.FECHADO
        caixa.data_fecho = datetime.utcnow()
        caixa.utilizador_fecho_id = utilizador_id
        db.session.commit()
        
        AuditService.log_action(utilizador_id, "FECHAR", "caixas", caixa.id)
        return caixa, None


    def get_valores_esperados(self, caixa_id):
        caixa = self.caixa_repo.get_by_id(caixa_id)
        if not caixa:
            return None, "Caixa inválido."

        movimentos = db.session.query(MovimentoCaixa).filter_by(caixa_id=caixa.id).all()
        
        esp_dinheiro = float(caixa.valor_inicial or 0)
        esp_transferencia = 0.0
        esp_pos = 0.0

        for m in movimentos:
            v = float(m.valor or 0)
            if m.tipo == TipoMovimentoCaixa.ABERTURA:
                continue
            
            fp_nome = (m.forma_pagamento or '').lower()
            is_entry = m.tipo in [TipoMovimentoCaixa.VENDA, TipoMovimentoCaixa.RECEBIMENTO, TipoMovimentoCaixa.REFORCO]
            is_exit = m.tipo in [TipoMovimentoCaixa.SANGRIA, TipoMovimentoCaixa.DEVOLUCAO, TipoMovimentoCaixa.AJUSTE]
            
            if 'transferencia' in fp_nome or 'transferência' in fp_nome:
                if is_entry:
                    esp_transferencia += v
                elif is_exit:
                    esp_transferencia -= v
            elif 'pos' in fp_nome:
                if is_entry:
                    esp_pos += v
                elif is_exit:
                    esp_pos -= v
            else:
                if is_entry:
                    esp_dinheiro += v
                elif is_exit:
                    esp_dinheiro -= v

        return {
            "valor_esperado_dinheiro": esp_dinheiro,
            "valor_esperado_transferencia": esp_transferencia,
            "valor_esperado_pos": esp_pos
        }, None

    def fechar_caixa_detalhado(self, caixa_id, dados_fecho, utilizador_id):
        caixa = self.caixa_repo.get_by_id(caixa_id)
        if not caixa or caixa.estado == EstadoCaixa.FECHADO:
            return None, "Caixa inválido ou já fechado."

        val_declarado_dinheiro = float(dados_fecho.get('valor_declarado_dinheiro', 0))
        val_declarado_transferencia = float(dados_fecho.get('valor_declarado_transferencia', 0))
        val_declarado_pos = float(dados_fecho.get('valor_declarado_pos', 0))
        explicacao = dados_fecho.get('explicacao_divergencia', '').strip()

        movimentos = db.session.query(MovimentoCaixa).filter_by(caixa_id=caixa.id).all()
        
        esp_dinheiro = float(caixa.valor_inicial or 0)
        esp_transferencia = 0.0
        esp_pos = 0.0

        for m in movimentos:
            v = float(m.valor or 0)
            if m.tipo == TipoMovimentoCaixa.ABERTURA:
                continue
            
            fp_nome = (m.forma_pagamento or '').lower()
            is_entry = m.tipo in [TipoMovimentoCaixa.VENDA, TipoMovimentoCaixa.RECEBIMENTO, TipoMovimentoCaixa.REFORCO]
            is_exit = m.tipo in [TipoMovimentoCaixa.SANGRIA, TipoMovimentoCaixa.DEVOLUCAO, TipoMovimentoCaixa.AJUSTE]
            
            if 'transferencia' in fp_nome or 'transferência' in fp_nome:
                if is_entry:
                    esp_transferencia += v
                elif is_exit:
                    esp_transferencia -= v
            elif 'pos' in fp_nome:
                if is_entry:
                    esp_pos += v
                elif is_exit:
                    esp_pos -= v
            else:
                if is_entry:
                    esp_dinheiro += v
                elif is_exit:
                    esp_dinheiro -= v

        dif_dinheiro = val_declarado_dinheiro - esp_dinheiro
        dif_transferencia = val_declarado_transferencia - esp_transferencia
        dif_pos = val_declarado_pos - esp_pos

        tem_divergencia = (abs(dif_dinheiro) > 0.01) or (abs(dif_transferencia) > 0.01) or (abs(dif_pos) > 0.01)
        if tem_divergencia and not explicacao:
            return None, "Discrepância detectada. É necessário fornecer uma justificação explicativa para fechar o caixa."

        caixa.valor_declarado_dinheiro = val_declarado_dinheiro
        caixa.valor_declarado_transferencia = val_declarado_transferencia
        caixa.valor_declarado_pos = val_declarado_pos
        
        caixa.valor_esperado_dinheiro = esp_dinheiro
        caixa.valor_esperado_transferencia = esp_transferencia
        caixa.valor_esperado_pos = esp_pos
        
        caixa.diferenca_dinheiro = dif_dinheiro
        caixa.diferenca_transferencia = dif_transferencia
        caixa.diferenca_pos = dif_pos
        caixa.explicacao_divergencia = explicacao if tem_divergencia else None

        caixa.valor_final = val_declarado_dinheiro + val_declarado_transferencia + val_declarado_pos
        caixa.estado = EstadoCaixa.FECHADO
        caixa.data_fecho = datetime.utcnow()
        caixa.utilizador_fecho_id = utilizador_id

        db.session.commit()
        AuditService.log_action(utilizador_id, "FECHAR_DETALHADO", "caixas", caixa.id)
        return caixa, None

    def registrar_movimento(self, caixa_id, data, utilizador_id):
        caixa = self.caixa_repo.get_by_id(caixa_id)
        if not caixa or caixa.estado == EstadoCaixa.FECHADO:
            raise CaixaEncerradoException("Caixa precisa estar aberto para registrar movimentos.")
            
        data['caixa_id'] = caixa_id
        data['utilizador_id'] = utilizador_id
        mov = MovimentoCaixa(**data)
        self.movimento_repo.create(mov)
        AuditService.log_action(utilizador_id, "CREATE", "movimentos_caixa", mov.id)
        return mov, None

    # --- CONTAS A RECEBER ---
    def criar_conta_receber(self, data, utilizador_id):
        data['saldo'] = data['valor_original']
        conta = ContaReceber(**data)
        self.conta_receber_repo.create(conta)
        AuditService.log_action(utilizador_id, "CREATE", "contas_receber", conta.id)
        return conta, None

    def receber_conta(self, conta_id, valor_pago, utilizador_id):
        conta = self.conta_receber_repo.get_by_id(conta_id)
        if not conta or conta.estado == EstadoConta.PAGA:
            return None, "Conta inválida ou já paga"
            
        conta.valor_pago += valor_pago
        conta.saldo = conta.valor_original - conta.valor_pago
        
        if conta.saldo <= 0:
            conta.estado = EstadoConta.PAGA
            conta.saldo = 0
        else:
            conta.estado = EstadoConta.PARCIAL
            
        db.session.commit()
        AuditService.log_action(utilizador_id, "RECEBER", "contas_receber", conta.id)
        return conta, None

    # --- CONTAS A PAGAR ---
    def criar_conta_pagar(self, data, utilizador_id):
        conta = ContaPagar(**data)
        self.conta_pagar_repo.create(conta)
        AuditService.log_action(utilizador_id, "CREATE", "contas_pagar", conta.id)
        return conta, None

    def pagar_conta(self, conta_id, utilizador_id):
        conta = self.conta_pagar_repo.get_by_id(conta_id)
        if not conta or conta.estado == EstadoConta.PAGA:
            return None, "Conta inválida ou já paga"
            
        conta.estado = EstadoConta.PAGA
        
        # Registrar como despesa correspondente para o fluxo de caixa!
        despesa_data = {
            "categoria": CategoriaDespesa.FORNECEDOR if conta.fornecedor_id else CategoriaDespesa.OUTROS,
            "valor": conta.valor,
            "descricao": f"Liquidação de Conta a Pagar: {conta.descricao}",
            "data_despesa": datetime.utcnow().date()
        }
        self.criar_despesa(despesa_data, utilizador_id)
        
        db.session.commit()
        AuditService.log_action(utilizador_id, "PAGAR", "contas_pagar", conta.id)
        return conta, None

    # --- RECEITAS/DESPESAS ---
    def criar_receita(self, data, utilizador_id):
        r = Receita(**data)
        self.receita_repo.create(r)
        AuditService.log_action(utilizador_id, "CREATE", "receitas", r.id)
        return r, None

    def criar_despesa(self, data, utilizador_id):
        d = Despesa(**data)
        self.despesa_repo.create(d)
        AuditService.log_action(utilizador_id, "CREATE", "despesas", d.id)
        return d, None

    # --- FLUXO DE CAIXA ---
    def obter_fluxo_caixa(self, inicio, fim):
        entradas = db.session.query(func.sum(Receita.valor)).filter(Receita.data_receita.between(inicio, fim)).scalar() or 0
        saidas = db.session.query(func.sum(Despesa.valor)).filter(Despesa.data_despesa.between(inicio, fim)).scalar() or 0
        
        return {
            "entradas": float(entradas),
            "saidas": float(saidas),
            "saldo": float(entradas - saidas)
        }
