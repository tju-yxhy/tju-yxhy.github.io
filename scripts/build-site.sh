#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist/longmarch
cp index.html dist/longmarch/index.html
cp -R src dist/longmarch/src

cat > dist/index.html <<'HTML'
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=/longmarch/">
  <title>长征·足迹</title>
</head>
<body>
  <p>正在前往 <a href="/longmarch/">长征·足迹</a>…</p>
  <script>location.replace('/longmarch/' + location.search + location.hash);</script>
</body>
</html>
HTML
