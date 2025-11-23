import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileDown } from '../components/Icons';
import { useLanguage } from '../i18n';
import { SEOHead } from '../components/SEOHead';

export const TermsPage: React.FC = () => {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const isPt = language === 'pt';

  const content = {
    title: isPt ? "Termos de Serviço" : "Terms of Service",
    text: isPt ? (
      <div className="space-y-6 text-gray-600 prose prose-gray max-w-none">
        <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
        
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p>Ao utilizar o BotanicMD, você concorda com estes termos. Se você não concorda, por favor, não use o aplicativo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Natureza Informativa (Isenção de Responsabilidade)</h2>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800 font-medium mt-4">
            <p className="mb-2">
              O BotanicMD utiliza Inteligência Artificial para fornecer informações botânicas. <strong>Este aplicativo não substitui aconselhamento profissional.</strong>
            </p>
            <p className="mb-2">
              Para diagnósticos de saúde de plantas em plantações comerciais, consulte um engenheiro agrônomo.
            </p>
            <p>
              <strong>Importante:</strong> As informações sobre propriedades medicinais e toxicidade são apenas para fins educacionais. Nunca ingira plantas ou prepare remédios caseiros sem a orientação de um médico ou especialista. O BotanicMD não se responsabiliza por reações alérgicas ou envenenamento.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Planos e Pagamentos</h2>
          <p>O plano Gratuito possui limitações de uso. O plano Pro é uma assinatura mensal recorrente que pode ser cancelada a qualquer momento. Não oferecemos reembolso para períodos parciais não utilizados.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Uso Aceitável</h2>
          <p>Você concorda em não usar o serviço para fins ilegais, não tentar realizar engenharia reversa do aplicativo e não sobrecarregar nossos servidores intencionalmente.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Propriedade Intelectual</h2>
          <p>Todos os direitos de propriedade intelectual do BotanicMD são reservados. O conteúdo gerado pela IA é fornecido "como está" e pode conter erros.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Limitação de Responsabilidade</h2>
          <p>O BotanicMD não se responsabiliza por danos diretos ou indiretos resultantes do uso ou impossibilidade de uso do aplicativo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Alterações nos Termos</h2>
          <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após a publicação.</p>
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
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By using BotanicMD, you agree to these terms. If you do not agree, please do not use the app.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Informational Nature (Disclaimer)</h2>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-red-800 font-medium mt-4">
            <p className="mb-2">
              BotanicMD uses Artificial Intelligence to provide botanical information. <strong>This app does not replace professional advice.</strong>
            </p>
            <p className="mb-2">
              For plant health diagnoses in commercial crops, consult an agronomist.
            </p>
            <p>
              <strong>Important:</strong> Information regarding medicinal properties and toxicity is for educational purposes only. Never ingest plants or prepare home remedies without the guidance of a doctor or specialist. BotanicMD is not responsible for allergic reactions or poisoning.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Plans & Payments</h2>
          <p>The Free plan has usage limitations. The Pro plan is a recurring monthly subscription that can be canceled at any time. We do not offer refunds for partial unused periods.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Acceptable Use</h2>
          <p>You agree not to use the service for illegal purposes, not to attempt to reverse engineer the application, and not to intentionally overload our servers.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Intellectual Property</h2>
          <p>All intellectual property rights of BotanicMD are reserved. AI-generated content is provided "as is" and may contain errors.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
          <p>BotanicMD is not liable for direct or indirect damages resulting from the use or inability to use the application.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Changes will take effect immediately after publication.</p>
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
          ? "Termos de Serviço do BotanicMD - Leia os termos e condições de uso do aplicativo."
          : "BotanicMD Terms of Service - Read the terms and conditions of use of the application."
        }
        url="https://botanicmd.com/terms"
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
              <FileDown className="w-8 h-8" />
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

