import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin();
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 text-[#0F172A]">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm p-8 sm:p-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="text-3xl block">🌿</span>
          <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
            Botanical Portal
          </h2>
          <p className="text-xs text-[#64748B]">
            Sign in to access your saved herbal garden layouts.
          </p>
        </div>

        {/* Demo Fast Access Card */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#0F172A] block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" /> One-Click Demo Access
            </span>
            <span className="text-[11px] text-[#64748B]">Immediate evaluation mode</span>
          </div>
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="py-1.5 px-3.5 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white text-xs font-bold transition duration-200 shadow-xs disabled:opacity-50"
          >
            Demo Login
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs text-[#2563EB] hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-[#64748B] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
              />
              Remember my session
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#64748B]">
          New to the garden?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-[#2563EB] font-bold hover:underline"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};
