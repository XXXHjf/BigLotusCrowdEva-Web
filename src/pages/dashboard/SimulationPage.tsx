import { useEffect, useMemo, useState } from 'react'
import { Row, Col, Button, Card, Alert } from 'antd'
import { SimulationGraph } from '../../components/SimulationGraph'
import NodeControlPanel from '../../components/NodeControlPanel'
import ImpactAssessmentPanel from '../../components/ImpactAssessmentPanel'
import {
  getSimulationCounterfactualResults,
  getSimulationNodeNetwork,
} from '../../api/dataService'
import type { GraphData } from '../../types/chart'

interface SimulationNodeNetworkResponse extends GraphData {}

interface CounterfactualNodeUpdate {
  nodeId: string
  value: number
}

interface CounterfactualEdgeUpdate {
  source: string
  target: string
  style: 'solid' | 'dashed'
}

interface CounterfactualResult {
  nodeId: string
  limitPercent: number
  summary: string
  nodeUpdates: CounterfactualNodeUpdate[]
  edgeUpdates?: CounterfactualEdgeUpdate[]
}

interface CounterfactualResultsResponse {
  results: CounterfactualResult[]
}

const defaultTip = '选择左侧节点并执行操作后，这里会显示推演影响评估。'

const deriveFallbackEdgeStyle = (limitPercent: number): CounterfactualEdgeUpdate['style'] | 'limited' | 'boosted' => {
  if (limitPercent === 0) return 'dashed'
  if (limitPercent < 100) return 'limited'
  return 'boosted'
}

const buildImpactSummary = (
  baselineGraphData: GraphData,
  result: CounterfactualResult,
) => {
  const baselineNodeById = new Map(baselineGraphData.nodes.map((node) => [node.id, node]))

  const affectedNodes = result.nodeUpdates
    .filter((item) => item.nodeId !== result.nodeId)
    .map((item) => {
      const baselineNode = baselineNodeById.get(item.nodeId)
      const baselineValue = baselineNode?.value ?? item.value
      const delta = item.value - baselineValue
      const ratio = baselineValue === 0 ? 0 : (delta / baselineValue) * 100
      return {
        nodeId: item.nodeId,
        label: baselineNode?.label || item.nodeId,
        baselineValue,
        nextValue: item.value,
        delta,
        ratio,
      }
    })
    .filter((item) => item.delta !== 0)

  if (affectedNodes.length === 0) {
    return '本次操作未对其他结点造成可见变化。'
  }

  const strongestNode = affectedNodes.reduce((max, item) =>
    Math.abs(item.delta) > Math.abs(max.delta) ? item : max,
  )

  const deltaText = `${strongestNode.delta > 0 ? '+' : ''}${Math.round(strongestNode.delta)}`

  return `影响了 ${affectedNodes.length} 个结点，影响最大的是 ${strongestNode.label}（${deltaText}）。`
}

const SimulationPage = () => {
  const [initialGraphData, setInitialGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] })
  const [counterfactualResults, setCounterfactualResults] = useState<CounterfactualResult[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [graphUpdateMode, setGraphUpdateMode] = useState<'select' | 'data'>('select')
  const [simulationResult, setSimulationResult] = useState<string | null>(defaultTip)
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    Promise.all([
      getSimulationNodeNetwork<SimulationNodeNetworkResponse>(),
      getSimulationCounterfactualResults<CounterfactualResultsResponse>(),
    ])
      .then(([networkRes, resultRes]) => {
        if (!mounted) return
        const network = {
          nodes: networkRes.nodes || [],
          edges: networkRes.edges || [],
        }
        setInitialGraphData(network)
        setGraphData(network)
        setCounterfactualResults(resultRes.results || [])
      })
      .catch(() => {
        if (!mounted) return
        setDataError('沙盘推演数据加载失败，请检查 /public/data/simulation/*')
      })

    return () => {
      mounted = false
    }
  }, [])

  const resultByKey = useMemo(() => {
    const map = new Map<string, CounterfactualResult>()
    counterfactualResults.forEach((item) => {
      map.set(`${item.nodeId}_${item.limitPercent}`, item)
    })
    return map
  }, [counterfactualResults])

  const actionableNodeIds = useMemo(
    () => Array.from(new Set(counterfactualResults.map((item) => item.nodeId))).sort(),
    [counterfactualResults],
  )

  const selectedNode = graphData.nodes.find((n) => n.id === selectedNodeId) || null

  const handleNodeClick = (nodeId: string) => {
    setGraphUpdateMode('select')
    setSelectedNodeId(nodeId)
    if (!actionableNodeIds.includes(nodeId)) {
      const clickedNode = graphData.nodes.find((node) => node.id === nodeId)
      setSimulationResult(
        `结点 '${clickedNode?.label || nodeId}' 属于非关键节点，对其他结点的人流影响较小，当前无需进行推演操作。`,
      )
      return
    }

    if (simulationResult !== null) {
      setSimulationResult(null)
    }
  }

  const handleSimulationAction = (
    nodeId: string,
    actionType: 'LIMIT',
    limitPercent?: number,
  ) => {
    if (actionType !== 'LIMIT') return

    const limitText = limitPercent ?? 50
    const result = resultByKey.get(`${nodeId}_${limitText}`)

    if (!result) {
      setSimulationResult(`未找到结点 '${selectedNode?.label || nodeId}' 在 ${limitText}% 档位下的静态推演结果。`)
      setGraphData(initialGraphData)
      return
    }

    const nodeUpdateMap = new Map(result.nodeUpdates.map((item) => [item.nodeId, item]))
    const fallbackEdgeUpdates: Array<{
      source: string
      target: string
      style: CounterfactualEdgeUpdate['style'] | 'limited' | 'boosted'
    }> =
      result.edgeUpdates && result.edgeUpdates.length > 0
        ? result.edgeUpdates
        : initialGraphData.edges
            .filter((edge) => edge.source === nodeId || edge.target === nodeId)
            .map((edge) => ({
              source: edge.source,
              target: edge.target,
              style: deriveFallbackEdgeStyle(limitText),
            }))
    const edgeUpdateMap = new Map(
      fallbackEdgeUpdates.map((item) => [`${item.source}->${item.target}`, item]),
    )

    const nextGraphData: GraphData = {
      nodes: initialGraphData.nodes.map((node) => ({
        ...node,
        value: nodeUpdateMap.get(node.id)?.value ?? node.value,
        style: undefined,
      })),
      edges: initialGraphData.edges.map((edge) => ({
        ...edge,
        style: edgeUpdateMap.get(`${edge.source}->${edge.target}`)?.style,
      })),
    }

    setGraphUpdateMode('data')
    setGraphData(nextGraphData)
    setSimulationResult(buildImpactSummary(initialGraphData, result))
  }

  const handleReset = () => {
    setGraphUpdateMode('data')
    setGraphData(initialGraphData)
    setSelectedNodeId(null)
    setSimulationResult(defaultTip)
  }

  return (
    <div className="page-shell">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <Button onClick={handleReset}>重置沙盘</Button>
      </div>

      {dataError && (
        <Alert
          type="error"
          showIcon
          message="数据加载失败"
          description={dataError}
          style={{ marginBottom: 12 }}
        />
      )}

      <Row gutter={24}>
        <Col span={16}>
          <Card
            title="节点网络"
            className="panel-card"
            bordered={false}
            bodyStyle={{ padding: 0, height: '640px' }}
            style={{ height: '690px' }}
          >
            <SimulationGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              baselineNodes={initialGraphData.nodes}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeId || undefined}
              actionableNodeIds={actionableNodeIds}
              updateMode={graphUpdateMode}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <NodeControlPanel
            node={selectedNode}
            actionableNodeIds={actionableNodeIds}
            onAction={handleSimulationAction}
          />
          <ImpactAssessmentPanel result={simulationResult} />
        </Col>
      </Row>
    </div>
  )
}

export default SimulationPage
