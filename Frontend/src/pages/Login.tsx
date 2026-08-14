import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { useTheme } from "../components/Layout/ThemeContext";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, AlertCircle, Sun, Moon, LogIn } from "lucide-react";
import { toast } from "react-toastify";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      const msg = "Por favor, preencha todos os campos.";
      setError(msg);
      toast.warning(msg);
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast.success("Login efetuado com sucesso!");
      navigate("/");
    } else {
      const msg = "Credenciais inválidas. Verifique seu email e senha.";
      setError(msg);
      toast.error("Falha na autenticação");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-surface to-secondary/10 dark:from-background-dark dark:via-background-dark dark:to-background-dark p-6 relative transition-colors duration-300">
      
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white/60 dark:bg-neutral-800/60 hover:bg-white dark:hover:bg-neutral-800 transition-all backdrop-blur-md text-gray-700 dark:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-700 z-10"
        title="Alternar Tema"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="backdrop-blur-xl bg-white/80 dark:bg-neutral-900/80 p-8 sm:p-10 rounded-[2rem] shadow-2xl w-full max-w-md border border-white/50 dark:border-gray-800/50 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center mb-6 shadow-xl shadow-primary/30 transform transition-transform hover:scale-105 duration-300">
            <Lock className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            Bem-vindo ao SIGI
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Sistema Integrado de Gestão Interna
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-2xl border border-red-200 dark:border-red-900/50 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1"
            >
              Email Corporativo
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email corporativo"
                aria-invalid={!!error}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-neutral-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-gray-900 dark:text-gray-100 transition-all"
                placeholder="nome@empresa.com"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1"
            >
              Senha
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Senha de acesso"
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 dark:bg-neutral-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-gray-900 dark:text-gray-100 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Botão */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white rounded-2xl font-semibold shadow-lg shadow-primary/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Entrar no Sistema
                </>
              )}
            </button>
          </div>
        </form>

        {/* Links extras */}
        <div className="mt-8 text-center">
          <Link 
            to="/recuperar-senha" 
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
          >
            Esqueceu sua senha?
          </Link>
        </div>
      </div>
    </div>
  );
}
