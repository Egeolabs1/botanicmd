
import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, CreditCard, X, Star, Trophy, ArrowRight, CheckCircle, Leaf, LayoutDashboard, Users, Bookmark, Clock, TrendingUp, Shield, HelpCircle, Mail, Lock, Share2, FileDown, Calendar, Camera, MessageCircle, Plus, Trash, Smartphone } from './Icons';
import { useLanguage } from '../i18n';
import { User as UserType, SupportedLanguage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { storage, SavedPlant } from '../services/storageService';
import { historyService, HistoryEntry } from '../services/historyService';
import { reminderService, Reminder } from '../services/reminderService';
import { isAdmin } from '../services/adminAuthService';
import { uploadImageToStorage } from '../services/storageUploadService';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { FAQModal } from './FAQModal';
import { SupportModal } from './SupportModal';
import { LogoutModal } from './LogoutModal';
import { useIsPWA } from '../hooks/useIsPWA';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  user: UserType;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onAdmin?: () => void;
  onOpenAbout: () => void;
  onOpenPrivacy?: () => void;
}

type ViewState = 'main' | 'profile' | 'settings' | 'subscription' | 'savedPlants' | 'history' | 'statistics' | 'reminders' | 'privacy' | 'email' | 'password' | 'share' | 'export' | 'help';

export const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onLogout, onUpgrade, onAdmin, onOpenAbout, onOpenPrivacy }) => {
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { updateProfile, changePassword } = useAuth();
  const isPWA = useIsPWA();
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  
  // Verifica se deve mostrar o botão de instalar
  useEffect(() => {
    // Verifica múltiplas formas de detectar PWA instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isAndroidStandalone = document.referrer.includes('android-app://');
    
    const actuallyInstalled = isStandalone || isIOSStandalone || isAndroidStandalone;
    
    // Mostra o botão se NÃO estiver instalado
    setShowInstallButton(!actuallyInstalled);
    
    // Debug
    console.log('🔍 UserProfile - Install Button Check:');
    console.log('  - isPWA (hook):', isPWA);
    console.log('  - display-mode standalone:', isStandalone);
    console.log('  - iOS standalone:', isIOSStandalone);
    console.log('  - Android standalone:', isAndroidStandalone);
    console.log('  - actuallyInstalled:', actuallyInstalled);
    console.log('  - showInstallButton:', !actuallyInstalled);
    console.log('  - deferredPrompt:', !!deferredPrompt);
    console.log('  - isIOS:', isIOS);
  }, [isPWA, deferredPrompt, isIOS]);
  const [editName, setEditName] = useState(user.name);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('botanicmd_notifications');
      return stored ? JSON.parse(stored) : false;
    } catch (error) {
      // Se o localStorage estiver corrompido, retorna valor padrão
      console.warn('Erro ao ler notificações do localStorage:', error);
      return false;
    }
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('botanicmd_email_notifications');
      return stored ? JSON.parse(stored) : false;
    } catch (error) {
      // Se o localStorage estiver corrompido, retorna valor padrão
      console.warn('Erro ao ler notificações de email do localStorage:', error);
      return false;
    }
  });
  const [nameError, setNameError] = useState<string>('');
  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showCreateReminder, setShowCreateReminder] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`botanicmd_profile_image_${user.id}`) || null;
    } catch {
      return null;
    }
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({
    plantName: '',
    type: 'watering' as Reminder['type'],
    title: '',
    description: '',
    date: '',
    time: '',
    frequency: 'once' as Reminder['frequency'],
  });
  
  // Carregar dados ao montar
  useEffect(() => {
    loadSavedPlants();
    loadHistory();
    loadReminders();
    calculateStatistics();
  }, []);

  // Detectar se pode instalar PWA
  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    
    // Detecta iOS imediatamente
    if (isIosDevice) {
      setIsIOS(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('✅ beforeinstallprompt capturado');
    };

    // Adiciona listener para capturar o prompt quando disponível
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Verifica se já existe um prompt salvo (pode ter sido capturado antes)
    // Isso não é possível diretamente, mas podemos tentar forçar a detecção

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Para iOS, mostra instruções detalhadas
      const instructions = `Para instalar o BotanicMD no iOS:

1. Toque no botão de Compartilhar (Share) na parte inferior da tela (ícone de quadrado com seta para cima)

2. Role para baixo e toque em "Adicionar à Tela de Início" (Add to Home Screen)

3. Toque em "Adicionar" para confirmar

Pronto! O app estará disponível na sua tela inicial.`;

      alert(instructions);
      return;
    }

    // Para Android
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          alert('App instalado com sucesso! ✅');
        } else {
          console.log('Usuário cancelou a instalação');
        }
      } catch (error) {
        console.error('Erro ao mostrar prompt de instalação:', error);
        // Fallback: mostra instruções manuais
        const instructions = `Para instalar o BotanicMD:

1. Toque no menu do navegador (3 pontos no canto superior direito)

2. Procure por "Instalar app" ou "Adicionar à tela inicial"

3. Siga as instruções para instalar

Alternativamente, alguns navegadores mostram um banner na parte superior da tela para instalar o app.`;

        alert(instructions);
      }
    } else {
      // Se não tem deferredPrompt, mostra instruções manuais
      const instructions = `Para instalar o BotanicMD:

1. Toque no menu do navegador (3 pontos no canto superior direito)

2. Procure por "Instalar app" ou "Adicionar à tela inicial"

3. Siga as instruções para instalar

Alternativamente, alguns navegadores mostram um banner na parte superior da tela para instalar o app.`;

      alert(instructions);
    }
  };
  
  const loadSavedPlants = async () => {
    try {
      const plants = await storage.getPlants();
      setSavedPlants(plants);
    } catch (error) {
      console.error('Erro ao carregar plantas:', error);
    }
  };
  
  const loadHistory = () => {
    try {
      const historyData = historyService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };
  
  const loadReminders = () => {
    try {
      const remindersData = reminderService.getReminders();
      setReminders(remindersData);
    } catch (error) {
      console.error('Erro ao carregar lembretes:', error);
    }
  };
  
  const calculateStatistics = async () => {
    try {
      const plants = await storage.getPlants();
      const stats = {
        total: plants.length,
        healthy: plants.filter(p => p.data.health?.isHealthy).length,
        sick: plants.filter(p => !p.data.health?.isHealthy).length,
        toxic: plants.filter(p => {
          const toxicity = p.data.toxicity?.toLowerCase?.() || '';
          return toxicity.includes('toxic') || toxicity.includes('tóxica');
        }).length,
        medicinal: plants.filter(p => p.data.medicinal?.isMedicinal).length,
      };
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
    }
  };
  
  const handleNotificationToggle = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('botanicmd_notifications', JSON.stringify(enabled));
  };
  
  const handleEmailToggle = (enabled: boolean) => {
    setEmailNotifications(enabled);
    localStorage.setItem('botanicmd_email_notifications', JSON.stringify(enabled));
  };
  
  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'BotanicMD',
        text: 'Identifique plantas e diagnostique doenças com IA!',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };
  
  const handleExportData = () => {
    try {
      const data = {
        user: {
          name: user.name,
          email: user.email,
          plan: user.plan,
        },
        plants: savedPlants,
        history: history,
        settings: {
          notifications: notificationsEnabled,
          emailNotifications: emailNotifications,
          language: language,
        },
        exportedAt: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `botanicmd-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Dados exportados com sucesso!');
    } catch (error) {
      alert('Erro ao exportar dados. Tente novamente.');
    }
  };
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState<string>('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const handleChangePassword = () => {
    setCurrentView('password');
  };

  const handleSavePassword = async () => {
    setPasswordError('');
    
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Preencha todos os campos.');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    setIsChangingPassword(true);
    
    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      alert('Senha alterada com sucesso!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setCurrentView('settings');
    } catch (error: any) {
      setPasswordError(error.message || 'Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  const handleCreateReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    
    const dateTime = new Date(`${newReminder.date}T${newReminder.time}`);
    if (dateTime.getTime() < Date.now()) {
      alert('A data/hora deve ser no futuro.');
      return;
    }
    
    const reminder = reminderService.addReminder({
      plantName: newReminder.plantName || 'Geral',
      type: newReminder.type,
      title: newReminder.title,
      description: newReminder.description,
      date: dateTime.getTime(),
      frequency: newReminder.frequency,
    });
    
    loadReminders();
    setShowCreateReminder(false);
    setNewReminder({
      plantName: '',
      type: 'watering',
      title: '',
      description: '',
      date: '',
      time: '',
      frequency: 'once',
    });
    alert('Lembrete criado com sucesso!');
  };
  
  const handleDeleteReminder = (id: string) => {
    if (window.confirm('Deseja realmente excluir este lembrete?')) {
      reminderService.deleteReminder(id);
      loadReminders();
    }
  };
  
  const handleCompleteReminder = (id: string) => {
    reminderService.completeReminder(id);
    loadReminders();
  };

  // Calculate usage percentage
  const maxUsage = user.maxUsage === -1 ? 100 : user.maxUsage;
  const usageCount = user.usageCount;
  const percentage = user.maxUsage === -1 ? 100 : Math.min(100, (usageCount / maxUsage) * 100);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    
    // Validações
    if (!trimmedName) {
      alert('Nome é obrigatório');
      return;
    }
    
    if (trimmedName.length < 2) {
      alert('Nome deve ter pelo menos 2 caracteres');
      return;
    }
    
    if (trimmedName.length > 50) {
      alert('Nome deve ter no máximo 50 caracteres');
      return;
    }
    
    try {
      await updateProfile(trimmedName);
        alert(t('profile_updated'));
        setCurrentView('main');
    } catch (error: any) {
      alert(error.message || 'Erro ao atualizar perfil. Tente novamente.');
    }
  };
  
  const handleCancelSubscription = () => {
    alert(t('cancel_subscription_info'));
  };

  const handleBack = () => setCurrentView('main');

  const renderMainView = () => (
    <>
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-nature-500 to-nature-700 relative flex-shrink-0">
        </div>

        {/* Avatar & Info */}
        <div className="px-6 pb-8 relative">
          <div className="relative -mt-12 mb-4">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg mx-auto">
              <div className="w-full h-full rounded-full bg-nature-100 flex items-center justify-center text-2xl font-bold text-nature-700">
                {getInitials(user.name)}
              </div>
            </div>
            <div className="absolute bottom-0 right-1/2 translate-x-10 translate-y-1">
               <span className={`px-2 py-1 rounded-full text-xs font-bold border border-white shadow-sm ${user.plan === 'pro' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-700'}`}>
                 {user.plan === 'pro' ? 'PRO' : 'FREE'}
               </span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          {/* Usage Stats */}
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
             <div className="flex justify-between items-center mb-2">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('usage_limit')}</span>
               <span className="text-xs font-medium text-gray-700">
                 {user.maxUsage === -1 ? '∞' : `${usageCount} / ${maxUsage}`}
               </span>
             </div>
             <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
               <div 
                  className={`h-full rounded-full transition-all duration-500 ${user.plan === 'pro' ? 'bg-yellow-400' : 'bg-nature-500'}`} 
                  style={{ width: user.maxUsage === -1 ? '100%' : `${percentage}%` }} 
               />
             </div>
             {user.plan === 'free' && (
               <button 
                 onClick={onUpgrade}
                 className="w-full mt-3 text-xs font-bold text-nature-600 hover:text-nature-700 flex items-center justify-center gap-1"
               >
                 <Star className="w-3 h-3" /> {t('upgrade_plan')}
               </button>
             )}
          </div>

          {/* Actions Menu */}
          <div className="space-y-2">
            <button 
                onClick={() => setCurrentView('profile')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><User className="w-5 h-5" /></div>
               <span className="font-medium flex-1">{t('profile')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
            
             {/* Admin Button - Only visible for admins */}
             {isAdmin(user) && (
             <button 
                onClick={() => { onClose(); if(onAdmin) onAdmin(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-2 bg-gray-900 rounded-lg text-white"><LayoutDashboard className="w-5 h-5" /></div>
               <span className="font-medium flex-1">Admin Panel</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
             )}

            <button 
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Settings className="w-5 h-5" /></div>
               <span className="font-medium flex-1">{t('settings')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
            <button 
                onClick={() => setCurrentView('subscription')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><CreditCard className="w-5 h-5" /></div>
               <span className="font-medium flex-1">{t('subscription')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>

            <button 
                onClick={() => { onClose(); onOpenAbout(); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-2 bg-gray-100 rounded-lg text-gray-500"><Users className="w-5 h-5" /></div>
               <span className="font-medium flex-1">{t('about_us')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>

            {/* Install App - Only show if not installed */}
            {showInstallButton && (
              <button 
                onClick={handleInstallClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors text-left"
              >
                <div className="p-2 bg-nature-100 rounded-lg text-nature-600"><Smartphone className="w-5 h-5" /></div>
                <span className="font-medium flex-1">{t('install_btn')}</span>
                <ArrowRight className="w-4 h-4 text-gray-300" />
              </button>
            )}

            <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left"
            >
               <div className="p-2 bg-red-100 rounded-lg"><LogOut className="w-5 h-5" /></div>
               <span className="font-medium flex-1">Logout</span>
            </button>
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {t('footer_developed_by')}
            </p>
          </div>
        </div>
    </>
  );

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB. Por favor, selecione uma imagem menor.');
      return;
    }

    setIsUploadingImage(true);

    try {
      let imageUrl: string | null = null;

      // Se Supabase estiver configurado, faz upload
      if (isSupabaseConfigured) {
        try {
          imageUrl = await uploadImageToStorage(file, user.id, 'profile');
        } catch (error) {
          console.error('Erro ao fazer upload para Supabase:', error);
          // Se falhar, usa base64 local
        }
      }

      // Se não fez upload ou falhou, converte para base64 e salva localmente
      if (!imageUrl) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setProfileImage(base64String);
          localStorage.setItem(`botanicmd_profile_image_${user.id}`, base64String);
          setIsUploadingImage(false);
        };
        reader.onerror = () => {
          alert('Erro ao processar a imagem. Tente novamente.');
          setIsUploadingImage(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Se fez upload com sucesso
      setProfileImage(imageUrl);
      localStorage.setItem(`botanicmd_profile_image_${user.id}`, imageUrl);
      setIsUploadingImage(false);
    } catch (error: any) {
      console.error('Erro ao fazer upload da imagem:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
      setIsUploadingImage(false);
    }
  };

  const renderProfileView = () => (
    <div className="p-4 md:p-6 pb-20">
      {/* Sticky Header */}
      <div className="flex items-center gap-3 mb-4 md:mb-6 sticky top-0 bg-white pb-2 z-10">
        <button 
          onClick={handleBack} 
          className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <h3 className="text-lg md:text-xl font-bold text-gray-900">{t('edit_profile')}</h3>
      </div>
      
      <div className="space-y-5 md:space-y-6">
        {/* Foto de Perfil - Mobile Optimized */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt="Foto de perfil" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
              )}
            </div>
            <label 
              htmlFor="profile-image-upload"
              className="absolute bottom-0 right-0 bg-nature-600 text-white rounded-full p-2.5 md:p-3 cursor-pointer hover:bg-nature-700 active:scale-95 transition-all shadow-lg"
              title="Alterar foto"
            >
              <Camera className="w-4 h-4 md:w-5 md:h-5" />
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
            </label>
          </div>
          {isUploadingImage && (
            <div className="mt-3 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-nature-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Enviando imagem...</p>
            </div>
          )}
          {!isUploadingImage && !profileImage && (
            <p className="text-xs text-gray-500 mt-2 text-center">Toque no ícone da câmera para adicionar foto</p>
          )}
        </div>

        {/* Campos de perfil - Mobile optimized */}
      <div className="space-y-4">
          {/* Nome - Primeiro */}
        <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              {t('your_name')}
            </label>
          <input 
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-500 focus:border-nature-500 transition-all text-base"
          />
            {nameError && (
              <p className="text-xs text-red-600 mt-1">{nameError}</p>
            )}
        </div>

          {/* Email (somente leitura) - Segundo */}
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              Email
            </label>
            <div className="relative">
              <input 
                type="email" 
                value={user.email || ''}
                disabled
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed text-base"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              O email não pode ser alterado
            </p>
          </div>
        </div>
        
        {/* Additional Profile Options - Mobile optimized */}
        <div className="pt-2 border-t-2 border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Meus Dados
          </h4>
          <div className="space-y-2">
            <button 
              onClick={() => setCurrentView('savedPlants')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 active:scale-98 text-gray-700 transition-all text-left bg-white border border-gray-100"
            >
              <div className="p-2.5 bg-nature-100 rounded-xl text-nature-600 flex-shrink-0"><Bookmark className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-sm">Plantas Salvas</span>
                <span className="text-xs text-gray-500">{savedPlants.length} plantas</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
            
            <button 
              onClick={() => setCurrentView('history')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 active:scale-98 text-gray-700 transition-all text-left bg-white border border-gray-100"
            >
              <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 flex-shrink-0"><Clock className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-sm">Histórico</span>
                <span className="text-xs text-gray-500">{history.length} análises</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
            
            <button 
              onClick={() => setCurrentView('statistics')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 active:scale-98 text-gray-700 transition-all text-left bg-white border border-gray-100"
            >
              <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 flex-shrink-0"><TrendingUp className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-sm">Estatísticas</span>
                <span className="text-xs text-gray-500">Visualizar dados</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
            
            <button 
              onClick={() => setCurrentView('reminders')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-gray-50 active:scale-98 text-gray-700 transition-all text-left bg-white border border-gray-100"
            >
              <div className="p-2.5 bg-green-100 rounded-xl text-green-600 flex-shrink-0"><Calendar className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block text-sm">Lembretes</span>
                <span className="text-xs text-gray-500">Gerenciar lembretes</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          </div>
        </div>
        
        {/* Save Button - Mobile optimized */}
        <button 
          onClick={handleSaveProfile}
          className="w-full bg-nature-600 text-white py-4 rounded-xl font-bold text-base hover:bg-nature-700 active:scale-98 transition-all shadow-lg shadow-nature-200 mt-6"
        >
          {t('save_changes')}
        </button>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">{t('settings')}</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <label htmlFor="notifications" className="font-medium text-gray-700">{t('enable_notifications')}</label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="notifications" checked={notificationsEnabled} onChange={(e) => handleNotificationToggle(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
              <label htmlFor="notifications" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">{t('app_language')}</label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
          >
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="it">Italiano</option>
            <option value="zh">中文 (简体)</option>
            <option value="ru">Русский</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        {/* Additional Settings Options */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <button 
            onClick={() => setCurrentView('privacy')}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Shield className="w-5 h-5" /></div>
            <span className="font-medium flex-1">{t('privacy_and_security')}</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button 
            onClick={() => setCurrentView('email')}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Mail className="w-5 h-5" /></div>
            <span className="font-medium flex-1">{t('email_notifications')}</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button 
            onClick={handleChangePassword}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Lock className="w-5 h-5" /></div>
            <span className="font-medium flex-1">{t('change_password')}</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button 
            onClick={handleShareApp}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><Share2 className="w-5 h-5" /></div>
            <span className="font-medium flex-1">{t('share_app')}</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button 
            onClick={handleExportData}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><FileDown className="w-5 h-5" /></div>
            <span className="font-medium flex-1">{t('export_data')}</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button 
            onClick={() => setCurrentView('help')}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
          >
            <div className="p-2 bg-gray-100 rounded-lg text-gray-600"><HelpCircle className="w-5 h-5" /></div>
            <span className="font-medium flex-1">{t('help_and_support')}</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const renderSubscriptionView = () => {
    const commonProFeatures = ['Análises ilimitadas', 'Diagnóstico avançado', 'Plantas salvas', 'Histórico completo', 'Lembretes'];
    
    const plans = [
      {
        name: 'Free',
        price: 'Grátis',
        period: '',
        features: ['3 análises por mês', 'Identificação básica', 'Diagnóstico básico'],
        current: user.plan === 'free',
        badge: null,
        equivalent: null,
        icon: '🌱'
      },
      {
        name: 'PRO Mensal',
        price: t('price_monthly'),
        period: '/mês',
        features: commonProFeatures,
        current: user.plan === 'pro',
        badge: null,
        equivalent: null,
        planType: 'monthly' as const,
        icon: '⭐'
      },
      {
        name: 'PRO Anual',
        price: t('price_annual'),
        period: '/ano',
        features: commonProFeatures,
        current: false,
        badge: 'Melhor valor',
        equivalent: t('per_month_equiv'),
        planType: 'annual' as const,
        icon: '👑'
      },
      {
        name: 'PRO Vitalício',
        price: t('price_lifetime'),
        period: '',
        features: [...commonProFeatures, 'Acesso permanente', 'Atualizações futuras'],
        current: false,
        badge: null,
        equivalent: null,
        planType: 'lifetime' as const,
        icon: '💎'
      }
    ];

    return (
      <div className="p-4 md:p-6 pb-20">
        <div className="flex items-center gap-3 mb-4 md:mb-6 sticky top-0 bg-white pb-2 z-10">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"><ArrowRight className="w-5 h-5 rotate-180" /></button>
          <h3 className="text-lg md:text-xl font-bold text-gray-900">{t('subscription')}</h3>
      </div>
        
        {/* Mobile-optimized plan cards */}
        <div className="space-y-3 md:space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative border-2 rounded-xl md:rounded-2xl overflow-hidden transition-all ${
                plan.current
                  ? 'border-nature-600 bg-gradient-to-br from-nature-50 to-green-50 shadow-md'
                  : plan.badge === 'Melhor valor'
                  ? 'border-nature-500 bg-white shadow-lg'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Badge for "Melhor valor" - positioned absolutely */}
              {plan.badge === 'Melhor valor' && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Current plan badge */}
              {plan.current && (
                <div className="absolute top-3 right-3 z-10">
                  <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                    Atual
                  </span>
                </div>
              )}

              <div className="p-4 md:p-6">
                {/* Header with icon, name and price */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{plan.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base md:text-lg text-gray-900 leading-tight">{plan.name}</h4>
                        {plan.equivalent && (
                          <p className="text-xs text-nature-600 font-semibold mt-0.5">{plan.equivalent}</p>
        )}
                      </div>
                    </div>
                    {plan.name.startsWith('PRO') && !plan.current && (
          <button 
                        onClick={() => {
                          onClose();
                          onUpgrade();
                        }}
                        className="bg-nature-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-bold text-xs md:text-sm hover:bg-nature-700 active:scale-95 transition-all flex items-center gap-1.5 shadow-md flex-shrink-0"
          >
                        <Star className="w-3 h-3 md:w-4 md:h-4" /> 
                        <span className="hidden sm:inline">Assinar</span>
          </button>
        )}
      </div>
                  
                  {/* Price */}
                  <div className="mt-2">
                    <p className="text-xl md:text-2xl font-bold text-gray-900">
                      {plan.price}
                      {plan.period && <span className="text-sm md:text-base text-gray-500 font-normal">/{plan.period}</span>}
                    </p>
                  </div>
                </div>
                
                {/* Features - compact for mobile */}
                <div className="space-y-1.5 md:space-y-2">
                  {plan.features.slice(0, plan.name === 'PRO Vitalício' ? 7 : 5).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-gray-700">
                      <CheckCircle className={`w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 ${plan.current ? 'text-nature-600' : 'text-gray-400'}`} />
                      <span className="leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Show upgrade button at bottom for mobile if not PRO */}
                {plan.name.startsWith('PRO') && !plan.current && (
                  <button
                    onClick={() => {
                      onClose();
                      onUpgrade();
                    }}
                    className="w-full mt-4 bg-nature-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-nature-700 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md sm:hidden"
                  >
                    <Star className="w-4 h-4" /> 
                    Assinar Agora
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons for PRO users */}
      {user.plan === 'pro' && (
          <div className="mt-6 space-y-2 bg-gray-50 rounded-xl p-4">
            <button 
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="w-full text-center text-sm text-nature-600 hover:text-nature-800 font-semibold py-2 bg-white rounded-lg border border-nature-200 active:scale-98 transition-transform"
            >
              Alterar plano
            </button>
            <button className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-2">
              {t('manage_sub')}
            </button>
            <button 
               onClick={handleCancelSubscription}
              className="w-full text-center text-sm text-red-500 hover:text-red-700 font-medium py-2"
            >
               {t('cancel_subscription')}
            </button>
         </div>
      )}
        
        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <p className="text-xs text-blue-800 text-center leading-relaxed">
            💳 Pagamento seguro via Stripe • Renovação automática • Cancele quando quiser
          </p>
        </div>
      </div>
    );
  };

  // Render views for new functionalities
  const renderSavedPlantsView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentView('profile')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">Plantas Salvas</h3>
      </div>
      <div className="space-y-3">
        {savedPlants.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma planta salva ainda</p>
          </div>
        ) : (
          savedPlants.map((plant) => (
            <div key={plant.data.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-nature-100 flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6 text-nature-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{plant.data.commonName}</h4>
                <p className="text-xs text-gray-500 truncate">{plant.data.scientificName}</p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const renderHistoryView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentView('profile')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">Histórico</h3>
        {history.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm('Deseja limpar todo o histórico?')) {
                historyService.clearHistory();
                loadHistory();
              }
            }}
            className="ml-auto text-xs text-red-500 hover:text-red-700"
          >
            Limpar
          </button>
        )}
      </div>
      <div className="space-y-3">
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma análise no histórico</p>
            <p className="text-xs text-gray-400 mt-2">As análises aparecerão aqui automaticamente</p>
          </div>
        ) : (
          history.slice(0, 20).map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.type === 'image' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              }`}>
                {item.type === 'image' ? <Camera className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.plantName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  historyService.deleteEntry(item.id);
                  loadHistory();
                }}
                className="text-gray-400 hover:text-red-500 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const renderStatisticsView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentView('profile')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">Estatísticas</h3>
      </div>
      {statistics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-nature-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-nature-600">{statistics.total}</div>
              <div className="text-xs text-gray-600 mt-1">Total de Plantas</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{statistics.healthy}</div>
              <div className="text-xs text-gray-600 mt-1">Saudáveis</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{statistics.sick}</div>
              <div className="text-xs text-gray-600 mt-1">Doentes</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{statistics.toxic}</div>
              <div className="text-xs text-gray-600 mt-1">Tóxicas</div>
            </div>
          </div>
          {statistics.medicinal > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{statistics.medicinal}</div>
              <div className="text-xs text-gray-600 mt-1">Medicinais</div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const getReminderTypeLabel = (type: Reminder['type']) => {
    const labels: Record<Reminder['type'], string> = {
      watering: 'Regar',
      fertilizing: 'Fertilizar',
      pruning: 'Podar',
      checkup: 'Verificar',
      custom: 'Personalizado',
    };
    return labels[type];
  };

  const renderRemindersView = () => {
    const upcomingReminders = reminders.filter(r => !r.isCompleted && r.date >= Date.now());
    const pastReminders = reminders.filter(r => r.isCompleted || r.date < Date.now());
    
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setCurrentView('profile')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
          <h3 className="text-lg font-bold text-gray-900">Lembretes</h3>
          <button
            onClick={() => setShowCreateReminder(true)}
            className="ml-auto bg-nature-600 text-white p-2 rounded-lg hover:bg-nature-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {showCreateReminder ? (
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Título *</label>
              <input
                type="text"
                value={newReminder.title}
                onChange={(e) => setNewReminder({...newReminder, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
                placeholder="Ex: Regar a samambaia"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Planta (opcional)</label>
              <input
                type="text"
                value={newReminder.plantName}
                onChange={(e) => setNewReminder({...newReminder, plantName: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
                placeholder="Nome da planta"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Tipo</label>
              <select
                value={newReminder.type}
                onChange={(e) => setNewReminder({...newReminder, type: e.target.value as Reminder['type']})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
              >
                <option value="watering">Regar</option>
                <option value="fertilizing">Fertilizar</option>
                <option value="pruning">Podar</option>
                <option value="checkup">Verificar</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Data *</label>
                <input
                  type="date"
                  value={newReminder.date}
                  onChange={(e) => setNewReminder({...newReminder, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Hora *</label>
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder({...newReminder, time: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Frequência</label>
              <select
                value={newReminder.frequency}
                onChange={(e) => setNewReminder({...newReminder, frequency: e.target.value as Reminder['frequency']})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50"
              >
                <option value="once">Uma vez</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Descrição (opcional)</label>
              <textarea
                value={newReminder.description}
                onChange={(e) => setNewReminder({...newReminder, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
                rows={2}
                placeholder="Observações adicionais..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateReminder}
                className="flex-1 bg-nature-600 text-white py-2 rounded-lg font-medium hover:bg-nature-700 transition-colors"
              >
                Criar
              </button>
              <button
                onClick={() => setShowCreateReminder(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingReminders.length === 0 && pastReminders.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">Nenhum lembrete criado</p>
                <button
                  onClick={() => setShowCreateReminder(true)}
                  className="bg-nature-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-nature-700 transition-colors"
                >
                  Criar Primeiro Lembrete
                </button>
              </div>
            ) : (
              <>
                {upcomingReminders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Próximos</h4>
                    <div className="space-y-2">
                      {upcomingReminders.map((reminder) => (
                        <div key={reminder.id} className="bg-nature-50 border border-nature-200 rounded-lg p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-nature-600 bg-nature-100 px-2 py-0.5 rounded">
                                  {getReminderTypeLabel(reminder.type)}
                                </span>
                                <span className="text-xs text-gray-500">{reminder.plantName}</span>
                              </div>
                              <h5 className="font-semibold text-gray-900 text-sm">{reminder.title}</h5>
                              {reminder.description && (
                                <p className="text-xs text-gray-600 mt-1">{reminder.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(reminder.date).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleCompleteReminder(reminder.id)}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="Marcar como concluído"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReminder(reminder.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Excluir"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {pastReminders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Concluídos</h4>
                    <div className="space-y-2">
                      {pastReminders.slice(0, 5).map((reminder) => (
                        <div key={reminder.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 opacity-60">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  {getReminderTypeLabel(reminder.type)}
                                </span>
                                {reminder.isCompleted && (
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                )}
                              </div>
                              <h5 className="font-semibold text-gray-700 text-sm line-through">{reminder.title}</h5>
                            </div>
                            <button
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            {t('footer_developed_by')}
          </p>
        </div>
      </div>
    );
  };

  const renderPrivacyView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">Privacidade e Segurança</h3>
      </div>
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Dados Pessoais</h4>
          <p className="text-sm text-gray-600">Seus dados são armazenados de forma segura e não são compartilhados com terceiros.</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Permissões</h4>
          <p className="text-sm text-gray-600">O app solicita apenas as permissões necessárias para funcionamento.</p>
        </div>
        <button 
          onClick={() => {
            onClose();
            navigate('/privacy');
          }}
          className="w-full bg-nature-600 text-white py-2.5 rounded-lg font-medium hover:bg-nature-700 transition-colors"
        >
          Ver Política de Privacidade
        </button>
        <button 
          onClick={() => {
            if (window.confirm('Deseja realmente excluir todos os seus dados? Esta ação não pode ser desfeita.')) {
              // Limpar dados locais
              localStorage.removeItem('botanicmd_history');
              localStorage.removeItem('botanicmd_reminders');
              localStorage.removeItem('botanicmd_notifications');
              localStorage.removeItem('botanicmd_email_notifications');
              alert('Dados locais excluídos. Para excluir dados do servidor, entre em contato com o suporte.');
            }
          }}
          className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg font-medium hover:bg-red-100 transition-colors border border-red-200"
        >
          Excluir Meus Dados
        </button>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const renderEmailView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">Notificações por Email</h3>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <label htmlFor="email-notifications" className="font-medium text-gray-700">Receber notificações por email</label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="email-notifications" checked={emailNotifications} onChange={(e) => handleEmailToggle(e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
              <label htmlFor="email-notifications" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Receba atualizações sobre suas plantas e dicas de cuidado por email.</p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const renderHelpView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">Ajuda e Suporte</h3>
      </div>
      <div className="space-y-3">
        <button 
          onClick={() => setIsFAQModalOpen(true)}
          className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <h4 className="font-semibold text-gray-900 mb-1">Perguntas Frequentes</h4>
          <p className="text-sm text-gray-600">Respostas para dúvidas comuns</p>
        </button>
        <button 
          onClick={() => setIsSupportModalOpen(true)}
          className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <h4 className="font-semibold text-gray-900 mb-1">Contatar Suporte</h4>
          <p className="text-sm text-gray-600">Entre em contato, envie sugestões ou relate problemas</p>
        </button>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'profile':
        return renderProfileView();
      case 'settings':
        return renderSettingsView();
      case 'subscription':
        return renderSubscriptionView();
      case 'savedPlants':
        return renderSavedPlantsView();
      case 'history':
        return renderHistoryView();
      case 'statistics':
        return renderStatisticsView();
      case 'reminders':
        return renderRemindersView();
      case 'privacy':
        return renderPrivacyView();
      case 'email':
        return renderEmailView();
      case 'help':
        return renderHelpView();
      case 'password':
        return renderPasswordView();
      default:
        return renderMainView();
    }
  };
  
  const renderPasswordView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setCurrentView('settings')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">Alterar Senha</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Senha Atual</label>
          <input
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
            placeholder="Digite sua senha atual"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Nova Senha</label>
          <input
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">Confirmar Nova Senha</label>
          <input
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
            placeholder="Digite a senha novamente"
          />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Dica:</strong> Use uma senha forte com pelo menos 6 caracteres, incluindo letras e números.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSavePassword}
            className="flex-1 bg-nature-600 text-white py-2.5 rounded-lg font-medium hover:bg-nature-700 transition-colors"
          >
            Alterar Senha
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          {t('footer_developed_by')}
        </p>
      </div>
    </div>
  );

  return (
    <>
      <FAQModal 
        isOpen={isFAQModalOpen} 
        onClose={() => setIsFAQModalOpen(false)} 
      />
      <SupportModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
      />
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative transition-all duration-300 max-h-[85vh] overflow-y-auto">
          {/* Fixed Close Button */}
          <button 
            onClick={onClose} 
            className="fixed top-6 right-6 z-[70] bg-black/20 hover:bg-black/40 text-white p-2.5 rounded-full transition-colors backdrop-blur-sm shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>
        {renderContent()}
      </div>
    </div>
    </>
  );
};
