import React, { useState, useRef } from 'react';
import { UploadCloud, Leaf, MessageCircle, Lock, Camera } from './Icons';
import { useLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

// Validação de magic bytes para garantir que é realmente uma imagem
const isValidImageFile = async (file: File): Promise<boolean> => {
  // Validação básica de tipo MIME
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return false;
  }

  // Validação de magic bytes (assinatura do arquivo)
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
    
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
    
    // GIF: 47 49 46 38 (GIF8)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
    
    // WebP: RIFF...WEBP (verifica os primeiros 4 bytes como RIFF e depois WEBP)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      // Verifica se contém WEBP mais adiante
      const webpCheck = await file.slice(8, 12).arrayBuffer();
      const webpBytes = new Uint8Array(webpCheck);
      if (webpBytes[0] === 0x57 && webpBytes[1] === 0x45 && webpBytes[2] === 0x42 && webpBytes[3] === 0x50) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    // Em caso de erro, retorna false para segurança
    return false;
  }
};

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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isPro = user?.plan === 'pro';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Validação de tamanho (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('Arquivo muito grande. Por favor, selecione uma imagem menor que 10MB.');
        return;
      }

      // Validação de tipo de arquivo e magic bytes
      const isValid = await isValidImageFile(file);
      if (!isValid) {
        alert('Arquivo inválido. Por favor, selecione uma imagem válida (JPEG, PNG, WebP ou GIF).');
        return;
      }
      
      onImageSelected(file);
    }
  };

  const handleFileChange = async (file: File) => {
    // Validação de tamanho (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande. Por favor, selecione uma imagem menor que 10MB.');
      return;
    }

    // Validação de tipo de arquivo e magic bytes
    const isValid = await isValidImageFile(file);
    if (!isValid) {
      alert('Arquivo inválido. Por favor, selecione uma imagem válida (JPEG, PNG, WebP ou GIF).');
      return;
    }
    
    onImageSelected(file);
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFileChange(e.target.files[0]);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = '';
    }
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
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
          {/* Botões de Ação - Mobile First */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleCameraClick}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-nature-500 to-nature-600 text-white rounded-2xl shadow-lg shadow-nature-500/30 hover:shadow-nature-500/50 hover:scale-105 transition-all duration-300 group"
            >
              <div className="bg-white/20 p-4 rounded-full group-hover:bg-white/30 transition-colors">
                <Camera className="w-8 h-8" />
              </div>
              <span className="font-bold text-sm">{t('take_photo')}</span>
            </button>

            <button
              onClick={handleGalleryClick}
              className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-nature-200 text-nature-700 rounded-2xl shadow-sm hover:shadow-md hover:border-nature-300 hover:scale-105 transition-all duration-300 group"
            >
              <div className="bg-nature-100 p-4 rounded-full group-hover:bg-nature-200 transition-colors">
                <UploadCloud className="w-8 h-8 text-nature-600" />
              </div>
              <span className="font-bold text-sm">{t('gallery')}</span>
            </button>
          </div>

          {/* Área de Drag & Drop - Desktop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`hidden md:block relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 cursor-pointer group animate-fade-in
              ${isDragging 
                ? 'border-nature-500 bg-nature-50 scale-105' 
                : 'border-nature-300 bg-white hover:border-nature-400 hover:bg-nature-50'
              }
            `}
            onClick={handleGalleryClick}
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
          </div>
            
          {/* Inputs ocultos */}
          {/* Input para câmera - usa capture para abrir câmera diretamente em mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
          {/* Input para galeria - sem capture para permitir escolher da galeria */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
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