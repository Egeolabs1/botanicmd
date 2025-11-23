import React, { useState, useEffect, useRef } from 'react';
import { PlantData } from '../types';
import { Droplet, Sun, Sprout, Thermometer, Bug, CheckCircle, AlertTriangle, HeartPulse, Skull, Shield, Scissors, Lightbulb, Bookmark, Calendar, FileDown, Leaf, Share2, Lock, Star, Flask, ArrowRight } from './Icons';
import { ChatSection } from './ChatSection';
import { useLanguage } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

interface ResultCardProps {
  data: PlantData;
  imagePreview: string;
  onReset: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  onUpgrade: () => void;
}

const FALLBACK_IMAGE = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0fdf4'/%3E%3Cpath d='M200 100c0 0 40 60 40 100s-20 60-40 80c-20-20-40-40-40-80s40-100 40-100z' fill='%2315803d' opacity='0.4'/%3E%3Ctext x='200' y='260' font-family='sans-serif' font-size='14' fill='%23166534' text-anchor='middle'%3EImagem indisponível%3C/text%3E%3C/svg%3E`;

export const ResultCard: React.FC<ResultCardProps> = ({ data, imagePreview, onReset, onSave, isSaved = false, onUpgrade }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isPro = user?.plan === 'pro';
  const isToxic = data.toxicity.toLowerCase().includes('toxic') || data.toxicity.toLowerCase().includes('tóxica') || data.toxicity.toLowerCase().includes('perigosa');

  const [imgSrc, setImgSrc] = useState(imagePreview);
  const [imgError, setImgError] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    setImgSrc(imagePreview);
    setImgError(false);
  }, [imagePreview]);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasMoreContent = scrollHeight - scrollTop - clientHeight > 10;
    setShowScrollIndicator(hasMoreContent);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
    }
    window.addEventListener('resize', checkScroll);
    
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [data, isExporting]);

  const handleImageError = () => {
    if (!imgError) {
      setImgError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  const handleExportPdf = () => {
    if (!isPro) {
      onUpgrade();
      return;
    }
    setIsExporting(true);
    
    // Aguarda o React renderizar o layout de "Relatório" antes de gerar o PDF
    setTimeout(() => {
      const element = document.getElementById('plant-result-card');
      // @ts-ignore
      if (typeof window.html2pdf !== 'undefined' && element) {
        const opt = {
          margin: 0, // Margem zero pois controlaremos via CSS interno
          filename: `BotanicMD - ${data.commonName}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
          setIsExporting(false);
        }).catch((err: any) => {
          console.error(err);
          setIsExporting(false);
          alert("Erro ao gerar PDF.");
        });
      } else {
        setIsExporting(false);
        alert("Biblioteca PDF não carregada.");
      }
    }, 1000);
  };

  const handleDownloadCalendar = () => {
    if (!isPro) {
      onUpgrade();
      return;
    }
    try {
      const days = data.wateringFrequencyDays || 3;
      const subject = `${t('water')} ${data.commonName}`;
      const description = `${data.commonName}. ${t('water')}: ${data.care.water}`;
      
      const now = new Date();
      const isoDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//BotanicMD//Plant Care//EN',
        'BEGIN:VEVENT',
        `UID:${crypto.randomUUID()}`,
        `DTSTAMP:${isoDate}`,
        `DTSTART:${isoDate}`,
        `RRULE:FREQ=DAILY;INTERVAL=${days}`,
        `SUMMARY:${subject}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `care_${data.commonName.replace(/\s+/g, '_')}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = async () => {
    const shareText = `🌿 *${t('app_name')}*\n\n${t('share_text')} *${data.commonName}*!`;
    let shareUrl = 'https://botanicmd.com';
    if (window.location.href.startsWith('http')) {
        shareUrl = window.location.href;
    }

    const shareData = {
      title: `BotanicMD: ${data.commonName}`,
      text: shareText,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) { 
          console.log("Share API error, trying fallback", err);
          try {
             await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
             alert(t('link_copied'));
          } catch (clipErr) {
             console.error(clipErr);
          }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert(t('link_copied'));
      } catch (err) { console.error(err); }
    }
  };

  const handleSave = () => {
    if (!isPro) {
      onUpgrade();
    } else if (onSave) {
      onSave();
    }
  };

  // Renderização Especial para PDF (Relatório Profissional)
  if (isExporting) {
    return (
      <div id="plant-result-card" className="w-[210mm] min-h-[297mm] bg-white text-gray-900 font-sans relative">
        
        {/* PDF Header */}
        <div className="bg-[#166534] text-white p-8 flex justify-between items-center -webkit-print-color-adjust-exact print:bg-[#166534]">
           <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg">
                 <Leaf className="w-8 h-8 text-white" />
              </div>
              <div>
                 <h1 className="text-2xl font-bold tracking-tight">BotanicMD</h1>
                 <p className="text-green-100 text-[10px] uppercase tracking-[0.2em]">Seu Assistente Botânico Pessoal</p>
              </div>
           </div>
           <div className="text-right">
              <div className="text-[10px] text-green-200 uppercase tracking-wider mb-0.5">Report Date</div>
              <div className="text-sm font-semibold">{today}</div>
           </div>
        </div>

        <div className="p-10">
           {/* Top Section: Image & Main Info */}
           <div className="flex gap-8 mb-10 items-start break-inside-avoid">
              <div className="w-[35%] flex-shrink-0">
                 <div className="rounded-lg overflow-hidden shadow-sm border border-gray-100 aspect-[3/4]">
                    <img src={imgSrc} className="w-full h-full object-cover" alt={data.commonName} style={{ objectPosition: 'center' }} />
                 </div>
              </div>
              
              <div className="w-[65%] pt-1">
                 <h2 className="text-4xl font-bold text-[#166534] mb-1 leading-tight">{data.commonName}</h2>
                 <p className="text-lg text-gray-500 italic border-b border-gray-200 pb-4 mb-6">{data.scientificName}</p>
                 
                 {/* Alert/Status Box */}
                 {(!data.health.isHealthy || isToxic) && (
                   <div className="flex mb-6 rounded-lg overflow-hidden border border-red-100 bg-red-50 break-inside-avoid">
                      <div className="w-24 flex flex-col items-center justify-center bg-red-100 p-3 text-red-700 border-r border-red-200">
                          <AlertTriangle className="w-6 h-6 mb-2" />
                          <span className="text-[10px] font-bold uppercase text-center leading-tight">Requer<br/>Atenção</span>
                      </div>
                      <div className="p-4 text-sm text-red-900 flex items-center">
                         <p className="leading-snug">
                            {!data.health.isHealthy 
                              ? <span className="font-semibold">Diagnóstico de Saúde: {data.health.diagnosis}</span> 
                              : <span className="font-semibold">Toxicidade: {data.toxicity}</span>
                            }
                            <br/>
                            {isToxic && !data.health.isHealthy && <span className="text-xs mt-1 block opacity-90">Nota: Esta planta também possui toxicidade identificada ({data.toxicity}).</span>}
                         </p>
                      </div>
                   </div>
                 )}

                 <p className="text-gray-700 leading-relaxed text-sm text-justify">
                    {data.description}
                 </p>
              </div>
           </div>

           {/* GUIDE Section */}
           <div className="mb-10 break-inside-avoid">
              <h3 className="text-sm font-bold text-[#166534] uppercase tracking-widest border-b border-gray-200 pb-2 mb-6 flex items-center gap-2">
                 <Sprout className="w-4 h-4" /> Guide
              </h3>
              <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center h-full flex flex-col justify-between break-inside-avoid">
                     <div className="text-[10px] font-bold text-blue-800 uppercase mb-2 tracking-wider">{t('water')}</div>
                     <Droplet className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                     <div className="text-xs text-gray-700 font-medium leading-snug">{data.care.water}</div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center h-full flex flex-col justify-between break-inside-avoid">
                     <div className="text-[10px] font-bold text-amber-800 uppercase mb-2 tracking-wider">{t('light')}</div>
                     <Sun className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                     <div className="text-xs text-gray-700 font-medium leading-snug">{data.care.light}</div>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-center h-full flex flex-col justify-between break-inside-avoid">
                     <div className="text-[10px] font-bold text-stone-800 uppercase mb-2 tracking-wider">{t('soil')}</div>
                     <Sprout className="w-6 h-6 text-stone-500 mx-auto mb-2" />
                     <div className="text-xs text-gray-700 font-medium leading-snug">{data.care.soil}</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center h-full flex flex-col justify-between break-inside-avoid">
                     <div className="text-[10px] font-bold text-orange-800 uppercase mb-2 tracking-wider">{t('climate')}</div>
                     <Thermometer className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                     <div className="text-xs text-gray-700 font-medium leading-snug">{data.care.temperature}</div>
                  </div>
              </div>
           </div>

           {/* Diagnosis Section */}
           <div className="break-inside-avoid">
              <h3 className="text-sm font-bold text-[#166534] uppercase tracking-widest border-b border-gray-200 pb-2 mb-6 flex items-center gap-2">
                 <HeartPulse className="w-4 h-4" /> Clinical Diagnosis
              </h3>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                 <div className="bg-gray-50 p-4 border-b border-gray-100">
                    <span className="font-bold text-gray-900 mr-2 text-base">Diagnóstico de Saúde:</span>
                    <span className="text-gray-700 text-base">{data.health.diagnosis}</span>
                 </div>
                 {!data.health.isHealthy && (
                    <div className="p-6 grid grid-cols-2 gap-8">
                       <div>
                          <span className="font-bold text-red-700 block text-[10px] uppercase mb-3 tracking-wider">{t('symptoms')}</span>
                          <ul className="text-sm text-gray-700 space-y-2">
                             {data.health.symptoms.map((s, i) => (
                               <li key={i} className="flex items-start gap-2">
                                 <span className="block w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0"></span>
                                 <span className="leading-snug">{s}</span>
                               </li>
                             ))}
                          </ul>
                       </div>
                       <div>
                          <span className="font-bold text-green-700 block text-[10px] uppercase mb-3 tracking-wider">{t('treatment')}</span>
                          <ul className="text-sm text-gray-700 space-y-2">
                             {data.health.treatment.map((step, i) => (
                               <li key={i} className="flex items-start gap-2">
                                 <span className="block font-bold text-green-600 text-xs mt-0.5 shrink-0"></span>
                                 <span className="leading-snug">{step}</span>
                               </li>
                             ))}
                          </ul>
                       </div>
                    </div>
                 )}
                 {data.health.isHealthy && (
                    <div className="p-8 text-center">
                        <div className="inline-block p-3 rounded-full bg-green-100 text-green-600 mb-3">
                           <CheckCircle className="w-8 h-8" />
                        </div>
                        <p className="text-gray-600 font-medium">Sua planta está saudável e não apresenta sinais de doenças ou pragas.</p>
                    </div>
                 )}
              </div>
           </div>
           
           {/* Footer Note */}
           <div className="mt-12 pt-6 border-t border-gray-100 text-center flex justify-between items-center text-[10px] text-gray-400 uppercase tracking-wide">
              <span>Generated by BotanicMD AI</span>
              <span>www.botanicmd.com</span>
           </div>
        </div>
      </div>
    );
  }

  // Renderização Padrão (Card Interativo)
  return (
    <div id="plant-result-card" className="print-card w-full max-w-5xl mx-auto bg-white shadow-xl rounded-3xl overflow-hidden border border-nature-100 animate-fade-in transition-all duration-300">
      
      <div className="md:flex md:items-start">
        {/* Coluna da Imagem */}
        <div className="md:w-1/3 relative bg-gray-50">
          <div className="md:sticky md:top-0 md:p-6">
            <div className="relative rounded-2xl overflow-hidden md:shadow-md md:border md:border-gray-100 bg-white aspect-[3/4]">
              <img 
                src={imgSrc} 
                onError={handleImageError}
                alt={data.commonName} 
                className="w-full h-full object-cover block"
              />
            </div>
          </div>
        </div>

        {/* Coluna de Conteúdo */}
        <div className="md:w-2/3 relative">
          <div 
            ref={scrollContainerRef}
            className="p-6 md:p-8 space-y-6 md:max-h-[85vh] md:overflow-y-auto scrollbar-hide"
          >
            {/* Cabeçalho Card */}
            <div className="border-b border-gray-100 pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 md:gap-0">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-nature-900">{data.commonName}</h2>
                  <p className="text-nature-600 italic text-lg">{data.scientificName}</p>
                </div>
                
                <div className="flex flex-col w-full md:w-auto gap-3 no-print">
                  {isPro ? (
                    <span className={`self-start md:self-end px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2 border w-fit ${data.health.isHealthy ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {data.health.isHealthy ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      {data.health.isHealthy ? t('healthy') : t('attention')}
                    </span>
                  ) : (
                    <button onClick={onUpgrade} className="self-start md:self-end px-4 py-1 rounded-full text-sm font-medium flex items-center gap-2 border w-fit bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 transition-colors">
                       <Lock className="w-3 h-3" />
                       {t('pro_feature')}
                    </button>
                  )}
                  
                  <div className="flex gap-2 items-center justify-start md:justify-end overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <button type="button" onClick={handleShare} className="p-2 text-gray-400 hover:text-nature-700 hover:bg-nature-50 rounded-full transition-colors no-print flex-shrink-0" title="Share">
                      <Share2 className="w-5 h-5" />
                    </button>
                    
                    <button type="button" onClick={handleExportPdf} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-nature-100 hover:text-nature-800 rounded-lg transition-colors no-print flex-shrink-0 relative group">
                      <FileDown className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('download_pdf')}</span>
                      <span className="sm:hidden">PDF</span>
                      {!isPro && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-nature-600" />}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={handleSave}
                      disabled={isSaved}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all no-print flex-shrink-0 relative ${
                        isSaved 
                          ? 'bg-nature-100 text-nature-700 cursor-default' 
                          : 'bg-nature-600 text-white hover:bg-nature-700 shadow-md'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      {isSaved ? t('saved') : t('save_plant')}
                      {!isPro && !isSaved && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed text-justify">
              {data.description}
            </p>
            
            {/* Locked Fun Fact */}
            {isPro ? (
              data.funFact && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex gap-3 items-start">
                  <div className="text-yellow-600 mt-0.5"><Lightbulb className="w-5 h-5" /></div>
                  <div>
                    <span className="block text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">{t('fun_fact')}</span>
                    <p className="text-gray-700 italic text-sm">{data.funFact}</p>
                  </div>
                </div>
              )
            ) : (
              <div onClick={onUpgrade} className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 flex justify-center items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors group">
                 <Lock className="w-4 h-4 text-gray-400 group-hover:text-nature-600" />
                 <span className="text-sm text-gray-500 font-medium group-hover:text-nature-700">{t('fun_fact_locked')}</span>
              </div>
            )}

            {/* Medicinal Properties Card */}
            {data.medicinal && data.medicinal.isMedicinal && (
               <div className="bg-teal-50 border border-teal-100 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                     <div className="bg-teal-100 p-2 rounded-full text-teal-600">
                        <Flask className="w-5 h-5" />
                     </div>
                     <h3 className="text-teal-800 font-bold">{t('medicinal_title')}</h3>
                  </div>
                  <div className="space-y-3">
                     <div>
                        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block mb-1">{t('benefits')}</span>
                        <p className="text-gray-700">{data.medicinal.benefits}</p>
                     </div>
                     <div>
                        <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block mb-1">{t('usage_method')}</span>
                        <p className="text-gray-700">{data.medicinal.usage}</p>
                     </div>
                  </div>
               </div>
            )}

            {/* Toxicity (Open) & Propagation (Locked) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Toxicity */}
                <div className={`p-4 rounded-xl border flex gap-3 items-center ${isToxic ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                    <div className={`p-2 rounded-full ${isToxic ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {isToxic ? <Skull className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className={`block text-xs font-bold uppercase tracking-wider ${isToxic ? 'text-red-500' : 'text-green-600'}`}>{t('toxicity')}</span>
                      <span className="text-sm text-gray-800 font-medium">{data.toxicity}</span>
                    </div>
                </div>
                
                {/* Propagation */}
                {isPro ? (
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50 flex gap-3 items-center">
                      <div className="p-2 rounded-full bg-purple-100 text-purple-600"><Scissors className="w-5 h-5" /></div>
                      <div>
                        <span className="block text-xs font-bold text-purple-500 uppercase tracking-wider">{t('propagation')}</span>
                        <span className="text-sm text-gray-800 font-medium">{data.propagation}</span>
                      </div>
                  </div>
                ) : (
                  <div onClick={onUpgrade} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex gap-3 items-center relative overflow-hidden cursor-pointer hover:bg-gray-100 transition-colors group">
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] z-10">
                         <Lock className="w-4 h-4 text-gray-400 mb-1 group-hover:text-nature-600" />
                         <span className="text-xs font-bold text-gray-500 group-hover:text-nature-700">{t('pro_feature')}</span>
                      </div>
                      <div className="p-2 rounded-full bg-purple-50 text-purple-200"><Scissors className="w-5 h-5" /></div>
                      <div>
                        <span className="block text-xs font-bold text-gray-300 uppercase tracking-wider">{t('propagation')}</span>
                        <div className="h-4 w-24 bg-gray-200 rounded mt-1"></div>
                      </div>
                  </div>
                )}
            </div>

            <div>
              <div className="flex items-center justify-between pt-2">
                <h3 className="text-xl font-bold text-nature-800 flex items-center gap-2">
                    <Sprout className="w-5 h-5" /> {t('care_guide')}
                </h3>
                <button type="button" onClick={handleDownloadCalendar} className="no-print flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors relative">
                  <Calendar className="w-4 h-4" />
                  {t('calendar_event')}
                  {!isPro && <Lock className="w-3 h-3 absolute -top-1 -right-1 text-blue-600" />}
                </button>
              </div>

              {isPro ? (
                <div className="grid gap-4 mt-4 grid-cols-1 sm:grid-cols-2">
                  <div className="bg-blue-50 p-4 rounded-xl flex gap-3 items-start border border-blue-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500"><Droplet className="w-5 h-5" /></div>
                    <div>
                      <span className="block text-xs font-bold text-blue-400 uppercase tracking-wider">{t('water')}</span>
                      <span className="text-sm text-gray-700">{data.care.water}</span>
                    </div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl flex gap-3 items-start border border-amber-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-amber-500"><Sun className="w-5 h-5" /></div>
                    <div>
                      <span className="block text-xs font-bold text-amber-400 uppercase tracking-wider">{t('light')}</span>
                      <span className="text-sm text-gray-700">{data.care.light}</span>
                    </div>
                  </div>
                  <div className="bg-stone-50 p-4 rounded-xl flex gap-3 items-start border border-stone-200">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-stone-600"><Sprout className="w-5 h-5" /></div>
                    <div>
                      <span className="block text-xs font-bold text-stone-400 uppercase tracking-wider">{t('soil')}</span>
                      <span className="text-sm text-gray-700">{data.care.soil}</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl flex gap-3 items-start border border-orange-100">
                    <div className="bg-white p-2 rounded-lg shadow-sm text-orange-500"><Thermometer className="w-5 h-5" /></div>
                    <div>
                      <span className="block text-xs font-bold text-orange-400 uppercase tracking-wider">{t('climate')}</span>
                      <span className="text-sm text-gray-700">{data.care.temperature}</span>
                    </div>
                  </div>
                </div>
              ) : (
                 <div className="relative mt-4 rounded-2xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-2 gap-4 p-4 filter blur-md opacity-40 bg-gray-50 select-none pointer-events-none">
                        <div className="bg-blue-50 p-4 rounded-xl h-20"></div>
                        <div className="bg-amber-50 p-4 rounded-xl h-20"></div>
                        <div className="bg-stone-50 p-4 rounded-xl h-20"></div>
                        <div className="bg-orange-50 p-4 rounded-xl h-20"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white/20">
                        <button onClick={onUpgrade} className="bg-nature-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                            <Lock className="w-4 h-4" /> {t('care_locked')}
                        </button>
                    </div>
                 </div>
              )}
            </div>

            <div className={`rounded-2xl p-6 border-2 relative ${isPro ? (data.health.isHealthy ? 'bg-nature-50 border-nature-100' : 'bg-red-50 border-red-100') : 'bg-gray-50 border-gray-100'}`}>
              <h3 className={`text-xl font-bold flex items-center gap-2 mb-4 ${isPro ? (data.health.isHealthy ? 'text-nature-800' : 'text-red-800') : 'text-gray-800'}`}>
                {isPro ? (data.health.isHealthy ? <HeartPulse className="w-6 h-6" /> : <Bug className="w-6 h-6" />) : <HeartPulse className="w-6 h-6" />}
                {t('health_diagnosis')}
              </h3>
              
              {isPro ? (
                <div className="space-y-3">
                  <div>
                    <span className="font-semibold text-gray-800 block mb-1">{t('health_diagnosis')}:</span>
                    <p className="text-gray-700">{data.health.diagnosis}</p>
                  </div>

                  {!data.health.isHealthy && (
                    <>
                      <div className="mt-4">
                        <span className="font-semibold text-red-700 block mb-2 text-sm uppercase tracking-wide">{t('symptoms')}:</span>
                        <div className="flex flex-wrap gap-2">
                          {data.health.symptoms.map((symptom, idx) => (
                            <span key={idx} className="bg-white px-3 py-1 rounded-md text-sm text-red-600 border border-red-100 shadow-sm">{symptom}</span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="font-semibold text-nature-800 block mb-2 text-sm uppercase tracking-wide">{t('treatment')}:</span>
                        <ul className="space-y-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          {data.health.treatment.map((step, idx) => (
                            <li key={idx} className="flex gap-3 items-start text-gray-700 text-sm">
                              <span className="flex-shrink-0 w-5 h-5 bg-nature-100 text-nature-700 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{idx + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                 <div className="relative">
                    <div className="space-y-4 filter blur-md opacity-40 select-none pointer-events-none">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-32 bg-white rounded-xl border border-gray-200 mt-4"></div>
                    </div>
                    {/* Urgency Paywall */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-4 text-center">
                         <div className="bg-red-100 p-3 rounded-full mb-3 text-red-500 animate-pulse">
                            <AlertTriangle className="w-8 h-8" />
                         </div>
                        <h4 className="text-lg font-bold text-gray-900 mb-1">Diagnóstico Disponível</h4>
                        <p className="text-sm text-gray-500 mb-4 max-w-xs">Identificamos um possível problema. Veja como salvar sua planta.</p>
                        <button onClick={onUpgrade} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-red-200 hover:scale-105 transition-transform flex items-center gap-2 animate-pulse-slow">
                            {t('health_locked')} <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                 </div>
              )}
            </div>
            
            <div className="no-print">
              {isPro ? (
                 <ChatSection plantData={data} />
              ) : (
                 <div className="mt-8 border-t border-nature-100 pt-8 animate-fade-in">
                    <div onClick={onUpgrade} className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white cursor-pointer shadow-xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/10 w-24 h-24 rounded-full blur-xl"></div>
                       <div className="relative z-10 flex justify-between items-center">
                          <div>
                             <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
                                <Star className="w-5 h-5 text-yellow-400" />
                                {t('pro_feature')}
                             </h3>
                             <p className="text-gray-300 text-sm">{t('unlock_chat')}</p>
                          </div>
                          <button className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors">
                             Upgrade
                          </button>
                       </div>
                    </div>
                 </div>
              )}
            </div>

            <div className="pt-4 no-print">
              <button 
                type="button"
                onClick={onReset}
                className="w-full py-3 px-6 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
              >
                {t('identify_another')}
              </button>
            </div>
          </div>

          {/* Scroll Indicator */}
          {!isExporting && (
            <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none transition-all duration-500 flex items-end justify-center pb-6 md:rounded-br-3xl z-10 ${showScrollIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
               <div className="animate-bounce bg-white p-2 rounded-full shadow-md text-nature-500 border border-nature-100">
                  <Leaf className="w-5 h-5 rotate-180 opacity-70" /> 
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};