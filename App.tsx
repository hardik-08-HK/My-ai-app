
import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  History, 
  Users, 
  Settings, 
  LogOut, 
  Bot, 
  Menu,
  ShieldCheck,
  Zap,
  CheckCircle,
  X
} from 'lucide-react';
import { ChatInterface } from './components/ChatInterface';
import { AdminBuilder } from './components/AdminBuilder';
import { User, Message, ChatSession, ViewState } from './types';

const ADMIN_EMAIL = 'hardikomer8@gmail.com';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('landing');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Admin view
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Security State
  const [bannedScreen, setBannedScreen] = useState(false);

  // Load persistence
  useEffect(() => {
    const storedUser = localStorage.getItem('hk_user');
    const storedSessions = localStorage.getItem('hk_sessions');
    const storedAllUsers = localStorage.getItem('hk_all_users');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.isBanned) {
          setBannedScreen(true);
        } else {
          setUser(parsedUser);
          setView('chat'); 
        }
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
    
    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch (e) { console.error(e); }
    }
    
    if (storedAllUsers) {
      try {
        setAllUsers(JSON.parse(storedAllUsers));
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleStartSearching = () => {
    if (user) {
      setView('chat');
    } else {
      setShowLoginModal(true);
    }
  };

  const handleGoogleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(!loginEmail.trim()) return;

    setIsLoggingIn(true);
    
    // Simulate Network Delay
    setTimeout(() => {
        setIsLoggingIn(false);
        setShowLoginModal(false);
        processLogin(loginEmail);
        setLoginEmail('');
    }, 1500);
  };

  const processLogin = (email: string) => {
    // Check if user exists in our "DB"
    let loggingUser = allUsers.find(u => u.email === email);
    
    if (loggingUser && loggingUser.isBanned) {
      setBannedScreen(true);
      return;
    }

    // New User Draft
    const newUserDraft: User = loggingUser || {
      email: email,
      name: email.split('@')[0],
      isAdmin: email === ADMIN_EMAIL,
      isBanned: false,
      agreedToTerms: false,
      joinedAt: new Date().toISOString()
    };
    
    // Check Terms
    if (!newUserDraft.agreedToTerms) {
       localStorage.setItem('hk_temp_login', JSON.stringify(newUserDraft));
       setShowTerms(true);
    } else {
       completeLogin(newUserDraft);
    }
  };

  const completeLogin = (u: User) => {
    u.agreedToTerms = true;
    setUser(u);
    localStorage.setItem('hk_user', JSON.stringify(u));
    
    if (!allUsers.find(existing => existing.email === u.email)) {
       const updatedUsers = [...allUsers, u];
       setAllUsers(updatedUsers);
       localStorage.setItem('hk_all_users', JSON.stringify(updatedUsers));
    }
    setView('chat');
  };

  const handleTermsAgree = () => {
    const temp = localStorage.getItem('hk_temp_login');
    if (temp) {
      const u = JSON.parse(temp);
      completeLogin(u);
      setShowTerms(false);
      localStorage.removeItem('hk_temp_login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hk_user');
    setUser(null);
    setView('landing');
    setCurrentSessionId(null);
  };

  const handleBan = () => {
    if (!user) return;
    const bannedUser = { ...user, isBanned: true };
    setUser(bannedUser); // Update local state
    
    // Update persistence
    localStorage.setItem('hk_user', JSON.stringify(bannedUser));
    
    // Update All Users DB
    const updatedAllUsers = allUsers.map(u => u.email === user.email ? bannedUser : u);
    setAllUsers(updatedAllUsers);
    localStorage.setItem('hk_all_users', JSON.stringify(updatedAllUsers));
    
    setBannedScreen(true);
  };

  const saveCurrentSession = (messages: Message[]) => {
    if (!user) return;
    
    let updatedSessions;
    if (currentSessionId) {
      updatedSessions = sessions.map(s => 
        s.id === currentSessionId ? { ...s, messages } : s
      );
    } else {
      const newId = Date.now().toString();
      setCurrentSessionId(newId);
      const newSession: ChatSession = {
        id: newId,
        title: messages[0].text.slice(0, 30) + "...",
        messages,
        createdAt: Date.now()
      };
      updatedSessions = [newSession, ...sessions];
    }
    
    setSessions(updatedSessions);
    localStorage.setItem('hk_sessions', JSON.stringify(updatedSessions));
  };

  // --- RENDER HELPERS ---

  if (bannedScreen) {
    return (
      <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-4 text-center">
        <ShieldAlert className="w-24 h-24 text-red-500 mb-6 animate-pulse" />
        <h1 className="text-4xl font-bold text-white mb-4">ACCESS DENIED</h1>
        <h2 className="text-2xl font-mono text-red-400 mb-8">ACCOUNT BANNED PERMANENTLY</h2>
        <p className="text-gray-300 max-w-md bg-black/50 p-6 rounded-lg border border-red-800">
          The OFFICIAL HK AI Security System detected a violation of our core protocols. 
          Misuse, hacking attempts, or policy violations result in an immediate, irreversible ban.
        </p>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          className="mt-8 text-sm text-red-400 underline hover:text-red-300"
        >
          Reset Local Data (Debug)
        </button>
      </div>
    );
  }

  // --- LANDING PAGE ---
  if (!user || view === 'landing') {
    return (
      <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px]"></div>
           <div className="absolute top-1/2 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
           <div className="flex items-center gap-2">
             <Bot className="w-8 h-8 text-blue-400" />
             <span className="font-bold text-xl tracking-wider">OFFICIAL HK AI</span>
           </div>
           <button 
             onClick={handleStartSearching}
             className="px-6 py-2 border border-blue-500 text-blue-400 rounded-full hover:bg-blue-500/10 transition-colors"
           >
             Sign In
           </button>
        </header>

        {/* Hero */}
        <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
          <div className="mb-6 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-medium animate-fade-in-up">
             ✨ Next Gen Artificial Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 max-w-4xl leading-tight">
            The Future of Intelligence is Here
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            Experience the most advanced AI chatbot. Generate code, analyze images, and explore limitless possibilities with OFFICIAL HK AI. Secure, fast, and intelligent.
          </p>
          
          <button 
            onClick={handleStartSearching}
            className="group relative px-8 py-4 bg-blue-600 rounded-full text-lg font-bold shadow-lg shadow-blue-600/40 hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Searching <Zap className="w-5 h-5 group-hover:text-yellow-300 transition-colors" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-5xl w-full text-left">
            {[
              { icon: <Bot />, title: "Smart Chat", desc: "Advanced conversation engine for any topic." },
              { icon: <Users />, title: "Secure Accounts", desc: "Enterprise-grade Google Auth security." },
              { icon: <ShieldCheck />, title: "Admin Controlled", desc: "Real-time updates and strict moderation." }
            ].map((f, i) => (
              <div key={i} className="p-6 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:bg-slate-800 transition-colors">
                <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-blue-400 mb-4">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </main>

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                <button 
                  onClick={() => setShowLoginModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
                
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Bot className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold">Sign in to HK AI</h2>
                  <p className="text-slate-500 mt-1">Unlock the power of Gemini Intelligence</p>
                </div>

                <form onSubmit={handleGoogleLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="Enter your email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-colors shadow-sm"
                  >
                     {isLoggingIn ? (
                       <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                     ) : (
                       <>
                         <GoogleIcon />
                         Continue with Google
                       </>
                     )}
                  </button>
                </form>
                
                <p className="text-center text-xs text-slate-400 mt-6">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
             </div>
          </div>
        )}

        {/* T&C Modal */}
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                 <ShieldCheck className="text-green-400 w-8 h-8" />
                 <h2 className="text-2xl font-bold">Terms & Policy</h2>
              </div>
              
              <div className="h-48 overflow-y-auto bg-slate-950 p-4 rounded-lg mb-4 text-sm text-slate-300 border border-slate-800 space-y-3">
                <p><strong>1. Data Storage:</strong> By using OFFICIAL HK AI, you agree that your account details and chat history are securely stored with us.</p>
                <p><strong>2. Security:</strong> Any attempt to hack, misuse, or exploit the AI will result in an immediate and permanent ban. We employ advanced monitoring systems.</p>
                <p><strong>3. Usage:</strong> You are responsible for the content you generate. The admin reserves the right to manage the platform integrity.</p>
                <p><strong>4. Admin Access:</strong> The administrator (hardikomer8@gmail.com) has full oversight of the platform's user base and security.</p>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                 <button 
                   onClick={() => { setShowTerms(false); localStorage.removeItem('hk_temp_login'); }} 
                   className="px-4 py-2 text-slate-400 hover:text-white"
                 >
                   Decline
                 </button>
                 <button 
                   onClick={handleTermsAgree} 
                   className="px-6 py-2 bg-blue-600 rounded-lg font-bold hover:bg-blue-500 text-white flex items-center gap-2"
                 >
                   <CheckCircle size={16} /> I Agree
                 </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- MAIN APP ---
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`fixed md:relative z-40 w-64 h-full bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
           <div className="font-bold text-lg tracking-wider text-blue-400 flex items-center gap-2">
             <Bot /> OFFICIAL HK
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400"><Menu /></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-6">
             <button 
               onClick={() => { 
                 setCurrentSessionId(null); 
                 setView('chat'); 
                 setIsSidebarOpen(false);
               }}
               className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
             >
               <Zap size={18} /> New Search
             </button>
          </div>

          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">History</div>
          <div className="px-2 space-y-1">
             {sessions.map(s => (
               <button
                 key={s.id}
                 onClick={() => {
                   setCurrentSessionId(s.id);
                   setView('chat');
                   setIsSidebarOpen(false);
                 }}
                 className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate flex items-center gap-2 ${currentSessionId === s.id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50'}`}
               >
                 <History size={14} /> {s.title}
               </button>
             ))}
             {sessions.length === 0 && <div className="px-3 text-sm text-slate-600 italic">No history yet</div>}
          </div>

          {user.isAdmin && (
            <>
              <div className="mt-8 px-4 py-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">Admin Controls</div>
              <div className="px-2 space-y-1">
                <button 
                  onClick={() => { setView('admin-builder'); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${view === 'admin-builder' ? 'bg-purple-900/30 text-purple-300' : 'text-slate-400 hover:text-purple-300 hover:bg-purple-900/10'}`}
                >
                  <Settings size={16} /> AI Builder
                </button>
                <button 
                  onClick={() => { setView('admin-users'); setIsSidebarOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${view === 'admin-users' ? 'bg-purple-900/30 text-purple-300' : 'text-slate-400 hover:text-purple-300 hover:bg-purple-900/10'}`}
                >
                  <Users size={16} /> User Accounts
                </button>
              </div>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-lg">
               {user.name.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium truncate">{user.name}</p>
               <p className="text-xs text-slate-500 truncate">{user.email}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-red-950/30 py-2 rounded-lg transition-colors text-sm"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <div className="md:hidden p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
           <span className="font-bold">OFFICIAL HK AI</span>
           <button onClick={() => setIsSidebarOpen(true)}><Menu /></button>
        </div>

        {view === 'chat' && (
          <ChatInterface 
            user={user}
            onLogout={handleLogout}
            onBan={handleBan}
            saveSession={saveCurrentSession}
            initialHistory={sessions.find(s => s.id === currentSessionId)?.messages}
            key={currentSessionId || 'new'} 
          />
        )}

        {view === 'admin-builder' && user.isAdmin && (
          <div className="flex-1 overflow-y-auto bg-slate-900">
             <AdminBuilder />
          </div>
        )}

        {view === 'admin-users' && user.isAdmin && (
          <div className="flex-1 overflow-y-auto bg-slate-900 p-8">
             <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Users className="text-purple-400" /> User Database</h1>
             <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-slate-950 text-slate-400 text-sm uppercase">
                   <tr>
                     <th className="p-4">User</th>
                     <th className="p-4">Email</th>
                     <th className="p-4">Role</th>
                     <th className="p-4">Status</th>
                     <th className="p-4">Joined</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700">
                   {allUsers.map((u, i) => (
                     <tr key={i} className="hover:bg-slate-700/50">
                       <td className="p-4 font-medium text-white">{u.name}</td>
                       <td className="p-4 text-slate-300 font-mono text-sm">{u.email}</td>
                       <td className="p-4">
                         {u.isAdmin ? 
                           <span className="bg-purple-900 text-purple-300 px-2 py-1 rounded text-xs font-bold">ADMIN</span> : 
                           <span className="text-slate-400 text-sm">User</span>
                         }
                       </td>
                       <td className="p-4">
                         {u.isBanned ? 
                           <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs font-bold flex w-fit items-center gap-1"><ShieldAlert size={12}/> BANNED</span> : 
                           <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs">Active</span>
                         }
                       </td>
                       <td className="p-4 text-slate-500 text-sm">{new Date(u.joinedAt).toLocaleDateString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
