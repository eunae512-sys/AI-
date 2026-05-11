// BRIQ mockup runtime — 모든 페이지 공통 인터랙션
// 06-cardnews-image.html / 08-reels-studio.html 등은 자체 풀-인터랙션 보유 → body에 data-no-mock-fallback 마커로 opt-out

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

  // ============ 다크 모드 ============
  (function initDarkMode() {
    const saved = localStorage.getItem('briq-theme');
    if (saved === 'dark') document.documentElement.classList.add('dark');
    // 토글 버튼 위임 (페이지마다 #theme-toggle 1개)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#theme-toggle');
      if (!btn) return;
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('briq-theme', isDark ? 'dark' : 'light');
      toast(isDark ? '다크 모드 활성' : '라이트 모드 활성', 'info');
    });
  })();

  // ============ 사이드바 NAV 자동 href ============
  const NAV_MAP = {
    '홈':            'index.html',
    '클라이언트':     '02-clients.html',
    '캠페인':        '04-campaign-new.html',
    '콘텐츠':        '05-content-result.html',
    '콘텐츠 결과':    '05-content-result.html',
    '콘텐츠 캘린더':  '11-calendar.html',
    '캘린더':        '11-calendar.html',
    '검토 큐':       '07-review-queue.html',
    '카드뉴스':      '06-cardnews-image.html',
    '카드뉴스 이미지': '06-cardnews-image.html',
    '릴스 스튜디오':  '08-reels-studio.html',
    'AI 이미지':     '06-cardnews-image.html',
    '브랜드 톤':     '09-brand-memory.html',
    '브랜드 톤 메모리': '09-brand-memory.html',
    '리뷰 답변':     '10-reviews.html',
    '리뷰':          '10-reviews.html',
    '성과 분석':     '12-analytics.html',
    '성과':          '12-analytics.html',
    '분석':          '12-analytics.html',
    '브랜드 키트':   '13-brand-kit.html',
    '브랜드킷':      '13-brand-kit.html',
    '지역 트렌드':   '14-trends.html',
    '트렌드':        '14-trends.html',
    '업로드 예약':   '15-schedule.html',
    '예약':          '15-schedule.html',
    '랜딩':          'landing.html',
    '시작하기':      'onboarding.html',
    '온보딩':        'onboarding.html',
    '요금제':        'pricing.html',
  };
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

  // 현재 페이지에 해당하는 nav 항목 active 표시
  (function markActiveNav() {
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('aside nav a').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (!href || href === '#') return;
      if (href === here) {
        a.classList.add('nav-active');
      }
    });
  })();

  // ============ data-go="path" — 어떤 요소든 클릭 시 페이지 이동 ============
  document.querySelectorAll('[data-go]').forEach((el) => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = el.dataset.go;
    });
  });

  // ============ data-mock="msg" — 아직 미구현 기능 ============
  document.querySelectorAll('[data-mock]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      toast(el.dataset.mock || 'mockup — 아직 구현 전입니다.', 'info');
    });
  });

  // ============ data-toggle-group — 단일 선택 칩 그룹 ============
  // 페이지 CSS가 .active / .mock-active 어느 쪽을 쓰든 동작하게 양쪽 동시 토글
  document.querySelectorAll('[data-toggle-group]').forEach((group) => {
    const items = group.querySelectorAll('[data-toggle]');
    items.forEach((it) => {
      it.addEventListener('click', () => {
        items.forEach((other) => {
          const on = other === it;
          other.classList.toggle('mock-active', on);
          other.classList.toggle('active', on);
        });
      });
    });
  });

  // ============ data-tabs ============
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

  // ============ form submit ============
  document.querySelectorAll('form[data-submit-go]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = form.dataset.submitGo;
    });
  });

  // ============ AI Assistant 글로벌 드로어 ============
  (function initAiAssistant() {
    if (document.getElementById('ai-assistant-drawer')) return;
    const drawer = document.createElement('div');
    drawer.id = 'ai-assistant-drawer';
    drawer.className = 'ai-asst-drawer';
    drawer.innerHTML = `
      <div class="ai-asst-backdrop"></div>
      <aside class="ai-asst-panel">
        <header class="ai-asst-header">
          <div class="flex items-center gap-2">
            <div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:grid;place-items:center;color:#fff;font-weight:700;font-size:12px">✦</div>
            <div>
              <div class="ai-asst-title">BRIQ Assistant</div>
              <div class="ai-asst-sub">소상공인 온라인 직원 · 즉시 실행</div>
            </div>
          </div>
          <button class="ai-asst-close" aria-label="닫기">×</button>
        </header>
        <div class="ai-asst-quick">
          <div class="ai-asst-quick-title">빠른 실행</div>
          <div class="ai-asst-quick-grid">
            <button class="ai-asst-quick-btn" data-asst-action="reels">🎬 릴스 자동 제작</button>
            <button class="ai-asst-quick-btn" data-asst-action="ad">📢 광고 문구 생성</button>
            <button class="ai-asst-quick-btn" data-asst-action="blog">📝 블로그 작성</button>
            <button class="ai-asst-quick-btn" data-asst-action="event">🎉 이벤트 카피</button>
            <button class="ai-asst-quick-btn" data-asst-action="cardnews">🎴 카드뉴스 6장</button>
            <button class="ai-asst-quick-btn" data-asst-action="review">💬 리뷰 답변</button>
          </div>
        </div>
        <div class="ai-asst-scroll">
          <div class="ai-asst-msg ai-asst-msg-bot">
            <div class="ai-asst-msg-avatar">B</div>
            <div class="ai-asst-msg-bubble">
              안녕하세요, 허은애 님 ✨ 오늘은 <b>장마 시즌 감성 릴스</b> 와 <b>가정의 달 마감 이벤트</b> 콘텐츠가 추천돼요. 어떤 작업을 시작할까요?
              <div class="ai-asst-msg-meta">방금 · BRIQ가 자동 추천</div>
            </div>
          </div>
        </div>
        <form class="ai-asst-input">
          <input id="ai-asst-input-field" placeholder="무엇을 만들까요? (예: 미옥당 5월 봄나물 코스 인스타 5장)" />
          <button type="submit">⏎</button>
        </form>
      </aside>
    `;
    const css = document.createElement('style');
    css.textContent = `
      .ai-asst-drawer { position:fixed; inset:0; z-index:60; pointer-events:none; }
      .ai-asst-drawer.open { pointer-events:auto; }
      .ai-asst-backdrop { position:absolute; inset:0; background:rgba(15,15,18,0.35); opacity:0; transition:opacity .25s; }
      .ai-asst-drawer.open .ai-asst-backdrop { opacity:1; }
      .ai-asst-panel { position:absolute; right:0; top:0; bottom:0; width:420px; max-width:92vw; background:#fff;
        border-left:1px solid #e5e7eb; display:flex; flex-direction:column; transform:translateX(100%); transition:transform .3s cubic-bezier(.2,.8,.2,1); }
      .dark .ai-asst-panel { background:#0a0a0b; border-left-color:#27272a; color:#fafafa; }
      .ai-asst-drawer.open .ai-asst-panel { transform:translateX(0); }
      .ai-asst-header { padding:14px 16px; border-bottom:1px solid #f3f4f6; display:flex; align-items:center; justify-content:space-between; }
      .dark .ai-asst-header { border-bottom-color:#27272a; }
      .ai-asst-title { font-size:13px; font-weight:600; }
      .ai-asst-sub { font-size:10px; color:#9ca3af; margin-top:1px; }
      .ai-asst-close { background:transparent; border:0; font-size:22px; line-height:1; color:#9ca3af; cursor:pointer; padding:0 6px; }
      .ai-asst-close:hover { color:#111827; }
      .dark .ai-asst-close:hover { color:#f5f5f5; }
      .ai-asst-quick { padding:14px 16px; border-bottom:1px solid #f3f4f6; }
      .dark .ai-asst-quick { border-bottom-color:#27272a; }
      .ai-asst-quick-title { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; font-weight:600; margin-bottom:8px; }
      .ai-asst-quick-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
      .ai-asst-quick-btn { font-size:12px; padding:8px 10px; text-align:left; border-radius:8px; border:1px solid #e5e7eb; background:#fff; cursor:pointer; transition:all .15s; }
      .ai-asst-quick-btn:hover { border-color:#111827; background:#fafafa; }
      .dark .ai-asst-quick-btn { background:#16161a; border-color:#27272a; color:#fafafa; }
      .dark .ai-asst-quick-btn:hover { border-color:#fff; background:#1f1f23; }
      .ai-asst-scroll { flex:1; overflow-y:auto; padding:14px 16px; }
      .ai-asst-msg { display:flex; gap:10px; margin-bottom:12px; }
      .ai-asst-msg-avatar { width:24px; height:24px; border-radius:6px; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; font-size:11px; font-weight:700; display:grid; place-items:center; flex-shrink:0; }
      .ai-asst-msg-bubble { font-size:12.5px; line-height:1.55; background:#f9fafb; border:1px solid #f3f4f6; border-radius:10px; padding:10px 12px; }
      .dark .ai-asst-msg-bubble { background:#16161a; border-color:#27272a; color:#fafafa; }
      .ai-asst-msg-meta { font-size:10px; color:#9ca3af; margin-top:6px; }
      .ai-asst-msg-user .ai-asst-msg-bubble { background:#111827; color:#fff; border-color:#111827; }
      .ai-asst-msg-user { flex-direction:row-reverse; }
      .ai-asst-msg-user .ai-asst-msg-avatar { background:linear-gradient(135deg,#f59e0b,#ef4444); }
      .ai-asst-input { padding:12px 16px; border-top:1px solid #f3f4f6; display:flex; gap:8px; }
      .dark .ai-asst-input { border-top-color:#27272a; }
      .ai-asst-input input { flex:1; padding:9px 12px; border:1px solid #e5e7eb; border-radius:8px; font-size:12.5px; outline:none; background:#fff; color:#111827; }
      .ai-asst-input input:focus { border-color:#111827; }
      .dark .ai-asst-input input { background:#16161a; border-color:#27272a; color:#fafafa; }
      .ai-asst-input button { background:#111827; color:#fff; border:0; border-radius:8px; padding:0 14px; font-size:13px; cursor:pointer; }
      .dark .ai-asst-input button { background:#fff; color:#111827; }
    `;
    document.head.appendChild(css);
    document.body.appendChild(drawer);

    function open() { drawer.classList.add('open'); setTimeout(() => document.getElementById('ai-asst-input-field')?.focus(), 280); }
    function close() { drawer.classList.remove('open'); }

    drawer.querySelector('.ai-asst-close')?.addEventListener('click', close);
    drawer.querySelector('.ai-asst-backdrop')?.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // 토글 버튼 (헤더 #ai-assistant-toggle)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#ai-assistant-toggle, [data-asst-open]');
      if (btn) { e.preventDefault(); open(); }
    });

    // 단축키 ⌘K / Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        drawer.classList.contains('open') ? close() : open();
      }
    });

    // 빠른 실행
    drawer.addEventListener('click', (e) => {
      const qb = e.target.closest('[data-asst-action]');
      if (!qb) return;
      const action = qb.dataset.asstAction;
      const targets = {
        reels: '08-reels-studio.html',
        ad: '04-campaign-new.html',
        blog: '05-content-result.html',
        event: '11-calendar.html',
        cardnews: '06-cardnews-image.html',
        review: '10-reviews.html',
      };
      if (targets[action]) window.location.href = targets[action];
    });

    // 입력 핸들러
    drawer.querySelector('.ai-asst-input')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inp = document.getElementById('ai-asst-input-field');
      const val = (inp?.value || '').trim();
      if (!val) return;
      const scroll = drawer.querySelector('.ai-asst-scroll');
      const userMsg = document.createElement('div');
      userMsg.className = 'ai-asst-msg ai-asst-msg-user';
      userMsg.innerHTML = `<div class="ai-asst-msg-avatar">나</div><div class="ai-asst-msg-bubble">${val.replace(/</g, '&lt;')}</div>`;
      scroll.appendChild(userMsg);
      inp.value = '';
      scroll.scrollTop = scroll.scrollHeight;

      // mock 응답
      setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'ai-asst-msg ai-asst-msg-bot';
        botMsg.innerHTML = `<div class="ai-asst-msg-avatar">B</div><div class="ai-asst-msg-bubble">
          확인했어요. <b>"${val.slice(0, 30).replace(/</g, '&lt;')}"</b> 작업을 시작할게요. 브랜드 톤 메모리(미옥당 v3 · 한정식 단정)와 5월 시즌 컨텍스트를 자동으로 적용합니다.
          <div class="ai-asst-msg-meta">방금 · 브랜드 톤 적용 완료</div>
        </div>`;
        scroll.appendChild(botMsg);
        scroll.scrollTop = scroll.scrollHeight;
      }, 600);
    });
  })();

  // ============ Fallback ============
  const EXPLICIT_HANDLED_IDS = new Set([
    // 03-brand-detail
    'manager-jump-btn', 'chat-clear-btn', 'chat-form', 'chat-input',
    // 04-campaign-new
    'brief-regen-btn', 'brief-stop-btn', 'brandPickerBtn',
    // 05-content-result
    'approve-all-btn',
    // 06-cardnews-image
    'upload-all-btn', 'upload-all-input', 'preset-toggle', 'source-toggle', 'add-slide-btn', 'key-banner', 'fact-check-btn',
    // 글로벌
    'theme-toggle', 'ai-assistant-toggle',
  ]);

  function shouldSkipFallback(el) {
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
    if (el.hasAttribute('data-asst-action')) return true;
    if (el.hasAttribute('data-asst-open')) return true;
    if (el.hasAttribute('contenteditable')) return true;
    if (el.id && EXPLICIT_HANDLED_IDS.has(el.id)) return true;
    if (el.type === 'submit') return true;
    if (el.onclick) return true;
    if (el.closest('[data-tabs]')) return true;
    if (el.closest('[data-toggle-group]')) return true;
    if (el.closest('aside nav')) return true;
    if (el.closest('#ai-assistant-drawer')) return true;
    if (el.closest('[contenteditable]')) return true;
    if ((el.getAttribute('title') === '이전' || el.getAttribute('title') === '다음') && el.closest('header')) return true;
    return false;
  }

  function attachFallback() {
    if (document.body.dataset.noMockFallback) return;
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
    document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])').forEach((inp) => {
      const ph = (inp.getAttribute('placeholder') || '').trim();
      if (!ph) return;
      if (inp.closest('form[data-submit-go]')) return;
      if (inp.closest('#ai-assistant-drawer')) return;
      inp.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        toast(`"${ph}" — 다음 페이즈에 활성화 예정`, 'info');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(attachFallback, 0));
  } else {
    setTimeout(attachFallback, 0);
  }
})();
