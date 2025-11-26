// src/components/SimulationGraph.tsx
import ReactECharts from 'echarts-for-react'
import type { GraphNode, GraphEdge } from '../types/chart'

interface SimulationGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string
}

export function SimulationGraph({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: SimulationGraphProps) {
  const echartsNodes = nodes.map((node) => ({
    id: node.id,
    name: node.label,
    value: node.value,
    symbolSize: Math.max(40, node.value / 10),
    itemStyle: {
      color: selectedNodeId === node.id ? '#ff6b6b' : '#3498db',
      borderColor: node.style === 'dashed' ? '#f5222d' : '#3498db',
      borderWidth: node.style === 'dashed' ? 2 : 0,
      borderType: 'dashed',
    },
    label: {
      show: true,
      fontSize: 12,
      fontWeight: 'bold',
    },
  }))

  const echartsEdges = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    lineStyle: {
      width: Math.max(1, edge.value / 10),
      color: edge.style === 'dashed' ? '#ff6b6b' : '#6a7a99',
      type: edge.style === 'dashed' ? 'dashed' : 'solid',
      curveness: 0.2,
    },
  }))

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `${params.name}<br/>当前人流量: ${params.value || 0}`
        }
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        force: {
          repulsion: 200,
          edgeLength: 150,
        },
        roam: true,
        data: echartsNodes,
        links: echartsEdges,
        label: {
          show: true,
          position: 'inside',
          color: '#e8f4ff',
          fontWeight: 'bold',
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

  const onEvents = {
    click: (params: any) => {
      if (params.dataType === 'node' && onNodeClick) {
        onNodeClick(params.data.id)
      }
    },
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '100%' }}
        onEvents={onEvents}
      />
    </div>
  )
}
