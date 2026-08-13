import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, FileUp, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../api/client';

const colunas = ['tipo', 'codigo', 'nome', 'categoria_id', 'unidade_medida_id', 'servico', 'preco_compra', 'preco_venda', 'tempo_producao', 'stock_minimo', 'quantidade_inicial', 'armazem_id', 'taxa_iva_id', 'tipo_material'];
const exemplo = [
  { tipo: 'Consumivel', codigo: '', nome: 'Farinha de trigo', categoria_id: 1, unidade_medida_id: 1, servico: 'ABASTECIMENTO', preco_compra: 450, preco_venda: '', tempo_producao: '', stock_minimo: 10, quantidade_inicial: 50, armazem_id: 1, taxa_iva_id: '', tipo_material: '' },
  { tipo: 'Acabado', codigo: '', nome: 'Bolo simples', categoria_id: 2, unidade_medida_id: 2, servico: 'PASTELARIA', preco_compra: '', preco_venda: 5000, tempo_producao: 90, stock_minimo: 2, quantidade_inicial: 0, armazem_id: 1, taxa_iva_id: 1, tipo_material: '' },
  { tipo: 'Revenda', codigo: '', nome: 'Refrigerante', categoria_id: 3, unidade_medida_id: 2, servico: 'BAR', preco_compra: 500, preco_venda: 800, tempo_producao: '', stock_minimo: 6, quantidade_inicial: 24, armazem_id: 1, taxa_iva_id: 1, tipo_material: '' },
  { tipo: 'Material', codigo: 'MAT-EX-01', nome: 'Mesa dobrável', categoria_id: '', unidade_medida_id: 2, servico: '', preco_compra: '', preco_venda: '', tempo_producao: '', stock_minimo: 2, quantidade_inicial: 10, armazem_id: 1, taxa_iva_id: '', tipo_material: 'Reutilizavel' },
];

export default function ImportacaoCatalogo() {
  const [linhas, setLinhas] = useState<any[]>([]);
  const [resultado, setResultado] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const descarregarModelo = () => {
    const ws = XLSX.utils.json_to_sheet(exemplo, { header: colunas });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Importação');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Instruções'], ['Preencha apenas esta folha. Não altere os nomes das colunas.'], ['Tipos aceites: Consumivel, Acabado, Revenda, Material.'], ['A quantidade_inicial cria automaticamente uma entrada de stock para Produtos.']]), 'Leia-me');
    XLSX.writeFile(wb, 'modelo_importacao_catalogo_SIGI.xlsx');
  };
  const carregar = async (file?: File) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const book = XLSX.read(data, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json<any>(book.Sheets[book.SheetNames[0]], { defval: '' }).filter((row: any) => Object.values(row).some(Boolean));
      setLinhas(rows); setResultado([]);
      toast.info(`${rows.length} linhas carregadas. Valide antes de importar.`);
    } catch { toast.error('Não foi possível ler o ficheiro Excel.'); }
  };
  const validar = async () => {
    setLoading(true);
    try { const res: any = await apiClient.post('/v1/armazem/importacao/validar', { linhas }); setResultado(res.linhas || []); }
    catch (e: any) { toast.error(e?.message || 'Falha na validação.'); }
    finally { setLoading(false); }
  };
  const confirmar = async () => {
    if (resultado.some(x => !x.valido)) return toast.error('Corrija as linhas inválidas antes de confirmar.');
    setLoading(true);
    try { const res: any = await apiClient.post('/v1/armazem/importacao/confirmar', { linhas }); toast.success(`${res.itens?.length || 0} itens importados com sucesso.`); setLinhas([]); setResultado([]); }
    catch (e: any) { toast.error(e?.message || 'A importação não foi concluída.'); }
    finally { setLoading(false); }
  };
  return <div className="space-y-5">
    <div className="rounded-2xl border bg-white dark:bg-surface-dark p-5"><h2 className="font-bold text-lg">Importar catálogo e stock inicial</h2><p className="text-xs text-gray-500 mt-1">O ficheiro é validado antes de qualquer gravação. Duplicados e stocks baixos ficam assinalados no relatório.</p><div className="flex flex-wrap gap-3 mt-4"><button onClick={descarregarModelo} className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold flex gap-2"><Download size={15}/> Baixar modelo Excel</button><label className="px-4 py-2 rounded-lg border text-xs font-bold flex gap-2 cursor-pointer"><FileUp size={15}/> Carregar Excel<input className="hidden" accept=".xlsx,.xls" type="file" onChange={e => carregar(e.target.files?.[0])}/></label>{linhas.length > 0 && <><button disabled={loading} onClick={validar} className="px-4 py-2 rounded-lg border text-xs font-bold">Validar {linhas.length} linhas</button><button disabled={loading || resultado.length === 0 || resultado.some(x => !x.valido)} onClick={confirmar} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex gap-2"><Upload size={15}/> Confirmar inserção</button></>}</div></div>
    {resultado.length > 0 && <div className="rounded-2xl border overflow-auto"><table className="w-full text-xs"><thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="p-3 text-left">Linha</th><th className="p-3 text-left">Item</th><th className="p-3 text-left">Estado</th><th className="p-3 text-left">Relatório</th></tr></thead><tbody>{resultado.map(r => <tr key={r.linha} className="border-t"><td className="p-3">{r.linha}</td><td className="p-3 font-semibold">{r.dados.nome}<span className="block text-gray-500">{r.dados.tipo}</span></td><td className="p-3">{r.valido ? <span className="text-emerald-600 flex gap-1"><CheckCircle2 size={14}/> Válido</span> : <span className="text-red-600 flex gap-1"><AlertTriangle size={14}/> Bloqueado</span>}</td><td className="p-3">{[...(r.erros || []), ...(r.alertas || [])].join(' · ') || 'Sem ocorrências'}</td></tr>)}</tbody></table></div>}
  </div>;
}
