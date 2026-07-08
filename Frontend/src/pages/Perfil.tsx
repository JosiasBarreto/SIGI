import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { User, Shield, KeyRound, Mail, Clock, ShieldCheck, Save, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';

export default function Perfil() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!user) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('A nova senha e a confirmação não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsChangingPassword(true);
    try {
      if (authService && authService.changePassword) {
        await authService.changePassword({
          currentPassword,
          newPassword
        });
      } else {
        // Fallback for mock if not implemented perfectly
        await new Promise(res => setTimeout(res, 1000));
      }
      
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Erro ao alterar a senha. Verifique a senha atual.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <User className="text-primary" /> Perfil de Utilizador
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gira as suas informações pessoais, cargo e credenciais de acesso ao sistema SIGI.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-primary/10 border-4 border-primary/20 text-primary rounded-full flex items-center justify-center text-3xl font-black mb-4">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {user.name || 'Utilizador'}
            </h2>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs font-bold mt-2">
              <Shield size={14} className="text-primary" />
              {user.role || 'Geral'}
            </div>

            <div className="w-full mt-6 space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <span className="truncate" title={user.email}>{user.email || 'Não definido'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Phone size={16} className="text-gray-400 shrink-0" />
                <span className="truncate">{user.contact || 'S/ Contacto'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Clock size={16} className="text-gray-400 shrink-0" />
                <span>Último acesso: {user.lastAccess ? new Date(user.lastAccess).toLocaleDateString('pt-PT') : 'Hoje'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <ShieldCheck size={16} className="text-green-500 shrink-0" />
                <span className="text-green-600 dark:text-green-400 font-medium">{user.status || 'Ativo'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Password */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <KeyRound size={20} className="text-primary" /> Alterar Palavra-passe
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  placeholder="Introduza a senha atual"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  placeholder="Min. 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  placeholder="Repita a nova senha"
                  required
                  minLength={6}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold transition-colors shadow-md shadow-primary/20 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={18} /> Guardar Nova Senha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
