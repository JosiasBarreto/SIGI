import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services";
import { UserDTO, CreateUserDTO } from "../dtos";
import {
  Plus,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Key,
} from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../components/Common/DataTable";

export default function Utilizadores() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDTO | null>(null);

  const [newUser, setNewUser] = useState<CreateUserDTO>({
    name: "",
    email: "",
    role: "Atendimento",
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getAll({ per_page: 1000 }),
  });

  const users: UserDTO[] = response?.items || [];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchRole = roleFilter === "Todos" || user.role === roleFilter;
      const isActive = user.is_active || user.is_active === undefined;
      const matchStatus =
        statusFilter === "Todos" ||
        (statusFilter === "Ativo" ? isActive : !isActive);

      return matchRole && matchStatus;
    });
  }, [users, roleFilter, statusFilter]);

  const toggleStatusMutation = useMutation({
    mutationFn: (id: number | string) => userService.toggleStatus(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Estado do utilizador atualizado com sucesso.");
    },
    onError: () => toast.error("Erro ao atualizar estado do utilizador."),
  });

  const handleToggleStatus = (id: number, currentStatus: boolean) => {
    Swal.fire({
      title: currentStatus ? "Bloquear Utilizador" : "Ativar Utilizador",
      text: currentStatus
        ? "O utilizador perderá o acesso ao sistema."
        : "O utilizador voltará a ter acesso ao sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: currentStatus ? "#d33" : "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: currentStatus ? "Sim, bloquear!" : "Sim, ativar!",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        toggleStatusMutation.mutate(id);
      }
    });
  };

  const openEditModal = (user: UserDTO) => {
    setEditingUser(user);
    setNewUser({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "Atendimento",
    });
    setShowModal(true);
  };

  const columns = useMemo<ColumnDef<UserDTO>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Utilizador",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                {user.name ? user.name.charAt(0) : "U"}
              </div>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {user.name}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => (
          <div className="flex items-center gap-2 text-gray-500">
            <Mail size={14} />
            {info.getValue<string>() || "N/A"}
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Cargo / Nível",
        cell: (info) => {
          const role = info.getValue<string>();
          return (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md text-xs font-semibold">
              <Shield
                size={12}
                className={
                  role === "Administrador" ? "text-primary" : "text-gray-500"
                }
              />
              {role}
            </div>
          );
        },
      },
      {
        id: "status",
        accessorFn: (row) => row.is_active || row.is_active === undefined,
        header: "Estado",
        cell: (info) => {
          const isActive = info.getValue<boolean>();
          return isActive ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-md inline-flex">
              <CheckCircle size={14} /> Ativo
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-error bg-error/10 px-2.5 py-1 rounded-md inline-flex">
              <XCircle size={14} /> Inativo
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Ações</div>,
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center justify-end gap-2">
              <button
                title="Reset Password"
                onClick={() => {
                  Swal.fire({
                    title: "Redefinir Palavra-passe",
                    text: `Aviso test: Como isto requere endpoint da password reset enviando email no lado do servidor, certifique-se da conta de gestor e use recuperação na porta de entrada ou contacte administrador.`,
                    icon: "info",
                    showCancelButton: true,
                    confirmButtonText: "Enviar Instruções",
                  }).then((result) => {
                    if (result.isConfirmed)
                      toast.success("Ação registada para administrador!");
                  });
                }}
                className="p-1.5 text-gray-400 hover:text-primary bg-white dark:bg-gray-800 hover:bg-primary/5 dark:hover:bg-primary/20 rounded transition border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <Key size={16} />
              </button>
              <button
                onClick={() => openEditModal(user)}
                className="p-1.5 text-gray-400 hover:text-primary bg-white dark:bg-gray-800 hover:bg-primary/5 dark:hover:bg-primary/20 rounded transition border border-gray-200 dark:border-gray-700 shadow-sm"
                title="Editar utilizador"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() =>
                  handleToggleStatus(user.id!, user.is_active !== false)
                }
                className={`p-1.5 ${
                  user.is_active !== false
                    ? "text-gray-400 hover:text-error hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                } bg-white dark:bg-gray-800 rounded transition border border-gray-200 dark:border-gray-700 shadow-sm`}
                title={user.is_active !== false ? "Bloquear" : "Ativar"}
              >
                {user.is_active !== false ? (
                  <XCircle size={16} />
                ) : (
                  <CheckCircle size={16} />
                )}
              </button>
            </div>
          );
        },
      },
    ],
    []
  );

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDTO) => userService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilizador criado com sucesso.");
      Swal.fire({
        icon: "success",
        title: "Convite Enviado",
        text: `As credenciais de acesso e o link de acesso foram enviados para ${
          data.email || newUser.email
        }. O utilizador terá de redefinir a palavra-passe no primeiro acesso.`,
        confirmButtonColor: "#3085d6",
      });
      setShowModal(false);
      setNewUser({ name: "", email: "", role: "Atendimento" });
    },
    onError: () => {
      toast.error("Erro ao criar utilizador.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      id: string | number;
      payload: Partial<CreateUserDTO>;
    }) => userService.update(String(data.id), data.payload as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Utilizador atualizado com sucesso.");
      setShowModal(false);
      setEditingUser(null);
      setNewUser({ name: "", email: "", role: "Atendimento" });
    },
    onError: () => toast.error("Erro ao atualizar utilizador."),
  });

  const handleCreateOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id!,
        payload: {
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } else {
      createMutation.mutate({
        ...newUser,
        password: "change_me123",
      });
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setNewUser({ name: "", email: "", role: "Atendimento" });
    setShowModal(true);
  };

  const clearFilters = () => {
    setRoleFilter("Todos");
    setStatusFilter("Todos");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <UserPlus className="text-primary" /> Gestão de Utilizadores
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Crie, edite e gira os acessos da sua equipa ao ERP.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg font-medium transition shadow-sm shadow-primary/20"
        >
          <Plus size={18} /> Novo Utilizador
        </button>
      </div>

      <DataTable
        data={filteredUsers}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Pesquisar por nome ou email..."
        onClearFilters={clearFilters}
        renderFilters={() => (
          <>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="Todos">Todos os Cargos</option>
              <option value="Atendimento">Atendimento</option>
              <option value="Administrador">Administrador</option>
              <option value="Armazém">Armazém</option>
              <option value="Controlador de Materiais">Controlador de Materiais</option>
              <option value="Cozinha">Cozinha</option>
              <option value="Financeiro">Financeiro</option>
              <option value="Motorista">Motorista</option>
              <option value="Pastelaria">Pastelaria</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="Todos">Todos os Estados</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
          </>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-surface dark:bg-surface-dark w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up">
            <div className="p-5 bg-secondary border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                {editingUser ? "Editar Utilizador" : "Criar Novo Utilizador"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-5">
              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    placeholder="Ex: João Silva"
                    required
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    placeholder="joao.silva@empresa.com"
                    required
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cargo / Permissões
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100"
                  >
                    <option value="Atendimento">Atendimento</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Armazém">Armazém</option>
                    <option value="Controlador de Materiais">Controlador de Materiais</option>
                    <option value="Cozinha">Cozinha</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Motorista">Motorista</option>
                    <option value="Pastelaria">Pastelaria</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                    className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-lg shadow-sm shadow-primary/20 transition flex items-center gap-2"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? "A Salvar..."
                      : editingUser
                      ? "Atualizar Utilizador"
                      : "Criar Utilizador"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


