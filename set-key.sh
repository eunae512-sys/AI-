#!/usr/bin/env bash
# OpenAI API 키 설정 + 서버 재시작 (한 번 실행으로 끝)
set -e

cd "$(dirname "$0")"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " OpenAI API 키 입력"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo " 키 발급:   https://platform.openai.com/api-keys"
echo " 키 형식:   sk-proj-... 또는 sk-..."
echo " 보안:      입력 시 화면에 표시되지 않습니다 (paste OK)"
echo ""

read -s -p "키 붙여넣고 Enter: " KEY
echo ""

if [ -z "$KEY" ]; then
  echo "❌ 입력이 비어 있습니다. 다시 실행해주세요."
  exit 1
fi

if [ ${#KEY} -lt 20 ]; then
  echo "❌ 키 길이가 너무 짧습니다 (${#KEY}자). 올바른 키인지 확인해주세요."
  exit 1
fi

if [[ ! "$KEY" =~ ^sk- ]]; then
  echo "⚠ 키가 'sk-' 로 시작하지 않습니다. 그래도 진행할까요? (y/N)"
  read -r CONFIRM
  [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]] && exit 1
fi

# .env 작성 (다른 키들 보존하고 OPENAI_API_KEY만 교체)
TMP=$(mktemp)
if [ -f .env ]; then
  grep -v "^OPENAI_API_KEY=" .env > "$TMP" 2>/dev/null || true
fi
echo "OPENAI_API_KEY=$KEY" > .env
[ -s "$TMP" ] && cat "$TMP" >> .env
rm -f "$TMP"

unset KEY

echo "✓ .env 에 키 저장 완료 (마스킹됨)"
echo ""

# 기존 서버 종료
echo "▸ 기존 서버 종료 중..."
pkill -f "node server.js" 2>/dev/null || true
sleep 1

echo "▸ 서버 재시작..."
echo ""
exec npm start
