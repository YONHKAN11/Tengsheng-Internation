# Tengsheng International — 汽车出口展示平台

英文汽车出口展示网站 + 可独立运行的内容管理后台（Payload CMS）。网站当前以**纯静态**方式交付，不需要服务器即可上线；图片/视频由管理员在后台自行上传，再导出到静态站。

- 公司名：**Tengsheng International Co., Limited**
- 联系邮箱：**qdeng4349@gmail.com**
- WhatsApp：**+1 602 538 6777**
- 站点语言：英文（界面与文案）

---

## 1. 目录结构

```
tengsheng-auto-export/
├── site/                     # 静态展示站（当前上线形态）
│   ├── content/              # 站点内容：公司、车源、品牌、市场、媒体映射
│   │   ├── site.json
│   │   ├── vehicles.json
│   │   ├── brands.json       # 由 CMS 导出：品牌资料、logo 与车辆数
│   │   ├── markets.json
│   │   └── media.json        # 由 CMS 导出，管理员上传的图片/视频
│   ├── assets/               # 样式、交互、占位图、上传的媒体
│   ├── tools/                # 占位图生成脚本
│   ├── build.py              # 静态站生成器
│   └── dist/                 # 构建产物（直接上传即可）
└── cms/                      # Payload CMS 后台（本地运行，未来可上云）
    ├── src/collections/      # Photos / Videos / Brands / Vehicles / Users
    ├── src/globals/Company.ts
    ├── src/seed.ts           # 首次启动：管理员、品牌、公司、12 台车源
    ├── scripts/export-static.ts  # 后台内容 → 静态站
    └── .env                  # 本地配置（含管理员初始密码）
```

---

## 2. 立即预览网站

网站页面已经把 **CSS、JavaScript、占位图全部内联**，不需要服务器，也不依赖外部资源。用 Chrome / Edge 直接打开：

```
C:\Users\32749\AppData\Roaming\reasonix\workspaces\auto\tengsheng-auto-export\site\dist\index.html
```

> 如果双击后显示成白底黑字的源码或“无样式”，说明它被代码编辑器/文本预览器打开了，而不是浏览器。请右键 → 打开方式 → Chrome / Edge；或在地址栏输入上面的文件路径。

更接近真实上线效果的方式（推荐）：

```bash
cd site
python build.py --serve      # http://localhost:8080
```

重新构建（修改 `site/content/*.json` 后）：

```bash
cd site
python build.py
```

---

## 3. 上线到境外静态托管

`site/dist/` 是纯 HTML/CSS/JS，可直接上传到任意静态托管：

| 平台 | 做法 |
| --- | --- |
| Cloudflare Pages | 上传 `site/dist`，或连接 Git 仓库执行 `python build.py` |
| Netlify | 同上，发布目录设为 `site/dist` |
| GitHub Pages | 将 `site/dist` 推送到 `gh-pages` 分支 |
| S3 / OSS + CDN | 同步 `site/dist` 到存储桶并开启静态网站托管 |
| 自有 nginx | 将 `site/dist` 作为站点根目录 |

**上线前请设置站点域名**：编辑 `site/content/site.json` 的 `"baseUrl": ""`，填入正式域名（如 `https://www.example.com`），然后重新构建。设置后会自动生成 `sitemap.xml`、`robots.txt`、canonical 与 Open Graph 绝对地址。

> 表单不需要服务器：提交时调用 WhatsApp 或本机邮件客户端，把内容直接发给 `qdeng4349@gmail.com` / `+1 602 538 6777`。

---

## 4. 管理员后台（上传图片与视频）

后台是独立的 Payload CMS 工程，**只在需要编辑内容时本地/自己服务器上运行**，不对外提供服务，因此静态站依然零服务器。

### 4.1 启动后台（无需安装 Node）

项目已经内置了 Windows 版 Node 运行时（`runtime/node`）和后台依赖（`cms/node_modules`），**不需要另外安装 Node.js**。

直接双击项目根目录的：

```
启动后台.bat
```

也可以直接双击桌面上的 **Tengsheng Admin** 快捷方式（已创建）；网站则双击 **Tengsheng Website**。

脚本会：

- 自动使用内置 Node 运行时
- 检查依赖（已内置，通常直接跳过；缺失时自动 `npm ci`）
- 启动服务，并自动在浏览器打开 `http://localhost:3000/admin`

登录账号：

```
邮箱：admin@tengsheng.local
密码：Tengsheng-Admin-2026
```

> 启动后台的黑色窗口**不能关闭**；关闭窗口后台就停止。网站静态页不受影响。
> 如果 3000 端口被占用，窗口里会提示实际端口（如 3001），以窗口提示为准。

手动启动方式（可选）：

```bash
cd cms
..\runtime\node\npm.cmd run dev
```

首次启动会自动创建数据库（`cms/tengsheng.db`）并写入管理员、品牌、公司与示例车源；数据库已存在时不会重复写入。若删除该文件，下次启动会自动重建。

如需更换账户信息，修改 `cms/.env` 后删除 `cms/tengsheng.db` 重新启动（会重建数据库；已有媒体的导出文件不受影响）。

### 4.2 上传流程

1. 左侧 **Media → Photos**：上传车辆照片（JPG/WebP，建议宽 1600px，单张 < 400 KB），填写 Alt 描述。
2. 左侧 **Media → Videos**：上传车辆视频（MP4 / H.264，1080p，单个 < 50 MB），可关联一张封面图。
3. 左侧 **Inventory → Vehicles**：打开某台车 → `Photos & video` 标签页 → 选择刚上传的照片与视频，拖动排序（第一张为封面）。
4. 点击 **Save**。后台会在 1–2 秒后**自动导出内容与媒体，并重建** `site/dist`（后台窗口日志显示 `Auto-sync complete`）。
5. 刷新网站即可看到更新；上线时把 `site/dist` 整个目录上传到托管平台即可。

> 自动同步由保存动作触发：车辆、品牌、图片/视频、公司信息、Vehicle page 文案保存后都会自动重建。若日志显示 `Auto-sync failed`，可双击 `同步到网站.bat` 手动重试。

导出脚本会：

- 把 `cms/media`、`cms/videos` 中的文件复制到 `site/assets/img/uploads`、`site/assets/video`
- 写入 `site/content/media.json`（每台车的图片/视频列表）
- 用后台的车辆数据重写 `site/content/vehicles.json`
- 同步公司名、标语、邮箱、WhatsApp 到 `site/content/site.json`

### 4.3 品牌、车型与车辆管理

后台对所有品牌开放，没有锁定名单：

- **新建 / 修改 / 删除品牌**：`Inventory → Brands`。可改名称、国家、简介、logo、封面、官网、排序、首页推荐；`notes` 为内部备注，不会发布。
- **删除品牌会级联删除其车辆**：品牌编辑页底部的 `Vehicles` 列表会显示该品牌全部车辆；删除品牌时，系统会先删除这些车辆，避免残留数据。
- **车型与配置**：在 `Inventory → Vehicles → Specifications` 中编辑型号（model）、配置（trim）、车身、燃料、动力、变速箱、驱动、座位、颜色、港口等；`Overview` 中修改价格、车况、描述与状态。
- **更换品牌图片**：在 `Media → Photos` 上传后，可在照片右侧把照片归档到某个品牌；品牌的 logo / 封面在品牌编辑页选择对应照片即可。
- **价格**：每台车独立定价（USD，指示性 FOB），可在车辆列表或详情中随时修改。

导出后，品牌资料会写入 `site/content/brands.json`，并生成 `/brands.html` 与 `/brands/<品牌>.html` 页面（含 logo、国家、简介、官网与在售车辆）。

### 4.4 车辆详情页文案

`Site Content → Vehicle page` 集中管理所有车辆详情页的通用文案，无需改代码：

- **Media & price**：无图片时的提示（Media pending）、媒体说明、价格标签（Indicative FOB）、价格说明
- **Section titles**：About this vehicle、Specifications、Equipment & features、Export terms
- **Export terms**：右侧条款行，可增删（Terms / Shipping / Documents / Inspection）
- **Inquiry & sourcing**：WhatsApp / 邮件按钮文案、流程链接、采购说明、相关推荐标题

每台车自己的价格、车型、配置、描述、特性、照片与视频，仍在 `Inventory → Vehicles` 修改。改完后执行 `npm run export:static` 并重新构建静态站。

### 4.5 尚未上传媒体时

网站会显示原创的金色线稿占位图，并标注 “Media pending / Managed in the admin panel”。上传后重新导出并构建，占位图自动被真实照片替换。占位图可用 `site/tools/make_placeholders.py` 重新生成。

---

## 5. 修改网站内容

| 想改什么 | 改哪里 |
| --- | --- |
| 公司名、邮箱、WhatsApp、首页大标题 | `site/content/site.json`（或后台 Company） |
| 车源（价格、规格、描述） | 后台 Vehicles，或 `site/content/vehicles.json` |
| 详情页通用文案（媒体提示、Export terms、按钮） | 后台 Site Content → Vehicle page |
| 品牌资料、logo、官网、排序 | 后台 Brands，或 `site/content/brands.json` |
| 出口区域、国家、Incoterms | `site/content/markets.json` |
| 图片与视频 | 后台上传后 `npm run export:static` |
| 颜色、字体、间距 | `site/assets/css/main.css` 顶部 CSS 变量 |
| 新增页面 | 在 `site/build.py` 中增加构建函数 |

重新构建：`cd site && python build.py`。

---

## 6. 云端部署（Railway + Cloudflare Pages）

正式运营、零服务器运维的架构：

```
管理员 → Railway 上的 Payload 后台（Postgres + R2）
                    ↓ 保存后触发 Deploy Hook
Cloudflare Pages（构建时从 CMS API 拉取内容）→ 全球 CDN
```

后台保存后自动触发 Cloudflare Pages 重建，无需本地同步脚本；本机仍可保留 SQLite 版本用于开发与预览。

### 6.1 准备账号

| 服务 | 用途 | 费用 |
| --- | --- | --- |
| Neon | Postgres 数据库 | 免费额度起步 |
| Cloudflare R2 | 图片/视频存储 | 10GB 免费 |
| Railway | 运行 Payload 后台 | 约 $5/月起 |
| Cloudflare Pages | 静态站 CDN | 免费 |
| Cloudflare DNS | 域名解析 + SSL | 免费 |

### 6.2 Neon（数据库）

1. 创建项目与数据库，复制连接串（带 `sslmode=require`）。
2. 记录为 Railway 的 `DATABASE_URL`。

### 6.3 Cloudflare R2（媒体）

1. 创建 bucket，例如 `tengsheng-media`。
2. 创建 API Token（Object Read & Write），记录 Access Key / Secret。
3. 给 bucket 绑定公开访问域名（自定义域或 r2.dev），记录为 `S3_PUBLIC_URL`。
4. 对应环境变量：`S3_BUCKET`、`S3_ENDPOINT`、`S3_REGION=auto`、`S3_ACCESS_KEY_ID`、`S3_SECRET_ACCESS_KEY`、`S3_PUBLIC_URL`。

### 6.4 Railway（后台）

#### 最简模式（推荐，只有 4 个变量）

不配置 `S3_*`，媒体直接存 Railway Volume：

1. Railway 服务 → **Volumes** → 新建一个卷，挂载到 `/data`。
2. 环境变量只填：
   ```
   DATABASE_URL=postgresql://...   # Neon
   PAYLOAD_SECRET=<长随机串>
   ADMIN_EMAIL=admin@tengsheng.local
   ADMIN_PASSWORD=<强密码>
   MEDIA_DIR=/data/media
   VIDEOS_DIR=/data/videos
   PAYLOAD_PUSH=true               # 仅首次建表，成功后删除
   ```
3. 部署完成后访问 `https://<railway 域名>/admin`。
4. 图片/视频 URL 形如 `https://<railway 域名>/api/media/file/...`，静态站构建时会自动转成绝对地址。
5. 静态站可以继续用 Cloudflare Pages，也可以把 `发布包.zip` 拖到 Netlify（0 配置）。

> Volume 单实例、备份需手动；图片量很大或需要多实例时，再改用 R2（配置 `S3_*` 即可自动切换）。

#### 完整模式（R2 媒体）

1. 把项目推到 GitHub，Railway → New Project → Deploy from GitHub，Root Directory 选 `cms`（`railway.toml` 已提供）。
2. 环境变量：
   ```
   DATABASE_URL=postgresql://...   # Neon
   PAYLOAD_SECRET=<长随机串>
   ADMIN_EMAIL=admin@tengsheng.local
   ADMIN_PASSWORD=<强密码>
   PAYLOAD_PUSH=true               # 首次部署建表，成功后删除
   S3_BUCKET / S3_ENDPOINT / S3_REGION / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_PUBLIC_URL
   DEPLOY_HOOK_URL=<下一步获得>
   ```
3. 首次部署设置 `PAYLOAD_PUSH=true`，让 Payload 在 Postgres 中建表并写入种子内容；日志出现 `Seeded` 后删除该变量并重新部署。
4. 访问 `https://<railway-domain>/admin`，用 `ADMIN_EMAIL / ADMIN_PASSWORD` 登录。

> 云端后台首次启动会自动创建：管理员、10 个品牌、12 台示例车源、公司信息、Vehicle page 文案。
> 本地修改过的价格或上传的图片不会自动迁移，需要在云端后台重新录入/上传。

### 6.5 Cloudflare Pages（静态站）

1. Cloudflare Pages → Create project → 连接同一 GitHub 仓库。
2. 构建配置：
   - Root directory：`site`
   - Build command：`node tools/fetch-content.mjs && python build.py`
   - Build output directory：`dist`
3. 环境变量：`CMS_URL=https://<railway-domain>`。
4. 在 `site/content/site.json` 填写正式域名 `baseUrl`（或构建前修改），用于 sitemap 与 canonical。
5. 首次构建会从 CMS 拉取内容并生成静态页。

> Cloudflare Pages 构建镜像自带 Python 3。若你的项目设置里没有 Python，可改用 GitHub Actions 构建后 `wrangler pages deploy`，或在本地运行 `python build.py` 后上传 `site/dist`。

### 6.6 自动发布

1. Cloudflare Pages → Settings → Builds & deployments → Deploy hooks，创建一个 hook。
2. 把 hook URL 填入 Railway 的 `DEPLOY_HOOK_URL`。
3. 后台任何保存（车辆、品牌、图片/视频、公司信息、Vehicle page）都会触发 Pages 重建，1–2 分钟后网站更新。

### 6.7 数据迁移（可选）

当前本地数据在 `cms/tengsheng.db`（SQLite），云端使用 Postgres。两种方式：

- **重新录入**：云端已自动生成同样的示例数据，直接在后台改价格/描述、重新上传图片即可（数据量小时最快）。
- **脚本迁移**：后续可提供 REST 迁移脚本，从本地 CMS 导出并推送到云端（需要本地与云端后台同时运行）。

### 6.8 Docker / VPS 备用

如果不想用 Railway，也可以用一台 VPS（Hetzner / Vultr / DigitalOcean）：

```bash
cd cms
# 修改 docker-compose.yml 里的数据库密码与 PAYLOAD_SECRET
docker compose up -d --build
```

- 首次启动会创建 Postgres 表并写入种子数据；日志出现 `Seeded` 后，删除 `PAYLOAD_PUSH` 并 `docker compose up -d`。
- 媒体默认写入容器卷 `media` / `videos`；生产建议改用 R2（配置 `S3_*` 后自动切换）。
- 健康检查：`GET /api/health` 返回 `{"status":"ok"}`。

### 6.9 上线检查

- [ ] 修改管理员初始密码，启用强密码
- [ ] 后台仅通过 HTTPS 访问；可加 Cloudflare Access 限制登录 IP
- [ ] `site/content/site.json` 的 `baseUrl` 已填正式域名
- [ ] R2 bucket 公开域名可访问，图片 URL 正常
- [ ] Cloudflare Pages 构建成功，页面图片来自 R2
- [ ] Deploy Hook 生效：后台保存后网站自动更新
- [ ] 数据备份：Neon 自动备份 + R2 版本控制（可选）

---

## 7. 常用命令

```bash
# 静态站
cd site && python build.py            # 构建到 dist/
cd site && python build.py --serve    # 本地预览 http://localhost:8080
cd site && python tools/make_placeholders.py   # 重建占位图

# 后台
cd cms && npm run dev                 # http://localhost:3000/admin
cd cms && npm run build               # 生产构建
cd cms && npm run export:static       # 导出内容与媒体到静态站
cd cms && npm run generate:types      # 数据结构变更后重新生成类型
```

---

## 8. 注意事项

- `cms/.env` 与 `cms/tengsheng.db` 含密钥与账户信息，请勿公开上传；`site/dist` 不含任何后台凭证。
- `ADMIN_PASSWORD` 中避免使用 `#`：dotenv 会把它当成注释，导致密码被截断（本项目已改用不含 `#` 的初始密码）。
- 初始密码仅用于首次登录，上线前请修改。
- 交付目录已内置 `runtime/node`（Node 运行时）与 `cms/node_modules`（后台依赖），因此**无需安装 Node**；两者合计约 1.1 GB。如需精简，可删除这两个目录，之后自行安装 Node 22.23.5+ 并在 `cms` 下执行 `npm ci`。
- `npm run export:static` 已固定以 `NODE_ENV=production` 运行，避免 SQLite 开发模式重复写入表结构。
- 供应商提供的照片/视频需自行确认版权与可发布区域，详见网站 `Media & credits` 页面。
- 车源价格均为示例的指示性 FOB 价格，实际报价以后台/合同为准。
