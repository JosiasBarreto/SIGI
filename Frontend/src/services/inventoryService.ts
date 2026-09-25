import { productService, materialService, warehouseService } from './index';
import apiClient from '../api/client';
import { InventoryItem, QuarentenaItem, StockStatus, ContagemItem } from '../pages/Inventario/types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency} from '../lib/utils';

const STORAGE_KEY_QUARENTENA = 'sigi_inventario_quarentena_v1';

export const inventoryService = {
  /**
   * Obtém todo o stock consolidado do ERP (Produtos Acabados, Revenda, Consumíveis e Materiais)
   */
  async fetchConsolidatedStock(): Promise<{ items: InventoryItem[]; armazens: any[] }> {
    const [productsRes, materialsRes, warehousesRes] = await Promise.allSettled([
      productService.getAll({ per_page: 5000 }),
      materialService.getAll({ per_page: 5000 }),
      warehouseService.getAll({ per_page: 100 }),
    ]);

    const rawProducts: any[] = productsRes.status === 'fulfilled' 
      ? (productsRes.value?.items || (Array.isArray(productsRes.value) ? productsRes.value : [])) 
      : [];

    const rawMaterials: any[] = materialsRes.status === 'fulfilled'
      ? (materialsRes.value?.items || (Array.isArray(materialsRes.value) ? materialsRes.value : []))
      : [];

    const armazens: any[] = warehousesRes.status === 'fulfilled'
      ? (warehousesRes.value?.items || (Array.isArray(warehousesRes.value) ? warehousesRes.value : []))
      : [];

    const armazensMap = new Map<string | number, string>();
    armazens.forEach(a => {
      if (a && a.id != null) {
        armazensMap.set(String(a.id), a.nome || `Armazém ${a.id}`);
      }
    });

    const defaultArmazemNome = armazens[0]?.nome || 'Armazém Central';
    const defaultArmazemId = armazens[0]?.id || 1;

    const consolidated: InventoryItem[] = [];

    // Processa produtos (Consumíveis, Acabados, Revenda)
    rawProducts.forEach(p => {
      if (!p) return;
      const stockAtual = Number(p.stock_atual ?? p.quantidade ?? 0);
      const stockMin = Number(p.stock_minimo ?? 5);
      const stockMax = p.stock_maximo ? Number(p.stock_maximo) : undefined;
      const precoCompra = Number(p.preco_compra ?? p.custo_unitario ?? 0);
      const precoVenda = p.preco_venda ? Number(p.preco_venda) : undefined;

      let status: StockStatus = 'Normal';
      if (stockAtual <= 0) {
        status = 'Esgotado';
      } else if (stockAtual <= Math.max(1, Math.floor(stockMin * 0.5))) {
        status = 'Critico';
      } else if (stockAtual <= stockMin) {
        status = 'Baixo';
      } else if (stockMax && stockAtual > stockMax) {
        status = 'Excesso';
      }

      const armId = p.armazem_id || p.armazemId || defaultArmazemId;
      const armNome = armazensMap.get(String(armId)) || p.armazem_nome || defaultArmazemNome;

      const rawTipo = String(p.tipo || p.tipo_produto || 'Consumivel').toLowerCase();
      let tipoNorm: 'Consumivel' | 'Acabado' | 'Revenda' | 'Material' = 'Consumivel';
      if (rawTipo.includes('acab')) tipoNorm = 'Acabado';
      else if (rawTipo.includes('rev')) tipoNorm = 'Revenda';
      else if (rawTipo.includes('mat')) tipoNorm = 'Material';

      consolidated.push({
        id: `prod_${p.id}`,
        original_id: p.id,
        codigo: p.codigo || `PRD-${String(p.id).padStart(4, '0')}`,
        nome: p.nome || p.name || 'Produto Sem Nome',
        tipo_item: 'Produto',
        tipo: tipoNorm,
        categoria: p.categoria || p.categoria_nome || 'Geral',
        categoria_id: p.categoria_id,
        armazem_id: armId,
        armazem_nome: armNome,
        stock_atual: stockAtual,
        stock_minimo: stockMin,
        stock_maximo: stockMax,
        unidade_medida: p.unidade_medida || p.unidade || 'UN',
        preco_compra: precoCompra,
        preco_venda: precoVenda,
        valor_total: stockAtual * precoCompra,
        status_stock: status,
        validade: p.validade || p.data_validade,
        lote: p.lote,
        is_active: p.is_active !== false && p.ativo !== false,
        descricao: p.descricao,
      });
    });

    // Processa materiais reutilizáveis
    rawMaterials.forEach(m => {
      if (!m) return;
      const stockAtual = Number(m.quantidade_total ?? m.quantidade_disponivel ?? m.stock_atual ?? 0);
      const stockMin = Number(m.stock_minimo ?? 2);
      const valorUnit = Number(m.valor_unitario ?? 0);

      let status: StockStatus = 'Normal';
      if (stockAtual <= 0) {
        status = 'Esgotado';
      } else if (stockAtual <= stockMin) {
        status = 'Baixo';
      }

      const armId = m.armazem_id || defaultArmazemId;
      const armNome = armazensMap.get(String(armId)) || defaultArmazemNome;

      consolidated.push({
        id: `mat_${m.id}`,
        original_id: m.id,
        codigo: m.codigo || `MAT-${String(m.id).padStart(4, '0')}`,
        nome: m.nome || 'Material Sem Nome',
        tipo_item: 'Material',
        tipo: 'Material',
        categoria: m.categoria || 'Equipamentos e Utensílios',
        armazem_id: armId,
        armazem_nome: armNome,
        stock_atual: stockAtual,
        stock_minimo: stockMin,
        unidade_medida: m.unidade_medida_sigla || 'UN',
        preco_compra: valorUnit,
        valor_total: stockAtual * valorUnit,
        status_stock: status,
        is_active: m.is_active !== false && m.ativo !== false,
      });
    });

    return { items: consolidated, armazens };
  },

  /**
   * Lança ajuste pontual de inventário com registo oficial de movimentação
   */
  async lancarAjusteIndividual(params: {
    item: InventoryItem;
    nova_quantidade: number;
    motivo: string;
    observacao?: string;
  }): Promise<any> {
    const { item, nova_quantidade, motivo, observacao } = params;
    const diferenca = nova_quantidade - item.stock_atual;
    if (diferenca === 0) return { success: true, message: 'Quantidade inalterada.' };

    const tipoMov = diferenca > 0 ? 'Entrada' : 'Saida';
    const qtdAbsoluta = Math.abs(diferenca);

    const payload = {
      tipo: tipoMov,
      armazem_id: Number(item.armazem_id) || 1,
      quantidade: qtdAbsoluta,
      preco_compra: item.preco_compra,
      origem: 'Inventário Físico - Ajuste Pontual',
      observacao: `[${motivo}] ${observacao || 'Ajuste de inventário'}. Qtd anterior: ${item.stock_atual}, Nova: ${nova_quantidade}`,
      produto_id: item.tipo_item === 'Produto' ? Number(item.original_id) : undefined,
      material_id: item.tipo_item === 'Material' ? Number(item.original_id) : undefined,
      entidade_tipo: item.tipo_item,
      referencia_id: Number(item.original_id),
    };

    // Regista a movimentação oficial
    try {
      await warehouseService.createMovimentacao(payload);
    } catch (e) {
      console.warn('createMovimentacao fallback ativado:', e);
    }

    // Atualiza o saldo do produto/material
    if (item.tipo_item === 'Produto') {
      await productService.update(item.original_id, {
        stock_atual: nova_quantidade,
      });
    } else {
      await materialService.update(String(item.original_id), {
        quantidade_total: nova_quantidade,
        quantidade_disponivel: nova_quantidade,
      });
    }

    return { success: true };
  },

  /**
   * Lança lote completo de ajustes resultantes da conferência física
   */
  async lancarAjustesLote(divergencias: ContagemItem[], observacaoGeral?: string): Promise<{ processados: number; erros: string[] }> {
    if (divergencias.length === 0) {
      return { processados: 0, erros: [] };
    }

    const loteItens = divergencias.map(div => {
      const diferenca = (div.quantidade_contada ?? div.saldo_sistema) - div.saldo_sistema;
      const tipo = diferenca >= 0 ? 'Entrada' : 'Saida';
      const qtdAbs = Math.abs(diferenca);

      return {
        tipo_item: div.tipo_item,
        produto_id: div.tipo_item === 'Produto' ? Number(div.item_id) : undefined,
        material_id: div.tipo_item === 'Material' ? Number(div.item_id) : undefined,
        codigo: div.codigo,
        nome: div.nome,
        armazem_id: Number(div.armazem_id) || 1,
        tipo: tipo as 'Entrada' | 'Saida',
        stock_atual: div.saldo_sistema,
        quantidade: qtdAbs,
        preco_compra: div.preco_unitario,
        observacao: `[${div.motivo_desvio || 'Conferência Física'}] ${div.observacao || observacaoGeral || 'Balanço Periódico'}`,
        nova_quantidade: div.quantidade_contada ?? div.saldo_sistema
      };
    });

    let processados = 0;
    const erros: string[] = [];

    // Tenta envio em lote
    try {
      await warehouseService.movimentacaoLote({
        numero_fatura: `INV-${Date.now().toString().slice(-6)}`,
        observacao: observacaoGeral || 'Ajuste Geral de Balanço de Inventário',
        itens: loteItens
      });
      processados = loteItens.length;
    } catch {
      // Fallback item a item
      for (const item of loteItens) {
        try {
          await warehouseService.createMovimentacao({
            tipo: item.tipo,
            armazem_id: item.armazem_id,
            quantidade: item.quantidade,
            origem: 'Inventário Físico - Balanço',
            observacao: item.observacao,
            produto_id: item.produto_id,
            material_id: item.material_id,
            entidade_tipo: item.tipo_item,
            referencia_id: item.produto_id || item.material_id
          });

          if (item.tipo_item === 'Produto' && item.produto_id) {
            await productService.update(item.produto_id, {
              stock_atual: item.nova_quantidade
            });
          } else if (item.tipo_item === 'Material' && item.material_id) {
            await materialService.update(String(item.material_id), {
              quantidade_total: item.nova_quantidade,
              quantidade_disponivel: item.nova_quantidade
            });
          }
          processados++;
        } catch (err: any) {
          console.error(`Erro ao ajustar item ${item.nome}:`, err);
          erros.push(item.nome);
        }
      }
    }

    return { processados, erros };
  },

  /**
   * Gestão da Zona de Quarentena & Avarias (Secção 4 do Manual do Armazém)
   */
  async getQuarentenaItems(): Promise<QuarentenaItem[]> {
    const response: any = await apiClient.get('/v1/armazem/inventarios/quarentena');
    if (response?.success === false) throw new Error(response.msg || 'Falha ao carregar a quarentena.');
    return response?.data?.items ?? [];
  },

  async isolarParaQuarentena(dados: {
    item: InventoryItem;
    quantidade: number;
    motivo: QuarentenaItem['motivo'];
    lote?: string;
    validade?: string;
    observacao?: string;
    responsavel: string;
  }): Promise<QuarentenaItem> {
    const { item, quantidade, motivo, lote, validade, observacao, responsavel } = dados;

    const response: any = await apiClient.post('/v1/armazem/inventarios/quarentena', {
      armazem_id: Number(item.armazem_id), quantidade, motivo, lote: lote || item.lote,
      validade: validade || item.validade, observacao, responsavel,
      produto_id: item.tipo_item === 'Produto' ? Number(item.original_id) : undefined,
      material_id: item.tipo_item === 'Material' ? Number(item.original_id) : undefined,
    });
    if (response?.success === false) throw new Error(response.msg || 'Falha ao isolar o artigo.');
    return response.data as QuarentenaItem;
  },

  async descartarQuebraQuarentena(quarentenaId: string, justificativa: string): Promise<boolean> {
    const response: any = await apiClient.post(`/v1/armazem/inventarios/quarentena/${quarentenaId}/descartar`, { justificativa });
    if (response?.success === false) throw new Error(response.msg || 'Falha ao descartar o artigo.');
    return true;
  },

  async reintegrarStockQuarentena(quarentenaId: string, observacao?: string): Promise<boolean> {
    const response: any = await apiClient.post(`/v1/armazem/inventarios/quarentena/${quarentenaId}/reintegrar`, { observacao });
    if (response?.success === false) throw new Error(response.msg || 'Falha ao reintegrar o artigo.');
    return true;
  },

  /**
   * Exporta a listagem de stock em folha Excel (.xlsx)
   */
  exportarInventarioExcel(items: InventoryItem[], armazemNome?: string) {
    const moeda =  'STN';
    const dadosExcel = items.map((item, idx) => ({
      'Nº': idx + 1,
      'Código': item.codigo,
      'Nome do Artigo': item.nome,
      'Tipo': item.tipo,
      'Categoria': item.categoria,
      'Armazém': item.armazem_nome,
      'Stock Atual': item.stock_atual,
      'Unidade': item.unidade_medida,
      'Stock Mínimo': item.stock_minimo,
      [`Preço Unitário (${moeda})`]: item.preco_compra,
      [`Valor Total em Stock (${moeda})`]: item.valor_total,
      'Estado': item.status_stock,
      'Lote': item.lote || '-',
      'Validade': item.validade || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExcel);

    // Formata larguras das colunas
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 35 },
      { wch: 14 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 10 },
      { wch: 14 },
      { wch: 20 },
      { wch: 24 },
      { wch: 14 },
      { wch: 12 },
      { wch: 14 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventário e Stock');

    const dataHora = new Date().toISOString().split('T')[0];
    const nomeFicheiro = `Inventario_SIGI_${armazemNome ? armazemNome.replace(/\s+/g, '_') : 'Geral'}_${dataHora}.xlsx`;
    XLSX.writeFile(workbook, nomeFicheiro);
  },

  /**
   * Gera e descarrega a Folha Oficial de Contagem Física Cega em PDF (Documento 5 do Manual)
   */
  imprimirFichaContagemCega(items: InventoryItem[], armazemNome?: string, modoAssistido: boolean = false) {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Cabeçalho Corporativo
    doc.setFontSize(14);
    doc.setTextColor(33, 37, 41);
    doc.text('SABOR IMBATÍVEL, S.A.', 14, 15);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('SIGI ERP — SISTEMA INTEGRADO DE GESTÃO INTERNA', 14, 21);

    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(
      modoAssistido 
        ? 'FOLHA DE CONFERÊNCIA FÍSICA DE INVENTÁRIO (ASSISTIDA)'
        : 'FOLHA DE CONTAGEM FÍSICA PERIÓDICA CEGA (AUDITORIA)', 
      14, 
      29
    );

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const dataHoje = new Date().toLocaleDateString('pt-PT');
    doc.text(`Armazém Auditado: ${armazemNome || 'Todos os Armazéns'}`, 14, 35);
    doc.text(`Data de Emissão: ${dataHoje}`, 120, 35);
    doc.text('Responsável pela Contagem: ____________________________________', 14, 42);

    const tableHeaders = modoAssistido
      ? [['Nº', 'Código', 'Designação do Artigo', 'Categoria', 'Unid.', 'Saldo Sistema', 'Qtd Contada', 'Diferença']]
      : [['Nº', 'Código', 'Designação do Artigo', 'Categoria', 'Unid.', 'Lote / Validade', 'Qtd Contada Fisicamente', 'Observações']];

    const tableRows = items.map((it, idx) => {
      if (modoAssistido) {
        return [
          String(idx + 1),
          it.codigo,
          it.nome,
          it.categoria,
          it.unidade_medida,
          String(it.stock_atual),
          '',
          ''
        ];
      }
      return [
        String(idx + 1),
        it.codigo,
        it.nome,
        it.categoria,
        it.unidade_medida,
        it.lote || '-',
        '[       ]',
        ''
      ];
    });

    autoTable(doc, {
      head: tableHeaders,
      body: tableRows,
      startY: 47,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 22 },
        2: { cellWidth: 60 },
        3: { cellWidth: 28 },
        4: { cellWidth: 14 }
      }
    });

    // Rodapé de assinatura
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    if (finalY < 260) {
      doc.setFontSize(8);
      doc.text('Assinatura do Fiel de Armazém: _______________________________', 14, finalY + 15);
      doc.text('Visto da Gerência / Auditoria: _______________________________', 120, finalY + 15);
    }

    doc.save(`Folha_Contagem_Fisica_${armazemNome ? armazemNome.replace(/\s+/g, '_') : 'Geral'}_${new Date().toISOString().split('T')[0]}.pdf`);
  }
};
