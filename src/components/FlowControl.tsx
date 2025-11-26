/**
 * 人流量控制组件 - 使用 Ant Design 组件
 */
import { useState, useEffect } from 'react'
import { InputNumber, Slider, Row, Col, Typography } from 'antd'
import type { GraphNode } from '../types/chart'

interface FlowControlProps {
  node: GraphNode | null
  onValueChange?: (nodeId: string, newValue: number) => void
}

export function FlowControl({ node, onValueChange }: FlowControlProps) {
  const [value, setValue] = useState(node?.value || 0)

  useEffect(() => {
    if (node) {
      setValue(node.value)
    }
  }, [node])

  if (!node) {
    return <div className="chart-placeholder">请选择节点进行调整</div>
  }

  const handleValueChange = (newValue: number | null) => {
    if (newValue === null) return
    setValue(newValue)
    onValueChange?.(node.id, newValue)
  }

  const min = 0
  const max = 500

  return (
    <div style={{ padding: '0 8px' }}>
      <Typography.Text style={{ marginBottom: '12px', display: 'block' }}>
        调整节点: <Typography.Text strong>{node.label}</Typography.Text>
      </Typography.Text>
      <Row align="middle" gutter={16}>
        <Col span={16}>
          <Slider
            min={min}
            max={max}
            onChange={handleValueChange}
            value={typeof value === 'number' ? value : 0}
          />
        </Col>
        <Col span={8}>
          <InputNumber
            min={min}
            max={max}
            style={{ width: '100%' }}
            value={value}
            onChange={handleValueChange}
          />
        </Col>
      </Row>
    </div>
  )
}
