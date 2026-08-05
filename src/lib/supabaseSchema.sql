-- =========================================================
-- QUERY SQL UNTUK INVENTARIS TEKS SERTA TABEL SUPABASE AQU
-- Jalankan skrip ini di Supabase Dashboard -> SQL Editor
-- =========================================================

-- 1. Tabel Settings (Pengaturan Sekolah)
CREATE TABLE IF NOT EXISTS school_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_url TEXT,
  foundation_logo_url TEXT,
  kop_url TEXT,
  foundation TEXT,
  school_name TEXT,
  accreditation TEXT,
  address TEXT,
  city TEXT,
  paper_size TEXT,
  paper_orientation TEXT,
  academic_year TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  headmaster_title TEXT,
  grade_max_scale INT,
  student_term TEXT,
  parent_salutation_term TEXT,
  spreadsheet_url TEXT,
  theme_config JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Halaqohs / Kelas
CREATE TABLE IF NOT EXISTS halaqohs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  wa_group_link TEXT,
  created_at TEXT
);

-- 3. Tabel Santri / Murid
CREATE TABLE IF NOT EXISTS santris (
  id TEXT PRIMARY KEY,
  halaqoh_id TEXT,
  full_name TEXT NOT NULL,
  nis TEXT,
  gender TEXT,
  birth_place TEXT,
  birth_date TEXT,
  status TEXT DEFAULT 'aktif',
  entry_date TEXT,
  father_name TEXT,
  mother_name TEXT,
  father_job TEXT,
  mother_job TEXT,
  parent_wa TEXT
);

-- 4. Tabel Attendance Records (Presensi)
CREATE TABLE IF NOT EXISTS attendance_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  halaqoh_id TEXT,
  santri_id TEXT,
  status TEXT NOT NULL,
  notes TEXT
);

-- 5. Tabel Journal Records (Jurnal Mengajar)
CREATE TABLE IF NOT EXISTS journal_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  halaqoh_id TEXT,
  material TEXT,
  notes_and_evaluation TEXT,
  teacher_name TEXT
);

-- 6. Tabel Prestasi Records (Kartu Prestasi)
CREATE TABLE IF NOT EXISTS prestasi_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  halaqoh_id TEXT,
  santri_id TEXT,
  type TEXT NOT NULL,
  notes TEXT,
  status TEXT,
  tahsin_material TEXT,
  tahsin_page_ayat TEXT,
  tahsin_grade TEXT,
  ziyadah_juz INT,
  ziyadah_surah TEXT,
  ziyadah_ayat TEXT,
  ziyadah_quality TEXT,
  murojaah_material TEXT,
  murojaah_ayat TEXT,
  murojaah_quality TEXT
);

-- 7. Tabel Grade Records (Nilai Santri)
CREATE TABLE IF NOT EXISTS grade_records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  halaqoh_id TEXT,
  santri_id TEXT,
  score NUMERIC NOT NULL,
  assessment_type TEXT NOT NULL,
  subject_area TEXT,
  method_kitab TEXT
);

-- 8. Tabel Grade Standards (Standar Nilai)
CREATE TABLE IF NOT EXISTS grade_standards (
  id TEXT PRIMARY KEY,
  letter TEXT NOT NULL,
  predicate TEXT NOT NULL,
  description TEXT,
  min_score NUMERIC NOT NULL
);

-- 9. Tabel Users (Pengguna Admin & Guru)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  nip TEXT,
  role TEXT NOT NULL,
  title TEXT
);

-- Activate Row Level Security (RLS) and allow anon access for public application use
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE halaqohs ENABLE ROW LEVEL SECURITY;
ALTER TABLE santris ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestasi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create Policies for Anon Public Access (SELECT, INSERT, UPDATE, DELETE)
DO $$
BEGIN
  CREATE POLICY "Allow anon all on school_settings" ON school_settings FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on halaqohs" ON halaqohs FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on santris" ON santris FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on attendance_records" ON attendance_records FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on journal_records" ON journal_records FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on prestasi_records" ON prestasi_records FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on grade_records" ON grade_records FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on grade_standards" ON grade_standards FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Allow anon all on users" ON users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  -- Policies already exist or handled
END $$;
