# AGENT.md - 项目上下文文档

本文档用于 AI 助手快速了解项目上下文，包含技术栈、项目结构、设计思路等信息。

## 📋 项目概述

**项目名称**: BigLotusCrowdEva  
**项目类型**: 体育馆人群走势预测可视化 Web 应用  
**项目目标**: 为 Python 训练的人群预测模型提供前端可视化界面，用于展示和监控体育馆人群走势预测结果

### 项目背景

- 同事负责训练 Python 模型用于预测体育馆人群走势
- 本项目负责模型部署的前端可视化部分
- 后续需要实现后端 API 接口和服务器部署
- **项目特点**: 纯展示界面，无需用户登录和认证，打开即用

## 🛠️ 技术栈

### 核心框架

- **React 19.1.1** - 用户界面库
- **TypeScript 5.9.3** - 类型安全
- **Vite 7.1.7** - 构建工具和开发服务器

### 数据可视化

- **ECharts 5.6.0** - 数据可视化图表库
- **echarts-for-react 3.0.2** - React ECharts 组件封装

### 开发工具

- **ESLint 9.36.0** - 代码质量检查（Flat Config 格式）
- **Prettier 3.6.2** - 代码格式化
- **TypeScript ESLint** - TypeScript 专用规则

### 代码规范

- TypeScript 严格模式
- ESLint + Prettier 自动格式化
- 现代 ES2022+ 语法

## 📁 项目结构

```
BigLotusCrowdEva/
├── public/                 # 静态资源目录
│   └── vite.svg
├── src/                   # 源代码目录
│   ├── api/              # API 请求封装
│   │   └── request.ts    # 统一的请求封装类
│   ├── assets/           # 静态资源文件
│   │   └── react.svg
│   ├── components/       # React 组件
│   │   └── common/       # 通用组件（待开发）
│   ├── constants/        # 常量定义
│   │   └── index.ts     # 项目常量（API配置、错误消息等）
│   ├── hooks/           # 自定义 Hooks
│   │   ├── useApi.ts    # API 请求 Hook
│   │   └── index.ts     # Hooks 导出
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts     # 通用类型（ApiResponse、CrowdPrediction 等）
│   ├── utils/           # 工具函数
│   │   ├── chart.ts     # ECharts 图表工具
│   │   ├── date.ts      # 日期时间处理
│   │   ├── error.ts     # 错误处理
│   │   ├── format.ts    # 格式化工具
│   │   └── index.ts     # 工具函数导出
│   ├── App.tsx          # 主应用组件
│   ├── App.css          # 应用样式
│   ├── main.tsx         # 应用入口文件
│   └── index.css        # 全局样式
├── eslint.config.js     # ESLint 配置
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 主配置
├── tsconfig.app.json    # 应用 TypeScript 配置
├── tsconfig.node.json   # Node.js TypeScript 配置
├── package.json         # 项目依赖和脚本
└── AGENT.md             # 本文档（项目上下文）
```

## 🏗️ 架构设计

### API 请求层 (`src/api/`)

**request.ts** - 统一的 HTTP 请求封装

- 基于 Fetch API 实现
- 支持 GET、POST、PUT、DELETE、PATCH 方法
- 统一的错误处理机制
- 请求超时控制
- 支持自定义请求头和参数
- **注意**: 本项目为纯展示界面，无需用户认证，不包含 token 处理逻辑

使用示例：

```typescript
import { request } from '@/api/request'

// GET 请求
const response = await request.get('/crowd/predictions', { params: { date: '2024-01-01' } })

// POST 请求
const response = await request.post('/crowd/predictions', { timestamp: Date.now(), count: 100 })
```

### 类型定义 (`src/types/`)

**index.ts** - 核心类型定义

- `ApiResponse<T>` - API 响应结构
- `CrowdPrediction` - 人群预测数据
- `CrowdDataPoint` - 人群走势数据点
- `PaginationParams` / `PaginationResponse` - 分页相关
- `TimeRange` - 时间范围
- `ChartOption` - 图表配置
- `RequestConfig` - 请求配置
- `ErrorInfo` - 错误信息

### 常量定义 (`src/constants/`)

**index.ts** - 项目常量

- `API_CONFIG` - API 基础配置（可通过环境变量配置）
- `HTTP_STATUS` - HTTP 状态码
- `ERROR_MESSAGES` - 错误消息映射
- `DATE_FORMATS` - 日期格式化格式
- `CHART_DEFAULTS` - 图表默认配置（颜色、网格等）
- `STORAGE_KEYS` - 本地存储键名
- `PAGINATION_DEFAULTS` - 分页默认值

### 工具函数 (`src/utils/`)

#### chart.ts - ECharts 图表工具

- `createLineChartOption()` - 创建折线图配置
- `createComparisonChartOption()` - 创建对比折线图（预测 vs 实际）
- `createBarChartOption()` - 创建柱状图配置
- `createResponsiveChartOption()` - 创建响应式图表配置

#### date.ts - 日期时间处理

- `formatDate()` - 格式化日期
- `getRelativeTime()` - 获取相对时间描述
- `getTimeRange()` - 获取时间范围（今天、昨天、本周、本月等）
- `isSameDay()` - 判断是否为同一天
- `timestampToDate()` / `dateToTimestamp()` - 时间戳转换

#### format.ts - 格式化工具

- `formatNumber()` - 数字格式化（千分位）
- `formatFileSize()` - 文件大小格式化
- `formatPercent()` - 百分比格式化
- `truncateText()` - 文本截断
- `deepClone()` - 深拷贝
- `debounce()` / `throttle()` - 防抖和节流

#### error.ts - 错误处理

- `handleError()` - 统一错误处理
- `formatError()` - 格式化错误信息
- `createError()` - 创建错误对象

### 自定义 Hooks (`src/hooks/`)

#### useApi.ts - API 请求 Hook

提供统一的 API 请求状态管理：

- `data` - 响应数据
- `loading` - 加载状态
- `error` - 错误信息
- `execute()` - 执行请求
- `reset()` - 重置状态

使用示例：

```typescript
const { data, loading, error, execute } = useApi(() => request.get('/crowd/predictions'), {
  immediate: true,
})
```

## 🎨 设计思路

### 1. 数据流设计

```
后端 API → request 封装 → useApi Hook → React 组件 → ECharts 图表
```

### 2. 错误处理策略

- 统一在 `request.ts` 中处理 HTTP 错误
- 业务错误通过 `ApiResponse` 的 `success` 字段判断
- 使用 `handleError()` 统一处理和展示错误
- 支持自定义错误回调

### 3. 类型安全

- 所有 API 响应使用泛型 `ApiResponse<T>`
- 业务数据类型明确定义（如 `CrowdPrediction`）
- 严格的 TypeScript 配置

### 4. 图表可视化

- 基于 ECharts 进行数据可视化
- 提供图表配置工具函数，快速生成常用图表
- 支持响应式设计，适配不同屏幕尺寸
- 支持预测值与实际值对比展示

### 5. 代码组织

- 按功能模块划分目录
- 工具函数统一导出，便于使用
- 类型定义集中管理
- 常量统一配置

## 📊 核心业务概念

### 人群预测数据 (`CrowdPrediction`)

```typescript
{
  timestamp: string | number  // 时间戳
  predictedCount: number      // 预测人数
  actualCount?: number        // 实际人数（可选）
  confidence?: number         // 预测置信度（可选）
  location?: string           // 位置信息（可选）
}
```

### 人群走势数据点 (`CrowdDataPoint`)

```typescript
{
  time: string              // 时间
  value: number             // 人数
  type?: 'predicted' | 'actual'  // 数据类型
}
```

## 🔧 开发指南

### 环境变量

项目支持通过环境变量配置 API 地址：

- `VITE_API_BASE_URL` - API 基础地址（默认：`http://localhost:8000/api`）

### 添加新的 API 接口

1. 在 `src/api/` 目录下创建对应的 API 文件
2. 使用 `request` 实例进行请求
3. 定义对应的 TypeScript 类型

### 添加新的工具函数

1. 在 `src/utils/` 目录下创建或修改对应的工具文件
2. 在 `src/utils/index.ts` 中导出
3. 确保函数有清晰的类型定义和注释

### 添加新的组件

1. 在 `src/components/` 目录下创建组件文件
2. 使用 TypeScript 定义 Props 类型
3. 通用组件放在 `src/components/common/` 目录

## 🚀 后续开发计划

1. **组件开发**
   - 开发数据可视化组件（折线图、柱状图等）
   - 开发时间选择器组件
   - 开发数据表格组件

2. **功能实现**
   - 人群走势预测数据展示
   - 预测值与实际值对比
   - 历史数据查询和筛选
   - 实时数据更新（WebSocket 支持）

3. **后端集成**
   - 对接后端 API 接口
   - 实现数据缓存策略
   - 错误处理和重试机制

4. **用户体验优化**
   - 加载状态提示
   - 错误提示优化
   - 响应式布局优化
   - 性能优化

## 📝 注意事项

1. **类型安全**: 所有代码都应使用 TypeScript，避免使用 `any` 类型
2. **错误处理**: 所有 API 请求都应进行错误处理
3. **代码规范**: 遵循 ESLint 和 Prettier 配置
4. **注释**: 重要函数和组件应添加清晰的注释
5. **环境变量**: API 地址等配置应通过环境变量管理

## 🔗 相关文档

- [React 官方文档](https://react.dev)
- [TypeScript 官方文档](https://www.typescriptlang.org)
- [Vite 官方文档](https://vite.dev)
- [ECharts 官方文档](https://echarts.apache.org)
- [项目 README](./README.md)

---

**最后更新**: 2024年  
**维护者**: 项目开发团队
