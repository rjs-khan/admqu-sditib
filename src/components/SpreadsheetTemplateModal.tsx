import React, { useState } from 'react';
import { Database, Copy, Check, X, Sheet } from 'lucide-react';

interface SpreadsheetTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpreadsheetTemplateModal: React.FC<SpreadsheetTemplateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedSheet, setCopiedSheet] = useState<string | null>(null);

  if (!isOpen) return null;

  const sheetsData = [
    {
      name: '1. Data_Kelas',
      headers: ['id', 'name', 'level', 'waGroupLink', 'createdAt'],
      rows: [
        ['kls-001', 'Halaqoh Al-Fatihah', 'Tahfizh', 'https://chat.whatsapp.com/sample1', '2025-01-01'],
        ['kls-002', 'Halaqoh An-Nur', 'Lanjut', 'https://chat.whatsapp.com/sample2', '2025-01-01'],
      ],
    },
    {
      name: '2. Data_Santri',
      headers: ['id', 'nis', 'fullName', 'gender', 'halaqohId', 'status', 'parentWa', 'enrolledAt'],
      rows: [
        ['str-001', '2025001', 'Ahmad Zaki Al-Farisi', 'L', 'kls-001', 'aktif', '081234567890', '2025-01-10'],
        ['str-002', '2025002', 'Fatimah Az-Zahra', 'P', 'kls-001', 'aktif', '081987654321', '2025-01-10'],
      ],
    },
    {
      name: '3. Data_Presensi',
      headers: ['id', 'date', 'halaqohId', 'santriId', 'status', 'note'],
      rows: [
        ['att-001', '2025-02-01', 'kls-001', 'str-001', 'H', 'Hadir tepat waktu'],
        ['att-002', '2025-02-01', 'kls-001', 'str-002', 'I', 'Izin acara keluarga'],
      ],
    },
    {
      name: '4. Data_Jurnal_Mengajar',
      headers: ['id', 'date', 'halaqohId', 'teacherId', 'teacherName', 'materi', 'tahfizhClassMaterial', 'absentSummary', 'notes'],
      rows: [
        ['jrn-001', '2025-02-01', 'kls-001', 'u-admin', 'Ustadz Abdullah, M.Ag.', 'Tajwid Mad Thabi\'i', 'Surah Al-Mulk ayat 1-10', 'H: 14, I: 1, S: 0, A: 0', 'Santri antusias'],
      ],
    },
    {
      name: '5. Data_Kartu_Prestasi',
      headers: ['id', 'date', 'santriId', 'halaqohId', 'type', 'tahsinMaterial', 'tahsinPageAyat', 'tahsinGrade', 'ziyadahJuz', 'ziyadahSurah', 'ziyadahAyat', 'ziyadahQuality', 'murojaahMaterial', 'murojaahQuality', 'notes', 'status'],
      rows: [
        ['prs-001', '2025-02-01', 'str-001', 'kls-001', 'tahsin', 'Jilid 4 Hal 12', 'Hal 12', 'Mumtaz (Lancar)', '', '', '', '', '', '', 'Bagus', 'lulus'],
        ['prs-002', '2025-02-01', 'str-001', 'kls-001', 'ziyadah', '', '', '', '30', 'An-Naba', '1-20', 'Jayyid (Lancar)', '', '', 'Lancar tanpa keliru', 'lulus'],
      ],
    },
    {
      name: '6. Data_Nilai_Siswa',
      headers: ['id', 'date', 'halaqohId', 'santriId', 'assessmentType', 'subjectArea', 'methodKitab', 'score'],
      rows: [
        ['grd-001', '2025-02-15', 'kls-001', 'str-001', 'PTS', 'Tahsin', 'Al-Qur\'an', '95'],
        ['grd-002', '2025-02-15', 'kls-001', 'str-002', 'PTS', 'Tahsin', 'Al-Qur\'an', '88'],
      ],
    },
    {
      name: '7. Data_Pengaturan_Sekolah',
      headers: ['logoUrl', 'kopUrl', 'foundation', 'schoolName', 'accreditation', 'address', 'city', 'paperSize', 'paperOrientation', 'academicYear', 'headmasterName', 'headmasterNip', 'headmasterTitle', 'gradeMaxScale'],
      rows: [
        ['/assets/logo.png', '', 'Yayasan Bina Insani Qur\'ani', 'SMP IT & Mahad Tahfizh AQU', 'Terakreditasi A', 'Jl. Pendidikan No. 123', 'Bandung', 'A4', 'portrait', '2025/2026', 'Dr. H. Muhammad Ridwan, M.A.', '19780512 200312 1 002', 'Kepala Sekolah', '100'],
      ],
    },
    {
      name: '8. Data_Standar_Nilai',
      headers: ['id', 'letter', 'predicate', 'description', 'minScore'],
      rows: [
        ['std-001', 'A+', 'Mumtaz', 'Sangat Baik Sekali / Perfect', '90'],
        ['std-002', 'A', 'Jayyid Jiddan', 'Baik Sekali / Sangat Lancar', '80'],
        ['std-003', 'B+', 'Jayyid', 'Baik / Lancar', '70'],
        ['std-004', 'B', 'Maqbul', 'Cukup / Perlu Pengulangan', '60'],
        ['std-005', 'C', 'Rasib', 'Kurang / Mengulang', '0'],
      ],
    },
    {
      name: '9. Data_Pengguna_User',
      headers: ['id', 'name', 'nip', 'title', 'role', 'username', 'password'],
      rows: [
        ['u-admin', 'Ustadz Abdullah, M.Ag.', '19850101 201001 1 001', 'Kepala Pengajar Tahfizh', 'admin', 'admin', 'admin123'],
        ['u-guru1', 'Ustadzah Siti Aminah, S.Pd.I', '19900315 201502 2 003', 'Guru Tahsin', 'guru', 'guru', 'guru123'],
      ],
    },
  ];

  const handleCopyMarkdown = (sheetName: string, headers: string[], rows: string[][]) => {
    let md = `### Table: ${sheetName}\n\n`;
    md += `| ${headers.join(' | ')} |\n`;
    md += `| ${headers.map(() => '---').join(' | ')} |\n`;
    rows.forEach((r) => {
      md += `| ${r.join(' | ')} |\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedSheet(sheetName);
    setTimeout(() => setCopiedSheet(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Struktur Database Google Sheets & Apps Script</h3>
              <p className="text-xs text-slate-500">Header tabel spreadsheet yang siap di-copy ke Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            <p className="font-bold mb-1">💡 Panduan Integrasi Google Sheets + Google Apps Script:</p>
            <p>
              Buatlah spreadsheet baru di Google Drive Anda, lalu buat sheet (tab) sesuai nama di bawah ini dan isi baris pertama (header) sesuai kolom yang tersedia. Seluruh data aplikasi AQU siap terhubung dengan Google Apps Script Web App Endpoint.
            </p>
          </div>

          <div className="space-y-6">
            {sheetsData.map((sheet) => (
              <div key={sheet.name} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-2">
                    <Sheet className="w-4 h-4" />
                    <span>{sheet.name}</span>
                  </span>
                  <button
                    onClick={() => handleCopyMarkdown(sheet.name, sheet.headers, sheet.rows)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-300 rounded-lg transition-colors cursor-pointer"
                  >
                    {copiedSheet === sheet.name ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Copied Markdown!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Header Markdown</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-[11px] text-slate-700 font-mono">
                    <thead className="bg-white text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        {sheet.headers.map((h) => (
                          <th key={h} className="px-3 py-2 border-r border-slate-200 last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {sheet.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 text-slate-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
