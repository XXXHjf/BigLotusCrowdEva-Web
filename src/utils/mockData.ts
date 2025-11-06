/**
 * 模拟数据生成工具
 */

import type { Zone, HeatmapDataPoint, ModelPrediction, GraphNode, GraphEdge } from '../types/chart'

/**
 * 生成区块列表
 */
export function generateZones(): Zone[] {
  return [
    { id: 'zone_1', name: '区块1', label: '入口区域' },
    { id: 'zone_2', name: '区块2', label: '主大厅' },
    { id: 'zone_3', name: '区块3', label: '东侧走廊' },
    { id: 'zone_4', name: '区块4', label: '西侧走廊' },
    { id: 'zone_5', name: '区块5', label: '中央休息区' },
    { id: 'zone_6', name: '区块6', label: '北侧出口' },
    { id: 'zone_7', name: '区块7', label: '南侧出口' },
    { id: 'zone_8', name: '区块8', label: 'VIP区域' },
  ]
}

/**
 * 生成热力图数据
 */
export function generateHeatmapData(zones: Zone[], times: string[]): HeatmapDataPoint[] {
  const data: HeatmapDataPoint[] = []

  zones.forEach((zone) => {
    times.forEach((time) => {
      // 模拟不同区块在不同时间段的人流变化
      const hour = new Date(time).getHours()
      let baseValue = 50

      // 根据区块ID设置基础值
      const zoneIndex = parseInt(zone.id.split('_')[1])
      baseValue += (zoneIndex - 1) * 20

      // 根据时间段模拟人流高峰（早8-10点，晚17-19点）
      if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
        baseValue += 80 + Math.random() * 40
      } else if (hour >= 12 && hour <= 14) {
        baseValue += 40 + Math.random() * 30
      } else {
        baseValue += Math.random() * 30
      }

      // 添加一些随机波动
      baseValue += (Math.random() - 0.5) * 20

      data.push({
        zone: zone.id,
        time,
        value: Math.max(0, Math.round(baseValue)),
      })
    })
  })

  return data
}

/**
 * 生成模型预测数据
 */
export function generateModelPredictions(_zoneId: string, times: string[]): ModelPrediction[] {
  const models = [
    { name: 'LSTM模型', id: 'lstm' },
    { name: 'GRU模型', id: 'gru' },
    { name: 'Transformer模型', id: 'transformer' },
    { name: '集成模型', id: 'ensemble' },
  ]

  return models.map((model) => {
    const baseValue = 100 + Math.random() * 50
    const data = times.map((time) => {
      const hour = new Date(time).getHours()
      let value = baseValue

      // 模拟不同模型的预测差异
      const modelOffset =
        model.id === 'lstm' ? 10 : model.id === 'gru' ? -5 : model.id === 'transformer' ? 15 : 0

      // 时间段影响
      if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
        value += 80 + modelOffset + Math.random() * 30
      } else if (hour >= 12 && hour <= 14) {
        value += 40 + modelOffset + Math.random() * 20
      } else {
        value += modelOffset + Math.random() * 20
      }

      // 添加模型特定的随机波动
      value += (Math.random() - 0.5) * 15

      return {
        time,
        value: Math.max(0, Math.round(value)),
      }
    })

    return {
      modelName: model.name,
      modelId: model.id,
      data,
    }
  })
}

/**
 * 生成关系图数据
 */
export function generateGraphData(zones: Zone[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = zones.map((zone, index) => ({
    id: zone.id,
    name: zone.name,
    label: zone.label,
    value: 50 + Math.random() * 100,
    category: Math.floor(index / 3), // 简单的分类
  }))

  const edges: GraphEdge[] = []

  // 生成区块之间的流向关系
  // 入口区域 -> 主大厅
  edges.push({
    id: 'e1',
    source: 'zone_1',
    target: 'zone_2',
    value: 0.8,
    label: '0.8',
    type: 'flow',
  })

  // 主大厅 -> 各个走廊
  edges.push(
    {
      id: 'e2',
      source: 'zone_2',
      target: 'zone_3',
      value: 0.6,
      label: '0.6',
      type: 'flow',
    },
    {
      id: 'e3',
      source: 'zone_2',
      target: 'zone_4',
      value: 0.5,
      label: '0.5',
      type: 'flow',
    },
    {
      id: 'e4',
      source: 'zone_2',
      target: 'zone_5',
      value: 0.7,
      label: '0.7',
      type: 'flow',
    },
  )

  // 走廊 -> 出口
  edges.push(
    {
      id: 'e5',
      source: 'zone_3',
      target: 'zone_6',
      value: 0.9,
      label: '0.9',
      type: 'flow',
    },
    {
      id: 'e6',
      source: 'zone_4',
      target: 'zone_7',
      value: 0.85,
      label: '0.85',
      type: 'flow',
    },
  )

  // VIP区域的特殊关系
  edges.push({
    id: 'e7',
    source: 'zone_5',
    target: 'zone_8',
    value: 0.3,
    label: '0.3',
    type: 'flow',
  })

  // 添加一些影响关系（人流增加会影响相邻区块）
  edges.push(
    {
      id: 'e8',
      source: 'zone_2',
      target: 'zone_1',
      value: 0.4,
      label: '+0.4',
      type: 'influence',
    },
    {
      id: 'e9',
      source: 'zone_3',
      target: 'zone_4',
      value: 0.3,
      label: '+0.3',
      type: 'influence',
    },
    {
      id: 'e10',
      source: 'zone_6',
      target: 'zone_3',
      value: 0.2,
      label: '+0.2',
      type: 'influence',
    },
  )

  return { nodes, edges }
}

/**
 * 获取某个节点的相邻节点
 */
export function getAdjacentNodes(
  nodeId: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // 找到与该节点直接相连的边
  const relatedEdges = edges.filter((edge) => edge.source === nodeId || edge.target === nodeId)

  // 提取相关的节点ID
  const relatedNodeIds = new Set<string>([nodeId])
  relatedEdges.forEach((edge) => {
    relatedNodeIds.add(edge.source)
    relatedNodeIds.add(edge.target)
  })

  // 过滤出相关节点
  const relatedNodes = nodes.filter((node) => relatedNodeIds.has(node.id))

  return {
    nodes: relatedNodes,
    edges: relatedEdges,
  }
}
