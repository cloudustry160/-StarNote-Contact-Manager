# EE308FZ 软件工程 · Extreme Programming 个人作业：通讯录（StarNote Contact Manager）

## 作业信息

| 项目 | 内容 |
| --- | --- |
| 课程 | [2601_FZU-MU_SE](https://bbs.csdn.net/forums/2601_MU_SE_FZU) |
| 团队名 | 个人作业（单人独立完成） |
| 作业要求 | [Extreme Programming（Deadline: November 17, 2026, 23:59）](https://bbs.csdn.net/topics/620593436) |
| 本次作业目标 | 实现通讯录的收藏、多联系方式、Excel 导入导出；完整走一遍需求→设计→编码→测试→部署→文档的流程 |
| 其他参考 | React / Vite / Tailwind CSS / SheetJS 官方文档；CSDN 社区同类作业 |

## 目录

1. [项目链接](#1-项目链接)
2. [功能与实现思路](#2-功能与实现思路)
3. [技术方案与项目结构](#3-技术方案与项目结构)
4. [运行与自测](#4-运行与自测)
5. [Git 提交证据](#5-git-提交证据)
6. [个人模块拆解与贡献](#6-个人模块拆解与贡献)
7. [遇到的问题与解决](#7-遇到的问题与解决)
8. [PSP 表](#8-psp-表)
9. [演示视频与运行截图](#9-演示视频与运行截图)
10. [不足与改进](#10-不足与改进)

---

## 1 项目链接

| 类型 | 地址 |
| --- | --- |
| GitHub 仓库 | https://github.com/cloudustry160/-StarNote-Contact-Manager |
| 线上地址（云部署） | http://114.55.128.202/addressbook/ |
| 编码规范 | https://github.com/cloudustry160/-StarNote-Contact-Manager/blob/main/docs/CODE_STYLE.md |
| Release 版本 | https://github.com/cloudustry160/-StarNote-Contact-Manager/releases/tag/v1.0.0 |
| 助教验收指南 | https://github.com/cloudustry160/-StarNote-Contact-Manager/blob/main/REVIEW.md |
| 演示视频 | https://github.com/cloudustry160/-StarNote-Contact-Manager/blob/main/docs/media/demo.mp4 |

项目规模：24 个源码文件、约 1944 行 TypeScript / TSX，23 个测试用例，12 次提交，版本 `v1.0.0`。

---

## 2 功能与实现思路

### 2.1 收藏联系人（25 分）

**需求理解**：收藏要「可辨识、易访问」，并且状态必须持久——只在内存里打星、刷新就没了，是最常见的扣分点。

**实现要点**：

- 数据模型上加 `favorite: boolean`，与联系人同一条记录写进 `localStorage`，刷新自然保留。
- 列表卡片右上角星标、编辑页的收藏开关调用同一个 `toggleFavorite(id)`，避免两处状态打架。
- 「收藏」标签页只做筛选，不复制数据：先按 `favorite` 过滤，再排序，收藏永远排最前。

```ts
export function filterContacts(contacts: Contact[], { query, onlyFavorites }: FilterOptions): Contact[] {
  return contacts
    .filter((c) => (onlyFavorites ? c.favorite : true))
    .filter((c) => matchesQuery(c, query))
    .sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1; // 收藏优先
      return b.updatedAt.localeCompare(a.updatedAt);            // 其次最近修改
    });
}
```

编辑页里可以直接切换收藏状态，按钮文案会变成「已收藏，点此取消」：

![图 1：编辑联系人页，收藏开关已打开](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/03-favorite-edit.png)

切到「收藏」标签页后，6 位联系人里只剩 3 位收藏，且收藏优先排列：

![图 2：收藏标签页，只剩 3 位收藏联系人](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/04-favorites-tab.png)

### 2.2 多联系方式（10 分）

**需求理解**：一个联系人要能挂多条信息，而且不只是「多个手机号」——电话、邮箱、社交账号、地址都要能记，最好还能标出哪条是主要联系方式。

**实现要点**：

- `Contact.methods` 是数组，每条含 `id / kind / label / value / primary`。
- `kind` 是五种固定类型（手机、邮箱、社交账号、地址、其他），`label` 允许自定义（「微信」「办公室」「宿舍」）。
- 表单是动态行：类型切换时若标签还是默认值就跟着变；可设「主要」，也可删掉任意一条。
- 保存前校验：姓名必填、至少一条联系方式；手机/邮箱只做软提示不硬拦（现实里有分机号）。

下图给「李希圣」同时加了手机与社交账号两条，手机被设为主要联系方式（星标）：

![图 3：新增联系人，多条不同类型的联系方式](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/02-add-contact.png)

### 2.3 Excel 导出（25 分的一半）

**需求理解**：导出要「一行一人、每类信息一列、列头清楚」，而且导出的文件最好能直接当导入模板，避免维护两份格式。

**实现要点**：列头固定为 `姓名 | 公司 | 手机 | 邮箱 | 社交账号 | 地址 | 收藏 | 备注`；同一类型的多个值用 `; ` 分隔；自定义标签写成 `标签:值`，这样「办公室:0591-…」和手机号能在同一列里区分开。

```ts
export function cellFor(contact: Contact, kind: MethodKind): string {
  return contact.methods
    .filter((m) => m.kind === kind && m.value.trim())
    .map((m) => {
      const label = m.label.trim();
      const value = m.value.trim();
      return label && label !== DEFAULT_LABEL[kind] ? `${label}:${value}` : value;
    })
    .join('; ');
}
```

导出时还设置了列宽、冻结首行；支持「导出全部」和「导出当前筛选结果」。下图的「手机」列里能看到 `138 0000 1234; 办公室:0591-2286 0001` 这种多值写法，「收藏」列是「是/否」：

![图 4：导出的 Excel 文件](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/06-export-excel.png)

### 2.4 Excel 导入（25 分的另一半）

**需求理解**：导入不是「读出来塞进去」就完事——真实表格一定有脏数据，能不能**定位到行、说清原因**，才是这 25 分的关键。

**实现方式**（`src/features/excel/logic.ts`，纯函数、可单测）：

1. **表头别名容错**：`姓名/名字/联系人/name`、`手机/电话/手机号`、`邮箱/邮件`、`社交账号/社交/微信`……归一化后映射到字段；缺「姓名」列直接整体拒绝。
2. **逐行解析**：按分号（半角/全角）拆多值；`标签:值` 支持全角冒号；空行跳过。
3. **行级校验**：姓名非空、至少一条联系方式、电话 6–20 位且只含数字与常见分隔符、邮箱需含 `@` 与域名点。
4. **重复判定**：`姓名 + 首个电话/邮箱` 归一化后比较，重复时可选「跳过」或「覆盖更新」。
5. **结果反馈**：预览前 8 行（可导入 / 失败 + 原因）、汇总「可导入 / 重复 / 失败」，确认后 Toast 报告新增/更新/跳过数量。

```ts
export function duplicateKey(name: string, methods: ContactMethod[]): string {
  const first = methods.find((m) => m.kind === 'phone' && m.value.trim()) ??
                methods.find((m) => m.kind === 'email' && m.value.trim());
  const normalizedName = name.trim().toLowerCase().replace(/\s+/g, '');
  const normalizedValue = (first?.value ?? '').replace(/[\s\-()（）]/g, '').toLowerCase();
  return `${normalizedName}|${normalizedValue}`;
}
```

仓库里的 `sample/contacts-demo.xlsx` 特意放了 22 行：20 行正常 + 1 行坏手机号 + 1 行缺姓名，导入时的报错效果见演示视频。

### 2.5 搜索与界面（10 分）

- 搜索覆盖姓名、公司、备注与任意联系方式的**值**，实时过滤，不区分大小写。
- 桌面双列、移动单列；三种空状态分开写（通讯录为空 / 搜索无结果 / 收藏为空）。
- 交互反馈：Toast、删除二次确认、`Esc` 关弹窗、焦点可见。
- 首屏 JS 从 722 KB 压到 293 KB（gzip 93 KB）：xlsx 只在点「导入/导出」时才动态加载。

主列表页：星标、搜索框、「全部/收藏」标签与导入导出按钮：

![图 5：联系人列表](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/01-home.png)

搜索「张」时只留下匹配的 1 位，右侧显示「"张" 匹配 1 位」：

![图 6：按姓名搜索](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/05-search.png)

---

## 3 技术方案与项目结构

**技术栈**：React 19 + TypeScript（strict）+ Vite 8 + Tailwind CSS 4 + SheetJS；数据存浏览器 `localStorage`，无后端、无数据库、无环境变量。

**为什么不做后端**：作业要求「评审者能构建运行」。纯前端意味着 `npm ci && npm run dev` 就能跑，服务器上也只是几个静态文件；代价是数据不跨设备，这点在 README 里写成了「已知限制」。

```
src/
├─ types.ts                 # 领域类型与常量
├─ storage/                 # localStorage 读写、结构校验、示例数据
├─ hooks/useContacts.tsx    # Context + reducer，300ms 防抖落盘
├─ features/
│  ├─ contacts/             # 列表、详情、表单、多联系方式、搜索、收藏
│  └─ excel/                # 导出、解析校验（纯函数）、导入弹窗
├─ components/              # Layout、Toast、ConfirmDialog、样式常量
└─ App.tsx / main.tsx
```

分层原则：`features` 只依赖 `storage` 与 `types`；Excel 解析是纯函数，不碰 React，因此能直接用 vitest 覆盖。

**测试**：23 个用例——19 个覆盖纯函数（解析、格式化、判重、筛选、校验），4 个渲染冒烟测试（首屏渲染、点星标后 localStorage 落盘、搜索过滤、表单校验）。

---

## 4 运行与自测

```bash
git clone https://github.com/cloudustry160/-StarNote-Contact-Manager.git
cd -- -StarNote-Contact-Manager
npm ci
npm run dev        # http://localhost:5173
npm test           # 23 个用例
npm run build      # 类型检查 + 打包
```

首屏预置 5 条示例数据（含收藏与多联系方式），可以直接体验；数据只存在本地浏览器。

---

## 5 Git 提交证据

单人完成，全部由本人提交（含一次网页合并 PR 产生的合并提交）：

| # | 提交 | 说明 |
| --- | --- | --- |
| 1 | `43978ce` | chore: scaffold vite + react + ts project with docs |
| 2 | `b232d90` | feat(storage): contact model, versioned localStorage store and seed data |
| 3 | `df7f2a0` | chore(deploy): support VITE_BASE subpath build and document nginx coexistence |
| 4 | `504bbc4` | feat: contact CRUD, bookmarks, multi-method contacts and Excel import/export |
| 5 | `139b027` | chore(deploy): add deploy script and record cloud deployment |
| 6 | `b72f0eb` | chore(release): v1.0.0（release 分支） |
| 7 | `b94958d` | Merge pull request #1 from cloudustry160/release/v1.0 |
| 8 | `0fe3c41` | docs: add deploy.bat wrapper and release link in README |
| 9 | `1d19435` | docs: add blog draft, evidence checklist and final PSP |
| 10 | `74b428b` | docs(readme): fix online demo link rendering |
| 11 | `faa6cff` | fix(deploy): redirect /addressbook to /addressbook/ and document it |

第 12 次提交是本次博客、截图与演示视频入库（`docs`）。分支：`main` + `release/v1.0`，通过 Pull Request 合并；标签：`v1.0.0`。

![图 7：GitHub 提交历史](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/07-commit-history.png)

---

## 6 个人模块拆解与贡献

单人项目，无协作分工；下表是按模块统计的工时占比，合计 100%。

| 模块 | 内容 | 工时 (h) | 占比 |
| --- | --- | ---: | ---: |
| 需求与计划 | 逐条拆解作业要求、确定取舍、排期 | 2.5 | 10% |
| 前端界面 | 列表/搜索/详情/表单/多联系方式/收藏/样式 | 7.4 | 31% |
| Excel | 导出、导入解析、校验、重复策略、预览 | 5.0 | 21% |
| 测试 | 纯函数单测 + 渲染冒烟测试 | 1.2 | 5% |
| 部署 | 云服务器、Nginx 子路径、与已有服务共存 | 2.6 | 11% |
| 文档与博客 | README、验收指南、编码规范、本篇博客 | 2.5 | 11% |
| 视频与截图 | 录制演示、截取界面与 Git 证据 | 1.5 | 6% |
| 自检与缓冲 | 发布前清单、修漏 | 1.0 | 5% |
| **合计** | | **23.7** | **100%** |

贡献比：**本人 100%**（单人作业）。

---

## 7 遇到的问题与解决

**① 真实 Excel 比设计时脏得多**

第一版只按「`;` 分隔」解析，结果全角分号 `；`、全角冒号 `：`、空行、缺姓名各行其是，解析直接崩。改成表头别名表 + 分隔符正则 `[;；]` + 全角冒号兼容 + 空行跳过后，再补 11 个单测把边界钉死。

**② 首屏 722 KB，加载肉眼可见地慢**

`xlsx` 被打进主包。改成导入弹窗 `React.lazy` + 导出函数 `import()` 动态加载，首屏降到 293 KB（gzip 93 KB），Excel 逻辑 141 KB 只在真正用到时下载。

**③ GitHub 间歇性连不上**

推送时出现 `schannel: failed to receive handshake` 与 DNS 解析失败，同一台机器几分钟前还能推。判断是网络链路问题而非仓库问题：换 `http.sslBackend=openssl`、加重试后恢复；期间先把部署做完，不让 Git 阻塞主流程。

**④ 服务器上已经跑着计算器服务**

不能停别人的服务，也不能让 80 端口打架。查清 Nginx 占 80、计算器后端只在 `127.0.0.1:8000` 后，选择子路径方案：只加 `location /addressbook/` 与一条 301，改前备份、`nginx -t` 通过才 `reload`（不 `restart`，避免计算器闪断）。

上线后又踩了一个细节：`location /addressbook/` 带斜杠，用户输入 `/addressbook`（少一个斜杠）时不匹配，直接掉进计算器的 `location /`，被它的 SPA 回落接走，于是打开了另一个服务的页面。补一条精确匹配做 301 才好：

```nginx
location = /addressbook {
    return 301 /addressbook/;
}

location /addressbook/ {
    root /var/www;
    try_files $uri $uri/ /addressbook/index.html;
}
```

这件事说明：多服务共享 80 端口时，「谁兜底未知路径」必须显式定义，否则默认规则会悄悄接管。

**⑤ 构建产物在子路径下白屏**

Nginx 挂在 `/addressbook/`，但 Vite 默认按根路径生成资源引用。给 `vite.config.ts` 增加 `VITE_BASE` 支持，构建时传 `/addressbook/`，路由 `basename` 也跟着 `import.meta.env.BASE_URL` 走，深链接刷新不再 404。

**⑥ Windows 执行策略拦住部署脚本**

`deploy.ps1` 报「未数字签名」。加一个 `deploy.bat` 用 `-ExecutionPolicy Bypass` 包装，双击即可部署，同时保留脚本可读可改。

---

## 8 PSP 表

| 阶段 | 计划工时 (h) | 实际工时 (h) | 偏差说明 |
| --- | ---: | ---: | --- |
| 需求阅读与计划制定 | 2.0 | 2.5 | 评分点需逐条对照；中途按「单人完成」重写计划，多花 0.5h |
| 仓库与工程骨架 | 1.0 | 1.0 | 与计划一致 |
| 数据模型与本地持久化 | 1.0 | 0.8 | 结构简单，提前设计了版本号与逐条校验，后续没返工 |
| 联系人列表 / 搜索 / 详情 | 3.0 | 2.5 | 组件拆分顺利，比预期快 |
| 新增编辑表单与多联系方式 | 3.0 | 2.2 | 动态行 + 主要联系方式联动，一次成型 |
| 收藏功能 | 1.0 | 0.4 | 与列表页合并实现，省了联调 |
| Excel 导出 | 2.0 | 1.5 | SheetJS 列宽与冻结行查文档花时间，编码反而简单 |
| Excel 导入与校验 | 4.0 | 3.5 | 表头别名、`标签:值` 解析、错误行定位边界多，但在上限内 |
| 单元测试 | 1.0 | 1.2 | 除 19 个纯函数用例外，多写了 4 个渲染冒烟测试 |
| 样式与响应式打磨 | 2.0 | 1.5 | 空状态与移动端一次调通 |
| 部署到云服务器 | 1.5 | 1.6 | 与已有计算器服务共存，多了排查与备份步骤 |
| 演示视频与截图 | 1.5 | 1.5 | 一次录完，未剪辑；视频压缩后从 268 MB 降到 2.3 MB |
| 博客撰写与 PSP 整理 | 3.0 | 2.5 | 开发时随手攒了素材 |
| 缓冲与自检 | 2.0 | 1.0 | 按发布前清单逐条过，问题少 |
| **合计** | **28.0** | **23.7** | 计划偏保守，实际提前约 4.3h |

---

## 9 演示视频与运行截图

- **演示视频**（2 分 21 秒，录屏未剪辑）：https://github.com/cloudustry160/-StarNote-Contact-Manager/blob/main/docs/media/demo.mp4
- **线上地址**：http://114.55.128.202/addressbook/
- **Release 页面**：

![图 8：GitHub Release v1.0.0](https://raw.githubusercontent.com/cloudustry160/-StarNote-Contact-Manager/main/docs/screenshots/08-release.png)

---

## 10 不足与改进

- **数据不跨设备**：`localStorage` 是本项目的取舍，若要做成真实产品，下一步应加后端与账号体系，并把 `storage` 层替换成 API 调用（这一层已经隔离好）。
- **导入只读第一个工作表**：多工作表场景需要让用户选择。
- **缺少端到端测试**：目前是纯函数单测 + 渲染冒烟，还没上 Playwright，回归依赖手工清单。
- **冲突检测**：导入的「覆盖更新」是全量替换，真实场景应做字段级合并与冲突提示。
