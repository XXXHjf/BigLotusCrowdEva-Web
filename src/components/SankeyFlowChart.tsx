// src/components/SankeyFlowChart.tsx
import ReactECharts from 'echarts-for-react'
import type { EChartsOption, SankeySeriesOption } from 'echarts'
import { useThemeMode } from '../context/ThemeContext'

interface SankeyFlowChartProps {
  data: {
    nodes: { name: string }[]
    links: { source: string; target: string; value: number }[]
  }
}

const SankeyFlowChart = ({ data }: SankeyFlowChartProps) => {
  const { mode } = useThemeMode()
  const textColor = mode === 'dark' ? '#e8f4ff' : '#1f2d3d'

  const getNodeColor = (name: string) => {
    if (name.includes('入口')) return '#4cc3ff'
    if (name.includes('通道')) return '#8a7dff'
    if (name.includes('区域')) return '#ff9f7f'
    if (name.includes('出口')) return '#50e3c2'
    return '#4cc3ff'
  }

  const nodesWithColor = data.nodes.map((node) => {
    const color = getNodeColor(node.name)
    return {
      ...node,
      itemStyle: {
        color,
        borderColor: color,
      },
    }
  })

  const nodeColorMap = nodesWithColor.reduce<Record<string, string>>((acc, node) => {
    acc[node.name] = getNodeColor(node.name)
    return acc
  }, {})

  const linksWithColor = data.links.map((link) => ({
    ...link,
    lineStyle: {
      color: nodeColorMap[link.source] || '#4cc3ff',
      opacity: 0.65,
    },
  }))

  const sankeySeries: SankeySeriesOption = {
    type: 'sankey',
    nodeWidth: 14,
    nodeGap: 18,
    orient: 'horizontal',
    nodeAlign: 'justify',
    data: nodesWithColor,
    links: linksWithColor,
    focusNodeAdjacency: 'allEdges',
    itemStyle: {
      borderWidth: 1,
      borderColor: 'rgba(76, 195, 255, 0.35)',
    },
    lineStyle: {
      curveness: 0.45,
      opacity: 0.55,
      width: 12,
    },
    label: {
      color: textColor,
      position: 'left',
      align: 'right',
      fontWeight: 600,
      fontSize: 12,
    },
    emphasis: {
      lineStyle: {
        opacity: 0.9,
        width: 18,
      },
      itemStyle: {
        borderColor: '#4cc3ff',
        borderWidth: 1.2,
      },
    },
  }

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: (params: any) => {
        if (params.data.source && params.data.target) {
          return `${params.data.source} → ${params.data.target}<br/>流量: ${params.data.value} 人`
        } else if (params.data.name) {
          return `${params.data.name}`
        }
        return ''
      },
      backgroundColor: 'rgba(7, 15, 31, 0.9)',
      borderColor: '#1f2d4d',
      textStyle: { color: textColor },
    },
    series: [sankeySeries],
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactECharts
        option={option}
        style={{ width: '100%', height: '300px' }}
        notMerge={true}
      />
    </div>
  )
}

export default SankeyFlowChart
