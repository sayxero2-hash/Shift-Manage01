import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import { 
  ShieldCheck, UserPlus, ArrowLeft, Users, Building2, Calendar, 
  LayoutDashboard, LogOut, Send, Globe, Bot, User, Plus, FileText, 
  Printer, UserMinus, UserCheck, Copy, Check, Edit3, Clock, 
  ClipboardPaste, ShieldAlert, CheckCircle, XCircle, AlertTriangle, 
  RefreshCw, Trash2, Search, UserCog, LogIn
} from 'lucide-react';

import CheckInPage from './components/CheckInPage';
import CheckOutPage from './components/CheckOutPage';
import PayrollSummaryPage from './components/PayrollSummaryPage';

type Language = 'en' | 'my' | 'th' | 'zh';
type ActiveTab = 'dashboard' | 'checkin' | 'checkout' | 'payroll' | 'team' | 'admin';

interface UserProfile {
  name: string;
  identifier: string;
  role: 'spd' | 'team_admin' | 'employee';
  assignedTeam: string;
}

const translations = {
  en: { appName: "ShiftMaster HR", signIn: "Sign In", signUp: "Sign Up", signOut: "Sign Out", welcome: "Welcome back" },
  my: { appName: "ShiftMaster HR", signIn: "အကောင့်ဝင်ရန်", signUp: "အကောင့်အသစ်ဖွင့်ရန်", signOut: "ထွက်ရန်", welcome: "ပြန်လည်ကြိုဆိုပါတယ်" },
  th: { appName: "ShiftMaster HR", signIn: "เข้าสู่ระบบ", signUp: "สมัครสมาชิก", signOut: "ออกจากระบบ", welcome: "ยินดีต้อนรับกลับมา" },
  zh: { appName: "ShiftMaster HR", signIn: "登录", signUp: "注册", signOut: "登出", welcome: "欢迎回来" }
};

export default function App() {
  const [lang, setLang] = useState<Language>('my');
  const t = translations[lang];

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('shiftmaster_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !currentUser) {
          setCurrentUser({
            name: session.user.email?.split('@')[0] || 'User',
            identifier: session.user.email || '',
            role: 'team_admin',
            assignedTeam: 'Team A'
          });
        }
      } catch (err) {
        console.error('Session check error:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('shiftmaster_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('shiftmaster_current_user');
    }
  }, [currentUser]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    if (identifier.trim().toLowerCase() === 'sayxero2@gmail.com' && password === 'sayxero#100') {
      setCurrentUser({ name: 'SPD Master', identifier, role: 'spd', assignedTeam: 'All Teams' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email: identifier, password });
    if (error) {
      alert('Login failed: ' + error.message);
      return;
    }

    if (data.user) {
      setCurrentUser({
        name: data.user.email?.split('@')[0] || identifier,
        identifier,
        role: 'team_admin',
        assignedTeam: 'Team A'
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password || !fullName) return;

    const { error } = await supabase.auth.signUp({ email: identifier, password });
    if (error) {
      alert('Sign up failed: ' + error.message);
      return;
    }
    alert('Account created successfully! Please sign in.');
    setAuthMode('login');
  };

  const LanguageSelector = () => (
    <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-2 py-1 rounded-xl">
      <Globe className="w-4 h-4 text-indigo-400" />
      <select 
        value={lang} 
        onChange={(e) => setLang(e.target.value as Language)}
        className="bg-transparent text-xs text-white font-medium outline-none cursor-pointer"
      >
        <option value="my" className="bg-slate-900">မြန်မာ</option>
        <option value="en" className="bg-slate-900">English</option>
        <option value="th" className="bg-slate-900">ไทย</option>
        <option value="zh" className="bg-slate-900">中文</option>
      </select>
    </div>
  );

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 font-medium">Loading ShiftMaster HR...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white mb-2"><ShieldCheck className="w-8 h-8" /></div>
            <h1 className="text-xl font-bold">{t.appName}</h1>
            <p className="text-xs text-slate-400 mt-1">Supabase Secure Portal</p>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label>
                <input type="email" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="name@company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-indigo-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> {t.signIn}</button>
              <div className="text-center text-sm mt-3"><span className="text-slate-400">Don't have an account? </span><button type="button" onClick={() => setAuthMode('signup')} className="text-indigo-400 font-semibold">{t.signUp}</button></div>
            </form>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email</label>
                <input type="email" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="name@company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-emerald-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> {t.signUp}</button>
              <div className="text-center mt-3"><button type="button" onClick={() => setAuthMode('login')} className="text-slate-400 text-sm flex items-center gap-1 mx-auto"><ArrowLeft className="w-4 h-4" /> Back to Sign In</button></div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><Building2 className="w-5 h-5" /></div>
            <span className="font-bold text-base">{t.appName}</span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button onClick={() => { supabase.auth.signOut(); localStorage.removeItem('shiftmaster_current_user'); setCurrentUser(null); }} className="p-2 bg-slate-800 hover:bg-rose-600/20 text-slate-300 rounded-xl" title={t.signOut}><LogOut className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Navigation Tabs including CheckIn, CheckOut, Payroll components */}
        <div className="bg-slate-900/90 border-t border-slate-800 flex justify-around py-2.5 overflow-x-auto text-xs font-semibold">
          <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('checkin')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'checkin' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Check-In</button>
          <button onClick={() => setActiveTab('checkout')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'checkout' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Check-Out</button>
          <button onClick={() => setActiveTab('payroll')} className={`px-3 py-1.5 rounded-lg ${activeTab === 'payroll' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Payroll Summary</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <h2 className="text-lg font-bold">{t.welcome}, {currentUser.name}! 👋</h2>
            <p className="text-xs text-indigo-400 mt-1 uppercase">Role: {currentUser.role} • Team: {currentUser.assignedTeam}</p>
            <p className="text-xs text-slate-400 mt-4">Use the top navigation tabs to switch between Check-In, Check-Out, and Payroll Summary terminals.</p>
          </div>
        )}

        {activeTab === 'checkin' && <CheckInPage />}
        {activeTab === 'checkout' && <CheckOutPage />}
        {activeTab === 'payroll' && <PayrollSummaryPage />}
      </main>
    </div>
  );
}
