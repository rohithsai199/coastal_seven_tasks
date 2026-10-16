#!/usr/bin/env bash
# ==============================================================================
# Full-Stack Deployment Pipeline Automation Script
# Dual-Hosting: Backend (Render) + Frontend (Vercel)
# ==============================================================================
set -euo pipefail

# 1. Colors & Banner
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}   Full-Stack Deployment Pipeline (Render + Vercel)              ${NC}"
echo -e "${BLUE}   Repository: https://github.com/rohithsai199/coastal_seven_tasks${NC}"
echo -e "${BLUE}================================================================${NC}"

# 2. Check Prerequisites
command -v curl >/dev/null 2>&1 || { echo -e "${RED}Error: curl is required.${NC}" >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is required.${NC}" >&2; exit 1; }

# 3. Environment Variables or Inputs
RENDER_BACKEND_URL="${RENDER_BACKEND_URL:-${1:-}}"
RENDER_DEPLOY_HOOK="${RENDER_DEPLOY_HOOK:-}"

if [ -z "$RENDER_BACKEND_URL" ]; then
  read -r -p "Enter your live Render Backend URL (e.g., https://coastal-seven-backend.onrender.com): " RENDER_BACKEND_URL
fi

# Strip trailing slash
RENDER_BACKEND_URL="${RENDER_BACKEND_URL%/}"
WS_HOST="${RENDER_BACKEND_URL#https://}"
WS_HOST="${WS_HOST#http://}"
RENDER_WS_URL="wss://${WS_HOST}"

echo -e "\n${YELLOW}[1/4] Triggering Backend Deployment on Render...${NC}"
if [ -n "$RENDER_DEPLOY_HOOK" ]; then
  echo "Invoking Render Deploy Hook..."
  curl -s -X POST "$RENDER_DEPLOY_HOOK"
  echo -e "${GREEN}Deploy hook triggered successfully!${NC}"
else
  echo "No RENDER_DEPLOY_HOOK provided. Assuming Render is set to auto-deploy on git push."
fi

echo -e "\n${YELLOW}[2/4] Verifying Backend Health Check...${NC}"
echo "Pinging ${RENDER_BACKEND_URL}/health ..."
MAX_ATTEMPTS=25
COUNT=0
HEALTHY=false

while [ "$COUNT" -lt "$MAX_ATTEMPTS" ]; do
  COUNT=$((COUNT + 1))
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${RENDER_BACKEND_URL}/health" || echo "000")
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo -e "${GREEN}✓ Backend is healthy (HTTP 200) at ${RENDER_BACKEND_URL}/health${NC}"
    HEALTHY=true
    break
  fi
  echo "Attempt $COUNT/$MAX_ATTEMPTS: Status $HTTP_STATUS. Waiting 10s..."
  sleep 10
done

if [ "$HEALTHY" = false ]; then
  echo -e "${YELLOW}Warning: Backend did not return 200 within timeout. Continuing with frontend build...${NC}"
fi

echo -e "\n${YELLOW}[3/4] Compiling Frontend Production Bundle with Vite...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR/ecommerce_frontend"

export VITE_API_URL="$RENDER_BACKEND_URL"
export VITE_WS_URL="$RENDER_WS_URL"

echo "Injected VITE_API_URL=$VITE_API_URL"
echo "Injected VITE_WS_URL=$VITE_WS_URL"

npm install
npm run build

echo -e "${GREEN}✓ Frontend production build compiled successfully into dist/${NC}"

echo -e "\n${YELLOW}[4/4] Deploying Frontend to Vercel...${NC}"
if command -v vercel >/dev/null 2>&1; then
  echo "Running Vercel production deployment..."
  vercel --prod --yes \
    --env VITE_API_URL="$VITE_API_URL" \
    --env VITE_WS_URL="$VITE_WS_URL" \
    --build-env VITE_API_URL="$VITE_API_URL" \
    --build-env VITE_WS_URL="$VITE_WS_URL"
  echo -e "${GREEN}✓ Vercel deployment complete!${NC}"
else
  echo -e "${YELLOW}Notice: 'vercel' CLI not detected locally.${NC}"
  echo -e "You can deploy directly by linking your GitHub repository to Vercel:"
  echo -e "  1. Go to https://vercel.com/new"
  echo -e "  2. Import 'rohithsai199/coastal_seven_tasks'"
  echo -e "  3. Set Root Directory to 'ecommerce_frontend'"
  echo -e "  4. Set Environment Variable: VITE_API_URL = ${RENDER_BACKEND_URL}"
  echo -e "  5. Set Environment Variable: VITE_WS_URL = ${RENDER_WS_URL}"
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}   Deployment Pipeline Sequence Completed Successfully!         ${NC}"
echo -e "${GREEN}================================================================${NC}"
