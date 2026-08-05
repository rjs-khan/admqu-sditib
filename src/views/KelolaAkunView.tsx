import React, { useState } from 'react';
import { User, UserRole, SchoolSettings } from '../types';
import { getStudentTerm } from '../lib/studentTerm';
import { generateCleanId } from '../lib/idUtils';
import {
  UserCog,
  KeyRound,
  Trash2,
  UserPlus,
  Shield,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertTriangle,
  X,
  User as UserIcon,
} from 'lucide-react';

interface KelolaAkunViewProps {
  activeUser: User;
  users: User[];
  isAdmin: boolean;
  settings?: SchoolSettings;
  onUpdateActiveUser: (updated: User) => void;
  onSaveUsers: (users: User[]) => void;
}

export const KelolaAkunView: React.FC<KelolaAkunViewProps> = ({
  activeUser,
  users,
  isAdmin,
  settings,
  onUpdateActiveUser,
  onSaveUsers,
}) => {
  const term = getStudentTerm(settings);
  // 11.1 Ganti username, password, dan profil
  const [profileName, setProfileName] = useState(activeUser.name || '');
  const [profileNip, setProfileNip] = useState(activeUser.nip || '');
  const [profileTitle, setProfileTitle] = useState(activeUser.title || "Guru Qur'an / Pengajar Halaqoh");
  const [currentUsername, setCurrentUsername] = useState(activeUser.username);
  const [newUsername, setNewUsername] = useState(activeUser.username);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 11.3 Admin User Management Modal & State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // Form for Add/Edit User
  const [uName, setUName] = useState('');
  const [uNip, setUNip] = useState('');
  const [uTitle, setUTitle] = useState('Pengajar Tahfizh');
  const [uRole, setURole] = useState<UserRole>('guru');
  const [uUsername, setUUsername] = useState('');
  const [uPassword, setUPassword] = useState('');

  // 11.1 Handle Change Account Details Submit
  const handleChangeAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);

    if (currentPassword !== activeUser.password) {
      setAccountMsg({ type: 'error', text: 'Password saat ini tidak cocok!' });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setAccountMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok!' });
      return;
    }

    const updatedUser: User = {
      ...activeUser,
      name: (profileName || '').trim() || activeUser.name,
      nip: (profileNip || '').trim(),
      title: (profileTitle || '').trim() || "Guru Qur'an / Pengajar Halaqoh",
      username: (newUsername || '').trim() || activeUser.username,
      password: newPassword ? newPassword : activeUser.password,
    };

    onUpdateActiveUser(updatedUser);

    // Update in users list
    const updatedUsersList = users.map((u) => (u.id === activeUser.id ? updatedUser : u));
    onSaveUsers(updatedUsersList);

    setAccountMsg({ type: 'success', text: 'Profil & Kredensial Akun berhasil diperbarui!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // 11.3 Admin User Modal Handlers
  const handleOpenNewUserModal = () => {
    setEditingUserId(null);
    setUName('');
    setUNip('');
    setUTitle('Pengajar Tahfizh');
    setURole('guru');
    setUUsername('');
    setUPassword('guru123');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setEditingUserId(user.id);
    setUName(user.name);
    setUNip(user.nip);
    setUTitle(user.title || '');
    setURole(user.role);
    setUUsername(user.username);
    setUPassword(user.password);
    setIsUserModalOpen(true);
  };

  const handleUserModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!(uName || '').trim() || !(uUsername || '').trim()) return;

    if (editingUserId) {
      const updated = users.map((u) =>
        u.id === editingUserId
          ? {
              ...u,
              name: (uName || '').trim(),
              nip: (uNip || '').trim(),
              title: (uTitle || '').trim(),
              role: uRole,
              username: (uUsername || '').trim(),
              password: uPassword || u.password,
            }
          : u
      );
      onSaveUsers(updated);
    } else {
      const newUser: User = {
        id: generateCleanId('usr', users),
        name: (uName || '').trim(),
        nip: (uNip || '').trim(),
        title: (uTitle || '').trim(),
        role: uRole,
        username: (uUsername || '').trim(),
        password: uPassword || 'guru123',
      };
      onSaveUsers([...users, newUser]);
    }

    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string) => {
    if (id === activeUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri saat sedang login!');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus akun pengajar ini?')) {
      onSaveUsers(users.filter((u) => u.id !== id));
    }
  };

  const toggleShowPassword = (userId: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kelola Akun & Keamanan Data</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ubah kredensial akun, manajemen pengguna, dan reset database aplikasi
            </p>
          </div>
        </div>
      </div>

      {/* Ganti Username & Password Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="w-5 h-5 text-emerald-600" />
          <span>Pengaturan Akun Saya (Ganti Username & Password)</span>
        </h3>

        {accountMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              accountMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {accountMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{accountMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangeAccountSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-2 border-b border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Lengkap Pengajar / User <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Nama Pengajar"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                NIP / Kode Pengajar
              </label>
              <input
                type="text"
                value={profileNip}
                onChange={(e) => setProfileNip(e.target.value)}
                placeholder="NIP Pengajar (opsional)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sebutan Jabatan Tanda Tangan
              </label>
              <input
                type="text"
                value={profileTitle}
                onChange={(e) => setProfileTitle(e.target.value)}
                placeholder="e.g. Guru Qur'an / Pengajar Halaqoh"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username Saat Ini
              </label>
              <input
                type="text"
                value={currentUsername}
                disabled
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono opacity-80 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username Baru
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Masukkan username baru"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Saat Ini <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password Baru (Opsional)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Biarkan kosong jika tidak diubah"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {newPassword && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 custom-theme-btn font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Akun</span>
            </button>
          </div>
        </form>
      </div>

      {/* 11.3 Daftar Akun & Manajemen Pengguna */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-emerald-600" />
              <span>Daftar Pengguna & Kelola Pengajar</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAdmin
                ? 'Admin dapat melihat password semua akun dan menambah/menghapus pengguna.'
                : 'Pengguna dapat melihat daftar pengguna dan hanya password miliknya sendiri.'}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenNewUserModal}
              className="inline-flex items-center gap-2 px-4 py-2 custom-theme-btn font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pengguna Baru</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama Pengajar / NIP</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Password</th>
                <th className="px-4 py-3">Role</th>
                {isAdmin && <th className="px-4 py-3 text-center">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const canSeePassword = isAdmin || u.id === activeUser.id;
                const isPassVisible = showPasswordMap[u.id];

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{u.id}</span>
                        {u.nip && <span>NIP: {u.nip}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{u.title || '-'}</td>
                    <td className="px-4 py-3 font-mono text-emerald-700 font-semibold">{u.username}</td>
                    <td className="px-4 py-3 font-mono">
                      {canSeePassword ? (
                        <div className="flex items-center gap-2">
                          <span>{isPassVisible ? u.password : '••••••••'}</span>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(u.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                            title="Tampilkan / Sembunyikan Password"
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Terproteksi</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`capitalize px-2 py-0.5 rounded text-[11px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditUserModal(u)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                          {u.id !== activeUser.id && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11.3 Modal Tambah / Edit User Account */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna Baru'}</span>
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUserModalSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Pengajar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  placeholder="Contoh: Ustadz Ahmad, M.Pd."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP / NIPK</label>
                <input
                  type="text"
                  value={uNip}
                  onChange={(e) => setUNip(e.target.value)}
                  placeholder="NIP Pengajar"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jabatan</label>
                <input
                  type="text"
                  value={uTitle}
                  onChange={(e) => setUTitle(e.target.value)}
                  placeholder="Contoh: Pengajar Tahfizh"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Akun</label>
                <select
                  value={uRole}
                  onChange={(e) => setURole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="guru">Guru / Pengajar</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={uUsername}
                  onChange={(e) => setUUsername(e.target.value)}
                  placeholder="Username unik"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={uPassword}
                  onChange={(e) => setUPassword(e.target.value)}
                  placeholder="Password akun"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 custom-theme-btn text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
