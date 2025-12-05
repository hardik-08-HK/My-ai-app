
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, Loader2, Bot, User as UserIcon, Globe, Sparkles, Brain, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { generateAIResponse } from '../services/geminiService';
import { Message, User, ModelMode } from '../types';

interface ChatInterfaceProps {
  user: User;
  onLogout: () => void;
  onBan: () => void;
  saveSession: (msgs: Message[]) => void;
  initialHistory?: Message[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  user, 
  onLogout, 
  onBan, 
  saveSession, 
  initialHistory 
}) => {
  const [messages, setMessages] = useState<Message[]>(initialHistory || []);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [mode, setMode] = useState<ModelMode>('standard');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImages([...selectedImages, base64String]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && selectedImages.length === 0) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      images: selectedImages,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setSelectedImages([]);
    setIsLoading(true);

    try {
      const response = await generateAIResponse(messages, userMsg.text, userMsg.images || [], mode);
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        generatedImage: response.generatedImage,
        timestamp: Date.now()
      };

      const finalHistory = [...newHistory, aiMsg];
      setMessages(finalHistory);
      saveSession(finalHistory);

    } catch (error: any) {
      if (error.message === 'SECURITY_VIOLATION') {
        onBan();
      } else {
        console.error(error);
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: "I encountered an error processing your request. Please try again.",
          timestamp: Date.now()
        };
        setMessages([...newHistory, errorMsg]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getModeIcon = () => {
    switch(mode) {
      case 'research': return <Globe size={18} className="text-blue-400" />;
      case 'creative': return <Sparkles size={18} className="text-purple-400" />;
      case 'thinking': return <Brain size={18} className="text-pink-400" />;
      default: return <Zap size={18} className="text-yellow-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
             <Bot size={64} className="mb-4" />
             <p className="text-lg font-medium">OFFICIAL HK AI</p>
             <p className="text-sm mt-2 max-w-xs text-center">Select a mode below to Start Searching, Creating, or Thinking.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
               {msg.role === 'model' && (
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex-shrink-0 flex items-center justify-center shadow-lg shadow-blue-500/20">
                   <Bot size={16} className="text-white" />
                 </div>
               )}
               
               <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-md ${
                 msg.role === 'user' 
                   ? 'bg-blue-600 text-white rounded-tr-none' 
                   : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
               }`}>
                 {msg.images && msg.images.length > 0 && (
                   <div className="flex flex-wrap gap-2 mb-3">
                     {msg.images.map((img, idx) => (
                       <img key={idx} src={img} alt="User upload" className="max-w-full h-48 object-cover rounded-lg border border-white/10" />
                     ))}
                   </div>
                 )}
                 <div className="prose prose-invert prose-sm max-w-none break-words">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
                 {msg.generatedImage && (
                   <div className="mt-3">
                     <img src={msg.generatedImage} alt="AI Generated" className="rounded-lg shadow-lg border border-slate-600 w-full max-w-sm" />
                   </div>
                 )}
               </div>

               {msg.role === 'user' && (
                 <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 flex items-center justify-center border border-slate-600 shadow-lg">
                   <UserIcon size={16} className="text-slate-300" />
                 </div>
               )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4 justify-start animate-fade-in">
             <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center animate-pulse">
               <Bot size={16} className="text-white" />
             </div>
             <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex items-center gap-2 rounded-tl-none">
               <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
               <span className="text-sm text-slate-400">
                 {mode === 'thinking' ? 'Deep thinking in progress...' : 
                  mode === 'research' ? 'Searching the web...' :
                  mode === 'creative' ? 'Generating creative content...' :
                  'Processing...'}
               </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        
        {/* Mode Selector */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setMode('standard')} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${mode === 'standard' ? 'bg-yellow-500/10 text-yellow-300 border-yellow-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
          >
            <Zap size={14} /> Flash
          </button>
          <button 
            onClick={() => setMode('research')} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${mode === 'research' ? 'bg-blue-500/10 text-blue-300 border-blue-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
          >
            <Globe size={14} /> Web Search
          </button>
          <button 
            onClick={() => setMode('creative')} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${mode === 'creative' ? 'bg-purple-500/10 text-purple-300 border-purple-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
          >
            <Sparkles size={14} /> Image Gen
          </button>
          <button 
            onClick={() => setMode('thinking')} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${mode === 'thinking' ? 'bg-pink-500/10 text-pink-300 border-pink-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
          >
            <Brain size={14} /> Deep Think
          </button>
        </div>

        {selectedImages.length > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-hide">
            {selectedImages.map((img, idx) => (
              <div key={idx} className="relative group flex-shrink-0">
                <img src={img} alt="Selected" className="h-20 w-20 object-cover rounded-xl border border-slate-600 shadow-md" />
                <button 
                  onClick={() => removeImage(idx)}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1 text-white shadow-lg transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-end gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-inner relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Upload Image"
          >
            <ImageIcon size={20} />
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask OFFICIAL HK AI (${mode} mode)...`}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[2.5rem] py-3 text-sm placeholder:text-slate-500"
            rows={1}
            style={{ height: 'auto', minHeight: '44px' }}
          />

          <button 
            onClick={handleSend}
            disabled={(!input.trim() && selectedImages.length === 0) || isLoading}
            className="p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
