import React, { useState, useRef } from 'react';
import { getStudentTerm, getStudentTermLower } from '../lib/studentTerm';
import { generateCleanId } from '../lib/idUtils';
import { initialGradeStandards } from '../data/initialData';
import {
  PrestasiRecord,
  Halaqoh,
  Santri,
  PrestasiType,
  TahsinGrade,
  ZiyadahQuality,
  PrestasiStatus,
  SchoolSettings,
  GradeStandard,
} from '../types';
import {
  Award,
  Calendar,
  UserCheck,
  Send,
  History,
  Save,
  Trash2,
  Edit,
  X,
  BookOpen,
  Sparkles,
  CheckCircle,
  Clock,
  Phone,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Link as LinkIcon,
  AlertTriangle,
} from 'lucide-react';

interface KartuPrestasiViewProps {
  prestasiRecords: PrestasiRecord[];
  halaqohs: Halaqoh[];
  santris: Santri[];
  settings: SchoolSettings;
  gradeStandards?: GradeStandard[];
  onSavePrestasi: (record: PrestasiRecord) => void;
  onDeletePrestasi: (id: string) => void;
}

const SURAH_LIST = [
  'Al-Fatihah', 'Al-Baqarah', 'Ali \'Imran', 'An-Nisa\'', 'Al-Ma\'idah', 'Al-An\'am',
  'Al-A\'raf', 'Al-Anfal', 'At-Tawbah', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d', 'Ibrahim',
  'Al-Hijr', 'An-Nahl', 'Al-Isra\'', 'Al-Kahf', 'Maryam', 'Ta-Ha', 'Al-Anbiya\'',
  'Al-Hajj', 'Al-Mu\'minun', 'An-Nur', 'Al-Furqan', 'Ash-Shu\'ara\'', 'An-Naml',
  'Al-Qasas', 'Al-\'Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah', 'Al-Ahzab', 'Saba\'',
  'Fatir', 'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar', 'Ghafir', 'Fussilat', 'Ash-Shura',
  'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah', 'Al-Ahqaf', 'Muhammad', 'Al-Fath',
  'Al-Hujurat', 'Qaf', 'Adh-Dhariyat', 'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman',
  'Al-Waqi\'ah', 'Al-Hadid', 'Al-Mujadila', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff',
  'Al-Jumu\'ah', 'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk',
  'Al-Qalam', 'Al-Haqqah', 'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir',
  'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', 'An-Naba\'', 'An-Nazi\'at', '\'Abasa',
  'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj', 'At-Tariq',
  'Al-A\'la', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams', 'Al-Layl', 'Ad-Duha',
  'Ash-Sharh', 'At-Tin', 'Al-\'Alaq', 'Al-Qadr', 'Al-Bayyinah', 'Az-Zalzalah',
  'Al-\'Adiyat', 'Al-Qari\'ah', 'At-Takathur', 'Al-\'Asr', 'Al-Humazah', 'Al-Fil',
  'Quraysh', 'Al-Ma\'un', 'Al-Kawthar', 'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Al-Ikhlas',
  'Al-Falaq', 'An-Nas',
];

export const KartuPrestasiView: React.FC<KartuPrestasiViewProps> = ({
  prestasiRecords,
  halaqohs,
  santris,
  settings,
  gradeStandards,
  onSavePrestasi,
  onDeletePrestasi,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Resolve active standards to use from settings/props or initial data fallback
  const standardsToUse = (gradeStandards && gradeStandards.length > 0)
    ? gradeStandards
    : initialGradeStandards;

  const defaultTahsinGrade = (standardsToUse[0]?.letter || standardsToUse[0]?.predicate || 'A') as TahsinGrade;
  const defaultZiyadahQuality = (standardsToUse[0]?.predicate || standardsToUse[0]?.letter || 'Mumtaz (Sangat Baik Sekali)') as ZiyadahQuality;
  const defaultMurojaahQuality = (standardsToUse[0]?.predicate || standardsToUse[0]?.letter || 'Mumtaz (Sangat Baik Sekali)') as ZiyadahQuality;

  // Helper matcher to find best matching grade standard for legacy or custom values
  const matchStandardQuality = (val: string | undefined, fallback: string): string => {
    if (!val) return fallback;
    const exact = standardsToUse.find(s => s.letter === val || s.predicate === val);
    if (exact) return exact.predicate || exact.letter;
    const lower = val.toLowerCase().trim();
    const matched = standardsToUse.find(s =>
      s.predicate.toLowerCase().includes(lower) ||
      s.letter.toLowerCase() === lower ||
      lower.includes(s.predicate.toLowerCase().split(' ')[0])
    );
    if (matched) return matched.predicate || matched.letter;
    return val;
  };

  const matchStandardGrade = (val: string | undefined, fallback: string): string => {
    if (!val) return fallback;
    const exact = standardsToUse.find(s => s.letter === val || s.predicate === val);
    if (exact) return exact.letter || exact.predicate;
    const lower = val.toLowerCase().trim();
    const matched = standardsToUse.find(s =>
      s.letter.toLowerCase() === lower ||
      s.predicate.toLowerCase().includes(lower)
    );
    if (matched) return matched.letter || matched.predicate;
    return val;
  };

  // 6.1 Tanggal (kalender bulan)
  const [date, setDate] = useState<string>(todayStr);

  // 6.2 Dropdown halaqoh
  const [selectedHalaqohId, setSelectedHalaqohId] = useState<string>(halaqohs[0]?.id || '');
  const studentTerm = getStudentTerm(settings);
  const studentTermLower = getStudentTermLower(settings);

  // 6.3 Dropdown nama peserta (dependent on halaqoh)
  const [selectedSantriId, setSelectedSantriId] = useState<string>('');

  // 6.3.4 Active Tab for activity input
  const [activeActivityTab, setActiveActivityTab] = useState<PrestasiType>('tahsin');

  // Modal History State
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State for 6.3.4.1 Tahsin
  const [tahsinMaterial, setTahsinMaterial] = useState('');
  const [tahsinPageAyat, setTahsinPageAyat] = useState('');
  const [tahsinGrade, setTahsinGrade] = useState<TahsinGrade>(defaultTahsinGrade);
  const [tahsinStatus, setTahsinStatus] = useState<PrestasiStatus>('lanjut');
  const [tahsinNotes, setTahsinNotes] = useState('');

  // Form State for 6.3.4.2 Ziyadah
  const [ziyadahJuz, setZiyadahJuz] = useState<number>(30);
  const [ziyadahSurah, setZiyadahSurah] = useState('An-Naba\'');
  const [ziyadahAyat, setZiyadahAyat] = useState('');
  const [ziyadahQuality, setZiyadahQuality] = useState<ZiyadahQuality>(defaultZiyadahQuality);
  const [ziyadahStatus, setZiyadahStatus] = useState<PrestasiStatus>('lanjut');
  const [ziyadahNotes, setZiyadahNotes] = useState('');

  // Form State for 6.3.4.3 Murojaah
  const [murojaahMaterial, setMurojaahMaterial] = useState('');
  const [murojaahAyat, setMurojaahAyat] = useState('');
  const [murojaahQuality, setMurojaahQuality] = useState<ZiyadahQuality | TahsinGrade>(defaultMurojaahQuality);
  const [murojaahStatus, setMurojaahStatus] = useState<PrestasiStatus>('lanjut');
  const [murojaahNotes, setMurojaahNotes] = useState('');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const formSectionRef = useRef<HTMLDivElement>(null);

  // Helper to capitalize each word of quality text (e.g. "mumtaz" -> "Mumtaz", "jayyid jiddan" -> "Jayyid Jiddan")
  const formatQualityText = (str?: string) => {
    if (!str) return '-';
    return str
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Start Editing Existing Record
  const handleStartEdit = (record: PrestasiRecord) => {
    setEditingId(record.id);
    setDate(record.date);
    if (record.halaqohId) setSelectedHalaqohId(record.halaqohId);
    if (record.santriId) setSelectedSantriId(record.santriId);
    setActiveActivityTab(record.type);

    if (record.type === 'tahsin') {
      setTahsinMaterial(record.tahsinMaterial || '');
      setTahsinPageAyat(record.tahsinPageAyat || '');
      setTahsinGrade((record.tahsinGrade ? matchStandardGrade(record.tahsinGrade, defaultTahsinGrade) : defaultTahsinGrade) as TahsinGrade);
      setTahsinStatus(record.status || 'lanjut');
      setTahsinNotes(record.notes || '');
    } else if (record.type === 'ziyadah') {
      setZiyadahJuz(record.ziyadahJuz || 30);
      setZiyadahSurah(record.ziyadahSurah || 'An-Naba\'');
      setZiyadahAyat(record.ziyadahAyat || '');
      setZiyadahQuality((record.ziyadahQuality ? matchStandardQuality(record.ziyadahQuality, defaultZiyadahQuality) : defaultZiyadahQuality) as ZiyadahQuality);
      setZiyadahStatus(record.status || 'lanjut');
      setZiyadahNotes(record.notes || '');
    } else if (record.type === 'murojaah') {
      setMurojaahMaterial(record.murojaahMaterial || '');
      setMurojaahAyat(record.murojaahAyat || '');
      setMurojaahQuality((record.murojaahQuality ? matchStandardQuality(record.murojaahQuality as string, defaultMurojaahQuality) : defaultMurojaahQuality) as ZiyadahQuality);
      setMurojaahStatus(record.status || 'lanjut');
      setMurojaahNotes(record.notes || '');
    }

    setIsHistoryModalOpen(false);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTahsinMaterial('');
    setTahsinPageAyat('');
    setTahsinNotes('');
    setZiyadahAyat('');
    setZiyadahNotes('');
    setMurojaahMaterial('');
    setMurojaahAyat('');
    setMurojaahNotes('');
  };

  // Available santris for selected halaqoh
  const availableSantris = (santris || []).filter((s) => s.halaqohId === selectedHalaqohId && s.status === 'aktif');
  const selectedSantri = (santris || []).find((s) => s.id === selectedSantriId);
  const selectedHalaqoh = (halaqohs || []).find((h) => h.id === selectedHalaqohId);

  // Filter records for selected santri
  const santriRecords = (prestasiRecords || []).filter((r) => r.santriId === selectedSantriId);

  // 6.3.1 Summary of latest achievements per type
  const latestTahsin = santriRecords.filter((r) => r.type === 'tahsin').sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestZiyadah = santriRecords.filter((r) => r.type === 'ziyadah').sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestMurojaah = santriRecords.filter((r) => r.type === 'murojaah').sort((a, b) => b.date.localeCompare(a.date))[0];

  // WhatsApp Notification Modal State
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waMessageText, setWaMessageText] = useState('');
  const [waGroupLinkInput, setWaGroupLinkInput] = useState('');
  const [parentTermInput, setParentTermInput] = useState('');
  const [parentPhoneInput, setParentPhoneInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const getDefaultParentSalutation = () => {
    const parentSal = (settings?.parentSalutationTerm || '').trim() || 'Bapak/Ibu';
    const term = (settings?.studentTerm || '').trim() || 'Murid';
    return `${parentSal} Wali ${term} yang kami hormati,`;
  };

  const generateWaMessage = (salutation: string, groupLink: string) => {
    const sName = settings.schoolName || 'Nama Sekolah';
    const santriName = selectedSantri?.fullName || '-';
    const nis = selectedSantri?.nis || '-';
    const halaqohName = selectedHalaqoh?.name || '-';

    let msg = `Assalamu'alaikum warahmatullahi wabarakatuh.\n${salutation}\n\n`;
    msg += `Berikut kami sampaikan Ringkasan Laporan Capaian Prestasi Qur'an Ananda:\n`;
    msg += `Nama: *${santriName}* (NIS: ${nis})\n`;
    msg += `Kelas / Halaqoh: ${halaqohName}\n\n`;

    msg += `*1. CAPAIAN TAHSIN*\n`;
    msg += `• Tanggal Kegiatan: ${latestTahsin?.date || '-'}\n`;
    msg += `• Capaian / Materi: ${latestTahsin?.tahsinMaterial || '-'} (${latestTahsin?.tahsinPageAyat || '-'})\n`;
    msg += `• Hasil Nilai / Kualitas: ${latestTahsin?.tahsinGrade || '-'}\n`;
    msg += `• Status: ${latestTahsin?.status ? (latestTahsin.status === 'lanjut' ? 'Lanjut' : 'Ulang') : '-'}\n`;
    msg += `• Catatan: ${latestTahsin?.notes || '-'}\n\n`;

    msg += `*2. CAPAIAN ZIYADAH (Hafalan Baru)*\n`;
    msg += `• Tanggal Kegiatan: ${latestZiyadah?.date || '-'}\n`;
    msg += `• Capaian Ayat: Juz ${latestZiyadah?.ziyadahJuz || '-'} - ${latestZiyadah?.ziyadahSurah || '-'} (Ayat: ${latestZiyadah?.ziyadahAyat || 'Semua'})\n`;
    msg += `• Hasil Nilai / Kualitas: ${latestZiyadah?.ziyadahQuality ? latestZiyadah.ziyadahQuality.toUpperCase() : '-'}\n`;
    msg += `• Status: ${latestZiyadah?.status ? (latestZiyadah.status === 'lanjut' ? 'Lanjut' : 'Ulang') : '-'}\n`;
    msg += `• Catatan: ${latestZiyadah?.notes || '-'}\n\n`;

    msg += `*3. CAPAIAN MUROJAAH*\n`;
    msg += `• Tanggal Kegiatan: ${latestMurojaah?.date || '-'}\n`;
    msg += `• Capaian / Materi: ${latestMurojaah?.murojaahMaterial || '-'}${latestMurojaah?.murojaahAyat ? ` (Ayat: ${latestMurojaah.murojaahAyat})` : ''}\n`;
    msg += `• Hasil Nilai / Kualitas: ${latestMurojaah?.murojaahQuality ? latestMurojaah.murojaahQuality.toUpperCase() : '-'}\n`;
    msg += `• Status: ${latestMurojaah?.status ? (latestMurojaah.status === 'lanjut' ? 'Lanjut' : 'Ulang') : '-'}\n`;
    msg += `• Catatan: ${latestMurojaah?.notes || '-'}\n`;

    if ((groupLink || '').trim()) {
      msg += `\nLink Grup WhatsApp Halaqoh:\n${(groupLink || '').trim()}\n`;
    }

    msg += `\nBarakallahu fiikum.\n_${sName}_`;
    return msg;
  };

  const handleOpenWaModal = () => {
    if (!selectedSantri) return;
    const initialGroupLink = selectedHalaqoh?.waGroupLink || '';
    const initialParentSalutation = getDefaultParentSalutation();
    setWaGroupLinkInput(initialGroupLink);
    setParentTermInput(initialParentSalutation);
    setParentPhoneInput(selectedSantri.parentWa || '');

    const initialText = generateWaMessage(initialParentSalutation, initialGroupLink);
    setWaMessageText(initialText);
    setIsWaModalOpen(true);
  };

  const handleUpdateWaFields = (newSalutation: string, newGroupLink: string) => {
    setParentTermInput(newSalutation);
    setWaGroupLinkInput(newGroupLink);
    setWaMessageText(generateWaMessage(newSalutation, newGroupLink));
  };

  const handleCopyWaText = () => {
    navigator.clipboard.writeText(waMessageText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSendWaDirect = () => {
    if (!selectedSantri) return;
    const rawPhone = (parentPhoneInput || '').trim() || selectedSantri.parentWa || '';
    if (!rawPhone) {
      alert(`Peringatan: Nomor WhatsApp Orang Tua Ananda ${selectedSantri.fullName} belum terisi.\nSilakan ketik nomor WhatsApp terlebih dahulu atau lengkapi di menu Data Siswa.`);
      return;
    }
    const formattedPhone = rawPhone.replace(/\D/g, '').replace(/^0/, '62');
    const encodedMsg = encodeURIComponent(waMessageText);
    window.open(`https://wa.me/${formattedPhone}?text=${encodedMsg}`, '_blank');
  };

  // 6.3.5 Save Submit
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantriId || !selectedHalaqohId) {
      alert('Silakan pilih Kelas dan Nama Peserta terlebih dahulu!');
      return;
    }

    const recordId = editingId || generateCleanId('prs', prestasiRecords);

    let newRecord: PrestasiRecord = {
      id: recordId,
      date,
      halaqohId: selectedHalaqohId,
      santriId: selectedSantriId,
      type: activeActivityTab,
      status: 'lanjut',
    };

    if (activeActivityTab === 'tahsin') {
      newRecord = {
        ...newRecord,
        tahsinMaterial: (tahsinMaterial || '').trim(),
        tahsinPageAyat: (tahsinPageAyat || '').trim(),
        tahsinGrade,
        status: tahsinStatus,
        notes: (tahsinNotes || '').trim(),
      };
    } else if (activeActivityTab === 'ziyadah') {
      newRecord = {
        ...newRecord,
        ziyadahJuz,
        ziyadahSurah,
        ziyadahAyat: (ziyadahAyat || '').trim(),
        ziyadahQuality,
        status: ziyadahStatus,
        notes: (ziyadahNotes || '').trim(),
      };
    } else if (activeActivityTab === 'murojaah') {
      newRecord = {
        ...newRecord,
        murojaahMaterial: (murojaahMaterial || '').trim(),
        murojaahAyat: (murojaahAyat || '').trim(),
        murojaahQuality,
        status: murojaahStatus,
        notes: (murojaahNotes || '').trim(),
      };
    }

    onSavePrestasi(newRecord);

    const isEditMode = Boolean(editingId);
    setEditingId(null);

    // Reset form inputs immediately after save
    setTahsinMaterial('');
    setTahsinPageAyat('');
    setTahsinNotes('');
    setZiyadahAyat('');
    setZiyadahNotes('');
    setMurojaahMaterial('');
    setMurojaahAyat('');
    setMurojaahNotes('');

    const successTxt = `Berhasil ${isEditMode ? 'memperbarui' : 'menyimpan'} data setoran ${activeActivityTab.toUpperCase()}!`;
    setSaveSuccessMsg(successTxt);
    setTimeout(() => {
      setSaveSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kartu Prestasi {studentTerm}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input & evaluasi setoran Tahsin, Ziyadah (Hafalan Baru), dan Murojaah
            </p>
          </div>
        </div>
      </div>

      {/* Selectors Card (6.1, 6.2, 6.3) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        {/* 6.1 Tanggal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Tanggal Setoran:</span>
          </label>
          <input
            id="prestasi-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 6.2 Dropdown Halaqoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Pilih Kelas / Halaqoh:</span>
          </label>
          <select
            id="prestasi-halaqoh"
            value={selectedHalaqohId}
            onChange={(e) => {
              setSelectedHalaqohId(e.target.value);
              setSelectedSantriId('');
            }}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            {halaqohs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.level})
              </option>
            ))}
          </select>
        </div>

        {/* 6.3 Dropdown Nama Peserta (Harus pilih halaqoh dulu) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Pilih Nama {studentTerm}:</span>
          </label>
          <select
            id="prestasi-santri"
            value={selectedSantriId}
            onChange={(e) => setSelectedSantriId(e.target.value)}
            disabled={!selectedHalaqohId}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
          >
            <option value="">-- Pilih {studentTerm} --</option>
            {availableSantris.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} (NIS: {s.nis})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area when Santri Selected */}
      {selectedSantriId && selectedSantri ? (
        <div className="space-y-6">
          {/* 6.3.1 Summary Card & Action Buttons (6.3.2 & 6.3.3) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Data Ringkasan Pencapaian Terakhir
                </span>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-0.5">
                  <span>{selectedSantri.fullName}</span>
                  <span className="text-xs font-mono font-normal text-slate-500">
                    (NIS: {selectedSantri.nis})
                  </span>
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* 6.3.2 Tombol Kirim ke WA Ortu */}
                <button
                  id="btn-kirim-wa-ortu"
                  onClick={handleOpenWaModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 custom-theme-btn font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim ke WA Ortu</span>
                </button>

                {/* 6.3.3 Tombol Lihat Riwayat */}
                <button
                  id="btn-lihat-riwayat"
                  onClick={() => setIsHistoryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lihat Riwayat ({santriRecords.length})</span>
                </button>
              </div>
            </div>

            {/* 6.3.1.1 - 6.3.1.4 Three Component Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tahsin Summary */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Tahsin</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {latestTahsin?.date || 'Belum ada'}
                    </span>
                    {latestTahsin && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(latestTahsin)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors cursor-pointer"
                        title="Edit Capaian Tahsin Terakhir"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {latestTahsin?.tahsinMaterial || 'Belum setoran'}
                  </div>
                  <div className="text-xs text-slate-500">{latestTahsin?.tahsinPageAyat || '-'}</div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Nilai: <strong className="text-slate-800">{latestTahsin?.tahsinGrade || '-'}</strong></span>
                  <span className={`px-2 py-0.5 rounded font-bold capitalize ${latestTahsin?.status === 'lanjut' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {latestTahsin?.status || '-'}
                  </span>
                </div>
              </div>

              {/* Ziyadah Summary */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-700 uppercase">Ziyadah (Hafalan Baru)</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {latestZiyadah?.date || 'Belum ada'}
                    </span>
                    {latestZiyadah && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(latestZiyadah)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors cursor-pointer"
                        title="Edit Capaian Ziyadah Terakhir"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {latestZiyadah ? `Juz ${latestZiyadah.ziyadahJuz} - ${latestZiyadah.ziyadahSurah}` : 'Belum setoran'}
                  </div>
                  <div className="text-xs text-slate-500">Ayat: {latestZiyadah?.ziyadahAyat || 'Semua'}</div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Kualitas: <strong className="text-amber-800">{formatQualityText(latestZiyadah?.ziyadahQuality)}</strong></span>
                  <span className={`px-2 py-0.5 rounded font-bold capitalize ${latestZiyadah?.status === 'lanjut' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {latestZiyadah?.status || '-'}
                  </span>
                </div>
              </div>

              {/* Murojaah Summary */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 uppercase">Murojaah</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {latestMurojaah?.date || 'Belum ada'}
                    </span>
                    {latestMurojaah && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(latestMurojaah)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors cursor-pointer"
                        title="Edit Capaian Murojaah Terakhir"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {latestMurojaah?.murojaahMaterial || 'Belum setoran'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {latestMurojaah ? `Ayat: ${latestMurojaah.murojaahAyat || '-'}` : '-'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Kualitas: <strong className="text-blue-800">{formatQualityText(latestMurojaah?.murojaahQuality)}</strong></span>
                  <span className={`px-2 py-0.5 rounded font-bold capitalize ${latestMurojaah?.status === 'lanjut' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {latestMurojaah?.status || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 6.3.4 Form Input Activities (3 Activity Buttons: Tahsin, Ziyadah, Murojaah) */}
          <div ref={formSectionRef} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span>{editingId ? 'Edit Data Setoran' : 'Input Setoran Baru Hari Ini'}</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">{date}</span>
            </div>

            {/* Mode Edit Banner Alert */}
            {editingId && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    <strong>Mode Edit Aktif:</strong> Mengedit data setoran ({activeActivityTab.toUpperCase()}) tanggal {date}. Lakukan perubahan lalu klik tombol "Update Data Setoran".
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-white dark:bg-slate-800 border border-amber-300 text-slate-700 dark:text-slate-200 hover:bg-slate-50 font-bold rounded-lg shrink-0 cursor-pointer shadow-xs"
                >
                  Batal Edit
                </button>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveSuccessMsg(null)}
                  className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 6.3.4 Tab Buttons */}
            <div className="flex border-b border-slate-200 gap-2">
              {[
                { id: 'tahsin' as PrestasiType, label: '1. Tahsin' },
                { id: 'ziyadah' as PrestasiType, label: '2. Ziyadah (Hafalan Baru)' },
                { id: 'murojaah' as PrestasiType, label: '3. Murojaah' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveActivityTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
                    activeActivityTab === tab.id
                      ? 'custom-theme-btn shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              {/* 6.3.4.1 TAHSIN FORM */}
              {activeActivityTab === 'tahsin' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                  {/* 6.3.4.1.1 Materi (Surat/Jilid) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Materi Tahsin (Surat / Jilid) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tahsinMaterial}
                      onChange={(e) => setTahsinMaterial(e.target.value)}
                      placeholder="Contoh: Jilid Tilawati 5 / Al-Baqarah"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* 6.3.4.1.2 Halaman / Ayat */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Halaman / Ayat
                    </label>
                    <input
                      type="text"
                      value={tahsinPageAyat}
                      onChange={(e) => setTahsinPageAyat(e.target.value)}
                      placeholder="Contoh: Hal. 15 / Ayat 1-10"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 6.3.4.1.3 Nilai Apresiasi (dari Standar Nilai) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nilai Apresiasi
                    </label>
                    <select
                      value={tahsinGrade}
                      onChange={(e) => setTahsinGrade(e.target.value as TahsinGrade)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {standardsToUse.map((st) => {
                        const val = st.letter || st.predicate;
                        const label = st.letter && st.predicate ? `${st.letter} - ${st.predicate}` : (st.letter || st.predicate);
                        return (
                          <option key={st.id || val} value={val}>
                            {label}
                          </option>
                        );
                      })}
                      {tahsinGrade && !standardsToUse.some(st => st.letter === tahsinGrade || st.predicate === tahsinGrade) && (
                        <option value={tahsinGrade}>{tahsinGrade}</option>
                      )}
                    </select>
                  </div>

                  {/* 6.3.4.1.4 Status (Lanjut / Ulang) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Kelanjutan
                    </label>
                    <select
                      value={tahsinStatus}
                      onChange={(e) => setTahsinStatus(e.target.value as PrestasiStatus)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="lanjut">Lanjut Materi Berikutnya</option>
                      <option value="ulang">Ulang Kembali Materi Ini</option>
                    </select>
                  </div>

                  {/* 6.3.4.1.5 Catatan */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Pengajar
                    </label>
                    <textarea
                      rows={2}
                      value={tahsinNotes}
                      onChange={(e) => setTahsinNotes(e.target.value)}
                      placeholder="Catatan tajwid / makhorijul huruf..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 6.3.4.2 ZIYADAH FORM */}
              {activeActivityTab === 'ziyadah' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
                  {/* 6.3.4.2.1 Juz (30 down to 1) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilihan Juz (30 - 1)
                    </label>
                    <select
                      value={ziyadahJuz}
                      onChange={(e) => setZiyadahJuz(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {Array.from({ length: 30 }, (_, i) => 30 - i).map((j) => (
                        <option key={j} value={j}>Juz {j}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6.3.4.2.2 Dropdown / Type Surah */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Surat <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      list="surah-options"
                      value={ziyadahSurah}
                      onChange={(e) => setZiyadahSurah(e.target.value)}
                      placeholder="Pilih atau ketik surat..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                    <datalist id="surah-options">
                      {SURAH_LIST.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>

                  {/* 6.3.4.2.3 Ayat */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ayat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={ziyadahAyat}
                      onChange={(e) => setZiyadahAyat(e.target.value)}
                      placeholder="Contoh: 1 - 20"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 6.3.4.2.4 Kualitas setoran (dari Standar Nilai) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kualitas Setoran
                    </label>
                    <select
                      value={ziyadahQuality}
                      onChange={(e) => setZiyadahQuality(e.target.value as ZiyadahQuality)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {standardsToUse.map((st) => {
                        const val = st.predicate || st.letter;
                        const label = st.predicate && st.letter ? `${st.predicate} (${st.letter})` : (st.predicate || st.letter);
                        return (
                          <option key={st.id || val} value={val}>
                            {label}
                          </option>
                        );
                      })}
                      {ziyadahQuality && !standardsToUse.some(st =>
                        st.predicate === ziyadahQuality ||
                        st.letter === ziyadahQuality ||
                        st.predicate.toLowerCase() === ziyadahQuality.toLowerCase() ||
                        st.letter.toLowerCase() === ziyadahQuality.toLowerCase()
                      ) && (
                        <option value={ziyadahQuality}>{ziyadahQuality}</option>
                      )}
                    </select>
                  </div>

                  {/* 6.3.4.2.5 Status Lanjut atau Tidak */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Kelanjutan
                    </label>
                    <select
                      value={ziyadahStatus}
                      onChange={(e) => setZiyadahStatus(e.target.value as PrestasiStatus)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="lanjut">Lanjut Ayah/Surat Berikutnya</option>
                      <option value="ulang">Ulangi Setoran Ini</option>
                    </select>
                  </div>

                  {/* 6.3.4.2.6 Catatan */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Evaluasi Ziyadah
                    </label>
                    <textarea
                      rows={2}
                      value={ziyadahNotes}
                      onChange={(e) => setZiyadahNotes(e.target.value)}
                      placeholder="Catatan kelancaran & keaktifan hafalan..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 6.3.4.3 MUROJAAH FORM */}
              {activeActivityTab === 'murojaah' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Materi Murojaah <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={murojaahMaterial}
                      onChange={(e) => setMurojaahMaterial(e.target.value)}
                      placeholder="Contoh: Surah An-Naba s.d. Abasa"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Ayat (Opsional)
                    </label>
                    <input
                      type="text"
                      value={murojaahAyat}
                      onChange={(e) => setMurojaahAyat(e.target.value)}
                      placeholder="Contoh: 1 - 20"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kualitas Murojaah
                    </label>
                    <select
                      value={murojaahQuality}
                      onChange={(e) => setMurojaahQuality(e.target.value as ZiyadahQuality)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      {standardsToUse.map((st) => {
                        const val = st.predicate || st.letter;
                        const label = st.predicate && st.letter ? `${st.predicate} (${st.letter})` : (st.predicate || st.letter);
                        return (
                          <option key={st.id || val} value={val}>
                            {label}
                          </option>
                        );
                      })}
                      {murojaahQuality && !standardsToUse.some(st =>
                        st.predicate === murojaahQuality ||
                        st.letter === murojaahQuality ||
                        st.predicate.toLowerCase() === murojaahQuality.toLowerCase() ||
                        st.letter.toLowerCase() === murojaahQuality.toLowerCase()
                      ) && (
                        <option value={murojaahQuality}>{murojaahQuality}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Status Kelanjutan
                    </label>
                    <select
                      value={murojaahStatus}
                      onChange={(e) => setMurojaahStatus(e.target.value as PrestasiStatus)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="lanjut">Lanjut Murojaah Berikutnya</option>
                      <option value="ulang">Ulang Murojaah Ini</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Catatan Evaluasi Murojaah
                    </label>
                    <textarea
                      rows={2}
                      value={murojaahNotes}
                      onChange={(e) => setMurojaahNotes(e.target.value)}
                      placeholder="Catatan hafalan lama..."
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 6.3.5 Tombol Simpan / Update Tahsin / Ziyadah / Murojaah */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                  >
                    Batal Edit
                  </button>
                )}
                <button
                  id={`btn-simpan-${activeActivityTab}`}
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 custom-theme-btn font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {editingId ? 'Update Data' : 'Simpan'} {activeActivityTab === 'tahsin' ? 'Tahsin' : activeActivityTab === 'ziyadah' ? 'Ziyadah' : 'Murojaah'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Silakan pilih Nama Peserta di atas terlebih dahulu untuk menampilkan Kartu Prestasi.</p>
        </div>
      )}

      {/* 6.3.3 Modal History / Riwayat Setoran */}
      {isHistoryModalOpen && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <span>Riwayat Setoran - {selectedSantri.fullName}</span>
              </h3>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3">
              {santriRecords.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Belum ada riwayat setoran.</p>
              ) : (
                santriRecords.map((r) => (
                  <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          r.type === 'tahsin' ? 'bg-emerald-100 text-emerald-800' :
                          r.type === 'ziyadah' ? 'bg-amber-100 text-amber-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {r.type}
                        </span>
                        <span className="text-xs font-mono text-slate-500">{r.date}</span>
                        {r.type === 'tahsin' && r.tahsinGrade && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">
                            Nilai: {r.tahsinGrade}
                          </span>
                        )}
                        {r.type === 'ziyadah' && r.ziyadahQuality && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">
                            {formatQualityText(r.ziyadahQuality)}
                          </span>
                        )}
                        {r.type === 'murojaah' && r.murojaahQuality && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded font-bold">
                            {formatQualityText(r.murojaahQuality)}
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold capitalize ${r.status === 'lanjut' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                          {r.status}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {r.type === 'tahsin' && `${r.tahsinMaterial} (${r.tahsinPageAyat || '-'})`}
                        {r.type === 'ziyadah' && `Juz ${r.ziyadahJuz} - ${r.ziyadahSurah} (${r.ziyadahAyat || 'Semua'})`}
                        {r.type === 'murojaah' && `${r.murojaahMaterial}${r.murojaahAyat ? ` (Ayat: ${r.murojaahAyat})` : ''}`}
                      </div>
                      {r.notes && <p className="text-xs text-slate-500 italic">"{r.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleStartEdit(r)}
                        className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Data Setoran Ini"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm('Hapus catatan setoran ini?')) {
                            onDeletePrestasi(r.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Notification Modal */}
      {isWaModalOpen && selectedSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    Kirim Pesan Laporan WA Ortu
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Santri: {selectedSantri.fullName} ({selectedSantri.parentWa ? `No WA: ${selectedSantri.parentWa}` : 'No WA belum diisi'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWaModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Warning if Parent WA is missing */}
              {!(parentPhoneInput || '').trim() ? (
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Peringatan: Nomor WhatsApp Orang Tua Belum Diisi</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Nomor WhatsApp orang tua Ananda <strong>{selectedSantri.fullName}</strong> belum tersimpan di Data Siswa. Masukkan nomor WhatsApp orang tua di bawah ini agar pesan laporan dapat terkirim, dan lengkapi data siswa pada menu Data Siswa.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Terhubung ke WA Orang Tua Ananda <strong>{selectedSantri.fullName}</strong></span>
                  </span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                    {parentPhoneInput}
                  </span>
                </div>
              )}

              {/* Field: Nomor WA Orang Tua */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Nomor WhatsApp Orang Tua / Wali:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {selectedSantri.parentWa ? 'Otomatis dari Data Siswa' : 'Wajib diisi untuk kirim WA'}
                  </span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={parentPhoneInput}
                    onChange={(e) => setParentPhoneInput(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Field 1: Sebutan Wali Santri */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Sebutan / Sapaan Wali Santri:
                </label>
                <input
                  type="text"
                  value={parentTermInput}
                  onChange={(e) => handleUpdateWaFields(e.target.value, waGroupLinkInput)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Field 2: Link Grup WA Halaqoh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Link Grup WhatsApp Halaqoh:</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {selectedHalaqoh?.waGroupLink ? 'Tersimpan di data halaqoh' : 'Opsional'}
                  </span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="url"
                      value={waGroupLinkInput}
                      onChange={(e) => handleUpdateWaFields(parentTermInput, e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  {(waGroupLinkInput || '').trim() && (
                    <a
                      href={waGroupLinkInput}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                      title="Buka Link Grup WA"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tes Link</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Draf Teks Pesan */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Draf Teks Pesan (Dapat Diedit):
                  </label>
                  <button
                    onClick={() => {
                      const defSal = getDefaultParentSalutation();
                      handleUpdateWaFields(defSal, selectedHalaqoh?.waGroupLink || '');
                    }}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer font-medium"
                  >
                    Reset Template
                  </button>
                </div>
                <textarea
                  rows={10}
                  value={waMessageText}
                  onChange={(e) => setWaMessageText(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                />
              </div>

              {isCopied && (
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Teks laporan berhasil disalin ke clipboard!</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleCopyWaText}
                className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>

              <div className="flex items-center gap-2">
                {(waGroupLinkInput || '').trim() && (
                  <a
                    href={waGroupLinkInput}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2.5 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 text-emerald-800 dark:text-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Masuk Grup WA</span>
                  </a>
                )}

                <button
                  onClick={handleSendWaDirect}
                  className="px-4 py-2.5 custom-theme-btn font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim ke WA Ortu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
