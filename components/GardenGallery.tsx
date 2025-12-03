import React, { useState, useMemo, useEffect } from 'react';
import { PlantData } from '../types';
import { Leaf, Trash, BookHeart, Bug, HeartPulse, Shield, Skull, Trophy, Medal, Star, Lightbulb, Sprout } from './Icons';
import { useLanguage } from '../i18n';

interface GardenGalleryProps {
  savedPlants: { data: PlantData; image: string }[];
  onSelectPlant: (plant: { data: PlantData; image: string }) => void;
  onDeletePlant: (id: string) => void;
  onScanNew: () => void;
}

type FilterType = 'all' | 'healthy' | 'sick' | 'toxic' | 'safe';

// Simplified logic for tips since translation handles the text
export const GardenGallery: React.FC<GardenGalleryProps> = React.memo(({ 
  savedPlants, 
  onSelectPlant, 
  onDeletePlant,
  onScanNew
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredPlants = useMemo(() => {
    return savedPlants.filter(item => {
      const matchesSearch = 
        item.data.commonName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.data.scientificName.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      switch (activeFilter) {
        case 'healthy': return item.data.health.isHealthy;
        case 'sick': return !item.data.health.isHealthy;
        case 'toxic': return item.data.toxicity.toLowerCase().includes('toxic') || item.data.toxicity.toLowerCase().includes('tóxica');
        case 'safe': return !item.data.toxicity.toLowerCase().includes('toxic') && !item.data.toxicity.toLowerCase().includes('tóxica');
        default: return true;
      }
    });
  }, [savedPlants, searchTerm, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: savedPlants.length,
      healthy: savedPlants.filter(p => p.data.health.isHealthy).length,
      sick: savedPlants.filter(p => !p.data.health.isHealthy).length,
      toxic: savedPlants.filter(p => p.data.toxicity.toLowerCase().includes('toxic') || p.data.toxicity.toLowerCase().includes('tóxica')).length
    };
  }, [savedPlants]);

  const level = useMemo(() => {
    if (stats.total === 0) return { name: "Visitor", next: 1, progress: 0 };
    if (stats.total < 3) return { name: "Novice", next: 3, progress: (stats.total / 3) * 100 };
    if (stats.total < 10) return { name: "Apprentice", next: 10, progress: (stats.total / 10) * 100 };
    if (stats.total < 25) return { name: "Gardener", next: 25, progress: (stats.total / 25) * 100 };
    return { name: "Master Botanist", next: 100, progress: 100 };
  }, [stats.total]);

  const badges = [
    {
      id: 'first_bud',
      name: 'First Bud',
      desc: 'Saved 1 plant',
      icon: <Sprout className="w-5 h-5" />,
      unlocked: stats.total >= 1,
      color: 'text-green-600 bg-green-100'
    },
    {
      id: 'encyclopedia',
      name: 'Encyclopedia',
      desc: 'Saved 5 plants',
      icon: <BookHeart className="w-5 h-5" />,
      unlocked: stats.total >= 5,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      id: 'healer',
      name: 'Plant Doctor',
      desc: 'Identified 1 sick plant',
      icon: <HeartPulse className="w-5 h-5" />,
      unlocked: stats.sick >= 1,
      color: 'text-red-600 bg-red-100'
    },
    {
      id: 'survivor',
      name: 'Survivor',
      desc: 'Found toxic plant',
      icon: <Skull className="w-5 h-5" />,
      unlocked: stats.toxic >= 1,
      color: 'text-purple-600 bg-purple-100'
    }
  ];

  if (savedPlants.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="bg-nature-50 inline-block p-6 rounded-full mb-6">
          <BookHeart className="w-12 h-12 text-nature-300" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('garden_empty')}</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          {t('garden_empty_desc')}
        </p>
        <button 
          onClick={onScanNew}
          className="bg-nature-600 text-white px-8 py-3 rounded-xl hover:bg-nature-700 transition-all shadow-lg shadow-nature-200"
        >
          {t('start_identifying')}
        </button>
      </div>
    );
  }

  const FilterChip = ({ type, label, icon }: { type: FilterType, label: string, icon?: React.ReactNode }) => (
    <button
      onClick={() => setActiveFilter(type)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap
        ${activeFilter === type 
          ? 'bg-nature-600 text-white shadow-md' 
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="animate-fade-in pb-12">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-nature-100 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Trophy className="w-32 h-32 text-nature-600" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">{t('gardener_profile')}</p>
              <h2 className="text-3xl font-bold text-nature-900 flex items-center gap-2">
                {level.name}
                <Medal className="w-6 h-6 text-yellow-500" />
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {stats.total} plants • {stats.healthy} {t('healthy')}
              </p>
            </div>
            
            <div className="w-full md:w-1/3">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>{Math.round(level.progress)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-nature-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${level.progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`p-3 rounded-xl border transition-all ${
                  badge.unlocked 
                    ? 'bg-white border-gray-200 shadow-sm opacity-100' 
                    : 'bg-gray-50 border-dashed border-gray-200 opacity-60 grayscale'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${badge.unlocked ? badge.color : 'bg-gray-200'}`}>
                    {badge.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{badge.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 border border-orange-100 mb-8 flex gap-4 items-center shadow-sm">
         <div className="bg-white p-2 rounded-full text-orange-500 shadow-sm shrink-0">
            <Lightbulb className="w-5 h-5" />
         </div>
         <div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wide block mb-0.5">{t('daily_tip')}</span>
            <p className="text-sm text-gray-700 italic">"{t('hero_highlight')}..."</p>
         </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <Leaf className="w-5 h-5 text-nature-600" />
           {t('my_garden')}
        </h2>
        <button 
          onClick={onScanNew}
          className="hidden sm:block text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          {t('new_plant')}
        </button>
      </div>

      <div className="mb-8 space-y-4">
        <input 
          type="text" 
          placeholder={t('search_garden')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-nature-500 focus:border-transparent bg-white shadow-sm"
        />
        
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <FilterChip type="all" label={t('filter_all')} />
          <FilterChip type="healthy" label={t('filter_healthy')} icon={<HeartPulse className="w-4 h-4" />} />
          <FilterChip type="sick" label={t('attention')} icon={<Bug className="w-4 h-4" />} />
          <FilterChip type="safe" label={t('filter_safe')} icon={<Shield className="w-4 h-4" />} />
          <FilterChip type="toxic" label={t('filter_toxic')} icon={<Skull className="w-4 h-4" />} />
        </div>
      </div>

      {filteredPlants.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
          <p className="text-gray-500">No plants found.</p>
          <button onClick={() => {setSearchTerm(''); setActiveFilter('all');}} className="text-nature-600 text-sm mt-2 font-medium">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((item) => (
            <div 
              key={item.data.id} 
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden group relative flex flex-col h-full"
            >
              <div 
                className="h-48 overflow-hidden cursor-pointer relative bg-nature-50"
                onClick={() => onSelectPlant(item)}
              >
                <img 
                  src={item.image} 
                  alt={`${item.data.commonName} (${item.data.scientificName}) - Saved plant in BotanicMD garden`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 cursor-pointer hover:text-nature-700" onClick={() => onSelectPlant(item)}>
                      {item.data.commonName}
                    </h3>
                    <p className="text-xs text-gray-500 italic">{item.data.scientificName}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(item.data.id) onDeletePlant(item.data.id);
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                  {item.data.description}
                </p>

                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${item.data.health.isHealthy ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {item.data.health.isHealthy ? t('healthy') : t('attention')}
                  </span>
                  <button 
                    onClick={() => onSelectPlant(item)}
                    className="text-sm font-medium text-nature-600 hover:text-nature-800"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <button 
        onClick={onScanNew}
        className="sm:hidden fixed bottom-6 right-6 bg-gray-900 text-white p-4 rounded-full shadow-xl hover:bg-gray-800 z-40"
      >
        <Leaf className="w-6 h-6" />
      </button>
    </div>
  );
};