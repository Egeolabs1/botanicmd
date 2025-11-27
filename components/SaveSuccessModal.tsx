import React from 'react';
import { X, CheckCircle, BookHeart } from './Icons';

interface SaveSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  plantName?: string;
}

export const SaveSuccessModal: React.FC<SaveSuccessModalProps> = ({ 
  isOpen, 
  onClose,
  plantName 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        <div className="relative p-8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Fechar"
            title="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Planta salva com sucesso!
            </h2>
            
            {plantName && (
              <p className="text-gray-600 mb-2">
                <span className="font-semibold">{plantName}</span> foi adicionada ao seu jardim.
              </p>
            )}
            
            <p className="text-gray-600 mb-6">
              Você pode encontrá-la em <span className="font-semibold text-nature-600">Meu Jardim</span>.
            </p>

            <div className="flex items-center justify-center gap-2 text-nature-600 mb-6">
              <BookHeart className="w-5 h-5" />
              <span className="text-sm font-medium">Acesse "Meu Jardim" para ver todas as suas plantas</span>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-nature-600 text-white py-3 rounded-2xl font-semibold hover:bg-nature-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

