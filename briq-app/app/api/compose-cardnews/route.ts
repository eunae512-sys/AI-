// 카드뉴스 자동 구성 — 주제 한 줄 → GPT가 슬라이드 6장 + 페이지별 레이아웃 결정
// 기존 generate-text 는 텍스트만 생성 (label/title/sub).
// compose-cardnews 는 layoutId 까지 결정 → 페이지별 디자인이 달라짐.

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { isPlaceholderKey } from "@/lib/api/demo-images";
import { buildViralMandate, detectCliches, type Voice } from "@/lib/viral/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type Slide = {
  role: string;
  layoutId: "cover" | "quote" | "list" | "process" | "hero" | "cta";
  label: string;
  title: string;
  sub: string;
  body?: string;
  items?: string[];
  footer?: string;
};

const RATES: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10.0 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
};

const DEMO_COMPOSITION: Slide[] = [
  {
    role: "title",
    layoutId: "cover",
    label: "오늘의 시작",
    title: "오늘\n새로 시작합니다",
    sub: "동네에서 만나는 오늘의 한 상",
  },
  {
    role: "hook",
    layoutId: "quote",
    label: "02 · 한 마디",
    title: "단골이 먼저",
    sub: "이 한 입에 다 있어요",
    body: "오랜만에 진짜 한 끼라는 말",
    footer: "— 단골 한 분의 한 마디",
  },
  {
    role: "detail",
    layoutId: "hero",
    label: "03 · 분위기",
    title: "조용한 오후, 같은 자리",
    sub: "한자리에서 오래 이어 온 결",
  },
  {
    role: "menu",
    layoutId: "list",
    label: "04 · 메뉴 구성",
    title: "오늘의 한 상",
    sub: "정갈하게 4종",
    items: [
      "계절 나물 한 접시",
      "솥에서 막 떠낸 한 그릇",
      "오늘의 메인 메뉴",
      "단정한 디저트 한 입",
    ],
  },
  {
    role: "story",
    layoutId: "process",
    label: "05 · 흐름",
    title: "한 상이 차려지는 순서",
    sub: "천천히, 차례로",
    items: ["재료 손질", "정성스레 조리", "마지막 가니쉬"],
  },
  {
    role: "cta",
    layoutId: "cta",
    label: "06 · 방문",
    title: "이번 주말,\n잠깐 들러보세요",
    sub: "운영 시간은 매장에 안내",
    footer: "사전 예약 권장 · 매장 인스타 참고",
  },
];

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const placeholder = isPlaceholderKey(apiKey);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const s = (k: string, fb: string) =>
    typeof body[k] === "string" ? (body[k] as string) : fb;

  const brand = s("brand", "브랜드");
  const industry = s("industry", "소상공인");
  const location = s("location", "한국");
  const topic = s("topic", "");
  const tagline = s("tagline", "");
  const signatureMenu = s("signatureMenu", "");
  const tone = s("tone", "단정한 존댓말, 절제");
  const forbidden = s("forbidden", "100% 보장, 무조건, 최고, 대박, JMT");
  const slideCount = Number(body["slideCount"]) || 6;
  const model = s("model", process.env.TEXT_MODEL || "gpt-4o");
  // 톤 모드 — viral(반말체 바이럴) 이 기본. formal 이면 기존 정중 존댓말.
  const voiceParam = (typeof body["voice"] === "string" ? body["voice"] : "viral") as Voice;
  const voice: Voice = voiceParam === "formal" ? "formal" : "viral";

  if (!topic.trim()) {
    return NextResponse.json(
      { ok: false, error: "topic(주제) 비어있습니다." },
      { status: 400 },
    );
  }

  if (placeholder) {
    return NextResponse.json({
      ok: true,
      slides: DEMO_COMPOSITION.slice(0, slideCount),
      flagged: [],
      meta: {
        source: "demo-fallback",
        demoMode: true,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice: "OPENAI_API_KEY 미설정 — 큐레이션된 데모 구성",
      },
    });
  }

  const taglineLine = tagline ? `- 한 줄 소개: "${tagline}"` : "";
  const menuLine = signatureMenu ? `- 대표 메뉴: ${signatureMenu}` : "";

  const systemPrompt = `당신은 한국 인스타 카드뉴스를 만드는 광고대행사 카피라이터·아트디렉터입니다.
오늘 의뢰받은 작업은 다음 가게의 카드뉴스 ${slideCount}장 전체 구성 (카피 + 페이지별 레이아웃) 결정입니다.

==== 가게 정보 ====
- 브랜드: ${brand}
- 업종: ${industry}
- 위치: ${location}
${taglineLine}
${menuLine}

==== 주제 ====
${topic}

==== 출력 규격 ====
정확히 ${slideCount}장. 각 슬라이드에 다음을 결정:

1) role — 슬라이드 역할
   - title (1장): 카드뉴스 표지
   - hook (1장): 감각적 도입·인용
   - story (1장): 신뢰 근거·이야기
   - menu (1장): 핵심 상품·메뉴
   - detail (1장): 분위기·디테일
   - cta (1장): 행동 유도 (마지막)

2) layoutId — 페이지 레이아웃 (역할에 어울리는 것을 선택)
   - cover: 큰 제목 중앙. **title 슬라이드에만 사용.**
   - quote: 큰따옴표 인용 + em-dash 발언 주체. hook/story 에 적합.
   - hero: 사진 강조 + 짧은 한 줄 캡션. detail 에 적합.
   - list: 3~5개 항목 세로 리스트. menu 슬라이드에 적합.
   - process: 1→2→3 가로 단계. story 또는 detail 에 적합.
   - cta: 큰 행동 유도 + 운영 정보. **cta 슬라이드에만 사용.**

3) 카피 필드 (레이아웃마다 채워야 할 필드가 다름):
   - cover: title(10~20자, \\n 줄바꿈 OK), sub(12~28자)
   - quote: body(20~36자, 인용문), footer("— 단골 한 분" 등 발언 주체)
   - hero: title(짧은 한 줄, 12~22자)
   - list: title(8~14자), items(3~5개, 각 6~14자)
   - process: title(8~14자), items(3개, 각 6~12자 — "재료 손질" 같은 단계명)
   - cta: title(10~22자), sub(12~28자), footer(12~28자, 운영 정보)

label 은 모든 슬라이드 공통: "01 · 표지", "02 · 후크" 같은 2~10자 카테고리·번호.

==== 절대 규칙 ====
1. 톤: ${tone}
2. 사용자 명시 금지어 (절대 사용 금지): ${forbidden}
3. 이모지·해시태그·마크다운 금지. \\n 줄바꿈만 OK.
4. 슬라이드 간 반복 금지 — 같은 단어가 여러 슬라이드의 title 에 등장하지 말 것.
5. 주제 (${topic}) 의 맥락을 잃지 말 것. 모든 슬라이드가 이 주제와 연결되어야 함.

${buildViralMandate({ voice, platform: "general" })}

==== 출력 형식 ====
오직 JSON 만 출력. 설명·마크다운 금지.

{
  "slides": [
    {
      "role": "title",
      "layoutId": "cover",
      "label": "01 · 표지",
      "title": "...",
      "sub": "..."
    },
    {
      "role": "hook",
      "layoutId": "quote",
      "label": "02 · 후크",
      "title": "",
      "sub": "",
      "body": "...",
      "footer": "..."
    },
    ...정확히 ${slideCount}개...
  ]
}`;

  const userPrompt = `위 규격대로 "${topic}" 카드뉴스 ${slideCount}장 구성 JSON 을 만들어 주세요. ${brand}(${industry}) 의 실제 상황에 맞게, 슬라이드마다 layoutId 를 다르게 선택해 시각적으로 변화 있는 구성으로.`;

  const startedAt = Date.now();
  const openai = new OpenAI({ apiKey });

  try {
    const result = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });
    const raw = result.choices?.[0]?.message?.content ?? "{}";
    let parsed: { slides?: Slide[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: "GPT JSON 파싱 실패", raw: raw.slice(0, 500) },
        { status: 502 },
      );
    }

    const slides = Array.isArray(parsed.slides) ? parsed.slides : [];
    if (slides.length === 0) {
      return NextResponse.json(
        { ok: false, error: "slides 비었음", raw: raw.slice(0, 500) },
        { status: 502 },
      );
    }

    const forbiddenList = forbidden.split(/[,，]/).map((x) => x.trim()).filter(Boolean);
    const flagged: { slide: number; word: string; kind: "forbidden" | "cliche" }[] = [];
    slides.forEach((sl, idx) => {
      const text = [sl.label, sl.title, sl.sub, sl.body, sl.footer, ...(sl.items ?? [])]
        .filter(Boolean)
        .join(" ");
      forbiddenList.forEach((f) => {
        if (text.includes(f)) flagged.push({ slide: idx + 1, word: f, kind: "forbidden" });
      });
      // viral 모드일 때만 cliché 추가 검사 (formal 모드는 정중체 자체가 클리셰 일부 허용)
      if (voice === "viral") {
        const cliches = detectCliches(text);
        cliches.forEach((c) => flagged.push({ slide: idx + 1, word: c, kind: "cliche" }));
      }
    });

    const latencyMs = Date.now() - startedAt;
    const usage = result.usage || ({} as { prompt_tokens?: number; completion_tokens?: number });
    const r = RATES[model] || RATES["gpt-4o"];
    const costUsd =
      ((usage.prompt_tokens || 0) * r.in + (usage.completion_tokens || 0) * r.out) / 1_000_000;

    return NextResponse.json({
      ok: true,
      slides,
      flagged,
      meta: {
        source: "openai",
        model,
        voice,
        latencyMs,
        costUsd: Number(costUsd.toFixed(6)),
        costKrw: Math.round(costUsd * 1400),
        usage,
      },
    });
  } catch (e) {
    const err = e as { message?: string; status?: number };
    return NextResponse.json(
      { ok: false, error: err?.message || String(e) },
      { status: err?.status || 500 },
    );
  }
}
