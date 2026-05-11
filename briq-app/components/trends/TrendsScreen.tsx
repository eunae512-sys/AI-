"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBrand } from "@/components/brand/BrandProvider";

// 업종별 트렌딩 릴스 스타일
const TRENDS_BY_INDUSTRY: Record<
  string,
  {
    radius: string;
    competitors: number;
    topStyles: { title: string; format: string; saveRate: string; delta: string; gradient: string; hooks: string[] }[];
    keywords: { word: string; volume: string; delta: string }[];
    competitorTable: { name: string; followers: string; freq: string; saveRate: string; format: string; strength: string; isUs?: boolean }[];
  }
> = {
  restaurant: {
    radius: "강남구 · 1km",
    competitors: 14,
    topStyles: [
      { title: "새벽 4시 시장", format: "시간순 다큐 · 6컷", saveRate: "8.1%", delta: "+312%", gradient: "from-amber-200 via-rose-300 to-amber-400", hooks: ["새벽", "시장", "정성"] },
      { title: "장 담그는 손", format: "ASMR · 8컷", saveRate: "6.4%", delta: "+182%", gradient: "from-amber-100 to-stone-500", hooks: ["7년", "장", "손맛"] },
      { title: "사장님 인터뷰", format: "V-log · 5컷", saveRate: "4.7%", delta: "+124%", gradient: "from-stone-300 to-amber-700", hooks: ["사장님", "철학", "스토리"] },
      { title: "코스 풀샷", format: "공간 무드 · 7컷", saveRate: "4.2%", delta: "+96%", gradient: "from-amber-100 via-stone-200 to-amber-300", hooks: ["코스", "한 상", "정식"] },
    ],
    keywords: [
      { word: "강남 한정식", volume: "8,420", delta: "+34%" },
      { word: "양평 시장", volume: "2,180", delta: "+78%" },
      { word: "어버이날 한정식", volume: "5,420", delta: "+148%" },
      { word: "5월 봄정식", volume: "3,140", delta: "+92%" },
    ],
    competitorTable: [
      { name: "미옥당 (우리)", followers: "12.4K", freq: "주 4.2회", saveRate: "5.4%", format: "시간순 다큐", strength: "★ 톤 일관성", isUs: true },
      { name: "○○당", followers: "38.2K", freq: "주 3.1회", saveRate: "3.8%", format: "셰프 인터뷰", strength: "팔로워" },
      { name: "○○골", followers: "22.8K", freq: "주 5.8회", saveRate: "4.1%", format: "정식 컷", strength: "발행 빈도" },
      { name: "○○가", followers: "8.4K", freq: "주 2.4회", saveRate: "2.9%", format: "V-log", strength: "친근감" },
    ],
  },
  cafe: {
    radius: "서촌 · 1km",
    competitors: 22,
    topStyles: [
      { title: "원두 도착", format: "오픈박스 · 5컷", saveRate: "7.2%", delta: "+248%", gradient: "from-amber-700 to-stone-900", hooks: ["원두", "도착", "오늘"] },
      { title: "콜드브루 6시간", format: "타임랩스 · 6컷", saveRate: "6.1%", delta: "+186%", gradient: "from-amber-100 to-amber-300", hooks: ["6시간", "추출", "콜드브루"] },
      { title: "핸드드립 ASMR", format: "ASMR · 8컷", saveRate: "5.8%", delta: "+142%", gradient: "from-stone-800 to-amber-700", hooks: ["3분", "한 잔", "드립"] },
      { title: "바리스타의 하루", format: "V-log · 7컷", saveRate: "4.2%", delta: "+88%", gradient: "from-stone-600 to-amber-900", hooks: ["바리스타", "오픈", "마감"] },
    ],
    keywords: [
      { word: "서촌 카페", volume: "12,840", delta: "+42%" },
      { word: "스페셜티 원두", volume: "4,210", delta: "+38%" },
      { word: "콜드브루", volume: "8,420", delta: "+124%" },
      { word: "예가체프", volume: "1,840", delta: "+56%" },
    ],
    competitorTable: [
      { name: "로스터리 1985 (우리)", followers: "8.2K", freq: "주 5.4회", saveRate: "4.7%", format: "원두 다큐", strength: "★ 산지 스토리", isUs: true },
      { name: "○○ COFFEE", followers: "42.1K", freq: "주 6.2회", saveRate: "5.2%", format: "라떼아트", strength: "팔로워" },
      { name: "○○ROAST", followers: "18.4K", freq: "주 4.8회", saveRate: "4.4%", format: "원두 픽업", strength: "산지" },
      { name: "○○ Bean", followers: "6.2K", freq: "주 3.1회", saveRate: "3.1%", format: "메뉴 사진", strength: "—" },
    ],
  },
  dessert: {
    radius: "성수동 · 1km",
    competitors: 28,
    topStyles: [
      { title: "단면 ASMR", format: "ASMR · 6컷", saveRate: "9.2%", delta: "+342%", gradient: "from-pink-200 via-rose-300 to-amber-200", hooks: ["단면", "녹는", "한 입"] },
      { title: "오븐에서 갓 나온", format: "타임랩스 · 7컷", saveRate: "7.1%", delta: "+218%", gradient: "from-amber-200 to-rose-300", hooks: ["갓 나온", "오븐", "방금"] },
      { title: "딸기 손질", format: "ASMR · 5컷", saveRate: "6.8%", delta: "+184%", gradient: "from-rose-300 to-orange-300", hooks: ["딸기", "신선", "방금"] },
      { title: "팀 V-log", format: "V-log · 6컷", saveRate: "5.3%", delta: "+128%", gradient: "from-pink-100 to-amber-100", hooks: ["디저트", "팀", "5월"] },
    ],
    keywords: [
      { word: "성수 디저트", volume: "18,420", delta: "+68%" },
      { word: "수박 케이크", volume: "4,210", delta: "+412%" },
      { word: "마카롱 신상", volume: "6,140", delta: "+82%" },
      { word: "디저트 카페 성수", volume: "9,840", delta: "+54%" },
    ],
    competitorTable: [
      { name: "달콤한 디저트 (우리)", followers: "18.6K", freq: "주 6.4회", saveRate: "7.2%", format: "단면 ASMR", strength: "★ ASMR 컷", isUs: true },
      { name: "○○ SWEET", followers: "32.4K", freq: "주 5.8회", saveRate: "6.4%", format: "마카롱 컬러", strength: "비주얼" },
      { name: "○○Cake", followers: "14.2K", freq: "주 4.2회", saveRate: "5.8%", format: "케이크 단면", strength: "—" },
      { name: "○○patisserie", followers: "9.8K", freq: "주 3.4회", saveRate: "4.4%", format: "팝업", strength: "이벤트" },
    ],
  },
  stay: {
    radius: "북촌·서촌 · 2km",
    competitors: 12,
    topStyles: [
      { title: "한옥 새벽 빛", format: "공간 무드 · 7컷", saveRate: "7.8%", delta: "+267%", gradient: "from-amber-100 via-stone-200 to-amber-300", hooks: ["창호", "새벽", "빛"] },
      { title: "마당의 시간", format: "타임랩스 · 6컷", saveRate: "6.4%", delta: "+184%", gradient: "from-stone-400 to-amber-300", hooks: ["마당", "5월", "꽃"] },
      { title: "조반 한 상", format: "디테일 · 8컷", saveRate: "5.9%", delta: "+142%", gradient: "from-amber-100 to-orange-200", hooks: ["조반", "한 상", "정성"] },
      { title: "객실 투어", format: "공간 V-log · 8컷", saveRate: "4.8%", delta: "+96%", gradient: "from-rose-100 to-amber-200", hooks: ["객실", "온돌", "소반"] },
    ],
    keywords: [
      { word: "북촌 한옥스테이", volume: "6,420", delta: "+88%" },
      { word: "효도 패키지", volume: "3,840", delta: "+216%" },
      { word: "한옥 1박", volume: "5,140", delta: "+62%" },
      { word: "어버이날 숙소", volume: "8,420", delta: "+188%" },
    ],
    competitorTable: [
      { name: "서촌 한옥스테이 (우리)", followers: "5.8K", freq: "주 3.8회", saveRate: "6.1%", format: "공간 무드", strength: "★ 마당 컷", isUs: true },
      { name: "○○ HANOK", followers: "12.4K", freq: "주 3.1회", saveRate: "5.4%", format: "전통 다큐", strength: "팔로워" },
      { name: "○○스테이", followers: "8.2K", freq: "주 4.2회", saveRate: "4.8%", format: "체험 V-log", strength: "체험" },
      { name: "○○ guest", followers: "4.4K", freq: "주 2.1회", saveRate: "3.1%", format: "외관 사진", strength: "—" },
    ],
  },
  beauty: {
    radius: "강남구 · 1km",
    competitors: 34,
    topStyles: [
      { title: "결이 살아요 ASMR", format: "ASMR · 8컷", saveRate: "6.4%", delta: "+248%", gradient: "from-zinc-700 via-zinc-900 to-stone-800", hooks: ["결", "5초", "광택"] },
      { title: "오늘의 컬러", format: "변신 컷 · 6컷", saveRate: "5.8%", delta: "+184%", gradient: "from-rose-200 to-zinc-300", hooks: ["컬러", "오늘", "추천"] },
      { title: "수국 컬러 매칭", format: "ASMR · 7컷", saveRate: "7.2%", delta: "+312%", gradient: "from-fuchsia-200 to-violet-300", hooks: ["수국", "컬러", "5월"] },
      { title: "고객 변신", format: "Before/After · 5컷", saveRate: "5.5%", delta: "+128%", gradient: "from-zinc-600 to-stone-800", hooks: ["변신", "고객", "단골"] },
    ],
    keywords: [
      { word: "강남 미용실", volume: "12,140", delta: "+18%" },
      { word: "5월 봄 컬러", volume: "8,420", delta: "+248%" },
      { word: "ASMR 시술", volume: "3,840", delta: "+412%" },
      { word: "수국축제 헤어", volume: "1,420", delta: "+340%" },
    ],
    competitorTable: [
      { name: "루나 헤어 (우리)", followers: "14.2K", freq: "주 4.8회", saveRate: "4.2%", format: "ASMR 시술", strength: "★ 결 케어", isUs: true },
      { name: "○○ Hair", followers: "28.4K", freq: "주 5.4회", saveRate: "5.1%", format: "변신 컷", strength: "팔로워" },
      { name: "○○살롱", followers: "18.2K", freq: "주 4.1회", saveRate: "4.4%", format: "디자이너 V-log", strength: "디자이너" },
      { name: "○○ Studio", followers: "8.6K", freq: "주 3.4회", saveRate: "3.6%", format: "스타일링", strength: "—" },
    ],
  },
  local: {
    radius: "한남동 · 1km",
    competitors: 18,
    topStyles: [
      { title: "S/S 26 LOOKBOOK", format: "에디토리얼 · 12컷", saveRate: "5.4%", delta: "+184%", gradient: "from-slate-700 to-zinc-900", hooks: ["lookbook", "S/S", "한 벌"] },
      { title: "ONE FABRIC", format: "디테일 · 8컷", saveRate: "6.8%", delta: "+218%", gradient: "from-stone-500 to-zinc-800", hooks: ["fabric", "two", "ways"] },
      { title: "쇼룸 데일리", format: "V-log · 6컷", saveRate: "3.9%", delta: "+96%", gradient: "from-zinc-700 to-stone-900", hooks: ["쇼룸", "데일리", "픽"] },
      { title: "디자이너 인터뷰", format: "인터뷰 · 5컷", saveRate: "4.2%", delta: "+124%", gradient: "from-zinc-300 to-stone-600", hooks: ["디자이너", "철학", "원단"] },
    ],
    keywords: [
      { word: "한남동 편집샵", volume: "8,140", delta: "+42%" },
      { word: "컨템포러리 패션", volume: "4,210", delta: "+68%" },
      { word: "S/S 26", volume: "12,840", delta: "+218%" },
      { word: "wool linen", volume: "1,420", delta: "+148%" },
    ],
    competitorTable: [
      { name: "FORUM (우리)", followers: "24.8K", freq: "주 3.8회", saveRate: "3.8%", format: "에디토리얼", strength: "★ 룩북 일관성", isUs: true },
      { name: "○○ studio", followers: "52.4K", freq: "주 4.2회", saveRate: "4.4%", format: "쇼 매거진", strength: "팔로워" },
      { name: "○○atelier", followers: "18.2K", freq: "주 5.4회", saveRate: "3.6%", format: "디테일 컷", strength: "원단" },
      { name: "○○ ROOM", followers: "12.4K", freq: "주 3.1회", saveRate: "3.2%", format: "스타일링", strength: "—" },
    ],
  },
};

export function TrendsScreen() {
  const { brand } = useBrand();
  const trends = TRENDS_BY_INDUSTRY[brand.industry] ?? TRENDS_BY_INDUSTRY.restaurant;

  return (
    <div className="px-6 py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-violet-600 dark:text-violet-400 font-semibold">
            LOCAL TREND RADAR · {brand.name}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">우리 동네는 이게 잘 돼요</h1>
          <p className="mt-1 text-sm text-zinc-500 max-w-2xl">
            {trends.radius} · {brand.industryLabel} {trends.competitors}개 매장 분석. 저장률 폭증 포맷·키워드·전환 효과 실시간.
          </p>
        </div>
      </div>

      {/* Trending styles */}
      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">저장률 폭증 릴스 스타일 TOP 4</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">{brand.industryLabel} · 전주 대비 변화율</p>
          </div>
          <span className="text-[11px] text-zinc-500">실시간 · 5분 전 갱신</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {trends.topStyles.map((s, i) => (
            <motion.div
              key={`${brand.id}-${i}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-800"
            >
              <div className={`aspect-[9/16] bg-gradient-to-br ${s.gradient} relative`}>
                <div className="absolute inset-0 flex items-end p-3">
                  <div className="text-white text-xs font-semibold drop-shadow">{s.title}</div>
                </div>
                <div className="absolute top-2 left-2 text-[9px] font-bold bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                  {s.delta}
                </div>
                <div className="absolute top-2 right-2 text-[9px] bg-black/40 text-white px-1.5 py-0.5 rounded">
                  9:16
                </div>
              </div>
              <div className="p-3">
                <div className="text-xs font-semibold">{s.format}</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">평균 {s.saveRate} 저장</div>
                <div className="mt-2 flex items-center gap-1 flex-wrap">
                  {s.hooks.map((h) => (
                    <span key={h} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                      {h}
                    </span>
                  ))}
                </div>
                <a href={`/reels`} className="mt-2 block text-[11px] text-zinc-900 dark:text-zinc-100 font-medium">
                  {brand.name}에 적용 →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="p-5">
          <h3 className="text-sm font-semibold">인기 키워드</h3>
          <p className="text-[11px] text-zinc-500 mb-4">{trends.radius} · 검색량 + 7일 변화율</p>
          <ul className="space-y-2.5 text-xs">
            {trends.keywords.map((k) => (
              <li key={k.word} className="flex items-center gap-2">
                <span className="font-medium flex-1 truncate">{k.word}</span>
                <span className="text-zinc-500 tabular-nums">{k.volume}</span>
                <span className="ml-2 text-emerald-600 text-[11px]">{k.delta}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">경쟁업체 분석</h3>
            <span className="text-[11px] text-zinc-500">{trends.radius} · {trends.competitors}개 매장</span>
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-xs">
              <thead className="text-left text-[10px] uppercase tracking-widest text-zinc-400 font-semibold border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2 pr-3">업체</th>
                  <th className="py-2 pr-3">팔로워</th>
                  <th className="py-2 pr-3">발행</th>
                  <th className="py-2 pr-3">저장률</th>
                  <th className="py-2 pr-3">시그니처</th>
                  <th className="py-2 pr-3">강점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {trends.competitorTable.map((c) => (
                  <tr key={c.name} className={c.isUs ? "bg-emerald-50/30 dark:bg-emerald-500/5" : ""}>
                    <td className="py-3 pr-3 font-medium">{c.name}</td>
                    <td className="py-3 pr-3 tabular-nums">{c.followers}</td>
                    <td className="py-3 pr-3">{c.freq}</td>
                    <td className={`py-3 pr-3 tabular-nums font-medium ${c.isUs ? "text-emerald-600" : ""}`}>{c.saveRate}</td>
                    <td className="py-3 pr-3">{c.format}</td>
                    <td className="py-3 pr-3 text-zinc-500">{c.strength}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
