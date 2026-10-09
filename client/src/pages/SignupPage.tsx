import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, AlertCircle } from 'lucide-react';

interface SignupPageProps {
  onNavigate: (tab: string) => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!acceptTerms) {
      setError('Please acknowledge the educational terms.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, confirmPassword, acceptTerms);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-[#F4EFE6]">
      <div className="max-w-md w-full luxury-card bg-[#0B1D16]/90 backdrop-blur-xl rounded-[2.5rem] border border-[#D4AF37]/30 shadow-[0_25px_60px_rgba(0,0,0,0.6)] p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#0E281E] border border-[#D4AF37]/40 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <span className="text-2xl">🌿</span>
          </div>
          <h2 className="text-3xl font-serif font-bold luxury-gold-text tracking-wide">
            Begin Your Herbal Space
          </h2>
          <p className="text-xs text-[#A3C1AD]">
            Create a curator account to design and preserve sacred botanical spaces.
          </p>
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
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0E281E]/80 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

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
              className="w-full px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0E281E]/80 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0E281E]/80 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#D4AF37]/30 bg-[#0E281E]/80 text-sm text-[#F4EFE6] placeholder:text-[#A3C1AD]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 text-xs text-[#A3C1AD] cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="rounded border-[#D4AF37]/40 bg-[#0E281E] text-[#D4AF37] accent-[#D4AF37] focus:ring-[#D4AF37] mt-0.5"
              />
              <span className="leading-relaxed">
                I understand AYUSH medicinal & Vastu guidance is educational and reflects traditional heritage.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs tracking-wider transition duration-200 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Curator Account'}
            <ArrowRight className="w-4 h-4 text-[#081711]" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#A3C1AD]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#D4AF37] font-bold hover:text-[#F6D985] transition-colors underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
