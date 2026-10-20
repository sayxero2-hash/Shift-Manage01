import React, { useState } from 'react';
import { LogIn, Clock, ShieldCheck, UserCheck, UserPlus, KeyRound, ArrowLeft, Users, Building2 } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';

interface UserProfile {
  name: string;
  identifier: string; // Email or Phone
  role: 'admin' | 'manager' | 'employee';
  teamName: string;
}

export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('Engineering');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Teams List (Mock data or fetched from Supabase)
  const teams = ['Engineering', 'HR & Operations', 'Sales & Marketing', 'Customer Support'];

  // Handle Login Logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password) {
      // Mock User profile fetch based on login logic
      setCurrentUser({
        name: identifier.includes('@') ? identifier.split('@')[0] : 'Employee',
        identifier: identifier,
        role: identifier.includes('admin') ? 'admin' : 'employee',
        teamName: selectedTeam,
      });
    }
  };

  // Handle Sign Up Logic
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier && password && fullName) {
      alert('Sign Up Successful! Please log in.');
      setAuthMode('login');
    }
  };

  // Handle Password Reset Logic
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (identifier) {
      alert(`Password reset link/OTP sent to: ${identifier}`);
      setAuthMode('login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
      {!currentUser ? (
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
          {/* Header Icon */}
          <div className="flex flex-col items-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-full mb-3">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">ShiftMaster HR</h1>
            <p className="text-slate-400 text-sm">
              {authMode === 'login' && 'Sign in to access your team shift portal'}
              {authMode === 'signup' && 'Create an account for your organization'}
              {authMode === 'reset' && 'Reset your account password'}
            </p>
          </div>

          {/* 1. LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email or Phone Number</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white outline-none"
                  placeholder="name@company.com or 09xxxxxxxxx"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('reset')}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mt-6"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </button>

              <div className="text-center mt-4">
                <span className="text-slate-400 text-sm">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className="text-indigo-400 hover:underline text-sm font-medium"
                >
                  Sign Up
                </button>
              </div>
            </form>
          )}

          {/* 2. SIGN UP FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email or Phone Number</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white outline-none"
                  placeholder="name@company.com or 09xxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Assign Team</label>
                <select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white outline-none"
                >
                  {teams.map((team) => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mt-6"
              >
                <UserPlus className="w-5 h-5" />
                Create Account
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            </form>
          )}

          {/* 3. PASSWORD RESET FORM */}
          {authMode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Registered Email or Phone</label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 text-white outline-none"
                  placeholder="name@company.com or 09xxxxxxxxx"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mt-6"
              >
                <KeyRound className="w-5 h-5" />
                Send Reset Request
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-slate-400 hover:text-white text-sm flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* TEAM DASHBOARD (Login ဝင်ပြီးပါက သက်ဆိုင်ရာ Team Dashboard ပြသခြင်း) */
        <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-700">
          <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-xl mb-6 border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-indigo-400" />
              <div>
                <h3 className="font-bold text-white capitalize">{currentUser.name}</h3>
                <p className="text-xs text-indigo-300">{currentUser.identifier}</p>
              </div>
            </div>
            <span className="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-full uppercase font-bold">
              {currentUser.role}
            </span>
          </div>

          {/* Active Team Card */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 mb-6 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-400" />
            <div>
              <p className="text-xs text-slate-400">Assigned Team</p>
              <h4 className="text-lg font-bold text-white">{currentUser.teamName} Team</h4>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" /> Team Actions
            </h4>

            <button
              onClick={() => alert(`Checked-in to ${currentUser.teamName} Shift!`)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-lg"
            >
              <Clock className="w-6 h-6" />
              Check In ({currentUser.teamName})
            </button>
          </div>

          <button
            onClick={() => setCurrentUser(null)}
            className="mt-8 text-sm text-slate-400 hover:text-white underline w-full text-center block"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
