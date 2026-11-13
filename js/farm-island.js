// 마음 텃밭 섬 — 마을 한쪽에서 하루 한 번 밭에서 마음카드를 캐고, 연못에서 낚을 수 있는 곳
// 카드는 스스로를 돌아보는 질문 — 하루에 한 장씩 모으고, 한 줄 답을 적어둘 수 있음
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const MAUM_CARDS = [
  { id: 'q01', tag: '나', text: '요즘 나를 가장 웃게 한 순간은 언제였나요?' },
  { id: 'q02', tag: '감정', text: '오늘 하루를 색깔 하나로 표현한다면 무슨 색인가요?' },
  { id: 'q03', tag: '감정', text: '지금 내 마음에서 가장 큰 자리를 차지한 건 무엇일까요?' },
  { id: 'q04', tag: '관계', text: '요즘 자주 생각나는 사람은 누구인가요? 왜일까요?' },
  { id: 'q05', tag: '나', text: '내가 나에게 자주 하는 말은 어떤 말인가요?' },
  { id: 'q06', tag: '쉼', text: '마음이 편해지는 나만의 장소가 있나요?' },
  { id: 'q07', tag: '성장', text: '최근에 "잘했다" 싶었던 작은 일은 무엇이었나요?' },
  { id: 'q08', tag: '쉼', text: '요즘 나를 지치게 하는 건 무엇인가요? 그중 내려놓을 수 있는 건요?' },
  { id: 'q09', tag: '관계', text: '누군가에게 꼭 듣고 싶었던 말이 있다면 무엇인가요?' },
  { id: 'q10', tag: '성장', text: '1년 전의 나에게 한마디 해준다면?' },
  { id: 'q11', tag: '나', text: '내가 좋아하는 나의 모습 한 가지는 무엇인가요?' },
  { id: 'q12', tag: '쉼', text: '오늘 내 몸은 어떤 신호를 보내고 있나요?' },
  { id: 'q13', tag: '나', text: '혼자 있을 때 나는 주로 무엇을 하나요? 그때 기분은 어때요?' },
  { id: 'q14', tag: '감정', text: '요즘 꺼내지 못하고 미뤄둔 마음이 있나요?' },
  { id: 'q15', tag: '관계', text: '나를 이해해주는 사람에게 고마운 점은 무엇인가요?' },
  { id: 'q16', tag: '감정', text: '화가 날 때, 그 아래에 숨어 있는 진짜 마음은 무엇일까요?' },
  { id: 'q17', tag: '성장', text: '지금 가장 해보고 싶은 건 무엇인가요? 아주 작게라도 시작할 수 있을까요?' },
  { id: 'q18', tag: '나', text: '나에게 "이 정도면 충분해"는 어떤 모습인가요?' },
  { id: 'q19', tag: '성장', text: '최근에 새로 알게 된 나의 모습이 있나요?' },
  { id: 'q20', tag: '쉼', text: '마음이 무거울 때 나를 도와주는 건 무엇인가요?' },
  { id: 'q21', tag: '나', text: '오늘의 나에게 고마운 점을 하나 찾는다면?' },
  { id: 'q22', tag: '관계', text: '기대고 싶은 사람이 있나요? 그 사람에게 먼저 연락해볼 수 있을까요?' },
  { id: 'q23', tag: '감정', text: '요즘 나는 무엇을 걱정하거나 두려워하고 있나요?' },
  { id: 'q24', tag: '성장', text: '10년 뒤의 내가 지금의 나에게 해줄 말은 무엇일까요?' }
];
// 카드 색: 마음카드 탭과 같은 톤 (3D 카드 · 화면 카드 공통)
export const CARD_TINTS = [
  { hex: 0xfbf3e6, css: '#fbf3e6' }, { hex: 0xdfe9dc, css: '#dfe9dc' }, { hex: 0xdce7f2, css: '#dce7f2' },
  { hex: 0xe8dff0, css: '#e8dff0' }, { hex: 0xf8e6c4, css: '#f8e6c4' }, { hex: 0xf7dfe0, css: '#f7dfe0' }
];
export const tintOf = card => CARD_TINTS[(parseInt(card.id.slice(1), 10) || 0) % CARD_TINTS.length];

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, ...o });
const clamp = x => Math.min(1, Math.max(0, x));
const eout = x => 1 - Math.pow(1 - x, 3);
const backOut = x => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// calm: 동작 줄이기 설정이면 카드가 빙글 돌지 않고 곧게 올라옴
export function createFarmIsland({ calm = false } = {}) {
  const spin = calm ? 0 : 1;
  const root = new THREE.Group();
  const add = (geo, m, x, y, z, parent = root) => { const me = new THREE.Mesh(geo, m); me.position.set(x, y, z); parent.add(me); return me; };

  // 섬 바탕
  add(new THREE.CylinderGeometry(3.4, 3.4, 0.4, 64), mat(0x9cc7a4), 0, -0.2, 0);
  const lip = add(new THREE.TorusGeometry(3.4, 0.18, 16, 72), mat(0x9cc7a4), 0, -0.18, 0); lip.rotation.x = Math.PI / 2;
  add(new THREE.CylinderGeometry(3.45, 3.45, 0.34, 64), mat(0xf3e7d3), 0, -0.56, 0);
  add(new THREE.CylinderGeometry(3.4, 1.5, 1.3, 64), mat(0x7a5a43), 0, -1.38, 0);

  // 밭: 흙 두둑 3줄 + 새싹 (빛나는 새싹 하나에서 카드가 나옴)
  const soil = mat(0x9a6b4b);
  [-0.75, 0, 0.75].forEach(z => add(new RoundedBoxGeometry(2.3, 0.22, 0.52, 4, 0.1), soil, -1.25, 0.08, z));
  const sprouts = [];
  const leafM = mat(0x7fb59a), stemM = mat(0x5f9d84);
  [-0.75, 0, 0.75].forEach((z, row) => [-2.0, -1.25, -0.5].forEach((x, col) => {
    const g = new THREE.Group(); g.position.set(x, 0.19, z); root.add(g);
    add(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 10), stemM, 0, 0.1, 0, g);
    [-1, 1].forEach(sd => { const l = add(new THREE.SphereGeometry(0.09, 16, 10), leafM, sd * 0.08, 0.2, 0, g); l.scale.set(1, 0.35, 0.6); l.rotation.z = sd * -0.5; });
    sprouts.push(g);
  }));
  const glowSprout = sprouts[4];
  const glow = add(new THREE.SphereGeometry(0.09, 16, 12), mat(0xffe3a6, { emissive: 0xffc66a, emissiveIntensity: 0.8 }), 0, 0.32, 0, glowSprout);

  // 연못 + 돌 + 낚싯대
  add(new THREE.CylinderGeometry(1.25, 1.25, 0.06, 48), mat(0x8fbfd6, { roughness: 0.3 }), 1.45, 0.03, 0.15);
  for (let i = 0; i < 14; i++) {
    const a = i / 14 * Math.PI * 2;
    const st = add(new THREE.SphereGeometry(0.16 + (i % 3) * 0.03, 16, 10), mat(0xd8cfc2), 1.45 + Math.cos(a) * 1.33, 0.04, 0.15 + Math.sin(a) * 1.33);
    st.scale.set(1, 0.5, 1);
  }
  const lily = add(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 20), mat(0x7fb59a), 1.0, 0.07, -0.4);
  lily.scale.z = 0.9;
  const rodBase = new THREE.Vector3(2.75, 0.05, 1.7);
  add(new THREE.CylinderGeometry(0.12, 0.14, 0.18, 16), mat(0x8b5e3c), rodBase.x, 0.09, rodBase.z);
  const rodTip = new THREE.Vector3(1.75, 1.85, 0.6);
  const rodLen = rodTip.distanceTo(rodBase);
  const rod = add(new THREE.CylinderGeometry(0.02, 0.04, rodLen, 10), mat(0x8b5e3c), 0, 0, 0);
  rod.position.copy(rodBase).lerp(rodTip, 0.5);
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), rodTip.clone().sub(rodBase).normalize());
  const bobberHome = new THREE.Vector3(1.6, 0.1, 0.35);
  const bobber = new THREE.Group(); bobber.position.copy(bobberHome); root.add(bobber);
  add(new THREE.SphereGeometry(0.09, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe57f62), 0, 0, 0, bobber);
  const bb = add(new THREE.SphereGeometry(0.09, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xfffaf2), 0, 0, 0, bobber);
  bb.scale.y = 0.8;
  const lineGeo = new THREE.BufferGeometry().setFromPoints([rodTip, bobberHome]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x5b4636 }));
  root.add(line);
  const ripples = [0, 1].map(() => { const r = add(new THREE.TorusGeometry(0.2, 0.012, 6, 32), mat(0xffffff, { transparent: true, opacity: 0 }), bobberHome.x, 0.07, bobberHome.z); r.rotation.x = Math.PI / 2; return r; });

  // 팻말
  add(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 8), mat(0x8b5e3c), -2.6, 0.35, 1.9);
  const sign = add(new RoundedBoxGeometry(0.75, 0.38, 0.06, 3, 0.03), mat(0xf3e7d3), -2.6, 0.75, 1.92);
  sign.rotation.y = 0.3;

  // 흙 튀는 알갱이 · 물보라
  const bits = [];
  for (let i = 0; i < 10; i++) { const b = add(new THREE.SphereGeometry(0.05, 8, 6), mat(0x9a6b4b), 0, -5, 0); b.visible = false; bits.push(b); }

  // 마음카드 (밭에서 솟거나 연못에서 끌려 올라옴)
  const card = new THREE.Group(); card.visible = false; root.add(card);
  const cardMat = mat(0xfbf3e6, { roughness: 0.6 });
  add(new RoundedBoxGeometry(0.62, 0.86, 0.04, 4, 0.06), cardMat, 0, 0, 0, card);
  const heartM = mat(0xe57f62, { emissive: 0xe57f62, emissiveIntensity: 0.25 });
  const heart = new THREE.Shape();
  heart.moveTo(0, -0.1); heart.bezierCurveTo(-0.16, 0.02, -0.08, 0.14, 0, 0.06); heart.bezierCurveTo(0.08, 0.14, 0.16, 0.02, 0, -0.1);
  [-1, 1].forEach(sd => { const h = add(new THREE.ShapeGeometry(heart), heartM, 0, 0.02, sd * 0.022, card); if (sd < 0) h.rotation.y = Math.PI; });

  let act = null; // { kind:'dig'|'fish', start, phase, tint, onDone, pulled }
  function startDig(tint, onDone) { act = { kind: 'dig', start: -1, tint, onDone }; cardMat.color.setHex(tint); }
  function startFish(tint, onBite, onDone) { act = { kind: 'fish', start: -1, tint, onBite, onDone, pulledAt: -1, bit: false }; cardMat.color.setHex(tint); }
  function pull() { if (act && act.kind === 'fish' && act.bit && act.pulledAt < 0) act.pulledAt = act.now; }
  const busy = () => !!act;

  function reset() {
    card.visible = false;
    glowSprout.position.y = 0.19; glowSprout.rotation.z = 0; glowSprout.visible = true;
    bobber.position.copy(bobberHome);
    bits.forEach(b => (b.visible = false));
    ripples.forEach(r => (r.material.opacity = 0));
  }

  const linePts = lineGeo.attributes.position;
  function update(t) {
    // 평소: 빛나는 새싹이 숨쉬고, 찌가 살랑임
    glow.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
    if (!act) {
      bobber.position.y = bobberHome.y + Math.sin(t * 1.6) * 0.02;
    } else {
      if (act.start < 0) act.start = t;
      act.now = t;
      const e = t - act.start;
      if (act.kind === 'dig') {
        // 0~0.9초 흔들흔들 → 쑥 뽑힘 + 흙 튀김 → 카드가 빙글 솟아오름
        glowSprout.rotation.z = e < 0.9 ? Math.sin(e * 28) * 0.25 * (e / 0.9) : 0;
        if (e >= 0.9) {
          const p = clamp((e - 0.9) / 0.5);
          glowSprout.position.y = 0.19 + eout(p) * 0.5;
          if (p >= 1) glowSprout.visible = false;
          bits.forEach((b, i) => {
            const a = i / bits.length * Math.PI * 2, q = clamp((e - 0.9) / 0.7);
            b.visible = q < 1;
            b.position.set(glowSprout.position.x + Math.cos(a) * q * 0.6, 0.2 + Math.sin(q * Math.PI) * (0.35 + (i % 3) * 0.12), 0 + Math.sin(a) * q * 0.6);
          });
          const c = clamp((e - 1.0) / 1.0);
          card.visible = true;
          card.position.set(glowSprout.position.x, 0.1 + backOut(c) * 1.9, 0);
          card.rotation.set(0, spin * (1 - eout(c)) * Math.PI * 4, 0);
          card.scale.setScalar(0.3 + eout(c) * 1.1);
        }
        if (e > 2.4) { const d = act.onDone; act = null; d && d(); }
      } else {
        // 찌가 살랑 → 2초쯤 톡톡 입질 → "당겨요" 누르면 카드 병이 포물선으로 튀어오름
        const bite = e > 2.0;
        if (bite && !act.bit) { act.bit = true; act.onBite && act.onBite(); }
        if (act.pulledAt < 0) {
          bobber.position.y = bobberHome.y + (bite ? (Math.sin(e * 16) > 0.3 ? -0.07 : 0) : Math.sin(e * 3) * 0.025);
          ripples.forEach((r, i) => {
            const k = ((e * (bite ? 1.6 : 0.7)) + i * 0.5) % 1;
            r.scale.setScalar(0.6 + k * 2.2);
            r.material.opacity = (1 - k) * (bite ? 0.8 : 0.4);
          });
        } else {
          const p = clamp((t - act.pulledAt) / 1.3);
          ripples.forEach(r => (r.material.opacity *= 0.9));
          bobber.position.lerpVectors(bobberHome, rodTip, eout(clamp(p / 0.4)));
          card.visible = true;
          card.position.set(bobberHome.x - p * 0.4, 0.1 + Math.sin(p * Math.PI * 0.75) * 2.6, bobberHome.z + p * 0.3);
          card.rotation.set(0, spin * (1 - p) * Math.PI * 3, spin * (1 - p) * 0.6);
          card.scale.setScalar(0.3 + eout(p) * 1.1);
          if (p >= 1) { bobber.position.copy(bobberHome); const d = act.onDone; act = null; d && d(); }
        }
      }
    }
    linePts.setXYZ(1, bobber.position.x, bobber.position.y + 0.08, bobber.position.z);
    linePts.needsUpdate = true;
  }

  return { root, update, startDig, startFish, pull, busy, reset };
}
