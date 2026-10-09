import React, { useRef, useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { PlacedPlant, Plant } from '../types';
import { createProceduralPlantMesh } from '../utils/botanical3DModels';
import { detectARCapabilities, ARCapabilityReport } from '../utils/arCapabilities';
import {
  filterPlantsByVastuDirection,
  normalizeVastuDirection,
  VASTU_DIRECTIONS,
  getVastuDirectionMetadata
} from '../utils/vastuRules';
import {
  evaluatePlacementSuitability,
  SpotSuitabilityResult
} from '../utils/plantPlacementDetector';
import { 
  ArrowLeft, 
  Camera, 
  CameraOff, 
  Plus, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Trash2, 
  Save, 
  X,
  Sparkles,
  Info,
  ShieldCheck,
  AlertTriangle,
  Move,
  Maximize2
} from 'lucide-react';

interface ARGardenCanvasProps {
  plants: PlacedPlant[];
  catalogPlants: Plant[];
  onUpdatePlants: (plants: PlacedPlant[]) => void;
  direction: string;
  onBackToWizard?: () => void;
  onSaveGarden?: () => void;
  onFallbackTo3D?: () => void;
  onOpenAmazonAR?: (plant: Plant) => void;
}

export const ARGardenCanvas: React.FC<ARGardenCanvasProps> = ({
  plants,
  catalogPlants,
  onUpdatePlants,
  direction,
  onBackToWizard,
  onSaveGarden,
  onFallbackTo3D,
  onOpenAmazonAR,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(plants[0]?.id || null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<ARCapabilityReport | null>(null);
  const [surfaceDetected, setSurfaceDetected] = useState(false);

  // Vastu Direction Filtering State
  const [arDirection, setArDirection] = useState<string>(direction || 'North-East');

  useEffect(() => {
    if (direction) setArDirection(direction);
  }, [direction]);

  const canonicalArDir = normalizeVastuDirection(arDirection);
  const arDirMeta = getVastuDirectionMetadata(canonicalArDir);

  const vastuFilteredARPlants = useMemo(() => {
    return filterPlantsByVastuDirection(catalogPlants, canonicalArDir);
  }, [catalogPlants, canonicalArDir]);

  // Three.js Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const plantMeshesMap = useRef<Map<string, THREE.Group>>(new Map());
  const reticleRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    detectARCapabilities().then(setCapabilities);
  }, []);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const isHttpNonLocal = typeof window !== 'undefined' && 
          window.location.protocol === 'http:' && 
          window.location.hostname !== 'localhost' && 
          window.location.hostname !== '127.0.0.1';
        if (isHttpNonLocal) {
          throw new Error('Mobile browsers restrict camera to HTTPS. Deploy to Vercel (free HTTPS) or switch to 3D mode.');
        }
        throw new Error('Camera hardware access is unavailable on this browser.');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facing }, width: { ideal: 1280, max: 1920 }, height: { ideal: 720, max: 1080 } },
          audio: false,
        });
      } catch (err1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false,
          });
        } catch (err2) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        try {
          await videoRef.current.play();
        } catch (_) {}
      }
      setStreamActive(true);
      setTimeout(() => setSurfaceDetected(true), 1200);
    } catch (err: any) {
      console.warn('Camera could not be accessed:', err);
      let msg = err.message || 'Camera permission was denied or camera hardware was not found.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission was denied in your browser settings. You can switch to the 3D garden planner.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No video capture device was detected on this computer/phone.';
      }
      setCameraError(msg);
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (streamActive) {
      startCamera(nextFacing);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Initialize Three.js WebGL Scene on Mount
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 2.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Realistic AR Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.9);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.5);
    sunLight.position.set(3, 6, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    // Shadow Catcher Ground
    const shadowGeo = new THREE.PlaneGeometry(20, 20);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.5;
    shadowMesh.receiveShadow = true;
    scene.add(shadowMesh);

    // Placement Reticle
    const reticle = new THREE.Group();
    const ringGeo = new THREE.RingGeometry(0.2, 0.24, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    reticle.add(ring);
    reticle.position.set(0, -0.49, 0);
    scene.add(reticle);
    reticleRef.current = reticle;

    // Animation loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Breathe reticle
      if (reticleRef.current) {
        const pulse = 1 + Math.sin(elapsed * 3.5) * 0.05;
        reticleRef.current.scale.set(pulse, 1, pulse);
      }

      // Foliage sway
      plantMeshesMap.current.forEach((mesh) => {
        const foliage = mesh.getObjectByName('foliage');
        if (foliage) {
          for (let i = 0; i < foliage.children.length; i++) {
            const leaf = foliage.children[i];
            leaf.rotation.z += Math.sin(elapsed * 2 + i) * 0.0005;
          }
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth || 800;
      const newH = container.clientHeight || 600;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Sync 3D Plant Meshes whenever `plants` changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old plant meshes
    plantMeshesMap.current.forEach((mesh) => {
      scene.remove(mesh);
    });
    plantMeshesMap.current.clear();

    // Rebuild 3D plant meshes
    plants.forEach((p) => {
      const plantCatalogItem = catalogPlants.find((c) => c._id === p.plantId) || {
        name: p.name,
        model3D: p.model3D,
      };

      const mesh = createProceduralPlantMesh(plantCatalogItem as Plant, {
        scale: p.scale * 0.8,
        quality: 'hq',
        includePot: true,
      });

      // Map 0-100% coordinates to 3D world space (e.g. -2.5m to +2.5m)
      const worldX = ((p.x - 50) / 50) * 1.8;
      const worldZ = ((p.y - 50) / 50) * 1.8;

      mesh.position.set(worldX, -0.5, worldZ);
      mesh.rotation.y = (p.rotation * Math.PI) / 180;

      scene.add(mesh);
      plantMeshesMap.current.set(p.id, mesh);
    });
  }, [plants, catalogPlants]);

  const activePlant = plants.find((p) => p.id === selectedPlantId) || plants[0] || null;

  const activeCatalogPlant = useMemo(() => {
    if (!activePlant) return catalogPlants[0];
    return catalogPlants.find((c) => c._id === activePlant.plantId) || catalogPlants[0];
  }, [activePlant, catalogPlants]);

  const arSuitability = useMemo(() => {
    if (!activeCatalogPlant) return null;
    return evaluatePlacementSuitability(activeCatalogPlant, {
      compassHeading:
        canonicalArDir === 'North' ? 0 :
        canonicalArDir === 'North-East' ? 45 :
        canonicalArDir === 'East' ? 90 :
        canonicalArDir === 'South-East' ? 135 :
        canonicalArDir === 'South' ? 180 :
        canonicalArDir === 'South-West' ? 225 :
        canonicalArDir === 'West' ? 270 : 315,
      manualSunlight: 'High',
    });
  }, [activeCatalogPlant, canonicalArDir]);

  // Screen Tap or Touch to Move Plant in 3D Space
  const handleCanvasInteraction = (clientX: number, clientY: number) => {
    if (!mountRef.current || !cameraRef.current || !selectedPlantId) return;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.5);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const intersect = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersect);

    if (intersect) {
      // Map world coords back to percentage
      const pctX = Math.round(50 + (intersect.x / 1.8) * 50);
      const pctY = Math.round(50 + (intersect.z / 1.8) * 50);

      onUpdatePlants(
        plants.map((p) =>
          p.id === selectedPlantId
            ? {
                ...p,
                x: Math.max(10, Math.min(90, pctX)),
                y: Math.max(15, Math.min(85, pctY)),
              }
            : p
        )
      );

      if (reticleRef.current) {
        reticleRef.current.position.set(intersect.x, -0.49, intersect.z);
      }
    }
  };

  const handleCanvasTap = (e: React.MouseEvent<HTMLDivElement>) => {
    handleCanvasInteraction(e.clientX, e.clientY);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.changedTouches && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      handleCanvasInteraction(touch.clientX, touch.clientY);
    }
  };

  const handleRotate = () => {
    if (!selectedPlantId) return;
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedPlantId ? { ...p, rotation: (p.rotation + 45) % 360 } : p
      )
    );
  };

  const handleResize = (delta: number) => {
    if (!selectedPlantId) return;
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedPlantId
          ? { ...p, scale: Math.max(0.6, Math.min(2.4, Math.round((p.scale + delta) * 10) / 10)) }
          : p
      )
    );
  };

  const handleDelete = () => {
    if (!selectedPlantId) return;
    const remaining = plants.filter((p) => p.id !== selectedPlantId);
    onUpdatePlants(remaining);
    setSelectedPlantId(remaining[0]?.id || null);
  };

  const handleAddPlant = (plant: Plant) => {
    const newPlaced: PlacedPlant = {
      id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      plantId: plant._id,
      name: plant.name,
      scientificName: plant.scientificName,
      image: plant.image,
      x: 50 + (Math.random() * 20 - 10),
      y: 50 + (Math.random() * 20 - 10),
      rotation: 0,
      scale: 1.0,
      model3D: plant.model3D,
      potSizeFt: plant.defaultPotDiameterFt || 1.0,
      spacingRequiredFt: plant.spacingRequiredFt || 1.5,
    };
    onUpdatePlants([...plants, newPlaced]);
    setSelectedPlantId(newPlaced.id);
    setShowCatalogModal(false);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[540px] sm:h-[650px] lg:h-[720px] rounded-3xl overflow-hidden bg-slate-950 select-none shadow-2xl border border-slate-800 font-sans"
    >
      
      {/* 1. CAMERA PRE-PERMISSION SCREEN */}
      {!streamActive && (
        <div className="absolute inset-0 z-30 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center text-white space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-inner">
            <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-[#2563EB]" />
          </div>

          <div className="max-w-md space-y-2">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#2563EB] uppercase block">
              AMAZON-STYLE 3D AUGMENTED REALITY
            </span>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Launch Plant AR Visualizer
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Experience genuine 3D medicinal plants rendered at real physical scale in your room, balcony floor, or courtyard.
            </p>
          </div>

          {/* Camera facing selector */}
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-full border border-slate-800 text-xs font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => setCameraFacing('environment')}
              className={`px-3 py-1.5 rounded-full transition ${
                cameraFacing === 'environment' ? 'bg-[#2563EB] text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Back Camera (Phone)
            </button>
            <button
              type="button"
              onClick={() => setCameraFacing('user')}
              className={`px-3 py-1.5 rounded-full transition ${
                cameraFacing === 'user' ? 'bg-[#2563EB] text-white shadow-xs' : 'hover:text-white'
              }`}
            >
              Webcam (Laptop)
            </button>
          </div>

          {cameraError ? (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 max-w-sm space-y-2">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Camera Unavailable</span>
              </div>
              <p className="text-[11px] leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-slate-500 max-w-sm">
              <Info className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
              <span>Permission requested only upon launching. Video stays 100% private in browser.</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md justify-center pt-2">
            <button
              type="button"
              onClick={() => startCamera(cameraFacing)}
              className="py-3 px-6 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-bold text-xs tracking-wider transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-white" />
              <span>Start AR Camera</span>
            </button>

            {onOpenAmazonAR && activePlant && (
              <button
                type="button"
                onClick={() => onOpenAmazonAR(catalogPlants.find(c => c._id === activePlant.plantId) || catalogPlants[0])}
                className="py-3 px-6 rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Full Amazon AR</span>
              </button>
            )}

            {onFallbackTo3D && (
              <button
                type="button"
                onClick={onFallbackTo3D}
                className="py-3 px-6 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wider border border-slate-700 transition"
              >
                3D Fallback
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. LIVE CAMERA VIDEO FEED */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* 3. THREE.JS 3D WEBGL OVERLAY CANVAS */}
      <div
        ref={mountRef}
        onClick={handleCanvasTap}
        onTouchEnd={handleCanvasTouch}
        className="absolute inset-0 w-full h-full z-10 cursor-crosshair"
        style={{ touchAction: 'manipulation' }}
      />

      {/* 4. TOP HUD (Navigation, Mode, Controls) */}
      <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-2 pointer-events-auto">
          {onBackToWizard && (
            <button
              type="button"
              onClick={onBackToWizard}
              className="p-2.5 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl text-[#F4EFE6] border border-[#D4AF37]/35 hover:bg-[#0E281E] transition shadow min-h-[40px] min-w-[40px] flex items-center justify-center"
              title="Return to Wizard"
            >
              <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
            </button>
          )}

          <div className="bg-[#0B1D16]/90 backdrop-blur-xl px-4 py-1.5 rounded-full border border-[#D4AF37]/30 text-[#F4EFE6] flex items-center gap-2 shadow-2xl text-xs">
            <span className={`w-2 h-2 rounded-full ${surfaceDetected ? 'bg-[#10B981] animate-pulse' : 'bg-[#D4AF37]'}`} />
            <span className="font-serif font-bold luxury-gold-text tracking-wider uppercase text-[10px]">
              {surfaceDetected ? '3D SURFACE LOCKED' : 'SCANNING FLOOR'}
            </span>
            <span className="text-[#A3C1AD] text-[10px] hidden sm:inline">| {direction}</span>
          </div>
        </div>

        {/* Right HUD: Full Amazon AR Launcher, Flip Camera, Stop */}
        {streamActive && (
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {onOpenAmazonAR && activePlant && (
              <button
                type="button"
                onClick={() => onOpenAmazonAR(catalogPlants.find(c => c._id === activePlant.plantId) || catalogPlants[0])}
                className="luxury-btn-gold text-[#081711] px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-lg shadow-[#D4AF37]/20"
                title="Open Fullscreen View in Your Space"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#081711]" />
                <span className="text-[11px] hidden sm:inline">Fullscreen AR</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleCameraFacing}
              className="bg-[#0B1D16]/90 backdrop-blur-md text-[#F4EFE6] px-3 py-1.5 rounded-full text-xs border border-[#D4AF37]/30 hover:bg-[#0E281E] transition flex items-center gap-1"
              title="Flip Front / Rear Camera"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>

            <button
              type="button"
              onClick={stopCamera}
              className="bg-[#0B1D16]/90 backdrop-blur-md text-[#fca5a5] px-3 py-1.5 rounded-full text-xs border border-red-500/30 hover:bg-red-950/40 transition flex items-center gap-1"
              title="Stop Camera"
            >
              <CameraOff className="w-3.5 h-3.5 text-[#fca5a5]" />
            </button>
          </div>
        )}
      </div>

      {/* Surface Tap & Real-Time Placement Suitability Guidance HUD */}
      {streamActive && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3 w-full max-w-lg pointer-events-none animate-fadeIn flex flex-col items-center gap-1.5">
          {arSuitability ? (
            <div className={`px-4 py-2 rounded-2xl border backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-2xl w-full ${arSuitability.badgeClass}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  arSuitability.status === 'optimal'
                    ? 'bg-[#10B981] animate-ping'
                    : arSuitability.status === 'moderate'
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#EF4444]'
                }`} />
                <span className="font-bold">
                  {arSuitability.status === 'optimal'
                    ? `✨ Optimal Spot: ${activeCatalogPlant?.name} suits ${arSuitability.currentDirection}`
                    : arSuitability.hudHeadline}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#A3C1AD] italic">
                  {arSuitability.hudSubtitle}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-mono font-bold">
                  {arSuitability.overallScore}%
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-[#0B1D16]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#D4AF37]/30 text-[#A3C1AD] text-[11px] flex items-center gap-1.5 shadow-md">
              <Info className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Tap anywhere on the floor to position 3D plant. True 3D perspective rendered.</span>
            </div>
          )}
        </div>
      )}

      {/* 5. BOTTOM HUD CONTROLS: TRANSFORM CONTROLS & SAVE */}
      {streamActive && (
        <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none z-30">
          
          {/* Active Plant Controls */}
          {activePlant ? (
            <div className="pointer-events-auto bg-[#0B1D16]/95 backdrop-blur-2xl rounded-2xl p-2 border border-[#D4AF37]/35 shadow-2xl flex items-center gap-1 text-[#F4EFE6]">
              <span className="text-xs font-serif font-bold luxury-gold-text px-2 truncate max-w-[120px]">
                {activePlant.name}
              </span>
              <button
                type="button"
                onClick={handleRotate}
                className="p-2 rounded-xl hover:bg-[#D4AF37]/15 text-[#F4EFE6] transition active:scale-95"
                title="Rotate 45°"
              >
                <RotateCw className="w-4 h-4 text-[#D4AF37]" />
              </button>
              <button
                type="button"
                onClick={() => handleResize(0.15)}
                className="p-2 rounded-xl hover:bg-[#D4AF37]/15 text-[#F4EFE6] transition active:scale-95"
                title="Scale Larger"
              >
                <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
              </button>
              <button
                type="button"
                onClick={() => handleResize(-0.15)}
                className="p-2 rounded-xl hover:bg-[#D4AF37]/15 text-[#F4EFE6] transition active:scale-95"
                title="Scale Smaller"
              >
                <ZoomOut className="w-4 h-4 text-[#D4AF37]" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-xl hover:bg-red-900/40 text-[#fca5a5] transition active:scale-95"
                title="Remove Plant"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="pointer-events-auto bg-[#0B1D16]/85 backdrop-blur-md px-3 py-1.5 rounded-full text-xs text-[#A3C1AD] border border-[#D4AF37]/25">
              Select or add a plant to stage in AR.
            </div>
          )}

          {/* Add Plant & Save Garden buttons */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCatalogModal(true)}
              className="py-2.5 px-4 rounded-full luxury-btn-secondary backdrop-blur-md text-[#F4EFE6] font-bold text-xs border border-[#D4AF37]/35 transition flex items-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Add Plant</span>
            </button>

            {onSaveGarden && (
              <button
                type="button"
                onClick={onSaveGarden}
                className="py-2.5 px-5 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs tracking-wider transition shadow-lg shadow-[#D4AF37]/20 flex items-center gap-1.5 min-h-[44px]"
              >
                <Save className="w-3.5 h-3.5 text-[#081711]" />
                <span>Save Garden</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. ADD PLANT MODAL */}
      {showCatalogModal && (
        <div className="absolute inset-0 z-50 bg-[#081711]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm luxury-card bg-[#0B1D16]/95 rounded-3xl p-5 shadow-2xl text-[#F4EFE6] border border-[#D4AF37]/35 space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                  VASTU AR NURSERY
                </span>
                <h4 className="text-base font-serif font-bold luxury-gold-text">
                  Place 3D Plant in AR Space
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1 rounded-full text-[#A3C1AD] hover:text-[#F4EFE6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Vastu Direction Filter Pills */}
            <div className="py-1.5 border-b border-[#D4AF37]/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#A3C1AD] font-medium">Zone:</span>
                <span className="text-[10px] font-bold text-[#F6D985]">
                  {arDirMeta.name} • {arDirMeta.sanskrit}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {Object.keys(VASTU_DIRECTIONS).map((dirKey) => {
                  const isSelected = canonicalArDir === dirKey;
                  return (
                    <button
                      key={dirKey}
                      type="button"
                      onClick={() => setArDirection(dirKey)}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition ${
                        isSelected
                          ? 'luxury-btn-gold text-[#081711] shadow-xs'
                          : 'bg-[#0E281E] text-[#A3C1AD] border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:text-[#F4EFE6]'
                      }`}
                    >
                      {dirKey}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {vastuFilteredARPlants.length === 0 ? (
                <div className="p-4 text-center luxury-card bg-[#0E281E]/40 border border-[#D4AF37]/20 rounded-xl my-4">
                  <AlertTriangle className="w-6 h-6 text-[#D4AF37] mx-auto mb-1 opacity-80" />
                  <h5 className="text-xs font-serif font-bold text-[#F4EFE6]">
                    No Species Auspicious for {canonicalArDir}
                  </h5>
                  <p className="text-[10px] text-[#A3C1AD] mt-0.5">
                    Select another direction pill above.
                  </p>
                </div>
              ) : (
                vastuFilteredARPlants.map((plant) => (
                  <div
                    key={plant._id}
                    onClick={() => handleAddPlant(plant)}
                    className="p-2.5 rounded-xl border border-[#D4AF37]/25 hover:border-[#D4AF37] hover:bg-[#0E281E] bg-[#0E281E]/60 cursor-pointer flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={plant.image}
                        alt={plant.name}
                        className="w-10 h-10 rounded-lg object-cover border border-[#D4AF37]/30"
                      />
                      <div>
                        <h5 className="text-xs font-serif font-bold text-[#F4EFE6]">
                          {plant.name}
                        </h5>
                        <span className="text-[10px] text-[#A3C1AD] font-mono">
                          Spacing: {plant.spacingRequiredFt || 1.5} ft
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#D4AF37]">Place +</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-[#D4AF37]/20 flex justify-between items-center text-[10px] text-[#A3C1AD]">
              <span>{vastuFilteredARPlants.length} auspicious species for {canonicalArDir}</span>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="text-[#F6D985] font-semibold hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
