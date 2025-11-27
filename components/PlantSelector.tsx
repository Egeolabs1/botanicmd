import React from 'react';
import { PlantCandidate } from '../types';
import { Leaf } from './Icons';
import { useLanguage } from '../i18n';

interface PlantSelectorProps {
  candidates: PlantCandidate[];
  onSelect: (candidate: PlantCandidate) => void;
  onCancel: () => void;
}

export const PlantSelector: React.FC<PlantSelectorProps> = ({ candidates, onSelect, onCancel }) => {
  const { t } = useLanguage();
  
  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('select_plant_title')}</h2>
        <p className="text-gray-600">{t('select_plant_desc')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {candidates.map((plant, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(plant)}
            className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-nature-300 transition-all text-left flex flex-col h-full"
          >
            <div className="h-48 overflow-hidden bg-gray-100 relative">
              {plant.imageUrl ? (
                <img 
                  src={plant.imageUrl} 
                  alt={`${plant.commonName} - Plant identification candidate from BotanicMD`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                 <div className="absolute inset-0 flex items-center justify-center bg-nature-50">
                  <Leaf className="w-12 h-12 text-nature-300" />
                </div>
              )}
              <div className={`absolute inset-0 flex items-center justify-center bg-nature-50 hidden`}>
                <Leaf className="w-12 h-12 text-nature-300" />
              </div>
            </div>
            
            <div className="p-5 flex-1">
              <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-nature-700 transition-colors">
                {plant.commonName}
              </h3>
              <p className="text-sm text-gray-500 italic">
                {plant.scientificName}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-500 hover:text-gray-800 font-medium transition-colors"
        >
          {t('cancel_search')}
        </button>
      </div>
    </div>
  );
};