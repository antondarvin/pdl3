import * as THREE from 'three';
import { Plant, Plant3DModelConfig } from '../types';

/**
 * Enhanced Realistic Procedural 3D Botanical Mesh Generator
 * Generates life-like 3D medicinal plants with accurate botanical morphology,
 * stems, leaves, flower spires, berries, and textured ceramic/terracotta pots.
 */

export interface BotanicalModelOptions {
  potColor?: string;
  foliageColor?: string;
  flowerColor?: string;
  potType?: 'terracotta' | 'ceramic' | 'vrindavan' | 'minimalist';
  quality?: 'hq' | 'eco';
  scale?: number;
  includePot?: boolean;
}

export function createProceduralPlantMesh(
  plant: Plant | { name: string; model3D?: Plant3DModelConfig },
  options: BotanicalModelOptions = {}
): THREE.Group {
  const rootGroup = new THREE.Group();
  rootGroup.name = `plant_${plant.name}`;

  const modelConfig = plant.model3D || { type: 'tulsi' };
  const rawType = (modelConfig.type || plant.name || 'tulsi').toLowerCase();

  const quality = options.quality || 'hq';
  const scale = (options.scale || modelConfig.heightScale || 1.0);
  const includePot = options.includePot !== false;

  const potColor = options.potColor || modelConfig.potColor || '#b55a30';
  const foliageColor = options.foliageColor || modelConfig.foliageColor || '#2d6a4f';
  const flowerColor = options.flowerColor || modelConfig.flowerColor || '#9b5de5';

  const segs = quality === 'hq' ? 24 : 12;

  // 1. Terracotta / Ceramic Planter Pot
  let potHeight = 0.55 * scale;
  let potRadius = 0.42 * scale;

  if (includePot) {
    const potGroup = new THREE.Group();
    potGroup.name = 'pot';

    // Pot Body
    const potGeo = new THREE.CylinderGeometry(potRadius, potRadius * 0.75, potHeight, segs);
    const potMat = new THREE.MeshStandardMaterial({
      color: potColor,
      roughness: 0.8,
      metalness: 0.05,
    });
    const potMesh = new THREE.Mesh(potGeo, potMat);
    potMesh.position.y = potHeight / 2;
    potMesh.castShadow = true;
    potMesh.receiveShadow = true;
    potGroup.add(potMesh);

    // Rim
    const rimGeo = new THREE.TorusGeometry(potRadius * 1.03, potRadius * 0.08, 8, segs);
    const rimMat = new THREE.MeshStandardMaterial({
      color: potColor,
      roughness: 0.75,
      metalness: 0.05,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = potHeight;
    rim.castShadow = true;
    potGroup.add(rim);

    // Potting Soil with slight organic mound
    const soilGeo = new THREE.CircleGeometry(potRadius * 0.94, segs);
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x22150c,
      roughness: 0.95,
      metalness: 0.02,
    });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = potHeight - 0.01;
    soil.receiveShadow = true;
    potGroup.add(soil);

    // Pot Drainage Base ring
    const baseGeo = new THREE.CylinderGeometry(potRadius * 0.77, potRadius * 0.77, potHeight * 0.08, segs);
    const baseMesh = new THREE.Mesh(baseGeo, potMat);
    baseMesh.position.y = potHeight * 0.04;
    potGroup.add(baseMesh);

    rootGroup.add(potGroup);
  }

  // 2. Botanical Foliage & Stem Generator
  const foliageGroup = new THREE.Group();
  foliageGroup.name = 'foliage';
  rootGroup.add(foliageGroup);

  const baseY = includePot ? potHeight : 0;

  // Materials
  const foliageMat = new THREE.MeshStandardMaterial({
    color: foliageColor,
    roughness: 0.38,
    metalness: 0.08,
    side: THREE.DoubleSide,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x2e5e26,
    roughness: 0.65,
    metalness: 0.05,
  });

  const flowerMat = new THREE.MeshStandardMaterial({
    color: flowerColor,
    roughness: 0.45,
    side: THREE.DoubleSide,
  });

  // Branching according to medicinal plant species:
  if (rawType.includes('aloe')) {
    // -------------------------------------------------------------
    // ALOE VERA (Succulent thick fleshy rosette leaves with spines)
    // -------------------------------------------------------------
    const leafCount = quality === 'hq' ? 20 : 12;
    const aloeFoliageMat = new THREE.MeshStandardMaterial({
      color: 0x3d7e50,
      roughness: 0.32,
      metalness: 0.12,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < leafCount; i++) {
      const angle = (i * Math.PI * 2) / 7 + i * 0.35;
      const tier = Math.floor(i / 7);
      const leafLen = (0.75 + tier * 0.35) * scale;
      const leafWidth = (0.13 - tier * 0.02) * scale;

      // Realistic tapered aloe leaf cone
      const leafGeo = new THREE.ConeGeometry(leafWidth, leafLen, 6);
      leafGeo.scale(1.2, 1.0, 0.45); // Flattened succulent cross section
      const leaf = new THREE.Mesh(leafGeo, aloeFoliageMat);
      leaf.castShadow = true;

      const tilt = 0.28 + (2 - tier) * 0.26;
      const radiusOffset = (0.08 + (2 - tier) * 0.07) * scale;

      leaf.position.set(
        Math.cos(angle) * radiusOffset,
        baseY + (0.05 + tier * 0.12) * scale,
        Math.sin(angle) * radiusOffset
      );
      leaf.rotation.set(
        Math.sin(angle) * tilt,
        angle,
        -Math.cos(angle) * tilt
      );
      foliageGroup.add(leaf);
    }
  } else if (rawType.includes('mint') || rawType.includes('pudina')) {
    // -------------------------------------------------------------
    // MINT / PUDINA (Bushy creeping square stems, dense ovate serrated leaves)
    // -------------------------------------------------------------
    const stemCount = quality === 'hq' ? 9 : 5;
    for (let s = 0; s < stemCount; s++) {
      const sAngle = (s * Math.PI * 2) / stemCount + (s * 0.2);
      const stemH = (0.55 + (s % 3) * 0.15) * scale;
      const stemGeo = new THREE.CylinderGeometry(0.025 * scale, 0.035 * scale, stemH, 6);
      const stem = new THREE.Mesh(stemGeo, stemMat);
      const stemDist = (0.12 + (s % 2) * 0.08) * scale;

      stem.position.set(
        Math.cos(sAngle) * stemDist,
        baseY + stemH / 2,
        Math.sin(sAngle) * stemDist
      );
      stem.rotation.z = Math.cos(sAngle) * 0.3;
      stem.rotation.x = Math.sin(sAngle) * 0.3;
      stem.castShadow = true;
      foliageGroup.add(stem);

      // Leaves pairs along stem
      const leafPairs = quality === 'hq' ? 5 : 3;
      for (let l = 0; l < leafPairs; l++) {
        const lAngle = (l * Math.PI) / 2 + sAngle;
        const leafGeo = new THREE.SphereGeometry(0.11 * scale, 6, 6);
        leafGeo.scale(1.3, 0.22, 0.85);

        // Left leaf
        const leaf1 = new THREE.Mesh(leafGeo, foliageMat);
        leaf1.position.set(
          stem.position.x + Math.cos(lAngle) * (0.11 * scale),
          baseY + (0.06 + l * 0.12) * scale,
          stem.position.z + Math.sin(lAngle) * (0.11 * scale)
        );
        leaf1.rotation.set(0.2, lAngle, 0.2);
        leaf1.castShadow = true;
        foliageGroup.add(leaf1);

        // Right opposite leaf
        const leaf2 = new THREE.Mesh(leafGeo, foliageMat);
        leaf2.position.set(
          stem.position.x - Math.cos(lAngle) * (0.11 * scale),
          baseY + (0.06 + l * 0.12) * scale,
          stem.position.z - Math.sin(lAngle) * (0.11 * scale)
        );
        leaf2.rotation.set(-0.2, lAngle + Math.PI, -0.2);
        leaf2.castShadow = true;
        foliageGroup.add(leaf2);
      }
    }
  } else if (rawType.includes('neem')) {
    // -------------------------------------------------------------
    // NEEM (Woody trunk, pinnate compound curved serrated leaflets)
    // -------------------------------------------------------------
    const trunkHeight = 1.4 * scale;
    const trunkGeo = new THREE.CylinderGeometry(0.045 * scale, 0.075 * scale, trunkHeight, 8);
    const trunk = new THREE.Mesh(trunkGeo, stemMat);
    trunk.position.y = baseY + trunkHeight / 2;
    trunk.castShadow = true;
    foliageGroup.add(trunk);

    const branchCount = quality === 'hq' ? 8 : 4;
    for (let b = 0; b < branchCount; b++) {
      const bAngle = (b * Math.PI * 2) / branchCount + (b * 0.3);
      const bLen = (0.55 + (b % 2) * 0.18) * scale;
      const bGeo = new THREE.CylinderGeometry(0.02 * scale, 0.035 * scale, bLen, 6);
      const branch = new THREE.Mesh(bGeo, stemMat);
      branch.position.set(
        Math.cos(bAngle) * (0.15 * scale),
        baseY + (0.45 + b * 0.11) * scale,
        Math.sin(bAngle) * (0.15 * scale)
      );
      branch.rotation.set(Math.sin(bAngle) * 0.65, bAngle, -Math.cos(bAngle) * 0.65);
      branch.castShadow = true;
      foliageGroup.add(branch);

      // Pinnate leaflets along branch
      const leafletCount = quality === 'hq' ? 6 : 3;
      for (let lf = 0; lf < leafletCount; lf++) {
        const lfAngle = bAngle + ((lf % 2 === 0 ? 1 : -1) * 0.6);
        const lfGeo = new THREE.ConeGeometry(0.06 * scale, 0.28 * scale, 5);
        lfGeo.scale(1.2, 1.0, 0.25);
        const leaflet = new THREE.Mesh(lfGeo, foliageMat);
        leaflet.position.set(
          branch.position.x + Math.cos(bAngle) * (0.12 + lf * 0.07) * scale,
          branch.position.y + (0.05 + lf * 0.03) * scale,
          branch.position.z + Math.sin(bAngle) * (0.12 + lf * 0.07) * scale
        );
        leaflet.rotation.set(0.3, lfAngle, 0.3);
        leaflet.castShadow = true;
        foliageGroup.add(leaflet);
      }
    }
  } else if (rawType.includes('turmeric') || rawType.includes('ginger')) {
    // -------------------------------------------------------------
    // TURMERIC / GINGER (Broad tropical erect lanceolate leaves with central midrib)
    // -------------------------------------------------------------
    const leafCount = quality === 'hq' ? 7 : 4;
    const turmericMat = new THREE.MeshStandardMaterial({
      color: 0x367e3a,
      roughness: 0.36,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });

    for (let t = 0; t < leafCount; t++) {
      const tAngle = (t * Math.PI * 2) / leafCount + t * 0.3;
      const leafLen = (1.1 + (t % 3) * 0.25) * scale;
      const leafW = (0.28 + (t % 2) * 0.06) * scale;

      const leafGroup = new THREE.Group();

      // Stem sheath
      const sheathGeo = new THREE.CylinderGeometry(0.02 * scale, 0.035 * scale, leafLen * 0.45, 6);
      const sheath = new THREE.Mesh(sheathGeo, stemMat);
      sheath.position.y = leafLen * 0.22;
      leafGroup.add(sheath);

      // Broad curved leaf blade
      const bladeGeo = new THREE.ConeGeometry(leafW, leafLen * 0.8, 6);
      bladeGeo.scale(1.4, 1.0, 0.2); // flat broad tropical blade
      const blade = new THREE.Mesh(bladeGeo, turmericMat);
      blade.position.y = leafLen * 0.65;
      blade.rotation.x = -0.25;
      blade.castShadow = true;
      leafGroup.add(blade);

      const tilt = 0.25 + (t % 3) * 0.12;
      leafGroup.position.set(
        Math.cos(tAngle) * (0.1 * scale),
        baseY,
        Math.sin(tAngle) * (0.1 * scale)
      );
      leafGroup.rotation.set(
        Math.sin(tAngle) * tilt,
        tAngle,
        -Math.cos(tAngle) * tilt
      );
      foliageGroup.add(leafGroup);
    }
  } else if (rawType.includes('ashwagandha')) {
    // -------------------------------------------------------------
    // ASHWAGANDHA (Woody branching subshrub, velvety oval leaves, red berries)
    // -------------------------------------------------------------
    const stemH = 1.25 * scale;
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04 * scale, 0.065 * scale, stemH, 8),
      stemMat
    );
    stem.position.y = baseY + stemH / 2;
    stem.castShadow = true;
    foliageGroup.add(stem);

    const branchCount = quality === 'hq' ? 7 : 4;
    const berryMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Bright red berry
      roughness: 0.25,
      metalness: 0.1,
    });

    for (let b = 0; b < branchCount; b++) {
      const bAngle = (b * Math.PI * 2) / branchCount + b * 0.35;
      const bLen = (0.48 + (b % 2) * 0.12) * scale;
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02 * scale, 0.035 * scale, bLen, 6),
        stemMat
      );
      branch.position.set(
        Math.cos(bAngle) * (0.14 * scale),
        baseY + (0.35 + b * 0.12) * scale,
        Math.sin(bAngle) * (0.14 * scale)
      );
      branch.rotation.set(Math.sin(bAngle) * 0.6, bAngle, -Math.cos(bAngle) * 0.6);
      branch.castShadow = true;
      foliageGroup.add(branch);

      // Leaves along branch
      for (let l = 0; l < 3; l++) {
        const leafGeo = new THREE.SphereGeometry(0.12 * scale, 6, 6);
        leafGeo.scale(1.2, 0.25, 0.85);
        const leaf = new THREE.Mesh(leafGeo, foliageMat);
        leaf.position.set(
          branch.position.x + Math.cos(bAngle) * (0.15 + l * 0.08) * scale,
          branch.position.y + (0.07 + l * 0.04) * scale,
          branch.position.z + Math.sin(bAngle) * (0.15 + l * 0.08) * scale
        );
        leaf.rotation.set(0.3, bAngle + l * 0.4, 0.2);
        leaf.castShadow = true;
        foliageGroup.add(leaf);
      }

      // Small winter cherry berries in calyx
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.04 * scale, 8, 8), berryMat);
      berry.position.set(
        branch.position.x + Math.cos(bAngle) * (0.32 * scale),
        branch.position.y + 0.05 * scale,
        branch.position.z + Math.sin(bAngle) * (0.32 * scale)
      );
      berry.castShadow = true;
      foliageGroup.add(berry);
    }
  } else {
    // -------------------------------------------------------------
    // SACRED TULSI (Holy Basil: Square branching stems, serrated leaves, flower spires)
    // -------------------------------------------------------------
    const mainStemH = 1.35 * scale;
    const mainStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04 * scale, 0.065 * scale, mainStemH, 8),
      stemMat
    );
    mainStem.position.y = baseY + mainStemH / 2;
    mainStem.castShadow = true;
    foliageGroup.add(mainStem);

    const branchCount = quality === 'hq' ? 8 : 5;
    for (let b = 0; b < branchCount; b++) {
      const bAngle = (b * Math.PI * 2) / branchCount + b * 0.45;
      const bLen = (0.42 + (b % 3) * 0.1) * scale;
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02 * scale, 0.032 * scale, bLen, 6),
        stemMat
      );
      branch.position.set(
        Math.cos(bAngle) * (0.13 * scale),
        baseY + (0.3 + b * 0.11) * scale,
        Math.sin(bAngle) * (0.13 * scale)
      );
      branch.rotation.set(Math.sin(bAngle) * 0.7, bAngle, -Math.cos(bAngle) * 0.7);
      branch.castShadow = true;
      foliageGroup.add(branch);

      // Serrated leaf clusters
      const leafClusterCount = quality === 'hq' ? 4 : 2;
      for (let lc = 0; lc < leafClusterCount; lc++) {
        const leafGeo = new THREE.SphereGeometry(0.12 * scale, 6, 6);
        leafGeo.scale(1.35, 0.2, 0.85);
        const leaf = new THREE.Mesh(leafGeo, foliageMat);
        leaf.position.set(
          branch.position.x + Math.cos(bAngle) * (0.14 + lc * 0.07) * scale,
          branch.position.y + (0.07 + lc * 0.04) * scale,
          branch.position.z + Math.sin(bAngle) * (0.14 + lc * 0.07) * scale
        );
        leaf.rotation.set(0.3, bAngle + lc * 0.5, 0.2);
        leaf.castShadow = true;
        foliageGroup.add(leaf);
      }
    }

    // Sacred Blossom Spires (Tulsi Manjari)
    const spireCount = 3;
    for (let f = 0; f < spireCount; f++) {
      const fAngle = (f * Math.PI * 2) / spireCount;
      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(0.065 * scale, 0.38 * scale, 6),
        flowerMat
      );
      spire.position.set(
        Math.cos(fAngle) * (0.08 * scale),
        baseY + (mainStemH + 0.12) * scale,
        Math.sin(fAngle) * (0.08 * scale)
      );
      spire.rotation.z = Math.cos(fAngle) * 0.15;
      spire.castShadow = true;
      foliageGroup.add(spire);
    }
  }

  return rootGroup;
}
