import React, { useState, useEffect, useMemo } from 'react';
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
  History,
  Edit2,
  Trash2,
  Search,
  Filter,
  Layers,
  X,
  AlertTriangle,
  PlusCircle,
  Copy,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { getStudentTerm, getStudentTermLower, getGradePredicateInfo } from '../lib/studentTerm';

interface NilaiSiswaViewProps {
  grades: GradeRecord[];
  halaqohs: Halaqoh[];
  santris: Santri[];
  settings: SchoolSettings;
  gradeStandards?: GradeStandard[];
  onSaveGrades: (newGrades: GradeRecord[]) => void;
  onUpdateGrade?: (updatedGrade: GradeRecord) => void;
  onDeleteGrade?: (id: string) => void;
}

const PRESET_METHODS = [
  "Al-Qur'an",
  'Iqro',
  'Tilawati',
  'Yanbua',
  'Qiroati',
  'Ummi',
  'Tamhid',
];

const ALL_METHOD_OPTIONS = [
  ...PRESET_METHODS,
  'Lainnya',
];

export const NilaiSiswaView: React.FC<NilaiSiswaViewProps> = ({
  grades,
  halaqohs,
  santris,
  settings,
  gradeStandards,
  onSaveGrades,
  onUpdateGrade,
  onDeleteGrade,
}) => {
  const studentTerm = getStudentTerm(settings);
  const studentTermLower = getStudentTermLower(settings);
  const todayStr = new Date().toISOString().split('T')[0];
  const maxScale = settings?.gradeMaxScale || 100;

  // Active view tab: 'input' | 'history'
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input');

  // --- INPUT MODE STATES ---
  const [date, setDate] = useState<string>(todayStr);
  const [selectedHalaqohId, setSelectedHalaqohId] = useState<string>(halaqohs[0]?.id || '');
  const [assessmentType, setAssessmentType] = useState<AssessmentType>('PTS');

  // Subject Area (Tahsin, Hafalan, Doa-doa, Materi keislaman, lainnya)
  const [subjectPreset, setSubjectPreset] = useState<string>('Tahsin');
  const [customSubject, setCustomSubject] = useState<string>('');

  // Default method helper (to batch set if teacher wants)
  const [batchMethod, setBatchMethod] = useState<string>("Al-Qur'an");

  // Local state maps per student
  const [localScores, setLocalScores] = useState<Record<string, number | string>>({});
  const [localMethods, setLocalMethods] = useState<Record<string, string>>({});
  const [customMethodActive, setCustomMethodActive] = useState<Record<string, boolean>>({});
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [savedRowNotice, setSavedRowNotice] = useState<string | null>(null);

  // --- HISTORY MODE STATES ---
  // Default to selected class to prevent misclicking student from other classes
  const [historyHalaqohFilter, setHistoryHalaqohFilter] = useState<string>(halaqohs[0]?.id || 'all');
  const [historySantriFilter, setHistorySantriFilter] = useState<string>('all');
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('all');
  const [historyAssessmentFilter, setHistoryAssessmentFilter] = useState<string>('all');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  // --- EDIT MODAL STATES ---
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [editDate, setEditDate] = useState<string>('');
  const [editSubjectArea, setEditSubjectArea] = useState<string>('');
  const [editMethodKitab, setEditMethodKitab] = useState<string>('');
  const [editIsCustomMethod, setEditIsCustomMethod] = useState<boolean>(false);
  const [editAssessmentType, setEditAssessmentType] = useState<AssessmentType>('PTS');
  const [editScore, setEditScore] = useState<number | string>(0);

  // --- DELETE MODAL STATES ---
  const [deletingGrade, setDeletingGrade] = useState<GradeRecord | null>(null);

  // Active students in selected halaqoh for input
  const activeStudents = useMemo(() => {
    return (santris || []).filter(
      (s) => s.halaqohId === selectedHalaqohId && s.status === 'aktif'
    );
  }, [santris, selectedHalaqohId]);

  const effectiveSubject = subjectPreset === 'Lainnya' ? customSubject : subjectPreset;

  // Sync halaqoh selection when changed
  const handleSelectHalaqoh = (hId: string) => {
    setSelectedHalaqohId(hId);
    setHistoryHalaqohFilter(hId);
    setHistorySantriFilter('all');
  };

  const handleTabChange = (tab: 'input' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history') {
      if (selectedHalaqohId && historyHalaqohFilter === 'all') {
        setHistoryHalaqohFilter(selectedHalaqohId);
      }
    }
  };

  // Load existing grades and methods when filters change in Input mode
  useEffect(() => {
    const scoreMap: Record<string, number | string> = {};
    const methodMap: Record<string, string> = {};
    const customMap: Record<string, boolean> = {};

    activeStudents.forEach((s) => {
      // Find existing grade for this student, halaqoh, assessmentType, and subject
      const existing = grades.find(
        (g) =>
          g.santriId === s.id &&
          g.halaqohId === selectedHalaqohId &&
          (g.assessmentType || '').toLowerCase().trim() === assessmentType.toLowerCase().trim() &&
          (g.subjectArea || '').toLowerCase().trim() === effectiveSubject.toLowerCase().trim()
      );

      // Default score
      scoreMap[s.id] = existing ? existing.score : maxScale === 10 ? 8 : 80;

      // Default method: from existing record, or default for subject (Tahsin -> Tilawati, others -> Al-Qur'an)
      if (existing && existing.methodKitab) {
        methodMap[s.id] = existing.methodKitab;
        customMap[s.id] = !PRESET_METHODS.includes(existing.methodKitab);
      } else {
        const defaultForSubj = effectiveSubject.toLowerCase().includes('tahsin') ? 'Tilawati' : "Al-Qur'an";
        methodMap[s.id] = defaultForSubj;
        customMap[s.id] = false;
      }
    });

    setLocalScores(scoreMap);
    setLocalMethods(methodMap);
    setCustomMethodActive(customMap);
  }, [selectedHalaqohId, assessmentType, effectiveSubject, grades, activeStudents, maxScale]);

  // Handle score change for a specific student
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

  // Handle method change for a specific student
  const handleMethodChange = (santriId: string, val: string) => {
    setLocalMethods((prev) => ({
      ...prev,
      [santriId]: val,
    }));
  };

  // Apply batch method to all active students in the current view
  const handleApplyBatchMethod = () => {
    if (!batchMethod) return;
    const updated: Record<string, string> = {};
    const updatedCustoms: Record<string, boolean> = {};
    activeStudents.forEach((s) => {
      if (batchMethod === 'Lainnya') {
        updated[s.id] = '';
        updatedCustoms[s.id] = true;
      } else {
        updated[s.id] = batchMethod;
        updatedCustoms[s.id] = false;
      }
    });
    setLocalMethods(updated);
    setCustomMethodActive(updatedCustoms);
  };

  // Save all grades in the input table
  const handleSaveAll = () => {
    const newRecords: GradeRecord[] = activeStudents.map((s, idx) => {
      const scoreVal = localScores[s.id];
      const numericScore =
        typeof scoreVal === 'number'
          ? scoreVal
          : scoreVal === ''
          ? 0
          : Number(scoreVal) || 0;
      const rawMethod = localMethods[s.id];
      const method = (rawMethod && rawMethod.trim()) ? rawMethod.trim() : (customMethodActive[s.id] ? 'Lainnya' : "Al-Qur'an");

      return {
        id: generateCleanId('grd', grades, idx),
        date,
        halaqohId: selectedHalaqohId,
        santriId: s.id,
        score: numericScore,
        assessmentType,
        subjectArea: effectiveSubject || 'Tahsin',
        methodKitab: method,
      };
    });

    onSaveGrades(newRecords);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Save a single student's grade directly
  const handleSaveSingleRow = (santriId: string) => {
    const scoreVal = localScores[santriId];
    const numericScore =
      typeof scoreVal === 'number'
        ? scoreVal
        : scoreVal === ''
        ? 0
        : Number(scoreVal) || 0;
    const rawMethod = localMethods[santriId];
    const method = (rawMethod && rawMethod.trim()) ? rawMethod.trim() : (customMethodActive[santriId] ? 'Lainnya' : "Al-Qur'an");

    const singleRecord: GradeRecord = {
      id: generateCleanId('grd', grades, 0),
      date,
      halaqohId: selectedHalaqohId,
      santriId,
      score: numericScore,
      assessmentType,
      subjectArea: effectiveSubject || 'Tahsin',
      methodKitab: method,
    };

    onSaveGrades([singleRecord]);
    setSavedRowNotice(santriId);
    setTimeout(() => setSavedRowNotice(null), 2500);
  };

  // --- HISTORY FILTERING & LISTING ---
  const filteredGrades = useMemo(() => {
    return (grades || []).filter((g) => {
      // Halaqoh filter (Scoped by selected class)
      if (historyHalaqohFilter !== 'all' && g.halaqohId !== historyHalaqohFilter) {
        return false;
      }
      // Santri filter
      if (historySantriFilter !== 'all' && g.santriId !== historySantriFilter) {
        return false;
      }
      // Subject filter
      if (
        historySubjectFilter !== 'all' &&
        (g.subjectArea || '').toLowerCase().trim() !== historySubjectFilter.toLowerCase().trim()
      ) {
        return false;
      }
      // Assessment type filter
      if (historyAssessmentFilter !== 'all' && g.assessmentType !== historyAssessmentFilter) {
        return false;
      }
      // Search query
      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase();
        const student = (santris || []).find((s) => s.id === g.santriId);
        const halaqoh = (halaqohs || []).find((h) => h.id === g.halaqohId);
        const nameMatch = student?.fullName?.toLowerCase().includes(q);
        const nisMatch = student?.nis?.toLowerCase().includes(q);
        const subjectMatch = g.subjectArea?.toLowerCase().includes(q);
        const methodMatch = g.methodKitab?.toLowerCase().includes(q);
        const halaqohMatch = halaqoh?.name?.toLowerCase().includes(q);
        if (!nameMatch && !nisMatch && !subjectMatch && !methodMatch && !halaqohMatch) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [
    grades,
    historyHalaqohFilter,
    historySantriFilter,
    historySubjectFilter,
    historyAssessmentFilter,
    historySearchQuery,
    santris,
    halaqohs,
  ]);

  // Distinct subjects in history for filter dropdown
  const allDistinctSubjectsInHistory = useMemo(() => {
    const set = new Set<string>();
    (grades || []).forEach((g) => {
      if (g.subjectArea) set.add(g.subjectArea);
    });
    return Array.from(set);
  }, [grades]);

  // --- OPEN EDIT MODAL ---
  const handleOpenEdit = (grade: GradeRecord) => {
    setEditingGrade(grade);
    setEditDate(grade.date || todayStr);
    setEditSubjectArea(grade.subjectArea || 'Tahsin');
    const m = grade.methodKitab || "Al-Qur'an";
    setEditMethodKitab(m);
    setEditIsCustomMethod(!PRESET_METHODS.includes(m));
    setEditAssessmentType(grade.assessmentType || 'PTS');
    setEditScore(grade.score);
  };

  // Submit edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade) return;

    const numScore =
      typeof editScore === 'number'
        ? editScore
        : editScore === ''
        ? 0
        : Number(editScore) || 0;
    const clampedScore = Math.min(maxScale, Math.max(0, numScore));
    const finalMethod = (editMethodKitab && editMethodKitab.trim()) ? editMethodKitab.trim() : (editIsCustomMethod ? 'Lainnya' : "Al-Qur'an");

    const updated: GradeRecord = {
      ...editingGrade,
      date: editDate,
      subjectArea: editSubjectArea,
      methodKitab: finalMethod,
      assessmentType: editAssessmentType,
      score: clampedScore,
    };

    if (onUpdateGrade) {
      onUpdateGrade(updated);
    } else {
      onSaveGrades([updated]);
    }

    setEditingGrade(null);
  };

  // --- OPEN DELETE MODAL ---
  const handleOpenDelete = (grade: GradeRecord) => {
    setDeletingGrade(grade);
  };

  const handleConfirmDelete = () => {
    if (!deletingGrade) return;
    if (onDeleteGrade) {
      onDeleteGrade(deletingGrade.id);
    }
    setDeletingGrade(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Penilaian {studentTerm}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input nilai, atur metode acuan per {studentTermLower}, dan kelola riwayat evaluasi (Skala 0-{maxScale})
            </p>
          </div>
        </div>

        {/* Action Toggle Tabs: Lembar Input vs Riwayat */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            id="tab-input-nilai"
            onClick={() => handleTabChange('input')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'input'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lembar Input Nilai</span>
          </button>
          <button
            id="tab-riwayat-nilai"
            onClick={() => handleTabChange('history')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat & Kelola Nilai</span>
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
              {grades.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: LEMBAR INPUT PENILAIAN BARU                                      */}
      {/* ========================================================================= */}
      {activeTab === 'input' && (
        <div className="space-y-6">
          {/* Selectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
            {/* Tanggal */}
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

            {/* Dropdown halaqoh */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Pilih Kelas / Halaqoh:</span>
              </label>
              <select
                id="nilai-halaqoh"
                value={selectedHalaqohId}
                onChange={(e) => handleSelectHalaqoh(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                {halaqohs.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Penilaian */}
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

            {/* Pilihan Materi / Bidang Studi */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Materi / Bidang Studi:</span>
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

            {/* Helper: Quick Batch Apply Method to All Students */}
            <div className="md:col-span-2 lg:col-span-4 border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-600 font-medium flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Set Cepat Metode ke Semua {studentTerm}:</span>
                </span>
                <select
                  value={batchMethod}
                  onChange={(e) => setBatchMethod(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  {PRESET_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
                </select>
                <button
                  type="button"
                  onClick={handleApplyBatchMethod}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Terapkan metode ini ke semua baris di bawah"
                >
                  <Copy className="w-3 h-3" />
                  <span>Terapkan ke Semua</span>
                </button>
              </div>

              <div className="text-slate-500 italic">
                Pilih "Lainnya" jika ingin menuliskan metode / jilid kitab sendiri untuk masing-masing {studentTermLower}.
              </div>
            </div>
          </div>

          {/* Success Alerts */}
          {isSavedNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCheck className="w-5 h-5 text-emerald-600" />
              <span>Nilai semua {studentTermLower} berhasil disimpan ke database!</span>
            </div>
          )}

          {/* Table Lembar Input Nilai */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800">
                  Lembar Input Nilai — {assessmentType} — {effectiveSubject}
                </span>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Metode/kitab dapat disesuaikan per individu {studentTermLower} (pilihan "Lainnya" dapat diketik bebas)
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-700 font-bold">
                  {activeStudents.length} {studentTerm} ({halaqohs.find(h => h.id === selectedHalaqohId)?.name || 'Kelas'})
                </span>
                <button
                  id="btn-simpan-nilai-top"
                  onClick={handleSaveAll}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Semua Nilai</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center">No</th>
                    <th className="px-4 py-3 min-w-[200px]">Nama Lengkap & NIS</th>
                    <th className="px-4 py-3 min-w-[240px]">
                      Metode / Kitab Acuan Murid
                    </th>
                    <th className="px-4 py-3 text-center min-w-[140px]">
                      Nilai Angka (0 - {maxScale})
                    </th>
                    <th className="px-4 py-3 text-center min-w-[150px]">Kategori Predikat</th>
                    <th className="px-4 py-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                        Tidak ada {studentTermLower} aktif di kelas ini.
                      </td>
                    </tr>
                  ) : (
                    activeStudents.map((s, idx) => {
                      const rawVal = localScores[s.id];
                      const displayVal = rawVal ?? '';
                      const numericVal =
                        typeof rawVal === 'number'
                          ? rawVal
                          : rawVal === ''
                          ? 0
                          : Number(rawVal) || 0;
                      const predInfo = getGradePredicateInfo(numericVal, gradeStandards, maxScale);
                      const currentMethod = localMethods[s.id] || "Al-Qur'an";
                      const isCustom = customMethodActive[s.id] || !PRESET_METHODS.includes(currentMethod);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800 text-sm">{s.fullName}</div>
                            <div className="text-[11px] text-slate-400">NIS: {s.nis}</div>
                          </td>

                          {/* Metode / Kitab Acuan Selector Per Murid */}
                          <td className="px-4 py-3">
                            <div className="space-y-1.5">
                              <select
                                value={isCustom ? 'Lainnya' : currentMethod}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === 'Lainnya') {
                                    setCustomMethodActive((prev) => ({ ...prev, [s.id]: true }));
                                    if (PRESET_METHODS.includes(localMethods[s.id])) {
                                      handleMethodChange(s.id, '');
                                    }
                                  } else {
                                    setCustomMethodActive((prev) => ({ ...prev, [s.id]: false }));
                                    handleMethodChange(s.id, val);
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              >
                                {PRESET_METHODS.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                                <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
                              </select>

                              {/* Custom input with free text writing when Lainnya is selected */}
                              {isCustom && (
                                <div className="space-y-1 animate-in fade-in duration-150">
                                  <input
                                    type="text"
                                    value={localMethods[s.id] || ''}
                                    onChange={(e) => handleMethodChange(s.id, e.target.value)}
                                    placeholder="Tulis metode/kitab (cth: Tilawati Jilid 2)..."
                                    className="w-full px-2.5 py-1.5 bg-amber-50/70 border border-amber-300 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                                    autoFocus={!localMethods[s.id]}
                                  />
                                  <div className="text-[10px] text-amber-700 font-medium">
                                    ✍️ Tulis nama metode / jilid kitab sendiri
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Nilai Angka Input */}
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

                          {/* Kategori Predikat */}
                          <td className="px-4 py-3 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold inline-block">
                              {predInfo.fullText}
                            </span>
                          </td>

                          {/* Quick Row Action */}
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleRow(s.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                savedRowNotice === s.id
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                              }`}
                              title="Simpan baris nilai murid ini"
                            >
                              {savedRowNotice === s.id ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Pastikan seluruh nilai dan metode acuan telah sesuai sebelum menekan Simpan Semua Nilai.
              </div>
              <button
                id="btn-simpan-nilai-bottom"
                onClick={handleSaveAll}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Semua Nilai ({activeStudents.length} {studentTerm})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: RIWAYAT & KELOLA NILAI (DITAMPILKAN BERDASARKAN KELAS TERPILIH)  */}
      {/* ========================================================================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Active Class Scope Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-950 shadow-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Menampilkan Riwayat Kelas: <strong className="text-emerald-800 text-sm">{halaqohs.find((h) => h.id === historyHalaqohFilter)?.name || (historyHalaqohFilter === 'all' ? 'Semua Kelas' : 'Kelas Terpilih')}</strong>
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-lg font-semibold inline-flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tampilan dikhususkan per kelas untuk menghindari salah klik nama murid</span>
            </span>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Filter className="w-4 h-4 text-emerald-600" />
                <span>Filter & Pencarian Riwayat Penilaian</span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Menampilkan <strong>{filteredGrades.length}</strong> dari <strong>{grades.length}</strong> data nilai
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="lg:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Cari Nama / NIS:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="Ketik kata kunci..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Halaqoh Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Kelas / Halaqoh:
                </label>
                <select
                  value={historyHalaqohFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setHistoryHalaqohFilter(val);
                    setHistorySantriFilter('all');
                    if (val !== 'all') {
                      setSelectedHalaqohId(val);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Kelas</option>
                  {halaqohs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Santri Filter (Restricted to selected class to avoid wrong student click) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pilih {studentTerm} (Kelas Ini):
                </label>
                <select
                  value={historySantriFilter}
                  onChange={(e) => setHistorySantriFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua {studentTerm}</option>
                  {(santris || [])
                    .filter((s) => historyHalaqohFilter === 'all' || s.halaqohId === historyHalaqohFilter)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Materi / Bidang:
                </label>
                <select
                  value={historySubjectFilter}
                  onChange={(e) => setHistorySubjectFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Materi</option>
                  {allDistinctSubjectsInHistory.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assessment Type Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Jenis Evaluasi:
                </label>
                <select
                  value={historyAssessmentFilter}
                  onChange={(e) => setHistoryAssessmentFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Semua Evaluasi</option>
                  <option value="Penilaian Harian">Penilaian Harian</option>
                  <option value="PTS">PTS</option>
                  <option value="PAS">PAS</option>
                </select>
              </div>
            </div>
          </div>

          {/* History Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3 w-12 text-center">No</th>
                    <th className="px-3 py-3 w-28">Tanggal</th>
                    <th className="px-4 py-3 min-w-[180px]">Nama {studentTerm} & Kelas</th>
                    <th className="px-4 py-3 min-w-[140px]">Materi / Bidang Studi</th>
                    <th className="px-4 py-3 min-w-[150px]">Metode / Kitab Acuan</th>
                    <th className="px-3 py-3 text-center min-w-[130px]">Jenis Evaluasi</th>
                    <th className="px-4 py-3 text-center min-w-[150px]">Nilai & Predikat</th>
                    <th className="px-4 py-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredGrades.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 italic">
                        Tidak ada riwayat penilaian yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredGrades.map((g, idx) => {
                      const student = (santris || []).find((s) => s.id === g.santriId);
                      const halaqoh = (halaqohs || []).find((h) => h.id === g.halaqohId);
                      const predInfo = getGradePredicateInfo(g.score, gradeStandards, maxScale);

                      // Assessment badge styling
                      const isHarian = (g.assessmentType || '').toLowerCase().includes('harian');
                      const isPts = (g.assessmentType || '').toLowerCase().includes('pts');
                      const isPas = (g.assessmentType || '').toLowerCase().includes('pas');

                      const badgeClass = isHarian
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : isPts
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : isPas
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-3 font-mono text-slate-600">{g.date}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-800 text-sm">
                              {student?.fullName || `ID: ${g.santriId}`}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {halaqoh?.name || '-'} • NIS: {student?.nis || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-slate-800">{g.subjectArea}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                              {g.methodKitab || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeClass}`}
                            >
                              {g.assessmentType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="font-bold text-sm text-emerald-700">{g.score}</div>
                            <div className="text-[11px] text-slate-500">{predInfo.fullText}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(g)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 transition-colors cursor-pointer"
                                title="Edit data nilai ini"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleOpenDelete(g)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
                                title="Hapus data nilai ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL EDIT DATA NILAI                                                    */}
      {/* ========================================================================= */}
      {editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Edit Data Nilai {studentTerm}</h3>
                  <p className="text-[11px] text-slate-500">Sesuaikan materi, metode, atau nilai angka</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGrade(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {/* Info Santri (Read Only) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Nama {studentTerm}</div>
                <div className="text-sm font-bold text-slate-800">
                  {(santris || []).find((s) => s.id === editingGrade.santriId)?.fullName || editingGrade.santriId}
                </div>
                <div className="text-[11px] text-slate-500">
                  {(halaqohs || []).find((h) => h.id === editingGrade.halaqohId)?.name}
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Ujian:
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Materi / Bidang Studi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materi / Bidang Studi:
                </label>
                <input
                  type="text"
                  value={editSubjectArea}
                  onChange={(e) => setEditSubjectArea(e.target.value)}
                  placeholder="Contoh: Tahsin, Hafalan, Doa-doa..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Metode / Kitab Acuan Murid */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode / Kitab Acuan:
                </label>
                <div className="space-y-1.5">
                  <select
                    value={editIsCustomMethod ? 'Lainnya' : (PRESET_METHODS.includes(editMethodKitab) ? editMethodKitab : 'Lainnya')}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Lainnya') {
                        setEditIsCustomMethod(true);
                        if (PRESET_METHODS.includes(editMethodKitab)) {
                          setEditMethodKitab('');
                        }
                      } else {
                        setEditIsCustomMethod(false);
                        setEditMethodKitab(val);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    {PRESET_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                    <option value="Lainnya">Lainnya (Tulis Sendiri)</option>
                  </select>

                  {(editIsCustomMethod || !PRESET_METHODS.includes(editMethodKitab)) && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        value={editMethodKitab}
                        onChange={(e) => setEditMethodKitab(e.target.value)}
                        placeholder="Tulis metode/kitab (cth: Tilawati Jilid 2, Iqro 4)..."
                        className="w-full px-3 py-2 bg-amber-50/70 border border-amber-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        autoFocus={!editMethodKitab}
                      />
                      <div className="text-[10px] text-amber-700 font-medium">
                        ✍️ Tulis nama metode / jilid kitab sendiri
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Jenis Penilaian */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Evaluasi:
                </label>
                <select
                  value={editAssessmentType}
                  onChange={(e) => setEditAssessmentType(e.target.value as AssessmentType)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Penilaian Harian">Penilaian Harian</option>
                  <option value="PTS">PTS (Tengah Semester)</option>
                  <option value="PAS">PAS (Akhir Semester)</option>
                </select>
              </div>

              {/* Nilai Angka */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai Angka (0 s/d {maxScale}):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={maxScale}
                    value={editScore}
                    onChange={(e) => setEditScore(e.target.value)}
                    className="w-28 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 text-center focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <div className="flex-1 text-xs">
                    <span className="text-slate-500">Predikat: </span>
                    <strong className="text-emerald-800">
                      {
                        getGradePredicateInfo(
                          typeof editScore === 'number' ? editScore : Number(editScore) || 0,
                          gradeStandards,
                          maxScale
                        ).fullText
                      }
                    </strong>
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingGrade(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI HAPUS DATA NILAI                                        */}
      {/* ========================================================================= */}
      {deletingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Hapus Data Nilai?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus data nilai{' '}
                <strong>
                  {(santris || []).find((s) => s.id === deletingGrade.santriId)?.fullName || deletingGrade.santriId}
                </strong>{' '}
                untuk materi <strong>{deletingGrade.subjectArea} ({deletingGrade.assessmentType})</strong>?
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-center">
              <div>Nilai Terdata: <strong className="text-rose-600">{deletingGrade.score}</strong></div>
              <div>Metode Acuan: <strong>{deletingGrade.methodKitab}</strong></div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGrade(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Hapus Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
