import React, { useState, useEffect } from 'react';
import {
  User,
  SchoolSettings,
  GradeStandard,
  Halaqoh,
  Santri,
  AttendanceRecord,
  JournalEntry,
  PrestasiRecord,
  GradeRecord,
  PurgeOptions,
} from './types';
import { storage } from './lib/storage';
import { initialSchoolSettings } from './data/initialData';
import { normalizeAllDataIds } from './lib/idUtils';
import { LoginModal } from './components/LoginModal';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { SpreadsheetTemplateModal } from './components/SpreadsheetTemplateModal';

// Views
import { DashboardView } from './views/DashboardView';
import { DataKelasView } from './views/DataKelasView';
import { DataSiswaView } from './views/DataSiswaView';
import { PresensiView } from './views/PresensiView';
import { JurnalMengajarView } from './views/JurnalMengajarView';
import { KartuPrestasiView } from './views/KartuPrestasiView';
import { NilaiSiswaView } from './views/NilaiSiswaView';
import { RekapCetakView } from './views/RekapCetakView';
import { RaporSantriView } from './views/RaporSantriView';
import { PengaturanView } from './views/PengaturanView';
import { KelolaAkunView } from './views/KelolaAkunView';
import { KelolaDatabaseView } from './views/KelolaDatabaseView';
import { syncDatabaseToSpreadsheet, fetchDataFromSpreadsheet } from './lib/spreadsheetService';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { fetchDatabaseFromSupabase, executeDualWriteSync, FullDatabasePayload } from './lib/supabaseService';

export default function App() {
  // State for logged in user - persisted across refreshes
  const [activeUser, setActiveUser] = useState<User | null>(() => storage.getActiveUser());

  // Core Data States
  const [settings, setSettings] = useState<SchoolSettings>(() => storage.getSettings());

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('aqu_theme') === 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('aqu_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('aqu_theme', 'light');
    }

    let cfg: any = settings?.themeConfig;
    if (!cfg) {
      try {
        const stored = localStorage.getItem('aqu_global_theme_config');
        if (stored) cfg = JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }
    cfg = cfg || initialSchoolSettings.themeConfig;

    if (cfg) {
      root.style.setProperty('--app-header-bg', cfg.headerBg || (isDarkMode ? '#0f172a' : '#ffffff'));
      root.style.setProperty('--app-header-text', cfg.headerText || (isDarkMode ? '#f8fafc' : '#0f172a'));
      root.style.setProperty('--app-sidebar-bg', cfg.sidebarBg || (isDarkMode ? '#020617' : '#0f172a'));
      root.style.setProperty('--app-sidebar-text', cfg.sidebarText || (isDarkMode ? '#e2e8f0' : '#cbd5e1'));
      root.style.setProperty('--app-content-bg', cfg.contentBg || (isDarkMode ? '#0b1329' : '#f8fafc'));
      root.style.setProperty('--app-content-text', cfg.contentText || (isDarkMode ? '#f8fafc' : '#0f172a'));
      root.style.setProperty('--app-primary-color', cfg.primaryColor || (isDarkMode ? '#10b981' : '#059669'));
      root.style.setProperty('--app-button-bg', cfg.buttonBg || cfg.primaryColor || (isDarkMode ? '#10b981' : '#059669'));
      root.style.setProperty('--app-button-text', cfg.buttonText || '#ffffff');
      root.style.setProperty('--app-btn-bg', cfg.buttonBg || cfg.primaryColor || (isDarkMode ? '#10b981' : '#059669'));
      root.style.setProperty('--app-btn-text', cfg.buttonText || '#ffffff');

      try {
        localStorage.setItem('aqu_global_theme_config', JSON.stringify(cfg));
      } catch (e) {
        // ignore
      }
    }
  }, [isDarkMode, settings?.themeConfig, activeUser]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Mobile sidebar open state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Database template modal state
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);

  // Core Data States
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [gradeStandards, setGradeStandards] = useState<GradeStandard[]>(() => storage.getGradeStandards());
  const [halaqohs, setHalaqohs] = useState<Halaqoh[]>(() => storage.getHalaqohs());
  const [santris, setSantris] = useState<Santri[]>(() => storage.getSantris());
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => storage.getAttendanceRecords());
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => storage.getJournalEntries());
  const [prestasiRecords, setPrestasiRecords] = useState<PrestasiRecord[]>(() => storage.getPrestasiRecords());
  const [grades, setGrades] = useState<GradeRecord[]>(() => storage.getGrades());

  // Automatically normalize messy/legacy timestamp IDs into neat sequential IDs on mount
  useEffect(() => {
    const normalized = normalizeAllDataIds({
      santris,
      halaqohs,
      users,
      attendanceRecords,
      journalEntries,
      prestasiRecords,
      grades,
      gradeStandards,
    });

    if (normalized.modified) {
      setSantris(normalized.santris);
      setHalaqohs(normalized.halaqohs);
      setUsers(normalized.users);
      setAttendanceRecords(normalized.attendanceRecords);
      setJournalEntries(normalized.journalEntries);
      setPrestasiRecords(normalized.prestasiRecords);
      setGrades(normalized.grades);
      setGradeStandards(normalized.gradeStandards);

      storage.saveSantris(normalized.santris);
      storage.saveHalaqohs(normalized.halaqohs);
      storage.saveUsers(normalized.users);
      storage.saveAttendanceRecords(normalized.attendanceRecords);
      storage.saveJournalEntries(normalized.journalEntries);
      storage.savePrestasiRecords(normalized.prestasiRecords);
      storage.saveGrades(normalized.grades);
      storage.saveGradeStandards(normalized.gradeStandards);
    }
  }, []);

  // Handler for full database/spreadsheet data import / pull
  const handleImportAllFromSpreadsheet = (
    data: {
      halaqohs?: Halaqoh[];
      santris?: Santri[];
      attendanceRecords?: AttendanceRecord[];
      journalEntries?: JournalEntry[];
      prestasiRecords?: PrestasiRecord[];
      grades?: GradeRecord[];
      gradeStandards?: GradeStandard[];
      users?: User[];
      settings?: SchoolSettings;
    },
    syncToSupabase: boolean = true
  ) => {
    if (data.halaqohs !== undefined) {
      setHalaqohs(data.halaqohs);
      storage.saveHalaqohs(data.halaqohs);
    }
    if (data.santris !== undefined) {
      setSantris(data.santris);
      storage.saveSantris(data.santris);
    }
    if (data.attendanceRecords !== undefined) {
      setAttendanceRecords(data.attendanceRecords);
      storage.saveAttendanceRecords(data.attendanceRecords);
    }
    if (data.journalEntries !== undefined) {
      setJournalEntries(data.journalEntries);
      storage.saveJournalEntries(data.journalEntries);
    }
    if (data.prestasiRecords !== undefined) {
      setPrestasiRecords(data.prestasiRecords);
      storage.savePrestasiRecords(data.prestasiRecords);
    }
    if (data.grades !== undefined) {
      setGrades(data.grades);
      storage.saveGrades(data.grades);
    }
    if (data.gradeStandards !== undefined) {
      setGradeStandards(data.gradeStandards);
      storage.saveGradeStandards(data.gradeStandards);
    }
    if (data.users !== undefined && data.users.length > 0) {
      setUsers(data.users);
      storage.saveUsers(data.users);
    }
    if (data.settings) {
      let storedTheme: any = undefined;
      try {
        const stored = localStorage.getItem('aqu_global_theme_config');
        if (stored) storedTheme = JSON.parse(stored);
      } catch (e) {
        // ignore
      }
      const effectiveTheme =
        data.settings.themeConfig ||
        settings?.themeConfig ||
        storedTheme ||
        initialSchoolSettings.themeConfig;

      if (effectiveTheme) {
        try {
          localStorage.setItem('aqu_global_theme_config', JSON.stringify(effectiveTheme));
        } catch (e) {
          // ignore
        }
      }

      const local = storage.getSettings();
      const remote = data.settings;

      const pick = (remoteVal?: string, localVal?: string, currentVal?: string) => {
        if (remoteVal && remoteVal.trim() !== '') return remoteVal.trim();
        if (localVal && localVal.trim() !== '') return localVal.trim();
        if (currentVal && currentVal.trim() !== '') return currentVal.trim();
        return '';
      };

      const mergedSettings: SchoolSettings = {
        logoUrl: pick(remote.logoUrl, local.logoUrl, settings?.logoUrl),
        foundationLogoUrl: pick(remote.foundationLogoUrl, local.foundationLogoUrl, settings?.foundationLogoUrl),
        kopUrl: pick(remote.kopUrl, local.kopUrl, settings?.kopUrl),
        foundation: pick(remote.foundation, local.foundation, settings?.foundation),
        schoolName: pick(remote.schoolName, local.schoolName, settings?.schoolName),
        accreditation: pick(remote.accreditation, local.accreditation, settings?.accreditation),
        address: pick(remote.address, local.address, settings?.address),
        city: pick(remote.city, local.city, settings?.city),
        paperSize: remote.paperSize || local.paperSize || settings?.paperSize || 'A4',
        paperOrientation: remote.paperOrientation || local.paperOrientation || settings?.paperOrientation || 'portrait',
        academicYear: pick(remote.academicYear, local.academicYear, settings?.academicYear),
        headmasterName: pick(remote.headmasterName, local.headmasterName, settings?.headmasterName),
        headmasterNip: pick(remote.headmasterNip, local.headmasterNip, settings?.headmasterNip),
        headmasterTitle: pick(remote.headmasterTitle, local.headmasterTitle, settings?.headmasterTitle),
        gradeMaxScale: remote.gradeMaxScale || local.gradeMaxScale || settings?.gradeMaxScale || 100,
        studentTerm: pick(remote.studentTerm, local.studentTerm, settings?.studentTerm) || 'Murid',
        parentSalutationTerm: pick(remote.parentSalutationTerm, local.parentSalutationTerm, settings?.parentSalutationTerm) || 'Bapak/Ibu',
        spreadsheetUrl: pick(remote.spreadsheetUrl, local.spreadsheetUrl, settings?.spreadsheetUrl),
        appsScriptUrl: pick(remote.appsScriptUrl, local.appsScriptUrl, settings?.appsScriptUrl),
        themeConfig: effectiveTheme,
      };

      setSettings(mergedSettings);
      storage.saveSettings(mergedSettings);
    }

    if (syncToSupabase && isSupabaseConfigured()) {
      executeDualWriteSync(data, data.settings?.spreadsheetUrl || settings?.spreadsheetUrl).catch((err) =>
        console.warn('Sync imported data to Supabase notice:', err)
      );
    }
  };

  // Dual-write sync helper function
  const syncState = (payloadOverride: Partial<FullDatabasePayload>) => {
    const fullPayload: FullDatabasePayload = {
      settings,
      halaqohs,
      santris,
      attendanceRecords,
      journalEntries,
      prestasiRecords,
      grades,
      gradeStandards,
      users,
      ...payloadOverride,
    };
    const gasUrl = fullPayload.settings?.spreadsheetUrl || localStorage.getItem('aqu_spreadsheet_url') || '';
    executeDualWriteSync(fullPayload, gasUrl).catch((err) =>
      console.warn('Dual write sync notice:', err)
    );
  };

  // Helper to check if fetched payload contains active records
  const isPayloadNotEmpty = (data?: FullDatabasePayload): boolean => {
    if (!data) return false;
    return Boolean(
      data.settings ||
      (data.halaqohs && data.halaqohs.length > 0) ||
      (data.santris && data.santris.length > 0) ||
      (data.attendanceRecords && data.attendanceRecords.length > 0) ||
      (data.journalEntries && data.journalEntries.length > 0) ||
      (data.prestasiRecords && data.prestasiRecords.length > 0) ||
      (data.grades && data.grades.length > 0) ||
      (data.users && data.users.length > 0)
    );
  };

  // Startup: Load primary data from Supabase if configured, falling back to GAS or local storage
  useEffect(() => {
    let isMounted = true;
    if (isSupabaseConfigured()) {
      fetchDatabaseFromSupabase()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data) {
            const isDbInitialized = localStorage.getItem('aqu_database_initialized');
            if (isPayloadNotEmpty(res.data)) {
              handleImportAllFromSpreadsheet(res.data, false);
              localStorage.setItem('aqu_database_initialized', 'true');
            } else if (!isDbInitialized) {
              // Supabase database is empty on fresh initial startup -> seed Supabase with default initial sample data
              syncState({});
              localStorage.setItem('aqu_database_initialized', 'true');
            }
          }
        })
        .catch((err) => console.error('Supabase startup fetch error:', err));
    } else {
      const url = settings?.spreadsheetUrl || localStorage.getItem('aqu_spreadsheet_url');
      if (url && url.includes('script.google.com/macros/s/')) {
        fetchDataFromSpreadsheet(url)
          .then((res) => {
            if (isMounted && res.success && res.data) {
              handleImportAllFromSpreadsheet(res.data);
            }
          })
          .catch((err) => console.log('Auto pull spreadsheet error:', err));
      }
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-sync from Supabase on window focus or tab visibility change
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const pullFromSupabaseQuietly = async () => {
      try {
        const res = await fetchDatabaseFromSupabase();
        if (res.success && res.data) {
          handleImportAllFromSpreadsheet(res.data, false);
        }
      } catch (err) {
        console.warn('Quiet Supabase sync warning:', err);
      }
    };

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        pullFromSupabaseQuietly();
      }
    };

    window.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('focus', handleFocusOrVisible);

    return () => {
      window.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('focus', handleFocusOrVisible);
    };
  }, []);

  // Save active user to storage on change
  useEffect(() => {
    storage.saveActiveUser(activeUser);
  }, [activeUser]);

  // Handle Login
  const handleLogin = (user: User) => {
    setActiveUser(user);
    setActiveTab('dashboard');
  };

  // Handle Logout
  const handleLogout = () => {
    setActiveUser(null);
  };

  // Data Handlers with Dual-Write Sync
  const handleSaveHalaqohItem = (h: Halaqoh) => {
    setHalaqohs((prev) => {
      const idx = prev.findIndex((item) => item.id === h.id);
      let updated: Halaqoh[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = h;
      } else {
        updated = [...prev, h];
      }
      storage.saveHalaqohs(updated);
      syncState({ halaqohs: updated });
      return updated;
    });
  };

  const handleDeleteHalaqohItem = (id: string) => {
    setHalaqohs((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      storage.saveHalaqohs(updated);
      syncState({ halaqohs: updated });
      return updated;
    });
  };

  const handleSaveSantriItem = (s: Santri) => {
    setSantris((prev) => {
      const idx = prev.findIndex((item) => item.id === s.id);
      let updated: Santri[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = s;
      } else {
        updated = [...prev, s];
      }
      storage.saveSantris(updated);
      syncState({ santris: updated });
      return updated;
    });
  };

  const handleDeleteSantriItem = (id: string) => {
    setSantris((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      storage.saveSantris(updated);
      syncState({ santris: updated });
      return updated;
    });
  };

  const handleImportSantris = (imported: Santri[]) => {
    setSantris((prev) => {
      const updated = [...prev, ...imported];
      storage.saveSantris(updated);
      syncState({ santris: updated });
      return updated;
    });
  };

  const handleSaveAttendance = (records: AttendanceRecord[]) => {
    setAttendanceRecords(records);
    storage.saveAttendanceRecords(records);
    syncState({ attendanceRecords: records });
  };

  const handleSaveJournalItem = (j: JournalEntry) => {
    setJournalEntries((prev) => {
      const idx = prev.findIndex((item) => item.id === j.id);
      let updated: JournalEntry[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = j;
      } else {
        updated = [...prev, j];
      }
      storage.saveJournalEntries(updated);
      syncState({ journalEntries: updated });
      return updated;
    });
  };

  const handleDeleteJournalItem = (id: string) => {
    setJournalEntries((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      storage.saveJournalEntries(updated);
      syncState({ journalEntries: updated });
      return updated;
    });
  };

  const handleSavePrestasiItem = (r: PrestasiRecord) => {
    setPrestasiRecords((prev) => {
      const idx = prev.findIndex((item) => item.id === r.id);
      let updated: PrestasiRecord[];
      if (idx >= 0) {
        updated = [...prev];
        updated[idx] = r;
      } else {
        updated = [...prev, r];
      }
      storage.savePrestasiRecords(updated);
      syncState({ prestasiRecords: updated });
      return updated;
    });
  };

  const handleDeletePrestasiItem = (id: string) => {
    setPrestasiRecords((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      storage.savePrestasiRecords(updated);
      syncState({ prestasiRecords: updated });
      return updated;
    });
  };

  const handleSaveGrades = (records: GradeRecord[]) => {
    setGrades(records);
    storage.saveGrades(records);
    syncState({ grades: records });
  };

  const handleSaveSettings = (updated: SchoolSettings) => {
    setSettings(updated);
    storage.saveSettings(updated);
    syncState({ settings: updated });
    if (updated?.themeConfig) {
      try {
        localStorage.setItem('aqu_global_theme_config', JSON.stringify(updated.themeConfig));
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSaveGradeStandards = (updated: GradeStandard[]) => {
    setGradeStandards(updated);
    storage.saveGradeStandards(updated);
    syncState({ gradeStandards: updated });
  };

  const handleSaveUsers = (updated: User[]) => {
    setUsers(updated);
    storage.saveUsers(updated);
    syncState({ users: updated });
  };

  const handleUpdateActiveUser = (updated: User) => {
    setActiveUser(updated);
  };

  const handlePurgeData = async (options: PurgeOptions) => {
    let newHalaqohs = halaqohs;
    let newSantris = santris;
    let newAttendance = attendanceRecords;
    let newJournals = journalEntries;
    let newPrestasi = prestasiRecords;
    let newGrades = grades;
    let newSettings = settings;

    if (options.classes) {
      newHalaqohs = [];
      setHalaqohs([]);
      storage.saveHalaqohs([]);
    }
    if (options.students) {
      newSantris = [];
      setSantris([]);
      storage.saveSantris([]);
    }
    if (options.attendance) {
      newAttendance = [];
      setAttendanceRecords([]);
      storage.saveAttendanceRecords([]);
    }
    if (options.journals) {
      newJournals = [];
      setJournalEntries([]);
      storage.saveJournalEntries([]);
    }
    if (options.prestasi) {
      newPrestasi = [];
      setPrestasiRecords([]);
      storage.savePrestasiRecords([]);
    }
    if (options.grades) {
      newGrades = [];
      setGrades([]);
      storage.saveGrades([]);
    }
    if (options.settings) {
      newSettings = {
        logoUrl: '',
        foundationLogoUrl: '',
        kopUrl: '',
        foundation: '',
        schoolName: '',
        accreditation: '',
        address: '',
        city: '',
        paperSize: 'A4',
        paperOrientation: 'portrait',
        academicYear: '',
        headmasterName: '',
        headmasterNip: '',
        headmasterTitle: '',
        gradeMaxScale: 100,
        studentTerm: 'Murid',
        parentSalutationTerm: 'Bapak/Ibu',
        themeConfig: settings?.themeConfig || initialSchoolSettings.themeConfig,
      };
      setSettings(newSettings);
      storage.saveSettings(newSettings);
    }

    localStorage.setItem('aqu_database_initialized', 'true');

    const fullPayload: FullDatabasePayload = {
      settings: newSettings,
      halaqohs: newHalaqohs,
      santris: newSantris,
      attendanceRecords: newAttendance,
      journalEntries: newJournals,
      prestasiRecords: newPrestasi,
      grades: newGrades,
      gradeStandards,
      users,
    };

    const gasUrl = newSettings?.spreadsheetUrl || localStorage.getItem('aqu_spreadsheet_url') || '';
    await executeDualWriteSync(fullPayload, gasUrl);
  };

  // If not logged in, show Login Screen (per user spec #0)
  if (!activeUser) {
    const loginBg = settings?.themeConfig?.sidebarBg || '#0f172a';
    const loginText = settings?.themeConfig?.sidebarText || '#f8fafc';
    const primaryGlow = settings?.themeConfig?.primaryColor || '#059669';

    return (
      <div
        className="min-h-screen flex flex-col justify-between transition-colors duration-300 relative overflow-hidden"
        style={{ backgroundColor: loginBg, color: loginText }}
      >
        {/* Dark eye-friendly ambient lighting tuned to selected theme */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${primaryGlow}, transparent 70%)`,
          }}
        />
        <div className="relative z-10 flex-1 flex flex-col justify-between">
          <LoginModal
            settings={settings}
            users={users}
            onLoginSuccess={handleLogin}
            onOpenDbModal={() => setIsDbModalOpen(true)}
          />
          <SpreadsheetTemplateModal
            isOpen={isDbModalOpen}
            onClose={() => setIsDbModalOpen(false)}
          />
        </div>
      </div>
    );
  }

  const isAdmin = activeUser.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Header */}
      <Header
        settings={settings}
        activeUser={activeUser}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6 gap-6">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab as ActiveTab}
          onSelectTab={(tab) => {
            if ((tab === 'kelola-database' || tab === 'pengaturan') && !isAdmin) {
              setActiveTab('dashboard');
            } else {
              setActiveTab(tab);
            }
            setIsMobileSidebarOpen(false);
          }}
          isAdmin={isAdmin}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          studentTerm={settings?.studentTerm || 'Murid'}
        />

        {/* Dynamic View Content */}
        <main
          className="flex-1 min-w-0 transition-colors duration-200 p-4 sm:p-6 lg:p-8"
          style={{
            backgroundColor: 'var(--app-content-bg)',
            color: 'var(--app-content-text)',
          }}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              activeUser={activeUser}
              settings={settings}
              halaqohs={halaqohs}
              santris={santris}
              users={users}
              onNavigate={(tab) => {
                if ((tab === 'kelola-database' || tab === 'pengaturan') && !isAdmin) {
                  setActiveTab('dashboard');
                } else {
                  setActiveTab(tab);
                }
              }}
            />
          )}

          {activeTab === 'data-kelas' && (
            <DataKelasView
              halaqohs={halaqohs}
              santris={santris}
              settings={settings}
              onSaveHalaqoh={handleSaveHalaqohItem}
              onDeleteHalaqoh={handleDeleteHalaqohItem}
            />
          )}

          {activeTab === 'data-siswa' && (
            <DataSiswaView
              santris={santris}
              halaqohs={halaqohs}
              settings={settings}
              onSaveSantri={handleSaveSantriItem}
              onDeleteSantri={handleDeleteSantriItem}
              onImportSantris={handleImportSantris}
            />
          )}

          {activeTab === 'presensi' && (
            <PresensiView
              attendanceRecords={attendanceRecords}
              halaqohs={halaqohs}
              santris={santris}
              settings={settings}
              onSaveAttendance={handleSaveAttendance}
            />
          )}

          {activeTab === 'jurnal' && (
            <JurnalMengajarView
              journals={journalEntries}
              halaqohs={halaqohs}
              activeUser={activeUser!}
              settings={settings}
              onSaveJournal={handleSaveJournalItem}
              onDeleteJournal={handleDeleteJournalItem}
            />
          )}

          {activeTab === 'kartu-prestasi' && (
            <KartuPrestasiView
              prestasiRecords={prestasiRecords}
              halaqohs={halaqohs}
              santris={santris}
              settings={settings}
              gradeStandards={gradeStandards}
              onSavePrestasi={handleSavePrestasiItem}
              onDeletePrestasi={handleDeletePrestasiItem}
            />
          )}

          {activeTab === 'nilai-siswa' && (
            <NilaiSiswaView
              grades={grades}
              halaqohs={halaqohs}
              santris={santris}
              settings={settings}
              gradeStandards={gradeStandards}
              onSaveGrades={handleSaveGrades}
            />
          )}

          {activeTab === 'rekap-cetak' && (
            <RekapCetakView
              halaqohs={halaqohs}
              santris={santris}
              attendanceRecords={attendanceRecords}
              prestasiRecords={prestasiRecords}
              grades={grades}
              journals={journalEntries}
              settings={settings}
              activeUser={activeUser}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {activeTab === 'rapor-santri' && (
            <RaporSantriView
              halaqohs={halaqohs}
              santris={santris}
              attendanceRecords={attendanceRecords}
              prestasiRecords={prestasiRecords}
              grades={grades}
              settings={settings}
              activeUser={activeUser}
              onSaveSettings={handleSaveSettings}
            />
          )}

          {activeTab === 'pengaturan' && isAdmin && (
            <PengaturanView
              settings={settings}
              gradeStandards={gradeStandards}
              activeUser={activeUser}
              isAdmin={isAdmin}
              onSaveSettings={handleSaveSettings}
              onSaveGradeStandards={handleSaveGradeStandards}
            />
          )}

          {activeTab === 'kelola-akun' && (
            <KelolaAkunView
              activeUser={activeUser}
              users={users}
              isAdmin={isAdmin}
              settings={settings}
              onUpdateActiveUser={handleUpdateActiveUser}
              onSaveUsers={handleSaveUsers}
            />
          )}

          {activeTab === 'kelola-database' && isAdmin && (
            <KelolaDatabaseView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onUpdateAllData={handleImportAllFromSpreadsheet}
              halaqohs={halaqohs}
              santris={santris}
              attendanceRecords={attendanceRecords}
              journalEntries={journalEntries}
              prestasiRecords={prestasiRecords}
              grades={grades}
              gradeStandards={gradeStandards}
              users={users}
              activeUser={activeUser}
              isAdmin={isAdmin}
              onPurgeData={handlePurgeData}
            />
          )}
        </main>
      </div>

      {/* Database Apps Script Template Modal */}
      <SpreadsheetTemplateModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
      />
    </div>
  );
}
