// src/components/ForceDirectedGraph.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import type { GraphNode, GraphEdge } from '../types/chart'

interface ForceDirectedGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string
}

const ForceDirectedGraph = ({
  nodes,
  edges,
  onNodeClick,
  selectedNodeId,
}: ForceDirectedGraphProps) => {
  const colorMap: { [key: string]: string } = {
    safe: '#52C41A', // 绿色
    warning: '#FAAD14', // 黄色
    danger: '#F5222D', // 红色
    normal: '#1890ff', // 默认蓝色
  }

  const echartsNodes = nodes.map((node) => ({
    id: node.id,
    name: node.label,
    value: node.value, // 人数
    category: node.level || 'normal', // 拥堵等级
    symbolSize: Math.max(20, Math.sqrt(node.value || 0) * 2), // 根据人数调整大小
    itemStyle: {
      color: colorMap[node.level || 'normal'],
      borderColor: selectedNodeId === node.id ? '#1890ff' : 'transparent',
      borderWidth: selectedNodeId === node.id ? 3 : 0,
    },
    label: {
      show: true,
      position: 'inside' as const,
      formatter: '{b}', // 显示节点名称
      color: '#fff',
      fontWeight: 700,
    },
    draggable: true, // 允许拖拽
  }))

  const echartsEdges = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    value: edge.value, // 流量大小
    lineStyle: {
      width: Math.max(1, edge.value ? edge.value / 50 : 1), // 根据流量大小调整粗细
      color: '#bfbfbf', // 边框颜色
      curveness: 0.3, // 曲线度
      opacity: 0.6,
    },
    emphasis: {
        lineStyle: {
            opacity: 1,
            width: Math.max(2, edge.value ? edge.value / 30 : 2),
        }
    }
  }))

  const series: any[] = [
    {
      type: 'graph',
      layout: 'force',
      force: {
        repulsion: 500, // 节点斥力
        gravity: 0.1, // 引力
        edgeLength: 150, // 边的长度
        layoutAnimation: true, // 布局动画
      },
      roam: true, // 开启缩放和平移
      data: echartsNodes,
      links: echartsEdges,
      categories: [
        { name: 'safe', itemStyle: { color: colorMap.safe } },
        { name: 'warning', itemStyle: { color: colorMap.warning } },
        { name: 'danger', itemStyle: { color: colorMap.danger } },
        { name: 'normal', itemStyle: { color: colorMap.normal } },
      ],
      label: {
        show: true,
        position: 'inside',
        formatter: '{b}',
      },
      lineStyle: {
        opacity: 0.9,
        width: 2,
        curveness: 0.3,
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 5,
        },
      },
    },
    {
      type: 'effectScatter',
      coordinateSystem: 'graph',
      data: echartsNodes
        .filter((node) => node.category === 'danger')
        .map((node) => ({
          ...node,
          symbolSize: (node.symbolSize as number) * 1.2, // 比原节点大一点
          itemStyle: {
            color: colorMap.danger,
            opacity: 0.5,
          },
          emphasis: {
              show: false // 禁用 effectScatter 的 focus 效果
          },
          rippleEffect: {
            brushType: 'stroke',
            period: 4,
            scale: 2.5,
          },
        })),
      zlevel: 1, // 确保在图形层之上
      silent: true, // 不响应鼠标事件
      animation: true,
    },
  ]

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `聚类: ${params.name}<br/>人数: ${params.value}<br/>拥堵等级: ${params.data.category}`
        }
        return ''
      },
    },
    series,
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
        notMerge={true}
      />
    </div>
  )
}

export default ForceDirectedGraph
