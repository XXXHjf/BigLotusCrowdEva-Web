/**
 * 关系子图组件 - 显示选中节点的相邻节点
 */

import ReactECharts from 'echarts-for-react'
import type { GraphNode, GraphEdge } from '../types/chart'

interface SubGraphChartProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  centerNodeId: string
  centerNodeLabel?: string
}

export function SubGraphChart({ nodes, edges, centerNodeId }: SubGraphChartProps) {
  if (nodes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#999',
        }}
      >
        请点击关系图选择节点查看子图
      </div>
    )
  }

  // 准备节点数据
  const echartsNodes = nodes.map((node) => ({
    id: node.id,
    name: node.label,
    value: node.value,
    itemStyle: {
      color: node.id === centerNodeId ? '#ff6b6b' : '#3498db',
    },
    label: {
      show: true,
      fontSize: 12,
      fontWeight: node.id === centerNodeId ? 'bold' : 'normal',
    },
  }))

  // 准备边数据
  const echartsEdges = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    value: edge.value,
    label: {
      show: true,
      formatter: edge.label || String(edge.value),
      fontSize: 10,
    },
    lineStyle: {
      width: edge.value * 4,
      color: edge.type === 'influence' ? '#95a5a6' : '#3498db',
      type: edge.type === 'influence' ? 'dashed' : 'solid',
      curveness: 0.3,
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
        layout: 'circular',
        symbolSize: (value: number) => {
          return Math.max(40, Math.min(100, value / 5))
        },
        roam: true,
        label: {
          show: true,
          position: 'inside',
          fontSize: 12,
        },
        edgeLabel: {
          show: true,
          fontSize: 10,
        },
        data: echartsNodes,
        links: echartsEdges,
        lineStyle: {
          opacity: 0.8,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5,
          },
        },
      },
    ],
  }

  return (
    <div style={{ width: '100%', height: '100%', padding: 0 }}>
      <ReactECharts option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
