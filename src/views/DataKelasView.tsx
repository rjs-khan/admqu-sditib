import React, { useState } from 'react';
import { Halaqoh, ClassLevel, Santri, SchoolSettings, User } from '../types';
import { getStudentTerm } from '../lib/studentTerm';
import { generateCleanId } from '../lib/idUtils';
import { Building2, Plus, ExternalLink, Trash2, Edit, X, Save, UserCheck } from 'lucide-react';

interface DataKelasViewProps {
  halaqohs: Halaqoh[];
  santris: Santri[];
  users?: User[];
  settings?: SchoolSettings;
  onSaveHalaqoh: (halaqoh: Halaqoh) => void;
  onDeleteHalaqoh: (id: string) => void;
}

export const DataKelasView: React.FC<DataKelasViewProps> = ({
  halaqohs,
  santris,
  users = [],
  settings,
  onSaveHalaqoh,
  onDeleteHalaqoh,
}) => {
  const studentTerm = getStudentTerm(settings);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState<ClassLevel>('tahfizh');
  const [teacherName, setTeacherName] = useState('');
  const [teacherNip, setTeacherNip] = useState('');
  const [waGroupLink, setWaGroupLink] = useState('');

  const handleOpenNewModal = () => {
    setEditingId(null);
    setName('');
    setLevel('tahfizh');
    setTeacherName('');
    setTeacherNip('');
    setWaGroupLink('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (hlq: Halaqoh) => {
    setEditingId(hlq.id);
    setName(hlq.name);
    setLevel(hlq.level);
    setTeacherName(hlq.teacherName || '');
    setTeacherNip(hlq.teacherNip || '');
    setWaGroupLink(hlq.waGroupLink || '');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(name || '').trim()) return;

    const newHalaqoh: Halaqoh = {
      id: editingId || generateCleanId('hlq', halaqohs),
      name: (name || '').trim(),
      level,
      teacherName: (teacherName || '').trim() || undefined,
      teacherNip: (teacherNip || '').trim() || undefined,
      waGroupLink: (waGroupLink || '').trim(),
      createdAt: editingId
        ? halaqohs.find((h) => h.id === editingId)?.createdAt || new Date().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    };

    onSaveHalaqoh(newHalaqoh);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section with 2.1 Tombol kelas baru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-800">Data Kelas / Halaqoh</h2>
          </div>
          {/* 2.2 Informasi kelas dan jumlah kelas */}
          <p className="text-xs text-slate-500 mt-1">
            Total Terdaftar: <span className="font-bold text-emerald-700">{halaqohs.length} Kelas / Halaqoh</span>
          </p>
        </div>

        {/* 2.1 Tombol Kelas Baru */}
        <button
          id="btn-add-class"
          onClick={handleOpenNewModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 custom-theme-btn font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Grid List of Classes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(halaqohs || []).map((hlq) => {
          const studentCount = (santris || []).filter((s) => s.halaqohId === hlq.id).length;
          return (
            <div
              key={hlq.id}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${
                      hlq.level === 'tahfizh'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : hlq.level === 'lanjut'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    Tingkat: {hlq.level}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {studentCount} {studentTerm}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      {hlq.name}
                    </h3>
                    <span className="text-[11px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">
                      {hlq.id}
                    </span>
                  </div>

                  {/* Nama Pengampu di bawah nama halaqoh/kelas */}
                  <div className="flex items-center gap-2 text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div className="truncate text-slate-700">
                      <span className="text-slate-500 font-medium mr-1">Pengampu:</span>
                      {hlq.teacherName ? (
                        <span className="font-bold text-slate-800">
                          {hlq.teacherName}
                          {hlq.teacherNip && (
                            <span className="font-mono text-slate-500 font-normal ml-1.5 text-[11px]">
                              (NIPK: {hlq.teacherNip})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum ditentukan</span>
                      )}
                    </div>
                  </div>
                </div>

                {hlq.waGroupLink ? (
                  <a
                    href={hlq.waGroupLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-medium transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Link Group WhatsApp</span>
                  </a>
                ) : (
                  <span className="text-xs text-slate-400 italic block">Tidak ada link WA</span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(hlq)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit Kelas"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin menghapus kelas "${hlq.name}"?`)) {
                      onDeleteHalaqoh(hlq.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Kelas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2.1 Modal Tambah / Edit Kelas Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{editingId ? 'Edit Data Kelas' : 'Tambah Kelas / Halaqoh Baru'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 space-y-4">
              {/* 1. Nama Kelas / Halaqoh */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kelas / Halaqoh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Halaqoh Usaid bin Hudhair"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* 2. Tingkat Kelas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tingkat Kelas
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as ClassLevel)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="pemula">Pemula</option>
                  <option value="menengah">Menengah</option>
                  <option value="lanjut">Lanjut</option>
                  <option value="tahfizh">Tahfizh</option>
                </select>
              </div>

              {/* 3. Nama Pengampu (Bisa tulis sendiri atau pilih dari akun terdaftar) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Nama Pengampu <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  {users && users.length > 0 && (
                    <span className="text-[11px] text-slate-400">Bisa ketik bebas atau pilih akun</span>
                  )}
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    list="registered-teachers-list"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="Ketik nama pengampu atau pilih dari opsi di bawah..."
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <datalist id="registered-teachers-list">
                    {(users || []).map((u) => (
                      <option key={u.id} value={u.name} />
                    ))}
                  </datalist>

                  {users && users.length > 0 && (
                    <select
                      value={(users || []).some((u) => u.name === teacherName) ? teacherName : ''}
                      onChange={(e) => {
                        const selectedVal = e.target.value;
                        if (selectedVal) {
                          setTeacherName(selectedVal);
                          const matchedUser = (users || []).find((u) => u.name === selectedVal);
                          if (matchedUser && matchedUser.nip) {
                            setTeacherNip(matchedUser.nip);
                          }
                        }
                      }}
                      className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">-- Atau Pilih Nama dari Akun Terdaftar --</option>
                      {(users || []).map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 4. NIPK Pengampu (Bisa diisi manual atau terisi otomatis dari akun) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIPK <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={teacherNip}
                  onChange={(e) => setTeacherNip(e.target.value)}
                  placeholder="Contoh: 19850101 201001 1 001"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
                />
              </div>

              {/* 5. Link grup whatsapp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link Grup WhatsApp (Opsional)
                </label>
                <input
                  type="url"
                  value={waGroupLink}
                  onChange={(e) => setWaGroupLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Tombol Aksi */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 custom-theme-btn text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kelas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
