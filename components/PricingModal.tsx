
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
      className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all flex flex-col justify-between min-h-[120px] ${
        selectedPlan === type 
          ? 'border-nature-600 bg-nature-50 shadow-md scale-[1.02]' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      {bestValue && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm z-10 whitespace-nowrap">
          {t('best_value')}
        </div>
      )}
      {savings && (
        <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
          {savings}
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-2">
         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === type ? 'border-nature-600' : 'border-gray-300'}`}>
            {selectedPlan === type && <div className="w-2.5 h-2.5 rounded-full bg-nature-600" />}
         </div>
         <span className="font-bold text-gray-800">{t(`plan_${type}` as any)}</span>
      </div>
      
      <div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-gray-900">{price}</span>
            {period && <span className="text-sm text-gray-500">/{period}</span>}
        </div>
        {equivalent && <div className="text-xs text-nature-600 font-semibold mt-1">{equivalent}</div>}
        {type === 'lifetime' && <div className="text-xs text-gray-500 mt-1 leading-tight">{t('lifetime_desc')}</div>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] md:h-auto overflow-y-auto md:overflow-visible">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-20 p-2 bg-white/50 rounded-full">
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Value Prop (Urgency) */}
        <div className="bg-gray-900 p-8 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1463936575829-25148e1db1b8?q=80&w=1000&auto=format&fit=crop')] bg-cover opacity-20 mix-blend-overlay"></div>
           <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 border border-yellow-500/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6 text-yellow-300">
                <Star className="w-3 h-3 fill-yellow-300" /> BotanicMD PRO
              </div>
              <h2 className="text-3xl font-bold mb-4 leading-tight">
                {t('hero_title')}<br/>
                <span className="text-nature-400">{t('hero_highlight')}</span>
              </h2>
              <p className="text-gray-300 text-sm mb-8 leading-relaxed flex-1">
                 {t('hero_subtitle')}
              </p>
              
              <div className="space-y-3">
                 <div className="flex items-center gap-3 text-sm">
                   <div className="bg-nature-500/20 p-1 rounded"><CheckCircle className="w-4 h-4 text-nature-400" /></div>
                   <span>{t('feature_health')}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm">
                   <div className="bg-nature-500/20 p-1 rounded"><CheckCircle className="w-4 h-4 text-nature-400" /></div>
                   <span>{t('feature_full_care')}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm">
                   <div className="bg-nature-500/20 p-1 rounded"><CheckCircle className="w-4 h-4 text-nature-400" /></div>
                   <span>{t('feature_unlimited')}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Side: Pricing Options */}
        <div className="p-6 md:p-8 md:w-3/5 bg-white flex flex-col">
           <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{t('upgrade_plan')}</h3>
              <p className="text-sm text-gray-500">Choose the plan that fits your garden.</p>
           </div>

           <div className="space-y-3 mb-6 flex-1">
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
            className={`w-full bg-nature-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-nature-200 hover:bg-nature-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 ${isLoading ? 'opacity-75 cursor-wait' : 'animate-pulse-slow'}`}
          >
             {isLoading ? (
               <>
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                 Processing...
               </>
             ) : (
                <>
                 {t('upgrade_plan')} <Star className="w-5 h-5" />
               </>
             )}
           </button>

           <div className="mt-6 text-center text-xs text-gray-400 flex flex-col gap-2">
              <p className="flex items-center justify-center gap-1">
                 <Lock className="w-3 h-3" /> {t('secure_payment')}
              </p>
              <p>
                 By continuing, you agree to the Terms of Service and Privacy Policy. 
                 Subscription auto-renews unless canceled.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};
