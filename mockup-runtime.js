// AdOps AI mockup runtime — 모든 페이지 공통 인터랙션
// 06-cardnews-image.html 은 자체 풀-인터랙션 보유 → body에 data-no-mock-fallback 마커로 opt-out

(function () {
  'use strict';

  // ============ Toast ============
  function ensureToastRoot() {
    let root = document.getElementById('toast-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'toast-root';
      root.className = 'fixed bottom-6 right-6 z-50 space-y-2 pointer-events-none max-w-sm';
      document.body.appendChild(root);
    }
    return root;
  }

  function toast(message, kind) {
    kind = kind || 'info';
    const root = ensureToastRoot();
    const el = document.createElement('div');
    const colorMap = {
      success: 'background:#059669;color:#fff',
      error: 'background:#e11d48;color:#fff',
      info: 'background:#111827;color:#fff',
    };
    el.style.cssText =
      'pointer-events:auto;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.15);' +
      'padding:10px 14px;font-size:12px;font-weight:500;display:flex;align-items:flex-start;gap:8px;line-height:1.5;' +
      colorMap[kind];
    el.innerHTML =
      '<span style="flex:1;white-space:pre-wrap">' + String(message).replace(/</g, '&lt;') + '</span>' +
      '<button style="opacity:.7;background:transparent;border:0;color:inherit;font-size:16px;line-height:1;cursor:pointer">&times;</button>';
    el.querySelector('button').addEventListener('click', () => el.remove());
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 2800);
    setTimeout(() => el.remove(), 3100);
  }
  window.mockupToast = toast;

  // ============ 사이드바 nav 자동 href ============
  // 첫 단어가 아닌 startsWith 매칭으로 "검토 큐" / "AI 이미지"도 정확히 잡음
  const NAV_MAP = {
    '홈':            'index.html',
    '클라이언트':     '02-clients.html',
    '캠페인':        '04-campaign-new.html',
    '콘텐츠':        '05-content-result.html',
    '검토 큐':       '07-review-queue.html',
    '카드뉴스 이미지': '06-cardnews-image.html',
    '릴스 스튜디오':  '08-reels-studio.html',
    'AI 이미지':     '06-cardnews-image.html', // 옛 라벨 호환
    // 멤버 / AI 비용 / 워크스페이스 등 설정 섹션은 의도적으로 제외 → fallback에서 mock 토스트
  };
  // 길이 긴 키부터 매칭 (e.g. "AI 비용" 이 "AI"보다 우선)
  const NAV_KEYS = Object.keys(NAV_MAP).sort((a, b) => b.length - a.length);

  document.querySelectorAll('aside nav a, aside nav button').forEach((el) => {
    const existingHref = el.getAttribute && el.getAttribute('href');
    if (el.tagName === 'A' && existingHref && existingHref !== '#') return;
    const txt = (el.textContent || '').trim();
    if (!txt) return;
    const matchedKey = NAV_KEYS.find((k) => txt.startsWith(k));
    if (!matchedKey) return;
    const target = NAV_MAP[matchedKey];
    if (el.tagName === 'A') {
      el.setAttribute('href', target);
    } else {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => { window.location.href = target; });
    }
  });

  // ============ data-go="path" — 어떤 요소든 클릭 시 페이지 이동 ============
  document.querySelectorAll('[data-go]').forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = el.dataset.go;
    });
  });

  // ============ data-mock="msg" — 아직 미구현 기능에 토스트만 ============
  document.querySelectorAll('[data-mock]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      toast(el.dataset.mock || 'mockup — 아직 구현 전입니다.', 'info');
    });
  });

  // ============ data-toggle-group — 단일 선택 칩 그룹 ============
  document.querySelectorAll('[data-toggle-group]').forEach((group) => {
    const items = group.querySelectorAll('[data-toggle]');
    items.forEach((it) => {
      it.addEventListener('click', () => {
        items.forEach((other) => {
          other.classList.toggle('mock-active', other === it);
        });
      });
    });
  });

  // ============ data-tabs — 탭 + 패널 전환 ============
  document.querySelectorAll('[data-tabs]').forEach((nav) => {
    const tabs = nav.querySelectorAll('[data-tab]');
    const containerSel = nav.dataset.tabs;
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach((t) => t.classList.toggle('mock-tab-active', t === tab));
        if (containerSel) {
          document.querySelectorAll(containerSel + ' [data-panel]').forEach((p) => {
            p.style.display = (p.dataset.panel === target) ? '' : 'none';
          });
        }
      });
    });
  });

  // ============ 폼 submit 가로채기 (data-submit-go) ============
  document.querySelectorAll('form[data-submit-go]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = form.dataset.submitGo;
    });
  });

  // ============ Fallback: 핸들러 없는 모든 버튼/링크에 mock 토스트 ============
  // 페이지별 inline DOMContentLoaded 가 dataset.mock 등을 추가할 시간을 주기 위해 load 이후 실행
  // 페이지별 inline 스크립트가 explicit 핸들러를 단 버튼들 — fallback에서 제외
  const EXPLICIT_HANDLED_IDS = new Set([
    // 03-brand-detail
    'manager-jump-btn', 'chat-clear-btn', 'chat-form', 'chat-input',
    // 04-campaign-new
    'brief-regen-btn', 'brief-stop-btn', 'brandPickerBtn',
    // 05-content-result
    'approve-all-btn',
    // 06-cardnews-image (opted-out via data-no-mock-fallback이지만 안전상)
    'upload-all-btn', 'upload-all-input', 'preset-toggle', 'source-toggle', 'add-slide-btn', 'key-banner',
  ]);

  function shouldSkipFallback(el) {
    // 이미 핸들러가 붙은 요소들
    if (el.hasAttribute('data-go')) return true;
    if (el.hasAttribute('data-mock')) return true;
    if (el.hasAttribute('data-action')) return true;
    if (el.hasAttribute('data-source')) return true;
    if (el.hasAttribute('data-preset')) return true;
    if (el.hasAttribute('data-tab')) return true;
    if (el.hasAttribute('data-toggle')) return true;
    if (el.hasAttribute('data-brand-id')) return true;
    if (el.hasAttribute('data-bind')) return true;
    if (el.hasAttribute('data-render')) return true;
    if (el.hasAttribute('data-handled')) return true;
    if (el.hasAttribute('contenteditable')) return true;
    // id가 explicit handler 목록에 있을 때만 skip
    if (el.id && EXPLICIT_HANDLED_IDS.has(el.id)) return true;
    if (el.type === 'submit') return true;
    if (el.onclick) return true;
    if (el.closest('[data-tabs]')) return true;
    if (el.closest('[data-toggle-group]')) return true;
    if (el.closest('aside nav')) return true; // 사이드바 nav 별도 처리
    if (el.closest('[contenteditable]')) return true;
    // title="이전" / "다음" — inline 페이지 스크립트가 직접 처리
    if ((el.getAttribute('title') === '이전' || el.getAttribute('title') === '다음') && el.closest('header')) return true;
    return false;
  }

  function attachFallback() {
    if (document.body.dataset.noMockFallback) return;

    // 버튼
    document.querySelectorAll('button').forEach((b) => {
      if (shouldSkipFallback(b)) return;
      const txt = (b.textContent || '').trim().split('\n')[0].trim();
      const label = txt || b.getAttribute('title') || b.getAttribute('aria-label') || '';
      if (!label) return;
      b.addEventListener('click', (e) => {
        e.preventDefault();
        toast(`"${label.slice(0, 40)}" — 다음 페이즈에 활성화 예정`, 'info');
      });
    });

    // href 없는 a 태그 (커서가 pointer로 보여 클릭 유도되는 것들)
    document.querySelectorAll('a').forEach((a) => {
      if (a.hasAttribute('href') && a.getAttribute('href') !== '#') return;
      if (shouldSkipFallback(a)) return;
      const txt = (a.textContent || '').trim().split('\n')[0].trim();
      if (!txt) return;
      a.style.cursor = 'pointer';
      a.addEventListener('click', (e) => {
        e.preventDefault();
        toast(`"${txt.slice(0, 40)}" — 다음 페이즈에 활성화 예정`, 'info');
      });
    });

    // 검색/코멘트 입력 — Enter 시 mock 토스트
    document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])').forEach((inp) => {
      const ph = (inp.getAttribute('placeholder') || '').trim();
      if (!ph) return;
      // 이미 form 안에 있으면 form이 처리
      if (inp.closest('form[data-submit-go]')) return;
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        toast(`"${ph}" — 다음 페이즈에 활성화 예정`, 'info');
      });
    });
  }

  // DOMContentLoaded 이후 페이지별 inline 스크립트가 끝난 다음에 fallback 적용
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // 페이지별 inline DOMContentLoaded 가 먼저 실행되도록 setTimeout 0
      setTimeout(attachFallback, 0);
    });
  } else {
    setTimeout(attachFallback, 0);
  }
})();
