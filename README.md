# LiteMark

一个基于 Vue 3 + Vite 构建的个人书签管理应用，支持站点主题切换、书签增删改查以及多种对象存储驱动。

## Vercel 部署快速指南

1. **Fork / 克隆仓库**
   - 在 GitHub 上点击 “Fork” 将本仓库复制到自己的账号下，或 `git clone` 后推送到私有仓库。
2. **创建 Vercel Blob（可选，使用默认存储时必选）**
   - 登陆 [Vercel 控制台](https://vercel.com/)，在 `Storage → Blob` 新建一个 Blob Store，生成令牌。
3. **导入项目**
   - 打开 Vercel → “New Project”，选择刚刚 Fork 的仓库。
4. **配置环境变量**
   - 在 `Project Settings → Environment Variables` 填入所需变量（见下文“环境变量”一节）。
   - 对于 Vercel Blob，需设置 `BLOB_READ_WRITE_TOKEN`（或 `VERCEL_BLOB_READ_WRITE_TOKEN`）。
   - 可下载.env.local  根据需要配置环境变量，可直接导入文件
5. **可选：配置 `vercel.json`**
   - 若需自定义缓存 / SPA 路由，可在仓库根目录创建 `vercel.json`（示例见下文）。
6. **Deploy**
   - 点击 “Deploy”，等待构建完成。首个部署完成后，访问 `https://<project-name>.vercel.app` 即可访问首页，`/admin` 为后台入口。

> 若 `/admin` 返回 404，请确认 `vercel.json` 中的 rewrites 是否正确。

## 功能概览

- 响应式书签展示、搜索与分类统计
- 多主题（浅色、深色、Forest、Ocean 等）切换
- 管理端（`/admin`）：书签 CRUD、隐藏/显示、主题/站点信息维护
- 多存储驱动：Vercel Blob（默认）、S3、Cloudflare R2、阿里云 OSS、腾讯云 COS、WebDAV
- 内存缓存 + 定时刷新，可手动刷新缓存

## 开发环境

```bash
# 安装依赖
npm install
# 或使用 pnpm / yarn / bun
pnpm install
yarn install
bun install

# 本地开发（默认 5173 端口）
npm run dev

# 调试 Vercel Functions（需安装 Vercel CLI）
vercel dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

> 本地开发默认只启动前端，若希望同时调试 Serverless API，可使用 `vercel dev` 或部署到线上端点并设置 `VITE_API_BASE_URL`。

## 环境变量

在根目录创建 `.env.local`，或在 Vercel 项目中配置同名变量：

| 变量 | 说明 | 默认值 |
| ---- | ---- | ------ |
| `VITE_API_BASE_URL` | 前端调用 API 的基础地址。开发可设 `http://localhost:3000`。 | 空字符串（等同当前域名） |
| `STORAGE_DRIVER` | 对象存储驱动：`vercel-blob` / `s3` / `r2` / `oss` / `cos` / `webdav` | `vercel-blob` |
| `BLOB_READ_WRITE_TOKEN` | 使用 Vercel Blob 时的令牌 | - |
| `SETTINGS_CACHE_TTL_MS` | 站点设置缓存刷新周期（毫秒，0 关闭缓存） | `60000` |
| `BOOKMARKS_CACHE_TTL_MS` | 书签缓存刷新周期（毫秒，0 关闭缓存） | `60000` |

不同存储驱动还需补充各自的 Bucket、AccessKey 等配置，可参考 `api/_lib/storage.ts`。

## 可选：定制 `vercel.json`

```json
{
  "headers": [
    {
      "source": "/(.*)\\.(js|css|json|svg|png|jpg|jpeg|gif|webp|ico|woff2?)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

- 若希望关闭浏览器缓存，可将 `Cache-Control` 改为 `no-store`。
- 若使用 SPA 路由，`rewrites` 必须存在，避免 `/admin` 打开 404。

## 本地调试 API

- `npm run dev` 仅启动前端；API 需部署在 Vercel 或运行 `vercel dev`。
- 开发时可将 `VITE_API_BASE_URL` 指向线上 API（例如 `https://<project>.vercel.app`）。
- 后端函数的日志可在 Vercel Dashboard → Functions 查看。

## 缓存刷新说明

- **站点设置 / 书签缓存**：后端首读后写入内存，按 TTL 自动刷新；后台“刷新数据”按钮会同时刷新两类缓存并重新加载前端数据。
- **前端静态资源**：默认使用带 hash 的文件名，可通过 `vercel.json` 调整缓存策略。
- **API 304 响应**：请求会命中缓存但仍需网络验证。若希望完全禁用浏览器缓存，可在 `vercel.json` 中设置 `no-store`。

## 常见问题

1. `/admin` 404：检查 rewrites 或确认函数部署成功。
2. 刷新数据按钮无效：确认已登录，并在 Network 面板查看 `/api/settings/refresh` 与 `/api/bookmarks/refresh` 的响应码。
3. 书签列表为空：检查存储配置或在后台刷新缓存。
4. 本地跨域：确保前端 `VITE_API_BASE_URL` 与后端一致，或调整 CORS。

## 目录结构

```
├─ api/
│  ├─ bookmarks/
│  │  ├─ index.ts          # 列表、创建、删除、更新
│  │  └─ refresh.ts        # 刷新书签缓存
│  ├─ settings/
│  │  ├─ index.ts          # 获取/更新站点设置
│  │  └─ refresh.ts        # 刷新站点设置缓存
│  └─ _lib/                # 存储、缓存、鉴权等工具
├─ src/
│  ├─ pages/
│  │  ├─ HomePage.vue      # 首页书签展示
│  │  └─ AdminDashboard.vue # 后台管理
│  ├─ App.vue               # RouterView 容器
│  └─ main.ts               # 应用入口
└─ public/                  # 静态资源
```

## 更新记录

- 多存储驱动支持：Vercel Blob / S3 / R2 / OSS / COS / WebDAV。
- 后台管理页面：书签 CRUD、站点主题与图标配置、缓存刷新。
- 站点设置与书签的内存缓存 + 定时刷新，后台按钮可手动刷新。
- 响应式布局和移动端优化。

欢迎提交 Issue 或 PR 改进项目。
