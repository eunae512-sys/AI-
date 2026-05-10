// AdOps AI mockup runtime — 모든 페이지 공통 인터랙션
// (06-cardnews-image.html 은 자체 JS 보유, 나머지 페이지에 적용)

(function() {
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
      error:   'background:#e11d48;color:#fff',
      info:    'background:#111827;color:#fff',
    };
    el.style.cssText =
      'pointer-events:auto;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.15);' +
      'padding:10px 14px;font-size:12px;font-weight:500;display:flex;align-items:flex-start;gap:8px;line-height:1.5;' +
      colorMap[kind];
    el.innerHTML =
      '<span style="flex:1;white-space:pre-wrap">' + String(message).replace(/</g, '&lt;') + '</span>' +
      '<button style="opacity:.7;background:transparent;border:0;color:inherit;font-size:16px;line-height:1;cursor:pointer">&times;</button>';
    el.querySelector('button').addEventListener('click', function() { el.remove(); });
    root.appendChild(el);
    setTimeout(function() { el.style.opacity = '0'; el.style.transition = 'opacity .25s'; }, 2800);
    setTimeout(function() { el.remove(); }, 3100);
  }
  window.mockupToast = toast;

  // ============ 사이드바 nav 자동 href ============
  const NAV_MAP = {
    '홈':         'index.html',
    '클라이언트':  '02-clients.html',
    '캠페인':     '04-campaign-new.html',
    '콘텐츠':     '05-content-result.html',
    '검토 큐':    '05-content-result.html',
    'AI 이미지':  '06-cardnews-image.html',
  };

  document.querySelectorAll('aside nav a, aside nav button').forEach(function(el) {
    if (el.tagName === 'A' && el.getAttribute('href') && el.getAttribute('href') !== '#') return;
    const txt = (el.textContent || '').trim().split(/\s+/)[0];
    const target = NAV_MAP[txt];
    if (!target) return;
    if (el.tagName === 'A') {
      el.setAttribute('href', target);
    } else {
      el.style.cursor = 'pointer';
      el.addEventListener('click', function() { window.location.href = target; });
    }
  });

  // ============ data-go="path" — 어떤 요소든 클릭 시 페이지 이동 ============
  document.querySelectorAll('[data-go]').forEach(function(el) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = el.dataset.go;
    });
  });

  // ============ data-mock="msg" — 아직 미구현 기능에 토스트만 ============
  document.querySelectorAll('[data-mock]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      toast(el.dataset.mock || 'mockup — 아직 구현 전입니다.', 'info');
    });
  });

  // ============ data-toggle-group — 단일 선택 칩 그룹 ============
  document.querySelectorAll('[data-toggle-group]').forEach(function(group) {
    const items = group.querySelectorAll('[data-toggle]');
    items.forEach(function(it) {
      it.addEventListener('click', function() {
        items.forEach(function(other) {
          other.classList.toggle('mock-active', other === it);
        });
      });
    });
  });

  // ============ data-tabs — 탭 + 패널 전환 ============
  document.querySelectorAll('[data-tabs]').forEach(function(nav) {
    const tabs = nav.querySelectorAll('[data-tab]');
    const containerSel = nav.dataset.tabs;
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        const target = tab.dataset.tab;
        tabs.forEach(function(t) {
          t.classList.toggle('mock-tab-active', t === tab);
        });
        if (containerSel) {
          document.querySelectorAll(containerSel + ' [data-panel]').forEach(function(p) {
            p.style.display = (p.dataset.panel === target) ? '' : 'none';
          });
        }
      });
    });
  });

  // ============ 폼 submit 가로채기 (data-submit-go) ============
  document.querySelectorAll('form[data-submit-go]').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      window.location.href = form.dataset.submitGo;
    });
  });
})();
