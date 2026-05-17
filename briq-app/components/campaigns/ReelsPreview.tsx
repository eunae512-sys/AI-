"use client";

// 자동 생성된 릴스 미리보기.
//
// 마운트 시 Pexels 비디오 자동 페치 → <video> 로 실제 재생.
// 자막은 비디오 currentTime 에 동기. 인스타 UI 안전영역 시각화.
// "다시 찾기" 누르면 같은 쿼리 다른 페이지에서 새 비디오로 교체.

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ReelsClip } from "./types";
import { Play, Pause, Heart, MessageCircle, Send, Bookmark, RefreshCw, Volume2, VolumeX, Plus, Trash2, Pencil } from "lucide-react";
import { buildVideoQueryDetailed } from "@/lib/cardnews/video-query";

type Props = {
  clip: ReelsClip;
  title?: string;
  handle?: string;
  /** 가게 컨텍스트 — 비디오 검색 쿼리 보강 */
  industry?: string;
};

export function ReelsPreview({ clip: initial, title, handle, industry }: Props) {
  const [clip, setClip] = React.useState<ReelsClip>(initial);
  const [playing, setPlaying] = React.useState(true);
  const [muted, setMuted] = React.useState(true);
  const [t, setT] = React.useState(0);
  const [fetching, setFetching] = React.useState(false);
  const [videoError, setVideoError] = React.useState(false);
  // 이미 본 비디오 ID — API 가 excludeIds 로 받아 그 외 영상을 픽. 렌더 트리거 불필요라 ref 만.
  const seenIdsRef = React.useRef<number[]>([]);
  const [photographer, setPhotographer] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // 인라인 편집 — 영상 위 자막 클릭 또는 트랙 리스트에서 직접 수정
  const [editingIdx, setEditingIdx] = React.useState<number | null>(null);

  // 자막 한 줄 수정
  const updateSubtitle = (idx: number, text: string) => {
    setClip((c) => ({
      ...c,
      subtitles: c.subtitles.map((s, i) => (i === idx ? { ...s, t: text } : s)),
    }));
  };

  // 자막 새 컷 추가 — 마지막 컷 다음 시점
  const addSubtitle = () => {
    setClip((c) => {
      const last = c.subtitles[c.subtitles.length - 1];
      const lastAt = last?.at ?? 0;
      const nextAt = Math.min(c.durationSec - 1, lastAt + 4);
      return {
        ...c,
        subtitles: [...c.subtitles, { at: nextAt, t: "새 자막" }],
      };
    });
    // 새로 추가된 자막을 자동 편집 모드로
    setTimeout(() => setEditingIdx(clip.subtitles.length), 50);
  };

  // 자막 삭제
  const removeSubtitle = (idx: number) => {
    setClip((c) => ({
      ...c,
      subtitles: c.subtitles.filter((_, i) => i !== idx),
    }));
    if (editingIdx === idx) setEditingIdx(null);
  };

  // 자막 시점 (at) 조정
  const updateSubtitleAt = (idx: number, at: number) => {
    setClip((c) => ({
      ...c,
      subtitles: c.subtitles.map((s, i) => (i === idx ? { ...s, at: Math.max(0, Math.min(c.durationSec, at)) } : s)),
    }));
  };

  // 새 비디오 페치
  const fetchVideo = React.useCallback(
    async (opts?: { queryOverride?: string }) => {
      setFetching(true);
      try {
        const query = opts?.queryOverride ?? initial.videoQuery ?? buildVideoQuery(industry, title);
        const r = await fetch("/api/search-pexels-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            // industry 전달 → demo fallback 모드도 업종 매칭 영상 + 다른 컷 순환
            industry,
            orientation: "portrait",
            size: "large",
            perPage: 24,
            // 이미 본 ID 제외 — 매번 다른 영상 떨어지도록
            excludeIds: seenIdsRef.current,
          }),
        });
        const data = await r.json();
        if (data.ok && data.video?.url) {
          setClip((c) => ({
            ...c,
            videoUrl: data.video.url,
            poster: data.video.poster ?? c.poster,
            durationSec: data.video.duration ?? c.durationSec,
          }));
          setPhotographer(data.meta?.photographer ?? null);
          setVideoError(false);
          setT(0);
          // 본 ID 누적
          const newId = data.meta?.videoId;
          if (typeof newId === "number") {
            seenIdsRef.current = [...seenIdsRef.current, newId];
          }
        }
      } catch {
        // 무시
      } finally {
        setFetching(false);
      }
    },
    [industry, title, initial.videoQuery],
  );

  // 브랜드/토픽이 바뀌어 새 clip 이 들어오면 내부 state 동기 + seenIds 리셋 + 새 비디오 페치
  React.useEffect(() => {
    setClip(initial);
    setT(0);
    seenIdsRef.current = [];
    if (!initial.videoUrl) {
      fetchVideo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, title]);

  // 비디오 timeUpdate 로 자막 동기
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setT(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [clip.videoUrl]);

  // 재생/일시정지 컨트롤
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.play().catch(() => {
        /* autoplay 차단 — 사용자 클릭 필요 */
      });
    } else {
      v.pause();
    }
  }, [playing, clip.videoUrl]);

  // currentSub 는 인덱스도 함께 — 편집 모달용
  const currentSubInfo = (() => {
    const past = clip.subtitles
      .map((s, i) => ({ s, i }))
      .filter((x) => x.s.at <= t)
      .sort((a, b) => b.s.at - a.s.at);
    return past[0];
  })();
  const currentSub = currentSubInfo?.s;
  const currentSubIdx = currentSubInfo?.i;

  const progress = clip.durationSec > 0 ? Math.min(100, (t / clip.durationSec) * 100) : 0;
  // 현재 컷 — 진행 시간 / 컷 길이로 계산
  const currentCut = Math.min(clip.cuts - 1, Math.floor((t / clip.durationSec) * clip.cuts));
  const isEditingCurrent = editingIdx !== null && editingIdx === currentSubIdx;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <div className="editorial-label">자동 릴스 · {clip.durationSec}초 · {clip.cuts} 컷</div>
        <button
          type="button"
          onClick={() => fetchVideo()}
          disabled={fetching}
          className="inline-flex items-center gap-1 text-[10.5px] tracking-[0.12em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed"
          title={fetching ? "비디오 가져오는 중…" : "다른 비디오 찾기 (이미 본 영상 제외)"}
        >
          <RefreshCw className={`h-3 w-3 ${fetching ? "animate-spin" : ""}`} />
          {fetching ? "찾는 중" : "다른 컷"}
        </button>
      </div>

      <div className="relative w-full max-w-[280px] mx-auto sm:mx-0 aspect-[9/16] bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* 비디오 또는 poster 폴백 */}
        {clip.videoUrl && !videoError ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.poster}
            autoPlay
            loop
            muted={muted}
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : clip.poster ? (
          // 비디오 못 가져왔을 때 poster 사진으로라도 보여줌 — 빈 화면 막기
          // eslint-disable-next-line @next/next/no-img-element
          <img src={clip.poster} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(120% 80% at 30% 20%, #4a3528 0%, #2b2017 60%, #1a1308 100%)",
            }}
          />
        )}

        {fetching && !clip.videoUrl && (
          <div className="absolute inset-0 grid place-items-center text-white/85 text-[11px] tracking-[0.15em] uppercase">
            비디오 가져오는 중…
          </div>
        )}

        {/* 비디오 로드 실패 안내 — 빈 화면 막고 사장님께 친절히 */}
        {videoError && (
          <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur text-white/90 text-[10.5px] leading-snug p-2 rounded">
            <div className="font-medium mb-0.5">미리보기 영상을 가져오지 못했어요</div>
            <div className="text-white/70">"다른 컷" 을 눌러 다시 시도하거나, PEXELS_API_KEY 를 추가하면 실제 매장 무드 영상으로 바뀝니다.</div>
          </div>
        )}

        {/* 안전영역 라인 */}
        <div className="absolute left-0 right-0 top-0 h-[13%] border-b border-white/10 pointer-events-none" />
        <div className="absolute left-0 right-0 bottom-0 h-[18.2%] border-t border-white/10 pointer-events-none" />

        {/* 컷별 진행 바 — 인스타 스토리 결, 컷 갯수만큼 세그먼트 */}
        <div className="absolute top-[3%] left-3 right-3 flex gap-1 pointer-events-none">
          {Array.from({ length: clip.cuts }).map((_, idx) => {
            const segDur = clip.durationSec / clip.cuts;
            const segStart = idx * segDur;
            const segProgress = Math.max(0, Math.min(1, (t - segStart) / segDur));
            return (
              <div key={idx} className="flex-1 h-[2px] bg-white/25 overflow-hidden">
                <div
                  className="h-full bg-white/90 transition-[width] duration-200 ease-linear"
                  style={{ width: `${segProgress * 100}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* 자막 영역 — 하단 1/3 (영화 자막 결) + 무비 스트로크 + 챕터 마크.
            클릭 시 인라인 textarea 로 변환. 편집 중엔 영상이 멈춰 사용자가 집중. */}
        <div
          className="absolute left-[8%] right-[18%] bottom-[26%] z-20"
          style={{ pointerEvents: currentSub ? "auto" : "none" }}
        >
          <AnimatePresence mode="wait">
            {currentSub && currentSubIdx !== undefined && (
              <motion.div
                key={currentSub.at}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {/* 챕터 / 타임스탬프 마크 — Cormorant Italic 액센트 */}
                <div
                  className="text-white/70 mb-2 flex items-center gap-2.5"
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: "italic",
                    fontWeight: 500,
                    fontSize: "12px",
                    letterSpacing: "0.02em",
                  }}
                >
                  <span>
                    Cut · {String(currentCut + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-white/30" />
                  <span
                    className="tabular-nums"
                    style={{ fontFamily: '"Pretendard Variable", sans-serif', fontStyle: "normal", fontWeight: 500, letterSpacing: "0.12em", fontSize: "10px" }}
                  >
                    {String(Math.floor(currentSub.at / 60)).padStart(2, "0")}:{String(Math.floor(currentSub.at % 60)).padStart(2, "0")}
                  </span>
                </div>

                {isEditingCurrent ? (
                  <textarea
                    autoFocus
                    defaultValue={currentSub.t}
                    onFocus={(e) => {
                      // 편집 시작 시 영상 일시정지 (현재 자막 시점 유지)
                      setPlaying(false);
                      const ta = e.currentTarget;
                      ta.setSelectionRange(ta.value.length, ta.value.length);
                    }}
                    onBlur={(e) => {
                      updateSubtitle(currentSubIdx, e.target.value);
                      setEditingIdx(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setEditingIdx(null);
                      }
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        (e.currentTarget as HTMLTextAreaElement).blur();
                      }
                    }}
                    rows={2}
                    className="w-full block bg-transparent outline-none border-0 resize-none ring-2 ring-white/60 rounded text-white"
                    style={{
                      fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif',
                      fontWeight: 800,
                      fontSize: "clamp(18px, 6.2cqw, 26px)",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.15,
                      textShadow:
                        "0 1px 0 rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.85)",
                      WebkitTextStroke: "0.4px rgba(0,0,0,0.55)",
                      caretColor: "white",
                    }}
                  />
                ) : (
                  /* 자막 본문 — Pretendard 800 + 검은 스트로크 (무비 자막). 클릭 → 편집 */
                  <p
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingIdx(currentSubIdx);
                    }}
                    title="클릭해서 자막 수정"
                    className="text-white leading-[1.15] cursor-text relative group/sub"
                    style={{
                      fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", sans-serif',
                      fontWeight: 800,
                      fontSize: "clamp(18px, 6.2cqw, 26px)",
                      letterSpacing: "-0.02em",
                      textShadow:
                        "0 1px 0 rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.55), 0 0 1px rgba(0,0,0,0.85)",
                      WebkitTextStroke: "0.4px rgba(0,0,0,0.55)",
                    }}
                  >
                    {currentSub.t}
                    <span
                      aria-hidden
                      className="absolute -inset-1 rounded ring-1 ring-white/0 group-hover/sub:ring-white/40 transition-all pointer-events-none"
                    />
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 우측 액션 컬럼 mock */}
        <div className="absolute right-2 bottom-[20%] flex flex-col items-center gap-3 text-white pointer-events-none">
          {[Heart, MessageCircle, Send, Bookmark].map((Icon, i) => (
            <div key={i} className="h-7 w-7 grid place-items-center text-white/85">
              <Icon className="h-4 w-4" strokeWidth={1.6} />
            </div>
          ))}
        </div>

        {/* 하단 가독성 그라데이션 — IG UI 영역 */}
        <div
          className="absolute left-0 right-0 bottom-0 h-[22%] pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0) 100%)",
          }}
        />

        {/* 하단 캡션 mock — IG 핸들 + 타이틀 (에디토리얼 톤) */}
        <div className="absolute left-3 right-12 bottom-[5%] text-white pointer-events-none">
          <div
            className="opacity-90 flex items-center gap-2"
            style={{
              fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
              fontWeight: 700,
              fontSize: "11px",
              letterSpacing: "0.06em",
            }}
          >
            <span>{handle ?? "@brand"}</span>
            <span className="opacity-50">·</span>
            <span className="opacity-60" style={{ fontWeight: 500 }}>팔로우</span>
          </div>
          <div
            className="mt-1.5 line-clamp-2"
            style={{
              fontFamily: '"Pretendard Variable", Pretendard, sans-serif',
              fontWeight: 500,
              fontSize: "12.5px",
              lineHeight: 1.35,
              letterSpacing: "-0.005em",
              opacity: 0.92,
            }}
          >
            {title ?? "오늘 한 컷"}
          </div>
        </div>

        {/* 음소거 토글 — 좌하 */}
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "음소거 해제" : "음소거"}
          className="absolute left-2 bottom-2 h-7 w-7 grid place-items-center rounded-full bg-black/45 backdrop-blur text-white hover:bg-black/65 transition-colors z-10"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>

        {/* 재생 토글 — 전체 영역. 자막 박스 (z-20) 가 위에 있어 자막 편집 클릭은 통과. */}
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "일시정지" : "재생"}
          className="absolute inset-0 grid place-items-center group z-0"
        >
          <span className="h-12 w-12 rounded-full bg-white/15 backdrop-blur-md text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </span>
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-[10.5px] text-zinc-500">
        <span>
          BGM · <span className="text-zinc-700 dark:text-zinc-300">{clip.bgmMood}</span>
        </span>
        {photographer && (
          <span className="text-zinc-400">© Pexels · {photographer}</span>
        )}
      </div>

      {/* 자막 트랙 — 시간 / 자막 / 액션 (수정 · 삭제 · 시점 이동) */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between mb-2">
          <span className="editorial-label">자막 트랙</span>
          <button
            type="button"
            onClick={addSubtitle}
            className="inline-flex items-center gap-1 text-[10.5px] tracking-[0.12em] uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            title="새 자막 추가"
          >
            <Plus className="h-3 w-3" />
            자막 추가
          </button>
        </div>
        <ul className="text-[11.5px] text-zinc-500 leading-relaxed divide-y divide-zinc-100 dark:divide-zinc-900 border-y border-zinc-100 dark:border-zinc-900">
          {clip.subtitles.map((s, idx) => {
            const isPast = s.at <= t;
            const isEditing = editingIdx === idx;
            return (
              <li
                key={idx}
                className={`group flex items-center gap-2 py-1.5 ${isPast ? "" : "opacity-65"}`}
              >
                {/* 시간 — 클릭하면 그 자리로 이동 */}
                <input
                  type="number"
                  step="0.5"
                  min={0}
                  max={clip.durationSec}
                  value={s.at}
                  onChange={(e) => updateSubtitleAt(idx, Number(e.target.value))}
                  className="tabular-nums w-12 text-zinc-400 bg-transparent outline-none focus:text-zinc-700 dark:focus:text-zinc-300 text-right pr-1"
                  title="시점 (초). 비디오 클릭으로 이 자리에 즉시 이동"
                />
                <span className="text-zinc-300 text-[10px]">s</span>

                {/* 자막 텍스트 — 클릭 또는 더블클릭 편집 */}
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    defaultValue={s.t}
                    onBlur={(e) => {
                      updateSubtitle(idx, e.target.value);
                      setEditingIdx(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                      if (e.key === "Escape") setEditingIdx(null);
                    }}
                    className="flex-1 bg-transparent outline-none text-zinc-800 dark:text-zinc-200 px-1.5 py-0.5 ring-1 ring-zinc-300 dark:ring-zinc-700 rounded-sm"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      // 영상 위치도 그 자리로
                      const v = videoRef.current;
                      if (v) {
                        v.currentTime = s.at;
                        setT(s.at);
                      }
                      setEditingIdx(idx);
                    }}
                    className={`flex-1 text-left px-1.5 py-0.5 rounded-sm hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors ${
                      isPast ? "text-zinc-700 dark:text-zinc-300" : ""
                    }`}
                    title="클릭해서 자막 수정"
                  >
                    {s.t || <span className="text-zinc-400 italic">자막 없음 — 클릭해서 작성</span>}
                  </button>
                )}

                {/* 삭제 — hover 시 노출 */}
                <button
                  type="button"
                  onClick={() => removeSubtitle(idx)}
                  aria-label="자막 삭제"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-rose-500 h-5 w-5 grid place-items-center"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            );
          })}
          {clip.subtitles.length === 0 && (
            <li className="py-3 text-center text-zinc-400 text-[11px]">
              자막이 없어요. "자막 추가" 를 눌러 시작하세요.
            </li>
          )}
        </ul>
        <p className="mt-2 text-[10.5px] text-zinc-400 leading-relaxed">
          ✎ 영상 위 자막을 직접 클릭하거나, 트랙 리스트에서 시간·텍스트 수정.{" "}
          <span className="text-zinc-500">Enter</span> 로 저장, <span className="text-zinc-500">Esc</span> 로 취소.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 비디오 쿼리 합성 — 한국어 토픽에서 식재료/시즌/메뉴 추출 → 영문 키워드.
// lib/cardnews/video-query.ts 의 buildVideoQueryDetailed 위임.
// ─────────────────────────────────────────────────────────────────────────────

function buildVideoQuery(industry?: string, title?: string): string {
  return buildVideoQueryDetailed({
    industry: industry as Parameters<typeof buildVideoQueryDetailed>[0]["industry"],
    topic: title,
  });
}
