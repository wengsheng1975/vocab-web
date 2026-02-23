#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const serverDir = path.join(root, 'server');
const clientDir = path.join(root, 'client');
const isWin = process.platform === 'win32';
const npmBin = isWin ? 'npm.cmd' : 'npm';

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function run(cmd, args, cwd, name) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: false,
      env: { ...process.env, NODE_ENV: 'development' },
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${name} 失败，退出码 ${code}`));
    });
  });
}

function startLongRunning(cmd, args, cwd, name) {
  const child = spawn(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, NODE_ENV: 'development' },
  });
  child.on('error', (err) => {
    console.error(`[${name}] 启动失败:`, err.message);
  });
  child.on('exit', (code) => {
    console.log(`[${name}] 已退出，退出码 ${code ?? 'null'}`);
  });
  return child;
}

function openBrowser(url) {
  if (isWin) {
    spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref();
    return;
  }
  const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(cmd, [url], { detached: true, stdio: 'ignore' }).unref();
}

async function main() {
  console.log('[1/4] 检查依赖...');
  if (!exists(path.join(serverDir, 'node_modules'))) {
    console.log('正在安装后端依赖...');
    await run(npmBin, ['install'], serverDir, '后端依赖安装');
  }
  if (!exists(path.join(clientDir, 'node_modules'))) {
    console.log('正在安装前端依赖...');
    await run(npmBin, ['install'], clientDir, '前端依赖安装');
  }

  console.log('[2/4] 启动后端...');
  const backend = startLongRunning(npmBin, ['start'], serverDir, '后端');

  console.log('[3/4] 启动前端...');
  const frontend = startLongRunning(
    npmBin,
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'],
    clientDir,
    '前端',
  );

  setTimeout(() => {
    console.log('[4/4] 打开浏览器...');
    openBrowser('http://127.0.0.1:5173');
    console.log('已启动完成。按 Ctrl+C 可停止前后端。');
  }, 3000);

  const stop = () => {
    if (!backend.killed) backend.kill();
    if (!frontend.killed) frontend.kill();
    process.exit(0);
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

main().catch((err) => {
  console.error('启动失败:', err.message);
  process.exit(1);
});
