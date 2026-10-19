import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  LogOut, Search, Clock, CheckCircle2, 
  AlertCircle, RefreshCw, Calendar, UserX, Building2, Timer 
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ShiftLog {
  id: string;
  pps_no: string;
  name: string;
  team_id: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  shift_name: string;
  status: string;
}

export default function CheckOutPage() {
  const [activeCheckIns, setActiveCheckIns] = useState<ShiftLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string>('');
  
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchActiveCheckIns = async () => {
    setLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      let query = supabase
        .from('shift_logs')
        .select('*')
        .eq('date', todayStr)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: true });

      if (teamId.trim()) {
        query = query.eq('team_id', teamId.trim());
      }

      const { data, error } = await query;

      if (error) throw error;
      setActiveCheckIns(data || []);
    } catch (err: any) {
      console.error('Error fetching active check-ins:', err.message);
      showNotification('error', 'Failed to fetch active attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCheckIns();

    const channel = supabase
      .channel('checkout_shift_logs_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shift_logs' },
        () => {
          fetchActiveCheckIns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const handleCheckOut = async (log: ShiftLog) => {
    setProcessingId(log.id);
    setNotification(null);

    try {
      const checkOutTimeObj = new Date();
      const checkInTimeObj = new Date(log.check_in_time);

      if (checkOutTimeObj <= checkInTimeObj) {
        throw new Error('Check-out time cannot be earlier than check-in time.');
      }

      const diffMs = checkOutTimeObj.getTime() - checkInTimeObj.getTime();
      const totalHoursDecimal = diffMs / (1000 * 60 * 60);

      const standardThreshold = 8.0;
      const normalHours = Number(Math.min(totalHoursDecimal, standardThreshold).toFixed(2));
      const otHours = Number(Math.max(0, totalHoursDecimal - standardThreshold).toFixed(2));

      const { error: updateError } = await supabase
        .from('shift_logs')
        .update({
          check_out_time: checkOutTimeObj.toISOString(),
          total_hours: normalHours,
          ot_hours: otHours,
          status: 'completed',
        })
        .eq('id', log.id);

      if (updateError) throw updateError;

      showNotification(
        'success', 
        `Checked out ${log.name} successfully. Worked: ${normalHours}h (OT: ${otHours}h)`
      );
      
      fetchActiveCheckIns();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to process check-out.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCheckIns = activeCheckIns.filter((log) => {
    const matchesShift = selectedShiftFilter === 'ALL' || log.shift_name === selectedShiftFilter;
    const matchesSearch = 
      log.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.pps_no.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesShift && matchesSearch;
  });

  const availableShifts = Array.from(new Set(activeCheckIns.map(item => item.shift_name)));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <LogOut className="w-6 h-6 text-amber-500" />
              <span>HR Live Check-Out Terminal</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitor active shifts, trigger check-outs, and automatically compute regular hours & overtime.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Team ID filter (Optional)"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {notification && (
          <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm border shadow-lg ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{notification.text}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or PPS No..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Shift:</span>
            <button
              onClick={() => setSelectedShiftFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedShiftFilter === 'ALL' 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Shifts
            </button>
            {availableShifts.map((shift) => (
              <button
                key={shift}
                onClick={() => setSelectedShiftFilter(shift)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  selectedShiftFilter === shift 
                    ? 'bg-amber-600 text-white shadow-md' 
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {shift}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
              <Timer className="w-4 h-4 text-amber-400" />
              <span>Pending Check-Outs ({filteredCheckIns.length})</span>
            </h2>
            <button
              onClick={fetchActiveCheckIns}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading && activeCheckIns.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
              <span>Loading active workers...</span>
            </div>
          ) : filteredCheckIns.length === 0 ? (
            <div className="py-16 text-center text-slate-600 text-xs flex flex-col items-center justify-center space-y-2">
              <UserX className="w-8 h-8 text-slate-700 mb-1" />
              <span>No active check-ins found.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">PPS No / Name</th>
                    <th className="py-3 px-4">Shift Name</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Elapsed Duration</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredCheckIns.map((log) => {
                    const checkInDate = new Date(log.check_in_time);
                    const now = new Date();
                    const diffHours = Math.max(0, (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(1);

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-200">
                          <div>{log.name}</div>
                          <div className="text-[10px] text-slate-500">{log.pps_no}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-[11px]">
                            {log.shift_name}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span>{checkInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          ~{diffHours} hrs elapsed
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleCheckOut(log)}
                            disabled={processingId === log.id}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-md shadow-amber-600/20 inline-flex items-center space-x-1.5 disabled:opacity-50 text-[11px]"
                          >
                            {processingId === log.id ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Check Out</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
