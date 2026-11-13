// 마음 날씨 — 오늘의 감정을 섬 위 날씨로 보여줌 (맑음 · 흐림 · 비 · 번개)
import * as THREE from 'three';

export const WEATHERS = {
  sunny:  { key: 'sunny',  name: '맑음', icon: '☀️' },
  cloudy: { key: 'cloudy', name: '흐림', icon: '☁️' },
  rain:   { key: 'rain',   name: '비',   icon: '🌧️' },
  storm:  { key: 'storm',  name: '번개', icon: '⛈️' }
};
// 마음일기 감정 묶음(FAMILIES.key) → 날씨
export const FAMILY_WEATHER = { joy: 'sunny', calm: 'sunny', tired: 'cloudy', sad: 'rain', anx: 'storm', angry: 'storm' };

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });

// calm: 동작 줄이기 — 번쩍임 없이 부드럽게, 빗방울도 천천히
export function createWeather({ calm = false } = {}) {
  const group = new THREE.Group();
  let kind = null, parts = null;

  function cloud(color, parent) {
    const g = new THREE.Group();
    const m = mat(color, { roughness: 0.95 });
    [[0, 0, 0, 0.62], [-0.62, -0.14, 0.05, 0.46], [0.64, -0.12, 0, 0.5], [0.2, 0.3, -0.08, 0.44], [-0.28, 0.22, 0.1, 0.38]].forEach(([x, y, z, r]) => {
      const s = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), m); s.position.set(x, y, z); g.add(s);
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.3, 28), m); base.position.y = -0.22; base.scale.z = 0.6; g.add(base);
    parent.add(g);
    return g;
  }

  function build(k) {
    group.clear();
    parts = { k };
    if (k === 'sunny') {
      const sun = new THREE.Group(); group.add(sun);
      sun.add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 20), mat(0xffd36b, { emissive: 0xffb84a, emissiveIntensity: 0.55 })));
      const rays = new THREE.Group(); sun.add(rays);
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * Math.PI * 2;
        const r = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 8), mat(0xffd36b, { emissive: 0xffc66a, emissiveIntensity: 0.4 }));
        r.position.set(Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0); r.rotation.z = a - Math.PI / 2; rays.add(r);
      }
      // 볼 · 웃는 눈 (쪽지 모찌처럼 말랑한 해)
      const ink = mat(0x7a4b2a);
      [-0.17, 0.17].forEach(x => { const e = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 16, Math.PI), ink); e.position.set(x, 0.06, 0.53); sun.add(e); });
      Object.assign(parts, { sun, rays });
    } else {
      const dark = k === 'storm', wet = k === 'rain' || k === 'storm';
      const c = cloud(dark ? 0x8d8aa0 : wet ? 0xb7c3cf : 0xf2efe9, group);
      parts.cloud = c;
      if (k === 'cloudy') parts.cloud2 = cloud(0xe3ded6, group), parts.cloud2.scale.setScalar(0.6), parts.cloud2.position.set(1.2, -0.35, -0.3);
      if (wet) {
        const dm = mat(0x7fb0d6, { emissive: 0x4f86b0, emissiveIntensity: 0.15 });
        parts.drops = [];
        for (let i = 0; i < 14; i++) {
          const d = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.16, 3, 6), dm);
          d.userData = { x: (Math.random() - 0.5) * 1.6, z: (Math.random() - 0.5) * 0.6, o: Math.random() };
          group.add(d); parts.drops.push(d);
        }
      }
      if (dark) {
        const s = new THREE.Shape();
        [[0.05, 0], [-0.18, -0.42], [-0.02, -0.42], [-0.16, -0.85], [0.2, -0.32], [0.04, -0.32], [0.18, 0]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
        const bolt = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: false }), mat(0xffe066, { emissive: 0xffd23a, emissiveIntensity: 0.9 }));
        bolt.position.set(0.25, -0.35, 0.1);
        group.add(bolt);
        const flash = new THREE.PointLight(0xfff1b8, 0, 9);
        flash.position.set(0, -0.6, 0.6);
        group.add(flash);
        Object.assign(parts, { bolt, flash });
      }
    }
  }

  function setKind(k) {
    if (k === kind) return;
    kind = k;
    group.visible = !!k;
    if (k) build(k);
  }

  function update(t) {
    if (!kind || !parts) return;
    if (parts.sun) {
      parts.rays.rotation.z = t * (calm ? 0.1 : 0.35);
      parts.sun.scale.setScalar(1 + Math.sin(t * 2) * 0.04);
    }
    if (parts.cloud) parts.cloud.position.x = Math.sin(t * 0.5) * 0.15;
    if (parts.cloud2) parts.cloud2.position.x = 1.2 + Math.sin(t * 0.4 + 1) * 0.2;
    if (parts.drops) parts.drops.forEach(d => {
      const p = (t * (calm ? 0.5 : 1.1) + d.userData.o) % 1;
      d.position.set(d.userData.x + parts.cloud.position.x, -0.45 - p * 1.8, d.userData.z);
      d.scale.setScalar(p > 0.85 ? (1 - p) / 0.15 : 1);
    });
    if (parts.bolt) {
      // 3.2초마다 두 번 번쩍 (동작 줄이기면 은은하게 켜져 있기만)
      const c = t % 3.2;
      const on = calm ? 0.6 : (c < 0.09 || (c > 0.18 && c < 0.26)) ? 1 : 0;
      parts.bolt.visible = calm || on > 0;
      parts.bolt.material.emissiveIntensity = 0.5 + on * 0.6;
      parts.flash.intensity = calm ? 0 : on * 6;
    }
  }

  return { group, setKind, update, get kind() { return kind; } };
}
