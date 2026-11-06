import React, { useState } from 'react';
import { JournalRecord, Halaqoh, User } from '../types';
import { generateCleanId } from '../lib/idUtils';
import {
  BookOpenCheck,
  Plus,
  BookOpen,
  Calendar,
  X,
  Save,
  Trash2,
  Edit,
  Filter,
  UserCheck,
} from 'lucide-react';

interface JurnalMengajarViewProps {
  journals: JournalRecord[];
  halaqohs: Halaqoh[];
  activeUser: User;
  onSaveJournal: (journal: JournalRecord) => void;
  onDeleteJournal: (id: string) => void;
}

export const JurnalMengajarView: React.FC<JurnalMengajarViewProps> = ({
  journals,
  halaqohs,
  activeUser,
  onSaveJournal,
  onDeleteJournal,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 5.3 Dropdown kelas untuk jurnal (Filter)
  const [filterHalaqohId, setFilterHalaqohId] = useState<string>('semua');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State (5.2.1 - 5.2.4)
  const [date, setDate] = useState<string>(todayStr);
  const [halaqohId, setHalaqohId] = useState<string>(halaqohs[0]?.id || '');
  const [material, setMaterial] = useState<string>('');
  const [notesAndEvaluation, setNotesAndEvaluation] = useState<string>('');

  const handleOpenNewModal = () => {
    setEditingId(null);
    setDate(todayStr);
    const defaultHalaqoh = filterHalaqohId !== 'semua' ? filterHalaqohId : (halaqohs[0]?.id || '');
    setHalaqohId(defaultHalaqoh);
    setMaterial('');
    setNotesAndEvaluation('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (j: JournalRecord) => {
    setEditingId(j.id);
    setDate(j.date);
    setHalaqohId(j.halaqohId);
    setMaterial(j.material);
    setNotesAndEvaluation(j.notesAndEvaluation);
    setIsModalOpen(true);
  };

  // 5.2.5 Tombol simpan jurnal
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(material || '').trim() || !halaqohId) return;

    const newJournal: JournalRecord = {
      id: editingId || generateCleanId('jrn', journals),
      date,
      halaqohId,
      material: (material || '').trim(),
      notesAndEvaluation: (notesAndEvaluation || '').trim(),
      teacherName: activeUser.name,
    };

    onSaveJournal(newJournal);

    // If currently filtering a specific class and saved for a different class, reset filter to 'semua'
    if (filterHalaqohId !== 'semua' && filterHalaqohId !== halaqohId) {
      setFilterHalaqohId('semua');
    }

    setIsModalOpen(false);
  };

  // Filtered & Sorted Journals (newest date & ID first)
  const filteredJournals = (journals || [])
    .filter((j) => filterHalaqohId === 'semua' || j.halaqohId === filterHalaqohId)
    .sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.id || '').localeCompare(a.id || '');
    });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">Jurnal Mengajar Pengajar</h2>
          </div>
          {/* 5.1 Informasi jumlah catatan jurnal */}
          <p className="text-xs text-slate-500 mt-1">
            Total Jurnal Terdata:{' '}
            <span className="font-bold text-emerald-700">{journals.length} Catatan Jurnal</span>
          </p>
        </div>

        {/* 5.2 Tombol tulis jurnal baru */}
        <button
          id="btn-add-jurnal"
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 custom-theme-btn font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tulis Jurnal Baru</span>
        </button>
      </div>

      {/* 5.3 Filter Dropdown Kelas untuk Jurnal */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
          <label className="text-xs text-slate-600 font-semibold shrink-0">Filter Kelas Jurnal:</label>
          <select
            id="filter-jurnal-halaqoh"
            value={filterHalaqohId}
            onChange={(e) => setFilterHalaqohId(e.target.value)}
            className="w-full md:w-64 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="semua">Semua Kelas ({(journals || []).length})</option>
            {(halaqohs || []).map((h) => {
              const count = (journals || []).filter((j) => j.halaqohId === h.id).length;
              return (
                <option key={h.id} value={h.id}>
                  {h.name} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Journal Cards List */}
      <div className="space-y-4">
        {filteredJournals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 italic">
            Belum ada catatan jurnal mengajar untuk kelas ini.
          </div>
        ) : (
          filteredJournals.map((j) => {
            const hlq = halaqohs.find((h) => h.id === j.halaqohId);
            return (
              <div
                key={j.id}
                className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs space-y-3 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">
                      {hlq?.name || 'Halaqoh'}
                    </span>
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {j.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {j.teacherName}
                    </span>
                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                      <button
                        onClick={() => handleOpenEditModal(j)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Jurnal"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Apakah Anda yakin menghapus catatan jurnal ini?')) {
                            onDeleteJournal(j.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Hapus Jurnal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Materi / Kegiatan:</h4>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{j.material}</p>
                  </div>
                  {j.notesAndEvaluation && (
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan & Evaluasi:</h4>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1">
                        {j.notesAndEvaluation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5.2 Modal Tulis Jurnal Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>{editingId ? 'Edit Jurnal Mengajar' : 'Tulis Jurnal Mengajar Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 space-y-4">
              {/* 5.2.1 Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal KBM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* 5.2.2 Pilihan Dropdown Halaqoh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kelas / Halaqoh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={halaqohId}
                  onChange={(e) => setHalaqohId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  {halaqohs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5.2.3 Materi / Kegiatan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materi / Kegiatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Contoh: Setoran Ziyadah Juz 30 & Tajwid Nun Sukun"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* 5.2.4 Catatan & Evaluasi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan & Evaluasi Pembelajaran
                </label>
                <textarea
                  rows={4}
                  value={notesAndEvaluation}
                  onChange={(e) => setNotesAndEvaluation(e.target.value)}
                  placeholder="Tuliskan perkembangan santri, kendala KBM, atau evaluasi kelas..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* 5.2.5 Tombol Simpan Jurnal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 custom-theme-btn text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Jurnal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
