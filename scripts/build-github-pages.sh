#!/usr/bin/env bash
set -euo pipefail

api_route="src/app/api/space-weather/route.ts"
disabled_route="${api_route}.pages-disabled"

if [[ ! -f "$api_route" ]]; then
  echo "Expected Vercel API route at $api_route" >&2
  exit 1
fi

restore_api_route() {
  if [[ -f "$disabled_route" ]]; then
    mv "$disabled_route" "$api_route"
  fi
}
trap restore_api_route EXIT

mv "$api_route" "$disabled_route"
BUILD_TARGET=github-pages NEXT_PUBLIC_BASE_PATH=/marscraft npm run build
