// 마음서랍 클레이 3D 세계 (떠 있는 섬 + 작은 방 + 서랍장 + 마스코트)
// 소개 영상(intro-video.html)과 앱 홈(app-prototype.html)이 같은 장면을 쓰도록 공용으로 분리
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const DRAWER_KEYS = ['card', 'diary', 'check', 'connect'];

export function createClayRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, metalness: 0, ...o });
const RB = (w, h, d, r = 0.07) => new RoundedBoxGeometry(w, h, d, 4, r);
const sphere = (r) => new THREE.SphereGeometry(r, 40, 28);
const cyl = (rt, rb, h, s = 48) => new THREE.CylinderGeometry(rt, rb, h, s);
function addTo(parent, geo, m, x, y, z) {
  const me = new THREE.Mesh(geo, m);
  me.position.set(x, y, z);
  me.castShadow = true;
  me.receiveShadow = true;
  parent.add(me);
  return me;
}

export function createClayWorld() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff1de, 0x9fc2aa, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 40 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const island = createIsland();
  scene.add(island.root);
  return { scene, sun, ...island };
}

// 섬 하나(방·서랍장·마스코트 포함). 친구 섬은 색만 바꿔서 같은 함수로 만듦
// opts: { wall, chair, mascot, chest } 색상(16진수)
export function createIsland(opts = {}) {
  const root = new THREE.Group();
  const add = (geo, m, x, y, z, parent = root) => addTo(parent, geo, m, x, y, z);
  
  // ===== 떠 있는 섬 =====
  const C = {
    grass: 0x8fbf9f, rim: 0xf3e7d3, dot: 0xfffaf0, band: 0x6aa58f, bottom: 0x4f8a78,
    wood: 0xd9a874, woodDark: 0xa86e47, wall: opts.wall || 0xf6efe4, frame: 0xc98a5e,
    chest: opts.chest || 0xb77a52, front: 0xdca57b, knob: 0x6f5240, coral: opts.chair || 0xe9846a,
    shade: 0xf0b85c, leaf: 0x7fb59a, leafDark: 0x6aa58f, paper: 0xfffaf0, stone: 0xefe2cc
  };
  const grassTop = add(cyl(5, 5, 0.45, 80), mat(C.grass), 0, -0.225, 0);
  const lip = add(new THREE.TorusGeometry(5, 0.2, 20, 90), mat(C.grass), 0, -0.2, 0); lip.rotation.x = Math.PI / 2;
  add(cyl(5.06, 5.06, 0.38, 80), mat(C.rim), 0, -0.62, 0);
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2;
    add(sphere(0.075), mat(C.dot), Math.cos(a) * 5.08, -0.62 + (i % 2 ? 0.06 : -0.06), Math.sin(a) * 5.08);
  }
  add(cyl(5.0, 4.75, 0.45, 80), mat(C.band), 0, -1.03, 0);
  add(cyl(4.75, 2.1, 1.5, 80), mat(C.bottom), 0, -2.0, 0);
  
  // 마당 돌길
  const stoneYard = add(cyl(2.5, 2.5, 0.06, 64), mat(C.stone), 0.35, 0.03, 1.0);
  [[2.2, 2.4], [2.7, 3.2], [1.4, 3.4], [-1.6, 2.9]].forEach(([x, z]) => add(cyl(0.32, 0.32, 0.05, 24), mat(C.stone), x, 0.025, z));
  
  // ===== 방 =====
  const FLOOR = 0.12;
  const floorMesh = add(RB(5.2, 0.12, 3.4, 0.05), mat(C.wood), -0.6, 0.06, -0.75);
  add(RB(5.2, 2.7, 0.16, 0.05), mat(C.wall), -0.6, 1.41, -2.45);
  add(RB(0.16, 2.7, 3.4, 0.05), mat(C.wall), -3.2, 1.41, -0.75);
  add(RB(5.2, 0.14, 0.2, 0.04), mat(C.wood), -0.6, 0.19, -2.36);
  
  // 창문 + 달
  add(RB(1.15, 0.95, 0.07, 0.05), mat(C.frame), -1.65, 1.95, -2.35);
  add(RB(0.98, 0.78, 0.05, 0.03), mat(0x2f4070, { emissive: 0x1d2850, emissiveIntensity: 0.5 }), -1.65, 1.95, -2.31);
  add(sphere(0.13), mat(0xffe9a8, { emissive: 0xffe2a0, emissiveIntensity: 1 }), -1.4, 2.1, -2.27);
  [[-1.95, 2.18], [-1.8, 1.75], [-2.0, 1.85]].forEach(([x, y]) => add(sphere(0.025), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }), x, y, -2.28));
  add(RB(0.06, 0.5, 0.62, 0.03), mat(0xf2b8ad), -3.1, 1.9, -0.55);
  
  // 책상 + 의자 + 소품
  add(RB(1.9, 0.12, 0.85), mat(C.frame), -1.85, 1.0, -1.85);
  [[-2.7, -2.15], [-1.0, -2.15], [-2.7, -1.55], [-1.0, -1.55]].forEach(([x, z]) => add(RB(0.1, 0.9, 0.1, 0.03), mat(C.woodDark), x, 0.55, z));
  add(RB(0.62, 0.1, 0.6), mat(C.coral), -1.75, 0.6, -1.0);
  add(RB(0.62, 0.62, 0.09), mat(C.coral), -1.75, 0.95, -0.72);
  [[-2.0, -1.25], [-1.5, -1.25], [-2.0, -0.78], [-1.5, -0.78]].forEach(([x, z]) => add(RB(0.07, 0.5, 0.07, 0.02), mat(C.woodDark), x, 0.33, z));
  add(cyl(0.14, 0.16, 0.05), mat(C.knob), -2.45, 1.09, -2.0);
  const arm = add(cyl(0.025, 0.025, 0.58, 12), mat(C.knob), -2.4, 1.36, -2.0); arm.rotation.z = 0.28;
  const shade = add(new THREE.ConeGeometry(0.21, 0.26, 32), mat(C.shade), -2.27, 1.64, -1.95); shade.rotation.z = -0.65;
  const bulb = add(sphere(0.06), mat(0xffd98a, { emissive: 0xffc66a, emissiveIntensity: 2 }), -2.22, 1.55, -1.93);
  bulb.castShadow = false;
  const lampLight = new THREE.PointLight(0xffc477, 7, 6, 2);
  lampLight.position.set(-2.2, 1.5, -1.85);
  root.add(lampLight);
  add(cyl(0.08, 0.07, 0.15, 24), mat(0xf7efe3), -1.2, 1.13, -1.7);
  add(RB(0.42, 0.06, 0.3, 0.02), mat(0xb9d0e8), -1.62, 1.09, -1.98);
  add(RB(0.38, 0.06, 0.28, 0.02), mat(0xf7d77c), -1.6, 1.15, -1.98);
  
  // 서랍장 (위에서부터 카드 / 일기 / 체크 / 연결)
  const CH = { x: 0.95, z: -1.98, w: 1.4, h: 1.95, d: 0.85 };
  add(RB(CH.w, CH.h, CH.d, 0.06), mat(C.chest), CH.x, FLOOR + CH.h / 2, CH.z);
  const frontZ = CH.z + CH.d / 2;
  const LABELS = [0xf2b8ad, 0xbfd7b2, 0xb9d0e8, 0xf7d77c];
  const drawers = LABELS.map((lc, i) => {
    const y = FLOOR + CH.h - 0.33 - i * 0.44;
    const g = new THREE.Group();
    g.position.set(CH.x, y, frontZ);
    root.add(g);
    add(RB(1.1, 0.3, 0.72, 0.03), mat(0x8f5c3c), 0, -0.02, -0.38, g);
    add(RB(0.22, 0.02, 0.16, 0.01), mat(C.paper), -0.25, 0.14, -0.3, g);
    add(RB(0.2, 0.02, 0.15, 0.01), mat(0xfbe9cf), 0.08, 0.14, -0.42, g);
    add(RB(1.22, 0.38, 0.1, 0.04), mat(C.front), 0, 0, 0.04, g);
    const labelMat = mat(lc, { emissive: lc, emissiveIntensity: 0 });
    add(RB(0.5, 0.16, 0.025, 0.02), labelMat, -0.18, 0, 0.1, g);
    add(sphere(0.05), mat(C.knob), 0.36, 0, 0.12, g);
    return { g, labelMat };
  });
  add(cyl(0.16, 0.12, 0.25, 32), mat(0xd08a62), 1.32, FLOOR + CH.h + 0.13, -2.0);
  [[0, 0.28, 0, 0.17], [-0.1, 0.4, 0.02, 0.12], [0.09, 0.42, -0.03, 0.11]].forEach(([dx, dy, dz, r]) => add(sphere(r), mat(C.leaf), 1.32 + dx, FLOOR + CH.h + dy, -2.0 + dz));
  const photo = add(RB(0.3, 0.36, 0.04, 0.02), mat(0xf7d77c), 0.6, FLOOR + CH.h + 0.18, -2.1); photo.rotation.x = -0.18;
  
  // ===== 바깥 나무 / 덤불 / 정원등 =====
  function tree(x, z, s) {
    add(cyl(0.12 * s, 0.17 * s, 1.3 * s, 16), mat(0x8b5e3c), x, 0.65 * s, z);
    add(sphere(0.85 * s), mat(C.leafDark), x, 1.75 * s, z);
    add(sphere(0.6 * s), mat(C.leaf), x - 0.45 * s, 1.35 * s, z + 0.35 * s);
    add(sphere(0.55 * s), mat(C.leaf), x + 0.4 * s, 1.45 * s, z + 0.3 * s);
  }
  tree(3.35, -1.3, 1.1);
  tree(-3.7, 2.0, 0.8);
  [[3.0, 1.3, 0.48], [3.75, 0.35, 0.36], [-2.4, 2.75, 0.42], [1.6, 3.45, 0.34], [-0.6, 3.6, 0.3], [4.1, -0.7, 0.3]].forEach(([x, z, r], i) =>
    add(sphere(r), mat(i % 2 ? C.leaf : C.leafDark), x, r * 0.75, z));
  add(cyl(0.045, 0.06, 1.6, 12), mat(0x3f5a52), -2.2, 0.8, 2.7);
  const gardenBulb = add(sphere(0.13), mat(0xffe3a6, { emissive: 0xffc66a, emissiveIntensity: 0.4 }), -2.2, 1.68, 2.7);
  add(cyl(0.16, 0.16, 0.05, 20), mat(0x3f5a52), -2.2, 1.82, 2.7);
  
  // ===== 마스코트 (쪽지 모찌) =====
  const M = new THREE.Group();
  M.position.set(0.3, 0.06, 1.05);
  M.rotation.y = 0.35;
  M.scale.setScalar(1.45);
  root.add(M);
  const body = add(sphere(0.5), mat(opts.mascot || 0xfffaf2, { roughness: 0.6 }), 0, 0.41, 0, M);
  body.scale.set(1, 0.82, 0.92);
  const ear = add(new THREE.ConeGeometry(0.13, 0.2, 3), mat(0xf3e6d2, { roughness: 0.7 }), 0.27, 0.78, -0.02, M);
  ear.rotation.set(0.2, 0.3, -0.7);
  const inkMat = mat(0x3b2c22, { roughness: 0.5 });
  const eyeArc = () => new THREE.TorusGeometry(0.055, 0.014, 8, 20, Math.PI);
  const eyes = { sleepy: [], happy: [], open: [] };
  [-0.15, 0.15].forEach(x => {
    const s = add(eyeArc(), inkMat, x, 0.47, 0.44, M); s.rotation.z = Math.PI; eyes.sleepy.push(s);
    const h = add(eyeArc(), inkMat, x, 0.44, 0.44, M); eyes.happy.push(h);
    const o = add(sphere(0.045), inkMat, x, 0.46, 0.43, M); eyes.open.push(o);
  });
  const mouth = add(new THREE.TorusGeometry(0.035, 0.012, 8, 16, Math.PI), inkMat, 0, 0.35, 0.455, M); mouth.rotation.z = Math.PI;
  [-0.26, 0.26].forEach(x => { const b = add(sphere(0.06), mat(0xf4a7a0, { roughness: 0.7 }), x, 0.37, 0.4, M); b.scale.set(1, 0.6, 0.4); });
  function setEyes(kind) { Object.entries(eyes).forEach(([k, arr]) => arr.forEach(e => (e.visible = k === kind))); }
  
  // 고민 구름
  const cloud = new THREE.Group();
  root.add(cloud);
  [[0, 0, 0, 0.2], [-0.2, -0.05, 0, 0.15], [0.2, -0.04, 0.02, 0.16], [0.05, 0.12, -0.03, 0.14]].forEach(([x, y, z, r]) => add(sphere(r), mat(0xb3aca2, { roughness: 0.9 }), x, y, z, cloud));
  
  // 쪽지 (반으로 접힘)
  const paperG = new THREE.Group();
  root.add(paperG);
  const paperMat = mat(C.paper, { side: THREE.DoubleSide, roughness: 0.75 });
  const halfGeo = (up) => { const g = new THREE.PlaneGeometry(0.52, 0.34); g.translate(0, up ? 0.17 : -0.17, 0); return g; };
  add(halfGeo(false), paperMat, 0, 0, 0, paperG);
  const lines = [0.08, 0.17].map((yy, i) => { const l = add(new THREE.PlaneGeometry(i ? 0.24 : 0.34, 0.025), mat(0x9a8571), -0.05 + (i ? -0.05 : 0), -yy, 0.003, paperG); return l; });
  const topPivot = new THREE.Group();
  paperG.add(topPivot);
  add(halfGeo(true), paperMat, 0, 0, 0, topPivot);

  drawers.forEach((d, i) => { d.key = DRAWER_KEYS[i]; d.g.userData.drawerKey = DRAWER_KEYS[i]; });
  cloud.visible = false;
  paperG.visible = false;
  setEyes('open');

  // 꾸미기 소품을 놓을 수 있는 면: 방 바닥 / 마당 돌길 / 잔디
  const surfaces = [floorMesh, stoneYard, grassTop];
  return { root, drawers, M, body, ear, setEyes, lampLight, gardenBulb, cloud, paperG, topPivot, lines, CH, FLOOR, frontZ, surfaces };
}

// ===== 꾸미기 소품 =====
// need: 쪽지를 몇 개 넣어야 열리는지 (0이면 처음부터 있음)
export const DECOR = [
  { key: 'rug',      name: '동그란 러그', emoji: '🟠', need: 0 },
  { key: 'plant',    name: '큰 화분',     emoji: '🪴', need: 0 },
  { key: 'cushion',  name: '폭신 쿠션',   emoji: '🎀', need: 0 },
  { key: 'bear',     name: '곰인형',      emoji: '🧸', need: 1 },
  { key: 'books',    name: '책 더미',     emoji: '📚', need: 2 },
  { key: 'moodlamp', name: '무드등',      emoji: '💡', need: 3 },
  { key: 'cat',      name: '고양이',      emoji: '🐈', need: 4 },
  { key: 'flowers',  name: '꽃밭',        emoji: '🌷', need: 5 },
  { key: 'mailbox',  name: '우체통',      emoji: '📮', need: 6 }
];

// 바닥(y=0)을 기준으로 소품 하나를 만들어 돌려줌
export function buildDecor(key) {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => addTo(g, geo, m, x, y, z);
  if (key === 'rug') {
    add(cyl(0.72, 0.72, 0.025, 48), mat(0xe9846a), 0, 0.013, 0);
    add(cyl(0.46, 0.46, 0.03, 48), mat(0xf6e2cb), 0, 0.02, 0);
    add(cyl(0.2, 0.2, 0.035, 32), mat(0xe9846a), 0, 0.025, 0);
  } else if (key === 'plant') {
    add(cyl(0.2, 0.15, 0.32, 32), mat(0xd08a62), 0, 0.16, 0);
    [[0, 0.5, 0, 0.22], [-0.14, 0.62, 0.05, 0.15], [0.13, 0.66, -0.04, 0.14], [0.02, 0.78, 0.02, 0.12]].forEach(([x, y, z, r]) => add(sphere(r), mat(0x7fb59a), x, y, z));
  } else if (key === 'cushion') {
    add(RB(0.5, 0.2, 0.5, 0.09), mat(0xf2b8ad), 0, 0.1, 0);
    add(sphere(0.04), mat(0xfffaf2), 0, 0.2, 0);
  } else if (key === 'bear') {
    add(sphere(0.22), mat(0xc69060), 0, 0.22, 0);
    add(sphere(0.17), mat(0xc69060), 0, 0.52, 0);
    [-0.12, 0.12].forEach(x => add(sphere(0.065), mat(0xb27c4f), x, 0.65, 0));
    add(sphere(0.07), mat(0xf3e2c8), 0, 0.49, 0.14);
    [-0.06, 0.06].forEach(x => add(sphere(0.022), mat(0x3b2c22), x, 0.57, 0.15));
  } else if (key === 'books') {
    [[0xb9d0e8, 0.04, 0.1], [0xf7d77c, 0.12, -0.15], [0xbfd7b2, 0.2, 0.25]].forEach(([c, y, r]) => { const b = add(RB(0.42, 0.08, 0.3, 0.02), mat(c), 0, y, 0); b.rotation.y = r; });
  } else if (key === 'moodlamp') {
    add(cyl(0.12, 0.14, 0.06, 24), mat(0x6f5240), 0, 0.03, 0);
    const globe = add(sphere(0.17), mat(0xffe3a6, { emissive: 0xffc66a, emissiveIntensity: 1.2 }), 0, 0.24, 0);
    globe.castShadow = false;
  } else if (key === 'cat') {
    const body = add(sphere(0.2), mat(0xa9a39a), 0, 0.17, 0); body.scale.set(1.35, 0.8, 0.9);
    add(sphere(0.14), mat(0xa9a39a), 0.26, 0.3, 0);
    [-0.07, 0.07].forEach(z => { const e = add(new THREE.ConeGeometry(0.05, 0.1, 12), mat(0xa9a39a), 0.27, 0.45, z); e.rotation.z = -0.15; });
    [-0.05, 0.05].forEach(z => add(sphere(0.02), mat(0x3b2c22), 0.39, 0.32, z));
    const tail = add(new THREE.TorusGeometry(0.12, 0.035, 10, 20, Math.PI), mat(0xa9a39a), -0.3, 0.2, 0); tail.rotation.z = Math.PI / 2;
  } else if (key === 'flowers') {
    add(cyl(0.42, 0.45, 0.06, 24), mat(0x6aa58f), 0, 0.03, 0);
    [[0, 0, 0xf2b8ad], [0.2, 0.15, 0xf7d77c], [-0.22, 0.1, 0xfffaf2], [0.1, -0.22, 0xf2b8ad], [-0.12, -0.18, 0xf7d77c]].forEach(([x, z, c], i) => {
      const h = 0.22 + (i % 2) * 0.08;
      add(cyl(0.015, 0.015, h, 8), mat(0x6aa58f), x, 0.06 + h / 2, z);
      add(sphere(0.07), mat(c), x, 0.06 + h, z);
    });
  } else if (key === 'mailbox') {
    add(cyl(0.04, 0.05, 0.7, 12), mat(0x6f5240), 0, 0.35, 0);
    add(RB(0.32, 0.24, 0.42, 0.08), mat(0xe57f62), 0, 0.8, 0);
    add(RB(0.03, 0.14, 0.08, 0.01), mat(0xf7d77c), 0.18, 0.88, 0.1);
  }
  return g;
}

// ===== 특별 소품 =====
// 많이 쓰는 것보다 "마음돌봄에 도움이 되는 행동"을 했을 때 열림 (rule은 앱에서 조건을 판단하는 키)
export const SPECIAL_DECOR = [
  { key: 'candle',     name: '첫 쪽지 촛불',     emoji: '🕯️', rule: 'firstNote',  how: '첫 쪽지를 서랍에 넣으면' },
  { key: 'sprout',     name: '다시 재는 새싹',   emoji: '🌱', rule: 'recheck',    how: '4주 뒤 마음체크를 다시 하면' },
  { key: 'letterbox',  name: '오래된 편지함',    emoji: '📜', rule: 'reflect',    how: '그때의 나에게 한마디를 붙이면' },
  { key: 'rainbowbox', name: '무지개 우체통',    emoji: '🌈', rule: 'cheer3',     how: '친구에게 응원을 3번 보내면' },
  { key: 'starlight',  name: '별빛 조명',        emoji: '⭐', rule: 'gotCheer',   how: '친구에게 처음 응원을 받으면' },
  { key: 'peach',      name: '복사골 복숭아나무', emoji: '🍑', rule: 'connect',    how: '마음연결을 신청하거나 거점에 가보면' },
  { key: 'lantern',    name: '마을 등불',        emoji: '🏮', rule: 'villageGoal', how: '마을 전체 해소율이 20%가 되면 모두에게' },
  { key: 'snowman',    name: '겨울 눈사람',      emoji: '⛄', rule: 'december',   how: '12월에 한 번이라도 기록하면' }
];

export function buildSpecialDecor(key) {
  const g = new THREE.Group();
  const add = (geo, m, x, y, z) => addTo(g, geo, m, x, y, z);
  const glow = (c, i = 1.2) => mat(c, { emissive: c, emissiveIntensity: i });
  if (key === 'candle') {
    add(cyl(0.16, 0.18, 0.05, 24), mat(0xc98a5e), 0, 0.025, 0);
    add(cyl(0.09, 0.09, 0.28, 24), mat(0xfffaf0), 0, 0.19, 0);
    const f = add(new THREE.ConeGeometry(0.05, 0.13, 16), glow(0xffb347, 1.6), 0, 0.4, 0); f.castShadow = false;
  } else if (key === 'sprout') {
    add(cyl(0.17, 0.13, 0.24, 24), mat(0xf2b8ad), 0, 0.12, 0);
    add(cyl(0.02, 0.025, 0.3, 8), mat(0x6aa58f), 0, 0.38, 0);
    [-1, 1].forEach(s => { const l = add(new THREE.SphereGeometry(0.11, 16, 12), mat(0x9fd18a), s * 0.1, 0.52, 0); l.scale.set(1.3, 0.45, 0.8); l.rotation.z = s * 0.5; });
  } else if (key === 'letterbox') {
    add(RB(0.52, 0.28, 0.36, 0.05), mat(0x9a6a45), 0, 0.14, 0);
    add(RB(0.55, 0.08, 0.39, 0.04), mat(0x7f5537), 0, 0.31, 0);
    add(RB(0.32, 0.02, 0.2, 0.01), mat(0xfffaf0), 0.02, 0.36, 0.02).rotation.y = 0.3;
    add(new THREE.SphereGeometry(0.045, 12, 10), mat(0xe57f62), 0, 0.15, 0.19);
  } else if (key === 'rainbowbox') {
    add(cyl(0.04, 0.05, 0.7, 12), mat(0x6f5240), 0, 0.35, 0);
    [0xf2b8ad, 0xf7d77c, 0xbfd7b2, 0xb9d0e8].forEach((c, i) => add(RB(0.34, 0.07, 0.44, 0.03), mat(c), 0, 0.72 + i * 0.07, 0));
    add(RB(0.03, 0.14, 0.08, 0.01), mat(0xe57f62), 0.19, 0.9, 0.1);
  } else if (key === 'starlight') {
    add(cyl(0.025, 0.035, 0.9, 10), mat(0x3f5a52), 0, 0.45, 0);
    const star = add(new THREE.OctahedronGeometry(0.17), glow(0xf7d77c, 1.4), 0, 1.0, 0); star.castShadow = false; star.rotation.y = 0.6;
    [[0.22, 0.75], [-0.2, 0.62], [0.12, 0.45]].forEach(([x, y]) => { const s = add(new THREE.SphereGeometry(0.04, 10, 8), glow(0xfff1c2, 1.2), x, y, 0.05); s.castShadow = false; });
  } else if (key === 'peach') {
    add(cyl(0.07, 0.1, 0.6, 12), mat(0x8b5e3c), 0, 0.3, 0);
    [[0, 0.8, 0, 0.32], [-0.22, 0.66, 0.08, 0.22], [0.22, 0.7, -0.05, 0.24]].forEach(([x, y, z, r]) => add(new THREE.SphereGeometry(r, 20, 14), mat(0x7fb59a), x, y, z));
    [[0.2, 0.58, 0.22], [-0.25, 0.52, 0.18], [0.05, 0.62, 0.3], [-0.05, 0.98, 0.15]].forEach(([x, y, z]) => add(new THREE.SphereGeometry(0.075, 14, 10), mat(0xf6a98c), x, y, z));
  } else if (key === 'lantern') {
    add(cyl(0.035, 0.045, 0.8, 10), mat(0x6f5240), 0, 0.4, 0);
    add(cyl(0.18, 0.18, 0.04, 20), mat(0x6f5240), 0, 0.82, 0);
    const p = add(cyl(0.17, 0.17, 0.3, 20), glow(0xf6a35c, 0.9), 0, 1.0, 0); p.castShadow = false;
    add(cyl(0.12, 0.18, 0.05, 20), mat(0x6f5240), 0, 1.18, 0);
  } else if (key === 'snowman') {
    add(new THREE.SphereGeometry(0.22, 24, 16), mat(0xffffff, { roughness: 0.6 }), 0, 0.2, 0);
    add(new THREE.SphereGeometry(0.15, 24, 16), mat(0xffffff, { roughness: 0.6 }), 0, 0.52, 0);
    add(cyl(0.11, 0.11, 0.14, 16), mat(0x3b2c22), 0, 0.72, 0);
    add(cyl(0.16, 0.16, 0.02, 16), mat(0x3b2c22), 0, 0.65, 0);
    const n = add(new THREE.ConeGeometry(0.03, 0.12, 10), mat(0xf28c3a), 0, 0.53, 0.18); n.rotation.x = Math.PI / 2;
    add(RB(0.34, 0.05, 0.08, 0.02), mat(0xe57f62), 0, 0.4, 0.05);
  }
  return g;
}

// ===== 내 캐릭터 꾸미기: 몸 색 · 모자 · 소품 =====
export const MASCOT_COLORS = [
  { key: 'mochi', name: '찹쌀', hex: 0xfffaf2 },
  { key: 'peach', name: '복숭아', hex: 0xffdccf },
  { key: 'mint',  name: '민트', hex: 0xd2ecdc },
  { key: 'sky',   name: '하늘', hex: 0xd5e5f7 },
  { key: 'lemon', name: '레몬', hex: 0xfbecb2 },
  { key: 'lilac', name: '라일락', hex: 0xe4d9f3 }
];
export const MASCOT_HATS = [
  { key: 'none',       name: '없음',     emoji: '·' },
  { key: 'beanie',     name: '털모자',   emoji: '🧶' },
  { key: 'straw',      name: '밀짚모자', emoji: '👒' },
  { key: 'ribbon',     name: '리본',     emoji: '🎀' },
  { key: 'sprout',     name: '새싹',     emoji: '🌱' },
  { key: 'frog',       name: '개구리',   emoji: '🐸' },
  { key: 'headphones', name: '헤드폰',   emoji: '🎧' },
  { key: 'crown',      name: '종이왕관', emoji: '👑' }
];
export const MASCOT_ACCS = [
  { key: 'none',    name: '없음',       emoji: '·' },
  { key: 'scarf',   name: '목도리',     emoji: '🧣' },
  { key: 'glasses', name: '동그란 안경', emoji: '👓' },
  { key: 'bowtie',  name: '나비넥타이', emoji: '🎀' },
  { key: 'blush',   name: '발그레',     emoji: '☺️' }
];
const HIDE_EAR = new Set(['beanie', 'straw', 'crown', 'frog']);

// isl: createIsland()의 결과(M · body · ear 사용). style: { color, hat, acc }
export function dressMascot(isl, style = {}) {
  const { M, body, ear } = isl;
  if (M.userData.wear) { M.remove(M.userData.wear); M.userData.wear.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); }
  const W = new THREE.Group();
  M.userData.wear = W;
  M.add(W);
  const col = MASCOT_COLORS.find(x => x.key === style.color);
  if (col) body.material.color.setHex(col.hex);
  if (ear) { if (col) ear.material.color.setHex(col.hex).multiplyScalar(0.94); ear.visible = !HIDE_EAR.has(style.hat); }
  const put = (geo, color, x, y, z, extra = {}) => addTo(W, geo, mat(color, extra), x, y, z);
  const dome = (r, color, y) => { const d = put(new THREE.SphereGeometry(r, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), color, 0, y, 0); d.scale.set(1, 0.72, 0.98); return d; };

  switch (style.hat) {
    case 'beanie': {
      dome(0.455, 0xe57f62, 0.6);
      const band = put(new THREE.TorusGeometry(0.445, 0.055, 12, 40), 0xf3c9a8, 0, 0.6, 0); band.rotation.x = Math.PI / 2;
      put(sphere(0.09), 0xfffaf2, 0, 0.94, 0);
      break;
    }
    case 'straw': {
      const g = new THREE.Group(); g.rotation.z = 0.12; W.add(g);
      addTo(g, cyl(0.62, 0.62, 0.03), mat(0xf1d38c), 0, 0.74, 0);
      addTo(g, cyl(0.29, 0.33, 0.2), mat(0xf1d38c), 0, 0.85, 0);
      addTo(g, cyl(0.335, 0.335, 0.05), mat(0xe57f62), 0, 0.78, 0);
      break;
    }
    case 'ribbon': {
      const g = new THREE.Group(); g.position.set(-0.24, 0.76, 0.08); g.rotation.z = 0.45; W.add(g);
      [-1, 1].forEach(sd => { const l = addTo(g, sphere(0.1), mat(0xf2a7b0), sd * 0.1, 0, 0); l.scale.set(1, 0.65, 0.4); l.rotation.z = sd * 0.35; });
      addTo(g, sphere(0.045), mat(0xe8899a), 0, 0, 0.02);
      break;
    }
    case 'sprout': {
      put(cyl(0.02, 0.025, 0.2, 12), 0x6aa58f, 0, 0.9, 0);
      [-1, 1].forEach(sd => { const l = put(sphere(0.075), 0x8cc2a5, sd * 0.08, 1.0, 0); l.scale.set(1, 0.35, 0.6); l.rotation.z = sd * -0.5; });
      break;
    }
    case 'frog': {
      dome(0.455, 0x8cc2a5, 0.6);
      [-1, 1].forEach(sd => { put(sphere(0.1), 0xfffaf2, sd * 0.17, 0.9, 0.14); put(sphere(0.05), 0x3b2c22, sd * 0.17, 0.92, 0.22); });
      break;
    }
    case 'headphones': {
      put(new THREE.TorusGeometry(0.49, 0.035, 10, 32, Math.PI), 0x4f8a78, 0, 0.44, 0);
      [-1, 1].forEach(sd => { const p = put(cyl(0.12, 0.12, 0.09, 24), 0xe57f62, sd * 0.49, 0.44, 0); p.rotation.z = Math.PI / 2; });
      break;
    }
    case 'crown': {
      put(new THREE.CylinderGeometry(0.22, 0.24, 0.13, 32, 1, true), 0xf2c94c, 0, 0.84, 0, { side: THREE.DoubleSide });
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; put(new THREE.ConeGeometry(0.05, 0.11, 8), 0xf2c94c, Math.sin(a) * 0.22, 0.95, Math.cos(a) * 0.22); }
      put(sphere(0.035), 0xe57f62, 0, 0.85, 0.24);
      break;
    }
  }
  switch (style.acc) {
    case 'scarf': {
      const r = put(new THREE.TorusGeometry(0.42, 0.07, 12, 40), 0xe57f62, 0, 0.19, 0); r.rotation.x = Math.PI / 2;
      const tail = put(RB(0.13, 0.26, 0.05, 0.02), 0xe57f62, 0.2, 0.06, 0.38); tail.rotation.z = 0.25;
      break;
    }
    case 'glasses': {
      [-1, 1].forEach(sd => put(new THREE.TorusGeometry(0.085, 0.014, 8, 28), 0x3b2c22, sd * 0.15, 0.46, 0.49));
      const br = put(cyl(0.01, 0.01, 0.13, 8), 0x3b2c22, 0, 0.48, 0.5); br.rotation.z = Math.PI / 2;
      break;
    }
    case 'bowtie': {
      [-1, 1].forEach(sd => { const w = put(new THREE.ConeGeometry(0.07, 0.13, 4), 0x5f9d84, sd * 0.07, 0.14, 0.36); w.rotation.z = sd * Math.PI / 2; });
      put(sphere(0.035), 0x4f8a78, 0, 0.14, 0.37);
      break;
    }
    case 'blush': {
      [-1, 1].forEach(sd => { const b = put(sphere(0.075), 0xf08f8a, sd * 0.27, 0.37, 0.41, { emissive: 0xf08f8a, emissiveIntensity: 0.15 }); b.scale.set(1, 0.6, 0.4); });
      break;
    }
  }
  W.traverse(o => { if (o.isMesh) o.castShadow = M.children[0] ? M.children[0].castShadow : true; });
}

// ===== 마을 사람(작은 모찌) — 섬 없이 캐릭터만. dressMascot과 같이 씀 =====
export function createMascot(color = 0xfffaf2) {
  const M = new THREE.Group();
  const body = addTo(M, sphere(0.5), mat(color, { roughness: 0.6 }), 0, 0.41, 0);
  body.scale.set(1, 0.82, 0.92);
  const ear = addTo(M, new THREE.ConeGeometry(0.13, 0.2, 3), mat(color, { roughness: 0.7 }), 0.27, 0.78, -0.02);
  ear.material.color.multiplyScalar(0.94);
  ear.rotation.set(0.2, 0.3, -0.7);
  const inkMat = mat(0x3b2c22, { roughness: 0.5 });
  const eyes = { sleepy: [], happy: [], open: [] };
  [-0.15, 0.15].forEach(x => {
    const s = addTo(M, new THREE.TorusGeometry(0.055, 0.014, 8, 20, Math.PI), inkMat, x, 0.47, 0.44); s.rotation.z = Math.PI; eyes.sleepy.push(s);
    const h = addTo(M, new THREE.TorusGeometry(0.055, 0.014, 8, 20, Math.PI), inkMat, x, 0.44, 0.44); eyes.happy.push(h);
    const o = addTo(M, sphere(0.045), inkMat, x, 0.46, 0.43); eyes.open.push(o);
  });
  [-0.26, 0.26].forEach(x => { const b = addTo(M, sphere(0.06), mat(0xf4a7a0, { roughness: 0.7 }), x, 0.37, 0.4); b.scale.set(1, 0.6, 0.4); });
  function setEyes(kind) { Object.entries(eyes).forEach(([k, arr]) => arr.forEach(e => (e.visible = k === kind))); }
  setEyes('open');
  M.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return { M, body, ear, setEyes };
}
