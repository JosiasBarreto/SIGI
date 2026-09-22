import io
from datetime import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from app.models.inventario import Inventario, SituacaoDivergencia
from app.services.inventario_report_service import InventarioReportService

class InventarioExcelService:
    @staticmethod
    def gerar_excel_inventario(inventario_id: int, user_nome: str = "Administrador") -> io.BytesIO:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            raise ValueError("Inventário não encontrado para exportação.")

        wb = openpyxl.Workbook()
        # Remove a folha padrão criada automaticamente
        wb.remove(wb.active)

        # Paleta de Estilos Profissional SIGI
        header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid") # Dark Slate
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        title_font = Font(name="Calibri", size=14, bold=True, color="0F172A")
        subtitle_font = Font(name="Calibri", size=10, italic=True, color="475569")
        bold_font = Font(name="Calibri", size=11, bold=True)
        regular_font = Font(name="Calibri", size=11)
        
        falta_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid") # Soft Red
        falta_font = Font(name="Calibri", size=11, color="991B1B", bold=True)
        sobra_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid") # Soft Green
        sobra_font = Font(name="Calibri", size=11, color="166534", bold=True)

        thin_border = Border(
            left=Side(style='thin', color='CBD5E1'),
            right=Side(style='thin', color='CBD5E1'),
            top=Side(style='thin', color='CBD5E1'),
            bottom=Side(style='thin', color='CBD5E1')
        )

        resumo = inventario.calcular_resumo()

        # ==========================================
        # FOLHA 1 — RESUMO
        # ==========================================
        ws_resumo = wb.create_sheet(title="Resumo")
        ws_resumo.views.sheetView[0].showGridLines = True

        ws_resumo["B2"] = "SABOR IMBATÍVEL — SISTEMA INTEGRADO DE GESTÃO INTERNA (SIGI)"
        ws_resumo["B2"].font = title_font
        ws_resumo["B3"] = f"RELATÓRIO RESUMO DE INVENTÁRIO — {inventario.numero}"
        ws_resumo["B3"].font = Font(name="Calibri", size=12, bold=True, color="2563EB")
        ws_resumo["B4"] = f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')} por {user_nome}"
        ws_resumo["B4"].font = subtitle_font

        # Metadados do Inventário
        dados_cabecalho = [
            ("Número:", inventario.numero),
            ("Armazém:", inventario.armazem.nome if inventario.armazem else "N/A"),
            ("Data Inventário:", inventario.data_inventario.strftime('%d/%m/%Y') if inventario.data_inventario else "N/A"),
            ("Tipo:", inventario.tipo.value if hasattr(inventario.tipo, 'value') else str(inventario.tipo)),
            ("Estado:", inventario.estado.value if hasattr(inventario.estado, 'value') else str(inventario.estado)),
            ("Responsável:", inventario.responsavel.name if inventario.responsavel else "N/A"),
            ("Observação:", inventario.observacao or "-"),
        ]

        row_idx = 6
        for label, val in dados_cabecalho:
            ws_resumo[f"B{row_idx}"] = label
            ws_resumo[f"B{row_idx}"].font = bold_font
            ws_resumo[f"C{row_idx}"] = val
            ws_resumo[f"C{row_idx}"].font = regular_font
            row_idx += 1

        # Indicadores de Reconciliação
        row_idx += 1
        ws_resumo[f"B{row_idx}"] = "INDICADORES DO INVENTÁRIO"
        ws_resumo[f"B{row_idx}"].font = Font(name="Calibri", size=12, bold=True, color="1E293B")
        row_idx += 1

        indicadores = [
            ("Total de Itens Elegíveis", resumo["total_itens"]),
            ("Itens Efetivamente Contados", resumo["itens_contados"]),
            ("Itens Sem Divergência", resumo["itens_sem_divergencia"]),
            ("Itens com Falta", resumo["itens_com_falta"]),
            ("Itens com Sobra", resumo["itens_com_sobra"]),
            ("Itens Não Contados", resumo["itens_nao_contados"]),
            ("Quantidade Total em Falta", resumo["quantidade_falta"]),
            ("Quantidade Total em Sobra", resumo["quantidade_sobra"]),
            ("Valor Estimado das Faltas (STN)", resumo["valor_estimado_falta"]),
            ("Valor Estimado das Sobras (STN)", resumo["valor_estimado_sobra"]),
        ]

        for ind_label, ind_val in indicadores:
            ws_resumo[f"B{row_idx}"] = ind_label
            ws_resumo[f"B{row_idx}"].font = regular_font
            ws_resumo[f"B{row_idx}"].border = thin_border
            ws_resumo[f"C{row_idx}"] = ind_val
            ws_resumo[f"C{row_idx}"].font = bold_font
            ws_resumo[f"C{row_idx}"].border = thin_border
            ws_resumo[f"C{row_idx}"].alignment = Alignment(horizontal="right")
            row_idx += 1

        ws_resumo.column_dimensions['B'].width = 32
        ws_resumo.column_dimensions['C'].width = 30

        # Helper para popular abas tabulares
        def criar_aba_itens(titulo_aba, lista_itens):
            ws = wb.create_sheet(title=titulo_aba)
            ws.views.sheetView[0].showGridLines = True
            
            headers = [
                "Código", "Nome do Item", "Tipo", "Unidade",
                "Stock Sistema", "Quantidade Contada", "Diferença",
                "Situação", "Motivo", "Observação", "Responsável", "Data Contagem"
            ]

            ws.append(headers)
            ws.freeze_panes = "A2"

            for col_num in range(1, len(headers) + 1):
                cell = ws.cell(row=1, column=col_num)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")

            for item in lista_itens:
                diff = float(item.diferenca) if item.diferenca is not None else 0.0
                sit_str = item.situacao.value if hasattr(item.situacao, 'value') else str(item.situacao)
                mot_str = item.motivo_ajuste.value if item.motivo_ajuste and hasattr(item.motivo_ajuste, 'value') else (str(item.motivo_ajuste) if item.motivo_ajuste else "")
                
                row_data = [
                    item.obter_codigo(),
                    item.obter_nome(),
                    item.obter_tipo_item(),
                    item.obter_unidade_sigla(),
                    float(item.quantidade_sistema or 0.0),
                    float(item.quantidade_contada) if item.quantidade_contada is not None else "-",
                    diff if item.quantidade_contada is not None else "-",
                    sit_str,
                    mot_str,
                    item.observacao or "",
                    item.contador.name if item.contador else "-",
                    item.contado_em.strftime('%d/%m/%Y %H:%M') if item.contado_em else "-"
                ]
                ws.append(row_data)
                curr_row = ws.max_row

                # Formatação condicional de células
                for col_idx in range(1, len(headers) + 1):
                    c = ws.cell(row=curr_row, column=col_idx)
                    c.font = regular_font
                    c.border = thin_border
                    if col_idx in [5, 6, 7]:
                        c.alignment = Alignment(horizontal="right")
                    elif col_idx in [1, 3, 4, 8, 12]:
                        c.alignment = Alignment(horizontal="center")

                # Destaque de Falta/Sobra
                if sit_str == SituacaoDivergencia.FALTA.value:
                    ws.cell(row=curr_row, column=8).fill = falta_fill
                    ws.cell(row=curr_row, column=8).font = falta_font
                elif sit_str == SituacaoDivergencia.SOBRA.value:
                    ws.cell(row=curr_row, column=8).fill = sobra_fill
                    ws.cell(row=curr_row, column=8).font = sobra_font

            # Ativar auto-filtro
            ws.auto_filter.ref = ws.dimensions

            # Ajuste de largura das colunas
            for col in ws.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = get_column_letter(col[0].column)
                ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        # ==========================================
        # FOLHA 2 — INVENTÁRIO (TODOS OS ITENS)
        # ==========================================
        criar_aba_itens("Inventario", inventario.items)

        # ==========================================
        # FOLHA 3 — DIVERGÊNCIAS (FALTA OU SOBRA)
        # ==========================================
        itens_div = [it for it in inventario.items if it.situacao in [SituacaoDivergencia.FALTA, SituacaoDivergencia.SOBRA]]
        criar_aba_itens("Divergencias", itens_div)

        # ==========================================
        # FOLHA 4 — FALTAS
        # ==========================================
        itens_falta = [it for it in inventario.items if it.situacao == SituacaoDivergencia.FALTA]
        criar_aba_itens("Faltas", itens_falta)

        # ==========================================
        # FOLHA 5 — SOBRAS
        # ==========================================
        itens_sobra = [it for it in inventario.items if it.situacao == SituacaoDivergencia.SOBRA]
        criar_aba_itens("Sobras", itens_sobra)

        # ==========================================
        # FOLHA 6 — AJUSTES OFICIAIS
        # ==========================================
        ws_ajustes = wb.create_sheet(title="Ajustes")
        ws_ajustes.views.sheetView[0].showGridLines = True
        h_ajustes = ["Entidade", "Código", "Item", "Tipo Movimento", "Stock Anterior", "Quantidade Ajuste", "Stock Final", "Utilizador", "Data/Hora", "Motivo"]
        ws_ajustes.append(h_ajustes)
        ws_ajustes.freeze_panes = "A2"

        for col_num in range(1, len(h_ajustes) + 1):
            cell = ws_ajustes.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        rel_ajustes = InventarioReportService.obter_relatorio_ajustes(inventario.id)
        if rel_ajustes and rel_ajustes.get("ajustes"):
            for a in rel_ajustes["ajustes"]:
                ws_ajustes.append([
                    a["entidade"],
                    a.get("codigo", ""),
                    a.get("nome", ""),
                    a["tipo_movimento"],
                    a["stock_anterior"],
                    a["quantidade_ajuste"],
                    a["stock_final"],
                    a["utilizador"],
                    a["data_hora"],
                    a["motivo"]
                ])
                curr_row = ws_ajustes.max_row
                for col_idx in range(1, len(h_ajustes) + 1):
                    c = ws_ajustes.cell(row=curr_row, column=col_idx)
                    c.font = regular_font
                    c.border = thin_border

        ws_ajustes.auto_filter.ref = ws_ajustes.dimensions
        for col in ws_ajustes.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            ws_ajustes.column_dimensions[get_column_letter(col[0].column)].width = max(max_len + 3, 12)

        # ==========================================
        # FOLHA 7 — AUDITORIA
        # ==========================================
        ws_audit = wb.create_sheet(title="Auditoria")
        ws_audit.views.sheetView[0].showGridLines = True
        h_audit = ["Data/Hora", "Operação", "Utilizador", "Endereço IP"]
        ws_audit.append(h_audit)
        ws_audit.freeze_panes = "A2"

        for col_num in range(1, len(h_audit) + 1):
            cell = ws_audit.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")

        rel_audit = InventarioReportService.obter_relatorio_auditoria(inventario.id)
        if rel_audit and rel_audit.get("auditoria"):
            for l in rel_audit["auditoria"]:
                ws_audit.append([
                    l["data_hora"],
                    l["operacao"],
                    l["utilizador"],
                    l.get("ip") or "-"
                ])
                curr_row = ws_audit.max_row
                for col_idx in range(1, len(h_audit) + 1):
                    c = ws_audit.cell(row=curr_row, column=col_idx)
                    c.font = regular_font
                    c.border = thin_border

        ws_audit.auto_filter.ref = ws_audit.dimensions
        for col in ws_audit.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            ws_audit.column_dimensions[get_column_letter(col[0].column)].width = max(max_len + 3, 12)

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output
