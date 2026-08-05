export type UserRole = 'admin' | 'guru';

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  nip: string;
  role: UserRole;
  title?: string;
}

export type PaperSize = 'A4' | 'F4';
export type PaperOrientation = 'portrait' | 'landscape';

export interface GradeStandard {
  id: string;
  letter: string; // e.g. 'A+', 'A', 'B+', 'B', 'C'
  predicate: string; // e.g. 'Sangat Baik Sekali', 'Sangat Baik', 'Baik', 'Cukup', 'Kurang'
  description: string; // e.g. 'Lancar & Tajwid Sangat Baik'
  minScore: number; // e.g. 90, 80, 70, 60, 0
}

export interface ThemeConfig {
  preset?: string; // 'emerald' | 'blue' | 'teal' | 'indigo' | 'amber' | 'rose' | 'slate' | 'custom';
  headerBg?: string;
  headerText?: string;
  sidebarBg?: string;
  sidebarText?: string;
  contentBg?: string;
  contentText?: string;
  primaryColor?: string;
  buttonBg?: string;
  buttonText?: string;
}

export interface SchoolSettings {
  logoUrl: string;
  foundationLogoUrl?: string; // Logo Yayasan (Opsional)
  kopUrl: string;
  foundation: string; // Naungan / Yayasan
  schoolName: string;
  accreditation: string; // Status / Akreditasi
  address: string;
  city: string; // Kota / Tempat
  paperSize: PaperSize;
  paperOrientation: PaperOrientation;
  academicYear: string; // Tahun Ajaran e.g. "2025/2026"
  headmasterName: string;
  headmasterNip: string;
  headmasterTitle: string; // Sebutan Jabatan Kepala e.g. "Kepala Sekolah" / "Mudir"
  gradeMaxScale: 10 | 100; // Standar Nilai (0-10 atau 0-100)
  studentTerm?: string; // Sebutan peserta didik e.g. "Murid", "Santri", "Siswa", "Peserta Didik", "Lainnya"
  parentSalutationTerm?: string; // Sebutan panggilan orang tua e.g. "Bapak/Ibu", "Ayah/Bunda", "Abaa/Ummahat", "Lainnya"
  themeConfig?: ThemeConfig;
  spreadsheetUrl?: string;
  appsScriptUrl?: string;
}

export type ClassLevel = 'menengah' | 'lanjut' | 'tahfizh';

export interface Halaqoh {
  id: string;
  name: string;
  level: ClassLevel;
  waGroupLink: string;
  createdAt: string;
}

export type StudentStatus = 'aktif' | 'cuti' | 'keluar';
export type Gender = 'L' | 'P';

export interface Santri {
  id: string;
  halaqohId: string;
  fullName: string;
  nis: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  status: StudentStatus;
  entryDate: string; // YYYY-MM-DD
  fatherName: string;
  motherName: string;
  fatherJob: string;
  motherJob: string;
  parentWa: string;
}

export type AttendanceStatus = 'H' | 'I' | 'S' | 'A' | 'T'; // Hadir, Izin, Sakit, Alpha, Telat

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  halaqohId: string;
  santriId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface JournalRecord {
  id: string;
  date: string; // YYYY-MM-DD
  halaqohId: string;
  material: string; // Materi / Kegiatan
  notesAndEvaluation: string; // Catatan & Evaluasi
  teacherName: string;
}

export type JournalEntry = JournalRecord;

export type PrestasiType = 'tahsin' | 'ziyadah' | 'murojaah';
export type TahsinGrade = 'A+' | 'A' | 'B+' | 'B' | 'C';
export type ZiyadahQuality = 'mumtaz' | 'jayyid jiddan' | 'jayyid' | 'maqbul';
export type PrestasiStatus = 'lanjut' | 'ulang' | 'tidak';

export interface PrestasiRecord {
  id: string;
  date: string; // YYYY-MM-DD
  halaqohId: string;
  santriId: string;
  type: PrestasiType;
  // Common fields
  notes?: string;
  status: PrestasiStatus; // 'lanjut' | 'ulang' | 'tidak'
  
  // Tahsin fields
  tahsinMaterial?: string; // Surat / Jilid
  tahsinPageAyat?: string; // Halaman / Ayat
  tahsinGrade?: TahsinGrade;
  
  // Ziyadah fields
  ziyadahJuz?: number; // 1 to 30
  ziyadahSurah?: string; // Name of surah
  ziyadahAyat?: string; // Ayat (optional)
  ziyadahQuality?: ZiyadahQuality;
  
  // Murojaah fields
  murojaahMaterial?: string; // Juz / Surat / Halaman
  murojaahAyat?: string; // Ayat (optional)
  murojaahQuality?: ZiyadahQuality | TahsinGrade;
}

export type AssessmentType = 'Penilaian Harian' | 'PTS' | 'PAS';

export interface GradeRecord {
  id: string;
  date: string; // YYYY-MM-DD
  halaqohId: string;
  santriId: string;
  score: number;
  assessmentType: AssessmentType;
  subjectArea: string; // Tahsin, Hafalan, Doa-doa, Materi keislaman, etc.
  methodKitab: string; // Al-Qur'an, Iqro, Tilawati, Yanbua, Qiroati, Ummi, etc.
}

export interface PurgeOptions {
  classes: boolean;
  students: boolean;
  attendance: boolean;
  journals: boolean;
  prestasi: boolean;
  grades: boolean;
  settings: boolean;
}
