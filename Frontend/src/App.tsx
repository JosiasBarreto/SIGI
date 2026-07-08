/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/Layout/ThemeContext";
import { AuthProvider, useAuth } from "./components/AuthContext";
import { NotificationProvider } from "./components/NotificationContext";
import { SocketProvider } from "./contexts/SocketContext";
import Layout from "./components/Layout/Layout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Calendario from "./pages/Calendario";
import Login from "./pages/Login";
import SetupWizard from "./pages/SetupWizard";
import Producao from "./pages/Producao";
import Eventos from "./pages/Eventos";
import Produtos from "./pages/Produtos";
import Receita from "./pages/Receita";
import Clientes from "./pages/Clientes";
import Materiais from "./pages/Materiais";
import Financeiro from "./pages/Financeiro";
import Turnos from "./pages/Turnos";
import Logistica from "./pages/Logistica";
import Armazens from "./pages/Armazens";
import CaixaPOS from "./pages/CaixaPOS";
import Requisicoes from "./pages/Requisicoes";
import Configuracoes from "./pages/Configuracoes";
import ControloMateriais from "./pages/ControloMateriais";
import Inventario from "./pages/Inventario";
import Auditoria from "./pages/Auditoria";
import Relatorios from "./pages/Relatorios";
import Vendas from "./pages/Vendas";
import ContasReceber from "./pages/ContasReceber";
import Perfil from "./pages/Perfil";
import RecuperarSenha from "./pages/RecuperarSenha";
import FechoDiario from "./pages/FechoDiario";

import Utilizadores from "./pages/Utilizadores";

import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { RoleRoute } from "./components/Guards/RoleRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { SocketListeners } from "./components/SocketListeners";

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-background-dark">
        {" "}
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>{" "}
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    // Verificar se o backend precisa de configuração
    fetch(import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/v1/setup/check` : 'http://localhost:8000/api/v1/setup/check')
      .then(res => res.json())
      .then(data => {
        setSetupRequired(data.setup_required);
      })
      .catch(err => {
        console.error("Erro ao verificar setup:", err);
      })
      .finally(() => {
        setIsCheckingSetup(false);
      });
  }, []);

  if (isCheckingSetup) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-background-dark">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (setupRequired) {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SetupWizard onComplete={() => setSetupRequired(false)} />
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <Router>
              <AuthProvider>
                <SocketProvider>
                  <NotificationProvider>
                    <SocketListeners />
                    <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
                      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                        {/* Shared routes */}
                        <Route index element={<Dashboard />} />
                        <Route path="perfil" element={<Perfil />} />
                        <Route path="turnos" element={<Turnos />} />
                        <Route path="calendario" element={<Calendario />} />

                        {/* Admin-only routes */}
                        <Route element={<RoleRoute roles={["Administrador"]} />}>
                          <Route path="utilizadores" element={<Utilizadores />} />
                          <Route path="auditoria" element={<Auditoria />} />
                          <Route path="configuracoes" element={<Configuracoes />} />
                        </Route>

                        {/* Atendimento & POS sales routes */}
                        <Route element={<RoleRoute roles={["Administrador", "Atendimento"]} />}>
                          <Route path="clientes" element={<Clientes />} />
                          <Route path="pedidos" element={<Orders />} />
                          <Route path="eventos" element={<Eventos />} />
                        </Route>

                        {/* Caixa/POS sales routes */}
                        <Route element={<RoleRoute roles={["Administrador", "Atendimento", "Financeiro"]} />}>
                          <Route path="caixa" element={<CaixaPOS />} />
                        </Route>

                        {/* Production & Kitchen routes */}
                        <Route element={<RoleRoute roles={["Administrador", "Cozinha", "Pastelaria"]} />}>
                          <Route path="producao" element={<Producao />} />
                        </Route>

                        {/* Requisitions */}
                        <Route element={<RoleRoute roles={["Administrador", "Cozinha", "Pastelaria", "Armazém"]} />}>
                          <Route path="requisicoes" element={<Requisicoes />} />
                        </Route>

                        {/* Warehouse, products, inventory */}
                        <Route element={<RoleRoute roles={["Administrador", "Armazém"]} />}>
                          <Route path="produtos" element={<Produtos />} />
                          <Route path="produtos/:id/receita" element={<Receita />} />
                          <Route path="armazem" element={<Inventario />} />
                        </Route>

                        {/* Reusable materials stock catalog */}
                        <Route element={<RoleRoute roles={["Administrador", "Armazém", "Controlador de Materiais"]} />}>
                          <Route path="materiais" element={<Materiais />} />
                        </Route>

                        {/* Materials tracking controller */}
                        <Route element={<RoleRoute roles={["Administrador", "Controlador de Materiais"]} />}>
                          <Route path="controlo-materiais" element={<ControloMateriais />} />
                        </Route>

                        <Route element={<RoleRoute roles={["Administrador", "Gerente", "Armazém"]} />}>
                          <Route path="armazens" element={<Armazens />} />
                        </Route>

                        {/* Transport logistics */}
                        <Route element={<RoleRoute roles={["Administrador", "Motorista"]} />}>
                          <Route path="logistica" element={<Logistica />} />
                        </Route>

                        {/* Executive Finance panel */}
                        <Route element={<RoleRoute roles={["Administrador", "Financeiro"]} />}>
                          <Route path="financeiro" element={<Financeiro />} />
                          <Route path="financeiro/contas-receber" element={<ContasReceber />} />
                          <Route path="financeiro/fecho-diario" element={<FechoDiario />} />
                          <Route path="relatorios" element={<Relatorios />} />
                        </Route>

                        {/* Sales routes */}
                        <Route element={<RoleRoute roles={["Administrador", "Atendimento", "Financeiro"]} />}>
                          <Route path="vendas" element={<Vendas />} />
                        </Route>
                      </Route>
                    </Routes>
                  </NotificationProvider>
                </SocketProvider>
              </AuthProvider>
            </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
