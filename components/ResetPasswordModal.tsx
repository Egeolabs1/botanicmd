import React, { useState, useEffect } from 'react';
import { X, Lock } from './Icons';
import { useAuth } from '../contexts/AuthContext';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ isOpen, onClose }) => {
  const { updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(newPassword);
      setSuccess(true);
      // Fecha o modal após 2 segundos
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nature-900/30 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative border border-white/50">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Senha redefinida!</h2>
              <p className="text-gray-600">
                Sua senha foi redefinida com sucesso. Você já pode fazer login com sua nova senha.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="bg-nature-50 p-4 rounded-2xl text-nature-600 mb-4 shadow-sm">
                  <Lock className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center">
                  Redefinir Senha
                </h2>
                <p className="text-gray-500 text-center text-sm mt-1">
                  Digite sua nova senha abaixo.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-nature-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                      error 
                        ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                    }`}
                    placeholder="Nova senha"
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-nature-600 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                      error 
                        ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                    }`}
                    placeholder="Confirmar nova senha"
                    disabled={isSubmitting}
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Dica:</strong> Use uma senha forte com pelo menos 6 caracteres.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    !newPassword.trim() || 
                    !confirmPassword.trim() || 
                    newPassword !== confirmPassword ||
                    newPassword.length < 6
                  }
                  className="w-full bg-nature-600 text-white py-4 rounded-2xl font-bold hover:bg-nature-700 transition-all shadow-lg shadow-nature-200 hover:shadow-nature-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


