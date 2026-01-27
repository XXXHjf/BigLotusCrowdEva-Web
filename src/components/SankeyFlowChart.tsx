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
  const tooltipBg = mode === 'dark' ? 'rgba(7, 15, 31, 0.9)' : '#ffffff'
  const tooltipBorder = mode === 'dark' ? '#1f2d4d' : '#dce4f2'

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
        // Edge tooltip
        if (params.dataType === 'edge' || (params.data && params.data.source)) {
          const source = params.data?.source ?? params.data?.name ?? params.name ?? ''
          const target = params.data?.target ?? ''
          const value = params.data?.value ?? params.value ?? ''
          return `${source} → ${target}<br/>流量: ${value || 0} 人`
        }
        // Node tooltip
        if (params.dataType === 'node' || params.data?.name) {
          const nodeName = params.data?.name ?? ''
          const totalOut =
            data.links
              .filter((l) => l.source === nodeName)
              .reduce((sum, l) => sum + l.value, 0) || 0
          const totalIn =
            data.links
              .filter((l) => l.target === nodeName)
              .reduce((sum, l) => sum + l.value, 0) || 0
          const total = totalIn + totalOut
          return `${nodeName}<br/>总流量: ${total} 人<br/>流入: ${totalIn} 人<br/>流出: ${totalOut} 人`
        }
        return params.name || '数据加载中'
      },
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
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
