import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Plant, PlacedPlant } from '../types';
import {
  getPlantSpacingInfo,
  analyzePlantSpacing,
  calculateGardenAreaStats,
  optimizeGardenLayout,
  pctToFtCoords,
  ftToPctCoords,
  GardenAreaDashboardStats
} from '../utils/gardenSpacing';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Trash2,
  Copy,
  Plus,
  Ruler,
  Wand2,
  Camera,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X,
  Grid as GridIcon,
  Sparkles,
  Zap,
  RotateCcw,
  Sliders,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  filterPlantsByVastuDirection,
  getVastuDirectionMetadata,
  VASTU_DIRECTIONS,
  normalizeVastuDirection
} from '../utils/vastuRules';

interface Garden3DVisualizationProps {
  gardenLength: number; // in feet
  gardenWidth: number; // in feet
  direction: string;
  plants: PlacedPlant[];
  catalogPlants: Plant[];
  onUpdatePlants: (plants: PlacedPlant[]) => void;
  onDimensionsChange?: (dims: { length: number; width: number }) => void;
  onDirectionChange?: (dir: string) => void;
  onOpenMeasurer?: () => void;
  onViewInMySpace?: () => void;
  className?: string;
}

export const Garden3DVisualization: React.FC<Garden3DVisualizationProps> = ({
  gardenLength,
  gardenWidth,
  direction,
  plants,
  catalogPlants,
  onUpdatePlants,
  onDimensionsChange,
  onDirectionChange,
  onOpenMeasurer,
  onViewInMySpace,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerWrapperRef = useRef<HTMLDivElement>(null);

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const gardenGroupRef = useRef<THREE.Group | null>(null);
  const plantsGroupRef = useRef<THREE.Group | null>(null);
  const helpersGroupRef = useRef<THREE.Group | null>(null);
  const groundMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interactive UI State
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(plants[0]?.id || null);
  const [isDraggingPlant, setIsDraggingPlant] = useState(false);
  const [draggedPlantName, setDraggedPlantName] = useState<string>('');
  const [showGrid, setShowGrid] = useState(true);
  const [showSpacingRings, setShowSpacingRings] = useState(true);
  const [showDistanceLines, setShowDistanceLines] = useState(true);
  const [unitMode, setUnitMode] = useState<'ft' | 'm'>('ft');
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false); // Collapsed by default on mobile, drawer on desktop
  const [showDimensionsModal, setShowDimensionsModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualityMode, setQualityMode] = useState<'hq' | 'eco'>('hq'); // Performance optimization for weaker phones
  const [optimizationToast, setOptimizationToast] = useState<string | null>(null);
  const [cameraView, setCameraView] = useState<'perspective' | 'top' | 'iso'>('perspective');

  // Dimension edit state for in-place measurement
  const [editLength, setEditLength] = useState<number>(gardenLength);
  const [editWidth, setEditWidth] = useState<number>(gardenWidth);

  // Vastu Direction filtering state for Add Plant nursery
  const [nurseryDirection, setNurseryDirection] = useState<string>(direction);

  useEffect(() => {
    setNurseryDirection(direction);
  }, [direction]);

  const canonicalNurseryDir = normalizeVastuDirection(nurseryDirection);
  const nurseryDirMeta = getVastuDirectionMetadata(canonicalNurseryDir);

  // STRICT VASTU FILTERING: Only show plants auspicious for the selected direction
  const vastuFilteredNurseryPlants = useMemo(() => {
    return filterPlantsByVastuDirection(catalogPlants, canonicalNurseryDir);
  }, [catalogPlants, canonicalNurseryDir]);

  // Camera Orbit Parameters
  const orbitState = useRef({
    isOrbiting: false,
    isPanning: false,
    prevMouseX: 0,
    prevMouseY: 0,
    radius: Math.max(14, Math.max(gardenLength, gardenWidth) * 1.5),
    theta: Math.PI / 4, // Horizontal angle (azimuth)
    phi: Math.PI / 3.4, // Vertical angle (elevation)
    target: new THREE.Vector3(0, 0, 0),
  });

  // Multi-Touch tracking pointers ref (for pinch zoom and 2-finger pan)
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchInitialDistance = useRef<number | null>(null);
  const pinchInitialRadius = useRef<number | null>(null);
  const pinchInitialMidpoint = useRef<{ x: number; y: number } | null>(null);

  // Sync editLength and editWidth if props change
  useEffect(() => {
    setEditLength(gardenLength);
    setEditWidth(gardenWidth);
  }, [gardenLength, gardenWidth]);

  // Calculate live statistics and proximity
  const areaStats: GardenAreaDashboardStats = useMemo(() => {
    return calculateGardenAreaStats(gardenLength, gardenWidth, plants);
  }, [gardenLength, gardenWidth, plants]);

  const proximityData = useMemo(() => {
    return analyzePlantSpacing(plants, gardenLength, gardenWidth);
  }, [plants, gardenLength, gardenWidth]);

  const selectedPlacedPlant = useMemo(() => {
    return plants.find((p) => p.id === selectedPlantId) || null;
  }, [plants, selectedPlantId]);

  const selectedPlantSpacingConfig = useMemo(() => {
    return selectedPlacedPlant ? getPlantSpacingInfo(selectedPlacedPlant) : null;
  }, [selectedPlacedPlant]);

  // Check if selected plant is in proximity violation
  const isSelectedPlantTooClose = selectedPlantId ? proximityData.violatingPlantIds.has(selectedPlantId) : false;

  // Selected plant nearest neighbor distance
  const nearestNeighborInfo = useMemo(() => {
    if (!selectedPlantId) return null;
    const pair = proximityData.proximityList.find(
      (p) => p.plantIdA === selectedPlantId || p.plantIdB === selectedPlantId
    );
    if (!pair) return null;
    const neighborName = pair.plantIdA === selectedPlantId ? pair.nameB : pair.nameA;
    return {
      name: neighborName,
      distanceFt: pair.distanceFt,
      isTooClose: pair.isTooClose,
      requiredSpacingFt: pair.requiredSpacingFt,
    };
  }, [selectedPlantId, proximityData]);

  // -------------------------------------------------------------
  // THREE.JS SCENE INITIALIZATION & CLEANUP
  // -------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a101d);
    scene.fog = new THREE.FogExp2(0x0a101d, 0.018);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with Quality Mode support
    const renderer = new THREE.WebGLRenderer({
      antialias: qualityMode === 'hq',
      powerPreference: qualityMode === 'hq' ? 'high-performance' : 'low-power',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(qualityMode === 'hq' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    renderer.shadowMap.enabled = qualityMode === 'hq';
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.7);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    sunLight.position.set(25, 40, 20);
    sunLight.castShadow = qualityMode === 'hq';
    sunLight.shadow.mapSize.width = qualityMode === 'hq' ? 2048 : 512;
    sunLight.shadow.mapSize.height = qualityMode === 'hq' ? 2048 : 512;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 120;
    const d = Math.max(gardenLength, gardenWidth) * 1.5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 5. Groups
    const gardenGroup = new THREE.Group();
    scene.add(gardenGroup);
    gardenGroupRef.current = gardenGroup;

    const plantsGroup = new THREE.Group();
    gardenGroup.add(plantsGroup);
    plantsGroupRef.current = plantsGroup;

    const helpersGroup = new THREE.Group();
    gardenGroup.add(helpersGroup);
    helpersGroupRef.current = helpersGroup;

    // Build environment
    buildGardenEnvironment(gardenGroup, gardenLength, gardenWidth);

    // 6. Animation Render Loop with Page Visibility awareness
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      if (document.hidden) return; // Pause rendering if tab hidden
      renderer.render(scene, camera);
    };
    animate();

    // 7. Responsive Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newW = container.clientWidth || 800;
      const newH = container.clientHeight || 600;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [gardenLength, gardenWidth, qualityMode]);

  // Update camera position from orbitState
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi, target } = orbitState.current;
    const x = target.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = target.y + radius * Math.cos(phi);
    const z = target.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(target);
  };

  // Direction rotation in radians for consistent 3D orientation
  const DIRECTION_ROTATIONS: Record<string, number> = {
    'North': 0,
    'North-East': Math.PI / 4,
    'East': Math.PI / 2,
    'South-East': (3 * Math.PI) / 4,
    'South': Math.PI,
    'South-West': (5 * Math.PI) / 4,
    'West': (3 * Math.PI) / 2,
    'North-West': (7 * Math.PI) / 4,
  };

  // Synchronize 3D garden orientation whenever facing direction changes
  useEffect(() => {
    if (gardenGroupRef.current) {
      const rot = DIRECTION_ROTATIONS[direction] ?? 0;
      gardenGroupRef.current.rotation.y = rot;
    }
  }, [direction]);

  // Create canvas texture for 3D directional signs on garden boundaries
  const createDirectionPlaque = (code: string, name: string, isNorth: boolean = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = isNorth ? '#1e3a8a' : '#0f172a';
      ctx.fillRect(0, 0, 256, 128);
      ctx.lineWidth = 6;
      ctx.strokeStyle = isNorth ? '#60a5fa' : '#64748b';
      ctx.strokeRect(4, 4, 248, 120);

      ctx.fillStyle = isNorth ? '#93c5fd' : '#ffffff';
      ctx.font = 'bold 54px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(code, 128, 48);

      ctx.fillStyle = isNorth ? '#bfdbfe' : '#94a3b8';
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText(name, 128, 96);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const geo = new THREE.PlaneGeometry(1.6, 0.8);
    const mat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  };

  // Build ground and boundary environment when dimensions change
  const buildGardenEnvironment = (group: THREE.Group, lengthFt: number, widthFt: number) => {
    const toRemove: THREE.Object3D[] = [];
    group.children.forEach((child) => {
      if (child !== plantsGroupRef.current && child !== helpersGroupRef.current) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((c) => group.remove(c));

    // Ground Plane (Dark rich composted botanical soil)
    const soilGeo = new THREE.BoxGeometry(lengthFt, 0.4, widthFt);
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x3d2817,
      roughness: 0.95,
      metalness: 0.05,
    });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -0.2;
    soilMesh.receiveShadow = qualityMode === 'hq';
    soilMesh.name = 'soil_ground';
    groundMeshRef.current = soilMesh;
    group.add(soilMesh);

    // Raised Garden Bed Wood Curb
    const borderThickness = 0.45;
    const borderHeight = 0.55;
    const curbMat = new THREE.MeshStandardMaterial({
      color: 0x854d0e,
      roughness: 0.75,
      metalness: 0.1,
    });

    const curbXGeo = new THREE.BoxGeometry(lengthFt + borderThickness * 2, borderHeight, borderThickness);
    const northCurb = new THREE.Mesh(curbXGeo, curbMat);
    northCurb.position.set(0, borderHeight / 2 - 0.2, widthFt / 2 + borderThickness / 2);
    northCurb.castShadow = qualityMode === 'hq';
    northCurb.receiveShadow = qualityMode === 'hq';
    group.add(northCurb);

    const southCurb = new THREE.Mesh(curbXGeo, curbMat);
    southCurb.position.set(0, borderHeight / 2 - 0.2, -widthFt / 2 - borderThickness / 2);
    southCurb.castShadow = qualityMode === 'hq';
    southCurb.receiveShadow = qualityMode === 'hq';
    group.add(southCurb);

    const curbZGeo = new THREE.BoxGeometry(borderThickness, borderHeight, widthFt);
    const eastCurb = new THREE.Mesh(curbZGeo, curbMat);
    eastCurb.position.set(lengthFt / 2 + borderThickness / 2, borderHeight / 2 - 0.2, 0);
    eastCurb.castShadow = qualityMode === 'hq';
    eastCurb.receiveShadow = qualityMode === 'hq';
    group.add(eastCurb);

    const westCurb = new THREE.Mesh(curbZGeo, curbMat);
    westCurb.position.set(-lengthFt / 2 - borderThickness / 2, borderHeight / 2 - 0.2, 0);
    westCurb.castShadow = qualityMode === 'hq';
    westCurb.receiveShadow = qualityMode === 'hq';
    group.add(westCurb);

    // 3D Directional Signs on Garden Curbs (North, South, East, West)
    const northPlaque = createDirectionPlaque('N', 'NORTH (0°)', true);
    northPlaque.position.set(0, borderHeight + 0.15, widthFt / 2 + borderThickness / 2 + 0.02);
    group.add(northPlaque);

    // North Pointer Beacon Arrow
    const northArrowGeo = new THREE.ConeGeometry(0.28, 0.7, 16);
    const northArrowMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      emissive: 0x1d4ed8,
      roughness: 0.3,
    });
    const northArrow = new THREE.Mesh(northArrowGeo, northArrowMat);
    northArrow.position.set(0, borderHeight + 0.85, widthFt / 2 + borderThickness / 2);
    northArrow.rotation.x = Math.PI / 2;
    group.add(northArrow);

    const southPlaque = createDirectionPlaque('S', 'SOUTH (180°)', false);
    southPlaque.position.set(0, borderHeight + 0.15, -widthFt / 2 - borderThickness / 2 - 0.02);
    southPlaque.rotation.y = Math.PI;
    group.add(southPlaque);

    const eastPlaque = createDirectionPlaque('E', 'EAST (90°)', false);
    eastPlaque.position.set(lengthFt / 2 + borderThickness / 2 + 0.02, borderHeight + 0.15, 0);
    eastPlaque.rotation.y = Math.PI / 2;
    group.add(eastPlaque);

    const westPlaque = createDirectionPlaque('W', 'WEST (270°)', false);
    westPlaque.position.set(-lengthFt / 2 - borderThickness / 2 - 0.02, borderHeight + 0.15, 0);
    westPlaque.rotation.y = -Math.PI / 2;
    group.add(westPlaque);

    // 3D Ground Compass Rose Dial on the garden floor corner
    const roseGroup = new THREE.Group();
    const roseDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.03, 24),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 })
    );
    roseDisc.position.y = 0.015;
    roseGroup.add(roseDisc);

    // North needle on rose disc
    const nNeedle = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.85, 4),
      new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3 })
    );
    nNeedle.rotation.x = -Math.PI / 2;
    nNeedle.position.set(0, 0.04, 0.45);
    roseGroup.add(nNeedle);

    // South needle on rose disc
    const sNeedle = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.85, 4),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })
    );
    sNeedle.rotation.x = Math.PI / 2;
    sNeedle.position.set(0, 0.04, -0.45);
    roseGroup.add(sNeedle);

    roseGroup.position.set(-lengthFt / 2 + 1.6, 0.02, -widthFt / 2 + 1.6);
    group.add(roseGroup);

    // Corner decorative posts
    const postGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.75, 12);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x713f12, roughness: 0.7 });
    const corners = [
      [lengthFt / 2 + borderThickness / 2, widthFt / 2 + borderThickness / 2],
      [-lengthFt / 2 - borderThickness / 2, widthFt / 2 + borderThickness / 2],
      [lengthFt / 2 + borderThickness / 2, -widthFt / 2 - borderThickness / 2],
      [-lengthFt / 2 - borderThickness / 2, -widthFt / 2 - borderThickness / 2],
    ];

    corners.forEach(([cx, cz]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(cx, 0.2, cz);
      post.castShadow = qualityMode === 'hq';
      group.add(post);
    });

    // Stepping Stone Pathway
    const stoneCount = Math.max(3, Math.floor(lengthFt / 2.2));
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.9 });
    for (let s = 0; s < stoneCount; s++) {
      const progress = s / (stoneCount - 1);
      const sx = -lengthFt / 2 + 1.2 + progress * (lengthFt - 2.4);
      const sz = Math.sin(progress * Math.PI * 1.5) * (widthFt * 0.18);
      const stoneGeo = new THREE.CylinderGeometry(0.55 + (s % 2) * 0.08, 0.6, 0.06, 12);
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(sx, 0.03, sz);
      stone.receiveShadow = qualityMode === 'hq';
      group.add(stone);
    }

    // Outer Ground Lawn Grass Base
    const outerGroundGeo = new THREE.PlaneGeometry(lengthFt * 2.8, widthFt * 2.8);
    const outerGroundMat = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      roughness: 0.9,
    });
    const outerGround = new THREE.Mesh(outerGroundGeo, outerGroundMat);
    outerGround.rotation.x = -Math.PI / 2;
    outerGround.position.y = -0.42;
    outerGround.receiveShadow = qualityMode === 'hq';
    group.add(outerGround);
  };

  // -------------------------------------------------------------
  // RE-SYNC 3D PLANTS & VISUAL HELPERS
  // -------------------------------------------------------------
  useEffect(() => {
    if (!plantsGroupRef.current || !helpersGroupRef.current) return;

    const plantsGroup = plantsGroupRef.current;
    const helpersGroup = helpersGroupRef.current;

    while (plantsGroup.children.length > 0) {
      const obj = plantsGroup.children[0];
      plantsGroup.remove(obj);
    }
    while (helpersGroup.children.length > 0) {
      const obj = helpersGroup.children[0];
      helpersGroup.remove(obj);
    }

    // Render each plant mesh
    plants.forEach((placed) => {
      const { xFt, zFt } = pctToFtCoords(placed.x, placed.y, gardenLength, gardenWidth);
      const isSelected = placed.id === selectedPlantId;
      const isViolating = proximityData.violatingPlantIds.has(placed.id);
      const config = getPlantSpacingInfo(placed);

      const plantHolder = new THREE.Group();
      plantHolder.name = `plant_${placed.id}`;
      plantHolder.userData = { plantId: placed.id };
      plantHolder.position.set(xFt, 0, zFt);
      plantHolder.rotation.y = (placed.rotation * Math.PI) / 180;

      const scale = placed.scale || 1.0;
      plantHolder.scale.set(scale, scale, scale);

      buildBotanical3DModel(plantHolder, placed.model3D, placed.potSizeFt || config.defaultPotDiameterFt, qualityMode);
      plantsGroup.add(plantHolder);

      // Recommended Spacing Rings
      if (showSpacingRings) {
        const ringRadius = (config.recommendedSpacingFt * scale) / 2;
        const ringColor = isViolating ? 0xef4444 : 0x22c55e;
        const ringGeo = new THREE.RingGeometry(ringRadius - 0.05, ringRadius + 0.03, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: ringColor,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isSelected ? 0.8 : isViolating ? 0.65 : 0.35,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.set(xFt, 0.02, zFt);
        helpersGroup.add(ringMesh);
      }

      // Selection Marker Ring
      if (isSelected) {
        const selGeo = new THREE.RingGeometry(0.7 * scale, 0.78 * scale, 32);
        const selMat = new THREE.MeshBasicMaterial({
          color: 0x2563eb,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
        });
        const selMesh = new THREE.Mesh(selGeo, selMat);
        selMesh.rotation.x = -Math.PI / 2;
        selMesh.position.set(xFt, 0.04, zFt);
        helpersGroup.add(selMesh);
      }
    });

    // Proximity connecting lines
    if (showDistanceLines && proximityData.proximityList.length > 0) {
      proximityData.proximityList.forEach((pair) => {
        const pA = plants.find((p) => p.id === pair.plantIdA);
        const pB = plants.find((p) => p.id === pair.plantIdB);
        if (!pA || !pB) return;

        const coordsA = pctToFtCoords(pA.x, pA.y, gardenLength, gardenWidth);
        const coordsB = pctToFtCoords(pB.x, pB.y, gardenLength, gardenWidth);

        const points = [
          new THREE.Vector3(coordsA.xFt, 0.1, coordsA.zFt),
          new THREE.Vector3(coordsB.xFt, 0.1, coordsB.zFt),
        ];

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: pair.isTooClose ? 0xef4444 : 0x22c55e,
          linewidth: pair.isTooClose ? 2 : 1,
          transparent: true,
          opacity: pair.isTooClose ? 0.9 : 0.3,
        });
        const line = new THREE.Line(lineGeo, lineMat);
        helpersGroup.add(line);
      });
    }

    // Grid and Boundary
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(
        Math.max(gardenLength, gardenWidth),
        Math.round(Math.max(gardenLength, gardenWidth)),
        0x2563eb,
        0x94a3b8
      );
      gridHelper.position.y = 0.01;
      (gridHelper.material as THREE.Material).opacity = 0.35;
      (gridHelper.material as THREE.Material).transparent = true;
      helpersGroup.add(gridHelper);

      const boundaryPoints = [
        new THREE.Vector3(-gardenLength / 2, 0.05, -gardenWidth / 2),
        new THREE.Vector3(gardenLength / 2, 0.05, -gardenWidth / 2),
        new THREE.Vector3(gardenLength / 2, 0.05, gardenWidth / 2),
        new THREE.Vector3(-gardenLength / 2, 0.05, gardenWidth / 2),
        new THREE.Vector3(-gardenLength / 2, 0.05, -gardenWidth / 2),
      ];
      const boundGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
      const boundMat = new THREE.LineBasicMaterial({ color: 0x2563eb, linewidth: 2 });
      const boundaryLine = new THREE.Line(boundGeo, boundMat);
      helpersGroup.add(boundaryLine);
    }
  }, [
    plants,
    selectedPlantId,
    gardenLength,
    gardenWidth,
    showGrid,
    showSpacingRings,
    showDistanceLines,
    proximityData,
    qualityMode,
  ]);

  // -------------------------------------------------------------
  // MOUSE & TOUCH EVENT HANDLERS (RAYCASTING DRAG & MULTI-TOUCH GESTURES)
  // -------------------------------------------------------------
  const getGroundIntersection = (clientX: number, clientY: number): THREE.Vector3 | null => {
    if (!rendererRef.current || !cameraRef.current || !mountRef.current || !gardenGroupRef.current) return null;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const targetPoint = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(groundPlane, targetPoint);
    if (!hit) return null;

    // Transform world coordinate into rotated gardenGroup local coordinate
    return gardenGroupRef.current.worldToLocal(hit.clone());
  };

  const getClickedPlantId = (clientX: number, clientY: number): string | null => {
    if (!rendererRef.current || !cameraRef.current || !mountRef.current || !plantsGroupRef.current) return null;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObjects(plantsGroupRef.current.children, true);
    if (intersects.length > 0) {
      let curr: THREE.Object3D | null = intersects[0].object;
      while (curr && curr.parent !== plantsGroupRef.current) {
        curr = curr.parent;
      }
      if (curr && curr.userData?.plantId) {
        return curr.userData.plantId as string;
      }
    }
    return null;
  };

  // Pointer Down (Mouse or 1/2 Finger Touch)
  const onPointerDown = (e: React.PointerEvent) => {
    // Capture pointer
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (_) {}

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const isRightClick = e.button === 2;

    if (activePointers.current.size === 1) {
      const plantId = getClickedPlantId(e.clientX, e.clientY);
      if (plantId && !isRightClick) {
        setSelectedPlantId(plantId);
        setIsDraggingPlant(true);
        const p = plants.find((item) => item.id === plantId);
        setDraggedPlantName(p?.name || 'Plant');
      } else {
        orbitState.current.isOrbiting = !isRightClick;
        orbitState.current.isPanning = isRightClick;
        orbitState.current.prevMouseX = e.clientX;
        orbitState.current.prevMouseY = e.clientY;
      }
    } else if (activePointers.current.size === 2) {
      // 2 fingers: pinch-to-zoom & two-finger pan
      setIsDraggingPlant(false);
      orbitState.current.isOrbiting = false;
      orbitState.current.isPanning = false;

      const pts = Array.from(activePointers.current.values());
      pinchInitialDistance.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchInitialRadius.current = orbitState.current.radius;
      pinchInitialMidpoint.current = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };
    }
  };

  // Pointer Move (Mouse move or Touch move)
  const onPointerMove = (e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Single touch / mouse dragging plant
    if (activePointers.current.size === 1) {
      if (isDraggingPlant && selectedPlantId) {
        const hit = getGroundIntersection(e.clientX, e.clientY);
        if (hit) {
          const potRadius = (selectedPlantSpacingConfig?.defaultPotDiameterFt || 1.0) * 0.5;
          const borderMargin = Math.max(0.65, potRadius + 0.35);
          const maxBoundX = Math.max(0.3, gardenLength / 2 - borderMargin);
          const maxBoundZ = Math.max(0.3, gardenWidth / 2 - borderMargin);

          const clampedX = Math.max(-maxBoundX, Math.min(maxBoundX, hit.x));
          const clampedZ = Math.max(-maxBoundZ, Math.min(maxBoundZ, hit.z));

          const { xPct, yPct } = ftToPctCoords(clampedX, clampedZ, gardenLength, gardenWidth);

          onUpdatePlants(
            plants.map((p) =>
              p.id === selectedPlantId ? { ...p, x: Math.round(xPct), y: Math.round(yPct) } : p
            )
          );
        }
        return;
      }

      if (orbitState.current.isOrbiting) {
        const deltaX = e.clientX - orbitState.current.prevMouseX;
        const deltaY = e.clientY - orbitState.current.prevMouseY;

        orbitState.current.theta -= deltaX * 0.007;
        orbitState.current.phi = Math.max(0.12, Math.min(Math.PI / 2.05, orbitState.current.phi - deltaY * 0.007));

        orbitState.current.prevMouseX = e.clientX;
        orbitState.current.prevMouseY = e.clientY;
        updateCameraPosition();
      } else if (orbitState.current.isPanning) {
        const deltaX = e.clientX - orbitState.current.prevMouseX;
        const deltaY = e.clientY - orbitState.current.prevMouseY;

        orbitState.current.target.x -= deltaX * 0.015;
        orbitState.current.target.z -= deltaY * 0.015;

        orbitState.current.prevMouseX = e.clientX;
        orbitState.current.prevMouseY = e.clientY;
        updateCameraPosition();
      }
    } else if (activePointers.current.size === 2) {
      // Pinch to Zoom
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

      if (pinchInitialDistance.current && pinchInitialRadius.current) {
        const ratio = pinchInitialDistance.current / Math.max(10, currentDist);
        const minZoom = 6;
        const maxZoom = Math.max(40, Math.max(gardenLength, gardenWidth) * 3);
        orbitState.current.radius = Math.max(minZoom, Math.min(maxZoom, pinchInitialRadius.current * ratio));
      }

      // Two-Finger Pan
      const currentMid = {
        x: (pts[0].x + pts[1].x) / 2,
        y: (pts[0].y + pts[1].y) / 2,
      };

      if (pinchInitialMidpoint.current) {
        const panDeltaX = currentMid.x - pinchInitialMidpoint.current.x;
        const panDeltaY = currentMid.y - pinchInitialMidpoint.current.y;
        orbitState.current.target.x -= panDeltaX * 0.012;
        orbitState.current.target.z -= panDeltaY * 0.012;
        pinchInitialMidpoint.current = currentMid;
      }

      updateCameraPosition();
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    activePointers.current.delete(e.pointerId);

    if (activePointers.current.size === 0) {
      if (isDraggingPlant) setIsDraggingPlant(false);
      orbitState.current.isOrbiting = false;
      orbitState.current.isPanning = false;
      pinchInitialDistance.current = null;
      pinchInitialRadius.current = null;
      pinchInitialMidpoint.current = null;
    } else if (activePointers.current.size === 1) {
      const remaining = Array.from(activePointers.current.values())[0];
      orbitState.current.prevMouseX = remaining.x;
      orbitState.current.prevMouseY = remaining.y;
      pinchInitialDistance.current = null;
      pinchInitialRadius.current = null;
      pinchInitialMidpoint.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.015;
    const minZoom = 6;
    const maxZoom = Math.max(40, Math.max(gardenLength, gardenWidth) * 3);
    orbitState.current.radius = Math.max(minZoom, Math.min(maxZoom, orbitState.current.radius + zoomDelta));
    updateCameraPosition();
  };

  // On-screen touch buttons: Zoom In / Out, Rotate Left / Right, Reset
  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? -2.5 : 2.5;
    const minZoom = 6;
    const maxZoom = Math.max(40, Math.max(gardenLength, gardenWidth) * 3);
    orbitState.current.radius = Math.max(minZoom, Math.min(maxZoom, orbitState.current.radius + factor));
    updateCameraPosition();
  };

  const handleRotateOrbit = (dir: 'left' | 'right') => {
    const delta = dir === 'left' ? 0.35 : -0.35;
    orbitState.current.theta += delta;
    updateCameraPosition();
  };

  const handleResetOrbit = () => {
    orbitState.current.radius = Math.max(14, Math.max(gardenLength, gardenWidth) * 1.5);
    orbitState.current.theta = Math.PI / 4;
    orbitState.current.phi = Math.PI / 3.4;
    orbitState.current.target.set(0, 0, 0);
    setCameraView('perspective');
    updateCameraPosition();
  };

  // Camera presets
  const handleSetCameraPreset = (preset: 'perspective' | 'top' | 'iso') => {
    setCameraView(preset);
    const radius = Math.max(14, Math.max(gardenLength, gardenWidth) * 1.5);
    orbitState.current.target.set(0, 0, 0);

    if (preset === 'perspective') {
      orbitState.current.radius = radius;
      orbitState.current.theta = Math.PI / 4;
      orbitState.current.phi = Math.PI / 3.4;
    } else if (preset === 'top') {
      orbitState.current.radius = Math.max(gardenLength, gardenWidth) * 1.35;
      orbitState.current.theta = 0;
      orbitState.current.phi = 0.02;
    } else if (preset === 'iso') {
      orbitState.current.radius = radius * 1.1;
      orbitState.current.theta = Math.PI / 3;
      orbitState.current.phi = Math.PI / 4;
    }
    updateCameraPosition();
  };

  // -------------------------------------------------------------
  // PLANT EDITING & ACTIONS
  // -------------------------------------------------------------
  const handleRotateSelected = (deltaDeg: number) => {
    if (!selectedPlantId) return;
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedPlantId ? { ...p, rotation: (p.rotation + deltaDeg + 360) % 360 } : p
      )
    );
  };

  const handleScalePlant = (newScale: number) => {
    if (!selectedPlantId) return;
    const clampedScale = Math.max(0.5, Math.min(2.5, Math.round(newScale * 10) / 10));
    onUpdatePlants(
      plants.map((p) =>
        p.id === selectedPlantId ? { ...p, scale: clampedScale } : p
      )
    );
  };

  const handleDeletePlant = (id: string) => {
    const remaining = plants.filter((p) => p.id !== id);
    onUpdatePlants(remaining);
    setSelectedPlantId(remaining[0]?.id || null);
  };

  const handleDuplicatePlant = (plant: PlacedPlant) => {
    const newPlaced: PlacedPlant = {
      id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      plantId: plant.plantId,
      name: plant.name,
      scientificName: plant.scientificName,
      image: plant.image,
      x: Math.max(10, Math.min(90, plant.x + (Math.random() * 12 - 6))),
      y: Math.max(10, Math.min(90, plant.y + (Math.random() * 12 - 6))),
      rotation: (plant.rotation + 25) % 360,
      scale: plant.scale,
      model3D: plant.model3D,
      potSizeFt: plant.potSizeFt,
      spacingRequiredFt: plant.spacingRequiredFt,
    };
    onUpdatePlants([...plants, newPlaced]);
    setSelectedPlantId(newPlaced.id);
  };

  const handleAddPlantFromCatalog = (catalogPlant: Plant) => {
    const config = getPlantSpacingInfo(catalogPlant);
    const newPlaced: PlacedPlant = {
      id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      plantId: catalogPlant._id,
      name: catalogPlant.name,
      scientificName: catalogPlant.scientificName,
      image: catalogPlant.image,
      x: 35 + Math.random() * 30,
      y: 35 + Math.random() * 30,
      rotation: Math.floor(Math.random() * 360),
      scale: 1.0,
      model3D: catalogPlant.model3D,
      potSizeFt: config.defaultPotDiameterFt,
      spacingRequiredFt: config.recommendedSpacingFt,
    };
    onUpdatePlants([...plants, newPlaced]);
    setSelectedPlantId(newPlaced.id);
    setShowCatalogDrawer(false);
  };

  // Smart Arrangement Layout Optimization
  const handleOptimizeGarden = () => {
    const optimized = optimizeGardenLayout(plants, gardenLength, gardenWidth);
    onUpdatePlants(optimized.optimizedPlants);
    setOptimizationToast(optimized.summaryMessage || 'Planters rearranged to guarantee optimal botanical spacing clearance.');
    setTimeout(() => setOptimizationToast(null), 5000);
  };

  // Apply in-place garden dimensions
  const handleApplyDimensions = () => {
    if (onDimensionsChange && editLength > 0 && editWidth > 0) {
      onDimensionsChange({ length: editLength, width: editWidth });
    }
    setShowDimensionsModal(false);
  };

  return (
    <div
      ref={containerWrapperRef}
      className={`relative rounded-3xl overflow-hidden bg-[#081711] border border-[#D4AF37]/35 shadow-2xl select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : className
      }`}
    >
      {/* 1. TOP RESPONSIVE STATUS BAR */}
      <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left: Dimension & Spacing Pill */}
        <div className="pointer-events-auto bg-[#0B1D16]/90 backdrop-blur-xl px-3 sm:px-4 py-2 rounded-full border border-[#D4AF37]/30 text-[#F4EFE6] flex items-center gap-2 shadow-lg text-xs">
          {onDirectionChange ? (
            <select
              value={direction}
              onChange={(e) => onDirectionChange(e.target.value)}
              className="bg-[#0E281E] border border-[#D4AF37]/30 text-[#F6D985] font-serif font-bold text-xs rounded-full px-2 py-0.5 outline-none cursor-pointer hover:border-[#D4AF37]/60"
              title="Change garden facing direction"
            >
              {[
                'North',
                'North-East',
                'East',
                'South-East',
                'South',
                'South-West',
                'West',
                'North-West',
              ].map((d) => (
                <option key={d} value={d} className="bg-[#081711] text-[#F4EFE6]">
                  🧭 Facing: {d}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-serif font-bold text-[#F6D985]">🌿 {direction}</span>
          )}
          <span className="text-[#D4AF37]/30">•</span>
          <span className="text-[#A3C1AD] font-mono text-[11px] sm:text-xs">
            {unitMode === 'ft' ? (
              <>
                <strong className="text-[#F4EFE6]">{gardenLength} ft</strong> × <strong className="text-[#F4EFE6]">{gardenWidth} ft</strong> ({areaStats.totalGardenAreaSqFt} sq.ft)
              </>
            ) : (
              <>
                <strong className="text-[#F4EFE6]">{Math.round(gardenLength * 0.3048 * 10) / 10} m</strong> × <strong className="text-[#F4EFE6]">{Math.round(gardenWidth * 0.3048 * 10) / 10} m</strong> ({areaStats.totalAreaSqM} sq.m)
              </>
            )}
          </span>

          {/* Edit dimensions trigger button */}
          <button
            type="button"
            onClick={() => setShowDimensionsModal(true)}
            className="ml-1 text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-1 min-h-[36px] min-w-[36px] justify-center"
            title="Edit garden length and width"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit Size</span>
          </button>
        </div>

        {/* Center: Live Spacing Status Alert */}
        {selectedPlacedPlant && (
          <div className="pointer-events-auto">
            {isSelectedPlantTooClose ? (
              <div className="bg-[#3B1212]/95 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#EF4444]/60 text-[#FCA5A5] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] shrink-0" />
                <span>⚠️ Too close</span>
                {nearestNeighborInfo && (
                  <span className="hidden sm:inline font-normal text-red-200">
                    ({selectedPlacedPlant.name.split(' ')[0]} is {nearestNeighborInfo.distanceFt} ft from {nearestNeighborInfo.name.split(' ')[0]})
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-[#0E281E]/95 backdrop-blur-xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#68D391]/60 text-[#68D391] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#68D391] shrink-0" />
                <span>✓ Clear spacing</span>
              </div>
            )}
          </div>
        )}

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          
          {/* Unit Toggle: ft vs m */}
          <button
            type="button"
            onClick={() => setUnitMode(unitMode === 'ft' ? 'm' : 'ft')}
            className="bg-[#0B1D16]/90 backdrop-blur-xl px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-mono font-bold text-[#A3C1AD] hover:text-[#F4EFE6] border border-[#D4AF37]/30 transition"
            title="Switch unit"
          >
            {unitMode === 'ft' ? 'FT' : 'M'}
          </button>

          {/* Eco / HQ Quality Mode Toggle */}
          <button
            type="button"
            onClick={() => setQualityMode(qualityMode === 'hq' ? 'eco' : 'hq')}
            className={`p-2 rounded-full backdrop-blur-xl border transition shadow text-xs font-bold flex items-center gap-1 ${
              qualityMode === 'eco'
                ? 'bg-[#D4AF37]/20 text-[#F6D985] border-[#D4AF37]/50'
                : 'bg-[#0B1D16]/90 text-[#A3C1AD] border-[#D4AF37]/30 hover:text-[#F4EFE6]'
            }`}
            title={qualityMode === 'eco' ? 'Eco Mode active (Optimized for battery & mobile)' : 'High Quality graphics'}
          >
            <Zap className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[10px] hidden sm:inline">{qualityMode === 'eco' ? 'ECO' : 'HQ'}</span>
          </button>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-full backdrop-blur-xl border transition shadow ${
              showGrid
                ? 'luxury-btn-gold text-[#081711] border-transparent'
                : 'bg-[#0B1D16]/90 text-[#A3C1AD] hover:text-[#F4EFE6] border-[#D4AF37]/30'
            }`}
            title="Toggle Grid"
          >
            <GridIcon className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl text-[#A3C1AD] hover:text-[#F4EFE6] border border-[#D4AF37]/30 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* View in Your Space (Camera AR) */}
          {onViewInMySpace && (
            <button
              type="button"
              onClick={onViewInMySpace}
              className="luxury-btn-gold text-[#081711] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#D4AF37]/20 transition"
              title="View in Your Space (Camera AR)"
            >
              <Camera className="w-3.5 h-3.5 text-[#081711] animate-pulse" />
              <span>View in Your Space</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN 3D THREE.JS CANVAS WITH TOUCH-ACTION NONE */}
      <div
        ref={mountRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: 'none' }}
        className={`w-full ${
          isFullscreen ? 'h-full' : 'h-[500px] sm:h-[620px] lg:h-[700px]'
        } cursor-grab active:cursor-grabbing select-none relative`}
      />

      {/* Visual Placement Toast when Dragging */}
      {isDraggingPlant && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#0B1D16]/95 backdrop-blur-xl text-[#F4EFE6] px-4 sm:px-5 py-2 rounded-full border border-[#D4AF37] shadow-2xl flex items-center gap-2 pointer-events-none animate-pulse text-xs font-bold">
          <span>🌱</span>
          <span>Dragging {draggedPlantName} within boundary</span>
        </div>
      )}

      {/* Optimization Toast Notification */}
      {optimizationToast && (
        <div className="absolute top-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md bg-[#0E281E]/95 backdrop-blur-xl border border-[#68D391] text-[#F4EFE6] p-3.5 rounded-2xl shadow-2xl flex items-start gap-3 animate-fadeIn text-xs">
          <Sparkles className="w-4 h-4 text-[#68D391] shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="text-[#F6D985] block font-semibold">Garden Optimized</strong>
            <p className="text-[#A3C1AD] mt-0.5 text-[11px]">{optimizationToast}</p>
          </div>
          <button onClick={() => setOptimizationToast(null)} className="text-[#A3C1AD] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. DEDICATED ON-SCREEN TOUCH CONTROL DOCK (ZOOM, ORBIT, RESET) */}
      <div className="absolute right-3 bottom-24 sm:bottom-28 z-30 flex flex-col gap-1.5 pointer-events-auto">
        <button
          type="button"
          onClick={() => handleZoom('in')}
          className="w-10 h-10 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center hover:bg-[#133528] active:scale-95 transition shadow-lg"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleZoom('out')}
          className="w-10 h-10 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center hover:bg-[#133528] active:scale-95 transition shadow-lg"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleRotateOrbit('left')}
          className="w-10 h-10 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl border border-[#D4AF37]/30 text-[#68D391] flex items-center justify-center hover:bg-[#133528] active:scale-95 transition shadow-lg"
          title="Orbit Left"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => handleRotateOrbit('right')}
          className="w-10 h-10 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl border border-[#D4AF37]/30 text-[#68D391] flex items-center justify-center hover:bg-[#133528] active:scale-95 transition shadow-lg"
          title="Orbit Right"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleResetOrbit}
          className="w-10 h-10 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl border border-[#D4AF37]/30 text-[#F6D985] flex items-center justify-center hover:bg-[#133528] active:scale-95 transition shadow-lg text-[10px] font-bold"
          title="Reset Camera View"
        >
          ⌂
        </button>
      </div>

      {/* 4. FLOATING STATISTICS PANEL (RESPONSIVE) */}
      <div className={`absolute top-16 left-3 sm:left-4 z-30 transition-all duration-300 ${showStatsDrawer ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6 pointer-events-none'}`}>
        <div className="luxury-card bg-[#0B1D16]/95 backdrop-blur-2xl rounded-2xl p-4 border border-[#D4AF37]/35 text-[#F4EFE6] shadow-2xl w-60 sm:w-64 space-y-3">
          <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-2">
            <div>
              <span className="text-[9px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
                METRICS ENGINE
              </span>
              <h4 className="text-xs font-serif font-bold luxury-gold-text">
                Garden Statistics
              </h4>
            </div>
            <button
              onClick={() => setShowStatsDrawer(false)}
              className="text-[#A3C1AD] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#A3C1AD]">Total Area:</span>
              <strong className="text-[#F6D985] font-mono">
                {unitMode === 'ft' ? `${areaStats.totalGardenAreaSqFt} sq.ft` : `${areaStats.totalAreaSqM} sq.m`}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#A3C1AD]">Plant Occupied:</span>
              <strong className="text-[#D4AF37] font-mono">
                {unitMode === 'ft' ? `${areaStats.plantOccupiedAreaSqFt} sq.ft` : `${Math.round(areaStats.plantOccupiedAreaSqFt * 0.0929 * 10) / 10} sq.m`}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#A3C1AD]">Available Area:</span>
              <strong className="text-[#68D391] font-mono">
                {unitMode === 'ft' ? `${areaStats.availableAreaSqFt} sq.ft` : `${areaStats.availableAreaSqM} sq.m`}
              </strong>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#A3C1AD]">Plants Placed:</span>
              <strong className="text-[#F4EFE6] font-mono">{areaStats.numberOfPlants}</strong>
            </div>

            <div className="pt-2 border-t border-[#D4AF37]/20 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#A3C1AD]">Utilization:</span>
                <strong className={areaStats.isOvercrowded ? 'text-[#EF4444]' : 'text-[#68D391]'}>
                  {areaStats.spaceUtilizationPercent}%
                </strong>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#0E281E] overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    areaStats.isOvercrowded ? 'bg-[#EF4444]' : areaStats.spaceUtilizationPercent > 70 ? 'bg-[#E07A5F]' : 'bg-[#68D391]'
                  }`}
                  style={{ width: `${Math.min(100, areaStats.spaceUtilizationPercent)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!showStatsDrawer && (
        <button
          type="button"
          onClick={() => setShowStatsDrawer(true)}
          className="absolute top-16 left-3 sm:left-4 z-30 bg-[#0B1D16]/90 backdrop-blur-xl text-[#F4EFE6] px-3 py-1.5 rounded-full border border-[#D4AF37]/30 text-[11px] font-semibold flex items-center gap-1.5 hover:bg-[#133528] transition shadow-xl pointer-events-auto"
        >
          <Layers className="w-3 h-3 text-[#D4AF37]" />
          <span>Stats ({areaStats.spaceUtilizationPercent}%)</span>
        </button>
      )}

      {/* 5. BOTTOM RESPONSIVE DOCK: SELECTED PLANT INSPECTOR & GLOBAL ACTIONS */}
      <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-4 z-30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pointer-events-none">
        
        {/* Selected Plant Floating Dock */}
        {selectedPlacedPlant ? (
          <div className="pointer-events-auto bg-[#0B1D16]/95 backdrop-blur-2xl rounded-2xl p-2.5 sm:p-3 border border-[#D4AF37]/35 shadow-2xl flex items-center justify-between sm:justify-start gap-2.5 sm:gap-3 text-[#F4EFE6] max-w-xl">
            <img
              src={selectedPlacedPlant.image}
              alt={selectedPlacedPlant.name}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border border-[#D4AF37]/30 shrink-0"
            />

            <div className="min-w-0 pr-1 flex-1 sm:flex-initial">
              <h4 className="text-xs font-serif font-bold luxury-gold-text truncate">
                {selectedPlacedPlant.name}
              </h4>
              <p className="text-[10px] text-[#A3C1AD] font-mono truncate">
                Spacing: {selectedPlantSpacingConfig?.recommendedSpacingFt || 1.5} ft • Scale: {selectedPlacedPlant.scale}x
              </p>
            </div>

            {/* Quick Action Touch Buttons */}
            <div className="flex items-center gap-1 border-l border-[#D4AF37]/20 pl-2 shrink-0">
              <button
                type="button"
                onClick={() => handleRotateSelected(45)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#0E281E] hover:bg-[#133528] active:scale-95 text-[#D4AF37] flex items-center justify-center transition border border-[#D4AF37]/20"
                title="Rotate 45°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleScalePlant(selectedPlacedPlant.scale + 0.1)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#0E281E] hover:bg-[#133528] active:scale-95 text-[#F4EFE6] flex items-center justify-center transition border border-[#D4AF37]/20"
                title="Scale Larger"
              >
                <ZoomIn className="w-3.5 h-3.5 text-[#68D391]" />
              </button>

              <button
                type="button"
                onClick={() => handleScalePlant(selectedPlacedPlant.scale - 0.1)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#0E281E] hover:bg-[#133528] active:scale-95 text-[#F4EFE6] flex items-center justify-center transition border border-[#D4AF37]/20"
                title="Scale Smaller"
              >
                <ZoomOut className="w-3.5 h-3.5 text-[#68D391]" />
              </button>

              <button
                type="button"
                onClick={() => handleDuplicatePlant(selectedPlacedPlant)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#0E281E] hover:bg-[#133528] active:scale-95 text-[#D4AF37] flex items-center justify-center transition border border-[#D4AF37]/20"
                title="Duplicate Plant"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => handleDeletePlant(selectedPlacedPlant.id)}
                className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl bg-[#3B1212] hover:bg-[#521919] active:scale-95 text-[#EF4444] flex items-center justify-center transition border border-[#EF4444]/30"
                title="Remove Plant"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="pointer-events-auto bg-[#0B1D16]/85 backdrop-blur-md px-4 py-2 rounded-full border border-[#D4AF37]/30 text-xs text-[#A3C1AD]">
            Touch or click any botanical planter to move and customize.
          </div>
        )}

        {/* Global Garden Management Buttons */}
        <div className="pointer-events-auto flex items-center justify-end gap-2">
          {/* Smart Placement: "Optimize Garden" */}
          <button
            type="button"
            onClick={handleOptimizeGarden}
            disabled={plants.length === 0}
            className="flex-1 sm:flex-initial py-2.5 sm:py-3 px-4 sm:px-5 rounded-full luxury-btn-secondary text-[#F4EFE6] font-bold text-xs tracking-wider transition border border-[#D4AF37]/30 shadow-xl flex items-center justify-center gap-1.5 disabled:opacity-40 min-h-[44px]"
            title="Auto-arrange plants with clear spacing"
          >
            <Wand2 className="w-4 h-4 text-[#D4AF37]" />
            <span>Optimize</span>
          </button>

          {/* "Add Plant" Trigger */}
          <button
            type="button"
            onClick={() => setShowCatalogDrawer(true)}
            className="flex-1 sm:flex-initial py-2.5 sm:py-3 px-5 sm:px-6 rounded-full luxury-btn-copper text-white font-bold text-xs tracking-wider transition shadow-xl flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Plant</span>
          </button>
        </div>
      </div>

      {/* 6. IN-PLACE GARDEN DIMENSIONS MODAL */}
      {showDimensionsModal && (
        <div className="absolute inset-0 z-50 bg-[#081711]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md luxury-card bg-[#0B1D16]/98 rounded-3xl p-6 shadow-2xl border border-[#D4AF37]/35 text-[#F4EFE6] space-y-5">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#D4AF37] uppercase block">
                  SPACE MEASUREMENT
                </span>
                <h3 className="text-xl font-serif font-bold luxury-gold-text">
                  Garden Dimensions & Area
                </h3>
              </div>
              <button
                onClick={() => setShowDimensionsModal(false)}
                className="p-1.5 rounded-full text-[#A3C1AD] hover:text-[#F4EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dimension Inputs */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/30 space-y-1">
                  <label className="text-[10px] font-bold text-[#A3C1AD] uppercase tracking-wider block">
                    Length ({unitMode})
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="60"
                    step="1"
                    value={editLength}
                    onChange={(e) => setEditLength(Math.max(3, Number(e.target.value)))}
                    className="w-full text-2xl font-serif font-bold text-[#F4EFE6] bg-transparent focus:outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/30 space-y-1">
                  <label className="text-[10px] font-bold text-[#A3C1AD] uppercase tracking-wider block">
                    Width ({unitMode})
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    step="1"
                    value={editWidth}
                    onChange={(e) => setEditWidth(Math.max(2, Number(e.target.value)))}
                    className="w-full text-2xl font-serif font-bold text-[#F4EFE6] bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Area Breakdown Card */}
              <div className="p-4 rounded-2xl bg-[#0E281E]/80 border border-[#D4AF37]/30 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#A3C1AD]">Total Garden Area:</span>
                  <strong className="text-[#F6D985] font-mono text-sm">
                    {editLength * editWidth} sq.ft
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#A3C1AD]">Current Plants Placed:</span>
                  <strong className="text-[#F4EFE6] font-mono">
                    {plants.length} planters
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#A3C1AD]">Used Botanical Area:</span>
                  <strong className="text-[#E07A5F] font-mono">
                    {calculateGardenAreaStats(editLength, editWidth, plants).plantOccupiedAreaSqFt} sq.ft
                  </strong>
                </div>

                <div className="flex justify-between items-center border-t border-[#D4AF37]/20 pt-1.5">
                  <span className="text-[#A3C1AD]">Remaining Free Area:</span>
                  <strong className="text-[#68D391] font-mono text-sm">
                    {calculateGardenAreaStats(editLength, editWidth, plants).availableAreaSqFt} sq.ft
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDimensionsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#A3C1AD] hover:text-[#F4EFE6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyDimensions}
                className="px-6 py-2.5 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold transition shadow-xs"
              >
                Apply Dimensions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. PLANT CATALOG SELECTION DRAWER */}
      {showCatalogDrawer && (
        <div className="absolute inset-0 z-50 bg-[#081711]/80 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-md luxury-card bg-[#0B1D16]/98 h-full p-5 sm:p-6 flex flex-col justify-between shadow-2xl animate-slideInRight text-[#F4EFE6] border-l border-[#D4AF37]/35">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#D4AF37]/25">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] block">
                  VASTU BOTANICAL NURSERY
                </span>
                <h3 className="text-xl font-serif font-bold luxury-gold-text">
                  Place Plant in 3D Garden
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogDrawer(false)}
                className="p-1.5 rounded-full text-[#A3C1AD] hover:text-[#F4EFE6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vastu Direction Filter Bar */}
            <div className="py-2.5 border-b border-[#D4AF37]/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-[#A3C1AD]">
                  Vastu Orientation Zone:
                </span>
                <span className="text-[11px] font-bold text-[#F6D985]">
                  {nurseryDirMeta.name} • {nurseryDirMeta.sanskrit}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(VASTU_DIRECTIONS).map((dirKey) => {
                  const isSelected = canonicalNurseryDir === dirKey;
                  return (
                    <button
                      key={dirKey}
                      type="button"
                      onClick={() => {
                        setNurseryDirection(dirKey);
                        if (onDirectionChange) onDirectionChange(dirKey);
                      }}
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
              <p className="text-[10px] text-[#A3C1AD] mt-1.5 italic">
                Only displaying species auspicious for {canonicalNurseryDir} ({nurseryDirMeta.element}).
              </p>
            </div>

            {/* Catalog List */}
            <div className="overflow-y-auto py-3 space-y-2.5 flex-1 pr-1">
              {vastuFilteredNurseryPlants.length === 0 ? (
                <div className="p-6 text-center luxury-card bg-[#0E281E]/40 border border-[#D4AF37]/20 rounded-2xl my-6">
                  <AlertTriangle className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 opacity-80" />
                  <h4 className="text-sm font-serif font-bold text-[#F4EFE6]">
                    No Species Auspicious for {canonicalNurseryDir}
                  </h4>
                  <p className="text-xs text-[#A3C1AD] mt-1">
                    Please select another direction or adjust your garden orientation.
                  </p>
                </div>
              ) : (
                vastuFilteredNurseryPlants.map((plant) => {
                  const config = getPlantSpacingInfo(plant);
                  return (
                    <div
                      key={plant._id}
                      onClick={() => handleAddPlantFromCatalog(plant)}
                      className="p-3 rounded-2xl border border-[#D4AF37]/20 bg-[#0E281E]/70 hover:border-[#D4AF37]/50 hover:bg-[#0E281E] cursor-pointer transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={plant.image}
                          alt={plant.name}
                          className="w-12 h-12 rounded-xl object-cover border border-[#D4AF37]/30 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs sm:text-sm font-serif font-bold text-[#F4EFE6] group-hover:text-[#F6D985]">
                            {plant.name}
                          </h4>
                          <p className="text-[10px] text-[#A3C1AD] font-mono italic">
                            {plant.scientificName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[#A3C1AD]">
                            <span className="bg-[#081711] px-2 py-0.5 rounded-full font-semibold border border-[#D4AF37]/20">
                              Spacing: {config.recommendedSpacingFt} ft
                            </span>
                            <span className="bg-[#D4AF37]/15 text-[#F6D985] px-2 py-0.5 rounded-full font-semibold border border-[#D4AF37]/30">
                              {canonicalNurseryDir}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="py-1.5 px-3 rounded-full luxury-btn-gold text-[#081711] text-xs font-bold shadow-xs"
                      >
                        Place +
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-[#D4AF37]/25 flex justify-between items-center text-xs text-[#A3C1AD]">
              <span>{vastuFilteredNurseryPlants.length} Vastu-auspicious species for {canonicalNurseryDir}</span>
              <button
                type="button"
                onClick={() => setShowCatalogDrawer(false)}
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

// -------------------------------------------------------------
// PROCEDURAL BOTANICAL 3D MODEL GENERATOR
// -------------------------------------------------------------
function buildBotanical3DModel(
  group: THREE.Group,
  config?: any,
  potDiameterFt: number = 1.0,
  quality: 'hq' | 'eco' = 'hq'
) {
  const potColor = config?.potColor || '#b55a30';
  const foliageColor = config?.foliageColor || '#2d6a4f';
  const flowerColor = config?.flowerColor || '#9b5de5';
  const plantType = (config?.type || 'tulsi').toLowerCase();
  const scale = config?.heightScale || 1.0;

  const potRadius = Math.max(0.35, potDiameterFt * 0.5);
  const potHeight = potRadius * 1.3;

  // 1. Planter Pot
  const segs = quality === 'hq' ? 24 : 12;
  const potGeo = new THREE.CylinderGeometry(potRadius, potRadius * 0.75, potHeight, segs);
  const potMat = new THREE.MeshStandardMaterial({
    color: potColor,
    roughness: 0.78,
    metalness: 0.05,
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = potHeight / 2;
  pot.castShadow = quality === 'hq';
  pot.receiveShadow = quality === 'hq';
  group.add(pot);

  // Pot rim
  const rimGeo = new THREE.TorusGeometry(potRadius * 1.02, potRadius * 0.1, 8, segs);
  const rimMat = new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.75 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = potHeight;
  group.add(rim);

  // Potting Soil
  const soilGeo = new THREE.CircleGeometry(potRadius * 0.95, segs);
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.95 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = potHeight - 0.02;
  soil.receiveShadow = quality === 'hq';
  group.add(soil);

  // 2. Botanical Foliage
  const foliageMat = new THREE.MeshStandardMaterial({
    color: foliageColor,
    roughness: 0.45,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x3d6e32,
    roughness: 0.6,
  });

  const baseY = potHeight;

  if (plantType.includes('aloe')) {
    const leafCount = quality === 'hq' ? 16 : 8;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / 6 + i * 0.35;
      const tier = Math.floor(i / 6);
      const leafLen = (0.75 + tier * 0.35) * scale;
      const leafGeo = new THREE.ConeGeometry(0.12 - tier * 0.02, leafLen, 5);
      const leaf = new THREE.Mesh(leafGeo, foliageMat);
      leaf.castShadow = quality === 'hq';

      const tilt = 0.3 + (2 - tier) * 0.28;
      leaf.position.set(
        Math.cos(angle) * (0.1 + (2 - tier) * 0.08),
        baseY + 0.1 + tier * 0.14,
        Math.sin(angle) * (0.1 + (2 - tier) * 0.08)
      );
      leaf.rotation.set(Math.sin(angle) * tilt, angle, -Math.cos(angle) * tilt);
      group.add(leaf);
    }
  } else if (plantType.includes('mint') || plantType.includes('pudina') || plantType.includes('brahmi')) {
    const stemCount = quality === 'hq' ? 7 : 4;
    for (let s = 0; s < stemCount; s++) {
      const sAngle = (s * Math.PI * 2) / stemCount;
      const stemH = (0.6 + Math.random() * 0.35) * scale;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, stemH, 6), stemMat);
      stem.position.set(Math.cos(sAngle) * 0.16, baseY + stemH / 2, Math.sin(sAngle) * 0.16);
      stem.rotation.z = Math.cos(sAngle) * 0.25;
      stem.rotation.x = Math.sin(sAngle) * 0.25;
      group.add(stem);

      const leafPerStem = quality === 'hq' ? 4 : 2;
      for (let l = 0; l < leafPerStem; l++) {
        const lAngle = (l * Math.PI) / 2 + sAngle;
        const leafGeo = new THREE.SphereGeometry(0.13, 6, 6);
        leafGeo.scale(1.2, 0.25, 0.9);
        const leaf = new THREE.Mesh(leafGeo, foliageMat);
        leaf.castShadow = quality === 'hq';
        leaf.position.set(
          stem.position.x + Math.cos(lAngle) * 0.14,
          baseY + 0.08 + l * 0.15,
          stem.position.z + Math.sin(lAngle) * 0.14
        );
        leaf.rotation.y = lAngle;
        group.add(leaf);
      }
    }
  } else if (plantType.includes('lemongrass')) {
    const bladeCount = quality === 'hq' ? 24 : 12;
    for (let b = 0; b < bladeCount; b++) {
      const bAngle = (b * Math.PI * 2) / bladeCount;
      const bLen = (1.1 + Math.random() * 0.6) * scale;
      const bladeGeo = new THREE.ConeGeometry(0.04, bLen, 3);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.4, side: THREE.DoubleSide });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.castShadow = quality === 'hq';
      const curve = 0.4 + Math.random() * 0.35;
      blade.position.set(Math.cos(bAngle) * 0.12, baseY + bLen * 0.45, Math.sin(bAngle) * 0.12);
      blade.rotation.set(Math.sin(bAngle) * curve, bAngle, -Math.cos(bAngle) * curve);
      group.add(blade);
    }
  } else if (plantType.includes('hibiscus')) {
    const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.2 * scale, 6), stemMat);
    mainStem.position.y = baseY + 0.6 * scale;
    mainStem.castShadow = quality === 'hq';
    group.add(mainStem);

    const leafCount = quality === 'hq' ? 12 : 6;
    for (let l = 0; l < leafCount; l++) {
      const angle = l * 1.5;
      const leafGeo = new THREE.SphereGeometry(0.16, 6, 6);
      leafGeo.scale(1.4, 0.2, 0.85);
      const leaf = new THREE.Mesh(leafGeo, foliageMat);
      leaf.castShadow = quality === 'hq';
      leaf.position.set(Math.cos(angle) * 0.3, baseY + 0.25 + l * 0.07, Math.sin(angle) * 0.3);
      leaf.rotation.set(0.2, angle, 0.2);
      group.add(leaf);
    }

    // Flower blossom
    const flowerGroup = new THREE.Group();
    const petalMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.3, side: THREE.DoubleSide });
    for (let p = 0; p < 5; p++) {
      const pAngle = (p * Math.PI * 2) / 5;
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.2, 8), petalMat);
      petal.rotation.x = -0.5;
      petal.rotation.z = pAngle;
      petal.position.set(Math.cos(pAngle) * 0.08, 0, Math.sin(pAngle) * 0.08);
      flowerGroup.add(petal);
    }
    const stamen = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), new THREE.MeshStandardMaterial({ color: 0xffd166 }));
    stamen.position.y = 0.12;
    flowerGroup.add(stamen);

    flowerGroup.position.set(0, baseY + 1.25 * scale, 0);
    group.add(flowerGroup);
  } else {
    // Default Tulsi / Ashwagandha / Neem architecture
    const mainStem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 1.3 * scale, 8), stemMat);
    mainStem.position.y = baseY + 0.65 * scale;
    mainStem.castShadow = quality === 'hq';
    group.add(mainStem);

    const branchCount = quality === 'hq' ? 6 : 4;
    for (let b = 0; b < branchCount; b++) {
      const bAngle = (b * Math.PI * 2) / branchCount + b * 0.4;
      const bLen = 0.45 * scale;
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, bLen, 6), stemMat);
      branch.position.set(Math.cos(bAngle) * 0.14, baseY + 0.35 + b * 0.12, Math.sin(bAngle) * 0.14);
      branch.rotation.set(Math.sin(bAngle) * 0.7, 0, -Math.cos(bAngle) * 0.7);
      group.add(branch);

      const leafCount = quality === 'hq' ? 3 : 2;
      for (let lc = 0; lc < leafCount; lc++) {
        const leafGeo = new THREE.SphereGeometry(0.12, 6, 6);
        leafGeo.scale(1.3, 0.2, 0.85);
        const leaf = new THREE.Mesh(leafGeo, foliageMat);
        leaf.castShadow = quality === 'hq';
        leaf.position.set(
          branch.position.x + Math.cos(bAngle) * (0.16 + lc * 0.07),
          branch.position.y + 0.08 + lc * 0.04,
          branch.position.z + Math.sin(bAngle) * (0.16 + lc * 0.07)
        );
        leaf.rotation.set(0.3, bAngle + lc * 0.5, 0.2);
        group.add(leaf);
      }
    }

    // Top flower spires (Tulsi Manjari)
    const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.5 });
    for (let f = 0; f < 3; f++) {
      const fAngle = (f * Math.PI * 2) / 3;
      const spire = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.4 * scale, 6), flowerMat);
      spire.position.set(Math.cos(fAngle) * 0.09, baseY + 1.45 * scale, Math.sin(fAngle) * 0.09);
      group.add(spire);
    }
  }
}
