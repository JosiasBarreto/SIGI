import React, { useState } from "react";
import { 
  Box, 
  MapPin, 
  Edit2, 
  Trash2, 
  Power, 
  AlertTriangle,
  CheckCircle,
  Package
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "../../lib/utils";
import { DataTable } from "../../components/Common/DataTable";
import { useAuth } from "../../components/AuthContext";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Modal from "../../components/Common/Modal";
import { productService, materialService } from "../../services";

interface Armazem {
  id: string | number;
  nome: string;
  codigo: string;
  localizacao?: string;
  descricao?: string;
  principal?: boolean;
  is_active?: boolean;
}

interface TabsArmazemProps {
  armazens: Armazem[];
  warehouseService: any;
}

const TabsArmazem: React.FC<TabsArmazemProps> = ({ armazens, warehouseService }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = ["Administrador", "Armazém"].includes(user?.role || "");

  const [activeTab, setActiveTab] = useState<string | number | undefined>(
    armazens[0]?.id
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    nome: "",
    codigo: "",
    localizacao: "",
    descricao: "",
    principal: false
  });

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subTipo, setSubTipo] = useState<string>("all");
  const [servicoFilter, setServicoFilter] = useState<string>("all");
  const [activeItemType, setActiveItemType] = useState<"Todos" | "Produto" | "Material" | "Consumivel">("Todos");

  // Query para buscar stock do armazém ativo do backend endpoint
  const { data: stockData, isLoading: isLoadingStock } = useQuery({
    queryKey: ["armazem-stock", activeTab],
    queryFn: () => warehouseService.getStock(activeTab!),
    enabled: !!activeTab,
  });

  // Query de apoio para todos os produtos (Acabados, Revenda, Consumíveis)
  const { data: allProductsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["all-products-inventory"],
    queryFn: () => productService.getAll({ per_page: 1000 }),
  });

  // Query de apoio para todos os materiais
  const { data: allMaterialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ["all-materials-inventory"],
    queryFn: () => materialService.getAll({ per_page: 1000 }),
  });

  // Mutações de Armazém
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      warehouseService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
      setIsEditModalOpen(false);
      toast.success("Armazém atualizado com sucesso!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.msg || err?.message || "Erro ao atualizar armazém.";
      toast.error(msg);
    }
  });

  const ativarMutation = useMutation({
    mutationFn: (id: string | number) => warehouseService.ativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
      toast.success("Armazém ativado com sucesso!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.msg || err?.message || "Erro ao ativar armazém.";
      toast.error(msg);
    }
  });

  const desativarMutation = useMutation({
    mutationFn: (id: string | number) => warehouseService.desativar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
      toast.success("Armazém desativado com sucesso!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.msg || err?.message || "Erro ao desativar armazém.";
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => warehouseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
      // Mudar tab ativa se houver outro armazém
      const rest = armazens.filter(a => a.id !== activeTab);
      if (rest.length > 0) {
        setActiveTab(rest[0].id);
      } else {
        setActiveTab(undefined);
      }
      toast.success("Armazém removido com sucesso!");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.msg || err?.message || "Erro ao remover armazém.";
      toast.error(msg);
    }
  });

  const handleEditClick = (armazem: Armazem) => {
    setEditForm({
      nome: armazem.nome || "",
      codigo: armazem.codigo || "",
      localizacao: armazem.localizacao || "",
      descricao: armazem.descricao || "",
      principal: !!armazem.principal
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTab) return;
    updateMutation.mutate({
      id: activeTab,
      data: editForm
    });
  };

  const handleToggleActive = (armazem: Armazem) => {
    if (armazem.is_active !== false) {
      desativarMutation.mutate(armazem.id);
    } else {
      ativarMutation.mutate(armazem.id);
    }
  };

  const handleDelete = (armazem: Armazem) => {
    Swal.fire({
      title: "Tem a certeza?",
      text: `Deseja realmente eliminar o armazém "${armazem.nome}"? Esta ação não pode ser revertida.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, eliminar!",
      cancelButtonText: "Cancelar"
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(armazem.id);
      }
    });
  };

  // Normalizar dados: unificar stockData do endpoint com lista global de produtos e materiais
  const normalizeStock = () => {
    const currentArmazem = armazens.find(a => a.id === activeTab);
    const rawStock = stockData?.data || stockData || {};
    const productsList = allProductsData?.items || (Array.isArray(allProductsData) ? allProductsData : []);
    const materialsList = allMaterialsData?.items || (Array.isArray(allMaterialsData) ? allMaterialsData : []);

    let stockProdutos: any[] = [];
    let stockMateriais: any[] = [];
    let genericStockItems: any[] = [];

    if (Array.isArray(rawStock)) {
      genericStockItems = rawStock;
    } else if (rawStock.items && Array.isArray(rawStock.items)) {
      genericStockItems = rawStock.items;
    } else {
      if (Array.isArray(rawStock.produtos)) stockProdutos = rawStock.produtos;
      if (Array.isArray(rawStock.materiais)) stockMateriais = rawStock.materiais;
      if (Array.isArray(rawStock.ingredientes)) stockMateriais = [...stockMateriais, ...rawStock.ingredientes];
      if (Array.isArray(rawStock.itens)) genericStockItems = rawStock.itens;
    }

    const combinedProductsMap = new Map<string, any>();

    stockProdutos.forEach((p: any) => {
      const key = String(p.id || p.codigo || p.produto_codigo || p.nome);
      combinedProductsMap.set(key, p);
    });

    genericStockItems.forEach((item: any) => {
      if (item.tipo !== "Material" && !item.material_codigo) {
        const key = String(item.id || item.codigo || item.produto_codigo || item.nome);
        if (!combinedProductsMap.has(key)) {
          combinedProductsMap.set(key, item);
        }
      }
    });

    productsList.forEach((p: any) => {
      const matchArmazem = !p.armazem_id || String(p.armazem_id) === String(activeTab) || currentArmazem?.principal;
      if (matchArmazem) {
        const key = String(p.id || p.codigo || p.nome);
        if (!combinedProductsMap.has(key)) {
          combinedProductsMap.set(key, p);
        }
      }
    });

    const normalizedProdutos = Array.from(combinedProductsMap.values()).map((p: any) => {
      const tipo = p.tipo || "Acabado";
      let servico = p.servico;
      if (!servico) {
        if (tipo === "Revenda") {
          servico = "BAR";
        } else if (tipo === "Consumivel") {
          servico = "ABASTECIMENTO";
        } else {
          const cat = String(p.categoria || p.categoria_nome || "").toLowerCase();
          const nome = String(p.nome || p.produto_nome || "").toLowerCase();
          if (cat.includes("pastelaria") || nome.includes("pastelaria") || nome.includes("bolo") || nome.includes("pão") || nome.includes("croissant") || nome.includes("doce")) {
            servico = "PASTELARIA";
          } else {
            servico = "COZINHA";
          }
        }
      }

      return {
        id: p.id,
        tipo: tipo === "Consumivel" ? "Consumível" : "Produto",
        sub_tipo: tipo,
        servico: servico,
        codigo: p.produto_codigo || p.codigo || "-",
        nome: p.produto_nome || p.nome || "-",
        stock_atual: Number(p.stock_atual ?? p.quantidade_atual ?? p.quantidade_disponivel ?? p.quantidade ?? 0),
        stock_minimo: Number(p.stock_minimo ?? 0),
        unidade_medida_sigla: p.unidade_medida || p.unidade_medida_sigla || "un",
        preco_compra: p.preco_compra ?? null,
        preco_venda: p.preco_venda ?? null,
        preco_com_iva: p.preco_com_iva ?? null,
        categoria: p.categoria || p.categoria_nome || "Geral",
        estado: p.estado || (p.ativo === false ? "Inativo" : "Ativo"),
      };
    });

    const combinedMaterialsMap = new Map<string, any>();

    stockMateriais.forEach((m: any) => {
      const key = String(m.id || m.codigo || m.material_codigo || m.nome);
      combinedMaterialsMap.set(key, m);
    });

    genericStockItems.forEach((item: any) => {
      if (item.tipo === "Material" || item.material_codigo) {
        const key = String(item.id || item.codigo || item.material_codigo || item.nome);
        if (!combinedMaterialsMap.has(key)) {
          combinedMaterialsMap.set(key, item);
        }
      }
    });

    materialsList.forEach((m: any) => {
      const matchArmazem = !m.armazem_id || String(m.armazem_id) === String(activeTab) || currentArmazem?.principal;
      if (matchArmazem) {
        const key = String(m.id || m.codigo || m.nome);
        if (!combinedMaterialsMap.has(key)) {
          combinedMaterialsMap.set(key, m);
        }
      }
    });

    const normalizedMateriais = Array.from(combinedMaterialsMap.values()).map((m: any) => ({
      id: m.id,
      tipo: "Material",
      sub_tipo: m.tipo || "Reutilizavel",
      servico: "ABASTECIMENTO",
      codigo: m.material_codigo || m.codigo || "-",
      nome: m.material_nome || m.nome || "-",
      stock_atual: Number(m.stock_atual ?? m.quantidade_disponivel ?? m.quantidade_total ?? m.quantidade ?? 0),
      stock_minimo: Number(m.stock_minimo ?? 0),
      unidade_medida_sigla: m.unidade_medida || m.unidade_medida_sigla || "un",
      preco_compra: m.preco_compra ?? null,
      preco_venda: m.preco_venda ?? 0.0,
      preco_com_iva: m.preco_com_iva ?? 0.0,
      categoria: m.categoria || m.categoria_nome || "Geral",
      estado: m.estado || "Disponivel",
    }));

    return [...normalizedProdutos, ...normalizedMateriais];
  };

  const allItems = normalizeStock();
  const items = allItems.filter((i: any) => {
    let matchType = true;
    if (activeItemType === "Produto") {
      matchType = i.tipo === "Produto" && i.sub_tipo !== "Consumivel";
    } else if (activeItemType === "Material") {
      matchType = i.tipo === "Material";
    } else if (activeItemType === "Consumivel") {
      matchType = i.sub_tipo === "Consumivel" || i.tipo === "Consumível";
    }

    const matchServico = servicoFilter === "all" || i.servico === servicoFilter;
    const matchSubTipo = subTipo === "all" || i.sub_tipo === subTipo;
    const matchCategoria = !categoria || String(i.categoria || "").toLowerCase().includes(categoria.toLowerCase());
    const matchBusca = !busca || String(i.nome || "").toLowerCase().includes(busca.toLowerCase()) || String(i.codigo || "").toLowerCase().includes(busca.toLowerCase());

    return matchType && matchServico && matchSubTipo && matchCategoria && matchBusca;
  });

  // Colunas no formato esperado pelo DataTable
  const tableColumns = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }: any) => {
        const val = row.original.tipo;
        const sub = row.original.sub_tipo;
        let color = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
        if (val === "Ingrediente") {
          color = "bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-green-100 dark:border-green-900/30";
        } else if (val === "Material") {
          color = "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
        }
        return (
          <div className="flex flex-col gap-1 items-start">
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${color}`}>
              {val}
            </span>
            {sub && sub !== val && (
              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {sub}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }: any) => <span className="font-mono text-xs">{row.original.codigo}</span>,
    },
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }: any) => <span className="font-bold text-gray-900 dark:text-gray-100">{row.original.nome}</span>,
    },
    {
      accessorKey: "categoria",
      header: "Categoria",
      cell: ({ row }: any) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded-md border border-gray-100 dark:border-gray-800">
          {row.original.categoria}
        </span>
      ),
    },
    {
      accessorKey: "servico",
      header: "Serviço (Setor)",
      cell: ({ row }: any) => {
        const serv = row.original.servico;
        if (!serv) return <span className="text-gray-400 text-xs">-</span>;
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
            {serv}
          </span>
        );
      },
    },
    {
      accessorKey: "stock_atual",
      header: "Quantidade",
      cell: ({ row }: any) => {
        const item = row.original;
        const isLow = item.stock_atual <= item.stock_minimo;
        return (
          <div className="flex flex-col">
            <span className={`font-mono font-bold text-xs ${isLow ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {item.stock_atual} {item.unidade_medida_sigla}
            </span>
            {isLow && (
              <span className="text-[9px] text-red-500 font-bold uppercase tracking-wider flex items-center gap-0.5 mt-0.5">
                <AlertTriangle size={10} /> Baixo (Mín: {item.stock_minimo})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "preco_compra",
      header: "Preço de Compra",
      cell: ({ row }: any) =>
        row.original.preco_compra !== null && Number(row.original.preco_compra) > 0
          ? formatCurrency(Number(row.original.preco_compra))
          : "-",
    },
    {
      accessorKey: "preco_venda",
      header: "Preço Bruto",
      cell: ({ row }: any) =>
        row.original.tipo === "Produto" && row.original.preco_venda !== null && Number(row.original.preco_venda) > 0
          ? formatCurrency(Number(row.original.preco_venda))
          : "-",
    },
    {
      accessorKey: "preco_com_iva",
      header: "PVP (Com IVA)",
      cell: ({ row }: any) =>
        row.original.tipo === "Produto" && row.original.preco_com_iva !== null && Number(row.original.preco_com_iva) > 0
          ? formatCurrency(Number(row.original.preco_com_iva))
          : "-",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }: any) => {
        const val = row.original.estado;
        if (!val) return "-";
        let color = "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        
        if (["Ativo", "Disponivel", "Disponível"].includes(val)) {
          color = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/20";
        } else if (["Inativo", "Danificado", "Perda"].includes(val)) {
          color = "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-900/20";
        } else if (["Manutencao", "Manutenção"].includes(val)) {
          color = "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/25 dark:text-amber-400 dark:border-amber-900/20";
        } else if (["Reservado"].includes(val)) {
          color = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/20";
        } else if (["Em Uso"].includes(val)) {
          color = "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/25 dark:text-purple-400 dark:border-purple-900/20";
        }
        
        return (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${color}`}>
            {val}
          </span>
        );
      }
    }
  ];

  const currentArmazem = armazens.find(a => a.id === activeTab);

  return (
    <div className="w-full">
      {/* Cabeçalho das Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {armazens.map((armazem) => {
          const isInactive = armazem.is_active === false;
          return (
            <button
              key={armazem.id}
              onClick={() => setActiveTab(armazem.id)}
              className={`flex items-center gap-3 px-4 py-3 text-left transition-colors relative min-w-[220px] shrink-0
                ${isInactive ? "opacity-60" : ""}
                ${
                  activeTab === armazem.id
                    ? "border-b-2 border-primary text-primary bg-gray-50/50 dark:bg-gray-850/50 font-bold"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50/30 dark:hover:bg-gray-800/20"
                }`}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Box size={20} />
              </div>
              <div className="flex flex-col max-w-[130px]">
                <span className="text-xs font-black uppercase truncate">
                  {armazem.nome}
                </span>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">
                  Código: {armazem.codigo}
                </span>
                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                  <MapPin size={10} />
                  <span className="truncate">
                    {armazem.localizacao || "Indefinida"}
                  </span>
                </div>
              </div>
              
              <div className="absolute right-3 top-3 flex flex-col gap-1 items-end">
                {armazem.principal && (
                  <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Principal
                  </span>
                )}
                {isInactive && (
                  <span className="bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Inativo
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalhes do Armazém Selecionado */}
      {currentArmazem && (
        <div className="mt-4 p-5 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                <Package className="text-primary" size={18} />
                {currentArmazem.nome}
              </h3>
              {currentArmazem.principal && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Principal
                </span>
              )}
              {currentArmazem.is_active !== false ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Ativo
                </span>
              ) : (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Inativo
                </span>
              )}
            </div>
            {currentArmazem.descricao && (
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
                {currentArmazem.descricao}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1">
                Código: <strong className="font-mono text-gray-700 dark:text-gray-300">{currentArmazem.codigo}</strong>
              </span>
              <span className="flex items-center gap-1">
                Localização: <strong className="text-gray-700 dark:text-gray-300">{currentArmazem.localizacao || "Sem localização"}</strong>
              </span>
            </div>
          </div>

          {/* Ações Administrativas */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => handleEditClick(currentArmazem)}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-250 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-3.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all"
                title="Editar Armazém"
              >
                <Edit2 size={13} /> Editar
              </button>
              
              <button
                onClick={() => handleToggleActive(currentArmazem)}
                className={`px-3.5 py-2 rounded-xl border font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  currentArmazem.is_active !== false
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 border-rose-200 dark:border-rose-900/30"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-900/30"
                }`}
                title={currentArmazem.is_active !== false ? "Desativar Armazém" : "Ativar Armazém"}
              >
                <Power size={13} /> {currentArmazem.is_active !== false ? "Desativar" : "Ativar"}
              </button>

              <button
                onClick={() => handleDelete(currentArmazem)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/10"
                title="Eliminar Armazém"
              >
                <Trash2 size={13} /> Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Tab ativa: tabela */}
      <div className="mt-4 p-6 bg-white dark:bg-surface-dark rounded-2xl border border-gray-250 dark:border-gray-800 shadow-sm">
        {isLoadingStock || isLoadingProducts || isLoadingMaterials ? (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            A carregar stock do armazém...
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { id: "Todos", label: "Todos os Itens" },
                { id: "Produto", label: "Produtos Finais" },
                { id: "Material", label: "Materiais / Utensílios" },
                { id: "Consumivel", label: "Consumíveis" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveItemType(item.id as any)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                    activeItemType === item.id 
                      ? "bg-primary text-white border-primary" 
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            
            <DataTable
              key={activeTab}
              storageKey={`stock_${activeTab}_v4`}
              data={items}
              columns={tableColumns}
              isLoading={isLoadingStock || isLoadingProducts || isLoadingMaterials}
              searchPlaceholder="Pesquisar por nome ou código..."
              manualPagination={false}
              searchValue={busca}
              onSearchChange={(value) => setBusca(value)}
              onClearFilters={() => {
                setBusca("");
                setCategoria("");
                setSubTipo("all");
                setServicoFilter("all");
                setActiveItemType("Todos");
              }}
              renderFilters={() => (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={servicoFilter}
                    onChange={(e) => setServicoFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-750 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-primary transition-all font-bold dark:text-white"
                  >
                    <option value="all">Serviço / Setor (Todos)</option>
                    <option value="COZINHA">Cozinha (COZINHA)</option>
                    <option value="PASTELARIA">Pastelaria (PASTELARIA)</option>
                    <option value="BAR">Bar (BAR)</option>
                    <option value="ABASTECIMENTO">Abastecimento (ABASTECIMENTO)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Filtrar por Categoria..."
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-750 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-primary transition-all font-bold min-w-[140px] dark:text-white"
                  />
                  <select
                    value={subTipo}
                    onChange={(e) => setSubTipo(e.target.value)}
                    className="bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-750 px-3 py-1.5 rounded-lg text-xs outline-none focus:border-primary transition-all font-bold dark:text-white"
                  >
                    <option value="all">Sub-tipo (Todos)</option>
                    {(activeItemType === "Todos" || activeItemType === "Produto") && (
                      <>
                        <option value="Acabado">Acabado</option>
                        <option value="Revenda">Revenda</option>
                      </>
                    )}
                    {(activeItemType === "Todos" || activeItemType === "Produto" || activeItemType === "Material") && (
                      <option value="Consumivel">Consumível</option>
                    )}
                    {(activeItemType === "Todos" || activeItemType === "Material") && (
                      <option value="Reutilizavel">Reutilizável</option>
                    )}
                  </select>
                </div>
              )}
            />
          </>
        )}
      </div>

      {/* Edit Warehouse Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Armazém"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Código *</label>
            <input
              type="text"
              required
              value={editForm.codigo}
              onChange={e => setEditForm({...editForm, codigo: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold uppercase transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome *</label>
            <input
              type="text"
              required
              value={editForm.nome}
              onChange={e => setEditForm({...editForm, nome: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Localização</label>
            <input
              type="text"
              value={editForm.localizacao}
              onChange={e => setEditForm({...editForm, localizacao: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrição</label>
            <textarea
              rows={3}
              value={editForm.descricao}
              onChange={e => setEditForm({...editForm, descricao: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="edit_principal"
              checked={editForm.principal}
              onChange={e => setEditForm({...editForm, principal: e.target.checked})}
              className="w-4 h-4 text-primary bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-primary"
            />
            <label htmlFor="edit_principal" className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Definir como Armazém Principal
            </label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 font-black text-gray-500 uppercase text-[10px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              Guardar Alterações
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TabsArmazem;
