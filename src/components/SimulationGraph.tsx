// src/components/SimulationGraph.tsx
import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { GraphNode, GraphEdge } from '../types/chart'
import { useThemeMode } from '../context/ThemeContext'

interface SimulationGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  baselineNodes?: GraphNode[]
  onNodeClick?: (nodeId: string) => void
  selectedNodeId?: string
  updateMode?: 'select' | 'data'
}

export function SimulationGraph({
  nodes,
  edges,
  baselineNodes,
  onNodeClick,
  selectedNodeId,
  updateMode = 'select',
}: SimulationGraphProps) {
  const { mode } = useThemeMode()
  const textColor = mode === 'dark' ? '#e8f4ff' : '#1f2d3d'
  const tooltipText = mode === 'dark' ? '#e8f4ff' : '#1f2d3d'
  const edgeBase = mode === 'dark' ? '#6a7a99' : '#8aa0bf'
  const baseNodeColor = '#3498db'
  const surgeNodeColor = '#ff6b6b'
  const dropNodeColor = '#f7b500'

  const baselineValueByNodeId = new Map(baselineNodes?.map((node) => [node.id, node.value]) || [])
  const deltas = nodes.map((node) => ({
    id: node.id,
    delta: node.value - (baselineValueByNodeId.get(node.id) ?? node.value),
  }))
  const positiveDeltas = deltas.filter((item) => item.delta > 0)
  const negativeDeltas = deltas.filter((item) => item.delta < 0)
  const maxIncreaseNodeId =
    positiveDeltas.length > 0
      ? positiveDeltas.reduce((max, item) => (item.delta > max.delta ? item : max)).id
      : null
  const maxDecreaseNodeId =
    negativeDeltas.length > 0
      ? negativeDeltas.reduce((min, item) => (item.delta < min.delta ? item : min)).id
      : null

  const values = nodes.map((node) => node.value)
  const minValue = values.length ? Math.min(...values) : 0
  const maxValue = values.length ? Math.max(...values) : 0

  const indegreeMap = new Map<string, number>()
  nodes.forEach((node) => indegreeMap.set(node.id, 0))
  edges.forEach((edge) => indegreeMap.set(edge.target, (indegreeMap.get(edge.target) || 0) + 1))

  const levelMap = new Map<string, number>()
  const rootIds = nodes
    .filter((node) => (indegreeMap.get(node.id) || 0) === 0)
    .map((node) => node.id)

  const queue: Array<{ id: string; level: number }> = rootIds.map((id) => ({ id, level: 0 }))
  while (queue.length > 0) {
    const current = queue.shift()!
    const knownLevel = levelMap.get(current.id)
    if (knownLevel !== undefined && knownLevel <= current.level) continue
    levelMap.set(current.id, current.level)

    edges
      .filter((edge) => edge.source === current.id)
      .forEach((edge) => queue.push({ id: edge.target, level: current.level + 1 }))
  }

  nodes.forEach((node) => {
    if (!levelMap.has(node.id)) levelMap.set(node.id, 0)
  })

  const nodesByLevel = new Map<number, typeof nodes>()
  nodes.forEach((node) => {
    const level = levelMap.get(node.id) || 0
    const list = nodesByLevel.get(level) || []
    list.push(node)
    nodesByLevel.set(level, list)
  })

  const resolveSymbolSize = (value: number) => {
    if (maxValue === minValue) return 56
    const ratio = (value - minValue) / (maxValue - minValue)
    return 42 + ratio * 34
  }

  const resolveNodeColor = (nodeId: string) => {
    if (nodeId === maxIncreaseNodeId) return surgeNodeColor
    if (nodeId === maxDecreaseNodeId) return dropNodeColor
    return baseNodeColor
  }

  const echartsNodes = useMemo(
    () =>
      nodes.map((node) => {
        const level = levelMap.get(node.id) || 0
        const siblings = (nodesByLevel.get(level) || [])
          .slice()
          .sort((a, b) => a.id.localeCompare(b.id))
        const index = siblings.findIndex((item) => item.id === node.id)
        const total = siblings.length
        const x = 120 + level * 220
        const centerY = 320
        const verticalGap = 120
        const y = centerY + (index - (total - 1) / 2) * verticalGap

        return {
          id: node.id,
          name: node.label,
          value: node.value,
          x,
          y,
          symbolSize: resolveSymbolSize(node.value),
          itemStyle: {
            color: resolveNodeColor(node.id),
            borderColor:
              selectedNodeId === node.id
                ? '#ffffff'
                : node.style === 'dashed'
                  ? '#f5222d'
                  : '#8fd3ff',
            borderWidth: selectedNodeId === node.id ? 3 : node.style === 'dashed' ? 2 : 1,
            borderType: 'dashed',
            shadowBlur: selectedNodeId === node.id ? 18 : 0,
            shadowColor: selectedNodeId === node.id ? '#4cc3ff' : 'transparent',
          },
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
          },
        }
      }),
    [levelMap, nodes, nodesByLevel, selectedNodeId],
  )

  const echartsEdges = useMemo(
    () =>
      edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        lineStyle: {
          width: Math.max(2, edge.value * 4),
          color: edge.style === 'dashed' ? '#ff6b6b' : edgeBase,
          type: edge.style === 'dashed' ? 'dashed' : 'solid',
          curveness: 0.2,
        },
      })),
    [edgeBase, edges],
  )

  const option = useMemo(
    () => ({
    backgroundColor: 'transparent',
    animationDuration: updateMode === 'data' ? 420 : 0,
    animationDurationUpdate: updateMode === 'data' ? 420 : 120,
    animationEasingUpdate: 'cubicOut',
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const baselineValue = baselineValueByNodeId.get(params.data.id) ?? params.value
          const delta = (params.value || 0) - baselineValue
          const deltaText =
            delta === 0 ? '0' : `${delta > 0 ? '+' : ''}${Math.round(delta)}`
          return `${params.name}<br/>当前人流量: ${Math.round(params.value || 0)}<br/>相对基线变化: ${deltaText}`
        }
      },
      textStyle: { color: tooltipText },
    },
    series: [
      {
        type: 'graph',
        layout: 'none',
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 12,
        roam: true,
        data: echartsNodes,
        links: echartsEdges,
        label: {
          show: true,
          position: 'inside',
          color: textColor,
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
    }),
    [echartsEdges, echartsNodes, textColor, tooltipText, updateMode],
  )

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
        lazyUpdate
      />
    </div>
  )
}
