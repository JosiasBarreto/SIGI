import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as allServices from '../services';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { schemas } from '../data/schemas';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

export default function Clientes() {
  const title = "Clientes";
  const moduleName = "clients";
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  
  const queryClient = useQueryClient();
  const apiAccessor = allServices.clientService;

  const schema = schemas[moduleName];

  const { data: paginatedResponse, isLoading } = useQuery({
    queryKey: [moduleName, page, perPage, searchTerm],
    queryFn: () => apiAccessor.getAll({ page, per_page: perPage, search: searchTerm })
  });

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
                {field.type === 'textarea' ? (
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
                    defaultValue={currentRecord?.[field.name] || (field.type === 'date' && !currentRecord ? new Date().toISOString().split('T')[0] : '')}
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
