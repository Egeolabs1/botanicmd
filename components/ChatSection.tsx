import React, { useState, useRef, useEffect } from 'react';
import { PlantData, ChatMessage } from '../types';
import { askPlantExpert } from '../services/geminiService';
import { Send, MessageCircle, Leaf } from './Icons';
import { useLanguage } from '../i18n';

interface ChatSectionProps {
  plantData: PlantData;
}

export const ChatSection: React.FC<ChatSectionProps> = ({ plantData }) => {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await askPlantExpert(plantData, userMessage, language);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: t('error_title') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-nature-100 pt-8 animate-fade-in">
      <h3 className="text-xl font-bold text-nature-900 flex items-center gap-2 mb-6">
        <MessageCircle className="w-6 h-6" />
        {t('chat_title')}
      </h3>

      <div className="bg-nature-50/50 rounded-2xl border border-nature-100 overflow-hidden flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <Leaf className="w-12 h-12 mb-3 opacity-20" />
              <p>{t('chat_placeholder')}</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-nature-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-nature-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-nature-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-nature-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-nature-100">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t('chat_placeholder')}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-nature-500 focus:border-transparent bg-gray-50 transition-all"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim() || isLoading}
              className="bg-nature-600 text-white p-3 rounded-xl hover:bg-nature-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-nature-200"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};