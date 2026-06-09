// 발행 어댑터 추상화 (Phase 0)
//
// 채널별 실연동(인스타 Graph / 유튜브 / 틱톡 / 네이버 / 카카오)은 후속 Phase 에서
// 이 인터페이스를 구현해 registry 에 등록한다. capability 로 자동/반자동을 구분:
//   · auto     — 공식 발행 API 보유 → cron 처리기가 자동 발행 (instagram/youtube/tiktok)
//   · assisted — 공식 발행 API 없음 → 클립보드+딥링크 핸드오프 (naver/kakao)

export type PublishChannel =
  | "instagram"
  | "youtube"
  | "tiktok"
  | "naver_blog"
  | "kakao";

export type PublishCapability = "auto" | "assisted";

export type PublishAsset = {
  caption?: string;
  hashtags?: string[];
  mediaUrls?: string[];
  title?: string;
  body?: string;
  /** KFTC — AI 생성 콘텐츠 라벨 부착 대상인지(어댑터가 발행본에 반영) */
  aiLabeled?: boolean;
  /** 원본 생성물 id (추적용) */
  sourceId?: string;
};

export type PublishResult =
  | { ok: true; externalRef?: string }
  | { ok: false; error: string; retryable: boolean };

export interface PublishAdapter {
  channel: PublishChannel;
  capability: PublishCapability;
  /** 사용자가 이 채널을 연결했는지 (토큰 보유·유효) */
  isConnected(userId: string): Promise<boolean>;
  /** 실제 발행. 실패 시 retryable 여부로 cron 재시도 결정. */
  publish(userId: string, asset: PublishAsset): Promise<PublishResult>;
}
