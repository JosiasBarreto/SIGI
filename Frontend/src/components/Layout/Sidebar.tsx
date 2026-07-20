import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Package,
  Box,
  ShoppingCart,
  CalendarDays,
  PartyPopper,
  ChefHat,
  Clock,
  ClipboardList,
  Warehouse,
  Truck,
  ShieldCheck,
  Wallet,
  FileSearch,
  Settings,
  Menu,
  LogOut,
  Computer,
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  Lock,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../AuthContext";

export function Sidebar({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      path: "/",
      roles: ["Administrador", "Atendimento"],
    },
    {
      name: "Caixa / POS",
      icon: Computer,
      path: "/caixa",
      roles: ["Administrador", "Atendimento"],
    },
    {
      name: "Utilizadores",
      icon: Users,
      path: "/utilizadores",
      roles: ["Administrador"],
    },
    {
      name: "Clientes",
      icon: UserSquare2,
      path: "/clientes",
      roles: ["Administrador", "Atendimento"],
    },
    {
      name: "Produtos",
      icon: Package,
      path: "/produtos",
      roles: ["Administrador", "Armazém"],
    },
    {
      name: "Materiais",
      icon: Box,
      path: "/materiais",
      roles: ["Administrador", "Armazém", "Controlador de Materiais"],
    },
    {
      name: "Pedidos",
      icon: ShoppingCart,
      path: "/pedidos",
      roles: ["Administrador", "Atendimento"],
    },
    {
      name: "Calendário",
      icon: CalendarDays,
      path: "/calendario",
      roles: ["Administrador", "Atendimento", "Cozinha", "Pastelaria"],
    },
    {
      name: "Eventos",
      icon: PartyPopper,
      path: "/eventos",
      roles: ["Administrador", "Atendimento"],
    },
    {
      name: "Produção",
      icon: ChefHat,
      path: "/producao",
      roles: ["Administrador", "Cozinha", "Pastelaria"],
    },
    { name: "Turnos", icon: Clock, path: "/turnos", roles: ["Administrador"] },
    {
      name: "Requisições",
      icon: ClipboardList,
      path: "/requisicoes",
      roles: ["Administrador", "Cozinha", "Pastelaria", "Armazém"],
    },
    {
      name: "Armazéns",
      icon: Warehouse,
      path: "/armazens",
      roles: ["Administrador", "Armazém"],
    },
    {
      name: "Logística",
      icon: Truck,
      path: "/logistica",
      roles: ["Administrador", "Motorista"],
    },
    {
      name: "Controlo de Materiais",
      icon: ShieldCheck,
      path: "/controlo-materiais",
      roles: ["Administrador", "Controlador de Materiais"],
    },
    {
      name: "Relatórios",
      icon: FileSpreadsheet,
      path: "/relatorios",
      roles: ["Administrador", "Financeiro"],
    },
    {
      name: "Financeiro",
      icon: Wallet,
      path: "/financeiro",
      roles: ["Administrador"],
    },
    {
      name: "Vendas",
      icon: Receipt,
      path: "/vendas",
      roles: ["Administrador", "Atendimento", "Financeiro"],
    },
    {
      name: "Contas a Receber",
      icon: TrendingUp,
      path: "/financeiro/contas-receber",
      roles: ["Administrador", "Financeiro"],
    },
    {
      name: "Fecho Diário",
      icon: Lock,
      path: "/financeiro/fecho-diario",
      roles: ["Administrador", "Financeiro"],
    },
    {
      name: "Auditoria",
      icon: FileSearch,
      path: "/auditoria",
      roles: ["Administrador"],
    },
    {
      name: "Configurações",
      icon: Settings,
      path: "/configuracoes",
      roles: ["Administrador"],
    },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role || ""),
  );

  const handleLogout = () => {
    if (localStorage.getItem('isCaixaAberta') === 'true') {
      import('sweetalert2').then(Swal => {
        Swal.default.fire({
          icon: 'warning',
          title: 'Caixa em Execução',
          text: 'Você tem um turno de caixa aberto. Complete o fecho diário ou feche a sua caixa antes de terminar sessão.',
          confirmButtonText: 'Entendi'
        });
      });
      return;
    }
    logout();
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col",
        isOpen 
          ? "w-64 translate-x-0" 
          : "w-64 -translate-x-full md:translate-x-0 md:w-20"
      )}
    >
      <div className={cn(
        "h-16 flex items-center border-b border-gray-200 dark:border-gray-800 shrink-0 transition-all duration-300",
        isOpen ? "justify-between px-4" : "justify-center px-2 md:px-0"
      )}>
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center shrink-0">
            S
          </div>
          <span className={cn(
            "transition-opacity duration-300", 
            isOpen ? "opacity-100 block" : "opacity-0 md:hidden block"
          )}>
            SIGI
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="md:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded shrink-0"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className={cn(
        "overflow-y-auto flex-1 space-y-1 transition-all duration-300",
        isOpen ? "p-3" : "p-2 md:p-3"
      )}>
        <div className={cn(
          "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-4 transition-opacity duration-300",
          isOpen ? "px-3 opacity-100 block" : "opacity-0 md:hidden block px-3"
        )}>
          Módulo ({user?.role})
        </div>
        {filteredItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={!isOpen ? item.name : undefined}
              className={cn(
                "flex items-center rounded-lg text-sm font-medium transition-all duration-300",
                isOpen 
                  ? "gap-3 px-3 py-2.5" 
                  : "justify-center p-2.5 md:p-3 mx-auto w-10 h-10 md:w-12 md:h-12",
                isActive
                  ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200",
              )}
            >
              <Icon size={18} className={cn(isActive && "text-primary", "shrink-0")} />
              <span className={cn(
                "transition-opacity duration-300 whitespace-nowrap", 
                isOpen ? "opacity-100 inline" : "opacity-0 md:hidden inline"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>

      <div className={cn(
        "border-t border-gray-200 dark:border-gray-800 shrink-0 space-y-1 transition-all duration-300",
        isOpen ? "p-4" : "p-3 md:p-4 flex flex-col items-center"
      )}>
        <Link
          to="/perfil"
          title={!isOpen ? "O Meu Perfil" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium transition-all duration-300",
            isOpen 
              ? "gap-3 px-3 py-2.5 w-full" 
              : "justify-center p-2.5 md:p-3 mx-auto w-10 h-10 md:w-12 md:h-12",
            location.pathname === "/perfil"
              ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
          )}
        >
          <UserSquare2 size={18} className={cn(location.pathname === "/perfil" && "text-primary", "shrink-0")} />
          <span className={cn(
            "transition-opacity duration-300 whitespace-nowrap", 
            isOpen ? "opacity-100 inline" : "opacity-0 md:hidden inline"
          )}>
            O Meu Perfil
          </span>
        </Link>
        <button
          onClick={handleLogout}
          title={!isOpen ? "Terminar Sessão" : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium transition-all duration-300",
            isOpen 
              ? "gap-3 px-3 py-2.5 w-full" 
              : "justify-center p-2.5 md:p-3 mx-auto w-10 h-10 md:w-12 md:h-12",
            "text-error hover:bg-error/10 w-full"
          )}
        >
          <LogOut size={18} className="shrink-0" />
          <span className={cn(
            "transition-opacity duration-300 whitespace-nowrap", 
            isOpen ? "opacity-100 inline" : "opacity-0 md:hidden inline"
          )}>
            Terminar Sessão
          </span>
        </button>
      </div>
    </aside>
  );
}
