import React, { useState } from 'react';
import { X, Mail, MessageCircle, AlertCircle, Lightbulb } from './Icons';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_EMAIL = 'suporte.botanicmd@egeolabs.com';

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<'support' | 'suggestion' | 'problem'>('support');

  if (!isOpen) return null;

  const contactTypes = [
    {
      id: 'support' as const,
      title: 'Suporte Geral',
      description: 'Dúvidas, perguntas ou ajuda geral',
      icon: MessageCircle,
      subject: 'Suporte BotanicMD',
      body: 'Olá,\n\n'
    },
    {
      id: 'suggestion' as const,
      title: 'Enviar Sugestão',
      description: 'Compartilhe suas ideias para melhorar o app',
      icon: Lightbulb,
      subject: 'Sugestão BotanicMD',
      body: 'Olá,\n\nDesejo sugerir:\n\n'
    },
    {
      id: 'problem' as const,
      title: 'Relatar Problema',
      description: 'Avise-nos sobre bugs ou problemas encontrados',
      icon: AlertTriangle,
      subject: 'Relatar Problema BotanicMD',
      body: 'Olá,\n\nEncontrei um problema:\n\nDescrição:\n\n'
    }
  ];

  const handleContact = () => {
    const type = contactTypes.find(t => t.id === selectedType);
    if (type) {
      const subject = encodeURIComponent(type.subject);
      const body = encodeURIComponent(type.body);
      window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-nature-50 to-teal-50">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-nature-600 shadow-sm">
              <Mail className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Contatar Suporte</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 hover:bg-white p-2 rounded-full transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            Escolha o tipo de contato e abriremos seu cliente de email:
          </p>
          
          <div className="space-y-3 mb-6">
            {contactTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedType === type.id
                      ? 'border-nature-500 bg-nature-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedType === type.id ? 'bg-nature-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{type.title}</h3>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                    {selectedType === type.id && (
                      <div className="w-5 h-5 rounded-full bg-nature-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-nature-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-nature-700 mb-1">
              <strong>Email:</strong> {SUPPORT_EMAIL}
            </p>
            <p className="text-xs text-nature-600">
              Horário de atendimento: Segunda a Sexta, 9h às 18h
            </p>
          </div>

          <button
            onClick={handleContact}
            className="w-full bg-nature-600 text-white py-3 rounded-xl font-bold hover:bg-nature-700 transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-5 h-5" />
            Abrir Cliente de Email
          </button>
        </div>

      </div>
    </div>
  );
};

