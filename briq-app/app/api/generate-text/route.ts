import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { isPlaceholderKey } from "@/lib/api/demo-images";
import { buildViralMandate, detectCliches, type Voice } from "@/lib/viral/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

type Slide = { role: string; label: string; title: string; sub: string };

const DEMO_SLIDES: Slide[] = [
  {
    role: "title",
    label: "미옥당 · 5월 한정",
    title: "5월의 봄나물,\n한 상에 모았습니다",
    sub: "평일 점심 한정 코스 · 종로 수송동",
  },
  {
    role: "hook",
    label: "02 · 새벽",
    title: "새벽 4시,\n시장에서 골라 온",
    sub: "오늘 한 상에 오를 5월의 봄나물",
  },
  {
    role: "story",
    label: "03 · 30년",
    title: "종로 수송동,\n30년 한자리",
    sub: "한자리에서 30년, 같은 마음으로 모십니다",
  },
  {
    role: "menu",
    label: "04 · 코스",
    title: "봄나물 점심 코스\n4종 구성",
    sub: "시금치·두릅·머위로 차린 정갈한 한 상",
  },
  {
    role: "menu",
    label: "05 · 정찬",
    title: "봄나물 정식 코스\n6종 구성",
    sub: "거래처 점심·가족 모임에 어울리는 정찬",
  },
  {
    role: "cta",
    label: "06 · 예약",
    title: "평일 점심,\n사전 예약 권장",
    sub: "광화문역 도보 6분 · 단체석 별도 안내",
  },
];

const RATES: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10.0 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const placeholder = isPlaceholderKey(apiKey);

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const s = (k: string, fallback: string) =>
    typeof body[k] === "string" ? (body[k] as string) : fallback;
  const n = (k: string, fallback: number) =>
    typeof body[k] === "number" ? (body[k] as number) : fallback;

  // 모든 디폴트는 업종 중립적으로 — 클라이언트가 industry-specific 컨텍스트를 넘기지 않으면
  // GPT 가 "${industry}" 만 보고 알맞게 작성하도록 (기존엔 한정식 디폴트가 들어가 다른 업종 결과가 어색했음)
  const brand = s("brand", "브랜드");
  const industry = s("industry", "소상공인");
  const location = s("location", "한국");
  const campaign = s("campaign", "신규 캠페인");
  const goal = s("goal", "신규 고객 유입 + 전환");
  const target = s("target", "20~50대 일반 소비자");
  const promotion = s("promotion", "시즌 한정 콘텐츠 · 사전 안내");
  const tone = s("tone", "단정한 존댓말, 절제, 신뢰");
  const forbidden = s("forbidden", "최고, 100%, 유일, 대박, JMT, 맛집");
  const must_say = s("must_say", "");
  const slide_count = n("slide_count", 6);
  const model = s("model", process.env.TEXT_MODEL || "gpt-4o");
  // viral 톤이 기본 — 카드뉴스/스레드 모두 동일
  const voiceParam = (typeof body["voice"] === "string" ? body["voice"] : "viral") as Voice;
  const voice: Voice = voiceParam === "formal" ? "formal" : "viral";

  if (placeholder) {
    return NextResponse.json({
      ok: true,
      slides: DEMO_SLIDES,
      flagged: [],
      meta: {
        source: "demo-fallback",
        demoMode: true,
        model: "demo",
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice: "OPENAI_API_KEY 미설정 — 큐레이션된 데모 텍스트로 대체",
      },
    });
  }

  const startedAt = Date.now();
  const openai = new OpenAI({ apiKey });

  // 슬라이드 역할 — slide_count 에 맞춰 자동 구성
  // 6장: title / hook / story / menu / menu / cta
  // 4~5장: title / hook / story / menu / cta
  // 7~10장: title / hook / story / menu / menu / detail / detail / ... / cta
  const buildRoles = (count: number): string[] => {
    if (count <= 4) return ["title", "hook", "story", "cta"].slice(0, count);
    if (count === 5) return ["title", "hook", "story", "menu", "cta"];
    if (count === 6) return ["title", "hook", "story", "menu", "menu", "cta"];
    const mid: string[] = ["title", "hook", "story"];
    const middleCount = count - 4;
    for (let i = 0; i < middleCount; i++) mid.push(i < 2 ? "menu" : "detail");
    mid.push("cta");
    return mid;
  };
  const roles = buildRoles(slide_count);
  const roleGuide = roles.map((r, i) => `${i + 1}. ${r}`).join("\n");

  const systemPrompt = `당신은 10년차 한국 광고대행사 AE 겸 카피라이터입니다.
한국 소상공인 광고대행사에서 클라이언트의 인스타그램 카드뉴스를 만듭니다.

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
인스타그램 카드뉴스 정확히 ${slide_count}장.

각 슬라이드는 3개 필드:
- label: 카테고리·번호 (예: "${brand} · 시즌", "02 · 후크", "${slide_count.toString().padStart(2, "0")} · 예약") — 2~12자
- title: 큰 헤드라인. 10~22자. 두 줄까지 가능 (줄바꿈은 \\n 사용)
- sub: 보조 디테일. 12~36자. 한 문장으로 마침

슬라이드 역할 순서 (정확히 이대로):
${roleGuide}

역할 설명:
- title: 표지. 캠페인 핵심 메시지 한 줄. "${brand}" 이름·업종이 자연스럽게 보이게.
- hook: 감각적 도입. 시간·장면·소재 묘사. 광고티 X.
- story: 신뢰 근거. 매장의 사실(연차·위치·생산지·운영방식). 모르는 사실은 만들지 말 것.
- menu: 핵심 상품·메뉴. 슬라이드 간 반드시 서로 다른 상품을 다룰 것.
- detail: 부가 디테일 (분위기·픽업/예약 안내·접근성). menu 와 겹치면 안 됨.
- cta: 예약·문의·방문 행동 유도. 운영시간·예약 채널 안내.

==== 절대 규칙 ====
1. 한국어 단정한 존댓말 (~합니다 / ~드립니다 / ~모십니다)
2. 표시광고법/의료광고법 금지어 사용 금지
3. 절제·신뢰의 톤. 영어식 직역·AI 클리셰 금지 ("최고의 경험", "특별한 순간", "잊지 못할" 등 빈말 금지)
4. 이모지·특수문자 금지 (· 와 줄바꿈만 OK)
5. **반복 금지** — title, sub, label 어느 필드든 이전 슬라이드와 같거나 비슷한 표현을 쓰지 말 것. 같은 단어가 여러 슬라이드에 나오면 다른 맥락으로만.
6. **사실 추정 금지** — 알려주지 않은 가격·시간·메뉴명·인증·전화번호를 만들어 쓰지 말 것. 모르면 일반 표현 ("사전 예약 권장", "운영시간 안내" 등) 으로 대체.
7. **업종 일관성** — 위 "업종: ${industry}" 에서 벗어난 표현 금지 (예: 카페면 한정식 표현 금지).
8. label 은 슬라이드마다 반드시 달라야 함 (번호 포함).

==== 출력 형식 ====
오직 JSON 만 출력. 설명·마크다운 금지.

{
  "slides": [
    { "role": "title", "label": "...", "title": "...", "sub": "..." },
    ...정확히 ${slide_count}개...
  ]
}

${buildViralMandate({ voice, platform: "general" })}`;

  const userPrompt = `위 규격에 따라 "${campaign}" 카드뉴스 ${slide_count}장의 JSON 을 생성해 주세요. 각 슬라이드는 위 역할 순서대로 role 을 정확히 채우고, 슬라이드 간 내용 반복이 없도록 해 주세요. ${brand}(${industry}) 의 실제 상황에 맞는 카피를 써 주세요.`;

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

    const raw = result.choices?.[0]?.message?.content || "{}";
    let parsed: { slides?: Slide[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: "GPT 응답 JSON 파싱 실패", raw: raw.slice(0, 500) },
        { status: 502 },
      );
    }

    const slides = Array.isArray(parsed.slides) ? parsed.slides : [];
    if (slides.length === 0) {
      return NextResponse.json(
        { ok: false, error: "slides 배열이 비었습니다", raw: raw.slice(0, 500) },
        { status: 502 },
      );
    }

    const forbiddenList = forbidden
      .split(/[,，]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const flagged: { slide: number; word: string; kind?: "forbidden" | "cliche" }[] = [];
    slides.forEach((sl, idx) => {
      const text = `${sl.label || ""} ${sl.title || ""} ${sl.sub || ""}`;
      forbiddenList.forEach((f) => {
        if (text.includes(f)) flagged.push({ slide: idx + 1, word: f, kind: "forbidden" });
      });
      if (voice === "viral") {
        detectCliches(text).forEach((c) =>
          flagged.push({ slide: idx + 1, word: c, kind: "cliche" }),
        );
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
        latencyMs,
        costUsd: Number(costUsd.toFixed(6)),
        costKrw: Math.round(costUsd * 1400),
        usage,
      },
    });
  } catch (e: unknown) {
    const err = e as { error?: { message?: string }; message?: string; status?: number };
    const message = err?.error?.message || err?.message || String(e);
    const status = err?.status || 500;
    console.error("[text-gen]", status, message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
