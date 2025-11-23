
import React, { useEffect, useRef, useState } from 'react';
import { Sun, X, Camera, AlertTriangle } from './Icons';
import { useLanguage } from '../i18n';

interface LuxometerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Luxometer: React.FC<LuxometerProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setBrightness(0);
      setIsScanning(false);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        analyzeBrightness();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera permission denied or not available.");
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const analyzeBrightness = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      canvasRef.current.width = 100;
      canvasRef.current.height = 100;

      // Draw current video frame to canvas (scaled down for performance)
      ctx.drawImage(videoRef.current, 0, 0, 100, 100);

      // Get pixel data
      const frame = ctx.getImageData(0, 0, 100, 100);
      const data = frame.data;
      let totalLuminance = 0;

      // Calculate average luminance using formula: Y = 0.2126R + 0.7152G + 0.0722B
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuminance += (0.2126 * r + 0.7152 * g + 0.0722 * b);
      }

      const avgLuminance = totalLuminance / (data.length / 4);
      setBrightness(avgLuminance); // 0 to 255

      if (isScanning) {
        requestAnimationFrame(processFrame);
      }
    };
    
    requestAnimationFrame(processFrame);
  };

  // Re-trigger analysis loop when scanning starts
  useEffect(() => {
    if (isScanning && videoRef.current) {
        analyzeBrightness();
    }
  }, [isScanning]);

  if (!isOpen) return null;

  // Logic to categorize brightness
  // Note: This is a rough approximation. Real lux requires calibrated sensor.
  // 0-50: Low, 50-150: Medium, 150+: High
  let level = "";
  let color = "";
  let advice = "";
  let percentage = 0;

  if (brightness < 60) {
    level = t('lux_low');
    color = "text-blue-600";
    advice = t('lux_advice_low');
    percentage = (brightness / 255) * 100;
  } else if (brightness < 140) {
    level = t('lux_medium');
    color = "text-green-600";
    advice = t('lux_advice_medium');
    percentage = (brightness / 255) * 100;
  } else {
    level = t('lux_high');
    color = "text-orange-500";
    advice = t('lux_advice_high');
    percentage = Math.min(100, (brightness / 255) * 100);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-nature-50">
          <div className="flex items-center gap-2 text-nature-700">
             <Sun className="w-6 h-6" />
             <h2 className="text-lg font-bold">{t('lux_title')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
           <p className="text-gray-600 text-center mb-6 text-sm">
             {t('lux_desc')}
           </p>

           <div className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden shadow-inner mb-6 border-4 border-gray-200">
              {!isScanning && !error && (
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-600 opacity-50" />
                 </div>
              )}
              {error && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
                    <p className="text-red-500 text-xs">{error}</p>
                 </div>
              )}
              <video 
                ref={videoRef} 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${isScanning ? 'opacity-100' : 'opacity-0'}`} 
              />
              <canvas ref={canvasRef} className="hidden" />
           </div>

           {isScanning && (
             <div className="w-full max-w-xs space-y-4 animate-fade-in">
                <div className="text-center">
                   <div className="text-4xl font-bold text-gray-800 mb-1">{Math.round(brightness)} <span className="text-sm text-gray-400 font-normal">val</span></div>
                   <div className={`text-lg font-bold ${color}`}>{level}</div>
                </div>

                {/* Gauge Bar */}
                <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden relative">
                   <div className="absolute left-[23%] top-0 bottom-0 w-0.5 bg-white z-10 opacity-50"></div> {/* Threshold low */}
                   <div className="absolute left-[55%] top-0 bottom-0 w-0.5 bg-white z-10 opacity-50"></div> {/* Threshold med */}
                   <div 
                     className={`h-full transition-all duration-300 ${brightness < 60 ? 'bg-blue-500' : brightness < 140 ? 'bg-green-500' : 'bg-orange-500'}`}
                     style={{ width: `${percentage}%` }}
                   ></div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600 text-center">
                   {advice}
                </div>
             </div>
           )}

           <div className="mt-auto pt-6 w-full">
             {!isScanning ? (
               <button 
                 onClick={startCamera}
                 className="w-full bg-nature-600 text-white py-3 rounded-xl font-bold hover:bg-nature-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
               >
                 <Camera className="w-5 h-5" /> {t('start_measure')}
               </button>
             ) : (
               <button 
                 onClick={stopCamera}
                 className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-colors"
               >
                 {t('stop_measure')}
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
