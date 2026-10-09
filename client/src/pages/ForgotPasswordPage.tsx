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
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12 text-[#0F172A]">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-3xl block">🔑</span>
          <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
            Reset Password
          </h2>
          <p className="text-xs text-[#64748B]">
            Enter your email and optionally define your new password.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#0F172A] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
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
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              New Password (Optional)
            </label>
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-bold text-xs tracking-wider transition duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Update Password'}
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#64748B]">
          Remembered?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#2563EB] font-bold hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};
