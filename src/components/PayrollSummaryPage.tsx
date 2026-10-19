import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Calendar, Printer, DollarSign, Clock, Users, 
  RefreshCw, AlertCircle, Building2, FileText, CheckCircle2, LayoutGrid, Table as TableIcon 
} from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PayrollSummaryRow {
  pps_no: string;
  name: string;
  total_days: number;
  regular_hours: number;
  ot_hours: number;
  base_pay: number;
  ot_pay: number;
  total_salary: number;
}

export default function PayrollSummaryPage() {
  const getDefaultCycle = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    const startDate = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-20`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-20`;

    return { startDate, endDate };
  };

  const defaultCycle = getDefaultCycle();
  const [startDate, setStartDate] = useState<string>(defaultCycle.startDate);
  const [endDate, setEndDate] = useState<string>(defaultCycle.endDate);
  
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [payrollData, setPayrollData] = useState<PayrollSummaryRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const fetchPayrollReport = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Master PPS List
      let ppsQuery = supabase.from('master_pps_list').select('pps_no, name, base_hourly_rate, ot_rate, team_id');
      if (teamFilter.trim()) {
        ppsQuery = ppsQuery.eq('team_id', teamFilter.trim());
      }
      const { data: ppsList, error: ppsError } = await ppsQuery;
      if (ppsError) throw ppsError;

      const ratesMap: Record<string, { name: string; hourly: number; ot: number }> = {};
      ppsList?.forEach((item) => {
        ratesMap[item.pps_no] = {
          name: item.name || 'Unknown Staff',
          hourly: Number(item.base_hourly_rate) || 80.00,
          ot: Number(item.ot_rate) || 120.00,
        };
      });

      // 2. Fetch completed 'shift_logs' within date range
      let logsQuery = supabase
        .from('shift_logs')
        .select('*')
        .eq('status', 'completed')
        .gte('date', startDate)
        .lte('date', endDate);

      if (teamFilter.trim()) {
        logsQuery = logsQuery.eq('team_id', teamFilter.trim());
      }

      const { data: logs, error: logsError } = await logsQuery;
      if (logsError) throw logsError;

      // 3. Aggregate data per employee (Filtering out early leaves where total_hours <= 0)
      const aggregationMap: Record<string, {
        name: string;
        daysSet: Set<string>;
        regular_hours: number;
        ot_hours: number;
      }> = {};

      Object.keys(ratesMap).forEach((pps) => {
        aggregationMap[pps] = {
          name: ratesMap[pps].name,
          daysSet: new Set(),
          regular_hours: 0,
          ot_hours: 0,
        };
      });

      logs?.forEach((log) => {
        const pps = log.pps_no;
        if (!aggregationMap[pps]) {
          aggregationMap[pps] = {
            name: ratesMap[pps]?.name || log.name || pps,
            daysSet: new Set(),
            regular_hours: 0,
            ot_hours: 0,
          };
        }

        // 🛑 Rule: total_hours 0 ထက်ကြီးမှသာ အလုပ်ဆင်းရက်နှင့် လစာအတွက် ထည့်တွက်မည် (စောပြန်သူများအတွက် 0 ဖြစ်၍ မပါဝင်ပါ)
        const loggedHours = Number(log.total_hours) || 0;
        if (log.date && loggedHours > 0) {
          aggregationMap[pps].daysSet.add(log.date);
        }
        
        aggregationMap[pps].regular_hours += loggedHours;
        aggregationMap[pps].ot_hours += Number(log.ot_hours) || 0;
      });

      // 4. Compute final payroll calculation rows
      const finalRows: PayrollSummaryRow[] = Object.keys(aggregationMap).map((pps) => {
        const item = aggregationMap[pps];
        const rates = ratesMap[pps] || { hourly: 80.0, ot: 120.0 };

        const totalDays = item.daysSet.size;
        const regHours = Number(item.regular_hours.toFixed(2));
        const otHours = Number(item.ot_hours.toFixed(2));
        
        const basePay = Number((regHours * rates.hourly).toFixed(2));
        const otPay = Number((otHours * rates.ot).toFixed(2));
        const totalSalary = Number((basePay + otPay).toFixed(2));

        return {
          pps_no: pps,
          name: item.name,
          total_days: totalDays,
          regular_hours: regHours,
          ot_hours: otHours,
          base_pay: basePay,
          ot_pay: otPay,
          total_salary: totalSalary,
        };
      });

      setPayrollData(finalRows);
    } catch (err: any) {
      console.error('Payroll generation error:', err);
      setError(err.message || 'Failed to aggregate payroll summary data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollReport();
  }, [startDate, endDate, teamFilter]);

  const grandTotalDays = payrollData.reduce((acc, curr) => acc + curr.total_days, 0);
  const grandTotalRegHours = payrollData.reduce((acc, curr) => acc + curr.regular_hours, 0);
  const grandTotalOtHours = payrollData.reduce((acc, curr) => acc + curr.ot_hours, 0);
  const grandTotalBasePay = payrollData.reduce((acc, curr) => acc + curr.base_pay, 0);
  const grandTotalOtPay = payrollData.reduce((acc, curr) => acc + curr.ot_pay, 0);
  const grandTotalSalary = payrollData.reduce((acc, curr) => acc + curr.total_salary, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans print:p-0 print:bg-white print:text-black">
      
      <div className="max-w-4xl mx-auto space-y-6 print:hidden">
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-xl shadow-xl">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center space-x-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              <span>Payroll & Attendance Summary</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Cycle accounting report (20th to 20th billing cycle) with Mobile Card & A4 Print modes.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                  viewMode === 'cards' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Photo Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>A4 Table</span>
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
              <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
              <span className="text-slate-400">Cycle:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              />
              <span className="text-slate-600">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Building2 className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by Team ID..."
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 w-full md:w-48"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="max-w-[210mm] mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 mt-6 shadow-2xl print:shadow-none print:border-none print:bg-white print:text-black print:p-0 print:m-0 w-full">
        
        <div className="border-b border-slate-800 pb-6 mb-6 print:border-slate-300">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-extrabold text-white print:text-slate-900 tracking-tight">ShiftMaster Pro Enterprise</h2>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">Official Workforce Payroll & Attendance Summary Report</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-blue-500/15 text-blue-400 print:bg-slate-100 print:text-slate-800 border border-blue-500/30 print:border-slate-300 text-[11px] font-semibold px-3 py-1 rounded-full">
                Cycle: {startDate} to {endDate}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-slate-400 print:text-slate-600 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            <span className="text-xs">Generating payroll calculation report...</span>
          </div>
        ) : payrollData.length === 0 ? (
          <div className="py-24 text-center text-slate-500 text-xs">
            No payroll records found for the selected cycle.
          </div>
        ) : (
          <div>
            {(viewMode === 'cards' || window.matchMedia('print').matches === false) && viewMode === 'cards' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 print:hidden">
                {payrollData.map((row) => (
                  <div key={row.pps_no} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all">
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-white">{row.name}</h3>
                          <span className="text-[11px] text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 inline-block mt-1">
                            {row.pps_no}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Net</span>
                          <span className="text-base font-extrabold text-emerald-400">${row.total_salary.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-3 my-2 border-y border-slate-800/80 text-center">
                        <div className="bg-slate-900/80 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Work Days</span>
                          <span className="text-xs font-bold text-slate-200">{row.total_days} days</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">Reg. Hours</span>
                          <span className="text-xs font-bold text-slate-200">{row.regular_hours.toFixed(1)}h</span>
                        </div>
                        <div className="bg-slate-900/80 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block">OT Hours</span>
                          <span className="text-xs font-bold text-amber-400">{row.ot_hours.toFixed(1)}h</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                      <span>Base: ${row.base_pay.toFixed(2)}</span>
                      <span>OT Pay: ${row.ot_pay.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={`overflow-x-auto mb-8 ${viewMode === 'cards' ? 'print:block hidden' : 'block'}`}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 print:bg-slate-100 print:text-slate-700 uppercase tracking-wider border-b border-slate-800 print:border-slate-300">
                    <th className="py-3 px-3">PPS No & Name</th>
                    <th className="py-3 px-3 text-center">Days</th>
                    <th className="py-3 px-3 text-right">Reg. Hrs</th>
                    <th className="py-3 px-3 text-right">OT Hrs</th>
                    <th className="py-3 px-3 text-right">Base Pay</th>
                    <th className="py-3 px-3 text-right">OT Pay</th>
                    <th className="py-3 px-3 text-right font-bold">Total Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                  {payrollData.map((row) => (
                    <tr key={row.pps_no} className="hover:bg-slate-800/40 print:hover:bg-transparent">
                      <td className="py-3 px-3 font-medium text-slate-200 print:text-slate-900">
                        <div>{row.name}</div>
                        <div className="text-[10px] text-slate-500">{row.pps_no}</div>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300 print:text-slate-800">{row.total_days}</td>
                      <td className="py-3 px-3 text-right text-slate-300 print:text-slate-800">{row.regular_hours.toFixed(1)}h</td>
                      <td className="py-3 px-3 text-right text-slate-300 print:text-slate-800">{row.ot_hours.toFixed(1)}h</td>
                      <td className="py-3 px-3 text-right text-slate-300 print:text-slate-800">${row.base_pay.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right text-slate-300 print:text-slate-800">${row.ot_pay.toFixed(2)}</td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-400 print:text-slate-900">${row.total_salary.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-950/80 print:bg-slate-50 font-bold border-t-2 border-slate-700 print:border-slate-400 text-slate-100 print:text-slate-900">
                    <td className="py-3.5 px-3">Grand Totals</td>
                    <td className="py-3.5 px-3 text-center">{grandTotalDays}</td>
                    <td className="py-3.5 px-3 text-right">{grandTotalRegHours.toFixed(1)}h</td>
                    <td className="py-3.5 px-3 text-right">{grandTotalOtHours.toFixed(1)}h</td>
                    <td className="py-3.5 px-3 text-right">${grandTotalBasePay.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right">${grandTotalOtPay.toFixed(2)}</td>
                    <td className="py-3.5 px-3 text-right text-emerald-400 print:text-slate-900">${grandTotalSalary.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-800 print:border-slate-300 grid grid-cols-2 gap-12 text-xs">
              <div>
                <p className="font-semibold text-slate-300 print:text-slate-800">Prepared By (HR):</p>
                <div className="mt-8 border-b border-slate-700 print:border-slate-400 w-3/4"></div>
                <p className="text-[10px] text-slate-500 mt-1">Signature & Date</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300 print:text-slate-800">Approved By (Management):</p>
                <div className="mt-8 border-b border-slate-700 print:border-slate-400 w-3/4"></div>
                <p className="text-[10px] text-slate-500 mt-1">Signature & Date</p>
              </div>
            </div>

          </div>
        )}

      </div>

      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
