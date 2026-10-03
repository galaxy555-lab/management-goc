/**
 * Login Page for GOC Team Management
 * Galaxy Orthodontic Center
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Building2,
  ShieldAlert,
  HelpCircle,
  Check,
  ChevronRight,
} from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput) return;
    setForgotLoading(true);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ emailOrUsername: forgotInput }),
      });
      setForgotMessage(res.message);
    } catch (err: any) {
      setForgotMessage(err.message || 'Terjadi kesalahan.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Quick switch credentials helper for evaluation
  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#800020] text-white shadow-lg shadow-[#800020]/25 mb-3">
            <span className="font-extrabold text-2xl tracking-wider">GOC</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">GOC TEAM MANAGEMENT</h1>
          <p className="text-xs font-semibold text-[#800020] mt-0.5 uppercase tracking-wider">Galaxy Orthodontic Center</p>
          <p className="text-xs text-gray-500 mt-1 italic font-medium">"Satu Sistem untuk Mengelola Team GOC."</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">Masuk ke Sistem</h2>
            <p className="text-xs text-gray-500 mt-0.5">Gunakan kredensial akun tim Anda</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200/80 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Username atau Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username atau email terdaftar"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 pl-10 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden transition-all"
                />
                <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] font-semibold text-[#800020] hover:underline"
                >
                  Lupa Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 pl-10 pr-10 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden transition-all"
                />
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#800020] focus:ring-[#800020]"
                />
                <span className="text-xs text-gray-600 font-medium">Ingat Saya (Remember Me)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#800020] py-3 text-xs font-bold text-white shadow-md shadow-[#800020]/25 hover:bg-[#6A041C] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Demo Account Switcher / Quick Fill for Testing */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Akses Cepat Pengujian (Role Demo):</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => setDemoCredentials('hendri.kurniawan', 'GocOwner2026!')}
                className="p-2 rounded-xl border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F8] transition-all text-left"
              >
                <p className="text-[11px] font-bold text-gray-900 truncate">Hendri K. (Owner)</p>
                <p className="text-[10px] text-[#800020] font-semibold">Super Admin</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('ervina.dewiyanti', 'GocPass2026!')}
                className="p-2 rounded-xl border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F8] transition-all text-left"
              >
                <p className="text-[11px] font-bold text-gray-900 truncate">drg. Ervina (PJ)</p>
                <p className="text-[10px] text-gray-500 font-semibold">PJ Klinik</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('weli.apriyani', 'GocPass2026!')}
                className="p-2 rounded-xl border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F8] transition-all text-left"
              >
                <p className="text-[11px] font-bold text-gray-900 truncate">Weli A. (Finance)</p>
                <p className="text-[10px] text-gray-500 font-semibold">+ Akses Payroll</p>
              </button>

              <button
                type="button"
                onClick={() => setDemoCredentials('ridwan.hadjriyanto', 'GocPass2026!')}
                className="p-2 rounded-xl border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F8] transition-all text-left"
              >
                <p className="text-[11px] font-bold text-gray-900 truncate">Ridwan (Digital Mkt)</p>
                <p className="text-[10px] text-gray-500 font-semibold">Staff Karyawan</p>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-400">
          Galaxy Orthodontic Center &bull; Internal System &bull; &copy; 2026
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Bantuan Lupa Password</h3>
            <p className="text-xs text-gray-500 mt-1">
              Kirimkan username atau email Anda untuk diteruskan kepada Owner/Super Admin GOC.
            </p>

            {forgotMessage ? (
              <div className="my-4 rounded-xl bg-green-50 p-3 text-xs text-green-800 border border-green-200">
                {forgotMessage}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="mt-4 space-y-3">
                <input
                  type="text"
                  required
                  value={forgotInput}
                  onChange={e => setForgotInput(e.target.value)}
                  placeholder="Username atau Email"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs focus:border-[#800020] outline-hidden"
                />
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full rounded-xl bg-[#800020] py-2 text-xs font-bold text-white hover:bg-[#6A041C] disabled:opacity-50"
                >
                  {forgotLoading ? 'Mengirim...' : 'Kirim Permintaan'}
                </button>
              </form>
            )}

            <div className="mt-4 pt-3 border-t border-gray-100 text-right">
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotMessage('');
                  setForgotInput('');
                }}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
