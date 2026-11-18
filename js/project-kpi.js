// 청(소)년 외로움 마음돌봄 프로젝트(2027) 성과 지표 — 사업계획의 목표와 예시 데이터
// 실제 운영에선 서버(Supabase)의 익명 기록으로 같은 계산을 해요.

// 사업계획 2027년 목표
export const TARGETS = {
  selfCheck: 300,   // 자가점검 · 캠페인 참여 시민
  pass: 40,         // 개인별 마음연결 패스 지원
  firstConnect: 28, // 첫 연결 완료 (패스의 70%)
  sustain8: 20,     // 8주 지속 참여 (패스의 50%)
  coordinators: 20, // 마음연결 코디네이터 양성 · 활동
  guardians: 10,    // 보호자 자조모임
  resources: 30     // 실제 연계 가능한 지역 협력자원
};

// 마음연결 단계 (앱 js/care-data.js의 LADDER와 같은 순서)
export const LEVELS = [
  { level: 1, name: '혼자서', eg: '작은 한 걸음' },
  { level: 2, name: '익명으로', eg: '마음 남기기 · 응원' },
  { level: 3, name: '글로', eg: '멘토에게 쪽지' },
  { level: 4, name: '목소리로', eg: '전화 · 채팅' },
  { level: 5, name: '만나서', eg: '멘토 만남 · 공간 동행' }
];

function rng(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

// 예시 데이터: asOf 시점까지의 진행 상황 (사업 기간 2027.1~12)
export function generateMockProject({ asOf = new Date('2027-08-31'), seed = 11 } = {}) {
  const r = rng(seed);
  const month = asOf.getMonth() + 1;              // 1~12
  // 자가점검은 4월 시작, 달마다 조금씩 늘어남
  const checksByMonth = [0, 0, 0, 22, 31, 38, 44, 36, 30, 26, 18, 0];
  const highRate = 0.34;                          // 자가점검에서 외로움이 높게 나온 비율
  // 패스 참여자: 4월부터 순차 등록
  const people = [];
  const passByMonth = [0, 0, 0, 5, 7, 8, 7, 5, 4, 3, 1, 0];
  let id = 0;
  passByMonth.forEach((n, mi) => {
    for (let i = 0; i < n; i++) {
      const startDay = Math.floor(r() * 27) + 1;
      const start = new Date(2027, mi, startDay);
      if (start > asOf) continue;
      const weeksIn = Math.floor((asOf - start) / (7 * 86400000));
      // 사람마다 다다르는 단계가 다름: 대부분 익명·글 단계, 일부만 만남까지
      const x = r();
      const reach = x < 0.12 ? 1 : x < 0.38 ? 2 : x < 0.66 ? 3 : x < 0.84 ? 4 : 5;
      // 단계는 시간이 지나며 올라감 (2주에 한 단계쯤)
      const maxLevel = Math.max(weeksIn >= 1 ? 1 : 0, Math.min(reach, 1 + Math.floor(weeksIn / 2)));
      // 첫 8주 동안 활동한 주 수
      const steady = r() < 0.6;
      const activeWeeks = Math.min(8, weeksIn, Math.round((steady ? 6 + r() * 2 : 2 + r() * 3)));
      const levelWeek = {};
      for (let l = 1; l <= maxLevel; l++) levelWeek[l] = (l - 1) * 2 + (l > 1 ? 1 : 0);
      people.push({ id: ++id, start, weeksIn, maxLevel, activeWeeks, levelWeek });
    }
  });
  const upTo = arr => arr.slice(0, month).reduce((a, b) => a + b, 0);
  return {
    asOf, month,
    selfCheck: upTo(checksByMonth),
    selfCheckHigh: Math.round(upTo(checksByMonth) * highRate),
    checksByMonth: checksByMonth.slice(0, month),
    people,
    coordinators: Math.min(20, month >= 4 ? 14 + Math.max(0, month - 5) : month >= 3 ? 8 : 0),
    guardians: month >= 6 ? Math.min(10, 4 + (month - 6) * 2) : 0,
    resources: Math.min(30, 6 + month * 2)
  };
}

// minLevel: 이 단계 이상이면 '첫 연결'로 셈. 8주 지속: 시작한 지 8주가 지났고 8주 중 6주 이상 활동
export function computeKpis(p, minLevel = 2) {
  const connected = p.people.filter(x => x.maxLevel >= minLevel);
  const due8 = p.people.filter(x => x.weeksIn >= 8);
  const sustained = due8.filter(x => x.activeWeeks >= 6 && x.maxLevel >= minLevel);
  const byLevel = LEVELS.map(l => ({ ...l, n: p.people.filter(x => x.maxLevel === l.level).length }));
  const notYet = p.people.filter(x => x.maxLevel === 0).length;
  // 월별 누적
  const months = [];
  for (let m = 4; m <= p.month; m++) {
    const end = new Date(2027, m, 0, 23, 59, 59);
    const started = p.people.filter(x => x.start <= end);
    const conn = started.filter(x => {
      if (x.maxLevel < minLevel) return false;
      const when = new Date(x.start.getTime() + (x.levelWeek[minLevel] || 0) * 7 * 86400000);
      return when <= end;
    });
    months.push({ label: m + '월', pass: started.length, firstConnect: conn.length });
  }
  return {
    pass: p.people.length,
    firstConnect: connected.length,
    firstRate: p.people.length ? connected.length / p.people.length : 0,
    due8: due8.length,
    sustain8: sustained.length,
    sustainRate: p.people.length ? sustained.length / p.people.length : 0,
    byLevel, notYet, months
  };
}
