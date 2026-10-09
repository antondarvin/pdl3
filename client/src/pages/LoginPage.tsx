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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 text-[#F4EFE6]">
      <div className="max-w-md w-full luxury-card bg-[#0B1D16]/90 backdrop-blur-xl rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-8 sm:p-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#0E281E] border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <span className="text-2xl">🌿</span>
          </div>
          <h2 className="text-3xl font-serif font-bold luxury-gold-text tracking-wide">
            Botanical Portal
          </h2>
          <p className="text-xs text-[#A3C1AD]">
            Sign in to access your saved herbal garden sanctuaries.
          </p>
        </div>

        {/* Demo Fast Access Card */}
        <div className="p-4 rounded-2xl bg-[#0E281E]/70 border border-[#D4AF37]/20 flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#F4EFE6] block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> One-Click Demo Access
            </span>
            <span className="text-[11px] text-[#A3C1AD]/80">Immediate evaluation mode</span>
          </div>
          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading}
            className="py-1.5 px-4 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold transition duration-200 shadow-sm disabled:opacity-50"
          >
            Demo Login
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#fca5a5] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="curator@sanctuary.com"
              className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 bg-[#0E281E]/80 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs text-[#D4AF37] hover:text-[#F6D985] transition-colors"
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
              className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 bg-[#0E281E]/80 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-[#A3C1AD] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-[#D4AF37]/40 bg-[#0E281E] text-[#D4AF37] accent-[#D4AF37] focus:ring-[#D4AF37]"
              />
              Remember my session
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs tracking-wider transition duration-200 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Sanctuary'}
            <ArrowRight className="w-4 h-4 text-[#081711]" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#A3C1AD]">
          New to the garden?{' '}
          <button
            type="button"
            onClick={() => onNavigate('signup')}
            className="text-[#D4AF37] font-bold hover:text-[#F6D985] transition-colors underline"
          >
            Create an account
          </button>
        </div>
      </div>
    </div>
  );
};
