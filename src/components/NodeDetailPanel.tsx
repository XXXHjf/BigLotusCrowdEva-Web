// src/components/NodeDetailPanel.tsx
import { Card, Descriptions, Typography, Tag } from 'antd'
import { CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { GraphNode } from '../types/chart'

interface NodeDetailPanelProps {
  node: GraphNode | null
}

const NodeDetailPanel = ({ node }: NodeDetailPanelProps) => {
  if (!node) {
    return (
      <Card title="节点详情" className="panel-card" bordered={false}>
        <Typography.Text type="secondary">
          请在左侧拓扑图中选择一个聚类节点查看详情。
        </Typography.Text>
      </Card>
    )
  }

  const getStatusTag = (level: string | undefined) => {
    switch (level) {
      case 'safe':
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            安全
          </Tag>
        )
      case 'warning':
        return (
          <Tag icon={<WarningOutlined />} color="warning">
            预警
          </Tag>
        )
      case 'danger':
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            危险
          </Tag>
        )
      default:
        return <Tag>未知</Tag>
    }
  }

  return (
    <Card
      title="节点详情"
      className="panel-card"
      bordered={false}
      style={{ minHeight: '200px' }}
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="聚类ID">{node.id}</Descriptions.Item>
        <Descriptions.Item label="名称">{node.label}</Descriptions.Item>
        <Descriptions.Item label="当前人数">{node.value} 人</Descriptions.Item>
        <Descriptions.Item label="拥堵等级">{getStatusTag(node.level)}</Descriptions.Item>
        <Descriptions.Item label="男女比例">
          {Math.floor(Math.random() * 60) + 40}% 男 /{' '}
          {Math.floor(Math.random() * 40) + 20}% 女
        </Descriptions.Item>
        <Descriptions.Item label="平均停留时间">
          {(Math.random() * 30 + 5).toFixed(0)} 分钟
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}

export default NodeDetailPanel
