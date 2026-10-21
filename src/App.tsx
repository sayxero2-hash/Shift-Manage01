import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  LogIn, ShieldCheck, UserPlus, 
  ArrowLeft, Users, Building2, Calendar, LayoutDashboard, 
  LogOut, Send, Globe, Bot, User, Plus, FileText, Printer, UserMinus, UserCheck, Copy, Check, Edit3, Clock, ClipboardPaste, ShieldAlert, CheckCircle, XCircle, AlertTriangle, RefreshCw, Trash2, Search, UserCog
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('shiftmaster_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [teams, setTeams] = useState<string[]>(() => {
    const saved = localStorage.getItem('shiftmaster_teams');
    return saved ? JSON.parse(saved) : ['Team A', 'Team B', 'Team C'];
  });
  const [newTeamName, setNewTeamName] = useState('');

  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('shiftmaster_staff');
    return saved ? JSON.parse(saved) : [];
  });

  const [signupRequests, setSignupRequests] = useState<SignupRequest[]>(() => {
    const saved = localStorage.getItem('shiftmaster_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [liveRecords, setLiveRecords] = useState<LiveShiftRecord[]>(() => {
    const saved = localStorage.getItem('shiftmaster_live');
    return saved ? JSON.parse(saved) : [];
  });

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
    fetchSupabaseData();
  }, []);

  const fetchSupabaseData = async () => {
    try {
      const { data: staffData } = await supabase.from('staff').select('*');
      if (staffData && staffData.length > 0) {
        setStaffList(staffData);
        localStorage.setItem('shiftmaster_staff', JSON.stringify(staffData));
      }

      const { data: teamData } = await supabase.from('teams').select('*');
      if (teamData && teamData.length > 0) {
        const tNames = teamData.map((t: any) => t.name);
        setTeams(tNames);
        localStorage.setItem('shiftmaster_teams', JSON.stringify(tNames));
      }

      const { data: liveData } = await supabase.from('live_records').select('*');
      if (liveData) {
        setLiveRecords(liveData);
        localStorage.setItem('shiftmaster_live', JSON.stringify(liveData));
      }

      const { data: reqData } = await supabase.from('signup_requests').select('*');
      if (reqData) {
        setSignupRequests(reqData);
        localStorage.setItem('shiftmaster_requests', JSON.stringify(reqData));
      }
    } catch (err) {
      console.error('Error fetching from Supabase:', err);
    }
  };

  useEffect(() =>
