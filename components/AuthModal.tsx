import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Leaf, ArrowRight, Google, Mail, Lock, User } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Validação de email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { login, loginSocial, isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona para /app após login bem-sucedido
  React.useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
      navigate('/app');
    }
  }, [isAuthenticated, isOpen, navigate, onClose]);

  // Limpa campos quando alterna entre login e cadastro
  React.useEffect(() => {
    if (isLogin) {
      setName('');
      setNameError('');
      setConfirmPassword('');
      setPasswordError('');
    }
  }, [isLogin]);

  if (!isOpen) return null;

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError && value) {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!isLogin && !name.trim()) {
      setNameError('Nome é obrigatório');
      return;
    }

    if (name.trim() && name.trim().length < 2) {
      setNameError('Nome deve ter pelo menos 2 caracteres');
      return;
    }

    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setEmailError('Email inválido');
      return;
    }

    if (!password.trim()) {
      setPasswordError('Senha é obrigatória');
      return;
    }

    if (password.trim().length < 6) {
      setPasswordError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validação de confirmação de senha apenas no cadastro
    if (!isLogin) {
      if (!confirmPassword.trim()) {
        setPasswordError('Confirme sua senha');
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError('As senhas não coincidem');
        return;
      }
    }

    setIsSubmitting(true);
    setEmailError('');
    setNameError('');
    setPasswordError('');

    try {
      await login(email.trim(), isLogin ? undefined : name.trim());
      onClose();
    } catch (error: any) {
      setEmailError(error.message || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async () => {
    await loginSocial('google');
    onClose();
  };

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
          <div className="flex flex-col items-center mb-8">
            <div className="bg-nature-50 p-4 rounded-2xl text-nature-600 mb-4 shadow-sm">
              <Leaf className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center">
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </h2>
            <p className="text-gray-500 text-center text-sm mt-1">
              {isLogin ? 'Acesse seu jardim digital.' : 'Junte-se a milhares de jardineiros.'}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <button 
              onClick={handleSocialLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-2xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
            >
              <Google className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {t('continue_google')}
            </button>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wide">{t('or_divider')}</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de nome - apenas no cadastro */}
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-nature-600 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError && e.target.value.trim()) {
                      setNameError('');
                    }
                  }}
                  onBlur={() => {
                    if (!isLogin && name.trim() && name.trim().length < 2) {
                      setNameError('Nome deve ter pelo menos 2 caracteres');
                    }
                  }}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                    nameError 
                      ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                  }`}
                  placeholder="Seu nome"
                  disabled={isSubmitting}
                  minLength={2}
                />
                {nameError && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{nameError}</p>
                )}
              </div>
            )}

            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-nature-600 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => {
                  if (email && !isValidEmail(email.trim())) {
                    setEmailError('Email inválido');
                  }
                }}
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                  emailError 
                    ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500' 
                    : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                }`}
                placeholder="Email"
                disabled={isSubmitting}
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1 ml-1">{emailError}</p>
              )}
            </div>
            
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-nature-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError && e.target.value.trim()) {
                    setPasswordError('');
                  }
                }}
                onBlur={() => {
                  if (password.trim() && password.trim().length < 6) {
                    setPasswordError('Senha deve ter pelo menos 6 caracteres');
                  } else if (!isLogin && confirmPassword && password !== confirmPassword) {
                    setPasswordError('As senhas não coincidem');
                  }
                }}
                className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white disabled:opacity-50 ${
                  passwordError 
                    ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500' 
                    : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                }`}
                placeholder="Senha"
                disabled={isSubmitting}
                minLength={6}
              />
            </div>

            {/* Campo de confirmação de senha - apenas no cadastro */}
            {!isLogin && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-nature-600 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required={!isLogin}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError && e.target.value.trim()) {
                      // Verifica se as senhas coincidem ao digitar
                      if (password === e.target.value) {
                        setPasswordError('');
                      } else {
                        setPasswordError('As senhas não coincidem');
                      }
                    }
                  }}
                  onBlur={() => {
                    if (!confirmPassword.trim()) {
                      setPasswordError('Confirme sua senha');
                    } else if (password !== confirmPassword) {
                      setPasswordError('As senhas não coincidem');
                    }
                  }}
                  className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white disabled:opacity-50 ${
                    passwordError 
                      ? 'border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                  }`}
                  placeholder="Confirmar senha"
                  disabled={isSubmitting}
                  minLength={6}
                />
              </div>
            )}

            {/* Mensagem de erro de senha */}
            {passwordError && (
              <p className="text-red-500 text-xs mt-1 ml-1">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={
                isSubmitting || 
                !email.trim() || 
                !password.trim() || 
                (!isLogin && (!name.trim() || !confirmPassword.trim() || password !== confirmPassword))
              }
              className="w-full bg-nature-600 text-white py-4 rounded-2xl font-bold hover:bg-nature-700 transition-all shadow-lg shadow-nature-200 hover:shadow-nature-300 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar')} 
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-nature-600 font-bold hover:text-nature-800 transition-colors"
            >
              {isLogin ? 'Criar uma nova conta' : 'Já tenho uma conta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};