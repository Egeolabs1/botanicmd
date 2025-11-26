
import React, { useState } from 'react';
import { X, CheckCircle, Star, Shield, Lock } from './Icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../i18n';
import { initiateCheckout, PlanType } from '../services/paymentService';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  const { user, login } = useAuth(); // Precisamos garantir que o usuário esteja logado ou criar um anônimo
  const { t, language } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      if (!user) {
        // Força login/cadastro antes de pagar, ou o Stripe não saberá quem pagou
        alert("Por favor, faça login ou crie uma conta antes de assinar.");
        onClose();
        // Idealmente abriria o AuthModal aqui
        setIsLoading(false);
        return;
      }

      await initiateCheckout(selectedPlan, language);
      // Se o usuário cancelar a simulação, o código continua aqui.
      // Se redirecionar, a página muda e o state não importa.
      setIsLoading(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao conectar com o pagamento.");
      setIsLoading(false);
    }
  };

  const PlanOption = ({ type, price, period, bestValue = false, savings = "", equivalent = "" }: { type: PlanType, price: string, period: string, bestValue?: boolean, savings?: string, equivalent?: string }) => (
    <div 
      onClick={() => setSelectedPlan(type)}
      className={`relative rounded-xl border-2 p-3 sm:p-4 cursor-pointer transition-all flex flex-col justify-between min-h-[100px] sm:min-h-[120px] ${
        selectedPlan === type 
          ? 'border-nature-600 bg-nature-50 shadow-md' 
          : 'border-gray-200 active:border-gray-300 bg-white'
      }`}
    >
      {bestValue && (
        <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-sm z-10 whitespace-nowrap">
          {t('best_value')}
        </div>
      )}
      {savings && (
        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 bg-green-100 text-green-700 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md">
          {savings}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
         <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === type ? 'border-nature-600' : 'border-gray-300'}`}>
            {selectedPlan === type && <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-nature-600" />}
         </div>
         <span className="font-bold text-sm sm:text-base text-gray-800">{t(`plan_${type}` as any)}</span>
      </div>
      
      <div>
        <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold text-gray-900">{price}</span>
            {period && <span className="text-xs sm:text-sm text-gray-500">/{period}</span>}
        </div>
        {equivalent && <div className="text-[10px] sm:text-xs text-nature-600 font-semibold mt-0.5 sm:mt-1">{equivalent}</div>}
        {type === 'lifetime' && <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-tight">{t('lifetime_desc')}</div>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl relative flex flex-col md:flex-row max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 z-20 p-1.5 sm:p-2 bg-white/80 sm:bg-white/50 rounded-full">
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Left Side: Value Prop (Hidden on mobile, shown on desktop) */}
        <div className="hidden md:flex bg-gray-900 p-6 lg:p-8 w-2/5 text-white flex-col justify-between relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1463936575829-25148e1db1b8?q=80&w=1000&auto=format&fit=crop')] bg-cover opacity-20 mix-blend-overlay"></div>
           <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 lg:mb-6 text-yellow-300">
                <Star className="w-3 h-3 fill-yellow-300" /> BotanicMD PRO
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3 lg:mb-4 leading-tight">
                {t('hero_title')}<br/>
                <span className="text-nature-400">{t('hero_highlight')}</span>
              </h2>
              <p className="text-gray-300 text-xs lg:text-sm mb-6 lg:mb-8 leading-relaxed flex-1">
                 {t('hero_subtitle')}
              </p>
              
              <div className="space-y-2 lg:space-y-3">
                 <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                   <div className="bg-nature-500/20 p-1 rounded"><CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-nature-400" /></div>
                   <span>{t('feature_health')}</span>
                 </div>
                 <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                   <div className="bg-nature-500/20 p-1 rounded"><CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-nature-400" /></div>
                   <span>{t('feature_full_care')}</span>
                 </div>
                 <div className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm">
                   <div className="bg-nature-500/20 p-1 rounded"><CheckCircle className="w-3 h-3 lg:w-4 lg:h-4 text-nature-400" /></div>
                   <span>{t('feature_unlimited')}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Pricing Options */}
        <div className="p-4 sm:p-6 md:p-8 md:w-full lg:w-3/5 bg-white flex flex-col overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
           {/* Mobile Header with PRO badge */}
           <div className="md:hidden mb-4 text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 text-yellow-700">
                <Star className="w-3 h-3 fill-yellow-600" /> BotanicMD PRO
              </div>
           </div>
           
           <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">{t('upgrade_plan')}</h3>
              <p className="text-xs sm:text-sm text-gray-500">Choose the plan that fits your garden.</p>
           </div>

           <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-1 min-h-0">
              <PlanOption 
                type="monthly" 
                price={t('price_monthly')} 
                period="mo"
              />
              <PlanOption 
                type="annual" 
                price={t('price_annual')} 
                period="yr" 
                bestValue={true}
                savings={t('save_percent')}
                equivalent={t('per_month_equiv')}
              />
              <PlanOption 
                type="lifetime" 
                price={t('price_lifetime')} 
                period="" 
              />
           </div>

           <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`w-full bg-nature-600 text-white py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg shadow-nature-200 hover:bg-nature-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
          >
             {isLoading ? (
               <>
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 Processing...
               </>
             ) : (
                <>
                 {t('upgrade_plan')} <Star className="w-4 h-4 sm:w-5 sm:h-5" />
               </>
             )}
           </button>

           <div className="mt-4 sm:mt-6 text-center text-[10px] sm:text-xs text-gray-400 flex flex-col gap-1 sm:gap-2">
              <p className="flex items-center justify-center gap-1">
                 <Lock className="w-3 h-3" /> {t('secure_payment')}
              </p>
              <p className="leading-tight">
                 By continuing, you agree to the Terms of Service and Privacy Policy. 
                 Subscription auto-renews unless canceled.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
