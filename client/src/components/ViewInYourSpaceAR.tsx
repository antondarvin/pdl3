import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Plant, PlacedPlant } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
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
  sampleVideoLuminance,
  SpotSuitabilityResult
} from '../utils/plantPlacementDetector';
import { 
  Camera, 
  CameraOff, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Check, 
  X, 
  Sparkles, 
  Save, 
  Compass, 
  Sun, 
  Droplets, 
  Ruler, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  Sliders,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface ViewInYourSpaceARProps {
  initialPlant: Plant;
  catalogPlants: Plant[];
  onClose: () => void;
  onSaveToGardenSuccess?: (gardenId: string) => void;
  onSwitchTo3DPlanner?: (plant: Plant) => void;
}

export const ViewInYourSpaceAR: React.FC<ViewInYourSpaceARProps> = ({
  initialPlant,
  catalogPlants,
  onClose,
  onSaveToGardenSuccess,
  onSwitchTo3DPlanner,
}) => {
  const { user } = useAuth();

  // Active Selected Plant
  const [activePlant, setActivePlant] = useState<Plant>(initialPlant);

  // AR Capabilities & Mode State
  const [capabilities, setCapabilities] = useState<ARCapabilityReport | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  // Surface Detection & Placement State
  const [surfaceDetected, setSurfaceDetected] = useState<boolean>(false);
  const [isPlantPlaced, setIsPlantPlaced] = useState<boolean>(false);
  const [scanningGuidance, setScanningGuidance] = useState<string>(
    'Slowly move your phone across the floor or ground to detect surface planes.'
  );

  // Placed Plant Transform (Scale, Rotation, Position)
  const [plantScale, setPlantScale] = useState<number>(1.0);
  const [plantRotation, setPlantRotation] = useState<number>(0);
  const [plantPosition, setPlantPosition] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: -1.5 });

  // Smart Environmental & Vastu Conditions (Editable)
  const [spaceType, setSpaceType] = useState<'Indoor' | 'Balcony' | 'Terrace' | 'Outdoor'>('Balcony');
  const [detectedSunlight, setDetectedSunlight] = useState<'High' | 'Medium' | 'Low'>('High');
  const [compassHeading, setCompassHeading] = useState<number>(45); // 45° = North-East (Ishanya)
  const [showConditionsEditor, setShowConditionsEditor] = useState<boolean>(false);

  // Real-time camera luminance (0-255) sampled from live camera feed
  const [cameraLuminance, setCameraLuminance] = useState<number>(150);
  const [showPlacementRadar, setShowPlacementRadar] = useState<boolean>(true);

  // Garden Boundary & Measurement State
  const [gardenDimensions, setGardenDimensions] = useState<{ length: number; width: number }>({ length: 10, width: 8 });
  const [measuringMode, setMeasuringMode] = useState<boolean>(false);
  const [measurePointA, setMeasurePointA] = useState<THREE.Vector3 | null>(null);
  const [measurePointB, setMeasurePointB] = useState<THREE.Vector3 | null>(null);
  const [measuredDistanceFt, setMeasuredDistanceFt] = useState<number | null>(null);

  // UI Panels State
  const [showPlantCatalog, setShowPlantCatalog] = useState<boolean>(false);
  const [showSuggestionsDrawer, setShowSuggestionsDrawer] = useState<boolean>(true);
  const [activeTabControl, setActiveTabControl] = useState<'transform' | 'measure' | 'info'>('transform');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Three.js & WebXR References
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reticleRef = useRef<THREE.Group | null>(null);
  const plantGroupRef = useRef<THREE.Group | null>(null);
  const boundaryBoxRef = useRef<THREE.LineSegments | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // WebXR Session Ref
  const xrSessionRef = useRef<any>(null);
  const hitTestSourceRef = useRef<any>(null);

  // Compass Heading calculation
  const compassDirectionName = useMemo(() => {
    const deg = (compassHeading + 360) % 360;
    if (deg >= 22.5 && deg < 67.5) return 'North-East';
    if (deg >= 67.5 && deg < 112.5) return 'East';
    if (deg >= 112.5 && deg < 157.5) return 'South-East';
    if (deg >= 157.5 && deg < 202.5) return 'South';
    if (deg >= 202.5 && deg < 247.5) return 'South-West';
    if (deg >= 247.5 && deg < 292.5) return 'West';
    if (deg >= 292.5 && deg < 337.5) return 'North-West';
    return 'North';
  }, [compassHeading]);

  // Real-world plant height in ft
  const estimatedPhysicalHeightFt = useMemo(() => {
    const baseHeight = activePlant.spaceRequired?.includes('Small') ? 1.5 : 2.5;
    return (baseHeight * plantScale).toFixed(1);
  }, [activePlant, plantScale]);

  // Vastu Catalog Direction Filter State
  const [selectedCatalogDirection, setSelectedCatalogDirection] = useState<string>(compassDirectionName);

  useEffect(() => {
    setSelectedCatalogDirection(compassDirectionName);
  }, [compassDirectionName]);

  const canonicalCatalogDir = normalizeVastuDirection(selectedCatalogDirection);
  const catalogDirMeta = getVastuDirectionMetadata(canonicalCatalogDir);

  const vastuFilteredCatalogPlants = useMemo(() => {
    return filterPlantsByVastuDirection(catalogPlants, canonicalCatalogDir);
  }, [catalogPlants, canonicalCatalogDir]);

  // Real-time Placement Suitability Evaluation
  const placementSuitability: SpotSuitabilityResult = useMemo(() => {
    return evaluatePlacementSuitability(activePlant, {
      compassHeading,
      lightLuma: cameraLuminance,
      manualSunlight: detectedSunlight,
      spaceType,
    });
  }, [activePlant, compassHeading, cameraLuminance, detectedSunlight, spaceType]);

  // Periodically sample camera video luminance
  useEffect(() => {
    if (!streamActive) return;
    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const luma = sampleVideoLuminance(videoRef.current);
        setCameraLuminance(luma);
      }
    }, 450);
    return () => clearInterval(interval);
  }, [streamActive]);

  // Smart suggestions tailored to current scanned space - STRICT VASTU FILTERING
  const smartSuggestions = useMemo(() => {
    const vastuCompatiblePlants = filterPlantsByVastuDirection(catalogPlants, compassDirectionName);

    return vastuCompatiblePlants.map((plant) => {
      let score = 0;
      const reasons: string[] = [];

      // Vastu alignment guaranteed by filter
      score += 40;
      reasons.push(`Auspicious for traditional ${compassDirectionName} quadrant`);

      // Sunlight check
      const pSun = plant.sunlight.toLowerCase();
      if (detectedSunlight === 'High' && (pSun.includes('high') || pSun.includes('full'))) {
        score += 35;
        reasons.push(`Direct sun needs match detected environment`);
      } else if (detectedSunlight === 'Medium' && (pSun.includes('medium') || pSun.includes('partial'))) {
        score += 35;
        reasons.push(`Filtered light matches space`);
      } else if (detectedSunlight === 'Low' && (pSun.includes('low') || pSun.includes('shade') || pSun.includes('indoor'))) {
        score += 35;
        reasons.push(`Thrives in low light conditions`);
      } else {
        score += 15;
      }

      // Space check
      if (spaceType === 'Indoor' && plant.indoorOutdoor.toLowerCase().includes('indoor')) {
        score += 20;
        reasons.push('Excellent indoor air-purifier');
      } else if (spaceType !== 'Indoor') {
        score += 15;
        reasons.push('Loves fresh open-air circulation');
      }

      return {
        plant,
        score: Math.min(99, score),
        reasons,
      };
    }).sort((a, b) => b.score - a.score);
  }, [catalogPlants, compassDirectionName, detectedSunlight, spaceType]);

  // 1. Detect capabilities on mount
  useEffect(() => {
    async function initCapabilities() {
      const report = await detectARCapabilities();
      setCapabilities(report);

      // Start camera if device has camera
      if (report.hasCamera) {
        startCameraStream();
      }

      // Listen for Device Orientation for compass & spatial tilt
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) {
          setCompassHeading(Math.round(e.alpha));
        }
      };

      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('deviceorientation', handleOrientation, true);
      }

      return () => {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('deviceorientation', handleOrientation, true);
        }
      };
    }

    initCapabilities();
  }, []);

  // 2. Camera Stream Manager
  const startCameraStream = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCameraStream();

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera hardware access is unavailable on this browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setStreamActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or device not found:', err);
      setCameraError('Camera access unavailable. Using optical spatial tracker.');
      setStreamActive(false);
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // 3. Initialize Three.js AR Scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.05, 100);
    camera.position.set(0, 1.2, 0); // ~eye level height in meters
    cameraRef.current = camera;

    // WebGL Renderer with Alpha transparent background for camera pass-through
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Realistic Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff5ea, 1.6);
    sunLight.position.set(2, 5, 3);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xdcfce7, 0.4);
    scene.add(ambientLight);

    // Dynamic Reticle Group (Surface Placement Indicator Ring)
    const reticle = new THREE.Group();
    reticle.name = 'reticle';

    // Ring Outer
    const ringGeo = new THREE.RingGeometry(0.22, 0.25, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb, // Bright Blue
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    reticle.add(ring);

    // Inner glowing pulse disk
    const diskGeo = new THREE.CircleGeometry(0.18, 32);
    const diskMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = -Math.PI / 2;
    reticle.add(disk);

    // Direction arrow pointer on reticle
    const arrowGeo = new THREE.ConeGeometry(0.04, 0.12, 16);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf97316 }); // Vibrant Orange
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    arrow.rotation.x = Math.PI / 2;
    arrow.position.set(0, 0, -0.22);
    reticle.add(arrow);

    // Position reticle on virtual ground plane initially
    reticle.position.set(0, -0.6, -1.5);
    scene.add(reticle);
    reticleRef.current = reticle;

    // Plant 3D Model Group
    const plantGroup = new THREE.Group();
    plantGroup.name = 'placedPlantGroup';
    scene.add(plantGroup);
    plantGroupRef.current = plantGroup;

    // Garden Boundary Box Wireframe
    const boxGeo = new THREE.BoxGeometry(gardenDimensions.width * 0.3048, 0.05, gardenDimensions.length * 0.3048);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const boundaryLine = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.4 })
    );
    boundaryLine.position.set(0, -0.6, -1.5);
    scene.add(boundaryLine);
    boundaryBoxRef.current = boundaryLine;

    // Build the initial 3D model
    updatePlantModelMesh(activePlant, plantScale, plantRotation);

    // Render loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Animate reticle breathing pulse
      if (reticleRef.current) {
        const pulse = 1 + Math.sin(elapsed * 4) * 0.06;
        reticleRef.current.scale.set(pulse, 1, pulse);
      }

      // Gentle foliage breeze animation
      if (plantGroupRef.current) {
        const foliage = plantGroupRef.current.getObjectByName('foliage');
        if (foliage) {
          for (let i = 0; i < foliage.children.length; i++) {
            const leaf = foliage.children[i];
            leaf.rotation.z += Math.sin(elapsed * 2.5 + i) * 0.0006;
          }
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    // Simulate surface detection lock after 1.5 seconds of camera scanning
    const detectionTimer = setTimeout(() => {
      setSurfaceDetected(true);
      setScanningGuidance('Surface detected! Tap screen or press Place Plant to anchor.');
    }, 1200);

    return () => {
      clearTimeout(detectionTimer);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      stopCameraStream();
    };
  }, []);

  // Update 3D plant model when activePlant, plantScale, or plantRotation changes
  const updatePlantModelMesh = (plant: Plant, scale: number, rotationDeg: number) => {
    if (!plantGroupRef.current) return;
    const group = plantGroupRef.current;

    // Clear existing
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    // Build realistic botanical model
    const newMesh = createProceduralPlantMesh(plant, {
      scale: scale,
      quality: 'hq',
      includePot: true,
    });

    group.add(newMesh);
    group.rotation.y = (rotationDeg * Math.PI) / 180;
    group.position.set(plantPosition.x, plantPosition.y, plantPosition.z);
  };

  // React to active plant changes
  useEffect(() => {
    updatePlantModelMesh(activePlant, plantScale, plantRotation);
  }, [activePlant, plantScale, plantRotation, plantPosition]);

  // Sync garden boundary wireframe when dimensions change
  useEffect(() => {
    if (!boundaryBoxRef.current || !sceneRef.current) return;
    sceneRef.current.remove(boundaryBoxRef.current);
    const boxGeo = new THREE.BoxGeometry(gardenDimensions.width * 0.3048, 0.05, gardenDimensions.length * 0.3048);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const boundaryLine = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.4 })
    );
    boundaryLine.position.set(plantPosition.x, -0.6, plantPosition.z);
    sceneRef.current.add(boundaryLine);
    boundaryBoxRef.current = boundaryLine;
  }, [gardenDimensions, plantPosition]);

  // Dynamic reticle coloration reflecting real-time spot suitability
  useEffect(() => {
    if (!reticleRef.current || reticleRef.current.children.length < 3) return;
    const ring = reticleRef.current.children[0] as THREE.Mesh;
    const disk = reticleRef.current.children[1] as THREE.Mesh;
    const arrow = reticleRef.current.children[2] as THREE.Mesh;

    if (ring && ring.material) {
      (ring.material as THREE.MeshBasicMaterial).color.setHex(placementSuitability.reticleHexColor);
    }
    if (disk && disk.material) {
      (disk.material as THREE.MeshBasicMaterial).color.setHex(placementSuitability.reticleDiskColor);
    }
    if (arrow && arrow.material) {
      (arrow.material as THREE.MeshBasicMaterial).color.setHex(
        placementSuitability.vastuMatch ? 0x10b981 : 0xf97316
      );
    }
  }, [placementSuitability]);

  // Action: Auto-align compass coordinate to auspicious direction
  const handleAutoAlignToBestSpot = () => {
    const targetDir = activePlant.vastuDirections?.[0] || 'North-East';
    const canonicalTarget = normalizeVastuDirection(targetDir);
    const targetDeg =
      canonicalTarget === 'North' ? 0 :
      canonicalTarget === 'North-East' ? 45 :
      canonicalTarget === 'East' ? 90 :
      canonicalTarget === 'South-East' ? 135 :
      canonicalTarget === 'South' ? 180 :
      canonicalTarget === 'South-West' ? 225 :
      canonicalTarget === 'West' ? 270 : 315;
    setCompassHeading(targetDeg);
    setScanningGuidance(`Auto-aligned camera coordinate to sacred ${canonicalTarget} zone for ${activePlant.name}!`);
  };

  // Action: Place Plant at Reticle Location
  const handlePlacePlant = () => {
    if (!reticleRef.current || !plantGroupRef.current) return;

    // Anchor plant to reticle position
    const targetPos = {
      x: reticleRef.current.position.x,
      y: reticleRef.current.position.y,
      z: reticleRef.current.position.z,
    };
    setPlantPosition(targetPos);
    plantGroupRef.current.position.set(targetPos.x, targetPos.y, targetPos.z);
    setIsPlantPlaced(true);
    setScanningGuidance('Plant anchored! Use controls below to move, rotate, resize, or save.');
  };

  // Action: Reset Plant Placement & Rescan
  const handleResetPlacement = () => {
    setIsPlantPlaced(false);
    setPlantScale(1.0);
    setPlantRotation(0);
    setMeasuringMode(false);
    setMeasurePointA(null);
    setMeasurePointB(null);
    setMeasuredDistanceFt(null);
    setScanningGuidance('Slowly move your phone across the floor to detect surface planes.');
  };

  // Action: Touch / Tap Screen to reposition plant or measure
  const handleScreenTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast onto ground plane y = -0.6
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.6);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, intersectPoint);

    if (intersectPoint) {
      if (measuringMode) {
        // Measure mode: point A & point B
        if (!measurePointA) {
          setMeasurePointA(intersectPoint.clone());
          setScanningGuidance('Point A marked! Now tap Point B to calculate distance.');
        } else if (!measurePointB) {
          setMeasurePointB(intersectPoint.clone());
          const distM = measurePointA.distanceTo(intersectPoint);
          const distFt = Math.round(distM * 3.28084 * 10) / 10;
          setMeasuredDistanceFt(distFt);
          setScanningGuidance(`Measured Distance: ${distFt} ft. Confirm or edit dimensions.`);
        }
      } else {
        // Reposition reticle & placed plant
        if (reticleRef.current) {
          reticleRef.current.position.set(intersectPoint.x, -0.6, intersectPoint.z);
        }
        if (isPlantPlaced) {
          setPlantPosition({ x: intersectPoint.x, y: -0.6, z: intersectPoint.z });
        }
      }
    }
  };

  // Action: Save to Garden Layout via backend API
  const handleSaveToGarden = async () => {
    if (!user) {
      alert('Sign in to save your AR garden designs to your account!');
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg(null);

    try {
      const placedPlantData: PlacedPlant = {
        id: `placed_ar_${Date.now()}`,
        plantId: activePlant._id,
        name: activePlant.name,
        scientificName: activePlant.scientificName,
        image: activePlant.image,
        x: 50,
        y: 50,
        rotation: plantRotation,
        scale: plantScale,
        model3D: activePlant.model3D,
        potSizeFt: 1.0 * plantScale,
        spacingRequiredFt: activePlant.spacingRequiredFt || 1.5,
        plantHeightFt: parseFloat(estimatedPhysicalHeightFt),
      };

      const res = await api.createGarden({
        gardenName: `${activePlant.name} - AR Space Layout`,
        roomType: spaceType,
        length: gardenDimensions.length,
        width: gardenDimensions.width,
        direction: compassDirectionName,
        plants: [placedPlantData],
        notes: `AR Placed with scale ${plantScale}x. Orientation: ${compassDirectionName}. Sunlight: ${detectedSunlight}`,
        unit: 'ft',
        totalSquareFeet: gardenDimensions.length * gardenDimensions.width,
      });

      setSaveSuccessMsg(`Saved to your garden collection! (${activePlant.name})`);
      if (onSaveToGardenSuccess && res?.garden?._id) {
        onSaveToGardenSuccess(res.garden._id);
      }
    } catch (err: any) {
      alert(`Error saving to garden: ${err.message || 'Network error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#081711] flex flex-col overflow-hidden select-none font-sans">
      
      {/* 1. BACKGROUND CAMERA FEED (OR SPATIAL ROOM SIMULATION) */}
      <div 
        onClick={handleScreenTap}
        className="absolute inset-0 w-full h-full overflow-hidden cursor-crosshair z-0"
      >
        {streamActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          /* Simulated Spatial Studio Room Background in Deep Emerald */
          <div className="w-full h-full bg-gradient-to-b from-[#081711] via-[#0E281E] to-[#081711] relative">
            <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-20" />
          </div>
        )}

        {/* Real-time 3D Perspective Grid for surface grounding */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none opacity-25 [perspective:700px]">
          <div className="w-full h-full [transform:rotateX(72deg)] bg-[radial-gradient(#d4af37_2px,transparent_2px)] [background-size:36px_36px]" />
        </div>
      </div>

      {/* 2. THREE.JS 3D WEBGL AR CANVAS */}
      <div 
        ref={mountRef} 
        onClick={handleScreenTap}
        className="absolute inset-0 w-full h-full pointer-events-auto z-10" 
      />

      {/* 3. TOP HUD BAR: BACK BUTTON, AR STATUS PILL, COMPASS, CAMERA CONTROLS */}
      <div className="relative z-30 pt-3 px-3 sm:px-5 flex items-center justify-between pointer-events-none">
        
        {/* Left: Back / Exit Button & AR Active Pill */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl text-[#F4EFE6] border border-[#D4AF37]/35 hover:bg-[#133528] transition shadow-lg flex items-center justify-center min-w-[42px] min-h-[42px]"
            title="Exit AR View"
          >
            <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
          </button>

          <div className="bg-[#0B1D16]/90 backdrop-blur-xl px-4 py-2 rounded-full border border-[#D4AF37]/30 text-[#F4EFE6] flex items-center gap-2 shadow-2xl text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${surfaceDetected ? 'bg-[#68D391] animate-pulse' : 'bg-[#D4AF37]'}`} />
            <span className="font-serif font-bold text-[#F6D985] tracking-wider uppercase text-[11px]">
              {surfaceDetected ? 'AR TRACKING LOCKED' : 'SCANNING SURFACE...'}
            </span>
          </div>
        </div>

        {/* Right: Compass Orientation & Camera Toggle Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Compass pill */}
          <button
            type="button"
            onClick={() => setShowConditionsEditor(!showConditionsEditor)}
            className="bg-[#0B1D16]/90 backdrop-blur-xl text-[#F4EFE6] px-3.5 py-2 rounded-full text-xs font-semibold border border-[#D4AF37]/30 hover:bg-[#133528] transition flex items-center gap-1.5 shadow-lg"
            title="Vastu Compass Direction"
          >
            <Compass className="w-4 h-4 text-[#D4AF37] animate-spin-slow" />
            <span className="text-[11px] font-bold text-[#F6D985]">{compassDirectionName} ({compassHeading}°)</span>
          </button>

          {/* 3D Fallback Switcher */}
          {onSwitchTo3DPlanner && (
            <button
              type="button"
              onClick={() => onSwitchTo3DPlanner(activePlant)}
              className="luxury-btn-secondary text-[#F4EFE6] px-3.5 py-2 rounded-full text-xs font-bold border border-[#D4AF37]/30 transition shadow-lg hidden sm:flex items-center gap-1"
            >
              <span>3D Garden View</span>
            </button>
          )}

          {/* Camera Flip button */}
          {streamActive && (
            <button
              type="button"
              onClick={() => {
                const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
                setCameraFacing(nextFacing);
                startCameraStream(nextFacing);
              }}
              className="p-2.5 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl text-white border border-[#D4AF37]/30 hover:bg-[#133528] transition shadow-lg"
              title="Flip Camera"
            >
              <RotateCw className="w-4 h-4 text-[#D4AF37]" />
            </button>
          )}
        </div>
      </div>

      {/* 4. REAL-TIME SPOT SUITABILITY DETECTION RADAR HUD */}
      {showPlacementRadar && (
        <div className="relative z-30 px-3 sm:px-5 mt-2 flex flex-col items-center pointer-events-auto animate-fadeIn">
          <div className={`w-full max-w-xl backdrop-blur-2xl rounded-2xl p-3 border transition-all duration-300 shadow-2xl ${placementSuitability.badgeClass}`}>
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full shrink-0 ${
                  placementSuitability.status === 'optimal'
                    ? 'bg-[#10B981] animate-ping'
                    : placementSuitability.status === 'moderate'
                    ? 'bg-[#F59E0B]'
                    : 'bg-[#EF4444]'
                }`} />
                <span className="text-xs font-serif font-bold tracking-wider uppercase">
                  {placementSuitability.hudHeadline}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-black/40 border border-white/15">
                  Suitability: {placementSuitability.overallScore}%
                </span>
                <button
                  type="button"
                  onClick={handleAutoAlignToBestSpot}
                  title="Auto-detect best Vastu spot"
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 text-[#F6D985] border border-[#D4AF37]/40 transition flex items-center gap-1 cursor-pointer"
                >
                  <Compass className="w-3 h-3" />
                  <span>Auto-Find Spot</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Metrics Chips */}
            <div className="grid grid-cols-3 gap-1.5 pt-2 text-[10px]">
              {/* Vastu chip */}
              <div className={`p-1.5 rounded-xl border flex flex-col justify-between ${
                placementSuitability.vastuMatch
                  ? 'bg-[#0E281E]/80 border-[#10B981]/40 text-[#68D391]'
                  : 'bg-black/30 border-amber-500/30 text-amber-300'
              }`}>
                <span className="font-semibold uppercase text-[9px] text-[#A3C1AD]">Vastu Zone</span>
                <span className="font-bold truncate mt-0.5">
                  {placementSuitability.currentDirection} {placementSuitability.vastuMatch ? '✓ Aligned' : '⚠️ Deviated'}
                </span>
              </div>

              {/* Light chip */}
              <div className={`p-1.5 rounded-xl border flex flex-col justify-between ${
                placementSuitability.lightMatch
                  ? 'bg-[#0E281E]/80 border-[#10B981]/40 text-[#68D391]'
                  : 'bg-black/30 border-amber-500/30 text-amber-300'
              }`}>
                <span className="font-semibold uppercase text-[9px] text-[#A3C1AD]">Light Level</span>
                <span className="font-bold truncate mt-0.5">
                  {placementSuitability.lightLevelDetected} ({cameraLuminance} luma) {placementSuitability.lightMatch ? '✓ Ideal' : '⚠️ Adjust'}
                </span>
              </div>

              {/* Surface & clearance chip */}
              <div className="p-1.5 rounded-xl border bg-[#0E281E]/80 border-[#10B981]/40 text-[#68D391] flex flex-col justify-between">
                <span className="font-semibold uppercase text-[9px] text-[#A3C1AD]">Clearance</span>
                <span className="font-bold truncate mt-0.5">
                  {activePlant.spacingRequiredFt || 1.5} ft Radius ✓ Plane
                </span>
              </div>
            </div>

            {/* Actionable guidance message & quick place button */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <p className="text-[10px] leading-tight text-[#E8E2D5] italic flex-1">
                {placementSuitability.hudSubtitle}
              </p>

              {placementSuitability.status === 'optimal' && !isPlantPlaced && (
                <button
                  type="button"
                  onClick={handlePlacePlant}
                  className="px-3.5 py-1.5 rounded-full luxury-btn-gold text-[#081711] text-[11px] font-bold shadow-md hover:scale-105 active:scale-95 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Place Here Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SCANNING GUIDANCE BANNER (Center Top) */}
      <div className="relative z-30 px-4 mt-2 flex justify-center pointer-events-none">
        <div className="bg-[#0B1D16]/95 backdrop-blur-xl px-4 py-1.5 rounded-full border border-[#D4AF37]/40 text-[#F4EFE6] text-xs shadow-2xl flex items-center gap-2 max-w-md text-center">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
          <span className="text-[11px] font-medium leading-tight">{scanningGuidance}</span>
        </div>
      </div>

      {/* 5. EDITABLE CONDITIONS & VASTU MODAL / DROPDOWN */}
      {showConditionsEditor && (
        <div className="relative z-40 mx-4 mt-2 max-w-sm self-end luxury-card bg-[#0B1D16]/95 backdrop-blur-2xl p-4 rounded-3xl border border-[#D4AF37]/35 shadow-2xl text-[#F4EFE6] space-y-3 pointer-events-auto animate-fadeIn">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
            <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
              Environmental Calibration
            </span>
            <button 
              onClick={() => setShowConditionsEditor(false)}
              className="text-[#A3C1AD] hover:text-[#F4EFE6]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="text-[10px] text-[#A3C1AD] uppercase font-semibold block mb-1">Location Type</label>
              <div className="grid grid-cols-4 gap-1">
                {(['Indoor', 'Balcony', 'Terrace', 'Outdoor'] as const).map((loc) => (
                  <button
                    key={loc}
                    onClick={() => setSpaceType(loc)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                      spaceType === loc ? 'luxury-btn-gold text-[#081711]' : 'bg-[#0E281E] text-[#A3C1AD] border border-[#D4AF37]/20'
                    }`}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#A3C1AD] uppercase font-semibold block mb-1">Sunlight Level</label>
              <div className="grid grid-cols-3 gap-1">
                {(['High', 'Medium', 'Low'] as const).map((sun) => (
                  <button
                    key={sun}
                    onClick={() => setDetectedSunlight(sun)}
                    className={`py-1 px-2 rounded-lg text-[10px] font-bold transition ${
                      detectedSunlight === sun ? 'luxury-btn-copper text-white' : 'bg-[#0E281E] text-[#A3C1AD] border border-[#D4AF37]/20'
                    }`}
                  >
                    {sun} Sun
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#A3C1AD] uppercase font-semibold block mb-1">Compass Direction ({compassDirectionName})</label>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={compassHeading}
                onChange={(e) => setCompassHeading(Number(e.target.value))}
                className="w-full accent-[#D4AF37]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. CENTER NOTIFICATION TOAST */}
      {saveSuccessMsg && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#0E281E]/95 backdrop-blur-xl border border-[#68D391]/50 px-5 py-2.5 rounded-full text-[#F4EFE6] text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#68D391]" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <div className="flex-1" />

      {/* 7. BOTTOM DOCK: COMPACT SMART SUGGESTION CAROUSEL */}
      <div className="relative z-30 px-3 sm:px-5 pb-2 pointer-events-auto">
        <div className="luxury-card bg-[#0B1D16]/95 backdrop-blur-2xl rounded-3xl p-3 border border-[#D4AF37]/30 shadow-2xl space-y-2">
          
          {/* Suggestion Bar Header with Drawer Toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-[11px] font-bold text-[#F4EFE6] tracking-wide">
                Smart Suggestions for {compassDirectionName} {spaceType}
              </span>
              <span className="text-[9px] text-[#68D391] bg-[#0E281E] px-2 py-0.5 rounded-full border border-[#68D391]/30 font-bold">
                {detectedSunlight} Sun
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowSuggestionsDrawer(!showSuggestionsDrawer)}
              className="text-[#A3C1AD] hover:text-[#F4EFE6] p-1"
            >
              {showSuggestionsDrawer ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {/* Plant Suggestion Horizontal Scroll Carousel */}
          {showSuggestionsDrawer && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {smartSuggestions.slice(0, 6).map(({ plant, score, reasons }) => {
                const isCurrent = plant._id === activePlant._id;
                return (
                  <button
                    key={plant._id}
                    type="button"
                    onClick={() => {
                      setActivePlant(plant);
                      setScanningGuidance(`Switched to ${plant.name}. Tap screen to preview in space.`);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-2xl border text-left shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-[#D4AF37]/20 border-[#D4AF37] shadow-md ring-1 ring-[#D4AF37]'
                        : 'bg-[#0E281E]/70 border-[#D4AF37]/20 hover:border-[#D4AF37]/45 text-[#A3C1AD]'
                    }`}
                  >
                    <img
                      src={plant.image}
                      alt={plant.name}
                      className="w-10 h-10 rounded-xl object-cover shrink-0 border border-[#D4AF37]/30"
                    />
                    <div className="pr-2">
                      <div className="flex items-center gap-1.5">
                        <strong className="text-xs font-serif font-bold text-[#F4EFE6] truncate max-w-[110px]">
                          {plant.name.split(' ')[0]}
                        </strong>
                        <span className="text-[9px] font-bold text-[#F6D985]">{score}%</span>
                      </div>
                      <span className="text-[10px] text-[#A3C1AD] block truncate max-w-[120px]">
                        {reasons[0] || plant.traditionalUses.slice(0, 20)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 8. MAIN AR ACTION CONTROLS HUD (Place, Rotate, Resize, Reset, Save, Catalog) */}
      <div className="relative z-30 p-3 sm:p-5 bg-gradient-to-t from-[#081711] via-[#081711]/95 to-transparent pointer-events-auto">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Active Plant Identity Pill */}
          <div className="flex items-center gap-3 bg-[#0B1D16]/90 backdrop-blur-xl p-2.5 rounded-2xl border border-[#D4AF37]/30 w-full sm:w-auto shadow-lg">
            <img
              src={activePlant.image}
              alt={activePlant.name}
              className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/30 shrink-0"
            />
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-sm font-serif font-bold luxury-gold-text truncate">
                {activePlant.name}
              </h4>
              <p className="text-[10px] text-[#A3C1AD] font-mono italic truncate">
                {activePlant.scientificName}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#68D391] font-semibold">
                <span>Height: {estimatedPhysicalHeightFt} ft</span>
                <span>• Spacing: {activePlant.spacingRequiredFt || 1.5} ft</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowPlantCatalog(true)}
              className="py-1.5 px-3 rounded-xl luxury-btn-secondary text-[#F4EFE6] text-xs font-bold border border-[#D4AF37]/30 transition shrink-0"
            >
              Change
            </button>
          </div>

          {/* Transform & Mode Controls (Rotate, Scale, Measure, Reset) */}
          <div className="flex items-center gap-1.5 bg-[#0B1D16]/90 backdrop-blur-xl p-2 rounded-2xl border border-[#D4AF37]/30 text-[#F4EFE6] shadow-lg">
            
            {/* Rotate Button */}
            <button
              type="button"
              onClick={() => setPlantRotation((prev) => (prev + 45) % 360)}
              className="p-2.5 rounded-xl hover:bg-[#0E281E] text-[#D4AF37] transition active:scale-95"
              title="Rotate Plant 45°"
            >
              <RotateCw className="w-4 h-4 text-[#D4AF37]" />
            </button>

            {/* Scale Up */}
            <button
              type="button"
              onClick={() => setPlantScale((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100))}
              className="p-2.5 rounded-xl hover:bg-[#0E281E] text-[#68D391] transition active:scale-95"
              title="Grow / Scale Up"
            >
              <ZoomIn className="w-4 h-4 text-[#68D391]" />
            </button>

            {/* Scale Down */}
            <button
              type="button"
              onClick={() => setPlantScale((prev) => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100))}
              className="p-2.5 rounded-xl hover:bg-[#0E281E] text-[#68D391] transition active:scale-95"
              title="Shrink / Scale Down"
            >
              <ZoomOut className="w-4 h-4 text-[#68D391]" />
            </button>

            {/* AR Measurement Mode */}
            <button
              type="button"
              onClick={() => {
                setMeasuringMode(!measuringMode);
                if (!measuringMode) {
                  setMeasurePointA(null);
                  setMeasurePointB(null);
                  setScanningGuidance('Measurement Mode: Tap Point A on the floor, then Point B.');
                } else {
                  setScanningGuidance('Returned to Plant Placement mode.');
                }
              }}
              className={`p-2.5 rounded-xl transition active:scale-95 ${
                measuringMode ? 'luxury-btn-copper text-white' : 'hover:bg-[#0E281E] text-[#A3C1AD]'
              }`}
              title="Measure Garden Space (AR Tap-to-Measure)"
            >
              <Ruler className="w-4 h-4 text-[#E07A5F]" />
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={handleResetPlacement}
              className="p-2.5 rounded-xl hover:bg-[#0E281E] text-[#A3C1AD] hover:text-[#F4EFE6] transition active:scale-95"
              title="Reset Placement & Rescan"
            >
              <RefreshCw className="w-4 h-4 text-[#A3C1AD]" />
            </button>
          </div>

          {/* Primary Action Buttons: Place Plant & Save to Garden */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePlacePlant}
              className="flex-1 sm:flex-initial py-3 px-6 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs tracking-wider transition shadow-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 text-[#081711]" />
              <span>{isPlantPlaced ? 'Reposition Plant' : 'Place Plant'}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveToGarden}
              className="py-3 px-6 rounded-full luxury-btn-copper text-white font-bold text-xs tracking-wider transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-white" />
              <span>{isSaving ? 'Saving...' : 'Save to Garden'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 9. CHANGE PLANT CATALOG MODAL */}
      {showPlantCatalog && (
        <div className="absolute inset-0 z-50 bg-[#081711]/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md luxury-card bg-[#0B1D16]/98 rounded-3xl p-5 shadow-2xl text-[#F4EFE6] border border-[#D4AF37]/35 space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                  VASTU BOTANICAL DIRECTORY
                </span>
                <h4 className="text-lg font-serif font-bold luxury-gold-text">
                  Choose Plant for AR View
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPlantCatalog(false)}
                className="p-1 rounded-full text-[#A3C1AD] hover:text-[#F4EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vastu Direction Filter Bar */}
            <div className="py-1.5 border-b border-[#D4AF37]/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-[#A3C1AD]">
                  Vastu Orientation Zone:
                </span>
                <span className="text-[11px] font-bold text-[#F6D985]">
                  {catalogDirMeta.name} • {catalogDirMeta.sanskrit}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(VASTU_DIRECTIONS).map((dirKey) => {
                  const isSelected = canonicalCatalogDir === dirKey;
                  return (
                    <button
                      key={dirKey}
                      type="button"
                      onClick={() => setSelectedCatalogDirection(dirKey)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${
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
              <p className="text-[10px] text-[#A3C1AD] mt-1 italic">
                Showing only plants auspicious for {canonicalCatalogDir} ({catalogDirMeta.element}).
              </p>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {vastuFilteredCatalogPlants.length === 0 ? (
                <div className="p-6 text-center luxury-card bg-[#0E281E]/40 border border-[#D4AF37]/20 rounded-2xl my-4">
                  <AlertTriangle className="w-7 h-7 text-[#D4AF37] mx-auto mb-2 opacity-80" />
                  <h5 className="text-sm font-serif font-bold text-[#F4EFE6]">
                    No Species Auspicious for {canonicalCatalogDir}
                  </h5>
                  <p className="text-xs text-[#A3C1AD] mt-1">
                    Select another direction pill above to preview other plants.
                  </p>
                </div>
              ) : (
                vastuFilteredCatalogPlants.map((plant) => (
                  <div
                    key={plant._id}
                    onClick={() => {
                      setActivePlant(plant);
                      setShowPlantCatalog(false);
                      setScanningGuidance(`Selected ${plant.name}. Point phone at floor to position.`);
                    }}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      plant._id === activePlant._id
                        ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-md'
                        : 'border-[#D4AF37]/20 bg-[#0E281E]/70 hover:border-[#D4AF37]/50 hover:bg-[#0E281E]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={plant.image}
                        alt={plant.name}
                        className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/30 shrink-0"
                      />
                      <div>
                        <h5 className="text-xs sm:text-sm font-serif font-bold text-[#F4EFE6]">
                          {plant.name}
                        </h5>
                        <span className="text-[10px] text-[#A3C1AD] font-mono italic block">
                          {plant.scientificName}
                        </span>
                        <span className="text-[9px] text-[#F6D985] font-semibold mt-0.5 block">
                          {canonicalCatalogDir} • {plant.ayushSystem} • Spacing {plant.spacingRequiredFt || 1.5} ft
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-[#F6D985]">Preview →</span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2.5 border-t border-[#D4AF37]/25 flex justify-between items-center text-xs text-[#A3C1AD]">
              <span>{vastuFilteredCatalogPlants.length} auspicious species for {canonicalCatalogDir}</span>
              <button
                type="button"
                onClick={() => setShowPlantCatalog(false)}
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
