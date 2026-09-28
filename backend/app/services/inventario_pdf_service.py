import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.inventario import Inventario, SituacaoDivergencia
from app.models.empresa import Empresa


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_header_footer(num_pages)
            super().showPage()
        super().save()

    def draw_header_footer(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 7)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Cabeçalho no topo (a partir da página 2)
        if self._pageNumber > 1:
            self.drawString(40, 812, "SABOR IMBATÍVEL — SISTEMA INTEGRADO DE GESTÃO INTERNA (SIGI ERP)")
            self.drawRightString(555, 812, "RELATÓRIO DE INVENTÁRIO & RECONCILIAÇÃO FÍSICO-FINANCEIRA")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 806, 555, 806)

        # Rodapé em todas as páginas
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 42, 555, 42)
        
        data_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        self.setFont("Helvetica", 7)
        self.drawString(40, 30, f"Documento oficial e confidencial gerado pelo SIGI ERP em {data_str}")
        self.drawRightString(555, 30, f"Página {self._pageNumber} de {page_count}")
        self.restoreState()


class InventarioPdfService:
    @staticmethod
    def gerar_pdf_inventario(inventario_id: int) -> io.BytesIO:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            raise ValueError("Inventário não encontrado para geração do relatório PDF.")

        empresa = Empresa.query.first()
        nome_empresa = empresa.nome if empresa and empresa.nome else "SABOR IMBATÍVEL"
        nif_empresa = empresa.nif if empresa and empresa.nif else "500000000"
        endereco_empresa = getattr(empresa, 'endereco', None) or "São Tomé e Príncipe"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=48,
            bottomMargin=48
        )

        styles = getSampleStyleSheet()
        
        # Estilos Customizados
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=15,
            leading=18,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=2
        )
        subtitle_style = ParagraphStyle(
            'DocSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569'),
            spaceAfter=12
        )
        section_title = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=11,
            leading=14,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=10,
            spaceAfter=6
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#1E293B')
        )
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#0F172A')
        )
        cell_right = ParagraphStyle(
            'CellRight',
            parent=cell_style,
            alignment=2
        )
        cell_right_bold = ParagraphStyle(
            'CellRightBold',
            parent=cell_bold,
            alignment=2
        )
        cell_danger = ParagraphStyle(
            'CellDanger',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#B91C1C'),
            alignment=2
        )
        cell_success = ParagraphStyle(
            'CellSuccess',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.HexColor('#15803D'),
            alignment=2
        )
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=9.5,
            textColor=colors.white
        )
        header_right = ParagraphStyle(
            'HeaderRight',
            parent=header_style,
            alignment=2
        )

        story = []

        # ==========================================
        # 1. CABEÇALHO DA EMPRESA E INVENTÁRIO
        # ==========================================
        story.append(Paragraph(f"<b>{nome_empresa}</b>", title_style))
        story.append(Paragraph(f"SISTEMA INTEGRADO DE GESTÃO INTERNA (SIGI ERP) &nbsp;|&nbsp; NIF: {nif_empresa} &nbsp;|&nbsp; {endereco_empresa}", subtitle_style))
        
        # Formatação segura de campos
        inv_numero = str(inventario.numero or f"INV-#{inventario.id}")
        armazem_nome = str(inventario.armazem.nome) if inventario.armazem else "Armazém Geral"
        data_inv = inventario.data_inventario.strftime('%d/%m/%Y') if inventario.data_inventario else "-"
        tipo_str = inventario.tipo.value if hasattr(inventario.tipo, 'value') else str(inventario.tipo or "COMPLETO")
        estado_str = inventario.estado.value if hasattr(inventario.estado, 'value') else str(inventario.estado or "APLICADO")
        responsavel_nome = str(inventario.responsavel.name) if inventario.responsavel else "Administrador / Sistema"
        
        iniciado_str = inventario.iniciado_em.strftime('%d/%m/%Y %H:%M') if inventario.iniciado_em else "-"
        finalizado_str = inventario.finalizado_em.strftime('%d/%m/%Y %H:%M') if inventario.finalizado_em else "-"

        cabecalho_data = [
            [
                Paragraph("<b>RELATÓRIO DE INVENTÁRIO E RECONCILIAÇÃO FÍSICO-FINANCEIRA</b>", ParagraphStyle('H1', parent=title_style, fontSize=12, textColor=colors.HexColor('#2563EB'))),
                Paragraph(f"<b>Nº Inventário:</b> {inv_numero}", cell_bold)
            ],
            [
                Paragraph(f"<b>Armazém / Localização:</b> {armazem_nome}", cell_style),
                Paragraph(f"<b>Data de Referência:</b> {data_inv}", cell_style)
            ],
            [
                Paragraph(f"<b>Tipo de Inventário:</b> {tipo_str}", cell_style),
                Paragraph(f"<b>Estado do Processo:</b> <font color='#2563EB'><b>{estado_str}</b></font>", cell_style)
            ],
            [
                Paragraph(f"<b>Responsável Técnico:</b> {responsavel_nome}", cell_style),
                Paragraph(f"<b>Período:</b> {iniciado_str} até {finalizado_str}", cell_style)
            ]
        ]
        if inventario.observacao:
            cabecalho_data.append([
                Paragraph(f"<b>Observações / Justificação:</b> {inventario.observacao}", ParagraphStyle('Obs', parent=cell_style, fontSize=7)),
                Paragraph("", cell_style)
            ])

        t_cabecalho = Table(cabecalho_data, colWidths=[290, 225])
        t_cabecalho.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F1F5F9')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t_cabecalho)
        story.append(Spacer(1, 10))

        # ==========================================
        # 2. RESUMO EXECUÇÃO E RECONCILIAÇÃO FINANCEIRA
        # ==========================================
        story.append(Paragraph("Resumo Executivo e Indicadores Financeiros", section_title))
        resumo = inventario.calcular_resumo()

        v_sis = float(resumo.get("valor_total_sistema", 0.0))
        v_cnt = float(resumo.get("valor_total_contado", 0.0))
        v_falta = float(resumo.get("valor_estimado_falta", 0.0))
        v_sobra = float(resumo.get("valor_estimado_sobra", 0.0))
        v_liquido = float(resumo.get("ajuste_liquido_financeiro", 0.0))
        acuracia = float(resumo.get("acuracia_percentual", 0.0))

        t_resumo_data = [
            [
                Paragraph("<b>Total de Artigos Elegíveis:</b>", cell_style), Paragraph(str(resumo["total_itens"]), cell_bold),
                Paragraph("<b>Valor Total Teórico (Sistema):</b>", cell_style), Paragraph(f"{v_sis:,.2f} STN", cell_right_bold)
            ],
            [
                Paragraph("<b>Artigos Efetivamente Contados:</b>", cell_style), Paragraph(f"{resumo['itens_contados']} ({resumo['percentagem_concluida']}%)", cell_bold),
                Paragraph("<b>Valor Total Real (Contado):</b>", cell_style), Paragraph(f"{v_cnt:,.2f} STN", cell_right_bold)
            ],
            [
                Paragraph("<b>Conferência Sem Divergência:</b>", cell_style), Paragraph(str(resumo["itens_sem_divergencia"]), cell_success),
                Paragraph("<b>Valor Estimado de Faltas (Perda):</b>", cell_style), Paragraph(f"-{v_falta:,.2f} STN", cell_danger)
            ],
            [
                Paragraph("<b>Artigos com Falta de Stock:</b>", cell_style), Paragraph(f"{resumo['itens_com_falta']} (Qtd: -{resumo['quantidade_falta']})", cell_danger),
                Paragraph("<b>Valor Estimado de Sobras (Excesso):</b>", cell_style), Paragraph(f"+{v_sobra:,.2f} STN", cell_success)
            ],
            [
                Paragraph("<b>Artigos com Sobra de Stock:</b>", cell_style), Paragraph(f"{resumo['itens_com_sobra']} (Qtd: +{resumo['quantidade_sobra']})", cell_success),
                Paragraph("<b>Ajuste Financeiro Líquido:</b>", cell_style), Paragraph(f"{'+' if v_liquido > 0 else ''}{v_liquido:,.2f} STN", cell_right_bold)
            ],
            [
                Paragraph("<b>Artigos Pendentes / Não Contados:</b>", cell_style), Paragraph(str(resumo["itens_nao_contados"]), cell_style),
                Paragraph("<b>Índice de Acurácia de Stock:</b>", cell_style), Paragraph(f"<b>{acuracia:.1f}%</b>", cell_right_bold)
            ]
        ]
        t_resumo = Table(t_resumo_data, colWidths=[135, 120, 135, 125])
        t_resumo.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t_resumo)
        story.append(Spacer(1, 12))

        # ==========================================
        # 3. TABELA EXCLUSIVA DE DIVERGÊNCIAS
        # ==========================================
        itens_div = [it for it in inventario.items if it.situacao in [SituacaoDivergencia.FALTA, SituacaoDivergencia.SOBRA]]
        if itens_div:
            story.append(Paragraph(f"Quadro Exclusivo de Divergências ({len(itens_div)} Artigos com Falta ou Sobra)", section_title))
            div_headers = [
                Paragraph("<b>Código</b>", header_style),
                Paragraph("<b>Descrição do Artigo</b>", header_style),
                Paragraph("<b>Tipo</b>", header_style),
                Paragraph("<b>Preço UN</b>", header_right),
                Paragraph("<b>Sistema</b>", header_right),
                Paragraph("<b>Contado</b>", header_right),
                Paragraph("<b>Dif. Qtd</b>", header_right),
                Paragraph("<b>Dif. Valor (STN)</b>", header_right),
                Paragraph("<b>Situação / Motivo</b>", header_style),
            ]
            div_data = [div_headers]

            for d in itens_div:
                cod = str(d.obter_codigo() or "-")
                nome = str(d.obter_nome() or "Artigo Desconhecido")
                tipo_item = str(d.obter_tipo_item() or "Artigo")
                preco_un = float(d.obter_preco_unitario() or 0.0)
                qtd_sis = float(d.quantidade_sistema or 0.0)
                qtd_cnt = float(d.quantidade_contada or 0.0)
                diff = float(d.diferenca if d.diferenca is not None else (qtd_cnt - qtd_sis))
                val_diff = round(diff * preco_un, 2)

                sit_style = cell_danger if diff < 0 else cell_success
                diff_str = f"{'+' if diff > 0 else ''}{diff:.3f}".rstrip('0').rstrip('.')
                val_diff_str = f"{'+' if val_diff > 0 else ''}{val_diff:,.2f}"

                motivo_raw = d.motivo_ajuste.value if d.motivo_ajuste and hasattr(d.motivo_ajuste, 'value') else (str(d.motivo_ajuste) if d.motivo_ajuste else None)
                sit_label = d.situacao.value if hasattr(d.situacao, 'value') else str(d.situacao)
                motivo_txt = f"<b>{sit_label}</b>" + (f"<br/><font color='#64748B'>{motivo_raw}</font>" if motivo_raw else "")

                div_data.append([
                    Paragraph(cod, cell_style),
                    Paragraph(nome[:35], cell_style),
                    Paragraph(tipo_item, cell_style),
                    Paragraph(f"{preco_un:,.2f}", cell_right),
                    Paragraph(f"{qtd_sis:.2f}", cell_right),
                    Paragraph(f"{qtd_cnt:.2f}", cell_right),
                    Paragraph(diff_str, sit_style),
                    Paragraph(val_diff_str, sit_style),
                    Paragraph(motivo_txt, cell_style)
                ])

            t_div = Table(div_data, colWidths=[55, 125, 45, 50, 45, 45, 45, 55, 50])
            t_div.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(t_div)
            story.append(Spacer(1, 12))

        # ==========================================
        # 4. TABELA GERAL DETALHADA DE CONFERÊNCIA
        # ==========================================
        story.append(Paragraph(f"Conferência Geral de Todos os Artigos ({len(inventario.items)} Itens)", section_title))
        geral_headers = [
            Paragraph("<b>Código</b>", header_style),
            Paragraph("<b>Descrição do Artigo</b>", header_style),
            Paragraph("<b>UN</b>", header_style),
            Paragraph("<b>Preço UN</b>", header_right),
            Paragraph("<b>Sistema</b>", header_right),
            Paragraph("<b>Contado</b>", header_right),
            Paragraph("<b>Dif. Qtd</b>", header_right),
            Paragraph("<b>Dif. Valor</b>", header_right),
            Paragraph("<b>Situação</b>", header_style),
        ]
        geral_data = [geral_headers]

        for it in inventario.items:
            cod = str(it.obter_codigo() or "-")
            nome = str(it.obter_nome() or "Artigo Desconhecido")
            un_sigla = str(it.obter_unidade_sigla() or "UN")
            preco_un = float(it.obter_preco_unitario() or 0.0)
            qtd_sis = float(it.quantidade_sistema or 0.0)
            
            if it.quantidade_contada is not None:
                qtd_cnt = float(it.quantidade_contada)
                qtd_cnt_str = f"{qtd_cnt:.2f}"
                diff = float(it.diferenca if it.diferenca is not None else (qtd_cnt - qtd_sis))
                diff_str = f"{'+' if diff > 0 else ''}{diff:.3f}".rstrip('0').rstrip('.')
                val_diff = round(diff * preco_un, 2)
                val_diff_str = f"{'+' if val_diff > 0 else ''}{val_diff:,.2f}"
            else:
                qtd_cnt_str = "-"
                diff = 0.0
                diff_str = "-"
                val_diff_str = "-"

            if it.situacao == SituacaoDivergencia.FALTA:
                sit_st = cell_danger
            elif it.situacao == SituacaoDivergencia.SOBRA:
                sit_st = cell_success
            else:
                sit_st = cell_style

            sit_txt = it.situacao.value if hasattr(it.situacao, 'value') else str(it.situacao or "N/A")

            geral_data.append([
                Paragraph(cod, cell_style),
                Paragraph(nome[:38], cell_style),
                Paragraph(un_sigla, cell_style),
                Paragraph(f"{preco_un:,.2f}", cell_right),
                Paragraph(f"{qtd_sis:.2f}", cell_right),
                Paragraph(qtd_cnt_str, cell_right),
                Paragraph(diff_str, sit_st),
                Paragraph(val_diff_str, sit_st),
                Paragraph(sit_txt, sit_st)
            ])

        t_geral = Table(geral_data, colWidths=[55, 145, 25, 50, 45, 45, 45, 55, 50])
        t_geral.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_geral)
        story.append(Spacer(1, 16))

        # ==========================================
        # 5. TERMO DE RESPONSABILIDADE E ASSINATURAS
        # ==========================================
        termo_txt = (
            "<b>Declaração de Conformidade e Responsabilidade:</b><br/>"
            "Certificamos que as contagens físicas de stock descritas neste documento foram devidamente auditadas, "
            "conferidas e validadas pelos responsáveis operacionais de armazém. As correções financeiras e os ajustes "
            "de inventário foram submetidos para reconciliação no sistema integrado SIGI ERP de acordo com as normas vigentes."
        )
        story.append(KeepTogether([
            Paragraph("Validação, Conferência e Termo de Responsabilidade", section_title),
            Paragraph(termo_txt, ParagraphStyle('Termo', parent=cell_style, fontSize=7, leading=10, textColor=colors.HexColor('#475569'))),
            Spacer(1, 24),
            Table([
                [
                    Paragraph("__________________________________________<br/><b>Fiel de Armazém / Contagem</b><br/>Nome / Data", ParagraphStyle('Sign1', parent=cell_style, alignment=1)),
                    Paragraph("__________________________________________<br/><b>Auditor / Conferência de Stock</b><br/>Nome / Data", ParagraphStyle('Sign2', parent=cell_style, alignment=1)),
                    Paragraph("__________________________________________<br/><b>Aprovação da Gerência Geral</b><br/>Nome / Data", ParagraphStyle('Sign3', parent=cell_style, alignment=1))
                ]
            ], colWidths=[170, 170, 175])
        ]))

        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer
