# EnglishReader 启动说明

## 环境要求

- Node.js 22 LTS（推荐）
- npm 10+

## 快速启动

1. 启动后端

```bash
cd server
npm install
npm start
```

后端地址：`http://localhost:3000`

2. 启动前端

```bash
cd client
npm install
npm run dev
```

前端地址：`http://localhost:5173`

## 常见问题

1. 端口占用

- 检查 `3000` 和 `5173` 端口是否被其他进程占用。

2. Node 版本不兼容

- 建议使用 Node.js 22 LTS。

3. 依赖安装失败

- 先执行 `npm cache clean --force`，再重新执行 `npm install`。

## 使用流程

1. 注册并登录
2. 导入英文文章
3. 开始阅读并点击生词
4. 完成阅读后查看报告
5. 在生词本和学习进度页面持续复习
