import React, { useState } from 'react';
import { Plant, PlacedPlant, Garden } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DirectionCompass } from '../components/DirectionCompass';
import { RoomMeasurer } from '../components/RoomMeasurer';
import { VastuRecommendationEngine } from '../components/VastuRecommendationEngine';
import { Garden2DPlanner } from '../components/Garden2DPlanner';
import { ARGardenCanvas } from '../components/ARGardenCanvas';
import { Plant3DViewer } from '../components/Plant3DViewer';
import { Garden3DVisualization } from '../components/Garden3DVisualization';
import { calculateGardenAreaStats, getPlantSpacingInfo } from '../utils/gardenSpacing';
import { 
  Compass, 
  Ruler, 
  Sun, 
  Droplets, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Save, 
  Layers, 
  Camera, 
  Check, 
  AlertCircle,
  Home,
  CheckCircle2
} from 'lucide-react';

interface GardenPlannerWizardProps {
  catalogPlants: Plant[];
  onNavigate: (tab: string, param?: string) => void;
  onViewPlantDetails: (plant: Plant) => void;
  initialPlantToPlace?: Plant | null;
  onClearInitialPlant?: () => void;
  initialGardenToLoad?: Garden | null;
  onClearGardenToLoad?: () => void;
  initialVisualizeMode?: '3d' | 'top' | 'ar';
}

export const GardenPlannerWizard: React.FC<GardenPlannerWizardProps> = ({
  catalogPlants,
  onNavigate,
  onViewPlantDetails,
  initialPlantToPlace,
  onClearInitialPlant,
  initialGardenToLoad,
  onClearGardenToLoad,
  initialVisualizeMode = '3d',
}) => {
  const { user } = useAuth();

  // Multi-step progress indicator: 01 SPACE, 02 DIRECTION, 03 CONDITIONS, 04 PLANTS, 05 VISUALIZE
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Space state
  const [gardenName, setGardenName] = useState<string>('My Living Room Herbal Space');
  const [dimensions, setDimensions] = useState<{ length: number; width: number; height?: number }>({
    length: 12,
    width: 8,
    height: 9,
  });

  // Direction state
  const [selectedDirection, setSelectedDirection] = useState<string>('North-East');

  // Conditions state
  const [sunlight, setSunlight] = useState<'Low' | 'Medium' | 'High'>('High');
  const [spaceVolume, setSpaceVolume] = useState<'Small' | 'Medium' | 'Large'>('Medium');
  const [locationType, setLocationType] = useState<'Indoor' | 'Balcony' | 'Terrace' | 'Outdoor'>('Balcony');
  const [maintenance, setMaintenance] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Visualize state
  const [visualizeMode, setVisualizeMode] = useState<'3d' | 'top' | 'ar'>(initialVisualizeMode);
  const [placedPlants, setPlacedPlants] = useState<PlacedPlant[]>([]);
  const [editingGardenId, setEditingGardenId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const areaSqFt = dimensions.length * dimensions.width;

  const stepsHeader = [
    { num: 1, code: '01', label: 'SPACE' },
    { num: 2, code: '02', label: 'DIRECTION' },
    { num: 3, code: '03', label: 'CONDITIONS' },
    { num: 4, code: '04', label: 'PLANTS' },
    { num: 5, code: '05', label: 'VISUALIZE' },
  ];

  // Auto-seed default plants if empty
  const handleSelectPlantForLayout = (plant: Plant) => {
    const spacingInfo = getPlantSpacingInfo(plant);
    const newPlaced: PlacedPlant = {
      id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      plantId: plant._id,
      name: plant.name,
      scientificName: plant.scientificName,
      image: plant.image,
      x: 35 + (Math.random() * 30),
      y: 40 + (Math.random() * 30),
      rotation: Math.floor(Math.random() * 360),
      scale: 1.0,
      model3D: plant.model3D,
      potSizeFt: spacingInfo.defaultPotDiameterFt,
      spacingRequiredFt: spacingInfo.recommendedSpacingFt,
    };
    setPlacedPlants((prev) => [...prev, newPlaced]);
    setVisualizeMode('3d');
    setCurrentStep(5);
  };

  // Smart Auto-Arrangement of Top Vastu Recommended Plants
  const handleAutoArrangeRecommended = (recommendedList: Plant[]) => {
    const top = recommendedList.slice(0, Math.min(4, recommendedList.length));
    const quadrantCoords = [
      { x: 70, y: 30 }, // North-East (Ishanya)
      { x: 30, y: 30 }, // North-West (Vayu)
      { x: 70, y: 70 }, // South-East (Agni)
      { x: 30, y: 70 }, // South-West (Nairrutya)
    ];

    const newPlaced: PlacedPlant[] = top.map((plant, idx) => {
      const spacingInfo = getPlantSpacingInfo(plant);
      const coord = quadrantCoords[idx % quadrantCoords.length];
      return {
        id: `placed_auto_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
        plantId: plant._id,
        name: plant.name,
        scientificName: plant.scientificName,
        image: plant.image,
        x: coord.x,
        y: coord.y,
        rotation: 0,
        scale: 1.0,
        model3D: plant.model3D,
        potSizeFt: spacingInfo.defaultPotDiameterFt,
        spacingRequiredFt: spacingInfo.recommendedSpacingFt,
      };
    });

    setPlacedPlants(newPlaced);
    setVisualizeMode('3d');
    setCurrentStep(5);
  };

  // Auto-place plant when arriving from "Place in 3D Garden" button
  React.useEffect(() => {
    if (initialPlantToPlace) {
      handleSelectPlantForLayout(initialPlantToPlace);
      if (onClearInitialPlant) onClearInitialPlant();
    }
  }, [initialPlantToPlace]);

  // Load existing garden when navigating for cross-device sync
  React.useEffect(() => {
    if (initialGardenToLoad) {
      setGardenName(initialGardenToLoad.gardenName);
      setDimensions({
        length: initialGardenToLoad.length,
        width: initialGardenToLoad.width,
        height: 9,
      });
      setSelectedDirection(initialGardenToLoad.direction || 'North-East');
      setLocationType((initialGardenToLoad.roomType as any) || 'Balcony');
      setPlacedPlants(initialGardenToLoad.plants || []);
      setEditingGardenId(initialGardenToLoad._id);
      setCurrentStep(5);
      if (initialVisualizeMode) setVisualizeMode(initialVisualizeMode);
      if (onClearGardenToLoad) onClearGardenToLoad();
    }
  }, [initialGardenToLoad]);

  React.useEffect(() => {
    if (initialVisualizeMode) {
      setVisualizeMode(initialVisualizeMode);
      if (initialVisualizeMode === 'ar') {
        setCurrentStep(5);
      }
    }
  }, [initialVisualizeMode]);

  const handleSaveGarden = async () => {
    if (!user) {
      alert('Please sign in or use demo login to save your garden layouts.');
      onNavigate('login');
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      if (editingGardenId) {
        await api.updateGarden(editingGardenId, {
          gardenName: gardenName.trim() || 'My Herbal Garden',
          roomType: locationType,
          length: dimensions.length,
          width: dimensions.width,
          direction: selectedDirection,
          plants: placedPlants,
          notes: `Sunlight: ${sunlight}, Space: ${spaceVolume}, Maintenance: ${maintenance}`,
          unit: 'ft',
          totalSquareFeet: dimensions.length * dimensions.width,
        });
      } else {
        const res = await api.createGarden({
          gardenName: gardenName.trim() || 'My Herbal Garden',
          roomType: locationType,
          length: dimensions.length,
          width: dimensions.width,
          direction: selectedDirection,
          plants: placedPlants,
          notes: `Sunlight: ${sunlight}, Space: ${spaceVolume}, Maintenance: ${maintenance}`,
          unit: 'ft',
          totalSquareFeet: dimensions.length * dimensions.width,
        });
        if (res?.garden?._id) {
          setEditingGardenId(res.garden._id);
        }
      }
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save garden design.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#0F172A]">
      
      {/* MULTI-STEP PROGRESS INDICATOR: 01 SPACE, 02 DIRECTION, 03 CONDITIONS, 04 PLANTS, 05 VISUALIZE */}
      <div className="bg-white rounded-[2rem] p-5 sm:p-6 border border-[#E2E8F0] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
              HERBAL SPACE PLANNER
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#0F172A] mt-0.5">
              {stepsHeader[currentStep - 1]?.code} {stepsHeader[currentStep - 1]?.label}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            {stepsHeader.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  s.num === currentStep
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : s.num < currentStep
                    ? 'bg-[#2563EB]/10 text-[#2563EB]'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {s.code} {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 1: 01 SPACE (Room Diagram, Length, Width, Calculated Area) */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs max-w-md">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Garden Space Title
            </label>
            <input
              type="text"
              value={gardenName}
              onChange={(e) => setGardenName(e.target.value)}
              className="w-full text-lg font-serif font-bold text-[#0F172A] bg-transparent focus:outline-none"
            />
          </div>

          <RoomMeasurer
            length={dimensions.length}
            width={dimensions.width}
            height={dimensions.height}
            usedAreaSqFt={calculateGardenAreaStats(dimensions.length, dimensions.width, placedPlants).plantOccupiedAreaSqFt}
            onChange={setDimensions}
          />

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-3.5 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center gap-2"
            >
              <span>02 DIRECTION →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 02 DIRECTION (Animated Compass, N-NE-E-SE-S-SW-W-NW, Prominent Detection) */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <DirectionCompass
            selectedDirection={selectedDirection}
            onDirectionChange={setSelectedDirection}
            onConfirmDirection={() => setCurrentStep(3)}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-3 px-6 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition duration-200"
            >
              ← 01 SPACE
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-3.5 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center gap-2"
            >
              <span>03 CONDITIONS →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 03 CONDITIONS (Environment Analysis with Large Selectable Glass Cards) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-10 border border-[#E2E8F0] shadow-xs space-y-10">
          <div className="border-b border-[#E2E8F0] pb-6">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
              ENVIRONMENTAL ANALYSIS
            </span>
            <h3 className="text-2xl font-serif font-bold text-[#0F172A] mt-0.5">
              Growing Conditions Questionnaire
            </h3>
            <p className="text-xs text-[#64748B] mt-1">
              Select the natural illumination, spatial scale, and maintenance style of your room.
            </p>
          </div>

          <div className="space-y-8">
            {/* Question 1: How much sunlight does the space receive? (Low, Medium, High) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#F97316]" />
                How much sunlight does the space receive?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSunlight(lvl)}
                    className={`p-5 rounded-2xl border text-left transition ${
                      sunlight === lvl
                        ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#0F172A] shadow-xs ring-2 ring-[#2563EB]'
                        : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block">{lvl} Sunlight</span>
                    <span className="text-xs text-[#64748B] mt-1 block">
                      {lvl === 'High' ? '5+ hrs direct morning sun' : lvl === 'Medium' ? 'Filtered dappled light' : 'Gentle indirect shade'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: How much space is available? (Small, Medium, Large) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#2563EB]" />
                How much space is available?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Small', 'Medium', 'Large'] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpaceVolume(sp)}
                    className={`p-5 rounded-2xl border text-left transition ${
                      spaceVolume === sp
                        ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#0F172A] shadow-xs ring-2 ring-[#2563EB]'
                        : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block">{sp} Space</span>
                    <span className="text-xs text-[#64748B] mt-1 block">
                      {sp === 'Small' ? 'Windowsill / Compact corner' : sp === 'Medium' ? 'Balcony / Veranda' : 'Expansive patio / Terrace'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: Where is the space? (Indoor, Balcony, Terrace, Outdoor) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                <Home className="w-4 h-4 text-[#2563EB]" />
                Where is the space?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['Indoor', 'Balcony', 'Terrace', 'Outdoor'] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationType(loc)}
                    className={`p-5 rounded-2xl border text-left transition ${
                      locationType === loc
                        ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#0F172A] shadow-xs ring-2 ring-[#2563EB]'
                        : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block">{loc}</span>
                    <span className="text-[11px] text-[#64748B] mt-1 block">Location</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 4: How much maintenance do you prefer? (Low, Medium, High) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F97316]" />
                How much maintenance do you prefer?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Low', 'Medium', 'High'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMaintenance(m)}
                    className={`p-5 rounded-2xl border text-left transition ${
                      maintenance === m
                        ? 'border-[#2563EB] bg-[#2563EB]/5 text-[#0F172A] shadow-xs ring-2 ring-[#2563EB]'
                        : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block">{m} Maintenance</span>
                    <span className="text-xs text-[#64748B] mt-1 block">
                      {m === 'Low' ? 'Hardy & forgiving flora' : m === 'Medium' ? 'Balanced routine' : 'Attentive care'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-3 px-6 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition duration-200"
            >
              ← 02 DIRECTION
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-3.5 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center gap-2"
            >
              <span>04 PLANTS →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 04 PLANTS (Recommendation Screen per specifications) */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <VastuRecommendationEngine
            plants={catalogPlants}
            direction={selectedDirection}
            roomType={locationType}
            sunlight={sunlight}
            waterAvailability="Moderate"
            maintenancePreference={maintenance}
            spaceSqFt={areaSqFt}
            onSelectPlantForGarden={handleSelectPlantForLayout}
            onViewPlantDetails={onViewPlantDetails}
            onAutoArrangePlants={handleAutoArrangeRecommended}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-3 px-6 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition duration-200"
            >
              ← 03 CONDITIONS
            </button>

            <button
              type="button"
              onClick={() => {
                if (placedPlants.length === 0 && catalogPlants.length > 0) {
                  // Seed Tulsi & Aloe
                  handleSelectPlantForLayout(catalogPlants[0]);
                } else {
                  setCurrentStep(5);
                }
              }}
              className="py-3.5 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center gap-2"
            >
              <span>05 VISUALIZE →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: 05 VISUALIZE (Virtual Garden Editor: 3D View, Top View, AR View) */}
      {currentStep === 5 && (
        <div className="space-y-6">
          {/* View Mode Switcher: 3D View, Top View, AR View */}
          <div className="bg-white rounded-[2rem] p-4 border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
                SPATIAL EDITOR
              </span>
              <h3 className="text-xl font-serif font-bold text-[#0F172A] mt-0.5">
                Virtual Garden & AR Staging
              </h3>
            </div>

            {/* Switching between: 3D View, Top View, AR View */}
            <div className="flex bg-[#F1F5F9] p-1 rounded-full border border-[#E2E8F0] text-xs font-bold">
              <button
                type="button"
                onClick={() => setVisualizeMode('3d')}
                className={`py-2 px-5 rounded-full transition duration-200 ${
                  visualizeMode === '3d'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                3D View
              </button>
              <button
                type="button"
                onClick={() => setVisualizeMode('top')}
                className={`py-2 px-5 rounded-full transition duration-200 ${
                  visualizeMode === 'top'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Top View
              </button>
              <button
                type="button"
                onClick={() => setVisualizeMode('ar')}
                className={`py-2 px-5 rounded-full transition duration-200 flex items-center gap-1.5 ${
                  visualizeMode === 'ar'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                <Camera className={`w-3.5 h-3.5 ${visualizeMode === 'ar' ? 'text-white' : 'text-[#64748B]'}`} />
                AR View
              </button>
            </div>
          </div>

          {/* Canvas Render according to mode */}
          {visualizeMode === 'ar' && (
            <ARGardenCanvas
              plants={placedPlants}
              catalogPlants={catalogPlants}
              onUpdatePlants={setPlacedPlants}
              direction={selectedDirection}
              onBackToWizard={() => setCurrentStep(4)}
              onSaveGarden={handleSaveGarden}
              onFallbackTo3D={() => setVisualizeMode('3d')}
            />
          )}

          {visualizeMode === 'top' && (
            <Garden2DPlanner
              length={dimensions.length}
              width={dimensions.width}
              direction={selectedDirection}
              plants={placedPlants}
              onUpdatePlants={setPlacedPlants}
            />
          )}

          {visualizeMode === '3d' && (
            <div className="space-y-4">
              <Garden3DVisualization
                gardenLength={dimensions.length}
                gardenWidth={dimensions.width}
                direction={selectedDirection}
                plants={placedPlants}
                catalogPlants={catalogPlants}
                onUpdatePlants={setPlacedPlants}
                onDimensionsChange={(newDims) => setDimensions((prev) => ({ ...prev, ...newDims }))}
                onDirectionChange={setSelectedDirection}
                onOpenMeasurer={() => setCurrentStep(1)}
                onViewInMySpace={() => setVisualizeMode('ar')}
              />
              <p className="text-xs text-[#64748B] text-center">
                Interactive 3D Garden Visualization powered by Three.js WebGL. Drag plants within the boundary, verify spacing indicators, optimize layout, or switch to <strong>Top View</strong> or <strong>AR View</strong>.
              </p>
            </div>
          )}

          {/* Save Status & Confirmation */}
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#0F172A] flex items-center justify-between">
              <span className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Garden design saved successfully to your collection!
              </span>
              <button
                type="button"
                onClick={() => onNavigate('gardens')}
                className="px-4 py-1.5 rounded-full bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold transition duration-200 shadow-xs"
              >
                View in My Garden →
              </button>
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-3 px-6 rounded-full bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition duration-200"
            >
              ← 04 PLANTS
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveGarden}
              className="py-3.5 px-8 rounded-full bg-[#F97316] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-xs font-bold tracking-wider transition duration-200 shadow-md shadow-[#F97316]/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{isSaving ? 'Saving...' : editingGardenId ? 'UPDATE GARDEN' : 'SAVE GARDEN'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
