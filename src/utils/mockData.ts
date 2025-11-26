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
      const hour = new Date(time).getHours()
      let baseValue = 50
      const zoneIndex = parseInt(zone.id.split('_')[1])
      baseValue += (zoneIndex - 1) * 20
      if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
        baseValue += 80 + Math.random() * 40
      } else if (hour >= 12 && hour <= 14) {
        baseValue += 40 + Math.random() * 30
      } else {
        baseValue += Math.random() * 30
      }
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
      const modelOffset = model.id === 'lstm' ? 10 : model.id === 'gru' ? -5 : model.id === 'transformer' ? 15 : 0
      if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
        value += 80 + modelOffset + Math.random() * 30
      } else if (hour >= 12 && hour <= 14) {
        value += 40 + modelOffset + Math.random() * 20
      } else {
        value += modelOffset + Math.random() * 20
      }
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
 * 生成关系图数据 (用于 SimulationPage)
 */
export function generateGraphData(zones: Zone[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = zones.map((zone, index) => ({
    id: zone.id,
    name: zone.name,
    label: zone.label,
    value: 50 + Math.random() * 100,
    category: Math.floor(index / 3),
  }))

  const edges: GraphEdge[] = [
    { id: 'e1', source: 'zone_1', target: 'zone_2', value: 0.8, label: '0.8', type: 'flow' },
    { id: 'e2', source: 'zone_2', target: 'zone_3', value: 0.6, label: '0.6', type: 'flow' },
    { id: 'e3', source: 'zone_2', target: 'zone_4', value: 0.5, label: '0.5', type: 'flow' },
    { id: 'e4', source: 'zone_2', target: 'zone_5', value: 0.7, label: '0.7', type: 'flow' },
    { id: 'e5', source: 'zone_3', target: 'zone_6', value: 0.9, label: '0.9', type: 'flow' },
    { id: 'e6', source: 'zone_4', target: 'zone_7', value: 0.85, label: '0.85', type: 'flow' },
    { id: 'e7', source: 'zone_5', target: 'zone_8', value: 0.3, label: '0.3', type: 'flow' },
    { id: 'e8', source: 'zone_2', target: 'zone_1', value: 0.4, label: '+0.4', type: 'influence' },
    { id: 'e9', source: 'zone_3', target: 'zone_4', value: 0.3, label: '+0.3', type: 'influence' },
    { id: 'e10', source: 'zone_6', target: 'zone_3', value: 0.2, label: '+0.2', type: 'influence' },
  ]

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
  const relatedEdges = edges.filter((edge) => edge.source === nodeId || edge.target === nodeId)
  const relatedNodeIds = new Set<string>([nodeId])
  relatedEdges.forEach((edge) => {
    relatedNodeIds.add(edge.source)
    relatedNodeIds.add(edge.target)
  })
  const relatedNodes = nodes.filter((node) => relatedNodeIds.has(node.id))
  return {
    nodes: relatedNodes,
    edges: relatedEdges,
  }
}

// --- 力导向图模拟数据 (MonitorPage) ---
export const generateForceGraphData = () => {
    const nodes: GraphNode[] = [
        { id: 'cluster_1', label: '北门入口', value: 350, level: 'danger' },
        { id: 'cluster_2', label: '主大厅A', value: 280, level: 'warning' },
        { id: 'cluster_3', label: '主大厅B', value: 210, level: 'safe' },
        { id: 'cluster_4', label: '东侧看台1', value: 180, level: 'safe' },
        { id: 'cluster_5', label: '东侧看台2', value: 190, level: 'safe' },
        { id: 'cluster_6', label: '西侧看台1', value: 220, level: 'warning' },
        { id: 'cluster_7', label: '西侧看台2', value: 160, level: 'safe' },
        { id: 'cluster_8', label: '美食区1', value: 400, level: 'danger' },
        { id: 'cluster_9', label: '美食区2', value: 320, level: 'warning' },
        { id: 'cluster_10', label: '南门出口', value: 150, level: 'safe' },
    ];

    const edges: GraphEdge[] = [
        { source: 'cluster_1', target: 'cluster_2', value: 120 },
        { source: 'cluster_1', target: 'cluster_3', value: 80 },
        { source: 'cluster_2', target: 'cluster_4', value: 70 },
        { source: 'cluster_2', target: 'cluster_6', value: 90 },
        { source: 'cluster_3', target: 'cluster_5', value: 60 },
        { source: 'cluster_3', target: 'cluster_7', value: 50 },
        { source: 'cluster_4', target: 'cluster_8', value: 100 },
        { source: 'cluster_5', target: 'cluster_8', value: 90 },
        { source: 'cluster_6', target: 'cluster_9', value: 110 },
        { source: 'cluster_7', target: 'cluster_9', value: 80 },
        { source: 'cluster_8', target: 'cluster_10', value: 150 },
        { source: 'cluster_9', target: 'cluster_10', value: 130 },
        { source: 'cluster_4', target: 'cluster_5', value: 30 }, // 看台内部流动
        { source: 'cluster_6', target: 'cluster_7', value: 40 }, // 看台内部流动
    ];

    return { nodes, edges };
};

// --- 桑基图模拟数据 (MonitorPage) ---
export const generateSankeyData = (selectedNodeId?: string) => {
    let nodes = [
        { name: '入口 A' }, { name: '入口 B' }, { name: '入口 C' },
        { name: '通道 1' }, { name: '通道 2' }, { name: '通道 3' },
        { name: '区域 X' }, { name: '区域 Y' }, { name: '区域 Z' },
        { name: '出口' }
    ];

    let links = [
        { source: '入口 A', target: '通道 1', value: 100 },
        { source: '入口 A', target: '通道 2', value: 50 },
        { source: '入口 B', target: '通道 1', value: 80 },
        { source: '入口 B', target: '通道 3', value: 70 },
        { source: '入口 C', target: '通道 2', value: 60 },
        { source: '入口 C', target: '通道 3', value: 90 },

        { source: '通道 1', target: '区域 X', value: 150 },
        { source: '通道 1', target: '区域 Y', value: 30 },
        { source: '通道 2', target: '区域 Y', value: 80 },
        { source: '通道 2', target: '区域 Z', value: 30 },
        { source: '通道 3', target: '区域 X', value: 50 },
        { source: '通道 3', target: '区域 Z', value: 110 },

        { source: '区域 X', target: '出口', value: 180 },
        { source: '区域 Y', target: '出口', value: 80 },
        { source: '区域 Z', target: '出口', value: 130 }
    ];

    if (selectedNodeId) {
        // 根据 selectedNodeId 模拟数据变化
        // 这里只是一个简单的示例，实际应根据业务逻辑调整
        links = links.map(link => {
            if (link.source.includes(selectedNodeId.slice(-1))) { // 简单模拟相关性
                return { ...link, value: link.value * 0.7 };
            }
            return link;
        });
    }

    return { nodes, links };
};

// --- 置信区间趋势图模拟数据 (PredictionPage) ---
export const generatePredictionDataWithBounds = () => {
    const historyData: (string | number)[][] = [];
    const predictionData: (string | number)[][] = [];
    const lowerBound: (string | number)[][] = [];
    const upperBound: (string | number)[][] = [];
    
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 小时前

    for (let i = 0; i <= 120; i++) { // 每分钟一个点
        const time = new Date(startTime.getTime() + i * 60 * 1000);
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        
        if (i <= 60) { // 历史数据
            const value = 150 + Math.sin(i / 10) * 30 + (Math.random() - 0.5) * 20;
            historyData.push([timeStr, value]);
        }
        
        if (i >= 60) { // 预测数据
            const baseValue = 150 + Math.sin(i / 10) * 30;
            const predictionValue = baseValue + (Math.random() - 0.5) * 15;
            const uncertainty = 20 + (i - 60) * 0.5; // 不确定性随时间增加
            
            if (i === 60) { // 确保预测起点和历史终点连接
                predictionData.push(historyData[historyData.length - 1]);
            } else {
                predictionData.push([timeStr, predictionValue]);
            }

            lowerBound.push([timeStr, Math.max(0, predictionValue - uncertainty)]);
            upperBound.push([timeStr, predictionValue + uncertainty]);
        }
    }

    return { historyData, predictionData, lowerBound, upperBound };
};

// --- 模型竞技场评分模拟数据 (PredictionPage) ---
export const generateModelScores = () => {
    const lstmScores = {
        name: 'LSTM',
        scores: [
            Math.random() * 20 + 75, // 准确性
            Math.random() * 30 + 60, // 响应速度
            Math.random() * 25 + 70, // 抗噪能力
        ].map(v => parseFloat(v.toFixed(1)))
    };
    
    const transformerScores = {
        name: 'Transformer',
        scores: [
            Math.random() * 15 + 85, // 准确性
            Math.random() * 20 + 75, // 响应速度
            Math.random() * 20 + 80, // 抗噪能力
        ].map(v => parseFloat(v.toFixed(1)))
    };

    return { lstmScores, transformerScores };
};
