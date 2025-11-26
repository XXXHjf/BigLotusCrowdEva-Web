/**
 * 图表相关类型定义
 */

/**
 * 区块信息
 */
export interface Zone {
  id: string
  name: string
  label: string
}

/**
 * 热力图数据点
 */
export interface HeatmapDataPoint {
  zone: string
  time: string
  value: number
}

/**
 * 模型预测结果
 */
export interface ModelPrediction {
  modelName: string
  modelId: string
  data: Array<{
    time: string
    value: number
  }>
}

/**
 * 关系图节点
 */
export interface GraphNode {
  id: string
  name?: string
  label: string
  value: number // 当前人流量
  x?: number
  y?: number
  category?: number
  level?: 'safe' | 'warning' | 'danger' | 'normal'
  style?: string
}

/**
 * 关系图边
 */
export interface GraphEdge {
  id?: string
  source: string
  target: string
  value: number // 关系强度或影响系数
  label?: string
  type?: 'flow' | 'influence' // 流向关系或影响关系
  style?: string
}

/**
 * 关系图数据
 */
export interface GraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
}
