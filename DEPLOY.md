# EnglishReader 公网部署指南（GitHub Node.js）

目标：让任意电脑通过一个网址直接访问你的 App。

## 结论先说

- GitHub **可以运行 Node.js**（Actions / Codespaces），但 GitHub Pages 只适合静态站点。
- 你要求“不要 HTML 静态发布”，本仓库已改为 **GitHub Codespaces 运行完整 Node 应用**。
- 访问网址形态：`https://<codespace-name>-3000.app.github.dev`

## 0. 你已具备的条件

- `.devcontainer/devcontainer.json`：已就绪
- `scripts/start-github-codespace.sh`：已就绪（构建前端并启动后端）

## 1. 在 GitHub 创建 Codespace

1. 打开仓库页面 `Code` → `Codespaces` → `Create codespace on main`
2. 等待初始化完成

## 2. 启动应用

在 Codespace 终端运行：

```bash
./scripts/start-github-codespace.sh
```

## 3. 打开公网网址

1. 在 Codespaces 的 `Ports` 面板找到 `3000`
2. 将可见性改为 `Public`
3. 点击端口对应 URL 打开（即公网地址）

## 4. 部署后验证

1. 用该 URL 打开
2. 注册一个测试账号
3. 导入文章并标注生词
4. 切换到另一台电脑，用同一 URL 验证访问

## 5. 重要说明

- Codespace 停止后，网址不可访问（适合演示与测试）。
- 如果你要“7x24 小时长期在线”，仍需 Railway/Render/VPS。

## 6. 常见问题

- 打不开页面：确认 `PORT 3000` 已设为 `Public`
- 运行报错：在 Codespace 终端重新执行 `./scripts/start-github-codespace.sh`
- 数据丢失：Codespace 被重建后本地数据不会保留，需导出或改用持久化云服务
