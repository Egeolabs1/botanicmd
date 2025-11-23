import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Shield } from '../components/Icons';
import { useLanguage } from '../i18n';
import { SEOHead } from '../components/SEOHead';

export const PrivacyPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isPt = language === 'pt';

  const content = {
    title: isPt ? "Política de Privacidade" : "Privacy Policy",
    text: isPt ? (
      <div className="space-y-6 text-gray-600 prose prose-gray max-w-none">
        <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
        
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Coleta de Dados</h2>
          <p>Coletamos informações que você nos fornece diretamente, como seu endereço de e-mail ao criar uma conta, e as imagens de plantas que você envia para análise. Não vendemos seus dados pessoais para terceiros.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Uso da Inteligência Artificial</h2>
          <p>As imagens enviadas são processadas por algoritmos de Inteligência Artificial para identificação e diagnóstico. Embora utilizemos medidas de segurança, evite enviar imagens que contenham rostos de pessoas ou informações sensíveis ao fundo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Armazenamento</h2>
          <p>Seus dados de "Meu Jardim" são armazenados de forma segura utilizando serviços de nuvem criptografados. Você pode solicitar a exclusão dos seus dados a qualquer momento através das configurações do perfil.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Cookies e Analytics</h2>
          <p>Utilizamos cookies essenciais para manter sua sessão ativa e ferramentas anônimas de análise para melhorar a performance do aplicativo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Seus Direitos</h2>
          <p>Você tem o direito de acessar, corrigir ou excluir seus dados pessoais. Para exercer esses direitos, entre em contato conosco através do email de suporte.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Alterações nesta Política</h2>
          <p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas publicando a nova política nesta página.</p>
        </section>

        <section className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>Contato:</strong> suport.botanicmd@egeolabs.com
          </p>
        </section>
      </div>
    ) : (
      <div className="space-y-6 text-gray-600 prose prose-gray max-w-none">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US')}</p>
        
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Data Collection</h2>
          <p>We collect information you provide directly, such as your email address when creating an account, and the plant images you upload for analysis. We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use of AI</h2>
          <p>Uploaded images are processed by Artificial Intelligence algorithms for identification and diagnosis. While we use security measures, please avoid uploading images containing faces or sensitive background information.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Storage</h2>
          <p>Your "My Garden" data is securely stored using encrypted cloud services. You may request data deletion at any time via your profile settings.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Cookies & Analytics</h2>
          <p>We use essential cookies to keep your session active and anonymous analytics tools to improve application performance.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us through the support email.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on this page.</p>
        </section>

        <section className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>Contact:</strong> suport.botanicmd@egeolabs.com
          </p>
        </section>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title={content.title}
        description={isPt 
          ? "Política de Privacidade do BotanicMD - Saiba como coletamos, usamos e protegemos seus dados pessoais."
          : "BotanicMD Privacy Policy - Learn how we collect, use, and protect your personal data."
        }
        url="https://botanicmd.vercel.app/privacy"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowRight className="w-5 h-5 rotate-180" />
            <span className="font-medium">{isPt ? 'Voltar' : 'Back'}</span>
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-nature-100 p-3 rounded-xl text-nature-600">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{content.title}</h1>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          {content.text}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} BotanicMD AI. Desenvolvido com ♥ por Egeolabs.
        </div>
      </div>
    </div>
  );
};

