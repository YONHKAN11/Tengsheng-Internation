#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "未检测到 Docker，请先安装：curl -fsSL https://get.docker.com | sh"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "未检测到 docker compose 插件，请安装 docker-compose-plugin"
  exit 1
fi

if [ ! -f deploy.env ]; then
  cp deploy.env.example deploy.env
  echo "已生成 deploy.env，请填写 DOMAIN、ADMIN_PASSWORD 后重新运行。"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source deploy.env
set +a

if [ "${DOMAIN}" = "example.com" ]; then
  echo "请先在 deploy.env 中填写 DOMAIN"
  exit 1
fi

if [ "${ADMIN_PASSWORD}" = "change-this" ]; then
  echo "请先在 deploy.env 中设置 ADMIN_PASSWORD（建议只用字母和数字）"
  exit 1
fi

if printf '%s' "${DOMAIN}" | grep -Eq '^([0-9]{1,3}\.){3}[0-9]{1,3}$'; then
  PUBLIC_URL="http://${DOMAIN}"
  CADDYFILE="Caddyfile.ip"
  echo "检测到 IP 地址：使用 HTTP 模式（无 HTTPS）。绑定域名后修改 DOMAIN 并重新运行即可启用 HTTPS。"
else
  PUBLIC_URL="https://${DOMAIN}"
  CADDYFILE="Caddyfile"
fi
export PUBLIC_URL CADDYFILE

if [ "${PAYLOAD_SECRET}" = "change-this" ] || [ -z "${PAYLOAD_SECRET:-}" ]; then
  PAYLOAD_SECRET="$(openssl rand -hex 32)"
  sed -i "s|^PAYLOAD_SECRET=.*|PAYLOAD_SECRET=${PAYLOAD_SECRET}|" deploy.env
fi

if [ "${DB_PASSWORD}" = "change-this" ] || [ -z "${DB_PASSWORD:-}" ]; then
  DB_PASSWORD="$(openssl rand -hex 16)"
  sed -i "s|^DB_PASSWORD=.*|DB_PASSWORD=${DB_PASSWORD}|" deploy.env
fi

echo "拉取镜像（由 GitHub Actions 构建）..."
docker compose --env-file deploy.env -f docker-compose.prod.yml pull

echo "启动服务..."
docker compose --env-file deploy.env -f docker-compose.prod.yml up -d

echo
echo "启动完成：https://${DOMAIN}/admin"
echo "查看日志：docker compose --env-file deploy.env -f docker-compose.prod.yml logs -f cms"
echo
echo "首次部署：等待 cms 日志出现 Seeded 后，把 deploy.env 中 PAYLOAD_PUSH 改为 false，再执行："
echo "  docker compose --env-file deploy.env -f docker-compose.prod.yml up -d cms"
