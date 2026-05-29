// Toss Payments 자동결제 — 서버 사이드 API 클라이언트.
//
// 책임 범위
//  · authKey → billingKey 교환
//  · billingKey 로 정기 청구
//  · billingKey 삭제 (해지 시)
//  · 결제 단건 조회
//
// 모든 호출은 Basic auth (TOSS_SECRET_KEY + ":" base64).
// 60초 타임아웃 (Toss 권고).

const TOSS_API_BASE = "https://api.tosspayments.com";

const SECRET_KEY = process.env.TOSS_SECRET_KEY ?? "";

function authHeader(): string {
  if (!SECRET_KEY) {
    throw new TossConfigError("TOSS_SECRET_KEY 가 비어 있습니다.");
  }
  // 토스 규칙: secret + ":" 를 base64 → "Basic xxxxx"
  const b64 = Buffer.from(`${SECRET_KEY}:`).toString("base64");
  return `Basic ${b64}`;
}

// ───────────────────────────────────────────────
// Error 타입
// ───────────────────────────────────────────────

export class TossConfigError extends Error {
  readonly kind = "config" as const;
}

export class TossApiError extends Error {
  readonly kind = "api" as const;
  readonly status: number;
  readonly code: string;
  readonly raw: unknown;

  constructor(status: number, code: string, message: string, raw: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

// ───────────────────────────────────────────────
// 응답 타입 (Toss 가 돌려주는 핵심 필드만 발췌)
// ───────────────────────────────────────────────

export type TossBillingKeyResponse = {
  mId: string;
  customerKey: string;
  authenticatedAt: string;
  method: string;
  billingKey: string;
  card?: {
    issuerCode?: string;
    acquirerCode?: string;
    number?: string;       // 마스킹된 카드 번호
    cardType?: string;     // 신용/체크
    ownerType?: string;    // 개인/법인
  };
  cardCompany?: string;
};

export type TossPaymentResponse = {
  mId: string;
  paymentKey: string;
  orderId: string;
  orderName: string;
  status:
    | "READY"
    | "IN_PROGRESS"
    | "WAITING_FOR_DEPOSIT"
    | "DONE"
    | "CANCELED"
    | "PARTIAL_CANCELED"
    | "ABORTED"
    | "EXPIRED";
  totalAmount: number;
  balanceAmount: number;
  method: string;
  approvedAt?: string;
  receipt?: { url: string };
  card?: {
    number?: string;
    company?: string;
    cardType?: string;
  };
  failure?: { code: string; message: string };
};

// ───────────────────────────────────────────────
// 내부 fetch wrapper
// ───────────────────────────────────────────────

type FetchInit = {
  method: "GET" | "POST" | "DELETE";
  path: string;
  body?: unknown;
  /** idempotency key — billing 재시도 시 동일 키 보내면 토스가 중복 처리 방지 */
  idempotencyKey?: string;
};

async function tossFetch<T>(init: FetchInit): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    "Content-Type": "application/json",
  };
  if (init.idempotencyKey) {
    headers["Idempotency-Key"] = init.idempotencyKey;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(`${TOSS_API_BASE}${init.path}`, {
      method: init.method,
      headers,
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeoutId);
  }

  // 204 No Content (DELETE billingKey 응답이 본문 없음)
  if (res.status === 204) {
    return undefined as T;
  }

  let parsed: unknown = undefined;
  const text = await res.text();
  if (text.length > 0) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    const errObj = (parsed as { code?: string; message?: string }) ?? {};
    throw new TossApiError(
      res.status,
      errObj.code ?? "UNKNOWN",
      errObj.message ?? `Toss API ${res.status}`,
      parsed,
    );
  }

  return parsed as T;
}

// ───────────────────────────────────────────────
// API 1) billingKey 발급 (authKey 교환)
// ───────────────────────────────────────────────

export async function issueBillingKey(args: {
  authKey: string;
  customerKey: string;
}): Promise<TossBillingKeyResponse> {
  return tossFetch<TossBillingKeyResponse>({
    method: "POST",
    path: "/v1/billing/authorizations/issue",
    body: { authKey: args.authKey, customerKey: args.customerKey },
  });
}

// ───────────────────────────────────────────────
// API 2) billingKey 로 정기 청구
// ───────────────────────────────────────────────

export async function chargeBillingKey(args: {
  billingKey: string;
  customerKey: string;
  amount: number;
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  taxFreeAmount?: number;
}): Promise<TossPaymentResponse> {
  return tossFetch<TossPaymentResponse>({
    method: "POST",
    path: `/v1/billing/${encodeURIComponent(args.billingKey)}`,
    // orderId 는 멱등성 키로 활용. 동일 orderId 로 재시도하면 Toss 가 같은 결과 반환.
    idempotencyKey: args.orderId,
    body: {
      customerKey: args.customerKey,
      amount: args.amount,
      orderId: args.orderId,
      orderName: args.orderName,
      customerEmail: args.customerEmail,
      customerName: args.customerName,
      taxFreeAmount: args.taxFreeAmount ?? 0,
    },
  });
}

// ───────────────────────────────────────────────
// API 3) billingKey 삭제 (해지)
// ───────────────────────────────────────────────
//
// 주의: 우리 DB 에서 deletedAt 마킹 ≠ Toss 측 삭제. 반드시 이 API 도 호출해야 함.

export async function deleteBillingKey(args: {
  billingKey: string;
}): Promise<void> {
  await tossFetch<void>({
    method: "DELETE",
    path: `/v1/billing/${encodeURIComponent(args.billingKey)}`,
  });
}

// ───────────────────────────────────────────────
// API 4) 결제 단건 조회
// ───────────────────────────────────────────────

export async function getPayment(args: {
  paymentKey: string;
}): Promise<TossPaymentResponse> {
  return tossFetch<TossPaymentResponse>({
    method: "GET",
    path: `/v1/payments/${encodeURIComponent(args.paymentKey)}`,
  });
}

// ───────────────────────────────────────────────
// 유틸: API error 가 "사용자 카드 거절" 인지 "시스템 오류" 인지
// ───────────────────────────────────────────────

export function isUserCardError(err: unknown): err is TossApiError {
  if (!(err instanceof TossApiError)) return false;
  // 잔액 부족, 한도 초과, 카드 정지 등 — 재시도 정책의 분기에 사용
  const userCodes = new Set([
    "REJECT_CARD_COMPANY",
    "EXCEED_MAX_DAILY_PAYMENT_COUNT",
    "EXCEED_MAX_PAYMENT_AMOUNT",
    "NOT_AVAILABLE_BANK",
    "INVALID_CARD_NUMBER",
    "INVALID_CARD_EXPIRATION",
    "INVALID_CARD_INSTALLMENT_PLAN",
    "NOT_SUPPORTED_INSTALLMENT_PLAN",
    "FORBIDDEN_REQUEST",
    "NOT_FOUND_BILLING_KEY",
  ]);
  return userCodes.has(err.code);
}
