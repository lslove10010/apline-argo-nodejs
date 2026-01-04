#!/usr/bin/env node
// 超低内存版 Argo + Xray + 哪吒一键脚本（96MB 内存完美运行）
// 支持 .env 文件 + 命令行环境变量覆盖（混合方案）
// 无需任何 npm 包（移除 express、axios、dotenv）

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ==================== 1. 手动加载 .env 文件（替代 dotenv）====================
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const data = fs.readFileSync(envPath, 'utf8');
    data.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (!process.env[key.trim()]) { // 命令行优先，不覆盖
          process.env[key.trim()] = value;
        }
      }
    });
    console.log('✅ 从 .env 文件加载环境变量成功（命令行变量优先）');
  } else {
    console.log('⚠️ 未找到 .env 文件，使用命令行环境变量或默认值');
  }
}
loadEnv(); // 立即执行

// ==================== 2. 配置区（优先级：命令行 > .env > 默认值）====================
const UPLOAD_URL = process.env.UPLOAD_URL || '';
const PROJECT_URL = process.env.PROJECT_URL || '';
const AUTO_ACCESS = process.env.AUTO_ACCESS === 'true';
const FILE_PATH = process.env.FILE_PATH || './app';
const SUB_PATH = process.env.SUB_PATH || '';
const PORT = process.env.SERVER_PORT || process.env.PORT || 3000;
const UUID = process.env.UUID || '4c2a3597-c6f6-4c94-8be0-f0fc49b8e574';
const NEZHA_SERVER = process.env.NEZHA_SERVER || '';
const NEZHA_PORT = process.env.NEZHA_PORT || '';
const NEZHA_KEY = process.env.NEZHA_KEY || '';
const ARGO_DOMAIN = process.env.ARGO_DOMAIN || '';
const ARGO_AUTH = process.env.ARGO_AUTH || '';
const ARGO_PORT = process.env.ARGO_PORT || 8001;
const CFIP = process.env.CFIP || '';
const CFPORT = process.env.CFPORT || 443;
const NAME = process.env.NAME || '';

// 创建目录
if (!fs.existsSync(FILE_PATH)) fs.mkdirSync(FILE_PATH, { recursive: true });

// 随机文件名
function randName() {
  return Math.random().toString(36).substr(2, 6);
}
const npmName = randName(), webName = randName(), botName = randName(), phpName = randName();
let npmPath = path.join(FILE_PATH, npmName);
let phpPath = path.join(FILE_PATH, phpName);
let webPath = path.join(FILE_PATH, webName);
let botPath = path.join(FILE_PATH, botName);
let subPath = path.join(FILE_PATH, 'sub.txt');
let listPath = path.join(FILE_PATH, 'list.txt');
let bootLogPath = path.join(FILE_PATH, 'boot.log');
let configPath = path.join(FILE_PATH, 'config.json');

// ==================== 3. 内置 HTTP 服务器（替代 express）====================
const server = http.createServer((req, res) => {
  if (req.url === `/${SUB_PATH}` && fs.existsSync(subPath)) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(fs.readFileSync(subPath));
    return;
  }

  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>张三的个人空间</title>
  <meta name="description" content="分享一些日常想法、生活记录和技术随笔"/>
  <style>
    :root {
      --bg: #0f1217;
      --text: #e0e7ff;
      --text-light: #a1a9c2;
      --accent: #6366f1;
      --card: #1a1f2e;
      --border: #2d3748;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      min-height: 100vh;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }
    header {
      text-align: center;
      padding: 5rem 0 4rem;
    }
    h1 {
      font-size: 3.2rem;
      font-weight: 700;
      margin-bottom: 0.8rem;
      background: linear-gradient(90deg, #a5b4fc, #c084fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .tagline {
      font-size: 1.3rem;
      color: var(--text-light);
      margin-bottom: 1.5rem;
    }
    .about {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2.5rem;
      margin-bottom: 3rem;
    }
    .about h2 {
      color: white;
      margin-bottom: 1.2rem;
      font-size: 1.8rem;
    }
    .projects {
      display: grid;
      gap: 2rem;
      margin-bottom: 4rem;
    }
    .project-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1.8rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .project-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.3);
    }
    .project-card h3 {
      color: var(--accent);
      margin-bottom: 0.6rem;
    }
    .project-card p {
      color: var(--text-light);
      margin-bottom: 1rem;
    }
    .links {
      text-align: center;
    }
    .btn {
      display: inline-block;
      padding: 0.8rem 1.8rem;
      background: var(--accent);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #4f46e5;
    }
    footer {
      text-align: center;
      padding: 3rem 0;
      color: var(--text-light);
      font-size: 0.9rem;
      border-top: 1px solid var(--border);
    }
    @media (max-width: 640px) {
      h1 { font-size: 2.4rem; }
      .container { padding: 2rem 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>张三</h1>
      <div class="tagline">普通打工人 · 喜欢折腾 · 偶尔写点东西</div>
    </header>
    <section class="about">
      <h2>关于我</h2>
      <p>
        目前在北京混日子，平时喜欢研究一些乱七八糟的小玩意儿。<br>
        主要方向是前端开发、偶尔摸摸后端和运维，喜欢把复杂的东西搞简单。
      </p>
      <p>
        这里放一些随手写的笔记、踩过的坑、看过的书/电影感想，欢迎路过指正。
      </p>
    </section>
    <section class="projects">
      <h2 style="text-align:center; margin-bottom:2rem; color:white;">最近瞎折腾的几个东西</h2>
     
      <div class="project-card">
        <h3>日常随笔收集器</h3>
        <p>一个用来记录生活碎片的极简工具，自己用着还挺顺手。</p>
      </div>
      <div class="project-card">
        <h3>深夜歌单整理</h3>
        <p>把过去一年听的最多的歌整理了一下，意外发现自己口味还挺奇怪。</p>
      </div>
      <div class="project-card">
        <h3>桌面小组件实验</h3>
        <p>用 electron 搞了个桌面小挂件，显示天气+待办+摸鱼倒计时。</p>
      </div>
    </section>
    <div class="links">
      <a href="#" class="btn">查看更多碎碎念 →</a>
    </div>
    <footer>
      © 2026 张三 · 随便写写 · 别太认真
    </footer>
  </div>
</body>
</html>
    `);
    return;
  }

  res.writeHead(404);
  res.end();
});
server.listen(PORT, () => console.log(`HTTP服务器运行在端口: ${PORT}`));

// ==================== 4. 网络工具函数（替代 axios）====================
// GET 请求
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 60000 }, res => {
      if (res.statusCode !== 200) return reject(`状态码: ${res.statusCode}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// POST 请求
function httpPost(url, jsonData) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(jsonData) }
    };
    const req = https.request(url, options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data }));
    });
    req.on('error', reject);
    req.write(jsonData);
    req.end();
  });
}

// ==================== 5. 核心函数 ====================
// 删除历史节点
async function deleteNodes() {
  if (!UPLOAD_URL || !fs.existsSync(subPath)) return;
  const fileContent = fs.readFileSync(subPath, 'utf-8');
  const decoded = Buffer.from(fileContent, 'base64').toString('utf-8');
  const nodes = decoded.split('\n').filter(line => /(vless|vmess|trojan|hysteria2|tuic):\/\//.test(line));
  if (nodes.length === 0) return;
  await httpPost(`${UPLOAD_URL}/api/delete-nodes`, JSON.stringify({ nodes }))
    .catch(() => {});
}

// 清理历史文件
function cleanupOldFiles() {
  try {
    const files = fs.readdirSync(FILE_PATH);
    files.forEach(file => {
      const filePath = path.join(FILE_PATH, file);
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
    });
  } catch {}
}

// 生成 Xray 配置
async function generateConfig() {
  const config = {
    log: { access: '/dev/null', error: '/dev/null', loglevel: 'none' },
    inbounds: [
      { port: ARGO_PORT, protocol: 'vless', settings: { clients: [{ id: UUID, flow: 'xtls-rprx-vision' }], decryption: 'none', fallbacks: [{ dest: 3001 }, { path: "/vless-argo", dest: 3002 }, { path: "/vmess-argo", dest: 3003 }, { path: "/trojan-argo", dest: 3004 }] }, streamSettings: { network: 'tcp' } },
      { port: 3001, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID }], decryption: "none" }, streamSettings: { network: "tcp", security: "none" } },
      { port: 3002, listen: "127.0.0.1", protocol: "vless", settings: { clients: [{ id: UUID, level: 0 }], decryption: "none" }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/vless-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
      { port: 3003, listen: "127.0.0.1", protocol: "vmess", settings: { clients: [{ id: UUID, alterId: 0 }] }, streamSettings: { network: "ws", wsSettings: { path: "/vmess-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
      { port: 3004, listen: "127.0.0.1", protocol: "trojan", settings: { clients: [{ password: UUID }] }, streamSettings: { network: "ws", security: "none", wsSettings: { path: "/trojan-argo" } }, sniffing: { enabled: true, destOverride: ["http", "tls", "quic"], metadataOnly: false } },
    ],
    dns: { servers: ["https+local://8.8.8.8/dns-query"] },
    outbounds: [ { protocol: "freedom", tag: "direct" }, {protocol: "blackhole", tag: "block"} ]
  };
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

// 判断系统架构
function getSystemArchitecture() {
  const arch = os.arch();
  if (arch === 'arm' || arch === 'arm64' || arch === 'aarch64') return 'arm';
  return 'amd';
}

// 下载文件
async function downloadFile(fileName, fileUrl) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(FILE_PATH, fileName);
    const file = fs.createWriteStream(filePath);
    https.get(fileUrl, response => {
      if (response.statusCode !== 200) return reject(`状态码: ${response.statusCode}`);
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        fs.chmodSync(filePath, 0o755);
        console.log(`下载成功: ${fileName}`);
        resolve(filePath);
      });
    }).on('error', err => {
      fs.unlinkSync(filePath);
      reject(err);
    });
  });
}

// 下载并运行依赖
async function downloadFilesAndRun() {
  const architecture = getSystemArchitecture();
  const filesToDownload = getFilesForArchitecture(architecture);
  if (filesToDownload.length === 0) return console.log('无法找到当前架构的文件');

  try {
    await Promise.all(filesToDownload.map(f => downloadFile(path.basename(f.fileName), f.fileUrl)));
  } catch (err) {
    console.error('下载失败:', err);
    return;
  }

  // 授权文件
  const filesToAuthorize = NEZHA_PORT ? [npmPath, webPath, botPath] : [phpPath, webPath, botPath];
  filesToAuthorize.forEach(f => fs.existsSync(f) && fs.chmodSync(f, 0o755));

  // 运行哪吒
  if (NEZHA_SERVER && NEZHA_KEY) {
    if (!NEZHA_PORT) {
      const port = NEZHA_SERVER.split(':').pop() || '';
      const tlsPorts = new Set(['443', '8443', '2096', '2087', '2083', '2053']);
      const nezhatls = tlsPorts.has(port) ? 'true' : 'false';
      const configYaml = `
client_secret: ${NEZHA_KEY}
debug: false
disable_auto_update: true
disable_command_execute: false
disable_force_update: true
disable_nat: false
disable_send_query: false
gpu: false
insecure_tls: true
ip_report_period: 1800
report_delay: 4
server: ${NEZHA_SERVER}
skip_connection_count: true
skip_procs_count: true
temperature: false
tls: ${nezhatls}
use_gitee_to_upgrade: false
use_ipv6_country_code: false
uuid: ${UUID}`;
      fs.writeFileSync(path.join(FILE_PATH, 'config.yaml'), configYaml);

      const command = `nohup ${phpPath} -c "${FILE_PATH}/config.yaml" >/dev/null 2>&1 &`;
      await execAsync(command).catch(err => console.error('php 运行失败:', err));
      console.log(`${phpName} is running`);
      await new Promise(r => setTimeout(r, 1000));
    } else {
      const tlsPorts = ['443', '8443', '2096', '2087', '2083', '2053'];
      const NEZHA_TLS = tlsPorts.includes(NEZHA_PORT) ? '--tls' : '';
      const command = `nohup ${npmPath} -s ${NEZHA_SERVER}:${NEZHA_PORT} -p ${NEZHA_KEY} ${NEZHA_TLS} --disable-auto-update --report-delay 4 --skip-conn --skip-procs >/dev/null 2>&1 &`;
      await execAsync(command).catch(err => console.error('npm 运行失败:', err));
      console.log(`${npmName} is running`);
      await new Promise(r => setTimeout(r, 1000));
    }
  } else {
    console.log('NEZHA 变量为空，跳过运行');
  }

  // 运行 Xray
  const command1 = `nohup ${webPath} -c ${configPath} >/dev/null 2>&1 &`;
  await execAsync(command1).catch(err => console.error('web 运行失败:', err));
  console.log(`${webName} is running`);
  await new Promise(r => setTimeout(r, 1000));

  // 运行 Cloudflare
  if (fs.existsSync(botPath)) {
    let args;
    if (ARGO_AUTH.match(/^[A-Z0-9a-z=]{120,250}$/)) {
      args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 run --token ${ARGO_AUTH}`;
    } else if (ARGO_AUTH.match(/TunnelSecret/)) {
      args = `tunnel --edge-ip-version auto --config ${FILE_PATH}/tunnel.yml run`;
    } else {
      args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${bootLogPath} --loglevel info --url http://localhost:${ARGO_PORT}`;
    }
    const command = `nohup ${botPath} ${args} >/dev/null 2>&1 &`;
    await execAsync(command).catch(err => console.error('bot 运行失败:', err));
    console.log(`${botName} is running`);
    await new Promise(r => setTimeout(r, 2000));
  }
  await new Promise(r => setTimeout(r, 5000));
}

// 根据架构获取文件
function getFilesForArchitecture(architecture) {
  let baseFiles = architecture === 'arm' ? [
    { fileName: webPath, fileUrl: "https://arm64.ssss.nyc.mn/web" },
    { fileName: botPath, fileUrl: "https://arm64.ssss.nyc.mn/bot" }
  ] : [
    { fileName: webPath, fileUrl: "https://amd64.ssss.nyc.mn/web" },
    { fileName: botPath, fileUrl: "https://amd64.ssss.nyc.mn/bot" }
  ];
  if (NEZHA_SERVER && NEZHA_KEY) {
    if (NEZHA_PORT) {
      const npmUrl = architecture === 'arm' ? "https://arm64.ssss.nyc.mn/agent" : "https://amd64.ssss.nyc.mn/agent";
      baseFiles.unshift({ fileName: npmPath, fileUrl: npmUrl });
    } else {
      const phpUrl = architecture === 'arm' ? "https://arm64.ssss.nyc.mn/v1" : "https://amd64.ssss.nyc.mn/v1";
      baseFiles.unshift({ fileName: phpPath, fileUrl: phpUrl });
    }
  }
  return baseFiles;
}

// Argo 配置
function argoType() {
  if (!ARGO_AUTH || !ARGO_DOMAIN) return console.log("ARGO_DOMAIN or ARGO_AUTH variable is empty, use quick tunnels");
  if (ARGO_AUTH.includes('TunnelSecret')) {
    fs.writeFileSync(path.join(FILE_PATH, 'tunnel.json'), ARGO_AUTH);
    const tunnelYaml = `
tunnel: ${ARGO_AUTH.split('"')[11]}
credentials-file: ${path.join(FILE_PATH, 'tunnel.json')}
protocol: http2

ingress:
  - hostname: ${ARGO_DOMAIN}
    service: http://localhost:${ARGO_PORT}
    originRequest:
      noTLSVerify: true
  - service: http_status:404
`;
    fs.writeFileSync(path.join(FILE_PATH, 'tunnel.yml'), tunnelYaml);
  } else {
    console.log("ARGO_AUTH mismatch TunnelSecret, use token connect to tunnel");
  }
}

// 提取 Argo 域名
async function extractDomains() {
  let argoDomain;
  if (ARGO_AUTH && ARGO_DOMAIN) {
    argoDomain = ARGO_DOMAIN;
    console.log('ARGO_DOMAIN:', argoDomain);
    await generateLinks(argoDomain);
  } else {
    try {
      const fileContent = fs.readFileSync(bootLogPath, 'utf-8');
      const lines = fileContent.split('\n');
      const argoDomains = lines.reduce((acc, line) => {
        const match = line.match(/https?:\/\/([^ ]*trycloudflare\.com)\/?/);
        if (match) acc.push(match[1]);
        return acc;
      }, []);
      if (argoDomains.length > 0) {
        argoDomain = argoDomains[0];
        console.log('ArgoDomain:', argoDomain);
        await generateLinks(argoDomain);
      } else {
        console.log('ArgoDomain not found, re-running bot to obtain ArgoDomain');
        fs.unlinkSync(bootLogPath);
        const killCmd = process.platform === 'win32' ? `taskkill /f /im ${botName}.exe > nul 2>&1` : `pkill -f "[${botName.charAt(0)}]${botName.substring(1)}" > /dev/null 2>&1`;
        await execAsync(killCmd).catch(() => {});
        await new Promise(r => setTimeout(r, 3000));
        const args = `tunnel --edge-ip-version auto --no-autoupdate --protocol http2 --logfile ${bootLogPath} --loglevel info --url http://localhost:${ARGO_PORT}`;
        await execAsync(`nohup ${botPath} ${args} >/dev/null 2>&1 &`).catch(err => console.error('bot re-run failed:', err));
        console.log(`${botName} is re-running`);
        await new Promise(r => setTimeout(r, 3000));
        await extractDomains(); // 递归重试
      }
    } catch (err) {
      console.error('Error reading boot.log:', err);
    }
  }
}

// 获取 ISP
function getMetaInfo() {
  return new Promise(resolve => {
    httpGet('https://ipapi.co/json/').then(data => {
      try {
        const json = JSON.parse(data);
        resolve(json.country_code && json.org ? `${json.country_code}_${json.org}` : 'Unknown');
      } catch { resolve('Unknown'); }
    }).catch(() => {
      httpGet('http://ip-api.com/json/').then(data => {
        try {
          const json = JSON.parse(data);
          resolve(json.status === 'success' ? `${json.countryCode}_${json.org}` : 'Unknown');
        } catch { resolve('Unknown'); }
      }).catch(() => resolve('Unknown'));
    });
  });
}

// 生成链接和订阅
async function generateLinks(argoDomain) {
  const ISP = await getMetaInfo();
  const nodeName = NAME ? `${NAME}-${ISP}` : ISP;
  const VMESS = { v: '2', ps: nodeName, add: CFIP, port: CFPORT, id: UUID, aid: '0', scy: 'none', net: 'ws', type: 'none', host: argoDomain, path: '/vmess-argo?ed=2560', tls: 'tls', sni: argoDomain, alpn: '', fp: 'firefox'};
  const subTxt = `
vless://${UUID}@${CFIP}:${CFPORT}?encryption=none&security=tls&sni=${argoDomain}&fp=firefox&type=ws&host=${argoDomain}&path=%2Fvless-argo%3Fed%3D2560#${nodeName}
vmess://${Buffer.from(JSON.stringify(VMESS)).toString('base64')}
trojan://${UUID}@${CFIP}:${CFPORT}?security=tls&sni=${argoDomain}&fp=firefox&type=ws&host=${argoDomain}&path=%2Ftrojan-argo%3Fed%3D2560#${nodeName}
`;
  console.log(Buffer.from(subTxt).toString('base64'));
  fs.writeFileSync(subPath, Buffer.from(subTxt).toString('base64'));
  console.log(`${subPath} saved successfully`);
  await uploadNodes();
}

// 上传节点/订阅
async function uploadNodes() {
  if (UPLOAD_URL && PROJECT_URL) {
    const subscriptionUrl = `${PROJECT_URL}/${SUB_PATH}`;
    await httpPost(`${UPLOAD_URL}/api/add-subscriptions`, JSON.stringify({ subscription: [subscriptionUrl] }))
      .then(res => res.status === 200 && console.log('Subscription uploaded successfully'))
      .catch(() => {});
  } else if (UPLOAD_URL && fs.existsSync(listPath)) {
    const content = fs.readFileSync(listPath, 'utf-8');
    const nodes = content.split('\n').filter(line => /(vless|vmess|trojan|hysteria2|tuic):\/\//.test(line));
    if (nodes.length === 0) return;
    await httpPost(`${UPLOAD_URL}/api/add-nodes`, JSON.stringify({ nodes }))
      .then(res => res.status === 200 && console.log('Nodes uploaded successfully'))
      .catch(() => {});
  }
}

// 自动保活
async function AddVisitTask() {
  if (!AUTO_ACCESS || !PROJECT_URL) return console.log("Skipping adding automatic access task");
  await httpPost('https://oooo.serv00.net/add-url', JSON.stringify({ url: PROJECT_URL }))
    .then(() => console.log('automatic access task added successfully'))
    .catch(err => console.error(`Add automatic access task failed: ${err.message}`));
}

// 清理文件
function cleanFiles() {
  setTimeout(() => {
    const filesToDelete = [bootLogPath, configPath, webPath, botPath];
    if (NEZHA_PORT) filesToDelete.push(npmPath);
    else if (NEZHA_SERVER && NEZHA_KEY) filesToDelete.push(phpPath);
    const cmd = process.platform === 'win32' ? `del /f /q ${filesToDelete.join(' ')} > nul 2>&1` : `rm -rf ${filesToDelete.join(' ')} >/dev/null 2>&1`;
    exec(cmd, () => {
      console.clear();
      console.log('App is running');
      console.log('Thank you for using this script, enjoy!');
    });
  }, 90000);
}
cleanFiles();

// 主逻辑
async function startserver() {
  try {
    argoType();
    deleteNodes();
    cleanupOldFiles();
    await generateConfig();
    await downloadFilesAndRun();
    await extractDomains();
    await AddVisitTask();
  } catch (err) {
    console.error('Error in startserver:', err);
  }
}
startserver().catch(err => console.error('Unhandled error:', err));
