// src/pages/dashboard/SimulationPage.tsx
import { useState } from 'react'
import { Row, Col, Button, Card } from 'antd'
import { SimulationGraph } from '../../components/SimulationGraph'
import NodeControlPanel from '../../components/NodeControlPanel'
import ImpactAssessmentPanel from '../../components/ImpactAssessmentPanel'
import { generateGraphData, generateZones } from '../../utils/mockData'

// 简单的下游节点查找逻辑
const getDownstreamNodeIds = (startNodeId: string, edges: any[]): string[] => {
    const downstreamNodes = new Set<string>();
    const nodesToVisit = [startNodeId];

    while(nodesToVisit.length > 0) {
        const currentNodeId = nodesToVisit.pop()!;
        edges.forEach(edge => {
            if(edge.source === currentNodeId && !downstreamNodes.has(edge.target)) {
                downstreamNodes.add(edge.target);
                nodesToVisit.push(edge.target);
            }
        });
    }
    return Array.from(downstreamNodes);
}


const SimulationPage = () => {
  const initialGraphData = generateGraphData(generateZones())
  const [graphData, setGraphData] = useState(initialGraphData)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const defaultTip = '选择左侧节点并执行操作后，这里会显示推演影响评估。'
  const [simulationResult, setSimulationResult] = useState<string | null>(defaultTip)

  const selectedNode =
    graphData.nodes.find((n) => n.id === selectedNodeId) || null

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    // 重置评估结果
    setSimulationResult(null) 
  }

  const handleSimulationAction = (
    nodeId: string,
    actionType: 'CLOSE' | 'LIMIT',
    limitPercent?: number,
  ) => {
    const newGraphData = JSON.parse(JSON.stringify(graphData)) // 深拷贝
    const downstreamIds = getDownstreamNodeIds(nodeId, newGraphData.edges);

    let impactMessage = '';

    if (actionType === 'CLOSE') {
      // 改变所有下游连接线的样式
      newGraphData.edges.forEach((edge: any) => {
        if (edge.source === nodeId) {
          edge.style = 'dashed'
        }
      })
      impactMessage = `关闭 '${selectedNode?.label}' 将导致其下游 ${downstreamIds.length} 个节点的人流中断，可能引发上游区域拥堵风险。`
    }

    if (actionType === 'LIMIT') {
      // 改变下游节点的样式
      newGraphData.nodes.forEach((node: any) => {
        if (downstreamIds.includes(node.id)) {
          node.style = 'dashed'
        }
      })
      const limitText = limitPercent ?? 50
      impactMessage = `对 '${selectedNode?.label}' 限流至 ${limitText}% 将降低下游区域 ${downstreamIds.length} 个节点的人流通过率，预计排队时间增加约 5-8 分钟。`
    }
    
    setGraphData(newGraphData)
    setSimulationResult(impactMessage)
  }

  const handleReset = () => {
    setGraphData(initialGraphData);
    setSelectedNodeId(null);
    setSimulationResult(defaultTip);
  }


  return (
    <div className="page-shell">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <Button onClick={handleReset}>重置沙盘</Button>
      </div>

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
              onNodeClick={handleNodeClick}
              selectedNodeId={selectedNodeId || undefined}
            />
          </Card>
        </Col>
        <Col span={8} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <NodeControlPanel node={selectedNode} onAction={handleSimulationAction} />
          <ImpactAssessmentPanel result={simulationResult} />
        </Col>
      </Row>
    </div>
  )
}

export default SimulationPage
