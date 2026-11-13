// 마음 나무 섬 — 참여자 한 명 = 잎 하나, 마음이 가벼워진 친구 = 꽃, 목표(해소율 20%)에 가까울수록 열매
// 마음 나무 화면(maum-tree.html)과 마음 마을 한가운데(app-prototype.html)에서 같이 씀
import * as THREE from 'three';
import { buildDecor } from './clay-scene.js';

const CANOPY = [
  { c: new THREE.Vector3(0, 4.2, 0), r: 1.55 },
  { c: new THREE.Vector3(-1.35, 3.55, 0.2), r: 1.15 },
  { c: new THREE.Vector3(1.35, 3.65, -0.1), r: 1.2 },
  { c: new THREE.Vector3(0.15, 3.4, 1.0), r: 1.05 },
  { c: new THREE.Vector3(-0.15, 5.15, -0.2), r: 1.0 }
];
const LEAF_TINTS = [0x5f9d84, 0x7fb59a, 0x8cc2a5, 0x6aa58f];

// leaves: [{ resolved: boolean }] 참여자 목록 / me: { resolved } 또는 null / fruits: 열린 열매 수
export function createTreeIsland({ leaves: leafData, me = null, fruits = 0, fruitsMax = 10, reduceMotion = false, shadows = true }) {
  const root = new THREE.Group();
  const mat = (c, x = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...x });
  const mesh = (geo, m, x, y, z, parent = root) => {
    const me2 = new THREE.Mesh(geo, m);
    me2.position.set(x, y, z);
    me2.castShadow = me2.receiveShadow = shadows;
    parent.add(me2);
    return me2;
  };

  // 섬
  mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.4, 64), mat(0x8fbf9f), 0, -0.2, 0);
  const lip = mesh(new THREE.TorusGeometry(3.4, 0.18, 16, 72), mat(0x8fbf9f), 0, -0.18, 0); lip.rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(3.45, 3.45, 0.34, 64), mat(0xf3e7d3), 0, -0.56, 0);
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; mesh(new THREE.SphereGeometry(0.065, 16, 12), mat(0xfffaf0), Math.cos(a) * 3.47, -0.56 + (i % 2 ? 0.05 : -0.05), Math.sin(a) * 3.47); }
  mesh(new THREE.CylinderGeometry(3.4, 1.5, 1.3, 64), mat(0x4f8a78), 0, -1.38, 0);
  [[2.3, 1.4], [-2.4, 1.0], [1.4, -2.3], [-1.9, -1.9]].forEach(([x, z], i) => { const d = buildDecor(i % 2 ? 'flowers' : 'plant'); d.position.set(x, 0, z); d.scale.setScalar(0.9); root.add(d); });

  // 줄기와 가지
  const bark = mat(0x8b5e3c);
  mesh(new THREE.CylinderGeometry(0.32, 0.55, 3.0, 24), bark, 0, 1.5, 0);
  [[-0.75, 2.75, 0.1, 0.9], [0.78, 2.85, -0.1, -0.85], [0.1, 2.7, 0.7, 0.6]].forEach(([x, y, z, rz]) => {
    const b = mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.4, 16), bark, x, y, z);
    b.rotation.z = rz;
    if (z) b.rotation.x = z * 0.9;
  });

  // 수관
  const canopyGroup = new THREE.Group();
  root.add(canopyGroup);
  CANOPY.forEach(({ c, r }) => mesh(new THREE.SphereGeometry(r, 40, 28), mat(0x6aa58f), c.x, c.y, c.z, canopyGroup));

  // 잎 위치: 수관 표면 위 무작위(다른 덩어리 안에 파묻히지 않는 곳)
  let seed = 99;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  function pointOnCanopy() {
    const weights = CANOPY.map(k => k.r * k.r), total = weights.reduce((a, b) => a + b, 0);
    for (let tries = 0; tries < 30; tries++) {
      let pick = rand() * total, idx = 0;
      while (pick > weights[idx]) { pick -= weights[idx]; idx++; }
      const { c, r } = CANOPY[idx];
      const dir = new THREE.Vector3(rand() * 2 - 1, rand() * 1.6 - 0.5, rand() * 2 - 1).normalize();
      const p = c.clone().addScaledVector(dir, r + 0.01);
      if (CANOPY.every((k, j) => j === idx || p.distanceTo(k.c) > k.r * 0.98)) return { p, dir };
    }
    return { p: CANOPY[0].c.clone().add(new THREE.Vector3(0, CANOPY[0].r, 0)), dir: new THREE.Vector3(0, 1, 0) };
  }

  const leafList = leafData.map(l => ({ resolved: !!l.resolved, ...pointOnCanopy() }));
  const leaves = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), mat(0xffffff, { roughness: 0.7 }), Math.max(1, leafList.length));
  leaves.castShadow = shadows;
  const col = new THREE.Color();
  leafList.forEach((l, i) => {
    leaves.setColorAt(i, col.setHex(l.resolved ? 0xf2a7b0 : LEAF_TINTS[i % LEAF_TINTS.length]));
    l.delay = rand() * 1.6 + (l.resolved ? 0.9 : 0);
  });
  root.add(leaves);

  // 내 잎
  let meLeaf = null, meMesh = null, meRing = null;
  if (me) {
    meLeaf = pointOnCanopy();
    meMesh = mesh(new THREE.SphereGeometry(0.2, 24, 16), mat(0xe57f62, { emissive: 0xe57f62, emissiveIntensity: 0.6 }), meLeaf.p.x, meLeaf.p.y, meLeaf.p.z);
    meRing = mesh(new THREE.TorusGeometry(0.3, 0.035, 10, 32), mat(0xfffaf2, { emissive: 0xfff3e3, emissiveIntensity: 0.6 }), meLeaf.p.x, meLeaf.p.y, meLeaf.p.z);
    meRing.lookAt(meLeaf.p.clone().add(meLeaf.dir));
  }

  // 열매
  const fruitMeshes = [];
  for (let i = 0; i < fruitsMax; i++) {
    const k = CANOPY[i % CANOPY.length];
    const ang = (i / fruitsMax) * Math.PI * 2 + i;
    const dir = new THREE.Vector3(Math.cos(ang) * 0.82, -0.5, Math.sin(ang) * 0.82).normalize();
    const p = k.c.clone().addScaledVector(dir, k.r + 0.12);
    const f = mesh(new THREE.SphereGeometry(0.23, 20, 14), mat(0xf2c94c, { emissive: 0xf2b94c, emissiveIntensity: 0.25 }), p.x, p.y, p.z);
    f.visible = i < fruits;
    fruitMeshes.push(f);
  }

  // t: 자라기 시작한 뒤 흐른 시간(초). 잎이 차례로 돋고 → 꽃이 피고 → 열매가 열림
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const backOut = x => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const clamp = x => Math.min(1, Math.max(0, x));
  let settled = false;
  function update(t) {
    if (meMesh) meMesh.material.emissiveIntensity = 0.45 + Math.sin(t * 3) * 0.25;
    if (settled && t > 5) return;
    leafList.forEach((l, i) => {
      const k = reduceMotion ? 1 : backOut(clamp((t - l.delay) / 0.5));
      q.setFromUnitVectors(UP, l.dir);
      const sz = l.resolved ? 0.15 : 0.13;
      s.set(sz * k, (l.resolved ? 0.12 : 0.06) * k, sz * k);
      m4.compose(l.p, q, s);
      leaves.setMatrixAt(i, m4);
    });
    leaves.instanceMatrix.needsUpdate = true;
    const mk = reduceMotion ? 1 : backOut(clamp((t - 2.6) / 0.6));
    if (meMesh) { meMesh.scale.setScalar(Math.max(0.001, mk)); meRing.scale.setScalar(Math.max(0.001, mk)); }
    fruitMeshes.forEach((f, i) => f.scale.setScalar(Math.max(0.001, reduceMotion ? 1 : backOut(clamp((t - 3.0 - i * 0.12) / 0.5)))));
    canopyGroup.scale.setScalar(reduceMotion ? 1 : 0.85 + 0.15 * backOut(clamp(t / 0.8)));
    if (t > 5) settled = true;
  }
  update(0);

  return { root, update, meLeaf, restart: () => { settled = false; } };
}
