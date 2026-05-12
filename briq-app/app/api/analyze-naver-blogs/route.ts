// 키워드 → 네이버 블로그 상위 노출 글 분석
// 1순위: NAVER_CLIENT_ID + NAVER_CLIENT_SECRET → 네이버 검색 API (블로그)
// 2순위: 데모 — 키워드 기반 패턴 분석 시뮬레이션

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

type NaverBlogItem = {
  title: string;
  link: string;
  description: string;
  bloggername: string;
  bloggerlink: string;
  postdate: string; // YYYYMMDD
};

type AnalyzedPost = {
  rank: number;
  title: string;
  bloggerName: string;
  postDate: string; // YYYY-MM-DD
  snippet: string;        // HTML 태그 제거된 본문 발췌
  blogUrl: string;
};

type Analysis = {
  keyword: string;
  postCount: number;
  // 상위 글의 평균 제목 길이 / 발췌 길이
  avgTitleLen: number;
  avgSnippetLen: number;
  // 추정 본문 분량 (스니펫 200자 → 대략 본문 1500~2500자 가정)
  estimatedBodyChars: { min: number; recommended: number; max: number };
  // 상위 글 제목·발췌에서 가장 자주 나오는 명사·키워드 (간이 추출)
  commonTerms: { term: string; count: number }[];
  // 상위 글에서 자주 보이는 제목 패턴
  titlePatterns: string[];
};

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function formatPostDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return "";
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// 한글·영문 단어 단위 토큰화 + 불용어 제거
const STOPWORDS = new Set<string>([
  "그리고", "그런데", "그래서", "하지만", "또한", "특히", "정말", "너무", "조금",
  "오늘", "어제", "내일", "있어요", "없어요", "있는", "있고", "있을", "이런",
  "그런", "저런", "이거", "그거", "저거", "여기", "거기", "저기", "안녕", "안녕하세요",
  "있습니다", "없습니다", "였습니다", "합니다", "됩니다", "드립니다", "감사합니다",
  "방문", "추천", "소개", "블로그", "포스팅", "리뷰", "후기",
  "the", "and", "for", "you", "your", "with", "this", "that", "from",
]);

function extractCommonTerms(texts: string[]): { term: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const text of texts) {
    // 한글 2자 이상 또는 영문 3자 이상
    const tokens = text.match(/[가-힣]{2,}|[A-Za-z]{3,}/g) ?? [];
    for (const raw of tokens) {
      const t = raw.toLowerCase();
      if (STOPWORDS.has(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c >= 2) // 최소 2회 이상
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([term, count]) => ({ term, count }));
}

function extractTitlePatterns(titles: string[]): string[] {
  const patterns = new Set<string>();
  for (const t of titles) {
    // [...] 같은 대괄호 접두사
    const bracketMatch = t.match(/^[\[【]([^\]】]{1,12})[\]】]/);
    if (bracketMatch) patterns.add(`[${bracketMatch[1]}]`);
    // "~ 후기", "~ 추천", "~ 가는법" 등 자주 보이는 어미
    if (/후기$/.test(t)) patterns.add("끝에 '후기'");
    if (/추천$/.test(t)) patterns.add("끝에 '추천'");
    if (/맛집/.test(t)) patterns.add("'맛집' 포함");
    if (/가성비/.test(t)) patterns.add("'가성비' 포함");
    if (/리뷰/.test(t)) patterns.add("'리뷰' 포함");
    if (/방문기/.test(t)) patterns.add("'방문기' 포함");
    if (/[#＃]/.test(t)) patterns.add("'#' 해시태그 사용");
    // 숫자 + "월" "선" "선정" 등
    if (/\d+월/.test(t)) patterns.add("'N월' 시즌 표기");
    if (/(베스트|TOP|top)\s*\d+/.test(t)) patterns.add("'베스트/TOP N'");
  }
  return Array.from(patterns).slice(0, 6);
}

function buildDemoItems(keyword: string): NaverBlogItem[] {
  // 데모 — 키워드 들어간 그럴듯한 제목·발췌 5개 (분석 패턴 추출용)
  const today = new Date();
  const isoDate = (offset: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  };
  return [
    {
      title: `[솔직후기] <b>${keyword}</b> 다녀온 진짜 리뷰`,
      link: "https://blog.naver.com/demo/1",
      description: `요즘 핫하다는 <b>${keyword}</b> 직접 다녀왔습니다. 위치, 분위기, 가격대, 메뉴 구성까지 솔직하게 정리해봤어요. 결론부터 말씀드리면 다시 갈 만큼 만족스러웠습니다.`,
      bloggername: "동네탐방러",
      bloggerlink: "https://blog.naver.com/demo1",
      postdate: isoDate(2),
    },
    {
      title: `${new Date().getMonth() + 1}월 <b>${keyword}</b> 추천 - 가성비 좋은 곳`,
      link: "https://blog.naver.com/demo/2",
      description: `<b>${keyword}</b> 찾는 분들께 도움 되시라고 정리합니다. 평일 한가한 시간 방문 추천드리고, 주차 가능 여부와 운영시간도 함께 확인하시면 좋습니다. 가격대는 합리적이었어요.`,
      bloggername: "맛집기록가",
      bloggerlink: "https://blog.naver.com/demo2",
      postdate: isoDate(5),
    },
    {
      title: `<b>${keyword}</b> 방문기 + 메뉴별 상세 후기`,
      link: "https://blog.naver.com/demo/3",
      description: `오랜만에 다녀온 <b>${keyword}</b>. 시그니처 메뉴부터 신메뉴까지 골고루 먹어보고 분위기랑 서비스도 자세히 적어봤습니다. 사진 많이 첨부했으니 천천히 보세요.`,
      bloggername: "주말은맛집",
      bloggerlink: "https://blog.naver.com/demo3",
      postdate: isoDate(7),
    },
    {
      title: `진짜 솔직한 <b>${keyword}</b> 리뷰 - 단점도 적었어요`,
      link: "https://blog.naver.com/demo/4",
      description: `장점만 적기보다 단점도 같이 정리하는 후기 좋아하시는 분들 많죠. <b>${keyword}</b> 다녀와서 좋았던 점 3가지, 아쉬웠던 점 2가지 함께 적습니다. 방문 전에 참고하세요.`,
      bloggername: "꼼꼼리뷰러",
      bloggerlink: "https://blog.naver.com/demo4",
      postdate: isoDate(10),
    },
    {
      title: `<b>${keyword}</b> 가는 길 + 주차 안내 (TOP 5)`,
      link: "https://blog.naver.com/demo/5",
      description: `<b>${keyword}</b> 위치 헷갈리시는 분들 많아서 정리해봤습니다. 지하철역에서 도보 거리, 주변 주차장 비용, 픽업 가능한 시간대까지 한 번에 안내드릴게요.`,
      bloggername: "동네지도",
      bloggerlink: "https://blog.naver.com/demo5",
      postdate: isoDate(14),
    },
  ];
}

function analyzeItems(keyword: string, items: NaverBlogItem[]): {
  posts: AnalyzedPost[];
  analysis: Analysis;
} {
  const posts: AnalyzedPost[] = items.slice(0, 10).map((it, i) => ({
    rank: i + 1,
    title: stripHtml(it.title),
    bloggerName: stripHtml(it.bloggername),
    postDate: formatPostDate(it.postdate),
    snippet: stripHtml(it.description),
    blogUrl: it.link,
  }));

  const titles = posts.map((p) => p.title);
  const snippets = posts.map((p) => p.snippet);
  const avgTitleLen = titles.length
    ? Math.round(titles.reduce((acc, t) => acc + t.length, 0) / titles.length)
    : 0;
  const avgSnippetLen = snippets.length
    ? Math.round(snippets.reduce((acc, s) => acc + s.length, 0) / snippets.length)
    : 0;
  // 네이버 검색 API description 은 본문 일부(평균 200자) → 본문 전체는 그 6~10배로 가정
  const estimatedRecommended = Math.max(1500, Math.round(avgSnippetLen * 8));
  return {
    posts,
    analysis: {
      keyword,
      postCount: posts.length,
      avgTitleLen,
      avgSnippetLen,
      estimatedBodyChars: {
        min: Math.max(1200, Math.round(avgSnippetLen * 6)),
        recommended: estimatedRecommended,
        max: Math.round(avgSnippetLen * 12),
      },
      commonTerms: extractCommonTerms([...titles, ...snippets]),
      titlePatterns: extractTitlePatterns(titles),
    },
  };
}

export async function POST(req: NextRequest) {
  let body: { keyword?: string } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    body = {};
  }

  const keyword = (body.keyword ?? "").trim();
  if (!keyword) {
    return NextResponse.json(
      { ok: false, error: "keyword 가 비어있습니다." },
      { status: 400 },
    );
  }

  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  // 데모 모드 — 네이버 API 키 미설정
  if (!clientId || !clientSecret) {
    const items = buildDemoItems(keyword);
    const result = analyzeItems(keyword, items);
    return NextResponse.json({
      ok: true,
      demoMode: true,
      ...result,
      meta: {
        source: "demo-fallback",
        notice: "NAVER_CLIENT_ID/SECRET 미설정 — 큐레이션된 패턴 분석으로 대체",
      },
    });
  }

  try {
    const startedAt = Date.now();
    const res = await fetch(
      `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(keyword)}&display=10&sort=sim`,
      {
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      },
    );
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: `Naver API ${res.status}: ${text.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const data = (await res.json()) as { items?: NaverBlogItem[] };
    const items = data.items ?? [];
    if (items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Naver API 결과가 비어있습니다.", keyword },
        { status: 404 },
      );
    }
    const result = analyzeItems(keyword, items);
    return NextResponse.json({
      ok: true,
      demoMode: false,
      ...result,
      meta: {
        source: "naver-search-api",
        latencyMs: Date.now() - startedAt,
      },
    });
  } catch (e) {
    const err = e as { message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message || String(e) },
      { status: 500 },
    );
  }
}
