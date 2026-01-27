# 重要场所人群疏散可视化分析系统（Critical Facility Evacuation Visual Analytics System, CFEVA）

React + TypeScript 构建的深色驾驶舱界面，围绕“人群态势感知、趋势研判、应急沙盘”四大场景，提供实时可视化与推演能力。

## 核心特性
- **登录与路由守卫**：`/login` 硬编码账号（admin/admin），登录后进入受保护的仪表盘路由。
- **全域态势**：KPI 卡片 + 热力矩阵，快速感知总人数、拥堵指数、进出速率。
- **聚类监控**：力导向拓扑图联动桑基图，点击节点可查看详情与流向。
- **趋势研判**：带置信区间的预测折线图，模型竞技场对比多模型得分。
- **应急沙盘**：节点网络模拟“关闭/限流”操作，实时标注下游影响。
- **深色主题**：主色 `#4cc3ff`、背景 `#070f1f`，玻璃质感卡片 `panel-card`。

## 技术栈
- 前端：React 19、TypeScript、Vite
- UI：Ant Design 6、ECharts（echarts-for-react）
- 路由：React Router 7
- 代码风格：ESLint + Prettier，2 空格缩进、单引号（规则见 `eslint.config.js` / `.prettierrc`）

## 快速开始
> 需要 Node.js 18+。

```bash
npm install
npm run dev      # 本地开发（HMR）
npm run lint     # 代码规范检查
npm run build    # 生产构建，输出 dist/
npm run preview  # 预览生产包
```

登录账号：`admin` / `admin`（见 `src/pages/LoginPage.tsx`，登录状态保存在 `localStorage`）。

## 目录结构（关键路径）
- `src/router/`：路由与主题配置（深色主题 token 入口）。
- `src/layouts/`：主布局、侧边导航、顶部操作。
- `src/pages/`：页面模块（login、dashboard/overview|monitor|prediction|simulation）。
- `src/components/`：ECharts 组件、面板卡片、节点详情、控制面板等。
- `src/api/`：请求脚手架与示例接口；`src/hooks/useApi.ts` 封装基础请求。
- `src/utils/mockData.ts`：Mock 数据生成器；`useDynamicData` 定时刷新模拟实时性。
- `public/`：静态资源；`dist/`：生产构建产物。

## 页面与交互速览
- **登录**：表单校验 + 登录后重定向 `/dashboard/overview`。
- **全域态势**：`CrowdDensityHeatmap` 热力矩阵、`KpiCard` 指标卡、`AlarmList` 实时告警。
- **聚类监控**：`ForceDirectedGraph` 支持节点点击高亮；`SankeyFlowChart` 按节点分类着色；`NodeDetailPanel` 展示指标。
- **趋势研判**：`ConfidenceBandChart` 展示预测区间；`ModelArena` / `ModelScoreRadar` 对比模型表现。
- **应急沙盘**：`SimulationGraph` 展示节点网络，`NodeControlPanel` 支持“关闭/限流”操作；`ImpactAssessmentPanel` 输出影响说明。

## 数据与接口
- 默认使用 `src/utils/mockData.ts` + `useDynamicData` 生成实时波动数据。
- 请求封装：`src/api/request.ts`（基于 Fetch）与 `src/api/index.ts`。对接真实后端时保持 Mock 返回结构一致，替换 `useDynamicData` 数据源即可。
- 常用类型：`src/types/chart.ts`、`src/types/index.ts`；通用工具在 `src/utils/`。

## 部署
- 推荐本地 `npm run build` 后将 `dist/` 上传到服务器，Nginx 静态托管并配置 SPA 路由回退。
- 详细步骤参见 `DEPLOY.md`，示例配置见 `nginx.conf.example`，一键脚本见 `deploy.sh`。

## 开发规范
- 提交信息遵循 Conventional Commits（示例：`feat: 初始化人群态势驾驶舱界面`）。
- 新增功能请更新相应页面与 Mock 数据，保持 UI 深色主题一致。
- 提交前建议执行 `npm run lint`；生产前执行 `npm run build` 验证。
