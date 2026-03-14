import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BeakerIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const DEMO = [
  { role: 'Admin',      email: 'admin@pharmalab.com',  password: 'admin123'      },
  { role: 'Instructor', email: 'ravi@pharmalab.com',   password: 'instructor123' },
  { role: 'Student',    email: 'ananya@pharmalab.com', password: 'student123'    },
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const fillDemo = (d) => setForm({ email: d.email, password: d.password });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-pharma-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl shadow-lg mb-4">
            <BeakerIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Jaihind College of Pharmacy</h1>
          <p className="text-gray-500 mt-1 text-sm">Jaihind College of Pharmacy Lab Management System</p>
          <p className="text-gray-400 text-xs mt-1">B.Pharm 4-Year Course • 8 Semesters</p>
        </div>

        {/* Card */}
        <div className="card shadow-lg border-0">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email" required autoComplete="email"
                className="input"
                placeholder="you@email.com"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} required autoComplete="current-password"
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-base">
              {loading ? <span className="flex items-center gap-2"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Signing in...</span> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Demo Credentials</p>
            <div className="space-y-2">
              {DEMO.map((d) => (
                <button key={d.role} onClick={() => fillDemo(d)}
                  className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-primary-50 hover:border-primary-200 border border-transparent transition-all group">
                  <span>
                    <span className="font-medium text-gray-800 text-sm">{d.role}</span>
                    <span className="text-gray-500 text-xs ml-2">{d.email}</span>
                  </span>
                  <span className="text-xs text-primary-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Use this →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 mt-4">jaihind college of pharmacy@2026</p>
      </div>
    </div>
  );
};

export default LoginPage;
