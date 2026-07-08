import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Filter, Search, Download, Calendar, Users, RefreshCw, Eye, FileJson, AlertCircle, LogIn, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';

export default function Auditoria() {
  const [activeTab, setActiveTab] = useState<'auditoria' | 'acesso' | 'erro'>('auditoria');
  
  // Pagination State
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Filters State
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [searchModule, setSearchModule] = useState("");

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  // Modal state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Pagination states from server
  const [totalPages, setTotalPages] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auditLogs', activeTab, pageIndex, pageSize, dataInicio, dataFim, searchUser, searchModule],
    queryFn: async () => {
       try {
           const params = new URLSearchParams();
           params.append('tipo', activeTab);
           params.append('page', String(pageIndex + 1));
           params.append('per_page', String(pageSize));
           if (dataInicio) params.append('data_inicio', dataInicio);
           if (dataFim) params.append('data_fim', dataFim);
           if (searchUser) params.append('utilizador', searchUser);
           if (searchModule && activeTab === 'auditoria') params.append('modulo', searchModule);

           const res = await apiClient.get<any, any>(`/v1/auditoria?${params.toString()}`);
           setTotalPages(res.pages || 1);
           return res.items || [];
       } catch (error) {
           console.error("Error fetching audit logs", error);
           return [];
       }
    }
  });

  useEffect(() => {
    setPagination({ pageIndex: 0, pageSize: 20 });
  }, [activeTab]);

  const viewDetails = (log: any) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const columnsAuditoria = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'data_hora',
      header: 'DATA/HORA',
      cell: (info) => <span className="font-mono text-[11px] text-gray-500">{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      accessorKey: 'utilizador',
      header: 'UTILIZADOR',
      cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'modulo',
      header: 'MÓDULO/ENTIDADE',
      cell: (info) => (
        <div>
          <span className="block font-bold text-primary">{info.getValue() as string}</span>
          <span className="text-[10px] text-gray-400">{info.row.original.entidade}</span>
        </div>
      ),
    },
    {
      accessorKey: 'operacao',
      header: 'OPERAÇÃO',
      cell: (info) => <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-[10px] font-bold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'registo_id',
      header: 'ID REGISTO',
      cell: (info) => <span className="font-mono font-semibold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: (info) => <span className="font-mono text-[11px] text-gray-500">{info.getValue() as string}</span>,
    },
    {
      id: 'actions',
      header: 'AÇÕES',
      cell: (info) => (
        <div className="flex justify-end">
          <button
            onClick={() => viewDetails(info.row.original)}
            className="p-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded transition-colors"
            title="Ver Detalhes"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ], []);

  const columnsAcesso = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'data_login',
      header: 'DATA/HORA LOGIN',
      cell: (info) => <span className="font-mono text-[11px] text-gray-500">{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      accessorKey: 'utilizador',
      header: 'UTILIZADOR',
      cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'ip',
      header: 'IP',
      cell: (info) => <span className="font-mono text-[11px] text-gray-500">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'user_agent',
      header: 'USER AGENT',
      cell: (info) => <span className="text-[10px] max-w-xs truncate text-gray-400 block" title={info.getValue() as string}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'data_logout',
      header: 'DATA LOGOUT',
      cell: (info) => <span className="font-mono text-[11px] text-gray-500">{info.getValue() ? new Date(info.getValue() as string).toLocaleString() : '-'}</span>,
    },
    {
      accessorKey: 'sucesso',
      header: 'STATUS',
      cell: (info) => {
        const isSuccess = info.getValue() as boolean;
        return (
          <span className={`px-2 py-1 rounded text-[10px] font-bold ${isSuccess ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
            {isSuccess ? 'Sucesso' : 'Falhou'}
          </span>
        );
      },
    },
  ], []);

  const columnsErro = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'data_hora',
      header: 'DATA/HORA',
      cell: (info) => <span className="font-mono text-[11px] text-gray-500">{new Date(info.getValue() as string).toLocaleString()}</span>,
    },
    {
      accessorKey: 'utilizador',
      header: 'UTILIZADOR',
      cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue() ? info.getValue() as string : '-'}</span>,
    },
    {
      accessorKey: 'tipo',
      header: 'TIPO ERRO',
      cell: (info) => <span className="font-bold text-error">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'mensagem',
      header: 'MENSAGEM',
      cell: (info) => <span className="text-gray-600 dark:text-gray-300">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'rota',
      header: 'ROTA',
      cell: (info) => <span className="font-mono text-[10px] text-gray-500">{info.getValue() as string}</span>,
    },
  ], []);

  const getColumns = () => {
    switch (activeTab) {
      case 'auditoria': return columnsAuditoria;
      case 'acesso': return columnsAcesso;
      case 'erro': return columnsErro;
      default: return columnsAuditoria;
    }
  };

  const renderFilters = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Data Início</label>
        <input 
          type="date" 
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary text-gray-800 dark:text-white transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Data Fim</label>
        <input 
          type="date" 
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary text-gray-800 dark:text-white transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Utilizador</label>
        <input 
          type="text" 
          placeholder="Nome do utilizador..."
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary text-gray-800 dark:text-white transition-colors"
        />
      </div>
      {activeTab === 'auditoria' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Módulo / Entidade</label>
          <input 
            type="text" 
            placeholder="Ex: Utilizadores, Vendas..."
            value={searchModule}
            onChange={(e) => setSearchModule(e.target.value)}
            className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary text-gray-800 dark:text-white transition-colors"
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in text-gray-800 dark:text-gray-100" id="auditoria-module">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center text-gray-950 dark:text-white">
            <Shield className="mr-2 text-primary" />
            Auditoria Avançada do Sistema
          </h1>
          <p className="text-xs text-gray-400 mt-1">Registo exaustivo de ações operacionais e acessos em tempo de execução para os administradores da Sabor Imbatível.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('auditoria')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'auditoria' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Activity className="w-4 h-4 mr-2" />
          Logs de Operações
        </button>
        <button
          onClick={() => setActiveTab('acesso')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'acesso' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <LogIn className="w-4 h-4 mr-2" />
          Histórico de Logins
        </button>
        <button
          onClick={() => setActiveTab('erro')}
          className={`flex items-center px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
            activeTab === 'erro' ? 'border-error text-error bg-error/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Erros do Sistema
        </button>
      </div>

      {/* Main Table Card */}
      <DataTable
        data={data || []}
        columns={getColumns()}
        isLoading={isLoading}
        renderFilters={renderFilters}
        manualPagination
        pageCount={totalPages}
        paginationState={pagination}
        onPaginationChange={setPagination}
        onClearFilters={() => {
          setDataInicio("");
          setDataFim("");
          setSearchUser("");
          setSearchModule("");
          setPagination({ pageIndex: 0, pageSize: 20 });
        }}
      />

      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Detalhes da Operação">
        {selectedLog && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Informação Geral
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Módulo</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedLog.modulo}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Entidade</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedLog.entidade}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Operação</span>
                  <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded">
                    {selectedLog.operacao}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">ID do Registo</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">{selectedLog.registo_id}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Utilizador</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{selectedLog.utilizador}</span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 font-semibold mb-1">Endereço IP</span>
                  <span className="font-mono text-gray-600 dark:text-gray-400 text-xs">{selectedLog.ip}</span>
                </div>
              </div>
            </div>
            
            {selectedLog.justificativa && (
              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                <span className="flex items-center text-sm text-amber-800 dark:text-amber-400 font-bold mb-2">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Justificativa:
                </span>
                <p className="text-sm text-amber-900 dark:text-amber-200 italic">{selectedLog.justificativa}</p>
              </div>
            )}

            {(selectedLog.valor_anterior || selectedLog.valor_novo) && (
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                  <FileJson className="w-4 h-4 mr-2 text-primary" />
                  Alterações nos Dados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-t-lg border border-b-0 border-gray-200 dark:border-gray-700">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Valor Anterior</span>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-lg p-3 overflow-x-auto">
                      <pre className="text-[11px] font-mono text-gray-700 dark:text-gray-400">
                        {selectedLog.valor_anterior ? JSON.stringify(selectedLog.valor_anterior, null, 2) : 'N/A'}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-t-lg border border-b-0 border-green-200 dark:border-green-800/30">
                      <span className="text-xs font-bold text-green-700 dark:text-green-400">Valor Novo</span>
                    </div>
                    <div className="flex-1 bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-b-lg p-3 overflow-x-auto">
                      <pre className="text-[11px] font-mono text-green-800 dark:text-green-300">
                        {selectedLog.valor_novo ? JSON.stringify(selectedLog.valor_novo, null, 2) : 'N/A'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
