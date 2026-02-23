# EnglishReader 公网部署指南

目标：让任意电脑通过一个网址直接访问你的 App。

## 方案（推荐）

- 单容器部署（本仓库已支持）：前端构建后由后端统一托管
- 数据库：SQLite，必须挂载持久化磁盘（否则重启/重建后数据会丢失）

## 0. 你已具备的条件

- 根目录 `Dockerfile`：已就绪
- 前端 API 使用相对路径 `/api`：已就绪
- 后端支持 `CORS_ORIGINS` 环境变量：已就绪

## 1. 上传代码到 GitHub

```bash
git add -A
git commit -m "chore: add production deploy files"
git push origin main
```

## 2. 在云平台创建服务（以 Render 为例）

1. 登录 Render
2. 新建 `Web Service`
3. 连接你的 GitHub 仓库 `vocab-web`
4. 运行环境选择 `Docker`
5. Root Directory 保持仓库根目录
6. 端口使用 `3000`

## 3. 必填环境变量

- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET=<64位随机字符串>`
- `DATA_DIR=/app/server/data`
- `CORS_ORIGINS=https://你的服务域名`
- `CRAWLER_INSECURE_TLS=false`

生成 JWT_SECRET（本地执行）：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 4. 配置持久化磁盘（非常重要）

- 挂载路径：`/app/server/data`
- 容量：`1GB` 起

说明：你的 SQLite 数据库在这个目录下，不挂载磁盘会导致数据不持久。

## 5. 部署完成后验证

1. 打开平台给你的 URL（例如 `https://xxx.onrender.com`）
2. 注册一个测试账号
3. 导入文章并标注生词
4. 重启服务后再次访问，确认数据仍在（验证持久化成功）

## 6. 绑定你自己的域名（可选）

1. 在平台的 Custom Domain 页面添加域名（如 `app.yourdomain.com`）
2. 按提示在域名 DNS 增加 `CNAME`
3. 生效后把 `CORS_ORIGINS` 更新为你的正式域名

## 7. 常见问题

- 页面能开但接口报跨域：检查 `CORS_ORIGINS` 是否与实际域名完全一致（含 `https://`）
- 重启后数据丢失：未正确挂载持久化磁盘
- 登录失败：检查 `JWT_SECRET` 是否为空
