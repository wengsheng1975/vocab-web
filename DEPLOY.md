# EnglishReader 公网部署指南（Railway）

目标：让任意电脑通过一个网址直接访问你的 App。

## 方案

- 单容器部署（本仓库已支持）：前端构建后由后端统一托管
- 数据库：SQLite，必须挂载持久化磁盘（否则重启/重建后数据会丢失）

## 0. 你已具备的条件

- 根目录 `Dockerfile`：已就绪
- 前端 API 使用相对路径 `/api`：已就绪
- 后端支持 `CORS_ORIGINS` 环境变量：已就绪

## 1. 上传代码到 GitHub

```bash
git add -A
git commit -m "chore: deploy updates"
git push origin main
```

## 2. 在 Railway 创建服务

1. 登录 Railway
2. `New Project` → `Deploy from GitHub repo`
3. 选择仓库 `wengsheng1975/vocab-web`
4. Railway 会自动识别根目录 `Dockerfile` 并构建

## 3. 必填环境变量

- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET=<64位随机字符串>`
- `DATA_DIR=/data`
- `CORS_ORIGINS=https://你的railway域名`
- `CRAWLER_INSECURE_TLS=false`

生成 JWT_SECRET（本地执行）：

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 4. 配置持久化磁盘（非常重要）

1. 打开该 Service → `Volumes`
2. 添加 Volume
3. 挂载路径填：`/data`

说明：你的 SQLite 数据库存放在 `DATA_DIR`，这里必须是持久化卷。

## 5. 生成公网网址

1. Service → `Settings` / `Networking`
2. 点击 `Generate Domain`
3. 得到形如 `https://xxx.up.railway.app` 的网址
4. 把这个网址填回 `CORS_ORIGINS`，然后 `Redeploy`

## 6. 部署完成后验证

1. 打开 Railway 域名
2. 注册一个测试账号
3. 导入文章并标注生词
4. 在 Railway 执行一次 `Restart`，确认数据仍在（验证持久化成功）

## 7. 自定义域名（可选）

1. 在 Railway 域名设置中添加自定义域名
2. 按提示配置 DNS（通常是 `CNAME`）
3. 生效后把 `CORS_ORIGINS` 更新为你的正式域名

## 8. 常见问题

- 页面能开但接口报跨域：`CORS_ORIGINS` 要与实际域名完全一致（含 `https://`）
- 重启后数据丢失：Volume 未挂载到 `/data`
- 登录失败：`JWT_SECRET` 为空或太短
- 首次访问慢：免费实例冷启动属于正常现象
