import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import { Plant, Garden } from './types';

// Components
import { Navbar } from './components/Navbar';
import { MobileNav } from './components/MobileNav';
import { Footer } from './components/Footer';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { PWAInstallModal } from './components/PWAInstallModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlantsExplorerPage } from './pages/PlantsExplorerPage';
import { PlantDetailPage } from './pages/PlantDetailPage';
import { GardenPlannerWizard } from './pages/GardenPlannerWizard';
import { MyGardensPage } from './pages/MyGardensPage';
import { SavedPlantsPage } from './pages/SavedPlantsPage';
import { LearningQuizPage } from './pages/LearningQuizPage';
import { ProfilePage } from './pages/ProfilePage';

export function AppContent() {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [plantToPlaceInGarden, setPlantToPlaceInGarden] = useState<Plant | null>(null);
  const [gardenToLoad, setGardenToLoad] = useState<Garden | null>(null);
  const [initialPlannerMode, setInitialPlannerMode] = useState<'3d' | 'top' | 'ar'>('3d');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [pwaInstallPrompt, setPwaInstallPrompt] = useState<any>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.startsWith('android-app://') ||
      localStorage.getItem('ayush_garden_pwa_installed') === 'true';
    return isStandalone;
  });

  // Load plants on mount
  useEffect(() => {
    async function loadPlantCatalog() {
      try {
        const res = await api.getPlants();
        setPlants(res.plants || []);
      } catch (err) {
        console.warn('Error fetching plant catalog:', err);
      } finally {
        setLoadingPlants(false);
      }
    }
    loadPlantCatalog();

    // Check if running as installed app
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.startsWith('android-app://') ||
        localStorage.getItem('ayush_garden_pwa_installed') === 'true';
      if (isStandalone) {
        setIsAppInstalled(true);
        setPwaInstallPrompt(null);
      }
    };
    checkInstalled();

    // PWA install prompt event listener
    const installHandler = (e: any) => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        localStorage.getItem('ayush_garden_pwa_installed') === 'true';
      if (isStandalone) {
        setIsAppInstalled(true);
        return;
      }
      e.preventDefault();
      setPwaInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', installHandler);

    // Fired by browser when user successfully installs the PWA on Android / Desktop
    const appInstalledHandler = () => {
      setIsAppInstalled(true);
      setPwaInstallPrompt(null);
      setIsInstallModalOpen(false);
      try {
        localStorage.setItem('ayush_garden_pwa_installed', 'true');
      } catch (_) {}
    };
    window.addEventListener('appinstalled', appInstalledHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', installHandler);
      window.removeEventListener('appinstalled', appInstalledHandler);
    };
  }, []);

  const handleNavigate = async (tab: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (tab === 'plants' && param) {
      // Find plant by id
      const found = plants.find((p) => p._id === param);
      if (found) {
        setSelectedPlant(found);
        setCurrentTab('plant-detail');
        return;
      }
    }

    if (tab === 'planner') {
      if (param === 'ar') {
        setInitialPlannerMode('ar');
      } else if (param) {
        // Load garden by ID for cross-device synchronization
        try {
          const garden = await api.getGardenById(param);
          if (garden) {
            setGardenToLoad(garden);
            setInitialPlannerMode('3d');
          }
        } catch (err) {
          console.warn('Failed to load garden with id:', param, err);
        }
      } else {
        setInitialPlannerMode('3d');
      }
      setCurrentTab('planner');
      return;
    }

    setCurrentTab(tab);
  };

  const handleViewPlantDetails = (plant: Plant) => {
    setSelectedPlant(plant);
    setCurrentTab('plant-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToGarden = (plant: Plant) => {
    setPlantToPlaceInGarden(plant);
    setGardenToLoad(null);
    setInitialPlannerMode('3d');
    setCurrentTab('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] selection:bg-[#2563EB]/20 selection:text-[#2563EB] font-sans pb-16 md:pb-0">
      {/* PWA Install Banner (Hidden once app is installed) */}
      {!isAppInstalled && pwaInstallPrompt && (
        <div className="bg-[#0F172A] text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800">
          <span className="truncate pr-2">🌿 Install AYUSH Garden for offline botanical care & full-screen 3D AR space planning!</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsInstallModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-lg transition duration-200 shadow-sm"
            >
              Install App
            </button>
            <button
              onClick={() => setPwaInstallPrompt(null)}
              className="text-slate-400 hover:text-white px-1 transition"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Global Regulatory & Ethical Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Navigation Header (Install button hidden once installed) */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenInstallModal={isAppInstalled ? undefined : () => setIsInstallModalOpen(true)}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentTab === 'landing' && (
          <LandingPage
            featuredPlants={plants}
            onNavigate={handleNavigate}
            onViewPlantDetails={handleViewPlantDetails}
          />
        )}

        {currentTab === 'login' && (
          <LoginPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'signup' && (
          <SignupPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'forgot-password' && (
          <ForgotPasswordPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'plants' && (
          <PlantsExplorerPage
            plants={plants}
            onViewPlantDetails={handleViewPlantDetails}
            onAddToGarden={handleAddToGarden}
          />
        )}

        {currentTab === 'plant-detail' && selectedPlant && (
          <PlantDetailPage
            plant={selectedPlant}
            onBack={() => setCurrentTab('plants')}
            onAddToGarden={handleAddToGarden}
            onVisualizeInRoom={() => {
              setPlantToPlaceInGarden(selectedPlant);
              setCurrentTab('planner');
            }}
          />
        )}

        {currentTab === 'planner' && (
          <GardenPlannerWizard
            catalogPlants={plants}
            onNavigate={handleNavigate}
            onViewPlantDetails={handleViewPlantDetails}
            initialPlantToPlace={plantToPlaceInGarden}
            onClearInitialPlant={() => setPlantToPlaceInGarden(null)}
            initialGardenToLoad={gardenToLoad}
            onClearGardenToLoad={() => setGardenToLoad(null)}
            initialVisualizeMode={initialPlannerMode}
          />
        )}

        {currentTab === 'gardens' && (
          <MyGardensPage onNavigate={handleNavigate} />
        )}

        {currentTab === 'saved' && (
          <SavedPlantsPage
            onNavigate={handleNavigate}
            onViewPlantDetails={handleViewPlantDetails}
            onAddToGarden={handleAddToGarden}
          />
        )}

        {currentTab === 'quiz' && (
          <LearningQuizPage />
        )}

        {currentTab === 'profile' && (
          <ProfilePage onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Bottom Mobile Navigation for Phones and Tablets */}
      <MobileNav
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenInstallModal={isAppInstalled ? undefined : () => setIsInstallModalOpen(true)}
      />

      {/* Cross-Platform PWA Installation Modal */}
      <PWAInstallModal
        isOpen={!isAppInstalled && isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={pwaInstallPrompt}
        onInstalled={() => {
          setIsAppInstalled(true);
          setPwaInstallPrompt(null);
          setIsInstallModalOpen(false);
          try {
            localStorage.setItem('ayush_garden_pwa_installed', 'true');
          } catch (_) {}
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
