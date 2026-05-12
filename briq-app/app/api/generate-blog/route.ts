// 블로그 본문 전용 생성 — 1500~2500자, 4-6 문단, 네이버 SEO 친화
// 카드뉴스용 /api/generate-text 와 다른 포맷 (긴 본문, 슬라이드 분할 없음)

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { isPlaceholderKey } from "@/lib/api/demo-images";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATES: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10.0 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
};

const DEMO_BODY = `오늘 가게 문을 열며 가장 먼저 한 일은 어제의 흔적을 정리하는 것이었습니다. 새로 들어온 재료를 살펴보고, 손님 한 분 한 분이 편안히 머무를 수 있도록 자리도 다시 매만졌습니다. 작은 동네 가게이지만, 매일 같은 자리에서 같은 마음으로 손님을 기다리는 일이 저희에게는 가장 중요한 일과입니다.

오늘 소개해 드릴 것은 저희가 특별히 공을 들여 준비한 메뉴입니다. 너무 화려하거나 자극적이지 않고, 일상에서 한 번쯤 챙겨 드시기 좋은 구성으로 만들었습니다. 재료 본연의 맛을 살리는 데 집중했고, 동네에서 가장 좋은 것들을 그날그날 골라 사용합니다.

가게에 들러주시는 손님들께서 종종 말씀하시는 것이 있습니다. "한결같다"는 표현입니다. 자랑하려는 것이 아니라, 그저 어제와 같은 정성으로 오늘도 만들고 있다는 뜻입니다. 메뉴 하나하나에 들어가는 시간과 정성이 결국 단골 손님으로 이어진다는 사실을, 작은 가게를 운영하면서 매일 새롭게 배웁니다.

방문해 주시는 분들께 한 가지 부탁이 있다면, 너무 늦지 않은 시간에 와주시면 좋겠다는 것입니다. 인기 메뉴의 경우 빠르게 마감되는 날이 많습니다. 평일 오전 이른 시간이나 오후 한가한 시간이 가장 여유롭게 즐기실 수 있는 시간대입니다.

마지막으로, 저희 가게가 위치한 동네를 사랑해 주시는 모든 분들께 감사 인사를 드리고 싶습니다. 동네 가게가 오래오래 자리를 지킬 수 있는 건 결국 들러주시는 단 한 분의 손님 덕분입니다. 오늘도 저희는 같은 자리에서 같은 마음으로 기다리고 있겠습니다. 편한 마음으로 들러주세요.`;

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
  const signatureMenu = s("signatureMenu", ""); // 콤마 구분
  const keywords = s("keywords", "");           // 콤마 구분 SEO 키워드
  const tone = s("tone", "단정한 존댓말, 절제, 신뢰");
  const forbidden = s("forbidden", "100% 보장, 무조건, 만병통치, 완치, 최고, 대박");
  let targetChars = Number(body["targetChars"]) || 1800; // 1500~2500
  const model = s("model", process.env.TEXT_MODEL || "gpt-4o");

  // SERP 분석 결과 (선택) — /api/analyze-naver-blogs 응답을 그대로 받음
  type SerpAnalysis = {
    keyword?: string;
    avgTitleLen?: number;
    avgSnippetLen?: number;
    estimatedBodyChars?: { min?: number; recommended?: number; max?: number };
    commonTerms?: { term: string; count: number }[];
    titlePatterns?: string[];
    posts?: { rank: number; title: string; snippet: string }[];
  };
  const serpAnalysis = (body["serpAnalysis"] ?? null) as SerpAnalysis | null;

  // SERP 분석이 있으면 targetChars 를 상위 글 추정 분량에 맞춰 자동 조정 (사용자가 명시한 경우는 그대로)
  if (
    serpAnalysis?.estimatedBodyChars?.recommended &&
    !body["targetChars"]
  ) {
    targetChars = Math.max(1500, Math.min(3000, serpAnalysis.estimatedBodyChars.recommended));
  }

  if (!topic.trim()) {
    return NextResponse.json(
      { ok: false, error: "topic(주제)이 비어있습니다." },
      { status: 400 },
    );
  }

  if (placeholder) {
    return NextResponse.json({
      ok: true,
      body: DEMO_BODY,
      flagged: [],
      meta: {
        source: "demo-fallback",
        demoMode: true,
        model: "demo",
        charCount: DEMO_BODY.replace(/\s+/g, "").length,
        latencyMs: 0,
        costUsd: 0,
        costKrw: 0,
        notice: "OPENAI_API_KEY 미설정 — 큐레이션된 데모 본문으로 대체",
      },
    });
  }

  const startedAt = Date.now();
  const openai = new OpenAI({ apiKey });

  const taglineLine = tagline ? `- 가게 한 줄 소개: "${tagline}" (본문에 자연스럽게 1회 인용)` : "";
  const menuLine = signatureMenu ? `- 대표 메뉴: ${signatureMenu} (본문에 1~2회 자연스럽게 언급)` : "";
  const keywordsLine = keywords
    ? `- SEO 핵심 키워드: ${keywords} (첫 문장에 1개, 본문 전체에 자연스럽게 2~3회 분포)`
    : "";

  // knownFacts — 가게가 명시한 확정 사실 (이것 외엔 구체 추정 금지)
  const knownFactsRaw = body["knownFacts"];
  const knownFacts = Array.isArray(knownFactsRaw)
    ? (knownFactsRaw as unknown[]).filter((x) => typeof x === "string").map((x) => x as string)
    : [];
  const knownFactsBlock = knownFacts.length
    ? `

==== ★ 이 가게에 대해 확정된 사실 (반드시 준수) ====
${knownFacts.map((f, i) => `${i + 1}. ${f}`).join("\n")}

⚠ 위에 나열된 것 이외의 구체 사실은 **절대로 만들어내지 마세요**:
  - 인테리어 디테일(나무 테이블, 벽 사진 등) — 모르면 쓰지 말 것
  - 운영 방식(매일 아침 반죽, 산지 직접 공수, OO년 전통 운영자 등) — 위에 없으면 쓰지 말 것
  - 레시피·국물 구성·재료 출처 — 위에 없으면 쓰지 말 것
  - 가격·시간·전화번호·인증·예약 채널 — 절대 추정 금지

대신 다음 표현으로 안전하게 일반화하세요:
  - "한자리에서 오랫동안" / "오랜 시간 손님과 함께" (구체 연차 추정 금지)
  - "정성을 들여 만든" (구체 공정 추정 금지)
  - "방문 전 운영시간을 확인해 주세요" (구체 시간 추정 금지)
  - "공식 채널에서 메뉴 확인 권장" (구체 가격 추정 금지)`
    : "";

  // SERP 분석 블록 — 상위 노출 글 패턴을 system prompt 에 주입
  let serpBlock = "";
  if (serpAnalysis && (serpAnalysis.posts?.length ?? 0) > 0) {
    const topTitles = (serpAnalysis.posts ?? [])
      .slice(0, 5)
      .map((p) => `  ${p.rank}. ${p.title}`)
      .join("\n");
    const topSnippets = (serpAnalysis.posts ?? [])
      .slice(0, 3)
      .map((p) => `  · ${p.snippet}`)
      .join("\n");
    const commonTerms = (serpAnalysis.commonTerms ?? [])
      .slice(0, 10)
      .map((t) => t.term)
      .join(", ");
    const titlePatterns = (serpAnalysis.titlePatterns ?? []).join(", ");
    const recommendedChars = serpAnalysis.estimatedBodyChars?.recommended ?? targetChars;

    serpBlock = `

==== 상위 노출 블로그 분석 (네이버 "${serpAnalysis.keyword ?? topic}" 검색 결과 ====
상위 글들의 공통 패턴을 파악해, 그보다 한 단계 더 충실한 글을 작성하세요.

- 상위 글 평균 제목 길이: ${serpAnalysis.avgTitleLen ?? "?"}자
- 상위 글 추정 본문 분량: 약 ${recommendedChars}자 (이 글도 그에 맞춰 작성)
- 상위 글 자주 등장 키워드 (LSI): ${commonTerms || "(없음)"}
  → 위 키워드 중 주제와 자연스럽게 어울리는 것을 본문에 2~4개 활용 (강제로 끼워 넣지는 말 것)
- 상위 글 제목 패턴: ${titlePatterns || "(없음)"}
- 상위 글 제목 5개:
${topTitles}
- 상위 글 본문 발췌 (참고):
${topSnippets}

상위 글들이 잘하는 점은 따르되, 아래 차별화를 적용하세요:
1) 광고티 강한 표현(최고/완벽/단 하나의~) 피하기 — 우리는 사장님의 진정성 톤으로 차별화.
2) 상위 글에 없는 "구체 디테일" 추가 — 시간(평일 오전 등), 재료 출처, 운영 방식, 실제 일상 묘사 등.
3) 첫 문단에 위 LSI 키워드 1~2개를 자연스럽게 포함해 검색 노출 확률 ↑.
`;
  }

  const systemPrompt = `당신은 한국 네이버 블로그를 잘 쓰는 소상공인 광고대행사 카피라이터입니다.
오늘 의뢰받은 작업은 다음 가게의 네이버 블로그 본문 1편을 쓰는 것입니다.

==== 가게 정보 ====
- 브랜드: ${brand}
- 업종: ${industry}
- 위치: ${location}
${taglineLine}
${menuLine}
${knownFactsBlock}
${serpBlock}

==== 글의 요건 ====
- 제목(글의 주제): ${topic}
${keywordsLine}
- **분량 (엄격히): 정확히 6개 문단, 각 문단 5~7개 문장 (총 30~42 문장).** 한 문장은 한국어 평균 35~60자.
  → 본문 공백 제외 약 ${Math.max(1500, targetChars - 200)}~${targetChars + 500}자 분량이 자연스럽게 나옵니다.
  네이버 블로그 SEO 는 본문 길이가 노출에 직결됩니다. 짧게 끝나지 마세요.
- 문단 사이는 빈 줄 1개(\\n\\n)로 구분. 각 문장은 마침표로 끝.
- 톤: ${tone}. 동네 가게 사장님이 직접 쓰는 듯한 자연스러운 존댓말. 군더더기·반복 없이 한 줄 한 줄 의미 있게.
- 첫 문단(인사 + 주제 소개): ${keywords ? `첫 문장 안에 "${keywords.split(",")[0]?.trim() || "주제 키워드"}" 자연스럽게 포함.` : ""}
- 2~5번째 문단(본문): 가게의 구체적 디테일·재료·시간·일상 묘사·손님 이야기 등 **사실 기반 구체 정보**로 채워야 합니다.
  추상적 형용사 나열 금지. 한 문단마다 다른 각도(재료 / 만드는 과정 / 분위기 / 손님 후기 등).
- 6번째 문단(마무리): 가벼운 방문/예약 권유. 광고티 강하게 내지 말 것.

==== 절대 규칙 ====
1. 금지어 (절대 사용 금지): ${forbidden}
2. 표시광고법·의료광고법 표현 금지 (효능·100%·치료·최고 등 단정 금지)
3. 이모지·해시태그·마크다운 헤더(#, ##) 금지. 줄바꿈만 사용.
4. AI 클리셰 금지 — "특별한 순간", "잊지 못할 경험", "최고의 ~", "여러분의 ~" 같은 빈말 금지.
5. 모르는 사실(가격·전화번호·정확한 운영시간·인증)을 만들어 쓰지 말 것. 모르면 일반 표현으로.
6. 업종 일관성 — 위 "업종: ${industry}" 에서 벗어난 비유·표현 금지.
7. 첫 문장과 마지막 문장이 동일·유사 표현이 되지 않도록.

==== 출력 형식 ====
오직 JSON 만 출력. 설명·마크다운 코드블록 금지.

{
  "body": "본문 전체. 문단 사이는 \\n\\n 로 구분."
}`;

  const userPrompt = `위 규격으로 "${topic}" 주제의 네이버 블로그 본문 JSON 을 만들어 주세요. ${brand}(${industry}) 의 실제 상황에 맞게, ${targetChars}자 내외로 자연스럽게.`;

  try {
    const result = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      // 한글 1자 ≈ 1.8–2.3 tokens (GPT-4o). targetChars 2배 정도 + JSON 오버헤드 여유분.
      max_tokens: Math.min(4096, Math.round(targetChars * 2.5) + 200),
    });

    const raw = result.choices?.[0]?.message?.content || "{}";
    let parsed: { body?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { ok: false, error: "GPT 응답 JSON 파싱 실패", raw: raw.slice(0, 500) },
        { status: 502 },
      );
    }

    let bodyText = (parsed.body ?? "").trim();
    if (!bodyText) {
      return NextResponse.json(
        { ok: false, error: "본문(body)이 비었습니다", raw: raw.slice(0, 500) },
        { status: 502 },
      );
    }

    // 자동 확장 — 첫 응답이 목표의 70% 미만이면 한 번만 retry 로 늘림
    const minChars = Math.max(1200, Math.floor(targetChars * 0.7));
    let initialCharCount = bodyText.replace(/\s+/g, "").length;
    let expandedOnce = false;
    let secondUsage: { prompt_tokens?: number; completion_tokens?: number } = {};
    if (initialCharCount < minChars) {
      try {
        const expandRes = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
            { role: "assistant", content: JSON.stringify({ body: bodyText }) },
            {
              role: "user",
              content:
                `현재 본문이 ${initialCharCount}자로 ${minChars}자에 미달합니다. ` +
                `같은 본문 구조를 유지하면서, 2~5번째 문단에 각각 2~3 문장의 구체 디테일을 추가해 전체 분량을 ${targetChars}자 내외로 늘려 주세요. ` +
                `이미 쓴 문장은 그대로 두고 새 문장만 자연스럽게 끼워 넣으세요. 출력은 동일한 JSON {"body":"..."} 형식.`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.6,
          max_tokens: Math.min(4096, Math.round(targetChars * 2.5) + 400),
        });
        const expandedRaw = expandRes.choices?.[0]?.message?.content ?? "{}";
        const expandedParsed = JSON.parse(expandedRaw) as { body?: string };
        const expandedBody = (expandedParsed.body ?? "").trim();
        if (expandedBody && expandedBody.replace(/\s+/g, "").length > initialCharCount) {
          bodyText = expandedBody;
          expandedOnce = true;
          secondUsage = expandRes.usage || {};
        }
      } catch {
        // 확장 실패 — 첫 응답 그대로 반환
      }
    }

    // 금지어 검사
    const forbiddenList = forbidden
      .split(/[,，]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const flagged: { word: string; count: number }[] = [];
    forbiddenList.forEach((f) => {
      const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const matches = bodyText.match(re);
      if (matches && matches.length > 0) flagged.push({ word: f, count: matches.length });
    });

    const latencyMs = Date.now() - startedAt;
    const usage = result.usage || ({} as { prompt_tokens?: number; completion_tokens?: number });
    const totalPromptTokens = (usage.prompt_tokens || 0) + (secondUsage.prompt_tokens || 0);
    const totalCompletionTokens = (usage.completion_tokens || 0) + (secondUsage.completion_tokens || 0);
    const r = RATES[model] || RATES["gpt-4o"];
    const costUsd =
      (totalPromptTokens * r.in + totalCompletionTokens * r.out) / 1_000_000;

    return NextResponse.json({
      ok: true,
      body: bodyText,
      flagged,
      meta: {
        source: "openai",
        model,
        charCount: bodyText.replace(/\s+/g, "").length,
        initialCharCount,
        expandedOnce,
        latencyMs,
        costUsd: Number(costUsd.toFixed(6)),
        costKrw: Math.round(costUsd * 1400),
        usage: {
          prompt_tokens: totalPromptTokens,
          completion_tokens: totalCompletionTokens,
          total_tokens: totalPromptTokens + totalCompletionTokens,
        },
      },
    });
  } catch (e: unknown) {
    const err = e as { error?: { message?: string }; message?: string; status?: number };
    const message = err?.error?.message || err?.message || String(e);
    return NextResponse.json({ ok: false, error: message }, { status: err?.status || 500 });
  }
}
