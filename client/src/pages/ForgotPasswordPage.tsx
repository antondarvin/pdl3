import React, { useState } from 'react';
import { api } from '../services/api';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (tab: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await api.forgotPassword({ email, newPassword: newPassword || undefined });
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 text-[#F4EFE6]">
      <div className="max-w-md w-full luxury-card bg-[#0B1D16]/90 backdrop-blur-xl rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#0E281E] border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <span className="text-2xl">🔑</span>
          </div>
          <h2 className="text-3xl font-serif font-bold luxury-gold-text tracking-wide">
            Reset Password
          </h2>
          <p className="text-xs text-[#A3C1AD]">
            Enter your email and optionally define your new sanctuary passphrase.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#6ee7b7] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#fca5a5] flex items-center gap-2">
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
            <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              New Password (Optional)
            </label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-4 py-3 rounded-xl border border-[#D4AF37]/30 bg-[#0E281E]/80 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs tracking-wider transition duration-200 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Update Password'}
            <ArrowRight className="w-4 h-4 text-[#081711]" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#A3C1AD]">
          Remembered?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#D4AF37] font-bold hover:text-[#F6D985] transition-colors underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};
