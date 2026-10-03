/**
 * Forced Password Change Modal
 * Mandated: Owner/User must change default password on first login
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { KeyRound, AlertTriangle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export function MustChangePasswordModal() {
  const { session, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session?.user.must_change_password) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 text-[#800020] mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FDF2F8]">
            <KeyRound className="h-6 w-6 text-[#800020]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Wajib Ganti Password</h2>
            <p className="text-xs text-gray-500">Keamanan akun administrator & sistem GOC</p>
          </div>
        </div>

        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/60 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <span>
            Demi keamanan data klinik, Anda diwajibkan untuk mengganti kata sandi bawaan sistem pada login pertama ini.
          </span>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password Saat Ini
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Masukkan password saat ini (cth: GocOwner2026!)"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password Baru (Min. 6 Karakter)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Buat password baru yang kuat"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang password baru"
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rounded-xl bg-[#800020] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#6A041C] transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan Password...' : 'Simpan Password Baru & Lanjutkan'}
          </button>
        </form>
      </div>
    </div>
  );
}
