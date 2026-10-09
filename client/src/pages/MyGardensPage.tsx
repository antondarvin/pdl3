import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Garden } from '../types';
import { 
  FolderHeart, 
  Trash2, 
  Copy, 
  Edit3, 
  Compass, 
  Ruler, 
  Plus, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface MyGardensPageProps {
  onNavigate: (tab: string, param?: string) => void;
}

export const MyGardensPage: React.FC<MyGardensPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [gardens, setGardens] = useState<Garden[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGardens = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getGardens();
      setGardens(data);
    } catch (err) {
      console.warn('Error fetching gardens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGardens();
  }, [user]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    try {
      await api.deleteGarden(id);
      setGardens((prev) => prev.filter((g) => g._id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting garden.');
    }
  };

  const handleDuplicate = async (garden: Garden) => {
    try {
      const res = await api.createGarden({
        gardenName: `${garden.gardenName} (Copy)`,
        roomType: garden.roomType,
        length: garden.length,
        width: garden.width,
        direction: garden.direction,
        plants: garden.plants,
        notes: garden.notes,
      });
      setGardens((prev) => [res.garden, ...prev]);
    } catch (err: any) {
      alert(err.message || 'Error duplicating layout.');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-10 bg-white rounded-[2.5rem] border border-[#E2E8F0] shadow-sm text-center space-y-4">
        <span className="text-3xl block">🪴</span>
        <h3 className="text-xl font-serif font-bold text-[#0F172A]">Sign in to access your spaces</h3>
        <p className="text-xs text-[#64748B]">
          Save and manage your personalized AYUSH layouts across multiple rooms.
        </p>
        <button
          onClick={() => onNavigate('login')}
          className="py-2.5 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold transition duration-200 shadow-sm"
        >
          Sign In / Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#0F172A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
            SAVED SPACES
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A] mt-0.5">
            My Botanical Spaces
          </h1>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('planner')}
          className="py-3 px-6 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold flex items-center gap-2 self-start sm:self-auto transition duration-200 shadow-md shadow-[#F97316]/20"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Plan New Space</span>
        </button>
      </div>

      {/* Gardens Visual Previews */}
      {gardens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gardens.map((garden) => {
            const area = garden.length * garden.width;

            return (
              <div
                key={garden._id}
                className="bg-white hover-lift rounded-[2.5rem] p-7 border border-[#E2E8F0] shadow-xs hover:border-[#2563EB]/40 flex flex-col justify-between space-y-6 transition duration-200"
              >
                <div className="space-y-4">
                  {/* Title & Direction */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                        {garden.roomType}
                      </span>
                      <h3 className="text-xl font-serif font-bold text-[#0F172A] mt-1 line-clamp-1">
                        {garden.gardenName}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-[#2563EB] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#2563EB]/20">
                      {garden.direction}
                    </span>
                  </div>

                  {/* Visual Space Card Graphic */}
                  <div className="h-40 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 flex flex-col justify-between">
                    <div className="flex justify-between text-xs text-[#64748B]">
                      <span>{garden.length} × {garden.width} ft</span>
                      <strong className="text-[#0F172A] font-serif">{area} sq.ft</strong>
                    </div>

                    <div className="flex items-center justify-center gap-2">
                      {garden.plants?.slice(0, 4).map((p, pIdx) => (
                        <img
                          key={pIdx}
                          src={p.image}
                          alt={p.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                        />
                      ))}
                      {(garden.plants?.length || 0) > 4 && (
                        <span className="w-10 h-10 rounded-full bg-white text-[#0F172A] text-xs font-serif font-bold flex items-center justify-center border border-[#E2E8F0]">
                          +{garden.plants.length - 4}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-[#64748B] text-center font-mono">
                      {garden.plants?.length || 0} plants placed
                    </span>
                  </div>
                </div>

                {/* Buttons per requirement: Open, Edit, Duplicate, Delete */}
                <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onNavigate('planner', garden._id)}
                      className="py-1.5 px-3.5 rounded-full text-xs font-bold text-[#2563EB] hover:bg-[#2563EB]/10 border border-[#2563EB]/30 transition duration-200"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('planner', garden._id)}
                      className="py-1.5 px-3.5 rounded-full text-xs font-bold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition duration-200"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicate(garden)}
                      title="Duplicate"
                      className="p-2 rounded-full text-[#64748B] hover:text-[#2563EB] hover:bg-[#F8FAFC] transition duration-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(garden._id, garden.gardenName)}
                      title="Delete"
                      className="p-2 rounded-full text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State per requirement: “No garden yet 🌱”, “Create your first herbal space.”, Button “Start Planning” */
        <div className="py-24 text-center bg-white rounded-[3rem] border border-[#E2E8F0] shadow-sm max-w-lg mx-auto space-y-4">
          <span className="text-4xl block">🌱</span>
          <h3 className="text-2xl font-serif font-bold text-[#0F172A]">
            No garden yet 🌱
          </h3>
          <p className="text-xs text-[#64748B] max-w-xs mx-auto">
            Create your first herbal space.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onNavigate('planner')}
              className="py-3 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20"
            >
              Start Planning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
