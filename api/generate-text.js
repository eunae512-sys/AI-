// 카드뉴스 텍스트 생성 핸들러 (GPT-4o)
// 브랜드 정보 + 캠페인 → 6장 슬라이드 텍스트 (label / title / sub)

const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY || '';
  const isPlaceholder = !apiKey || apiKey.trim() === '' || /^sk-\.+$/.test(apiKey) || apiKey.length < 20;

  const {
    brand = '미옥당 본점',
    industry = '한정식 (음식점)',
    location = '서울 종로구 수송동 · 광화문역 7번 출구 도보 6분',
    campaign = '5월 봄나물 코스 런칭',
    goal = '평일 점심 신규 고객 유입 + 사전 예약 전환',
    target = '30~50대 직장인 + 가족 모임 주최자',
    promotion = '5월 한정 봄나물 코스(시금치·두릅·머위) · 사전예약 시 후식 추가 · 가족 단체석 별도 안내',
    tone = '정성, 고즈넉, 전통, 단정한 존댓말 (~합니다 / 모십니다)',
    forbidden = '최고, 100%, 유일, 대박, 싸고, JMT, 맛집',
    must_say = '한정식, 코스, 한 상',
    slide_count = 6,
    model = process.env.TEXT_MODEL || 'gpt-4o',
  } = req.body || {};

  // 키 없으면 미옥당 봄나물 코스 데모 텍스트 fallback
  if (isPlaceholder) {
    res.json({
      ok: true,
      slides: DEMO_SLIDES,
      flagged: [],
      meta: {
        source: 'demo-fallback',
        demoMode: true,
        model: 'demo',
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice: 'OPENAI_API_KEY 미설정 — 큐레이션된 데모 텍스트로 대체',
      },
    });
    return;
  }

  const startedAt = Date.now();
  const openai = new OpenAI({ apiKey });

  const systemPrompt = `당신은 10년차 한국 광고대행사 AE 겸 카피라이터입니다.
한국 소상공인 광고대행사에서 클라이언트 카드뉴스를 만듭니다.

==== 브랜드 정보 ====
- 브랜드: ${brand}
- 업종: ${industry}
- 위치: ${location}
- 톤: ${tone}
- 금지어 (절대 사용 금지): ${forbidden}
- 필수어 (자연스럽게 포함): ${must_say}

==== 캠페인 ====
- 행사명: ${campaign}
- 광고목표: ${goal}
- 타겟: ${target}
- 프로모션: ${promotion}

==== 출력 규격 ====
인스타그램 카드뉴스 ${slide_count}장의 텍스트.

각 슬라이드는 3개 필드:
- label: 카테고리/번호 (예: "미옥당 · 5월 한정", "02 · 새벽", "06 · 예약")
- title: 큰 헤드라인 (10~25자 권장, 줄바꿈은 \\n)
- sub: 보조/디테일 (15~40자 권장)

슬라이드 역할 순서 (필수):
1. title (표지) — 캠페인 핵심 메시지 한 줄
2. hook (후크) — 감각적 도입, 호기심 유발
3. story (브랜드/스토리) — 신뢰의 근거 (예: 30년 전통)
4. menu (메뉴 1) — 핵심 상품 1
5. menu (메뉴 2) — 핵심 상품 2
6. cta (예약/CTA) — 행동 유도

==== 카피 규칙 ====
1. 한국어, 단정한 존댓말 (~합니다 / ~드립니다 / ~모십니다)
2. 표시광고법/의료광고법 금지어 절대 금지
3. 절제·고즈넉·신뢰의 톤. 영어식 직역 회피
4. 이모지·특수문자 사용 금지 (· 와 줄바꿈만 OK)
5. 매장의 실제 사실(위치·기간·메뉴)을 자연스럽게 녹임
6. AI 클리셰 회피 ("최고의 경험", "특별한 순간" 같은 빈말 금지)

==== 출력 형식 ====
오직 JSON 만 출력. 설명/마크다운 금지.

{
  "slides": [
    { "role": "title", "label": "...", "title": "...", "sub": "..." },
    ...
  ]
}`;

  const userPrompt = `${campaign} 카드뉴스 ${slide_count}장 텍스트를 생성해주세요. 각 슬라이드의 role 은 위 규격 순서대로 정확히 채워주세요.`;

  try {
    const result = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const raw = result.choices?.[0]?.message?.content || '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      res.status(502).json({ ok: false, error: 'GPT 응답 JSON 파싱 실패', raw: raw.slice(0, 500) });
      return;
    }

    const slides = Array.isArray(parsed.slides) ? parsed.slides : [];
    if (slides.length === 0) {
      res.status(502).json({ ok: false, error: 'slides 배열이 비었습니다', raw: raw.slice(0, 500) });
      return;
    }

    // 금지어 사후 검사 (defense-in-depth)
    const forbiddenList = forbidden.split(/[,，]/).map(s => s.trim()).filter(Boolean);
    const flagged = [];
    slides.forEach((s, idx) => {
      const text = `${s.label || ''} ${s.title || ''} ${s.sub || ''}`;
      forbiddenList.forEach(f => {
        if (text.includes(f)) flagged.push({ slide: idx + 1, word: f });
      });
    });

    const latencyMs = Date.now() - startedAt;
    const usage = result.usage || {};

    // 비용 추정 (gpt-4o 2026-05 기준: $2.50 / 1M input, $10 / 1M output)
    // gpt-4o-mini: $0.15 / 1M input, $0.60 / 1M output
    const rates = {
      'gpt-4o':       { in: 2.50,  out: 10.00 },
      'gpt-4o-mini':  { in: 0.15,  out: 0.60 },
    };
    const r = rates[model] || rates['gpt-4o'];
    const costUsd = ((usage.prompt_tokens || 0) * r.in + (usage.completion_tokens || 0) * r.out) / 1_000_000;

    res.json({
      ok: true,
      slides,
      flagged,
      meta: {
        model,
        latencyMs,
        costUsd: Number(costUsd.toFixed(6)),
        costKrw: Math.round(costUsd * 1400),
        usage,
      },
    });
  } catch (e) {
    const message = e?.error?.message || e?.message || String(e);
    const status = e?.status || 500;
    console.error('[text-gen]', status, message);
    res.status(status).json({ ok: false, error: message });
  }
};

// 미옥당 5월 봄나물 코스 데모 슬라이드 (OPENAI_API_KEY 미설정 시)
const DEMO_SLIDES = [
  { role: 'title', label: '미옥당 · 5월 한정',
    title: '5월의 봄나물,\n한 상에 모았습니다',
    sub: '평일 점심 한정 코스 · 종로 수송동' },
  { role: 'hook', label: '02 · 새벽',
    title: '새벽 4시,\n시장에서 골라 온',
    sub: '오늘 한 상에 오를 5월의 봄나물' },
  { role: 'story', label: '03 · 30년',
    title: '종로 수송동,\n30년 한자리',
    sub: '한자리에서 30년, 같은 마음으로 모십니다' },
  { role: 'menu', label: '04 · 코스',
    title: '봄나물 점심 코스\n4종 구성',
    sub: '시금치·두릅·머위로 차린 정갈한 한 상' },
  { role: 'menu', label: '05 · 정찬',
    title: '봄나물 정식 코스\n6종 구성',
    sub: '거래처 점심·가족 모임에 어울리는 정찬' },
  { role: 'cta', label: '06 · 예약',
    title: '평일 점심,\n사전 예약 권장',
    sub: '광화문역 도보 6분 · 단체석 별도 안내' },
];
