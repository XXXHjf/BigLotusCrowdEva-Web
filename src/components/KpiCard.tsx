// src/components/KpiCard.tsx
import { Card, Statistic } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

interface KpiCardProps {
  icon: React.ReactNode
  title: string
  value: number | string
  precision?: number
  unit?: string
  trend?: 'up' | 'down' | null
  trendValue?: string
}

const KpiCard = ({
  icon,
  title,
  value,
  precision = 0,
  unit,
  trend,
  trendValue,
}: KpiCardProps) => {
  const trendIcon =
    trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />
  const trendColor = trend === 'up' ? '#3f8600' : '#cf1322'

  return (
    <Card bodyStyle={{ padding: '16px' }} className="panel-card kpi-card" bordered={false}>
      <Statistic
        title={title}
        value={value}
        precision={precision}
        prefix={icon}
        suffix={unit}
        valueStyle={{ fontSize: '24px' }}
      />
      <div className="kpi-meta" style={{ marginTop: '10px' }}>
        {trend ? (
          <>
            <span style={{ color: trendColor, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {trendIcon}
              {trendValue}
            </span>
            <span>较昨日</span>
          </>
        ) : (
          <span>实时刷新 · 30s</span>
        )}
      </div>
    </Card>
  )
}

export default KpiCard
