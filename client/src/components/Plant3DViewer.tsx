import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Plant3DModelConfig } from '../types';
import { RotateCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Plant3DViewerProps {
  modelConfig?: Plant3DModelConfig;
  plantName?: string;
  autoRotate?: boolean;
  className?: string;
  height?: string;
}

export const Plant3DViewer: React.FC<Plant3DViewerProps> = ({
  modelConfig,
  plantName = 'Herbal Plant',
  autoRotate: initialAutoRotate = true,
  className = '',
  height = '350px'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(initialAutoRotate);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const plantGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 350;
    const heightPx = container.clientHeight || 350;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(0, 1.8, 3.8);
    cameraRef.current = camera;

    // 3. Renderer with high visual fidelity
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3db, 1.4);
    sunLight.position.set(3, 6, 4);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const softFill = new THREE.DirectionalLight(0x71ae77, 0.5);
    softFill.position.set(-4, 2, -2);
    scene.add(softFill);

    // 5. Shadow Catcher Ground
    const groundGeo = new THREE.PlaneGeometry(6, 6);
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.55;
    ground.receiveShadow = true;
    scene.add(ground);

    // 6. Build Botanical 3D Plant Model
    const plantGroup = new THREE.Group();
    plantGroupRef.current = plantGroup;
    scene.add(plantGroup);

    buildBotanicalModel(plantGroup, modelConfig);

    // 7. Interactive Orbit Controls via mouse / touch
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      plantGroup.rotation.y += deltaX * 0.01;
      plantGroup.rotation.x = Math.max(-0.4, Math.min(0.4, plantGroup.rotation.x + deltaY * 0.005));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
        prevMouseY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      plantGroup.rotation.y += deltaX * 0.015;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 8. Animation loop
    let animationId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (isRotating && !isDragging) {
        plantGroup.rotation.y += 0.006;
      }

      // Gentle organic breathing breeze
      const leafCount = plantGroup.children.length;
      for (let i = 2; i < leafCount; i++) {
        const child = plantGroup.children[i];
        if (child.name === 'leaf' || child.name === 'flower') {
          child.rotation.z += Math.sin(elapsedTime * 2 + i) * 0.0008;
        }
      }

      camera.lookAt(0, 0.4, 0);
      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [modelConfig, isRotating]);

  // Zoom handlers
  const handleZoom = (factor: number) => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;
    camera.position.z = Math.max(2.0, Math.min(6.0, camera.position.z * factor));
  };

  const handleReset = () => {
    if (plantGroupRef.current) {
      plantGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 1.8, 3.8);
    }
  };

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-blue-950/5 via-slate-50 to-slate-100/80 border border-slate-200 shadow-inner ${className}`} style={{ height }}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Control Overlay */}
      <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm text-slate-700">
        <button
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? 'Pause rotation' : 'Auto rotate'}
          className={`p-1.5 rounded-lg hover:bg-blue-50 transition-colors ${isRotating ? 'text-[#2563EB] bg-blue-50' : 'text-slate-500 hover:text-[#2563EB]'}`}
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(0.85)}
          title="Zoom in"
          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-slate-600 hover:text-[#2563EB]"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom(1.15)}
          title="Zoom out"
          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-slate-600 hover:text-[#2563EB]"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset viewpoint"
          className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-slate-600 hover:text-[#2563EB]"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Plant Label Badge */}
      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm text-xs font-semibold text-[#0F172A] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
        3D Interactive Model • {plantName}
      </div>
    </div>
  );
};

// Procedural Botanical Mesh Generator
function buildBotanicalModel(group: THREE.Group, config?: Plant3DModelConfig) {
  const potColor = config?.potColor || '#b55a30';
  const foliageColor = config?.foliageColor || '#2d6a4f';
  const flowerColor = config?.flowerColor || '#9b5de5';
  const plantType = config?.type || 'tulsi';
  const scale = config?.heightScale || 1.0;

  // 1. Ceramic/Terracotta Pot
  const potGeo = new THREE.CylinderGeometry(0.55, 0.42, 0.7, 32);
  const potMat = new THREE.MeshStandardMaterial({
    color: potColor,
    roughness: 0.75,
    metalness: 0.05
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = -0.2;
  pot.castShadow = true;
  pot.receiveShadow = true;
  group.add(pot);

  // Pot rim
  const rimGeo = new THREE.TorusGeometry(0.56, 0.06, 16, 32);
  const rimMat = new THREE.MeshStandardMaterial({ color: potColor, roughness: 0.7 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.15;
  group.add(rim);

  // Potting Soil
  const soilGeo = new THREE.CircleGeometry(0.52, 24);
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.95 });
  const soil = new THREE.Mesh(soilGeo, soilMat);
  soil.rotation.x = -Math.PI / 2;
  soil.position.y = 0.13;
  soil.receiveShadow = true;
  group.add(soil);

  // 2. Botanical Foliage according to Type
  const foliageMat = new THREE.MeshStandardMaterial({
    color: foliageColor,
    roughness: 0.45,
    metalness: 0.1,
    side: THREE.DoubleSide
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x406a38,
    roughness: 0.6
  });

  if (plantType === 'aloe') {
    // Succulent Aloe Vera Rosette
    const leafCount = 18;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / 6 + (i * 0.3);
      const tier = Math.floor(i / 6);
      const leafLen = (0.7 + tier * 0.3) * scale;
      const leafGeo = new THREE.ConeGeometry(0.12 - tier * 0.02, leafLen, 6);
      const leaf = new THREE.Mesh(leafGeo, foliageMat);
      leaf.name = 'leaf';
      leaf.castShadow = true;

      const tilt = 0.3 + (2 - tier) * 0.25;
      leaf.position.set(
        Math.cos(angle) * (0.1 + (2 - tier) * 0.08),
        0.15 + (tier * 0.12),
        Math.sin(angle) * (0.1 + (2 - tier) * 0.08)
      );
      leaf.rotation.set(
        Math.sin(angle) * tilt,
        angle,
        -Math.cos(angle) * tilt
      );
      group.add(leaf);
    }
  } else if (plantType === 'mint' || plantType === 'brahmi') {
    // Lush rounded creeping leafy clusters
    const stemCount = 7;
    for (let s = 0; s < stemCount; s++) {
      const sAngle = (s * Math.PI * 2) / stemCount;
      const stemH = (0.6 + Math.random() * 0.4) * scale;
      const stemCurve = new THREE.CylinderGeometry(0.025, 0.035, stemH, 8);
      const stem = new THREE.Mesh(stemCurve, stemMat);
      stem.position.set(Math.cos(sAngle) * 0.15, 0.15 + stemH / 2, Math.sin(sAngle) * 0.15);
      stem.rotation.z = Math.cos(sAngle) * 0.2;
      stem.rotation.x = Math.sin(sAngle) * 0.2;
      group.add(stem);

      // Leaves along each stem
      for (let l = 0; l < 5; l++) {
        const lAngle = (l * Math.PI) / 2 + sAngle;
        const leafGeo = new THREE.SphereGeometry(0.12, 8, 8);
        leafGeo.scale(1.2, 0.3, 0.9);
        const leaf = new THREE.Mesh(leafGeo, foliageMat);
        leaf.name = 'leaf';
        leaf.castShadow = true;
        leaf.position.set(
          stem.position.x + Math.cos(lAngle) * 0.12,
          0.18 + l * 0.14,
          stem.position.z + Math.sin(lAngle) * 0.12
        );
        leaf.rotation.y = lAngle;
        group.add(leaf);
      }
    }
  } else if (plantType === 'hibiscus') {
    // Shrub with vibrant crimson blossom
    const mainStemGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.1 * scale, 12);
    const mainStem = new THREE.Mesh(mainStemGeo, stemMat);
    mainStem.position.y = 0.65;
    mainStem.castShadow = true;
    group.add(mainStem);

    // Leaves
    for (let l = 0; l < 14; l++) {
      const angle = l * 1.6;
      const leafGeo = new THREE.SphereGeometry(0.16, 8, 8);
      leafGeo.scale(1.4, 0.2, 0.8);
      const leaf = new THREE.Mesh(leafGeo, foliageMat);
      leaf.name = 'leaf';
      leaf.castShadow = true;
      leaf.position.set(Math.cos(angle) * 0.28, 0.3 + l * 0.06, Math.sin(angle) * 0.28);
      leaf.rotation.set(0.2, angle, 0.2);
      group.add(leaf);
    }

    // Flower blossom
    const flowerGroup = new THREE.Group();
    flowerGroup.name = 'flower';
    const petalMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.3, side: THREE.DoubleSide });
    for (let p = 0; p < 5; p++) {
      const pAngle = (p * Math.PI * 2) / 5;
      const petalGeo = new THREE.CircleGeometry(0.18, 12);
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.rotation.x = -0.5;
      petal.rotation.z = pAngle;
      petal.position.set(Math.cos(pAngle) * 0.08, 0, Math.sin(pAngle) * 0.08);
      flowerGroup.add(petal);
    }
    // Stamen
    const stamenGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.25, 8);
    const stamenMat = new THREE.MeshStandardMaterial({ color: 0xffd166 });
    const stamen = new THREE.Mesh(stamenGeo, stamenMat);
    stamen.position.y = 0.1;
    flowerGroup.add(stamen);

    flowerGroup.position.set(0, 1.25 * scale, 0);
    group.add(flowerGroup);
  } else {
    // Default / Tulsi / Ashwagandha / Neem architecture
    // Main branching stem
    const mainStemGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.2 * scale, 12);
    const mainStem = new THREE.Mesh(mainStemGeo, stemMat);
    mainStem.position.y = 0.7;
    mainStem.castShadow = true;
    group.add(mainStem);

    // Lateral branches
    const branchCount = 6;
    for (let b = 0; b < branchCount; b++) {
      const bAngle = (b * Math.PI * 2) / branchCount + (b * 0.4);
      const bLen = 0.4 * scale;
      const branchGeo = new THREE.CylinderGeometry(0.02, 0.03, bLen, 8);
      const branch = new THREE.Mesh(branchGeo, stemMat);
      branch.position.set(Math.cos(bAngle) * 0.12, 0.4 + b * 0.12, Math.sin(bAngle) * 0.12);
      branch.rotation.set(Math.sin(bAngle) * 0.7, 0, -Math.cos(bAngle) * 0.7);
      group.add(branch);

      // Leaf clusters at end of branch
      for (let lc = 0; lc < 3; lc++) {
        const leafGeo = new THREE.SphereGeometry(0.11, 8, 8);
        leafGeo.scale(1.3, 0.18, 0.8);
        const leaf = new THREE.Mesh(leafGeo, foliageMat);
        leaf.name = 'leaf';
        leaf.castShadow = true;
        leaf.position.set(
          branch.position.x + Math.cos(bAngle) * (0.15 + lc * 0.06),
          branch.position.y + 0.08 + lc * 0.04,
          branch.position.z + Math.sin(bAngle) * (0.15 + lc * 0.06)
        );
        leaf.rotation.set(0.3, bAngle + lc * 0.5, 0.2);
        group.add(leaf);
      }
    }

    // Top flower spires (Tulsi Manjari)
    const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColor, roughness: 0.5 });
    for (let f = 0; f < 3; f++) {
      const fAngle = (f * Math.PI * 2) / 3;
      const spireGeo = new THREE.ConeGeometry(0.06, 0.35 * scale, 8);
      const spire = new THREE.Mesh(spireGeo, flowerMat);
      spire.name = 'flower';
      spire.position.set(Math.cos(fAngle) * 0.08, 1.35 * scale, Math.sin(fAngle) * 0.08);
      spire.rotation.z = Math.cos(fAngle) * 0.15;
      group.add(spire);
    }
  }
}
