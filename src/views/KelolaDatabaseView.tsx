import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  Link,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Sheet,
  ExternalLink,
  Sparkles,
  Zap,
  Info,
  ShieldCheck,
  DownloadCloud,
  UploadCloud,
  Server,
  Code2,
  X,
  AlertTriangle,
  Trash2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SchoolSettings, Halaqoh, Santri, AttendanceRecord, JournalEntry, PrestasiRecord, GradeRecord, GradeStandard, User, PurgeOptions } from '../types';
import { downloadDatabaseTemplateXlsx, downloadCurrentDatabaseXlsx, downloadCurrentDatabaseCsv, syncDatabaseToSpreadsheet, fetchDataFromSpreadsheet } from '../lib/spreadsheetService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { fetchDatabaseFromSupabase, saveDatabaseToSupabase } from '../lib/supabaseService';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSchemaText';
import { getStudentTerm } from '../lib/studentTerm';
import { ImportDataSection } from '../components/ImportDataSection';

interface KelolaDatabaseViewProps {
  settings: SchoolSettings;
  onSaveSettings: (settings: SchoolSettings) => void;
  onUpdateAllData?: (data: any) => void;
  halaqohs: Halaqoh[];
  santris: Santri[];
  attendanceRecords: AttendanceRecord[];
  journalEntries: JournalEntry[];
  prestasiRecords: PrestasiRecord[];
  grades: GradeRecord[];
  gradeStandards: GradeStandard[];
  users: User[];
  activeUser: User;
  isAdmin: boolean;
  onPurgeData: (options: PurgeOptions) => Promise<void> | void;
}

export const KelolaDatabaseView: React.FC<KelolaDatabaseViewProps> = ({
  settings,
  onSaveSettings,
  onUpdateAllData,
  halaqohs,
  santris,
  attendanceRecords,
  journalEntries,
  prestasiRecords,
  grades,
  gradeStandards,
  users,
  activeUser,
  isAdmin,
  onPurgeData,
}) => {
  const term = getStudentTerm(settings);

  // Reset & Hapus Data State
  const [purgeOptions, setPurgeOptions] = useState<PurgeOptions>({
    classes: false,
    students: false,
    attendance: false,
    journals: false,
    prestasi: false,
    grades: false,
    settings: false,
  });
  const [purgeMsg, setPurgeMsg] = useState<string>('');
  const [isPurging, setIsPurging] = useState<boolean>(false);

  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeStep, setPurgeStep] = useState<1 | 2>(1);
  const [purgePasswordInput, setPurgePasswordInput] = useState('');
  const [showPurgePasswordInput, setShowPurgePasswordInput] = useState(false);
  const [purgePasswordError, setPurgePasswordError] = useState('');

  const handlePurgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasSelection = Object.values(purgeOptions).some(Boolean);
    if (!hasSelection) {
      alert('Pilih setidaknya satu jenis data yang ingin dihapus!');
      return;
    }

    setPurgeStep(1);
    setPurgePasswordInput('');
    setShowPurgePasswordInput(false);
    setPurgePasswordError('');
    setIsPurgeModalOpen(true);
  };

  const handleConfirmPurgeWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPurgePasswordError('');

    if (!purgePasswordInput) {
      setPurgePasswordError('Silakan masukkan kata sandi Anda!');
      return;
    }

    if (purgePasswordInput !== activeUser.password) {
      setPurgePasswordError('Kata sandi yang Anda masukkan salah!');
      return;
    }

    setIsPurging(true);
    try {
      await onPurgeData(purgeOptions);
      setIsPurgeModalOpen(false);
      setPurgeMsg('Data yang dipilih berhasil dihapus dari sistem & database cloud (Supabase)!');
      setTimeout(() => setPurgeMsg(''), 5000);
      setPurgeOptions({
        classes: false,
        students: false,
        attendance: false,
        journals: false,
        prestasi: false,
        grades: false,
        settings: false,
      });
    } catch (err: any) {
      setPurgePasswordError('Gagal menghapus data: ' + (err?.message || String(err)));
    } finally {
      setIsPurging(false);
    }
  };
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>(() => {
    const val = settings.spreadsheetUrl || localStorage.getItem('aqu_spreadsheet_url') || '';
    if (val.includes('sample') || val.includes('example') || val.includes('dummy')) return '';
    return val;
  });

  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const val = settings.appsScriptUrl || localStorage.getItem('aqu_apps_script_url') || '';
    if (val.includes('sample') || val.includes('example') || val.includes('dummy')) return '';
    return val;
  });

  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('aqu_auto_sync_spreadsheet') !== 'false';
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info' | null; message: string }>({
    type: null,
    message: '',
  });

  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    return localStorage.getItem('aqu_last_sync_time');
  });

  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<string>('1. Data_Kelas');

  const sheetsData = [
    {
      name: '1. Data_Kelas',
      desc: 'Tabel informasi halaqoh / kelas bimbingan',
      headers: ['id', 'nama_kelas', 'tingkat', 'nama_pengampu', 'nipk', 'link_grup_wa', 'tanggal_dibuat'],
      rows: [
        ['kls-0001', 'Halaqoh Al-Fatihah', 'Tahfizh', 'Ustadz Abdullah, S.Pd.I', '19850101 201001 1 001', 'https://chat.whatsapp.com/sample1', '2025-01-01'],
        ['kls-0002', 'Halaqoh An-Nur', 'Lanjut', 'Ustadz Ahmad Fauzi', '19880202 201201 1 002', 'https://chat.whatsapp.com/sample2', '2025-01-01'],
      ],
    },
    {
      name: '2. Data_Santri',
      desc: 'Tabel data murid / santri terdaftar',
      headers: ['id', 'id_kelas', 'nama_lengkap', 'nis', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'status', 'tanggal_masuk', 'nama_ayah', 'nama_ibu', 'pekerjaan_ayah', 'pekerjaan_ibu', 'no_wa_ortu'],
      rows: [
        ['str-0001', 'kls-0001', 'Ahmad Zaki Al-Farisi', '2025001', 'L', 'Bandung', '2012-05-10', 'aktif', '2025-01-10', 'Bapak Zaki', 'Ibu Zaki', 'Wiraswasta', 'Ibu Rumah Tangga', '081234567890'],
        ['str-0002', 'kls-0001', 'Fatimah Az-Zahra', '2025002', 'P', 'Jakarta', '2012-08-15', 'aktif', '2025-01-10', 'Bapak Ahmad', 'Ibu Ahmad', 'PNS', 'Guru', '081987654321'],
      ],
    },
    {
      name: '3. Data_Presensi',
      desc: 'Tabel riwayat kehadiran harian',
      headers: ['id', 'tanggal', 'id_kelas', 'id_santri', 'status_kehadiran', 'catatan'],
      rows: [
        ['att-0001', '2025-02-01', 'kls-0001', 'str-0001', 'H', 'Hadir tepat waktu'],
        ['att-0002', '2025-02-01', 'kls-0001', 'str-0002', 'I', 'Izin acara keluarga'],
      ],
    },
    {
      name: '4. Data_Jurnal',
      desc: 'Tabel catatan materi & jurnal mengajar ustadz/ustadzah',
      headers: ['id', 'tanggal', 'id_kelas', 'materi_pelajaran', 'catatan_dan_evaluasi', 'nama_pengajar'],
      rows: [
        ['jrn-0001', '2025-02-01', 'kls-0001', "Tajwid Mad Thabi'i", 'Santri antusias', 'Ustadz Abdullah, M.Ag.'],
      ],
    },
    {
      name: '5. Data_Prestasi',
      desc: 'Tabel mutabaah hafalan (Tahsin, Ziyadah, Murojaah)',
      headers: ['id', 'tanggal', 'id_kelas', 'id_santri', 'jenis_setoran', 'catatan', 'status', 'materi_tahsin', 'halaman_ayat_tahsin', 'nilai_tahsin', 'juz_ziyadah', 'surah_ziyadah', 'ayat_ziyadah', 'kualitas_ziyadah', 'materi_murojaah', 'ayat_murojaah', 'kualitas_murojaah'],
      rows: [
        ['prs-0001', '2025-02-01', 'kls-0001', 'str-0001', 'tahsin', 'Bagus', 'lulus', 'Jilid 4 Hal 12', 'Hal 12', 'Mumtaz (Lancar)', '', '', '', '', '', '', ''],
        ['prs-0002', '2025-02-01', 'kls-0001', 'str-0001', 'ziyadah', 'Lancar tanpa keliru', 'lulus', '', '', '', '30', 'An-Naba', '1-20', 'Jayyid (Lancar)', '', '', ''],
      ],
    },
    {
      name: '6. Data_Nilai',
      desc: 'Tabel rekapitulasi penilaian berkala (PTS/PAS)',
      headers: ['id', 'tanggal', 'id_kelas', 'id_santri', 'nilai', 'jenis_ujian', 'bidang_studi', 'metode_kitab'],
      rows: [
        ['grd-0001', '2025-02-15', 'kls-0001', 'str-0001', '95', 'PTS', 'Tahsin', "Al-Qur'an"],
        ['grd-0002', '2025-02-15', 'kls-0001', 'str-0002', '88', 'PTS', 'Tahsin', "Al-Qur'an"],
      ],
    },
    {
      name: '7. Data_Pengaturan',
      desc: 'Tabel identitas & konfigurasi sekolah',
      headers: ['id', 'url_logo', 'url_logo_yayasan', 'url_kop', 'yayasan', 'nama_sekolah', 'akreditasi', 'alamat', 'kota', 'ukuran_kertas', 'orientasi_kertas', 'tahun_ajaran', 'nama_kepala_sekolah', 'nip_kepala_sekolah', 'jabatan_kepala_sekolah', 'skala_maksimal_nilai', 'istilah_murid', 'sapaan_ortu', 'url_spreadsheet'],
      rows: [
        ['default', '/assets/logo.png', '', '', "Yayasan Bina Insani Qur'ani", 'SMP IT & Mahad Tahfizh AQU', 'Terakreditasi A', 'Jl. Pendidikan No. 123', 'Bandung', 'A4', 'portrait', '2025/2026', 'Dr. H. Muhammad Ridwan, M.A.', '19780512 200312 1 002', 'Kepala Sekolah', '100', 'Murid', 'Bapak/Ibu', ''],
      ],
    },
    {
      name: '8. Data_Standar_Nilai',
      desc: 'Tabel skala huruf & predikat nilai',
      headers: ['id', 'huruf', 'predikat', 'keterangan', 'nilai_minimal'],
      rows: [
        ['std-0001', 'A+', 'Mumtaz', 'Sangat Baik Sekali / Perfect', '90'],
        ['std-0002', 'A', 'Jayyid Jiddan', 'Baik Sekali / Sangat Lancar', '80'],
        ['std-0003', 'B+', 'Jayyid', 'Baik / Lancar', '70'],
        ['std-0004', 'B', 'Maqbul', 'Cukup / Perlu Pengulangan', '60'],
        ['std-0005', 'C', 'Rasib', 'Kurang / Mengulang', '0'],
      ],
    },
    {
      name: '9. Data_Pengguna',
      desc: 'Tabel akun pengajar & administrator',
      headers: ['id', 'nama_pengguna', 'nip', 'jabatan', 'peran', 'username', 'password'],
      rows: [
        ['u-admin', 'Ustadz Abdullah, M.Ag.', '19850101 201001 1 001', 'Kepala Pengajar Tahfizh', 'admin', 'admin', 'admin123'],
        ['usr-0001', 'Ustadzah Siti Aminah, S.Pd.I', '19900315 201502 2 003', 'Guru Tahsin', 'guru', 'guru', 'guru123'],
      ],
    },
  ];

  const appScriptCode = `// KODE GOOGLE APPS SCRIPT DATABASE SINKRONISASI DUA ARAH
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    function readSheet(sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return [];
      var data = sheet.getDataRange().getValues();
      if (data.length < 2) return [];
      var headers = data[0];
      var rows = [];
      for (var i = 1; i < data.length; i++) {
        var row = {};
        for (var j = 0; j < headers.length; j++) {
          row[headers[j]] = data[i][j];
        }
        rows.push(row);
      }
      return rows;
    }

    var result = {
      status: 'success',
      data: {
        halaqohs: readSheet('1. Data_Kelas'),
        santris: readSheet('2. Data_Santri'),
        attendanceRecords: readSheet('3. Data_Presensi'),
        journalEntries: readSheet('4. Data_Jurnal'),
        prestasiRecords: readSheet('5. Data_Prestasi'),
        grades: readSheet('6. Data_Nilai'),
        settings: readSheet('7. Data_Pengaturan'),
        gradeStandards: readSheet('8. Data_Standar_Nilai'),
        users: readSheet('9. Data_Pengguna')
      }
    };

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var rawText = "";
    if (e && e.postData && e.postData.contents) {
      rawText = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      rawText = e.parameter.data;
    }

    var contents = {};
    if (rawText) {
      try {
        contents = JSON.parse(rawText);
      } catch (pErr) {
        try {
          contents = JSON.parse(decodeURIComponent(rawText));
        } catch(e2) {
          contents = {};
        }
      }
    }

    var data = (contents && contents.data) ? contents.data : contents;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    function sanitizeVal(val) {
      if (val === undefined || val === null) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    }

    function writeToSheet(sheetName, headers, rawRows) {
      if (!rawRows || !Array.isArray(rawRows)) return;
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) { sheet = ss.insertSheet(sheetName); }
      sheet.clearContents();
      sheet.appendRow(headers);
      if (rawRows.length > 0) {
        var cleanRows = rawRows.map(function(row) {
          return row.map(function(cell) {
            return sanitizeVal(cell);
          });
        });
        sheet.getRange(2, 1, cleanRows.length, headers.length).setValues(cleanRows);
      }
    }

    if (data.halaqohs) {
      writeToSheet('1. Data_Kelas', ['id', 'nama_kelas', 'tingkat', 'nama_pengampu', 'nipk', 'link_grup_wa', 'tanggal_dibuat'],
        data.halaqohs.map(function(k) { return [k.id, k.name || k.nama_kelas || '', k.level || k.tingkat || '', k.teacherName || k.nama_pengampu || '', k.teacherNip || k.nipk || '', k.waGroupLink || k.link_grup_wa || '', k.createdAt || k.tanggal_dibuat || '']; }));
    }
    if (data.santris) {
      writeToSheet('2. Data_Santri', ['id', 'id_kelas', 'nama_lengkap', 'nis', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'status', 'tanggal_masuk', 'nama_ayah', 'nama_ibu', 'pekerjaan_ayah', 'pekerjaan_ibu', 'no_wa_ortu'],
        data.santris.map(function(s) { return [s.id, s.halaqohId || s.id_kelas || '', s.fullName || s.nama_lengkap || '', s.nis || '', s.gender || s.jenis_kelamin || 'L', s.birthPlace || s.tempat_lahir || '', s.birthDate || s.tanggal_lahir || '', s.status || 'aktif', s.entryDate || s.tanggal_masuk || s.enrolledAt || '', s.fatherName || s.nama_ayah || '', s.motherName || s.nama_ibu || '', s.fatherJob || s.pekerjaan_ayah || '', s.motherJob || s.pekerjaan_ibu || '', s.parentWa || s.no_wa_ortu || '']; }));
    }
    if (data.attendanceRecords) {
      writeToSheet('3. Data_Presensi', ['id', 'tanggal', 'id_kelas', 'id_santri', 'status_kehadiran', 'catatan'],
        data.attendanceRecords.map(function(a) { return [a.id, a.date || a.tanggal || '', a.halaqohId || a.id_kelas || '', a.santriId || a.id_santri || '', a.status || a.status_kehadiran || 'H', a.notes || a.catatan || a.note || '']; }));
    }
    if (data.journalEntries) {
      writeToSheet('4. Data_Jurnal', ['id', 'tanggal', 'id_kelas', 'materi_pelajaran', 'catatan_dan_evaluasi', 'nama_pengajar'],
        data.journalEntries.map(function(j) { return [j.id, j.date || j.tanggal || '', j.halaqohId || j.id_kelas || '', j.material || j.materi_pelajaran || j.materi || '', j.notesAndEvaluation || j.catatan_dan_evaluasi || j.notes || '', j.teacherName || j.nama_pengajar || '']; }));
    }
    if (data.prestasiRecords) {
      writeToSheet('5. Data_Prestasi', ['id', 'tanggal', 'id_kelas', 'id_santri', 'jenis_setoran', 'catatan', 'status', 'materi_tahsin', 'halaman_ayat_tahsin', 'nilai_tahsin', 'juz_ziyadah', 'surah_ziyadah', 'ayat_ziyadah', 'kualitas_ziyadah', 'materi_murojaah', 'ayat_murojaah', 'kualitas_murojaah'],
        data.prestasiRecords.map(function(p) { return [p.id, p.date || p.tanggal || '', p.halaqohId || p.id_kelas || '', p.santriId || p.id_santri || '', p.type || p.jenis_setoran || 'tahsin', p.notes || p.catatan || '', p.status || 'lulus', p.tahsinMaterial || p.materi_tahsin || '', p.tahsinPageAyat || p.halaman_ayat_tahsin || '', p.tahsinGrade || p.nilai_tahsin || '', p.ziyadahJuz !== undefined ? p.ziyadahJuz : (p.juz_ziyadah !== undefined ? p.juz_ziyadah : ''), p.ziyadahSurah || p.surah_ziyadah || '', p.ziyadahAyat || p.ayat_ziyadah || '', p.ziyadahQuality || p.kualitas_ziyadah || '', p.murojaahMaterial || p.materi_murojaah || '', p.murojaahAyat || p.ayat_murojaah || '', p.murojaahQuality || p.kualitas_murojaah || '']; }));
    }
    if (data.grades) {
      writeToSheet('6. Data_Nilai', ['id', 'tanggal', 'id_kelas', 'id_santri', 'nilai', 'jenis_ujian', 'bidang_studi', 'metode_kitab'],
        data.grades.map(function(g) { return [g.id, g.date || g.tanggal || '', g.halaqohId || g.id_kelas || '', g.santriId || g.id_santri || '', g.score !== undefined ? g.score : (g.nilai !== undefined ? g.nilai : 0), g.assessmentType || g.jenis_ujian || 'PTS', g.subjectArea || g.bidang_studi || 'Tahfizh', g.methodKitab || g.metode_kitab || "Al-Qur'an"]; }));
    }
    if (data.settings) {
      var cfg = data.settings;
      writeToSheet('7. Data_Pengaturan', ['id', 'url_logo', 'url_logo_yayasan', 'url_kop', 'yayasan', 'nama_sekolah', 'akreditasi', 'alamat', 'kota', 'ukuran_kertas', 'orientasi_kertas', 'tahun_ajaran', 'nama_kepala_sekolah', 'nip_kepala_sekolah', 'jabatan_kepala_sekolah', 'skala_maksimal_nilai', 'istilah_murid', 'sapaan_ortu', 'url_spreadsheet'],
        [['default', cfg.logoUrl || cfg.url_logo || '', cfg.foundationLogoUrl || cfg.url_logo_yayasan || '', cfg.kopUrl || cfg.url_kop || '', cfg.foundation || cfg.yayasan || '', cfg.schoolName || cfg.nama_sekolah || '', cfg.accreditation || cfg.akreditasi || '', cfg.address || cfg.alamat || '', cfg.city || cfg.kota || '', cfg.paperSize || cfg.ukuran_kertas || 'A4', cfg.paperOrientation || cfg.orientasi_kertas || 'portrait', cfg.academicYear || cfg.tahun_ajaran || '', cfg.headmasterName || cfg.nama_kepala_sekolah || '', cfg.headmasterNip || cfg.nip_kepala_sekolah || '', cfg.headmasterTitle || cfg.jabatan_kepala_sekolah || '', cfg.gradeMaxScale || cfg.skala_maksimal_nilai || 100, cfg.studentTerm || cfg.istilah_murid || 'Murid', cfg.parentSalutationTerm || cfg.sapaan_ortu || 'Bapak/Ibu', cfg.spreadsheetUrl || cfg.url_spreadsheet || '']]);
    }
    if (data.gradeStandards) {
      writeToSheet('8. Data_Standar_Nilai', ['id', 'huruf', 'predikat', 'keterangan', 'nilai_minimal'],
        data.gradeStandards.map(function(st) { return [st.id, st.letter || st.huruf || '', st.predicate || st.predikat || '', st.description || st.keterangan || '', st.minScore !== undefined ? st.minScore : (st.nilai_minimal !== undefined ? st.nilai_minimal : 0)]; }));
    }
    if (data.users) {
      writeToSheet('9. Data_Pengguna', ['id', 'nama_pengguna', 'nip', 'jabatan', 'peran', 'username', 'password'],
        data.users.map(function(u) { return [u.id, u.name || u.nama_pengguna || '', u.nip || '', u.title || u.jabatan || '', u.role || u.peran || 'guru', u.username || '', u.password || '']; }));
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Database tersinkronisasi' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleSaveUrl = () => {
    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    const trimmedSheet = (spreadsheetUrl || '').trim();
    const trimmedScript = (appsScriptUrl || '').trim();

    let finalSheetUrl = trimmedSheet;
    let finalScriptUrl = trimmedScript;
    if (trimmedSheet.includes('script.google.com') && !finalScriptUrl) {
      finalScriptUrl = trimmedSheet;
    }

    localStorage.setItem('aqu_spreadsheet_url', finalSheetUrl);
    localStorage.setItem('aqu_apps_script_url', finalScriptUrl);

    const updatedSettings = {
      ...settings,
      spreadsheetUrl: finalSheetUrl,
      appsScriptUrl: finalScriptUrl,
    };
    onSaveSettings(updatedSettings);

    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncTime(nowStr);
    localStorage.setItem('aqu_last_sync_time', nowStr);
    setIsSyncing(false);

    if (finalSheetUrl || finalScriptUrl) {
      setSyncStatus({
        type: 'success',
        message: 'Pengaturan Link Spreadsheet & Apps Script berhasil disimpan!',
      });
    } else {
      setSyncStatus({
        type: 'info',
        message: 'Link Spreadsheet telah dikosongkan.',
      });
    }
  };

  const handleManualSyncAll = async () => {
    const targetUrl = (appsScriptUrl || '').trim() || (spreadsheetUrl || '').trim();
    if (!targetUrl) {
      setSyncStatus({ type: 'error', message: 'Silakan isi Link Spreadsheet atau Link Web App Apps Script terlebih dahulu.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    const result = await syncDatabaseToSpreadsheet(targetUrl, {
      type: 'sync_full',
      settings: {
        ...settings,
        spreadsheetUrl,
        appsScriptUrl,
      },
      halaqohs,
      santris,
      attendanceRecords,
      journalEntries,
      prestasiRecords,
      grades,
      gradeStandards,
      users,
    });

    setIsSyncing(false);
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncTime(nowStr);
    localStorage.setItem('aqu_last_sync_time', nowStr);

    if (result.success) {
      setSyncStatus({ type: 'success', message: result.message });
    } else {
      setSyncStatus({ type: 'error', message: result.message });
    }
  };

  const handlePullDataFromSpreadsheet = async () => {
    if (!(spreadsheetUrl || '').trim()) {
      setSyncStatus({ type: 'error', message: 'Silakan isi Link Spreadsheet terlebih dahulu.' });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    const result = await fetchDataFromSpreadsheet(spreadsheetUrl);

    if (result.success && result.data) {
      if (onUpdateAllData) {
        onUpdateAllData(result.data);
      }

      if (isSupabaseConfigured()) {
        try {
          const supRes = await saveDatabaseToSupabase(result.data);
          if (!supRes.success) {
            console.warn('Supabase sync notice on pull:', supRes.message);
          }
        } catch (err: any) {
          console.error('Error saving pulled spreadsheet data to Supabase:', err);
        }
      }

      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(nowStr);
      localStorage.setItem('aqu_last_sync_time', nowStr);
      setSyncStatus({
        type: 'success',
        message: 'Data berhasil ditarik dari Google Spreadsheet, tersimpan di Supabase & diperbarui di aplikasi!',
      });
    } else {
      setSyncStatus({ type: 'error', message: result.message });
    }
    setIsSyncing(false);
  };

  const handleDownloadCurrentDb = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });
    try {
      let dataToExport: {
        halaqohs?: Halaqoh[];
        santris?: Santri[];
        attendanceRecords?: AttendanceRecord[];
        journalEntries?: JournalEntry[];
        prestasiRecords?: PrestasiRecord[];
        grades?: GradeRecord[];
        gradeStandards?: GradeStandard[];
        users?: User[];
        settings?: SchoolSettings;
      } = {
        halaqohs,
        santris,
        attendanceRecords,
        journalEntries,
        prestasiRecords,
        grades,
        gradeStandards,
        users,
        settings,
      };

      if (isSupabaseConfigured()) {
        const supRes = await fetchDatabaseFromSupabase();
        if (supRes.success && supRes.data) {
          dataToExport = supRes.data;
        }
      }

      downloadCurrentDatabaseXlsx(dataToExport);
      setSyncStatus({
        type: 'success',
        message: 'File Backup Database Aplikasi/Supabase (.xlsx) berhasil diunduh ke perangkat Anda!',
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: 'Gagal mengunduh database: ' + (err?.message || 'Error tidak diketahui'),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadCurrentDbCsv = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });
    try {
      let dataToExport: {
        halaqohs?: Halaqoh[];
        santris?: Santri[];
        attendanceRecords?: AttendanceRecord[];
        journalEntries?: JournalEntry[];
        prestasiRecords?: PrestasiRecord[];
        grades?: GradeRecord[];
        gradeStandards?: GradeStandard[];
        users?: User[];
        settings?: SchoolSettings;
      } = {
        halaqohs,
        santris,
        attendanceRecords,
        journalEntries,
        prestasiRecords,
        grades,
        gradeStandards,
        users,
        settings,
      };

      if (isSupabaseConfigured()) {
        const supRes = await fetchDatabaseFromSupabase();
        if (supRes.success && supRes.data) {
          dataToExport = supRes.data;
        }
      }

      downloadCurrentDatabaseCsv(dataToExport);
      setSyncStatus({
        type: 'success',
        message: 'File Backup Database Aplikasi/Supabase (.csv) berhasil diunduh ke perangkat Anda!',
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: 'Gagal mengunduh database CSV: ' + (err?.message || 'Error tidak diketahui'),
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadDatabaseTemplateXlsx();
      setSyncStatus({
        type: 'success',
        message: 'Template Sheet Google/Excel (.xlsx) berhasil diunduh ke perangkat Anda!',
      });
    } catch (err: any) {
      setSyncStatus({
        type: 'error',
        message: 'Gagal mengunduh template: ' + (err?.message || 'Error tidak diketahui'),
      });
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const handlePullFromSupabase = async () => {
    if (!isSupabaseConfigured()) {
      setSyncStatus({
        type: 'error',
        message: 'Supabase belum terkonfigurasi di environment variable (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    const result = await fetchDatabaseFromSupabase();
    setIsSyncing(false);

    if (result.success && result.data) {
      if (onUpdateAllData) {
        onUpdateAllData(result.data);
      }
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(nowStr);
      localStorage.setItem('aqu_last_sync_time', nowStr);
      setSyncStatus({
        type: 'success',
        message: 'Seluruh data berhasil ditarik dari Supabase!',
      });
    } else {
      setSyncStatus({ type: 'error', message: result.message });
    }
  };

  const handlePushToSupabase = async () => {
    if (!isSupabaseConfigured()) {
      setSyncStatus({
        type: 'error',
        message: 'Supabase belum terkonfigurasi di environment variable (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).',
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatus({ type: null, message: '' });

    const result = await saveDatabaseToSupabase({
      settings,
      halaqohs,
      santris,
      attendanceRecords,
      journalEntries,
      prestasiRecords,
      grades,
      gradeStandards,
      users,
    });

    setIsSyncing(false);
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSyncTime(nowStr);
    localStorage.setItem('aqu_last_sync_time', nowStr);

    if (result.success) {
      setSyncStatus({
        type: 'success',
        message: 'Data aplikasi berhasil dikirim dan tersimpan di Supabase.',
      });
    } else {
      setSyncStatus({ type: 'error', message: result.message });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const extractSpreadsheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const sheetId = extractSpreadsheetId(spreadsheetUrl);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-2xl shadow-md border border-emerald-600/30">
        <div className="flex items-start sm:items-center gap-4">
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shrink-0">
            <Database className="w-7 h-7 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Kelola Database & Integrasi Spreadsheet</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-amber-950">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Database utama tersimpan di Cloud Supabase PostgreSQL. Integrasi Spreadsheet khusus untuk Tarik Data dari Spreadsheet & Kirim Data ke Spreadsheet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleDownloadCurrentDb}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded-xl shadow-sm transition-all transform active:scale-95 cursor-pointer"
            title="Unduh seluruh database aktif (Supabase) ke file Excel (.xlsx)"
          >
            <DownloadCloud className="w-4 h-4 text-slate-900" />
            <span>Unduh Database (.xlsx)</span>
          </button>

          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl border border-white/20 transition-all cursor-pointer"
            title="Unduh template Excel kosong berserta contoh format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template Sheet</span>
          </button>
        </div>
      </div>

      {/* IMPORT DATA EXCEL / CSV SECTION */}
      {isAdmin && onUpdateAllData && (
        <ImportDataSection onImportData={onUpdateAllData} />
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Database Configuration & Connection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 0: Supabase Primary Database */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>Database Utama: Supabase PostgreSQL</span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-md">
                      PRIMARY
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Penyimpanan utama aplikasi tersimpan aman di Cloud Supabase. Anda dapat mengunduh backup lengkap database aplikasi di sini.
                  </p>
                </div>
              </div>

              {isSupabaseConfigured() ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Supabase Terhubung</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Env Vars Belum Diisi</span>
                </span>
              )}
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">VITE_SUPABASE_URL:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {import.meta.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">VITE_SUPABASE_ANON_KEY:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">
                    {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Configured' : '✗ Missing'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadCurrentDb}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 custom-theme-btn font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Unduh seluruh database aktif (Supabase) ke format Excel (.xlsx)"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Unduh Database (.xlsx)</span>
                  </button>

                  <button
                    onClick={handleDownloadCurrentDbCsv}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Unduh seluruh database aktif (Supabase) ke format CSV (.csv)"
                  >
                    <DownloadCloud className="w-4 h-4" />
                    <span>Unduh Database (.csv)</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowSqlModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Skrip SQL Supabase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 1: Input Link Spreadsheet */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Link className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Integrasi Google Spreadsheet (Tarik & Kirim Data)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gunakan fitur ini khusus untuk mengimpor (tarik) data dari Google Sheets atau mengekspor (kirim) data ke Google Sheets.
                  </p>
                </div>
              </div>

              {spreadsheetUrl ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Terhubung</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Belum Diisi</span>
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-xl text-blue-900 dark:text-blue-200 text-xs leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Informasi Fungsi Integrasi Spreadsheet:</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Fitur ini khusus bertugas untuk <strong>Menarik Data</strong> dari Google Spreadsheet ke dalam aplikasi/Supabase dan <strong>Mengirim Data</strong> yang ada di aplikasi ke Google Spreadsheet.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Link Google Spreadsheet / Apps Script URL:
                </label>
                <div className="relative flex items-center">
                  <input
                    type="url"
                    value={spreadsheetUrl}
                    onChange={(e) => setSpreadsheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1ABC.../edit atau https://script.google.com/macros/s/.../exec"
                    className="w-full px-3.5 py-2.5 pr-10 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono"
                  />
                  {sheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${sheetId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 text-slate-400 hover:text-emerald-600 transition-colors"
                      title="Buka Spreadsheet di Tab Baru"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {syncStatus.message && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
                    syncStatus.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {syncStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{syncStatus.message}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleSaveUrl}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 px-3.5 py-2 custom-theme-btn text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Simpan Link</span>
                  </button>

                  <button
                    onClick={handlePullDataFromSpreadsheet}
                    disabled={isSyncing || !(spreadsheetUrl || '').trim()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    title="Ambil data dari Google Spreadsheet dan perbarui di aplikasi & Supabase"
                  >
                    <DownloadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>Tarik Data dari Spreadsheet</span>
                  </button>

                  <button
                    onClick={handleManualSyncAll}
                    disabled={isSyncing || !(spreadsheetUrl || '').trim()}
                    className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer disabled:opacity-50"
                    title="Kirim seluruh data aplikasi saat ini ke Google Spreadsheet"
                  >
                    <UploadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Kirim ke Spreadsheet</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto Sinkron Dua Arah: {autoSyncEnabled ? 'Aktif' : 'Non-Aktif'}</span>
                  {lastSyncTime && <span className="text-[11px] font-mono">({lastSyncTime})</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Table Schema & Template Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
                  <Sheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Struktur 9 Tabel & Template Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Unduh file template Excel kosong yang berisikan struktur header 9 tabel untuk di-upload ke Google Drive.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 custom-theme-btn border border-emerald-600 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  title="Unduh template Excel kosong berserta contoh format 9 tabel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template Sheet (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Sheet Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-700">
              {sheetsData.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setActivePreviewTab(s.name)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer ${
                    activePreviewTab === s.name
                      ? 'custom-theme-btn shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Active Sheet Table Preview */}
            {(() => {
              const currentSheet = sheetsData.find((s) => s.name === activePreviewTab) || sheetsData[0];
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{currentSheet.desc}</span>
                    </span>
                    <span className="text-slate-400 font-mono">{currentSheet.headers.length} Kolom</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          {currentSheet.headers.map((h) => (
                            <th key={h} className="px-3 py-2 border-r border-slate-200 dark:border-slate-700 last:border-r-0">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                        {currentSheet.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 dark:border-slate-700/50 last:border-r-0 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right 1 Column: Tutorial & Google Apps Script Setup */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Panduan Integrasi Spreadsheet</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Langkah menghubungkan secara otomatis</p>
              </div>
            </div>

            <ol className="space-y-3 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
              <li className="pl-1">
                Klik tombol <strong className="text-emerald-600 dark:text-emerald-400">Unduh Template Sheet (.xlsx)</strong> untuk mendapatkan file template 9 tabel.
              </li>
              <li className="pl-1">
                Buka <strong className="text-slate-800 dark:text-slate-200">Google Drive</strong>, lalu upload file Excel tersebut dan buka sebagai <strong className="text-slate-800 dark:text-slate-200">Google Sheets</strong>.
              </li>
              <li className="pl-1">
                Di Google Sheets, klik menu <strong className="text-slate-800 dark:text-slate-200">Ekstensi &gt; Apps Script</strong>.
              </li>
              <li className="pl-1">
                Salin dan tempel kode skrip Apps Script di bawah ini ke editor.
              </li>
              <li className="pl-1">
                Klik <strong className="text-slate-800 dark:text-slate-200">Terapkan (Deploy) &gt; Sebagai Aplikasi Web (Web App)</strong> dengan akses <strong className="text-slate-800 dark:text-slate-200">Siapa Saja (Anyone)</strong>.
              </li>
              <li className="pl-1">
                Salin URL Web App yang dihasilkan, tempelkan ke kolom <strong className="text-emerald-600 dark:text-emerald-400">Link Spreadsheet</strong>, lalu gunakan tombol <strong className="text-blue-600 dark:text-blue-400">Tarik Data dari Spreadsheet</strong> atau <strong className="text-slate-700 dark:text-slate-300">Kirim ke Spreadsheet</strong> untuk menyinkronkan data.
              </li>
            </ol>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Kode Google Apps Script:</span>
                <button
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 transition-colors cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-bold">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-[10px] font-mono overflow-x-auto max-h-56 leading-normal border border-slate-800 custom-scrollbar">
                {appScriptCode}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Reset & Hapus Data Database Card (Admin Only) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="border-b border-rose-100 dark:border-rose-900/40 pb-3">
            <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>Reset &amp; Hapus Data Database (Hanya Akses Admin)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih centang bagian database apa yang ingin di-reset atau dihapus secara bersih. Data di aplikasi dan cloud Supabase akan terhapus.
            </p>
          </div>

          {purgeMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{purgeMsg}</span>
            </div>
          )}

          <form onSubmit={handlePurgeSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'classes' as keyof PurgeOptions, label: 'Data Kelas / Halaqah' },
                { key: 'students' as keyof PurgeOptions, label: `Data ${term}` },
                { key: 'attendance' as keyof PurgeOptions, label: 'Data Presensi Harian' },
                { key: 'journals' as keyof PurgeOptions, label: 'Data Jurnal Mengajar' },
                { key: 'prestasi' as keyof PurgeOptions, label: 'Data Kartu Prestasi' },
                { key: 'grades' as keyof PurgeOptions, label: 'Data Penilaian / Nilai Ujian' },
                { key: 'settings' as keyof PurgeOptions, label: 'Pengaturan Sekolah (Identitas & KOP)' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={purgeOptions[item.key]}
                    onChange={(e) =>
                      setPurgeOptions((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Data Yang Dipilih</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Konfirmasi 2-Langkah Reset & Hapus Data */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Langkah 1: Konfirmasi Yakin / Tidak */}
            {purgeStep === 1 && (
              <div>
                <div className="flex items-center justify-between p-5 border-b border-rose-100 dark:border-rose-950/50 bg-rose-50/50 dark:bg-rose-950/30">
                  <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Langkah 1: Konfirmasi Hapus Data</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsPurgeModalOpen(false)}
                    disabled={isPurging}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs leading-relaxed space-y-1">
                    <p className="font-bold">Apakah Anda YAKIN ingin mereset &amp; menghapus data berikut?</p>
                    <p className="text-[11px] opacity-90">Tindakan ini bersifat permanen dan data yang telah dihapus akan terhapus dari Supabase &amp; penyimpanan lokal.</p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Rincian Data Yang Akan Dihapus:
                    </span>
                    <ul className="space-y-1 max-h-40 overflow-y-auto pr-1">
                      {Object.entries(purgeOptions)
                        .filter(([, selected]) => selected)
                        .map(([key]) => {
                          const labels: Record<string, string> = {
                            classes: 'Data Kelas / Halaqah',
                            students: `Data ${term}`,
                            attendance: 'Data Presensi Harian',
                            journals: 'Data Jurnal Mengajar',
                            prestasi: 'Data Kartu Prestasi',
                            grades: 'Data Penilaian / Nilai Ujian',
                            settings: 'Pengaturan Sekolah (Identitas & KOP)',
                          };
                          return (
                            <li
                              key={key}
                              className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>{labels[key] || key}</span>
                            </li>
                          );
                        })}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPurgeModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Tidak, Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurgeStep(2)}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Ya, Saya Yakin Lanjutkan</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Langkah 2: Ketik Password Admin */}
            {purgeStep === 2 && (
              <div>
                <div className="flex items-center justify-between p-5 border-b border-rose-100 dark:border-rose-950/50 bg-rose-50/50 dark:bg-rose-950/30">
                  <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>Langkah 2: Verifikasi Kata Sandi Admin</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsPurgeModalOpen(false)}
                    disabled={isPurging}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleConfirmPurgeWithPassword} className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Untuk keamanan tingkat lanjut, silakan ketik <strong className="text-slate-900 dark:text-white font-bold">Kata Sandi (Password)</strong> akun Anda (<span className="text-rose-600 dark:text-rose-400 font-bold">{activeUser.username}</span>) untuk mengonfirmasi penghapusan data:
                  </p>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kata Sandi Admin <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPurgePasswordInput ? 'text' : 'password'}
                        value={purgePasswordInput}
                        disabled={isPurging}
                        onChange={(e) => {
                          setPurgePasswordInput(e.target.value);
                          setPurgePasswordError('');
                        }}
                        placeholder="Ketik kata sandi akun Anda..."
                        autoFocus
                        className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPurgePasswordInput(!showPurgePasswordInput)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPurgePasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {purgePasswordError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{purgePasswordError}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setPurgeStep(1)}
                      disabled={isPurging}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isPurging}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {isPurging ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Proses Menghapus...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span>Konfirmasi &amp; Hapus Data</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Query SQL Supabase (9 Tabel &amp; Akses Anon)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Buka Supabase Dashboard &gt; SQL Editor &gt; New Query, lalu jalankan skrip di bawah ini.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 relative">
              <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono border border-slate-800 overflow-x-auto leading-relaxed whitespace-pre font-normal">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Otomatis membuat 9 tabel (school_settings, halaqohs, santris, attendance, journals, prestasi, grades, grade_standards, users) &amp; kebijakan RLS.
              </span>
              <button
                onClick={handleCopySql}
                className="inline-flex items-center gap-2 px-4 py-2 custom-theme-btn font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>SQL Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Query SQL</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
