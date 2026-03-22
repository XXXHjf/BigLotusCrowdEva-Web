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
  const comparableDeltas = deltas.filter((item) => item.id !== selectedNodeId)
  const positiveDeltas = comparableDeltas.filter((item) => item.delta > 0)
  const negativeDeltas = comparableDeltas.filter((item) => item.delta < 0)
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

  const degreeByNodeId = useMemo(() => {
    const map = new Map<string, number>()
    nodes.forEach((node) => map.set(node.id, 0))
    edges.forEach((edge) => {
      map.set(edge.source, (map.get(edge.source) || 0) + 1)
      map.set(edge.target, (map.get(edge.target) || 0) + 1)
    })
    return map
  }, [edges, nodes])

  const positionByNodeId = useMemo(() => {
    const rankedNodes = [...nodes].sort((a, b) => {
      const degreeDiff = (degreeByNodeId.get(b.id) || 0) - (degreeByNodeId.get(a.id) || 0)
      if (degreeDiff !== 0) return degreeDiff
      return a.id.localeCompare(b.id, undefined, { numeric: true })
    })

    const totalNodes = rankedNodes.length
    const innerCount = totalNodes <= 8 ? Math.min(4, totalNodes) : Math.max(5, Math.round(totalNodes * 0.2))
    const remainingAfterInner = Math.max(0, totalNodes - innerCount)
    const middleCount =
      remainingAfterInner <= 8 ? remainingAfterInner : Math.max(8, Math.round(totalNodes * 0.33))

    const rings = [
      {
        nodes: rankedNodes.slice(0, innerCount),
        radiusX: 150,
        radiusY: 96,
      },
      {
        nodes: rankedNodes.slice(innerCount, innerCount + middleCount),
        radiusX: 300,
        radiusY: 188,
      },
      {
        nodes: rankedNodes.slice(innerCount + middleCount),
        radiusX: 432,
        radiusY: 272,
      },
    ]

    const map = new Map<string, { x: number; y: number }>()
    const centerX = 520
    const centerY = 320

    rings.forEach((ring, ringIndex) => {
      const ringNodes = ring.nodes
      const total = ringNodes.length
      if (total === 0) return

      ringNodes.forEach((node, index) => {
        const angleOffset = ringIndex % 2 === 0 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / total
        const angle = angleOffset + (Math.PI * 2 * index) / total
        map.set(node.id, {
          x: centerX + ring.radiusX * Math.cos(angle),
          y: centerY + ring.radiusY * Math.sin(angle),
        })
      })
    })

    return map
  }, [degreeByNodeId, nodes])

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
        const position = positionByNodeId.get(node.id) || { x: 520, y: 320 }

        return {
          id: node.id,
          name: node.label,
          value: node.value,
          x: position.x,
          y: position.y,
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
    [nodes, positionByNodeId, selectedNodeId],
  )

  const echartsEdges = useMemo(
    () =>
      edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        lineStyle: {
          width:
            edge.style === 'boosted'
              ? Math.max(2.5, edge.value * 4)
              : edge.style === 'limited'
                ? Math.max(2, edge.value * 3.4)
                : Math.max(1, edge.value * 3),
          color:
            edge.style === 'dashed'
              ? '#ff6b6b'
              : edge.style === 'limited'
                ? '#faad14'
                : edge.style === 'boosted'
                  ? '#4cc3ff'
                  : edgeBase,
          type: edge.style === 'dashed' || edge.style === 'limited' ? 'dashed' : 'solid',
          opacity:
            edge.style === 'dashed'
              ? 0.95
              : edge.style === 'limited' || edge.style === 'boosted'
                ? 0.88
                : 0.28,
          curveness: 0.12,
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
