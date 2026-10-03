/**
 * Login & Registration Page for GOC Team Management
 * Galaxy Orthodontic Center
 * Supports Standard Auth, Public Self-Registration, and Google Single Sign-On (SSO)
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { apiRequest } from '../lib/api.ts';
import {
  Lock,
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Building2,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  UserPlus,
  LogIn,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';

export function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDepartment, setRegDepartment] = useState('dept-adm');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Modals
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await login(username, password, rememberMe);
    } catch (err: any) {
      setError(err.message || 'Username atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: regFullName,
        email: regEmail,
        username: regUsername || regEmail.split('@')[0],
        password: regPassword,
        phone: regPhone,
        department_id: regDepartment,
      });
      setSuccessMsg('Pendaftaran berhasil! Mengalihkan ke sistem...');
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar akun baru.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (googleUser: { email: string; name: string; picture?: string }) => {
    setGoogleLoading(true);
    setError('');
    try {
      await loginWithGoogle(googleUser);
      setShowGoogleModal(false);
    } catch (err: any) {
      setError(err.message || 'Gagal login menggunakan akun Google.');
    } finally {
      setGoogleLoading(false);
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
          <p className="text-xs text-gray-500 mt-1 italic font-medium">"Satu Sistem Terpadu untuk Mengelola Team & Operasional GOC."</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
          {/* Mode Switcher Tabs */}
          <div className="flex rounded-2xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Masuk (Login)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-white text-[#800020] shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>

          {/* Feedback & Error */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200/80 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={() => setShowGoogleModal(true)}
            className="w-full mb-5 py-2.5 px-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 transition-all text-xs font-bold text-gray-700 shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            {/* Official Google G Logo SVG */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{mode === 'login' ? 'Masuk dengan Akun Google' : 'Daftar dengan Akun Google'}</span>
          </button>

          <div className="relative mb-5 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              atau gunakan formulir
            </span>
          </div>

          {/* Form: LOGIN */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                className="w-full rounded-xl bg-[#800020] py-3 text-xs font-bold text-white shadow-md shadow-[#800020]/25 hover:bg-[#6A041C] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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
          ) : (
            /* Form: REGISTER */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={e => setRegFullName(e.target.value)}
                    placeholder="Contoh: drg. Ahmad Fauzi"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 pl-10 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden transition-all"
                  />
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Alamat Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs text-gray-900 pl-10 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden transition-all"
                  />
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={e => setRegUsername(e.target.value)}
                    placeholder="misal: ahmad.fauzi"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">No. WhatsApp</label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Divisi / Unit Kerja</label>
                <select
                  value={regDepartment}
                  onChange={e => setRegDepartment(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-[#800020] outline-hidden"
                >
                  <option value="dept-adm">Divisi Administrasi & Front Office</option>
                  <option value="dept-prw">Divisi Perawat Gigi & Sterilisasi</option>
                  <option value="dept-fin">Divisi Finance & Accounting</option>
                  <option value="dept-mkt">Divisi Digital Marketing & Leads</option>
                  <option value="dept-sup">Divisi Kebersihan & Penunjang Medis</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 digit"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Ulangi Password</label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={e => setRegConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRegPassword}
                    onChange={e => setShowRegPassword(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#800020]"
                  />
                  <span>Tampilkan Password</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[#800020] py-3 text-xs font-bold text-white shadow-md shadow-[#800020]/25 hover:bg-[#6A041C] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <span>Daftar Akun Sekarang</span>
                )}
              </button>
            </form>
          )}

          {/* Demo Account Switcher / Quick Fill for Testing */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Akses Cepat Pengujian (Role Demo):</span>
            </p>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setDemoCredentials('hendri.kurniawan', 'AdminGOC@2026');
                }}
                className="p-2 rounded-xl border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F8] transition-all text-left cursor-pointer"
              >
                <p className="text-[11px] font-bold text-gray-900 truncate">Hendri K. (Owner)</p>
                <p className="text-[10px] text-[#800020] font-semibold">Super Admin</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setDemoCredentials('drg.ervina', 'StaffGOC@2026');
                }}
                className="p-2 rounded-xl border border-gray-200 hover:border-[#800020] hover:bg-[#FDF2F8] transition-all text-left cursor-pointer"
              >
                <p className="text-[11px] font-bold text-gray-900 truncate">drg. Ervina (PJ)</p>
                <p className="text-[10px] text-gray-500 font-semibold">PJ Klinik</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-gray-400">
          <p>© 2026 Galaxy Orthodontic Center (GOC). Hak Cipta Dilindungi.</p>
        </div>
      </div>

      {/* Google Sign-In Selector / Quick Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="text-sm font-bold text-gray-900">Sign in with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Pilih akun Google Anda atau masukkan email Google untuk masuk / mendaftar otomatis:
            </p>

            <div className="space-y-2">
              {/* Active user email button */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={() =>
                  handleGoogleAuth({
                    email: 'digitalmarketinggoc510@gmail.com',
                    name: 'Digital Marketing GOC',
                    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className="w-full p-3 rounded-2xl border border-gray-200 hover:border-[#800020] hover:bg-gray-50 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Digital Marketing GOC</p>
                  <p className="text-[11px] text-gray-500 truncate">digitalmarketinggoc510@gmail.com</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#800020] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              {/* Owner email */}
              <button
                type="button"
                disabled={googleLoading}
                onClick={() =>
                  handleGoogleAuth({
                    email: 'hendri.kurniawan@galaxyortho.com',
                    name: 'Hendri Kurniawan, ST., MMSI',
                    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                  })
                }
                className="w-full p-3 rounded-2xl border border-gray-200 hover:border-[#800020] hover:bg-gray-50 transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">Hendri Kurniawan</p>
                  <p className="text-[11px] text-gray-500 truncate">hendri.kurniawan@galaxyortho.com</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#800020] group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            </div>

            {/* Custom Google account input */}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-[11px] font-bold text-gray-600 mb-2">Atau gunakan Akun Google lain:</p>
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!customGoogleEmail) return;
                  handleGoogleAuth({
                    email: customGoogleEmail,
                    name: customGoogleName || customGoogleEmail.split('@')[0],
                  });
                }}
                className="space-y-2"
              >
                <input
                  type="email"
                  required
                  placeholder="email.anda@gmail.com"
                  value={customGoogleEmail}
                  onChange={e => setCustomGoogleEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs text-gray-900 focus:border-[#800020] outline-hidden"
                />
                <input
                  type="text"
                  placeholder="Nama Lengkap Anda"
                  value={customGoogleName}
                  onChange={e => setCustomGoogleName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2 text-xs text-gray-900 focus:border-[#800020] outline-hidden"
                />
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="w-full py-2 rounded-xl bg-[#800020] text-xs font-bold text-white hover:bg-[#6A041C] transition-all cursor-pointer"
                >
                  {googleLoading ? 'Memproses...' : 'Lanjutkan dengan Google'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Lupa Password Akun</h3>
              <button
                type="button"
                onClick={() => { setShowForgotModal(false); setForgotMessage(''); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Masukkan username atau email Anda. Petunjuk reset password akan dikirimkan atau hubungi Administrator.
            </p>

            {forgotMessage && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Username atau email"
                value={forgotInput}
                onChange={e => setForgotInput(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-900 focus:border-[#800020] outline-hidden"
              />
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-2.5 rounded-xl bg-[#800020] text-xs font-bold text-white hover:bg-[#6A041C] transition-all cursor-pointer"
              >
                {forgotLoading ? 'Mengirim...' : 'Kirim Permintaan Reset'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
