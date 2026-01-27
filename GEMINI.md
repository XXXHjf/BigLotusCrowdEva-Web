# GEMINI.md

## 项目概览

这是一个基于 React 和 TypeScript 的**重要场所人群疏散可视化分析系统**（Critical Facility Evacuation Visual Analytics System，简称 CFEVA）。项目名称为 `cfeva`，旨在将传统的“数据展示屏”升级为“应急指挥可视化中枢”。

系统利用 Vite 进行构建，UI 基于 Ant Design 组件库，图表部分则使用 ECharts 实现。设计上采用深色驾驶舱模式，以蓝、白、灰为基调，突出数据可视化的科技感。

### 核心功能

应用被划分为一个登录入口和四个核心的仪表盘模块：

- **认证流程**: 应用包含一个独立的登录页面 (`/login`)。目前采用硬编码 (`admin`/`admin`) 的方式进行前端认证，认证状态通过 `localStorage` 记录。

- **仪表盘 (`/dashboard`)**: 登录后进入主仪表盘，采用经典的后台管理布局，包含侧边栏导航、顶部全局状态栏和内容展示区。
    - **`/overview` (全域态势)**:
        - **核心视觉**: 使用“分区拥堵热力矩阵”展示近 60 分钟（10 分钟粒度）内各区域人流密度，配色与背景对比强烈。
        - **关键指标**: 顶部 KPI 卡片展示“场内总人数/拥堵指数/入场速率/出场速率”，带趋势提示。
        - **实时报警**: 右侧边栏展示实时的报警信息列表。
    - **`/monitor` (聚类监控)**:
        - **核心视觉**: 左侧为**力导向拓扑图**，展示人群聚类结构，危险节点带呼吸动效；右侧显示节点详情与桑基流向。
        - **桑基图**: 线条颜色随源节点分组（入口-蓝、通道-紫、区域-橙、出口-青），节点/线加间距、加粗，对比度高，标签与线分离。
        - **交互分析**: 点击拓扑图节点，右侧联动节点详情和桑基图，便于分析微观流向。
    - **`/prediction` (趋势研判)**:
        - **核心视觉**: 顶部为**置信区间趋势图**，展示未来一小时的人流量预测，包含预测均值（虚线）和不确定性范围（阴影带）。
        - **模型对比**: 底部为**模型竞技场**，通过雷达图对比 `LSTM` 和 `Transformer` 等模型的多维度评分，并给出系统推荐。
    - **`/simulation` (应急沙盘)**:
        - **核心功能**: 提供 "What-If" 分析能力。
        - **交互**: 用户可在简化的**节点网络图**上点击节点，执行“关闭”或“限流”操作；限流通过滑块自定义 50%-200%。
        - **反馈**: 图上高亮/虚线标记影响范围；右侧“影响评估”默认显示提示，执行操作后输出评估文案。

该应用目前使用模拟数据 (`src/utils/mockData.ts`)，结构已预留从 API (`src/api/crowd.ts`) 拉取真实数据。

## 技术栈
- **核心框架**: React 19, TypeScript
- **构建工具**: Vite
- **UI 组件库**: Ant Design 6.x
- **路由**: React Router 6.x
- **图表**: ECharts
- **代码规范**: ESLint, Prettier

## 构建与运行

### 前提条件
- 需安装 Node.js (推荐 v18+) 和 npm。

### 安装
克隆项目后，在根目录运行：
```bash
npm install
```

### 开发模式
启动开发服务器，并支持热更新：
```bash
npm run dev
```

### 生产构建
构建用于生产环境的优化版本：
```bash
npm run build
```
构建产物将输出到 `dist` 目录。

### 预览生产构建
在本地预览生产构建的版本：
```bash
npm run preview
```

### 代码检查
使用 ESLint 检查代码规范：
```bash
npm run lint
```

## 开发规范

### 设计与主题
- 统一深色驾驶舱主题，核心色：`#4cc3ff`（主色）、`#070f1f`（背景）、`#d8e6ff`（文字），玻璃质感卡片（渐变+半透明边框+阴影）。
- 全局配置在 `src/router/index.tsx` 的 `ConfigProvider` 里覆盖 Ant Design token；基础样式在 `src/index.css` / `src/App.css`。
- 页面头部标题被移除（节省空间）；内容区使用 `page-shell` 样式保持间距一致。

### 代码风格
- 项目使用 `Prettier` 统一代码格式，建议配置编辑器在保存时自动格式化。
- `ESLint` 用于保证代码质量和风格一致性。

### 项目结构
项目结构经过重构，以支持路由和模块化开发：
```
src/
├── api/         # API 请求相关模块
├── assets/      # 静态资源 (如图标)
├── components/  # 可复用的通用组件
│   ├── CrowdDensityHeatmap.tsx   # [概览] 分区拥堵热力矩阵
│   ├── KpiCard.tsx               # [概览] 关键指标卡
│   ├── AlarmList.tsx             # [概览] 报警列表
│   ├── SimulationGraph.tsx       # [沙盘] 演练网络图
│   ├── NodeControlPanel.tsx      # [沙盘] 节点控制面板（限流滑块）
│   ├── ImpactAssessmentPanel.tsx # [沙盘] 影响评估面板（默认提示）
│   ├── ForceDirectedGraph.tsx    # [监控] 力导向拓扑图
│   ├── NodeDetailPanel.tsx       # [监控] 节点详情面板
│   ├── SankeyFlowChart.tsx       # [监控] 桑基图（线色随源节点分组）
│   ├── ConfidenceBandChart.tsx   # [预测] 置信区间图
│   ├── ModelArena.tsx            # [预测] 模型竞技场
│   └── ModelScoreRadar.tsx       # [预测] 模型评分雷达图
├── constants/   # 全局常量
├── hooks/       # 自定义 React Hooks
├── layouts/     # 布局组件 (如 MainLayout)
├── pages/       # 页面级组件
│   ├── LoginPage.tsx
│   └── dashboard/
│       ├── OverviewPage.tsx
│       ├── MonitorPage.tsx
│       ├── PredictionPage.tsx
│       └── SimulationPage.tsx
├── router/      # 路由配置和管理
├── types/       # TypeScript 类型定义
├── utils/       # 工具函数 (如模拟数据生成)
├── App.tsx      # 应用主入口，渲染路由
├── main.tsx     # React DOM 渲染入口，配置 Ant Design
└── ...
```

### 交互与数据流说明
- **登录**：`/login`，硬编码 `admin/admin`，成功后写入 `localStorage.isAuthenticated=true` 并跳转 `/`。
- **路由保护**：`src/router/index.tsx` 中的 `PrivateRoute` 检查 `localStorage`，未登录重定向 `/login`。
- **概览页数据**：`CrowdDensityHeatmap` 内部模拟最近 60 分钟数据；KPI/报警为静态 mock，可接 API 后替换。
- **聚类监控**：`useDynamicData` 周期刷新 mock 的力导向数据；点击节点触发 `handleNodeClick` 联动 `NodeDetailPanel` 与 `SankeyFlowChart` 数据。
- **桑基图颜色策略**：源节点名包含“入口/通道/区域/出口”决定线色，线宽较粗、间距放大，标签与流线分离，强调时提升不透明度与宽度。
- **预测**：`generatePredictionDataWithBounds` 提供历史/预测/上下界，`ConfidenceBandChart` 绘制带阴影的置信区间；`ModelArena` 比较模型得分并给出推荐。
- **应急沙盘**：左侧 `SimulationGraph` 展示节点网络；右侧 `NodeControlPanel` 支持关闭或 50%-200% 限流滑块；`ImpactAssessmentPanel` 默认提示文案，操作后显示评估结果；重置恢复初始图和提示。

### Git
- 遵循约定式提交 (Conventional Commits) 消息标准。
- 从 `main` 分支创建功能分支，通过 Pull Request 合并，以进行代码审查。
