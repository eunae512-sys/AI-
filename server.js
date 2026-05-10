// 로컬 개발 서버 — Vercel 함수 핸들러를 그대로 Express 라우트로 감싼다.
// npm start → http://localhost:3000

require('dotenv').config();
const express = require('express');
const path = require('path');
const generateImageHandler = require('./api/generate-image');
const generateImageCodexHandler = require('./api/generate-image-codex');
const generateTextHandler = require('./api/generate-text');
const searchPexelsHandler = require('./api/search-pexels');

const app = express();

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname), { extensions: ['html'] }));
// /generated/*.png 도 자동 정적 서빙됨 (위의 express.static 으로)

app.post('/api/generate-image', generateImageHandler);
app.post('/api/generate-image-codex', generateImageCodexHandler);
app.post('/api/generate-text', generateTextHandler);
app.post('/api/search-pexels', searchPexelsHandler);

// 키 검증 전용 (이미지 생성 X — 비용 0)
app.get('/api/health', (_req, res) => {
  const key = process.env.OPENAI_API_KEY || '';
  const isPlaceholder = !key || key.trim() === '' || /^sk-\.+$/.test(key) || key.length < 20;
  if (isPlaceholder) {
    res.json({
      ok: false,
      code: 'NO_KEY',
      error: '.env 파일의 OPENAI_API_KEY 가 placeholder 입니다. 실제 키(sk-proj-... 또는 sk-...)로 교체 후 서버를 재시작해주세요.',
    });
  } else {
    res.json({ ok: true, hint: `${key.slice(0, 8)}...${key.slice(-4)}`, length: key.length });
  }
});

app.get('/', (_req, res) => res.redirect('/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' AdOps AI · 로컬 서버 시작');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(` 카드뉴스: http://localhost:${PORT}/06-cardnews-image.html`);
  console.log(` 갤러리:   http://localhost:${PORT}/`);
  console.log('');
  const key = process.env.OPENAI_API_KEY || '';
  const isPlaceholder = !key || key.trim() === '' || /^sk-\.+$/.test(key) || key.length < 20;
  if (isPlaceholder) {
    console.log(' ⚠⚠⚠ OPENAI_API_KEY 가 placeholder 이거나 비어 있습니다.');
    console.log('   현재 값:', JSON.stringify(key));
    console.log('   .env 파일을 열어 실제 키(sk-proj-... 등)로 교체한 뒤 서버를 재시작하세요.');
    console.log('   키 발급: https://platform.openai.com/api-keys');
    console.log('');
  } else {
    console.log(` ✓ OpenAI 키 로드됨: ${key.slice(0, 8)}...${key.slice(-4)} (${key.length}자)`);
    console.log('');
  }
});
