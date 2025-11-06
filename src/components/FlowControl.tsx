/**
 * 人流量控制组件 - 支持输入和拖动调整
 */

import { useState, useEffect } from 'react'
import type { GraphNode } from '../types/chart'

interface FlowControlProps {
  node: GraphNode | null
  onValueChange?: (nodeId: string, newValue: number) => void
}

export function FlowControl({ node, onValueChange }: FlowControlProps) {
  const [value, setValue] = useState(node?.value || 0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (node) {
      setValue(node.value)
    }
  }, [node])

  if (!node) {
    return (
      <div
        style={{
          padding: '20px',
          textAlign: 'center',
          color: '#999',
        }}
      >
        请选择节点进行调整
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10) || 0
    setValue(newValue)
    onValueChange?.(node.id, newValue)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    setValue(newValue)
    onValueChange?.(node.id, newValue)
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const min = 0
  const max = 500

  return (
    <div
      style={{
        padding: '12px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <h3
        style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 'normal',
          color: '#333',
        }}
      >
        调整人流量: {node.label}
      </h3>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          输入数值 (0-500):
        </label>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '6px',
            fontSize: '12px',
            color: '#666',
          }}
        >
          拖动调整:
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#999', minWidth: '40px' }}>{min}</span>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            style={{
              flex: 1,
              height: '6px',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          />
          <span style={{ fontSize: '12px', color: '#999', minWidth: '40px' }}>{max}</span>
        </div>
        <div
          style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '14px',
            color: '#666',
            fontWeight: '500',
          }}
        >
          当前值: {value}
        </div>
      </div>

      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          fontSize: '11px',
          color: '#666',
        }}
      >
        <div>节点ID: {node.id}</div>
        <div style={{ marginTop: '4px' }}>当前人流量: {value}</div>
      </div>
    </div>
  )
}
