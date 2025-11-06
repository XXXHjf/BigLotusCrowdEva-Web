/**
 * 主应用组件
 */

import { useState, useEffect } from 'react'
import { HeatmapChart } from './components/HeatmapChart'
import { ComparisonLineChart } from './components/ComparisonLineChart'
import { GraphChart } from './components/GraphChart'
import { SubGraphChart } from './components/SubGraphChart'
import { FlowControl } from './components/FlowControl'
import {
  generateZones,
  generateHeatmapData,
  generateModelPredictions,
  generateGraphData,
  getAdjacentNodes,
} from './utils/mockData'
import type { Zone, GraphNode, GraphEdge, ModelPrediction } from './types/chart'
import { formatDate } from './utils/date'
import { DATE_FORMATS } from './constants'
import './App.css'

function App() {
  // 基础数据
  const [zones] = useState<Zone[]>(generateZones())
  const [times] = useState<string[]>(() => {
    const now = new Date()
    const times: string[] = []
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      times.push(formatDate(time, DATE_FORMATS.TIMESTAMP))
    }
    return times
  })

  // 图表数据
  const [heatmapData, setHeatmapData] = useState(generateHeatmapData(zones, times))
  const [graphData, setGraphData] = useState(generateGraphData(zones))

  // 选中状态 - 设置默认选中值
  const [selectedZone, setSelectedZone] = useState<string | null>(zones[0]?.id || null)
  const [selectedNode, setSelectedNode] = useState<string | null>(graphData.nodes[0]?.id || null)
  const [modelPredictions, setModelPredictions] = useState<ModelPrediction[]>([])
  const [subGraphData, setSubGraphData] = useState<{
    nodes: GraphNode[]
    edges: GraphEdge[]
  } | null>(null)

  // 初始化默认数据
  useEffect(() => {
    if (selectedZone) {
      const predictions = generateModelPredictions(selectedZone, times)
      setModelPredictions(predictions)
    }
    if (selectedNode) {
      const adjacent = getAdjacentNodes(selectedNode, graphData.nodes, graphData.edges)
      setSubGraphData(adjacent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时执行一次

  // 处理区块点击
  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(zoneId)
    const predictions = generateModelPredictions(zoneId, times)
    setModelPredictions(predictions)
  }

  // 处理关系图节点点击
  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    const adjacent = getAdjacentNodes(nodeId, graphData.nodes, graphData.edges)
    setSubGraphData(adjacent)
  }

  // 处理人流量变化
  const handleFlowChange = (nodeId: string, newValue: number) => {
    // 更新关系图中的节点值
    const updatedNodes = graphData.nodes.map((node) =>
      node.id === nodeId ? { ...node, value: newValue } : node,
    )

    // 更新子图中的节点值
    if (subGraphData) {
      const updatedSubNodes = subGraphData.nodes.map((node) =>
        node.id === nodeId ? { ...node, value: newValue } : node,
      )
      setSubGraphData({ ...subGraphData, nodes: updatedSubNodes })
    }

    // 更新热力图数据（简化处理，实际应该重新计算）
    const zone = zones.find((z) => z.id === nodeId)
    if (zone) {
      const updatedHeatmap = heatmapData.map((item) =>
        item.zone === nodeId
          ? {
              ...item,
              value: Math.round(newValue * (0.8 + Math.random() * 0.4)),
            }
          : item,
      )
      setHeatmapData(updatedHeatmap)
    }

    setGraphData({ ...graphData, nodes: updatedNodes })
  }

  // 获取当前选中的节点
  const selectedNodeData = graphData.nodes.find((n) => n.id === selectedNode) || null

  // 获取当前选中区块的标签
  const selectedZoneLabel = zones.find((z) => z.id === selectedZone)?.label

  return (
    <div className="app-container">
      <main className="app-main">
        <div className="chart-grid">
          {/* 热力图：左上 */}
          <div className="chart-card chart-heatmap">
            <HeatmapChart
              data={heatmapData}
              zones={zones}
              times={times}
              onZoneClick={handleZoneClick}
              selectedZone={selectedZone || undefined}
            />
          </div>

          {/* 折线图：右上 */}
          <div className="chart-card chart-line">
            <ComparisonLineChart predictions={modelPredictions} zoneLabel={selectedZoneLabel} />
          </div>

          {/* 关系图：左下 */}
          <div className="chart-card chart-graph">
            <GraphChart
              nodes={graphData.nodes}
              edges={graphData.edges}
              onNodeClick={handleNodeClick}
              selectedNode={selectedNode || undefined}
            />
          </div>

          {/* 子图：右下 */}
          <div className="chart-card chart-subgraph">
            {subGraphData && selectedNode ? (
              <SubGraphChart
                nodes={subGraphData.nodes}
                edges={subGraphData.edges}
                centerNodeId={selectedNode}
                centerNodeLabel={graphData.nodes.find((n) => n.id === selectedNode)?.label}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#999',
                }}
              >
                请点击关系图选择节点查看子图
              </div>
            )}
          </div>

          {/* 控制面板：右侧 */}
          <div className="chart-card chart-control">
            <FlowControl node={selectedNodeData} onValueChange={handleFlowChange} />
            <div className="system-title">
              <div className="system-title-main">体育馆人群走势预测可视化系统</div>
              <div className="system-title-sub">学术科研数据可视化平台</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
