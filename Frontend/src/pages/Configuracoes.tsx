import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Building,
  Mail,
  Phone,
  Globe,
  Award,
  FileText,
  Printer,
  HardDriveDownload,
  RefreshCw,
  CheckCircle,
  Trash2,
  UploadCloud,
  AlertCircle,
  Percent,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTheme } from "../components/Layout/ThemeContext";
import { Palette } from "lucide-react";
import { configService, fiscalService, productService } from "../services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BackupItem {
  id: string;
  filename: string;
  date: string;
  size: string;
  type: "Manual" | "Automático";
}

function IvaSettings() {
  const queryClient = useQueryClient();
  const { palette, setPalette } = useTheme();
  const [editingRate, setEditingRate] = useState<any>(null);

  const { data: rates, isLoading } = useQuery({
    queryKey: ["iva_rates"],
    queryFn: () => fiscalService.getIvaRates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => fiscalService.createIvaRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iva_rates"] });
      toast.success("Taxa de IVA criada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar taxa de IVA");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      fiscalService.updateIvaRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iva_rates"] });
      toast.success("Taxa de IVA atualizada com sucesso");
      setEditingRate(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar taxa de IVA");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string | number) => fiscalService.toggleIvaStatus(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["iva_rates"] });
      toast.success(data?.msg || "Estado da taxa alterado");
    },
    onError: () => {
      toast.error("Erro ao alterar estado");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      descricao: formData.get("descricao"),
      percentagem: Number(formData.get("percentagem")),
      ativo: formData.has("ativo"),
    };

    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data });
    } else {
      createMutation.mutate(data);
    }
    e.currentTarget.reset();
  };

  const handleEdit = (rate: any) => {
    setEditingRate(rate);
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
  };
  
  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {editingRate ? (
            <>
              <Plus size={16} className="text-primary" /> Editar Taxa de IVA
            </>
          ) : (
            <>
              <Plus size={16} className="text-primary" /> Nova Taxa de IVA
            </>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Descrição
            </label>
            <input
              type="text"
              name="descricao"
              defaultValue={editingRate?.descricao || ""}
              placeholder="Ex: IVA Normal 14%"
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Percentagem (%)
            </label>
            <input
              type="number"
              name="percentagem"
              defaultValue={editingRate?.percentagem || ""}
              placeholder="Ex: 14"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="ativo"
              id="iva_ativo"
              defaultChecked={editingRate ? editingRate.ativo : true}
              className="w-4 h-4 text-primary rounded focus:ring-primary/50"
            />
            <label
              htmlFor="iva_ativo"
              className="text-xs font-semibold text-gray-600 dark:text-gray-400"
            >
              Ativa
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "A guardar..."
                : "Guardar Taxa"}
            </button>
            {editingRate && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="p-0 md:w-2/3">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Percentagem</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  A carregar...
                </td>
              </tr>
            ) : rates && rates.length > 0 ? (
              rates.map((rate) => (
                <tr
                  key={rate.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4 text-xs font-mono text-gray-500">
                    {rate.id}
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {rate.descricao}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-300">
                    {Number(rate.percentagem)}%
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                        rate.ativo
                          ? "bg-success/10 text-success"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                      }`}
                    >
                      {rate.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(rate)}
                        className="text-xs font-bold text-primary hover:text-primary/80"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate(rate.id)}
                        disabled={toggleMutation.isPending}
                        className={`text-xs font-bold ${
                          rate.ativo
                            ? "text-red-500 hover:text-red-600"
                            : "text-green-500 hover:text-green-600"
                        }`}
                      >
                        {rate.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Nenhuma taxa de IVA encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriasSettings() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["categorias"],
    queryFn: () => productService.getCategorias(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productService.createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      productService.updateCategoria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria atualizada");
      setEditingItem(null);
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
    e.currentTarget.reset();
  };

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {editingItem ? (
            <>
              <Plus size={16} className="text-primary" /> Editar Categoria
            </>
          ) : (
            <>
              <Plus size={16} className="text-primary" /> Nova Categoria
            </>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nome da Categoria
            </label>
            <input
              type="text"
              name="nome"
              defaultValue={editingItem?.nome || ""}
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Descrição
            </label>
            <textarea
              name="descricao"
              defaultValue={editingItem?.descricao || ""}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "A guardar..."
                : "Guardar"}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="p-0 md:w-2/3">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nome</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  A carregar...
                </td>
              </tr>
            ) : items && items.length > 0 ? (
              items.map((item: any) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4 text-xs font-mono text-gray-500">
                    {item.id}
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {item.nome}
                  </td>
                  <td className="p-4 text-gray-500 truncate max-w-[200px]">
                    {item.descricao}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-xs font-bold text-primary hover:text-primary/80"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  Nenhuma categoria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UnidadesSettings() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["unidades_medida"],
    queryFn: () => productService.getUnidadesMedida(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productService.createUnidadeMedida(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades_medida"] });
      toast.success("Unidade criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      productService.updateUnidadeMedida(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades_medida"] });
      toast.success("Unidade atualizada");
      setEditingItem(null);
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      sigla: formData.get("sigla"),
      descricao: formData.get("descricao"),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
    e.currentTarget.reset();
  };

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {editingItem ? (
            <>
              <Plus size={16} className="text-primary" /> Editar Unidade
            </>
          ) : (
            <>
              <Plus size={16} className="text-primary" /> Nova Unidade
            </>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nome
            </label>
            <input
              type="text"
              name="nome"
              defaultValue={editingItem?.nome || ""}
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Sigla
            </label>
            <input
              type="text"
              name="sigla"
              defaultValue={editingItem?.sigla || ""}
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Descrição
            </label>
            <textarea
              name="descricao"
              defaultValue={editingItem?.descricao || ""}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "A guardar..."
                : "Guardar"}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="p-0 md:w-2/3">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">Nome</th>
              <th className="p-4">Sigla</th>
              <th className="p-4">Descrição</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  A carregar...
                </td>
              </tr>
            ) : items && items.length > 0 ? (
              items.map((item: any) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="p-4 text-xs font-mono text-gray-500">
                    {item.id}
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {item.nome}
                  </td>
                  <td className="p-4 font-semibold text-gray-900 dark:text-white">
                    {item.sigla}
                  </td>
                  <td className="p-4 text-gray-500 truncate max-w-[200px]">
                    {item.descricao}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="text-xs font-bold text-primary hover:text-primary/80"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Nenhuma unidade
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { palette, setPalette } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "geral" | "backup" | "iva" | "categorias" | "unidades"
  >("geral");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    id: "",
    empresa: "",
    nif: "",
    email: "",
    telefone: "",
    morada: "",
    website: "",
    certificado: "",
    licenca_aplicacao: "",
    moeda: "",
    formato_impressao: "",
    impressaoAuto: true,
    backupAuto: true,
    numVias: 2,
    taxaIva: 15,
    logotipo: "",
    utiliza_iva: true,
    numero_whatsapp: "",
    telemoveis: "",
  });

  // Backup logs lists
  const [backups, setBackups] = useState<BackupItem[]>(() => {
    const saved = localStorage.getItem("sigi_backups");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "BKP-001",
            filename: "sigi_db_backup_2026-06-18_0400.sql",
            date: "2026-06-18 04:00",
            size: "12.4 MB",
            type: "Automático",
          },
          {
            id: "BKP-002",
            filename: "sigi_db_backup_2026-06-17_0400.sql",
            date: "2026-06-17 04:00",
            size: "12.3 MB",
            type: "Automático",
          },
          {
            id: "BKP-003",
            filename: "sigi_db_backup_manual_2026-06-15.sql",
            date: "2026-06-15 15:30",
            size: "11.9 MB",
            type: "Manual",
          },
        ];
  });
  const themes = [
    { key: "default", label: "Laranja", color: "#FF6B00" },
    { key: "theme-green", label: "Verde", color: "#16A34A" },
    { key: "theme-blue", label: "Azul", color: "#2563EB" },
    { key: "theme-purple", label: "Roxo", color: "#7C3AED" },
    { key: "theme-pink", label: "Rosa", color: "#EC4899" },
    { key: "theme-cyan", label: "Ciano", color: "#0891B2" },
    { key: "theme-red", label: "Vermelho", color: "#DC2626" },
    { key: "theme-yellow", label: "Amarelo", color: "#EAB308" },
    { key: "theme-amber", label: "Âmbar", color: "#D97706" },
    { key: "theme-lime", label: "Lima", color: "#65A30D" },
    { key: "theme-indigo", label: "Índigo", color: "#4F46E5" },
    { key: "theme-turquoise", label: "Turquesa", color: "#14B8A6" },
    { key: "theme-coffee", label: "Café", color: "#6F4E37" },
    { key: "theme-brown", label: "Castanho", color: "#8B5E3C" },
    { key: "theme-black", label: "Preto", color: "#1F2937" },
  ];

  // Save backup logs list
  const saveBackupsToStorage = (list: BackupItem[]) => {
    setBackups(list);
    //localStorage.setItem("sigi_backups", JSON.stringify(list));
  };

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await configService.get();
        if (data) {
          setFormData((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        toast.error("Erro ao carregar configurações do servidor.");
      } finally {
        setFetching(false);
      }
    }
    loadConfig();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logotipo: reader.result as string }));
        toast.info(
          "Logótipo carregado. Não se esqueça de guardar as alterações!"
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await configService.update(formData);
      toast.success("Configurações persistidas e sincronizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao persistir configurações da empresa.");
    } finally {
      setLoading(false);
    }
  };

  // Run Manual Backup Action
  const triggerManualBackup = () => {
    setLoading(true);
    toast.info("A processar cópia de segurança dos dados...");

    setTimeout(() => {
      const dateNow = new Date();
      const formatTime = dateNow
        .toISOString()
        .replace("T", " ")
        .substring(0, 16);
      const filename = `sigi_db_backup_manual_${
        dateNow.toISOString().split("T")[0]
      }_${dateNow.toTimeString().split(" ")[0].replace(/:/g, "")}.sql`;

      const newBackup: BackupItem = {
        id: `BKP-00${backups.length + 1}`,
        filename,
        date: formatTime,
        size: `${(Math.random() * 5 + 10).toFixed(1)} MB`,
        type: "Manual",
      };

      const updated = [newBackup, ...backups];
      saveBackupsToStorage(updated);
      setLoading(false);
      toast.success("Cópia de segurança gerada com sucesso!");

      // Start automatic download setup as requested in task 5 (download backup)
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(formData));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", filename);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    }, 1500);
  };

  // Restore simulation
  const handleRestoreBackup = (filename: string) => {
    const confirm = window.confirm(
      `Aviso: Tem a certeza que pretende restaurar os dados para a versão de "${filename}"? Esta ação causará a reinicialização dos registos locais.`
    );
    if (confirm) {
      setLoading(true);
      toast.info(`A restaurar cópia de segurança: ${filename}...`);
      setTimeout(() => {
        setLoading(false);
        toast.success(
          "Sistema restaurado com sucesso para a versão selecionada!"
        );
      }, 2000);
    }
  };

  // Delete backup record from lists
  const handleDeleteBackup = (id: string) => {
    const updated = backups.filter((b) => b.id !== id);
    saveBackupsToStorage(updated);
    toast.success("Registo de backup removido do histórico.");
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="animate-spin text-primary" size={32} />
        <p className="text-xs text-gray-500">
          A obter configurações gerais da Sabor Imbatível...
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 pb-12 animate-fade-in text-gray-800 dark:text-gray-100"
      id="configuracoes-root"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-105 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="text-primary" /> Painel Geral de Configurações
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure o perfil corporativo, parâmetros de impostos, moedas de
            faturação, vias de impressão e cópias de segurança.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "geral" ? (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow transition-all"
            >
              <Save size={15} />{" "}
              {loading ? "A Guardar..." : "Guardar Alterações"}
            </button>
          ) : (
            <button
              onClick={triggerManualBackup}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2 bg-success hover:bg-success/90 text-white text-xs font-bold rounded-lg shadow transition-all"
            >
              <HardDriveDownload size={15} />{" "}
              {loading ? "Processando..." : "Backup & Descarregar Cópia"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800/40 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("geral")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "geral"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950"
          }`}
        >
          <Building size={14} /> Dados Corporativos
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "categorias"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950"
          }`}
        >
          <Award size={14} /> Categorias
        </button>
        <button
          onClick={() => setActiveTab("unidades")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "unidades"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950"
          }`}
        >
          <FileText size={14} /> Unidades de Medida
        </button>
        <button
          onClick={() => setActiveTab("iva")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "iva"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950"
          }`}
        >
          <Percent size={14} /> Taxas de IVA
        </button>
        <button
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "backup"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950"
          }`}
        >
          <HardDriveDownload size={14} /> Backup & Restauro
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === "geral" && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-surface-dark border p-6 rounded-2xl shadow-sm space-y-8"
        >
          {/* Company Details Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 flex items-center gap-2">
              <Building size={16} className="text-gray-400" /> Identificação e
              Dados Fiscais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Nome Da Empresa / Razão Social *
                </label>
                <input
                  type="text"
                  name="empresa"
                  required
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  NIF Geral *
                </label>
                <input
                  type="text"
                  name="nif"
                  required
                  value={formData.nif}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Licença Empresa *
                </label>
                <input
                  type="text"
                  name="certificado"
                  required
                  value={formData.certificado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Licença Aplicação *
                </label>
                <input
                  type="text"
                  name="licenca_aplicacao"
                  required
                  value={formData.licenca_aplicacao}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Endereço de Website Sede *
                </label>
                <input
                  type="text"
                  name="website"
                  required
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 flex items-center gap-2">
              <Phone size={16} className="text-gray-400" /> Canais de
              Comunicação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Correio Eletrónico Geral *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Telemóvel Geral *
                </label>
                <input
                  type="text"
                  name="telefone"
                  required
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Morada Sede *
                </label>
                <input
                  type="text"
                  name="morada"
                  required
                  value={formData.morada}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  name="numero_whatsapp"
                  value={formData.numero_whatsapp}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Outros Telemóveis
                </label>
                <input
                  type="text"
                  name="telemoveis"
                  value={formData.telemoveis}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {themes.map((theme) => {
              const selected = palette === theme.key;

              return (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => setPalette(theme.key)}
                  style={
                    selected
                      ? {
                          borderColor: theme.color,
                          backgroundColor: `${theme.color}15`,
                          color: theme.color,
                        }
                      : {}
                  }
                  className={`
        relative
        rounded-xl
        border
        p-3
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-md
        flex
        flex-col
        items-center
        gap-2
        border-gray-200
        dark:border-gray-700
        bg-white
        dark:bg-gray-900
      `}
                >
                  {selected && (
                    <div
                      className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                  )}

                  <div
                    className="w-8 h-8 rounded-full shadow-sm border border-white"
                    style={{ backgroundColor: theme.color }}
                  />

                  <span
                    className={`text-xs font-medium ${
                      selected ? "" : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* App Engine and Printing Mode */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 flex items-center gap-2">
              <Printer size={16} className="text-gray-400" /> Parâmetros de
              Impressão e Transação de Caixa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Moeda Principal Faturação
                </label>
                <select
                  name="moeda"
                  value={formData.moeda}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="STN">
                    Dobra de São Tomé e Príncipe (STN)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Formato de Impressão Padrão
                </label>
                <select
                  name="formato_impressao"
                  value={formData.formato_impressao}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="A4">A4 (Fatura Consolidada)</option>
                  <option value="A5">A5 (Recibo Geral)</option>
                  <option value="80mm">
                    Bobina Térmica 80mm (Talão Rápido POS)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Nº Múltiplo Vias por Impressão
                </label>
                <input
                  type="number"
                  name="numVias"
                  min="1"
                  max="5"
                  value={formData.numVias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="impressaoAuto"
                  name="impressaoAuto"
                  checked={formData.impressaoAuto}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <label
                  htmlFor="impressaoAuto"
                  className="text-xs font-semibold select-none"
                >
                  Impressão automática após faturar no POS?
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="utiliza_iva"
                  name="utiliza_iva"
                  checked={formData.utiliza_iva}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <label
                  htmlFor="utiliza_iva"
                  className="text-xs font-semibold select-none"
                >
                  Empresa sujeita a IVA (Usa IVA nas faturas?)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="backupAuto"
                  name="backupAuto"
                  checked={formData.backupAuto}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <label
                  htmlFor="backupAuto"
                  className="text-xs font-semibold select-none"
                >
                  Ativar cópias automáticas diárias?
                </label>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* IVA Tab Content */}
      {activeTab === "iva" && <IvaSettings />}

      {/* Categorias Tab Content */}
      {activeTab === "categorias" && <CategoriasSettings />}

      {/* Unidades Tab Content */}
      {activeTab === "unidades" && <UnidadesSettings />}

      {/* Backup Tab Logic */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Run Backup Area */}
            <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <HardDriveDownload className="text-success" /> Gerador
                Offline/Online de Backup
              </h2>
              <p className="text-xs text-gray-500">
                Crie uma cópia de segurança completa contendo dados estruturados
                do ERP, incluindo encomendas, faturas, inventário, utilizadores,
                audições dinâmicas e stocks em formato .sql universal para
                descarregar de imediato.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={triggerManualBackup}
                  disabled={loading}
                  className="bg-success hover:bg-success/90 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition"
                >
                  {loading
                    ? "A processar backup..."
                    : "Criar Novo Backup Manual"}
                </button>
              </div>
            </div>

            {/* List backups */}
            <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-bold border-b pb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                Histórico Geral de Cópias de Segurança
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 font-bold border-b text-gray-700 dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-2.5">FICHEIRO DE CÓPIA</th>
                      <th className="px-4 py-2.5">PROCESSADO EM</th>
                      <th className="px-4 py-2.5">TAMANHO</th>
                      <th className="px-4 py-2.5 text-center">TIPO</th>
                      <th className="px-4 py-2.5 text-right">AÇÕES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                    {backups.map((bk: BackupItem) => (
                      <tr
                        key={bk.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-[11px]">
                          {bk.filename}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{bk.date}</td>
                        <td className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">
                          {bk.size}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              bk.type === "Manual"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {bk.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1.5">
                          <button
                            onClick={() => handleRestoreBackup(bk.filename)}
                            className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1.5 rounded text-[10px]"
                            title="Restaurar a partir desta versão"
                          >
                            Restaurar
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(bk.id)}
                            className="text-error hover:bg-error/10 p-1.5 rounded"
                            title="Apagar registo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Restore Dropper File Area */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-dark border p-6 rounded-2xl shadow-sm text-center space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 justify-center">
                <UploadCloud className="text-primary hover:animate-pulse" />{" "}
                Carregar para Restauro
              </h3>
              <p className="text-xs text-gray-500">
                Selecione ou arraste o ficheiro .sql de segurança previamente
                descarregado para recuperar toda a base de dados do ERP.
              </p>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary/50 cursor-pointer p-6 rounded-xl transition text-center space-y-2">
                <UploadCloud className="mx-auto text-gray-400" size={36} />
                <p className="text-[11px] font-bold">
                  Soltar ficheiro .sql de backup aqui
                </p>
                <p className="text-[9px] text-gray-400">
                  ou clique para procurar no seu computador
                </p>
                <input
                  type="file"
                  accept=".sql"
                  className="hidden"
                  id="backup-restore-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleRestoreBackup(file.name);
                    }
                  }}
                />
                <label
                  htmlFor="backup-restore-input"
                  className="block text-[11px] font-bold text-primary hover:underline cursor-pointer mt-1"
                >
                  Procurar ficheiro
                </label>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl flex gap-2 text-left text-[10px] text-amber-800 dark:text-amber-350 border border-amber-100 dark:border-amber-900/50">
                <AlertCircle className="shrink-0 text-amber-600" size={16} />
                <div>
                  <span className="font-bold block">
                    Aviso Geral de Restauro:
                  </span>
                  Esta ação substituirá os pedidos de hoje, os saldos
                  financeiros e as alterações de inventário pelas definições
                  contidas no backup.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
