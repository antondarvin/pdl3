const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('ayush_garden_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async register(data: { name: string; email: string; password: string; confirmPassword?: string; acceptTerms?: boolean }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json;
  },

  async login(data: { email: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    return json;
  },

  async forgotPassword(data: { email: string; newPassword?: string }) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Forgot password request failed');
    return json;
  },

  // Plants
  async getPlants(params?: {
    search?: string;
    ayushSystem?: string;
    sunlight?: string;
    watering?: string;
    indoorOutdoor?: string;
    maintenanceLevel?: string;
    sort?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val && val !== 'All') query.append(key, val);
      });
    }
    const res = await fetch(`${API_BASE}/plants?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch plants');
    return res.json();
  },

  async getPlantById(id: string) {
    const res = await fetch(`${API_BASE}/plants/${id}`);
    if (!res.ok) throw new Error('Failed to fetch plant details');
    return res.json();
  },

  // User Profile & Stats
  async getProfile() {
    const res = await fetch(`${API_BASE}/user/profile`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch user profile');
    return res.json();
  },

  async updateProfile(data: any) {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update profile');
    return json;
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/user/stats`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch user stats');
    return res.json();
  },

  async getActivity() {
    const res = await fetch(`${API_BASE}/user/activity`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch user activity');
    return res.json();
  },

  // Saved Plants
  async getSavedPlants() {
    const res = await fetch(`${API_BASE}/user/saved-plants`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch saved plants');
    return res.json();
  },

  async savePlant(plantId: string) {
    const res = await fetch(`${API_BASE}/user/saved-plants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ plantId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save plant');
    return json;
  },

  async removeSavedPlant(plantId: string) {
    const res = await fetch(`${API_BASE}/user/saved-plants/${plantId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to remove plant');
    return json;
  },

  // Gardens
  async getGardens() {
    const res = await fetch(`${API_BASE}/gardens`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch gardens');
    return res.json();
  },

  async getGardenById(id: string) {
    const res = await fetch(`${API_BASE}/gardens/${id}`, {
      headers: { ...getAuthHeader() }
    });
    if (!res.ok) throw new Error('Failed to fetch garden');
    return res.json();
  },

  async createGarden(gardenData: any) {
    const res = await fetch(`${API_BASE}/gardens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(gardenData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create garden');
    return json;
  },

  async updateGarden(id: string, gardenData: any) {
    const res = await fetch(`${API_BASE}/gardens/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(gardenData)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update garden');
    return json;
  },

  async deleteGarden(id: string) {
    const res = await fetch(`${API_BASE}/gardens/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete garden');
    return json;
  },

  // Quizzes
  async getQuizQuestions() {
    const res = await fetch(`${API_BASE}/quiz`);
    if (!res.ok) throw new Error('Failed to fetch quiz questions');
    return res.json();
  },

  async submitQuizResult(data: { score: number; totalQuestions: number; answers: any[]; category?: string }) {
    const res = await fetch(`${API_BASE}/quiz/results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to submit quiz results');
    return json;
  }
};
