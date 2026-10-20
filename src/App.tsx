import React, { useState } from 'react';
import { 
  LogIn, Clock, ShieldCheck, UserPlus, KeyRound, 
  ArrowLeft, Users, Building2, Calendar, LayoutDashboard, 
  LogOut, CheckCircle2, Send, Globe, Bot, User, Plus, FileText, Download, Printer 
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';
type ActiveTab = 'dashboard' | 'shifts' | 'team' | 'attendance' | 'admin';
type Language = 'en' | 'my' | 'th' | 'zh';

interface UserProfile {
  name: string;
  identifier: string;
  role: 'spd' | 'admin' | 'employee';
  teamName: string;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  time: string;
}

const translations = {
  en: {
    appName: "ShiftMaster HR",
    signIn: "Sign In",
    signUp: "Sign Up",
    dashboard: "Dashboard",
    shiftRoster: "Shift Roster",
    teamMembers: "Team Members",
    workDaysOT: "Work Days / OT",
    spdControl: "SPD Control Panel",
    welcome: "Welcome back",
    checkInChatTitle: "Shift Assistant & Attendance Chat",
    checkInPrompt: "Type 'Check In' or 'Check Out' or click below:",
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
    workDaysOT: "အလုပ်ရက် / အိုတီ (WD/OT)",
    spdControl: "အက်ပ်ပိုင်ရှင် (SPD) ထိန်းချုပ်ရန်",
    welcome: "ပြန်လည်ကြိုဆိုပါတယ်",
    checkInChatTitle: "အလုပ်တက်/ဆင်း စာရင်းပေးရန် Chat လက်ထောက်",
    checkInPrompt: "'Check In' (သို့) 'Check Out' ဟု ရိုက်ထည့်ပါ -",
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
    workDaysOT: "วันทำงาน / OT",
    spdControl: "แผงควบคุม SPD",
    welcome: "ยินดีต้อนรับกลับมา",
    checkInChatTitle: "ผู้ช่วยแชทบันทึกเวลาทำงาน",
    checkInPrompt: "พิมพ์ 'Check In' หรือ 'Check Out':",
    checkInBtn: "ลงชื่อเข้างาน",
    checkOutBtn: "ลงชื่อออกงาน",
    alreadyCheckedIn: "คุณได้ลงชื่อเข้างานสำหรับวันนี้แล้ว!",
    checkedInSuccess: "✅ ลงชื่อเข้างานสำเร็จเมื่อเวลา",
    checkedOutSuccess: "👋 ลงชื่อออกงานเรียบร้อยแล้ว",
    signOut: "ออกจากระบบ",
  },
  zh: {
    appName: "ShiftMaster HR",
    signIn: "登录",
    signUp: "注册",
    dashboard: "仪表盘",
    shiftRoster: "排班表",
    teamMembers: "团队成员",
    workDaysOT: "工作日 / 加班",
    spdControl: "SPD 控制面板",
    welcome: "欢迎回来",
    checkInChatTitle: "考勤助手聊天",
    checkInPrompt: "输入 'Check In' 或 'Check Out'：",
    checkInBtn: "签到",
    checkOutBtn: "签退",
    alreadyCheckedIn: "您今天已经签到了！",
    checkedInSuccess: "✅ 签到成功，时间：",
    checkedOutSuccess: "👋 签退成功！",
    signOut: "登出",
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('my');
  const t = translations[lang];

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // SPD / Admin managed teams & staff list
  const [teams, setTeams] = useState<string[]>(['Engineering', 'HR & Operations', 'Sales & Marketing']);
  const [newTeamName, setNewTeamName] = useState('');
  const [staffList, setStaffList] = useState([
    { id: 'PPS50', name: 'Mr. Zaw Lin Maung', role: 'employee', team: 'Engineering', status: 'Online' },
    { id: 'PPS61', name: 'Miss. Hla Hla Win', role: 'employee', team: 'HR & Operations', status: 'Off Duty' },
    { id: 'PPS69', name: 'Mr. Aung Myo Myat', role: 'employee', team: 'Sales & Marketing', status: 'Online' }
  ]);

  // Chat Check-in State
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! Type "Check In" or "Check Out" to manage your attendance.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password) {
      const lowerId = identifier.toLowerCase();
      let role: 'spd' | 'admin' | 'employee' = 'employee';
      if (lowerId.includes('spd')) role = 'spd';
      else if (lowerId.includes('admin')) role = 'admin';

      setCurrentUser({
        name: fullName || (identifier.includes('@') ? identifier.split('@')[0] : 'User'),
        identifier: identifier,
        role: role,
        teamName: teams[0],
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

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName && !teams.includes(newTeamName)) {
      setTeams([...teams, newTeamName]);
      setNewTeamName('');
    }
  };

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
      
      if (lowerText.includes('check in') || lowerText.includes('ဝင်')) {
        if (isCheckedIn) {
          botReply = t.alreadyCheckedIn;
        } else {
          setIsCheckedIn(true);
          botReply = `${t.checkedInSuccess} ${currentTime}`;
        }
      } else if (lowerText.includes('check out') || lowerText.includes('ဆင်း')) {
        if (!isCheckedIn) {
          botReply = "You haven't checked in yet today!";
        } else {
          setIsCheckedIn(false);
          botReply = t.checkedOutSuccess;
        }
      } else {
        botReply = "Please type 'Check In' or 'Check Out'.";
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }, 500);
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
        <div className="absolute top-4 right-4"><LanguageSelector /></div>
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white mb-2"><ShieldCheck className="w-8 h-8" /></div>
            <h1 className="text-xl font-bold">{t.appName}</h1>
            <p className="text-xs text-slate-400 mt-1">Sign in (Use 'spd' or 'admin' in username for control access)</p>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email / Phone (SPD use 'spd')</label>
                <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="spd, admin or name@company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> {t.signIn}</button>
              <div className="text-center text-sm"><span className="text-slate-400">Don't have an account? </span><button type="button" onClick={() => setAuthMode('signup')} className="text-indigo-400 font-semibold">{t.signUp}</button></div>
            </form>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email or Phone</label>
                <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="name@company.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-emerald-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" /> {t.signUp}</button>
              <div className="text-center"><button type="button" onClick={() => setAuthMode('login')} className="text-slate-400 text-sm flex items-center gap-1 mx-auto"><ArrowLeft className="w-4 h-4" /> Back</button></div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white"><ShieldCheck className="w-5 h-5" /></div>
            <span className="font-bold text-base">{t.appName}</span>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSelector />
            <button onClick={() => setCurrentUser(null)} className="p-2 bg-slate-800 hover:bg-rose-600/20 text-slate-300 rounded-xl" title={t.signOut}><LogOut className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Bottom Tab Bar for Mobile */}
        <div className="bg-slate-900/90 border-t border-slate-800 flex justify-around py-2 overflow-x-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center text-[10px] min-w-[60px] ${activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-4 h-4 mb-0.5" /> {t.dashboard}
          </button>
          <button onClick={() => setActiveTab('shifts')} className={`flex flex-col items-center text-[10px] min-w-[60px] ${activeTab === 'shifts' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
            <Calendar className="w-4 h-4 mb-0.5" /> {t.shiftRoster}
          </button>
          <button onClick={() => setActiveTab('team')} className={`flex flex-col items-center text-[10px] min-w-[60px] ${activeTab === 'team' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
            <Users className="w-4 h-4 mb-0.5" /> {t.teamMembers}
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center text-[10px] min-w-[60px] ${activeTab === 'attendance' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
            <FileText className="w-4 h-4 mb-0.5" /> {t.workDaysOT}
          </button>
          {(currentUser.role === 'spd' || currentUser.role === 'admin') && (
            <button onClick={() => setActiveTab('admin')} className={`flex flex-col items-center text-[10px] min-w-[60px] ${activeTab === 'admin' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}>
              <Building2 className="w-4 h-4 mb-0.5" /> SPD Control
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full pb-20">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{t.welcome}, {currentUser.name}!</h2>
                <p className="text-xs text-indigo-400 uppercase mt-0.5">{currentUser.role} • {currentUser.teamName}</p>
              </div>
            </div>

            {/* Chat Check-in Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[400px]">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">{t.checkInChatTitle}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isCheckedIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                  {isCheckedIn ? 'CHECKED IN' : 'OFF DUTY'}
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-xl text-xs ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                      <p>{msg.text}</p>
                      <span className="text-[9px] opacity-70 mt-1 block text-right">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2">
                <button onClick={() => handleSendMessage('Check In')} className="flex-1 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold">{t.checkInBtn}</button>
                <button onClick={() => handleSendMessage('Check Out')} className="flex-1 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold">{t.checkOutBtn}</button>
              </div>

              <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t.checkInPrompt} className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" />
                <button onClick={() => handleSendMessage()} className="p-2 bg-indigo-600 text-white rounded-xl"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'shifts' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm">{t.shiftRoster}</h3>
            <div className="space-y-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <div key={day} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-indigo-400">{day}</span>
                  <span className="text-slate-300">09:00 AM - 05:00 PM</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm">{t.teamMembers}</h3>
            <div className="space-y-2">
              {staffList.map((s, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold">{s.name} <span className="text-indigo-400">({s.id})</span></p>
                    <p className="text-[10px] text-slate-400">{s.team} • {s.role}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORK DAYS & OT TABLE PAGE */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Payroll — Work days / OT · PPS RBR GW</h2>
              <p className="text-xs text-slate-400 mt-0.5">2026-09-20 → 2026-10-20 · {staffList.length} people</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs flex items-center gap-1 text-slate-300"><Download className="w-3.5 h-3.5" /> Download PDF</button>
              <button className="px-3 py-2 bg-indigo-600 rounded-xl text-xs flex items-center gap-1 font-semibold text-white"><Printer className="w-3.5 h-3.5" /> Print / PDF (A4)</button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">PPS</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">20</th>
                    <th className="p-2.5">21</th>
                    <th className="p-2.5">22</th>
                    <th className="p-2.5">23</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {staffList.map((st, idx) => (
                    <React.Fragment key={st.id}>
                      <tr>
                        <td className="p-2.5" rowSpan={2}>{idx + 1}</td>
                        <td className="p-2.5 font-bold text-indigo-400" rowSpan={2}>{st.id}</td>
                        <td className="p-2.5 font-semibold" rowSpan={2}>{st.name}</td>
                        <td className="p-2.5 text-center text-emerald-400">WD</td>
                        <td className="p-2.5 text-center text-emerald-400">WD</td>
                        <td className="p-2.5 text-center text-slate-500">x</td>
                        <td className="p-2.5 text-center text-emerald-400">WD</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-center text-amber-400 border-t border-slate-800/50">OT</td>
                        <td className="p-2.5 text-center text-slate-500 border-t border-slate-800/50">x</td>
                        <td className="p-2.5 text-center text-amber-400 border-t border-slate-800/50">OT</td>
                        <td className="p-2.5 text-center text-slate-500 border-t border-slate-800/50">x</td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SPD CONTROL PANEL PAGE */}
        {activeTab === 'admin' && (currentUser.role === 'spd' || currentUser.role === 'admin') && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-5">
            <div>
              <h3 className="font-bold text-sm text-indigo-400">👑 Service Provider (SPD) Master Control</h3>
              <p className="text-xs text-slate-400 mt-1">Full control over teams, staff allocation, and system parameters.</p>
            </div>

            <form onSubmit={handleAddTeam} className="flex gap-2">
              <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="New Department / Team" className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none" />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs font-bold rounded-xl flex items-center gap-1"><Plus className="w-4 h-4" /> Add Team</button>
            </form>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400">Managed Teams:</h4>
              <div className="flex flex-wrap gap-2">
                {teams.map((tm, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200">{tm}</span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400">All Staff Overview:</h4>
              <div className="space-y-2">
                {staffList.map((st, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold">{st.name} <span className="text-indigo-400">({st.id})</span></p>
                      <p className="text-[10px] text-slate-400">Team: {st.team}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded-full">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
