# 编码规范（Code Style）

> 项目：通讯录应用 · 课程 EE308FZ Software Engineering · 个人作业
> 适用范围：`src/` 全部源码、文档与提交信息。

## 1. 语言与工具

| 项 | 约定 |
| --- | --- |
| 语言 | TypeScript，`strict: true`，不使用 `any`（确需时写 `unknown` 并收窄） |
| 构建 | Vite，`npm run build` 必须零错误 |
| 样式 | Tailwind CSS 工具类，禁止在组件里写 `<style>` 或内联 `style`（动态值除外） |
| 图标 | `lucide-react`，统一 16/18/20px 三档，不混用 emoji |
| 测试 | vitest，纯函数必须覆盖 |

## 2. 命名

- 组件文件：`PascalCase.tsx`（`ContactCard.tsx`）；工具/纯函数：`camelCase.ts`（`parseWorkbook.ts`）。
- 组件名 = 文件名；一个文件一个导出组件（小的内部子组件可留同文件，超过 150 行就拆）。
- 变量/函数 `camelCase`；类型/接口 `PascalCase`；常量 `SCREAMING_SNAKE_CASE`。
- 布尔量以 `is/has/can` 开头（`isFavorite`、`hasErrors`）。
- 事件处理函数 `handleXxx`，传给子组件的 prop 叫 `onXxx`。

## 3. 结构与分层

```
src/
├─ types.ts            # 领域类型，单一来源
├─ storage/            # 持久化：只在这里出现 localStorage
├─ hooks/              # useContacts 等状态逻辑
├─ features/<domain>/  # 功能模块，含组件 + 纯函数逻辑
├─ components/         # 跨模块通用 UI
└─ styles/
```

- 依赖方向单向：`components → features → hooks → storage`，不允许反向 import。
- 组件只做渲染与事件转发；数据处理放 `logic.ts` 纯函数，便于测试。
- 单文件不超过 200 行；单函数不超过 50 行，超出就拆。

## 4. TypeScript 细则

- 导出/入参类型显式标注；不推导公共 API 的返回类型。
- 用 `as const` 定义字面量联合（如方法类型枚举），不用 `enum`。
- 可选字段用 `?`，不写 `| undefined` 冗余；默认值在解构处给。
- 不写 `!` 非空断言，除非 DOM 根节点（`#root`）。

## 5. React 细则

- 函数组件 + hooks，不用 class。
- 列表 `key` 用稳定 id，不用 index。
- 受控表单；校验函数纯函数化（`validateContact(form): string[]`）。
- `useEffect` 只做副作用（落盘、监听），可推导的数据用 `useMemo`。
- 不提前优化；先跑通再抽象，抽象必须被 ≥2 处复用。

## 6. 样式

- 颜色、圆角、间距来自 Tailwind 语义类（`bg-slate-50`、`rounded-xl`），不写魔法值。
- 断点：`sm:` 640 起两列，`lg:` 1024 起三列；移动端 390px 必须不横向滚动。
- 交互态必写：`hover:` `focus-visible:` `disabled:` `aria-*`。
- 空状态、加载态、错误态必须有专门组件，不用空白页代替。

## 7. Git

- 分支：`main` 永远可运行；功能分支 `feat/xxx`，修 bug `fix/xxx`，文档 `docs/xxx`。
- 提交信息：Conventional Commits
  `feat(bookmark): 支持星标筛选`
  `fix(excel): 修正标签含全角冒号时的解析`
  `docs(readme): 补充快速开始`
- 一次提交只做一件事；提交前必须 `npm run build` 通过。
- 合并走 Pull Request，描述写：改了什么 / 怎么验 / 截图。

## 8. 文件与代码卫生

- 无未使用变量与 import（`noUnusedLocals` 会拦）。
- 无 `console.log` 提交（调试用完删除）。
- 中文文案直接写在组件里，不做 i18n 抽象（单人项目，避免过度设计）。
- 注释只写“为什么”，不写“做了什么”。

## 9. 自审清单（提交 PR 前逐条过）

- [ ] `npm run build` 与 `npm test` 均通过
- [ ] 新功能在 390 / 1280 两个宽度都正常
- [ ] 空数据、错误数据、刷新后三种情况都试过
- [ ] 提交信息符合规范、粒度合理
- [ ] 没有把 `node_modules`、`dist`、`.env` 提交进去
