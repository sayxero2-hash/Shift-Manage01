import React, { useState, useEffect } from 'react';
import { 
  LogIn, ShieldCheck, UserPlus, 
  ArrowLeft, Users, Building2, Calendar, LayoutDashboard, 
  LogOut, Send, Globe, Bot, User, Plus, FileText, Download, Printer, Lock, UserMinus, UserCheck, Copy, Check, Edit3, Clock, ClipboardPaste, Key, ShieldAlert, CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2, Search, UserCog
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
  isReplaced?: boolean;
}

interface SignupRequest {
  id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  freeTrialDays: number;
  assignedTeam: string;
}

interface ChatMessage {
  sender: 'bot' | 'user';
  text: string;
  time: string;
  isFormattedList?: boolean;
  isWarningCard?: boolean;
  warningData?: {
    dupStaff: StaffMember;
    existingShift: LiveShiftRecord;
    newShiftType: string;
    newDateTime: string;
  };
}

const translations = {
  en: {
    appName: "ShiftMaster HR",
    signIn: "Sign In",
    signUp: "Sign Up",
    dashboard: "Team Chat & Dashboard",
    shiftRoster: "Shift Roster & Live",
    teamMembers: "Team Members",
    workDaysOT: "Work Days / OT",
    spdControl: "SPD Master Control",
    welcome: "Welcome back",
    checkInChatTitle: "Team Chat Assistant",
    checkInPrompt: "Type Staff IDs (e.g. PPS50, PPS61)...",
    checkInBtn: "ပို့မည်",
    shiftLabel: "Shift Type",
    dateTimeLabel: "Date & Time",
    dayShift: "Day Shift",
    nightShift: "Night Shift",
    signOut: "Sign Out",
  },
  my: {
    appName: "ShiftMaster HR",
    signIn: "အကောင့်ဝင်ရန်",
    signUp: "အကောင့်အသစ်ဖွင့်ရန်",
    dashboard: "Team Chat နှင့် ဒက်ရှ်ဘုတ်",
    shiftRoster: "အလုပ်ချိန်ဇယားနှင့် Live",
    teamMembers: "အဖွဲ့ဝင်များ",
    workDaysOT: "အလုပ်ရက် / အိုတီ (WD/OT)",
    spdControl: "SPD မာစတာ ထိန်းချုပ်ရန်",
    welcome: "ပြန်လည်ကြိုဆိုပါတယ်",
    checkInChatTitle: "Team Chat လက်ထောက်",
    checkInPrompt: "ဝန်ထမ်း ID များ ရိုက်ထည့်ပါ (ဥပမာ- PPS50, PPS61)...",
    checkInBtn: "ပို့မည်",
    shiftLabel: "အလုပ်ချိန်အမျိုးအစား",
    dateTimeLabel: "ရက်စွဲနှင့် အချိန်",
    dayShift: "နေ့ဘက်အလုပ်ချိန် (Day Shift)",
    nightShift: "ညဘက်အလုပ်ချိန် (Night Shift)",
    signOut: "ထွက်ရန်",
  },
  th: {
    appName: "ShiftMaster HR",
    signIn: "เข้าสู่ระบบ",
    signUp: "สมัครสมาชิก",
    dashboard: "แชททีม & แดชบอร์ด",
    shiftRoster: "ตารางกะ & สด",
    teamMembers: "สมาชิกในทีม",
    workDaysOT: "วันทำงาน / OT",
    spdControl: "การควบคุม SPD",
    welcome: "ยินดีต้อนรับกลับมา",
    checkInChatTitle: "ผู้ช่วยแชททีม",
    checkInPrompt: "พิมพ์รหัสพนักงาน...",
    checkInBtn: "ส่ง",
    shiftLabel: "ประเภทกะงาน",
    dateTimeLabel: "วันที่และเวลา",
    dayShift: "กะกลางวัน",
    nightShift: "กะกลางคืน",
    signOut: "ออกจากระบบ",
  },
  zh: {
    appName: "ShiftMaster HR",
    signIn: "登录",
    signUp: "注册",
    dashboard: "团队聊天与仪表盘",
    shiftRoster: "排班表与实时",
    teamMembers: "团队成员",
    workDaysOT: "工作日 / 加班",
    spdControl: "SPD 控制面板",
    welcome: "欢迎回来",
    checkInChatTitle: "团队聊天助手",
    checkInPrompt: "输入员工ID...",
    checkInBtn: "发送",
    shiftLabel: "班次类型",
    dateTimeLabel: "日期与时间",
    dayShift: "白班",
    nightShift: "夜班",
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('shiftmaster_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Persistent LocalStorage States
  const [teams, setTeams] = useState<string[]>(() => {
    const saved = localStorage.getItem('shiftmaster_teams');
    return saved ? JSON.parse(saved) : ['Team A', 'Team B', 'Team C'];
  });
  const [newTeamName, setNewTeamName] = useState('');

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('shiftmaster_staff');
    return saved ? JSON.parse(saved) : [
      { id: 'PPS50', name: 'Mr. Zaw Lin Maung', role: 'team_admin', team: 'Team A', status: 'Active' },
      { id: 'PPS61', name: 'Miss. Hla Hla Win', role: 'team_admin', team: 'Team B', status: 'Active' },
      { id: 'PPS69', name: 'Mr. Aung Myo Myat', role: 'employee', team: 'Team A', status: 'Active' },
      { id: 'PPS70', name: 'Mr. Wai Yan Htet', role: 'employee', team: 'Team B', status: 'Active' },
      { id: 'PPS71', name: 'Mr. Kyaw Lin Oo', role: 'employee', team: 'Team A', status: 'Active' }
    ];
  });

  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>(() => {
    const saved = localStorage.getItem('shiftmaster_signups');
    return saved ? JSON.parse(saved) : [
      { id: 'req1', name: 'Factory Manager A', email: 'factoryA@gmail.com', status: 'Pending', freeTrialDays: 7, assignedTeam: 'Team A' },
      { id: 'req2', name: 'Service Lead B', email: 'serviceB@gmail.com', status: 'Approved', freeTrialDays: 14, assignedTeam: 'Team B' }
    ];
  });

  const [liveRecords, setLiveRecords] = useState<LiveShiftRecord[]>(() => {
    const saved = localStorage.getItem('shiftmaster_live_records');
    return saved ? JSON.parse(saved) : [
      { id: 'PPS50', name: 'Mr. Zaw Lin Maung', shiftType: 'Day Shift', checkIn: '08:00 AM', checkOut: '05:00 PM', date: '21/10/2026', team: 'Team A' }
    ];
  });

  // Save to LocalStorage whenever states change
  useEffect(() => {
    localStorage.setItem('shiftmaster_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('shiftmaster_staff', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('shiftmaster_signups', JSON.stringify(signupRequests));
  }, [signupRequests]);

  useEffect(() => {
    localStorage.setItem('shiftmaster_live_records', JSON.stringify(liveRecords));
  }, [liveRecords]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('shiftmaster_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('shiftmaster_current_user');
    }
  }, [currentUser]);

  const [newStaffId, setNewStaffId] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState('Team A');

  // SPD Search States
  const [spdSearchQuery, setSpdSearchQuery] = useState('');
  const [spdSelectedTeamFilter, setSpdSelectedTeamFilter] = useState('All');

  const [bulkText, setBulkText] = useState('');
  const [bulkTeam, setBulkTeam] = useState('Team A');

  const [selectedShiftType, setSelectedShiftType] = useState<'Day' | 'Night'>('Day');
  const [customDateTime, setCustomDateTime] = useState('21/10/2026, 08:00 AM');
  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      sender: 'bot', 
      text: '🤖 မင်္ဂလာပါ! Team Chat မှတဆင့် Date & Time, Shift ရွေးချယ်ပြီး Check-in ဝင်နိုင်ပါသည်။', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password) {
      let role: 'spd' | 'team_admin' | 'employee' = 'team_admin';
      let assignedTeam = 'Team A';

      if (identifier.trim().toLowerCase() === 'sayxero2@gmail.com' && password === 'sayxero#100') {
        role = 'spd';
        assignedTeam = 'All Teams (Master)';
      } else {
        const foundReq = signupRequests.find(r => r.email.toLowerCase() === identifier.toLowerCase() && r.status === 'Approved');
        if (foundReq) {
          role = 'team_admin';
          assignedTeam = foundReq.assignedTeam;
        } else {
          const foundStaff = staffList.find(s => s.id.toLowerCase() === identifier.toLowerCase() || s.name.toLowerCase().includes(identifier.toLowerCase()));
          if (foundStaff) {
            role = foundStaff.role;
            assignedTeam = foundStaff.team;
          }
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
      const newReq: SignupRequest = {
        id: 'req_' + Date.now(),
        name: fullName,
        email: identifier,
        status: 'Pending',
        freeTrialDays: 7,
        assignedTeam: teams[0] || 'Team A'
      };
      setSignupRequests([newReq, ...signupRequests]);
      alert('အကောင့်ဖွင့်ခြင်း တောင်းဆိုမှု အောင်မြင်ပါသည်။ SPD မာစတာမှ အတည်ပြုပေးရန် စောင့်ဆိုင်းနေပါသည်။');
      setAuthMode('login');
    }
  };

  const handleApproveRequest = (id: string, status: 'Approved' | 'Rejected') => {
    setSignupRequests(signupRequests.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleUpdateReqTeam = (id: string, newTeam: string) => {
    setSignupRequests(signupRequests.map(r => r.id === id ? { ...r, assignedTeam: newTeam } : r));
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName && !teams.includes(newTeamName)) {
      setTeams([...teams, newTeamName]);
      setNewTeamName('');
    }
  };

  const handleRenameTeam = (oldTeamName: string) => {
    const updatedName = prompt(`Team (${oldTeamName}) အတွက် နာမည်သစ် ရိုက်ထည့်ပါ:`, oldTeamName);
    if (updatedName && updatedName.trim() !== '' && updatedName !== oldTeamName) {
      const newName = updatedName.trim();
      setTeams(teams.map(t => t === oldTeamName ? newName : t));
      setStaffList(staffList.map(s => s.team === oldTeamName ? { ...s, team: newName } : s));
      setLiveRecords(liveRecords.map(r => r.team === oldTeamName ? { ...r, team: newName } : r));
      setSignupRequests(signupRequests.map(r => r.assignedTeam === oldTeamName ? { ...r, assignedTeam: newName } : r));
      alert(`Team အမည်ကို (${oldTeamName}) မှ (${newName}) သို့ အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။`);
    }
  };

  const handleSpdDeleteStaff = (staffId: string, staffName: string) => {
    if (confirm(`ဝန်ထမ်း ${staffName} (${staffId}) ကို စနစ်မှ အပြီးအပိုင် ဖျက်ရန် သေချာပါသလား?`)) {
      setStaffList(staffList.filter(s => s.id !== staffId));
      setLiveRecords(liveRecords.filter(r => r.id !== staffId));
      alert(`ဝန်ထမ်း ${staffId} အောင်မြင်စွာ ဖျက်ပြီးပါပြီ။`);
    }
  };

  const handleSpdDeleteEntireTeam = (teamName: string) => {
    if (confirm(`Team (${teamName}) ထဲရှိ ဝန်ထမ်းအားလုံးကို အပြီးအပိုင် ဖျက်ရန် သေချာပါသလား?`)) {
      setStaffList(staffList.filter(s => s.team !== teamName));
      setLiveRecords(liveRecords.filter(r => r.team !== teamName));
      alert(`Team (${teamName}) ရှိ ဝန်ထမ်းများအားလုံးကို ဖျက်ပြီးပါပြီ။`);
    }
  };

  const handleDirectAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffId || !newStaffName) return;

    if (staffList.some(s => s.id.toUpperCase() === newStaffId.toUpperCase())) {
      alert('ဤ Staff ID မှာ စနစ်ထဲတွင် ရှိပြီးသားဖြစ်ပါသည်။');
      return;
    }

    const newStaff: StaffMember = {
      id: newStaffId.toUpperCase(),
      name: newStaffName,
      role: 'employee',
      team: selectedTeamForAdd,
      status: 'Active'
    };

    setStaffList([...staffList, newStaff]);
    setNewStaffId('');
    setNewStaffName('');
    alert(`ဝန်ထမ်းသစ် ${newStaff.name} (${newStaff.id}) ကို ${selectedTeamForAdd} သို့ အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။`);
  };

  const toggleStaffStatus = (id: string) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Resigned' : 'Active' } : s));
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
    alert(`Successfully imported ${addedCount} staff members as Active into ${bulkTeam}!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateLiveTime = (id: string, field: 'checkIn' | 'checkOut') => {
    const newVal = prompt(`Enter new ${field === 'checkIn' ? 'Check-in' : 'Check-out'} time:`, field === 'checkIn' ? '08:00 AM' : '05:00 PM');
    if (newVal) {
      setLiveRecords(liveRecords.map(r => r.id === id ? { ...r, [field]: newVal } : r));
    }
  };

  const handleChatSubmit = () => {
    const text = inputMessage.trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rawIds = Array.from(new Set(text.split(/[\s,]+/).map(id => id.trim().toUpperCase()).filter(Boolean)));
    const matchedStaff = staffList.filter(s => rawIds.includes(s.id.toUpperCase()) && s.status === 'Active');

    if (matchedStaff.length === 0) {
      alert('ထည့်သွင်းထားသော Staff ID များ မမှန်ကန်ပါ (သို့) Active မရှိပါ။');
      return;
    }

    const shiftTitleName = selectedShiftType === 'Day' ? t.dayShift : t.nightShift;
    const duplicatedStaff: { staff: StaffMember; existing: LiveShiftRecord }[] = [];
    const freshStaff: StaffMember[] = [];

    matchedStaff.forEach(st => {
      const existingRec = liveRecords.find(r => r.id.toUpperCase() === st.id.toUpperCase());
      if (existingRec) {
        duplicatedStaff.push({ staff: st, existing: existingRec });
      } else {
        freshStaff.push(st);
      }
    });

    if (duplicatedStaff.length > 0) {
      const firstDup = duplicatedStaff[0];
      setChatMessages(prev => [
        ...prev,
        { sender: 'user', text: inputMessage, time: currentTime },
        { 
          sender: 'bot', 
          text: `⚠️ [DUPLICATE CHECK-IN WARNING]\n\nဝန်ထမ်း: ${firstDup.staff.name} (${firstDup.staff.id})\n• လက်ရှိ Shift: ${firstDup.existing.shiftType}\n• ဝင်ထားသည့် Date: ${firstDup.existing.date}\n\n👉 ဤဝန်ထမ်းကို Shift အသစ် (${shiftTitleName} - ${customDateTime}) သို့ အစားထိုး ပြောင်းလဲမည်လား?`, 
          time: currentTime,
          isWarningCard: true,
          warningData: {
            dupStaff: firstDup.staff,
            existingShift: firstDup.existing,
            newShiftType: shiftTitleName,
            newDateTime: customDateTime,
          }
        }
      ]);
      setInputMessage('');
      return;
    }

    const newLiveEntries: LiveShiftRecord[] = freshStaff.map(st => ({
      id: st.id,
      name: st.name,
      shiftType: shiftTitleName,
      checkIn: customDateTime.includes(',') ? customDateTime.split(',')[1].trim() : '08:00 AM',
      checkOut: selectedShiftType === 'Day' ? '05:00 PM' : '05:00 AM',
      date: customDateTime.split(',')[0].trim() || '21/10/2026',
      team: st.team
    }));

    setLiveRecords([...newLiveEntries, ...liveRecords]);

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

  const handleConfirmReplace = (warningData: { dupStaff: StaffMember; existingShift: LiveShiftRecord; newShiftType: string; newDateTime: string }) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedRecord: LiveShiftRecord = {
      id: warningData.dupStaff.id,
      name: warningData.dupStaff.name,
      shiftType: warningData.newShiftType,
      checkIn: warningData.newDateTime.includes(',') ? warningData.newDateTime.split(',')[1].trim() : '08:00 AM',
      checkOut: warningData.newShiftType.includes('Day') ? '05:00 PM' : '05:00 AM',
      date: warningData.newDateTime.split(',')[0].trim() || '21/10/2026',
      team: warningData.dupStaff.team,
      isReplaced: true
    };

    setLiveRecords(prev => [updatedRecord, ...prev.filter(r => r.id !== warningData.dupStaff.id)]);

    setChatMessages(prev => [
      ...prev,
      { 
        sender: 'bot', 
        text: `🔄 အောင်မြင်ပါသည်! ဝန်ထမ်း ${warningData.dupStaff.name} (${warningData.dupStaff.id}) ၏ Shift ကို အစားထိုး အပ်ဒိတ်လုပ်ပြီးပါပြီ။`, 
        time: currentTime 
      }
    ]);
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
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Company / Full Name</label>
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col print:bg-white print:text-black">
      <style>{`
        @media print {
          body { background-color: white !important; color: black !important; }
          header, nav, button, input, select, .no-print { display: none !important; }
          .print-area { width: 100% !important; margin: 0 !important; padding: 0 !important; background: white !important; color: black !important; }
          table { width: 100% !important; border-collapse: collapse !important; }
          th, td { border: 1px solid #333 !important; padding: 6px !important; color: black !important; }
          tr { page-break-inside: avoid !important; }
          thead { display: table-header-group !important; }
        }
      `}</style>

      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 no-print">
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

        {/* Navigation Tab Bar */}
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
        {/* TEAM CHAT DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{t.welcome}, {currentUser.name}! 👋</h2>
                <p className="text-xs text-indigo-400 uppercase mt-0.5">ROLE: {currentUser.role} • ASSIGNED TEAM: {currentUser.assignedTeam}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[520px]">
              <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold">{t.checkInChatTitle}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-400">
                  TEAM CHAT
                </span>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`max-w-[85%] p-3 rounded-xl text-xs relative ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : msg.isWarningCard ? 'bg-amber-950/30 border border-amber-500/50 text-amber-200' : 'bg-slate-900 border border-slate-800 text-slate-200'}`}>
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

                      {msg.isWarningCard && msg.warningData && (
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={() => handleConfirmReplace(msg.warningData!)}
                            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-lg"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Shift အသစ်သို့ အစားထိုးမည်
                          </button>
                        </div>
                      )}

                      <span className="text-[9px] opacity-70 mt-1 block text-right">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>

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

                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={inputMessage} 
                    onChange={(e) => setInputMessage(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder={t.checkInPrompt} 
                    className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-full text-xs text-white outline-none" 
                  />
                  <button onClick={handleChatSubmit} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white rounded-full flex items-center gap-1.5 shrink-0">
                    <Send className="w-3.5 h-3.5" /> {t.checkInBtn}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHIFT ROSTER & LIVE TRACKING TAB */}
        {activeTab === 'shifts' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" /> Live Check-in / Check-out Records
                </h3>
                <p className="text-xs text-slate-400 mt-1">ဝန်ထမ်းများ၏ ဝင်ချိန်/ထွက်ချိန်များကို ဤနေရာတွင် ချိန်ညှိပြင်ဆင်နိုင်ပါသည်။</p>
              </div>
            </div>

            <div className="space-y-2">
              {liveRecords.map((rec) => (
                <div key={rec.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white">{rec.name} <span className="text-indigo-400">({rec.id})</span></p>
                      {rec.isReplaced && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Replaced
                        </span>
                      )}
                    </div>
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
        )}

        {/* TEAM MEMBERS TAB */}
        {activeTab === 'team' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
            <div>
              <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" /> အဖွဲ့ဝင်များ (Team Members & Staff Management)
              </h3>
              <p className="text-xs text-slate-400 mt-1">ဝန်ထမ်းအသစ်ထည့်ရန်နှင့် အလုပ်ထွက်သူများကို ဤနေရာတွင် စီမံနိုင်ပါသည်။</p>
            </div>

            <form onSubmit={handleDirectAddStaff} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-400" /> ဝန်ထမ်းအသစ်ထည့်ရန် (Add New Staff)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input 
                  type="text" 
                  required 
                  value={newStaffId} 
                  onChange={(e) => setNewStaffId(e.target.value)} 
                  placeholder="Staff ID (ဥပမာ- PPS102)" 
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" 
                />
                <input 
                  type="text" 
                  required 
                  value={newStaffName} 
                  onChange={(e) => setNewStaffName(e.target.value)} 
                  placeholder="Full Name (အမည်)" 
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" 
                />
                <select 
                  value={selectedTeamForAdd} 
                  onChange={(e) => setSelectedTeamForAdd(e.target.value)} 
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                >
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 text-white">
                <Plus className="w-4 h-4" /> ဝန်ထမ်းအသစ် ထည့်မည်
              </button>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400">လက်ရှိအဖွဲ့ဝင် ဝန်ထမ်းစာရင်းများ ({staffList.length}):</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {staffList.map((s, i) => (
                  <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-white">{s.name} <span className="text-indigo-400">({s.id})</span></p>
                      <p className="text-[10px] text-slate-400">Team: {s.team} • Role: {s.role}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {s.status}
                      </span>
                      <button 
                        onClick={() => toggleStaffStatus(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${s.status === 'Active' ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600/30' : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'}`}
                      >
                        {s.status === 'Active' ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {s.status === 'Active' ? 'အလုပ်ထွက်ရန် (Resign)' : 'Active ပြန်လုပ်မည်'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WORK DAYS / OT TAB */}
        {activeTab === 'attendance' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 print-area">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white print:text-black">Payroll — Work days / OT · Check-in Verified</h2>
                <p className="text-xs text-slate-400 mt-0.5 print:text-gray-700">2026-09-20 → 2026-10-20 · အမှန်တကယ် Check-in ဝင်ထားသည့် ဝန်ထမ်းများကိုသာ တိုက်စစ်မှတ်သားပေးပါသည်။</p>
              </div>
              <div className="flex gap-2 no-print">
                <button onClick={handlePrint} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print / PDF (A4)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl mt-4 print:border-black">
              <table className="w-full text-left text-xs print:text-black">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black print:border-black">
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
                <tbody className="divide-y divide-slate-800 text-slate-200 print:divide-gray-400 print:text-black">
                  {staffList.filter(s => s.status === 'Active').map((st, idx) => {
                    const isCheckedIn = liveRecords.some(r => r.id.toUpperCase() === st.id.toUpperCase());

                    return (
                      <React.Fragment key={st.id}>
                        <tr className="print:break-inside-avoid">
                          <td className="p-2.5" rowSpan={2}>{idx + 1}</td>
                          <td className="p-2.5 font-bold text-indigo-400 print:text-black" rowSpan={2}>{st.id}</td>
                          <td className="p-2.5 font-semibold" rowSpan={2}>
                            {st.name}
                            {!isCheckedIn && <span className="ml-2 text-[9px] text-slate-500 print:text-gray-600">(Not Checked-in)</span>}
                          </td>
                          <td className="p-2.5 text-center">{isCheckedIn ? <span className="text-emerald-400 font-bold print:text-black">WD</span> : <span className="text-slate-600 print:text-gray-400">x</span>}</td>
                          <td className="p-2.5 text-center">{isCheckedIn ? <span className="text-emerald-400 font-bold print:text-black">WD</span> : <span className="text-slate-600 print:text-gray-400">x</span>}</td>
                          <td className="p-2.5 text-center text-slate-500 print:text-gray-400">x</td>
                          <td className="p-2.5 text-center">{isCheckedIn ? <span className="text-emerald-400 font-bold print:text-black">WD</span> : <span className="text-slate-600 print:text-gray-400">x</span>}</td>
                        </tr>
                        <tr className="print:break-inside-avoid">
                          <td className="p-2.5 text-center border-t border-slate-800/50 print:border-gray-300">{isCheckedIn ? <span className="text-amber-400 font-bold print:text-black">OT</span> : <span className="text-slate-600 print:text-gray-400">x</span>}</td>
                          <td className="p-2.5 text-center text-slate-500 border-t border-slate-800/50 print:text-gray-400 print:border-gray-300">x</td>
                          <td className="p-2.5 text-center border-t border-slate-800/50 print:border-gray-300">{isCheckedIn ? <span className="text-amber-400 font-bold print:text-black">OT</span> : <span className="text-slate-600 print:text-gray-400">x</span>}</td>
                          <td className="p-2.5 text-center text-slate-500 border-t border-slate-800/50 print:text-gray-400 print:border-gray-300">x</td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
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
                <ShieldAlert className="w-4 h-4 text-indigo-400" /> 👑 Service Provider (SPD) Master Control Panel
              </h3>
              <p className="text-xs text-slate-400 mt-1">Email ဖြင့် Signup လုပ်လာသူ Customer များကို မည်သည့် Team ၏ Admin အဖြစ် သတ်မှတ်မည်ကို SPD မှ တိုက်ရိုက် စီမံနိုင်ပါသည်။</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <UserCog className="w-4 h-4 text-emerald-400" /> Email Signup Customers & Team Admin Management ({signupRequests.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {signupRequests.map((req) => (
                  <div key={req.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                    <div>
                      <p className="font-bold text-white">{req.name} <span className="text-indigo-400">({req.email})</span></p>
                      <p className="text-[10px] text-slate-400">
                        Status: <span className={`font-bold ${req.status === 'Approved' ? 'text-emerald-400' : 'text-amber-400'}`}>{req.status}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400">Assigned Team:</span>
                        <select 
                          value={req.assignedTeam} 
                          onChange={(e) => handleUpdateReqTeam(req.id, e.target.value)}
                          className="bg-transparent text-xs font-bold text-indigo-400 outline-none cursor-pointer"
                        >
                          {teams.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                        </select>
                      </div>

                      {req.status !== 'Approved' && (
                        <button onClick={() => handleApproveRequest(req.id, 'Approved')} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Approve as Team Admin
                        </button>
                      )}
                      {req.status !== 'Rejected' && (
                        <button onClick={() => handleApproveRequest(req.id, 'Rejected')} className="px-2.5 py-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 font-bold rounded-lg text-[10px] flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <ClipboardPaste className="w-4 h-4 text-emerald-400" /> Bulk Import Staff List (Default: Active)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select value={bulkTeam} onChange={(e) => setBulkTeam(e.target.value)} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none">
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="submit" onClick={handleBulkImport} className="py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 text-white">
                  <UserPlus className="w-4 h-4" /> Import Staff List (Active)
                </button>
              </div>
              <textarea 
                rows={3}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="PPS50, Mr. Zaw Lin Maung&#10;PPS61, Miss. Hla Hla Win..."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" /> Manage, Rename & Delete Teams ({teams.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {teams.map(tName => (
                  <div key={tName} className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-3 text-xs">
                    <span className="font-bold text-white">{tName}</span>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleRenameTeam(tName)}
                        className="p-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg"
                        title="Rename Team"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleSpdDeleteEntireTeam(tName)}
                        className="p-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 rounded-lg"
                        title="Delete Entire Team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddTeam} className="flex gap-2 pt-2">
                <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Create New Department / Team" className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" />
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-xs font-bold rounded-xl flex items-center gap-1"><Plus className="w-4 h-4" /> Add Team</button>
              </form>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Search className="w-4 h-4 text-emerald-400" /> Search & Delete Staff by ID / Name
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input 
                  type="text" 
                  value={spdSearchQuery} 
                  onChange={(e) => setSpdSearchQuery(e.target.value)} 
                  placeholder="Staff ID သို့မဟုတ် အမည်ဖြင့် ရှာရန်..." 
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none" 
                />
                <select 
                  value={spdSelectedTeamFilter} 
                  onChange={(e) => setSpdSelectedTeamFilter(e.target.value)} 
                  className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none cursor-pointer"
                >
                  <option value="All">All Teams (အားလုံး)</option>
                  {teams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
                {staffList
                  .filter(st => {
                    const matchesSearch = st.id.toLowerCase().includes(spdSearchQuery.toLowerCase()) || st.name.toLowerCase().includes(spdSearchQuery.toLowerCase());
                    const matchesTeam = spdSelectedTeamFilter === 'All' || st.team === spdSelectedTeamFilter;
                    return matchesSearch && matchesTeam;
                  })
                  .map((st) => (
                    <div key={st.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{st.name} <span className="text-indigo-400">({st.id})</span></p>
                        <p className="text-[10px] text-slate-400">Team: <span className="text-emerald-400 font-bold">{st.team}</span> • Status: <span className={st.status === 'Active' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{st.status}</span></p>
                      </div>

                      <button 
                        onClick={() => handleSpdDeleteStaff(st.id, st.name)}
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> ဖျက်မည် (Delete)
                      </button>
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
