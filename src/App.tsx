import React, { useState } from 'react';
import { 
  LogIn, ShieldCheck, UserPlus, 
  ArrowLeft, Users, Building2, Calendar, LayoutDashboard, 
  LogOut, Send, Globe, Bot, User, Plus, FileText, Download, Printer, Lock, UserMinus, UserCheck, Copy, Check, Edit3, Clock, ClipboardPaste, Key, ShieldAlert 
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

interface LiveShiftRecord {
  id: string;
  name: string;
  shiftType: string;
  checkIn: string;
  checkOut: string;
  date: string;
  team: string;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isFormattedList?: boolean;
  isActionCard?: boolean;
  actionData?: { type: 'add' | 'resign'; id: string; name: string; team: string };
}

const translations = {
  en: {
    appName: "ShiftMaster HR",
    signIn: "Sign In",
    signUp: "Sign Up",
    dashboard: "Team Chat & Staff Management",
    shiftRoster: "Shift Roster",
    teamMembers: "Team Members",
    workDaysOT: "Work Days / OT",
    spdControl: "SPD Master Control",
    welcome: "Welcome back",
    checkInChatTitle: "Chat Assistant: Shifts & Staff Add/Resign",
    checkInPrompt: "Type shift IDs or '+ Add: ID, Name' or '- Resign: ID'...",
    checkInBtn: "Send / Process",
    shiftLabel: "Shift Type",
    dateTimeLabel: "Date & Time",
    dayShift: "Day Shift",
    nightShift: "Night Shift",
    signOut: "Sign Out",
    liveTrackingTitle: "Live Check-in / Check-out Records",
  },
  my: {
    appName: "ShiftMaster HR",
    signIn: "အကောင့်ဝင်ရန်",
    signUp: "အကောင့်အသစ်ဖွင့်ရန်",
    dashboard: "Team Chat နှင့် ဝန်ထမ်းစီမံရန်",
    shiftRoster: "အလုပ်ချိန်ဇယား",
    teamMembers: "အဖွဲ့ဝင်များ",
    workDaysOT: "အလုပ်ရက် / အိုတီ (WD/OT)",
    spdControl: "SPD မာစတာ ထိန်းချုပ်ရန်",
    welcome: "ပြန်လည်ကြိုဆိုပါတယ်",
    checkInChatTitle: "Chat လက်ထောက်: Shift ထုတ်ရန်နှင့် လူသစ်/လူထွက် စီမံရန်",
    checkInPrompt: "ID များ (သို့) '+ Add: PPS102, Ko Ko' သို့မဟုတ် '- Resign: PPS50' ဟု ရိုက်ပါ...",
    checkInBtn: "ပို့မည် / လုပ်ဆောင်မည်",
    shiftLabel: "အလုပ်ချိန်အမျိုးအစား",
    dateTimeLabel: "ရက်စွဲနှင့် အချိန်",
    dayShift: "နေ့ဘက်အလုပ်ချိန် (Day Shift)",
    nightShift: "ညဘက်အလုပ်ချိန် (Night Shift)",
    signOut: "ထွက်ရန်",
    liveTrackingTitle: "Live ဝင်ချိန်/ထွက်ချိန် မှတ်တမ်းများ",
  },
  th: {
    appName: "ShiftMaster HR",
    signIn: "เข้าสู่ระบบ",
    signUp: "สมัครสมาชิก",
    dashboard: "แชททีมและการจัดการพนักงาน",
    shiftRoster: "ตารางกะงาน",
    teamMembers: "สมาชิกในทีม",
    workDaysOT: "วันทำงาน / OT",
    spdControl: "การควบคุม SPD",
    welcome: "ยินดีต้อนรับกลับมา",
    checkInChatTitle: "ผู้ช่วยแชท: จัดกะและเพิ่ม/ลาออกพนักงาน",
    checkInPrompt: "พิมพ์รหัส หรือ '+ Add: ID, Name' หรือ '- Resign: ID'...",
    checkInBtn: "ส่ง / ดำเนินการ",
    shiftLabel: "ประเภทกะงาน",
    dateTimeLabel: "วันที่และเวลา",
    dayShift: "กะกลางวัน",
    nightShift: "กะกลางคืน",
    signOut: "ออกจากระบบ",
    liveTrackingTitle: "บันทึกเวลาเข้า/ออกงานสด",
  },
  zh: {
    appName: "ShiftMaster HR",
    signIn: "登录",
    signUp: "注册",
    dashboard: "团队聊天与员工管理",
    shiftRoster: "排班表",
    teamMembers: "团队成员",
    workDaysOT: "工作日 / 加班",
    spdControl: "SPD 控制面板",
    welcome: "欢迎回来",
    checkInChatTitle: "聊天助手：班次与员工 增/减 管理",
    checkInPrompt: "输入ID 或 '+ Add: ID, Name' 或 '- Resign: ID'...",
    checkInBtn: "发送 / 处理",
    shiftLabel: "班次类型",
    dateTimeLabel: "日期与时间",
    dayShift: "白班",
    nightShift: "夜班",
    signOut: "登出",
    liveTrackingTitle: "实时签到/签退记录",
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

  const [teams, setTeams] = useState<string[]>(['Team A', 'Team B', 'Team C']);
  const [newTeamName, setNewTeamName] = useState('');

  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: 'PPS50', name: 'Mr. Zaw Lin Maung', role: 'team_admin', team: 'Team A', status: 'Active' },
    { id: 'PPS61', name: 'Miss. Hla Hla Win', role: 'team_admin', team: 'Team B', status: 'Active' },
    { id: 'PPS69', name: 'Mr. Aung Myo Myat', role: 'employee', team: 'Team A', status: 'Active' },
    { id: 'PPS70', name: 'Mr. Wai Yan Htet', role: 'employee', team: 'Team B', status: 'Active' },
    { id: 'PPS71', name: 'Mr. Kyaw Lin Oo', role: 'employee', team: 'Team A', status: 'Active' }
  ]);

  const [adminPermissions, setAdminPermissions] = useState({
    canEditTime: true,
    canGenerateMessengerList: true,
  });

  const [bulkText, setBulkText] = useState('');
  const [bulkTeam, setBulkTeam] = useState('Team A');

  const [selectedShiftType, setSelectedShiftType] = useState<'Day' | 'Night'>('Day');
  const [customDateTime, setCustomDateTime] = useState('21/10/2026, 08:00 AM');
  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [liveRecords, setLiveRecords] = useState<LiveShiftRecord[]>([
    { id: 'PPS50', name: 'Mr. Zaw Lin Maung', shiftType: 'Day Shift', checkIn: '08:00 AM', checkOut: '05:00 PM', date: '21/10/2026', team: 'Team A' }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      sender: 'bot', 
      text: '🤖 မင်္ဂလာပါ! ဤ Chat ထဲတွင် Shift စာရင်းထုတ်ယူနိုင်သလို ဝန်ထမ်းအသစ်ထည့်ရန် \n"+ Add: PPS102, Ko Naing"\nအလုပ်ထွက်စာတင်ရန် \n"- Resign: PPS50"\nဟု တိုက်ရိုက်ရိုက်ထည့်နိုင်ပါသည်။', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password) {
      let role: 'spd' | 'team_admin' | 'employee' = 'team_admin';
      let assignedTeam = 'Team A';

      // Check for specific SPD credentials
      if ((identifier.trim().toLowerCase() === 'sayxero2@gmail.com' && password === 'sayxero#100') || identifier.toLowerCase().includes('spd')) {
        role = 'spd';
        assignedTeam = 'All Teams (Master)';
      } else {
        const foundStaff = staffList.find(s => s.id.toLowerCase() === identifier.toLowerCase() || s.name.toLowerCase().includes(identifier.toLowerCase()));
        if (foundStaff) {
          role = foundStaff.role;
          assignedTeam = foundStaff.team;
        }
      }

      setCurrentUser({
        name: fullName || (identifier.includes('@') ? identifier.split('@')[0] : identifier.toUpperCase()),
        identifier: identifier,
        role: role,
        assignedTeam: assignedTeam,
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

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n');
    let addedCount = 0;
    const newStaffs: StaffMember[] = [...staffList];

    lines.forEach(line => {
      const parts = line.split(/[\t,-]+/);
      if (parts.length >= 2) {
        const id = parts[0].trim().toUpperCase();
        const name = parts[1].trim();
        if (id && name && !newStaffs.some(s => s.id === id)) {
          newStaffs.push({
            id,
            name,
            role: 'employee',
            team: bulkTeam,
            status: 'Active'
          });
          addedCount++;
        }
      }
    });

    setStaffList(newStaffs);
    setBulkText('');
    alert(`Successfully imported ${addedCount} staff members into ${bulkTeam}!`);
  };

  const toggleStaffStatus = (id: string) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Resigned' : 'Active' } : s));
  };

  const handleAssignAdmin = (id: string, newRole: 'employee' | 'team_admin', newTeam: string) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, role: newRole, team: newTeam } : s));
  };

  const handleUpdateLiveTime = (id: string, field: 'checkIn' | 'checkOut') => {
    if (currentUser?.role === 'team_admin' && !adminPermissions.canEditTime) {
      alert('SPD မှ အချိန်ပြင်ဆင်ခွင့် ပိတ်ထားပါသည်။');
      return;
    }
    const newVal = prompt(`Enter new ${field === 'checkIn' ? 'Check-in' : 'Check-out'} time:`, field === 'checkIn' ? '08:00 AM' : '05:00 PM');
    if (newVal) {
      setLiveRecords(liveRecords.map(r => r.id === id ? { ...r, [field]: newVal } : r));
    }
  };

  const handleChatSubmit = () => {
    const text = inputMessage.trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userTeam = currentUser?.assignedTeam || 'Team A';

    if (text.toLowerCase().startsWith('+ add') || text.toLowerCase().startsWith('add:')) {
      const cleanText = text.replace(/^\+?\s*add[:\s]*/i, '');
      const parts = cleanText.split(/[,]+/);
      if (parts.length >= 2) {
        const newId = parts[0].trim().toUpperCase();
        const newName = parts[1].trim();

        setChatMessages(prev => [
          ...prev,
          { sender: 'user', text: inputMessage, time: currentTime },
          { 
            sender: 'bot', 
            text: `📝 လူသစ်ဝင်ရောက်မှု တောင်းဆိုချက်:\n- ID: ${newId}\n- Name: ${newName}\n- Team: ${userTeam}\n\nအောက်ပါခလုတ်ကိုနှိပ်၍ အတည်ပြုပါ (Confirm):`, 
            time: currentTime,
            isActionCard: true,
            actionData: { type: 'add', id: newId, name: newName, team: userTeam }
          }
        ]);
        setInputMessage('');
        return;
      }
    }

    if (text.toLowerCase().startsWith('- resign') || text.toLowerCase().startsWith('resign:')) {
      const cleanId = text.replace(/^-?\s*resign[:\s]*/i, '').trim().toUpperCase();
      const targetStaff = staffList.find(s => s.id.toUpperCase() === cleanId);

      if (targetStaff) {
        setChatMessages(prev => [
          ...prev,
          { sender: 'user', text: inputMessage, time: currentTime },
          { 
            sender: 'bot', 
            text: `⚠️ အလုပ်ထွက်စာတင်မှု တောင်းဆိုချက်:\n- ID: ${targetStaff.id}\n- Name: ${targetStaff.name}\n- Team: ${targetStaff.team}\n\nအောက်ပါခလုတ်ကိုနှိပ်၍ အတည်ပြုပါ (Confirm Resign):`, 
            time: currentTime,
            isActionCard: true,
            actionData: { type: 'resign', id: targetStaff.id, name: targetStaff.name, team: targetStaff.team }
          }
        ]);
        setInputMessage('');
        return;
      } else {
        alert(`❌ မတွေ့ရှိပါ: ${cleanId} ဆိုသော Staff ID မှာ စနစ်ထဲတွင် မရှိပါ။`);
        return;
      }
    }

    const rawIds = text.split(/[\s,]+/).map(id => id.trim().toUpperCase()).filter(Boolean);
    const matchedStaff = staffList.filter(s => rawIds.includes(s.id.toUpperCase()) && s.status === 'Active');

    if (matchedStaff.length === 0) {
      alert('ထည့်သွင်းထားသော Staff ID များ မမှန်ကန်ပါ (သို့) Active မရှိပါ။ (+ Add သို့မဟုတ် - Resign ဖြင့်လည်း စာရင်းသွင်းနိုင်သည်)');
      return;
    }

    const shiftTitleName = selectedShiftType === 'Day' ? t.dayShift : t.nightShift;
    const newLiveEntries: LiveShiftRecord[] = matchedStaff.map(st => ({
      id: st.id,
      name: st.name,
      shiftType: shiftTitleName,
      checkIn: customDateTime.includes(',') ? customDateTime.split(',')[1].trim() : '08:00 AM',
      checkOut: selectedShiftType === 'Day' ? '05:00 PM' : '05:00 AM',
      date: customDateTime.split(',')[0].trim() || '21/10/2026',
      team: st.team
    }));

    setLiveRecords([...newLiveEntries, ...liveRecords.filter(r => !matchedStaff.some(m => m.id === r.id))]);

    let formattedText = `📌 [SHIFT ROSTER NOTIFICATION]\n📅 Date & Time: ${customDateTime}\n⏰ Shift: ${shiftTitleName}\n👥 Total Staff: ${matchedStaff.length} Persons\n------------------------------\n`;
    matchedStaff.forEach((st, idx) => {
      formattedText += `${idx + 1}. ${st.id} - ${st.name} (${st.team})\n`;
    });
    formattedText += `------------------------------\n✅ Please arrive on time. Have a good shift!`;

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: inputMessage, time: currentTime },
      { sender: 'bot', text: formattedText, time: currentTime, isFormattedList: true }
    ]);

    setInputMessage('');
  };

  const handleConfirmAction = (actionData: { type: 'add' | 'resign'; id: string; name: string; team: string }) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (actionData.type === 'add') {
      if (staffList.some(s => s.id === actionData.id)) {
        alert('ဤ Staff ID မှာ စနစ်ထဲတွင် ရှိပြီးသားဖြစ်ပါသည်။');
        return;
      }
      setStaffList([...staffList, { id: actionData.id, name: actionData.name, role: 'employee', team: actionData.team, status: 'Active' }]);
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: `✅ အောင်မြင်ပါသည်! ဝန်ထမ်းသစ် ${actionData.name} (${actionData.id}) ကို ${actionData.team} ထဲသို့ ထည့်သွင်းပြီးပါပြီ။`, time: currentTime }
      ]);
    } else if (actionData.type === 'resign') {
      setStaffList(staffList.map(s => s.id === actionData.id ? { ...s, status: 'Resigned' } : s));
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: `👋 အောင်မြင်ပါသည်! ဝန်ထမ်း ${actionData.name} (${actionData.id}) ကို အလုပ်ထွက် (Resigned) အဖြစ် အပ်ဒိတ်လုပ်ပြီးပါပြီ။`, time: currentTime }
      ]);
    }
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
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email / Staff ID</label>
                <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="sayxero2@gmail.com or PPS50" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-indigo-600 font-semibold rounded-xl text-sm flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> {t.signIn}</button>
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

        {/* Mobile Navigation Tab Bar */}
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
              <Building2 className="w-4 h-4 mb-0.5" /> {t.spdControl}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full pb-20 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{t.welcome}, {currentUser.name}! 👋</h2>
                <p className="text-xs text-indigo-400 uppercase mt-0.5">ROLE: {currentUser.role} • TEAM: {currentUser.assignedTeam}</p>
              </div>
            </div>

            {/* CHAT ASSISTANT */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[540px]">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">{t.checkInChatTitle}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-400">
                  SMART CHAT
                </span>
              </div>

              {/* Chat Messages */}
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

                      {msg.isActionCard && msg.actionData && (
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={() => handleConfirmAction(msg.actionData!)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Confirm ({msg.actionData.type.toUpperCase()})
                          </button>
                        </div>
                      )}

                      <span className="text-[9px] opacity-70 mt-1 block text-right">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Controls Panel */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t.shiftLabel}:</span>
                    <select 
                      value={selectedShiftType} 
                      onChange={(e) => setSelectedShiftType(e.target.value as 'Day' | 'Night')}
                      className="bg-transparent text-xs font-bold text-indigo-400 outline-none w-full cursor-pointer"
                    >
                      <option value="Day" className="bg-slate-900">{t.dayShift}</option>
                      <option value="Night" className="bg-slate-900">{t.nightShift}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">{t.dateTimeLabel}:</span>
                    <input 
                      type="text" 
                      value={customDateTime} 
                      onChange={(e) => setCustomDateTime(e.target.value)} 
                      className="bg-transparent text-xs font-bold text-emerald-400 outline-none w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 items-end">
                  <textarea 
                    value={inputMessage} 
                    onChange={(e) => setInputMessage(e.target.value)} 
                    placeholder={t.checkInPrompt} 
                    rows={2}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none resize-none" 
                  />
                  <button onClick={handleChatSubmit} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-xl flex items-center gap-1.5 h-auto">
                    <Send className="w-3.5 h-3.5" /> {t.checkInBtn}
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE SHIFT TRACKING SECTION */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" /> {t.liveTrackingTitle}
                </h3>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">LIVE SYNC</span>
              </div>

              <div className="space-y-2">
                {liveRecords.map((rec) => (
                  <div key={rec.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div>
                      <p className="font-bold text-white">{rec.name} <span className="text-indigo-400">({rec.id})</span></p>
                      <p className="text-[10px] text-slate-400">{rec.shiftType} • Team: {rec.team} • Date: {rec.date}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">In: <span className="text-emerald-400 font-bold">{rec.checkIn}</span></p>
                        <p className="text-[10px] text-slate-400">Out: <span className="text-rose-400 font-bold">{rec.checkOut}</span></p>
                      </div>

                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleUpdateLiveTime(rec.id, 'checkIn')}
                          className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> In
                        </button>
                        <button 
                          onClick={() => handleUpdateLiveTime(rec.id, 'checkOut')}
                          className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Out
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <span className="text-slate-300">Custom Shift Roster</span>
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
                    <p className="text-[10px] text-slate-400">Team: {s.team} • Role: {s.role}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px]">{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* SPD MASTER CONTROL PANEL */}
        {activeTab === 'admin' && currentUser.role === 'spd' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
            <div>
              <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-400" /> 👑 Service Provider (SPD) Master Control
              </h3>
              <p className="text-xs text-slate-400 mt-1">Manage Team Admins, Access Rights, and Staff Allocations.</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" /> Team Admin Access Permissions
              </h4>
              <div className="space-y-2">
                <label className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs cursor-pointer">
                  <span className="text-slate-300">Allow Team Admins to Edit Live Check-in/Out Times</span>
                  <input 
                    type="checkbox" 
                    checked={adminPermissions.canEditTime} 
                    onChange={(e) => setAdminPermissions({ ...adminPermissions, canEditTime: e.target.checked })} 
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs cursor-pointer">
                  <span className="text-slate-300">Allow Team Admins to Generate Messenger Lists</span>
                  <input 
                    type="checkbox" 
                    checked={adminPermissions.canGenerateMessengerList} 
                    onChange={(e) => setAdminPermissions({ ...adminPermissions, canGenerateMessengerList: e.target.checked })} 
                    className="w-4 h-4 accent-indigo-600 rounded"
                  />
                </label>
              </div>
            </div>

            <form onSubmit={handleBulkImport} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-emerald-400" /> Bulk Import Staff List
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select value={bulkTeam} onChange={(e) => setBulkTeam(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none">
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="submit" className="py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 text-white">
                  <UserPlus className="w-4 h-4" /> Import Staff List
                </button>
              </div>
              <textarea 
                rows={3}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="PPS50, Mr. Zaw Lin Maung&#10;PPS61, Miss. Hla Hla Win..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none font-mono"
              />
            </form>

            <form onSubmit={handleAddTeam} className="flex gap-2">
              <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Create New Department / Team" className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none" />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs font-bold rounded-xl flex items-center gap-1"><Plus className="w-4 h-4" /> Add Team</button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400">Assign Specific Team Admins to Teams ({staffList.length} total):</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {staffList.map((st) => (
                  <div key={st.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div>
                      <p className="font-bold">{st.name} <span className="text-indigo-400">({st.id})</span></p>
                      <p className="text-[10px] text-slate-400">Assigned: <span className="text-emerald-400 font-bold">{st.team}</span> • Role: <span className="text-amber-400 font-bold">{st.role}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select 
                        value={st.team}
                        onChange={(e) => handleAssignAdmin(st.id, st.role, e.target.value)}
                        className="bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg text-[10px] text-white outline-none"
                      >
                        {teams.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>

                      <button 
                        onClick={() => handleAssignAdmin(st.id, st.role === 'team_admin' ? 'employee' : 'team_admin', st.team)}
                        className={`p-1.5 rounded-lg text-[10px] font-bold ${st.role === 'team_admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {st.role === 'team_admin' ? 'Is Team Admin' : 'Make Admin'}
                      </button>

                      <button 
                        onClick={() => toggleStaffStatus(st.id)}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${st.status === 'Active' ? 'bg-rose-600/20 text-rose-400' : 'bg-emerald-600/20 text-emerald-400'}`}
                      >
                        {st.status === 'Active' ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
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
