import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  User, 
  Bell, 
  LogOut, 
  Trash2, 
  Check, 
  AlertCircle, 
  Sprout, 
  FolderHeart, 
  Award,
  Save,
  BookOpen
} from 'lucide-react';

interface ProfilePageProps {
  onNavigate: (tab: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [wateringReminders, setWateringReminders] = useState(true);
  const [seasonalTips, setSeasonalTips] = useState(true);
  const [quizChallenges, setQuizChallenges] = useState(false);

  const [stats, setStats] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      if (user.notificationPreferences) {
        setWateringReminders(user.notificationPreferences.wateringReminders);
        setSeasonalTips(user.notificationPreferences.seasonalTips);
        setQuizChallenges(user.notificationPreferences.quizChallenges);
      }
    }
    async function loadStats() {
      try {
        const s = await api.getStats();
        setStats(s);
      } catch {}
    }
    loadStats();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);
    setIsUpdating(true);

    try {
      const payload: any = {
        name,
        notificationPreferences: {
          wateringReminders,
          seasonalTips,
          quizChallenges,
        },
      };

      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      await api.updateProfile(payload);
      await refreshUser();
      setStatusMsg('Profile and preferences updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile settings.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = prompt('Type DELETE to permanently remove your account:');
    if (confirmDelete === 'DELETE') {
      try {
        const token = localStorage.getItem('ayush_garden_token');
        await fetch('http://localhost:5000/api/user/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        logout();
        alert('Your account has been removed.');
        onNavigate('landing');
      } catch (err: any) {
        alert(err.message || 'Error deleting account.');
      }
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-10 bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm text-center space-y-4">
        <User className="w-12 h-12 text-[#2563EB] mx-auto" />
        <h3 className="text-xl font-serif font-bold text-[#0F172A]">Sign in to view your profile</h3>
        <p className="text-xs text-[#64748B]">
          Manage your account preferences, saved plant library, and garden layouts.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="py-2.5 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white font-bold text-xs transition duration-200 shadow-sm"
        >
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#0F172A]">
      {/* Profile Header Card */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-6 shadow-sm">
        <img
          src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
          alt={user.name}
          className="w-20 h-20 rounded-full border-2 border-[#2563EB] object-cover shadow-xs"
        />
        <div className="space-y-1 text-center sm:text-left flex-1">
          <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full inline-block mb-1">
            HERBARIUM CURATOR
          </span>
          <h1 className="text-3xl font-serif font-bold text-[#0F172A]">
            {user.name}
          </h1>
          <p className="text-xs text-[#64748B] font-mono">{user.email}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-center">
          <BookOpen className="w-5 h-5 text-[#2563EB] mx-auto mb-1" />
          <span className="text-xl font-serif font-bold text-[#0F172A]">
            {stats?.plantsExplored || 22}
          </span>
          <span className="text-[10px] text-[#64748B] block uppercase font-bold mt-0.5">Plants Explored</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-center">
          <Sprout className="w-5 h-5 text-[#22C55E] mx-auto mb-1" />
          <span className="text-xl font-serif font-bold text-[#0F172A]">
            {stats?.plantsSaved || 0}
          </span>
          <span className="text-[10px] text-[#64748B] block uppercase font-bold mt-0.5">Plants Saved</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-center">
          <FolderHeart className="w-5 h-5 text-[#F97316] mx-auto mb-1" />
          <span className="text-xl font-serif font-bold text-[#0F172A]">
            {stats?.gardenDesigns || 0}
          </span>
          <span className="text-[10px] text-[#64748B] block uppercase font-bold mt-0.5">Gardens Created</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs text-center">
          <Award className="w-5 h-5 text-[#2563EB] mx-auto mb-1" />
          <span className="text-xl font-serif font-bold text-[#0F172A]">
            {stats?.quizScore || '80%'}
          </span>
          <span className="text-[10px] text-[#64748B] block uppercase font-bold mt-0.5">Quiz Score</span>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#0F172A] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#22C55E] shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Clean Grouped Settings Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white rounded-[2.5rem] p-8 border border-[#E2E8F0] space-y-8 shadow-sm">
        <div className="border-b border-[#E2E8F0] pb-4">
          <h3 className="text-xl font-serif font-bold text-[#0F172A]">
            Account Preferences & Security
          </h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Update personal name, change password, and notification preferences.
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1.5 max-w-md">
          <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />
        </div>

        {/* Change Password Group */}
        <div className="space-y-3 pt-2 border-t border-[#E2E8F0] max-w-md">
          <span className="text-xs font-bold text-[#0F172A] block">Change Password</span>
          <div className="space-y-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
            <input
              type="password"
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>
        </div>

        {/* Notifications Group */}
        <div className="space-y-3 pt-2 border-t border-[#E2E8F0]">
          <span className="text-xs font-bold text-[#0F172A] block flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#2563EB]" />
            Seasonal Botanics & Reminders
          </span>
          <div className="space-y-2 text-xs text-[#0F172A]">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={wateringReminders}
                onChange={(e) => setWateringReminders(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
              />
              Watering & misting seasonal care reminders
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={seasonalTips}
                onChange={(e) => setSeasonalTips(e.target.checked)}
                className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
              />
              AYUSH seasonal Ritu-Charya recommendations
            </label>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="py-3 px-8 rounded-full bg-[#2563EB] hover:bg-[#1d4ed8] active:bg-[#1e40af] text-white font-bold text-xs tracking-wider transition duration-200 shadow-sm flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isUpdating ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Sign out and delete */}
      <div className="p-6 rounded-[2rem] bg-white border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={logout}
          className="py-2.5 px-6 rounded-full border border-[#E2E8F0] hover:bg-[#F8FAFC] text-xs font-bold text-[#64748B] hover:text-[#0F172A] flex items-center gap-2 transition duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>

        <button
          type="button"
          onClick={handleDeleteAccount}
          className="py-2.5 px-6 rounded-full border border-[#EF4444]/30 hover:bg-[#EF4444]/10 text-xs font-bold text-[#EF4444] flex items-center gap-2 transition duration-200"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
          Delete Account
        </button>
      </div>
    </div>
  );
};
