import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../services/authService";
import { useTheme } from "../components/Layout/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const { theme, toggleTheme } = useTheme();

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await authService.recoverPassword(email);
      setIsSubmitted(true);
      if (response && response.new_password) {
        setTempPassword(response.new_password);
      }
      toast.success("Instruções de recuperação enviadas para o seu email.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao tentar solicitar recuperação de senha.");
    } finally {
      setIsLoading(false);
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
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-secondary text-white flex items-center justify-center mb-6 shadow-xl shadow-primary/30 transform transition-transform hover:scale-105 duration-300">
            <span className="text-4xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 text-center">
            Recuperação de Senha
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
            Insira o seu email associado à conta SIGI para receber as instruções de recuperação.
          </p>
        </div>

        {isSubmitted ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="font-semibold">Email enviado com sucesso!</p>
              <p className="text-xs mt-2">
                Verifique a sua caixa de entrada e pasta de spam para redefinir a sua senha.
              </p>
            </div>
            
            {tempPassword && (
              <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-left">
                <p className="font-semibold text-sm mb-2 flex items-center justify-center gap-2">⚠️ AVISO PARA TESTES</p>
                <p className="text-sm mb-2">Como o sistema ainda não tem envio de emails configurado, a sua senha temporária é:</p>
                <div className="text-center font-mono font-bold bg-white dark:bg-gray-900 py-2 border border-amber-200 dark:border-amber-800 rounded text-xl select-all">
                  {tempPassword}
                </div>
              </div>
            )}

            <Link
              to="/login"
              className="inline-block w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium transition-colors"
            >
              Voltar ao Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecover} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50/50 dark:bg-neutral-950/50 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-gray-900 dark:text-gray-100 transition-all"
                  required
                  placeholder="Introduza o seu email"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary hover:brightness-110 text-white rounded-2xl font-semibold shadow-lg shadow-primary/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Enviar Instruções"
                )}
              </button>
            </div>
            
            <div className="text-center mt-6">
              <Link to="/login" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                Lembrei-me da senha. Voltar ao login.
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
