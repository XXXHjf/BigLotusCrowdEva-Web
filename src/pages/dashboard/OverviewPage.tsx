// src/pages/dashboard/OverviewPage.tsx
import { Row, Col, Card } from 'antd'
import CrowdDensityHeatmap from '../../components/CrowdDensityHeatmap'
import KpiCard from '../../components/KpiCard'
import AlarmList from '../../components/AlarmList'
import {
  UserOutlined,
  DashboardOutlined,
  LoginOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const OverviewPage = () => {
  return (
    <div className="page-shell">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <KpiCard
            icon={<UserOutlined />}
            title="场内总人数"
            value={10245}
            unit="人"
            trend="up"
            trendValue="5.2%"
          />
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <KpiCard
            icon={<DashboardOutlined />}
            title="拥堵指数"
            value={68}
            unit="%"
            trend="down"
            trendValue="1.5%"
          />
        </Col>
        <Col xs={24  } sm={12} md={12} lg={6}>
          <KpiCard
            icon={<LoginOutlined />}
            title="入场速率"
            value={120}
            unit="人/分"
          />
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <KpiCard
            icon={<LogoutOutlined />}
            title="出场速率"
            value={45}
            unit="人/分"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ flex: 1 }}>
        <Col lg={18} xs={24} style={{ height: '100%' }}>
          <Card
            title="分区拥堵热力矩阵"
            className="panel-card"
            bordered={false}
            style={{ height: '100%' }}
            bodyStyle={{ height: 'calc(100% - 58px)', padding: 0 }}
          >
            <CrowdDensityHeatmap />
          </Card>
        </Col>
        <Col lg={6} xs={24} style={{ height: '100%' }}>
          <Card
            title="实时报警"
            bordered={false}
            className="panel-card"
            style={{ height: '100%' }}
          >
            <AlarmList />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default OverviewPage
