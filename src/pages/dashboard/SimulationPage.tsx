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

  const selectedNode = graphData.nodes.find((n) => n.id === selectedNodeId) || null

  const handleNodeClick = (nodeId: string) => {
    setGraphUpdateMode('select')
    setSelectedNodeId(nodeId)
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
    const edgeUpdateMap = new Map(
      (result.edgeUpdates || []).map((item) => [`${item.source}->${item.target}`, item]),
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
    setSimulationResult(result.summary)
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
              updateMode={graphUpdateMode}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <NodeControlPanel node={selectedNode} onAction={handleSimulationAction} />
          <ImpactAssessmentPanel result={simulationResult} />
        </Col>
      </Row>
    </div>
  )
}

export default SimulationPage
