
import React from 'react';
import { X, Users, Leaf, Sprout, Zap } from './Icons';
import { useLanguage } from '../i18n';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[95vh] md:h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Header with Gradient */}
        <div className="p-4 sm:p-6 md:p-8 pb-8 sm:pb-10 md:pb-12 bg-gradient-to-br from-nature-600 to-teal-500 relative">
          <button onClick={onClose} className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 sm:p-2 rounded-full transition-all">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex flex-col items-center text-center">
            <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl text-white mb-3 sm:mb-4 shadow-inner">
              <Users className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10" />
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">{t('about_title')}</h2>
            <p className="text-sm sm:text-base text-nature-100">{t('tagline')}</p>
          </div>
          {/* Decorative wave at bottom would be complex in CSS, using negative margin on content instead */}
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto -mt-4 sm:-mt-6 bg-white rounded-t-2xl sm:rounded-t-3xl px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-6 sm:pb-8 space-y-6 sm:space-y-8">
          
          {/* Mission */}
          <div className="flex gap-3 sm:gap-4">
             <div className="flex-shrink-0 mt-1">
               <div className="bg-nature-100 p-1.5 sm:p-2 rounded-lg text-nature-600"><Leaf className="w-5 h-5 sm:w-6 sm:h-6" /></div>
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{t('about_mission')}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t('about_mission_text')}</p>
             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Story */}
           <div className="flex gap-3 sm:gap-4">
             <div className="flex-shrink-0 mt-1">
               <div className="bg-amber-100 p-1.5 sm:p-2 rounded-lg text-amber-600"><Sprout className="w-5 h-5 sm:w-6 sm:h-6" /></div>
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{t('about_story')}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t('about_story_text')}</p>
             </div>
          </div>

          <hr className="border-gray-100" />

          {/* Vision */}
           <div className="flex gap-3 sm:gap-4">
             <div className="flex-shrink-0 mt-1">
               <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg text-blue-600"><Zap className="w-5 h-5 sm:w-6 sm:h-6" /></div>
             </div>
             <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2">{t('about_vision')}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{t('about_vision_text')}</p>
             </div>
          </div>
          
          {/* Team/Placeholder */}
          <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center mt-6 sm:mt-8">
            <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">Made with ❤️ by the BotanicMD Team</p>
            <div className="flex justify-center gap-1.5 sm:gap-2">
               <img src="https://i.pravatar.cc/100?img=11" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm" alt="Team" />
               <img src="https://i.pravatar.cc/100?img=12" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm" alt="Team" />
               <img src="https://i.pravatar.cc/100?img=13" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm" alt="Team" />
               <img src="https://i.pravatar.cc/100?img=14" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm" alt="Team" />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
