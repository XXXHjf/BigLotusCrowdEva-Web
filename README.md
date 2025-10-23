# BigLotusCrowdEva

一个基于 React + TypeScript + Vite 的现代化前端项目，集成了数据可视化功能。

## 🚀 项目特性

- ⚡ **Vite** - 极速的构建工具和开发服务器
- ⚛️ **React 19** - 最新的 React 框架
- 🔷 **TypeScript** - 类型安全的 JavaScript
- 📊 **ECharts** - 强大的数据可视化库
- 🎨 **Prettier** - 代码格式化工具
- 🔍 **ESLint** - 代码质量检查工具
- 🎯 **严格模式** - 完整的 TypeScript 严格类型检查

## 📁 项目结构

```
BigLotusCrowdEva/
├── public/                 # 静态资源目录
│   └── vite.svg           # Vite 图标
├── src/                   # 源代码目录
│   ├── assets/           # 项目资源文件
│   │   └── react.svg     # React 图标
│   ├── App.tsx           # 主应用组件
│   ├── App.css           # 应用样式
│   ├── main.tsx          # 应用入口文件
│   └── index.css         # 全局样式
├── .vscode/              # VS Code 配置
│   └── settings.json     # 编辑器设置
├── eslint.config.js      # ESLint 配置
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 主配置
├── tsconfig.app.json     # 应用 TypeScript 配置
├── tsconfig.node.json    # Node.js TypeScript 配置
└── package.json          # 项目依赖和脚本
```

## 🛠️ 技术栈

### 核心框架

- **React 19.1.1** - 用户界面库
- **TypeScript 5.9.3** - 类型系统
- **Vite 7.1.7** - 构建工具

### 数据可视化

- **ECharts 5.6.0** - 数据可视化图表库
- **echarts-for-react 3.0.2** - React ECharts 组件

### 开发工具

- **ESLint 9.36.0** - 代码质量检查
- **Prettier 3.6.2** - 代码格式化
- **TypeScript ESLint** - TypeScript 专用 ESLint 规则

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动开发服务器，支持热重载。

### 构建生产版本

```bash
npm run build
```

构建优化的生产版本到 `dist` 目录。

### 预览生产版本

```bash
npm run preview
```

本地预览构建后的应用。

### 代码检查

```bash
npm run lint
```

运行 ESLint 检查代码质量。

## ⚙️ 配置说明

### ESLint 配置

项目使用 ESLint 9.x 的 Flat Config 格式，包含：

- React Hooks 规则
- React Refresh 规则
- TypeScript 推荐规则
- Prettier 集成

### TypeScript 配置

- **严格模式**：启用所有严格类型检查
- **现代语法**：支持 ES2022+ 特性
- **模块解析**：使用 bundler 模式
- **JSX 支持**：React JSX 转换

### VS Code 集成

项目包含完整的 VS Code 配置：

- 自动格式化（保存时）
- ESLint 自动修复
- Prettier 作为默认格式化工具
- TypeScript 智能提示

## 📊 数据可视化

项目集成了 ECharts 数据可视化库，支持：

- 各种图表类型（柱状图、折线图、饼图等）
- 响应式设计
- 交互式图表
- 主题定制

## 🎨 代码规范

- 使用 Prettier 进行代码格式化
- ESLint 进行代码质量检查
- TypeScript 严格类型检查
- 自动修复可修复的问题

## 📝 开发建议

1. **组件开发**：使用 TypeScript 接口定义组件 props
2. **样式管理**：使用 CSS 模块或 styled-components
3. **状态管理**：根据项目规模选择合适的状态管理方案
4. **路由管理**：可集成 React Router
5. **API 集成**：使用 fetch 或 axios 进行数据请求

## 🔧 自定义配置

### 添加新的 ESLint 规则

编辑 `eslint.config.js` 文件，在 `extends` 数组中添加新的配置。

### 修改 Vite 配置

编辑 `vite.config.ts` 文件，添加插件或修改构建选项。

### 更新 TypeScript 配置

根据需要修改 `tsconfig.app.json` 或 `tsconfig.node.json`。

## 📄 许可证

MIT License
