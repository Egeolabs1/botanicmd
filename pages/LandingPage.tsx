import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Sprout, HeartPulse, Trophy, Star, Smartphone, ArrowRight, CheckCircle, Camera, Zap, Database, HelpCircle, ChevronDown, Flask } from '../components/Icons';
import { useLanguage } from '../i18n';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { AuthModal } from '../components/AuthModal';
import { LegalModal } from '../components/LegalModal';
import { AboutModal } from '../components/AboutModal';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
    const [activeFaq, setActiveFaq] = useState<number | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({ 
      isOpen: false, 
      type: 'privacy' 
    });

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStart = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
    } else {
      navigate('/app');
    }
  };

  const openLegal = (type: 'privacy' | 'terms') => setLegalModal({ isOpen: true, type });

  return (
    <>
      <div className="min-h-screen bg-white font-sans selection:bg-nature-200 selection:text-nature-900 overflow-x-hidden">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-nature-400 opacity-20 blur-[100px]"></div>

        {/* Navigation */}
        <nav className="w-full py-6 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-sm sticky top-0 z-40 bg-white/50 border-b border-white/20">
          <div className="flex items-center gap-2">
            <div className="bg-nature-600 text-white p-2 rounded-xl shadow-lg shadow-nature-500/30">
              <Leaf className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-nature-900 tracking-tight">{t('app_name')}</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-gray-600 hover:text-nature-600 transition-colors">
              {t('nav_how_it_works')}
            </button>
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-600 hover:text-nature-600 transition-colors">
              {t('nav_features')}
            </button>
            <button onClick={() => navigate('/blog')} className="text-sm font-medium text-gray-600 hover:text-nature-600 transition-colors">
              Blog
            </button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-gray-600 hover:text-nature-600 transition-colors">
              {t('nav_pricing')}
            </button>
            <button onClick={() => setIsAboutModalOpen(true)} className="text-sm font-medium text-gray-600 hover:text-nature-600 transition-colors">
              {t('nav_about')}
            </button>
          </div>

          <button 
            onClick={handleStart}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {t('start_now')}
          </button>
        </nav>

        {/* Hero Section */}
        <header className="relative pt-16 pb-20 md:pt-32 md:pb-32 px-6">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div className="text-center md:text-left space-y-8">
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
                {t('hero_title')} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-nature-600 to-teal-500">
                  {t('hero_highlight')}
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg mx-auto md:mx-0">
                {t('hero_subtitle')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button 
                  onClick={handleStart}
                  className="px-8 py-4 bg-nature-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-nature-500/30 hover:bg-nature-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3 group"
                >
                  {t('start_now')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="pt-6 flex items-center gap-4 justify-center md:justify-start">
                 <div className="flex -space-x-3">
                   <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                   <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                   <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-10 h-10 rounded-full border-2 border-white" />
                   <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">+2k</div>
                 </div>
                 <div className="text-sm">
                    <p className="font-bold text-gray-900">Trusted by Gardeners</p>
                    <div className="flex text-yellow-400">★★★★★</div>
                 </div>
              </div>
            </div>

            {/* Visual Mockup */}
            <div className="relative mx-auto md:mr-0 w-full max-w-[380px] group perspective-1000">
              <div className="relative rounded-[2.5rem] bg-gray-900 p-4 shadow-2xl shadow-nature-200 border-4 border-gray-900 transform md:rotate-y-12 md:rotate-x-6 transition-all duration-700 group-hover:rotate-0">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-gray-900 rounded-b-2xl z-20"></div>
                <div className="w-full h-[600px] bg-white rounded-[2rem] overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Plant App UI" />
                  
                  {/* UI Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-white/80 backdrop-blur-md p-6 m-4 rounded-2xl border border-white/50 shadow-lg">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <h3 className="font-bold text-gray-900 text-lg">Monstera Deliciosa</h3>
                           <p className="text-sm text-gray-500">Araceae Family</p>
                        </div>
                        <div className="bg-green-100 text-green-700 p-2 rounded-full">
                           <CheckCircle className="w-5 h-5" />
                        </div>
                     </div>
                     <div className="flex gap-2 mb-4">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-medium">Water: 7 days</span>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium">Light: Partial</span>
                     </div>
                     <button className="w-full bg-nature-600 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-nature-200">
                        Add to Garden
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Strip */}
        <div className="bg-nature-900 py-10">
           <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
              <div>
                 <h4 className="text-3xl font-bold text-white mb-1">1M+</h4>
                 <p className="text-nature-300 text-sm uppercase tracking-wider">{t('stats_plants')}</p>
              </div>
              <div>
                 <h4 className="text-3xl font-bold text-white mb-1">98%</h4>
                 <p className="text-nature-300 text-sm uppercase tracking-wider">{t('stats_accuracy')}</p>
              </div>
               <div>
                 <h4 className="text-3xl font-bold text-white mb-1">10k+</h4>
                 <p className="text-nature-300 text-sm uppercase tracking-wider">{t('stats_users')}</p>
              </div>
               <div>
                 <h4 className="text-3xl font-bold text-white mb-1">4.9</h4>
                 <div className="flex text-yellow-400 text-sm"><Star className="w-4 h-4"/><Star className="w-4 h-4"/><Star className="w-4 h-4"/><Star className="w-4 h-4"/><Star className="w-4 h-4"/></div>
              </div>
           </div>
        </div>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 bg-white px-6">
           <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-gray-900">{t('how_it_works')}</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-12 relative">
                 {/* Connector Line */}
                 <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gray-100 -z-10 transform translate-y-4"></div>

                 <div className="text-center relative">
                    <div className="w-24 h-24 bg-white border-4 border-nature-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                       <Camera className="w-10 h-10 text-nature-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('step_1_title')}</h3>
                    <p className="text-gray-500">{t('step_1_desc')}</p>
                 </div>
                 <div className="text-center relative">
                     <div className="w-24 h-24 bg-white border-4 border-nature-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                       <Zap className="w-10 h-10 text-nature-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('step_2_title')}</h3>
                    <p className="text-gray-500">{t('step_2_desc')}</p>
                 </div>
                 <div className="text-center relative">
                     <div className="w-24 h-24 bg-white border-4 border-nature-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                       <CheckCircle className="w-10 h-10 text-nature-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t('step_3_title')}</h3>
                    <p className="text-gray-500">{t('step_3_desc')}</p>
                 </div>
              </div>
           </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-gray-50 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
               <p className="text-gray-500 max-w-2xl mx-auto">Everything you need to keep your plants thriving, powered by cutting-edge AI technology.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1 - ID */}
              <div className="bg-nature-600 rounded-[2.5rem] p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-nature-600">
                <div className="relative z-10 max-w-md">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 text-white shadow-sm">
                    <Database className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t('features_id')}</h3>
                  <p className="text-nature-100 text-lg leading-relaxed">{t('features_id_desc')}</p>
                </div>
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-tl-full opacity-50 translate-x-16 translate-y-16 group-hover:translate-x-12 group-hover:translate-y-12 transition-transform"></div>
              </div>

               {/* Card 2 - Medicinal */}
              <div className="bg-teal-600 rounded-[2.5rem] p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-teal-600">
                <div className="relative z-10 max-w-md">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 text-white shadow-sm">
                    <Flask className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t('features_med')}</h3>
                  <p className="text-teal-100 text-lg leading-relaxed">{t('features_med_desc')}</p>
                </div>
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-tl-full opacity-50 translate-x-16 translate-y-16 group-hover:translate-x-12 group-hover:translate-y-12 transition-transform"></div>
              </div>

              {/* Card 3 - Doc */}
              <div className="bg-red-500 rounded-[2.5rem] p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-red-500">
                <div className="relative z-10 max-w-md">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 text-white shadow-sm">
                    <HeartPulse className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t('features_doc')}</h3>
                  <p className="text-red-100 text-lg leading-relaxed">{t('features_doc_desc')}</p>
                </div>
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-tl-full opacity-50 translate-x-16 translate-y-16 group-hover:translate-x-12 group-hover:translate-y-12 transition-transform"></div>
              </div>

              {/* Card 4 - Game */}
              <div className="bg-amber-500 rounded-[2.5rem] p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-amber-500">
                <div className="relative z-10 max-w-md">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 text-white shadow-sm">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">{t('features_game')}</h3>
                  <p className="text-amber-100 text-lg leading-relaxed">{t('features_game_desc')}</p>
                </div>
                <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-tl-full opacity-50 translate-x-16 translate-y-16 group-hover:translate-x-12 group-hover:translate-y-12 transition-transform"></div>
              </div>

              {/* Card 5 - Luxometer */}
               <div className="bg-orange-500 rounded-[2.5rem] p-10 relative overflow-hidden group hover:shadow-xl transition-all duration-300 border border-orange-500 md:col-span-2">
                 <div className="relative z-10 max-w-md">
                   <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 text-white shadow-sm">
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                   </div>
                   <h3 className="text-3xl font-bold text-white mb-4">{t('lux_title')}</h3>
                   <p className="text-orange-100 text-lg leading-relaxed">{t('lux_desc')}</p>
                 </div>
                 <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/10 rounded-tl-full opacity-50 translate-x-16 translate-y-16 group-hover:translate-x-12 group-hover:translate-y-12 transition-transform"></div>
               </div>
              
               {/* Card 6 - CTA */}
               <div className="md:col-span-2 bg-gray-900 rounded-[2.5rem] p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold text-white mb-2">Ready to grow?</h3>
                    <p className="text-gray-400">Join the community of plant lovers today.</p>
                  </div>
                  <button onClick={handleStart} className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-colors shadow-lg z-10 whitespace-nowrap">
                    Get Started Free
                  </button>
                  
                  <div className="absolute top-0 right-0 w-64 h-64 bg-nature-600 blur-[100px] opacity-30"></div>
               </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-white px-6">
           <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                 <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('pricing_title')}</h2>
                 <p className="text-gray-500">{t('pricing_subtitle')}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                 {/* Free Plan */}
                 <div className="bg-nature-50 rounded-3xl p-8 border border-nature-200 hover:shadow-lg transition-shadow">
                    <div className="mb-4">
                       <span className="px-3 py-1 rounded-full bg-nature-200 text-nature-800 text-xs font-bold uppercase tracking-wider">{t('free_plan')}</span>
                    </div>
                    <h3 className="text-4xl font-bold text-nature-900 mb-6">{t('plan_free_price')}</h3>
                    <ul className="space-y-4 mb-8">
                       <li className="flex items-center gap-3 text-gray-700">
                          <CheckCircle className="w-5 h-5 text-nature-600" /> {t('feature_basic_id')}
                       </li>
                       <li className="flex items-center gap-3 text-gray-700">
                          <CheckCircle className="w-5 h-5 text-nature-600" /> {t('feature_limited_usage')}
                       </li>
                       <li className="flex items-center gap-3 text-gray-700">
                          <CheckCircle className="w-5 h-5 text-nature-600" /> {t('feature_toxicity')}
                       </li>
                    </ul>
                    <button onClick={handleStart} className="w-full py-3 rounded-xl border-2 border-nature-200 font-bold text-nature-800 hover:border-nature-900 hover:text-gray-900 transition-colors bg-white/50">
                       Start Free
                    </button>
                 </div>

                 {/* Pro Plan */}
                 <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 relative overflow-hidden transform md:scale-105 shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-nature-500 blur-[60px] opacity-20"></div>
                    <div className="mb-4">
                       <span className="px-3 py-1 rounded-full bg-nature-500 text-white text-xs font-bold uppercase tracking-wider">Best Value</span>
                    </div>
                    <div>
                       <span className="text-sm text-gray-400 block mb-1">{t('plan_annual')} Plan</span>
                       <h3 className="text-4xl font-bold text-white mb-2">{t('per_month_equiv')}</h3>
                       <p className="text-sm text-nature-300 mb-6">Billed {t('price_annual')} per year</p>
                    </div>
                    
                    <ul className="space-y-4 mb-8">
                       <li className="flex items-center gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-nature-400" /> {t('feature_unlimited')}
                       </li>
                       <li className="flex items-center gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-nature-400" /> {t('feature_full_care')}
                       </li>
                       <li className="flex items-center gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-nature-400" /> {t('feature_health')}
                       </li>
                        <li className="flex items-center gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-nature-400" /> {t('feature_medicinal_props')}
                       </li>
                        <li className="flex items-center gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-nature-400" /> {t('feature_chat')}
                       </li>
                        <li className="flex items-center gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-nature-400" /> {t('feature_save')}
                       </li>
                       <li className="flex items-center gap-3 text-gray-300">
                          <CheckCircle className="w-5 h-5 text-nature-400" /> {t('lux_title')}
                       </li>
                    </ul>
                    <button onClick={handleStart} className="w-full py-3 rounded-xl bg-nature-600 text-white font-bold hover:bg-nature-500 transition-colors shadow-lg shadow-nature-900/50">
                       Go Pro
                    </button>
                 </div>
              </div>
           </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-gray-50 px-6">
           <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-nature-600">
                    <HelpCircle className="w-6 h-6" />
                 </div>
                 <h2 className="text-3xl font-bold text-gray-900">{t('faq_title')}</h2>
              </div>
              
              <div className="space-y-4">
                 {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                       <button 
                          onClick={() => toggleFaq(num)}
                          className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                       >
                          <span className="font-bold text-gray-800">{t(`faq_${num}_q` as any)}</span>
                          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${activeFaq === num ? 'rotate-180' : ''}`} />
                       </button>
                       {activeFaq === num && (
                          <div className="px-6 pb-6 text-gray-600 leading-relaxed animate-fade-in">
                             {t(`faq_${num}_a` as any)}
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6">
           <div className="max-w-5xl mx-auto bg-gradient-to-br from-nature-600 to-teal-700 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10">
                 <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('cta_title')}</h2>
                 <p className="text-xl text-nature-100 mb-10 max-w-xl mx-auto">{t('cta_subtitle')}</p>
                 <button onClick={handleStart} className="bg-white text-nature-800 px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl transform hover:scale-105">
                    {t('cta_button')}
                 </button>
              </div>
           </div>
        </section>

        <footer className="bg-white py-16 px-6 border-t border-gray-100">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
               <div className="flex items-center gap-2 mb-6">
                  <div className="bg-nature-100 p-2 rounded-lg text-nature-600">
                     <Leaf className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-gray-900 text-xl">{t('app_name')}</span>
               </div>
               <p className="text-gray-500 text-sm leading-relaxed">
                  Your personal botanical assistant powered by artificial intelligence. Grow better, together.
               </p>
            </div>
            
            <div>
               <h4 className="font-bold text-gray-900 mb-4">Product</h4>
               <ul className="space-y-2 text-sm text-gray-500">
                  <li><button onClick={() => scrollToSection('features')} className="hover:text-nature-600 text-left">Features</button></li>
                  <li><button onClick={() => scrollToSection('pricing')} className="hover:text-nature-600 text-left">Pricing</button></li>
               </ul>
            </div>
            
            <div>
               <h4 className="font-bold text-gray-900 mb-4">Company</h4>
               <ul className="space-y-2 text-sm text-gray-500">
                  <li><button onClick={() => setIsAboutModalOpen(true)} className="hover:text-nature-600 text-left">{t('about_us')}</button></li>
                  <li><button onClick={() => navigate('/blog')} className="hover:text-nature-600 text-left">Blog</button></li>
               </ul>
            </div>
             <div>
               <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
               <ul className="space-y-2 text-sm text-gray-500">
                  <li><button onClick={() => openLegal('privacy')} className="hover:text-nature-600 text-left">Privacy Policy</button></li>
                  <li><button onClick={() => openLegal('terms')} className="hover:text-nature-600 text-left">Terms of Service</button></li>
               </ul>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 text-center text-sm text-gray-400">
              © {new Date().getFullYear()} BotanicMD AI. Desenvolvido por Egeolabs.
          </div>
        </footer>
      </div>
      
      <PWAInstallPrompt />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <LegalModal 
        isOpen={legalModal.isOpen} 
        type={legalModal.type} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
      />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </>
  );
};

