import React, { useState, useEffect } from 'react';
import { generateCleanId } from '../lib/idUtils';
import {
  SchoolSettings,
  GradeStandard,
  User,
  PaperSize,
  PaperOrientation,
} from '../types';
import { SchoolLogo } from '../components/SchoolLogo';
import {
  Settings,
  Building,
  Upload,
  Save,
  UserCheck,
  GraduationCap,
  Plus,
  Trash2,
  CheckCheck,
  UserCheck2,
  Palette,
  Sparkles,
  Eye,
  RotateCcw,
  Check,
} from 'lucide-react';

interface PengaturanViewProps {
  settings: SchoolSettings;
  gradeStandards: GradeStandard[];
  activeUser: User;
  isAdmin: boolean;
  onSaveSettings: (settings: SchoolSettings) => void;
  onSaveGradeStandards: (standards: GradeStandard[]) => void;
}

const THEME_PRESETS = [
  {
    id: 'emerald',
    name: 'Hijau Islami (Default)',
    description: 'Zamrud sejuk nyaman & tenang di mata',
    badgeBg: '#059669',
    config: {
      headerBg: '#ffffff',
      headerText: '#0f172a',
      sidebarBg: '#0f172a',
      sidebarText: '#cbd5e1',
      contentBg: '#f8fafc',
      contentText: '#0f172a',
      primaryColor: '#059669',
      buttonBg: '#059669',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'blue',
    name: 'Biru Edukasi',
    description: 'Biru royal & navy elegan & fokus',
    badgeBg: '#2563eb',
    config: {
      headerBg: '#ffffff',
      headerText: '#0f172a',
      sidebarBg: '#1e293b',
      sidebarText: '#cbd5e1',
      contentBg: '#f1f5f9',
      contentText: '#0f172a',
      primaryColor: '#2563eb',
      buttonBg: '#2563eb',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'teal',
    name: 'Teal Modern',
    description: 'Toska lembut & menenangkan mata',
    badgeBg: '#0d9488',
    config: {
      headerBg: '#ffffff',
      headerText: '#0f172a',
      sidebarBg: '#0f292f',
      sidebarText: '#ccfbf1',
      contentBg: '#f0fdfa',
      contentText: '#0f172a',
      primaryColor: '#0d9488',
      buttonBg: '#0d9488',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'amber',
    name: 'Amber & Gold',
    description: 'Emas hangat & pasir gurun lembut',
    badgeBg: '#d97706',
    config: {
      headerBg: '#fffbe3',
      headerText: '#1c1917',
      sidebarBg: '#1c1917',
      sidebarText: '#fef3c7',
      contentBg: '#fffdf5',
      contentText: '#1c1917',
      primaryColor: '#d97706',
      buttonBg: '#d97706',
      buttonText: '#ffffff',
    },
  },
  {
    id: 'indigo',
    name: 'Indigo Luxury',
    description: 'Deep violet & navy mewah berkharisma',
    badgeBg: '#4f46e5',
    config: {
      headerBg: '#ffffff',
      headerText: '#0f172a',
      sidebarBg: '#1e1b4b',
      sidebarText: '#e0e7ff',
      contentBg: '#f5f3ff',
      contentText: '#0f172a',
      primaryColor: '#4f46e5',
      buttonBg: '#4f46e5',
      buttonText: '#ffffff',
    },
  },
];

export const PengaturanView: React.FC<PengaturanViewProps> = ({
  settings,
  gradeStandards,
  activeUser,
  isAdmin,
  onSaveSettings,
  onSaveGradeStandards,
}) => {
  // Local state for School Settings
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [foundationLogoUrl, setFoundationLogoUrl] = useState(settings.foundationLogoUrl || '');
  const [kopUrl, setKopUrl] = useState(settings.kopUrl || '');
  const [foundation, setFoundation] = useState(settings.foundation || '');
  const [schoolName, setSchoolName] = useState(settings.schoolName || '');
  const [accreditation, setAccreditation] = useState(settings.accreditation || '');
  const [address, setAddress] = useState(settings.address || '');
  const [city, setCity] = useState(settings.city || '');
  const [paperSize, setPaperSize] = useState<PaperSize>(settings.paperSize || 'A4');
  const [paperOrientation, setPaperOrientation] = useState<PaperOrientation>(
    settings.paperOrientation || 'portrait'
  );
  const [academicYear, setAcademicYear] = useState(settings.academicYear || '');

  // Sebutan Peserta Didik
  const standardTerms = ['Murid', 'Santri', 'Siswa', 'Peserta Didik'];
  const initialTerm = settings.studentTerm || 'Murid';
  const [studentTermOption, setStudentTermOption] = useState<string>(
    standardTerms.includes(initialTerm) ? initialTerm : 'Lainnya'
  );
  const [studentTermCustom, setStudentTermCustom] = useState<string>(
    standardTerms.includes(initialTerm) ? '' : initialTerm
  );

  // Sebutan Panggilan Orang Tua / Wali
  const standardSalutations = ['Bapak/Ibu', 'Ayah/Bunda', 'Abaa/Ummahat'];
  const initialSalutation = settings.parentSalutationTerm || 'Bapak/Ibu';
  const [parentSalutationOption, setParentSalutationOption] = useState<string>(
    standardSalutations.includes(initialSalutation) ? initialSalutation : 'Lainnya'
  );
  const [parentSalutationCustom, setParentSalutationCustom] = useState<string>(
    standardSalutations.includes(initialSalutation) ? '' : initialSalutation
  );

  // Signatory settings
  const [headmasterName, setHeadmasterName] = useState(settings.headmasterName || '');
  const [headmasterNip, setHeadmasterNip] = useState(settings.headmasterNip || '');
  const [headmasterTitle, setHeadmasterTitle] = useState(settings.headmasterTitle || '');
  const [gradeMaxScale, setGradeMaxScale] = useState<10 | 100>(settings.gradeMaxScale || 100);

  // Theme Config Local State
  const defaultCfg = settings.themeConfig || {
    preset: 'emerald',
    headerBg: '#ffffff',
    headerText: '#0f172a',
    sidebarBg: '#0f172a',
    sidebarText: '#cbd5e1',
    contentBg: '#f8fafc',
    contentText: '#0f172a',
    primaryColor: '#059669',
    buttonBg: '#059669',
    buttonText: '#ffffff',
  };

  const [preset, setPreset] = useState<string>(defaultCfg.preset || 'emerald');
  const [headerBg, setHeaderBg] = useState<string>(defaultCfg.headerBg || '#ffffff');
  const [headerText, setHeaderText] = useState<string>(defaultCfg.headerText || '#0f172a');
  const [sidebarBg, setSidebarBg] = useState<string>(defaultCfg.sidebarBg || '#0f172a');
  const [sidebarText, setSidebarText] = useState<string>(defaultCfg.sidebarText || '#cbd5e1');
  const [contentBg, setContentBg] = useState<string>(defaultCfg.contentBg || '#f8fafc');
  const [contentText, setContentText] = useState<string>(defaultCfg.contentText || '#0f172a');
  const [primaryColor, setPrimaryColor] = useState<string>(defaultCfg.primaryColor || '#059669');
  const [buttonBg, setButtonBg] = useState<string>(defaultCfg.buttonBg || '#059669');
  const [buttonText, setButtonText] = useState<string>(defaultCfg.buttonText || '#ffffff');

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logoUrl || '');
      setFoundationLogoUrl(settings.foundationLogoUrl || '');
      setKopUrl(settings.kopUrl || '');
      setFoundation(settings.foundation || '');
      setSchoolName(settings.schoolName || '');
      setAccreditation(settings.accreditation || '');
      setAddress(settings.address || '');
      setCity(settings.city || '');
      setPaperSize(settings.paperSize || 'A4');
      setPaperOrientation(settings.paperOrientation || 'portrait');
      setAcademicYear(settings.academicYear || '');

      const term = settings.studentTerm || 'Murid';
      if (standardTerms.includes(term)) {
        setStudentTermOption(term);
        setStudentTermCustom('');
      } else {
        setStudentTermOption('Lainnya');
        setStudentTermCustom(term);
      }

      const salutation = settings.parentSalutationTerm || 'Bapak/Ibu';
      if (standardSalutations.includes(salutation)) {
        setParentSalutationOption(salutation);
        setParentSalutationCustom('');
      } else {
        setParentSalutationOption('Lainnya');
        setParentSalutationCustom(salutation);
      }

      setHeadmasterName(settings.headmasterName || '');
      setHeadmasterNip(settings.headmasterNip || '');
      setHeadmasterTitle(settings.headmasterTitle || '');
      setGradeMaxScale(settings.gradeMaxScale || 100);

      const cfg = settings.themeConfig;
      if (cfg) {
        setPreset(cfg.preset || 'emerald');
        setHeaderBg(cfg.headerBg || '#ffffff');
        setHeaderText(cfg.headerText || '#0f172a');
        setSidebarBg(cfg.sidebarBg || '#0f172a');
        setSidebarText(cfg.sidebarText || '#cbd5e1');
        setContentBg(cfg.contentBg || '#f8fafc');
        setContentText(cfg.contentText || '#0f172a');
        setPrimaryColor(cfg.primaryColor || '#059669');
        setButtonBg(cfg.buttonBg || '#059669');
        setButtonText(cfg.buttonText || '#ffffff');
      }
    }
  }, [settings]);

  // Local state for Grade Standards
  const [standards, setStandards] = useState<GradeStandard[]>(gradeStandards);

  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Helper for compressing uploaded images to prevent exceeding localStorage / Supabase limits
  const compressImageFile = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality = 0.85
  ): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const src = evt.target?.result as string;
        if (!src) {
          resolve('');
          return;
        }
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(src);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const isPng = file.type === 'image/png';
          const mimeType = isPng ? 'image/png' : 'image/jpeg';
          const compressed = canvas.toDataURL(mimeType, quality);
          resolve(compressed);
        };
        img.onerror = () => resolve(src);
        img.src = src;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Build current settings helper object
  const buildCurrentSettings = (overrides?: {
    logoUrl?: string;
    foundationLogoUrl?: string;
    kopUrl?: string;
  }): SchoolSettings => {
    const effectiveStudentTerm =
      studentTermOption === 'Lainnya'
        ? (studentTermCustom || '').trim() || 'Murid'
        : studentTermOption;

    const effectiveParentSalutation =
      parentSalutationOption === 'Lainnya'
        ? (parentSalutationCustom || '').trim() || 'Bapak/Ibu'
        : parentSalutationOption;

    return {
      logoUrl: overrides?.logoUrl !== undefined ? overrides.logoUrl : (logoUrl || '').trim(),
      foundationLogoUrl: overrides?.foundationLogoUrl !== undefined ? overrides.foundationLogoUrl : (foundationLogoUrl || '').trim(),
      kopUrl: overrides?.kopUrl !== undefined ? overrides.kopUrl : (kopUrl || '').trim(),
      foundation: (foundation || '').trim(),
      schoolName: (schoolName || '').trim(),
      accreditation: (accreditation || '').trim(),
      address: (address || '').trim(),
      city: (city || '').trim(),
      paperSize,
      paperOrientation,
      academicYear: (academicYear || '').trim(),
      headmasterName: (headmasterName || '').trim(),
      headmasterNip: (headmasterNip || '').trim(),
      headmasterTitle: (headmasterTitle || '').trim(),
      gradeMaxScale,
      studentTerm: effectiveStudentTerm,
      parentSalutationTerm: effectiveParentSalutation,
      spreadsheetUrl: settings.spreadsheetUrl || '',
      appsScriptUrl: settings.appsScriptUrl || '',
      themeConfig: {
        preset,
        headerBg,
        headerText,
        sidebarBg,
        sidebarText,
        contentBg,
        contentText,
        primaryColor,
        buttonBg,
        buttonText,
      },
    };
  };

  // File Upload Handlers (Logo Sekolah, Logo Yayasan & KOP)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.8);
        if (compressed) {
          setLogoUrl(compressed);
          const updated = buildCurrentSettings({ logoUrl: compressed });
          onSaveSettings(updated);
          setIsSavedNotice(true);
          setTimeout(() => setIsSavedNotice(false), 3000);
        }
      } catch (err) {
        console.error('Error uploading logo:', err);
      } finally {
        setIsProcessingImage(false);
        e.target.value = '';
      }
    }
  };

  const handleFoundationLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.8);
        if (compressed) {
          setFoundationLogoUrl(compressed);
          const updated = buildCurrentSettings({ foundationLogoUrl: compressed });
          onSaveSettings(updated);
          setIsSavedNotice(true);
          setTimeout(() => setIsSavedNotice(false), 3000);
        }
      } catch (err) {
        console.error('Error uploading foundation logo:', err);
      } finally {
        setIsProcessingImage(false);
        e.target.value = '';
      }
    }
  };

  const handleKopUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      try {
        const compressed = await compressImageFile(file, 900, 300, 0.8);
        if (compressed) {
          setKopUrl(compressed);
          const updated = buildCurrentSettings({ kopUrl: compressed });
          onSaveSettings(updated);
          setIsSavedNotice(true);
          setTimeout(() => setIsSavedNotice(false), 3000);
        }
      } catch (err) {
        console.error('Error uploading KOP image:', err);
      } finally {
        setIsProcessingImage(false);
        e.target.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    const updated = buildCurrentSettings({ logoUrl: '' });
    onSaveSettings(updated);
  };

  const handleRemoveFoundationLogo = () => {
    setFoundationLogoUrl('');
    const updated = buildCurrentSettings({ foundationLogoUrl: '' });
    onSaveSettings(updated);
  };

  const handleRemoveKop = () => {
    setKopUrl('');
    const updated = buildCurrentSettings({ kopUrl: '' });
    onSaveSettings(updated);
  };

  // Preset Application
  const handleApplyPreset = (p: typeof THEME_PRESETS[0]) => {
    const newCfg = {
      preset: p.id,
      headerBg: p.config.headerBg,
      headerText: p.config.headerText,
      sidebarBg: p.config.sidebarBg,
      sidebarText: p.config.sidebarText,
      contentBg: p.config.contentBg,
      contentText: p.config.contentText,
      primaryColor: p.config.primaryColor,
      buttonBg: p.config.buttonBg,
      buttonText: p.config.buttonText,
    };

    setPreset(p.id);
    setHeaderBg(p.config.headerBg);
    setHeaderText(p.config.headerText);
    setSidebarBg(p.config.sidebarBg);
    setSidebarText(p.config.sidebarText);
    setContentBg(p.config.contentBg);
    setContentText(p.config.contentText);
    setPrimaryColor(p.config.primaryColor);
    setButtonBg(p.config.buttonBg);
    setButtonText(p.config.buttonText);

    onSaveSettings({
      ...settings,
      themeConfig: newCfg,
    });
  };

  const handleColorChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    setter(val);
    setPreset('custom');
  };

  const applyLogoThemeConfig = (cfg: {
    preset: string;
    headerBg: string;
    headerText: string;
    sidebarBg: string;
    sidebarText: string;
    contentBg: string;
    contentText: string;
    primaryColor: string;
    buttonBg: string;
    buttonText: string;
  }) => {
    setPreset(cfg.preset);
    setHeaderBg(cfg.headerBg);
    setHeaderText(cfg.headerText);
    setSidebarBg(cfg.sidebarBg);
    setSidebarText(cfg.sidebarText);
    setContentBg(cfg.contentBg);
    setContentText(cfg.contentText);
    setPrimaryColor(cfg.primaryColor);
    setButtonBg(cfg.buttonBg);
    setButtonText(cfg.buttonText);

    try {
      localStorage.setItem('aqu_global_theme_config', JSON.stringify(cfg));
    } catch (e) {
      // ignore
    }

    onSaveSettings({
      ...settings,
      themeConfig: cfg,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3500);
  };

  const handleAdaptToLogo = () => {
    const logoUrl = settings.logoUrl || settings.foundationLogoUrl || '';
    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width || 50;
          canvas.height = img.height || 50;
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const data = ctx?.getImageData(0, 0, canvas.width, canvas.height).data;
          if (data) {
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 16) {
              const alpha = data[i + 3];
              if (alpha > 128) {
                const pr = data[i];
                const pg = data[i + 1];
                const pb = data[i + 2];
                if ((pr < 240 || pg < 240 || pb < 240) && (pr > 15 || pg > 15 || pb > 15)) {
                  r += pr;
                  g += pg;
                  b += pb;
                  count++;
                }
              }
            }
            if (count > 0) {
              const avgR = Math.round(r / count);
              const avgG = Math.round(g / count);
              const avgB = Math.round(b / count);
              const hex = (x: number) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0');
              const primaryHex = `#${hex(avgR)}${hex(avgG)}${hex(avgB)}`;
              const darkR = Math.round(avgR * 0.22);
              const darkG = Math.round(avgG * 0.25);
              const darkB = Math.round(avgB * 0.32);
              const sidebarHex = `#${hex(darkR)}${hex(darkG)}${hex(darkB)}`;

              applyLogoThemeConfig({
                preset: 'logo-adapted',
                headerBg: '#ffffff',
                headerText: '#0f172a',
                sidebarBg: sidebarHex,
                sidebarText: '#f1f5f9',
                contentBg: '#f8fafc',
                contentText: '#0f172a',
                primaryColor: primaryHex,
                buttonBg: primaryHex,
                buttonText: '#ffffff',
              });
              return;
            }
          }
        } catch (e) {
          console.warn('Logo extraction fallback:', e);
        }
        applyFallbackLogoTheme();
      };
      img.onerror = () => applyFallbackLogoTheme();
      img.src = logoUrl;
    } else {
      applyFallbackLogoTheme();
    }
  };

  const applyFallbackLogoTheme = () => {
    applyLogoThemeConfig({
      preset: 'logo-adapted',
      headerBg: '#ffffff',
      headerText: '#0f172a',
      sidebarBg: '#062c24',
      sidebarText: '#d1fae5',
      contentBg: '#f0fdf4',
      contentText: '#064e3b',
      primaryColor: '#059669',
      buttonBg: '#059669',
      buttonText: '#ffffff',
    });
  };

  const handleSaveThemeOnly = () => {
    applyLogoThemeConfig({
      preset,
      headerBg,
      headerText,
      sidebarBg,
      sidebarText,
      contentBg,
      contentText,
      primaryColor,
      buttonBg,
      buttonText,
    });
  };

  // Grade Standard Table Editing
  const handleStandardChange = (
    id: string,
    field: keyof GradeStandard,
    value: string | number
  ) => {
    setStandards((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (field === 'minScore') {
            if (value === '') return { ...s, minScore: '' as any };
            const num = Number(value);
            return { ...s, minScore: isNaN(num) ? ('' as any) : num };
          }
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const handleAddStandardRow = () => {
    const newRow: GradeStandard = {
      id: generateCleanId('std', standards),
      letter: 'D',
      predicate: 'Kurang Sekali',
      description: 'Perlu bimbingan khusus.',
      minScore: 0,
    };
    setStandards((prev) => [...prev, newRow]);
  };

  const handleDeleteStandardRow = (id: string) => {
    setStandards((prev) => prev.filter((s) => s.id !== id));
  };

  // Tombol Simpan Pengaturan
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const effectiveStudentTerm =
      studentTermOption === 'Lainnya'
        ? (studentTermCustom || '').trim() || 'Murid'
        : studentTermOption;

    const effectiveParentSalutation =
      parentSalutationOption === 'Lainnya'
        ? (parentSalutationCustom || '').trim() || 'Bapak/Ibu'
        : parentSalutationOption;

    const updatedSettings: SchoolSettings = {
      logoUrl: (logoUrl || '').trim(),
      foundationLogoUrl: (foundationLogoUrl || '').trim(),
      kopUrl: (kopUrl || '').trim(),
      foundation: (foundation || '').trim(),
      schoolName: (schoolName || '').trim(),
      accreditation: (accreditation || '').trim(),
      address: (address || '').trim(),
      city: (city || '').trim(),
      paperSize,
      paperOrientation,
      academicYear: (academicYear || '').trim(),
      headmasterName: (headmasterName || '').trim(),
      headmasterNip: (headmasterNip || '').trim(),
      headmasterTitle: (headmasterTitle || '').trim(),
      gradeMaxScale,
      studentTerm: effectiveStudentTerm,
      parentSalutationTerm: effectiveParentSalutation,
      spreadsheetUrl: settings.spreadsheetUrl || '',
      appsScriptUrl: settings.appsScriptUrl || '',
      themeConfig: {
        preset,
        headerBg,
        headerText,
        sidebarBg,
        sidebarText,
        contentBg,
        contentText,
        primaryColor,
        buttonBg,
        buttonText,
      },
    };

    const cleanedStandards = standards.map((st) => ({
      ...st,
      minScore: typeof st.minScore === 'number' ? st.minScore : (st.minScore === '' ? 0 : Number(st.minScore) || 0),
    }));

    onSaveSettings(updatedSettings);
    onSaveGradeStandards(cleanedStandards);

    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Pengaturan Aplikasi & Sekolah</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin
                ? 'Atur KOP surat, logo, tema warna aplikasi, sebutan peserta didik, penanda tangan, dan standar nilai'
                : 'Atur sebutan peserta didik, ukuran kertas, dan preferensi laporan'}
            </p>
          </div>
        </div>

        <button
          id="btn-simpan-pengaturan"
          type="submit"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 custom-theme-btn font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Pengaturan</span>
        </button>
      </div>

      {isSavedNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Pengaturan berhasil diperbarui dan disimpan!</span>
        </div>
      )}

      {/* TEMA & WARNA KUSTOM APLIKASI (Hanya tampil untuk Role Admin) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Palette className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Tema & Warna Kustom Aplikasi</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ubah warna Header, Sidebar, Teks, Area Konten Kanan, dan Tombol sesuai selera & kenyamanan mata
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreset('custom')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all shrink-0"
              >
                <Palette className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>Aktifkan Mode Custom Sendiri</span>
              </button>

              <button
                type="button"
                onClick={handleAdaptToLogo}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl cursor-pointer transition-all shrink-0"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Harmoniskan Warna Dengan Logo</span>
              </button>
            </div>
          </div>

          {/* Kebijakan Tema Global (Requirement 4) */}
          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-100 space-y-1">
              <span className="font-bold block text-sm text-emerald-950 dark:text-emerald-50">
                Kebijakan Tema Global (Hak Akses Admin Sekolah)
              </span>
              <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed">
                Sesuai kebijakan sistem, konfigurasi tema warna yang disimpan oleh <b>Admin</b> di sini berlaku <b>secara global untuk seluruh pengguna sekolah</b>. Ketika akun lain (Guru, Wali Kelas, atau Staf) login ke aplikasi, maka tema warna yang nampak adalah tema yang telah diatur oleh Role Admin ini.
              </p>
            </div>
          </div>

          {/* Presets Theme Selection (Requirement 1) */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              1. Tersedia 5 Opsi Template Tema Warna Nyaman Dipandang Mata:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {THEME_PRESETS.map((p) => {
              const isSelected = preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block border border-black/10 shrink-0"
                        style={{ backgroundColor: p.badgeBg }}
                      />
                      {p.name}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {p.description}
                  </p>
                  <div className="flex items-center gap-1 pt-1">
                    <span
                      className="w-4 h-3 rounded-xs border border-slate-300 shrink-0"
                      style={{ backgroundColor: p.config.headerBg }}
                      title="Header"
                    />
                    <span
                      className="w-4 h-3 rounded-xs border border-slate-300 shrink-0"
                      style={{ backgroundColor: p.config.sidebarBg }}
                      title="Sidebar"
                    />
                    <span
                      className="w-4 h-3 rounded-xs border border-slate-300 shrink-0"
                      style={{ backgroundColor: p.config.contentBg }}
                      title="Konten"
                    />
                    <span
                      className="w-4 h-3 rounded-xs border border-slate-300 shrink-0"
                      style={{ backgroundColor: p.config.buttonBg }}
                      title="Tombol"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers & Hex Editors */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>2. Fitur Custom Tema Warna Sendiri (Pengaturan Detail Warna Elemen Tampilan)</span>
            </h4>
            {preset === 'custom' && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                Mode Kustom Aktif
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Header Background & Text */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Header Aplikasi
              </span>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block">Latar Header</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={headerBg}
                    onChange={(e) => handleColorChange(setHeaderBg, e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={headerBg}
                    onChange={(e) => handleColorChange(setHeaderBg, e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <label className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Tulisan Header</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={headerText}
                    onChange={(e) => handleColorChange(setHeaderText, e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={headerText}
                    onChange={(e) => handleColorChange(setHeaderText, e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Sidebar Background & Text */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Sidebar Menu
              </span>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block">Latar Sidebar</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sidebarBg}
                    onChange={(e) => handleColorChange(setSidebarBg, e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={sidebarBg}
                    onChange={(e) => handleColorChange(setSidebarBg, e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <label className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Tulisan Sidebar</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sidebarText}
                    onChange={(e) => handleColorChange(setSidebarText, e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={sidebarText}
                    onChange={(e) => handleColorChange(setSidebarText, e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Content Background & Text */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Area Konten Kanan
              </span>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block">Latar Konten</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={contentBg}
                    onChange={(e) => handleColorChange(setContentBg, e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={contentBg}
                    onChange={(e) => handleColorChange(setContentBg, e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <label className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Tulisan Konten</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={contentText}
                    onChange={(e) => handleColorChange(setContentText, e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={contentText}
                    onChange={(e) => handleColorChange(setContentText, e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Button Color & Accent */}
            <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
                Tombol & Akses Penanda
              </span>
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block">Warna Tombol</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={buttonBg}
                    onChange={(e) => {
                      handleColorChange(setButtonBg, e.target.value);
                      setPrimaryColor(e.target.value);
                    }}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={buttonBg}
                    onChange={(e) => {
                      handleColorChange(setButtonBg, e.target.value);
                      setPrimaryColor(e.target.value);
                    }}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                <label className="text-[11px] text-slate-500 dark:text-slate-400 block pt-1">Tulisan Tombol</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={buttonText}
                    onChange={(e) => handleColorChange(setButtonText, e.target.value)}
                    className="w-7 h-7 rounded border-0 cursor-pointer p-0 shrink-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => handleColorChange(setButtonText, e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Mini Widget */}
        <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Pratinjau Langsung Tampilan (Live Mini Preview)</span>
          </span>

          <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden text-xs shadow-xs">
            {/* Mini Header */}
            <div
              className="p-2 flex items-center justify-between border-b border-black/10 font-bold"
              style={{ backgroundColor: headerBg, color: headerText }}
            >
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500 shrink-0" />
                <span>{schoolName || 'Aplikasi AQU'}</span>
              </div>
              <span className="text-[10px] opacity-80">Th. 2025/2026</span>
            </div>

            {/* Mini Body Layout */}
            <div className="flex h-20">
              {/* Mini Sidebar */}
              <div
                className="w-24 p-2 space-y-1 font-medium border-r border-black/10 text-[10px]"
                style={{ backgroundColor: sidebarBg, color: sidebarText }}
              >
                <div className="p-1 rounded bg-black/10 font-bold">Dashboard</div>
                <div className="p-1 opacity-70">Data Siswa</div>
                <div className="p-1 opacity-70">Presensi</div>
              </div>

              {/* Mini Content Right Side */}
              <div
                className="flex-1 p-2 flex flex-col justify-between"
                style={{ backgroundColor: contentBg, color: contentText }}
              >
                <div>
                  <div className="font-bold">Ringkasan Data</div>
                  <div className="text-[10px] opacity-70">Sistem Administrasi Qur'an</div>
                </div>

                {/* Mini Button */}
                <div className="flex justify-end">
                  <span
                    className="px-2.5 py-1 rounded text-[10px] font-bold shadow-xs cursor-pointer"
                    style={{ backgroundColor: buttonBg, color: buttonText }}
                  >
                    Simpan Data
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Save Theme Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Semua perubahan tema akan langsung diterapkan secara global untuk seluruh akun.</span>
          </div>
          <button
            type="button"
            onClick={handleSaveThemeOnly}
            className="inline-flex items-center gap-2 px-4 py-2 custom-theme-btn text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Pengaturan Tema Sekarang</span>
          </button>
        </div>
      </div>
      )}

      {/* Identitas Sekolah untuk KOP */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Identitas Sekolah & Logo KOP Surat</span>
          </h3>
          {!isAdmin && (
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Khusus Pengelola Admin
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Logo Sekolah */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Logo Sekolah (Upload / URL Gambar)</span>
              {isProcessingImage && <span className="text-[10px] text-emerald-600 animate-pulse font-medium">Memproses gambar...</span>}
            </label>
            <div className="flex items-center gap-3">
              <SchoolLogo logoUrl={logoUrl} size="lg" className="shrink-0 border border-slate-200 dark:border-slate-700" />
              <div className="space-y-1 flex-1">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={!isAdmin || isProcessingImage}
                  placeholder="URL logo atau unggah file..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                />
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${isProcessingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isProcessingImage ? 'Memproses...' : 'Upload Logo Sekolah'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isProcessingImage}
                        className="hidden"
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={isProcessingImage}
                        className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo Yayasan */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Logo Yayasan (Opsional - Sisi Kiri Kop)
            </label>
            <div className="flex items-center gap-3">
              {foundationLogoUrl ? (
                <img
                  src={foundationLogoUrl}
                  alt="Logo Yayasan"
                  className="w-12 h-12 object-contain rounded-xl border border-slate-200 dark:border-slate-700 p-1 bg-white shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-[10px] font-bold text-center p-1 shrink-0">
                  Yayasan
                </div>
              )}
              <div className="space-y-1 flex-1">
                <input
                  type="text"
                  value={foundationLogoUrl}
                  onChange={(e) => setFoundationLogoUrl(e.target.value)}
                  disabled={!isAdmin || isProcessingImage}
                  placeholder="URL logo yayasan atau unggah file..."
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                />
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <label className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${isProcessingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isProcessingImage ? 'Memproses...' : 'Upload Logo Yayasan'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFoundationLogoUpload}
                        disabled={isProcessingImage}
                        className="hidden"
                      />
                    </label>
                    {foundationLogoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveFoundationLogo}
                        disabled={isProcessingImage}
                        className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KOP Surat Gambar Header */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              KOP Surat Header Gambar Penuh (Opsional - Menggantikan Teks Kop Kustom)
            </label>
            {kopUrl && (
              <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Preview KOP:</span>
                  <img
                    src={kopUrl}
                    alt="Preview KOP"
                    className="max-h-16 object-contain rounded bg-white p-1 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleRemoveKop}
                    disabled={isProcessingImage}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                  >
                    Hapus KOP
                  </button>
                )}
              </div>
            )}
            <div className="space-y-1">
              <input
                type="text"
                value={kopUrl}
                onChange={(e) => setKopUrl(e.target.value)}
                disabled={!isAdmin || isProcessingImage}
                placeholder="URL KOP gambar atau unggah file..."
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
              />
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <label className={`inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg cursor-pointer transition-colors ${isProcessingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isProcessingImage ? 'Memproses...' : 'Upload KOP Gambar'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleKopUpload}
                      disabled={isProcessingImage}
                      className="hidden"
                    />
                  </label>
                  {kopUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveKop}
                      disabled={isProcessingImage}
                      className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Naungan / Yayasan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Naungan / Yayasan
            </label>
            <input
              type="text"
              value={foundation}
              onChange={(e) => setFoundation(e.target.value)}
              disabled={!isAdmin}
              placeholder="Contoh: Yayasan Bina Insani Qur'ani"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Nama Sekolah */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Sekolah / Lembaga
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              disabled={!isAdmin}
              placeholder="Contoh: SMP IT & Mahad Tahfizh AQU"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Status / Akreditasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status / Akreditasi
            </label>
            <input
              type="text"
              value={accreditation}
              onChange={(e) => setAccreditation(e.target.value)}
              disabled={!isAdmin}
              placeholder="Contoh: Terakreditasi A"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Alamat Sekolah */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alamat Sekolah
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isAdmin}
              placeholder="Alamat lengkap sekolah"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Kota / Tempat */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Kota / Tempat Terbit
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!isAdmin}
              placeholder="Contoh: Bandung"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Sebutan Peserta Didik */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <UserCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Sebutan Peserta Didik (Default Aplikasi)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={studentTermOption}
                onChange={(e) => setStudentTermOption(e.target.value)}
                disabled={!isAdmin}
                className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 font-bold text-emerald-700 dark:text-emerald-400"
              >
                <option value="Murid">Murid (Default)</option>
                <option value="Santri">Santri</option>
                <option value="Siswa">Siswa</option>
                <option value="Peserta Didik">Peserta Didik</option>
                <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
              </select>

              {studentTermOption === 'Lainnya' && (
                <input
                  type="text"
                  value={studentTermCustom}
                  onChange={(e) => setStudentTermCustom(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Ketik sebutan kustom (mis: Mahasiswa)..."
                  className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 font-semibold"
                />
              )}
            </div>
          </div>

          {/* Sebutan Panggilan Orang Tua / Wali */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Sebutan Panggilan Orang Tua / Wali (Default Laporan WA)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={parentSalutationOption}
                onChange={(e) => setParentSalutationOption(e.target.value)}
                disabled={!isAdmin}
                className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 font-bold text-emerald-700 dark:text-emerald-400"
              >
                <option value="Bapak/Ibu">Bapak/Ibu (Default)</option>
                <option value="Ayah/Bunda">Ayah/Bunda</option>
                <option value="Abaa/Ummahat">Abaa/Ummahat</option>
                <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
              </select>

              {parentSalutationOption === 'Lainnya' && (
                <input
                  type="text"
                  value={parentSalutationCustom}
                  onChange={(e) => setParentSalutationCustom(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="Ketik sebutan kustom (mis: Ayahanda/Ibunda)..."
                  className="w-full sm:w-1/2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 font-semibold"
                />
              )}
            </div>
          </div>

          {/* Ukuran Kertas */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ukuran Kertas PDF & Cetak
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="F4">F4 / Folio (215 x 330 mm)</option>
              </select>

              <select
                value={paperOrientation}
                onChange={(e) => setPaperOrientation(e.target.value as PaperOrientation)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="portrait">Portrait (Tegak)</option>
                <option value="landscape">Landscape (Mendatar)</option>
              </select>
            </div>
          </div>

          {/* Tahun Ajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="Contoh: 2025/2026"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Standar Skala Penilaian */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Skala Penilaian Angka Nilai
            </label>
            <select
              value={gradeMaxScale}
              onChange={(e) => setGradeMaxScale(Number(e.target.value) as 10 | 100)}
              disabled={!isAdmin}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            >
              <option value={100}>Skala 0 - 100 (Default Standard)</option>
              <option value={10}>Skala 0 - 10 (Skala Puluhan)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Penanda Tangan */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Penanda Tangan Laporan & Rapor</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nama Guru & Jabatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Lengkap Guru + Jabatan (Otomatis Sesuai Akun Login)
            </label>
            <input
              type="text"
              value={`${activeUser.name} (${activeUser.title || 'Guru Qur\'an'})`}
              disabled
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold opacity-80 cursor-not-allowed"
            />
          </div>

          {/* NIP / NIPK Guru */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              NIP / NIPK Guru Logged In
            </label>
            <input
              type="text"
              value={activeUser.nip || '-'}
              disabled
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-mono opacity-80 cursor-not-allowed"
            />
          </div>

          {/* Nama Kepala Sekolah */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nama Kepala Sekolah (Diatur Admin)
            </label>
            <input
              type="text"
              value={headmasterName}
              onChange={(e) => setHeadmasterName(e.target.value)}
              disabled={!isAdmin}
              placeholder="Nama Kepala Sekolah beserta gelar"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* NIP / NIPK Kepala Sekolah */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              NIP / NIPK Kepala Sekolah
            </label>
            <input
              type="text"
              value={headmasterNip}
              onChange={(e) => setHeadmasterNip(e.target.value)}
              disabled={!isAdmin}
              placeholder="NIP Kepala Sekolah"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Sebutan Jabatan Kepala */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Sebutan Jabatan Kepala (untuk Default Laporan PDF)
            </label>
            <input
              type="text"
              value={headmasterTitle}
              onChange={(e) => setHeadmasterTitle(e.target.value)}
              disabled={!isAdmin}
              placeholder="Contoh: Kepala Sekolah / Mudir Mahad Tahfizh"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Standar Nilai & Predikat */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Standar Nilai & Predikat</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Acuan gabungan untuk menu penilaian (angka-predikat) & kartu prestasi
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleAddStandardRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-xl cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Baris</span>
            </button>
          )}
        </div>

        {/* Tabel Standar Nilai */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3 w-20">Huruf</th>
                <th className="px-4 py-3">Predikat</th>
                <th className="px-4 py-3">Keterangan</th>
                <th className="px-4 py-3 w-32">Nilai Minimal</th>
                {isAdmin && <th className="px-4 py-3 w-16 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {standards.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <input
                      type="text"
                      value={s.letter}
                      onChange={(e) => handleStandardChange(s.id, 'letter', e.target.value)}
                      disabled={!isAdmin}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-center text-emerald-800 dark:text-emerald-300 font-bold disabled:opacity-70"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.predicate}
                      onChange={(e) => handleStandardChange(s.id, 'predicate', e.target.value)}
                      disabled={!isAdmin}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-100 font-semibold disabled:opacity-70"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={s.description}
                      onChange={(e) => handleStandardChange(s.id, 'description', e.target.value)}
                      disabled={!isAdmin}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 disabled:opacity-70"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={s.minScore ?? ''}
                      onChange={(e) => handleStandardChange(s.id, 'minScore', e.target.value)}
                      disabled={!isAdmin}
                      className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-center font-bold text-emerald-700 dark:text-emerald-400 disabled:opacity-70"
                    />
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteStandardRow(s.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Hapus Baris"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
};
