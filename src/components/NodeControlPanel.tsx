// src/components/NodeControlPanel.tsx
import { Card, Button, Space, Typography, Slider } from 'antd'
import type { GraphNode } from '../types/chart'
import { useState } from 'react'

interface NodeControlPanelProps {
  node: GraphNode | null
  actionableNodeIds?: string[]
  onAction: (nodeId: string, actionType: 'LIMIT', limitPercent?: number) => void
}

const limitMarks = {
  0: '0',
  50: '50',
  80: '80',
  120: '120',
  150: '150',
  200: '200',
}

const NodeControlPanel = ({ node, actionableNodeIds = [], onAction }: NodeControlPanelProps) => {
  const [limitPercent, setLimitPercent] = useState<number>(80)
  const isActionable = node ? actionableNodeIds.includes(node.id) : false

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
      <Typography.Text type={isActionable ? undefined : 'secondary'}>
        {isActionable
          ? '选择一项操作来模拟其对网络的影响。'
          : '该节点当前没有对应的静态推演结果，不能执行限流操作。'}
      </Typography.Text>
      <div style={{ marginTop: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            type="primary"
            disabled={!isActionable}
            danger={limitPercent === 0}
            onClick={() => onAction(node.id, 'LIMIT', limitPercent)}
          >
            {limitPercent === 0 ? '关闭通道' : '应用限流'}
          </Button>
          <div>
            <Typography.Text type={isActionable ? undefined : 'secondary'}>限流比例</Typography.Text>
            <Slider
              min={0}
              max={200}
              step={null}
              disabled={!isActionable}
              value={limitPercent}
              onChange={(val) => setLimitPercent(val as number)}
              marks={limitMarks}
              tooltip={{
                formatter: (v) => (v === 0 ? '关闭通道' : `${v}%`),
              }}
            />
          </div>
        </Space>
      </div>
    </Card>
  )
}

export default NodeControlPanel
