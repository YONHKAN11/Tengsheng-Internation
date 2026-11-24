# 阿里云香港轻量 · 单机部署指南

一台服务器跑完整网站：Caddy（HTTPS）+ 静态站 + Payload 后台 + Postgres + 媒体文件。

## 0. 前提

- 阿里云轻量应用服务器（**中国香港 / 韩国 / 新加坡**，不要大陆地域）
- Ubuntu 22.04 / 24.04，2 核 2G 起
- 域名已解析到服务器公网 IP（A 记录 `@` 与 `www`）
- 防火墙放行 22 / 80 / 443

## 1. 连接服务器

```powershell
ssh root@服务器公网IP
```

## 2. 安装 Docker

```bash
apt update && apt upgrade -y
apt install -y git curl

curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
docker --version
```

2G 内存建议加 swap：

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 3. 拉取项目

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/YONHKAN11/Tengsheng-Internation.git
cd Tengsheng-Internation
```

## 4. 配置

```bash
cp deploy.env.example deploy.env
nano deploy.env
```

填写：

```
DOMAIN=你的域名.com
ACME_EMAIL=你的邮箱
ADMIN_EMAIL=admin@tengsheng.local
ADMIN_PASSWORD=你的强密码（建议字母数字）
PAYLOAD_PUSH=true
```

`DB_PASSWORD` 和 `PAYLOAD_SECRET` 保持 `change-this`，脚本会自动生成。

## 5. 启动

```bash
bash deploy.sh
```

首次会构建镜像，约 5–10 分钟。

查看日志：

```bash
docker compose --env-file deploy.env -f docker-compose.prod.yml logs -f cms
```

看到：

```
Seeded: admin user, brands, company, 12 vehicles
```

说明数据库和示例数据已创建好。

## 6. 关闭首次建表开关

编辑 `deploy.env`：

```
PAYLOAD_PUSH=false
```

重启后台：

```bash
docker compose --env-file deploy.env -f docker-compose.prod.yml up -d cms
```

## 7. 访问

```
https://你的域名/admin
```

用 `ADMIN_EMAIL / ADMIN_PASSWORD` 登录。

Caddy 会自动申请 Let's Encrypt 证书，首次访问可能需要几秒。

## 8. 以后更新

```bash
cd /opt/Tengsheng-Internation
git pull
bash deploy.sh
```

后台保存内容会自动触发 `site-builder` 重建静态站，无需手动操作。

## 9. 备份

```bash
# 数据库
docker compose --env-file deploy.env -f docker-compose.prod.yml exec -T db \
  pg_dump -U tengsheng tengsheng > backup-$(date +%F).sql

# 媒体文件
docker run --rm -v tengsheng-internation_media:/data -v "$PWD":/backup alpine \
  tar czf /backup/media-$(date +%F).tgz -C /data .
```

建议把备份下载到本地，或同步到对象存储。

## 10. 常见问题

**证书申请失败**
- 域名 A 记录未生效：`ping 你的域名` 应返回服务器 IP
- 80/443 未放行
- 域名实名未通过

**后台 502**
- `docker compose ... logs cms` 看报错
- 首次构建未完成，等几分钟
- 内存不足：加 swap 或升级到 2G 以上

**页面 404 / 空白**
- `docker compose ... logs site-builder` 看构建是否成功
- `docker compose ... restart site-builder` 手动重建

**修改域名后**
- 更新 `deploy.env` 的 `DOMAIN`
- `docker compose ... up -d`
- Caddy 会重新申请证书
