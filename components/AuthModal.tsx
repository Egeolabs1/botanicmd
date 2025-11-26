import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Leaf, ArrowRight, Google, Mail, Lock, User } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { login, loginSocial, resetPassword, resendConfirmationEmail, isAuthenticated, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResendEmail, setIsResendEmail] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string>('');
  const [nameError, setNameError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Monitora quando o login é bem-sucedido e redireciona quando autenticado
  React.useEffect(() => {
    if (loginSuccess && !isLoading && isAuthenticated) {
      console.log('✅ Login confirmado, redirecionando para /app');
      setLoginSuccess(false);
      onClose();
      window.location.href = '/app';
    }
  }, [loginSuccess, isLoading, isAuthenticated, onClose]);

  React.useEffect(() => {
    if (isLogin) {
      setName('');
      setNameError('');
      setConfirmPassword('');
      setPasswordError('');
    }
    if (isForgotPassword) {
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
      setResetSuccess(false);
    }
  }, [isLogin, isForgotPassword]);

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setEmailError('');
      await loginSocial('google');
    } catch (error: any) {
      setEmailError(error.message || 'Erro ao fazer login com Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEmailError('');
    setNameError('');
    setPasswordError('');

    if (!isValidEmail(email)) {
      setEmailError('Email inválido');
      setIsSubmitting(false);
      return;
    }

    if (!isLogin && !name.trim()) {
      setNameError('Nome é obrigatório');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setPasswordError('Senha deve ter pelo menos 6 caracteres');
      setIsSubmitting(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      setIsSubmitting(false);
      return;
    }

    try {
      await login(email.trim(), password.trim(), !isLogin ? name.trim() : undefined);
      
      if (isLogin) {
        console.log('✅ Login bem-sucedido, marcando para redirecionar quando autenticado...');
        setLoginSuccess(true);
        // O useEffect vai lidar com o redirecionamento quando isAuthenticated for true
      }
    } catch (error: any) {
      if (error?.message?.includes('senha') || error?.message?.includes('password')) {
        setPasswordError(error.message);
      } else {
        setEmailError(error.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEmailError('');

    if (!isValidEmail(email)) {
      setEmailError('Email inválido');
      setIsSubmitting(false);
      return;
    }

    try {
      await resetPassword(email.trim());
      setResetSuccess(true);
    } catch (error: any) {
      setEmailError(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEmailError('');

    if (!isValidEmail(email)) {
      setEmailError('Email inválido');
      setIsSubmitting(false);
      return;
    }

    try {
      await resendConfirmationEmail(email.trim());
      setResendSuccess(true);
    } catch (error: any) {
      setEmailError(error.message || 'Erro ao reenviar email');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center mb-6">
            <Leaf className="w-16 h-16 mx-auto text-nature-600 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isForgotPassword
                ? 'Recuperar Senha'
                : isResendEmail
                ? 'Reenviar Confirmação'
                : isLogin
                ? 'Bem-vindo de volta!'
                : 'Criar Conta'}
            </h2>
            <p className="text-gray-600">
              {isForgotPassword
                ? 'Digite seu email para receber o link de recuperação'
                : isResendEmail
                ? 'Digite seu email para reenviar o email de confirmação'
                : isLogin
                ? 'Entre com sua conta para continuar'
                : 'Crie sua conta para começar'}
            </p>
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                      emailError ? 'border-red-500' : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                    }`}
                    placeholder="seu@email.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
              </div>

              {resetSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  Email de recuperação enviado! Verifique sua caixa de entrada.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-nature-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-nature-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetSuccess(false);
                  setEmailError('');
                }}
                className="w-full text-nature-600 hover:text-nature-700 text-sm font-medium"
              >
                Voltar ao Login
              </button>
            </form>
          ) : isResendEmail ? (
            <form onSubmit={handleResendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                      emailError ? 'border-red-500' : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                    }`}
                    placeholder="seu@email.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
              </div>

              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                  Email de confirmação reenviado! Verifique sua caixa de entrada.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-nature-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-nature-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Reenviar Email'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsResendEmail(false);
                  setResendSuccess(false);
                  setEmailError('');
                }}
                className="w-full text-nature-600 hover:text-nature-700 text-sm font-medium"
              >
                Voltar ao Login
              </button>
            </form>
          ) : (
            <>
              <button
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3.5 rounded-2xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-4"
              >
                <Google className="w-5 h-5" />
                {t('continue_google')}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">{t('or_divider')}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                          nameError ? 'border-red-500' : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                        }`}
                        placeholder="Seu nome"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                        emailError ? 'border-red-500' : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                      }`}
                      placeholder="seu@email.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white ${
                        passwordError ? 'border-red-500' : 'border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
                      disabled={isSubmitting}
                    />
                  </div>
                  {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Senha
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border outline-none transition-all bg-gray-50 focus:bg-white border-gray-200 focus:ring-4 focus:ring-nature-100 focus:border-nature-500"
                        placeholder="Digite a senha novamente"
                        required
                        minLength={6}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setEmailError('');
                      }}
                      className="text-nature-600 hover:text-nature-700 font-medium"
                    >
                      Esqueci minha senha
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResendEmail(true);
                        setEmailError('');
                      }}
                      className="text-nature-600 hover:text-nature-700 font-medium"
                    >
                      Reenviar confirmação
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-nature-600 text-white py-3.5 rounded-2xl font-semibold hover:bg-nature-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Carregando...
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Entrar' : 'Criar Conta'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setEmailError('');
                    setNameError('');
                    setPasswordError('');
                  }}
                  className="text-nature-600 hover:text-nature-700 text-sm font-medium"
                >
                  {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
