---
quick_id: 260604-bg1
slug: vocal-music
date: 2026-06-04
status: complete
commit: 1291b32
---

# Quick Task 260604-bg1 — BGM 가사가 음악에 반영 안 됨

## 원인
- `buildMusicPrompt`는 무드 프리셋(장르/BPM/악기)만으로 instrumental 프롬프트 생성 — 가사는 길이 계산에만 쓰임.
- `meta/musicgen`(Replicate)·`synthesizeDemoMusic`(Web Audio) 둘 다 **악기 전용(보컬 없음)** → 가사가 절대 불리지 않음.

## 수정 (`app/api/generate-music/route.ts`)
- 1순위로 **fal-ai/minimax-music/v2** 추가 (이미 보유한 `FAL_KEY` 사용). 가사 10자+ 이면 fal 로 **보컬 노래** 생성 → audioUrl 반환.
- 폴백: fal 실패/가사 없음/키 없음 → musicgen → Web Audio 데모(악기).
- `FAL_MUSIC_MODEL` env 로 모델 override 가능.
- 스키마: fal 공식 문서 검증 — `{ prompt(스타일 10-300), lyrics_prompt(가사 10-3000, [Verse]/[Chorus]) }` → `data.audio.url`.

## 검증
- `tsc` 통과. 입력 스키마 fal 공식 API 문서로 확인.
- 런타임 테스트는 **데모로 떨어짐** — 실행 중 dev 서버가 5/29 18:37 시작이라 이후 추가된 FAL_KEY 를 프로세스 env 에 못 읽음(Next 는 시작 시 1회만 .env 로드).
- **조치 필요: dev 서버 재시작** 후 가사 입력 시 fal 보컬 생성 동작.

## Commit
- `1291b32` feat(music): fal minimax-music 보컬 음악 생성
