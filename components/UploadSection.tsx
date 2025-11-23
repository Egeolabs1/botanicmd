import React, { useState, useRef } from 'react';
import { UploadCloud, Leaf, MessageCircle, Lock } from './Icons';
import { useLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

interface UploadSectionProps {
  onImageSelected: (file: File) => void;
  onTextSearch: (text: string) => void;
  onUpgrade: () => void;
}

type Mode = 'photo' | 'text';

export const UploadSection: React.FC<UploadSectionProps> = ({ onImageSelected, onTextSearch, onUpgrade }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('photo');
  const [isDragging, setIsDragging] = useState(false);
  const [searchText, setSearchText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPro = user?.plan === 'pro';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Validação de tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, solte apenas arquivos de imagem.');
        return;
      }
      
      // Validação de tamanho (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Arquivo muito grande. Por favor, selecione uma imagem menor que 10MB.');
        return;
      }
      
      onImageSelected(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validação de tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }
      
      // Validação de tamanho (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Arquivo muito grande. Por favor, selecione uma imagem menor que 10MB.');
        return;
      }
      
      onImageSelected(file);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = searchText.trim();
    
    // Validação: mínimo de 2 caracteres
    if (trimmedText.length < 2) {
      return; // Não faz nada se muito curto
    }
    
    // Validação: máximo de 100 caracteres
    if (trimmedText.length > 100) {
      return; // Não faz nada se muito longo
    }
    
    onTextSearch(trimmedText);
  };

  const handleModeChange = (newMode: Mode) => {
    // Search is now allowed for everyone, respecting monthly limits
    setMode(newMode);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Tabs */}
      <div className="flex p-1 bg-white rounded-full border border-gray-200 mb-6 shadow-sm">
        <button
          onClick={() => handleModeChange('photo')}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2
            ${mode === 'photo' ? 'bg-nature-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <UploadCloud className="w-4 h-4" />
          {t('upload_tab')}
        </button>
        <button
          onClick={() => handleModeChange('text')}
          className={`flex-1 py-2 px-4 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 relative
            ${mode === 'text' ? 'bg-nature-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Leaf className="w-4 h-4" />
          {t('search_tab')}
        </button>
      </div>

      {/* Photo Mode */}
      {mode === 'photo' && (
        <>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer group animate-fade-in
              ${isDragging 
                ? 'border-nature-500 bg-nature-50 scale-105' 
                : 'border-nature-300 bg-white hover:border-nature-400 hover:bg-nature-50'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-nature-100 p-3 rounded-full border-4 border-white shadow-sm">
              <Leaf className="w-8 h-8 text-nature-600" />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-center">
                <div className="bg-nature-100 p-4 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8 text-nature-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {t('drag_drop')}
                </h3>
                <p className="text-sm text-gray-500 mt-2">
                  {t('drag_drop_sub')}
                </p>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {/* Text Mode */}
      {mode === 'text' && (
        <div className="bg-white p-6 rounded-3xl border border-nature-200 shadow-sm animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
            {t('select_plant_desc')}
          </h3>
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <input 
              type="text" 
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t('search_placeholder')} 
              className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-nature-500 focus:border-transparent bg-gray-50 text-gray-800 placeholder-gray-400 transition-all"
              maxLength={100}
              minLength={2}
            />
            <button 
              type="submit"
              disabled={!searchText.trim() || searchText.trim().length < 2}
              className="w-full bg-nature-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-nature-200 hover:bg-nature-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              {t('consult_expert')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};