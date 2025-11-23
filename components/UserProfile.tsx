
import React, { useState } from 'react';
import { User, Settings, LogOut, CreditCard, X, Star, Trophy, ArrowRight, CheckCircle, Leaf, LayoutDashboard, Users, Bookmark, Clock, TrendingUp, Shield, HelpCircle, Mail, Lock, Share2, FileDown, Calendar } from './Icons';
import { useLanguage } from '../i18n';
import { User as UserType, SupportedLanguage } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  user: UserType;
  onClose: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  onAdmin?: () => void;
  onOpenAbout: () => void;
}

type ViewState = 'main' | 'profile' | 'settings' | 'subscription';

export const UserProfile: React.FC<UserProfileProps> = ({ user, onClose, onLogout, onUpgrade, onAdmin, onOpenAbout }) => {
  const { t, language, setLanguage } = useLanguage();
  const { updateProfile } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [editName, setEditName] = useState(user.name);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [nameError, setNameError] = useState<string>('');

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
           <button 
            onClick={onClose} 
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Info */}
        <div className="px-4 pb-4 relative">
          <div className="relative -mt-12 mb-3">
            <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg mx-auto">
              <div className="w-full h-full rounded-full bg-nature-100 flex items-center justify-center text-xl font-bold text-nature-700">
                {getInitials(user.name)}
              </div>
            </div>
            <div className="absolute bottom-0 right-1/2 translate-x-10 translate-y-1">
               <span className={`px-2 py-0.5 rounded-full text-xs font-bold border border-white shadow-sm ${user.plan === 'pro' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-700'}`}>
                 {user.plan === 'pro' ? 'PRO' : 'FREE'}
               </span>
            </div>
          </div>

          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">{user.name}</h2>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          {/* Usage Stats */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
             <div className="flex justify-between items-center mb-1.5">
               <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('usage_limit')}</span>
               <span className="text-xs font-medium text-gray-700">
                 {user.maxUsage === -1 ? '∞' : `${usageCount} / ${maxUsage}`}
               </span>
             </div>
             <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
               <div 
                  className={`h-full rounded-full transition-all duration-500 ${user.plan === 'pro' ? 'bg-yellow-400' : 'bg-nature-500'}`} 
                  style={{ width: user.maxUsage === -1 ? '100%' : `${percentage}%` }} 
               />
             </div>
             {user.plan === 'free' && (
               <button 
                 onClick={onUpgrade}
                 className="w-full mt-2 text-xs font-bold text-nature-600 hover:text-nature-700 flex items-center justify-center gap-1"
               >
                 <Star className="w-3 h-3" /> {t('upgrade_plan')}
               </button>
             )}
          </div>

          {/* Actions Menu */}
          <div className="space-y-1">
            <button 
                onClick={() => setCurrentView('profile')}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><User className="w-4 h-4" /></div>
               <span className="font-medium flex-1 text-sm">{t('profile')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
            
             {/* Admin Button - Always visible for demo */}
             <button 
                onClick={() => { onClose(); if(onAdmin) onAdmin(); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-1.5 bg-gray-900 rounded-lg text-white"><LayoutDashboard className="w-4 h-4" /></div>
               <span className="font-medium flex-1 text-sm">Admin Panel</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>

            <button 
                onClick={() => setCurrentView('settings')}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><Settings className="w-4 h-4" /></div>
               <span className="font-medium flex-1 text-sm">{t('settings')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>
            <button 
                onClick={() => setCurrentView('subscription')}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><CreditCard className="w-4 h-4" /></div>
               <span className="font-medium flex-1 text-sm">{t('subscription')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>

            <button 
                onClick={() => { onClose(); onOpenAbout(); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left"
            >
               <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500"><Users className="w-4 h-4" /></div>
               <span className="font-medium flex-1 text-sm">{t('about_us')}</span>
               <ArrowRight className="w-4 h-4 text-gray-300" />
            </button>

            <button 
                onClick={() => { if(window.confirm(t('logout_confirm'))) { onLogout(); } }}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors text-left"
            >
               <div className="p-1.5 bg-red-100 rounded-lg"><LogOut className="w-4 h-4" /></div>
               <span className="font-medium flex-1 text-sm">Logout</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Desenvolvido com <span className="text-red-500">♥</span> por <span className="font-semibold text-nature-600">Egeolabs</span>
            </p>
          </div>
        </div>
    </>
  );

  const renderProfileView = () => (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">{t('edit_profile')}</h3>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600 block mb-1">{t('your_name')}</label>
          <input 
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-nature-300"
          />
        </div>
        
        {/* Additional Profile Options */}
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-nature-100 rounded-lg text-nature-600"><Bookmark className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Plantas Salvas</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Clock className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Histórico</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600"><TrendingUp className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Estatísticas</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-green-100 rounded-lg text-green-600"><Calendar className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Lembretes</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>
        
        <button 
          onClick={handleSaveProfile}
          className="w-full bg-nature-600 text-white py-2.5 rounded-lg font-bold hover:bg-nature-700 transition-colors mt-4"
        >
          {t('save_changes')}
        </button>
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Desenvolvido com <span className="text-red-500">♥</span> por <span className="font-semibold text-nature-600">Egeolabs</span>
        </p>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">{t('settings')}</h3>
      </div>
      <div className="space-y-3">
        <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg">
          <label htmlFor="notifications" className="font-medium text-gray-700 text-sm">{t('enable_notifications')}</label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" name="toggle" id="notifications" checked={notificationsEnabled} onChange={() => setNotificationsEnabled(!notificationsEnabled)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
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
          </select>
        </div>

        {/* Additional Settings Options */}
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600"><Shield className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Privacidade e Segurança</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600"><Mail className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Notificações por Email</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600"><Lock className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Alterar Senha</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600"><Share2 className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Compartilhar App</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600"><FileDown className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Exportar Dados</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
          
          <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors text-left">
            <div className="p-1.5 bg-gray-100 rounded-lg text-gray-600"><HelpCircle className="w-4 h-4" /></div>
            <span className="font-medium flex-1 text-sm">Ajuda e Suporte</span>
            <ArrowRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Desenvolvido com <span className="text-red-500">♥</span> por <span className="font-semibold text-nature-600">Egeolabs</span>
        </p>
      </div>
    </div>
  );

  const renderSubscriptionView = () => (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowRight className="w-5 h-5 rotate-180" /></button>
        <h3 className="text-lg font-bold text-gray-900">{t('subscription')}</h3>
      </div>
      <div className="bg-nature-50 border border-nature-200 rounded-2xl p-6 text-center">
        <Trophy className="w-12 h-12 text-nature-600 mx-auto mb-4" />
        <h4 className="font-bold text-lg text-gray-900">{t('current_plan')}: {user.plan === 'pro' ? 'PRO' : 'Free'}</h4>
        {user.plan === 'pro' && (
          <p className="text-sm text-gray-500 mt-1">{t('plan_renewal')} 2024-12-31</p>
        )}
        {user.plan === 'free' && (
          <button 
            onClick={onUpgrade}
            className="mt-4 bg-nature-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
          >
            <Star className="w-4 h-4" /> {t('upgrade_plan')}
          </button>
        )}
      </div>
      {user.plan === 'pro' && (
         <div className="mt-4 space-y-2">
            <button className="w-full text-center text-sm text-gray-500 hover:text-gray-800 font-medium">{t('manage_sub')}</button>
            <button 
               onClick={handleCancelSubscription}
               className="w-full text-center text-sm text-red-500 hover:text-red-700 font-medium"
            >
               {t('cancel_subscription')}
            </button>
         </div>
      )}
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          Desenvolvido com <span className="text-red-500">♥</span> por <span className="font-semibold text-nature-600">Egeolabs</span>
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
      default:
        return renderMainView();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl relative transition-all duration-300 max-h-[85vh] overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};
