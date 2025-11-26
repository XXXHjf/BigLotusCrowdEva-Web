// src/components/NodeControlPanel.tsx
import { Card, Button, Space, Typography, Slider } from 'antd'
import type { GraphNode } from '../types/chart'
import { useState } from 'react'

interface NodeControlPanelProps {
  node: GraphNode | null
  onAction: (nodeId: string, actionType: 'CLOSE' | 'LIMIT', limitPercent?: number) => void
}

const NodeControlPanel = ({ node, onAction }: NodeControlPanelProps) => {
  const [limitPercent, setLimitPercent] = useState(100)

  if (!node) {
    return (
      <Card title="操作面板" className="panel-card" bordered={false}>
        <Typography.Text type="secondary">
          请在左侧图中选择一个节点进行操作。
        </Typography.Text>
      </Card>
    )
  }

  return (
    <Card title={`操作节点: ${node.label}`} className="panel-card" bordered={false}>
      <Typography.Text>
        选择一项操作来模拟其对网络的影响。
      </Typography.Text>
      <div style={{ marginTop: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            danger
            block
            onClick={() => onAction(node.id, 'CLOSE')}
          >
            [关闭] 通道
          </Button>
          <div>
            <Typography.Text>限流比例 (50% - 200%)</Typography.Text>
            <Slider
              min={50}
              max={200}
              value={limitPercent}
              onChange={(val) => setLimitPercent(val)}
              marks={{ 50: '50%', 100: '100%', 150: '150%', 200: '200%' }}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
            <Button block onClick={() => onAction(node.id, 'LIMIT', limitPercent)}>
              应用限流
            </Button>
          </div>
        </Space>
      </div>
    </Card>
  )
}

export default NodeControlPanel
