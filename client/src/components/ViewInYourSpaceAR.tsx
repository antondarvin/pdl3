import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Plant, PlacedPlant } from '../types';
import './ViewInYourSpaceAR.css';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { detectARCapabilities, ARCapabilityReport, requestOrientationPermission } from '../utils/arCapabilities';
import {
  filterPlantsByVastuDirection,
  isPlantVastuCompatible,
  normalizeVastuDirection,
  VASTU_DIRECTIONS,
  getVastuDirectionMetadata,
} from '../utils/vastuRules';
import { evaluatePlacementSuitability } from '../utils/plantPlacementDetector';
import {
  FT_TO_M,
  M_TO_FT,
  DIRECTION_DEG,
  PlacedItem,
  GardenFrame,
  PlantModelCache,
  FrameAnalyzer,
  orientationToQuaternion,
  cameraBearing,
  headingToDirection,
  normDeg,
  angleDelta,
  zoneOf,
  isInsideGarden,
  toLayoutPercent,
  findSpacingConflicts,
  crowdingAt,
  findBestSpot,
  spacingFt,
  estimatePlantHeightM,
} from '../utils/arPlacementEngine';
import {
  ArrowLeft, Compass, RotateCw, RotateCcw, ZoomIn, ZoomOut, Ruler, Trash2, Copy, Move,
  Save, Check, X, Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Box, Camera, Smartphone, Wand2,
} from 'lucide-react';

interface ViewInYourSpaceARProps {
  initialPlant: Plant;
  catalogPlants: Plant[];
  onClose: () => void;
  onSaveToGardenSuccess?: (gardenId: string) => void;
  onSwitchTo3DPlanner?: (plant: Plant) => void;
}

type ViewMode = 'webxr' | 'camera' | '3d';
type SpaceType = 'Indoor' | 'Balcony' | 'Terrace' | 'Outdoor';
type SunLevel = 'High' | 'Medium' | 'Low';

interface SpotInfo {
  found: boolean; // a floor point is under the reticle
  locked: boolean; // stable enough to place
  zone: string; // Vastu zone of the garden, or 'Center'
  inside: boolean; // inside the garden boundary
  crowdedBy: string | null; // plant name that is too close
  crowdGapCm: number;
}

const EMPTY_SPOT: SpotInfo = { found: false, locked: false, zone: 'Center', inside: true, crowdedBy: null, crowdGapCm: 0 };
const SUN_TO_LUMA: Record<SunLevel, number> = { High: 185, Medium: 120, Low: 60 };
const COLORS = { ok: 0x10b981, warn: 0xf59e0b, bad: 0xef4444, gold: 0xd4af37 };
// Field of view that matches a phone's rear camera for the current orientation.
const arFov = (aspect: number) => (aspect >= 1 ? 45 : 63);
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Small touch screens: render at a lower pixel ratio to keep the frame rate smooth.
const pixelRatioFor = () => {
  const dpr = window.devicePixelRatio || 1;
  const smallTouch = window.matchMedia?.('(pointer: coarse) and (max-width: 480px)').matches;
  return Math.min(dpr, smallTouch ? 1.5 : 2);
};

const uid = () => `placed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const ViewInYourSpaceAR: React.FC<ViewInYourSpaceARProps> = ({
  initialPlant,
  catalogPlants,
  onClose,
  onSaveToGardenSuccess,
  onSwitchTo3DPlanner,
}) => {
  const { user } = useAuth();

  // ------------------------------------------------------------------ state
  const [activePlant, setActivePlant] = useState<Plant>(initialPlant);
  const [capabilities, setCapabilities] = useState<ARCapabilityReport | null>(null);
  const [mode, setMode] = useState<ViewMode>('3d');
  const [xrStarting, setXrStarting] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sensorsLive, setSensorsLive] = useState(false);
  const [hasAbsoluteCompass, setHasAbsoluteCompass] = useState(false);
  const [needsSensorPermission, setNeedsSensorPermission] = useState(false);

  const [placed, setPlaced] = useState<PlacedItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [spot, setSpot] = useState<SpotInfo>(EMPTY_SPOT);

  const [spaceType, setSpaceType] = useState<SpaceType>('Balcony');
  const [manualSun, setManualSun] = useState<SunLevel>('High');
  const [cameraLuma, setCameraLuma] = useState<number | null>(null);
  const [viewHeading, setViewHeading] = useState(0); // compass bearing the camera is facing
  const [northOffset, setNorthOffset] = useState(0); // compass bearing of world -Z
  const [gardenDims, setGardenDims] = useState({ length: 8, width: 6 }); // ft
  const [gardenCenter, setGardenCenter] = useState<{ x: number; y: number; z: number } | null>(null);
  const [phoneHeightM, setPhoneHeightM] = useState(1.3);

  const [measuring, setMeasuring] = useState(false);
  const [measurePts, setMeasurePts] = useState<THREE.Vector3[]>([]);

  const [showCalibration, setShowCalibration] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [catalogDirection, setCatalogDirection] = useState('North-East');
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'warn' | 'bad' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedGardenId, setSavedGardenId] = useState<string | null>(null);
  const [dirtySinceSave, setDirtySinceSave] = useState(false);

  // ------------------------------------------------------------------ refs (hot path, read inside the render loop)
  const rootRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const reticleRef = useRef<THREE.Group | null>(null);
  const ghostRef = useRef<THREE.Group | null>(null);
  const floorRef = useRef<THREE.Mesh | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const shadowRef = useRef<THREE.Mesh | null>(null);
  const boundaryRef = useRef<THREE.Group | null>(null);
  const measureGroupRef = useRef<THREE.Group | null>(null);
  const hemiRef = useRef<THREE.HemisphereLight | null>(null);
  const plantLayerRef = useRef<THREE.Group | null>(null);
  const meshesRef = useRef(new Map<string, { root: THREE.Group; ring: THREE.Mesh; plantKey: string }>());
  const cacheRef = useRef<PlantModelCache | null>(null);
  const analyzerRef = useRef<FrameAnalyzer | null>(null);

  const modeRef = useRef<ViewMode>('3d');
  const reducedMotionRef = useRef(prefersReducedMotion());
  const placedRef = useRef<PlacedItem[]>([]);
  const activePlantRef = useRef(activePlant);
  const frameRef = useRef<GardenFrame | null>(null);
  const northOffsetRef = useRef(0);
  const phoneHeightRef = useRef(1.3);
  const measuringRef = useRef(false);

  const orientRef = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const alphaOffsetRef = useRef<number | null>(null);
  const absHeadingRef = useRef<number | null>(null);
  const motionRef = useRef(99);
  const lockSinceRef = useRef(0);
  const spotPosRef = useRef<THREE.Vector3 | null>(null);
  const spotKeyRef = useRef('');
  const lastHeadingPushRef = useRef(0);

  const orbitRef = useRef({ theta: 0.6, phi: 1.0, radius: 4.2, target: new THREE.Vector3(0, 0.2, 0) });
  const lookRef = useRef({ yaw: 0, pitch: -0.6 }); // camera mode without sensors
  const hoverRef = useRef<THREE.Vector3 | null>(null);
  const pointerRef = useRef<{ x: number; y: number; t: number; id: string | null; dragging: boolean; kind: 'none' | 'orbit' | 'look' | 'plant' } | null>(null);

  const xrSessionRef = useRef<any>(null);
  const hitSourceRef = useRef<any>(null);

  // keep refs in sync with state
  useEffect(() => { placedRef.current = placed; }, [placed]);
  useEffect(() => { activePlantRef.current = activePlant; }, [activePlant]);
  useEffect(() => { northOffsetRef.current = northOffset; }, [northOffset]);
  useEffect(() => { phoneHeightRef.current = phoneHeightM; }, [phoneHeightM]);
  useEffect(() => { measuringRef.current = measuring; }, [measuring]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const frame: GardenFrame = useMemo(() => {
    const c = gardenCenter || { x: 0, y: 0, z: 0 };
    return {
      center: new THREE.Vector3(c.x, c.y, c.z),
      widthM: gardenDims.width * FT_TO_M,
      lengthM: gardenDims.length * FT_TO_M,
      northOffsetDeg: northOffset,
    };
  }, [gardenCenter, gardenDims, northOffset]);
  useEffect(() => { frameRef.current = frame; }, [frame]);

  const toastTimerRef = useRef<number | undefined>(undefined);
  const showToast = useCallback((text: string, tone: 'ok' | 'warn' | 'bad' = 'ok') => {
    setToast({ text, tone });
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  // ------------------------------------------------------------------ derived
  const conflicts = useMemo(() => findSpacingConflicts(placed), [placed]);
  const selected = placed.find((p) => p.id === selectedId) || null;
  const focusPlant = selected?.plant || activePlant;
  const lightLuma = cameraLuma ?? SUN_TO_LUMA[manualSun];
  const spotBearing = spot.found && spot.zone !== 'Center' ? DIRECTION_DEG[spot.zone] : viewHeading;

  const suitability = useMemo(
    () =>
      evaluatePlacementSuitability(focusPlant, {
        compassHeading: spotBearing,
        lightLuma,
        manualSunlight: manualSun,
        spaceType,
      }),
    [focusPlant, spotBearing, lightLuma, manualSun, spaceType]
  );

  const spotZoneMatch = spot.zone !== 'Center' && isPlantVastuCompatible(activePlant, spot.zone);
  const spotStatus: 'none' | 'ok' | 'warn' | 'bad' = !spot.found
    ? 'none'
    : spot.crowdedBy
    ? 'bad'
    : !spot.inside || !spotZoneMatch || !suitability.lightMatch
    ? 'warn'
    : 'ok';

  const smartSuggestions = useMemo(() => {
    const zone = spot.found && spot.zone !== 'Center' ? spot.zone : headingToDirection(viewHeading);
    const lightTier: SunLevel = lightLuma >= 160 ? 'High' : lightLuma <= 85 ? 'Low' : manualSun;
    return filterPlantsByVastuDirection(catalogPlants, zone)
      .map((plant) => {
        const sun = plant.sunlight.toLowerCase();
        let score = 40;
        if (lightTier === 'High' ? /high|full/.test(sun) : lightTier === 'Medium' ? /medium|partial/.test(sun) : /low|shade|indoor/.test(sun)) score += 35;
        else score += 12;
        const io = plant.indoorOutdoor.toLowerCase();
        score += spaceType === 'Indoor' ? (io.includes('indoor') || io.includes('both') ? 20 : 5) : 18;
        return { plant, score: Math.min(99, score), zone };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [catalogPlants, spot.found, spot.zone, viewHeading, lightLuma, manualSun, spaceType]);

  const canonicalCatalogDir = normalizeVastuDirection(catalogDirection);
  const catalogDirMeta = getVastuDirectionMetadata(canonicalCatalogDir);
  const catalogList = useMemo(() => filterPlantsByVastuDirection(catalogPlants, canonicalCatalogDir), [catalogPlants, canonicalCatalogDir]);

  const measuredFt = measurePts.length === 2 ? Math.round(measurePts[0].distanceTo(measurePts[1]) * M_TO_FT * 10) / 10 : null;

  // ------------------------------------------------------------------ camera stream
  const stopCamera = useCallback(() => {
    const v = videoRef.current;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
    setStreamActive(false);
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const insecure = location.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(location.hostname);
        throw new Error(insecure ? 'Camera needs HTTPS on mobile (deploy to Vercel or use an HTTPS tunnel).' : 'Camera not available in this browser.');
      }
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      const v = videoRef.current;
      if (!v) { stream.getTracks().forEach((t) => t.stop()); return false; }
      v.srcObject = stream;
      v.muted = true;
      v.setAttribute('playsinline', 'true');
      await v.play().catch(() => undefined);
      setStreamActive(true);
      return true;
    } catch (err: any) {
      setCameraError(err?.message || 'Camera permission denied.');
      setStreamActive(false);
      return false;
    }
  }, [stopCamera]);

  // ------------------------------------------------------------------ orientation sensors (compass + 3-DoF camera tracking)
  useEffect(() => {
    let smoothed: number | null = null;
    const pushAbs = (h: number) => {
      smoothed = smoothed === null ? h : normDeg(smoothed + angleDelta(smoothed, h) * 0.2);
      absHeadingRef.current = smoothed;
      setHasAbsoluteCompass(true);
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.alpha === null || e.beta === null || e.gamma === null) return;
      orientRef.current = { alpha: e.alpha, beta: e.beta, gamma: e.gamma };
      const ios = (e as any).webkitCompassHeading;
      if (typeof ios === 'number' && !Number.isNaN(ios)) pushAbs(ios);
      else if (e.absolute) pushAbs(360 - e.alpha);
      setSensorsLive(true);
    };
    const onAbs = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) pushAbs(360 - e.alpha);
    };
    window.addEventListener('deviceorientation', onOrient, true);
    window.addEventListener('deviceorientationabsolute' as any, onAbs, true);
    setNeedsSensorPermission(typeof (DeviceOrientationEvent as any)?.requestPermission === 'function');
    return () => {
      window.removeEventListener('deviceorientation', onOrient, true);
      window.removeEventListener('deviceorientationabsolute' as any, onAbs, true);
    };
  }, []);

  const enableSensors = async () => {
    const ok = await requestOrientationPermission();
    setNeedsSensorPermission(!ok);
    if (!ok) showToast('Motion sensors were not allowed — drag to look around instead.', 'warn');
  };

  // ------------------------------------------------------------------ capabilities → initial mode
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const report = await detectARCapabilities();
      if (cancelled) return;
      setCapabilities(report);
      if (report.isMobile && report.hasCamera) {
        const ok = await startCamera();
        if (!cancelled) setMode(ok ? 'camera' : '3d');
      } else {
        setMode('3d');
      }
    })();
    return () => { cancelled = true; };
  }, [startCamera]);

  // brightness + motion sampling from the live camera
  useEffect(() => {
    if (!streamActive || mode !== 'camera') { motionRef.current = 99; return; }
    analyzerRef.current = analyzerRef.current || new FrameAnalyzer();
    const id = window.setInterval(() => {
      const r = analyzerRef.current!.sample(videoRef.current);
      if (!r) return;
      motionRef.current = r.motion;
      setCameraLuma((prev) => (prev === null || Math.abs(prev - r.luma) > 4 ? r.luma : prev));
    }, 250);
    return () => window.clearInterval(id);
  }, [streamActive, mode]);

  // ------------------------------------------------------------------ Three.js scene (created once)
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(pixelRatioFor());
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.03, 60);
    cameraRef.current = camera;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1.0);
    scene.add(hemi);
    hemiRef.current = hemi;
    const sun = new THREE.DirectionalLight(0xfff3e0, 1.8);
    sun.position.set(2.5, 5, 2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -5; sun.shadow.camera.right = 5;
    sun.shadow.camera.top = 5; sun.shadow.camera.bottom = -5;
    sun.shadow.bias = -0.0008;
    scene.add(sun, sun.target);

    // floor (3D mode) + shadow catcher (AR modes: plants cast shadows onto the real floor)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: 0x0e281e, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    floorRef.current = floor;
    const grid = new THREE.GridHelper(30, 100, 0xd4af37, 0x1d4a37);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.25;
    grid.position.y = 0.001;
    scene.add(grid);
    gridRef.current = grid;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.35 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.receiveShadow = true;
    shadow.position.y = 0.002;
    scene.add(shadow);
    shadowRef.current = shadow;

    // reticle: outer ring (status colour) + spacing ring (plant's clearance radius) + heading arrow
    const reticle = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.135, 48), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false }));
    ring.rotation.x = -Math.PI / 2;
    const spacingRing = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 64), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthTest: false }));
    spacingRing.rotation.x = -Math.PI / 2;
    spacingRing.name = 'spacing';
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.02, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false }));
    dot.rotation.x = -Math.PI / 2;
    reticle.add(ring, spacingRing, dot);
    reticle.renderOrder = 10;
    reticle.visible = false;
    scene.add(reticle);
    reticleRef.current = reticle;

    const plantLayer = new THREE.Group();
    scene.add(plantLayer);
    plantLayerRef.current = plantLayer;

    const boundary = new THREE.Group();
    scene.add(boundary);
    boundaryRef.current = boundary;

    const measureGroup = new THREE.Group();
    scene.add(measureGroup);
    measureGroupRef.current = measureGroup;

    cacheRef.current = new PlantModelCache();

    const ro = new ResizeObserver(() => {
      if (renderer.xr.isPresenting) return;
      const nw = container.clientWidth || window.innerWidth;
      const nh = container.clientHeight || window.innerHeight;
      camera.aspect = nw / nh;
      if (modeRef.current !== '3d') camera.fov = arFov(camera.aspect);
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatioFor());
      renderer.setSize(nw, nh);
    });
    ro.observe(container);

    renderer.setAnimationLoop(renderLoop);

    return () => {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      xrSessionRef.current?.end?.().catch(() => undefined);
      meshesRef.current.forEach(({ ring }) => (ring.material as THREE.Material).dispose());
      meshesRef.current.clear();
      disposeGhost();
      cacheRef.current?.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh || (o as any).isLine) {
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mat) => mat?.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------ render loop (no React state writes except throttled HUD updates)
  const _ray = useRef(new THREE.Raycaster()).current;
  const _plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)).current;
  const _v = useRef(new THREE.Vector3()).current;
  const _m = useRef(new THREE.Matrix4()).current;
  const _q = useRef(new THREE.Quaternion()).current;
  const _s = useRef(new THREE.Vector3()).current;

  function floorHitFromNdc(ndcX: number, ndcY: number, floorY = 0, maxDist = 8): THREE.Vector3 | null {
    const cam = cameraRef.current;
    if (!cam) return null;
    _ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), cam);
    _plane.constant = -floorY;
    const hit = _ray.ray.intersectPlane(_plane, new THREE.Vector3());
    if (!hit || hit.distanceTo(_ray.ray.origin) > maxDist) return null;
    return hit;
  }

  function renderLoop(_time: number, xrFrame?: any) {
    const renderer = rendererRef.current, scene = sceneRef.current, cam = cameraRef.current;
    if (!renderer || !scene || !cam) return;
    const m = modeRef.current;
    let hit: THREE.Vector3 | null = null;
    let locked = false;

    if (m === 'webxr' && xrFrame && hitSourceRef.current) {
      const refSpace = renderer.xr.getReferenceSpace();
      const results = xrFrame.getHitTestResults(hitSourceRef.current);
      if (results.length && refSpace) {
        const pose = results[0].getPose(refSpace);
        if (pose) {
          _m.fromArray(pose.transform.matrix);
          _m.decompose(_v, _q, _s);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(_q);
          if (up.y > 0.85) { hit = _v.clone(); locked = true; } // horizontal surfaces only
        }
      }
    } else if (m === 'camera') {
      cam.position.set(0, phoneHeightRef.current, 0);
      const o = orientRef.current;
      if (o) {
        if (alphaOffsetRef.current === null) {
          alphaOffsetRef.current = o.alpha;
          // anchor world -Z to the real compass heading when the phone has one
          if (absHeadingRef.current !== null) setNorthOffset(Math.round(absHeadingRef.current));
        }
        const screenAngle = (screen.orientation?.angle ?? (window as any).orientation ?? 0) as number;
        orientationToQuaternion(cam.quaternion, o.alpha - alphaOffsetRef.current, o.beta, o.gamma, screenAngle);
      } else {
        cam.quaternion.setFromEuler(new THREE.Euler(lookRef.current.pitch, lookRef.current.yaw, 0, 'YXZ'));
      }
      cam.updateMatrixWorld();
      hit = floorHitFromNdc(0, 0, 0, 6);
      if (hit && hit.distanceTo(cam.position) < 0.35) hit = null;
      // "Lock" = floor in view + camera held steady for ~0.4 s (or no camera feed to judge)
      const steady = motionRef.current < 9 || !videoRef.current?.srcObject;
      if (hit && steady) {
        if (!lockSinceRef.current) lockSinceRef.current = performance.now();
        locked = performance.now() - lockSinceRef.current > 400;
      } else {
        lockSinceRef.current = 0;
      }
    } else if (m === '3d') {
      const ob = orbitRef.current;
      cam.position.set(
        ob.target.x + ob.radius * Math.sin(ob.phi) * Math.sin(ob.theta),
        ob.target.y + ob.radius * Math.cos(ob.phi),
        ob.target.z + ob.radius * Math.sin(ob.phi) * Math.cos(ob.theta)
      );
      cam.lookAt(ob.target);
      cam.updateMatrixWorld();
      hit = hoverRef.current ? hoverRef.current.clone() : floorHitFromNdc(0, 0);
      locked = !!hit;
    }

    updateSpot(hit, locked);

    // throttled compass HUD update
    if (m !== 'webxr' || renderer.xr.isPresenting) {
      const b = absHeadingRef.current !== null && m !== '3d' ? absHeadingRef.current : cameraBearing(renderer.xr.isPresenting ? renderer.xr.getCamera() : cam, northOffsetRef.current);
      if (Math.abs(angleDelta(lastHeadingPushRef.current, b)) >= 3) {
        lastHeadingPushRef.current = b;
        setViewHeading(Math.round(b));
      }
    }

    renderer.render(scene, cam);
  }

  function updateSpot(hit: THREE.Vector3 | null, locked: boolean) {
    const reticle = reticleRef.current, ghost = ghostRef.current;
    const plant = activePlantRef.current;
    const fr = frameRef.current;
    spotPosRef.current = hit && locked ? hit : null;

    let info: SpotInfo = EMPTY_SPOT;
    if (hit && fr) {
      const crowd = crowdingAt(placedRef.current, plant, hit, pointerRef.current?.kind === 'plant' ? pointerRef.current.id || undefined : undefined);
      info = {
        found: true,
        locked,
        zone: zoneOf(fr, hit),
        inside: isInsideGarden(fr, hit),
        crowdedBy: crowd ? crowd.item.plant.name : null,
        crowdGapCm: crowd ? Math.round((crowd.need - crowd.dist) * 100) : 0,
      };
    }

    if (reticle) {
      reticle.visible = !!hit;
      if (hit) {
        reticle.position.set(hit.x, hit.y + 0.004, hit.z);
        const color = !locked ? COLORS.gold : info.crowdedBy ? COLORS.bad : !info.inside || !isPlantVastuCompatible(plant, info.zone) ? COLORS.warn : COLORS.ok;
        const [ring, spacing] = reticle.children as THREE.Mesh[];
        (ring.material as THREE.MeshBasicMaterial).color.setHex(color);
        (spacing.material as THREE.MeshBasicMaterial).color.setHex(color);
        spacing.visible = !measuringRef.current;
        spacing.scale.setScalar(Math.max(0.12, (spacingFt(plant) * FT_TO_M) / 2));
        const pulse = locked || reducedMotionRef.current ? 1 : 1 + Math.sin(performance.now() / 160) * 0.08;
        reticle.children[0].scale.setScalar(pulse);
      }
    }
    if (ghost) {
      ghost.visible = !!hit && locked && !measuringRef.current && pointerRef.current?.kind !== 'plant';
      if (hit) ghost.position.copy(hit);
    }

    const key = `${info.found}|${info.locked}|${info.zone}|${info.inside}|${info.crowdedBy}|${Math.round(info.crowdGapCm / 5)}`;
    if (key !== spotKeyRef.current) {
      spotKeyRef.current = key;
      setSpot(info);
    }
  }

  // ------------------------------------------------------------------ mode-specific scene setup
  useEffect(() => {
    const scene = sceneRef.current, cam = cameraRef.current;
    if (!scene || !cam) return;
    const is3d = mode === '3d';
    scene.background = is3d ? new THREE.Color(0x081711) : null;
    if (floorRef.current) floorRef.current.visible = is3d;
    if (gridRef.current) gridRef.current.visible = is3d;
    if (shadowRef.current) shadowRef.current.visible = !is3d;
    cam.fov = is3d ? 50 : arFov(cam.aspect); // phone rear camera ≈ 63° portrait / 45° landscape
    cam.updateProjectionMatrix();
    hoverRef.current = null;
    lockSinceRef.current = 0;
    if (mode === 'camera') alphaOffsetRef.current = null; // re-anchor yaw to where the phone points now
  }, [mode]);

  // AR lighting follows the real room brightness
  useEffect(() => {
    if (hemiRef.current) hemiRef.current.intensity = mode === '3d' || cameraLuma === null ? 1.0 : 0.45 + (cameraLuma / 255) * 1.1;
  }, [cameraLuma, mode]);

  // ghost preview of the active plant at the reticle
  function disposeGhost() {
    const g = ghostRef.current;
    if (!g) return;
    g.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
    });
    g.removeFromParent();
    ghostRef.current = null;
  }
  useEffect(() => {
    const scene = sceneRef.current, cache = cacheRef.current;
    if (!scene || !cache) return;
    disposeGhost();
    const ghost = cache.get(activePlant);
    ghost.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => {
        const c = m.clone();
        c.transparent = true;
        c.opacity = 0.5;
        c.depthWrite = false;
        return c;
      });
      mesh.material = Array.isArray(mesh.material) ? mats : mats[0];
      mesh.castShadow = false;
    });
    ghost.visible = false;
    scene.add(ghost);
    ghostRef.current = ghost;
  }, [activePlant]);

  // sync placed plants → meshes (create once, then only update transforms)
  useEffect(() => {
    const layer = plantLayerRef.current, cache = cacheRef.current;
    if (!layer || !cache) return;
    const map = meshesRef.current;
    const ids = new Set(placed.map((p) => p.id));
    map.forEach((entry, id) => {
      if (!ids.has(id)) {
        entry.root.removeFromParent();
        (entry.ring.material as THREE.Material).dispose();
        map.delete(id);
      }
    });
    for (const item of placed) {
      let entry = map.get(item.id);
      if (!entry || entry.plantKey !== item.plant._id) {
        if (entry) { entry.root.removeFromParent(); (entry.ring.material as THREE.Material).dispose(); }
        const root = new THREE.Group();
        root.userData.placedId = item.id;
        const model = cache.get(item.plant);
        model.name = 'model';
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.95, 1, 64),
          new THREE.MeshBasicMaterial({ color: COLORS.ok, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.003;
        root.add(model, ring);
        layer.add(root);
        entry = { root, ring, plantKey: item.plant._id };
        map.set(item.id, entry);
      }
      entry.root.position.set(item.x, item.y, item.z);
      const model = entry.root.getObjectByName('model')!;
      model.rotation.y = THREE.MathUtils.degToRad(item.rotation);
      model.scale.setScalar(item.scale);
      entry.ring.scale.setScalar(Math.max(0.1, (spacingFt(item.plant) * item.scale * FT_TO_M) / 2));
      const mat = entry.ring.material as THREE.MeshBasicMaterial;
      mat.color.setHex(conflicts.has(item.id) ? COLORS.bad : item.id === selectedId ? COLORS.gold : COLORS.ok);
      mat.opacity = item.id === selectedId || conflicts.has(item.id) ? 0.9 : 0.4;
    }
    // shadow catcher follows the floor height (WebXR floors are not at y = 0)
    if (shadowRef.current && placed.length) shadowRef.current.position.y = placed[placed.length - 1].y + 0.002;
  }, [placed, selectedId, conflicts]);

  // garden boundary rectangle + north marker
  useEffect(() => {
    const g = boundaryRef.current;
    if (!g) return;
    g.traverse((c) => {
      const m = c as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material)?.dispose();
    });
    g.clear();
    if (!gardenCenter && mode !== '3d') return;
    const w = frame.widthM / 2, l = frame.lengthM / 2;
    const pts = [new THREE.Vector3(-w, 0, -l), new THREE.Vector3(w, 0, -l), new THREE.Vector3(w, 0, l), new THREE.Vector3(-w, 0, l)];
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.8 }));
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(frame.widthM, frame.lengthM), new THREE.MeshBasicMaterial({ color: COLORS.gold, transparent: true, opacity: 0.06, depthWrite: false }));
    fill.rotation.x = -Math.PI / 2;
    // north arrow: world -Z is `northOffset`, so North lies at -northOffset around Y
    // North arrow. World -Z faces compass bearing `northOffset`, so North sits at yaw −northOffset
    // (bearing measured clockwise from −Z; rotating about +Y by −ψ turns −Z to bearing ψ).
    const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    arrow.rotation.x = -Math.PI / 2; // point along −Z
    arrow.position.set(0, 0.02, -Math.min(w, l) * 0.8);
    const pivot = new THREE.Group();
    pivot.rotation.y = THREE.MathUtils.degToRad(northOffset);
    pivot.add(arrow);
    g.add(fill, line, pivot);
    g.position.set(frame.center.x, frame.center.y + 0.002, frame.center.z);
  }, [frame, gardenCenter, mode, northOffset]);

  // measurement markers
  useEffect(() => {
    const g = measureGroupRef.current;
    if (!g) return;
    g.children.forEach((c) => {
      const m = c as THREE.Mesh;
      m.geometry?.dispose();
      (m.material as THREE.Material)?.dispose();
    });
    g.clear();
    measurePts.forEach((p) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 12), new THREE.MeshBasicMaterial({ color: 0xe07a5f }));
      s.position.copy(p);
      g.add(s);
    });
    if (measurePts.length === 2) {
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(measurePts), new THREE.LineBasicMaterial({ color: 0xe07a5f })));
    }
  }, [measurePts]);

  // ------------------------------------------------------------------ actions
  const markDirty = () => setDirtySinceSave(true);

  // In AR the garden is laid out in front of the user, as if standing at its near edge,
  // so the first plant does not automatically land in the centre (Brahmasthan).
  const ensureGardenCenter = (p: THREE.Vector3) => {
    if (gardenCenter || modeRef.current === '3d') return;
    const renderer = rendererRef.current, cam = cameraRef.current;
    const c = new THREE.Vector3(p.x, p.y, p.z);
    if (renderer && cam) {
      const view = renderer.xr.isPresenting ? renderer.xr.getCamera() : cam;
      const fwd = new THREE.Vector3();
      view.getWorldDirection(fwd);
      fwd.y = 0;
      if (fwd.lengthSq() < 1e-4) fwd.set(0, 0, -1);
      fwd.normalize();
      const foot = new THREE.Vector3().setFromMatrixPosition(view.matrixWorld);
      const halfDepth = (Math.abs(fwd.z) >= Math.abs(fwd.x) ? gardenDims.length : gardenDims.width) * FT_TO_M / 2;
      c.set(foot.x + fwd.x * (halfDepth + 0.3), p.y, foot.z + fwd.z * (halfDepth + 0.3));
    }
    setGardenCenter({ x: c.x, y: c.y, z: c.z });
    frameRef.current = { ...(frameRef.current as GardenFrame), center: c };
  };

  const placeAt = (p: THREE.Vector3, plant: Plant = activePlant, via?: PlacedItem['placedVia']) => {
    ensureGardenCenter(p);
    const crowd = crowdingAt(placedRef.current, plant, p);
    const item: PlacedItem = {
      id: uid(),
      plant,
      x: p.x, y: p.y, z: p.z,
      rotation: 0,
      scale: 1,
      placedVia: via || (modeRef.current === 'webxr' ? 'ar-webxr' : modeRef.current === 'camera' ? 'ar-camera' : '3d'),
    };
    setPlaced((prev) => [...prev, item]);
    setSelectedId(item.id);
    markDirty();
    const fr = frameRef.current!;
    const zone = zoneOf(fr, p);
    if (crowd) showToast(`Placed, but ${Math.round((crowd.need - crowd.dist) * 100)} cm too close to ${crowd.item.plant.name}. Try Auto-place.`, 'warn');
    else if (zone !== 'Center' && isPlantVastuCompatible(plant, zone)) showToast(`${plant.name} placed in the auspicious ${zone} zone ✓`);
    else showToast(`${plant.name} placed (${zone} zone). Best zones: ${plant.vastuDirections.join(', ')}`, 'warn');
  };

  const handlePlace = () => {
    const p = spotPosRef.current;
    if (!p) {
      showToast(mode === 'camera' ? 'Point the camera at the floor and hold steady…' : 'No surface detected yet.', 'warn');
      return;
    }
    placeAt(p.clone());
  };

  const handleAutoPlace = (plant: Plant = activePlant) => {
    if (!gardenCenter && mode !== '3d') {
      const p = spotPosRef.current;
      if (!p) { showToast('Point at the floor first so I can lay out your garden there.', 'warn'); return; }
      ensureGardenCenter(p);
    }
    const fr = frameRef.current;
    if (!fr) return;
    const best = findBestSpot(fr, placedRef.current, plant, spotPosRef.current, fr.center.y);
    if (!best) {
      showToast('No free spot left in this garden. Enlarge the garden or remove a plant.', 'bad');
      return;
    }
    placeAt(new THREE.Vector3(best.x, best.y, best.z), plant);
  };

  const updateSelected = (fn: (p: PlacedItem) => PlacedItem) => {
    if (!selectedId) return;
    setPlaced((prev) => prev.map((p) => (p.id === selectedId ? fn(p) : p)));
    markDirty();
  };

  const moveSelectedToSpot = () => {
    const p = spotPosRef.current;
    if (!p || !selectedId) return;
    updateSelected((it) => ({ ...it, x: p.x, y: p.y, z: p.z }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setPlaced((prev) => prev.filter((p) => p.id !== selectedId));
    setSelectedId(null);
    markDirty();
  };

  const duplicateSelected = () => {
    if (selected) handleAutoPlace(selected.plant);
  };

  const setCenterHere = () => {
    const p = spotPosRef.current;
    if (!p) { showToast('Point at the floor first.', 'warn'); return; }
    setGardenCenter({ x: p.x, y: p.y, z: p.z });
    showToast('Garden centre set here.');
  };

  const fitGardenToPlants = () => {
    if (!placed.length) return;
    const xs = placed.map((p) => p.x), zs = placed.map((p) => p.z);
    const pad = 0.4;
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad, minZ = Math.min(...zs) - pad, maxZ = Math.max(...zs) + pad;
    setGardenCenter({ x: (minX + maxX) / 2, y: placed[0].y, z: (minZ + maxZ) / 2 });
    setGardenDims({ width: Math.max(2, Math.ceil((maxX - minX) * M_TO_FT * 2) / 2), length: Math.max(2, Math.ceil((maxZ - minZ) * M_TO_FT * 2) / 2) });
    markDirty();
  };

  const recalibrateNorth = () => {
    if (absHeadingRef.current !== null && cameraRef.current) {
      // north offset = real heading − camera yaw in world
      const yawBearing = cameraBearing(rendererRef.current?.xr.isPresenting ? rendererRef.current.xr.getCamera() : cameraRef.current, 0);
      setNorthOffset(Math.round(normDeg(absHeadingRef.current - yawBearing)));
      showToast('Compass calibrated to your phone sensor.');
    } else {
      showToast('No compass sensor — use the slider to set which way North is.', 'warn');
    }
  };

  // ------------------------------------------------------------------ WebXR (real plane hit-testing on ARCore / supported devices)
  const startWebXR = async () => {
    const xr = (navigator as any).xr;
    const renderer = rendererRef.current;
    if (!xr || !renderer || !rootRef.current) return;
    setXrStarting(true);
    try {
      stopCamera(); // ARCore needs exclusive camera access
      const session = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay', 'local-floor'],
        domOverlay: { root: rootRef.current },
      });
      xrSessionRef.current = session;
      renderer.xr.setReferenceSpaceType('local');
      await renderer.xr.setSession(session);
      const viewer = await session.requestReferenceSpace('viewer');
      hitSourceRef.current = await session.requestHitTestSource({ space: viewer });

      // capture compass so zones are real-world directions
      if (absHeadingRef.current !== null) setNorthOffset(Math.round(absHeadingRef.current));
      setPlaced([]);
      setSelectedId(null);
      setGardenCenter(null);
      setMode('webxr');

      session.addEventListener('select', () => {
        const p = spotPosRef.current;
        if (!p) return;
        if (measuringRef.current) { addMeasurePoint(p.clone()); return; }
        // tap near an existing plant selects it, otherwise place a new one
        const near = placedRef.current.find((it) => Math.hypot(it.x - p.x, it.z - p.z) < 0.25);
        if (near) setSelectedId(near.id);
        else placeAt(p.clone(), activePlantRef.current, 'ar-webxr');
      });
      session.addEventListener('end', () => {
        hitSourceRef.current?.cancel?.();
        hitSourceRef.current = null;
        xrSessionRef.current = null;
        setMode('camera');
        startCamera().then((ok) => !ok && setMode('3d'));
      });
    } catch (err: any) {
      showToast(`Could not start AR: ${err?.message || err}`, 'bad');
      startCamera();
    } finally {
      setXrStarting(false);
    }
  };

  const switchMode = async (next: ViewMode) => {
    if (next === mode) return;
    if (mode === 'webxr') await xrSessionRef.current?.end?.().catch(() => undefined);
    if (next === 'webxr') return startWebXR();
    if (next === 'camera') {
      const ok = await startCamera();
      if (!ok) { showToast('Camera unavailable — staying in 3D view.', 'warn'); return; }
    } else {
      stopCamera();
      setCameraLuma(null);
    }
    // world coordinates differ per mode, so start a fresh layout
    if (placed.length) showToast('Switched view — layout restarted for the new space.', 'warn');
    setPlaced([]);
    setSelectedId(null);
    setGardenCenter(null);
    setMode(next);
  };

  // ------------------------------------------------------------------ pointer input (tap = place/select, drag = move plant / orbit / look)
  const ndcFromEvent = (e: React.PointerEvent) => {
    const r = mountRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 };
  };

  const pickPlant = (ndc: { x: number; y: number }): string | null => {
    const cam = cameraRef.current, layer = plantLayerRef.current;
    if (!cam || !layer) return null;
    _ray.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), cam);
    const hits = _ray.intersectObjects(layer.children, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.placedId) o = o.parent;
      if (o) return o.userData.placedId as string;
    }
    return null;
  };

  const addMeasurePoint = (p: THREE.Vector3) => {
    setMeasurePts((prev) => (prev.length >= 2 ? [p] : [...prev, p]));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (mode === 'webxr') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const ndc = ndcFromEvent(e);
    const id = measuring ? null : pickPlant(ndc);
    pointerRef.current = {
      x: e.clientX, y: e.clientY, t: performance.now(), id, dragging: false,
      kind: id ? 'plant' : mode === '3d' ? 'orbit' : mode === 'camera' && !orientRef.current ? 'look' : 'none',
    };
    if (id) setSelectedId(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (mode === 'webxr') return;
    const ndc = ndcFromEvent(e);
    const pr = pointerRef.current;
    if (mode === '3d' && !pr) {
      hoverRef.current = floorHitFromNdc(ndc.x, ndc.y);
      return;
    }
    if (!pr) return;
    const dx = e.clientX - pr.x, dy = e.clientY - pr.y;
    if (!pr.dragging && Math.hypot(dx, dy) > 6) pr.dragging = true;
    if (!pr.dragging) return;

    if (pr.kind === 'plant' && pr.id) {
      const p = floorHitFromNdc(ndc.x, ndc.y, placedRef.current.find((it) => it.id === pr.id)?.y ?? 0);
      const entry = meshesRef.current.get(pr.id);
      if (p && entry) entry.root.position.set(p.x, entry.root.position.y, p.z);
      hoverRef.current = p;
    } else if (pr.kind === 'orbit') {
      const ob = orbitRef.current;
      ob.theta -= dx * 0.008;
      ob.phi = THREE.MathUtils.clamp(ob.phi - dy * 0.006, 0.25, 1.45);
      pr.x = e.clientX; pr.y = e.clientY;
    } else if (pr.kind === 'look') {
      lookRef.current.yaw -= dx * 0.004;
      lookRef.current.pitch = THREE.MathUtils.clamp(lookRef.current.pitch - dy * 0.004, -1.4, 0.2);
      pr.x = e.clientX; pr.y = e.clientY;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (mode === 'webxr') return;
    const pr = pointerRef.current;
    pointerRef.current = null;
    if (!pr) return;
    const ndc = ndcFromEvent(e);

    if (pr.kind === 'plant' && pr.id && pr.dragging) {
      const entry = meshesRef.current.get(pr.id);
      if (entry) {
        const { x, z } = entry.root.position;
        setPlaced((prev) => prev.map((it) => (it.id === pr.id ? { ...it, x, z } : it)));
        markDirty();
      }
      if (mode === '3d') hoverRef.current = floorHitFromNdc(ndc.x, ndc.y);
      return;
    }
    const isTap = !pr.dragging && performance.now() - pr.t < 500;
    if (!isTap) return;
    if (pr.id) return; // tapped a plant → already selected

    const p = mode === 'camera' && !orientRef.current ? spotPosRef.current : floorHitFromNdc(ndc.x, ndc.y, 0, 7);
    if (!p) { showToast('That point is not on the floor.', 'warn'); return; }
    if (measuring) { addMeasurePoint(p.clone()); return; }
    if (selectedId) { setSelectedId(null); return; } // first tap deselects
    placeAt(p.clone());
  };

  const onWheel = (e: React.WheelEvent) => {
    if (mode !== '3d') return;
    const ob = orbitRef.current;
    ob.radius = THREE.MathUtils.clamp(ob.radius * (e.deltaY > 0 ? 1.1 : 0.9), 1.2, 12);
  };

  // WebXR dom-overlay: taps on UI must not also fire XR "select"
  useEffect(() => {
    const el = uiRef.current;
    if (!el) return;
    const stop = (ev: Event) => ev.preventDefault();
    el.addEventListener('beforexrselect', stop);
    return () => el.removeEventListener('beforexrselect', stop);
  }, []);

  // ------------------------------------------------------------------ save to MongoDB (via API)
  const handleSave = async () => {
    if (!user) { showToast('Sign in to save your garden.', 'warn'); return; }
    if (!placed.length) { showToast('Place at least one plant first.', 'warn'); return; }
    setIsSaving(true);
    try {
      const fr = frameRef.current!;
      const plants: (PlacedPlant & Record<string, unknown>)[] = placed.map((it) => {
        const pct = toLayoutPercent(fr, it);
        return {
          id: it.id,
          plantId: it.plant._id,
          name: it.plant.name,
          scientificName: it.plant.scientificName,
          image: it.plant.image,
          x: pct.x,
          y: pct.y,
          rotation: Math.round(it.rotation),
          scale: it.scale,
          model3D: it.plant.model3D,
          potSizeFt: Math.round(spacingFt(it.plant) * 0.6 * it.scale * 10) / 10,
          spacingRequiredFt: spacingFt(it.plant),
          plantHeightFt: Math.round(estimatePlantHeightM(it.plant) * it.scale * M_TO_FT * 10) / 10,
          worldX: Math.round((it.x - fr.center.x) * 1000) / 1000,
          worldZ: Math.round((it.z - fr.center.z) * 1000) / 1000,
          placedVia: it.placedVia,
        };
      });
      const outside = placed.filter((it) => !isInsideGarden(fr, it)).length;
      const payload = {
        gardenName: `${placed[0].plant.name.split(' (')[0]}${placed.length > 1 ? ` + ${placed.length - 1} more` : ''} – ${spaceType} AR Layout`,
        roomType: spaceType,
        length: gardenDims.length,
        width: gardenDims.width,
        direction: headingToDirection(northOffset),
        plants,
        notes: `Placed in ${mode === 'webxr' ? 'WebXR AR' : mode === 'camera' ? 'camera AR' : '3D view'}. Light: ${cameraLuma !== null ? `${cameraLuma} luma` : manualSun}. Spacing conflicts: ${conflicts.size}. Outside boundary: ${outside}.`,
        unit: 'ft',
        totalSquareFeet: Math.round(gardenDims.length * gardenDims.width * 10) / 10,
      };
      const res = savedGardenId ? await api.updateGarden(savedGardenId, payload) : await api.createGarden(payload);
      const id = res?.garden?._id || savedGardenId;
      if (id) setSavedGardenId(id);
      setDirtySinceSave(false);
      showToast(savedGardenId ? 'Garden updated ✓' : `Saved ${placed.length} plant${placed.length > 1 ? 's' : ''} to My Gardens ✓`);
      if (id) onSaveToGardenSuccess?.(id);
    } catch (err: any) {
      showToast(`Save failed: ${err?.message || 'network error'}`, 'bad');
    } finally {
      setIsSaving(false);
    }
  };

  // ------------------------------------------------------------------ UI
  const modeLabel = mode === 'webxr' ? 'AR · Surface tracking' : mode === 'camera' ? (sensorsLive ? 'Camera AR · Motion tracking' : 'Camera AR · Drag to look') : '3D Space';
  const statusLabel =
    mode === '3d' ? (spot.found ? 'Ready to place' : 'Point at the floor') :
    !spot.found ? (mode === 'webxr' ? 'Scanning for surfaces…' : 'Tilt camera toward the floor') :
    !spot.locked ? 'Hold steady…' : 'Surface locked';
  const guidance = measuring
    ? measurePts.length === 0 ? 'Measure: tap the first corner on the floor.' : measurePts.length === 1 ? 'Now tap the second point.' : `Distance: ${measuredFt} ft — use it below or tap again to re-measure.`
    : selected
    ? `${selected.plant.name} selected · drag to move, or use the controls below.`
    : mode === 'webxr'
    ? 'Move your phone slowly so the camera finds the floor, then tap to place.'
    : mode === 'camera'
    ? (sensorsLive ? 'Rotate to look around — plants stay where you put them. Tap the floor to place.' : 'Drag to aim at the floor, tap to place.')
    : 'Drag to orbit · scroll to zoom · click the floor to place.';

  const toneClass = (t: 'ok' | 'warn' | 'bad' | 'none') =>
    t === 'ok' ? 'border-[#68D391]/50 text-[#68D391]' : t === 'warn' ? 'border-amber-400/50 text-amber-300' : t === 'bad' ? 'border-red-500/50 text-red-300' : 'border-[#D4AF37]/30 text-[#A3C1AD]';

  const chip = (label: string, value: string, tone: 'ok' | 'warn' | 'bad' | 'none') => (
    <div className={`px-2 py-1.5 rounded-xl border bg-black/30 min-w-0 ${toneClass(tone)}`}>
      <span className="block text-[9px] uppercase font-semibold text-[#A3C1AD]">{label}</span>
      <span className="block text-[11px] font-bold truncate">{value}</span>
    </div>
  );

  const iconBtn = (title: string, onClick: () => void, icon: React.ReactNode, active = false, disabled = false) => (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`vys-icon-btn p-2.5 rounded-xl transition active:scale-95 disabled:opacity-30 ${active ? 'luxury-btn-copper text-white' : 'hover:bg-[#0E281E] text-[#D4AF37]'}`}
    >
      {icon}
    </button>
  );

  return (
    <div ref={rootRef} className="vys-root fixed inset-0 z-50 bg-[#081711] overflow-hidden select-none font-sans text-[#F4EFE6]">
      {/* camera feed (always mounted so the stream can attach) */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full object-cover ${streamActive && mode === 'camera' ? '' : 'hidden'}`}
      />

      {/* WebGL canvas + input surface */}
      <div
        ref={mountRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (pointerRef.current = null)}
        onPointerLeave={() => { if (mode === '3d' && !pointerRef.current) hoverRef.current = null; }}
        onWheel={onWheel}
      />

      {/* center crosshair for AR modes */}
      {mode !== '3d' && !measuring && (
        <div className="vys-crosshair pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/60" />
          <div className="absolute inset-y-0 left-1/2 w-px bg-white/60" />
        </div>
      )}

      {/* ---------- overlay UI ---------- */}
      <div ref={uiRef} className="vys-overlay absolute inset-0 flex flex-col pointer-events-none">
        {/* top bar */}
        <div className="vys-topbar pt-3 px-3 flex items-center justify-between gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => { xrSessionRef.current?.end?.(); onClose(); }}
              className="p-2.5 rounded-full bg-[#0B1D16]/90 backdrop-blur-xl border border-[#D4AF37]/35 shadow-lg"
              title="Exit"
              aria-label="Exit"
            >
              <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
            </button>
            <div className="vys-status bg-[#0B1D16]/90 backdrop-blur-xl px-3 py-1.5 rounded-full border border-[#D4AF37]/30 shadow-lg min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${spot.locked ? 'bg-[#68D391]' : 'bg-[#D4AF37] animate-pulse'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#F6D985] truncate">{statusLabel}</span>
              </div>
              <span className="block text-[9px] text-[#A3C1AD] truncate">{modeLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowCalibration((v) => !v)}
              className="bg-[#0B1D16]/90 backdrop-blur-xl px-3 py-2 rounded-full border border-[#D4AF37]/30 shadow-lg flex items-center gap-1.5"
              title="Compass & garden settings"
            >
              <Compass className="w-4 h-4 text-[#D4AF37]" style={{ transform: `rotate(${-viewHeading}deg)` }} />
              <span className="text-[11px] font-bold text-[#F6D985]">{headingToDirection(viewHeading)} {viewHeading}°</span>
            </button>
          </div>
        </div>

        {/* mode switcher */}
        <div className="vys-modes px-3 mt-2 flex flex-wrap gap-1.5 pointer-events-auto">
          {capabilities?.supportsImmersiveAR && (
            <button type="button" disabled={xrStarting} onClick={() => switchMode('webxr')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${mode === 'webxr' ? 'luxury-btn-gold text-[#081711]' : 'bg-[#0B1D16]/90 border-[#D4AF37]/30'}`}>
              <Smartphone className="w-3.5 h-3.5" /> {xrStarting ? 'Starting…' : mode === 'webxr' ? 'AR active' : 'Start real AR'}
            </button>
          )}
          {capabilities?.hasCamera && (
            <button type="button" onClick={() => switchMode('camera')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${mode === 'camera' ? 'luxury-btn-gold text-[#081711]' : 'bg-[#0B1D16]/90 border-[#D4AF37]/30'}`}>
              <Camera className="w-3.5 h-3.5" /> Camera
            </button>
          )}
          <button type="button" onClick={() => switchMode('3d')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${mode === '3d' ? 'luxury-btn-gold text-[#081711]' : 'bg-[#0B1D16]/90 border-[#D4AF37]/30'}`}>
            <Box className="w-3.5 h-3.5" /> 3D
          </button>
          {needsSensorPermission && mode === 'camera' && (
            <button type="button" onClick={enableSensors} className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-[#68D391]/50 text-[#68D391] bg-[#0B1D16]/90">
              Enable motion tracking
            </button>
          )}
          {onSwitchTo3DPlanner && (
            <button type="button" onClick={() => onSwitchTo3DPlanner(activePlant)} className="px-3 py-1.5 rounded-full text-[11px] font-bold border bg-[#0B1D16]/90 border-[#D4AF37]/30 hidden sm:block">
              Open Garden Planner
            </button>
          )}
        </div>
        {cameraError && mode !== 'webxr' && (
          <p className="mx-3 mt-1.5 text-[10px] text-amber-300 bg-black/50 rounded-lg px-2 py-1 self-start pointer-events-auto">{cameraError}</p>
        )}

        {/* responsive panel: transparent wrapper on portrait (display: contents), side column on landscape phones */}
        <div className="vys-panel">
        {/* spot detection HUD */}
        <div className="vys-hud px-3 mt-2 pointer-events-auto">
          <div className={`max-w-xl mx-auto bg-[#0B1D16]/90 backdrop-blur-2xl rounded-2xl p-2.5 border shadow-2xl ${toneClass(spotStatus)}`}>
            <div className="vys-chips grid grid-cols-4 gap-1.5">
              {chip('Surface', spot.locked ? 'Locked' : spot.found ? 'Steadying' : 'Searching', spot.locked ? 'ok' : spot.found ? 'warn' : 'none')}
              {chip('Vastu zone', spot.found ? `${spot.zone}${spotZoneMatch ? ' ✓' : ''}` : '—', !spot.found ? 'none' : spotZoneMatch ? 'ok' : 'warn')}
              {chip('Light', `${suitability.lightLevelDetected}${cameraLuma !== null ? ` · ${cameraLuma}` : ''}`, suitability.lightMatch ? 'ok' : 'warn')}
              {chip('Spacing', !spot.found ? '—' : spot.crowdedBy ? `−${spot.crowdGapCm} cm` : !spot.inside ? 'Outside' : 'Clear', !spot.found ? 'none' : spot.crowdedBy ? 'bad' : spot.inside ? 'ok' : 'warn')}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <p className="text-[10px] leading-snug text-[#E8E2D5] flex-1">
                {spot.crowdedBy
                  ? `Too close to ${spot.crowdedBy}. ${activePlant.name.split(' (')[0]} needs ${spacingFt(activePlant)} ft clearance.`
                  : spot.found && !spotZoneMatch
                  ? `${activePlant.name.split(' (')[0]} prefers the ${activePlant.vastuDirections.join(' / ')} zone. ${suitability.lightGuidance}`
                  : spot.found
                  ? `Good spot · ${suitability.lightGuidance}`
                  : guidance}
              </p>
              <button type="button" onClick={() => handleAutoPlace()}
                className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/20 hover:bg-[#D4AF37]/35 text-[#F6D985] border border-[#D4AF37]/40 flex items-center gap-1 shrink-0">
                <Wand2 className="w-3.5 h-3.5" /> Auto-place
              </button>
            </div>
          </div>
        </div>

        {/* calibration / garden settings */}
        {showCalibration && (
          <div className="vys-calib mx-3 mt-2 self-end w-[min(100%-1.5rem,22rem)] bg-[#0B1D16]/95 backdrop-blur-2xl p-3.5 rounded-2xl border border-[#D4AF37]/35 shadow-2xl space-y-3 pointer-events-auto max-h-[50vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Space &amp; compass</span>
              <button type="button" onClick={() => setShowCalibration(false)} aria-label="Close"><X className="w-4 h-4 text-[#A3C1AD]" /></button>
            </div>
            <div>
              <label className="text-[10px] text-[#A3C1AD] uppercase font-semibold block mb-1">North is at {northOffset}° from the start view</label>
              <input type="range" min={0} max={355} step={5} value={northOffset} onChange={(e) => setNorthOffset(Number(e.target.value))} className="w-full accent-[#D4AF37]" />
              {hasAbsoluteCompass && (
                <button type="button" onClick={recalibrateNorth} className="mt-1 text-[10px] font-bold text-[#68D391] underline">Use phone compass</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['length', 'width'] as const).map((k) => (
                <label key={k} className="text-[10px] text-[#A3C1AD] uppercase font-semibold">
                  Garden {k} (ft)
                  <input type="number" min={1} max={100} step={0.5} value={gardenDims[k]}
                    onChange={(e) => { setGardenDims((d) => ({ ...d, [k]: Math.max(1, Number(e.target.value) || 1) })); markDirty(); }}
                    className="mt-0.5 w-full bg-[#0E281E] border border-[#D4AF37]/25 rounded-lg px-2 py-1 text-xs text-[#F4EFE6]" />
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={setCenterHere} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0E281E] border border-[#D4AF37]/25">Set garden centre at crosshair</button>
              <button type="button" onClick={fitGardenToPlants} disabled={!placed.length} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#0E281E] border border-[#D4AF37]/25 disabled:opacity-40">Fit garden to plants</button>
            </div>
            <div>
              <label className="text-[10px] text-[#A3C1AD] uppercase font-semibold block mb-1">Location</label>
              <div className="grid grid-cols-4 gap-1">
                {(['Indoor', 'Balcony', 'Terrace', 'Outdoor'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setSpaceType(s)}
                    className={`py-1 rounded-lg text-[10px] font-bold ${spaceType === s ? 'luxury-btn-gold text-[#081711]' : 'bg-[#0E281E] text-[#A3C1AD] border border-[#D4AF37]/20'}`}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-[#A3C1AD] uppercase font-semibold block mb-1">
                Sunlight {cameraLuma !== null && '(camera reading overrides when very bright/dim)'}
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(['High', 'Medium', 'Low'] as const).map((s) => (
                  <button key={s} type="button" onClick={() => setManualSun(s)}
                    className={`py-1 rounded-lg text-[10px] font-bold ${manualSun === s ? 'luxury-btn-copper text-white' : 'bg-[#0E281E] text-[#A3C1AD] border border-[#D4AF37]/20'}`}>{s}</button>
                ))}
              </div>
            </div>
            {mode === 'camera' && (
              <div>
                <label className="text-[10px] text-[#A3C1AD] uppercase font-semibold block mb-1">Phone height above floor: {phoneHeightM.toFixed(2)} m</label>
                <input type="range" min={0.5} max={2} step={0.05} value={phoneHeightM} onChange={(e) => setPhoneHeightM(Number(e.target.value))} className="w-full accent-[#D4AF37]" />
                <p className="text-[9px] text-[#A3C1AD] mt-0.5">Sets real-world scale in camera mode. Measure once with a tape for best accuracy.</p>
              </div>
            )}
          </div>
        )}

        {/* toast */}
        {toast && (
          <div className={`vys-toast self-center mt-2 px-4 py-2 rounded-full text-xs font-bold shadow-2xl bg-[#0B1D16]/95 backdrop-blur-xl border flex items-center gap-2 pointer-events-none ${toneClass(toast.tone)}`}>
            {toast.tone === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.text}</span>
          </div>
        )}

        <div className="vys-spacer flex-1" />

        {/* guidance */}
        <div className="vys-guidance px-3 mb-1.5 flex justify-center pointer-events-none">
          <span className="bg-[#0B1D16]/90 backdrop-blur-xl px-3 py-1 rounded-full border border-[#D4AF37]/30 text-[10px] text-[#E8E2D5] text-center">
            <Sparkles className="w-3 h-3 inline mr-1 text-[#D4AF37]" />{guidance}
          </span>
        </div>

        {/* measurement result */}
        {measuring && measuredFt !== null && (
          <div className="vys-measure px-3 mb-1.5 flex flex-wrap justify-center gap-1.5 pointer-events-auto">
            <span className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#0B1D16]/95 border border-[#E07A5F]/60 text-[#F4EFE6]">{measuredFt} ft</span>
            <button type="button" onClick={() => { setGardenDims((d) => ({ ...d, length: measuredFt })); markDirty(); showToast(`Garden length set to ${measuredFt} ft`); }} className="px-3 py-1.5 rounded-full text-[11px] font-bold luxury-btn-secondary border border-[#D4AF37]/30">Use as length</button>
            <button type="button" onClick={() => { setGardenDims((d) => ({ ...d, width: measuredFt })); markDirty(); showToast(`Garden width set to ${measuredFt} ft`); }} className="px-3 py-1.5 rounded-full text-[11px] font-bold luxury-btn-secondary border border-[#D4AF37]/30">Use as width</button>
          </div>
        )}

        {/* suggestions */}
        <div className="vys-suggest px-3 pb-1.5 pointer-events-auto">
          <div className="max-w-4xl mx-auto bg-[#0B1D16]/90 backdrop-blur-2xl rounded-2xl p-2 border border-[#D4AF37]/30">
            <button type="button" onClick={() => setShowSuggestions((v) => !v)} className="w-full flex items-center justify-between px-1">
              <span className="text-[11px] font-bold">
                Best for the {smartSuggestions[0]?.zone || headingToDirection(viewHeading)} zone
                <span className="ml-1.5 text-[9px] text-[#68D391]">{placed.length} placed{conflicts.size ? ` · ${conflicts.size} too close` : ''}</span>
              </span>
              {showSuggestions ? <ChevronDown className="w-4 h-4 text-[#A3C1AD]" /> : <ChevronUp className="w-4 h-4 text-[#A3C1AD]" />}
            </button>
            {showSuggestions && (
              <div className="flex gap-2 overflow-x-auto pt-1.5 pb-0.5 scrollbar-none">
                {smartSuggestions.length === 0 && <span className="text-[10px] text-[#A3C1AD] px-1">No plants are traditionally recommended for this zone.</span>}
                {smartSuggestions.map(({ plant, score }) => (
                  <button key={plant._id} type="button"
                    onClick={() => { setActivePlant(plant); setSelectedId(null); }}
                    className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border shrink-0 text-left ${plant._id === activePlant._id ? 'bg-[#D4AF37]/20 border-[#D4AF37]' : 'bg-[#0E281E]/70 border-[#D4AF37]/20'}`}>
                    <img src={plant.image} alt="" className="w-9 h-9 rounded-lg object-cover" loading="lazy" />
                    <span>
                      <strong className="block text-[11px] font-serif truncate max-w-[110px]">{plant.name.split(' (')[0]}</strong>
                      <span className="text-[9px] text-[#F6D985] font-bold">{score}% match</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* bottom controls */}
        <div className="vys-controls px-3 pb-3 pt-1 bg-gradient-to-t from-[#081711] via-[#081711]/90 to-transparent pointer-events-auto">
          <div className="vys-controls-inner max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* active / selected plant */}
            <div className="vys-plant-card flex items-center gap-2.5 bg-[#0B1D16]/90 p-2 rounded-2xl border border-[#D4AF37]/30 sm:w-72">
              <img src={focusPlant.image} alt="" className="w-11 h-11 rounded-xl object-cover border border-[#D4AF37]/30" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-serif font-bold luxury-gold-text truncate">{focusPlant.name}</h4>
                <p className="text-[10px] text-[#68D391] font-semibold truncate">
                  {selected ? 'Selected · ' : 'Placing · '}
                  {(estimatePlantHeightM(focusPlant) * (selected?.scale || 1) * M_TO_FT).toFixed(1)} ft tall · {spacingFt(focusPlant)} ft spacing
                </p>
              </div>
              <button type="button" onClick={() => { setCatalogDirection(spot.found && spot.zone !== 'Center' ? spot.zone : headingToDirection(viewHeading)); setShowCatalog(true); }}
                className="py-1.5 px-2.5 rounded-xl luxury-btn-secondary text-[11px] font-bold border border-[#D4AF37]/30">Change</button>
            </div>

            {/* transform tools */}
            <div className="vys-tools flex items-center justify-center gap-0.5 bg-[#0B1D16]/90 p-1 rounded-2xl border border-[#D4AF37]/30">
              {iconBtn('Rotate left', () => updateSelected((p) => ({ ...p, rotation: p.rotation - 15 })), <RotateCcw className="w-4 h-4" />, false, !selected)}
              {iconBtn('Rotate right', () => updateSelected((p) => ({ ...p, rotation: p.rotation + 15 })), <RotateCw className="w-4 h-4" />, false, !selected)}
              {iconBtn('Bigger', () => updateSelected((p) => ({ ...p, scale: Math.min(2, Math.round((p.scale + 0.1) * 10) / 10) })), <ZoomIn className="w-4 h-4" />, false, !selected)}
              {iconBtn('Smaller', () => updateSelected((p) => ({ ...p, scale: Math.max(0.5, Math.round((p.scale - 0.1) * 10) / 10) })), <ZoomOut className="w-4 h-4" />, false, !selected)}
              {iconBtn('Move to crosshair', moveSelectedToSpot, <Move className="w-4 h-4" />, false, !selected || !spot.locked)}
              {iconBtn('Duplicate', duplicateSelected, <Copy className="w-4 h-4" />, false, !selected)}
              {iconBtn('Delete', deleteSelected, <Trash2 className="w-4 h-4" />, false, !selected)}
              {iconBtn('Measure', () => { setMeasuring((v) => !v); setMeasurePts([]); setSelectedId(null); }, <Ruler className="w-4 h-4" />, measuring)}
            </div>

            {/* primary actions */}
            <div className="vys-actions flex items-center gap-2">
              <button type="button" onClick={handlePlace} disabled={measuring}
                className="flex-1 sm:flex-initial py-3 px-5 rounded-full luxury-btn-gold text-[#081711] font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40">
                <Check className="w-4 h-4" /> Place here
              </button>
              <button type="button" onClick={handleSave} disabled={isSaving || !placed.length}
                className="flex-1 sm:flex-initial py-3 px-5 rounded-full luxury-btn-copper text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving…' : savedGardenId ? (dirtySinceSave ? 'Update garden' : 'Saved ✓') : `Save (${placed.length})`}
              </button>
            </div>
          </div>
        </div>
        </div>{/* /vys-panel */}
      </div>

      {/* plant catalog */}
      {showCatalog && (
        <div className="vys-catalog absolute inset-0 z-50 bg-[#081711]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="vys-catalog-card w-full max-w-md luxury-card bg-[#0B1D16] rounded-3xl p-5 border border-[#D4AF37]/35 space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#D4AF37]/25 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider block">Vastu botanical directory</span>
                <h4 className="text-lg font-serif font-bold luxury-gold-text">Choose a plant to place</h4>
              </div>
              <button type="button" onClick={() => setShowCatalog(false)} aria-label="Close"><X className="w-5 h-5 text-[#A3C1AD]" /></button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px]">
                <span className="text-[#A3C1AD]">Zone</span>
                <span className="font-bold text-[#F6D985]">{catalogDirMeta.name} · {catalogDirMeta.sanskrit}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(VASTU_DIRECTIONS).map((d) => (
                  <button key={d} type="button" onClick={() => setCatalogDirection(d)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${canonicalCatalogDir === d ? 'luxury-btn-gold text-[#081711]' : 'bg-[#0E281E] text-[#A3C1AD] border border-[#D4AF37]/20'}`}>{d}</button>
                ))}
              </div>
            </div>
            <div className="vys-catalog-list overflow-y-auto space-y-2 flex-1 pr-1">
              {catalogList.length === 0 ? (
                <p className="text-center text-xs text-[#A3C1AD] py-8">No plants are traditionally recommended for {canonicalCatalogDir}.</p>
              ) : (
                catalogList.map((plant) => (
                  <button key={plant._id} type="button"
                    onClick={() => { setActivePlant(plant); setSelectedId(null); setShowCatalog(false); }}
                    className={`w-full p-2.5 rounded-2xl border flex items-center gap-3 text-left ${plant._id === activePlant._id ? 'border-[#D4AF37] bg-[#D4AF37]/15' : 'border-[#D4AF37]/20 bg-[#0E281E]/70 hover:border-[#D4AF37]/50'}`}>
                    <img src={plant.image} alt="" className="w-12 h-12 rounded-xl object-cover" loading="lazy" />
                    <span className="min-w-0">
                      <strong className="block text-sm font-serif truncate">{plant.name}</strong>
                      <span className="block text-[10px] text-[#A3C1AD] italic truncate">{plant.scientificName}</span>
                      <span className="block text-[9px] text-[#F6D985] font-semibold">{plant.sunlight.split(' (')[0]} sun · {spacingFt(plant)} ft spacing</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
