/**
 * Profil Saya (My Profile) Page
 * Galaxy Orthodontic Center
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { EmployeeWithRelations } from '../types/index.ts';
import {
  User,
  KeyRound,
  Phone,
  Mail,
  Building,
  Briefcase,
  Calendar,
  Shield,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export function Profile() {
  const { session, changePassword, refreshSession } = useAuth();
  const [employee, setEmployee] = useState<EmployeeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Edit State (Only allowed fields: phone, photo)
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  const fetchProfile = async () => {
    if (!session?.user.employee_id) return;
    try {
      setLoading(true);
      const data = await apiRequest<EmployeeWithRelations>(`/api/employees/${session.user.employee_id}`);
      setEmployee(data);
      setPhone(data.phone || '');
      setPhoto(data.photo || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [session?.user.employee_id]);

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    setUpdateLoading(true);
    setUpdateSuccess('');
    try {
      await apiRequest(`/api/employees/${employee.id}`, {
        method: 'PUT',
        body: JSON.stringify({ phone, photo }),
      });
      setUpdateSuccess('Informasi kontak profil berhasil diperbarui.');
      refreshSession();
      setTimeout(() => setUpdateSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPassword.length < 6) {
      setPassError('Password baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi password tidak cocok.');
      return;
    }

    setPassLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPassSuccess('Kata sandi berhasil diperbarui dengan aman.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(''), 4000);
    } catch (err: any) {
      setPassError(err.message || 'Gagal mengubah password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <User className="h-6 w-6 text-[#800020]" />
          <span>Profil Saya</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Informasi kepegawaian pribadi, kontak WhatsApp, dan pengaturan keamanan kata sandi.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#800020] border-t-transparent mb-2" />
          <p>Memuat profil...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left: Profile Card */}
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs text-center">
            <img
              src={employee?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={employee?.full_name}
              className="mx-auto h-24 w-24 rounded-full object-cover border-4 border-[#800020]/15 shadow-sm"
            />
            <h2 className="mt-3 text-base font-extrabold text-gray-900">{employee?.full_name}</h2>
            <p className="text-xs font-semibold text-[#800020]">{employee?.position?.name}</p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{employee?.employee_number}</p>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Divisi:</span>
                <span className="font-semibold text-gray-800">{employee?.department?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Atasan:</span>
                <span className="font-semibold text-gray-800">{employee?.manager?.full_name || 'Owner'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-bold text-emerald-600">{employee?.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Bergabung:</span>
                <span className="font-semibold text-gray-800">{employee?.join_date}</span>
              </div>
            </div>
          </div>

          {/* Right: Editable Settings & Password Change */}
          <div className="md:col-span-2 space-y-6">
            {/* Edit Contact Form */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Informasi Kontak & Foto</h3>
              <p className="text-xs text-gray-500 mb-4">
                Anda dapat memperbarui nomor WhatsApp dan URL foto profil Anda sendiri. Data sensitif (divisi, jabatan) hanya dapat diubah oleh Owner.
              </p>

              {updateSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{updateSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateContact} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Nomor WhatsApp Aktif</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="08123456789"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Foto Profil (URL Gambar)</label>
                  <input
                    type="url"
                    value={photo}
                    onChange={e => setPhoto(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div className="text-right pt-2">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                  >
                    {updateLoading ? 'Menyimpan...' : 'Perbarui Kontak'}
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 mb-1">Ganti Kata Sandi (Password)</h3>
              <p className="text-xs text-gray-500 mb-4">
                Pastikan Anda menggunakan kata sandi yang kuat dan tidak membagikannya kepada orang lain.
              </p>

              {passError && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs font-bold text-red-700">
                  {passError}
                </div>
              )}

              {passSuccess && (
                <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Kata Sandi Saat Ini</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Kata Sandi Baru</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-gray-500 hover:text-gray-700 font-semibold"
                  >
                    {showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                  </button>

                  <button
                    type="submit"
                    disabled={passLoading}
                    className="rounded-xl bg-[#800020] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] disabled:opacity-50"
                  >
                    {passLoading ? 'Memproses...' : 'Ubah Kata Sandi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
