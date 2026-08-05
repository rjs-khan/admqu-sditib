import React, { useState, useEffect } from 'react';
import { generateCleanId } from '../lib/idUtils';
import {
  GradeRecord,
  Halaqoh,
  Santri,
  AssessmentType,
  SchoolSettings,
  GradeStandard,
} from '../types';
import {
  GraduationCap,
  Calendar,
  Save,
  CheckCircle2,
  BookOpen,
  FileCheck,
  CheckCheck,
} from 'lucide-react';
import { getStudentTerm, getStudentTermLower, getGradePredicateInfo } from '../lib/studentTerm';

interface NilaiSiswaViewProps {
  grades: GradeRecord[];
  halaqohs: Halaqoh[];
  santris: Santri[];
  settings: SchoolSettings;
  gradeStandards?: GradeStandard[];
  onSaveGrades: (newGrades: GradeRecord[]) => void;
}

export const NilaiSiswaView: React.FC<NilaiSiswaViewProps> = ({
  grades,
  halaqohs,
  santris,
  settings,
  gradeStandards,
  onSaveGrades,
}) => {
  const studentTerm = getStudentTerm(settings);
  const studentTermLower = getStudentTermLower(settings);
  const todayStr = new Date().toISOString().split('T')[0];

  // 7.1 Tanggal
  const [date, setDate] = useState<string>(todayStr);

  // 7.2 Dropdown halaqoh
  const [selectedHalaqohId, setSelectedHalaqohId] = useState<string>(halaqohs[0]?.id || '');

  // 7.3 Jenis Penilaian (Penilaian Harian, PTS, PAS)
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('PTS');

  // 7.4 Subject Area (Tahsin, Hafalan, Doa-doa, Materi keislaman, lainnya tulis sendiri)
  const [subjectPreset, setSubjectPreset] = useState<string>('Tahsin');
  const [customSubject, setCustomSubject] = useState<string>('');

  // 7.5 Method / Kitab (Al-Qur'an, Iqro, Tilawati, Yanbua, Qiroati, Ummi, Lainnya tulis sendiri)
  const [methodPreset, setMethodPreset] = useState<string>('Al-Qur\'an');
  const [customMethod, setCustomMethod] = useState<string>('');

  // Local state for scores map (supports empty string when clearing)
  const [localScores, setLocalScores] = useState<Record<string, number | string>>({});
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Active students in halaqoh
  const activeStudents = (santris || []).filter(
    (s) => s.halaqohId === selectedHalaqohId && s.status === 'aktif'
  );

  const effectiveSubject = subjectPreset === 'Lainnya' ? customSubject : subjectPreset;
  const effectiveMethod = methodPreset === 'Lainnya' ? customMethod : methodPreset;

  const maxScale = settings?.gradeMaxScale || 100;

  // Load existing grades when filters change
  useEffect(() => {
    const map: Record<string, number | string> = {};
    activeStudents.forEach((s) => {
      const existing = grades.find(
        (g) =>
          g.santriId === s.id &&
          g.halaqohId === selectedHalaqohId &&
          g.assessmentType === assessmentType &&
          g.subjectArea === effectiveSubject
      );
      map[s.id] = existing ? existing.score : maxScale === 10 ? 8 : 80;
    });
    setLocalScores(map);
  }, [selectedHalaqohId, assessmentType, effectiveSubject, grades, santris]);

  const handleScoreChange = (santriId: string, val: string) => {
    if (val === '') {
      setLocalScores((prev) => ({
        ...prev,
        [santriId]: '',
      }));
      return;
    }
    const num = Number(val);
    if (isNaN(num)) return;
    const clamped = Math.min(maxScale, Math.max(0, num));
    setLocalScores((prev) => ({
      ...prev,
      [santriId]: clamped,
    }));
  };

  // 7.2.2 Tombol simpan nilai
  const handleSaveAll = () => {
    const newRecords: GradeRecord[] = activeStudents.map((s, idx) => {
      const scoreVal = localScores[s.id];
      const numericScore = typeof scoreVal === 'number' ? scoreVal : (scoreVal === '' ? 0 : Number(scoreVal) || 0);
      return {
        id: generateCleanId('grd', grades, idx),
        date,
        halaqohId: selectedHalaqohId,
        santriId: s.id,
        score: numericScore,
        assessmentType,
        subjectArea: effectiveSubject || 'Tahsin',
        methodKitab: effectiveMethod || 'Al-Qur\'an',
      };
    });

    onSaveGrades(newRecords);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Penilaian {studentTerm}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input nilai Penilaian Harian, PTS, dan PAS (Skala 0-{maxScale})
            </p>
          </div>
        </div>

        {/* 7.2.2 Tombol simpan nilai */}
        <button
          id="btn-simpan-nilai"
          onClick={handleSaveAll}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Nilai</span>
        </button>
      </div>

      {/* Selectors Grid (7.1 - 7.5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        {/* 7.1 Tanggal */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Tanggal Ujian:</span>
          </label>
          <input
            id="nilai-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 7.2 Dropdown halaqoh */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Pilih Kelas / Halaqoh:</span>
          </label>
          <select
            id="nilai-halaqoh"
            value={selectedHalaqohId}
            onChange={(e) => setSelectedHalaqohId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            {halaqohs.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        {/* 7.3 Jenis Penilaian */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Jenis Penilaian:</span>
          </label>
          <select
            id="nilai-assessment-type"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value as AssessmentType)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Penilaian Harian">Penilaian Harian</option>
            <option value="PTS">PTS (Tengah Semester)</option>
            <option value="PAS">PAS (Akhir Semester)</option>
          </select>
        </div>

        {/* 7.4 Pilihan Dropdown Penilaian */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Materi / Bidang Studi:
          </label>
          <select
            id="nilai-subject"
            value={subjectPreset}
            onChange={(e) => setSubjectPreset(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Tahsin">Tahsin</option>
            <option value="Hafalan">Hafalan Al-Qur'an</option>
            <option value="Doa-doa">Doa-doa Harian</option>
            <option value="Materi keislaman">Materi Keislaman</option>
            <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
          </select>
          {subjectPreset === 'Lainnya' && (
            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Tulis bidang studi..."
              className="w-full mt-2 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          )}
        </div>

        {/* 7.5 Metode / Kitab */}
        <div className="md:col-span-2 lg:col-span-4 border-t border-slate-100 pt-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Metode / Kitab Acuan:
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              id="nilai-method"
              value={methodPreset}
              onChange={(e) => setMethodPreset(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="Al-Qur'an">Al-Qur'an</option>
              <option value="Iqro">Iqro</option>
              <option value="Tilawati">Tilawati</option>
              <option value="Yanbua">Yanbua</option>
              <option value="Qiroati">Qiroati</option>
              <option value="Ummi">Ummi</option>
              <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
            </select>

            {methodPreset === 'Lainnya' && (
              <input
                type="text"
                value={customMethod}
                onChange={(e) => setCustomMethod(e.target.value)}
                placeholder="Tulis nama kitab/metode..."
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            )}

            <span className="text-xs text-slate-500 italic">
              Standar Skala Nilai: <strong className="text-emerald-700">0 s/d {maxScale}</strong> (diatur di Pengaturan Sekolah)
            </span>
          </div>
        </div>
      </div>

      {isSavedNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCheck className="w-5 h-5 text-emerald-600" />
          <span>Nilai {studentTermLower} berhasil disimpan!</span>
        </div>
      )}

      {/* 7.2.1 Table No, Nama Peserta, Nilai */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Lembar Input Nilai - {assessmentType} - {effectiveSubject} ({effectiveMethod})
          </span>
          <span className="text-xs text-emerald-700 font-bold">{activeStudents.length} {studentTerm}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-16 text-center">No</th>
                <th className="px-4 py-3">Nama Lengkap & NIS</th>
                <th className="px-4 py-3 text-center">Nilai Angka (0 - {maxScale})</th>
                <th className="px-4 py-3 text-center">Kategori Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400 italic">
                    Tidak ada {studentTermLower} aktif di kelas ini.
                  </td>
                </tr>
              ) : (
                activeStudents.map((s, idx) => {
                  const rawVal = localScores[s.id];
                  const displayVal = rawVal ?? '';
                  const numericVal = typeof rawVal === 'number' ? rawVal : (rawVal === '' ? 0 : Number(rawVal) || 0);
                  const predInfo = getGradePredicateInfo(numericVal, gradeStandards, maxScale);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 text-sm">{s.fullName}</div>
                        <div className="text-[11px] text-slate-400">NIS: {s.nis}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxScale}
                          value={displayVal}
                          onChange={(e) => handleScoreChange(s.id, e.target.value)}
                          className="w-24 text-center px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-semibold">
                          {predInfo.fullText}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

