import React from 'react';
import { User, SchoolSettings, Halaqoh, Santri } from '../types';
import { ActiveTab } from '../components/Sidebar';
import {
  Users,
  Building2,
  UserCheck,
  CalendarCheck2,
  BookOpenCheck,
  Award,
  Settings,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

interface DashboardViewProps {
  activeUser: User;
  settings: SchoolSettings;
  users: User[];
  halaqohs: Halaqoh[];
  santris: Santri[];
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeUser,
  settings,
  users,
  halaqohs,
  santris,
  onNavigate,
}) => {
  const safeUsers = users || [];
  const safeHalaqohs = halaqohs || [];
  const safeSantris = santris || [];

  const teacherCount = safeUsers.filter((u) => u.role === 'guru' || u.role === 'admin').length;
  const classCount = safeHalaqohs.length;
  const studentCount = safeSantris.length;
  const activeStudentCount = safeSantris.filter((s) => s.status === 'aktif').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1.1 Papan Sambutan (Dash Welcome - Geometric Balance Banner) */}
      <section
        id="dash-welcome"
        className="rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-black/10 transition-all duration-300"
        style={{
          backgroundColor: 'var(--app-primary-color, #059669)',
          color: '#ffffff',
        }}
      >
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistem Administrasi Qur'an</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Selamat Datang, <span className="text-white/90 underline decoration-white/40">{activeUser.name}</span>!
          </h2>
          <p className="text-white/90 text-lg opacity-90 font-medium">
            Di Aplikasi Administrasi Qur'an by AQU
          </p>
          <p className="text-xs text-white/80 max-w-2xl pt-1">
            {settings?.schoolName ? `${settings.schoolName} • ` : ''} Kelola data halaqoh, presensi harian, jurnal mengajar, serta evaluasi kartu prestasi santri secara mudah dan akurat.
          </p>
        </div>
        {/* Geometric Balance Ambient Accents */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full pointer-events-none" />
        <div className="absolute right-20 top-4 w-12 h-12 border-4 border-white/20 rounded-lg rotate-12 pointer-events-none" />
      </section>

      {/* 1.2, 1.3, 1.4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* 1.2 Jumlah Pengajar */}
        <div className="glass-card p-6 rounded-xl flex items-center space-x-4 shadow-xs hover:border-emerald-300 transition-all">
          <div className="p-4 rounded-xl stat-icon shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Jumlah Pengajar</p>
            <p className="text-2xl font-bold text-slate-800">
              {teacherCount} <span className="text-xs font-normal text-slate-400 ml-1">Ustadz/ah</span>
            </p>
          </div>
        </div>

        {/* 1.3 Jumlah Kelas */}
        <div className="glass-card p-6 rounded-xl flex items-center space-x-4 shadow-xs hover:border-emerald-300 transition-all">
          <div className="p-4 rounded-xl stat-icon shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Jumlah Halaqoh</p>
            <p className="text-2xl font-bold text-slate-800">
              {classCount} <span className="text-xs font-normal text-slate-400 ml-1">Kelompok</span>
            </p>
          </div>
        </div>

        {/* 1.4 Jumlah Siswa */}
        <div className="glass-card p-6 rounded-xl flex items-center space-x-4 shadow-xs hover:border-emerald-300 transition-all">
          <div className="p-4 rounded-xl stat-icon shrink-0">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Jumlah Santri</p>
            <p className="text-2xl font-bold text-slate-800">
              {studentCount} <span className="text-xs font-normal text-slate-400 ml-1">Siswa</span>
            </p>
          </div>
        </div>
      </div>

      {/* 1.5 Akses Cepat (Pintasan Shortcuts) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">
          Akses Cepat (Pintasan)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1.5.1 Presensi */}
          <button
            id="shortcut-presensi"
            onClick={() => onNavigate('presensi')}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Presensi</span>
            <span className="text-[11px] text-slate-400 text-center mt-1">Kehadiran harian</span>
          </button>

          {/* 1.5.2 Jurnal Mengajar */}
          <button
            id="shortcut-jurnal"
            onClick={() => onNavigate('jurnal')}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BookOpenCheck className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Jurnal Mengajar</span>
            <span className="text-[11px] text-slate-400 text-center mt-1">Materi & KBM</span>
          </button>

          {/* 1.5.3 Kartu Prestasi */}
          <button
            id="shortcut-kartu-prestasi"
            onClick={() => onNavigate('kartu-prestasi')}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Kartu Prestasi</span>
            <span className="text-[11px] text-slate-400 text-center mt-1">Tahsin & Ziyadah</span>
          </button>

          {/* 1.5.4 Pengaturan (Khusus Admin) */}
          {activeUser.role === 'admin' && (
            <button
              id="shortcut-pengaturan"
              onClick={() => onNavigate('pengaturan')}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Pengaturan</span>
              <span className="text-[11px] text-slate-400 text-center mt-1">Konfigurasi Sekolah</span>
            </button>
          )}
        </div>
      </div>

      {/* Ringkasan Kelas & Halaqoh Quick Overview */}
      <div className="glass-card rounded-2xl p-6 space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <span>Daftar Halaqoh Terdaftar</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {safeHalaqohs.map((hlq) => {
            const memberCount = safeSantris.filter((s) => s.halaqohId === hlq.id).length;
            return (
              <div key={hlq.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 hover:border-emerald-300 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 capitalize">
                    {hlq.level}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{memberCount} Santri</span>
                </div>
                <h4 className="text-sm font-bold text-slate-800 truncate">{hlq.name}</h4>
                {hlq.waGroupLink && (
                  <a
                    href={hlq.waGroupLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[11px] text-emerald-600 font-medium hover:underline truncate"
                  >
                    Group WA Halaqoh
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
