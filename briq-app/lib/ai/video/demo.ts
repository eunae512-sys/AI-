// 데모 릴스 영상 — Veo 실패(빌링/쿼터/권한) 시 폴백.
// 테스트 환경에서도 영상 플로우가 끊기지 않게(이미지→Pexels, 문구→데모 와 동일 정책).
// 업종별 9:16 HD Pexels 클립(상업 사용 가능, 출처 표기 의무 없음).

export type DemoReelVideo = { url: string; poster: string; photographer: string; industry?: string };

export const DEMO_REEL_VIDEOS: DemoReelVideo[] = [
  { industry: "restaurant", url: "https://videos.pexels.com/video-files/5269551/5269551-hd_720_1280_24fps.mp4", poster: "https://images.pexels.com/videos/5269551/pictures/preview-0.jpeg", photographer: "宇航 钱" },
  { industry: "cafe", url: "https://videos.pexels.com/video-files/13737157/13737157-hd_720_1280_24fps.mp4", poster: "https://images.pexels.com/videos/13737157/pictures/preview-0.jpeg", photographer: "Mizuno K" },
  { industry: "stay", url: "https://videos.pexels.com/video-files/7292472/7292472-hd_720_1280_24fps.mp4", poster: "https://images.pexels.com/videos/7292472/pictures/preview-0.jpeg", photographer: "ArtHouse Studio" },
  { industry: "dessert", url: "https://videos.pexels.com/video-files/8677691/8677691-hd_720_1280_60fps.mp4", poster: "https://images.pexels.com/videos/8677691/pictures/preview-0.jpeg", photographer: "Timur Weber" },
  { industry: "beauty", url: "https://videos.pexels.com/video-files/7440184/7440184-hd_1080_2048_25fps.mp4", poster: "https://images.pexels.com/videos/7440184/pictures/preview-0.jpeg", photographer: "cottonbro studio" },
  { industry: "local", url: "https://videos.pexels.com/video-files/8513139/8513139-hd_720_1280_30fps.mp4", poster: "https://images.pexels.com/videos/8513139/pictures/preview-0.jpeg", photographer: "Artem Podrez" },
  { url: "https://videos.pexels.com/video-files/29267692/12625261_360_640_60fps.mp4", poster: "https://images.pexels.com/videos/29267692/pictures/preview-0.jpeg", photographer: "Sapol Churanon" },
];

/** 업종 매칭 데모 영상 선택. seed 로 같은 입력엔 같은 결과(결정적). */
export function pickDemoReelVideo(industry?: string, seed?: string): DemoReelVideo {
  const matched = industry ? DEMO_REEL_VIDEOS.filter((v) => v.industry === industry) : [];
  const pool = matched.length > 0 ? matched : DEMO_REEL_VIDEOS;
  let h = 0;
  const s = String(seed ?? industry ?? "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}
