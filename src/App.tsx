import React, { useState } from 'react';
import { 
  LogIn, Clock, ShieldCheck, UserPlus, KeyRound, 
  ArrowLeft, Users, Building2, Calendar, LayoutDashboard, 
  LogOut, CheckCircle2, Send, Globe, Bot, User, Plus, FileText, Download, Printer, Lock, UserMinus, UserCheck, Copy, Check 
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';
type ActiveTab = 'dashboard' | 'shifts' | 'team' | 'attendance' | 'admin';
type Language = 'en' | 'my' | 'th' | 'zh';

interface StaffMember {
  id: string;
  name: string;
  role: 'employee' | 'team_admin';
  team: string;
  status: 'Active' | 'Resigned';
}

interface UserProfile {
  name: string;
  identifier: string;
  role: 'spd' | 'team_admin' | 'employee';
  assignedTeam: string;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isFormattedList?: boolean;
}

const translations = {
  en: {
    appName: "ShiftMaster HR",
    signIn: "Sign In",
    signUp: "Sign Up",
    dashboard: "Team Shift & Attendance Chat",
    shiftRoster: "Shift Roster",
    teamMembers: "Team Members",
    workDaysOT: "Work Days / OT",
    spdControl: "SPD Control (Staff & Teams)",
    welcome: "Welcome back",
    checkInChatTitle: "Shift Roster & Messenger List Assistant",
    checkInPrompt: "Select Shift Time & enter Staff IDs...",
    checkInBtn: "Generate Shift List",
    signOut: "Sign Out",
  },
  my: {
    appName: "ShiftMaster HR",
    signIn: "အကောင့်ဝင်ရန်",
    signUp: "အကောင့်အသစ်ဖွင့်ရန်",
    dashboard: "Shift ခွဲရန်နှင့် Attendance Chat",
    shiftRoster: "အလုပ်ချိန်ဇယား",
    teamMembers: "အဖွဲ့ဝင်များ",
    workDaysOT: "အလုပ်ရက် / အိုတီ (WD/OT)",
    spdControl: "SPD ထိန်းချုပ်ရန် (ဝန်ထမ်း/Teamများ)",
    welcome: "ပြန်လည်ကြိုဆိုပါတယ်",
    checkInChatTitle: "Shift အလိုက် ဝန်ထမ်းစာရင်း ထုတ်ပေးပြီး Messenger တိုင်ရန်",
    checkInPrompt: "ဝန်ထမ်း ID များ ရိုက်ထည့်ပါ (ဥပမာ- PPS50, PPS61)...",
    checkInBtn: "Shift စာရင်း ထုတ်မည်",
    signOut: "ထွက်ရန်",
  },
  th: {
    appName: "ShiftMaster HR",
    signIn: "เข้าสู่ระบบ",
    signUp: "สมัครสมาชิก",
    dashboard: "แชทจัดกะและเข้างาน",
    shiftRoster: "ตารางกะงาน",
    teamMembers: "สมาชิกในทีม",
    workDaysOT: "วันทำงาน / OT",
    spdControl: "การควบคุม SPD",
    welcome: "ยินดีต้อนรับกลับมา",
    checkInChatTitle: "ผู้ช่วยจัดกะและคัดลอกรายชื่อส่ง Messenger",
    checkInPrompt: "เลือกเวลาและใส่รหัสพนักงาน...",
    checkInBtn: "สร้างรายการกะงาน",
    signOut: "ออกจากระบบ",
  },
  zh: {
    appName: "ShiftMaster HR",
    signIn: "登录",
    signUp: "注册",
    dashboard: "排班打卡聊天",
    shiftRoster: "排班表",
    teamMembers: "团队成员",
    workDaysOT: "工作日 / 加班",
    spdControl: "SPD 控制面板",
    welcome: "欢迎回来",
    checkInChatTitle: "班次生成与 Messenger 列表助手",
    checkInPrompt: "选择班次时间并输入员工ID...",
    checkInBtn: "生成班次列表",
    signOut: "登出",
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('my');
  const t = translations[lang];

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // SPD Managed Teams
  const [teams, setTeams] = useState<string[]>(['Engineering Team A', 'HR Operations', 'Sales Team B']);
  const [newTeamName, setNewTeamName] = useState('');

  // SPD Managed Staff Records
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: 'PPS50', name: 'Mr. Zaw Lin Maung', role: 'employee', team: 'Engineering Team A', status: 'Active' },
    { id: 'PPS61', name: 'Miss. Hla Hla Win', role: 'employee', team: 'Engineering Team A', status: 'Active' },
    { id: 'PPS69', name: 'Mr. Aung Myo Myat', role: 'employee', team: 'Engineering Team A', status: 'Active' },
    { id: 'PPS70', name: 'Mr. Wai Yan Htet', role: 'employee', team: 'Engineering Team A', status: 'Active' },
    { id: 'PPS71', name: 'Mr. Kyaw Lin Oo', role: 'employee', team: 'Engineering Team A', status: 'Active' }
  ]);

  // SPD Inputs
  const [newStaffId, setNewStaffId] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffTeam, setNewStaffTeam] = useState('Engineering Team A');

  // Dynamic Shift Controls for Team Admin
  const [selectedShiftType, setSelectedShiftType] = useState<'Day' | 'Night'>('Day');
  const [shiftTimeInput, setShiftTimeInput] = useState('08:00 AM');
  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      sender: 'bot', 
      text: 'မင်္ဂလာပါ Team Admin! Shift ဝင်ချိန် (Day/Night) ရွေးချယ်ပြီး ဝန်ထမ်း ID များကို ရိုက်ထည့်၍ Messenger တိုင်ရန် Staff Name List စာရင်း ထုတ်ယူနိုင်ပါသည်။', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password) {
      let role: 'spd' | 'team_admin' | 'employee' = 'team_admin';
      
      if (adminCode === 'SPD2026' || identifier.toLowerCase().includes('spd')) {
        role = 'spd';
      }

      setCurrentUser({
        name: fullName || (identifier.includes('@') ? identifier.split('@')[0] : 'Team Admin'),
        identifier: identifier,
        role: role,
        assignedTeam: teams[0],
      });
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password && fullName) {
      alert('Account created successfully!');
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

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStaffId && newStaffName) {
      const newEntry: StaffMember = {
        id: newStaffId,
        name: newStaffName,
        role: 'employee',
        team: newStaffTeam,
        status: 'Active'
      };
      setStaffList([...staffList, newEntry]);
      setNewStaffId('');
      setNewStaffName('');
      alert(`Staff ${newStaffName} (${newStaffId}) added and assigned to${newStaffTeam}`);
    }
  };

  const toggleStaffStatus = (id: string) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Resigned' : 'Active' } : s));
  };

  // Generate Messenger List from Staff IDs and Shift Time
  const handleGenerateShiftList = () => {
    const rawIds = inputMessage.split(/[\s,]+/).map(id => id.trim().toUpperCase()).filter(Boolean);
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let matchedStaff = staffList.filter(s => rawIds.includes(s.id.toUpperCase()) && s.status === 'Active');

    // If no specific IDs entered, grab first N active staff as demo
    if (matchedStaff.length === 0 && staffList.length > 0) {
      matchedStaff = staffList.filter(s => s.status === 'Active').slice(0, 3);
    }

    const todayDate = new Date().toLocaleDateString();

    let formattedText = `📌 [SHIFT ROSTER NOTIFICATION]\n📅 Date: ${todayDate}\n⏰ Shift: ${selectedShiftType} Shift (${shiftTimeInput})\n👥 Total Staff: ${matchedStaff.length} Persons\n------------------------------\n`;

    matchedStaff.forEach((st, idx) => {
      formattedText += `${idx + 1}. ${st.id} -${st.name}\n`;
    });

    formattedText += `------------------------------\n✅ Please arrive 10 mins before ${shiftTimeInput}. Have a good shift!`;

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: `Generated ${selectedShiftType} Shift (${shiftTimeInput}) for${matchedStaff.length} staff`, time: currentTime },
      { sender: 'bot', text: formattedText, time: currentTime, isFormattedList: true }
    ]);

    setInputMessage('');
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
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
            <p className="text-xs text-slate-400 mt-1">Sign in as SPD or Team Admin</p>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email / Username</label>
                <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="spd or admin_team_a" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="••••••••" />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase text-indigo-400 mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> SPD Passcode (Use 'SPD2026' for SPD Access)
                </label>
                <input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-indigo-500/30 rounded-xl text-white text-sm outline-none" placeholder="Leave blank for Team Admin" />
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

        {/* Mobile App Navigation Tab Bar */}
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
          {currentUser.role === 'spd' && (
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
                <h2 className="text-lg font-bold">{t.welcome}, {currentUser.name}! 👋</h2>
                <p className="text-xs text-indigo-400 uppercase mt-0.5">ROLE: {currentUser.role} • TEAM: {currentUser.assignedTeam}</p>
              </div>
            </div>

            {/* TEAM ADMIN DYNAMIC SHIFT ROSTER & MESSENGER LIST GENERATOR */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
              {/* Header */}
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">{t.checkInChatTitle}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-400">
                  ROSTER GENERATOR
                </span>
              </div>

              {/* Chat Output Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`max-w-[85%] p-3 rounded-xl text-xs relative ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
                      <pre className="whitespace-pre-wrap font-sans">{msg.text}</pre>
                      
                      {msg.isFormattedList && (
                        <button 
                          onClick={() => handleCopyText(msg.text, i)}
                          className="mt-3 w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedIndex === i ? "Copied to Clipboard!" : "Copy List for Messenger"}
                        </button>
                      )}

                      <span className="text-[9px] opacity-70 mt-1 block text-right">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shift Controls Panel */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Shift:</span>
                    <select 
                      value={selectedShiftType} 
                      onChange={(e) => setSelectedShiftType(e.target.value as 'Day' | 'Night')}
                      className="bg-transparent text-xs font-bold text-indigo-400 outline-none w-full"
                    >
                      <option value="Day" className="bg-slate-900">Day Shift</option>
                      <option value="Night" className="bg-slate-900">Night Shift</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Time:</span>
                    <input 
                      type="text" 
                      value={shiftTimeInput} 
                      onChange={(e) => setShiftTimeInput(e.target.value)} 
                      placeholder="e.g. 08:00 AM" 
                      className="bg-transparent text-xs font-bold text-emerald-400 outline-none w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={inputMessage} 
                    onChange={(e) => setInputMessage(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateShiftList()} 
                    placeholder="Enter Staff IDs (e.g. PPS50 PPS61 PPS69)..." 
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" 
                  />
                  <button onClick={handleGenerateShiftList} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-xl flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Generate List
                  </button>
                </div>
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
                  <span className="text-slate-300">Flexible Shifts (Day/Night)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm">{t.teamMembers}</h3>
            <div className="space-y-2">
              {staffList.filter(s => s.status === 'Active').map((s, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold">{s.name} <span className="text-indigo-400">({s.id})</span></p>
                    <p className="text-[10px] text-slate-400">Team: {s.team}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">{s.status}</span>
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
              <p className="text-xs text-slate-400 mt-0.5">2026-09-20 → 2026-10-20 · {staffList.filter(s => s.status === 'Active').length} active people</p>
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
                  {staffList.filter(s => s.status === 'Active').map((st, idx) => (
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
        {activeTab === 'admin' && currentUser.role === 'spd' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
            <div>
              <h3 className="font-bold text-sm text-indigo-400">👑 Service Provider (SPD) Master Control</h3>
              <p className="text-xs text-slate-400 mt-1">Manage new staff entries, resignations, and assign staff to Team Admins.</p>
            </div>

            <form onSubmit={handleAddStaff} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-emerald-400" /> Register New Staff & Assign Team</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" required value={newStaffId} onChange={(e) => setNewStaffId(e.target.value)} placeholder="Staff ID (e.g. PPS102)" className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" />
                <input type="text" required value={newStaffName} onChange={(e) => setNewStaffName(e.target.value)} placeholder="Full Name" className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" />
                <select value={newStaffTeam} onChange={(e) => setNewStaffTeam(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none">
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2 bg-emerald-600 text-xs font-bold rounded-xl flex items-center justify-center gap-1"><Plus className="w-4 h-4" /> Add & Assign Staff</button>
            </form>

            <form onSubmit={handleAddTeam} className="flex gap-2">
              <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Create New Department / Team" className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none" />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs font-bold rounded-xl flex items-center gap-1"><Plus className="w-4 h-4" /> Add Team</button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400">Manage Staff Status & Resignations:</h4>
              <div className="space-y-2">
                {staffList.map((st) => (
                  <div key={st.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold">{st.name} <span className="text-indigo-400">({st.id})</span></p>
                      <p className="text-[10px] text-slate-400">Assigned Team: {st.team}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded
