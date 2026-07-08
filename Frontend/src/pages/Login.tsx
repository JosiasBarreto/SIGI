import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react"; // ícones modernos

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(email, password);
    if (success) {
      navigate("/");
    } else {
      setError("Credenciais inválidas ou erro no sistema.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 p-6">
      <div className="backdrop-blur-md bg-white/80 dark:bg-neutral-900/70 p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 animate-in fade-in slide-in-from-bottom duration-500">
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-orange-500/40">
            🔐
          </div>
          <h1 className="text-3xl font-extrabold tracking-wide text-gray-900 dark:text-gray-100">
            SIGI Login
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Sistema Integrado de Gestão Interna
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 text-sm rounded-lg border border-red-300 dark:border-red-700 text-center animate-shake">
            {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email corporativo"
                aria-invalid={!!error}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-900 dark:text-gray-100 transition-all"
                placeholder="Digite seu email corporativo"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Dica: admin@sigi.com, admin@saborimbativel.com
            </p>
          </div>

          {/* Senha */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Senha de acesso"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-900 dark:text-gray-100 transition-all"
                placeholder="Digite sua senha"
                required
              />
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Entrar no Sistema
              </>
            )}
          </button>
        </form>

        {/* Links extras */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/recuperar-senha" className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                Esqueceu a senha?
              </Link>
        </div>
      </div>
    </div>
  );
}
