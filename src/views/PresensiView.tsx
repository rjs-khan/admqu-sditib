import React, { useState, useEffect } from 'react';
import {
  AttendanceRecord,
  Halaqoh,
  Santri,
  AttendanceStatus,
  SchoolSettings,
} from '../types';
import { getStudentTerm, getStudentTermLower } from '../lib/studentTerm';
import {
  CalendarCheck2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Save,
  CheckCheck,
  Info,
  Clock,
  UserX,
  AlertTriangle,
  HeartPulse,
} from 'lucide-react';

interface PresensiViewProps {
  attendanceRecords: AttendanceRecord[];
  halaqohs: Halaqoh[];
  santris: Santri[];
  settings?: SchoolSettings;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
}

export const PresensiView: React.FC<PresensiViewProps> = ({
  attendanceRecords,
  halaqohs,
  santris,
  settings,
  onSaveAttendance,
}) => {
  const studentTerm = getStudentTerm(settings);
  const studentTermLower = getStudentTermLower(settings);
  // 4.1 Tanggal (otomatis menampilkan kalender bulan defaulting to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // 4.2 Dropdown halaqoh
  const [selectedHalaqohId, setSelectedHalaqohId] = useState<string>(
    halaqohs[0]?.id || ''
  );

  // Local state for temporary attendance toggles
  const [localAttendance, setLocalAttendance] = useState<
    Record<string, { status: AttendanceStatus; notes?: string }>
  >({});

  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Active students in selected halaqoh
  const currentStudents = (santris || []).filter(
    (s) => s.halaqohId === selectedHalaqohId && s.status === 'aktif'
  );

  // Load existing records whenever date or halaqoh changes
  useEffect(() => {
    const existing = (attendanceRecords || []).filter(
      (r) => r.date === selectedDate && r.halaqohId === selectedHalaqohId
    );

    const map: Record<string, { status: AttendanceStatus; notes?: string }> = {};
    currentStudents.forEach((s) => {
      const rec = existing.find((r) => r.santriId === s.id);
      map[s.id] = {
        status: rec ? rec.status : 'H', // default Hadir
        notes: rec?.notes || '',
      };
    });
    setLocalAttendance(map);
  }, [selectedDate, selectedHalaqohId, attendanceRecords, santris]);

  // 4.2.1 Pilihan tandai semua: hadir, izin, sakit, alpha, telat
  const handleMarkAll = (status: AttendanceStatus) => {
    const updated = { ...localAttendance };
    currentStudents.forEach((s) => {
      updated[s.id] = {
        ...updated[s.id],
        status,
      };
    });
    setLocalAttendance(updated);
  };

  const handleIndividualChange = (
    santriId: string,
    status: AttendanceStatus
  ) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        status,
      },
    }));
  };

  const handleNotesChange = (santriId: string, notes: string) => {
    setLocalAttendance((prev) => ({
      ...prev,
      [santriId]: {
        ...prev[santriId],
        notes,
      },
    }));
  };

  // 4.2.2 Calculation of counts
  const totalCount = currentStudents.length;
  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alphaCount = 0;
  let telatCount = 0;

  currentStudents.forEach((s) => {
    const st = localAttendance[s.id]?.status;
    if (st === 'H') hadirCount++;
    else if (st === 'I') izinCount++;
    else if (st === 'S') sakitCount++;
    else if (st === 'A') alphaCount++;
    else if (st === 'T') telatCount++;
  });

  const checkedCount = totalCount; // all loaded defaulted or updated

  // 4.2.5 Tombol Simpan Presensi
  const handleSave = () => {
    const recordsToSave: AttendanceRecord[] = currentStudents.map((s) => ({
      id: `att-${selectedDate}-${s.id}`,
      date: selectedDate,
      halaqohId: selectedHalaqohId,
      santriId: s.id,
      status: localAttendance[s.id]?.status || 'H',
      notes: localAttendance[s.id]?.notes || '',
    }));

    onSaveAttendance(recordsToSave);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Presensi Harian {studentTerm}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kelola daftar hadir, izin, sakit, alpha, dan keterlambatan halaqoh
            </p>
          </div>
        </div>

        {/* 4.2.5 Tombol Simpan Presensi */}
        <button
          id="btn-save-presensi"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 custom-theme-btn font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Presensi</span>
        </button>
      </div>

      {/* Date & Halaqoh Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        {/* 4.1 Tanggal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>Pilih Tanggal Presensi:</span>
          </label>
          <input
            id="presensi-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 4.2 Dropdown Halaqoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pilih Kelas / Halaqoh:</span>
          </label>
          <select
            id="presensi-halaqoh"
            value={selectedHalaqohId}
            onChange={(e) => setSelectedHalaqohId(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            {halaqohs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isSavedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCheck className="w-5 h-5 text-emerald-600" />
          <span>Presensi berhasil disimpan ke dalam sistem!</span>
        </div>
      )}

      {/* Controls & Counts when halaqoh selected */}
      {selectedHalaqohId && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          
          {/* 4.2.1 Pilihan Tandai Semua */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Tandai Semua Peserta Sebagai:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('H')}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Hadir (H)
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('I')}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Izin (I)
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('S')}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Sakit (S)
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('A')}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Alpha (A)
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('T')}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Telat (T)
              </button>
            </div>
          </div>

          {/* 4.2.2 Informasi Sudah Dicek X dari Y Peserta */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
            <div className="text-xs font-bold text-slate-700 mb-2">
              Status Presensi: Sudah dicek <span className="text-emerald-700">{checkedCount}</span> dari{' '}
              <span className="text-slate-900">{totalCount}</span> peserta.
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold flex items-center justify-between">
                <span>Hadir (H):</span>
                <span className="font-bold text-sm">{hadirCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-semibold flex items-center justify-between">
                <span>Izin (I):</span>
                <span className="font-bold text-sm">{izinCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-semibold flex items-center justify-between">
                <span>Sakit (S):</span>
                <span className="font-bold text-sm">{sakitCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center justify-between">
                <span>Alpha (A):</span>
                <span className="font-bold text-sm">{alphaCount}</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-semibold flex items-center justify-between">
                <span>Telat (T):</span>
                <span className="font-bold text-sm">{telatCount}</span>
              </div>
            </div>
          </div>

          {/* 4.2.3 Table No, Nama Lengkap, Status Kehadiran */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">No</th>
                  <th className="px-4 py-3">Nama Lengkap & NIS</th>
                  <th className="px-4 py-3 text-center">Status Kehadiran (H / I / S / A / T)</th>
                  <th className="px-4 py-3">Keterangan Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-400 italic">
                      Tidak ada santri di halaqoh ini.
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((s, idx) => {
                    const st = localAttendance[s.id]?.status || 'H';
                    const note = localAttendance[s.id]?.notes || '';

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800 text-sm">{s.fullName}</div>
                          <div className="text-[11px] text-slate-400">NIS: {s.nis}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {[
                              { label: 'H', value: 'H' as AttendanceStatus, bg: 'bg-emerald-600 text-white' },
                              { label: 'I', value: 'I' as AttendanceStatus, bg: 'bg-blue-600 text-white' },
                              { label: 'S', value: 'S' as AttendanceStatus, bg: 'bg-purple-600 text-white' },
                              { label: 'A', value: 'A' as AttendanceStatus, bg: 'bg-rose-600 text-white' },
                              { label: 'T', value: 'T' as AttendanceStatus, bg: 'bg-amber-600 text-white' },
                            ].map((btn) => {
                              const isSelected = st === btn.value;
                              return (
                                <button
                                  key={btn.value}
                                  type="button"
                                  onClick={() => handleIndividualChange(s.id, btn.value)}
                                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                    isSelected
                                      ? `${btn.bg} shadow-xs scale-105 ring-2 ring-emerald-500/20`
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={note}
                            onChange={(e) => handleNotesChange(s.id, e.target.value)}
                            placeholder="Catatan izin/keterangan..."
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 4.2.4 Keterangan H = Hadir, dst. */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Keterangan Kode Kehadiran:</span>
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              <span><strong className="text-emerald-700">H</strong> = Hadir</span>
              <span><strong className="text-blue-700">I</strong> = Izin</span>
              <span><strong className="text-purple-700">S</strong> = Sakit</span>
              <span><strong className="text-rose-700">A</strong> = Alpha (Tanpa Keterangan)</span>
              <span><strong className="text-amber-700">T</strong> = Telat</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
