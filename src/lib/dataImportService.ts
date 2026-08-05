import * as XLSX from 'xlsx';
import {
  Halaqoh,
  Santri,
  AttendanceRecord,
  JournalEntry,
  PrestasiRecord,
  GradeRecord,
  SchoolSettings,
  GradeStandard,
  User,
  ClassLevel,
  Gender,
  StudentStatus,
  AttendanceStatus,
  PrestasiType,
  PrestasiStatus,
  AssessmentType,
  TahsinGrade,
  ZiyadahQuality,
} from '../types';
import { generateCleanId } from './idUtils';

export interface ImportCategoryDef {
  key: string;
  label: string;
  description: string;
  isOperational: boolean; // true = checked by default, false = unchecked by default
  sheetAliases: string[];
}

export const IMPORT_CATEGORIES: ImportCategoryDef[] = [
  {
    key: 'halaqohs',
    label: 'Data Kelas / Halaqoh (halaqohs)',
    description: 'Daftar nama kelas, tingkat, dan link grup WA',
    isOperational: true,
    sheetAliases: ['halaqohs', 'halaqoh', '1. data_kelas', 'data_kelas', 'data kelas', 'kelas', '1. data_halaqoh'],
  },
  {
    key: 'santris',
    label: 'Data Siswa / Santri (santris)',
    description: 'Data biodata santri, NIS, kelas, dan nomor WA orang tua',
    isOperational: true,
    sheetAliases: ['santris', 'santri', '2. data_santri', 'data_santri', 'data santri', 'data siswa', 'data_siswa', 'siswa'],
  },
  {
    key: 'attendanceRecords',
    label: 'Data Presensi (attendance_records)',
    description: 'Catatan presensi harian (Hadir, Izin, Sakit, Alpha)',
    isOperational: true,
    sheetAliases: ['attendance_records', 'attendancerecords', '3. data_presensi', 'data_presensi', 'data presensi', 'presensi', 'attendance'],
  },
  {
    key: 'journalEntries',
    label: 'Data Jurnal Mengajar (journal_records)',
    description: 'Catatan kegiatan, materi, dan evaluasi pengajaran harian',
    isOperational: true,
    sheetAliases: ['journal_records', 'journalentries', '4. data_jurnal', 'data_jurnal', 'data jurnal', 'jurnal', 'jurnal mengajar', '4. data_jurnal_mengajar'],
  },
  {
    key: 'prestasiRecords',
    label: 'Data Kartu Prestasi (prestasi_records)',
    description: 'Catatan setoran hafalan (Tahsin, Ziyadah, Murojaah)',
    isOperational: true,
    sheetAliases: ['prestasi_records', 'prestasirecords', '5. data_prestasi', 'data_prestasi', 'data prestasi', 'prestasi', 'kartu prestasi', '5. data_kartu_prestasi'],
  },
  {
    key: 'grades',
    label: 'Data Nilai Siswa (grade_records)',
    description: 'Rekap nilai ujian, harian, PTS, dan PAS',
    isOperational: true,
    sheetAliases: ['grade_records', 'grades', '6. data_nilai', 'data_nilai', 'data nilai', 'nilai', 'nilai siswa', '6. data_nilai_siswa'],
  },
  {
    key: 'settings',
    label: 'Data Pengaturan Sekolah (school_settings)',
    description: 'Identitas sekolah, logo, kop surat, dan konfigurasi cetak',
    isOperational: false,
    sheetAliases: ['school_settings', 'settings', '7. data_pengaturan', 'data_pengaturan', 'data pengaturan', 'pengaturan', '7. data_pengaturan_sekolah'],
  },
  {
    key: 'gradeStandards',
    label: 'Data Standar Nilai (grade_standards)',
    description: 'Kategori kriteria predikat nilai (A, B, C, D)',
    isOperational: false,
    sheetAliases: ['grade_standards', 'gradestandards', '8. data_standar_nilai', 'data_standar_nilai', 'data standar nilai', 'standar nilai'],
  },
  {
    key: 'users',
    label: 'Data Pengguna / Akun (users)',
    description: 'Daftar akun pengguna (Admin, Guru / Ustadz)',
    isOperational: false,
    sheetAliases: ['users', 'user', '9. data_pengguna', 'data_pengguna', 'data pengguna', 'pengguna', '9. data_pengguna_user'],
  },
];

export interface ParsedCategoryData {
  categoryKey: string;
  categoryLabel: string;
  rowCount: number;
  data: any[];
  error?: string;
}

export interface FileParseResult {
  fileName: string;
  fileSize: number;
  fileType: 'xlsx' | 'csv';
  parsedCategories: Record<string, ParsedCategoryData>;
  errors: string[];
  totalRowsFound: number;
}

export interface CategoryImportResult {
  categoryKey: string;
  categoryLabel: string;
  status: 'success' | 'skipped' | 'error';
  count: number;
  message: string;
}

export interface ImportSummary {
  totalProcessed: number;
  results: CategoryImportResult[];
  errors: string[];
}

// Map normalized sheet name or column signature to category key
function matchSheetToCategory(sheetName: string, headers: string[]): string | null {
  const normName = sheetName.toLowerCase().trim();
  
  for (const cat of IMPORT_CATEGORIES) {
    if (cat.sheetAliases.some((alias) => normName === alias || normName.includes(alias))) {
      return cat.key;
    }
  }

  // Fallback by header signatures
  const lowerHeaders = headers.map((h) => String(h).toLowerCase().trim().replace(/[\s_]+/g, ''));
  
  if (lowerHeaders.includes('linkgrupwa') || lowerHeaders.includes('wagrouplink') || lowerHeaders.includes('namakelas') || (lowerHeaders.includes('tingkat') && lowerHeaders.includes('namakelas'))) {
    return 'halaqohs';
  }
  if (lowerHeaders.includes('nis') || lowerHeaders.includes('namalengkap') || lowerHeaders.includes('fullname') || lowerHeaders.includes('nowaortu') || lowerHeaders.includes('idkelas')) {
    return 'santris';
  }
  if ((lowerHeaders.includes('idsantri') || lowerHeaders.includes('santriid')) && (lowerHeaders.includes('statuskehadiran') || lowerHeaders.includes('status')) && (lowerHeaders.includes('date') || lowerHeaders.includes('tanggal'))) {
    return 'attendanceRecords';
  }
  if (lowerHeaders.includes('namapengajar') || lowerHeaders.includes('materipelajaran') || lowerHeaders.includes('catatandanevaluasi') || lowerHeaders.includes('teachername')) {
    return 'journalEntries';
  }
  if (lowerHeaders.includes('jenissetoran') || lowerHeaders.includes('materitahsin') || lowerHeaders.includes('juzziyadah') || lowerHeaders.includes('tahsinmaterial')) {
    return 'prestasiRecords';
  }
  if (lowerHeaders.includes('jenisujian') || lowerHeaders.includes('bidangstudi') || lowerHeaders.includes('metodekitab') || lowerHeaders.includes('assessmenttype')) {
    return 'grades';
  }
  if (lowerHeaders.includes('namasekolah') || lowerHeaders.includes('urllogo') || lowerHeaders.includes('schoolname') || lowerHeaders.includes('namakepalasekolah')) {
    return 'settings';
  }
  if (lowerHeaders.includes('nilaiminimal') || lowerHeaders.includes('predikat') || (lowerHeaders.includes('minscore') && lowerHeaders.includes('predicate'))) {
    return 'gradeStandards';
  }
  if (lowerHeaders.includes('username') && lowerHeaders.includes('password') && (lowerHeaders.includes('peran') || lowerHeaders.includes('role') || lowerHeaders.includes('namapengguna'))) {
    return 'users';
  }

  return null;
}

// Parsers for individual categories
function parseHalaqohs(rows: any[]): Halaqoh[] {
  const list: Halaqoh[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;
    const name = String(
      row.nama_kelas || row.nama_halaqoh || row.name || row.Nama || row.nama || row['Nama Kelas'] || row['Nama Halaqoh'] || ''
    ).trim();
    if (!name && !row.id && !row.ID) return;

    const levelRaw = String(row.tingkat || row.level || row.Tingkat || 'tahfizh').toLowerCase().trim();
    const level: ClassLevel = (['menengah', 'lanjut', 'tahfizh'].includes(levelRaw) ? levelRaw : 'tahfizh') as ClassLevel;

    const h: Halaqoh = {
      id: String(row.id || row.ID || generateCleanId('hlq', list, idx)).trim(),
      name: name || `Halaqoh ${idx + 1}`,
      level,
      waGroupLink: String(row.link_grup_wa || row.waGroupLink || row.wa_group_link || row.LinkWA || row['Link Group WA'] || row['Link WA Group'] || '').trim(),
      createdAt: String(row.tanggal_dibuat || row.createdAt || row.created_at || row.TanggalBuat || new Date().toISOString().split('T')[0]).trim(),
    };
    list.push(h);
  });
  return list;
}

function parseSantris(rows: any[]): Santri[] {
  const list: Santri[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;
    const fullName = String(
      row.nama_lengkap || row.fullName || row.full_name || row.nama || row.Nama || row['Nama Lengkap'] || row.Name || ''
    ).trim();
    if (!fullName && !row.id && !row.ID && !row.nis && !row.NIS) return;

    const genderRaw = String(
      row.jenis_kelamin || row.gender || row.JK || row.JenisKelamin || row['Jenis Kelamin'] || 'L'
    ).toUpperCase().trim();
    const gender: Gender = genderRaw.startsWith('P') || genderRaw === 'PEREMPUAN' || genderRaw === 'FEMALE' ? 'P' : 'L';

    const statusRaw = String(row.status || row.Status || 'aktif').toLowerCase().trim();
    const status: StudentStatus = (['aktif', 'cuti', 'keluar', 'alumni', 'nonaktif'].includes(statusRaw)
      ? (statusRaw === 'alumni' || statusRaw === 'nonaktif' ? 'keluar' : statusRaw)
      : 'aktif') as StudentStatus;

    const s: Santri = {
      id: String(row.id || row.ID || generateCleanId('snt', list, idx)).trim(),
      halaqohId: String(row.id_kelas || row.halaqohId || row.halaqoh_id || row.IDKelas || row['ID Kelas'] || '').trim(),
      fullName: fullName || `Santri ${idx + 1}`,
      nis: String(row.nis || row.NIS || row.Nis || '').trim(),
      gender,
      birthPlace: String(row.tempat_lahir || row.birthPlace || row.birth_place || row.TempatLahir || row['Tempat Lahir'] || '').trim(),
      birthDate: String(row.tanggal_lahir || row.birthDate || row.birth_date || row.TanggalLahir || row['Tanggal Lahir'] || '').trim(),
      status,
      entryDate: String(
        row.tanggal_masuk || row.entryDate || row.entry_date || row.enrolledAt || row.TanggalMasuk || row['Tanggal Masuk'] || new Date().toISOString().split('T')[0]
      ).trim(),
      fatherName: String(row.nama_ayah || row.fatherName || row.father_name || row.NamaAyah || row['Nama Ayah'] || '').trim(),
      motherName: String(row.nama_ibu || row.motherName || row.mother_name || row.NamaIbu || row['Nama Ibu'] || '').trim(),
      fatherJob: String(row.pekerjaan_ayah || row.fatherJob || row.father_job || row.PekerjaanAyah || row['Pekerjaan Ayah'] || '').trim(),
      motherJob: String(row.pekerjaan_ibu || row.motherJob || row.mother_job || row.PekerjaanIbu || row['Pekerjaan Ibu'] || '').trim(),
      parentWa: String(row.no_wa_ortu || row.parentWa || row.parent_wa || row.WAParent || row.WaOrtu || row['WA Ortu'] || row['No WA'] || '').trim(),
    };
    list.push(s);
  });
  return list;
}

function parseAttendanceRecords(rows: any[]): AttendanceRecord[] {
  const list: AttendanceRecord[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;

    const statusRaw = String(row.status_kehadiran || row.status || row.Status || 'H').toUpperCase().trim();
    const status: AttendanceStatus = (['H', 'I', 'S', 'A', 'T'].includes(statusRaw) ? statusRaw : 'H') as AttendanceStatus;

    const a: AttendanceRecord = {
      id: String(row.id || row.ID || generateCleanId('att', list, idx)).trim(),
      date: String(row.tanggal || row.date || row.Tanggal || new Date().toISOString().split('T')[0]).trim(),
      halaqohId: String(row.id_kelas || row.halaqohId || row.halaqoh_id || row.IDKelas || row['ID Kelas'] || '').trim(),
      santriId: String(row.id_santri || row.santriId || row.santri_id || row.IDSiswa || row['ID Santri'] || row['ID Siswa'] || '').trim(),
      status,
      notes: row.catatan || row.notes || row.note || row.Catatan ? String(row.catatan || row.notes || row.note || row.Catatan).trim() : undefined,
    };
    list.push(a);
  });
  return list;
}

function parseJournalEntries(rows: any[]): JournalEntry[] {
  const list: JournalEntry[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;

    const j: JournalEntry = {
      id: String(row.id || row.ID || generateCleanId('jrn', list, idx)).trim(),
      date: String(row.tanggal || row.date || row.Tanggal || new Date().toISOString().split('T')[0]).trim(),
      halaqohId: String(row.id_kelas || row.halaqohId || row.halaqoh_id || row.IDKelas || row['ID Kelas'] || '').trim(),
      teacherName: String(row.nama_pengajar || row.teacherName || row.teacher_name || row.Guru || row['Nama Guru'] || row.Pengajar || '').trim(),
      material: String(row.materi_pelajaran || row.material || row.materi || row.Materi || row['Materi Pembelajaran'] || '').trim(),
      notesAndEvaluation: String(
        row.catatan_dan_evaluasi || row.notesAndEvaluation || row.notes_and_evaluation || row.notes || row.Catatan || row['Catatan & Evaluasi'] || ''
      ).trim(),
    };
    list.push(j);
  });
  return list;
}

function parsePrestasiRecords(rows: any[]): PrestasiRecord[] {
  const list: PrestasiRecord[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;

    const typeRaw = String(row.jenis_setoran || row.type || row.Jenis || row.Kategori || 'tahsin').toLowerCase().trim();
    const type: PrestasiType = (['tahsin', 'ziyadah', 'murojaah'].includes(typeRaw) ? typeRaw : 'tahsin') as PrestasiType;

    const statusRaw = String(row.status || row.Status || 'lanjut').toLowerCase().trim();
    const status: PrestasiStatus = (['lanjut', 'ulang', 'tidak', 'lulus', 'mengulang'].includes(statusRaw)
      ? (statusRaw === 'lulus' ? 'lanjut' : statusRaw === 'mengulang' ? 'ulang' : statusRaw)
      : 'lanjut') as PrestasiStatus;

    const p: PrestasiRecord = {
      id: String(row.id || row.ID || generateCleanId('prs', list, idx)).trim(),
      date: String(row.tanggal || row.date || row.Tanggal || new Date().toISOString().split('T')[0]).trim(),
      santriId: String(row.id_santri || row.santriId || row.santri_id || row.IDSiswa || row['ID Santri'] || row['ID Siswa'] || '').trim(),
      halaqohId: String(row.id_kelas || row.halaqohId || row.halaqoh_id || row.IDKelas || row['ID Kelas'] || '').trim(),
      type,
      notes: row.catatan || row.notes || row.Catatan ? String(row.catatan || row.notes || row.Catatan).trim() : undefined,
      status,
      tahsinMaterial: row.materi_tahsin || row.tahsinMaterial || row.tahsin_material || row.MateriTahsin ? String(row.materi_tahsin || row.tahsinMaterial || row.tahsin_material || row.MateriTahsin).trim() : undefined,
      tahsinPageAyat: row.halaman_ayat_tahsin || row.tahsinPageAyat || row.tahsin_page_ayat || row.HalamanAyat ? String(row.halaman_ayat_tahsin || row.tahsinPageAyat || row.tahsin_page_ayat || row.HalamanAyat).trim() : undefined,
      tahsinGrade: row.nilai_tahsin || row.tahsinGrade || row.tahsin_grade || row.NilaiTahsin ? (String(row.nilai_tahsin || row.tahsinGrade || row.tahsin_grade || row.NilaiTahsin).trim() as TahsinGrade) : undefined,
      ziyadahJuz: row.juz_ziyadah !== undefined && row.juz_ziyadah !== '' ? Number(row.juz_ziyadah) : (row.ziyadahJuz || row.ziyadah_juz || row.JuzZiyadah ? Number(row.ziyadahJuz || row.ziyadah_juz || row.JuzZiyadah) : undefined),
      ziyadahSurah: row.surah_ziyadah || row.ziyadahSurah || row.ziyadah_surah || row.SurahZiyadah ? String(row.surah_ziyadah || row.ziyadahSurah || row.ziyadah_surah || row.SurahZiyadah).trim() : undefined,
      ziyadahAyat: row.ayat_ziyadah || row.ziyadahAyat || row.ziyadah_ayat || row.AyatZiyadah ? String(row.ayat_ziyadah || row.ziyadahAyat || row.ziyadah_ayat || row.AyatZiyadah).trim() : undefined,
      ziyadahQuality: row.kualitas_ziyadah || row.ziyadahQuality || row.ziyadah_quality || row.KualitasZiyadah ? (String(row.kualitas_ziyadah || row.ziyadahQuality || row.ziyadah_quality || row.KualitasZiyadah).trim() as ZiyadahQuality) : undefined,
      murojaahMaterial: row.materi_murojaah || row.murojaahMaterial || row.murojaah_material || row.MateriMurojaah ? String(row.materi_murojaah || row.murojaahMaterial || row.murojaah_material || row.MateriMurojaah).trim() : undefined,
      murojaahAyat: row.ayat_murojaah || row.murojaahAyat || row.murojaah_ayat || row.AyatMurojaah ? String(row.ayat_murojaah || row.murojaahAyat || row.murojaah_ayat || row.AyatMurojaah).trim() : undefined,
      murojaahQuality: row.kualitas_murojaah || row.murojaahQuality || row.murojaah_quality || row.KualitasMurojaah ? (String(row.kualitas_murojaah || row.murojaahQuality || row.murojaah_quality || row.KualitasMurojaah).trim() as ZiyadahQuality) : undefined,
    };
    list.push(p);
  });
  return list;
}

function parseGrades(rows: any[]): GradeRecord[] {
  const list: GradeRecord[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;

    const assessmentRaw = String(
      row.jenis_ujian || row.assessmentType || row.assessment_type || row.JenisPenilaian || row['Jenis Penilaian'] || 'PTS'
    ).trim();
    const assessmentType: AssessmentType = (['Penilaian Harian', 'PTS', 'PAS'].includes(assessmentRaw)
      ? assessmentRaw
      : assessmentRaw.toLowerCase().includes('harian')
      ? 'Penilaian Harian'
      : assessmentRaw.toLowerCase().includes('pas')
      ? 'PAS'
      : 'PTS') as AssessmentType;

    const g: GradeRecord = {
      id: String(row.id || row.ID || generateCleanId('grd', list, idx)).trim(),
      date: String(row.tanggal || row.date || row.Tanggal || new Date().toISOString().split('T')[0]).trim(),
      halaqohId: String(row.id_kelas || row.halaqohId || row.halaqoh_id || row.IDKelas || row['ID Kelas'] || '').trim(),
      santriId: String(row.id_santri || row.santriId || row.santri_id || row.IDSiswa || row['ID Santri'] || row['ID Siswa'] || '').trim(),
      score: Number(row.nilai !== undefined ? row.nilai : (row.score !== undefined ? row.score : row.Nilai || 0)),
      assessmentType,
      subjectArea: String(row.bidang_studi || row.subjectArea || row.subject_area || row.BidangStudi || row['Bidang Studi'] || 'Tahfizh').trim(),
      methodKitab: String(row.metode_kitab || row.methodKitab || row.method_kitab || row.MetodeKitab || row['Metode/Kitab'] || "Al-Qur'an").trim(),
    };
    list.push(g);
  });
  return list;
}

function parseSettings(rows: any[]): Partial<SchoolSettings> | null {
  if (!rows || rows.length === 0) return null;
  const row = rows[0];

  return {
    logoUrl: row.url_logo || row.logoUrl || row.logo_url || row.LogoUrl,
    foundationLogoUrl: row.url_logo_yayasan || row.foundationLogoUrl || row.foundation_logo_url || row.LogoYayasan,
    kopUrl: row.url_kop || row.kopUrl || row.kop_url || row.KopUrl,
    foundation: row.yayasan || row.foundation || row.Yayasan,
    schoolName: row.nama_sekolah || row.schoolName || row.school_name || row.NamaSekolah,
    accreditation: row.akreditasi || row.accreditation || row.Akreditasi,
    address: row.alamat || row.address || row.Alamat,
    city: row.kota || row.city || row.Kota,
    paperSize: (['A4', 'F4'].includes(row.ukuran_kertas || row.paperSize || row.paper_size) ? (row.ukuran_kertas || row.paperSize || row.paper_size) : undefined) as any,
    paperOrientation: (['portrait', 'landscape'].includes(row.orientasi_kertas || row.paperOrientation || row.paper_orientation) ? (row.orientasi_kertas || row.paperOrientation || row.paper_orientation) : undefined) as any,
    academicYear: row.tahun_ajaran || row.academicYear || row.academic_year || row.TahunAjaran,
    headmasterName: row.nama_kepala_sekolah || row.headmasterName || row.headmaster_name || row.NamaKepala,
    headmasterNip: row.nip_kepala_sekolah || row.headmasterNip || row.headmaster_nip || row.NipKepala,
    headmasterTitle: row.jabatan_kepala_sekolah || row.headmasterTitle || row.headmaster_title || row.JabatanKepala,
    gradeMaxScale: Number(row.skala_maksimal_nilai || row.gradeMaxScale || row.grade_max_scale) === 10 ? 10 : Number(row.skala_maksimal_nilai || row.gradeMaxScale || row.grade_max_scale) === 100 ? 100 : undefined,
    studentTerm: row.istilah_murid || row.studentTerm || row.student_term || row.SebutanSiswa,
    parentSalutationTerm: row.sapaan_ortu || row.parentSalutationTerm || row.parent_salutation_term || row.SebutanOrtu,
    spreadsheetUrl: row.url_spreadsheet || row.spreadsheetUrl || row.spreadsheet_url,
  };
}

function parseGradeStandards(rows: any[]): GradeStandard[] {
  const list: GradeStandard[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;

    const st: GradeStandard = {
      id: String(row.id || row.ID || generateCleanId('std', list, idx)).trim(),
      letter: String(row.huruf || row.letter || row.Huruf || 'A').trim(),
      predicate: String(row.predikat || row.predicate || row.Predikat || 'Baik').trim(),
      description: String(row.keterangan || row.description || row.Keterangan || '').trim(),
      minScore: Number(row.nilai_minimal !== undefined ? row.nilai_minimal : (row.minScore !== undefined ? row.minScore : (row.min_score !== undefined ? row.min_score : row.NilaiMinimal || 0))),
    };
    list.push(st);
  });
  return list;
}

function parseUsers(rows: any[]): User[] {
  const list: User[] = [];
  rows.forEach((row, idx) => {
    if (!row || Object.keys(row).length === 0) return;

    const u: User = {
      id: String(row.id || row.ID || generateCleanId('usr', list, idx)).trim(),
      name: String(row.nama_pengguna || row.name || row.Nama || row.nama || '').trim(),
      nip: String(row.nip || row.NIP || '').trim(),
      title: String(row.jabatan || row.title || row.Jabatan || '').trim(),
      role: String(row.peran || row.role || row.Peran).toLowerCase() === 'admin' ? 'admin' : 'guru',
      username: String(row.username || row.Username || 'user').trim(),
      password: String(row.password || row.Password || 'password').trim(),
    };
    list.push(u);
  });
  return list;
}

/**
 * Main File Parsing Service
 */
export async function parseImportFile(file: File): Promise<FileParseResult> {
  const fileName = file.name;
  const fileSize = file.size;
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  const fileType: 'xlsx' | 'csv' = fileExt === 'csv' ? 'csv' : 'xlsx';

  const errors: string[] = [];
  const parsedCategories: Record<string, ParsedCategoryData> = {};
  let totalRowsFound = 0;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        fileName,
        fileSize,
        fileType,
        parsedCategories: {},
        errors: ['File spreadsheet kosong atau tidak berisi lembar kerja (sheet).'],
        totalRowsFound: 0,
      };
    }

    // Process each sheet in the workbook
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      if (!Array.isArray(rawRows) || rawRows.length === 0) continue;

      const headers = Object.keys(rawRows[0] || {});
      const categoryKey = matchSheetToCategory(sheetName, headers);

      if (!categoryKey) continue;

      const categoryDef = IMPORT_CATEGORIES.find((c) => c.key === categoryKey);
      const categoryLabel = categoryDef ? categoryDef.label : sheetName;

      let parsedData: any = [];
      let parseErr: string | undefined = undefined;

      try {
        switch (categoryKey) {
          case 'halaqohs':
            parsedData = parseHalaqohs(rawRows);
            break;
          case 'santris':
            parsedData = parseSantris(rawRows);
            break;
          case 'attendanceRecords':
            parsedData = parseAttendanceRecords(rawRows);
            break;
          case 'journalEntries':
            parsedData = parseJournalEntries(rawRows);
            break;
          case 'prestasiRecords':
            parsedData = parsePrestasiRecords(rawRows);
            break;
          case 'grades':
            parsedData = parseGrades(rawRows);
            break;
          case 'settings': {
            const s = parseSettings(rawRows);
            parsedData = s ? [s] : [];
            break;
          }
          case 'gradeStandards':
            parsedData = parseGradeStandards(rawRows);
            break;
          case 'users':
            parsedData = parseUsers(rawRows);
            break;
        }
      } catch (err: any) {
        parseErr = `Gagal memproses data pada sheet "${sheetName}": ${err?.message || String(err)}`;
        errors.push(parseErr);
      }

      const rowCount = Array.isArray(parsedData) ? parsedData.length : parsedData ? 1 : 0;
      totalRowsFound += rowCount;

      parsedCategories[categoryKey] = {
        categoryKey,
        categoryLabel,
        rowCount,
        data: parsedData,
        error: parseErr,
      };
    }

    if (Object.keys(parsedCategories).length === 0) {
      errors.push(
        'Format sheet atau nama kolom tidak sesuai dengan template AQU. Pastikan menggunakan file Excel/CSV sesuai format aplikasi.'
      );
    }
  } catch (err: any) {
    errors.push(`Terjadi kesalahan saat membaca file: ${err?.message || String(err)}`);
  }

  return {
    fileName,
    fileSize,
    fileType,
    parsedCategories,
    errors,
    totalRowsFound,
  };
}
