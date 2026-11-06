import React from 'react';
import { SchoolSettings, User } from '../types';
import { SchoolLogo } from './SchoolLogo';
import { Menu, LogOut, User as UserIcon, Shield, Sparkles, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  settings: SchoolSettings;
  activeUser: User | null;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onOpenDbModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeUser,
  isDarkMode = false,
  onToggleDarkMode,
  onLogout,
  onToggleSidebar,
  onOpenDbModal,
}) => {
  return (
    <header
      id="app-header"
      style={{
        backgroundColor: 'var(--app-header-bg)',
        color: 'var(--app-header-text)',
      }}
      className="sticky top-0 z-40 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200"
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left section: Hamburger (mobile) + Logo & School Name */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-sidebar-toggle"
            onClick={onToggleSidebar}
            className="p-2 opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg lg:hidden transition-colors cursor-pointer"
            title="Buka Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <SchoolLogo logoUrl={settings?.logoUrl} size="md" className="shrink-0" />
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold truncate tracking-tight">
                  {settings?.schoolName || "Administrasi Qur'an by AQU"}
                </h1>
                <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  AQU
                </span>
              </div>
              <p className="text-xs opacity-70 truncate hidden sm:block">
                {settings?.foundation ? `${settings.foundation} • ` : ''}
                Th. Ajaran {settings?.academicYear || '2025/2026'}
              </p>
            </div>
          </div>
        </div>

        {/* Right section: Active user status & Logout */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Night Mode / Dark Mode Toggle Button */}
          {onToggleDarkMode && (
            <button
              id="btn-toggle-darkmode"
              onClick={onToggleDarkMode}
              className="p-2 opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-all cursor-pointer border border-transparent"
              title={isDarkMode ? "Mode Terang" : "Mode Malam"}
              aria-label="Mode Malam"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 hover:text-indigo-600" />
              )}
            </button>
          )}

          {activeUser ? (
            <>
              <div className="hidden sm:flex flex-col items-end text-right">
                <div className="flex items-center gap-1.5 font-semibold text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                  <span>{activeUser.name}</span>
                  {activeUser.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <UserIcon className="w-3 h-3" /> Guru
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">NIPK: {activeUser.nip || '-'}</span>
              </div>

              <button
                id="btn-header-logout"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xs:inline">Keluar</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-4 h-4" />
              <span>Sistem AQU</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
