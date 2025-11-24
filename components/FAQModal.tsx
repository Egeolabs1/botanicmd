import React from 'react';
import { X, HelpCircle } from './Icons';
import { useLanguage } from '../i18n';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  const faqs = [
    {
      question: 'Como identificar uma planta?',
      answer: 'Tire uma foto ou digite o nome da planta. O app usará IA para identificar e fornecer informações.'
    },
    {
      question: 'Preciso pagar para usar?',
      answer: 'O plano gratuito permite 3 análises por mês. O plano PRO oferece análises ilimitadas.'
    },
    {
      question: 'Meus dados são seguros?',
      answer: 'Sim, seus dados são armazenados de forma segura. Não compartilhamos informações com terceiros.'
    },
    {
      question: 'Como salvar plantas?',
      answer: 'Apenas usuários PRO podem salvar plantas. Faça upgrade para acessar esta funcionalidade.'
    },
    {
      question: 'O app funciona offline?',
      answer: 'A identificação requer conexão com internet. Plantas salvas podem ser visualizadas offline.'
    }
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-nature-50 to-teal-50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-nature-600 shadow-sm">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Perguntas Frequentes</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-nature-200 transition-colors"
              >
                <h3 className="font-bold text-gray-900 mb-2 flex items-start gap-2">
                  <span className="text-nature-600 font-bold">{index + 1}.</span>
                  {faq.question}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed ml-6">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl flex justify-end">
          <button 
            onClick={onClose}
            className="bg-nature-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-nature-700 transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};


