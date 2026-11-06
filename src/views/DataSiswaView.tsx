import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Santri, Halaqoh, StudentStatus, Gender, SchoolSettings } from '../types';
import { getStudentTerm } from '../lib/studentTerm';
import { generateCleanId } from '../lib/idUtils';
import {
  Users,
  UserPlus,
  FileSpreadsheet,
  Search,
  Edit,
  Trash2,
  X,
  Save,
  Download,
  Upload,
  Calendar,
  CheckCircle2,
  Phone,
  Filter,
  Table,
  Info,
  FileText,
} from 'lucide-react';

interface DataSiswaViewProps {
  santris: Santri[];
  halaqohs: Halaqoh[];
  settings?: SchoolSettings;
  onSaveSantri: (santri: Santri) => void;
  onDeleteSantri: (id: string) => void;
  onImportSantris: (newSantris: Santri[]) => void;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  santris,
  halaqohs,
  settings,
  onSaveSantri,
  onDeleteSantri,
  onImportSantris,
}) => {
  const term = getStudentTerm(settings);
  // Filters & Search
  const [selectedHalaqohId, setSelectedHalaqohId] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State (3.1.1 - 3.1.12)
  const [halaqohId, setHalaqohId] = useState('');
  const [fullName, setFullName] = useState('');
  const [nis, setNis] = useState('');
  const [gender, setGender] = useState<Gender>('L');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [status, setStatus] = useState<StudentStatus>('aktif');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [fatherJob, setFatherJob] = useState('');
  const [motherJob, setMotherJob] = useState('');
  const [parentWa, setParentWa] = useState('');

  // Open Form Modal for New Santri
  const handleOpenAddModal = () => {
    setEditingId(null);
    setHalaqohId(halaqohs[0]?.id || '');
    setFullName('');
    setNis('');
    setGender('L');
    setBirthPlace('');
    setBirthDate('2012-01-01');
    setStatus('aktif');
    setFatherName('');
    setMotherName('');
    setFatherJob('');
    setMotherJob('');
    setParentWa('');
    setIsFormModalOpen(true);
  };

  // Open Form Modal for Edit Santri
  const handleOpenEditModal = (s: Santri) => {
    setEditingId(s.id);
    setHalaqohId(s.halaqohId);
    setFullName(s.fullName);
    setNis(s.nis);
    setGender(s.gender);
    setBirthPlace(s.birthPlace);
    setBirthDate(s.birthDate);
    setStatus(s.status);
    setFatherName(s.fatherName);
    setMotherName(s.motherName);
    setFatherJob(s.fatherJob);
    setMotherJob(s.motherJob);
    setParentWa(s.parentWa);
    setIsFormModalOpen(true);
  };

  // 3.1.13 Simpan Data Santri
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(fullName || '').trim() || !halaqohId) return;

    const santriData: Santri = {
      id: editingId || generateCleanId('snt', santris),
      halaqohId,
      fullName: (fullName || '').trim(),
      nis: (nis || '').trim(),
      gender,
      birthPlace: (birthPlace || '').trim(),
      birthDate,
      status,
      entryDate: editingId
        ? santris.find((s) => s.id === editingId)?.entryDate || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      fatherName: (fatherName || '').trim(),
      motherName: (motherName || '').trim(),
      fatherJob: (fatherJob || '').trim(),
      motherJob: (motherJob || '').trim(),
      parentWa: (parentWa || '').trim(),
    };

    onSaveSantri(santriData);
    setIsFormModalOpen(false);
  };

  // Filtered Santris
  const filteredSantris = (santris || []).filter((s) => {
    const matchesHalaqoh = selectedHalaqohId === 'semua' || s.halaqohId === selectedHalaqohId;
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.fatherName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesHalaqoh && matchesSearch;
  });

  // 3.2.1 & 3.2.2 Template Downloads
  const downloadCsvTemplate = () => {
    const headers = [
      'HalaqohID',
      'NamaLengkap',
      'NIS',
      'JenisKelamin(L/P)',
      'TempatLahir',
      'TanggalLahir(YYYY-MM-DD)',
      'Status(aktif/cuti/keluar)',
      'NamaAyah',
      'NamaIbu',
      'PekerjaanAyah',
      'PekerjaanIbu',
      'NoWAOrangTua',
    ];

    const sampleRow = [
      halaqohs[0]?.id || 'hlq-1',
      'Ahmad Zaky Al-Mubarok',
      '2025099',
      'L',
      'Bandung',
      '2012-04-10',
      'aktif',
      'Ahmad Ridwan',
      'Nur Aini',
      'Wiraswasta',
      'Ibu Rumah Tangga',
      '081234567890',
    ];

    const csvText = '\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Template_Data_Siswa_AQU.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const downloadXlsxTemplate = () => {
    const wb = XLSX.utils.book_new();
    const headers = [
      'HalaqohID',
      'NamaLengkap',
      'NIS',
      'JenisKelamin(L/P)',
      'TempatLahir',
      'TanggalLahir(YYYY-MM-DD)',
      'Status(aktif/cuti/keluar)',
      'NamaAyah',
      'NamaIbu',
      'PekerjaanAyah',
      'PekerjaanIbu',
      'NoWAOrangTua',
    ];

    const sampleRows = [
      [
        halaqohs[0]?.id || 'hlq-1',
        'Ahmad Zaky Al-Mubarok',
        '2025099',
        'L',
        'Bandung',
        '2012-04-10',
        'aktif',
        'Ahmad Ridwan',
        'Nur Aini',
        'Wiraswasta',
        'Ibu Rumah Tangga',
        '081234567890',
      ],
      [
        halaqohs[0]?.id || 'hlq-1',
        'Aisyah Humaira',
        '2025100',
        'P',
        'Jakarta',
        '2013-08-15',
        'aktif',
        'Budi Santoso',
        'Siti Fatimah',
        'PNS',
        'Guru',
        '081987654321',
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 28 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 22 },
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data_Santri');

    const fileName = 'Template_Data_Siswa_AQU.xlsx';
    try {
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      console.error('Error writing XLSX template:', err);
      XLSX.writeFile(wb, fileName);
    }
  };

  // Handle File Selection/Import (CSV or XLSX)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        alert('File spreadsheet kosong!');
        return;
      }

      // Find sheet (first sheet or sheet containing 'santri' / 'siswa')
      let selectedSheetName = workbook.SheetNames[0];
      const matchSheet = workbook.SheetNames.find((name) =>
        /santri|siswa/i.test(name)
      );
      if (matchSheet) {
        selectedSheetName = matchSheet;
      }

      const worksheet = workbook.Sheets[selectedSheetName];
      if (!worksheet) {
        alert('Tidak dapat membaca lembar kerja!');
        return;
      }

      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      if (!rawRows || rawRows.length === 0) {
        alert('File kosong atau format data tidak sesuai!');
        return;
      }

      const imported: Santri[] = [];

      rawRows.forEach((row, idx) => {
        if (!row || typeof row !== 'object') return;

        // Flexible key matching
        const fullName = String(
          row.NamaLengkap || row.fullName || row.nama || row.Nama || row['Nama Lengkap'] || row.Name || ''
        ).trim();

        const nis = String(
          row.NIS || row.nis || row.Nis || row['No Induk'] || ''
        ).trim();

        if (!fullName && !nis) return;

        const halaqohId = String(
          row.HalaqohID || row.halaqohId || row.IDKelas || row['ID Kelas'] || row['Halaqoh ID'] || halaqohs[0]?.id || 'hlq-1'
        ).trim();

        const genderRaw = String(
          row['JenisKelamin(L/P)'] || row.JenisKelamin || row.gender || row.JK || row['Jenis Kelamin'] || 'L'
        ).toUpperCase().trim();
        const gender: Gender = genderRaw.startsWith('P') || genderRaw === 'PEREMPUAN' || genderRaw === 'FEMALE' ? 'P' : 'L';

        const statusRaw = String(
          row['Status(aktif/cuti/keluar)'] || row.Status || row.status || 'aktif'
        ).toLowerCase().trim();
        const status: StudentStatus = (['aktif', 'cuti', 'keluar', 'alumni', 'nonaktif'].includes(statusRaw)
          ? (statusRaw === 'alumni' || statusRaw === 'nonaktif' ? 'keluar' : statusRaw)
          : 'aktif') as StudentStatus;

        const birthPlace = String(
          row.TempatLahir || row.birthPlace || row['Tempat Lahir'] || ''
        ).trim();

        const birthDate = String(
          row['TanggalLahir(YYYY-MM-DD)'] || row.TanggalLahir || row.birthDate || row['Tanggal Lahir'] || '2012-01-01'
        ).trim();

        const fatherName = String(
          row.NamaAyah || row.fatherName || row['Nama Ayah'] || ''
        ).trim();

        const motherName = String(
          row.NamaIbu || row.motherName || row['Nama Ibu'] || ''
        ).trim();

        const fatherJob = String(
          row.PekerjaanAyah || row.fatherJob || row['Pekerjaan Ayah'] || ''
        ).trim();

        const motherJob = String(
          row.PekerjaanIbu || row.motherJob || row['Pekerjaan Ibu'] || ''
        ).trim();

        const parentWa = String(
          row.NoWAOrangTua || row.parentWa || row.WAParent || row.WaOrtu || row['WA Ortu'] || row['No WA'] || ''
        ).trim();

        imported.push({
          id: generateCleanId('snt', [...santris, ...imported], idx),
          halaqohId,
          fullName: fullName || `Santri ${idx + 1}`,
          nis: nis || `2025${100 + idx}`,
          gender,
          birthPlace,
          birthDate,
          status,
          entryDate: new Date().toISOString().split('T')[0],
          fatherName,
          motherName,
          fatherJob,
          motherJob,
          parentWa,
        });
      });

      if (imported.length > 0) {
        onImportSantris(imported);
        alert(`Berhasil mengimpor ${imported.length} data ${term}!`);
        setIsImportModalOpen(false);
      } else {
        alert('Gagal membaca data dari file. Pastikan nama kolom header sesuai template.');
      }
    } catch (err: any) {
      console.error('Error importing santri file:', err);
      alert(`Terjadi kesalahan saat membaca file: ${err?.message || String(err)}`);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">Data {term}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {term} Terdaftar:{' '}
            <span className="font-bold text-emerald-700">{santris.length} Peserta</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-import-santri"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Import Massal</span>
          </button>

          <button
            id="btn-add-santri"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 custom-theme-btn font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah {term} Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* 3.4 Dropdown Pilihan Kelas */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <label className="text-xs text-slate-600 font-semibold shrink-0">Filter Kelas:</label>
          <select
            id="filter-halaqoh"
            value={selectedHalaqohId}
            onChange={(e) => setSelectedHalaqohId(e.target.value)}
            className="w-full md:w-64 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="semua">Semua Kelas / Halaqoh ({(santris || []).length})</option>
            {(halaqohs || []).map((h) => {
              const count = (santris || []).filter((s) => s.halaqohId === h.id).length;
              return (
                <option key={h.id} value={h.id}>
                  {h.name} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* 3.3 Tombol / Field Cari Nama Santri */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-santri"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIS, atau ayah..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* 3.4 Table / List Displaying Santris */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Santri & NIS</th>
                <th className="px-4 py-3">Kelas / Halaqoh</th>
                <th className="px-4 py-3">J. Kelamin</th>
                <th className="px-4 py-3">Tanggal Masuk</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Orang Tua / WA</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSantris.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 italic">
                    Tidak ada data santri ditemukan.
                  </td>
                </tr>
              ) : (
                filteredSantris.map((s, idx) => {
                  const hlq = halaqohs.find((h) => h.id === s.halaqohId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 text-sm">{s.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{s.id}</span>
                          {s.nis && <span>NIS: {s.nis}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                          {hlq?.name || 'Tanpa Kelas'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold ${
                            s.gender === 'L'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-pink-50 text-pink-700 border border-pink-200'
                          }`}
                        >
                          {s.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono">{s.entryDate}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`capitalize px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            s.status === 'aktif'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : s.status === 'cuti'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{s.fatherName || s.motherName || '-'}</div>
                        {s.parentWa && (
                          <a
                            href={`https://wa.me/${s.parentWa.replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-600 hover:underline"
                          >
                            <Phone className="w-3 h-3" /> {s.parentWa}
                          </a>
                        )}
                      </td>
                      {/* Edit & Delete Buttons */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Santri"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin hapus data santri "${s.fullName}"?`)) {
                                onDeleteSantri(s.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Santri"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.1 Modal Form Tambah / Edit Santri */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>{editingId ? 'Edit Data Santri' : 'Tambah Peserta Baru'}</span>
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3.1.1 Dropdown Kelas / Halaqoh */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas / Halaqoh <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={halaqohId}
                    onChange={(e) => setHalaqohId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  >
                    <option value="" disabled>Pilih Halaqoh...</option>
                    {halaqohs.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                {/* 3.1.2 Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama santri"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>

                {/* 3.1.3 NIS */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIS</label>
                  <input
                    type="text"
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Nomor Induk Santri"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3.1.4 Dropdown Jenis Kelamin */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jenis Kelamin <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    required
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                {/* 3.1.5 Tempat Lahir */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tempat Lahir</label>
                  <input
                    type="text"
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Kota tempat lahir"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3.1.6 Tanggal Lahir (kalender) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lahir</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3.1.7 Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Santri</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as StudentStatus)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="cuti">Cuti</option>
                    <option value="keluar">Keluar</option>
                  </select>
                </div>

                {/* 3.1.8 Nama Ayah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ayah</label>
                  <input
                    type="text"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Nama ayah kandung"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3.1.9 Nama Ibu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Ibu</label>
                  <input
                    type="text"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Nama ibu kandung"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3.1.10 Pekerjaan Ayah */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pekerjaan Ayah</label>
                  <input
                    type="text"
                    value={fatherJob}
                    onChange={(e) => setFatherJob(e.target.value)}
                    placeholder="Pekerjaan ayah"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3.1.11 Pekerjaan Ibu */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pekerjaan Ibu</label>
                  <input
                    type="text"
                    value={motherJob}
                    onChange={(e) => setMotherJob(e.target.value)}
                    placeholder="Pekerjaan ibu"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3.1.12 No. WA Orang Tua */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">No. WA Orang Tua</label>
                  <input
                    type="text"
                    value={parentWa}
                    onChange={(e) => setParentWa(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 3.1.13 Tombol Simpan Data Santri */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 custom-theme-btn text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Data Santri</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.2 Modal Import Massal Data */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200 my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Import Massal Data {term}</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <p className="text-xs text-slate-600 leading-relaxed">
                Unduh template format data {term} terlebih dahulu, isi data sesuai kolom yang ditentukan, lalu unggah file Excel (.xlsx) atau CSV (.csv) ke dalam aplikasi.
              </p>

              {/* 3.2.1 & 3.2.2 Download Template Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={downloadXlsxTemplate}
                  className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer group shadow-2xs"
                >
                  <Download className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Download Template Excel (.xlsx)</div>
                    <div className="text-[10px] text-emerald-700 font-medium">Format Microsoft Excel resmi</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer group"
                >
                  <Download className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Download Template CSV (.csv)</div>
                    <div className="text-[10px] text-slate-500">Format teks CSV standar</div>
                  </div>
                </button>
              </div>

              {/* 3.2.3 Kartu Contoh Format Excel yang Benar */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span>Contoh Format Excel / CSV yang Benar</span>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                    Baris 1 = Header Kolom
                  </span>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">HalaqohID</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">NamaLengkap</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">NIS</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">JenisKelamin(L/P)</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">TempatLahir</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">TanggalLahir</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">Status</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">NamaAyah</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">NamaIbu</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">PekerjaanAyah</th>
                        <th className="p-2 border-r border-slate-200 whitespace-nowrap">PekerjaanIbu</th>
                        <th className="p-2 whitespace-nowrap">NoWAOrangTua</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-2 border-r border-slate-200 font-mono text-[10px] text-emerald-700 font-semibold">{halaqohs[0]?.id || 'hlq-1'}</td>
                        <td className="p-2 border-r border-slate-200 font-medium text-slate-800">Ahmad Zaky Al-Mubarok</td>
                        <td className="p-2 border-r border-slate-200 font-mono">2025099</td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-600">L</td>
                        <td className="p-2 border-r border-slate-200">Bandung</td>
                        <td className="p-2 border-r border-slate-200 font-mono">2012-04-10</td>
                        <td className="p-2 border-r border-slate-200 text-emerald-600 font-semibold">aktif</td>
                        <td className="p-2 border-r border-slate-200">Ahmad Ridwan</td>
                        <td className="p-2 border-r border-slate-200">Nur Aini</td>
                        <td className="p-2 border-r border-slate-200">Wiraswasta</td>
                        <td className="p-2 border-r border-slate-200">Ibu Rumah Tangga</td>
                        <td className="p-2 font-mono">081234567890</td>
                      </tr>
                      <tr className="hover:bg-slate-50/80">
                        <td className="p-2 border-r border-slate-200 font-mono text-[10px] text-emerald-700 font-semibold">{halaqohs[0]?.id || 'hlq-1'}</td>
                        <td className="p-2 border-r border-slate-200 font-medium text-slate-800">Aisyah Humaira</td>
                        <td className="p-2 border-r border-slate-200 font-mono">2025100</td>
                        <td className="p-2 border-r border-slate-200 text-center font-bold text-pink-600">P</td>
                        <td className="p-2 border-r border-slate-200">Jakarta</td>
                        <td className="p-2 border-r border-slate-200 font-mono">2013-08-15</td>
                        <td className="p-2 border-r border-slate-200 text-emerald-600 font-semibold">aktif</td>
                        <td className="p-2 border-r border-slate-200">Budi Santoso</td>
                        <td className="p-2 border-r border-slate-200">Siti Fatimah</td>
                        <td className="p-2 border-r border-slate-200">PNS</td>
                        <td className="p-2 border-r border-slate-200">Guru</td>
                        <td className="p-2 font-mono">081987654321</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-[11px] text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Gunakan <strong>HalaqohID</strong> yang sesuai (misal ID kelas/halaqoh di aplikasi).</li>
                    <li>Kolom <strong>JenisKelamin</strong> diisi <code className="bg-amber-100 px-1 rounded">L</code> (Laki-laki) atau <code className="bg-amber-100 px-1 rounded">P</code> (Perempuan).</li>
                    <li>Kolom <strong>Status</strong> diisi <code className="bg-amber-100 px-1 rounded">aktif</code>, <code className="bg-amber-100 px-1 rounded">cuti</code>, atau <code className="bg-amber-100 px-1 rounded">keluar</code>.</li>
                  </ul>
                </div>
              </div>

              {/* 3.2.4 Tombol Upload / Drag-and-Drop */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 hover:bg-emerald-50/30">
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800 mb-1">Pilih File Excel / CSV Data {term}</p>
                <p className="text-[11px] text-slate-500 mb-4">Mendukung format file <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong></p>
                <input
                  id="excel-csv-file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv, .txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="excel-csv-file-input"
                  className="inline-flex items-center gap-2 px-5 py-2.5 custom-theme-btn text-xs font-bold rounded-xl cursor-pointer shadow-md hover:scale-105 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Dari Komputer</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
