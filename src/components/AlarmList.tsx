// src/components/AlarmList.tsx
import { List, Tag, Typography } from 'antd'
import type { ReactNode } from 'react'
import { useThemeMode } from '../context/ThemeContext'

type AlarmLevel = 'warning' | 'danger'

const mockAlarms: { time: string; level: AlarmLevel; content: string }[] = [
  {
    time: '14:32:15',
    level: 'danger',
    content: 'A区入口拥堵指数超过阈值 90%',
  },
  {
    time: '14:31:50',
    level: 'warning',
    content: '北侧看台人流密度达到 80%',
  },
    {
    time: '14:29:05',
    level: 'warning',
    content: '餐饮区排队人数过多',
  },
];

const levelMap: Record<AlarmLevel, ReactNode> = {
  warning: <Tag color="warning">关注</Tag>,
  danger: <Tag color="error">危险</Tag>,
};

const AlarmList = () => {
  const { mode } = useThemeMode()
  const textColor = mode === 'dark' ? '#e8f4ff' : '#1f2d3d'
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <List
        itemLayout="horizontal"
        dataSource={mockAlarms}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '8px 0',
              borderBlock:
                mode === 'dark'
                  ? '1px solid rgba(255,255,255,0.04)'
                  : '1px solid rgba(31,45,61,0.06)',
            }}
          >
            <List.Item.Meta
              title={<span style={{ color: textColor }}>{levelMap[item.level]} {item.content}</span>}
              description={<Typography.Text type="secondary">{item.time}</Typography.Text>}
            />
          </List.Item>
        )}
      />
    </div>
  )
}

export default AlarmList;
