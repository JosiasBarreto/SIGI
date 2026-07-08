import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Plus,
  Edit3,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Activity,
  Calendar,
  AlertCircle
} from "lucide-react";
import { shiftService } from "../services";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import Modal from "../components/Common/Modal";
import { cn } from "../lib/utils";

export default function Turnos() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedTurno, setSelectedTurno] = useState<any>(null);

  // Form states
  const [nome, setNome] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [ativo, setAtivo] = useState(true);

  // Fetch all shifts
  const { data: shiftsResponse, isLoading } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => shiftService.getAll({ per_page: 1000 })
  });

  const shifts = shiftsResponse?.items || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => shiftService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Turno criado com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao criar turno.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      shiftService.update(String(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Turno atualizado com sucesso!");
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao atualizar turno.");
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string | number) => shiftService.toggle(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success(`Turno "${updated.nome}" alterado para ${updated.ativo ? "ativo" : "inativo"} com sucesso.`);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao alterar estado do turno.");
    }
  });

  const resetForm = () => {
    setNome("");
    setHoraInicio("");
    setHoraFim("");
    setAtivo(true);
    setSelectedTurno(null);
  };

  const handleOpenCreate = () => {
    setModalMode("create");
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (turno: any) => {
    setModalMode("edit");
    setSelectedTurno(turno);
    setNome(turno.nome);
    // Slice "06:00:00" to "06:00" for input[type="time"] compatibility
    setHoraInicio(turno.hora_inicio ? turno.hora_inicio.slice(0, 5) : "");
    setHoraFim(turno.hora_fim ? turno.hora_fim.slice(0, 5) : "");
    setAtivo(turno.ativo);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("O nome do turno é obrigatório.");
      return;
    }

    const payload = {
      nome,
      hora_inicio: horaInicio ? horaInicio.slice(0, 5) : null,
      hora_fim: horaFim ? horaFim.slice(0, 5) : null,
      ativo
    };

    if (modalMode === "create") {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: selectedTurno.id, data: payload });
    }
  };

  const handleToggle = (id: string | number) => {
    toggleMutation.mutate(id);
  };

  const isAdmin = ["Administrador", "Gerente"].includes(user?.role || "");

  const activeCount = shifts.filter((s: any) => s.ativo).length;
  const inactiveCount = shifts.filter((s: any) => !s.ativo).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <Clock className="text-primary" size={28} />
            Configuração de Turnos
          </h1>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
            Cadastro de turnos operacionais e janelas de horário do sistema
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 text-xs uppercase tracking-wider"
          >
            <Plus size={16} /> Novo Turno
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Registado</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white font-mono">{shifts.length}</p>
          </div>
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Turnos Ativos</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{activeCount}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <Activity size={20} />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Inativos / Pausados</p>
            <p className="text-2xl font-black text-gray-400 font-mono">{inactiveCount}</p>
          </div>
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-xl flex items-center justify-center">
            <XCircle size={20} />
          </div>
        </div>
      </div>

      {/* Shifts Management Grid */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            Turnos de Produção e Armazém
          </h2>
          <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
            Janelas horárias de funcionamento e controlo de auditoria de requisições
          </p>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            A carregar cadastro de turnos...
          </div>
        ) : shifts.length === 0 ? (
          <div className="py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Nenhum turno configurado no sistema.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Nome do Turno</th>
                  <th className="px-6 py-4">Hora de Início</th>
                  <th className="px-6 py-4">Hora de Fim</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200 font-semibold">
                {shifts.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-sm">
                        {s.nome}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        ID: #{s.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-600 dark:text-gray-300">
                      {s.hora_inicio ? s.hora_inicio.slice(0, 5) : <span className="text-gray-300 dark:text-gray-700 italic font-medium">Sem limite</span>}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-gray-600 dark:text-gray-300">
                      {s.hora_fim ? s.hora_fim.slice(0, 5) : <span className="text-gray-300 dark:text-gray-700 italic font-medium">Sem limite</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
                            s.ativo
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          )}
                        >
                          {s.ativo ? "Ativo" : "Inativo"}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleToggle(s.id)}
                            className="text-gray-400 hover:text-primary transition-colors p-1"
                            title={s.ativo ? "Desativar Turno" : "Ativar Turno"}
                          >
                            {s.ativo ? (
                              <ToggleRight size={24} className="text-emerald-500" />
                            ) : (
                              <ToggleLeft size={24} className="text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                        >
                          <Edit3 size={12} /> Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Configurar Novo Turno Operacional" : `Editar Turno: ${nome}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Nome do Turno *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Turno da Manhã, Turno Especial"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none font-bold text-xs text-gray-900 dark:text-white transition-all shadow-inner uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                Hora de Início (Opcional)
              </label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none font-bold text-xs text-gray-900 dark:text-white transition-all shadow-inner"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
                Hora de Fim (Opcional)
              </label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none font-bold text-xs text-gray-900 dark:text-white transition-all shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Estado de Atividade</p>
              <p className="text-[10px] text-gray-400 font-medium">Se desativado, não poderá ser selecionado em novas requisições</p>
            </div>
            <button
              type="button"
              onClick={() => setAtivo(!ativo)}
              className="text-primary hover:text-primary-hover transition"
            >
              {ativo ? (
                <ToggleRight size={32} className="text-emerald-500" />
              ) : (
                <ToggleLeft size={32} className="text-gray-400" />
              )}
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors text-[10px] active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 text-[10px] active:scale-95 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? "A guardar..." : "Guardar Turno"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
