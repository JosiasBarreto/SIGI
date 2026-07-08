import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryService, vehicleService } from '../services';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

function LogisticaEntregas() {
  const queryClient = useQueryClient();
  const { data: resp, isLoading } = useQuery({ 
    queryKey: ['deliveries'], 
    queryFn: () => deliveryService.getAll() 
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string | number, estado: string }) => deliveryService.updateEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Estado de entrega atualizado');
    },
    onError: () => {
      toast.error('Erro ao atualizar entrega');
    }
  });

  const data = resp?.items || [];

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { 
      id: 'id_destino', 
      header: 'ID / Destino', 
      cell: ({ row }) => `${row.original.id} - ${row.original.destino || 'Armazém Central'}` 
    },
    { 
      accessorKey: 'estado', 
      header: 'Estado',
      cell: ({ getValue }) => <span className="font-bold">{getValue<string>() || 'Agendada'}</span>
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="flex gap-2">
            {(d.estado === 'Agendada' || !d.estado) && (
              <button onClick={() => updateEstadoMutation.mutate({ id: d.id, estado: 'Em Trânsito' })} className="px-3 py-1 bg-warning text-white rounded font-bold text-xs">Iniciar Entrega</button>
            )}
            {d.estado === 'Em Trânsito' && (
              <button onClick={() => updateEstadoMutation.mutate({ id: d.id, estado: 'Entregue' })} className="px-3 py-1 bg-success text-white rounded font-bold text-xs">Concluir Entrega</button>
            )}
          </div>
        );
      }
    }
  ], [updateEstadoMutation]);

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestão de Entregas (Operações Restritas)</h2>
      </div>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Pesquisar entregas..."
      />
    </div>
  );
}

function FrotaViaturas() {
  const { data: resp, isLoading } = useQuery({ 
    queryKey: ['vehicles'], 
    queryFn: () => vehicleService.getAll() 
  });

  const data = resp?.items || [];

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'matricula', header: 'Matrícula' },
    { accessorKey: 'marca', header: 'Marca/Modelo' },
    { accessorKey: 'capacidade', header: 'Capacidade' },
    { accessorKey: 'estado', header: 'Estado' }
  ], []);

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Frota de Viaturas</h2>
      </div>
      <DataTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Pesquisar viaturas..."
      />
    </div>
  );
}

export default function Logistica() {
  return (
    <div className="space-y-12 animate-fade-in">
      <LogisticaEntregas />
      <FrotaViaturas />
    </div>
  );
}
