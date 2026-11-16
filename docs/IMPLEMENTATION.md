# 实现过程与助教验收说明（单人版）

> 配套：[PLAN.md](../PLAN.md) · 作业帖：https://bbs.csdn.net/topics/620593436
> 技术栈：React 19 + TypeScript + Vite 7 + Tailwind CSS 4 + SheetJS(`xlsx`) + localStorage
> 部署：自有云服务器 + Nginx 静态托管 · 形式：个人独立完成

---

## 一、总体架构

单页应用，无后端。数据存浏览器 `localStorage`，导入导出走 `.xlsx` 文件。
好处很实际：评审者 `npm ci && npm run dev` 就能跑，服务器上只有静态文件，没有数据库、密钥、环境变量。

```
平时作业/
├─ README.md              # 快速开始 + 功能说明 + 截图（助教先看这个）
├─ REVIEW.md              # 助教养收单：环境要求、5 步自测、已知限制
├─ docs/
│  ├─ CODE_STYLE.md       # 编码规范（博客要引用其 URL）
│  ├─ PSP.md              # 单张 PSP 表
│  └─ IMPLEMENTATION.md   # 本文件
├─ sample/
│  ├─ contacts-template.xlsx   # 导入模板（= 导出格式）
│  └─ contacts-demo.xlsx       # 20 条演示数据，含 2 行故意错误
├─ src/
│  ├─ main.tsx / App.tsx
│  ├─ types.ts
│  ├─ storage/                 # localStorage 读写 + 校验 + 版本迁移
│  ├─ hooks/useContacts.ts     # Context + useReducer + 防抖落盘
│  ├─ features/
│  │  ├─ contacts/             # 列表、详情、表单、搜索
│  │  ├─ bookmark/             # 星标按钮、收藏筛选
│  │  └─ excel/                # 导出、导入、校验（logic.ts 纯函数）
│  ├─ components/              # Modal / Toast / EmptyState / Tag
│  └─ styles/
└─ (部署) dist/ → 服务器 /var/www/addressbook
```

分层原则：`features` 只依赖 `storage` 与 `types`；Excel 解析校验是纯函数，可单测、可复算。

## 二、数据模型

```ts
export type MethodKind = 'phone' | 'email' | 'social' | 'address' | 'other';

export interface ContactMethod {
  id: string;
  kind: MethodKind;
  label: string;   // "手机" / "微信" / "家庭住址"
  value: string;
}

export interface Contact {
  id: string;
  name: string;
  company?: string;
  note?: string;
  favorite: boolean;        // 收藏 25 分
  methods: ContactMethod[]; // 多联系方式 10 分
  createdAt: string;
  updatedAt: string;
}
```

存储键 `addressbook:v1:contacts`，结构 `{ version: 1, contacts }`。读取时逐条校验，坏数据丢弃并提示。

## 三、实现顺序（每阶段可独立验收）

### 阶段 0：仓库与骨架（1 小时）

手动搭 Vite 工程（避免脚手架交互卡住）：`package.json`、`vite.config.ts`(`@tailwindcss/vite`)、`tsconfig`、`index.html`、`src/main.tsx`，然后一次 `npm i`。
先写 `README.md` 快速开始、`.gitignore`、`docs/CODE_STYLE.md`（命名/组件粒度/提交规范/自审习惯），**规范先于代码**。

验收：`npm run dev` → 空白应用页；`git log` 有第一条 `chore:` 提交。

### 阶段 1：数据层（1 小时）

- `storage/load.ts | save.ts`：读 + 校验 + 修复；首次启动写入 5 条示例（设置页可清空）。
- `hooks/useContacts.ts`：`Context + useReducer`，暴露 `contacts / add / update / remove / toggleFavorite / bulkImport`，300ms 防抖落盘。

验收：刷新数据仍在；DevTools → Application → localStorage 能看到键值。

### 阶段 2：列表 / 搜索 / 收藏（约 4 小时，含 25 分功能）

- 卡片：姓名、公司、主联系方式、星标、标签；点进详情。
- 搜索（姓名/公司/任意方式值，不区分大小写）+ Tabs「全部/收藏」+ 新增按钮。
- 收藏：`StarButton` 卡片角标 + 详情页开关，状态写回数据，持久化。
- 空状态：无数据 / 搜索无结果 / 收藏为空，三种文案分开写。

验收：加星 → 收藏 Tab 可见 → 刷新仍可见 → 取消后消失。

### 阶段 3：表单 + 多联系方式（约 4 小时，含 10 分功能）

- `ContactForm`：姓名必填（失焦 + 提交双校验）、公司、备注。
- `MethodEditor`：类型下拉 + 标签（随类型联动）+ 值 + 删除；「+ 添加联系方式」。
- 至少 1 条方法才允许保存；手机/邮箱给格式提示但不硬拦。

验收：4 条不同类型方法回显正确；删中间一条再保存不串行。

### 阶段 4：Excel 导出（约 2 小时）

```ts
const COLUMNS = ['姓名','公司','手机','邮箱','社交账号','地址','收藏','备注'];
const DEFAULT_LABEL = { phone:'手机', email:'邮箱', social:'微信', address:'地址', other:'' };

function cellFor(c: Contact, kind: MethodKind) {
  return c.methods
    .filter(m => m.kind === kind)
    .map(m => (m.label && m.label !== DEFAULT_LABEL[kind] ? `${m.label}:${m.value}` : m.value))
    .join('; ');
}
```

- 一行一人；多值 `; `；自定义标签 `标签:值`；`收藏` 列「是/否」。
- `!cols` 设列宽；导出全部 / 当前筛选；文件名 `通讯录-YYYYMMDD-HHmm.xlsx`。
- 导出结果**直接当模板**，不维护第二份格式。

验收：导出 20 行，Excel 打开不乱码，多值同格。

### 阶段 5：Excel 导入（约 4 小时）

流程：选文件/拖拽 → 解析 → 表头映射 → 逐行校验 → 预览前 10 行 + 总数 → 重复策略 → 导入 → 结果面板（成功/跳过/失败，失败行可展开、可导出错误清单）。

```ts
export interface ParsedRow { row: number; contact?: Contact; errors: string[]; }
export function parseWorkbook(buf: ArrayBuffer): { rows: ParsedRow[]; headerErrors: string[] };
```

- 表头别名：`姓名/名字/name`、`手机/电话/手机号`、`邮箱/邮件/email`、`社交账号/社交/微信`、`地址/住址`、`收藏/favorite`、`备注/note`；缺「姓名」列直接拒绝。
- 行校验：姓名非空、≥1 联系方式、电话 6–20 位（允许 `+ - 空格 括号`）、邮箱含 `@` 与 `.`、收藏只认是/否/true/false（空=否）、全角冒号兼容。
- 重复判定：`姓名 + 首个手机/邮箱` 归一化；默认跳过，可选覆盖更新。
- 单测：`vitest` 覆盖 `cellFor` 多值、合法/缺列/坏电话/重复、导出→解析 round-trip 等值。

验收：用 `sample/contacts-demo.xlsx` 得「18 成功 / 1 跳过 / 1 失败」，失败行定位到行号。

### 阶段 6：样式（约 2 小时）

Tailwind 变量（主色、12px 圆角、阴影、8pt 间距），桌面双列 / 移动单列；空/加载/失败/保存成功 Toast、删除二次确认、`Esc` 关弹窗、焦点可见。

验收：1280 与 390 两个宽度截图不溢出。

### 阶段 7：个人 Git 流程（贯穿全程）

单人也要留下“过程证据”，否则 20 分的过程分不好拿：

- 分支：`feat/contacts-core`、`feat/bookmark`、`feat/multi-method`、`feat/excel-io`、`feat/ui-polish`、`docs/repo-docs`。
- 提交：Conventional Commits，例如 `feat(excel): 支持 标签:值 解析`、`fix(form): 空联系方式阻止保存`；每次提交保持可运行。
- 收尾：`release/v1.0` 分支 → 对 `main` 发一个 Pull Request（自己 review 也在描述里写清改了什么、怎么验、截图）→ squash merge → `git tag v1.0.0` + Release 说明。
- 证据：`git shortlog -sn`、`git log --oneline --graph`、GitHub 提交日历截图。

### 阶段 8：部署（+15，1.5 小时）

```bash
npm run build
rsync -avz --delete dist/ root@<公网IP>:/var/www/addressbook/
```

```nginx
server {
  listen 80;
  server_name <IP 或域名>;
  root /var/www/addressbook;
  index index.html;
  location / { try_files $uri $uri/ /index.html; }
  location ~* \.(js|css|woff2?|svg|png)$ {
    expires 30d; add_header Cache-Control "public, immutable";
  }
}
```

安全组放行 80/443；有备案域名再 `certbot --nginx`。验证：手机关 Wi-Fi 用流量打开，录屏带地址栏。

### 与服务器上已有服务共存（计算器等）

一台服务器跑多个站点是常态，**不需要暂停已有服务，也不需要另租机器**。通讯录是纯静态站，CPU/内存占用可忽略；冲突只可能发生在**端口**和**站点根路径**上。

| 方案 | 做法 | 风险 | 适用 |
| --- | --- | --- | --- |
| A. 独立端口（先做） | Nginx 或 `python -m http.server` 监听 8081，`root /var/www/addressbook` | 无，完全不碰现有服务 | 只要公网能打开即可 |
| B. 子路径 | 现有 Nginx 加 `location /addressbook/ { alias /var/www/addressbook/; }`，Vite 设 `base: '/addressbook/'` | 低，改一处 server 块 | 想用同一个 `http://IP/` 域名 |
| C. 子域名 | `addressbook.example.com` 单独 server 块 | 低 | 有域名且已备案 |
| D. 反代整合 | 把计算器挪到 `/calc/`，根路径给通讯录 | 中，要改计算器前端 base 与接口前缀 | 不推荐，动别人的服务容易出事 |

执行顺序：**先 A 拿到可访问 URL**（验收只要求公网可达），时间富余再升级 B/C。任何改动前先 `cp` 备份现有 Nginx 配置，改完 `nginx -t && systemctl reload nginx`，不动运行中的计算器进程。

排查命令（在服务器上执行）：

```bash
ss -tlnp                 # 看 80/443/8080/3000 被谁占用
nginx -v; systemctl status nginx --no-pager
docker ps                # 计算器若是容器，确认它的端口映射
```

**实测环境（2026-11-16）**：Nginx 监听 `0.0.0.0:80`（计算器前端入口），计算器后端 `python3` 只监听 `127.0.0.1:8000`，由 Nginx 反代。结论：通讯录走 **B 方案（子路径）**，不改端口、不动计算器进程。

```bash
# 本地：子路径构建（VITE_BASE 已在 vite.config.ts 支持）
VITE_BASE=/addressbook/ npm run build

# 服务器：建目录并接收
mkdir -p /var/www/addressbook
rsync -avz --delete dist/ root@<IP>:/var/www/addressbook/
```

```nginx
# 加进现有 server { } 内、location / 之前；不碰 /api 反代与计算器的 root
location /addressbook/ {
    root /var/www;
    try_files $uri $uri/ /addressbook/index.html;
}
```

```bash
cp -a /etc/nginx/nginx.conf /root/nginx.conf.bak.$(date +%F)
nginx -t && systemctl reload nginx     # 只 reload，不 restart，避免计算器闪断
```

访问 `http://<IP>/addressbook/`。若不想碰现有配置，退回 A 方案：单开 `listen 8081` 的 server 块，`base` 保持 `/`，URL 为 `http://<IP>:8081/`。

---

## 四、助教验收

### 4.1 助教能拿到什么

| 材料 | 位置 | 助教怎么用 |
| --- | --- | --- |
| 源码 + 运行说明 | 公开 GitHub 仓库 `README.md` | 克隆 → `npm ci` → `npm run dev` |
| 编码规范 | `docs/CODE_STYLE.md` | 核对博客里链接可打开 |
| 线上地址 | `http://<IP>` | 手机流量访问，确认非 localhost |
| 演示视频 | B 站 / Release 附件，博客内嵌 | 5–8 分钟完整流程 |
| 截图 | 博客正文 | 列表/收藏/多方式/导入导出/Git 历史 |
| PSP | 博客内 + `docs/PSP.md` | **一张**，按阶段列计划与实际 |
| Release / PR | 仓库 Releases、Pull requests | 有版本标签、发起过 PR |
| 博客 | CSDN 个人主页 | 按评分表逐项对照 |

`REVIEW.md` 是给助教的**一页验收单**：Node ≥ 20、无数据库、无 `.env`、端口 5173、5 步自测脚本、已知限制（数据存本地浏览器、换设备不同步——设计选择）。

### 4.2 助教照做的 8 步脚本（写进 REVIEW.md）

1. 打开仓库，README 首屏有快速开始与截图。
2. `npm ci && npm run dev` → `http://localhost:5173`。
3. 首屏有 5 条示例数据，列表可见星标。
4. 新增：姓名 + 2 手机 + 1 邮箱 + 1 微信 + 1 地址 → 保存 → 卡片显示主要方式。
5. 加星 → 收藏 Tab → 刷新仍存在。
6. 导出 → 打开 xlsx 核对行列。
7. 改两行（一行手机改 `abc`）→ 导入 → 预览报错 → 汇总「成功 n / 失败 1」。
8. 搜索过滤 + 公网地址手机可访问。

### 4.3 视频分镜（5–8 分钟，一次录完）

| 时间 | 内容 | 对应 |
| --- | --- | --- |
| 0:00–0:30 | `npm run dev` 启动、首屏 | 可运行 |
| 0:30–2:00 | 新增 4 类联系方式、编辑删除 | 多方式 10 |
| 2:00–3:00 | 收藏/取消/筛选/刷新 | 收藏 25 |
| 3:00–5:00 | 导出 → Excel 改数据 → 导入 → 错误行 | 导入导出 25 |
| 5:00–6:00 | 搜索、空状态、移动端、深链接刷新 | 样式 10 |
| 6:00–7:00 | 提交历史、Release、PR | 过程分 |
| 7:00–7:30 | 服务器目录与公网访问 | 附加 15 |

### 4.4 提交前 30 分钟清单

- [ ] 博客首屏信息表 5 行（课程 / 团队名→填“个人”/ 作业要求链接 / 目标 / 参考）
- [ ] Markdown 目录锚点可跳
- [ ] 三个可点链接：仓库、`CODE_STYLE.md`、公网地址
- [ ] Git 提交历史截图 + 提交清单表
- [ ] 三功能各有实现思路段 + 界面截图
- [ ] 视频可播放
- [ ] **个人模块拆解表**（需求/设计/开发/Excel/部署/文档 + 工时占比）
- [ ] **一张 PSP 表**（阶段、计划、实际、偏差原因）
- [ ] 个人问题记录 2–3 条（现象 → 定位 → 解决）
- [ ] 仓库 public、默认分支 `main`、无 `node_modules`、有 `v1.0.0`
- [ ] 博客发在 2601_FZU-MU_SE 社区 + 提交入口交链接

### 4.5 最容易丢分的坑（单人版）

- 分工栏写“独立完成”四个字就完事——要么给模块拆解 + 工时，要么这 20 分只剩一半
- PSP 表照抄模板数字，实际与计划完全一样（评审一眼看出）
- 只演示导入成功路径，不演示坏数据（看不出校验，25 分要打折）
- 视频看不到地址栏 → 云部署无法确认
- 仓库私有 / 默认分支不是 `main`
- 提交全在一次 `git add .` 之后（0 条过程证据）

---

## 五、时间安排（自 11/16 16:00 起约 32 小时）

| 时间 | 事项 |
| --- | --- |
| 11/16 16:00–17:00 | 阶段 0：骨架 + 文档 |
| 11/16 17:00–19:00 | 阶段 1–2 前半：数据层 + 列表 |
| 11/16 19:00–23:00 | 阶段 2–3：收藏 + 表单 + 多联系方式 |
| 11/17 08:00–12:00 | 阶段 4–5：导出、导入、校验、单测 |
| 11/17 12:00–14:30 | 阶段 6：样式与状态 |
| 11/17 14:30–16:00 | 阶段 8：部署 + 公网验证 |
| 11/17 16:00–17:30 | 视频 + 截图 |
| 11/17 17:30–20:30 | 博客 + PSP + 模块拆解 |
| 11/17 20:30–23:00 | 发布、Release/PR、自检补漏 |

## 六、阻断项

1. 姓名 + GitHub 用户名。
2. 仓库地址（或由你在本地推）。
3. 服务器公网 IP + SSH 方式 + 是否已装 Nginx。
