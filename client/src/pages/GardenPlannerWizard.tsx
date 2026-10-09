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
  onOpenAmazonAR?: (plant: Plant) => void;
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
  onOpenAmazonAR,
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn text-[#F4EFE6]">
      
      {/* MULTI-STEP PROGRESS INDICATOR: 01 SPACE, 02 DIRECTION, 03 CONDITIONS, 04 PLANTS, 05 VISUALIZE */}
      <div className="luxury-card rounded-[2rem] p-5 sm:p-6 border border-[#D4AF37]/30 shadow-xl bg-[#0B1D16]/90 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
              HERBAL SPACE PLANNER
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold luxury-gold-text mt-0.5">
              {stepsHeader[currentStep - 1]?.code} {stepsHeader[currentStep - 1]?.label}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            {stepsHeader.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all duration-200 ${
                  s.num === currentStep
                    ? 'luxury-btn-gold text-[#081711] shadow-md'
                    : s.num < currentStep
                    ? 'bg-[#D4AF37]/15 text-[#F6D985] border border-[#D4AF37]/35'
                    : 'text-[#A3C1AD] hover:text-[#F4EFE6] border border-transparent'
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
          <div className="luxury-card rounded-2xl p-4 border border-[#D4AF37]/25 bg-[#0E281E]/80 shadow-md max-w-md">
            <label className="text-[10px] font-bold text-[#A3C1AD] uppercase tracking-wider block">
              Garden Space Title
            </label>
            <input
              type="text"
              value={gardenName}
              onChange={(e) => setGardenName(e.target.value)}
              className="w-full text-lg font-serif font-bold text-[#F4EFE6] bg-transparent focus:outline-none placeholder-[#A3C1AD]/50"
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
              className="py-3.5 px-8 rounded-full luxury-btn-copper text-white text-xs font-bold tracking-wider transition duration-200 shadow-md flex items-center gap-2"
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
              className="py-3 px-6 rounded-full luxury-btn-secondary text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6] transition duration-200"
            >
              ← 01 SPACE
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-3.5 px-8 rounded-full luxury-btn-copper text-white text-xs font-bold tracking-wider transition duration-200 shadow-md flex items-center gap-2"
            >
              <span>03 CONDITIONS →</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 03 CONDITIONS (Environment Analysis with Large Selectable Glass Cards) */}
      {currentStep === 3 && (
        <div className="luxury-card rounded-[2.5rem] p-6 sm:p-10 border border-[#D4AF37]/30 shadow-xl space-y-10 bg-[#0B1D16]/90 backdrop-blur-xl">
          <div className="border-b border-[#D4AF37]/25 pb-6">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
              ENVIRONMENTAL ANALYSIS
            </span>
            <h3 className="text-2xl font-serif font-bold luxury-gold-text mt-0.5">
              Growing Conditions Questionnaire
            </h3>
            <p className="text-xs text-[#A3C1AD] mt-1">
              Select the natural illumination, spatial scale, and maintenance style of your room.
            </p>
          </div>

          <div className="space-y-8">
            {/* Question 1: How much sunlight does the space receive? (Low, Medium, High) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#F4EFE6] flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#D4AF37]" />
                How much sunlight does the space receive?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSunlight(lvl)}
                    className={`p-5 rounded-2xl border text-left transition duration-200 ${
                      sunlight === lvl
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F6D985] shadow-lg ring-2 ring-[#D4AF37]/50'
                        : 'border-[#D4AF37]/20 bg-[#0E281E]/70 text-[#A3C1AD] hover:bg-[#133528]/80 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block text-[#F4EFE6]">{lvl} Sunlight</span>
                    <span className="text-xs text-[#A3C1AD] mt-1 block">
                      {lvl === 'High' ? '5+ hrs direct morning sun' : lvl === 'Medium' ? 'Filtered dappled light' : 'Gentle indirect shade'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: How much space is available? (Small, Medium, Large) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#F4EFE6] flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[#D4AF37]" />
                How much space is available?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Small', 'Medium', 'Large'] as const).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setSpaceVolume(sp)}
                    className={`p-5 rounded-2xl border text-left transition duration-200 ${
                      spaceVolume === sp
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F6D985] shadow-lg ring-2 ring-[#D4AF37]/50'
                        : 'border-[#D4AF37]/20 bg-[#0E281E]/70 text-[#A3C1AD] hover:bg-[#133528]/80 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block text-[#F4EFE6]">{sp} Space</span>
                    <span className="text-xs text-[#A3C1AD] mt-1 block">
                      {sp === 'Small' ? 'Windowsill / Compact corner' : sp === 'Medium' ? 'Balcony / Veranda' : 'Expansive patio / Terrace'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: Where is the space? (Indoor, Balcony, Terrace, Outdoor) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#F4EFE6] flex items-center gap-2">
                <Home className="w-4 h-4 text-[#D4AF37]" />
                Where is the space?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['Indoor', 'Balcony', 'Terrace', 'Outdoor'] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocationType(loc)}
                    className={`p-5 rounded-2xl border text-left transition duration-200 ${
                      locationType === loc
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F6D985] shadow-lg ring-2 ring-[#D4AF37]/50'
                        : 'border-[#D4AF37]/20 bg-[#0E281E]/70 text-[#A3C1AD] hover:bg-[#133528]/80 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block text-[#F4EFE6]">{loc}</span>
                    <span className="text-[11px] text-[#A3C1AD] mt-1 block">Location</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question 4: How much maintenance do you prefer? (Low, Medium, High) */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#F4EFE6] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#E07A5F]" />
                How much maintenance do you prefer?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Low', 'Medium', 'High'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMaintenance(m)}
                    className={`p-5 rounded-2xl border text-left transition duration-200 ${
                      maintenance === m
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 text-[#F6D985] shadow-lg ring-2 ring-[#D4AF37]/50'
                        : 'border-[#D4AF37]/20 bg-[#0E281E]/70 text-[#A3C1AD] hover:bg-[#133528]/80 hover:border-[#D4AF37]/40'
                    }`}
                  >
                    <span className="text-base font-serif font-bold block text-[#F4EFE6]">{m} Maintenance</span>
                    <span className="text-xs text-[#A3C1AD] mt-1 block">
                      {m === 'Low' ? 'Hardy & forgiving flora' : m === 'Medium' ? 'Balanced routine' : 'Attentive care'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-[#D4AF37]/25">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-3 px-6 rounded-full luxury-btn-secondary text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6] transition duration-200"
            >
              ← 02 DIRECTION
            </button>

            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-3.5 px-8 rounded-full luxury-btn-copper text-white text-xs font-bold tracking-wider transition duration-200 shadow-md flex items-center gap-2"
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
            onViewInYourSpace={onOpenAmazonAR}
            onAutoArrangePlants={handleAutoArrangeRecommended}
            onDirectionChange={setSelectedDirection}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="py-3 px-6 rounded-full luxury-btn-secondary text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6] transition duration-200"
            >
              ← 03 CONDITIONS
            </button>

            <button
              type="button"
              onClick={() => {
                if (placedPlants.length === 0 && catalogPlants.length > 0) {
                  handleSelectPlantForLayout(catalogPlants[0]);
                } else {
                  setCurrentStep(5);
                }
              }}
              className="py-3.5 px-8 rounded-full luxury-btn-copper text-white text-xs font-bold tracking-wider transition duration-200 shadow-md flex items-center gap-2"
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
          <div className="luxury-card rounded-[2rem] p-4 border border-[#D4AF37]/30 shadow-xl bg-[#0B1D16]/90 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
                SPATIAL EDITOR
              </span>
              <h3 className="text-xl font-serif font-bold luxury-gold-text mt-0.5">
                Virtual Garden & AR Staging
              </h3>
            </div>

            {/* Switching between: 3D View, Top View, AR View */}
            <div className="flex bg-[#081711] p-1.5 rounded-full border border-[#D4AF37]/30 text-xs font-bold shadow-inner">
              <button
                type="button"
                onClick={() => setVisualizeMode('3d')}
                className={`py-2 px-5 rounded-full transition duration-200 ${
                  visualizeMode === '3d'
                    ? 'luxury-btn-gold text-[#081711] shadow-md'
                    : 'text-[#A3C1AD] hover:text-[#F4EFE6]'
                }`}
              >
                3D View
              </button>
              <button
                type="button"
                onClick={() => setVisualizeMode('top')}
                className={`py-2 px-5 rounded-full transition duration-200 ${
                  visualizeMode === 'top'
                    ? 'luxury-btn-gold text-[#081711] shadow-md'
                    : 'text-[#A3C1AD] hover:text-[#F4EFE6]'
                }`}
              >
                Top View
              </button>
              <button
                type="button"
                onClick={() => setVisualizeMode('ar')}
                className={`py-2 px-5 rounded-full transition duration-200 flex items-center gap-1.5 ${
                  visualizeMode === 'ar'
                    ? 'luxury-btn-gold text-[#081711] shadow-md'
                    : 'text-[#A3C1AD] hover:text-[#F4EFE6]'
                }`}
              >
                <Camera className={`w-3.5 h-3.5 ${visualizeMode === 'ar' ? 'text-[#081711]' : 'text-[#D4AF37]'}`} />
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
              onOpenAmazonAR={onOpenAmazonAR}
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
              <p className="text-xs text-[#A3C1AD] text-center">
                Interactive 3D Garden Visualization powered by Three.js WebGL. Drag plants within the boundary, verify spacing indicators, optimize layout, or switch to <strong className="text-[#F6D985]">Top View</strong> or <strong className="text-[#F6D985]">AR View</strong>.
              </p>
            </div>
          )}

          {/* Save Status & Confirmation */}
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-[#0E281E] border border-[#22C55E]/40 text-xs text-[#F4EFE6] flex items-center justify-between shadow-lg">
              <span className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                Garden design saved successfully to your collection!
              </span>
              <button
                type="button"
                onClick={() => onNavigate('gardens')}
                className="px-4 py-1.5 rounded-full luxury-btn-gold text-[#081711] font-bold transition duration-200 shadow-xs"
              >
                View in My Garden →
              </button>
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-2xl bg-[#3B1212] border border-[#EF4444]/40 text-xs text-[#FCA5A5] flex items-center gap-2 shadow-lg">
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="py-3 px-6 rounded-full luxury-btn-secondary text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6] transition duration-200"
            >
              ← 04 PLANTS
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveGarden}
              className="py-3.5 px-8 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold tracking-wider transition duration-200 shadow-lg shadow-[#D4AF37]/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#081711]" />
              <span>{isSaving ? 'Saving...' : editingGardenId ? 'UPDATE GARDEN' : 'SAVE GARDEN'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
