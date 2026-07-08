import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { authService } from "../services/authService";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background-dark p-4 animate-fade-in">
      <div className="bg-surface dark:bg-surface-dark p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-3xl font-bold mb-4 shadow-lg shadow-gray-900/30 dark:shadow-white/30">
            S
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Recuperação de Senha
          </h1>
          <p className="text-sm text-gray-500 mt-2 text-center">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100"
                required
                placeholder="Introduza o seu email"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors shadow-md shadow-primary/20 disabled:opacity-70 flex justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Enviar Instruções"
              )}
            </button>
            
            <div className="text-center mt-4">
              <Link to="/login" className="text-sm font-medium text-primary hover:text-primary-hover transition-colors">
                Lembrei-me da senha. Voltar ao login.
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
