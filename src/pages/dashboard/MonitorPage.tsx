// src/pages/dashboard/MonitorPage.tsx
import { useState } from 'react'
import { Row, Col, Card } from 'antd'
import ForceDirectedGraph from '../../components/ForceDirectedGraph'
import NodeDetailPanel from '../../components/NodeDetailPanel'
import SankeyFlowChart from '../../components/SankeyFlowChart'
import {
  generateForceGraphData,
  generateSankeyData,
} from '../../utils/mockData'
import type { GraphNode } from '../../types/chart'
import { useDynamicData } from '../../hooks/useDynamicData'

const MonitorPage = () => {
  const graphData = useDynamicData(generateForceGraphData, 3000)
  const [sankeyData, setSankeyData] = useState(() => generateSankeyData())
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  const handleNodeClick = (nodeId: string) => {
    const node = graphData.nodes.find((n) => n.id === nodeId)
    setSelectedNode(node || null)
    // 根据选中节点更新桑基图数据
    setSankeyData(generateSankeyData(nodeId))
  }

  return (
    <div className="page-shell" style={{ height: '100%' }}>
      <Row gutter={[16, 16]} style={{ minHeight: 520 }}>
        <Col lg={17} xs={24} style={{ height: '100%' }}>
          <Card
            title="动态力导向拓扑图"
            className="panel-card"
            bordered={false}
            bodyStyle={{ padding: 0, height: 'calc(100% - 58px)' }}
            style={{ height: '100%' }}
          >
            <ForceDirectedGraph
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNode?.id}
            />
          </Card>
        </Col>
        <Col
          lg={7}
          xs={24}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%',
          }}
        >
          <NodeDetailPanel node={selectedNode} />
          <Card
            title="人群流向桑基图"
            className="panel-card"
            bordered={false}
            bodyStyle={{ padding: 0, flex: 1 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          >
            <SankeyFlowChart data={sankeyData} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default MonitorPage
