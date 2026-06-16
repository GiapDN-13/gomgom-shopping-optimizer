#!/usr/bin/env bash
#
# Gomgom — Shopping Optimizer · Sprint 1 setup script
# ----------------------------------------------------
# Khởi tạo môi trường dev và (tùy chọn) tạo repo private trên GitHub rồi push.
#
# Cách dùng:
#   ./setup.sh                  # cài deps + chuẩn bị .env.local + init git
#   ./setup.sh --push           # như trên, rồi tạo repo GitHub private và push
#   ./setup.sh --push --public  # tạo repo public thay vì private
#   ./setup.sh --no-install     # bỏ qua bước npm install
#
# Yêu cầu: node >= 20, npm, git. Cho --push: gh CLI đã đăng nhập (gh auth login).

set -euo pipefail

# ---- cấu hình ----
REPO_NAME="gomgom-shopping-optimizer"
VISIBILITY="private"
DO_PUSH=false
DO_INSTALL=true

for arg in "$@"; do
  case "$arg" in
    --push)       DO_PUSH=true ;;
    --public)     VISIBILITY="public" ;;
    --private)    VISIBILITY="private" ;;
    --no-install) DO_INSTALL=false ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "Tham số không hợp lệ: $arg" >&2; exit 1 ;;
  esac
done

# chuyển về thư mục chứa script
cd "$(dirname "$0")"

log()  { printf '\033[1;32m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

need() { command -v "$1" >/dev/null 2>&1 || die "Thiếu '$1'. Vui lòng cài đặt trước."; }

# ---- 1. kiểm tra công cụ ----
log "Kiểm tra công cụ bắt buộc (node, npm, git)…"
need node; need npm; need git

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 20 ] || die "Cần Node >= 20 (đang dùng $(node -v))."
log "Node $(node -v), npm $(npm -v) OK."

# ---- 2. chuẩn bị .env.local ----
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  log "Đã tạo .env.local từ .env.example — nhớ điền giá trị Supabase."
else
  warn ".env.local đã tồn tại, giữ nguyên."
fi

# ---- 3. cài dependencies ----
if $DO_INSTALL; then
  log "Cài đặt dependencies (npm install)…"
  npm install
else
  warn "Bỏ qua npm install (--no-install)."
fi

# ---- 4. khởi tạo git ----
if [ ! -d .git ]; then
  log "Khởi tạo git repo…"
  git init -b main
else
  warn "Đã là git repo, bỏ qua git init."
fi

git add -A
if git diff --cached --quiet; then
  warn "Không có thay đổi để commit."
else
  git commit -m "chore: Sprint 1 project setup — Gomgom Shopping Optimizer

Next.js 16 + TypeScript + Tailwind v4 + Zustand + Framer Motion scaffold,
versioned /api/v1/ner stub (mock), /api/v1/optimize placeholder, Supabase
client, input sanitisation, CSP headers, Jest + CI pipeline."
  log "Đã commit."
fi

# ---- 5. tạo repo GitHub và push ----
if $DO_PUSH; then
  need gh
  gh auth status >/dev/null 2>&1 || die "gh chưa đăng nhập. Chạy: gh auth login"

  if gh repo view "$REPO_NAME" >/dev/null 2>&1; then
    warn "Repo '$REPO_NAME' đã tồn tại trên GitHub. Chỉ push."
    if ! git remote | grep -q '^origin$'; then
      OWNER="$(gh api user -q .login)"
      git remote add origin "https://github.com/$OWNER/$REPO_NAME.git"
    fi
    git push -u origin main
  else
    log "Tạo repo GitHub ($VISIBILITY) và push…"
    gh repo create "$REPO_NAME" \
      "--$VISIBILITY" \
      --source=. \
      --remote=origin \
      --description="Gomgom — Shopping Optimizer: Vietnamese smart grocery planning with fine-tuned NER & route optimization." \
      --push
  fi
  log "Hoàn tất! Repo: $(gh repo view "$REPO_NAME" --json url -q .url 2>/dev/null || echo "$REPO_NAME")"
else
  warn "Bỏ qua bước GitHub (chạy với --push để tạo repo & đẩy code)."
fi

log "Xong. Chạy 'npm run dev' để khởi động dev server."
