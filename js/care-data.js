// 마음서랍 돌봄 설정 — 센터가 바꿀 수 있는 내용을 한 파일에 모음
// (외로움 척도 · 작은 한 걸음 · 마음연결 단계)

// ===== 외로움 척도 =====
// 척도를 바꾸려면: 아래에 새 척도를 추가하고 ACTIVE_SCALE 값을 그 key로 바꾸면 돼요.
//   questions: 문항 / options: [보기, 점수] / bands: 점수 구간별 결과 문구 (max 이하이면 그 구간)
//   high: 이 점수 이상이면 '외로움 높음'으로 보고 마음연결을 먼저 안내
export const SCALES = {
  quick3: {
    key: 'quick3',
    name: '빠른 마음체크 (3문항)',
    note: 'UCLA 외로움 척도 3문항형을 쉬운 말로 옮긴 것 — 센터 확인 필요',
    questions: [
      '곁에 함께할 사람이 없다고 느낄 때가 있나요?',
      '다른 사람들 사이에서 나만 빠져 있는 느낌이 드나요?',
      '사람들과 떨어져 혼자인 것 같다고 느끼나요?'
    ],
    options: [['거의 없어요', 1], ['가끔 있어요', 2], ['자주 있어요', 3]],
    high: 6,
    bands: [
      { max: 4, icon: '☀️', title: '지금 마음은 비교적 맑은 편이에요', text: '이 마음을 오래 지킬 수 있도록 마음서랍이 곁에 있을게요.' },
      { max: 6, icon: '⛅', title: '가끔 혼자라고 느끼는 때가 있군요', text: '누구나 그런 날이 있어요. 마음서랍에서 천천히 마음을 돌봐봐요.' },
      { max: 99, icon: '🌧️', title: '요즘 많이 외로웠겠어요', text: '말해줘서 고마워요. 혼자 버티지 않아도 돼요. 마음연결에서 아주 작은 것부터 골라볼 수 있어요.' }
    ]
  }
  // 예) 센터 척도를 쓰려면 이렇게 추가:
  // center: { key: 'center', name: '센터 외로움 척도', questions: [...], options: [['전혀 아니다', 0], ...], high: 12, bands: [...] }
};
export const ACTIVE_SCALE = 'quick3';
export const activeScale = () => SCALES[ACTIVE_SCALE];
export const bandOfScore = (scale, score) => scale.bands.find(b => score <= b.max) || scale.bands[scale.bands.length - 1];

// ===== 오늘의 작은 한 걸음 =====
// 사람을 만나지 않아도 할 수 있는 것부터. parts: 더 잘게 쪼갠 순서 (센터 상담사 감수 필요)
export const STEP_GROUPS = [
  { key: 'wake', name: '일어나요', icon: '🌅' },
  { key: 'rest', name: '쉬어가요', icon: '🍃' },
  { key: 'out', name: '나가봐요', icon: '🚶' },
  { key: 'link', name: '연결해요', icon: '💬' },
  { key: 'grow', name: '해봐요', icon: '🌱' }
];
export const STEPS = [
  { id: 's01', group: 'wake', title: '물 한 컵 마시기', parts: ['컵 꺼내기', '물 따르기', '천천히 마시기'] },
  { id: 's02', group: 'wake', title: '창문 열고 바람 쐬기', parts: ['창문 열기', '숨 세 번 크게 쉬기', '5분 뒤 닫기'] },
  { id: 's03', group: 'wake', title: '이불 개기', parts: ['일어나 앉기', '이불 펴기', '반으로 접기'] },
  { id: 's04', group: 'rest', title: '기지개 켜기', parts: ['팔 위로 뻗기', '5초 버티기', '숨 내쉬기'] },
  { id: 's05', group: 'rest', title: '좋아하는 노래 한 곡 듣기', parts: ['노래 고르기', '눈 감고 듣기'] },
  { id: 's06', group: 'rest', title: '따뜻한 물로 세수하기', parts: ['물 온도 맞추기', '세수하기', '수건으로 닦기'] },
  { id: 's07', group: 'out', title: '현관문 열고 바깥 공기 맡기', parts: ['신발 신기', '문 열기', '10초 서 있기'] },
  { id: 's08', group: 'out', title: '집 앞 한 바퀴 걷기', parts: ['옷 갈아입기', '밖으로 나가기', '집 앞 한 바퀴'] },
  { id: 's09', group: 'out', title: '편의점 다녀오기', parts: ['살 것 하나 정하기', '다녀오기'] },
  { id: 's10', group: 'link', title: '안 읽은 메시지 하나 확인하기', parts: ['메신저 열기', '하나만 읽기'] },
  { id: 's11', group: 'link', title: '마음 마을에 응원 하나 보내기', parts: ['마을 가기', '한 명 고르기', '응원 누르기'], go: 'village' },
  { id: 's12', group: 'link', title: '고마웠던 사람 한 명 떠올리기', parts: ['눈 감기', '한 명 떠올리기', '고마운 점 한 가지'] },
  { id: 's13', group: 'grow', title: '내일 할 일 하나 정하기', parts: ['종이나 메모앱 열기', '하나만 적기'] },
  { id: 's14', group: 'grow', title: '책상 위 물건 세 개 치우기', parts: ['세 개 고르기', '제자리에 두기'] },
  { id: 's15', group: 'grow', title: '오늘 마음 쪽지 쓰기', parts: ['일기 서랍 열기', '한 줄 쓰기'], go: 'diary' }
];

// ===== 마음연결 단계: 작은 것부터, 스스로 고르기 =====
// level 1(혼자서) → 5(직접 만나기). 어느 단계에서 멈춰도 괜찮고, 건너뛰어도 돼요.
export const LADDER = [
  { level: 1, key: 'step',   icon: '🌱', title: '혼자서 작은 한 걸음', text: '아무도 만나지 않아도 돼요. 물 한 컵, 창문 열기부터.', cta: '걸음 고르기' },
  { level: 2, key: 'post',   icon: '🚩', title: '익명으로 마음 남기기', text: '마음 마을에 별명으로 한 줄. 같은 날씨 친구들이 있어요.', cta: '마을로 가기' },
  { level: 2, key: 'cheer',  icon: '🤗', title: '응원 하나 보내기', text: '말하지 않아도 돼요. 정해진 응원을 누르기만 하면 돼요.', cta: '마을로 가기' },
  { level: 3, key: 'note',   icon: '✉️', title: '멘토에게 글로 쪽지 보내기', text: '얼굴도 목소리도 없이 글로만. 답장은 서랍으로 와요.', cta: '쪽지 쓰기' },
  { level: 4, key: 'talk',   icon: '📞', title: '멘토와 전화 · 채팅으로 이야기하기', text: '만나지 않고 이야기해요. 원하는 시간과 방법을 고를 수 있어요.', cta: '신청하기' },
  { level: 5, key: 'meet',   icon: '🤝', title: '멘토와 만나기 · 공간에 함께 가보기', text: '혼자 가기 어려우면 멘토가 처음 한 번 같이 가요.', cta: '신청하기' }
];
export const LEVEL_NAMES = { 1: '혼자서', 2: '익명으로', 3: '글로', 4: '목소리로', 5: '만나서' };
