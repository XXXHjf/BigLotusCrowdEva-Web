/**
 * 关系图组件 - 显示完整的关系网络
 */

import ReactECharts from 'echarts-for-react'
import type { GraphNode, GraphEdge } from '../types/chart'

interface GraphChartProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (nodeId: string) => void
  selectedNode?: string
}

export function GraphChart({ nodes, edges, onNodeClick, selectedNode }: GraphChartProps) {
  // 准备节点数据 - 使用层次布局
  // 定义节点位置层次（根据关系图结构）
  const nodePositions: Record<string, { x: number; y: number }> = {
    zone_1: { x: 100, y: 200 }, // 入口区域
    zone_2: { x: 300, y: 200 }, // 主大厅
    zone_3: { x: 500, y: 100 }, // 东侧走廊
    zone_4: { x: 500, y: 300 }, // 西侧走廊
    zone_5: { x: 300, y: 100 }, // 中央休息区
    zone_6: { x: 700, y: 100 }, // 北侧出口
    zone_7: { x: 700, y: 300 }, // 南侧出口
    zone_8: { x: 300, y: 50 }, // VIP区域
  }

  const echartsNodes = nodes.map((node) => {
    const pos = nodePositions[node.id] || { x: 100, y: 100 }
    return {
      id: node.id,
      name: node.label,
      value: node.value,
      x: pos.x,
      y: pos.y,
      itemStyle: {
        color: selectedNode === node.id ? '#ff6b6b' : '#3498db',
      },
      label: {
        show: true,
        fontSize: 12,
        fontWeight: 'bold',
      },
    }
  })

  // 准备边数据
  const echartsEdges = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    value: edge.value,
    label: {
      show: true,
      formatter: edge.label || String(edge.value),
      fontSize: 9,
    },
    lineStyle: {
      width: edge.value * 3,
      color: edge.type === 'influence' ? '#95a5a6' : '#3498db',
      type: edge.type === 'influence' ? 'dashed' : 'solid',
      curveness: 0.2,
    },
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const param = params as { dataType: string; name: string; value?: number }
        if (param.dataType === 'node') {
          return `${param.name}<br/>当前人流量: ${param.value || 0}`
        } else {
          return `${param.name}`
        }
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'none', // 使用固定布局，手动设置节点位置
        symbolSize: 50,
        roam: false, // 禁用拖拽，保持固定布局
        label: {
          show: true,
          position: 'inside',
          fontSize: 12,
          fontWeight: 'bold',
        },
        edgeLabel: {
          show: true,
          fontSize: 10,
          formatter: (params: unknown) => {
            const param = params as { value: number; data: { type?: string } }
            return param.data.type === 'influence'
              ? `+${param.value.toFixed(1)}`
              : param.value.toFixed(1)
          },
        },
        // 使用固定位置的有向图布局
        data: echartsNodes.map((node) => ({
          ...node,
          fixed: true, // 固定位置，不自动布局
        })),
        links: echartsEdges,
        lineStyle: {
          width: 2,
          opacity: 0.8,
          curveness: 0, // 直线，更清晰
        },
        arrow: {
          show: true,
          length: 10,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3,
          },
        },
      },
    ],
  }

  const onEvents = {
    click: (params: unknown) => {
      const param = params as {
        dataType?: string
        data?: { id?: string; name?: string }
        id?: string
        name?: string
      }

      // ECharts graph 图的点击事件，节点会通过 dataType='node' 标识
      if (param.dataType === 'node') {
        // 从 data 中获取节点 ID，或者通过 name 反向查找
        const nodeId =
          param.data?.id ||
          param.id ||
          nodes.find((n) => n.label === param.name || n.label === param.data?.name)?.id
        if (nodeId) {
          onNodeClick?.(nodeId)
        }
      }
    },
  }

  return (
    <div style={{ width: '100%', height: '100%', padding: 0 }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} onEvents={onEvents} />
    </div>
  )
}
