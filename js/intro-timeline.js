// 마음서랍 소개영상 타임라인 — 시간 t(초)를 넣으면 클레이 세계와 카메라를 그 순간 장면으로 맞춤
// 소개 영상 페이지(intro-video.html)와 앱 첫 실행 화면(app-prototype.html)이 같이 씀
import * as THREE from 'three';

export const INTRO_DUR = 23;

export const CAPTIONS = [
  { a: 0.6,  b: 4.8,  text: ['당신의 오늘 하루는', '어땠나요?'] },
  { a: 5.4,  b: 9.2,  text: ['말하지 못한 마음,', '남아 있나요?'] },
  { a: 9.6,  b: 13.6, text: ['쪽지에 살짝 적어서'] },
  { a: 14.0, b: 17.8, text: ['마음서랍에', '넣어두세요.'] }
];

// 엔딩 로고 · 부제 · 기관명이 나타나기 시작하는 시점
export const ENDING = { logo: 19.0, sub: 19.7, credit: 20.3 };

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const eio = x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const eout = x => 1 - Math.pow(1 - x, 3);
const back = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, x) => a + (b - a) * x;
const pulse = (t, a, d) => Math.sin(seg(t, a, a + d) * Math.PI);

// 9:16 세로 화면 기준으로 잡은 카메라 동선
const CAM = [
  { t: 0,    R: 33, e: 0.42, a: 0.62, x: 0,    y: 1.0,  z: -0.2 },
  { t: 5.0,  R: 33, e: 0.42, a: 0.44, x: 0,    y: 1.0,  z: -0.2 },
  { t: 8.6,  R: 18, e: 0.32, a: 0.34, x: 0.55, y: 0.95, z: 0.7 },
  { t: 13.6, R: 17, e: 0.30, a: 0.27, x: 0.7,  y: 1.0,  z: 0.6 },
  { t: 15.0, R: 19, e: 0.40, a: 0.50, x: 0.75, y: 1.15, z: -1.1 },
  { t: 18.0, R: 19.5, e: 0.40, a: 0.52, x: 0.75, y: 1.15, z: -1.1 },
  { t: 21.0, R: 39, e: 0.46, a: 0.64, x: 0,    y: 3.4,  z: -0.3 },
  { t: INTRO_DUR, R: 39, e: 0.46, a: 0.66, x: 0, y: 3.4, z: -0.3 }
];
function camAt(t) {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1].t) i++;
  const A = CAM[i], B = CAM[i + 1], p = eio(seg(t, A.t, B.t));
  const k = {};
  ['R', 'e', 'a', 'x', 'y', 'z'].forEach(n => (k[n] = lerp(A[n], B[n], p)));
  return k;
}

export function createIntro(world, camera) {
  const { drawers, M, body, setEyes, lampLight, gardenBulb, cloud, paperG, topPivot, lines, CH, FLOOR, frontZ } = world;
  const PAPER_HOME = new THREE.Vector3(1.45, 1.3, 1.55);
  const PAPER_DEST = new THREE.Vector3(CH.x, FLOOR + CH.h - 0.33 - 0.44 + 0.16, frontZ + 0.15);
  const PAPER_CTRL = new THREE.Vector3(0.9, 2.7, 0.5);
  const target = new THREE.Vector3();
  const cloudHome = new THREE.Vector3();

  // aspect: 실제 화면 가로/세로 비율. 9:16보다 좁은 폰에서도 섬이 잘리지 않게 거리를 늘림
  function update(t, aspect = 9 / 16) {
    const c = camAt(t);
    const R = c.R * Math.max(1, (9 / 16) / aspect);
    target.set(c.x, c.y, c.z);
    camera.position.set(target.x + R * Math.cos(c.e) * Math.sin(c.a), target.y + R * Math.sin(c.e), target.z + R * Math.cos(c.e) * Math.cos(c.a));
    camera.lookAt(target);

    // 마스코트: 처음엔 눈 감고 쉬다가 → 깨어나고 → 쪽지를 넣은 뒤 기뻐함
    const wake = 5.6, joy = 16.2;
    const jump = 0.22 * pulse(t, wake, 0.55) + 0.32 * pulse(t, joy, 0.6) + 0.18 * pulse(t, joy + 0.65, 0.45);
    const breathe = Math.sin(t * 2.2) * (t < wake ? 0.03 : 0.018);
    M.position.y = 0.06 + jump;
    body.scale.set(1 - breathe * 0.5, 0.82 * (1 + breathe), 0.92);
    M.rotation.z = t < wake ? Math.sin(t * 1.1) * 0.06 : t > 19 ? Math.sin((t - 19) * 7) * 0.1 * (1 - seg(t, 21, 22.5)) : 0;
    M.rotation.x = lerp(0, 0.16, seg(t, 6.4, 7.0)) * (1 - seg(t, 9.6, 10.2));
    setEyes(t < wake ? 'sleepy' : (t > joy - 0.1 ? 'happy' : 'open'));
    if (t >= wake && t < joy && (t % 3.2) < 0.12) setEyes('sleepy');

    // 고민 구름 → 쪽지 속으로
    const cloudIn = back(seg(t, 6.2, 6.8));
    const toPaper = eio(seg(t, 10.2, 11.2));
    cloud.visible = t > 6.2 && t < 11.25;
    cloudHome.set(0.35, 2.05 + Math.sin(t * 1.6) * 0.05, 1.3);
    cloud.position.lerpVectors(cloudHome, PAPER_HOME, toPaper);
    cloud.scale.setScalar(Math.max(0.0001, 1.7 * cloudIn * (1 - toPaper)));

    // 쪽지 등장 → 글줄 → 접기 → 서랍으로 날아감
    const pop = back(seg(t, 9.6, 10.15));
    const fold = eio(seg(t, 11.5, 12.3));
    const u = eio(seg(t, 14.6, 15.7));
    paperG.visible = t > 9.6 && t < 15.75;
    lines.forEach((l, i) => { l.scale.x = Math.max(0.001, eout(seg(t, 10.8 + i * 0.25, 11.2 + i * 0.25))); });
    topPivot.rotation.x = -3.06 * fold;
    const hover = Math.sin(t * 2) * 0.04 * (1 - u);
    paperG.position.set(
      (1 - u) * (1 - u) * PAPER_HOME.x + 2 * (1 - u) * u * PAPER_CTRL.x + u * u * PAPER_DEST.x,
      (1 - u) * (1 - u) * PAPER_HOME.y + 2 * (1 - u) * u * PAPER_CTRL.y + u * u * PAPER_DEST.y + hover,
      (1 - u) * (1 - u) * PAPER_HOME.z + 2 * (1 - u) * u * PAPER_CTRL.z + u * u * PAPER_DEST.z
    );
    paperG.scale.setScalar(Math.max(0.0001, pop * lerp(1.5, 0.55, u)));
    paperG.rotation.set(lerp(-0.1, -1.4, u), lerp(0.32, -0.2, u), lerp(0, 0.5, u) + Math.sin(t * 1.7) * 0.05 * (1 - u));

    // 서랍: 일기 서랍이 열렸다 닫힘, 마지막에 이름표가 차례로 빛남
    const open = eout(seg(t, 14.0, 14.6)) * (1 - eio(seg(t, 15.8, 16.4)));
    drawers.forEach((d, i) => {
      d.g.position.z = frontZ + (i === 1 ? open * 0.55 : 0);
      const glowEnd = eout(seg(t, 18.2 + i * 0.3, 18.8 + i * 0.3)) * 0.85;
      const diaryGlow = i === 1 ? Math.max(pulse(t, 16.0, 1.2), seg(t, 17.0, 17.5) * 0.55) : 0;
      d.labelMat.emissiveIntensity = Math.max(glowEnd, diaryGlow);
    });

    lampLight.intensity = 7 + Math.sin(t * 9) * 0.25;
    gardenBulb.material.emissiveIntensity = 0.4 + seg(t, 18.3, 19.2) * 1.4;
  }

  // 영상이 끝나거나 건너뛴 뒤, 홈 화면에서 쓰는 평소 상태로 되돌림
  function reset() {
    cloud.visible = false;
    paperG.visible = false;
    topPivot.rotation.x = 0;
    lines.forEach(l => { l.scale.x = 1; });
    drawers.forEach(d => { d.g.position.z = frontZ; d.labelMat.emissiveIntensity = 0; });
    M.position.y = 0.06;
    M.rotation.x = 0;
    M.rotation.z = 0;
    body.scale.set(1, 0.82, 0.92);
    setEyes('open');
    gardenBulb.material.emissiveIntensity = 0.4;
  }

  return { update, reset };
}

// 자막/엔딩 글자의 투명도·위로 떠오르는 거리 (영상 캔버스와 앱 화면이 같은 리듬을 쓰도록)
export function captionState(t, c) {
  const alpha = eout(seg(t, c.a, c.a + 0.45)) * (1 - seg(t, c.b - 0.4, c.b));
  const rise = (1 - eout(seg(t, c.a, c.a + 0.6))) * 18;
  return { alpha, rise };
}
