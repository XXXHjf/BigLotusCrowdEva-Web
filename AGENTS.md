# Repository Guidelines

## 项目结构与模块组织
- 前端源码在 `src/`（React + TypeScript）。核心目录：`components/`（ECharts + AntD 组件）、`pages/dashboard/`（概览/监控/预测/沙盘）、`layouts/`（主布局）、`router/`（路由与守卫）、`utils/mockData.ts`（模拟数据）、`api/`（请求脚手架）。
- 静态资源在 `public/`；`npm run build` 产物在 `dist/`。

## 构建、测试与开发命令
- `npm install`：安装依赖。
- `npm run dev`：启动 Vite 开发服（HMR）。
- `npm run build`：生产构建输出到 `dist/`。
- `npm run preview`：本地预览生产包。
- `npm run lint`：按项目 ESLint 规则检查。

## 代码风格与命名约定
- 技术栈：React 19 + TS，Ant Design UI，ECharts 图表。
- 格式化：Prettier + ESLint（见 `eslint.config.js`），2 空格缩进，单引号，尾逗号遵守配置。提交前跑 `npm run lint`。
- 命名：组件/页面 `PascalCase.tsx`，hooks `camelCase.ts`，样式临近 `.css`。主题 token 覆盖在 `src/router/index.tsx` 的 `ConfigProvider`，全局样式在 `src/index.css` / `src/App.css`。

## 测试指引
- 当前无专用测试套件，优先保证 lint 通过与手动验证（`npm run dev`/`npm run build`）。
- 如补充测试，按功能就近放置（如 `src/components/__tests__/Component.test.tsx`），推荐 Vitest + React Testing Library。

## 提交与 PR 规范
- 采用 Conventional Commits（如 `feat: add crowd heatmap`，`fix: adjust sankey colors`）。
- PR 需简述变更，UI 改动附前后对比或截图，说明影响的路由/组件及新增命令或配置。

## UI/UX 与数据提示
- 主题：深色驾驶舱，主色 `#4cc3ff`，文字 `#d8e6ff`，背景 `#070f1f`；图表透明背景，高对比；卡片用玻璃质感 `panel-card`。
- 数据：图表使用 `src/utils/mockData.ts` 生成的 mock；真实对接时保持返回结构一致。桑基图线色随源节点分类（入口/通道/区域/出口），沙盘限流支持 50%-200% 滑块。
