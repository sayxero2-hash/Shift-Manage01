import React, { useState } from 'react';
import { 
  LogIn, Clock, ShieldCheck, UserCheck, UserPlus, KeyRound, 
  ArrowLeft, Users, Building2, Calendar, LayoutDashboard, 
  LogOut, CheckCircle2, Send, Globe, Bot, User 
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';
type ActiveTab = 'dashboard' | 'shifts' | 'team';
type Language = 'en' | 'my' | 'th' | 'zh';

interface UserProfile {
  name: string;
  identifier: string;
  role: 'admin' | 'manager' | 'employee';
  teamName: string;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

// Translations dictionary
const translations = {
  en: {
    appName: "ShiftMaster HR",
    signIn: "Sign In",
    signUp: "Sign Up",
    dashboard: "Dashboard",
    shiftRoster: "Shift Roster",
    teamMembers: "Team Members",
    welcome: "Welcome back",
    checkInChatTitle: "Shift Assistant & Attendance Chat",
    checkInPrompt: "Type 'Check In' or 'Check Out' or click the buttons below:",
    checkInBtn: "Check In",
    checkOutBtn: "Check Out",
    alreadyCheckedIn: "You are already checked in for today!",
    checkedInSuccess: "✅ Successfully checked in at",
    checkedOutSuccess: "👋 Successfully checked out. Have a great day!",
    signOut: "Sign Out",
  },
  my: {
    appName: "ShiftMaster HR",
    signIn: "အကောင့်ဝင်ရန်",
    signUp: "အကောင့်အသစ်ဖွင့်ရန်",
    dashboard: "ပင်မစာမျက်နှာ",
    shiftRoster: "အလုပ်ချိန်ဇယား",
    teamMembers: "အဖွဲ့ဝင်များ",
    welcome: "ပြန်လည်ကြိုဆိုပါတယ်",
    checkInChatTitle: "အလုပ်တက်/ဆင်း စာရင်းပေးရန် Chat လက်ထောက်",
    checkInPrompt: "'Check In' (သို့) 'Check Out' ဟု ရိုက်ထည့်ပါ သို့မဟုတ် အောက်ပါခလုတ်များကို နှိပ်ပါ -",
    checkInBtn: "အလုပ်စတင်ဝင်ရောက်ရန် (Check In)",
    checkOutBtn: "အလုပ်ဆင်းရန် (Check Out)",
    alreadyCheckedIn: "ယနေ့အတွက် အလုပ်ဝင်ရောက်ပြီးသား ဖြစ်ပါသည်။",
    checkedInSuccess: "✅ အလုပ်စတင်ဝင်ရောက်ချိန် -",
    checkedOutSuccess: "👋 အလုပ်ဆင်းပါပြီ။ နေ့ရက်ကောင်းလေး ဖြစ်ပါစေ!",
    signOut: "ထွက်ရန်",
  },
  th: {
    appName: "ShiftMaster HR",
    signIn: "เข้าสู่ระบบ",
    signUp: "สมัครสมาชิก",
    dashboard: "แผงควบคุม",
    shiftRoster: "ตารางกะงาน",
    teamMembers: "สมาชิกในทีม",
    welcome: "ยินดีต้อนรับกลับมา",
    checkInChatTitle: "ผู้ช่วยแชทบันทึกเวลาทำงาน",
    checkInPrompt: "พิมพ์ 'Check In' หรือ 'Check Out' หรือคลิกปุ่มด้านล่าง:",
    checkInBtn: "ลงชื่อเข้างาน",
    checkOutBtn: "ลงชื่อ 1 ออกงาน",
    alreadyCheckedIn: "คุณได้ลงชื่อเข้างานสำหรับวันนี้แล้ว!",
    checkedInSuccess: "✅ ลงชื่อเข้างานสำเร็จเมื่อเวลา",
    checkedOutSuccess: "👋 ลงชื่อออกงานเรียบร้อยแล้ว ขอให้เป็นวันที่ดี!",
    signOut: "ออกจากระบบ",
  },
  zh: {
    appName: "ShiftMaster HR",
    signIn: "登录",
    signUp: "注册",
    dashboard: "仪表盘",
    shiftRoster: "排班表",
    team成员: "团队成员",
    welcome: "欢迎回来",
    checkInChatTitle: "考勤助手聊天",
    checkInPrompt: "输入 'Check In' 或 'Check Out' 或点击下方按钮：",
    checkInBtn: "签到",
    checkOutBtn: "签退",
    alreadyCheckedIn: "您今天已经签到了！",
    checkedInSuccess: "✅ 签到成功，时间：",
    checkedOutSuccess: "👋 签退成功，祝您有美好的一天！",
    signOut: "登出",
  }
};

export default function App() {
  const [lang, setLang] =- useState<Language>('my'); // Default to Myanmar
  const t = translations[lang];

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('Engineering');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Chat Check-in State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! I am your Shift Assistant. Type "Check In" or "Check Out" to manage your attendance.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);

  const teams = ['Engineering', 'HR & Operations', 'Sales & Marketing', 'Customer Support'];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password) {
      const isAdmin = identifier.toLowerCase().includes('admin');
      setCurrentUser({
        name: fullName || (identifier.includes('@') ? identifier.split('@')[0] : 'Employee'),
        identifier: identifier,
        role: isAdmin ? 'admin' : 'employee',
        teamName: selectedTeam,
      });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password && fullName) {
      alert('Account created successfully! Please sign in.');
      setAuthMode('login');
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier) {
      alert(`Password reset instructions sent to: ${identifier}`);
      setAuthMode('login');
    }
  };

  // Chat message sender logic
  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages: ChatMessage[] = [...chatMessages, { sender: 'user', text, time: currentTime }];
    setChatMessages(newMessages);
    setInputMessage('');

    setTimeout(() => {
      let botReply = "";
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('check in') || lowerText.includes('check-in') || lowerText.includes('ဝင်')) {
        if (isCheckedIn) {
          botReply = t.alreadyCheckedIn;
        } else {
          setIsCheckedIn(true);
          botReply = `${t.checkedInSuccess} ${currentTime}`;
        }
      } else if (lowerText.includes('check out') || lowerText.includes('check-out') || lowerText.includes('ဆင်း')) {
        if (!isCheckedIn) {
          botReply = "You haven't checked in yet today!";
        } else {
          setIsCheckedIn(false);
          botReply = t.checkedOutSuccess;
        }
      } else {
        botReply = "I understand. You can type 'Check In' to start your shift or 'Check Out' when you finish.";
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 600);
  };

  // Language selector UI component
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

  // 1. AUTHENTICATION SCREENS
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white">
        <div className="absolute top-4 right-4">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 mb-3 text-white">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{t.appName}</h1>
            <p className="text-slate-400 text-sm mt-1 text-center">
              {authMode === 'login' && 'Sign in to access your team shift portal'}
              {authMode === 'signup' && 'Create your employee or admin account'}
              {authMode === 'reset' && 'Recover your account password'}
            </p>
          </div>

          {/* Login Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email or Phone</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                  placeholder="name@company.com or 09xxxxxxxxx"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('reset')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Forgot?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 mt-2 text-sm"
              >
                <LogIn className="w-4 h-4" /> {t.signIn}
              </button>

              <div className="text-center mt-6 text-sm">
                <span className="text-slate-400">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {t.signUp}
                </button>
              </div>
            </form>
          )}

          {/* Sign Up Form */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email or Phone</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                  placeholder="name@company.com or 09xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Department / Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                >
                  {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2 text-sm"
              >
                <UserPlus className="w-4 h-4" /> {t.signUp}
              </button>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-1.5 mx-auto transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            </form>
          )}

          {/* Reset Password Form */}
          {authMode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Registered Email / Phone</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                  placeholder="name@company.com or 09xxxxxxxxx"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 mt-2 text-sm"
              >
                <KeyRound className="w-4 h-4" /> Send Reset Link
              </button>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-1.5 mx-auto transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // 2. MAIN APP DASHBOARD WITH CHAT CHECK-IN & MULTI-LANGUAGE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight">{t.appName}</span>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> {t.dashboard}
            </button>
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'shifts' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" /> {t.shiftRoster}
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'team' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" /> {t.teamMembers}
            </button>
          </nav>

          {/* User Profile, Language Selector & Logout */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-white capitalize">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-400 uppercase font-semibold">{currentUser.role} • {currentUser.teamName}</p>
            </div>
            <button
              onClick={() => setCurrentUser(null)}
              className="p-2 bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-300 rounded-xl transition-all border border-slate-700"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{t.welcome}, {currentUser.name}! 👋</h2>
                <p className="text-slate-400 text-sm mt-1">{currentUser.teamName} team attendance & shift portal.</p>
              </div>
              <div className="bg-indigo-600/20 border border-indigo-500/30 px-4 py-2 rounded-2xl text-indigo-300 text-xs font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {currentUser.teamName}
              </div>
            </div>

            {/* CHAT-STYLE CHECK-IN / CHECK-OUT INTERFACE */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[500px]">
              {/* Chat Header */}
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600/20 border border-indigo-500/30 p-2.5 rounded-2xl text-indigo-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{t.checkInChatTitle}</h3>
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online Bot Assistant
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isCheckedIn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {isCheckedIn ? 'Status: Checked In' : 'Status: Off Duty'}
                </span>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900/50">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                    }`}>
                      <p>{msg.text}</p>
                      <span className={`text-[10px] mt-1.5 block ${msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                        {msg.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Action Buttons for Chat */}
              <div className="px-6 py-2 bg-slate-950/40 border-t border-slate-800/60 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Quick Actions:</span>
                <button
                  onClick={() => handleSendMessage('Check In')}
                  className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t.checkInBtn}
                </button>
                <button
                  onClick={() => handleSendMessage('Check Out')}
                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" /> {t.checkOutBtn}
                </button>
              </div>

              {/* Chat Input Footer */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.checkInPrompt}
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 text-white outline-none text-sm"
                />
                <button
                  onClick={() => handleSendMessage()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">{t.shiftRoster}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <div key={day} className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-indigo-400">{day}</span>
                  <h4 className="font-bold text-white mt-1 text-sm">Morning Shift</h4>
                  <p className="text-xs text-slate-400 mt-2">09:00 AM - 05:00 PM</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-white">{currentUser.teamName} {t.teamMembers}</h3>
            <div className="space-y-3 mt-4">
              {[
                { name: currentUser.name, role: currentUser.role, status: 'Online' },
                { name: 'Alex Morgan', role: 'Manager', status: 'In Shift' },
                { name: 'Sarah Connor', role: 'Employee', status: 'Off Duty' },
              ].map((member, i) => (
                <div key={i} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{member.name}</h4>
                      <p className="text-xs text-slate-400 uppercase">{member.role}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        ShiftMaster HR SaaS Platform &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}

