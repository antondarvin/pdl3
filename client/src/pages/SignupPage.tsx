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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-[#0F172A]">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-3xl block">🌿</span>
          <h2 className="text-3xl font-serif font-bold text-[#0F172A]">
            Begin Your Herbal Space
          </h2>
          <p className="text-xs text-[#64748B]">
            Create a curator account to design and save botanical spaces.
          </p>
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
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aarav Sharma"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

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
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Password (min 6 chars)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Confirm Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2 text-xs text-[#64748B] cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB] mt-0.5"
              />
              <span>
                I understand AYUSH medicinal & Vastu guidance is educational and reflects traditional heritage.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Curator Account'}
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-[#64748B]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="text-[#2563EB] font-bold hover:underline"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};
