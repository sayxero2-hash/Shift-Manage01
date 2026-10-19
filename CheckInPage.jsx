import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  UserCheck, Search, Clock, Edit3, X, CheckCircle2, 
  AlertCircle, RefreshCw, Calendar, Building2 
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
  is_customized_shift?: boolean;
}

export default function CheckInPage() {
  const [teamId, setTeamId] = useState<string>('');
  const [ppsInput, setPpsInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [checkIns, setCheckIns] = useState<ShiftLog[]>([]);
  const [fetchingList, setFetchingList] = useState<boolean>(false);

  const [editingLog, setEditingLog] = useState<ShiftLog | null>(null);
  const [customCheckIn, setCustomCheckIn] = useState<string>('');
  const [customCheckOut, setCustomCheckOut] = useState<string>('');
  const [customShiftName, setCustomShiftName] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    fetchTodayCheckIns();

    const channel = supabase
      .channel('shift_logs_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shift_logs' },
        () => {
          fetchTodayCheckIns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const handleShowNotification = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTodayCheckIns = async () => {
    setFetchingList(true);
    const todayStr = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('shift_logs')
      .select('*')
      .eq('date', todayStr)
      .order('check_in_time', { ascending: false });

    if (teamId.trim()) {
      query = query.eq('team_id', teamId.trim());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching check-ins:', error.message);
    } else {
      setCheckIns(data || []);
    }
    setFetchingList(false);
  };

  const handleInstantCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ppsInput.trim()) return;

    setLoading(true);
    setNotification(null);

    try {
      const cleanPps = ppsInput.trim();

      // Query master_pps_list
      let ppsQuery = supabase
        .from('master_pps_list')
        .select('team_id, name, pps_no')
        .eq('pps_no', cleanPps);

      if (teamId.trim()) {
        ppsQuery = ppsQuery.eq('team_id', teamId.trim());
      }

      const { data: staffList, error: staffError } = await ppsQuery;

      if (staffError || !staffList || staffList.length === 0) {
        throw new Error(`Staff ID "${cleanPps}" not found in records.`);
      }

      const staff = staffList[0];
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTimeIso = new Date().toISOString();

      // Check if already checked in today
      const { data: existingLogs } = await supabase
        .from('shift_logs')
        .select('id, status')
        .eq('pps_no', cleanPps)
        .eq('date', todayStr);

      if (existingLogs && existingLogs.length > 0) {
        handleShowNotification('error', `Staff ${staff.name} (${cleanPps}) has already checked in today.`);
        setPpsInput('');
        setLoading(false);
        return;
      }

      // Insert into shift_logs
      const { error: insertError } = await supabase.from('shift_logs').insert([
        {
          team_id: staff.team_id,
          pps_no: staff.pps_no,
          name: staff.name,
          date: todayStr,
          check_in_time: nowTimeIso,
          shift_name: 'Standard Shift',
          status: 'checked_in',
          is_customized_shift: false,
        },
      ]);

      if (insertError) throw insertError;

      handleShowNotification('success', `Successfully checked in: ${staff.name} (${staff.pps_no})`);
      setPpsInput('');
      fetchTodayCheckIns();
    } catch (err: any) {
      handleShowNotification('error', err.message || 'Failed to process check-in.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (log: ShiftLog) => {
    setEditingLog(log);
    // Safe time extraction for local display
    const extractTime = (isoString: string | null) => {
      if (!isoString) return '';
      const dateObj = new Date(isoString);
      return dateObj.toTimeString().substring(0, 5); // HH:mm format
    };

    setCustomCheckIn(extractTime(log.check_in_time));
    setCustomCheckOut(extractTime(log.check_out_time));
    setCustomShiftName(log.shift_name || 'Standard Shift');
  };

  const handleSaveCustomShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;

    setUpdating(true);
    try {
      const todayStr = editingLog.date;
      const updatedCheckInIso = customCheckIn ? new Date(`${todayStr}T${customCheckIn}:00`).toISOString() : editingLog.check_in_time;
      const updatedCheckOutIso = customCheckOut ? new Date(`${todayStr}T${customCheckOut}:00`).toISOString() : null;

      const { error } = await supabase
        .from('shift_logs')
        .update({
          check_in_time: updatedCheckInIso,
          check_out_time: updatedCheckOutIso,
          shift_name: customShiftName,
          is_customized_shift: true,
          status: updatedCheckOutIso ? 'completed' : 'checked_in',
        })
        .eq('id', editingLog.id);

      if (error) throw error;

      handleShowNotification('success', `Updated shift configuration for ${editingLog.name}`);
      setEditingLog(null);
      fetchTodayCheckIns();
    } catch (err: any) {
      handleShowNotification('error', err.message || 'Failed to update shift logs.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <UserCheck className="w-6 h-6 text-blue-500" />
              <span>HR Live Check-in Terminal</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Quick-scan or enter staff PPS numbers to record attendance instantly.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by Team ID (Optional)"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {notification && (
          <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm border ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span>{notification.text}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <form onSubmit={handleInstantCheckIn} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={ppsInput}
                onChange={(e) => setPpsInput(e.target.value)}
                placeholder="Enter or scan PPS No (e.g. PPS-1001)..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-11 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Check-in Staff</span>}
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Today's Active Check-ins ({checkIns.length})</span>
            </h2>
            <button
              onClick={fetchTodayCheckIns}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-950 border border-slate-800 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingList ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {fetchingList && checkIns.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading logs...</div>
          ) : checkIns.length === 0 ? (
            <div className="py-12 text-center text-slate-600 text-xs">
              No check-ins recorded for today yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">PPS No / Name</th>
                    <th className="py-3 px-4">Shift Name</th>
                    <th className="py-3 px-4">Check-in Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {checkIns.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div>{log.name}</div>
                        <div className="text-[10px] text-slate-500">{log.pps_no}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md">
                          {log.shift_name} {log.is_customized_shift && <span className="text-amber-400 text-[10px] ml-1">(Custom)</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(log.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          log.status === 'completed' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditModal(log)}
                          className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-3 py-1.5 rounded-xl font-medium transition-all inline-flex items-center space-x-1 text-[11px]"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Edit Shift</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingLog(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-1">Customize Shift Time</h3>
            <p className="text-xs text-slate-400 mb-4">
              Editing attendance logs for <span className="text-slate-200 font-medium">{editingLog.name}</span> ({editingLog.pps_no})
            </p>

            <form onSubmit={handleSaveCustomShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Shift Name / Title</label>
                <input
                  type="text"
                  value={customShiftName}
                  onChange={(e) => setCustomShiftName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Check-in Time</label>
                  <input
                    type="time"
                    value={customCheckIn}
                    onChange={(e) => setCustomCheckIn(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Check-out Time</label>
                  <input
                    type="time"
                    value={customCheckOut}
                    onChange={(e) => setCustomCheckOut(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center space-x-1.5"
                >
                  {updating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>Save Changes</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
