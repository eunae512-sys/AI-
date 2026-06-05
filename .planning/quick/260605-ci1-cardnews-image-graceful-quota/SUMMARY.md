# 260605-ci1 — 카드뉴스 AI 이미지: 한도/플랜 거절도 우아한 데모 폴백으로

## 문제
카드뉴스 POST /api/generate-image 가 처음엔 200(Gemini ~10초)이다가 이후 403(~750ms 빠른 거절)으로
막혀 클라이언트에 "AI 이미지 생성 실패" 토스트가 떴다.

## 원인 (코드 인용)
route.ts 게이트 분기:
  const gate = await ensurePlanAndQuota({ feature:"ai-image:generate", usage:{kind:"aiImage"} });
  if (!gate.ok && gate.reason !== "unauthorized") return NextResponse.json(gate, {status: gate.status});
gate-server.ts 거절 사유:
- feature_locked (402, L76-84): 플랜에 ai-image:generate 미포함
- limit_exceeded (403, L115-125): 월 aiImage 한도 소진(used>=limit). free는 aiImagesPerMonth:0 → 첫 호출부터 403.
클라이언트 CardnewsScreen.tsx L536 `if(!data.ok)` → "AI 이미지 생성 실패" 하드 토스트.
기존 프로바이더-실패 폴백(Pexels→demo)은 게이트 거절 단계에선 못 탔음.

## 수정
route.ts 에 gracefulFallback() 헬퍼 추출(Pexels 페르소나 사진 → 일반 demo 풀).
게이트 거절을 하드 리턴 대신 폴백으로:
- limit_exceeded → {ok:true,image,meta.notice:"이번 달 AI 이미지 한도 소진(used/limit) — 데모 이미지로 대체",demoMode:true}
- feature_locked → notice:"현재 플랜은 AI 이미지 생성 미포함 — 데모 이미지로 대체"
하단 프로바이더-전멸 폴백도 같은 헬퍼로 통합(중복 제거).
한도 추적 유지: 게이트가 집계·체크 수행, 막혔으니 bumpUsage 안 함. 게이트 무력화 아님.

## 검증
- tsc --noEmit → EXIT 0
- curl(비로그인) → 200 실제 Gemini PNG(게이트 통과 경로). 거절 분기는 코드 레벨 검증.
