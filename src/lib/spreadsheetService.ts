import * as XLSX from 'xlsx';
import { SchoolSettings, Halaqoh, Santri, AttendanceRecord, JournalEntry, PrestasiRecord, GradeRecord, GradeStandard, User, ClassLevel, StudentStatus } from '../types';

export function safeCellVal(val: any): any {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const str = String(val);
  if (str.length > 32000) {
    if (str.startsWith('data:image/')) {
      return '[Data Gambar Base64 - Ditinggalkan untuk Excel]';
    }
    return str.slice(0, 32000);
  }
  return str;
}

export function sanitizeRows(rows: any[][]): any[][] {
  return rows.map((row) => row.map(safeCellVal));
}

export function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 1000);
}

export function downloadCurrentDatabaseXlsx(data: {
  halaqohs?: Halaqoh[];
  santris?: Santri[];
  attendanceRecords?: AttendanceRecord[];
  journalEntries?: JournalEntry[];
  prestasiRecords?: PrestasiRecord[];
  grades?: GradeRecord[];
  settings?: SchoolSettings;
  gradeStandards?: GradeStandard[];
  users?: User[];
}) {
  const wb = XLSX.utils.book_new();

  // 1. Data_Kelas
  const kelasHeaders = ['id', 'nama_kelas', 'tingkat', 'link_grup_wa', 'tanggal_dibuat'];
  const kelasRows = (data.halaqohs || []).map((k) => [
    k.id || '',
    k.name || '',
    k.level || '',
    k.waGroupLink || '',
    k.createdAt || '',
  ]);
  const wsKelas = XLSX.utils.aoa_to_sheet([kelasHeaders, ...sanitizeRows(kelasRows)]);
  wsKelas['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 15 }, { wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsKelas, '1. Data_Kelas');

  // 2. Data_Santri
  const santriHeaders = [
    'id',
    'id_kelas',
    'nama_lengkap',
    'nis',
    'jenis_kelamin',
    'tempat_lahir',
    'tanggal_lahir',
    'status',
    'tanggal_masuk',
    'nama_ayah',
    'nama_ibu',
    'pekerjaan_ayah',
    'pekerjaan_ibu',
    'no_wa_ortu',
  ];
  const santriRows = (data.santris || []).map((s) => [
    s.id || '',
    s.halaqohId || '',
    s.fullName || '',
    s.nis || '',
    s.gender || 'L',
    s.birthPlace || '',
    s.birthDate || '',
    s.status || 'aktif',
    s.entryDate || (s as any).enrolledAt || '',
    s.fatherName || '',
    s.motherName || '',
    s.fatherJob || '',
    s.motherJob || '',
    s.parentWa || '',
  ]);
  const wsSantri = XLSX.utils.aoa_to_sheet([santriHeaders, ...sanitizeRows(santriRows)]);
  wsSantri['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 12 },
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSantri, '2. Data_Santri');

  // 3. Data_Presensi
  const presensiHeaders = ['id', 'tanggal', 'id_kelas', 'id_santri', 'status_kehadiran', 'catatan'];
  const presensiRows = (data.attendanceRecords || []).map((a) => [
    a.id || '',
    a.date || '',
    a.halaqohId || '',
    a.santriId || '',
    a.status || '',
    a.notes || (a as any).note || '',
  ]);
  const wsPresensi = XLSX.utils.aoa_to_sheet([presensiHeaders, ...sanitizeRows(presensiRows)]);
  wsPresensi['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsPresensi, '3. Data_Presensi');

  // 4. Data_Jurnal
  const jurnalHeaders = ['id', 'tanggal', 'id_kelas', 'materi_pelajaran', 'catatan_dan_evaluasi', 'nama_pengajar'];
  const jurnalRows = (data.journalEntries || []).map((j) => [
    j.id || '',
    j.date || '',
    j.halaqohId || '',
    j.material || (j as any).materi || '',
    j.notesAndEvaluation || (j as any).notes || '',
    j.teacherName || '',
  ]);
  const wsJurnal = XLSX.utils.aoa_to_sheet([jurnalHeaders, ...sanitizeRows(jurnalRows)]);
  wsJurnal['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsJurnal, '4. Data_Jurnal');

  // 5. Data_Prestasi
  const prestasiHeaders = [
    'id',
    'tanggal',
    'id_kelas',
    'id_santri',
    'jenis_setoran',
    'catatan',
    'status',
    'materi_tahsin',
    'halaman_ayat_tahsin',
    'nilai_tahsin',
    'juz_ziyadah',
    'surah_ziyadah',
    'ayat_ziyadah',
    'kualitas_ziyadah',
    'materi_murojaah',
    'ayat_murojaah',
    'kualitas_murojaah',
  ];
  const prestasiRows = (data.prestasiRecords || []).map((p) => [
    p.id || '',
    p.date || '',
    p.halaqohId || '',
    p.santriId || '',
    p.type || '',
    p.notes || '',
    p.status || 'lulus',
    p.tahsinMaterial || '',
    p.tahsinPageAyat || '',
    p.tahsinGrade || '',
    p.ziyadahJuz ?? '',
    p.ziyadahSurah || '',
    p.ziyadahAyat || '',
    p.ziyadahQuality || '',
    p.murojaahMaterial || '',
    p.murojaahAyat || '',
    p.murojaahQuality || '',
  ]);
  const wsPrestasi = XLSX.utils.aoa_to_sheet([prestasiHeaders, ...sanitizeRows(prestasiRows)]);
  wsPrestasi['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 25 },
    { wch: 10 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPrestasi, '5. Data_Prestasi');

  // 6. Data_Nilai
  const nilaiHeaders = ['id', 'tanggal', 'id_kelas', 'id_santri', 'nilai', 'jenis_ujian', 'bidang_studi', 'metode_kitab'];
  const nilaiRows = (data.grades || []).map((g) => [
    g.id || '',
    g.date || '',
    g.halaqohId || '',
    g.santriId || '',
    g.score ?? 0,
    g.assessmentType || '',
    g.subjectArea || '',
    g.methodKitab || '',
  ]);
  const wsNilai = XLSX.utils.aoa_to_sheet([nilaiHeaders, ...sanitizeRows(nilaiRows)]);
  wsNilai['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsNilai, '6. Data_Nilai');

  // 7. Data_Pengaturan
  const pengaturanHeaders = [
    'id',
    'url_logo',
    'url_logo_yayasan',
    'url_kop',
    'yayasan',
    'nama_sekolah',
    'akreditasi',
    'alamat',
    'kota',
    'ukuran_kertas',
    'orientasi_kertas',
    'tahun_ajaran',
    'nama_kepala_sekolah',
    'nip_kepala_sekolah',
    'jabatan_kepala_sekolah',
    'skala_maksimal_nilai',
    'istilah_murid',
    'sapaan_ortu',
    'url_spreadsheet',
  ];
  const cfg = data.settings || ({} as SchoolSettings);
  const pengaturanRows = [
    [
      'default',
      cfg.logoUrl || '',
      cfg.foundationLogoUrl || '',
      cfg.kopUrl || '',
      cfg.foundation || '',
      cfg.schoolName || '',
      cfg.accreditation || '',
      cfg.address || '',
      cfg.city || '',
      cfg.paperSize || 'A4',
      cfg.paperOrientation || 'portrait',
      cfg.academicYear || '',
      cfg.headmasterName || '',
      cfg.headmasterNip || '',
      cfg.headmasterTitle || '',
      cfg.gradeMaxScale || 100,
      cfg.studentTerm || 'Murid',
      cfg.parentSalutationTerm || 'Bapak/Ibu',
      cfg.spreadsheetUrl || '',
    ],
  ];
  const wsPengaturan = XLSX.utils.aoa_to_sheet([pengaturanHeaders, ...sanitizeRows(pengaturanRows)]);
  wsPengaturan['!cols'] = [
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 30 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPengaturan, '7. Data_Pengaturan');

  // 8. Data_Standar_Nilai
  const standarHeaders = ['id', 'huruf', 'predikat', 'keterangan', 'nilai_minimal'];
  const standarRows = (data.gradeStandards || []).map((st) => [
    st.id || '',
    st.letter || '',
    st.predicate || '',
    st.description || '',
    st.minScore ?? 0,
  ]);
  const wsStandar = XLSX.utils.aoa_to_sheet([standarHeaders, ...sanitizeRows(standarRows)]);
  wsStandar['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 30 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsStandar, '8. Data_Standar_Nilai');

  // 9. Data_Pengguna
  const penggunaHeaders = ['id', 'username', 'password', 'nama_pengguna', 'nip', 'peran', 'jabatan'];
  const penggunaRows = (data.users || []).map((u) => [
    u.id || '',
    u.username || '',
    u.password || '',
    u.name || '',
    u.nip || '',
    u.role || '',
    u.title || '',
  ]);
  const wsPengguna = XLSX.utils.aoa_to_sheet([penggunaHeaders, ...sanitizeRows(penggunaRows)]);
  wsPengguna['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 28 }, { wch: 20 }, { wch: 10 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsPengguna, '9. Data_Pengguna');

  // File date
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Database_AQU_Lengkap_${dateStr}.xlsx`;

  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerFileDownload(blob, fileName);
  } catch (err) {
    console.warn('XLSX.write array failed, attempting writeFile:', err);
    try {
      XLSX.writeFile(wb, fileName);
    } catch (fallbackErr) {
      console.error('Failed to download XLSX file:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export function downloadDatabaseTemplateXlsx() {
  const wb = XLSX.utils.book_new();

  // 1. Data_Kelas
  const kelasHeaders = ['id', 'nama_kelas', 'tingkat', 'link_grup_wa', 'tanggal_dibuat'];
  const kelasRows = [
    ['kls-001', 'Halaqoh Al-Fatihah', 'Tahfizh', 'https://chat.whatsapp.com/sample1', '2025-01-01'],
    ['kls-002', 'Halaqoh An-Nur', 'Lanjut', 'https://chat.whatsapp.com/sample2', '2025-01-01'],
  ];
  const wsKelas = XLSX.utils.aoa_to_sheet([kelasHeaders, ...kelasRows]);
  wsKelas['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 15 }, { wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsKelas, '1. Data_Kelas');

  // 2. Data_Santri
  const santriHeaders = [
    'id',
    'id_kelas',
    'nama_lengkap',
    'nis',
    'jenis_kelamin',
    'tempat_lahir',
    'tanggal_lahir',
    'status',
    'tanggal_masuk',
    'nama_ayah',
    'nama_ibu',
    'pekerjaan_ayah',
    'pekerjaan_ibu',
    'no_wa_ortu',
  ];
  const santriRows = [
    ['str-001', 'kls-001', 'Ahmad Zaki Al-Farisi', '2025001', 'L', 'Bandung', '2012-05-10', 'aktif', '2025-01-10', 'Ahmad Ridwan', 'Siti Maryam', 'Wiraswasta', 'Ibu Rumah Tangga', '081234567890'],
    ['str-002', 'kls-001', 'Fatimah Az-Zahra', '2025002', 'P', 'Jakarta', '2013-08-15', 'aktif', '2025-01-10', 'Budi Santoso', 'Aisyah', 'PNS', 'Guru', '081987654321'],
  ];
  const wsSantri = XLSX.utils.aoa_to_sheet([santriHeaders, ...santriRows]);
  wsSantri['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 28 },
    { wch: 12 },
    { wch: 8 },
    { wch: 18 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSantri, '2. Data_Santri');

  // 3. Data_Presensi
  const presensiHeaders = ['id', 'tanggal', 'id_kelas', 'id_santri', 'status_kehadiran', 'catatan'];
  const presensiRows = [
    ['att-001', '2025-02-01', 'kls-001', 'str-001', 'H', 'Hadir tepat waktu'],
    ['att-002', '2025-02-01', 'kls-001', 'str-002', 'I', 'Izin acara keluarga'],
  ];
  const wsPresensi = XLSX.utils.aoa_to_sheet([presensiHeaders, ...presensiRows]);
  wsPresensi['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsPresensi, '3. Data_Presensi');

  // 4. Data_Jurnal
  const jurnalHeaders = ['id', 'tanggal', 'id_kelas', 'materi_pelajaran', 'catatan_dan_evaluasi', 'nama_pengajar'];
  const jurnalRows = [
    ['jrn-001', '2025-02-01', 'kls-001', "Tajwid Mad Thabi'i", 'Santri antusias', 'Ustadz Abdullah, M.Ag.'],
  ];
  const wsJurnal = XLSX.utils.aoa_to_sheet([jurnalHeaders, ...jurnalRows]);
  wsJurnal['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsJurnal, '4. Data_Jurnal');

  // 5. Data_Prestasi
  const prestasiHeaders = [
    'id',
    'tanggal',
    'id_kelas',
    'id_santri',
    'jenis_setoran',
    'catatan',
    'status',
    'materi_tahsin',
    'halaman_ayat_tahsin',
    'nilai_tahsin',
    'juz_ziyadah',
    'surah_ziyadah',
    'ayat_ziyadah',
    'kualitas_ziyadah',
    'materi_murojaah',
    'ayat_murojaah',
    'kualitas_murojaah',
  ];
  const prestasiRows = [
    ['prs-001', '2025-02-01', 'kls-001', 'str-001', 'tahsin', 'Bagus', 'lulus', 'Jilid 4 Hal 12', 'Hal 12', 'Mumtaz (Lancar)', '', '', '', '', '', '', ''],
    ['prs-002', '2025-02-01', 'kls-001', 'str-001', 'ziyadah', 'Lancar tanpa keliru', 'lulus', '', '', '', '30', 'An-Naba', '1-20', 'Jayyid (Lancar)', '', '', ''],
  ];
  const wsPrestasi = XLSX.utils.aoa_to_sheet([prestasiHeaders, ...prestasiRows]);
  wsPrestasi['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 25 },
    { wch: 10 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPrestasi, '5. Data_Prestasi');

  // 6. Data_Nilai
  const nilaiHeaders = ['id', 'tanggal', 'id_kelas', 'id_santri', 'nilai', 'jenis_ujian', 'bidang_studi', 'metode_kitab'];
  const nilaiRows = [
    ['grd-001', '2025-02-15', 'kls-001', 'str-001', '95', 'PTS', 'Tahsin', "Al-Qur'an"],
    ['grd-002', '2025-02-15', 'kls-001', 'str-002', '88', 'PTS', 'Tahsin', "Al-Qur'an"],
  ];
  const wsNilai = XLSX.utils.aoa_to_sheet([nilaiHeaders, ...nilaiRows]);
  wsNilai['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsNilai, '6. Data_Nilai');

  // 7. Data_Pengaturan
  const pengaturanHeaders = [
    'id',
    'url_logo',
    'url_logo_yayasan',
    'url_kop',
    'yayasan',
    'nama_sekolah',
    'akreditasi',
    'alamat',
    'kota',
    'ukuran_kertas',
    'orientasi_kertas',
    'tahun_ajaran',
    'nama_kepala_sekolah',
    'nip_kepala_sekolah',
    'jabatan_kepala_sekolah',
    'skala_maksimal_nilai',
    'istilah_murid',
    'sapaan_ortu',
    'url_spreadsheet',
  ];
  const pengaturanRows = [
    ['default', '/assets/logo.png', '', '', "Yayasan Bina Insani Qur'ani", 'SMP IT & Mahad Tahfizh AQU', 'Terakreditasi A', 'Jl. Pendidikan No. 123', 'Bandung', 'A4', 'portrait', '2025/2026', 'Dr. H. Muhammad Ridwan, M.A.', '19780512 200312 1 002', 'Kepala Sekolah', '100', 'Murid', 'Bapak/Ibu', ''],
  ];
  const wsPengaturan = XLSX.utils.aoa_to_sheet([pengaturanHeaders, ...pengaturanRows]);
  wsPengaturan['!cols'] = [
    { wch: 10 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 28 },
    { wch: 30 },
    { wch: 15 },
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPengaturan, '7. Data_Pengaturan');

  // 8. Data_Standar_Nilai
  const standarHeaders = ['id', 'huruf', 'predikat', 'keterangan', 'nilai_minimal'];
  const standarRows = [
    ['std-001', 'A+', 'Mumtaz', 'Sangat Baik Sekali / Perfect', '90'],
    ['std-002', 'A', 'Jayyid Jiddan', 'Baik Sekali / Sangat Lancar', '80'],
    ['std-003', 'B+', 'Jayyid', 'Baik / Lancar', '70'],
    ['std-004', 'B', 'Maqbul', 'Cukup / Perlu Pengulangan', '60'],
    ['std-005', 'C', 'Rasib', 'Kurang / Mengulang', '0'],
  ];
  const wsStandar = XLSX.utils.aoa_to_sheet([standarHeaders, ...standarRows]);
  wsStandar['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 30 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsStandar, '8. Data_Standar_Nilai');

  // 9. Data_Pengguna
  const penggunaHeaders = ['id', 'username', 'password', 'nama_pengguna', 'nip', 'peran', 'jabatan'];
  const penggunaRows = [
    ['u-admin', 'admin', 'admin123', 'Ustadz Abdullah, M.Ag.', '19850101 201001 1 001', 'admin', 'Kepala Pengajar Tahfizh'],
    ['u-guru1', 'guru', 'guru123', 'Ustadzah Siti Aminah, S.Pd.I', '19900315 201502 2 003', 'guru', 'Guru Tahsin'],
  ];
  const wsPengguna = XLSX.utils.aoa_to_sheet([penggunaHeaders, ...penggunaRows]);
  wsPengguna['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 28 }, { wch: 20 }, { wch: 10 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsPengguna, '9. Data_Pengguna');

  const fileName = 'Template_Database_AQU_Supabase_GoogleSheets.xlsx';
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerFileDownload(blob, fileName);
  } catch (err) {
    XLSX.writeFile(wb, fileName);
  }
}

export function downloadCurrentDatabaseCsv(data: {
  halaqohs?: Halaqoh[];
  santris?: Santri[];
  attendanceRecords?: AttendanceRecord[];
  journalEntries?: JournalEntry[];
  prestasiRecords?: PrestasiRecord[];
  grades?: GradeRecord[];
  settings?: SchoolSettings;
  gradeStandards?: GradeStandard[];
  users?: User[];
}) {
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Database_AQU_Lengkap_${dateStr}.csv`;

  const sheetsData = [
    {
      name: '1. Data_Kelas',
      headers: ['id', 'nama_kelas', 'tingkat', 'link_grup_wa', 'tanggal_dibuat'],
      rows: (data.halaqohs || []).map((k) => [k.id, k.name, k.level, k.waGroupLink || '', k.createdAt]),
    },
    {
      name: '2. Data_Santri',
      headers: [
        'id',
        'id_kelas',
        'nama_lengkap',
        'nis',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'status',
        'tanggal_masuk',
        'nama_ayah',
        'nama_ibu',
        'pekerjaan_ayah',
        'pekerjaan_ibu',
        'no_wa_ortu',
      ],
      rows: (data.santris || []).map((s: any) => [
        s.id,
        s.halaqohId || '',
        s.fullName || '',
        s.nis || '',
        s.gender || 'L',
        s.birthPlace || '',
        s.birthDate || '',
        s.status || 'aktif',
        s.entryDate || s.enrolledAt || '',
        s.fatherName || '',
        s.motherName || '',
        s.fatherJob || '',
        s.motherJob || '',
        s.parentWa || '',
      ]),
    },
    {
      name: '3. Data_Presensi',
      headers: ['id', 'tanggal', 'id_kelas', 'id_santri', 'status_kehadiran', 'catatan'],
      rows: (data.attendanceRecords || []).map((a: any) => [a.id, a.date, a.halaqohId, a.santriId, a.status, a.notes || a.note || '']),
    },
    {
      name: '4. Data_Jurnal',
      headers: ['id', 'tanggal', 'id_kelas', 'materi_pelajaran', 'catatan_dan_evaluasi', 'nama_pengajar'],
      rows: (data.journalEntries || []).map((j: any) => [j.id, j.date, j.halaqohId, j.material || j.materi || '', j.notesAndEvaluation || j.notes || '', j.teacherName || '']),
    },
    {
      name: '5. Data_Prestasi',
      headers: [
        'id',
        'tanggal',
        'id_kelas',
        'id_santri',
        'jenis_setoran',
        'catatan',
        'status',
        'materi_tahsin',
        'halaman_ayat_tahsin',
        'nilai_tahsin',
        'juz_ziyadah',
        'surah_ziyadah',
        'ayat_ziyadah',
        'kualitas_ziyadah',
        'materi_murojaah',
        'kualitas_murojaah',
      ],
      rows: (data.prestasiRecords || []).map((p) => [
        p.id,
        p.date,
        p.halaqohId,
        p.santriId,
        p.type,
        p.notes || '',
        p.status || 'lulus',
        p.tahsinMaterial || '',
        p.tahsinPageAyat || '',
        p.tahsinGrade || '',
        p.ziyadahJuz ?? '',
        p.ziyadahSurah || '',
        p.ziyadahAyat || '',
        p.ziyadahQuality || '',
        p.murojaahMaterial || '',
        p.murojaahQuality || '',
      ]),
    },
    {
      name: '6. Data_Nilai',
      headers: ['id', 'tanggal', 'id_kelas', 'id_santri', 'nilai', 'jenis_ujian', 'bidang_studi', 'metode_kitab'],
      rows: (data.grades || []).map((g) => [g.id, g.date, g.halaqohId, g.santriId, g.score, g.assessmentType, g.subjectArea, g.methodKitab]),
    },
    {
      name: '7. Data_Pengaturan',
      headers: [
        'id',
        'url_logo',
        'url_logo_yayasan',
        'url_kop',
        'yayasan',
        'nama_sekolah',
        'akreditasi',
        'alamat',
        'kota',
        'ukuran_kertas',
        'orientasi_kertas',
        'tahun_ajaran',
        'nama_kepala_sekolah',
        'nip_kepala_sekolah',
        'jabatan_kepala_sekolah',
        'skala_maksimal_nilai',
        'istilah_murid',
        'sapaan_ortu',
        'url_spreadsheet',
      ],
      rows: data.settings
        ? [
            [
              'default',
              data.settings.logoUrl || '',
              data.settings.foundationLogoUrl || '',
              data.settings.kopUrl || '',
              data.settings.foundation || '',
              data.settings.schoolName || '',
              data.settings.accreditation || '',
              data.settings.address || '',
              data.settings.city || '',
              data.settings.paperSize || 'A4',
              data.settings.paperOrientation || 'portrait',
              data.settings.academicYear || '',
              data.settings.headmasterName || '',
              data.settings.headmasterNip || '',
              data.settings.headmasterTitle || '',
              data.settings.gradeMaxScale || 100,
              data.settings.studentTerm || 'Murid',
              data.settings.parentSalutationTerm || 'Bapak/Ibu',
              data.settings.spreadsheetUrl || '',
            ],
          ]
        : [],
    },
    {
      name: '8. Data_Standar_Nilai',
      headers: ['id', 'huruf', 'predikat', 'keterangan', 'nilai_minimal'],
      rows: (data.gradeStandards || []).map((st) => [st.id, st.letter, st.predicate, st.description || '', st.minScore]),
    },
    {
      name: '9. Data_Pengguna',
      headers: ['id', 'username', 'password', 'nama_pengguna', 'nip', 'peran', 'jabatan'],
      rows: (data.users || []).map((u) => [u.id, u.username, u.password, u.name || '', u.nip || '', u.role, u.title || '']),
    },
  ];

  function escapeCsvCell(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const csvLines: string[] = [];
  for (const sheet of sheetsData) {
    csvLines.push(`=== TABEL: ${sheet.name} ===`);
    csvLines.push(sheet.headers.map(escapeCsvCell).join(','));
    for (const row of sheet.rows) {
      csvLines.push(row.map(escapeCsvCell).join(','));
    }
    csvLines.push('');
  }

  const csvContent = '\uFEFF' + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerFileDownload(blob, fileName);
}

async function fetchFromGoogleSheetCsv(sheetId: string) {
  const sheetMap: Record<string, string[]> = {
    halaqohs: ['halaqohs', '1. Data_Kelas'],
    santris: ['santris', '2. Data_Santri'],
    attendanceRecords: ['attendance_records', '3. Data_Presensi'],
    journalEntries: ['journal_records', '4. Data_Jurnal'],
    prestasiRecords: ['prestasi_records', '5. Data_Prestasi'],
    grades: ['grade_records', '6. Data_Nilai'],
    settings: ['school_settings', '7. Data_Pengaturan'],
    gradeStandards: ['grade_standards', '8. Data_Standar_Nilai'],
    users: ['users', '9. Data_Pengguna'],
  };

  const rawData: Record<string, any[]> = {};

  for (const [key, candidates] of Object.entries(sheetMap)) {
    for (const name of candidates) {
      if (rawData[key] && rawData[key].length > 0) break;
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
        const res = await fetch(csvUrl);
        if (res.ok) {
          const text = await res.text();
          if (text && !text.includes('<!DOCTYPE html>') && text.length > 5) {
            const workbook = XLSX.read(text, { type: 'string' });
            const sheetName = workbook.SheetNames[0];
            if (sheetName) {
              const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
              if (rows && rows.length > 0) {
                rawData[key] = rows;
              }
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch sheet ${name}:`, e);
      }
    }
  }

  return {
    halaqohs: rawData['halaqohs'] || [],
    santris: rawData['santris'] || [],
    attendanceRecords: rawData['attendanceRecords'] || [],
    journalEntries: rawData['journalEntries'] || [],
    prestasiRecords: rawData['prestasiRecords'] || [],
    grades: rawData['grades'] || [],
    settings: rawData['settings'] || [],
    gradeStandards: rawData['gradeStandards'] || [],
    users: rawData['users'] || [],
  };
}

function processRawDataToPayload(raw: any, cleanUrl: string) {
  // Process Halaqohs
  const halaqohs: Halaqoh[] = Array.isArray(raw.halaqohs)
    ? raw.halaqohs.map((k: any) => ({
        id: String(k.id || `kls-${Math.random().toString(36).substring(2, 7)}`),
        name: String(k.nama_kelas || k.nama_halaqoh || k.name || 'Halaqoh'),
        level: (['menengah', 'lanjut', 'tahfizh'].includes(String(k.tingkat || k.level).toLowerCase()) ? String(k.tingkat || k.level).toLowerCase() : 'tahfizh') as ClassLevel,
        waGroupLink: k.link_grup_wa || k.wa_group_link || k.waGroupLink ? String(k.link_grup_wa || k.wa_group_link || k.waGroupLink) : undefined,
        createdAt: String(k.tanggal_dibuat || k.created_at || k.createdAt || new Date().toISOString().split('T')[0]),
      }))
    : [];

  // Process Santris
  const santris: Santri[] = Array.isArray(raw.santris)
    ? raw.santris.map((s: any) => ({
        id: String(s.id || `str-${Math.random().toString(36).substring(2, 7)}`),
        nis: String(s.nis || ''),
        fullName: String(s.nama_lengkap || s.full_name || s.fullName || ''),
        gender: String(s.jenis_kelamin || s.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
        halaqohId: String(s.id_kelas || s.halaqoh_id || s.halaqohId || ''),
        status: (['aktif', 'cuti', 'keluar', 'alumni', 'nonaktif'].includes(String(s.status).toLowerCase())
          ? (String(s.status).toLowerCase() === 'alumni' || String(s.status).toLowerCase() === 'nonaktif' ? 'keluar' : String(s.status).toLowerCase())
          : 'aktif') as StudentStatus,
        parentWa: s.no_wa_ortu || s.parent_wa || s.parentWa ? String(s.no_wa_ortu || s.parent_wa || s.parentWa) : undefined,
        entryDate: String(s.tanggal_masuk || s.entry_date || s.entryDate || s.enrolledAt || new Date().toISOString().split('T')[0]),
        birthPlace: s.tempat_lahir || s.birth_place || s.birthPlace ? String(s.tempat_lahir || s.birth_place || s.birthPlace) : undefined,
        birthDate: s.tanggal_lahir || s.birth_date || s.birthDate ? String(s.tanggal_lahir || s.birth_date || s.birthDate) : undefined,
        fatherName: s.nama_ayah || s.father_name || s.fatherName ? String(s.nama_ayah || s.father_name || s.fatherName) : undefined,
        motherName: s.nama_ibu || s.mother_name || s.motherName ? String(s.nama_ibu || s.mother_name || s.motherName) : undefined,
        fatherJob: s.pekerjaan_ayah || s.father_job || s.fatherJob ? String(s.pekerjaan_ayah || s.father_job || s.fatherJob) : undefined,
        motherJob: s.pekerjaan_ibu || s.mother_job || s.motherJob ? String(s.pekerjaan_ibu || s.mother_job || s.motherJob) : undefined,
      }))
    : [];

  // Process Attendance
  const attendanceRecords: AttendanceRecord[] = Array.isArray(raw.attendanceRecords)
    ? raw.attendanceRecords.map((a: any) => ({
        id: String(a.id || `att-${Math.random().toString(36).substring(2, 7)}`),
        date: String(a.tanggal || a.date || new Date().toISOString().split('T')[0]),
        halaqohId: String(a.id_kelas || a.halaqoh_id || a.halaqohId || ''),
        santriId: String(a.id_santri || a.santri_id || a.santriId || ''),
        status: (['H', 'I', 'S', 'A'].includes(String(a.status_kehadiran || a.status).toUpperCase()) ? String(a.status_kehadiran || a.status).toUpperCase() : 'H') as 'H' | 'I' | 'S' | 'A',
        notes: a.catatan || a.notes || a.note ? String(a.catatan || a.notes || a.note) : undefined,
      }))
    : [];

  // Process Journal Entries
  const journalEntries: JournalEntry[] = Array.isArray(raw.journalEntries)
    ? raw.journalEntries.map((j: any) => ({
        id: String(j.id || `jrn-${Math.random().toString(36).substring(2, 7)}`),
        date: String(j.tanggal || j.date || new Date().toISOString().split('T')[0]),
        halaqohId: String(j.id_kelas || j.halaqoh_id || j.halaqohId || ''),
        material: String(j.materi_pelajaran || j.material || j.materi || ''),
        notesAndEvaluation: String(j.catatan_dan_evaluasi || j.notes_and_evaluation || j.notesAndEvaluation || j.notes || ''),
        teacherName: String(j.nama_pengajar || j.teacher_name || j.teacherName || ''),
      }))
    : [];

  // Process Prestasi
  const prestasiRecords: PrestasiRecord[] = Array.isArray(raw.prestasiRecords)
    ? raw.prestasiRecords.map((p: any) => ({
        id: String(p.id || `prs-${Math.random().toString(36).substring(2, 7)}`),
        date: String(p.tanggal || p.date || new Date().toISOString().split('T')[0]),
        santriId: String(p.id_santri || p.santri_id || p.santriId || ''),
        halaqohId: String(p.id_kelas || p.halaqoh_id || p.halaqohId || ''),
        type: (['tahsin', 'ziyadah', 'murojaah'].includes(String(p.jenis_setoran || p.type).toLowerCase()) ? String(p.jenis_setoran || p.type).toLowerCase() : 'tahsin') as 'tahsin' | 'ziyadah' | 'murojaah',
        tahsinMaterial: p.materi_tahsin || p.tahsin_material || p.tahsinMaterial ? String(p.materi_tahsin || p.tahsin_material || p.tahsinMaterial) : undefined,
        tahsinPageAyat: p.halaman_ayat_tahsin || p.tahsin_page_ayat || p.tahsinPageAyat ? String(p.halaman_ayat_tahsin || p.tahsin_page_ayat || p.tahsinPageAyat) : undefined,
        tahsinGrade: p.nilai_tahsin || p.tahsin_grade || p.tahsinGrade ? String(p.nilai_tahsin || p.tahsin_grade || p.tahsinGrade) : undefined,
        ziyadahJuz: p.juz_ziyadah !== undefined && p.juz_ziyadah !== '' ? Number(p.juz_ziyadah) : (p.ziyadah_juz !== undefined && p.ziyadah_juz !== '' ? Number(p.ziyadah_juz) : (p.ziyadahJuz ? Number(p.ziyadahJuz) : undefined)),
        ziyadahSurah: p.surah_ziyadah || p.ziyadah_surah || p.ziyadahSurah ? String(p.surah_ziyadah || p.ziyadah_surah || p.ziyadahSurah) : undefined,
        ziyadahAyat: p.ayat_ziyadah || p.ziyadah_ayat || p.ziyadahAyat ? String(p.ayat_ziyadah || p.ziyadah_ayat || p.ziyadahAyat) : undefined,
        ziyadahQuality: p.kualitas_ziyadah || p.ziyadah_quality || p.ziyadahQuality ? String(p.kualitas_ziyadah || p.ziyadah_quality || p.ziyadahQuality) : undefined,
        murojaahMaterial: p.materi_murojaah || p.murojaah_material || p.murojaahMaterial ? String(p.materi_murojaah || p.murojaah_material || p.murojaahMaterial) : undefined,
        murojaahAyat: p.ayat_murojaah || p.murojaah_ayat || p.murojaahAyat ? String(p.ayat_murojaah || p.murojaah_ayat || p.murojaahAyat) : undefined,
        murojaahQuality: p.kualitas_murojaah || p.murojaah_quality || p.murojaahQuality ? String(p.kualitas_murojaah || p.murojaah_quality || p.murojaahQuality) : undefined,
        notes: p.catatan || p.notes ? String(p.catatan || p.notes) : undefined,
        status: (p.status as 'lulus' | 'mengulang') || 'lulus',
      }))
    : [];

  // Process Grades
  const grades: GradeRecord[] = Array.isArray(raw.grades)
    ? raw.grades.map((g: any) => ({
        id: String(g.id || `grd-${Math.random().toString(36).substring(2, 7)}`),
        date: String(g.tanggal || g.date || new Date().toISOString().split('T')[0]),
        halaqohId: String(g.id_kelas || g.halaqoh_id || g.halaqohId || ''),
        santriId: String(g.id_santri || g.santri_id || g.santriId || ''),
        assessmentType: ((g.jenis_ujian || g.assessment_type || g.assessmentType) as 'Harian' | 'PTS' | 'PAS') || 'PTS',
        subjectArea: String(g.bidang_studi || g.subject_area || g.subjectArea || 'Tahfizh'),
        methodKitab: String(g.metode_kitab || g.method_kitab || g.methodKitab || "Al-Qur'an"),
        score: Number(g.nilai !== undefined ? g.nilai : g.score) || 0,
      }))
    : [];

  // Process Grade Standards
  const gradeStandards: GradeStandard[] = Array.isArray(raw.gradeStandards)
    ? raw.gradeStandards.map((st: any) => ({
        id: String(st.id || `std-${Math.random().toString(36).substring(2, 7)}`),
        letter: String(st.huruf || st.letter || 'A'),
        predicate: String(st.predikat || st.predicate || 'Baik'),
        description: String(st.keterangan || st.description || ''),
        minScore: Number(st.nilai_minimal !== undefined ? st.nilai_minimal : (st.min_score !== undefined ? st.min_score : st.minScore)) || 0,
      }))
    : [];

  // Process Users
  const users: User[] = Array.isArray(raw.users)
    ? raw.users.map((u: any) => ({
        id: String(u.id || `u-${Math.random().toString(36).substring(2, 7)}`),
        name: String(u.nama_pengguna || u.name || ''),
        nip: u.nip ? String(u.nip) : undefined,
        title: u.jabatan || u.title ? String(u.jabatan || u.title) : undefined,
        role: (String(u.peran || u.role).toLowerCase() as 'admin' | 'guru') || 'guru',
        username: String(u.username || 'user'),
        password: String(u.password || 'password'),
      }))
    : [];

  // Process Settings if provided
  let settings: SchoolSettings | undefined = undefined;
  if (Array.isArray(raw.settings) && raw.settings.length > 0) {
    const cfg = raw.settings[0];
    settings = {
      logoUrl: cfg.url_logo || cfg.logo_url || cfg.logoUrl || '/assets/logo.png',
      foundationLogoUrl: cfg.url_logo_yayasan || cfg.foundation_logo_url || cfg.foundationLogoUrl || '',
      kopUrl: cfg.url_kop || cfg.kop_url || cfg.kopUrl || '',
      foundation: cfg.yayasan || cfg.foundation || '',
      schoolName: cfg.nama_sekolah || cfg.school_name || cfg.schoolName || '',
      accreditation: cfg.akreditasi || cfg.accreditation || '',
      address: cfg.alamat || cfg.address || '',
      city: cfg.kota || cfg.city || '',
      paperSize: ((cfg.ukuran_kertas || cfg.paper_size || cfg.paperSize) as 'A4' | 'F4') || 'A4',
      paperOrientation: ((cfg.orientasi_kertas || cfg.paper_orientation || cfg.paperOrientation) as 'portrait' | 'landscape') || 'portrait',
      academicYear: cfg.tahun_ajaran || cfg.academic_year || cfg.academicYear || '2025/2026',
      headmasterName: cfg.nama_kepala_sekolah || cfg.headmaster_name || cfg.headmasterName || '',
      headmasterNip: cfg.nip_kepala_sekolah || cfg.headmaster_nip || cfg.headmasterNip || '',
      headmasterTitle: cfg.jabatan_kepala_sekolah || cfg.headmaster_title || cfg.headmasterTitle || '',
      gradeMaxScale: Number(cfg.skala_maksimal_nilai || cfg.grade_max_scale || cfg.gradeMaxScale) === 10 ? 10 : 100,
      studentTerm: cfg.istilah_murid || cfg.student_term || cfg.studentTerm || '',
      parentSalutationTerm: cfg.sapaan_ortu || cfg.parent_salutation_term || cfg.parentSalutationTerm || '',
      spreadsheetUrl: cleanUrl,
    };
  }

  return {
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
}

export async function fetchDataFromSpreadsheet(
  url: string
): Promise<{
  success: boolean;
  message: string;
  data?: {
    halaqohs?: Halaqoh[];
    santris?: Santri[];
    attendanceRecords?: AttendanceRecord[];
    journalEntries?: JournalEntry[];
    prestasiRecords?: PrestasiRecord[];
    grades?: GradeRecord[];
    gradeStandards?: GradeStandard[];
    users?: User[];
    settings?: SchoolSettings;
  };
}> {
  if (!url || !(url || '').trim()) {
    return { success: false, message: 'Link spreadsheet belum diisi.' };
  }

  const cleanUrl = (url || '').trim();

  // Mode 1: Google Apps Script Web App Endpoint
  if (cleanUrl.includes('script.google.com/macros/s/')) {
    try {
      const res = await fetch(cleanUrl, { method: 'GET' });
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const result = await res.json();
      if (result && result.status === 'success' && result.data) {
        const payload = processRawDataToPayload(result.data, cleanUrl);
        return {
          success: true,
          message: 'Berhasil menarik data terbaru dari Google Spreadsheet via Apps Script Web App.',
          data: payload,
        };
      } else {
        return {
          success: false,
          message: result?.message || 'Gagal mengambil data dari Google Apps Script Web App.',
        };
      }
    } catch (err: any) {
      console.warn('Error fetching from Google Apps Script:', err);
      return {
        success: false,
        message: 'Gagal terhubung dengan Apps Script Web App. Pastikan Deployment diset ke "Anyone" (Siapa saja).',
      };
    }
  } 
  
  // Mode 2: Direct Google Spreadsheet Link
  if (cleanUrl.includes('docs.google.com/spreadsheets/d/')) {
    const match = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
      return { success: false, message: 'ID Spreadsheet Google tidak valid.' };
    }

    const sheetId = match[1];
    try {
      const raw = await fetchFromGoogleSheetCsv(sheetId);
      const totalRows = Object.values(raw).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
      
      if (totalRows === 0) {
        return {
          success: false,
          message: 'Tidak ada data ditemukan atau Google Spreadsheet belum dibagikan. Pastikan spreadsheet disetting "Siapa saja yang memiliki link dapat melihat" (Anyone with link can view) atau gunakan Apps Script Web App URL.',
        };
      }

      const payload = processRawDataToPayload(raw, cleanUrl);
      return {
        success: true,
        message: `Berhasil menarik data dari Google Spreadsheet (${totalRows} baris data dimuat).`,
        data: payload,
      };
    } catch (err: any) {
      console.warn('Error fetching CSV from Google Spreadsheet:', err);
      return {
        success: false,
        message: 'Gagal menarik data dari Google Spreadsheet. Pastikan akses spreadsheet diset "Siapa saja dengan link".',
      };
    }
  }

  return {
    success: false,
    message: 'Format URL tidak dikenali. Gunakan URL Google Spreadsheet (docs.google.com/...) atau Apps Script Web App (script.google.com/...).',
  };
}

export async function syncDatabaseToSpreadsheet(
  url: string,
  payload: {
    type?: string;
    settings?: SchoolSettings;
    halaqohs?: Halaqoh[];
    santris?: Santri[];
    attendanceRecords?: AttendanceRecord[];
    journalEntries?: JournalEntry[];
    prestasiRecords?: PrestasiRecord[];
    grades?: GradeRecord[];
    gradeStandards?: GradeStandard[];
    users?: User[];
  }
): Promise<{ success: boolean; message: string }> {
  if (!url || !(url || '').trim()) {
    return { success: false, message: 'Link spreadsheet belum diisi.' };
  }

  const cleanUrl = (url || '').trim();

  // Extract spreadsheetId if it's a direct Google Spreadsheet link
  let spreadsheetId: string | null = null;
  if (cleanUrl.includes('docs.google.com/spreadsheets')) {
    const match = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      spreadsheetId = match[1];
    }
  }

  // Determine target script endpoint
  let targetScriptUrl = cleanUrl;
  if (spreadsheetId && !cleanUrl.includes('script.google.com')) {
    const storedScript = payload.settings?.appsScriptUrl || localStorage.getItem('aqu_apps_script_url');
    if (storedScript && storedScript.includes('script.google.com')) {
      targetScriptUrl = storedScript;
    }
  }

  const payloadData = {
    timestamp: new Date().toISOString(),
    action: payload.type || 'sync_full',
    spreadsheetId: spreadsheetId || undefined,
    data: payload,
  };

  if (targetScriptUrl.includes('script.google.com') || targetScriptUrl.includes('macros/s/')) {
    try {
      await fetch(targetScriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script web app standard mode for cross-origin POST
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payloadData),
      });

      return {
        success: true,
        message: 'Data aplikasi berhasil dikirim & disinkronkan ke Google Spreadsheet via Web App!',
      };
    } catch (err: any) {
      console.warn('Network issue syncing to Google Apps Script:', err);
      return {
        success: false,
        message: 'Gagal terhubung ke Google Apps Script: ' + (err?.message || String(err)),
      };
    }
  } else if (spreadsheetId) {
    // Direct Google Spreadsheet URL provided without a separate Apps Script Web App URL
    return {
      success: false,
      message: 'Gagal Mengirim Data: Link yang Anda tempel adalah Link Dokumen Google Sheets (docs.google.com). Karena aturan keamanan Google, browser tidak bisa menulis data langsung ke dokumen spreadsheet tanpa Web App Apps Script. Silakan pasang Apps Script sesuai panduan di sebelah kanan dan isi "Link Web App Apps Script" (https://script.google.com/macros/s/...) agar pengiriman data otomatis berhasil.',
    };
  } else {
    return {
      success: false,
      message: 'Format URL tidak dikenali. Silakan masukkan Link Google Spreadsheet atau Link Web App Apps Script yang valid.',
    };
  }
}
