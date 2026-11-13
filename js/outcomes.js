// 마음서랍 성과 지표 — 외로움 점수(0~30, tests/loneliness.html 기준)로 해소율 등을 계산
// 지금은 예시 참여자(mock)로 계산하고, 실제 서비스에선 generateMockCohort 대신 서버 데이터를 넣으면 됨

export const TARGET_RATE = 0.2;

// 외로움 검사 결과 구간 (tests/loneliness.html의 bands와 같음). 색은 검증한 청록 단색 4단계
export const BANDS = [
  { max: 7,  name: '연결감 좋음',   short: '좋음', color: '#86bba4' },
  { max: 15, name: '가끔 외로움',   short: '가끔', color: '#55997f' },
  { max: 23, name: '자주 외로움',   short: '자주', color: '#2f7d66' },
  { max: 30, name: '많이 외로움',   short: '많이', color: '#164f40' }
];
export const bandOf = score => BANDS.findIndex(b => score <= b.max);

// 해소 정의: 사전 점수가 8점 이상(가끔 외로움 이상)인 사람 중, 가장 최근 사후 측정의 구간이 한 단계 이상 내려간 경우
export const ELIGIBLE_MIN = 8;

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const DAY = 86400000;

// 예시 참여자: 2026년 6~10월에 시작, 4주마다 다시 측정, 매 회차 일부는 응답하지 않고 이탈
export function generateMockCohort({ n = 240, seed = 7, now = new Date('2026-11-13') } = {}) {
  const r = rng(seed);
  const gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const start = new Date('2026-06-01').getTime();
  const people = [];
  for (let i = 0; i < n; i++) {
    const joined = start + Math.floor(r() * 150) * DAY;
    const engagement = Math.min(20, Math.max(0, Math.round(r() * r() * 22)));  // 한 달 평균 기록 횟수
    let score = Math.round(Math.min(30, Math.max(0, 14 + gauss() * 6.5)));
    const measures = [{ ts: joined, score }];
    for (let k = 1; k < 6; k++) {
      const ts = joined + k * 28 * DAY;
      if (ts > now.getTime()) break;
      if (r() < 0.22) break;
      score = Math.round(Math.min(30, Math.max(0, score + 0.3 - engagement * 0.08 + (13 - score) * 0.012 + gauss() * 1.7)));
      measures.push({ ts, score });
    }
    people.push({ id: 'p' + i, joined, engagement, measures });
  }
  return people;
}

function rateAt(people, untilTs) {
  let followed = 0, resolved = 0;
  people.forEach(p => {
    const base = p.measures[0];
    if (base.ts > untilTs || base.score < ELIGIBLE_MIN) return;
    const later = p.measures.slice(1).filter(m => m.ts <= untilTs);
    if (!later.length) return;
    followed++;
    if (bandOf(later[later.length - 1].score) < bandOf(base.score)) resolved++;
  });
  return { followed, resolved, rate: followed ? resolved / followed : 0 };
}

export function computeOutcomes(people, now = new Date('2026-11-13')) {
  const nowTs = now.getTime();
  const eligible = people.filter(p => p.measures[0].score >= ELIGIBLE_MIN);
  const followedP = eligible.filter(p => p.measures.length > 1);
  const resolvedP = followedP.filter(p => bandOf(p.measures[p.measures.length - 1].score) < bandOf(p.measures[0].score));
  const avgChange = followedP.length
    ? followedP.reduce((s, p) => s + (p.measures[p.measures.length - 1].score - p.measures[0].score), 0) / followedP.length
    : 0;

  // 월말마다 그 시점까지의 누적 해소율
  const trend = [];
  for (let m = 6; m <= now.getMonth() + 1; m++) {
    const end = Math.min(new Date(2026, m, 0, 23, 59).getTime(), nowTs);
    trend.push({ label: `${m}월`, ...rateAt(people, end) });
  }

  // 사전 → 최근 구간 분포 (사후까지 응답한 대상자 기준)
  const before = BANDS.map(() => 0), after = BANDS.map(() => 0);
  followedP.forEach(p => { before[bandOf(p.measures[0].score)]++; after[bandOf(p.measures[p.measures.length - 1].score)]++; });

  // 참여 정도별 해소율 (상관관계일 뿐 원인이라고 단정할 수 없음)
  const groups = [
    { name: '가끔 (월 0~3회)', test: e => e <= 3 },
    { name: '보통 (월 4~9회)', test: e => e >= 4 && e <= 9 },
    { name: '꾸준히 (월 10회 이상)', test: e => e >= 10 }
  ].map(g => {
    const ps = followedP.filter(p => g.test(p.engagement));
    const res = ps.filter(p => resolvedP.includes(p)).length;
    return { name: g.name, n: ps.length, resolved: res, rate: ps.length ? res / ps.length : 0 };
  });

  // 지금 구간 분포 (모든 참여자의 가장 최근 점수) — "나의 위치"용
  const current = BANDS.map(() => 0);
  people.forEach(p => current[bandOf(p.measures[p.measures.length - 1].score)]++);

  return {
    participants: people.length,
    eligible: eligible.length,
    followed: followedP.length,
    resolved: resolvedP.length,
    rate: followedP.length ? resolvedP.length / followedP.length : 0,
    responseRate: eligible.length ? followedP.length / eligible.length : 0,
    avgChange,
    trend, before, after, groups, current,
    resolvedIds: new Set(resolvedP.map(p => p.id))
  };
}

// 나의 기록 예시 (실제로는 이 기기에서 한 외로움 검사 결과를 씀)
export const MOCK_ME = {
  measures: [
    { ts: new Date('2026-09-01').getTime(), score: 19 },
    { ts: new Date('2026-09-29').getTime(), score: 17 },
    { ts: new Date('2026-10-27').getTime(), score: 13 }
  ]
};
