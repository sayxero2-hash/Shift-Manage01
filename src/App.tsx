import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  LogIn, ShieldCheck, UserPlus, ArrowLeft, Users, Building2, Calendar, 
  LayoutDashboard, LogOut, Send, Globe, Bot, User, Plus, FileText, 
  Printer, UserMinus, UserCheck, Copy, Check, Edit3, Clock, 
  ClipboardPaste, ShieldAlert, CheckCircle, XCircle, AlertTriangle, 
  RefreshCw, Trash2, Search, UserCog
} from 'lucide-react';

// --- SUPABASE CLIENT SETUP ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    checkInTime: string;
    checkOutTime: string;
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
    checkInBtn: "Send",
    shiftLabel: "Shift Type",
    dateTimeLabel: "Date & Time",
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
    signOut: "登出",
  }
};

const calculateOtHours = (checkInStr: string, checkOutStr: string): number => {
  try {
    const parseTime = (timeStr: string) => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return hours + minutes / 60;
    };

    const inTime = parseTime(checkInStr);
    const outTime = parseTime(checkOutStr);

    if (inTime === null || outTime === null) return 2;

    let totalDuration = outTime - inTime;
    if (totalDuration < 0) totalDuration += 24;

    const workHoursWithoutLunch = Math.max(0, totalDuration - 1);
    const otHours = Math.max(0, workHoursWithoutLunch - 8);
    return otHours > 0 ? Math.round(otHours * 10) / 10 : 2;
  } catch (e) {
    return 2;
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('my');
  const t = translations[lang];

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const savedUser = localStorage.getItem('shiftmaster_current_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [teams, setTeams] = useState<string[]>(['Team A', 'Team B', 'Team C']);
  const [newTeamName, setNewTeamName] = useState('');

  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>([]);
  const [liveRecords, setLiveRecords] = useState<LiveShiftRecord[]>([]);

  const [selectedTeamForAdd, setSelectedTeamForAdd] = useState<string>('Team A');
  const [bulkTeam, setBulkTeam] = useState<string>('Team A');

  const [newStaffId, setNewStaffId] = useState('');
  const [newStaffName, setNewStaffName] = useState('');

  const [spdSearchQuery, setSpdSearchQuery] = useState('');
  const [spdSelectedTeamFilter, setSpdSelectedTeamFilter] = useState('All');

  const [bulkText, setBulkText] = useState('');

  const [selectedShiftType, setSelectedShiftType] = useState<'Day' | 'Night'>('Day');
  const [customDateTime, setCustomDateTime] = useState('21/10/2026');
  const [inputMessage, setInputMessage] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      sender: 'bot', 
      text: '🤖 မင်္ဂလာပါ! Supabase Cloud Database နှင့် အပြည့်အဝ ချိတ်ဆက်ပြီးသားဖြစ်ပါသည်။', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);

  useEffect(() => {
    let active = true;
    let loading = false;

    const loadAppData = async (session: any) => {
      if (!active || loading || !session) return;
      loading = true;
      try {
        const [staffResult, teamResult, liveResult, requestResult] =
          await Promise.all([
            supabase.from('staff').select('*'),
            supabase.from('teams').select('*'),
            supabase.from('live_records').select('*'),
            supabase.from('signup_requests').select('*'),
          ]);

        const errors = [
          staffResult.error, teamResult.error,
          liveResult.error, requestResult.error
        ].filter(Boolean);

        if (errors.length) {
          console.error('Supabase load errors:', errors);
          alert('Database မှ Data ပြန်ဖတ်ရာတွင် ပြဿနာရှိပါသည်။\n' +
            errors.map((e: any) => e.message).join('\n'));
        }

        if (!active) return;
        if (!staffResult.error && staffResult.data)
          setStaffList(staffResult.data as StaffMember[]);
        if (!teamResult.error && teamResult.data)
          setTeams(teamResult.data.map((t: any) => t.name).filter(Boolean));
        if (!liveResult.error && liveResult.data)
          setLiveRecords(liveResult.data.map((r: any) => ({
            id: r.id,
            name: r.name || '',
            shiftType: r.shifttype || '',
            checkIn: r.checkin || '',
            checkOut: r.checkout || '',
            date: r.date,
            team: r.team || '',
            isReplaced: r.isreplaced ?? false,
          })) as LiveShiftRecord[]);
        if (!requestResult.error && requestResult.data)
          setSignupRequests(requestResult.data as SignupRequest[]);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        loading = false;
        if (active) setIsInitializing(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setIsInitializing(false);
          return;
        }
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
          setIsInitializing(true);
          void loadAppData(session);
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (teams.length > 0) {
      if (!teams.includes(selectedTeamForAdd)) setSelectedTeamForAdd(teams[0]);
      if (!teams.includes(bulkTeam)) setBulkTeam(teams[0]);
    }
  }, [teams]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('shiftmaster_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('shiftmaster_current_user');
    }
  }, [currentUser]);

  const generate20to20Days = () => {
    const days = [];
    for (let d = 20; d <= 31; d++) {
      days.push({ dayNum: d, fullDateStr: `${d}/10/2026` });
    }
    for (let d = 1; d <= 20; d++) {
      const formatted = d < 10 ? `0${d}` : `${d}`;
      days.push({ dayNum: d, fullDateStr: `${formatted}/11/2026` });
    }
    return days;
  };

  const cycleDays = generate20to20Days();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    if (identifier.trim().toLowerCase() === 'sayxero2@gmail.com') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });

      if (error || !data.user) {
        alert('SPD Master login မအောင်မြင်ပါ: ' + (error?.message || 'User not found'));
        return;
      }

      const { data: isSuperAdmin, error: roleError } = await supabase.rpc('has_role', {
        _user_id: data.user.id,
        _role: 'super_admin',
      });

      if (roleError || isSuperAdmin !== true) {
        await supabase.auth.signOut();
        alert('ဤအကောင့်တွင် super_admin အခွင့်အာဏာ မရှိပါ။');
        return;
      }

      const spdUser: UserProfile = {
        name: 'SPD Master',
        identifier: data.user.email || identifier,
        role: 'spd',
        assignedTeam: 'All Teams (Master)',
      };
      setCurrentUser(spdUser);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: password,
    });

    if (error) {
      alert('အကောင့်ဝင်ရန် မအောင်မြင်ပါ: ' + error.message);
      return;
    }

    if (data.user) {
      let role: 'spd' | 'team_admin' | 'employee' = 'team_admin';
      let assignedTeam = teams[0] || 'Team A';

      const foundReq = signupRequests.find(r => r.email.toLowerCase() === identifier.toLowerCase() && r.status === 'Approved');
      if (foundReq) {
        role = 'team_admin';
        assignedTeam = foundReq.assignedTeam;
      }

      const loggedUser: UserProfile = {
        name: data.user.email?.split('@')[0] || identifier,
        identifier: identifier,
        role: role,
        assignedTeam: assignedTeam,
      };
      setCurrentUser(loggedUser);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password || !fullName) return;

    const { error } = await supabase.auth.signUp({
      email: identifier,
      password: password,
    });

    if (error) {
      alert('အကောင့်အသစ်ဖွင့်ခြင်း မအောင်မြင်ပါ: ' + error.message);
      return;
    }

    const newReq: SignupRequest = {
      id: 'req_' + Date.now(),
      name: fullName,
      email: identifier,
      status: 'Pending',
      freeTrialDays: 7,
      assignedTeam: teams[0] || 'Team A'
    };
    
    const { error: saveRequestError } = await supabase.from('signup_requests').upsert([newReq]);
    if (saveRequestError) {
      console.error('Save signup request failed:', saveRequestError);
      alert('Signup request သိမ်းမရပါ: ' + saveRequestError.message);
      return;
    }
    setSignupRequests(prev => [newReq, ...prev]);
    
    alert('အကောင့်ဖွင့်ခြင်း တောင်းဆိုမှု အောင်မြင်ပါသည်။ SPD မာစတာမှ အတည်ပြုပေးရန် စောင့်ဆိုင်းနေပါသည်။');
    setAuthMode('login');
  };

  const handleApproveRequest = async (id: string, status: 'Approved' | 'Rejected') => {
    const { error } = await supabase.from('signup_requests').update({ status }).eq('id', id);
    if (error) {
      console.error('Update signup status failed:', error);
      alert('Request status သိမ်းမရပါ: ' + error.message);
      return;
    }
    setSignupRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const handleUpdateReqTeam = async (id: string, assignedTeam: string) => {
    const { error } = await supabase.from('signup_requests').update({ assignedTeam }).eq('id', id);
    if (error) {
      console.error('Update request team failed:', error);
      alert('Request Team သိမ်းမရပါ: ' + error.message);
      return;
    }
    setSignupRequests(prev => prev.map(r => r.id === id ? { ...r, assignedTeam } : r));
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName && !teams.includes(newTeamName)) {
      const teamName = newTeamName.trim();
      if (!teamName) return;
      const { error } = await supabase.from('teams').upsert([{ name: teamName }], { onConflict: 'name' });
      if (error) {
        console.error('Add team failed:', error);
        alert('Team သိမ်းမရပါ: ' + error.message);
        return;
      }
      setTeams(prev => prev.includes(teamName) ? prev : [...prev, teamName]);
      setNewTeamName('');
    }
  };

  const handleRenameTeam = async (oldTeamName: string) => {
    const updatedName = prompt(`Team (${oldTeamName}) အတွက် နာမည်သစ် ရိုက်ထည့်ပါ:`, oldTeamName);
    if (updatedName && updatedName.trim() !== '' && updatedName !== oldTeamName) {
      const newName = updatedName.trim();
      const updatedTeams = teams.map(t => t === oldTeamName ? newName : t);
      
      setTeams(updatedTeams);
      await supabase.from('teams').delete().eq('name', oldTeamName);
      await supabase.from('teams').upsert([{ name: newName }]);

      const updatedStaff = staffList.map(s => s.team === oldTeamName ? { ...s, team: newName } : s);
      setStaffList(updatedStaff);
      for (const st of updatedStaff) {
        if (st.team === newName) {
          await supabase.from('staff').update({ team: newName }).eq('id', st.id);
        }
      }
      alert(`Team အမည်ကို (${oldTeamName}) မှ (${newName}) သို့ ပြောင်းလဲပြီးပါပြီ။`);
    }
  };

  const handleSpdDeleteStaff = async (staffId: string, staffName: string) => {
    if (confirm(`ဝန်ထမ်း ${staffName} (${staffId}) ကို ဖျက်ရန် သေချာပါသလား?`)) {
      setStaffList(staffList.filter(s => s.id !== staffId));
      setLiveRecords(liveRecords.filter(r => r.id !== staffId));
      await supabase.from('staff').delete().eq('id', staffId);
      await supabase.from('live_records').delete().eq('id', staffId);
      alert(`ဝန်ထမ်း ${staffId} အောင်မြင်စွာ ဖျက်ပြီးပါပြီ။`);
    }
  };

  const handleSpdDeleteEntireTeam = async (teamName: string) => {
    if (confirm(`Team (${teamName}) ရှိ ဝန်ထမ်းအားလုံးကို ဖျက်ရန် သေချာပါသလား?`)) {
      setTeams(teams.filter(t => t !== teamName));
      setStaffList(staffList.filter(s => s.team !== teamName));
      setLiveRecords(liveRecords.filter(r => r.team !== teamName));
      
      await supabase.from('teams').delete().eq('name', teamName);
      await supabase.from('staff').delete().eq('team', teamName);
      alert(`Team (${teamName}) ကို ဖျက်ပြီးပါပြီ။`);
    }
  };

  const handleDirectAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffId || !newStaffName) return;

    if (staffList.some(s => s.id.toUpperCase() === newStaffId.toUpperCase())) {
      alert('ဤ Staff ID မှာ ရှိပြီးသားဖြစ်ပါသည်။');
      return;
    }

    const targetTeam = selectedTeamForAdd || teams[0] || 'Team A';
    const newStaff: StaffMember = {
      id: newStaffId.toUpperCase(),
      name: newStaffName,
      role: 'employee',
      team: targetTeam,
      status: 'Active'
    };

    const { error } = await supabase.from('staff').upsert([newStaff], { onConflict: 'id' });
    if (error) {
      console.error('Add staff failed:', error);
      alert('ဝန်ထမ်းကို Database ထဲ သိမ်းမရပါ: ' + error.message);
      return;
    }

    setStaffList(prev => [...prev, newStaff]);
    setNewStaffId('');
    setNewStaffName('');
    alert(`ဝန်ထမ်းသစ် ${newStaff.name} (${newStaff.id}) ကို ${targetTeam} သို့ Database ထဲ သိမ်းပြီးပါပြီ။`);
  };

  const toggleStaffStatus = async (id: string) => {
    const target = staffList.find(s => s.id === id);
    if (!target) return;
    const newStatus = target.status === 'Active' ? 'Resigned' : 'Active';

    const { error } = await supabase.from('staff').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error('Update staff status failed:', error);
      alert('ဝန်ထမ်းအခြေအနေ သိမ်းမရပါ: ' + error.message);
      return;
    }
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) return;

    const targetTeam = bulkTeam || teams[0] || 'Team A';
    const lines = bulkText.split('\n');
    let addedCount = 0;
    const newStaffs: StaffMember[] = [...staffList];

    for (const line of lines) {
      const parts = line.split(/[\t,-]+/);
      if (parts.length >= 2) {
        const id = parts[0].trim().toUpperCase();
        const name = parts[1].trim();
        if (id && name && !newStaffs.some(s => s.id === id)) {
          const st: StaffMember = { id, name, role: 'employee', team: targetTeam, status: 'Active' };
          const { error } = await supabase.from('staff').upsert([st], { onConflict: 'id' });
          if (error) {
            console.error(`Bulk import failed for ${id}:`, error);
          } else {
            newStaffs.push(st);
            addedCount++;
          }
        }
      }
    }

    setStaffList(newStaffs);
    setBulkText('');
    alert(`Database ထဲသို့ ဝန်ထမ်း ${addedCount} ဦး သိမ်းပြီးပါပြီ။ မအောင်မြင်သော Row များရှိပါက Console တွင် Error စစ်ပါ။`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateLiveTime = async (id: string, field: 'checkIn' | 'checkOut') => {
    const newVal = prompt(`Enter new ${field === 'checkIn' ? 'Check-in' : 'Check-out'} time:`, field === 'checkIn' ? '08:00 AM' : '07:00 PM');
    if (newVal) {
      const { error } = await supabase.from('live_records').update({ [field]: newVal }).eq('id', id);
      if (error) {
        console.error('Update shift time failed:', error);
        alert('Shift အချိန် သိမ်းမရပါ: ' + error.message);
        return;
      }
      setLiveRecords(prev => prev.map(r => r.id === id ? { ...r, [field]: newVal } : r));
    }
  };

  const handleChatSubmit = async () => {
    const text = inputMessage.trim();
    if (!text) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const rawIds = Array.from(new Set(text.split(/[\s,]+/).map(id => id.trim().toUpperCase()).filter(Boolean)));
    const matchedStaff = staffList.filter(s => rawIds.includes(s.id.toUpperCase()) && s.status === 'Active');

    if (matchedStaff.length === 0) {
      alert('ထည့်သွင်းထားသော Staff ID များ မမှန်ကန်ပါ (သို့) Active မရှိပါ။');
      return;
    }

    const shiftTitleName = selectedShiftType === 'Day' ? 'Day Shift (08:00 AM - 07:00 PM)' : 'Night Shift (08:00 PM - 07:00 AM)';
    const defaultCheckIn = selectedShiftType === 'Day' ? '08:00 AM' : '08:00 PM';
    const defaultCheckOut = selectedShiftType === 'Day' ? '07:00 PM' : '07:00 AM';

    const duplicatedStaff: { staff: StaffMember; existing: LiveShiftRecord }[] = [];
    const freshStaff: StaffMember[] = [];

    matchedStaff.forEach(st => {
      const existingRec = liveRecords.find(r => r.id.toUpperCase() === st.id.toUpperCase() && r.date === customDateTime);
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
          text: `⚠️ [DUPLICATE CHECK-IN WARNING]\n\nဝန်ထမ်း: ${firstDup.staff.name} (${firstDup.staff.id})\n• ရက်စွဲ: ${customDateTime}\n• လက်ရှိ Shift: ${firstDup.existing.shiftType}\n\n👉 ဤရက်အတွက် Shift အသစ် (${shiftTitleName}) သို့ အစားထိုး ပြောင်းလဲမည်လား?`, 
          time: currentTime,
          isWarningCard: true,
          warningData: {
            dupStaff: firstDup.staff,
            existingShift: firstDup.existing,
            newShiftType: shiftTitleName,
            newDateTime: customDateTime,
            checkInTime: defaultCheckIn,
            checkOutTime: defaultCheckOut
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
      checkIn: defaultCheckIn,
      checkOut: defaultCheckOut,
      date: customDateTime,
      team: st.team
    }));

    for (const entry of newLiveEntries) {
      const dbEntry = {
        id: entry.id,
        name: entry.name,
        shifttype: entry.shiftType,
        checkin: entry.checkIn,
        checkout: entry.checkOut,
        date: entry.date,
        team: entry.team,
      };
      const { error } = await supabase.from('live_records').upsert([dbEntry]);
      if (error) {
        console.error('Save shift failed:', entry.id, error);
        alert('Shift save failed for ' + entry.id + ': ' + error.message);
        return;
      }
    }
    const updatedLive = [...newLiveEntries, ...liveRecords];
    setLiveRecords(updatedLive)

    let otCalcHours = calculateOtHours(defaultCheckIn, defaultCheckOut);
    let formattedText = `📌 [SHIFT ROSTER NOTIFICATION]\n📅 Date: ${customDateTime}\n⏰ Shift: ${shiftTitleName}\n👥 Total Staff: ${matchedStaff.length} Persons\n------------------------------\n`;
    matchedStaff.forEach((st, idx) => {
      formattedText += `${idx + 1}. ${st.id} - ${st.name} (${st.team}) [OT: ${otCalcHours}h]\n`;
    });
    formattedText += `------------------------------\n✅ Saved to Supabase Database successfully!`;

    setChatMessages(prev => [
      ...prev,
      { sender: 'user', text: inputMessage, time: currentTime },
      { sender: 'bot', text: formattedText, time: currentTime, isFormattedList: true }
    ]);

    setInputMessage('');
  };

  const handleConfirmReplace = async (warningData: { dupStaff: StaffMember; existingShift: LiveShiftRecord; newShiftType: string; newDateTime: string; checkInTime: string; checkOutTime: string }) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedRecord: LiveShiftRecord = {
      id: warningData.dupStaff.id,
      name: warningData.dupStaff.name,
      shiftType: warningData.newShiftType,
      checkIn: warningData.checkInTime,
      checkOut: warningData.checkOutTime,
      date: warningData.newDateTime,
      team: warningData.dupStaff.team,
      isReplaced: true
    };

    const updatedLive = [updatedRecord, ...liveRecords.filter(r => !(r.id === warningData.dupStaff.id && r.date === warningData.newDateTime))];
    const { error } = await supabase.from('live_records').upsert([{
      id: updatedRecord.id,
      name: updatedRecord.name,
      shifttype: updatedRecord.shiftType,
      checkin: updatedRecord.checkIn,
      checkout: updatedRecord.checkOut,
      date: updatedRecord.date,
      team: updatedRecord.team,
      isreplaced: updatedRecord.isReplaced ?? false,
    }]);
    if (error) {
      console.error('Replace shift failed:', error);
      alert('Shift အစားထိုး သိမ်းမရပါ: ' + error.message);
      return;
    }
    setLiveRecords(updatedLive);

    setChatMessages(prev => [
      ...prev,
      { 
        sender: 'bot', 
        text: `🔄 အောင်မြင်ပါသည်! ဝန်ထမ်း ${warningData.dupStaff.name} (${warningData.dupStaff.id}) ၏ Shift ကို Supabase တွင် အစားထိုး အပ်ဒိတ်လုပ်ပြီးပါပြီ။`, 
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
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-2xl text-white mb-2"><ShieldCheck className="w-8 h-8" /></div>
            <h1 className="text-xl font-bold">{t.appName}</h1>
            <p className="text-xs text-slate-400 mt-1">Supabase Auth Secure Login</p>
          </div>

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email or Phone No</label>
                <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="example@gmail.com or phone" />
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
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Email or Phone No</label>
                <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none" placeholder="example@gmail.com or phone" />
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
          th, td { border: 1px solid #333 !important; padding: 4px !important; color: black !important; text-align: center !important; }
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
            <button onClick={() => { supabase.auth.signOut(); localStorage.removeItem('shiftmaster_current_user'); setCurrentUser(null); }} className="p-2 bg-slate-800 hover:bg-rose-600/20 text-slate-300 rounded-xl" title={t.signOut}><LogOut className="w-4 h-4" /></button>
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
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                  SUPABASE CLOUD SYNC
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
                      <option value="Day" className="bg-slate-900">Day Shift (08:00 AM - 07:00 PM)</option>
                      <option value="Night" className="bg-slate-900">Night Shift (08:00 PM - 07:00 AM)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">ရက်စွဲ (Date):</span>
                    <input 
                      type="text" 
                      value={customDateTime} 
                      onChange={(e) => setCustomDateTime(e.target.value)} 
                      className="bg-transparent text-xs font-bold text-emerald-400 outline-none w-full"
                      placeholder="ဥပမာ - 21/10/2026"
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
              {liveRecords.map((rec, i) => (
                <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
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

        {activeTab === 'attendance' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 print-area">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-white print:text-black">Payroll — Work days / OT Hours Verified</h2>
                <p className="text-xs text-slate-400 mt-0.5 print:text-gray-700">20th to 20th Cycle · Supabase Database Sync Active.</p>
              </div>
              <div className="flex gap-2 no-print">
                <button onClick={handlePrint} className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5" /> Print / PDF (A4)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl mt-4 print:border-black">
              <table className="w-full text-left text-[11px] print:text-black min-w-[1000px]">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 print:bg-gray-100 print:text-black print:border-black">
                  <tr>
                    <th className="p-2 text-center border-r border-slate-800 print:border-gray-300">#</th>
                    <th className="p-2 text-center border-r border-slate-800 print:border-gray-300">PPS</th>
                    <th className="p-2 text-left border-r border-slate-800 print:border-gray-300 min-w-[120px]">Name</th>
                    {cycleDays.map(d => (
                      <th key={d.fullDateStr} className="p-1.5 text-center border-r border-slate-800/60 print:border-gray-300 text-[10px]">
                        {d.dayNum}
                      </th>
                    ))}
                    <th className="p-2 text-center font-bold text-emerald-400 print:text-black border-r border-slate-800">Total WD</th>
                    <th className="p-2 text-center font-bold text-amber-400 print:text-black">Total OT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 print:divide-gray-400 print:text-black">
                  {staffList.filter(s => s.status === 'Active').map((st, idx) => {
                    let cumulativeWdCounter = 0;
                    let totalOtHoursAcc = 0;

                    const rowDayValues = cycleDays.map(d => {
                      const matchedRecord = liveRecords.find(
                        r => r.id.toUpperCase() === st.id.toUpperCase() && r.date === d.fullDateStr
                      );

                      if (matchedRecord) {
                        cumulativeWdCounter++;
                        const otHrs = calculateOtHours(matchedRecord.checkIn, matchedRecord.checkOut);
                        totalOtHoursAcc += otHrs;
                        return { isCheckedIn: true, wdNum: cumulativeWdCounter, otHrs };
                      }
                      return { isCheckedIn: false, wdNum: null, otHrs: 0 };
                    });

                    return (
                      <React.Fragment key={st.id}>
                        <tr className="print:break-inside-avoid bg-slate-900/50 print:bg-white">
                          <td className="p-2 text-center font-bold border-r border-slate-800 print:border-gray-300" rowSpan={2}>{idx + 1}</td>
                          <td className="p-2 text-center font-bold text-indigo-400 print:text-black border-r border-slate-800 print:border-gray-300" rowSpan={2}>{st.id}</td>
                          <td className="p-2 font-semibold border-r border-slate-800 print:border-gray-300" rowSpan={2}>
                            {st.name}
                          </td>

                          {rowDayValues.map((val, i) => (
                            <td key={i} className="p-1.5 text-center border-r border-slate-800/40 print:border-gray-300 font-bold">
                              {val.isCheckedIn ? (
                                <span className="text-emerald-400 print:text-black">{val.wdNum}</span>
                              ) : (
                                <span className="text-slate-700 print:text-gray-300">-</span>
                              )}
                            </td>
                          ))}

                          <td className="p-2 text-center font-bold text-emerald-400 print:text-black bg-emerald-950/20 print:bg-transparent border-r border-slate-800" rowSpan={2}>
                            {cumulativeWdCounter} Days
                          </td>
                          <td className="p-2 text-center font-bold text-amber-400 print:text-black bg-amber-950/20 print:bg-transparent" rowSpan={2}>
                            {totalOtHoursAcc} hrs
                          </td>
                        </tr>

                        <tr className="print:break-inside-avoid bg-slate-950/40 print:bg-white">
                          {rowDayValues.map((val, i) => (
                            <td key={i} className="p-1 text-center border-r border-slate-800/40 print:border-gray-300 text-[9px] border-t border-slate-800/50 whitespace-nowrap">
                              {val.isCheckedIn ? (
                                <span className="text-amber-400 font-bold print:text-black">OT ({val.otHrs}h)</span>
                              ) : (
                                <span className="text-slate-700 print:text-gray-300">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admin' && currentUser.role === 'spd' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-6">
            <div>
              <h3 className="font-bold text-sm text-indigo-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-400" /> 👑 Service Provider (SPD) Master Control Panel (Supabase Sync)
              </h3>
              <p className="text-xs text-slate-400 mt-1">အချက်အလက်များအားလုံး Database တွင် အလိုအလျောက် သိမ်းဆည်းပေးနေပါသည်။</p>
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
                          <CheckCircle className="w-3 h-3" /> Approve
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
                <ClipboardPaste className="w-4 h-4 text-emerald-400" /> Bulk Import Staff List (Cloud Sync)
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
                        className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-slate-800 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
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
