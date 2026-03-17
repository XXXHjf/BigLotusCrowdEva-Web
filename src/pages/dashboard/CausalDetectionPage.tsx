import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Col, Empty, Row, Typography, Space, Tag, Divider, Tooltip } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption, GraphSeriesOption } from 'echarts'
import './CausalDetectionPage.css'
import { useThemeMode } from '../../context/ThemeContext'
import {
  getPatternEdges,
  getPatternModeGraphs,
  getPatternModeMembership,
  getPatternNodes,
} from '../../api/dataService'

declare global {
  interface Window {
    AMap?: any
  }
}

type ModeType = 'causalChain' | 'hubNode' | 'community' | 'keyNode'

interface PatternNode {
  id: string
  lng: number
  lat: number
  label?: string
  tags?: string[]
}

interface PatternEdge {
  id: string
  source: string
  target: string
  weight?: number
  relationType?: string
  modes?: string[]
}

interface NodeMembership {
  nodeId: string
  modes: ModeType[]
  isAnchor: boolean
}

interface ModeGraphNode {
  id: string
  role: string
}

interface ModeGraphEdge {
  source: string
  target: string
  weight?: number
}

interface ModeGraphScenario {
  description: string
  anchors: string[]
  source?: string
  extra?: Record<string, unknown>
  graph: {
    nodes: ModeGraphNode[]
    edges: ModeGraphEdge[]
  }
}

interface PatternNodesResponse {
  nodes: PatternNode[]
}

interface PatternEdgesResponse {
  edges: PatternEdge[]
}

interface PatternMembershipResponse {
  memberships: NodeMembership[]
}

interface PatternModeGraphsResponse {
  modeGraphs: Partial<Record<ModeType, ModeGraphScenario>>
}

const { Text } = Typography

const modeTitleMap: Record<ModeType, string> = {
  causalChain: '因果链',
  hubNode: '枢纽节点',
  community: '社区结构',
  keyNode: '关键节点',
}

const modeColors: Record<ModeType, string> = {
  causalChain: '#4cc3ff',
  hubNode: '#5ad8a6',
  community: '#ffa940',
  keyNode: '#ff7875',
}

const modeHintMap: Record<
  ModeType,
  { origin: string; shape: string; why: string }
> = {
  causalChain: {
    origin: '基于局部时序先后关系与方向一致性，估计“起因->后续影响”路径。',
    shape: '单向链式（最多 3 层）。',
    why: '用于解释影响如何逐步传递。',
  },
  hubNode: {
    origin: '基于出度集中度与局部控制力，识别中心向外的辐射点。',
    shape: '单层有向星型（中心->外层）。',
    why: '用于解释一个结点对多个对象的集中影响。',
  },
  community: {
    origin: '基于局部互联强度与双向交互频次，抽取高内聚子群。',
    shape: '局部稠密网状/环状结构。',
    why: '用于解释群体内协同演化与强关联。',
  },
  keyNode: {
    origin: '基于桥接介数与路径通过率，定位跨区域连接咽喉点。',
    shape: '三层桥接（流入层->中心->流出层）。',
    why: '用于解释全局流转控制与连通维持作用。',
  },
}

function buildModeCardOption(
  title: string,
  scenario: ModeGraphScenario,
  selectedNodeId: string,
  textColor: string,
): EChartsOption {
  const nodeCount = scenario.graph.nodes.length
  const radius = 120

  const nodes = scenario.graph.nodes.map((node, index) => {
    if (node.id === selectedNodeId) {
      return {
        id: node.id,
        name: node.id,
        x: 0,
        y: 0,
        symbolSize: 54,
        itemStyle: {
          color: '#4cc3ff',
          borderColor: '#ffffff',
          borderWidth: 1,
          shadowBlur: 16,
          shadowColor: '#4cc3ff',
        },
      }
    }

    const angle = (Math.PI * 2 * index) / Math.max(nodeCount, 1)
    return {
      id: node.id,
      name: node.id,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      symbolSize: 34,
      itemStyle: {
        color: '#7e57c2',
        borderColor: '#4cc3ff',
        borderWidth: 1,
      },
    }
  })

  const series: GraphSeriesOption = {
    type: 'graph',
    layout: 'none',
    roam: true,
    edgeSymbol: ['none', 'arrow'],
    edgeSymbolSize: 10,
    data: nodes,
    links: scenario.graph.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      value: edge.weight ?? 1,
    })),
    label: {
      show: true,
      color: textColor,
      fontSize: 11,
    },
    lineStyle: {
      color: '#4cc3ff',
      width: 2,
      opacity: 0.9,
      curveness: 0.15,
    },
    emphasis: {
      focus: 'adjacency',
    },
  }

  return {
    backgroundColor: 'transparent',
    title: {
      text: title,
      left: 'center',
      top: 2,
      textStyle: {
        color: textColor,
        fontSize: 13,
        fontWeight: 600,
      },
    },
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') return `结点：${params.data.id}`
        if (params.dataType === 'edge') return `相关流向：${params.data.source} → ${params.data.target}`
        return ''
      },
    },
    series: [series],
    grid: { containLabel: true },
  }
}

function normalizeModeScenario(
  modeKey: ModeType,
  scenario: ModeGraphScenario,
  selectedNodeId: string,
): ModeGraphScenario {
  const sourceNodes = scenario.graph.nodes
  const sourceEdges = scenario.graph.edges
  const nodeSet = new Set(sourceNodes.map((n) => n.id))
  const fallbackStart = scenario.anchors[0] || sourceNodes[0]?.id || selectedNodeId
  const center = nodeSet.has(selectedNodeId) ? selectedNodeId : fallbackStart

  if (!center) return scenario

  const pickNodes = (ids: string[]) => {
    const idSet = new Set(ids)
    return sourceNodes.filter((node) => idSet.has(node.id))
  }

  if (modeKey === 'causalChain') {
    const chainNodeIds: string[] = [center]
    const chainEdges: ModeGraphEdge[] = []
    const visited = new Set<string>([center])
    let cursor = center

    while (chainNodeIds.length < 3) {
      const next = sourceEdges.find((edge) => edge.source === cursor && !visited.has(edge.target))
      if (!next) break
      chainEdges.push(next)
      chainNodeIds.push(next.target)
      visited.add(next.target)
      cursor = next.target
    }

    return {
      ...scenario,
      graph: {
        nodes: pickNodes(chainNodeIds),
        edges: chainEdges,
      },
    }
  }

  if (modeKey === 'hubNode') {
    const starEdges = sourceEdges.filter((edge) => edge.source === center).slice(0, 8)
    const targetIds = Array.from(new Set(starEdges.map((edge) => edge.target)))
    const nodeIds = [center, ...targetIds]
    return {
      ...scenario,
      graph: {
        nodes: pickNodes(nodeIds),
        edges: starEdges,
      },
    }
  }

  if (modeKey === 'community') {
    // 社区结构：优先“局部稠密/环状”，只保留核心局部子群，不向外扩展。
    const incident = sourceEdges.filter((edge) => edge.source === center || edge.target === center)
    const neighborIds = new Set<string>()
    incident.forEach((edge) => {
      if (edge.source !== center) neighborIds.add(edge.source)
      if (edge.target !== center) neighborIds.add(edge.target)
    })

    const scored = Array.from(neighborIds).map((id) => {
      const internalDegree = sourceEdges.filter(
        (edge) =>
          (edge.source === id && (neighborIds.has(edge.target) || edge.target === center)) ||
          (edge.target === id && (neighborIds.has(edge.source) || edge.source === center)),
      ).length
      return { id, score: internalDegree }
    })

    const topNeighborIds = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.id)

    const communityIds = new Set<string>([center, ...topNeighborIds])
    const denseEdges = sourceEdges.filter(
      (edge) => communityIds.has(edge.source) && communityIds.has(edge.target),
    )

    const nodeIds = Array.from(communityIds)
    return {
      ...scenario,
      graph: {
        nodes: pickNodes(nodeIds),
        edges: denseEdges,
      },
    }
  }

  // keyNode: 三层桥接结构（流入层 -> 中心 -> 流出层），不向外扩展。
  const incoming = sourceEdges.filter((edge) => edge.target === center).slice(0, 4)
  const outgoing = sourceEdges.filter((edge) => edge.source === center).slice(0, 4)
  const bridgeEdges = [...incoming, ...outgoing]
  const nodeIds = new Set<string>([center])
  bridgeEdges.forEach((edge) => {
    nodeIds.add(edge.source)
    nodeIds.add(edge.target)
  })

  return {
    ...scenario,
    graph: {
      nodes: pickNodes(Array.from(nodeIds)),
      edges: bridgeEdges,
    },
  }
}

const CausalDetectionPage = () => {
  const { mode } = useThemeMode()

  const [nodes, setNodes] = useState<PatternNode[]>([])
  const [edges, setEdges] = useState<PatternEdge[]>([])
  const [memberships, setMemberships] = useState<NodeMembership[]>([])
  const [modeGraphs, setModeGraphs] = useState<Partial<Record<ModeType, ModeGraphScenario>>>({})

  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState<boolean>(false)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Array<{ marker: any; nodeId: string }>>([])
  const hoverInfoWindowRef = useRef<any>(null)

  const amapKey = import.meta.env.VITE_AMAP_KEY as string | undefined
  const amapSecurity = import.meta.env.VITE_AMAP_SECURITY as string | undefined

  const textColor = mode === 'dark' ? '#d8e6ff' : '#1f2d3d'
  const mutedColor = mode === 'dark' ? '#9fb3d9' : '#4a5a73'

  useEffect(() => {
    let mounted = true

    Promise.all([
      getPatternNodes<PatternNodesResponse>(),
      getPatternEdges<PatternEdgesResponse>(),
      getPatternModeMembership<PatternMembershipResponse>(),
      getPatternModeGraphs<PatternModeGraphsResponse>(),
    ])
      .then(([nodeRes, edgeRes, membershipRes, modeGraphRes]) => {
        if (!mounted) return
        setNodes(nodeRes.nodes || [])
        setEdges(edgeRes.edges || [])
        setMemberships(membershipRes.memberships || [])
        setModeGraphs(modeGraphRes.modeGraphs || {})
      })
      .catch(() => {
        if (!mounted) return
        setDataError('模式解析数据加载失败，请检查 /public/data/pattern-analysis-v2/*')
      })

    return () => {
      mounted = false
    }
  }, [])

  const nodeById = useMemo(() => {
    const map = new Map<string, PatternNode>()
    nodes.forEach((node) => map.set(node.id, node))
    return map
  }, [nodes])

  const membershipByNodeId = useMemo(() => {
    const map = new Map<string, NodeMembership>()
    memberships.forEach((item) => map.set(item.nodeId, item))
    return map
  }, [memberships])

  const selectedNode = useMemo(() => {
    if (!selectedClusterId) return null
    return nodeById.get(selectedClusterId) || null
  }, [nodeById, selectedClusterId])

  const relatedEdges = useMemo(() => {
    if (!selectedClusterId) return []
    return edges.filter((edge) => edge.source === selectedClusterId || edge.target === selectedClusterId)
  }, [edges, selectedClusterId])

  const relatedNodes = useMemo(() => {
    if (!selectedClusterId) return []
    const idSet = new Set<string>([selectedClusterId])
    relatedEdges.forEach((edge) => {
      idSet.add(edge.source)
      idSet.add(edge.target)
    })
    return nodes.filter((node) => idSet.has(node.id))
  }, [nodes, relatedEdges, selectedClusterId])

  const selectedModes = selectedClusterId ? membershipByNodeId.get(selectedClusterId)?.modes || [] : []
  const selectedModeCount = selectedModes.length

  const selectedModeColor =
    selectedModeCount >= 3
      ? modeColors.community
      : selectedModeCount === 2
        ? modeColors.hubNode
        : selectedModeCount === 1
          ? modeColors.causalChain
          : mutedColor

  const resolveMarkerColor = (nodeId: string) => {
    const modeCount = membershipByNodeId.get(nodeId)?.modes.length || 0
    if (modeCount >= 3) return '#ffa940'
    if (modeCount === 2) return '#5ad8a6'
    if (modeCount === 1) return '#4cc3ff'
    return '#8aa0bf'
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!amapKey) {
      setMapError('请在 .env.local 配置 VITE_AMAP_KEY（高德 Web JS API Key）')
      return
    }

    const buildMap = () => {
      const AMap = window.AMap
      if (!AMap || mapInstanceRef.current || !mapContainerRef.current) return

      const defaultCenter = nodes.length ? [nodes[0].lng, nodes[0].lat] : [120.2235, 30.2305]

      const map = new AMap.Map(mapContainerRef.current, {
        viewMode: '3D',
        zoom: 16,
        center: defaultCenter,
        mapStyle: mode === 'dark' ? 'amap://styles/darkblue' : 'amap://styles/whitesmoke',
        dragEnable: true,
        zoomEnable: true,
        pitch: 30,
      })

      mapInstanceRef.current = map
      hoverInfoWindowRef.current = new AMap.InfoWindow({
        offset: new AMap.Pixel(0, -18),
        closeWhenClickMap: true,
      })
      setMapReady(true)
    }

    if (window.AMap) {
      buildMap()
      return
    }

    if (amapSecurity) {
      ;(window as any)._AMapSecurityConfig = { securityJsCode: amapSecurity }
    }

    const scriptId = 'amap-sdk'
    const existing = document.getElementById(scriptId)
    if (existing) {
      const onLoad = () => buildMap()
      existing.addEventListener('load', onLoad)
      return () => existing.removeEventListener('load', onLoad)
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`
    script.async = true
    script.onload = buildMap
    script.onerror = () => setMapError('高德地图脚本加载失败，请检查网络或 Key')
    document.body.appendChild(script)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy()
        mapInstanceRef.current = null
        setMapReady(false)
      }
      hoverInfoWindowRef.current = null
      markersRef.current.forEach(({ marker }) => marker.setMap(null))
      markersRef.current = []
    }
  }, [amapKey, amapSecurity, mode, nodes])

  useEffect(() => {
    const map = mapInstanceRef.current
    const AMap = window.AMap
    if (!map || !AMap || !mapReady) return

    markersRef.current.forEach(({ marker }) => marker.setMap(null))
    markersRef.current = []

    nodes.forEach((node) => {
      const active = selectedClusterId === node.id
      const marker = new AMap.Marker({
        position: [node.lng, node.lat],
        anchor: 'center',
        title: node.id,
      })

      marker.setMap(map)
      marker.setIcon(
        new AMap.Icon({
          size: new AMap.Size(active ? 18 : 14, active ? 18 : 14),
          image:
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(
              `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${active ? 18 : 14}\" height=\"${active ? 18 : 14}\" viewBox=\"0 0 20 20\"><circle cx=\"10\" cy=\"10\" r=\"${active ? 7 : 5.5}\" fill=\"${resolveMarkerColor(node.id)}\" stroke=\"#ffffff\" stroke-width=\"1.2\"/></svg>`,
            ),
          imageSize: new AMap.Size(active ? 18 : 14, active ? 18 : 14),
        }),
      )

      marker.on('click', () => setSelectedClusterId(node.id))
      marker.on('mouseover', () => {
        const mapIns = mapInstanceRef.current
        const info = hoverInfoWindowRef.current
        if (!mapIns || !info) return
        info.setContent(
          `<div style="padding:4px 8px;color:#d8e6ff;background:rgba(7,15,31,0.92);border:1px solid rgba(76,195,255,0.55);border-radius:6px;font-size:12px;">${node.id}</div>`,
        )
        info.open(mapIns, [node.lng, node.lat])
      })
      marker.on('mouseout', () => {
        hoverInfoWindowRef.current?.close()
      })
      markersRef.current.push({ marker, nodeId: node.id })
    })

    if (selectedNode) {
      map.setCenter([selectedNode.lng, selectedNode.lat])
    }
  }, [mapReady, nodes, selectedClusterId, selectedNode, membershipByNodeId])

  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapStyle(
        mode === 'dark' ? 'amap://styles/darkblue' : 'amap://styles/whitesmoke',
      )
    }
  }, [mode])

  const centeredGraphOption: EChartsOption = useMemo(() => {
    if (!selectedClusterId || !relatedNodes.length) {
      return {
        backgroundColor: 'transparent',
        title: {
          text: '点击左侧聚类结点查看关联时空图',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: mutedColor,
            fontSize: 14,
            fontWeight: 500,
          },
        },
      }
    }

    const neighbors = relatedNodes.filter((node) => node.id !== selectedClusterId)
    const radius = 200

    const graphNodes = [
      {
        id: selectedClusterId,
        name: selectedClusterId,
        x: 0,
        y: 0,
        symbolSize: 62,
        itemStyle: {
          color: '#4cc3ff',
          shadowBlur: 20,
          shadowColor: '#4cc3ff',
        },
        label: { color: textColor },
      },
      ...neighbors.map((node, index) => {
        const angle = (Math.PI * 2 * index) / Math.max(neighbors.length, 1)
        return {
          id: node.id,
          name: node.id,
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
          symbolSize: 40,
          itemStyle: {
            color: '#7e57c2',
            borderColor: '#4cc3ff',
            borderWidth: 1,
          },
          label: { color: textColor },
        }
      }),
    ]

    return {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (params: any) => {
          if (params.dataType === 'node') return `聚类结点：${params.data.id}`
          if (params.dataType === 'edge') return `相关流向：${params.data.source} → ${params.data.target}`
          return ''
        },
      },
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: true,
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: 10,
          label: {
            show: true,
            color: textColor,
            fontSize: 12,
          },
          data: graphNodes,
          links: relatedEdges.map((edge) => ({
            source: edge.source,
            target: edge.target,
            value: edge.weight ?? 1,
            lineStyle: {
              color: '#4cc3ff',
              width: 2.5,
              opacity: 0.9,
            },
          })),
          lineStyle: { curveness: 0.2 },
          emphasis: { focus: 'adjacency' },
        },
      ],
    }
  }, [mutedColor, relatedEdges, relatedNodes, selectedClusterId, textColor])

  const onGraphEvents = {
    click: (params: any) => {
      if (params.dataType === 'node' && params.data?.id) {
        setSelectedClusterId(params.data.id as string)
      }
    },
  }

  const renderModePanel = (modeKey: ModeType) => {
    const title = modeTitleMap[modeKey]
    const modeGraph = modeGraphs[modeKey]
    const isEnabled = selectedClusterId && selectedModes.includes(modeKey)
    const hint = modeHintMap[modeKey]

    if (!selectedClusterId || !isEnabled || !modeGraph) {
      return (
        <div className="mode-panel-shell">
          <Tooltip
            title={
              <div className="mode-hint-content">
                <div><strong>算法由来</strong>：{hint.origin}</div>
                <div><strong>外形约束</strong>：{hint.shape}</div>
                <div><strong>解释目标</strong>：{hint.why}</div>
              </div>
            }
            placement="topRight"
          >
            <span className="mode-hint-trigger" aria-label={`${title}说明`}>
              <InfoCircleOutlined />
            </span>
          </Tooltip>
          <div className="mode-card-empty">
            <Empty description={`当前结点未识别出${title}模式`} />
          </div>
        </div>
      )
    }

    const normalizedModeGraph = normalizeModeScenario(modeKey, modeGraph, selectedClusterId)
    const option = buildModeCardOption(title, normalizedModeGraph, selectedClusterId, textColor)
    return (
      <div className="mode-panel-shell">
        <Tooltip
          title={
            <div className="mode-hint-content">
              <div><strong>算法由来</strong>：{hint.origin}</div>
              <div><strong>外形约束</strong>：{hint.shape}</div>
              <div><strong>解释目标</strong>：{hint.why}</div>
            </div>
          }
          placement="topRight"
        >
          <span className="mode-hint-trigger" aria-label={`${title}说明`}>
            <InfoCircleOutlined />
          </span>
        </Tooltip>
        <ReactECharts option={option} style={{ width: '100%', height: '220px' }} />
      </div>
    )
  }

  return (
    <div className="page-shell">
      <div className="time-control">
        <Space size="middle">
          <Text type="secondary">模式解析（图模型数据驱动）</Text>
          {selectedNode ? (
            <Tag color="blue">
              选中 {selectedNode.id} · 相关结点 {relatedNodes.length} · 相关边 {relatedEdges.length} · 可识别模式 {selectedModeCount}
            </Tag>
          ) : (
            <Tag>未选中聚类结点</Tag>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={7}>
          <Card
            title="结点底图"
            className="panel-card"
            bordered={false}
            bodyStyle={{ height: '520px', padding: 4, overflow: 'hidden' }}
          >
            <div className="map-legend">
              <div className="legend-dot" style={{ background: '#4cc3ff' }} /> 1 种模式
              <div className="legend-dot" style={{ background: '#5ad8a6' }} /> 2 种模式
              <div className="legend-dot" style={{ background: '#ffa940' }} /> 3+ 种模式
              <div className="legend-dot" style={{ background: '#8aa0bf' }} /> 0 种模式
            </div>

            {mapError && <div className="map-error">{mapError}</div>}
            {dataError && <div className="map-error">{dataError}</div>}

            <div ref={mapContainerRef} className="amap-container" aria-label="amap-container" />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title="关联图"
            className="panel-card"
            bordered={false}
            bodyStyle={{ height: '520px', padding: 0 }}
          >
            <ReactECharts
              option={centeredGraphOption}
              style={{ width: '100%', height: '100%' }}
              onEvents={onGraphEvents}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="模式子图" className="panel-card" bordered={false}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('causalChain')}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('hubNode')}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('community')}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" className="mode-card" bordered>
                  {renderModePanel('keyNode')}
                </Card>
              </Col>
            </Row>

            {!selectedClusterId && (
              <div className="mode-help-text">
                <Text type="secondary">
                  点击左侧地图或中间时空图中的任意聚类结点，右侧会显示该结点可识别的 0-4 种模式。
                </Text>
              </div>
            )}

            {selectedClusterId && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <div className="mode-stat">
                  <Text type="secondary">当前聚类结点</Text>
                  <Text strong style={{ color: selectedModeColor }}>
                    {selectedClusterId}
                  </Text>
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CausalDetectionPage
