
import React from 'react';
import { X, Shield, FileDown } from './Icons';
import { useLanguage } from '../i18n';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
  const { language } = useLanguage();
  
  if (!isOpen) return null;

  const isPt = language === 'pt';

  const content = {
    privacy: {
      title: isPt ? "Política de Privacidade" : "Privacy Policy",
      text: isPt ? (
        <div className="space-y-4 text-gray-600">
          <p><strong>Última atualização:</strong> {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-lg font-bold text-gray-900 mt-4">1. Coleta de Dados</h3>
          <p>Coletamos informações que você nos fornece diretamente, como seu endereço de e-mail ao criar uma conta, e as imagens de plantas que você envia para análise. Não vendemos seus dados pessoais para terceiros.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">2. Uso da Inteligência Artificial</h3>
          <p>As imagens enviadas são processadas por algoritmos de Inteligência Artificial para identificação e diagnóstico. Embora utilizemos medidas de segurança, evite enviar imagens que contenham rostos de pessoas ou informações sensíveis ao fundo.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">3. Armazenamento</h3>
          <p>Seus dados de "Meu Jardim" são armazenados de forma segura utilizando serviços de nuvem criptografados. Você pode solicitar a exclusão dos seus dados a qualquer momento através das configurações do perfil.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">4. Cookies e Analytics</h3>
          <p>Utilizamos cookies essenciais para manter sua sessão ativa e ferramentas anônimas de análise para melhorar a performance do aplicativo.</p>
        </div>
      ) : (
        <div className="space-y-4 text-gray-600">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-lg font-bold text-gray-900 mt-4">1. Data Collection</h3>
          <p>We collect information you provide directly, such as your email address when creating an account, and the plant images you upload for analysis. We do not sell your personal data to third parties.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">2. Use of AI</h3>
          <p>Uploaded images are processed by Artificial Intelligence algorithms for identification and diagnosis. While we use security measures, please avoid uploading images containing faces or sensitive background information.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">3. Storage</h3>
          <p>Your "My Garden" data is securely stored using encrypted cloud services. You may request data deletion at any time via your profile settings.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">4. Cookies & Analytics</h3>
          <p>We use essential cookies to keep your session active and anonymous analytics tools to improve application performance.</p>
        </div>
      )
    },
    terms: {
      title: isPt ? "Termos de Serviço" : "Terms of Service",
      text: isPt ? (
        <div className="space-y-4 text-gray-600">
          <p><strong>Última atualização:</strong> {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-lg font-bold text-gray-900 mt-4">1. Aceitação dos Termos</h3>
          <p>Ao utilizar o BotanicMD, você concorda com estes termos. Se você não concorda, por favor, não use o aplicativo.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">2. Natureza Informativa (Isenção de Responsabilidade)</h3>
          <p className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-800 font-medium">
            O BotanicMD utiliza Inteligência Artificial para fornecer informações botânicas. <strong>Este aplicativo não substitui aconselhamento profissional.</strong>
            <br/><br/>
            Para diagnósticos de saúde de plantas em plantações comerciais, consulte um engenheiro agrônomo.
            <br/><br/>
            <strong>Importante:</strong> As informações sobre propriedades medicinais e toxicidade são apenas para fins educacionais. Nunca ingira plantas ou prepare remédios caseiros sem a orientação de um médico ou especialista. O BotanicMD não se responsabiliza por reações alérgicas ou envenenamento.
          </p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">3. Planos e Pagamentos</h3>
          <p>O plano Gratuito possui limitações de uso. O plano Pro é uma assinatura mensal recorrente que pode ser cancelada a qualquer momento. Não oferecemos reembolso para períodos parciais não utilizados.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">4. Uso Aceitável</h3>
          <p>Você concorda em não usar o serviço para fins ilegais, não tentar realizar engenharia reversa do aplicativo e não sobrecarregar nossos servidores intencionalmente.</p>
        </div>
      ) : (
        <div className="space-y-4 text-gray-600">
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
          
          <h3 className="text-lg font-bold text-gray-900 mt-4">1. Acceptance of Terms</h3>
          <p>By using BotanicMD, you agree to these terms. If you do not agree, please do not use the app.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">2. Informational Nature (Disclaimer)</h3>
          <p className="bg-red-50 p-3 rounded-lg border border-red-100 text-red-800 font-medium">
            BotanicMD uses Artificial Intelligence to provide botanical information. <strong>This app does not replace professional advice.</strong>
            <br/><br/>
            For plant health diagnoses in commercial crops, consult an agronomist.
            <br/><br/>
            <strong>Important:</strong> Information regarding medicinal properties and toxicity is for educational purposes only. Never ingest plants or prepare home remedies without the guidance of a doctor or specialist. BotanicMD is not responsible for allergic reactions or poisoning.
          </p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">3. Plans & Payments</h3>
          <p>The Free plan has usage limitations. The Pro plan is a recurring monthly subscription that can be canceled at any time. We do not offer refunds for partial unused periods.</p>

          <h3 className="text-lg font-bold text-gray-900 mt-4">4. Acceptable Use</h3>
          <p>You agree not to use the service for illegal purposes, not to attempt to reverse engineer the application, and not to intentionally overload our servers.</p>
        </div>
      )
    }
  };

  const currentContent = type === 'privacy' ? content.privacy : content.terms;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-nature-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-nature-600 shadow-sm">
              {type === 'privacy' ? <Shield className="w-6 h-6" /> : <FileDown className="w-6 h-6" />}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{currentContent.title}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-full transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-8 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {currentContent.text}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            {isPt ? 'Fechar' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
