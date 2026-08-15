import React, { useState } from 'react';
import { SchoolSettings, User } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { User as UserIcon, LogIn, KeyRound, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  settings: SchoolSettings;
  users: User[];
  onLoginSuccess: (user: User) => void;
  onOpenDbModal?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  settings,
  users,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetUser = (users || []).find(
      (u) => (u?.username || '').trim().toLowerCase() === (username || '').trim().toLowerCase()
    );

    if (!targetUser) {
      setErrorMsg('Username tidak ditemukan!');
      return;
    }

    if (targetUser.password !== password) {
      setErrorMsg('Password salah! Silakan periksa kembali.');
      return;
    }

    onLoginSuccess(targetUser);
  };

  const displayTitle = settings?.schoolName && (settings.schoolName || '').trim() !== ''
    ? settings.schoolName
    : "SELAMAT DATANG!";

  const displaySubtitle = settings?.foundation && (settings.foundation || '').trim() !== ''
    ? settings.foundation
    : "di Aplikasi Administrasi Qur'an by AQU";

  const primaryColor = settings?.themeConfig?.primaryColor || '#059669';
  const buttonBg = settings?.themeConfig?.buttonBg || primaryColor;
  const buttonText = settings?.themeConfig?.buttonText || '#ffffff';
  const darkThemeBg = settings?.themeConfig?.sidebarBg || '#0f172a';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md transition-colors duration-300"
      style={{ backgroundColor: `${darkThemeBg}99` }}
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Branding */}
          <div className="bg-slate-50 p-6 text-center border-b border-slate-100 relative">
            <div className="flex justify-center mb-3">
              <SchoolLogo logoUrl={settings?.logoUrl} size="xl" className="shadow-xs border border-slate-200" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              {displayTitle}
            </h2>
            <p className="text-xs font-semibold mt-1" style={{ color: primaryColor }}>
              {displaySubtitle}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              style={{ backgroundColor: buttonBg, color: buttonText }}
              className="w-full py-3 hover:opacity-90 font-bold text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Aplikasi</span>
            </button>
          </form>

          <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 text-center text-xs text-slate-600 space-y-0.5">
            <div className="font-bold text-slate-700">AQU v1.5.2</div>
            <div className="text-[11px] text-slate-500">
              Dikembangkan oleh <span className="font-semibold text-slate-700">Rajes Peggy</span> dengan <span className="font-semibold text-slate-700">AI Studio</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
