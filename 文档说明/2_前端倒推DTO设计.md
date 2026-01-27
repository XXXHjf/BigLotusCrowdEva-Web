# 重要场所人群疏散可视化分析系统（CFEVA）· 后端数据类型设计（对齐现有前端）

来源：前端设计好后，根据前端目前设置的静态数据和Mock数据反推而来。

目的：为后续真实接口提供统一的字段定义，覆盖当前前端使用的所有可视化与交互场景。类型示例采用 TypeScript 书写，后端可据此生成 OpenAPI/Proto 等规范。

## 1. 通用
```ts
/** 标准响应包装 */
interface ApiResponse<T> {
  code: number;           // 0 表示成功，其它为错误码
  message: string;        // 人类可读的提示
  data: T;                // 业务数据
  success: boolean;       // true 表示成功
}

/** 分页 */
interface PaginationRequest {
  page: number;           // 从 1 开始
  pageSize: number;       // 每页条数
}
interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** 时间范围 */
interface TimeRange {
  startTime: string;      // ISO8601，含时区，例如 2025-01-01T08:00:00+08:00
  endTime: string;        // ISO8601
}
```

## 2. 登录与会话
```ts
interface AuthRequest {
  username: string;
  password: string;
}

interface AuthToken {
  token: string;          // JWT / Session Id
  expiresAt: string;      // ISO8601
}
```

## 3. 区域与节点基础定义
```ts
/** 场馆区块/节点 */
interface Zone {
  id: string;             // 唯一标识，如 zone_1
  name: string;           // 系统内部名称
  label: string;          // 展示名称
  category?: string;      // 可选分类，如 entrance/hall/corridor/stand/exit
}
```

## 4. 概览页（KPI、热力矩阵、告警）
```ts
/** KPI 卡片 */
interface KpiItem {
  id: string;             // 唯一标识，如 total_people
  title: string;          // 标题
  value: number;          // 数值
  unit?: string;          // 单位
  trend?: 'up' | 'down';  // 趋势方向
  trendValue?: string;    // 趋势幅度，字符串便于携带 %
}

/** 热力矩阵数据点 */
interface HeatmapDataPoint {
  zoneId: string;         // 对应 Zone.id
  time: string;           // ISO8601，精度到分钟
  value: number;          // 人数/拥堵指数
}

/** 告警列表项 */
type AlarmLevel = 'warning' | 'danger';
interface AlarmItem {
  id: string;
  level: AlarmLevel;
  content: string;        // 描述
  time: string;           // ISO8601
  zoneId?: string;        // 可选定位到区块
}
```

## 5. 聚类监控（力导向图 + 节点详情 + 桑基流向）
```ts
/** 力导向节点 */
type CrowdLevel = 'safe' | 'warning' | 'danger' | 'normal';
interface GraphNode {
  id: string;             // 聚类/节点 id
  label: string;          // 展示名
  value: number;          // 当前人流量
  level: CrowdLevel;      // 拥堵等级
}

/** 力导向边 */
interface GraphEdge {
  id: string;
  source: string;         // GraphNode.id
  target: string;         // GraphNode.id
  value: number;          // 流量强度
  type?: 'flow' | 'influence'; // 流向/影响
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** 节点详情扩展 */
interface NodeDetail {
  id: string;             // GraphNode.id
  label: string;
  value: number;          // 当前人流量
  level: CrowdLevel;
  maleRatio?: number;     // 0-100
  femaleRatio?: number;   // 0-100
  avgStayMinutes?: number;// 平均停留时长
}

/** 桑基节点与连线 */
interface SankeyNode { name: string; }
interface SankeyLink {
  source: string;         // SankeyNode.name
  target: string;         // SankeyNode.name
  value: number;          // 流量
}
interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
```

## 6. 趋势研判（置信区间趋势图 + 模型竞技场）
```ts
/** 趋势数据点：时间 + 人流量 */
interface TrendPoint {
  time: string;           // HH:mm 或 ISO8601
  value: number;
}

/** 置信区间数据 */
interface ConfidenceBand {
  history: TrendPoint[];      // 历史实测
  prediction: TrendPoint[];   // 预测均值（含连接点）
  lowerBound: TrendPoint[];   // 预测下界
  upperBound: TrendPoint[];   // 预测上界
}

/** 模型评分（雷达图） */
interface ModelScore {
  name: string;               // 如 LSTM / Transformer
  scores: [number, number, number]; // [准确性, 响应速度, 抗噪能力]，0-100
}

interface ModelArenaData {
  models: ModelScore[];       // 至少两个模型，前端对比取最高
}
```

## 7. 应急沙盘（节点网络 + 操作推演）
```ts
/** 沙盘节点，复用 GraphNode，可附加样式 */
interface SimulationNode extends GraphNode {
  style?: 'normal' | 'dashed';  // 前端用于虚线标记
}

interface SimulationEdge extends GraphEdge {
  style?: 'normal' | 'dashed';  // 虚线表示被关闭/限流影响
}

interface SimulationGraph {
  nodes: SimulationNode[];
  edges: SimulationEdge[];
}

/** 推演操作请求 */
type SimulationAction = 'CLOSE' | 'LIMIT';
interface SimulationRequest {
  nodeId: string;             // 选中节点 id
  action: SimulationAction;   // 关闭 / 限流
  limitPercent?: number;      // 限流比例，50-200
}

/** 推演结果 */
interface SimulationImpact {
  impactedNodes: string[];    // 下游节点列表
  impactedEdges: string[];    // 下游边列表
  message: string;            // 文本说明
  graph: SimulationGraph;     // 操作后的图（可选，若后端做计算则返回）
}
```

## 8. 接口与字段关联建议
- 概览：
  - `GET /overview/kpis` → `KpiItem[]`
  - `GET /overview/heatmap` (params: `TimeRange`) → `HeatmapDataPoint[]`
  - `GET /overview/alarms` (params: `PaginationRequest`) → `PaginationResult<AlarmItem>`
- 聚类监控：
  - `GET /monitor/graph` → `GraphData`
  - `GET /monitor/node/:id` → `NodeDetail`
  - `GET /monitor/sankey` (params: `nodeId?`) → `SankeyData`
- 趋势研判：
  - `GET /prediction/confidence` (params: `TimeRange`) → `ConfidenceBand`
  - `GET /prediction/models` → `ModelArenaData`
- 应急沙盘：
  - `GET /simulation/graph` → `SimulationGraph`
  - `POST /simulation/run` (body: `SimulationRequest`) → `SimulationImpact`
- 通用：
  - `POST /auth/login` (body: `AuthRequest`) → `AuthToken`

以上类型即为前端当前组件所需的最小字段集合，后端可在此基础上扩展，但需保持字段名与数据形态兼容。***
