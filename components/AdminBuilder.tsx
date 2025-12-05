
import React, { useState, useEffect, useRef } from 'react';
import { Save, Shield, Cpu, Code, Image as ImageIcon, Terminal, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AdminConfig } from '../types';
import { generateAdminConfigFromPrompt } from '../services/geminiService';

export const AdminBuilder: React.FC = () => {
  const [config, setConfig] = useState<AdminConfig>({
    systemInstruction: '',
    securityLevel: 'standard',
    features: { codeGeneration: true, imageAnalysis: true }
  });
  
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('hk_admin_config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setConfig({
        systemInstruction: "You are OFFICIAL HK AI, a helpful, intelligent, and secure AI assistant created by Hardik.",
        securityLevel: 'high',
        features: { codeGeneration: true, imageAnalysis: true }
      });
    }
    addLog("System initialized. Waiting for admin command...");
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `> ${new Date().toLocaleTimeString()}: ${msg}`]);
    setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, 100);
  };

  const handleExecutePrompt = async () => {
    if (!prompt.trim()) return;
    
    setIsProcessing(true);
    addLog(`Processing command: "${prompt}"`);
    addLog("Connecting to Gemini Neural Core...");

    try {
      const newConfig = await generateAdminConfigFromPrompt(prompt, config);
      
      addLog("Analysis complete. Generative configuration received.");
      addLog("Applying new security protocols...");
      addLog("Updating system instructions...");
      addLog("Adjusting feature flags...");
      
      setConfig(newConfig);
      localStorage.setItem('hk_admin_config', JSON.stringify(newConfig));
      
      addLog("SUCCESS: System reconfigured.");
      setPrompt('');
    } catch (error) {
      addLog("ERROR: Failed to reconfigure system.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSave = () => {
    localStorage.setItem('hk_admin_config', JSON.stringify(config));
    addLog("Manual configuration saved.");
    alert("System Updated Manually");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto text-white animate-fade-in font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/20">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter">AI BUILDER STUDIO</h1>
          <p className="text-purple-300 text-sm font-mono">Advanced Neural Configuration Interface</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Prompt Interface */}
        <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="text-purple-400" size={20}/> 
                    Generative Configuration
                </h2>
                <p className="text-slate-400 text-sm mb-4">
                    Describe how you want the AI to behave. The system will automatically adjust security, instructions, and features.
                </p>
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="E.g., 'Make the AI a strict coding tutor that refuses to talk about anything else and bans users who try to chat casually.' or 'Enable all features and be very friendly.'"
                        className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none font-medium"
                    />
                    <button
                        onClick={handleExecutePrompt}
                        disabled={isProcessing || !prompt.trim()}
                        className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <span className="animate-pulse">Building...</span> : <React.Fragment><Terminal size={16}/> Execute Build</React.Fragment>}
                    </button>
                </div>
            </div>

            {/* Terminal Logs */}
            <div className="bg-black border border-slate-800 rounded-2xl p-4 shadow-xl h-64 flex flex-col font-mono text-sm">
                <div className="flex items-center justify-between mb-2 border-b border-slate-800 pb-2">
                    <span className="text-slate-500 flex items-center gap-2"><Terminal size={14}/> System Log</span>
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 text-green-400/80 scrollbar-thin scrollbar-thumb-slate-800" ref={scrollRef}>
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                    {logs.length === 0 && <span className="text-slate-700 opacity-50">System ready...</span>}
                </div>
            </div>
        </div>

        {/* Right Column: Live State Visualizer */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Cpu className="text-blue-400" size={20}/> 
                    Live Core State
                </h2>
                <button onClick={handleManualSave} className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-white transition-colors">
                    Save Manual Changes
                </button>
            </div>

            <div className="space-y-6 flex-1">
                {/* Security Level */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Security Protocol</label>
                    <div className="flex gap-2">
                        {['standard', 'high', 'maximum'].map(level => (
                             <div 
                                key={level}
                                className={`flex-1 py-2 text-center rounded-lg text-xs font-bold uppercase transition-all ${config.securityLevel === level 
                                    ? level === 'maximum' ? 'bg-red-500 text-white shadow-lg shadow-red-900/50' : 'bg-blue-500 text-white shadow-lg shadow-blue-900/50' 
                                    : 'bg-slate-800 text-slate-500'}`}
                             >
                                {level}
                             </div>
                        ))}
                    </div>
                </div>

                {/* Features */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Feature Modules</label>
                    <div className="space-y-2">
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${config.features.codeGeneration ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800 border-transparent opacity-50'}`}>
                            <div className="flex items-center gap-3">
                                <Code size={18} className={config.features.codeGeneration ? "text-green-400" : "text-slate-500"} />
                                <span className={config.features.codeGeneration ? "text-green-100" : "text-slate-500"}>Code Generation</span>
                            </div>
                            {config.features.codeGeneration ? <CheckCircle2 size={16} className="text-green-400"/> : <AlertCircle size={16} className="text-slate-500"/>}
                        </div>
                        <div className={`flex items-center justify-between p-3 rounded-lg border ${config.features.imageAnalysis ? 'bg-pink-500/10 border-pink-500/30' : 'bg-slate-800 border-transparent opacity-50'}`}>
                            <div className="flex items-center gap-3">
                                <ImageIcon size={18} className={config.features.imageAnalysis ? "text-pink-400" : "text-slate-500"} />
                                <span className={config.features.imageAnalysis ? "text-pink-100" : "text-slate-500"}>Image Analysis</span>
                            </div>
                            {config.features.imageAnalysis ? <CheckCircle2 size={16} className="text-pink-400"/> : <AlertCircle size={16} className="text-slate-500"/>}
                        </div>
                    </div>
                </div>

                {/* System Prompt */}
                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 flex-1 flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">System Instructions</label>
                    <textarea 
                        className="w-full flex-1 bg-transparent border-none resize-none text-sm text-slate-300 focus:ring-0 font-mono"
                        value={config.systemInstruction}
                        onChange={(e) => setConfig({...config, systemInstruction: e.target.value})}
                    />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
