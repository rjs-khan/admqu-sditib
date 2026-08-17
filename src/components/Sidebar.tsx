import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck2,
  BookOpenCheck,
  Award,
  GraduationCap,
  Printer,
  FileSpreadsheet,
  Settings,
  UserCog,
  Database,
  X,
  ChevronRight,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'data-kelas'
  | 'data-siswa'
  | 'presensi'
  | 'jurnal'
  | 'kartu-prestasi'
  | 'nilai-siswa'
  | 'rekap-cetak'
  | 'rapor-santri'
  | 'pengaturan'
  | 'kelola-akun'
  | 'kelola-database';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isAdmin: boolean;
  studentTerm?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  isAdmin,
  studentTerm = 'Murid',
}) => {
  const menuGroups = [
    {
      title: 'UTAMA',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'MASTER DATA',
      items: [
        { id: 'data-kelas' as ActiveTab, label: 'Data Kelas', icon: Building2 },
        { id: 'data-siswa' as ActiveTab, label: `Data ${studentTerm}`, icon: Users },
      ],
    },
    {
      title: 'KEGIATAN',
      items: [
        { id: 'presensi' as ActiveTab, label: 'Presensi', icon: CalendarCheck2 },
        { id: 'jurnal' as ActiveTab, label: 'Jurnal Mengajar', icon: BookOpenCheck },
      ],
    },
    {
      title: 'PRESTASI',
      items: [
        { id: 'kartu-prestasi' as ActiveTab, label: 'Kartu Prestasi', icon: Award },
        { id: 'nilai-siswa' as ActiveTab, label: `Nilai ${studentTerm}`, icon: GraduationCap },
      ],
    },
    {
      title: 'REKAP DAN CETAK',
      items: [
        { id: 'rekap-cetak' as ActiveTab, label: 'Rekap & Cetak', icon: Printer },
        { id: 'rapor-santri' as ActiveTab, label: `Rapor ${studentTerm}`, icon: FileSpreadsheet },
      ],
    },
    {
      title: 'LAINNYA',
      items: [
        ...(isAdmin ? [{ id: 'pengaturan' as ActiveTab, label: 'Pengaturan', icon: Settings }] : []),
        { id: 'kelola-akun' as ActiveTab, label: 'Kelola Akun', icon: UserCog },
        ...(isAdmin ? [{ id: 'kelola-database' as ActiveTab, label: 'Kelola Database', icon: Database }] : []),
      ],
    },
  ];

  const handleItemClick = (id: ActiveTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 top-16 bg-slate-950/70 backdrop-blur-xs z-30 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container: Pinned below Header (top-16) on desktop and mobile */}
      <aside
        id="app-sidebar"
        style={{
          backgroundColor: 'var(--app-sidebar-bg)',
          color: 'var(--app-sidebar-text)',
        }}
        className={`custom-theme-sidebar fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 border-r border-slate-800/50 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header for Mobile */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/50 lg:hidden">
          <span className="font-bold text-sm tracking-wider uppercase" style={{ color: 'var(--app-primary-color)' }}>
            Menu Administrasi
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <h2 className="px-3 text-[11px] font-bold tracking-widest uppercase opacity-60" style={{ color: 'var(--app-primary-color)' }}>
                {group.title}
              </h2>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-item-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium transition-all group cursor-pointer ${
                        isActive
                          ? 'sidebar-active font-semibold rounded-lg'
                          : 'opacity-80 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg'
                      }`}
                      style={isActive ? { color: 'var(--app-primary-color)' } : {}}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                          }`}
                          style={isActive ? { color: 'var(--app-primary-color)' } : {}}
                        />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--app-primary-color)' }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer info badge inside sidebar */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <span>AQU v1.5.4</span>
            <span className="text-emerald-500 font-medium">Online</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 leading-tight">
            Dikembangkan oleh Rajes Peggy dengan AI Studio
          </div>
        </div>
      </aside>
    </>
  );
};
