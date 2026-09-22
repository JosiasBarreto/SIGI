import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models.inventario import Inventario, SituacaoDivergencia
from app.models.empresa import Empresa
from app.services.inventario_report_service import InventarioReportService

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
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Cabeçalho no topo (a partir da página 2)
        if self._pageNumber > 1:
            self.drawString(40, 810, "SABOR IMBATÍVEL — SISTEMA INTEGRADO DE GESTÃO INTERNA (SIGI)")
            self.drawRightString(555, 810, "RELATÓRIO OFICIAL DE INVENTÁRIO")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(40, 805, 555, 805)

        # Rodapé em todas as páginas
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(40, 45, 555, 45)
        
        data_str = datetime.now().strftime("%d/%m/%Y %H:%M")
        self.drawString(40, 32, f"Documento confidencial gerado pelo SIGI ERP em {data_str}")
        self.drawRightString(555, 32, f"Página {self._pageNumber} de {page_count}")
        self.restoreState()


class InventarioPdfService:
    @staticmethod
    def gerar_pdf_inventario(inventario_id: int) -> io.BytesIO:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            raise ValueError("Inventário não encontrado para geração de PDF.")

        empresa = Empresa.query.first()
        nome_empresa = empresa.nome if empresa else "SABOR IMBATÍVEL"
        nif_empresa = empresa.nif if empresa else "500000000"

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=50,
            bottomMargin=50
        )

        styles = getSampleStyleSheet()
        
        # Estilos Customizados
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=4
        )
        subtitle_style = ParagraphStyle(
            'DocSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            spaceAfter=15
        )
        section_title = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=12,
            spaceAfter=8
        )
        cell_style = ParagraphStyle(
            'CellText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#1E293B')
        )
        cell_bold = ParagraphStyle(
            'CellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#0F172A')
        )
        cell_danger = ParagraphStyle(
            'CellDanger',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#B91C1C')
        )
        cell_success = ParagraphStyle(
            'CellSuccess',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#15803D')
        )

        story = []

        # ==========================================
        # 1. CABEÇALHO DA EMPRESA E INVENTÁRIO
        # ==========================================
        story.append(Paragraph(f"<b>{nome_empresa}</b>", title_style))
        story.append(Paragraph(f"SISTEMA INTEGRADO DE GESTÃO INTERNA (SIGI) &nbsp;|&nbsp; NIF: {nif_empresa}", subtitle_style))
        
        cabecalho_data = [
            [
                Paragraph("<b>RELATÓRIO DE INVENTÁRIO</b>", ParagraphStyle('H1', parent=title_style, fontSize=14, textColor=colors.HexColor('#2563EB'))),
                Paragraph(f"<b>Número:</b> {inventario.numero}", cell_bold)
            ],
            [
                Paragraph(f"<b>Armazém:</b> {inventario.armazem.nome if inventario.armazem else '-'}", cell_style),
                Paragraph(f"<b>Data Inventário:</b> {inventario.data_inventario.strftime('%d/%m/%Y') if inventario.data_inventario else '-'}", cell_style)
            ],
            [
                Paragraph(f"<b>Tipo:</b> {inventario.tipo.value if hasattr(inventario.tipo, 'value') else str(inventario.tipo)}", cell_style),
                Paragraph(f"<b>Estado:</b> <b>{inventario.estado.value if hasattr(inventario.estado, 'value') else str(inventario.estado)}</b>", cell_style)
            ],
            [
                Paragraph(f"<b>Responsável:</b> {inventario.responsavel.name if inventario.responsavel else '-'}", cell_style),
                Paragraph(f"<b>Iniciado em:</b> {inventario.iniciado_em.strftime('%d/%m/%Y %H:%M') if inventario.iniciado_em else '-'}", cell_style)
            ]
        ]
        t_cabecalho = Table(cabecalho_data, colWidths=[280, 235])
        t_cabecalho.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#F1F5F9')),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(t_cabecalho)
        story.append(Spacer(1, 12))

        # ==========================================
        # 2. QUADRO DE RESUMO E INDICADORES
        # ==========================================
        story.append(Paragraph("Resumo Executivo do Inventário", section_title))
        resumo = inventario.calcular_resumo()

        t_resumo_data = [
            [
                Paragraph("<b>Total de Itens:</b>", cell_style), Paragraph(str(resumo["total_itens"]), cell_bold),
                Paragraph("<b>Itens Contados:</b>", cell_style), Paragraph(str(resumo["itens_contados"]), cell_bold)
            ],
            [
                Paragraph("<b>Sem Divergência:</b>", cell_style), Paragraph(str(resumo["itens_sem_divergencia"]), cell_success),
                Paragraph("<b>Com Falta:</b>", cell_style), Paragraph(str(resumo["itens_com_falta"]), cell_danger)
            ],
            [
                Paragraph("<b>Com Sobra:</b>", cell_style), Paragraph(str(resumo["itens_com_sobra"]), cell_bold),
                Paragraph("<b>Não Contados:</b>", cell_style), Paragraph(str(resumo["itens_nao_contados"]), cell_style)
            ],
            [
                Paragraph("<b>Qtd. Total em Falta:</b>", cell_style), Paragraph(f"-{resumo['quantidade_falta']}", cell_danger),
                Paragraph("<b>Qtd. Total em Sobra:</b>", cell_style), Paragraph(f"+{resumo['quantidade_sobra']}", cell_success)
            ],
            [
                Paragraph("<b>Valor Est. Faltas:</b>", cell_style), Paragraph(f"{resumo['valor_estimado_falta']:.2f} STN", cell_danger),
                Paragraph("<b>Valor Est. Sobras:</b>", cell_style), Paragraph(f"{resumo['valor_estimado_sobra']:.2f} STN", cell_success)
            ]
        ]
        t_resumo = Table(t_resumo_data, colWidths=[130, 125, 130, 130])
        t_resumo.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FFFFFF')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t_resumo)
        story.append(Spacer(1, 14))

        # ==========================================
        # 3. TABELA DE DIVERGÊNCIAS (SE EXISTIREM)
        # ==========================================
        itens_div = [it for it in inventario.items if it.situacao in [SituacaoDivergencia.FALTA, SituacaoDivergencia.SOBRA]]
        if itens_div:
            story.append(Paragraph("Quadro Exclusivo de Divergências (Faltas e Sobras)", section_title))
            div_headers = [
                Paragraph("<b>Código</b>", cell_bold),
                Paragraph("<b>Item</b>", cell_bold),
                Paragraph("<b>Sistema</b>", cell_bold),
                Paragraph("<b>Contado</b>", cell_bold),
                Paragraph("<b>Diferença</b>", cell_bold),
                Paragraph("<b>Situação</b>", cell_bold),
                Paragraph("<b>Motivo</b>", cell_bold),
            ]
            div_data = [div_headers]

            for d in itens_div:
                diff = float(d.diferenca or 0.0)
                sit_style = cell_danger if diff < 0 else cell_success
                diff_str = f"{'+' if diff > 0 else ''}{diff:.3f}".rstrip('0').rstrip('.')
                motivo_txt = d.motivo_ajuste.value if d.motivo_ajuste and hasattr(d.motivo_ajuste, 'value') else (str(d.motivo_ajuste) if d.motivo_ajuste else "-")

                div_data.append([
                    Paragraph(d.obter_codigo(), cell_style),
                    Paragraph(d.obter_nome()[:28], cell_style),
                    Paragraph(f"{float(d.quantidade_sistema or 0.0):.2f}", cell_style),
                    Paragraph(f"{float(d.quantidade_contada or 0.0):.2f}", cell_style),
                    Paragraph(diff_str, sit_style),
                    Paragraph(d.situacao.value if hasattr(d.situacao, 'value') else str(d.situacao), sit_style),
                    Paragraph(motivo_txt[:20], cell_style)
                ])

            t_div = Table(div_data, colWidths=[65, 140, 50, 50, 55, 75, 80])
            t_div.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ]))
            story.append(t_div)
            story.append(Spacer(1, 14))

        # ==========================================
        # 4. TABELA GERAL DETALHADA DO INVENTÁRIO
        # ==========================================
        story.append(Paragraph("Conferência Geral de Todos os Itens", section_title))
        geral_headers = [
            Paragraph("<b>Código</b>", cell_bold),
            Paragraph("<b>Item / Descrição</b>", cell_bold),
            Paragraph("<b>UN</b>", cell_bold),
            Paragraph("<b>Sistema</b>", cell_bold),
            Paragraph("<b>Contado</b>", cell_bold),
            Paragraph("<b>Diferença</b>", cell_bold),
            Paragraph("<b>Situação</b>", cell_bold),
        ]
        geral_data = [geral_headers]

        for it in inventario.items:
            diff = float(it.diferenca) if it.diferenca is not None else 0.0
            diff_str = f"{'+' if diff > 0 else ''}{diff:.3f}".rstrip('0').rstrip('.') if it.diferenca is not None else "-"
            
            if it.situacao == SituacaoDivergencia.FALTA:
                sit_st = cell_danger
            elif it.situacao == SituacaoDivergencia.SOBRA:
                sit_st = cell_success
            else:
                sit_st = cell_style

            geral_data.append([
                Paragraph(it.obter_codigo(), cell_style),
                Paragraph(it.obter_nome()[:30], cell_style),
                Paragraph(it.obter_unidade_sigla(), cell_style),
                Paragraph(f"{float(it.quantidade_sistema or 0.0):.2f}", cell_style),
                Paragraph(f"{float(it.quantidade_contada):.2f}" if it.quantidade_contada is not None else "-", cell_style),
                Paragraph(diff_str, sit_st),
                Paragraph(it.situacao.value if hasattr(it.situacao, 'value') else str(it.situacao), sit_st)
            ])

        t_geral = Table(geral_data, colWidths=[65, 175, 35, 55, 55, 60, 70])
        t_geral.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(t_geral)
        story.append(Spacer(1, 20))

        # ==========================================
        # 5. TERMO DE RESPONSABILIDADE E ASSINATURAS
        # ==========================================
        story.append(KeepTogether([
            Paragraph("Validação, Conferência e Aprovação Oficial", section_title),
            Spacer(1, 25),
            Table([
                [
                    Paragraph("__________________________________________<br/><b>Responsável pelo Inventário</b><br/>Nome / Data", ParagraphStyle('Sign1', parent=cell_style, alignment=1)),
                    Paragraph("__________________________________________<br/><b>Conferência de Stock</b><br/>Nome / Data", ParagraphStyle('Sign2', parent=cell_style, alignment=1)),
                    Paragraph("__________________________________________<br/><b>Aprovação da Direção / Gerência</b><br/>Nome / Data", ParagraphStyle('Sign3', parent=cell_style, alignment=1))
                ]
            ], colWidths=[170, 170, 175])
        ]))

        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer
