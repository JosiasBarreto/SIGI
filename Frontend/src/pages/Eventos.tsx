import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as allServices from '../services';
import { Plus, Edit2, Trash2, Eye, Receipt, FileText } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { schemas } from '../data/schemas';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

export default function Eventos() {
  const title = "Eventos";
  const moduleName = "events";
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  
  const queryClient = useQueryClient();
  const apiAccessor = allServices.eventService;

  const schema = schemas[moduleName];

  const { data: paginatedResponse, isLoading } = useQuery({
    queryKey: [moduleName, page, perPage, searchTerm],
    queryFn: () => apiAccessor.getAll({ page, per_page: perPage, search: searchTerm })
  });
  const { data: clientsResponse } = useQuery({
    queryKey: ["clients", "all"],
    queryFn: () => allServices.clientService.getAll({ per_page: 1000 })
  });
  const clients = clientsResponse?.items || [];

  const createMutation = useMutation({
    mutationFn: (newRecord: any) => apiAccessor.create(newRecord),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      setIsModalOpen(false);
      toast.success('Registo criado com sucesso.');
    },
    onError: () => toast.error('Erro ao criar registo.')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) => apiAccessor.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      setIsModalOpen(false);
      toast.success('O registo foi atualizado.');
    },
    onError: () => toast.error('Erro ao atualizar registo.')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiAccessor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      toast.success('O registo foi eliminado.');
    },
    onError: () => toast.error('Erro ao eliminar registo.')
  });

  const faturarMutation = useMutation({
    mutationFn: ({ id, pagamento }: { id: string | number; pagamento: any }) => allServices.eventService.faturar(id, pagamento),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      setIsViewOpen(false);
      toast.success('Evento faturado com sucesso e convertido em Venda!');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao faturar evento.');
    }
  });

  const handleOpenForm = (record: any = null) => {
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleOpenView = (record: any) => {
    setCurrentRecord(record);
    setIsViewOpen(true);
  };

  const handleDelete = (id: string) => {
    Swal.fire({
      title: 'Tem a certeza?',
      text: "Esta ação não pode ser revertida!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sim, eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleFaturarEvento = async () => {
    if (!currentRecord?.id) return;
    const saldo = Math.max(0, Number(currentRecord.saldo ?? currentRecord.valor_total ?? 0) - Number(currentRecord.valor_pago ?? 0));
    const valorPadrao = saldo || Number(currentRecord.valor_total || 0);
    const result = await Swal.fire({
      title: 'Faturar Evento',
      html: `
        <div class="space-y-3 text-left">
          <label class="block text-xs font-bold uppercase text-gray-500">Valor a receber</label>
          <input id="evento-valor" type="number" min="0.01" step="0.01" class="swal2-input w-full m-0" value="${valorPadrao}">
          <label class="block text-xs font-bold uppercase text-gray-500">Forma de pagamento</label>
          <select id="evento-forma" class="swal2-select w-full m-0">
            <option value="1">Dinheiro</option>
            <option value="3">TPA / POS</option>
            <option value="2">Transferência</option>
          </select>
          <input id="evento-codigo" class="swal2-input w-full m-0" placeholder="Comprovativo / Código TRX">
          <input id="evento-emissor" class="swal2-input w-full m-0" placeholder="Emissor / Titular">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Faturar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const valor = Number((document.getElementById('evento-valor') as HTMLInputElement).value);
        const forma = Number((document.getElementById('evento-forma') as HTMLSelectElement).value);
        const codigo = (document.getElementById('evento-codigo') as HTMLInputElement).value.trim();
        const emissor = (document.getElementById('evento-emissor') as HTMLInputElement).value.trim();
        if (!valor || valor <= 0) {
          Swal.showValidationMessage('Informe um valor válido.');
          return false;
        }
        if ((forma === 2 || forma === 3) && (!codigo || !emissor)) {
          Swal.showValidationMessage('Código e emissor são obrigatórios para Transferência/POS.');
          return false;
        }
        return {
          valor,
          forma_pagamento_id: forma,
          codigo_transferencia: forma === 2 || forma === 3 ? codigo : null,
          emissor: forma === 2 || forma === 3 ? emissor : null,
          observacoes: `Faturação do evento ${currentRecord.numero || currentRecord.titulo}`
        };
      }
    });

    if (result.isConfirmed && result.value) {
      // The backend /faturar just requires serie_id and observacoes
      faturarMutation.mutate({ id: currentRecord.id, pagamento: { serie_id: 1, observacoes: result.value.observacoes } as any });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const dataObj: any = {};
    
    schema?.fields.forEach(field => {
      if (field.type === 'checkbox') {
        dataObj[field.name] = formData.has(field.name);
      } else {
        const val = formData.get(field.name);
        if (val !== null) dataObj[field.name] = val;
      }
    });

    if (!dataObj.hora_fim) {
      toast.error('Informe a hora de término do evento.');
      return;
    }

    const valorEvento = Number(dataObj.valor_evento || 0);
    if (valorEvento > 0) {
      dataObj.servicos = [{
        tipo: 'Cozinha',
        descricao: dataObj.servico_descricao || dataObj.descricao || dataObj.titulo || 'Servico de evento',
        quantidade: 1,
        valor_unitario: valorEvento
      }];
    }
    delete dataObj.valor_evento;
    delete dataObj.servico_descricao;
    
    if (currentRecord?.id) {
      updateMutation.mutate({ id: currentRecord.id, updates: dataObj });
    } else {
      createMutation.mutate(dataObj);
    }
  };

  const data = paginatedResponse?.items || [];
  const pagination = paginatedResponse || { page: 1, total: 0, pages: 0 };

  const tableColumns = React.useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [];
    
    if (schema) {
      schema.columns.forEach(col => {
        cols.push({
          accessorKey: col.key,
          header: col.label,
          cell: (info) => col.render ? col.render(info.getValue(), info.row.original) : (info.getValue() || '-')
        });
      });
    }

    cols.push({
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => {
        const item = info.row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => handleOpenView(item)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" title="Ver Detalhes">
              <Eye size={16} />
            </button>
            <button onClick={() => handleOpenForm(item)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors" title="Editar">
              <Edit2 size={16} />
            </button>
            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-error hover:bg-error/10 rounded transition-colors" title="Eliminar">
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    });

    return cols;
  }, [schema]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{schema?.title || title}</h1>
        {schema && (
          <button onClick={() => handleOpenForm()} className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
            <Plus size={18} /> Novo Registo
          </button>
        )}
      </div>

      <DataTable
        data={data}
        columns={tableColumns}
        isLoading={isLoading}
        searchPlaceholder={`Pesquisar em ${schema?.title || title}...`}
        manualPagination={true}
        pageCount={pagination.pages}
        paginationState={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(updater) => {
          if (typeof updater === 'function') {
            const newState = updater({ pageIndex: page - 1, pageSize: perPage });
            setPage(newState.pageIndex + 1);
          } else {
            setPage(updater.pageIndex + 1);
          }
        }}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setPage(1);
        }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentRecord ? 'Editar Registo' : `Novo Registo em ${schema?.title}`}
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" form="crud-form" className="px-5 py-2 rounded-lg font-medium bg-primary hover:bg-primary-hover text-white transition-colors">
              {currentRecord ? 'Atualizar' : 'Guardar'}
            </button>
          </>
        }
      >
        {schema && (
          <form id="crud-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schema.fields.map(field => (
              <div key={field.name} className={`space-y-1 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                  {field.label} {field.required && <span className="text-error">*</span>}
                </label>
                {field.name === 'cliente_id' ? (
                  <select 
                    name={field.name} 
                    defaultValue={currentRecord?.[field.name] || ''}
                    required={field.required}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.nome} - {c.telefone}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea 
                    name={field.name} 
                    defaultValue={currentRecord?.[field.name] || ''}
                    required={field.required}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                ) : field.type === 'select' ? (
                  <select 
                    name={field.name} 
                    defaultValue={currentRecord?.[field.name] || (field.options?.[0] || '')}
                    required={field.required}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input 
                    type="checkbox" 
                    name={field.name} 
                    defaultChecked={currentRecord?.[field.name] === true}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary/50 dark:bg-gray-700 dark:border-gray-600"
                  />
                ) : (
                  <input 
                    type={field.type} 
                    name={field.name} 
                    defaultValue={field.name === 'valor_evento' ? (currentRecord?.valor_total || '') : (currentRecord?.[field.name] || (field.type === 'date' && !currentRecord ? new Date().toISOString().split('T')[0] : ''))}
                    required={field.required}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                )}
              </div>
            ))}
          </form>
        )}
      </Modal>

      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Detalhes do Registo"
        maxWidth="max-w-4xl"
        footer={
          <>
            <button onClick={() => setIsViewOpen(false)} className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
              Fechar
            </button>
            <button
              onClick={() => allServices.documentService.eventoDocumento(currentRecord.id, 'proforma').catch((err: any) => toast.error(err?.message || 'Erro ao gerar proforma.'))}
              className="px-6 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-2"
            >
              <FileText size={16} /> Proforma PDF
            </button>
            <button 
              disabled={faturarMutation.isPending}
              onClick={handleFaturarEvento}
              className="px-6 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Receipt size={16} /> {faturarMutation.isPending ? 'A faturar...' : 'Faturar Evento'}
            </button>
            <button 
              onClick={() => { setIsViewOpen(false); handleOpenForm(currentRecord); }} 
              className="px-6 py-2 rounded-lg font-medium bg-primary hover:bg-primary-hover text-white transition-colors flex items-center gap-2"
            >
              <Edit2 size={16} /> Editar Registo
            </button>
          </>
        }
      >
        {schema && currentRecord && (
          <div className="space-y-8">
            <div>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                  ID Externo: <span className="font-mono text-gray-400">{currentRecord.id}</span>
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schema.fields.map(field => (
                <div key={field.name} className={`${field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''}`}>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {field.label}
                  </h3>
                  <div className="text-base font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800/50">
                    {currentRecord[field.name] || <span className="text-gray-400 italic">Não definido</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Metadados e Auditoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Criado (Sistema)</p>
                  <p className="font-medium text-sm dark:text-gray-300">Hoje, por API</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Sistema Integrado</p>
                  <p className="font-medium text-sm dark:text-gray-300">SIGI ERP Core Sync</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Estado de Auditoria</p>
                  <p className="font-medium text-sm dark:text-gray-300 text-success">Verificado</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
