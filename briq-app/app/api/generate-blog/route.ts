// 블로그 본문 전용 생성 — 1500~2500자, 4-6 문단, 네이버 SEO 친화
// 카드뉴스용 /api/generate-text 와 다른 포맷 (긴 본문, 슬라이드 분할 없음)

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { isPlaceholderKey } from "@/lib/api/demo-images";
import { buildViralMandate, detectCliches, type Voice } from "@/lib/viral/system-prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const RATES: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10.0 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
};

type Perspective = "visitor" | "brand-owner" | "brand-curator";

const DEMO_BODY: Record<Perspective, string> = {
  visitor: `오랜만에 친구랑 점심 약속 잡아서 다녀왔어요. 평일 12시 30분쯤 도착했는데 이미 자리가 거의 다 차 있더라구요… 다행히 안쪽 구석 자리 하나 비어 있어서 앉았어요. (예약 안 하고 갔는데 운 좋았던 것 같아요.)

위치는 지하철역에서 도보로 5~7분쯤. 골목 안쪽이라 처음 가시는 분들은 지도 한 번 더 보고 가시는 게 좋아요. 입구가 좀 작아서 그냥 지나칠 뻔ㅋㅋ 안에 들어가니까 의외로 넓고, 자리 간격도 답답하지 않아서 좋더라구요.

메뉴는 친구가 추천해줘서 가는 거였는데, 시그니처 메뉴 하나랑 사이드 하나 시켰어요. 음식 나오는 데 한 15분 정도 걸렸나? 늦진 않은 편. 그 사이에 직원분이 물이랑 기본찬 같이 내주셨는데 친절하셨어요.

음식 받자마자 사진 찍었는데 — 솔직히 처음엔 양 보고 좀 놀랐어요. 생각보다 푸짐… 한 입 먹어보니까 간이 강하지 않고 깔끔한 맛이었어요. 친구가 "여기 진짜 잘 한다고 했지" 하면서 좋아하더라구요. 향이 진하다기보다는 재료 자체 맛이 사는 느낌.

다만 — 디저트로 나온 후식은 살짝 평범했어요. 음… 메인이 너무 좋아서 기대가 높아진 탓도 있을 거예요. 그리고 주차는 가게 자체엔 없어서 근처 공영주차장 이용하시거나 대중교통 추천드려요.

전체적으로 만족! 친구랑 두 명이 갔는데 합리적인 가격이었던 것 같고, 다음엔 부모님 모시고 가야겠다 싶었어요. 평일 점심이 그나마 한적하니까 가실 분들은 그 시간대 노려보세요. (가격은 변동 있을 수 있어서 방문 전에 한 번 확인하시면 좋습니다.)`,

  "brand-owner": `이번 겨울 메뉴를 정할 때 가장 오래 고민한 건 국물의 무게였습니다. 너무 진하면 한 그릇을 비우기 전에 손님이 지치고, 너무 맑으면 추운 날 한 분을 위로하기엔 부족합니다. 결국 그 사이 어딘가에서 시작하기로 했습니다.

매년 이맘때면 산지에서 보내주시는 분들과 새로 통화를 합니다. 어떤 해는 같은 재료가 다르게 옵니다. 작년에 좋았다고 올해도 좋다는 보장은 없어서, 첫 박스를 받아보고 나서야 그해 메뉴가 정해집니다. 이번 주에 받은 것 중 하나가 마음에 들어, 그 재료를 중심으로 한 가지 메뉴를 정리하고 있습니다.

조리 방식은 작년과 거의 같습니다. 다만 마지막에 더하는 한 가지 — 향을 잡는 재료의 양을 조금 줄였습니다. 가까이 자주 오시는 분들이 알아채실지 모르겠지만, 이번 겨울은 그쪽 방향이 맞다고 판단했습니다. 한 분 한 분께 매번 같은 그릇을 내는 것이 결국 가장 오래 남는 일이라고 생각합니다.

가게를 시작할 때부터 지키려고 했던 한 가지는, 손님이 자리에 앉으셨을 때 묻지 않아도 되는 것은 묻지 않는 것이었습니다. 메뉴 설명도 가능한 한 짧게 드립니다. 그 시간이 손님의 식사 시간 안에 끼어드는 일이라고 생각해서요. 대신 보이지 않는 곳에서 더 챙기려고 합니다.

겨울 메뉴는 다음 주부터 시작할 예정입니다. 자리는 평소처럼 정해진 수만 받고 있어서, 평일 점심이 비교적 여유롭습니다. 메뉴 종류는 한 가지뿐이라 따로 안내드릴 것은 많지 않습니다. 다만 오시기 전, 그날 영업 여부만 한 번 확인하시면 좋습니다.

작년 겨울에 처음 오셨던 손님 한 분이 며칠 전 다시 들러주셨습니다. "올해는 어떻게 만들었어요?" 라고 물어보시는데, 그 한 마디가 한 해를 가늠하는 데 가장 정확한 기준이 됩니다. 이번 겨울도 그런 질문을 받을 수 있으면 좋겠습니다.`,

  "brand-curator": `골목 안쪽에 자리한 이 작은 가게는, 도시의 속도에서 한 걸음 비껴 서 있다. 점심 영업만으로 운영되는 이곳의 메뉴는 단 한 종류. 자리는 여덟 석이 전부다. 가게의 주인은 매일 아침 그날의 재료를 보고서야 그날의 메뉴를 마무리한다.

문을 열고 들어서면 가장 먼저 보이는 것은 카운터 너머의 작업대다. 별도의 인테리어 장식은 거의 없다. 손님의 시선이 자연히 음식이 만들어지는 과정으로 향하도록, 공간 전체가 절제되어 있다. 자리에 앉으면 메뉴 설명도 길지 않다. 정해진 한 가지를 내고, 그것에 대한 이야기는 음식이 대신한다.

조리의 핵심은 국물에 있다고 알려져 있다. 매일 같은 시간에 시작해, 식사가 시작되는 시간까지 계속 끓인다. 어떤 재료를 얼마나 넣는지는 묻지 않는 것이 손님들 사이의 암묵적인 규칙처럼 자리 잡았다. "맛은 같은데, 매번 조금씩 다르다" 는 단골 손님의 표현이 이곳을 가장 잘 설명한다.

찾아오는 손님의 구성도 흥미롭다. 인근에서 일하는 직장인과, 차로 한 시간 이상을 달려 일부러 찾아오는 이들이 비슷한 비율로 섞여 있다. 자리가 한정되어 있어 정오 무렵에는 줄이 짧게 만들어진다. 다만 줄이 길어지는 일은 드물고, 회전이 비교적 빠르다.

이곳을 처음 찾는 이들에게 한 가지 권할 것이 있다면, 너무 큰 기대를 안고 오지 않는 편이 좋다는 것이다. 메뉴는 화려하지 않고, 가게의 분위기도 차분하다. 그러나 한 그릇을 비우고 자리에서 일어설 때쯤이면, 이곳이 왜 오래 자리를 지키고 있는지에 대한 작은 답을 얻게 된다.

평일 오후, 점심 영업이 끝난 가게는 조용히 다음 날을 준비한다. 내일은 어떤 재료가 들어올지, 무엇을 어떻게 다듬을지. 이 가게의 하루는 손님이 오지 않는 시간에 더 길게 이어진다.`,
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
  // perspective — 후기(visitor) / 사장님 일기(brand-owner) / 매거진 칼럼(brand-curator)
  const rawPerspective = typeof body["perspective"] === "string" ? body["perspective"] : "visitor";
  const perspective: Perspective =
    rawPerspective === "brand-owner" || rawPerspective === "brand-curator"
      ? rawPerspective
      : "visitor";
  const forbidden = s("forbidden", "100% 보장, 무조건, 만병통치, 완치, 최고, 대박");
  let targetChars = Number(body["targetChars"]) || 1800; // 1500~2500
  const model = s("model", process.env.TEXT_MODEL || "gpt-4o");
  // 블로그는 정중체가 자연스럽지만 옵션 — 사용자가 "viral 톤 블로그" 시도해볼 수 있게
  const voiceParam = (typeof body["voice"] === "string" ? body["voice"] : "formal") as Voice;
  const voice: Voice = voiceParam === "viral" ? "viral" : "formal";

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
    const demo = DEMO_BODY[perspective] ?? DEMO_BODY.visitor;
    return NextResponse.json({
      ok: true,
      body: demo,
      flagged: [],
      meta: {
        source: "demo-fallback",
        demoMode: true,
        model: "demo",
        perspective,
        charCount: demo.replace(/\s+/g, "").length,
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

  // ──────────────────────────────────────────────────────────
  // perspective 별 어조 블록 — 같은 가게 정보라도 누가 쓰는지가 결정적
  // ──────────────────────────────────────────────────────────

  const perspectiveBlocks: Record<Perspective, { role: string; styleGuide: string }> = {
    visitor: {
      role:
        "당신은 한국 네이버 블로그에서 단골 후기·생활기 잘 쓰기로 알려진 일반인 블로거입니다.\n" +
        '"광고 카피라이터" 가 아니고 "사장님 본인" 도 아닙니다.\n' +
        "실제로 가게에 다녀와서 사진 찍고 글 쓰는 사람의 시점으로 쓰세요.",
      styleGuide: `==== 어조 ★ 가장 중요 ★ ====

저장 많이 받는 네이버 파워블로그 후기의 결을 그대로 흉내내세요. AI 가 쓴 매끄러운 산문 아니라, 사람이 실제로 다녀와서 흘리듯 쓴 글입니다.

[필수 어조 마커 — 본문 전체에 자연스럽게 흩어 넣기]
- 솔직히 / 사실 / 근데 / 다만 / 음… / 일단 / 오랜만에 / 결론부터 말하면
- 시간 명시: "12시 30분쯤 도착", "주말 저녁 7시", "비 오는 평일 점심"
- 괄호 안 사담: "(저는 매운 거 잘 못 먹어서요…)", "(처음엔 그냥 지나칠 뻔)"
- 가벼운 ㅋㅋ / ㅎㅎ / ㅠㅠ — 글 전체에 1~2번까지만. 과하면 신뢰감 떨어짐
- 점점점(…) 과 줄표(—) 를 자연스럽게 사용
- 작은 단점 1개 솔직하게 인정 ("디저트는 살짝 평범했어요", "주차는 좀 불편") — 신뢰감 핵심
- 비교 한 번: "예전에 갔던 ___ 보다", "보통 카페보다", "기대했던 것보다"
- 가족/지인 언급: "엄마랑", "친구랑", "남편이랑", "부모님 모시고"
- 다음 행동 의도: "다음에 또 갈 것 같아요", "이번엔 ___ 시켰는데 다음엔 ___", "엄마 모시고 가야지"

[문장 리듬]
- 짧은 문장과 긴 문장을 섞으세요. 모든 문장이 비슷한 길이면 AI 티 납니다.
- 가끔 명사로 끝나는 문장 OK: "맛은 진짜 깔끔.", "분위기 좋더라구요."
- "~하더라구요", "~인 것 같아요", "~인 듯" 같은 추측·관찰형 어미 자주.

[문단 구조 — 5~7 문단 유연하게]
1) 시작 — 가게에 가게 된 계기 + 첫인상 (날씨/요일/누구랑/시간)
2) 위치/입구/들어간 순간 — 길 안내, 자리 배치
3) 주문 메뉴 + 기다린 시간
4) 맛/감각 묘사 — 향·온도·식감·소리 (재료 추정 금지, knownFacts 만)
5) 작은 단점/주의 사항 — 정직하게 한두 줄
6) 마무리 — 가족·지인 반응 + 재방문 의도. 광고 마무리 금지.

==== 절대 쓰면 안 되는 표현 ====
- "특별한", "정성스런", "정성껏", "정성을 다해", "엄선된", "잊지 못할", "최고의"
- "감동", "여운", "여러분", "여러분의 기대에"
- "마음을 담아", "고객님을 위한", "강력 추천", "후회 없는 선택"
- "한결같이", "기다리고 있겠습니다", "들러주세요", "방문해 주시는 분들께"
- "오랜 시간 손님과 함께", "한자리에서 오랫동안" — 추정 금지
- "맛집의 정수", "맛의 향연", "분위기 좋은" (구체적으로 묘사)
- 사장님 1인칭 ("저희 가게", "저희는") — 후기는 손님 시점이라 "저는"`,
    },

    "brand-owner": {
      role:
        "당신은 작은 가게를 운영하면서 1주에 1편씩 직접 블로그를 쓰는 사장님 본인입니다.\n" +
        "광고가 아니라 큐레이션·기록의 마음으로 쓰는 글입니다.\n" +
        "월간지 칼럼이나 디자이너 인터뷰에 가까운 정제된 1인칭 톤을 유지하세요.",
      styleGuide: `==== 어조 ★ 가장 중요 ★ ====

오프라인 매장을 운영하는 사장 본인이, 광고 글이 아니라 자기 일의 기록·고민·기준을 정리하는 글입니다.
참고할 만한 결: 디자이너/장인의 매거진 인터뷰, 오늘의집 사장님 칼럼, 단정한 한국어 에세이.

[1인칭 톤]
- "저는", "저희는" 자연스럽게. 다만 자기소개 반복 금지 — 첫 문단 외에 가게명을 또 부르지 말 것.
- "오늘은 ~을 정리하려고 합니다", "이번 주에는 ~을 고민했습니다", "어느 해부터 ~합니다" 같은 회고·기록 어미.
- "~합니다" 정중체. ~해요/~네요 같은 친근형은 거의 사용하지 않음.

[글 전체에 한 번씩 보여야 할 것]
- 결정 한 가지의 배경: 왜 이 메뉴/시간/방식을 골랐는지
- 같은 일을 다르게 한 시도: 작년과 올해, 처음과 지금의 비교
- 조용한 자기 검토: "이번엔 ___ 쪽이 맞다고 판단했습니다" 류
- 손님과의 짧은 대화 한 토막 인용 (한 줄, 따옴표) — 신뢰성·생생함 동시
- 광고 카피로 끝나면 안 됨. 마지막은 다음 주의 계획·다짐·열어둔 질문 같은 톤.

[금지 — 사장님 톤에서 가장 흔한 함정]
- "정성을 다해", "정성스럽게", "한결같이", "여러분을 위해" — 추상 미사여구 ZERO
- "최고", "특별한", "잊지 못할" — 자기 자랑 톤 금지
- "강력 추천", "꼭 한 번 방문" — 모객 멘트 금지. 권유는 절제된 한 줄로만.
- "오늘도 저희는" — 운영 정형구. 매번 같은 표현 반복 NO.
- 광고 마무리 ("들러주세요", "기다리고 있겠습니다") 절대 금지.

[문단 구조 — 5~7 문단]
1) 들어가는 글 — 이번 주 / 이번 계절 / 이번 메뉴에 대한 짧은 도입
2) 결정의 배경 — 왜 이걸 정했는지, 어떤 가치 / 어떤 재료
3) 작업 과정 — knownFacts 안에서만, 추상화하지 말고 구체적으로
4) 작년/이전과의 차이 — 어디를 어떻게 바꿨는지 (없으면 손님 반응 인용 한 토막)
5) 운영 안내 — 영업 일정·자리·예약 방식 (모르면 일반화)
6) 마무리 — 다음 주 / 다음 계절을 향한 한 마디. 광고 멘트 금지.

[문장]
- 단문 위주. 단, 1문단당 한 번은 좀 더 긴 문장(50자 이상)으로 호흡 변화.
- 줄표(—), 점점점은 절제 — 1편당 합쳐서 2번 이하.
- 이모지·해시태그·ㅋㅋ/ㅎㅎ 절대 금지. 후기 톤이 아닙니다.`,
    },

    "brand-curator": {
      role:
        "당신은 공간·음식·로컬 매거진(Monocle, Kinfolk, 디자인하우스 매거진, 한겨레21 등) 의 잡지 피처 기자입니다.\n" +
        "특정 가게를 객관적 3인칭 시점에서 잡지 칼럼 한 편으로 소개합니다.\n" +
        "광고가 아니라 큐레이션 / 비평적 소개 톤을 유지하세요.",
      styleGuide: `==== 어조 ★ 가장 중요 ★ ====

매거진 피처 기사의 결입니다. 가게를 하나의 작품·공간으로 다룹니다.
가게 자체보다 그 가게가 만들어내는 결·기준·자리매김을 천천히 묘사하세요.

[3인칭 톤]
- "이 가게는", "이곳은", "주인 ___ 씨는", "이 가게는 ~한다" (가게명 직접 호명은 1~2회로 절제)
- "~한다", "~이다" — 평서체. 정중체(~합니다)는 사용 금지. 잡지 기사 체.
- "손님" 보다 "찾는 이들", "방문자", "단골" 같은 거리감 있는 단어 우선.

[글 전체에 한 번씩 보여야 할 것]
- 위치·외관 묘사 한 문단 (시각적 디테일 1~2개. 모르면 일반화)
- 운영 방식의 특징적 한 줄 (메뉴 종류, 자리 수, 영업 시간 등 — 모르면 추정 금지)
- 단골 손님의 표현 한 토막 인용 — "맛은 같은데 매번 조금씩 다르다" 류
- 비슷한 결의 다른 장소와의 미세한 차이 (단정적 비교는 금지, 결을 짚는 정도)
- 광고 카피로 끝나지 말 것. 잡지 마무리는 가게의 다음 시간을 묘사하는 톤.

[금지]
- "정성을 다해", "한결같이", "특별한" 등 광고 형용사 — 가장 강하게 금지
- "여러분", "강력 추천", "꼭 한 번 방문" — 잡지 톤 깨짐
- 1인칭 ("저는", "저희는") — 매거진 톤에서는 등장 NO
- 이모지·해시태그·ㅋㅋ — 절대 금지
- "최고", "유일한" 단정형 — 잡지 톤은 결을 짚지 단정하지 않음

[문단 구조 — 5~7 문단]
1) 리드 — 가게의 위치·자리 잡은 분위기 한 단락 (시각 묘사 1~2)
2) 첫 인상 — 입구·내부 공간·시선이 향하는 곳
3) 운영의 핵심 — 메뉴·자리·시간이 어떻게 짜였는지 (knownFacts 한정)
4) 손님·단골 — 어떤 이들이 어떤 시간에 찾는지
5) 가게의 결 — 다른 곳과 미세하게 다른 한 가지 (어조 평어체)
6) 마무리 — 영업이 끝난 시간·다음 날을 준비하는 풍경 같은 정적 묘사

[문장]
- 50~70자 길이의 평서문 위주. 짧은 문장은 강조용으로만 가끔.
- 형용사보다 명사·동사로. ("아름다운 공간" → "정돈된 공간", "조용한 공간")
- 줄표·점점점은 1편당 2번 이내 절제.`,
    },
  };

  const { role, styleGuide } = perspectiveBlocks[perspective];

  // 첫 문장 권장 키워드 — 가장 중요한 키워드 하나만 추출 (콤마 기준 split)
  const firstKeyword = keywords.split(",")[0]?.trim() || "";

  const systemPrompt = `${role}

════════════════════════════════════════════════
★ 이 글의 단 하나의 주제 (글 전체가 여기에만 집중) ★
════════════════════════════════════════════════
주제: "${topic}"
${firstKeyword ? `핵심 키워드: "${firstKeyword}"` : ""}
업종: ${industry}

이 글은 "${topic}" 에 대한 글입니다. 다른 주제로 이탈하지 마세요.
모든 문단이 위 주제와 직접 연관되어야 합니다.

════════════════════════════════════════════════
한국어 조사 규칙 (★ 중요 ★)
════════════════════════════════════════════════
- 가게명·메뉴명 뒤에 조사를 붙일 때 받침 유무를 정확히 판단해 사용.
  예) "${brand}" 뒤에 → 받침 있으면 "은/이/을/과", 없으면 "는/가/를/와"
- "은(는)", "이(가)", "을(를)" 같은 괄호 표기를 본문에 절대 출력하지 마세요.
  내부적으로 받침을 판단해 둘 중 하나만 골라 쓰세요.
- 영문 단어 뒤 조사는 발음 기준 ("Wool 은" X → "Wool은" 처럼 자연스러운 한국어로).
- "${brand}" 라는 가게명은 본문에 1~2회만 직접 호명. 그 외엔 "이 가게/이곳/여기" 로 대체.

════════════════════════════════════════════════
가게 정보 (배경 — 주제에 직접 관련될 때만 본문에 인용)
════════════════════════════════════════════════
- 가게명: ${brand}
- 업종: ${industry}
- 위치: ${location}
${taglineLine}
${menuLine}
${knownFactsBlock}
${serpBlock}

${styleGuide}

════════════════════════════════════════════════
출력 전 ★ 자기 검토 4단계 ★
════════════════════════════════════════════════
글을 다 쓴 다음, 반드시 아래 4가지를 본인 확인하세요:
1. [주제 일치] 모든 문단이 "${topic}" 과 직접 관련 있는가? 다른 주제로 새지 않았는가?
2. [업종 일치] 본문에 등장하는 메뉴/장면이 "${industry}" 업종과 맞는가? (예: 카페 글에 한정식 메뉴가 끼어들지 않았는지)
3. [조사 정확성] "은(는)", "이(가)", "을(를)" 같은 괄호 표기가 본문에 남아 있지 않은가? 받침에 맞는 조사 하나만 골라 썼는가?
4. [어조 일치] perspective "${perspective}" 어조 마커가 골고루 들어갔는가? 광고 카피·AI 클리셰 한 줄도 없는가?
하나라도 어긋나면 그 문단을 다시 쓰세요.

════════════════════════════════════════════════
추가 규칙
════════════════════════════════════════════════
1. 금지어 (절대): ${forbidden}
2. 표시광고법·의료광고법 — 효능·100%·치료·완치 단정 금지
3. 이모지·해시태그·마크다운 헤더(#, ##) 금지. 줄바꿈만 사용
4. 모르는 사실(가격·전화·정확 운영시간·인증) 추정 금지 — "가시기 전 한 번 확인하시면 좋습니다" 같은 안전 표현
5. ${firstKeyword ? `첫 문장에 "${firstKeyword}" 자연스럽게 포함 (강제 끼우기 X — 문맥에 녹여서)` : "첫 문장은 주제로 자연스럽게 시작"}
6. 분량 — 공백 제외 ${Math.max(1500, targetChars - 200)}~${targetChars + 500}자 (대략 30~42 문장)

════════════════════════════════════════════════
출력 형식 (JSON 만)
════════════════════════════════════════════════
{
  "body": "본문 전체. 문단 사이는 \\n\\n 로 구분."
}

${buildViralMandate({ voice, platform: "naver" })}`;

  const userInstruction: Record<Perspective, string> = {
    visitor: `"${topic}" 주제로 ${brand}(${industry}, ${location}) 다녀온 후기를 ${targetChars}자 내외로 써 주세요.
파워블로거 후기 톤. 사장님 자기 가게 소개 톤 금지. 시작은 "다녀왔어요" 류 또는 "오랜만에" 류로 자연스럽게.
중간에 솔직한 단점 한 줄, 점점점/줄표/괄호 사담 자유롭게. 마지막은 가족·지인 반응이나 다음에 또 갈 의향으로.`,
    "brand-owner": `"${topic}" 주제로 ${brand}(${industry}) 의 사장 본인이 직접 쓰는 칼럼/일지를 ${targetChars}자 내외로 써 주세요.
정중체(~합니다) 유지. 자기 자랑 / 광고 톤 금지. 결정의 배경 + 작업 과정 + 손님 한 마디 인용을 자연스럽게 섞으세요.
마지막은 다음 주·다음 계절·열어둔 질문 같은 톤. "들러주세요/감사합니다" 류 절대 금지.`,
    "brand-curator": `"${topic}" 주제로 ${brand}(${industry}, ${location}) 을 잡지 피처 기사 한 편으로 ${targetChars}자 내외로 써 주세요.
3인칭 평서체(~한다/~이다) 유지. 1인칭 "저는/저희는" 절대 사용 금지. 가게의 자리·결·운영의 결을 천천히 묘사.
마지막은 영업이 끝난 시간이나 다음 날을 준비하는 풍경처럼 정적 마무리.`,
  };
  const userPrompt = userInstruction[perspective];

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

    // 한국어 조사 자동 보정 — 모델이 가끔 "은(는)" 같은 placeholder 를 그대로 출력
    // 앞 글자의 받침 유무로 자동 선택. Hangul Unicode 기준 (AC00 + 28 base + T offset).
    const fixKoreanParticles = (text: string): { text: string; fixed: number } => {
      let fixed = 0;
      const hasFinal = (ch: string): boolean | null => {
        if (!ch) return null;
        const code = ch.charCodeAt(0);
        if (code < 0xac00 || code > 0xd7a3) {
          // 영문/숫자 — 영문 발음 끝 자음 여부로 근사. 정확치 않아도 모델이 잘 쓸 확률 높음.
          if (/[a-zA-Z]/.test(ch)) {
            // 자음으로 끝나면 받침 있음 (대략). l, n, m, r 등.
            return /[bcdfghjklmnpqrstvwxz]/i.test(ch);
          }
          if (/\d/.test(ch)) {
            // 0=영(받침), 1=일(받침), 2=이(없음), 3=삼(받침)... 마지막 글자 기준 근사
            const map: Record<string, boolean> = { "0": true, "1": true, "3": true, "6": true, "7": true, "8": true, "9": false, "2": false, "4": false, "5": false };
            return map[ch] ?? false;
          }
          return null;
        }
        return ((code - 0xac00) % 28) !== 0;
      };
      const PAIRS: { pattern: RegExp; withFinal: string; withoutFinal: string }[] = [
        { pattern: /은\(는\)/g, withFinal: "은", withoutFinal: "는" },
        { pattern: /는\(은\)/g, withFinal: "은", withoutFinal: "는" },
        { pattern: /이\(가\)/g, withFinal: "이", withoutFinal: "가" },
        { pattern: /가\(이\)/g, withFinal: "이", withoutFinal: "가" },
        { pattern: /을\(를\)/g, withFinal: "을", withoutFinal: "를" },
        { pattern: /를\(을\)/g, withFinal: "을", withoutFinal: "를" },
        { pattern: /과\(와\)/g, withFinal: "과", withoutFinal: "와" },
        { pattern: /와\(과\)/g, withFinal: "과", withoutFinal: "와" },
        { pattern: /으로\(로\)/g, withFinal: "으로", withoutFinal: "로" },
        { pattern: /로\(으로\)/g, withFinal: "으로", withoutFinal: "로" },
      ];
      let out = text;
      for (const { pattern, withFinal, withoutFinal } of PAIRS) {
        // 캡처 그룹 없는 정규식 — replace 콜백 시그니처: (match, offset, source)
        out = out.replace(pattern, (_match: string, offset: number) => {
          const prevChar = offset > 0 ? out[offset - 1] : "";
          const has = hasFinal(prevChar);
          fixed += 1;
          // 받침 판단 안 되면 받침 없음 으로 보수적 fallback
          return has === true ? withFinal : withoutFinal;
        });
      }
      return { text: out, fixed };
    };
    const { text: cleanedBody, fixed: particlesFixed } = fixKoreanParticles(bodyText);
    bodyText = cleanedBody;

    // 금지어 + (viral 모드일 때) AI 클리셰 검사
    const forbiddenList = forbidden
      .split(/[,，]/)
      .map((x) => x.trim())
      .filter(Boolean);
    const flagged: { word: string; count: number; kind: "forbidden" | "cliche" }[] = [];
    forbiddenList.forEach((f) => {
      const re = new RegExp(f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const matches = bodyText.match(re);
      if (matches && matches.length > 0) flagged.push({ word: f, count: matches.length, kind: "forbidden" });
    });
    if (voice === "viral") {
      const cliches = detectCliches(bodyText);
      cliches.forEach((c) => {
        const re = new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
        const cnt = (bodyText.match(re) ?? []).length;
        if (cnt > 0) flagged.push({ word: c, count: cnt, kind: "cliche" });
      });
    }

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
        perspective,
        charCount: bodyText.replace(/\s+/g, "").length,
        initialCharCount,
        expandedOnce,
        particlesFixed,
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
