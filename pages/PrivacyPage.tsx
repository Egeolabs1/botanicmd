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
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1. Dados Coletados</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Dados de cadastro:</strong> Nome, e-mail e senha (criptografada)</li>
            <li><strong>Dados de uso:</strong> Imagens de plantas enviadas, histórico de identificações, plantas salvas no "Meu Jardim"</li>
            <li><strong>Dados de assinatura:</strong> Informações de pagamento processadas pelo Stripe (não armazenamos dados de cartão)</li>
            <li><strong>Dados técnicos:</strong> Cookies essenciais para autenticação e sessão</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2. Base Legal (LGPD)</h3>
          <p>O tratamento dos seus dados pessoais é baseado em:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Consentimento (Art. 7º, I):</strong> Para cadastro e uso do serviço</li>
            <li><strong>Execução de contrato (Art. 7º, V):</strong> Para prestação do serviço de identificação de plantas</li>
            <li><strong>Legítimo interesse (Art. 7º, IX):</strong> Para melhorias e segurança do serviço</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Uso da Inteligência Artificial</h2>
          <p>As imagens enviadas são processadas por algoritmos de Inteligência Artificial para identificação e diagnóstico. Embora utilizemos medidas de segurança, evite enviar imagens que contenham rostos de pessoas ou informações sensíveis ao fundo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Armazenamento e Retenção</h2>
          <p>Seus dados de "Meu Jardim" são armazenados de forma segura utilizando serviços de nuvem criptografados. Você pode solicitar a exclusão dos seus dados a qualquer momento através das configurações do perfil.</p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1. Tempo de Retenção</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Dados da conta:</strong> Mantidos enquanto sua conta estiver ativa. Após exclusão, dados são removidos em até 30 dias.</li>
            <li><strong>Dados de assinatura:</strong> Mantidos conforme exigências legais e fiscais (até 5 anos após término da assinatura)</li>
            <li><strong>Imagens de plantas:</strong> Armazenadas enquanto você mantiver a planta salva. Podem ser excluídas a qualquer momento.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2. Transferência Internacional</h3>
          <p>Seus dados podem ser processados e armazenados em servidores localizados fora do Brasil, especificamente:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Supabase:</strong> Serviços de nuvem (pode processar dados em servidores nos EUA e Europa)</li>
            <li><strong>Stripe:</strong> Processamento de pagamentos (servidores nos EUA, em conformidade com PCI-DSS)</li>
            <li><strong>Google:</strong> Para autenticação social (quando você usa login com Google)</li>
          </ul>
          <p className="mt-3 text-gray-600">Esses serviços possuem salvaguardas adequadas de proteção de dados e estão em conformidade com padrões internacionais de segurança.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Cookies e Analytics</h2>
          <p>Utilizamos cookies essenciais para manter sua sessão ativa e ferramentas anônimas de análise para melhorar a performance do aplicativo.</p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1. Tipos de Cookies</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Cookies Essenciais:</strong> Necessários para autenticação e funcionamento do serviço (não requerem consentimento)</li>
            <li><strong>Cookies de Análise:</strong> Usados para melhorar a experiência do usuário (anônimos, sem identificação pessoal)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Seus Direitos (LGPD)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018), você possui os seguintes direitos:</p>
          
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-4">
            <li><strong>Acesso (Art. 18, I):</strong> Confirmar a existência de tratamento e acessar seus dados</li>
            <li><strong>Correção (Art. 18, II):</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Anonimização, bloqueio ou eliminação (Art. 18, III):</strong> Solicitar exclusão de dados desnecessários ou excessivos</li>
            <li><strong>Portabilidade (Art. 18, V):</strong> Exportar seus dados em formato estruturado (disponível nas configurações do perfil)</li>
            <li><strong>Eliminação (Art. 18, VI):</strong> Excluir permanentemente sua conta e todos os dados (disponível nas configurações do perfil)</li>
            <li><strong>Revogação de consentimento (Art. 18, VIII):</strong> Revogar seu consentimento a qualquer momento</li>
          </ul>

          <p className="mt-4 text-gray-600">Para exercer esses direitos, você pode:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-2">
            <li>Usar as funcionalidades disponíveis nas configurações do perfil (exportar dados, excluir conta)</li>
            <li>Entrar em contato através do email: <strong>suport.botanicmd@egeolabs.com</strong></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Alterações nesta Política</h2>
          <p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas publicando a nova política nesta página.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Compartilhamento com Terceiros</h2>
          <p>Compartilhamos seus dados apenas com os seguintes prestadores de serviço, necessários para o funcionamento da plataforma:</p>
          
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-4">
            <li><strong>Supabase:</strong> Hospedagem de banco de dados e autenticação (conforme política de privacidade do Supabase)</li>
            <li><strong>Stripe:</strong> Processamento de pagamentos (conforme política de privacidade do Stripe - PCI-DSS compliant)</li>
            <li><strong>Google:</strong> Autenticação social (apenas se você usar login com Google, conforme política do Google)</li>
          </ul>
          
          <p className="mt-4 text-gray-600">Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing ou publicidade.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Encarregado de Proteção de Dados (DPO)</h2>
          <p>Para questões relacionadas à proteção de dados pessoais e exercício de direitos previstos na LGPD, entre em contato:</p>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700"><strong>Email:</strong> suport.botanicmd@egeolabs.com</p>
            <p className="text-gray-700 mt-2"><strong>Assunto:</strong> LGPD / Proteção de Dados</p>
          </div>
        </section>

        <section className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>Contato Geral:</strong> suport.botanicmd@egeolabs.com
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>
        </section>
      </div>
    ) : (
      <div className="space-y-6 text-gray-600 prose prose-gray max-w-none">
        <p><strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US')}</p>
        
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Data Collection</h2>
          <p>We collect information you provide directly, such as your email address when creating an account, and the plant images you upload for analysis. We do not sell your personal data to third parties.</p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1. Data Collected</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Registration data:</strong> Name, email, and password (encrypted)</li>
            <li><strong>Usage data:</strong> Plant images uploaded, identification history, saved plants in "My Garden"</li>
            <li><strong>Subscription data:</strong> Payment information processed by Stripe (we do not store card data)</li>
            <li><strong>Technical data:</strong> Essential cookies for authentication and session</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2. Legal Basis (GDPR/LGPD)</h3>
          <p>The processing of your personal data is based on:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Consent (Art. 7, I):</strong> For registration and service use</li>
            <li><strong>Contract execution (Art. 7, V):</strong> For providing plant identification service</li>
            <li><strong>Legitimate interest (Art. 7, IX):</strong> For service improvements and security</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use of AI</h2>
          <p>Uploaded images are processed by Artificial Intelligence algorithms for identification and diagnosis. While we use security measures, please avoid uploading images containing faces or sensitive background information.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Storage and Retention</h2>
          <p>Your "My Garden" data is securely stored using encrypted cloud services. You may request data deletion at any time via your profile settings.</p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1. Retention Period</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Account data:</strong> Kept while your account is active. After deletion, data is removed within 30 days.</li>
            <li><strong>Subscription data:</strong> Kept as required by legal and tax requirements (up to 5 years after subscription ends)</li>
            <li><strong>Plant images:</strong> Stored while you keep the plant saved. Can be deleted at any time.</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2. International Transfer</h3>
          <p>Your data may be processed and stored on servers located outside Brazil, specifically:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Supabase:</strong> Cloud services (may process data on servers in USA and Europe)</li>
            <li><strong>Stripe:</strong> Payment processing (servers in USA, PCI-DSS compliant)</li>
            <li><strong>Google:</strong> For social authentication (when you use Google login)</li>
          </ul>
          <p className="mt-3 text-gray-600">These services have adequate data protection safeguards and are in compliance with international security standards.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Cookies & Analytics</h2>
          <p>We use essential cookies to keep your session active and anonymous analytics tools to improve application performance.</p>
          
          <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1. Types of Cookies</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li><strong>Essential Cookies:</strong> Required for authentication and service functionality (no consent required)</li>
            <li><strong>Analytics Cookies:</strong> Used to improve user experience (anonymous, no personal identification)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Your Rights (GDPR/LGPD)</h2>
          <p>Under the General Data Protection Law (LGPD - Law 13.709/2018) and GDPR, you have the following rights:</p>
          
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-4">
            <li><strong>Access (Art. 18, I):</strong> Confirm the existence of processing and access your data</li>
            <li><strong>Correction (Art. 18, II):</strong> Request correction of incomplete, inaccurate, or outdated data</li>
            <li><strong>Anonymization, blocking, or deletion (Art. 18, III):</strong> Request deletion of unnecessary or excessive data</li>
            <li><strong>Portability (Art. 18, V):</strong> Export your data in structured format (available in profile settings)</li>
            <li><strong>Deletion (Art. 18, VI):</strong> Permanently delete your account and all data (available in profile settings)</li>
            <li><strong>Revocation of consent (Art. 18, VIII):</strong> Revoke your consent at any time</li>
          </ul>

          <p className="mt-4 text-gray-600">To exercise these rights, you can:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-2">
            <li>Use the features available in profile settings (export data, delete account)</li>
            <li>Contact us via email: <strong>suport.botanicmd@egeolabs.com</strong></li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">6. Changes to This Policy</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on this page.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">7. Sharing with Third Parties</h2>
          <p>We share your data only with the following service providers, necessary for the platform's operation:</p>
          
          <ul className="list-disc list-inside space-y-2 text-gray-600 mt-4">
            <li><strong>Supabase:</strong> Database hosting and authentication (according to Supabase privacy policy)</li>
            <li><strong>Stripe:</strong> Payment processing (according to Stripe privacy policy - PCI-DSS compliant)</li>
            <li><strong>Google:</strong> Social authentication (only if you use Google login, according to Google policy)</li>
          </ul>
          
          <p className="mt-4 text-gray-600">We do not sell, rent, or share your personal data with third parties for marketing or advertising purposes.</p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">8. Data Protection Officer (DPO)</h2>
          <p>For questions related to personal data protection and exercise of rights under LGPD, contact:</p>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700"><strong>Email:</strong> suport.botanicmd@egeolabs.com</p>
            <p className="text-gray-700 mt-2"><strong>Subject:</strong> LGPD / Data Protection</p>
          </div>
        </section>

        <section className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>General Contact:</strong> suport.botanicmd@egeolabs.com
          </p>
          <p className="text-sm text-gray-500 mt-2">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US')}
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
        url="https://botanicmd.com/privacy"
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

